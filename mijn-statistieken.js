import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js';
const app=initializeApp({apiKey:'AIzaSyCYkB9CSNahs1UNv9pduNC7TTsj0LNNHSU',authDomain:'zisa-collegas.firebaseapp.com',projectId:'zisa-collegas',appId:'1:1029178227426:web:cb21cf199072c44b30bcbb'});
const auth=getAuth(app),$=id=>document.getElementById(id),names={ontdek:'Ontdek',pro:'PRO',gratis:'Gratis collega-versie',demo:'Demo'};
let user=null,rows=[],busy=false;
function cell(row,value){const td=document.createElement('td');td.textContent=value;row.append(td);}
function visible(){return rows.filter(r=>$('site').value==='all'||r.site===$('site').value);}
function paint(){
 const data=visible();$('cards').replaceChildren();
 for(const [site,name] of Object.entries(names)){
  if($('site').value!=='all'&&$('site').value!==site)continue;
  const values=data.filter(r=>r.site===site),card=document.createElement('article');card.className='card';
  const title=document.createElement('h2');title.textContent=name;card.append(title);
  const number=document.createElement('div');number.className='number';number.textContent=values.length?values.reduce((n,r)=>n+(r.visits||0),0):'—';card.append(number);
  const label=document.createElement('p');label.textContent='bezoeken in deze periode';card.append(label);
  const unique=document.createElement('p');unique.textContent=values.length?values.reduce((n,r)=>n+(r.browsers||0),0)+' unieke browsers per dag opgeteld':'Nog geen metingen';card.append(unique);$('cards').append(card);
 }
 const tools=new Map();for(const row of data)for(const tool of row.tools||[]){const key=row.site+'|'+tool.name;const previous=tools.get(key)||{name:tool.name,site:row.site,opens:0};previous.opens+=tool.opens;tools.set(key,previous);}
 $('tools').replaceChildren();for(const t of [...tools.values()].sort((a,b)=>b.opens-a.opens)){const tr=document.createElement('tr');[t.name,names[t.site],t.opens].forEach(v=>cell(tr,v));$('tools').append(tr);}
 if(!tools.size){const tr=document.createElement('tr');cell(tr,'Nog geen toolopeningen gemeten.');$('tools').append(tr);}
 $('daily').replaceChildren();for(const r of [...data].sort((a,b)=>b.date.localeCompare(a.date)||a.site.localeCompare(b.site))){const tr=document.createElement('tr');[r.date,names[r.site],r.browsers||0,r.visits||0].forEach(v=>cell(tr,v));$('daily').append(tr);}
}
async function load(){if(!user||busy)return;busy=true;$('status').textContent='Cijfers laden…';try{const token=await user.getIdToken();const response=await fetch('https://europe-west1-zisa-spelletjesmaker-pro.cloudfunctions.net/readZisaTraffic?days='+$('days').value,{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!response.ok)throw Error(response.status===403?'Dit overzicht is alleen voor Isabel.':'Cijfers laden lukt niet. Probeer opnieuw.');rows=(await response.json()).rows;paint();$('content').hidden=false;$('status').textContent='Bijgewerkt om '+new Date().toLocaleTimeString('nl-BE',{hour:'2-digit',minute:'2-digit'});}catch(e){$('status').textContent=e.message;}finally{busy=false;}}
onAuthStateChanged(auth,u=>{user=null;$('content').hidden=true;rows=[];if(!u){$('status').replaceChildren();const a=document.createElement('a');a.href='login_collega.html';a.textContent='Meld aan met je gratis collega-account om je statistieken te bekijken.';$('status').append(a);return;}if(u.email?.toLowerCase()!=='isabel.rockele@bsdelinde.net'){$('status').textContent='Dit overzicht is alleen voor Isabel.';return;}user=u;load();});
$('days').onchange=load;$('site').onchange=paint;$('refresh').onclick=load;
$('csv').onclick=()=>{const lines=[['Datum','Omgeving','Unieke browsers per dag','Bezoeken','Tool','Toolopeningen']];for(const r of visible()){lines.push([r.date,names[r.site],r.browsers||0,r.visits||0,'','']);for(const t of r.tools||[])lines.push([r.date,names[r.site],'','',t.name,t.opens]);}const csv='\ufeff'+lines.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='zisa-statistieken.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
setInterval(()=>{if(document.visibilityState==='visible')load();},30000);
