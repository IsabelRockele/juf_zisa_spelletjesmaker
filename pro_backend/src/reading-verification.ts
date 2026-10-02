import {ReadingEnvironment,readingCollections} from './reading-environment';
import { Auth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';

/** Verification is the only reading action that accepts an unverified identity.
 * Recipient comes exclusively from Auth, never the request or test mail rerouting.
 */
export async function queueReadingVerification(auth: Auth, db: Firestore, authorization: string, env: NodeJS.ProcessEnv, now=Date.now(),mode:ReadingEnvironment='test') {
  if (!/^Bearer [^\s]+$/.test(authorization||'')) throw new Error('Aanmelden vereist');
  const claims=await auth.verifyIdToken(authorization.slice(7),true);
  if(claims.aud!=='zisa-spelletjesmaker-pro'||claims.iss!=='https://securetoken.google.com/zisa-spelletjesmaker-pro'||!claims.uid||claims.firebase?.sign_in_provider==='anonymous') throw new Error('Aanmelden vereist');
  const user=await auth.getUser(claims.uid);
  const prefix=mode==='test'?'READING_TEST_':'READING_LIVE_';
  const emails=(env[prefix+'EMAILS']||'').split(',').map(v=>v.trim().toLowerCase());
  const uids=(env[prefix+'UIDS']||'').split(',').map(v=>v.trim());
  if(user.disabled||!user.email||((mode==='test'||env.READING_LIVE_SALES_OPEN!=='true')&&!emails.includes(user.email.toLowerCase())&&!uids.includes(user.uid))) throw new Error('Deze proef is alleen beschikbaar voor de ingestelde testaccounts.');
  if(user.emailVerified)return {alreadyVerified:true};
  if(env[prefix+'MAIL_ENABLED']!=='true')throw new Error('Deze maildienst is tijdelijk niet beschikbaar.');
  const state=db.collection(readingCollections(mode).verification).doc(user.uid);
  await db.runTransaction(async tx=>{
    const old=(await tx.get(state)).data()||{};
    const sameHour=old.hour===Math.floor(now/3600000);
    if(old.requestedAt&&now-old.requestedAt<60000)throw new Error('Even wachten: je kunt na één minuut opnieuw een bevestigingsmail aanvragen.');
    if(sameHour&&old.count>=5)throw new Error('Even wachten: je hebt meerdere mails aangevraagd. Probeer het over een uur opnieuw.');
    tx.set(state,{requestedAt:now,hour:Math.floor(now/3600000),count:sameHour?old.count+1:1},{merge:true});
  });
  const url=await auth.generateEmailVerificationLink(user.email,{url:'https://tools.jufzisa.be/lezen/mijn-account.html'+(mode==='test'?'?test=1':''),handleCodeInApp:false});
  const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const mail=db.collection('post_msft').doc();
  const batch=db.batch();
  batch.create(mail,{to:[user.email],message:{subject:'Bevestig je e-mailadres voor Zisa Lezen',text:`Welkom bij Zisa Lezen. Bevestig je e-mailadres via deze veilige link: ${url}\n\nKeer daarna terug naar Zisa Lezen en klik op Ik heb bevestigd. Heb je geen account aangevraagd? Dan kun je deze mail negeren.`,html:`<h1>Welkom bij Zisa Lezen</h1><p>Bevestig je e-mailadres om verder te gaan met je account.</p><p><a href="${escape(url)}" style="display:inline-block;padding:14px 20px;background:#ed1764;color:white;text-decoration:none;border-radius:10px">Bevestig mijn e-mailadres</a></p><p>Keer daarna terug naar Zisa Lezen en klik op <strong>Ik heb bevestigd</strong>.</p><p>Heb je geen account aangevraagd? Dan kun je deze mail negeren.</p>`},readingTest:mode==='test',readingVerification:true});
  batch.set(state,{mailId:mail.id,queuedAt:now},{merge:true});
  await batch.commit();
  return {queued:true}; // Provider delivery is recorded on post_msft; queued is not delivered.
}
