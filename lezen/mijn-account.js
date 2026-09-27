import { readingConfig } from './config.js?v=koop-1';
import { createReadingAuth } from './reading-auth.js?v=google-1';
const el=id=>document.getElementById(id),show=(id,visible)=>{el(id).hidden=!visible;};
const message=text=>{el('message').textContent=text;};
const testQuery=new URLSearchParams(location.search).get('test')==='1';
if(testQuery)el('openBooks').href='bibliotheek.html?account=1&test=1';
const date=n=>new Date(n).toLocaleDateString('nl-BE');
const ordering=new URLSearchParams(location.search).get('bestellen')==='1';
if(ordering){
 el('pageTitle').textContent='Zisa Lezen bestellen';show('orderSteps',true);
 el('login').querySelector('h2').textContent='Stap 1 — Je account';
 el('login').querySelector('p').textContent='Met je account open je straks je leesboeken en beheer je je abonnement. Nieuw bij Zisa? Vul je e-mailadres in, kies een wachtwoord en klik op Account maken. Al een account? Meld je aan.';
 el('purchase').querySelector('h2').textContent='Stap 2 — Je bestelling en factuur';
 // The order form belongs before account management during checkout.
 document.querySelector('main').insertBefore(el('purchase'),el('dashboard'));
}
let auth,lastStatus,busy=false;
const inviteMatch=location.hash.match(/^#invite=([A-Za-z0-9_-]{43})$/);
if(inviteMatch){sessionStorage.setItem('zisa-reading-invitation',inviteMatch[1]);history.replaceState(null,'',location.pathname+location.search);}
const invitationToken=()=>sessionStorage.getItem('zisa-reading-invitation');
const money=n=>new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'}).format(n);
function updatePrice(){const quantity=Number(el('quantity').value);const valid=el('quantity').checkValidity();const price=money(quantity*399/100);el('priceSummary').textContent=valid?`${quantity} leerkracht${quantity===1?'':'en'} met de eigen klas: ${price} per maand. Bij meerdere leerkrachten ontvangt de school één gezamenlijke factuur.`:'Kies een geldig aantal leerkrachten.';el('consentText').textContent=`Ik geef toestemming voor ${price} per maand en automatische maandelijkse verlenging tot ik opzeg.`;el('checkoutButton').textContent=`Naar de testbetaling — ${price} per maand`;el('organization').required=quantity>1||el('peppolRequested').checked;el('consent').checked=false;}
el('quantity').oninput=updatePrice;
function renderSchool(data){show('school',!!data.school);el('schoolSeats').replaceChildren();if(!data.school)return;
 el('schoolSummary').textContent=`${data.quantity} plaatsen — ${money(Number(data.amountEUR))} per maand. ${data.school.active?'Je kunt hieronder collega’s uitnodigen.':'Er is nu geen betaalde schooltoegang.'}`;
 for(const seat of data.school.seats){const row=document.createElement('div'),label=document.createElement('label'),input=document.createElement('input'),status=document.createElement('p');
  input.id=`seat-${seat.index}`;input.type='email';input.maxLength=254;input.value=seat.email;label.htmlFor=input.id;label.textContent=`E-mailadres leerkracht ${seat.index+1}`;status.textContent=seat.state==='active'?'Toegang geactiveerd':seat.state==='invited'?(seat.expired?'Uitnodiging verlopen':'Uitnodiging klaargezet'):'Vrije plaats';
  const send=document.createElement('button');send.type='button';send.textContent=seat.state==='empty'?'Uitnodigen':'Uitnodigen of vervangen';send.disabled=!data.school.active;
  send.onclick=()=>task(async()=>{if(!input.value.trim()||!input.reportValidity())return;if(seat.state!=='empty'&&seat.email.toLowerCase()!==input.value.trim().toLowerCase()&&!window.confirm('Deze plaats vervangen? De vorige leerkracht verliest de schooltoegang en de oude klas-QR vervalt.'))return;await api('school-invite',{index:seat.index,email:input.value});await refresh();message('Uitnodiging klaargezet. In deze test worden mails uitsluitend naar het ingestelde testadres gestuurd.');});
  row.append(label,input,status,send);
  if(seat.state==='invited'){const resend=document.createElement('button');resend.type='button';resend.textContent='Nieuwe uitnodiging sturen';resend.disabled=!data.school.active;resend.onclick=()=>task(async()=>{await api('school-invite',{index:seat.index,email:seat.email,resend:true});await refresh();message('Nieuwe testuitnodiging klaargezet; de oude uitnodiging vervalt.');});row.append(resend);}
  if(seat.state!=='empty'){const remove=document.createElement('button');remove.type='button';remove.textContent='Plaats vrijmaken';remove.onclick=()=>task(async()=>{if(!window.confirm('Deze leerkracht verwijderen? De schooltoegang en de oude klas-QR vervallen. Het aantal betaalde plaatsen verandert niet.'))return;await api('school-remove',{index:seat.index});await refresh();});row.append(remove);}
  el('schoolSeats').append(row);
 }
}

async function api(action,data={}){
  const response=await fetch(`${readingConfig.api}/${action}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${await auth.token()}`},body:JSON.stringify(data),cache:'no-store'});
  if(!response.ok){const result=await response.json().catch(()=>({}));throw new Error(result.error||'Probeer later opnieuw.');}return response;
}
async function task(fn){if(busy)return;busy=true;message('Even geduld, we verwerken je aanvraag…');const buttons=[...document.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);try{await fn();}catch(error){message(friendly(error));}finally{busy=false;buttons.forEach(([b,disabled])=>b.disabled=disabled);}}
function friendly(error){const code=error?.code||'';if(code==='auth/popup-closed-by-user')return 'Google-aanmelding werd gesloten. Klik opnieuw op Aanmelden met Google om verder te gaan.';if(code==='auth/popup-blocked')return 'Sta het Google-aanmeldvenster toe in je browser en probeer opnieuw.';if(code==='auth/unauthorized-domain')return 'Google-aanmelding is op dit webadres nog niet toegestaan. Geef deze melding door zodat het testadres gecontroleerd kan worden.';if(code.startsWith('auth/'))return code==='auth/email-already-in-use'?'Dit e-mailadres heeft al een account. Meld je aan of herstel je wachtwoord.':code==='auth/weak-password'?'Kies een sterker wachtwoord.':'Aanmelden is niet gelukt. Controleer je gegevens of herstel je wachtwoord.';return error?.message||'Probeer later opnieuw.';}
async function refresh(){
  const data=await (await api('account')).json();lastStatus=data;show('verification',false);show('dashboard',true);show('invitation',!!invitationToken());show('acceptInvitation',!!invitationToken());renderSchool(data);
  el('accessText').textContent=data.allowed?'Je hebt toegang tot Zisa Lezen.':'Er is nog geen actieve leestoegang.';
  show('openBooks',data.allowed);show('newLink',data.allowed);show('share',false);
  el('subscriptionText').textContent=data.school?`${data.quantity} leerkrachtplaatsen. ${data.renewalCanceled?'Verlenging gestopt.':'Automatische verlenging: '+money(Number(data.amountEUR))+' per maand.'} ${data.paidUntil?'Betaalde toegang tot '+date(data.paidUntil)+'.':'Er is geen actieve betaalde periode.'}`:data.schoolMember?'Je school betaalt je leerkrachtplaats.':data.pro?'Lezen is inbegrepen bij je actieve Pro-abonnement.':data.renewalCanceled?`Verlenging gestopt. Betaalde toegang tot ${date(data.paidUntil)}.`:data.cancelRequested?'Je opzegging wordt verwerkt.':data.paidUntil?`Betaalde toegang tot ${date(data.paidUntil)}. Automatische verlenging: €3,99 per maand.`:'Nog geen actieve betaalde leesperiode.';
  const hasOwnPaid=data.paidUntil>Date.now();if(ordering){show('dashboard',hasOwnPaid||data.pro||data.schoolMember);el('pageTitle').textContent=hasOwnPaid?'Je abonnement is actief':'Zisa Lezen bestellen';}show('purchase',!hasOwnPaid&&(!data.cancelRequested||data.renewalCanceled)&&!invitationToken());show('cancel',!data.renewalCanceled&&(data.paidUntil>0||data.paymentStatus==='paid'));
  el('quantity').min=data.pro||data.schoolMember?'2':'1';if(Number(el('quantity').value)<Number(el('quantity').min))el('quantity').value=el('quantity').min;updatePrice();
  el('invoices').replaceChildren();
  for(const invoice of data.invoices||[]){const button=document.createElement('button');button.textContent=invoice.ready?`Download ${invoice.number}`:'Factuur wordt aangemaakt';button.disabled=!invoice.ready;button.onclick=()=>task(async()=>{const response=await api('invoice',{id:invoice.id});const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=`factuur-zisa-lezen-${invoice.number}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);});el('invoices').append(button);}
  if(!data.invoices?.length)el('invoices').textContent='Na je eerste bevestigde betaling verschijnt hier je factuur.';
  message('Testomgeving: betalingen en facturen zijn geen echte aankopen.');
}
el('peppolRequested').onchange=()=>{const checked=el('peppolRequested').checked;show('peppolFields',checked);for(const id of ['peppolId','organization','billingEmail'])el(id).required=checked;el('organization').required=checked||Number(el('quantity').value)>1;};
if(!readingConfig.enabled){message('Deze koppeling wordt voorbereid. Er worden nog geen accounts of betalingen gestart. Je kunt het voorbeeld bekijken op de vorige pagina.');}
else{
  auth=await createReadingAuth(readingConfig);
  auth.observe(user=>{show('login',!user);show('invitation',!!invitationToken());show('acceptInvitation',false);show('dashboard',false);show('purchase',false);show('verification',!!user&&!user.emailVerified);if(user?.emailVerified)refresh().catch(error=>message(friendly(error)));else if(!busy)message(user?'Bevestig eerst je e-mailadres.':'Meld je aan of maak een account.');});
  el('googleLogin').onclick=()=>task(()=>auth.signInGoogle(el('email').value));
  el('loginForm').onsubmit=e=>{e.preventDefault();task(()=>auth.signIn(el('email').value,el('password').value));};
  el('register').onclick=()=>task(async()=>{if(!el('loginForm').reportValidity())return;message('Je account wordt aangemaakt. Daarna sturen we je een bevestigingsmail. Even geduld…');await auth.register(el('email').value,el('password').value);message('Open je e-mail om je account te bevestigen. Kijk ook in je spammap of ongewenste e-mail.');});
  el('reset').onclick=()=>task(async()=>{if(!el('email').reportValidity()||!el('email').value)return;await auth.resetPassword(el('email').value);message('Als dit adres een account heeft, ontvang je een herstellink.');});
  el('verified').onclick=()=>task(refresh);el('resend').onclick=()=>task(async()=>{await auth.resendVerification();message('De bevestigingsmail is aangevraagd. Kijk ook in je spammap of ongewenste e-mail.');});el('logout').onclick=()=>task(async()=>{await auth.signOut();message('Meld je aan of maak een account.');});el('refresh').onclick=()=>task(refresh);
  el('acceptInvitation').onclick=()=>task(async()=>{await api('school-accept',{token:invitationToken()});sessionStorage.removeItem('zisa-reading-invitation');location.assign('bibliotheek.html?account=1'+(testQuery?'&test=1':''));});
  el('purchaseForm').onsubmit=e=>{e.preventDefault();task(async()=>{const body={quantity:Number(el('quantity').value),consent:el('consent').checked,consentVersion:'reading-monthly-v1',peppolRequested:el('peppolRequested').checked};for(const key of ['name','address','organization','vatNumber','billingEmail','peppolId','gln','purchaseReference'])body[key]=el(key).value;const result=await(await api('checkout',body)).json();const url=new URL(result.checkoutUrl);if(url.protocol!=='https:'||!['www.mollie.com','checkout.mollie.com'].includes(url.hostname))throw new Error('Ongeldige betaallink.');location.assign(url.href);});};
  el('cancel').onclick=()=>{el('cancelText').textContent=`Wil je de automatische verlenging stoppen? Je behoudt je betaalde toegang${lastStatus.paidUntil?' tot '+date(lastStatus.paidUntil):''}.`;show('confirmCancel',true);};el('cancelNo').onclick=()=>show('confirmCancel',false);el('cancelYes').onclick=()=>task(async()=>{await api('cancel');show('confirmCancel',false);await refresh();});
  el('newLink').onclick=()=>task(async()=>{const result=await(await api('link')).json();const url=new URL('bibliotheek.html',location.href);if(testQuery)url.searchParams.set('test','1');url.hash=result.token;el('studentLink').value=url.href;el('qr').replaceChildren();if(window.QRCode)new window.QRCode(el('qr'),{text:url.href,width:220,height:220,colorDark:'#173f73',colorLight:'#ffffff'});show('share',true);message('Je nieuwe leerlinglink staat klaar. De vorige link is vervangen.');});
  el('copyLink').onclick=()=>task(async()=>{await navigator.clipboard.writeText(el('studentLink').value);message('Leeslink gekopieerd.');});
}
