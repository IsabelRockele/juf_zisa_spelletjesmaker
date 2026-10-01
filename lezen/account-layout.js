/** Account sections stay separate from the checkout and authentication forms. */
export function createAccountLayout(){
 const el=id=>document.getElementById(id),main=document.querySelector('main');
 const dashboard=el('dashboard'),reading=el('openBooks').closest('.card'),subscription=el('subscriptionText').closest('.card'),invoices=el('invoices').closest('.card');
 main.insertBefore(el('includedNotice'),dashboard);main.insertBefore(el('purchase'),dashboard);
 const nav=document.createElement('nav');nav.className='account-nav';nav.setAttribute('aria-label','Onderdelen van je account');
 const panels={},buttons={};let selected=null,available=[];
 for(const [key,label] of [['school','Leerkrachten'],['reading','Lezen en klas-QR'],['billing','Abonnement en facturen']]){
  const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>select(key);button.setAttribute('aria-controls','account-'+key);nav.append(button);buttons[key]=button;
  const panel=document.createElement('div');panel.id='account-'+key;panel.className='account-panel';panels[key]=panel;
 }
 const logout=el('logout');
 panels.school.append(el('school'));panels.reading.append(reading);panels.billing.append(subscription,invoices);
 const toolbar=document.createElement('div');toolbar.className='account-toolbar';const identity=document.createElement('p');identity.className='account-identity';toolbar.append(identity,logout);
 dashboard.replaceChildren(toolbar,nav,...Object.values(panels));
 function select(key){
  selected=key;for(const name of Object.keys(panels)){panels[name].hidden=name!==key;buttons[name].setAttribute('aria-pressed',String(name===key));}
 }
 return {
  reset(){selected=null;identity.textContent='';},
  update(data,email){
   available=[...(data.school?['school']:[]),...(data.allowed?['reading']:[]),...(!data.schoolMember||data.school||data.paidUntil?['billing']:[])];
   if(!available.length)available=['billing'];
   for(const key of Object.keys(buttons))buttons[key].hidden=!available.includes(key);
   identity.textContent=`${data.school?'Schoolbeheer':data.schoolMember?'Leerkrachtaccount':'Mijn account'}${email?' · '+email:''}`;
   if(!available.includes(selected))select(available[0]);
   invoices.hidden=!!data.schoolMember&&!data.school&&!data.paidUntil;
   reading.querySelector('h2').textContent='Lezen met je klas';
  },
  reading(){if(available.includes('reading'))select('reading');}
 };
}
