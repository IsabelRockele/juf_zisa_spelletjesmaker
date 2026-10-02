import {readingConfig} from './config.js?v=live-1';
import {createReadingAuth} from './reading-auth.js';
const gate=document.getElementById('readingGate');
// Token only in memory. Fragments are not sent to servers or in HTTP referrers.
const incoming=location.hash.slice(1);
const accountMode=new URLSearchParams(location.search).get('account')==='1';
if(accountMode)sessionStorage.removeItem('zisa-reading-student-'+readingConfig.environment);
if(incoming){sessionStorage.setItem('zisa-reading-student-'+readingConfig.environment,incoming);history.replaceState(null,'',location.pathname+location.search);}
const token=accountMode?'':incoming||sessionStorage.getItem('zisa-reading-student-'+readingConfig.environment)||'';
let auth;
async function request(){
  const headers=token?{'X-Reading-Token':token}:{Authorization:`Bearer ${await auth.token()}`};
  const response=await fetch(`${readingConfig.api}/catalog`,{method:'POST',headers,cache:'no-store'});
  if(!response.ok)throw new Error('Deze leeslink is niet actief. Vraag de eigenaar om de link na te kijken.');
  return response;
}
try{
  if(!readingConfig.enabled)throw new Error('Deze leesomgeving wordt nog voorbereid.');
  if(!token){auth=await createReadingAuth(readingConfig);await new Promise(resolve=>{const stop=auth.observe(()=>{stop();resolve();});});}
  const source=await(await request()).text();const blob=URL.createObjectURL(new Blob([source],{type:'application/javascript'}));
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=blob;script.onload=resolve;script.onerror=reject;document.body.append(script);});URL.revokeObjectURL(blob);
  if(!token){
    // Only a separate reading subscription gets reading account management.
    // Failure to load account details must not block already-authorized books.
    try{
      const response=await fetch(`${readingConfig.api}/account`,{method:'POST',headers:{Authorization:`Bearer ${await auth.token()}`},cache:'no-store'});
      if(response.ok){
        const account=await response.json();
        if(!account.pro&&(account.paidUntil>0||account.school||account.schoolMember)){
          const accountLink=document.createElement('a');
          accountLink.textContent='Mijn account';accountLink.className='library-btn reading-account';
          accountLink.href=new URL('./mijn-account.html',import.meta.url).href+(new URLSearchParams(location.search).get('test')==='1'?'?test=1':'');
          document.querySelector('.speech').replaceWith(accountLink);
          document.body.classList.add('teacher-account');
        }
      }
    }catch{/* Account management can be reopened later; reading remains available. */}
  }
  window.ZISA_ACCESS_MODE='full';const script=document.createElement('script');script.src='app.js?v=62';script.onload=()=>gate.remove();script.onerror=()=>{gate.textContent='De boeken konden niet worden geladen.';};document.body.append(script);
  // Recheck on return and periodically. Failure covers already-rendered content.
  const check=async()=>{try{await request();}catch(error){location.reload();}};
  setInterval(check,5*60*1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
}catch(error){gate.textContent=error.message||'Meld je aan via je leesaccount.';}
