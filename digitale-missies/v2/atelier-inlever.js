import {availability,submitWork} from './submit-work.js';
const $=s=>document.querySelector(s);
const code=$('#class-code');code.required=false;code.hidden=true;document.querySelector('label[for=class-code]').hidden=true;
let busy=false,pending={png:'',name:'',id:''};
$('#send').onclick=()=>{
  $('#send-status').textContent=availability()||'Je klaslink bepaalt naar welke leerkracht je werk gaat.';
  $('#submit-send').disabled=!!availability();$('#send-dialog').showModal();$('#pupil-name').focus();
};
$('#cancel-send').onclick=()=>{if(!busy)$('#send-dialog').close();};
$('#send-dialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
$('#send-form').onsubmit=async e=>{
  e.preventDefault();if(busy)return;busy=true;$('#submit-send').disabled=true;$('#cancel-send').disabled=true;
  try{const blob=await window.png();const png=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);}),name=$('#pupil-name').value.trim();
    if(pending.png!==png||pending.name!==name)pending={png,name,id:crypto.randomUUID().replaceAll('-','')};
    await submitWork(png,name,'Tekening',pending.id);$('#send-status').textContent='Ontvangen! Je leerkracht kan je werk bekijken.';
  }catch(error){$('#send-status').textContent=error.message;$('#submit-send').disabled=false;}
  finally{busy=false;$('#cancel-send').disabled=false;}
};
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(a&&location.hash.includes('sleutel=')&&new URL(a.href).origin===location.origin)a.hash=location.hash;});

