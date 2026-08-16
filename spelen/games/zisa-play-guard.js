import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const cfg={apiKey:"AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw",authDomain:"zisa-spelletjesmaker-pro.firebaseapp.com",projectId:"zisa-spelletjesmaker-pro",storageBucket:"zisa-spelletjesmaker-pro.appspot.com",messagingSenderId:"828063957776",appId:"1:828063957776:web:8d8686b478846fe980db95"};
const gateZisaUrl=new URL('./start_afbeeldingen/zisa_toegang_controleren.png',import.meta.url).href;
const gate=document.createElement("div");gate.id="zisaPlayGate";gate.innerHTML=`<div><img src="${gateZisaUrl}" alt="Zisa kijkt je toegang na"><strong>Even je Zisa-toegang controleren…</strong></div>`;document.documentElement.append(gate);
const style=document.createElement("style");style.textContent="#zisaPlayGate{position:fixed;z-index:2147483647;inset:0;background:#fffaf1;display:grid;place-items:center;font:18px Arial;color:#17324d}#zisaPlayGate div{text-align:center}#zisaPlayGate img{display:block;width:clamp(120px,18vw,190px);height:auto;margin:0 auto 12px;animation:zisaGateHello 1.35s ease-in-out infinite alternate}#zisaPlayGate strong{display:block}#zisaPlayGate span{display:block;font-size:48px;margin-bottom:14px}#zisaPlayGate.error strong{display:block;max-width:520px;padding:20px}#zisaPlayGate a{display:inline-block;margin-top:18px;color:#1768ac}@keyframes zisaGateHello{to{transform:translateY(-5px) rotate(-1deg)}}@media(prefers-reduced-motion:reduce){#zisaPlayGate img{animation:none}}";document.head.append(style);
const app=getApps().length?getApp():initializeApp(cfg);getAuth(app);const functions=getFunctions(app,"europe-west1");const join=httpsCallable(functions,"joinPlayClass");const teacherCheck=httpsCallable(functions,"previewPlayClass");
const code=sessionStorage.getItem("zisa_play_code")||new URLSearchParams(location.search).get("code")||"";const deviceId=localStorage.getItem("zisa_play_device_id")||"";
const host=location.hostname.toLowerCase();
const isPrivateHost=host==='localhost'||host==='::1'||host==='0.0.0.0'||host.startsWith('127.')||host.startsWith('192.168.')||host.startsWith('10.')||(/^172\.(1[6-9]|2\d|3[01])\./).test(host);
const isLocalPreview=isPrivateHost&&(new URLSearchParams(location.search).get('preview')==='1'||sessionStorage.getItem('zisa_play_allowed')==='1');
const isTeacherPreview=sessionStorage.getItem('zisa_teacher_preview')==='1';
const discoverParams=new URLSearchParams(location.search);
if(discoverParams.get('ontdek')==='1')sessionStorage.setItem('zisa_discover_preview','1');
const isDiscoverPreview=sessionStorage.getItem('zisa_discover_preview')==='1';
const isColleaguePlay=sessionStorage.getItem('zisa_colleague_play')==='1';
const gamesRootUrl=new URL('./',import.meta.url);
const playHomeUrl=new URL('../index.html',import.meta.url).href;
const proHomeUrl=new URL('../../pro/zisa-spelen.html',import.meta.url).href;
document.documentElement.style.webkitTextSizeAdjust='100%';
addEventListener('DOMContentLoaded',()=>document.querySelectorAll('button,a,input,select,[role="button"]').forEach(el=>el.style.touchAction='manipulation'));
async function check(){try{if(!isLocalPreview&&!isDiscoverPreview&&!isColleaguePlay){if(isTeacherPreview)await teacherCheck({});else await join({code,deviceId})}gate.remove();return true}catch(e){gate.classList.add("error");gate.innerHTML=`<div><span>🔒</span><strong>Dit spel is momenteel niet beschikbaar.</strong><a href="${playHomeUrl}">Terug naar Zisa Spelen</a></div>`;return false}}
const file=(location.pathname.split('/').pop()||'').toLowerCase();
const folder=(location.pathname.split('/').filter(Boolean).at(-2)||'').toLowerCase();
const discoverAllowed=new Set([
  'start_leerjaar1.html','splits_spelletjes.html','splitsen_bibi.html','splits_bijenkorf.html','spelletjes_hoofdrekenen1.html','bloemenweide_keuze.html','bloemenweide_spel.html',
  'start_leerjaar2.html','tafel_overzicht.html','tafel_spelletjes.html','tafels.html','memory.html','zebrawinkel.html',
  'start_leerjaar3.html','tafel3_overzicht.html','tafel3_spelletjes.html','ganzenbord.html','ganzenbord_spel.html','woestijnjacht_keuze.html','woestijnjacht_spel.html','cactusmarkt.html',
  'start_leerjaar4.html'
]);
const discoverFolderAllowed=folder==='prototype_leerjaar4'||folder==='prototype_breuken4';
const startMatch=file.match(/^start_leerjaar([1234])\.html$/);if(startMatch)sessionStorage.setItem('zisa_play_grade',startMatch[1]);
const helpByFile={
  'splits_bijenkorf.html':{title:'De bijenkorf',steps:[['🔢','Kijk welke splitsing je ziet.'],['🐝','Zoek het stukje dat nog ontbreekt.'],['👆','Tik op het juiste antwoord.']]},
  'splits_bingo.html':{title:'Splitsbingo',steps:[['👀','Kijk naar de splitsing.'],['🧠','Reken het ontbrekende deel uit.'],['✅','Kies het antwoord en vul je bingokaart.']]},
  'honingpot.html':{title:'De honingpot',steps:[['👀','Kijk naar de splitsing.'],['🧠','Zoek het ontbrekende getal.'],['🍯','Kies juist en verzamel honing.']]},
  'bloemenweide_spel.html':{title:'De bloemenweide',steps:[['➕','Reken de som uit.'],['🌼','Zoek de bloem met het antwoord.'],['👆','Tik op die bloem.']]},
  'honingpot_vullen_spel.html':{title:'Honingpot vullen',steps:[['➕','Reken de som uit.'],['🔢','Tik het antwoord in.'],['🍯','Bij een juist antwoord vult de pot.']]},
  'bijenrace_spel.html':{title:'De bijenrace',steps:[['➕','Reken de som uit.'],['🔢','Tik het antwoord in.'],['🐝','Juist? Dan vliegt je bij verder.']]},
  'tafel_oefenen.html':{title:'Tafels oefenen',steps:[['✖️','Kijk naar de tafelsom.'],['🧠','Reken ze uit.'],['👆','Kies of typ het antwoord.']]},
  'tafels.html':{title:'Tafels oefenen',steps:[['✖️','Kijk naar de tafelsom.'],['🧠','Reken ze uit.'],['👆','Kies of typ het antwoord.']]},
  'memory.html':{title:'Tafelmemory',steps:[['🃏','Draai twee kaartjes om.'],['🔎','Zoek een som en het juiste antwoord.'],['⭐','Een juist paar blijft open.']]},
  'vierop1rij.html':{title:'Vier op een rij',steps:[['✖️','Los de tafelsom op.'],['🔵','Kies het juiste vakje.'],['🏆','Maak als eerste vier op een rij.']]},
  'ganzenbord_spel.html':{title:'Ganzenbord',steps:[['🎡','Draai aan het rad.'],['✖️','Los de tafelsom op.'],['🪿','Juist? Dan mag je verder.']]},
  'woestijnjacht_spel.html':{title:'Woestijnjacht',steps:[['✖️','Reken de tafelsom uit.'],['🏜️','Zoek het juiste antwoord.'],['👆','Tik snel op het antwoord.']]},
  'tornado.html':{title:'Tornado',steps:[['✖️','Reken de tafelsom uit.'],['🌵','Zoek de cactus met het antwoord.'],['👆','Tik op de juiste cactus.']]},
  'sombrero_spel.html':{title:'Sombrero',steps:[['✖️','Reken de tafelsom uit.'],['🌵','Zoek het juiste antwoord.'],['👆','Tik op het antwoord.']]},
  'level1.html':{title:'Tafeloefening',steps:[['👀','Kijk naar de oefening.'],['🧠','Reken rustig uit.'],['👆','Kies het juiste antwoord.']]},
  'level2.html':{title:'Tafeloefening',steps:[['👀','Kijk naar de oefening.'],['🧠','Reken rustig uit.'],['🔢','Vul het antwoord in.']]},
  'level3.html':{title:'Tafeloefening',steps:[['👀','Kijk goed naar de opdracht.'],['🧠','Reken de oefening uit.'],['✅','Geef het juiste antwoord.']]}
  ,'index.html':{title:'De Rekenkern',steps:[['✖️','Reken de maal- of deeltafel uit.'],['⚡','Tik één keer op het juiste antwoord.'],['🚪','Verzamel tien kernen en bereik de magische poort.']]}
};
// Elke oefenvorm in de Breukenstudio heeft een eigen, echte demo.
const help=folder==='prototype_breuken4'?null:helpByFile[file];
const uiStyle=document.createElement('style');uiStyle.textContent=`#zisaNavButton{position:fixed;z-index:2147483000;right:14px;top:12px;border:0;border-radius:999px;background:#173f73;color:#fff;padding:10px 15px;font:800 15px Arial;box-shadow:0 5px 18px #17324d55;touch-action:manipulation}#zisaNavPanel{position:fixed;z-index:2147483001;right:14px;top:60px;width:min(310px,calc(100vw - 28px));padding:16px;border:1px solid #d8e4ed;border-radius:18px;background:#fff;box-shadow:0 16px 40px #17324d44;font:16px Arial;color:#17324d}#zisaNavPanel[hidden]{display:none}#zisaNavPanel strong{display:block;margin:0 0 12px;font-size:18px}#zisaNavPanel a,#zisaNavPanel button{display:block;width:100%;margin:8px 0 0;padding:12px;border:0;border-radius:11px;text-decoration:none;text-align:center;font:800 15px Arial;background:#eef5fb;color:#174d79;touch-action:manipulation}#zisaNavPanel .primary{background:#1768ac;color:#fff}#zisaHelpOverlay,#zisaDiscoverPro{position:fixed;z-index:2147483600;inset:0;background:#17324db8;display:grid;place-items:center;padding:18px;font-family:Arial;color:#17324d}#zisaHelpOverlay[hidden],#zisaDiscoverPro[hidden]{display:none}#zisaHelpCard,#zisaDiscoverPro section{width:min(720px,100%);background:#fff;border-radius:26px;padding:25px;box-shadow:0 20px 60px #0005;text-align:center}#zisaDiscoverPro section{width:min(520px,100%)}#zisaDiscoverPro p{line-height:1.55;color:#52697c}#zisaDiscoverPro div{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}#zisaDiscoverPro button,#zisaDiscoverPro a{border:0;border-radius:12px;padding:12px 18px;font:800 16px Arial;text-decoration:none;background:#eef5fb;color:#174d79}#zisaDiscoverPro a{background:#1768ac;color:#fff}.zisa-pro-pill,.zisa-pro-choice span{display:inline-block;border-radius:999px;background:#ffd45c;color:#493300;padding:3px 8px;font-weight:900;font-size:.75rem}.zisa-pro-choice{cursor:pointer!important;opacity:.78}#zisaHelpCard h2{margin:0 0 20px;font-size:clamp(25px,4vw,38px)}.zisaHelpSteps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.zisaHelpStep{padding:17px 10px;border-radius:18px;background:#f3f8fc;font-weight:800;line-height:1.35;animation:zisaStep 1.8s ease-in-out infinite}.zisaHelpStep:nth-child(2){animation-delay:.35s}.zisaHelpStep:nth-child(3){animation-delay:.7s}.zisaHelpIcon{display:block;font-size:clamp(42px,7vw,70px);margin-bottom:8px}#zisaHelpActions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}#zisaHelpActions button{border:0;border-radius:13px;padding:13px 19px;font:800 16px Arial;background:#eef5fb;color:#174d79}#zisaHelpActions .start{background:#159668;color:#fff;font-size:18px}@keyframes zisaStep{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@media(max-width:650px){.zisaHelpSteps{grid-template-columns:1fr}.zisaHelpStep{display:flex;align-items:center;text-align:left;gap:15px;padding:10px 14px}.zisaHelpIcon{margin:0;font-size:42px}}`;
document.head.append(uiStyle);
function speakHelp(){if(!help||!('speechSynthesis'in window))return;speechSynthesis.cancel();const msg=new SpeechSynthesisUtterance(help.steps.map(s=>s[1]).join(' '));msg.lang='nl-BE';msg.rate=.88;speechSynthesis.speak(msg)}
function showHelp(){if(!help)return;let overlay=document.getElementById('zisaHelpOverlay');if(!overlay){overlay=document.createElement('div');overlay.id='zisaHelpOverlay';overlay.innerHTML=`<section id="zisaHelpCard" role="dialog" aria-modal="true" aria-label="Uitleg van het spel"><h2>${help.title}</h2><div class="zisaHelpSteps">${help.steps.map(s=>`<div class="zisaHelpStep"><span class="zisaHelpIcon">${s[0]}</span><span>${s[1]}</span></div>`).join('')}</div><div id="zisaHelpActions"><button type="button" id="zisaSpeakHelp">🔊 Luister</button><button type="button" class="start" id="zisaCloseHelp">▶ Ik snap het, spelen!</button></div></section>`;document.body.append(overlay);overlay.querySelector('#zisaSpeakHelp').onclick=speakHelp;overlay.querySelector('#zisaCloseHelp').onclick=()=>{if('speechSynthesis'in window)speechSynthesis.cancel();overlay.hidden=true}}overlay.hidden=false;sessionStorage.setItem('zisa_help_seen_'+file,'1')}
function replaceBackText(element,label){const cleanLabel=label.replace(/^←\s*/,'');const visibleLabel=element.querySelector('img')?cleanLabel:label;const visit=node=>{node.childNodes.forEach(child=>{if(child.nodeType===3&&child.nodeValue.trim().toLowerCase()==='terug')child.nodeValue=child.nodeValue.replace(/terug/i,visibleLabel);else if(child.nodeType===1)visit(child)})};visit(element);element.setAttribute('aria-label',cleanLabel);element.title=cleanLabel}
function clarifyExistingBackButtons(){const label=startMatch?'← Ander leerjaar':'← Vorige stap';document.querySelectorAll('button,a').forEach(element=>{const text=element.textContent.replace(/\s+/g,' ').trim().toLowerCase();if(text==='terug')replaceBackText(element,label)})}
function addZisaNavigation(){
  if(document.getElementById('zisaNavButton'))return;
  const folderGrade=folder.match(/([1-4])$/)?.[1];
  const grade=sessionStorage.getItem('zisa_play_grade')||startMatch?.[1]||folderGrade||'1',teacher=sessionStorage.getItem('zisa_teacher_preview')==='1';
  const fractionStudio=folder==='prototype_breuken4';
  const button=document.createElement('button');button.id='zisaNavButton';button.type='button';button.textContent=fractionStudio?'☰ Menu':'🏠 Ander spel kiezen';
  const panel=document.createElement('nav');panel.id='zisaNavPanel';panel.hidden=true;
  const gradeHomeUrl=new URL(`start_leerjaar${grade}.html`,gamesRootUrl).href;
  const discoverHomeUrl=new URL('../../ontdek/zisa-spelen.html',import.meta.url).href;
  panel.innerHTML=`<button type="button" id="zisaCloseNav" aria-label="Menu sluiten">✕ Sluiten</button><strong>Wat wil je doen?</strong>${fractionStudio?'<button type="button" class="primary" id="zisaFractionMenu">🧩 Andere oefenvorm in de Breukenstudio</button>':''}${help?'<button type="button" class="primary" id="zisaShowHelp">🔊 Leg het spel uit</button>':''}<a href="${gradeHomeUrl}">🎮 Ander spel van mijn leerjaar</a><a href="${isDiscoverPreview?discoverHomeUrl:playHomeUrl}">🔢 Een ander leerjaar kiezen</a>${teacher?`<a href="${proHomeUrl}">← Leerkracht: terug naar PRO</a>`:''}`;
  document.body.append(button,panel);
  button.onclick=()=>panel.hidden=!panel.hidden;
  panel.querySelector('#zisaCloseNav').onclick=()=>panel.hidden=true;
  document.addEventListener('pointerdown',event=>{if(!panel.hidden&&!panel.contains(event.target)&&event.target!==button)panel.hidden=true});
  if(fractionStudio)panel.querySelector('#zisaFractionMenu').onclick=()=>{panel.hidden=true;window.dispatchEvent(new CustomEvent('zisa:breuken-menu'))};
  if(help)panel.querySelector('#zisaShowHelp').onclick=()=>{panel.hidden=true;showHelp()}
}
function showDiscoverProMessage(){let modal=document.getElementById('zisaDiscoverPro');if(!modal){modal=document.createElement('div');modal.id='zisaDiscoverPro';modal.innerHTML=`<section role="dialog" aria-modal="true"><span class="zisa-pro-pill">PRO</span><h2>Dit spel hoort bij de volledige versie</h2><p>In Ontdek kun je per leerjaar enkele gekozen spellen volledig spelen. Met PRO krijg je alle spellen én een vaste leerling-QR.</p><div><button type="button">Sluiten</button><a href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">Bekijk PRO</a></div></section>`;document.body.append(modal);modal.querySelector('button').onclick=()=>modal.hidden=true;modal.onclick=e=>{if(e.target===modal)modal.hidden=true}}modal.hidden=false}
function protectDiscoverChoices(){if(!isDiscoverPreview)return;document.body.classList.add('zisa-discover');document.querySelectorAll('a[href]').forEach(link=>{const url=new URL(link.getAttribute('href'),location.href);if(url.origin!==location.origin||!url.pathname.includes('/spelen/games/'))return;const targetFile=(url.pathname.split('/').pop()||'').toLowerCase();const targetFolder=(url.pathname.split('/').filter(Boolean).at(-2)||'').toLowerCase();if(discoverAllowed.has(targetFile)||targetFolder==='prototype_leerjaar4'||targetFolder==='prototype_breuken4')return;link.classList.add('zisa-pro-choice');link.removeAttribute('href');link.setAttribute('role','button');link.setAttribute('tabindex','0');link.innerHTML=`${link.textContent.replace(/\s*→\s*$/,'').trim()} <span>PRO</span>`;link.onclick=showDiscoverProMessage;link.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showDiscoverProMessage()}}})}
function improveSettingsScreen(){
  const startButton=document.querySelector('#start-spel-knop,#startSpel,#startOefening,#startButton,#startKnop');
  const choiceGroups=[...document.querySelectorAll('.keuze-blok')];
  if(!startButton||(!choiceGroups.length&&!document.querySelector('.opties,.tafels-selectie')))return;
  if(!document.querySelector('link[data-zisa-settings]')){const link=document.createElement('link');link.rel='stylesheet';link.href='kind-spelinstellingen.css?v=1';link.dataset.zisaSettings='1';document.head.append(link)}
  document.body.classList.add('zisa-settings');
  const pageText=(document.body.textContent+' '+[...document.images].map(image=>image.src).join(' ')).toLowerCase();
  document.body.classList.add(pageText.includes('bibi')||pageText.includes('bijen')||pageText.includes('honing')?'zisa-theme-bibi':pageText.includes('karl')||pageText.includes('cactus')||pageText.includes('woestijn')?'zisa-theme-karl':'zisa-theme-zisa');
  const groups=choiceGroups.length>1?choiceGroups:[...document.querySelectorAll('.keuze-blok .opties,.keuze-blok .tafels-selectie')];
  const labelFor=group=>{
    if(group.querySelector('[data-players]')||group.id==='player-options')return'Met hoeveel spelers?';
    if(group.querySelector('[data-type],[data-operation]'))return'Wat wil je oefenen?';
    if(group.querySelector('[data-tafel],.tafel'))return'Welke tafels kies je?';
    if(group.querySelector('[data-max]'))return'Tot welk getal wil je splitsen?';
    if(group.querySelector('[data-level],.level'))return group.querySelector('.level')?'Kies hoe moeilijk':'Tot welk getal wil je rekenen?';
    return'Maak je keuze';
  };
  groups.forEach((group,index)=>{
    if(group.querySelector(':scope > .zisa-step-label'))return;
    const label=document.createElement('div');label.className='zisa-step-label';label.innerHTML=`<span class="zisa-step-number">${index+1}</span><span>${labelFor(group)}</span>`;
    if(choiceGroups.length>1)group.prepend(label);else{const heading=group.previousElementSibling;if(heading&&/^H[1-4]$/.test(heading.tagName))heading.classList.add('zisa-replaced-heading');group.parentElement.insertBefore(label,group)}
  });
  const choiceButtons=document.querySelectorAll('button.keuze,button.tafel,button.level');
  const syncSelected=()=>choiceButtons.forEach(button=>{const pressed=button.getAttribute('aria-pressed');if(pressed==='true')button.classList.add('selected');if(pressed==='false')button.classList.remove('selected')});
  choiceButtons.forEach(button=>button.addEventListener('click',()=>setTimeout(syncSelected,0)));
  syncSelected();
  if(!startButton.closest('.zisa-start-step')){const wrapper=document.createElement('div');wrapper.className='zisa-start-step';const label=document.createElement('div');label.className='zisa-step-label';label.innerHTML=`<span class="zisa-step-number">${groups.length+1}</span><span>Klaar? Start het spel!</span>`;startButton.parentNode.insertBefore(wrapper,startButton);wrapper.append(label,startButton)}
}
function suppressDuplicateTabletKeyboard(){
  if(!document.querySelector('.toetsenbord,.numeric-keypad,.numpad,#toetsenbord'))return;
  document.querySelectorAll('input[type="number"],input[type="text"],input[type="tel"]').forEach(input=>{
    input.readOnly=true;
    input.setAttribute('inputmode','none');
    input.setAttribute('autocomplete','off');
    input.addEventListener('focus',()=>input.blur());
  });
}
function readyUi(){const build=()=>{clarifyExistingBackButtons();addZisaNavigation();improveSettingsScreen();suppressDuplicateTabletKeyboard();protectDiscoverChoices()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build()}
check().then(ok=>{if(ok){if(isDiscoverPreview&&!discoverAllowed.has(file)&&!discoverFolderAllowed){gate.classList.add('error');gate.innerHTML=`<div><span>⭐</span><strong>Dit spel is beschikbaar in PRO.</strong><a href="${new URL('../../ontdek/zisa-spelen.html',import.meta.url).href}">Terug naar de Ontdek-spellen</a></div>`;document.documentElement.append(gate);return}readyUi();if(help&&!sessionStorage.getItem('zisa_help_seen_'+file)){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>showHelp(),{once:true});else showHelp()}if(!isLocalPreview&&!isTeacherPreview&&!isDiscoverPreview&&!isColleaguePlay)setInterval(()=>join({code,deviceId}).catch(()=>location.href=playHomeUrl),120000)}});
