import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig={apiKey:"AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw",authDomain:"zisa-spelletjesmaker-pro.firebaseapp.com",projectId:"zisa-spelletjesmaker-pro",storageBucket:"zisa-spelletjesmaker-pro.appspot.com",messagingSenderId:"828063957776",appId:"1:828063957776:web:8d8686b478846fe980db95"};
const app=getApps().length?getApp():initializeApp(firebaseConfig);
const auth=getAuth(app);
const joinPlayClass=httpsCallable(getFunctions(app,"europe-west1"),"joinPlayClass");
const previewPlayClass=httpsCallable(getFunctions(app,"europe-west1"),"previewPlayClass");
const loading=document.getElementById("loadingState"),error=document.getElementById("errorState"),device=document.getElementById("deviceState"),menu=document.getElementById("gameMenu"),grid=document.getElementById("gradeGrid");
const params=new URLSearchParams(location.search);
const explicitTeacherPreview=params.get('teacher')==='1';
const explicitStudentLink=!!params.get('code')&&!explicitTeacherPreview;

// Een echte QR- of leerlinglink moet altijd leerlingstand openen. Zo kan een
// eerder leerkrachtvoorbeeld in dezelfde browser de QR-code niet overschrijven.
if(explicitTeacherPreview)sessionStorage.setItem('zisa_teacher_preview','1');
else if(explicitStudentLink)sessionStorage.removeItem('zisa_teacher_preview');

function deviceId(){let id=localStorage.getItem("zisa_play_device_id");if(!id){id=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;localStorage.setItem("zisa_play_device_id",id)}return id}
function code(){const fromUrl=new URLSearchParams(location.search).get("code");if(fromUrl)sessionStorage.setItem("zisa_play_code",fromUrl);return fromUrl||sessionStorage.getItem("zisa_play_code")||""}
function messageFor(err){const raw=String(err?.message||err?.details||"");if(raw.includes("50 gekoppelde"))return["De toestelgrens is bereikt","Vraag je leerkracht om een oud toestel te verwijderen."];if(raw.includes("30 leerlingen"))return["Er oefenen al 30 leerlingen","Probeer over enkele minuten opnieuw."];if(raw.includes("abonnement"))return["De leerlingentoegang is niet actief","Het PRO-abonnement van je leerkracht is verlopen of niet actief."];return["Deze QR-code werkt niet","Vraag je leerkracht om de QR-code na te kijken."]}
function gradeCard(n,label,description){const a=document.createElement("a");a.className="grade-card";a.href=`./games/start_leerjaar${n}.html`;a.addEventListener('click',()=>sessionStorage.setItem('zisa_play_grade',String(n)));a.innerHTML=`<span class="grade-number">${n}</span><h3>${label}</h3><p>${description}</p><b>Bekijk de spellen →</b>`;return a}
async function open(){loading.hidden=false;error.hidden=true;device.hidden=true;menu.hidden=true;try{const localPreview=['localhost','127.0.0.1'].includes(location.hostname)&&(params.get('preview')==='1'||sessionStorage.getItem('zisa_play_allowed')==='1');const teacherPreview=explicitTeacherPreview||(!explicitStudentLink&&sessionStorage.getItem('zisa_teacher_preview')==='1');if(!localPreview&&!teacherPreview&&Math.min(screen.width,screen.height)<700){loading.hidden=true;device.hidden=false;return}if(teacherPreview&&!localPreview){await auth.authStateReady();if(!auth.currentUser){const returnUrl=encodeURIComponent(location.href);location.replace(`../pro/index.html?r=${returnUrl}`);return}await auth.currentUser.getIdToken()}const data=localPreview?{config:{grade1:true,grade2:true,grade3:true},registeredCount:0,localPreview:true}:teacherPreview?((await previewPlayClass({})).data||{}):((await joinPlayClass({code:code(),deviceId:deviceId()})).data||{});sessionStorage.setItem("zisa_play_allowed","1");grid.replaceChildren();if(data.config?.grade1)grid.append(gradeCard(1,"Eerste leerjaar (groep 3)","Splitsspelletjes en hoofdrekenspellen tot 20."));if(data.config?.grade2)grid.append(gradeCard(2,"Tweede leerjaar (groep 4)","Tafels oefenen met verschillende spelvormen."));if(data.config?.grade3)grid.append(gradeCard(3,"Derde leerjaar (groep 5)","Tafelspellen met extra uitdaging en strategie."));document.getElementById("deviceNote").textContent=data.localPreview?'Lokale voorbeeldstand · er worden geen toestellen of leerlingen geteld':data.teacherPreview?'Leerkrachtvoorbeeld · je telt niet mee als leerling of gekoppeld toestel':`${data.registeredCount} van 50 gekoppelde toestellen · maximaal 30 leerlingen tegelijk`;loading.hidden=true;menu.hidden=false}catch(err){console.error(err);const[t,m]=messageFor(err);document.getElementById("errorTitle").textContent=t;document.getElementById("errorMessage").textContent=m;loading.hidden=true;error.hidden=false}}
if((explicitTeacherPreview||(!explicitStudentLink&&sessionStorage.getItem('zisa_teacher_preview')==='1')))document.getElementById('teacherExit').hidden=false;
document.getElementById("retryButton").addEventListener("click",open);open();
