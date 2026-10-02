document.querySelector('header .brand').href='mijn-account.html'+(new URLSearchParams(location.search).get('test')==='1'?'?test=1':'');
document.querySelector('header .badge').textContent=new URLSearchParams(location.search).get('test')==='1'?'Beheer · alleen testabonnementen':'Beheer · echte abonnementen';
import {readingConfig} from './config.js?v=live-1';
import {createReadingAuth} from './reading-auth.js';
const el=id=>document.getElementById(id);
let auth,current=null,busy=false,revision=0;
const message=text=>el('message').textContent=text;
async function api(action,data={}){
 const response=await fetch(`${readingConfig.api}/${action}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${await auth.token()}`},body:JSON.stringify(data),cache:'no-store'});
 const result=await response.json();if(!response.ok)throw Error(result.error||'De aanvraag is niet gelukt.');return result;
}
async function task(fn){if(busy)return;busy=true;try{await fn();}catch(error){message(error.message||'Probeer opnieuw.');}finally{busy=false;}}
function render(data){
 current=data;el('result').hidden=false;el('buyer').textContent=data.email;
 el('details').textContent=`${data.quantity} leerkrachtplaats${data.quantity===1?'':'en'}${data.school?' — '+data.school:''}. Betaalde toegang: ${data.paidUntil? 'tot '+new Date(data.paidUntil).toLocaleDateString('nl-BE'):'geen actieve periode'}.`;
 el('state').textContent=data.renewalCanceled?'De automatische verlenging is gestopt.':data.cancelRequested?'De opzegging wordt verwerkt.':'De automatische verlenging is nog niet stopgezet.';
 el('cancelForm').hidden=data.renewalCanceled||data.cancelRequested||data.paymentStatus!=='paid';el('requested').checked=false;
}
if(!readingConfig.enabled)message('Dit beheer is voorlopig alleen beschikbaar voor testabonnementen.');
else{
 auth=await createReadingAuth(readingConfig);
 auth.observe(async user=>{
  const ownRevision=++revision;current=null;el('result').hidden=true;el('management').hidden=true;el('login').hidden=!!user;el('logout').hidden=!user;
  if(!user){message('Meld je aan met je Google-beheerdersaccount.');return;}
  try{await api('admin-status');if(ownRevision!==revision)return;el('management').hidden=false;message('Zoek het e-mailadres op waarmee de aankoop is gedaan.');}catch(error){if(ownRevision===revision)message(error.message);}
 });
 el('login').onclick=()=>task(()=>auth.signInGoogle());el('logout').onclick=()=>task(()=>auth.signOut());
 el('search').onsubmit=event=>{event.preventDefault();task(async()=>{const r=revision;current=null;el('result').hidden=true;message('Abonnement wordt opgezocht…');const data=await api('admin-find',{email:el('email').value});if(r!==revision)return;render(data);message('Controleer de aankoper en het aantal plaatsen voordat je opzegt.');});};
 el('cancelForm').onsubmit=event=>{event.preventDefault();if(!current||!el('requested').checked)return;
  const selected=current;
  if(!confirm(`Verlenging stoppen voor ${selected.email} (${selected.quantity} plaatsen)? De betaalde toegang blijft behouden.`))return;
  task(async()=>{const r=revision;message('De opzegging wordt verwerkt.');const data=await api('admin-cancel',{email:selected.email,orderId:selected.orderId,requestedByBuyer:true});if(r!==revision)return;render(data);message(data.renewalCanceled?'Verlenging gestopt. De bevestigingsmail wordt klaargezet; de betaalde toegang blijft behouden.':'De opzegging wordt nog verwerkt. Zoek het abonnement straks opnieuw op.');});
 };
}
