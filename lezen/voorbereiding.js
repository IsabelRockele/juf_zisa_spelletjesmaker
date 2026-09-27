const status = document.getElementById('session-status');
const sources = new Map();
const results = new Map();
const nonce = crypto.randomUUID();
function render() {
  const signedIn = [...results].filter(([,value])=>value.state==='signed-in');
  status.replaceChildren();
  status.hidden=!signedIn.length;
  if(!signedIn.length) return;
  const line=document.createElement('p');
  line.textContent='Je bent al aangemeld.';
  const link=document.createElement('a');
  link.className='account-link';
  link.textContent='Open mijn leesomgeving →';
  link.href=signedIn.some(([project])=>project==='colleagues')?'../zisa-lezen.html':'../pro/zisa-lezen.html';
  status.append(line,link);
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin || event.data?.type!=='zisa-reading-session' || event.data.nonce!==nonce) return;
  const frame=sources.get(event.data.project);
  if(!frame || event.source!==frame.contentWindow || !['signed-in','signed-out','unavailable'].includes(event.data.state)) return;
  results.set(event.data.project,{state:event.data.state,email:typeof event.data.email==='string'?event.data.email.slice(0,254):''});render();
});
for(const project of ['colleagues','pro']){
  const frame=document.createElement('iframe');frame.hidden=true;frame.title='Controle van bestaande aanmelding';
  frame.src=`auth-session.html?project=${project}&nonce=${encodeURIComponent(nonce)}`;
  sources.set(project,frame);document.body.append(frame);
}
setTimeout(()=>{for(const project of sources.keys())if(!results.has(project))results.set(project,{state:'unavailable'});render();},12000);
