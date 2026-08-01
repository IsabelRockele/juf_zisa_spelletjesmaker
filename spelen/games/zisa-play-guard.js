import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const cfg={apiKey:"AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw",authDomain:"zisa-spelletjesmaker-pro.firebaseapp.com",projectId:"zisa-spelletjesmaker-pro",storageBucket:"zisa-spelletjesmaker-pro.appspot.com",messagingSenderId:"828063957776",appId:"1:828063957776:web:8d8686b478846fe980db95"};
const gate=document.createElement("div");gate.id="zisaPlayGate";gate.innerHTML='<div><span>🦓</span><strong>Even je Zisa-toegang controleren…</strong></div>';document.documentElement.append(gate);
const style=document.createElement("style");style.textContent="#zisaPlayGate{position:fixed;z-index:2147483647;inset:0;background:#fffaf1;display:grid;place-items:center;font:18px Arial;color:#17324d}#zisaPlayGate div{text-align:center}#zisaPlayGate span{display:block;font-size:48px;margin-bottom:14px}#zisaPlayGate.error strong{display:block;max-width:520px;padding:20px}#zisaPlayGate a{display:inline-block;margin-top:18px;color:#1768ac}";document.head.append(style);
const app=getApps().length?getApp():initializeApp(cfg);const join=httpsCallable(getFunctions(app,"europe-west1"),"joinPlayClass");
const code=sessionStorage.getItem("zisa_play_code")||new URLSearchParams(location.search).get("code")||"";const deviceId=localStorage.getItem("zisa_play_device_id")||"";
document.documentElement.style.webkitTextSizeAdjust='100%';
addEventListener('DOMContentLoaded',()=>document.querySelectorAll('button,a,input,select,[role="button"]').forEach(el=>el.style.touchAction='manipulation'));
async function check(){try{const localPreview=['localhost','127.0.0.1'].includes(location.hostname)&&(new URLSearchParams(location.search).get('preview')==='1'||sessionStorage.getItem('zisa_play_allowed')==='1');if(!localPreview)await join({code,deviceId});gate.remove();return true}catch(e){gate.classList.add("error");gate.innerHTML='<div><span>🔒</span><strong>Dit spel is momenteel niet beschikbaar.</strong><a href="../index.html">Terug naar Zisa Spelen</a></div>';return false}}
check().then(ok=>{if(ok)setInterval(()=>join({code,deviceId}).catch(()=>location.href="../index.html"),120000)});
