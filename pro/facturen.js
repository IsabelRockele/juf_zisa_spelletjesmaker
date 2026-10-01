import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, sendEmailVerification, reload, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
const app = getApps().length ? getApp() : initializeApp({apiKey:'AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw',authDomain:'zisa-spelletjesmaker-pro.firebaseapp.com',projectId:'zisa-spelletjesmaker-pro',appId:'1:828063957776:web:8d8686b478846fe980db95'});
const auth=getAuth(app);auth.languageCode='nl';
const el=id=>document.getElementById(id), show=(id,on)=>{el(id).hidden=!on;};
const message=text=>{el('status').textContent=text;show('status',!!text);};
let revision=0;
const errorText=error=>error.name==='TypeError'?'De verbinding is onderbroken. Probeer opnieuw.':error.message||'Probeer opnieuw.';
async function api(body){
  if(!auth.currentUser)throw Error('Meld je aan om je facturen te openen.');
  const token=await auth.currentUser.getIdToken(true);
  const response=await fetch('https://europe-west1-zisa-spelletjesmaker-pro.cloudfunctions.net/proInvoices',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(30000)});
  if(!response.ok){const data=await response.json().catch(()=>({}));if(data.verifyEmail)show('verification',true);throw Error(data.error||'Je facturen konden niet worden geladen. Probeer opnieuw.');}return response;
}
async function task(button,fn){button.disabled=true;try{await fn();}catch(error){message(error.code?.startsWith('auth/')?'Aanmelden is niet gelukt. Controleer je gegevens of gebruik Wachtwoord vergeten.':error.name==='TimeoutError'?'Het laden duurt te lang. Probeer opnieuw.':errorText(error));}finally{button.disabled=false;}}
async function load(){
  const version=++revision,user=auth.currentUser;el('invoices').replaceChildren();show('empty',false);
  if(!user)return;
  message('Je facturen worden geladen…');
  await reload(user);if(version!==revision)return;
  show('verification',!user.emailVerified);if(!user.emailVerified){message('Bevestig eerst je e-mailadres om je facturen te openen.');return;}
  message('Je facturen worden geladen…');const data=await(await api({action:'list'})).json();if(version!==revision)return;
  for(const invoice of data.invoices){
    const row=document.createElement('article');row.className='invoice';const info=document.createElement('div'),title=document.createElement('h2'),details=document.createElement('p'),date=document.createElement('p'),button=document.createElement('button');
    title.textContent='Factuur '+invoice.number;details.textContent=invoice.description;
    date.textContent=[invoice.date?new Date(invoice.date).toLocaleDateString('nl-BE'):'',invoice.amountEUR&&Number.isFinite(Number(invoice.amountEUR))?new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'}).format(Number(invoice.amountEUR)):''].filter(Boolean).join(' · ');
    button.textContent='Download PDF';button.onclick=()=>task(button,async()=>{message('Je factuur wordt opgehaald…');const response=await api({action:'download',collection:invoice.collection,id:invoice.id});const url=URL.createObjectURL(await response.blob());if(version!==revision){URL.revokeObjectURL(url);return;}const a=document.createElement('a');a.href=url;a.download=`factuur-zisa-pro-${invoice.number}.pdf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);message('De download van je factuur is gestart.');});
    info.append(title,details,date);row.append(info,button);el('invoices').append(row);
  }
  show('empty',data.invoices.length===0);message('');
}
onAuthStateChanged(auth,user=>{revision++;el('invoices').replaceChildren();show('empty',false);show('verification',false);show('login',!user);show('account',!!user);el('identity').textContent=user?'Aangemeld als '+user.email:'';if(user)load().catch(error=>message(errorText(error)));else message('Meld je aan met je bestaande Pro-account.');});
el('loginForm').onsubmit=e=>{e.preventDefault();task(e.submitter,()=>signInWithEmailAndPassword(auth,el('email').value.trim(),el('password').value));};
el('google').onclick=()=>task(el('google'),()=>signInWithPopup(auth,new GoogleAuthProvider()));
el('reset').onclick=()=>task(el('reset'),async()=>{if(!el('email').value||!el('email').reportValidity()){message('Vul eerst je e-mailadres in.');return;}await sendPasswordResetEmail(auth,el('email').value.trim());message('Als dit adres een account heeft, ontvang je een herstellink. Kijk ook in je spammap.');});
el('verify').onclick=()=>task(el('verify'),async()=>{await sendEmailVerification(auth.currentUser);message('De bevestigingsmail is verstuurd. Kijk ook in je spammap.');});
el('verified').onclick=()=>task(el('verified'),load);el('reload').onclick=()=>task(el('reload'),load);el('logout').onclick=()=>task(el('logout'),()=>signOut(auth));
