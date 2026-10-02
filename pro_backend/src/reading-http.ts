import {readingCollections,ReadingEnvironment} from './reading-environment';
import {validReadingInvoicePath} from './reading-invoice';
import { readingAdmin, requireReadingAdmin } from './reading-admin';
import { queueReadingVerification } from './reading-verification';
import { readingPaidUntil } from './reading-ledger';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readingAuthenticator } from './reading-security';
import { createReadingService } from './reading-service';
import { readingInvoiceStore, ReadingSeller } from './reading-invoice-store';
import { readFile } from 'fs/promises';
import { join } from 'path';


const origins=new Set(['https://tools.jufzisa.be','https://isabelrockele.github.io','http://127.0.0.1:8883','http://localhost:8883']);
/** Mode is fixed by the deployed function, never by a browser parameter. */
export function createReadingFunctions(hasPro:(uid:string)=>Promise<boolean>,seller:ReadingSeller,mode:ReadingEnvironment='test') {
  const collections=readingCollections(mode),isTest=mode==='test';
  const paymentKey=defineSecret(isTest?'MOLLIE_READING_TEST_KEY':'MOLLIE_READING_LIVE_KEY');
  const setting=(name:string)=>process.env[(isTest?'READING_TEST_':'READING_LIVE_')+name];
  const enabled=()=>setting('ENABLED')==='true';
  const returnUrl=()=>isTest?process.env.READING_RETURN_URL:setting('RETURN_URL');
  const pilotAllowed=(uid:string,email:string)=>{const uids=(setting('UIDS')||'').split(',').map(v=>v.trim());const emails=(setting('EMAILS')||'').split(',').map(v=>v.trim().toLowerCase());return uids.includes(uid)||emails.includes(email.toLowerCase());};
  const service=()=>{
    if(!enabled())throw new Error('De leesabonnementen zijn nog niet geactiveerd.');
    const redirectUrl=returnUrl(),webhookUrl=isTest?process.env.READING_WEBHOOK_URL:setting('WEBHOOK_URL'),profileId=isTest?process.env.READING_MOLLIE_PROFILE_ID:setting('MOLLIE_PROFILE_ID');
    if(!redirectUrl || !webhookUrl || !profileId)throw new Error('Reading endpoints and Mollie profile are not configured');
    if(!isTest&&(new URL(redirectUrl).origin!=='https://tools.jufzisa.be'||new URL(redirectUrl).searchParams.has('test')||!webhookUrl.endsWith('/readingLiveMollieWebhook')))throw new Error('Invalid live reading endpoints');
    return createReadingService(getFirestore(),{mode,apiKey:paymentKey.value().trim(),redirectUrl,webhookUrl,profileId},{hasPro,invoice:readingInvoiceStore(getFirestore(),getStorage().bucket(),seller,mode)});
  };
  const readingApi=onRequest({region:'europe-west1',maxInstances:3,secrets:[paymentKey],invoker:'public'},async(req,res)=>{
    res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');
    const origin=req.get('Origin');
    if(origin && !origins.has(origin)){res.status(403).json({error:'Onbekende website.'});return;}
    if(origin)res.set('Access-Control-Allow-Origin',origin);
    res.set('Vary','Origin');res.set('Access-Control-Allow-Headers','Authorization, Content-Type, X-Reading-Token');res.set('Access-Control-Allow-Methods','POST, OPTIONS');
    if(req.method==='OPTIONS'){res.status(204).end();return;}
    if(req.method!=='POST'){res.status(405).end();return;}
    if(!enabled()){res.status(503).json({error:'De leesabonnementen zijn nog niet geactiveerd.'});return;}
    if(Number(req.get('content-length')||0)>16384){res.status(413).end();return;}
    const action=String(req.path).split('/').filter(Boolean).pop();
    try {
      if(action==='verify-email'){
        res.json(await queueReadingVerification(getAuth(),getFirestore(),req.get('Authorization')||'',process.env,Date.now(),mode));return;
      }
      const api=service();
      const studentToken=req.get('X-Reading-Token');
      if(studentToken){
        if(action!=='catalog'){res.status(403).json({error:'Deze link geeft alleen leestoegang.'});return;}
        await api.student(studentToken);
        res.type('application/javascript').send(await readFile(join(__dirname,'reading-content.js'),'utf8'));return;
      }
      const owner=await readingAuthenticator('zisa-spelletjesmaker-pro',getAuth() as any)(req.get('Authorization')||'');
      const testers=new Set((process.env.READING_TEST_UIDS||'').split(',').map(v=>v.trim()).filter(Boolean));
      const user=await getAuth().getUser(owner.uid);
      const testEmails=new Set((process.env.READING_TEST_EMAILS||'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));
      const emailAllowed=user.emailVerified===true&&testEmails.has((user.email||'').toLowerCase());
      if(user.disabled||(isTest&&!testers.has(owner.uid)&&!emailAllowed)){res.status(403).json({error:'Deze proef is alleen beschikbaar voor de ingestelde testaccounts.'});return;}
      // A small per-account request budget protects checkout/link mutations.
      const rate=getFirestore().collection(collections.rateLimits).doc(owner.uid);
      await getFirestore().runTransaction(async tx=>{
        const snap=await tx.get(rate);const minute=Math.floor(Date.now()/60000);const count=snap.data()?.minute===minute?snap.data()!.count:0;
        if(count>=40)throw new Error('Even wachten en opnieuw proberen.');tx.set(rate,{minute,count:count+1});
      });
      if(action?.startsWith('admin-')){
        requireReadingAdmin(user,process.env.READING_ADMIN_UIDS||'');
        if(action==='admin-status'){res.json({allowed:true});return;}
        const admin=readingAdmin(getFirestore(),getAuth(),api,mode);
        if(action==='admin-find'){res.json(await admin.find(req.body?.email));return;}
        if(action==='admin-cancel'){res.json(await admin.cancel(owner.uid,req.body));return;}
        res.status(404).json({error:'Onbekende beheeractie.'});return;
      }
      if(action==='account'){res.json({...await api.status(owner.uid),checkoutAvailable:isTest||setting('SALES_OPEN')==='true'||pilotAllowed(owner.uid,user.email||'')});return;}
      if(action==='checkout'){
        if(!isTest&&setting('SALES_OPEN')!=='true'&&!pilotAllowed(owner.uid,user.email||'')){res.status(403).json({error:'De verkoop van Zisa Lezen wordt nog voorbereid.'});return;}
        res.json(await api.checkout({uid:owner.uid,email:user.email!},req.body));return;}
      if(action==='school-invite'){res.json(await api.invite(owner.uid,req.body?.index,req.body?.email,false,req.body?.resend===true));return;}
      if(action==='school-remove'){res.json(await api.invite(owner.uid,req.body?.index,'',true));return;}
      if(action==='school-accept'){res.json(await api.accept({uid:owner.uid,email:user.email!},req.body?.token));return;}
      if(action==='cancel'){res.json(await api.cancel(owner.uid));return;}
      if(action==='link'){res.json(await api.link(owner.uid));return;}
      if(action==='catalog'){
        if(!(await api.status(owner.uid)).allowed){res.status(403).json({error:'Geen actieve leestoegang.'});return;}
        res.type('application/javascript').send(await readFile(join(__dirname,'reading-content.js'),'utf8'));return;
      }
      if(action==='invoice'){
        const id=String(req.body?.id||'');if(!new RegExp(`^reading-${mode}-tr_[A-Za-z0-9]+$`).test(id))throw new Error('Onbekende factuur.');
        const snap=await getFirestore().collection(collections.invoices).doc(id).get();const data=snap.data();
        if(!data?.ready || data.ownerKey!==`${owner.project}:${encodeURIComponent(owner.uid)}`){res.status(403).json({error:'Geen toegang tot deze factuur.'});return;}
        const [bytes]=await getStorage().bucket().file(data.path).download();
        res.set('Content-Disposition',`attachment; filename="factuur-zisa-lezen-${data.number}.pdf"`).type('application/pdf').send(bytes);return;
      }
      res.status(404).json({error:'Onbekende actie.'});
    }catch(error){
      // Never log credentials, tokens, payloads or provider response bodies.
      const message=String((error as Error).message||'');
      const safe=/^(Vul |Bevestig |Je hebt |Zisa Lezen is |Geen |Deze |Dit |Even wachten|Betaling wordt|Meld |Aanmelden)/.test(message);
      res.status(safe?400:503).json({error:safe?message:'De aanvraag kon niet worden voltooid. Probeer later opnieuw.'});
    }
  });
  const readingMollieWebhook=onRequest({region:'europe-west1',maxInstances:3,secrets:[paymentKey],invoker:'public'},async(req,res)=>{
    if(req.method!=='POST'){res.status(405).end();return;}
    if(!enabled()){res.status(503).end();return;}
    const id=req.body?.id;
    if(typeof id!=='string'||!/^tr_[A-Za-z0-9]+$/.test(id)){res.status(400).end();return;}
    try{await service().payment(id);res.status(200).send('OK');}catch{res.status(503).send('Retry later');}
  });
  const readingReconcile=onSchedule({schedule:'every 30 minutes',region:'europe-west1',secrets:[paymentKey],maxInstances:1},async()=>{
    if(!enabled())return;
    const db=getFirestore(),collection=db.collection(collections.orders);
    const state=db.doc(collections.maintenance+'/reconcile'),cursor=(await state.get()).data()?.cursor;
    let query=collection.orderBy('__name__').limit(40);if(cursor)query=query.startAfter(cursor);
    const batch=await query.get();const api=service();
    for(const order of batch.docs){
      try{await api.reconcile(order.id);await order.ref.set({needsReview:false},{merge:true});}
      catch{await order.ref.set({needsReview:true},{merge:true});}
    }
    await state.set({cursor:batch.size===40?batch.docs[batch.size-1].id:null});
  });
  async function deliverReadingMail(jobs:any[]) {
    // Only test mail is rerouted. Live recipients come from server-owned outbox records.
    if(!enabled() || setting('MAIL_ENABLED')!=='true')return;
    const testRecipient=process.env.READING_TEST_RECIPIENT||'';
    if(isTest&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipient))throw new Error('Explicit test mail recipient required');
    const db=getFirestore();
    for(const job of jobs){
      const data=job.data();
      const recipient=isTest?testRecipient:data.to;
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient||''))throw new Error('Invalid customer mail recipient');
      if(data.sent)continue;
      if(job.id.endsWith(':bookkeeping')){await job.ref.update({sent:true,skipped:true,reason:'seller_copy_disabled'});continue;}
      let html:string|undefined;
      let text='Je automatische verlenging voor Zisa Lezen is gestopt.';
      const attachments:any[]=[];
      if(data.kind==='invitation'){
        const inv=(await db.collection(collections.invitations).doc(data.invitationHash).get()).data();
        const order=inv?(await db.collection(collections.orders).doc(inv.orderId).get()).data():null;
        const seat=order?.seats?.[String(inv?.index)];
        if(!inv || inv.acceptedUid || inv.expiresAt<=Date.now() || !order || !seat || seat.version!==inv.version || seat.state!=='invited' || readingPaidUntil(order as any,Date.now())<=Date.now()){
          await job.ref.update({sent:true,skipped:true,reason:'invitation_inactive'});continue;
        }
        const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
        html=`<h1>Je school nodigt je uit voor Zisa Lezen</h1><p>Meld je aan of maak een account met <strong>${escape(data.to)}</strong>. Je school betaalt je leerkrachtplaats.</p><p><a href="${escape(data.url)}" style="display:inline-block;padding:14px 20px;background:#ed1764;color:white;text-decoration:none;border-radius:10px">Activeer mijn toegang tot Zisa Lezen</a></p><p>De uitnodiging is 14 dagen geldig. ${isTest?'Dit is een testuitnodiging.':''}</p>`;
        text=`Je school heeft een leerkrachtplaats bij Zisa Lezen voor je voorzien. Maak een account of meld je aan met ${data.to}. Je hoeft zelf niets te betalen. Activeer je toegang via ${data.url} . De uitnodiging is 14 dagen geldig. ${isTest?'Dit is een testuitnodiging.':''}`;
      }else if(data.kind==='invoice'){
        if(!validReadingInvoicePath(data.invoicePath,mode))throw new Error('Invalid test invoice path');
        const [pdf]=await getStorage().bucket().file(data.invoicePath).download();
        attachments.push({filename:`factuur-zisa-lezen-${data.invoiceNumber}.pdf`,content:pdf.toString('base64'),encoding:'base64',contentType:'application/pdf'});
        const accountUrl=returnUrl()||'';
        const instructions='Bewaar deze mail. Meld je aan met het account waarmee je de bestelling plaatste. In Mijn account kun je je facturen downloaden en de automatische verlenging opzeggen. Bestelde je voor een school? Dan beheer je daar ook de leerkrachtplaatsen en uitnodigingen. Alleen de aankoper kan het schoolabonnement opzeggen. De betaalde toegang blijft na opzegging geldig tot het einde van de betaalde periode.';
        text=`Bedankt voor je ${isTest?'testbetaling':'betaling'} voor Zisa Lezen. Je ${isTest?'testfactuur':'factuur'} ${data.invoiceNumber} zit in de bijlage. ${isTest?'Dit is geen echte factuur.':''}\n\n${instructions}\n\nOpen Mijn account: ${accountUrl}`;
        const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
        html=`<h1>Je Zisa Lezen-account</h1><p>Bedankt voor je ${isTest?'testbetaling':'betaling'}. Je ${isTest?'testfactuur':'factuur'} ${escape(data.invoiceNumber)} zit in de bijlage. ${isTest?'Dit is geen echte factuur.':''}</p><p>${escape(instructions)}</p><p><a href="${escape(accountUrl)}" style="display:inline-block;padding:14px 20px;background:#ed1764;color:white;text-decoration:none;border-radius:10px">Mijn account beheren</a></p>`;
        if(data.peppolInstructions)text+='\n\n'+data.peppolInstructions;
      }else if(data.kind==='renewal-failed'){
        const order=(await db.collection(collections.orders).doc(data.orderId).get()).data();
        const entry=order?.entries?.[data.paymentId];
        if(!entry?.failed||entry.paid||Object.values(order?.entries||{}).some((e:any)=>e.paid&&!e.reversed&&e.period.start===entry.period.start)){await job.ref.update({sent:true,skipped:true,reason:'payment_recovered'});continue;}
        const until=readingPaidUntil(order as any,Date.now());
        text='De maandelijkse betaling voor Zisa Lezen is niet gelukt. '+(until>Date.now()?`Je al betaalde toegang blijft geldig tot ${new Date(until).toLocaleDateString('nl-BE')}.`:'Je betaalde leesperiode is afgelopen; de leestoegang en klas-QR zijn tijdelijk niet actief.')+' Bekijk je abonnement via '+returnUrl()+'. Neem contact op met '+seller.email+' als je hulp nodig hebt. Start geen tweede abonnement zolang deze betaling wordt nagekeken.';
      }else if(data.kind!=='cancellation'){throw new Error('Unknown reading mail kind');
      }else if(data.paidUntil){text+=` Je betaalde toegang blijft geldig tot ${new Date(data.paidUntil).toLocaleDateString('nl-BE',{timeZone:'Europe/Brussels'})}.`;}
      const mail=db.collection('post_msft').doc(`reading-${mode}-${job.id}`);
      await db.runTransaction(async tx=>{
        const exists=await tx.get(mail);
        if(!exists.exists)tx.create(mail,{to:[recipient],message:{subject:data.subject||(isTest?'TEST — ':'')+'Zisa Lezen — opzegging',text,...(html?{html}:{}),attachments},readingTest:isTest});
        tx.update(job.ref,{sent:true,queuedAt:Date.now()}); // queued, not proof of delivery
      });
    }
  }
  const readingMail=onSchedule({schedule:'every 30 minutes',region:'europe-west1',maxInstances:1},async()=>{
    if(!enabled() || setting('MAIL_ENABLED')!=='true')return;
    const jobs=await getFirestore().collection(collections.outbox).where('sent','==',false).limit(25).get();
    await deliverReadingMail(jobs.docs);
  });
  const readingMailCreated=onDocumentCreated({document:collections.outbox+'/{jobId}',region:'europe-west1',maxInstances:3,retry:true},async event=>{
    if(event.data)await deliverReadingMail([event.data]);
  });
  return {readingApi,readingMollieWebhook,readingReconcile,readingMail,readingMailCreated};
}
