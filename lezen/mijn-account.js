import { readingConfig } from './config.js?v=koop-1';
import { createReadingAuth } from './reading-auth.js?v=google-1';
const el=id=>document.getElementById(id),show=(id,visible)=>{el(id).hidden=!visible;};
const message=text=>{el('message').textContent=text;el('message').classList.toggle('empty',!text);};
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
el('purchase').parentNode.insertBefore(el('includedNotice'),el('purchase'));
el('orderType').value=new URLSearchParams(location.search).get('keuze')==='school'?'school':'persoonlijk';
let auth,lastStatus,busy=false,paymentTimer,accountRevision=0,paymentChecks=0;
function applyOrderType(){
 const school=el('orderType').value==='school';
 el('quantity').min=school?'2':'1';el('quantity').max=school?'100':'1';
 el('quantity').value=school?Math.max(2,Number(el('quantity').value)||2):1;
 el('quantity').readOnly=!school;
 const included=!!(lastStatus?.pro||lastStatus?.schoolMember)&&!school;
 show('includedNotice',included);el('checkoutButton').disabled=included;
 el('includedText').textContent=lastStatus?.pro?"Je hebt al een actief Pro-account bij Juf Zisa’s spelgenerator. Zisa Lezen is daarin inbegrepen. Je hoeft hiervoor geen apart abonnement te kopen.":'Je hebt al toegang tot Zisa Lezen via je school. Je hoeft hiervoor geen apart abonnement te kopen.';
 updatePrice();
}
el('orderType').onchange=applyOrderType;

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
// Keep button colours and layout stable while preventing duplicate actions.
for(const eventName of ['click','submit'])document.addEventListener(eventName,event=>{
 if(busy&&(eventName==='submit'||event.target.closest('button'))){event.preventDefault();event.stopImmediatePropagation();}
},true);
async function task(fn){
 if(busy)return;
 busy=true;document.querySelector('main').setAttribute('aria-busy','true');
 message('Even geduld, we verwerken je aanvraag…');
 try{await fn();if(el('message').textContent==='Even geduld, we verwerken je aanvraag…')message('');}
 catch(error){message(friendly(error));}
 finally{busy=false;document.querySelector('main').removeAttribute('aria-busy');}
}
function friendly(error){const code=error?.code||'';if(code==='auth/popup-closed-by-user')return 'Google-aanmelding werd gesloten. Klik opnieuw op Aanmelden met Google om verder te gaan.';if(code==='auth/popup-blocked')return 'Sta het Google-aanmeldvenster toe in je browser en probeer opnieuw.';if(code==='auth/unauthorized-domain')return 'Google-aanmelding is op dit webadres nog niet toegestaan. Geef deze melding door zodat het testadres gecontroleerd kan worden.';if(code.startsWith('auth/'))return code==='auth/email-already-in-use'?'Dit e-mailadres heeft al een account. Meld je aan of herstel je wachtwoord.':code==='auth/weak-password'?'Kies een sterker wachtwoord.':'Aanmelden is niet gelukt. Controleer je gegevens of herstel je wachtwoord.';return error?.message||'Probeer later opnieuw.';}
async function refresh(){
  const revision=accountRevision;const data=await (await api('account')).json();if(revision!==accountRevision)return;lastStatus=data;show('verification',false);show('dashboard',true);show('invitation',!!invitationToken()&&!data.schoolMember);show('acceptInvitation',!!invitationToken()&&!data.schoolMember);renderSchool(data);
  el('accessText').textContent=data.schoolMember?'Je leerkrachtplaats is actief. Je hebt via je school toegang tot Zisa Lezen.':data.allowed?'Je hebt toegang tot Zisa Lezen.':'Er is nog geen actieve leestoegang.';
  show('openBooks',data.allowed);show('newLink',data.allowed);show('share',false);
  el('subscriptionText').textContent=data.school?`${data.quantity} leerkrachtplaatsen. ${data.renewalCanceled?'Verlenging gestopt.':'Automatische verlenging: '+money(Number(data.amountEUR))+' per maand.'} ${data.paidUntil?'Betaalde toegang tot '+date(data.paidUntil)+'.':'Er is geen actieve betaalde periode.'}`:data.schoolMember?'Je school betaalt je leerkrachtplaats.':data.pro?'Lezen is inbegrepen bij je actieve Pro-abonnement.':data.renewalCanceled?`Verlenging gestopt. Betaalde toegang tot ${date(data.paidUntil)}.`:data.cancelRequested?'Je opzegging wordt verwerkt.':data.paidUntil?`Betaalde toegang tot ${date(data.paidUntil)}. Automatische verlenging: €3,99 per maand.`:'Nog geen actieve betaalde leesperiode.';
  const hasOwnPaid=data.paidUntil>Date.now();if(ordering){show('dashboard',hasOwnPaid||data.pro||data.schoolMember);el('pageTitle').textContent=hasOwnPaid?'Je abonnement is actief':'Zisa Lezen bestellen';}show('purchase',!hasOwnPaid&&(!data.cancelRequested||data.renewalCanceled)&&!invitationToken());show('cancel',!data.renewalCanceled&&(data.paidUntil>0||data.paymentStatus==='paid'));
  applyOrderType();
  el('invoices').replaceChildren();
  for(const invoice of data.invoices||[]){const button=document.createElement('button');button.textContent=invoice.ready?`Download ${invoice.number}`:'Factuur wordt aangemaakt';button.disabled=!invoice.ready;button.onclick=()=>task(async()=>{const response=await api('invoice',{id:invoice.id});const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=`factuur-zisa-lezen-${invoice.number}.pdf`;link.click();message('De download van je factuur is gestart. Je vindt het bestand bij je downloads.');setTimeout(()=>URL.revokeObjectURL(url),60000);});el('invoices').append(button);}
  if(!data.invoices?.length)el('invoices').textContent='Na je eerste bevestigde betaling verschijnt hier je factuur.';
  clearTimeout(paymentTimer);
  const pending=['open','pending','authorized'].includes(data.paymentStatus);
  const awaitingInvoice=data.paymentStatus==='paid'&&!(data.invoices||[]).some(invoice=>invoice.ready);
  if(pending||awaitingInvoice){
   show('purchase',false);
   message(pending?'We wachten op de bevestiging van je betaling. Deze pagina werkt automatisch bij. Betaal niet opnieuw.':'Je betaling is bevestigd. Je factuur wordt klaargezet; deze pagina werkt automatisch bij.');
   const check=async()=>{
    if(revision!==accountRevision)return;
    if(busy){paymentTimer=setTimeout(check,5000);return;}
    try{await refresh();}catch{
     if(revision!==accountRevision)return;
     if(paymentChecks++<36)paymentTimer=setTimeout(check,5000);
     else message('De betaalstatus kon niet worden opgehaald. Vernieuw deze pagina later. Betaal niet opnieuw.');
    }
   };
   if(paymentChecks++<36)paymentTimer=setTimeout(check,5000);
   else message('De bevestiging duurt langer dan verwacht. Vernieuw deze pagina later om opnieuw te controleren. Betaal niet opnieuw.');
  }else{paymentChecks=0;message(data.paymentStatus==='paid'?'Je betaling is bevestigd. Je abonnement en factuur staan hieronder klaar.':'Testomgeving: betalingen en facturen zijn geen echte aankopen.');}

}
function clearFieldError(field){
 field.removeAttribute('aria-invalid');field.removeAttribute('aria-describedby');
 document.getElementById(field.id+'-error')?.remove();
}
function validatePurchase(){
 const form=el('purchaseForm');let first;
 const validGLN=value=>/^\d{13}$/.test(value)&&[...value].reduce((sum,digit,index)=>sum+Number(digit)*(index%2?3:1),0)%10===0;
 for(const field of form.querySelectorAll('input,select')){
  clearFieldError(field);let error='';const value=field.value.trim();
  if(field.required&&(field.type==='checkbox'?!field.checked:!value))error=field.type==='checkbox'?'Vink dit aan om verder te gaan.':'Vul dit veld in.';
  else if(!field.validity.valid)error=field.type==='email'?'Vul een geldig e-mailadres in.':field.id==='quantity'?'Vul een geldig aantal leerkrachten in.':'Controleer dit veld.';
  if(el('peppolRequested').checked){
   if(field.id==='peppolId'&&value&&!/^\d{4}:[A-Za-z0-9._-]+$/.test(value))error='Vul het volledige Peppol-ID in, bijvoorbeeld 0208: gevolgd door het ondernemingsnummer.';
   if(field.id==='peppolId'&&value.startsWith('0088:')&&!validGLN(value.slice(5)))error='Na 0088: hoort een geldig GLN-nummer van 13 cijfers.';
   if(field.id==='gln'&&value&&(!validGLN(value)||(el('peppolId').value.trim().startsWith('0088:')&&value!==el('peppolId').value.trim().slice(5))))error='Vul een geldig GLN-nummer van 13 cijfers in, gelijk aan het GLN in je Peppol-ID als je 0088: gebruikt.';
  }
  if(error){
   const note=document.createElement('p');note.id=field.id+'-error';note.className='field-error';note.textContent=error;
   field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',note.id);
   (field.type==='checkbox'?field.closest('label'):field).after(note);first ||= field;
  }
 }
 if(first){first.focus({preventScroll:true});first.scrollIntoView({block:'center',behavior:'auto'});return false;}
 return true;
}
el('purchaseForm').noValidate=true;
el('purchaseForm').addEventListener('input',event=>{if(event.target.matches('input,select'))clearFieldError(event.target);});
el('peppolRequested').onchange=()=>{const checked=el('peppolRequested').checked;el('billingEmailLabel').textContent=checked?'E-mailadres van de schooladministratie voor facturen (verplicht bij Peppol)':'E-mailadres voor facturen (leeg = je accountadres)';show('peppolFields',checked);for(const id of ['peppolId','organization','billingEmail'])el(id).required=checked;el('organization').required=checked||Number(el('quantity').value)>1;};
if(!readingConfig.enabled){message('Deze koppeling wordt voorbereid. Er worden nog geen accounts of betalingen gestart. Je kunt het voorbeeld bekijken op de vorige pagina.');}
else{
  auth=await createReadingAuth(readingConfig);
  auth.observe(user=>{accountRevision++;clearTimeout(paymentTimer);paymentChecks=0;if(ordering)el('pageTitle').textContent='Zisa Lezen bestellen';lastStatus=null;show('includedNotice',false);el('buyerIdentity').textContent=user?.email?'Je bestelt als '+user.email:'';show('login',!user);show('invitation',!!invitationToken());show('acceptInvitation',false);show('dashboard',false);show('purchase',false);show('verification',!!user&&!user.emailVerified);if(user?.emailVerified)refresh().catch(error=>message(friendly(error)));else if(!busy)message(user?'Bevestig eerst je e-mailadres.':'Meld je aan of maak een account.');});
  el('switchBuyer').onclick=()=>task(async()=>{await auth.signOut();show('includedNotice',false);message('Meld je aan met het account waarmee je wilt bestellen.');});
  el('googleLogin').onclick=()=>task(()=>auth.signInGoogle(el('email').value));
  el('loginForm').onsubmit=e=>{e.preventDefault();task(()=>auth.signIn(el('email').value,el('password').value));};
  el('register').onclick=()=>task(async()=>{if(!el('loginForm').reportValidity())return;message('Je account wordt aangemaakt. Daarna sturen we je een bevestigingsmail. Even geduld…');await auth.register(el('email').value,el('password').value);message('De bevestigingsmail is aangevraagd. De bezorging kan enkele minuten duren. Kijk ook in je spammap. Na 15 minuten nog niets? Vraag hieronder een nieuwe mail aan.');});
  el('reset').onclick=()=>task(async()=>{if(!el('email').reportValidity()||!el('email').value)return;await auth.resetPassword(el('email').value);message('Als dit adres een account heeft, ontvang je een herstellink.');});
  el('verified').onclick=()=>task(refresh);el('resend').onclick=()=>task(async()=>{await auth.resendVerification();message('Een nieuwe bevestigingsmail is aangevraagd. De bezorging kan enkele minuten duren. Kijk ook in je spammap of ongewenste e-mail.');});el('logout').onclick=()=>task(async()=>{await auth.signOut();message('Meld je aan of maak een account.');});el('refresh').onclick=()=>task(refresh);
  el('acceptInvitation').onclick=()=>task(async()=>{await api('school-accept',{token:invitationToken()});sessionStorage.removeItem('zisa-reading-invitation');show('acceptInvitation',false);show('invitation',false);message('Je leerkrachtplaats is actief. Zisa Lezen wordt geopend.');location.assign('bibliotheek.html?account=1'+(testQuery?'&test=1':''));});
  el('purchaseForm').onsubmit=e=>{e.preventDefault();if(!validatePurchase())return;task(async()=>{const body={quantity:Number(el('quantity').value),consent:el('consent').checked,consentVersion:'reading-monthly-v1',peppolRequested:el('peppolRequested').checked};for(const key of ['name','address','organization','vatNumber','billingEmail','peppolId','gln','purchaseReference'])body[key]=el(key).value;const result=await(await api('checkout',body)).json();const url=new URL(result.checkoutUrl);if(url.protocol!=='https:'||!['www.mollie.com','checkout.mollie.com'].includes(url.hostname))throw new Error('Ongeldige betaallink.');location.assign(url.href);});};
  el('cancel').onclick=()=>{el('cancelText').textContent=`Wil je de automatische verlenging stoppen? Je behoudt je betaalde toegang${lastStatus.paidUntil?' tot '+date(lastStatus.paidUntil):''}.`;show('confirmCancel',true);};el('cancelNo').onclick=()=>show('confirmCancel',false);el('cancelYes').onclick=()=>task(async()=>{await api('cancel');show('confirmCancel',false);await refresh();});
  el('newLink').onclick=()=>task(async()=>{const result=await(await api('link')).json();const url=new URL('bibliotheek.html',location.href);if(testQuery)url.searchParams.set('test','1');url.hash=result.token;el('studentLink').value=url.href;el('qr').replaceChildren();if(window.QRCode)new window.QRCode(el('qr'),{text:url.href,width:220,height:220,colorDark:'#173f73',colorLight:'#ffffff'});show('share',true);message('Je nieuwe leerlinglink staat klaar. De vorige link is vervangen.');});
  el('copyLink').onclick=()=>task(async()=>{await navigator.clipboard.writeText(el('studentLink').value);message('Leeslink gekopieerd.');});
}
