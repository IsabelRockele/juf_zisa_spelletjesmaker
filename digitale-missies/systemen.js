/* Real, device-local input and output. Nothing is uploaded. */
const startMissionWithScreenTasks=startMission;
startMission=function(id){
 if(id!=='systemen')return startMissionWithScreenTasks(id);
 cleanupPractice();window.speechSynthesis?.cancel();
 $('#missionNumber').textContent='VOOR DE LEERKRACHT · 6-8 JAAR';
 $('#missionTitle').textContent='Slimme systemen - iPad-opdrachtkaarten';
 body.innerHTML=`<section class="ipad-card-hub"><img src="assets/slimme-systemen.png" alt=""><div><h2>Echte iPads. Samen doen.</h2><p>Druk de kaartjes af. De kinderen werken in groepjes met Camera, Foto’s, Notities en Dictafoon op hun eigen iPad.</p><p><strong>8 opdrachtkaarten · 2 per A4</strong><br>Met korte stappen, extra uitdaging voor 7-8 jaar en twee leerkrachtenpagina’s.</p><a class="primary-button" href="assets/zisas-ipad-opdrachtkaarten.pdf" target="_blank" rel="noopener">Open de kaartjes en druk af</a><a class="text-button" href="assets/zisas-ipad-opdrachtkaarten.pdf" download="Zisas-iPad-opdrachtkaarten.pdf">Download de PDF</a><p class="hub-hint">Print pagina 1-4 op A4, enkelzijdig. Knip de kaarten uit. Lees één kaart voor, toon de echte knoppen en laat de kinderen van rol wisselen.</p></div><div class="hub-topics"><span>Foto’s en details</span><span>Geluidsraadsel</span><span>Tekenen en typen</span><span>Filmen en pauzeren</span></div><p>Deze opdrachten voer je op de iPad uit, niet in dit oefenscherm. De leerkracht observeert; openen of afdrukken levert geen oefenpunten op.</p></section>`;
 dialog.showModal();
};
const renderWithScreenTasks=render;
render=function(){renderWithScreenTasks();const tile=grid.querySelector?.('[data-id="systemen"]');if(tile){tile.querySelector('.status').textContent='8 afdrukbare kaartjes';tile.querySelector('p').textContent='Groepsopdrachten met de echte apps op jullie iPads.';tile.querySelector('.card-foot').textContent='Voor de leerkracht · print en doe';}};
render();
function systemShell(title){
 const area=$('#taskArea');
 area.innerHTML=`<section class="work-panel system-lab"><h3>${title}</h3><div class="system-guide"><strong></strong><button data-repeat aria-label="Luister nog eens">${speakerIcon}</button></div><div class="system-work"></div><p class="system-status" role="status"></p><details><summary>Voor de leerkracht</summary><p>Observeer bij het eigen resultaat: wat gaf het kind aan het toestel, wat deed de app ermee en wat kwam eruit? Alleen klikken bewijst dit begrip niet. Foto's blijven in deze browser; stemopnamen verdwijnen bij het verlaten van de opdracht.</p></details><button data-help>Hulp van de leerkracht</button></section>`;
 let words='';
 const say=(short,text=short)=>{words=text;area.querySelector('.system-guide strong').textContent=short;speak(text);};
 area.querySelector('[data-repeat]').onclick=()=>speak(words);
 return {area,work:area.querySelector('.system-work'),say,status:text=>{area.querySelector('.system-status').textContent=text;speak(text);}};
}
function systemFallback(task){
 cleanupPractice();window.speechSynthesis?.cancel();
 renderObservation({...task,requiresObservation:true,criteria:'Voer de opdracht uit in een echte camera- of opname-app met de leerkracht. Observeer bediening én uitleg bij invoer, verwerking en uitvoer. Geen automatisch oefenbewijs bij overslaan.'});
 speak('Vraag je leerkracht om samen deze opdracht op het toestel te doen.');
}
function renderSystemPhoto(task){
 const ui=systemShell('Fotoatelier');let image=null,url=null,alive=true,zoomed=false,saved=false,opened=false;
 const key=task.name+'-'+state.age;
 ui.work.innerHTML=`<div class="photo-picker"><label class="system-pick">Foto maken<input data-camera type="file" accept="image/*" capture="environment"></label></div><div class="system-photo-edit" hidden><canvas width="800" height="600" aria-label="Jouw foto"></canvas><label class="photo-zoom">Vergroot het detail <input data-zoom type="range" min="1" max="3" step="0.1" value="1" aria-label="Foto vergroten"></label><button data-save disabled>Bewaar de detailfoto</button></div><div class="system-photo-saved" hidden><button data-open>Open mijn bewaarde foto</button></div><button data-finish hidden>Klaar</button>`;
 ui.say('Maak een foto van je voorwerp.',task.subject+' Tik op Foto maken. Opent de camera niet? Vraag je leerkracht om hulp.');
 const canvas=ui.work.querySelector('canvas'),ctx=canvas.getContext('2d');
 const paint=()=>{const zoom=Number(ui.work.querySelector('[data-zoom]').value),scale=Math.min(800/image.naturalWidth,600/image.naturalHeight)*zoom;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,800,600);ctx.drawImage(image,(800-image.naturalWidth*scale)/2,(600-image.naturalHeight*scale)/2,image.naturalWidth*scale,image.naturalHeight*scale);};
 const choose=e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')||file.size>20*1024*1024)return ui.status('Kies een foto van minder dan 20 MB. Vraag je leerkracht om hulp.');
  if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);const candidate=new Image();
  candidate.onload=()=>{if(!alive||candidate.src!==url)return;image=candidate;zoomed=false;saved=false;opened=false;ui.work.querySelector('[data-zoom]').value='1';ui.work.querySelector('[data-save]').disabled=true;ui.work.querySelector('.system-photo-edit').hidden=false;ui.work.querySelector('.system-photo-saved').hidden=true;ui.work.querySelector('[data-finish]').hidden=true;paint();ui.say('Vergroot een detail.','Je foto staat op het scherm. Schuif het bolletje naar rechts. Maak het detail groter zodat je maatje het goed kan zien.');};
  candidate.onerror=()=>{if(alive)ui.status('Deze foto kan hier niet geopend worden. Kies een andere foto of vraag hulp.');};candidate.src=url;
 };
 ui.work.querySelector('[data-camera]').onchange=choose;
 ui.work.querySelector('[data-zoom]').oninput=()=>{if(!image)return;paint();zoomed=Number(ui.work.querySelector('[data-zoom]').value)>=(state.age==='7-8'?1.8:1.4);ui.work.querySelector('[data-save]').disabled=!zoomed;};
 ui.work.querySelector('[data-zoom]').onchange=()=>{if(zoomed)ui.say('Bewaar je detailfoto.','Dit stukje is nu groter. Tik op Bewaar de detailfoto.');};
 ui.work.querySelector('[data-save]').onclick=()=>{if(!image||!zoomed)return;try{saveWork(key,{kind:'system-photo',src:canvas.toDataURL('image/jpeg',.85)});saved=true;ui.work.querySelector('.system-photo-edit').hidden=true;ui.work.querySelector('.system-photo-saved').hidden=false;ui.say('Open je bewaarde foto.','Je foto is bewaard op dit toestel. Tik nu op Open mijn bewaarde foto.');}catch{ui.status('Bewaren lukt niet. De opslag kan vol zijn. Vraag hulp; je kunt nog niet afronden.');}};
 ui.work.querySelector('[data-open]').onclick=()=>{if(!saved)return;const photo=readWork()[key];if(!photo?.src)return ui.status('De bewaarde foto is niet gevonden. Probeer opnieuw.');ui.work.querySelector('.system-photo-saved').innerHTML=`<img class="system-result" alt="Jouw bewaarde detailfoto"><p>Dit is jouw bewaarde detailfoto.</p>`;ui.work.querySelector('.system-result').src=photo.src;opened=true;ui.work.querySelector('[data-finish]').hidden=false;ui.say('Toon je foto aan je maatje.','Hier is je bewaarde detailfoto. Je gaf de app een foto. De app vergrootte het beeld. Op het scherm zie je het resultaat. Toon je foto aan je maatje en tik dan op Klaar.');};
 ui.work.querySelector('[data-finish]').onclick=()=>{if(opened)completePractice(task,'Je opende een foto, vergrootte een detail, bewaarde het resultaat en opende dat opnieuw. Leg aan je leerkracht uit wat de app met je foto deed.');};
 ui.area.querySelector('[data-help]').onclick=()=>systemFallback(task);
 cleanupPractice=()=>{alive=false;if(url)URL.revokeObjectURL(url);window.speechSynthesis?.cancel();};
}
function renderSystemSound(task){
 const ui=systemShell('Geluidsatelier');let stream,recorder,url,alive=true,started=0,chunks=[],valid=false,heard=false;
 ui.work.innerHTML=`<div class="sound-actions"><button data-record aria-label="Opnemen"><span class="record-dot" aria-hidden="true"></span> Opnemen</button><button data-stop disabled>${mediaIcon('stop')} Stop</button><button data-play disabled>${mediaIcon('play')} Luisteren</button></div><audio hidden></audio><button data-finish hidden>Klaar</button>`;
 const audio=ui.work.querySelector('audio'),record=ui.work.querySelector('[data-record]'),stop=ui.work.querySelector('[data-stop]'),play=ui.work.querySelector('[data-play]');
 ui.say('Maak een geluidsbericht.',task.message+' Tik op de rode opnameknop. Spreek daarna. Ben je klaar met spreken? Tik op het vierkant om te stoppen.');
 record.onclick=async()=>{
  window.speechSynthesis?.cancel();audio.pause();record.disabled=true;play.disabled=true;ui.area.querySelector('[data-repeat]').disabled=true;heard=false;valid=false;ui.work.querySelector('[data-finish]').hidden=true;
  try{if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('unavailable');stream=await navigator.mediaDevices.getUserMedia({audio:true});if(!alive){stream.getTracks().forEach(t=>t.stop());return;}chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(!alive)return;valid=Date.now()-started>=1500&&chunks.length>0;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));audio.src=url;record.disabled=false;play.disabled=!valid;if(valid)ui.say('Luister naar jouw opname.','Je stem is opgenomen. Tik op de driehoek om te luisteren.');else ui.say('Probeer nog eens.','Je opname was heel kort. Tik weer op de rode knop en spreek je hele boodschap.');};
   recorder.start();started=Date.now();stop.disabled=false;ui.area.querySelector('.system-guide strong').textContent='Spreek nu. Tik daarna op het vierkant.';
  }catch{stream?.getTracks().forEach(t=>t.stop());record.disabled=false;ui.area.querySelector('[data-repeat]').disabled=false;ui.status('De microfoon werkt hier niet of is niet toegestaan. Vraag je leerkracht om hulp.');}
 };
 stop.onclick=()=>{if(recorder?.state==='recording')recorder.stop();stop.disabled=true;ui.area.querySelector('[data-repeat]').disabled=false;};
 play.onclick=async()=>{if(!valid)return;window.speechSynthesis?.cancel();audio.currentTime=0;try{await audio.play();ui.area.querySelector('.system-guide strong').textContent='Luister naar je eigen stem.';}catch{ui.status('Afspelen lukt niet. Tik opnieuw op luisteren.');}};
 audio.onended=()=>{if(!valid)return;heard=true;ui.work.querySelector('[data-finish]').hidden=false;ui.say('Laat je maatje luisteren.','Jij sprak in de microfoon. De app maakte een opname. Via de luidspreker hoorde je jouw stem terug. Laat je maatje ook luisteren. Niet duidelijk? Neem opnieuw op. Anders tik je op Klaar.');};
 ui.work.querySelector('[data-finish]').onclick=()=>{if(valid&&heard)completePractice(task,'Je nam je eigen geluid op en luisterde het terug. Vertel je leerkracht waar het geluid binnenkwam en waar het weer uitkwam.');};
 ui.area.querySelector('[data-help]').onclick=()=>systemFallback(task);
 cleanupPractice=()=>{alive=false;if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());audio.pause();if(url)URL.revokeObjectURL(url);window.speechSynthesis?.cancel();};
}
