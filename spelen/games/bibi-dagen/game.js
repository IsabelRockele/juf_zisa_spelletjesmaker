(() => {
 'use strict';
 const days=['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'];
 const names={'-2':'eergisteren','-1':'gisteren',0:'vandaag',1:'morgen',2:'overmorgen'};
 const modes={step:'🐝 Dagensprongen',listen:'🍾 Flessenpost',order:'🌉 De weekbrug',plan:'🎉 De feestplanner'};
 const modeHelp={step:'Kies gisteren, vandaag of morgen in de cirkel.',listen:'Kies een fles en los de dagenvraag op.',order:'Leg de dagen in de juiste volgorde.',plan:'Leg een activiteit op de juiste kalenderdag.'};
 const activities=['schelpen zoeken','een zandkasteel bouwen','varen','picknicken','bloemen planten','dansen','een vlieger oplaten'];
 const pastActivities={'schelpen zoeken':'zochten we schelpen','een zandkasteel bouwen':'bouwden we een zandkasteel','varen':'voeren we','picknicken':'picknickten we','bloemen planten':'plantten we bloemen','dansen':'dansten we','een vlieger oplaten':'lieten we een vlieger op'};
 const app=document.querySelector('#app'); let level=1,mode='step',sound=true,deck=[],index=0,wrong=0,helped=0,done=false,busy=false,token=0;
 const mod=n=>(n%7+7)%7,rand=n=>Math.floor(Math.random()*n);
 const art=i=>`<span class="art" style="background-image:url('${days[i]||'feest'}.png')" aria-hidden="true"></span>`;
 const bee='bibi-dagenavontuur.png';
 const cancel=()=>{document.querySelector('.flower-reward')?.remove();token++;window.speechSynthesis?.cancel();busy=false;};
 function speak(text,after){
  window.speechSynthesis?.cancel();
  if(!sound||!('speechSynthesis' in window)){after?.();return;}
  const u=new SpeechSynthesisUtterance(text);u.lang='nl-BE';u.rate=.8;
  const voices=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('nl'));
  // Prefer known female Dutch voices when installed; never fake a female voice with pitch.
  const female=/dena|colette|fenna|lotte|claire|laura|hanna|\bfemale\b|vrouw/i;
  u.voice=voices.find(v=>v.lang==='nl-BE'&&female.test(v.name))||voices.find(v=>female.test(v.name))||voices.find(v=>v.lang==='nl-BE')||voices[0]||null;
  if(u.voice)u.lang=u.voice.lang;
  let ended=false;const finish=()=>{if(ended)return;ended=true;after?.();};u.onend=finish;u.onerror=finish;speechSynthesis.speak(u);
  // Some browsers omit end events; retain a usable game in that case.
  if(after)setTimeout(finish,Math.max(4000,text.length*100));
 }
 document.querySelector('#sound').onclick=()=>{sound=!sound;const b=document.querySelector('#sound');b.textContent=sound?'🔊 Geluid aan':'🔇 Geluid uit';b.setAttribute('aria-pressed',String(sound));if(!sound)window.speechSynthesis?.cancel();};
 function preview(){return days.map((d,i)=>`<div class="day"><button data-hear="${i}" aria-label="Luister: ${d}">${art(i)}<strong>${d}</strong> 🔊</button></div>`).join('');}
 function home(){cancel();app.innerHTML=`<section class="panel"><div class="intro"><div><div class="eyebrow">Spelen • luisteren • ontdekken</div><h1>Bibi’s dagenavontuur</h1><p>Help je mee met het eilandfeest?<br>Oefen de dagen en verzamel acht feestbloemen.</p><button id="intro">🔊 Vertel het mij</button></div><img class="bee" src="${bee}" alt="Bibi de bij"></div><div class="week-preview">${preview()}</div><div class="levels"><button data-level="1" class="${level===1?'selected':''}" aria-pressed="${level===1}">Level 1<small>Vandaag, gisteren en morgen</small></button><button data-level="2" class="${level===2?'selected':''}" aria-pressed="${level===2}">Level 2<small>Ook eergisteren en overmorgen</small></button></div><p class="choose-label">Kies één spel. Je blijft in dit spel tot de ronde klaar is.</p><div class="modes">${Object.entries(modes).map(([id,label])=>`<button data-mode="${id}" class="${mode===id?'selected':''}" aria-pressed="${mode===id}"><span>${label}</span><small>${modeHelp[id]}</small></button>`).join('')}</div><button class="primary" id="start">Start ${modes[mode]} →</button><p class="note">Geen tijdsdruk. Foutje? Bibi helpt met pijltjes en uitleg.</p>${!('speechSynthesis' in window)?'<p class="audio-note">Deze browser ondersteunt geen voorleesstem. Probeer Edge of Chrome voor geluid.</p>':''}</section>`;
  app.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=Number(b.dataset.level);home();});app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;home();});bindHear();app.querySelector('#intro').onclick=()=>speak('Hallo! Ik ben Bibi. Tik op een dag om de naam te horen. Kies een level en druk op start. We verdienen samen bloemen voor het eilandfeest. Bij een foutje help ik je.');app.querySelector('#start').onclick=start;
 }
 function bindHear(){app.querySelectorAll('[data-hear]').forEach(b=>b.onclick=()=>{if(!busy)speak(days[Number(b.dataset.hear)]);});}
 function makeQuestion(kind,offset,base){const today=base??rand(7),delta=offset??(level===1?[-1,1]:[-2,-1,1,2])[rand(level===1?2:4)];return {kind,today,delta:kind==='order'?1:delta,activity:activities[rand(activities.length)],target:kind==='listen'?today:mod(today+(kind==='order'?1:delta))};}
 const recentQuestions=new Map();
 function questionKey(q){return q.kind==='listen'?(q.mission==='count'?'count':`${q.mission}:${q.today}:${q.delta}:${q.anchorOffset||0}:${q.mission==='recognize'?q.activity:''}`):q.kind==='order'?`${q.today}:${q.missing.join(',')}`:`${q.today}:${q.delta}:${q.anchorOffset||0}`;}
 function buildDeck(){
  const previous=new Set(recentQuestions.get(`${mode}:${level}`)||[]),used=new Set(),dayCounts=Array(7).fill(0),activityCounts=new Map(),result=[];
  const offsets=level===1?[1,-1,1,-1,-1,1,1,-1]:[1,-1,2,-2,-2,2,-2,1];
  const patterns=[[1,2,4,5],[1,3,4,6],[2,3,5,6]];
  for(let slot=0;slot<8;slot++){
   const anchorOffset=mode==='step'&&slot===4?(level===2?-2:-1):mode==='step'&&slot===7?(level===2?2:1):0;
   const delta=anchorOffset?-anchorOffset:offsets[slot],candidates=[];
   for(let day=0;day<7;day++)for(const activity of activities){
    const q={kind:mode,today:day,delta:mode==='order'?1:delta,activity,target:mode==='listen'?day:mod(day+(mode==='order'?1:delta))};
    if(anchorOffset)q.anchorOffset=anchorOffset;
    if(mode==='listen'){
     q.mission=['count','relative','reverse','order','relative','order','reverse','recognize'][slot];q.bottleId=slot+1;
     if(q.mission==='count'){q.target=7;q.delta=0;}
     else if(q.mission==='reverse'){q.anchorOffset=slot===2?(level===2?-2:-1):(level===2?2:1);q.delta=-q.anchorOffset;q.target=mod(day+q.delta);}
     else if(q.mission==='order'){q.delta=slot===3?1:-1;q.target=mod(day+q.delta);}
     else if(q.mission==='relative')q.target=mod(day+q.delta);
    }
    if(mode==='order'){for(const missing of patterns)candidates.push({...q,missing:[...missing]});}else candidates.push(q);
   }
   const last=result[result.length-1];
   const score=q=>(previous.has(questionKey(q))?1000:0)+dayCounts[q.today]*30+(last?.today===q.today?15:0)+(last?.target===q.target?8:0)+(['listen','plan'].includes(mode)?(activityCounts.get(q.activity)||0)*20:0);
   const available=shuffle(candidates).filter(q=>!used.has(questionKey(q)));available.sort((a,b)=>score(a)-score(b));
   const chosen=available[0];result.push(chosen);used.add(questionKey(chosen));dayCounts[chosen.today]++;activityCounts.set(chosen.activity,(activityCounts.get(chosen.activity)||0)+1);
  }
  recentQuestions.set(`${mode}:${level}`,result.map(questionKey));return result;
 }
 function start(){cancel();index=0;helped=0;deck=buildDeck();if(mode==='listen')bottleMap();else renderQuestion();}
 function bottleMap(){cancel();const ordered=[...deck].sort((a,b)=>a.bottleId-b.bottleId);
  app.innerHTML=`<section class="panel bottle-map-panel"><div class="topline"><button id="menu">← Kies een spel</button><span>Level ${level} · ${index} / 8 klaar</span></div><h1>Bibi’s flessenpost</h1><p class="instruction">Kies een fles op het strand. Elke fles heeft een andere vraag.</p><div class="bottle-selection">${ordered.map(q=>`<button class="map-bottle ${q.completed?'finished-bottle':''}" data-bottle-id="${q.bottleId}" ${q.completed?'disabled':''} aria-label="Fles ${q.bottleId}${q.completed?', klaar':''}"><img src="flessenpost-fles.png" alt=""><span>${q.completed?'✓':q.bottleId}</span><small>${q.completed?'Klaar!':'Open fles'}</small></button>`).join('')}</div><p class="note">${index} van 8 flessen opgelost · ${index} feestbloemen verzameld</p></section>`;
  app.querySelector('#menu').onclick=home;app.querySelectorAll('[data-bottle-id]').forEach(b=>b.onclick=()=>{const pos=deck.findIndex(q=>q.bottleId===Number(b.dataset.bottleId));if(pos<index||deck[pos].completed)return;[deck[index],deck[pos]]=[deck[pos],deck[index]];renderQuestion();});speak('Kies een fles. De lichte flessen met een vinkje zijn al klaar.');
 }
 function questionText(q){if(q.mission==='count')return 'Hoeveel dagen telt één week?';if(q.mission==='order')return `Welke dag komt ${q.delta<0?'vóór':'na'} ${days[q.today]}?`;if(q.anchorOffset)return `${reference(q)[0].toUpperCase()+reference(q).slice(1)} ${q.anchorOffset<0?'was':'is'} het ${days[q.today]}. Welke dag is het dan vandaag?`;if(q.kind==='listen'&&q.mission==='recognize')return `Op ${days[q.target]} gaat Bibi ${q.activity}. Welke dag hoorde je?`;if(q.kind==='order')return `Welke dag komt na ${days[q.today]}?`;if(q.kind==='plan')return `Vandaag is het ${days[q.today]}. ${names[q.delta][0].toUpperCase()+names[q.delta].slice(1)} ${q.delta<0?pastActivities[q.activity]:`gaan we ${q.activity}`}. Welke dag ${q.delta<0?'was':'is'} dat?`;return `Vandaag is het ${days[q.today]}. Welke dag ${q.delta<0?'was':'is'} het ${names[q.delta]}?`;}
 const reference=q=>names[q.anchorOffset||0];
 const asked=q=>q.anchorOffset?'vandaag':names[q.delta];
 const relativeName=(q,offset)=>names[offset+(q.anchorOffset||0)];
 const activityIcons=['🐚','🏰','⛵','🧺','🌷','🎵','🪁'];
 let playerStep=0,selectedPlank=null,bridgeMissing=[],bridgeStart=0,parcelReady=false;
 const angleFor=i=>-Math.PI/2+i*Math.PI*2/7;
 const circlePos=(i,r=175)=>({x:50+Math.cos(angleFor(i))*r/5,y:50+Math.sin(angleFor(i))*r/5});
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
 function party(){return `<div class="party-scene" aria-label="Het feest groeit: ${index} versieringen"><img src="feest.png" alt="Bibi’s feestplek"><div class="party-sky">${['🌸','🌼','🌸','🌼','🌸','🌼','🌸','🌼'].map((v,i)=>`<span class="decoration ${i<index?'earned':''}" style="--n:${i}">${v}</span>`).join('')}</div><strong>Feestbloemen <span id="party-count">${index} / 8</span></strong></div>`;}
 function flightBoard(q){return `<div class="flight-scene"><div class="week-circle flight-circle"><svg viewBox="0 0 500 500" aria-hidden="true"><circle cx="250" cy="250" r="175" fill="none" stroke="#73b5ae" stroke-width="5" stroke-dasharray="8 7"/></svg><div class="circle-center"><strong>Kies een dag!</strong><small>Na zondag<br>komt maandag</small></div>${days.map((d,i)=>{const pos=circlePos(i);return `<button class="stone ${i===q.today?'today':''}" data-day="${i}" aria-label="Kies ${d}" style="left:${pos.x}%;top:${pos.y}%">${art(i)}<strong>${d}</strong><small>${i===q.today?reference(q):''}</small></button>`;}).join('')}<img class="player-bee" src="${bee}" alt="Bibi staat bij ${days[q.today]}"></div></div>`;}
 function activity(q){return activityIcons[activities.indexOf(q.activity)]||'🎉';}
 function gameArea(q){
  if(q.kind==='step')return flightBoard(q);
  if(q.kind==='listen'){const count=q.mission==='count',options=shuffle(count?[5,7,10]:[q.target,mod(q.target+2),mod(q.target+5)]);return `<div class="bottle-beach"><img class="beach-bibi" src="${bee}" alt="Bibi wacht op de post"><button id="bottle" aria-label="Luister opnieuw naar de flessenpost"><img class="bottle-picture" src="flessenpost-fles.png" alt="Een fles met een brief"><strong>Fles ${q.bottleId}</strong></button><div id="letter" hidden><p>${questionText(q)}</p><span>${count?'Kies het juiste aantal.':'Kies de juiste dag.'}</span></div><div class="shells" hidden>${options.map(i=>`<div class="day shell" data-card="${i}"><button data-answer="${i}" aria-label="Kies ${count?i+' dagen':days[i]}">${count?`<span class="week-number">${i}</span><strong>dagen</strong>`:art(i)+`<strong>${days[i]}</strong>`}</button><button class="listen" ${count?'data-number-hear':'data-hear'}="${i}" aria-label="Luister: ${count?i+' dagen':days[i]}">🔊</button></div>`).join('')}</div></div>`;}
  if(q.kind==='order'){bridgeStart=q.today;bridgeMissing=[...q.missing];q.today=mod(bridgeStart+bridgeMissing[0]-1);q.target=mod(bridgeStart+bridgeMissing[0]);return `<div class="bridge-river"><div class="bridge-bank">🏝️</div><div class="bridge-slots">${days.map((_,i)=>`<div class="plank-slot ${bridgeMissing.includes(i)?'empty':'placed'}" data-slot="${i}" ${bridgeMissing.includes(i)?'':'aria-label="'+days[mod(bridgeStart+i)]+'"'}>${bridgeMissing.includes(i)?'<span>?</span>':`${art(mod(bridgeStart+i))}<strong>${days[mod(bridgeStart+i)]}</strong>`}</div>`).join('')}</div><div class="bridge-bank">🎉</div><img class="bridge-bee" src="${bee}" alt="Bibi wacht op de brug"></div><p class="bridge-instruction">Leg de dagplank op het knipperende plekje.</p><div class="plank-tray">${shuffle(bridgeMissing.map(i=>mod(bridgeStart+i))).map(i=>`<div class="day plank" data-card="${i}"><button data-plank="${i}" draggable="true" aria-label="Pak de plank ${days[i]}">${art(i)}<strong>${days[i]}</strong></button><button class="listen" data-hear="${i}" aria-label="Luister: ${days[i]}">🔊</button></div>`).join('')}</div>`;}
  return `<div class="planner-scene"><div class="planner-table"><button class="activity-parcel" id="parcel" draggable="true" aria-pressed="false"><span>${activity(q)}</span><strong>${q.activity}</strong><small>Tik om te pakken</small></button><p id="parcel-status">Pak het kaartje en leg het op de kalender.</p></div><div class="calendar">${days.map((d,i)=>`<button data-calendar="${i}" aria-label="Leg het kaartje op ${d}" class="calendar-day ${i===q.today?'calendar-today':''}">${art(i)}<strong>${d}</strong><small>${i===q.today?'vandaag':'＋'}</small><span class="placed-activity"></span></button>`).join('')}</div><div class="calendar-audio">${days.map((d,i)=>`<button data-hear="${i}" aria-label="Luister: ${d}">🔊<small>${d}</small></button>`).join('')}</div></div>`;
 }
 function renderQuestion(){
  cancel();wrong=0;done=false;playerStep=0;selectedPlank=null;parcelReady=false;
  const q=deck[index],heading=q.kind==='listen'?`Flessenpost · fles ${q.bottleId}`:q.kind==='order'?'Bouw de weekbrug naar het feest!':questionText(q);
  const instruction={step:'Tik op de juiste dag in de cirkel.',listen:'Luister en los de vraag uit de fles op.',order:'Pak een dagplank. Tik daarna op het knipperende plekje.',plan:'Pak het activiteitenkaartje. Leg het op de juiste dag.'}[q.kind];
  const area=gameArea(q);
  app.innerHTML=`<section class="panel game-panel"><div class="topline"><button id="menu">← Kies een spel</button><span>Level ${level} · ${index+1} / 8</span><div class="progress" aria-label="${index} van 8 feestbloemen">${Array.from({length:8},(_,i)=>`<span aria-hidden="true" class="petal ${i<index?'earned':''}">🌸</span>`).join('')}</div></div>${party()}<div class="question"><img src="${bee}" alt="Bibi"><div><div class="eyebrow">${modes[q.kind]}</div><h2>${heading}</h2></div><button class="listen" id="repeat" aria-label="Lees de opdracht opnieuw voor">🔊</button></div><p class="instruction">${instruction}</p><div class="feedback" role="status" aria-live="polite">${q.kind==='step'||q.kind==='plan'?`In dit spel: ${reference(q)} = ${days[q.today]}.`:'Help Bibi op weg naar het eilandfeest!'}</div><div id="support"></div><div class="play-area">${area}</div><div class="actions"><button id="help">👣 Help mij</button><button class="primary" id="next" hidden>Volgende →</button></div></section>`;
  app.querySelector('#menu').onclick=home;
  app.querySelector('#repeat').onclick=()=>{if(!busy)speak(q.kind==='order'?`Bouw de weekbrug. Welke dag komt na ${days[q.today]}?`:questionText(q));};
  bindHear();app.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.answer)));
  app.querySelector('#help').onclick=()=>hint(true);app.querySelector('#next').onclick=()=>{if(++index===8)finish();else if(mode==='listen')bottleMap();else renderQuestion();};
  if(q.kind==='step'){
   positionPlayer();app.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>chooseDay(Number(b.dataset.day)));
  }else if(q.kind==='listen'){
   app.querySelectorAll('[data-number-hear]').forEach(b=>b.onclick=()=>speak(b.dataset.numberHear+' dagen'));app.querySelector('#bottle').onclick=()=>{app.querySelector('#bottle').classList.add('opened');app.querySelector('#letter').hidden=false;app.querySelector('.shells').hidden=false;speak(questionText(q));};app.querySelector('#bottle').classList.add('opened');app.querySelector('#letter').hidden=false;app.querySelector('.shells').hidden=false;
  }else if(q.kind==='order'){
   markBridgeSlot();app.querySelectorAll('[data-plank]').forEach(b=>{
    const pick=()=>{if(done||busy)return;selectedPlank=Number(b.dataset.plank);app.querySelectorAll('.plank').forEach(p=>p.classList.remove('selected'));b.closest('.plank').classList.add('selected');speak(days[selectedPlank]);};
    b.onclick=pick;b.ondragstart=e=>{pick();e.dataTransfer.setData('text/plain',b.dataset.plank);};
   });app.querySelectorAll('[data-slot]').forEach(slot=>{slot.onclick=()=>placePlank(Number(slot.dataset.slot));slot.ondragover=e=>e.preventDefault();slot.ondrop=e=>{e.preventDefault();placePlank(Number(slot.dataset.slot));};});
  }else{
   const parcel=app.querySelector('#parcel');const pick=()=>{if(done||busy)return;parcelReady=true;parcel.setAttribute('aria-pressed','true');app.querySelector('#parcel-status').textContent='Kies nu een dag op de kalender.';};parcel.onclick=pick;parcel.ondragstart=e=>{pick();e.dataTransfer.setData('text/plain','activity');};
   app.querySelectorAll('[data-calendar]').forEach(b=>{const place=()=>{if(done||busy)return;if(!parcelReady){speak('Pak eerst het activiteitenkaartje.');return;}const day=Number(b.dataset.calendar);if(day===q.target)b.querySelector('.placed-activity').textContent=activity(q);answer(day);};b.onclick=place;b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();place();};});
  }
  speak(q.kind==='order'?`Help Bibi over het water. Bouw de weekbrug. Welke dag komt na ${days[q.today]}?`:questionText(q));
 }
 function positionPlayer(){const q=deck[index],p=circlePos(q.today+playerStep,125),marker=app.querySelector('.player-bee');marker.style.left=p.x+'%';marker.style.top=p.y+'%';marker.alt=`Bibi staat bij ${days[mod(q.today+playerStep)]}`;}
 function chooseDay(day){if(done||busy)return;const q=deck[index];if(day!==q.target){answer(day);return;}
  busy=true;const current=token,delta=q.delta,marker=app.querySelector('.player-bee');
  const frames=Array.from({length:33},(_,i)=>{const t=i/32,p=circlePos(q.today+delta*t,125+28*Math.sin(Math.PI*t));return {left:p.x+'%',top:p.y+'%'};});
  const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:650;
  marker.animate(frames,{duration,easing:'ease-in-out'});
  setTimeout(()=>{if(current!==token)return;playerStep=delta;positionPlayer();busy=false;answer(day);},duration);
 }
 function markBridgeSlot(){const next=bridgeMissing[0];app.querySelectorAll('[data-slot]').forEach(s=>{s.classList.toggle('next-slot',Number(s.dataset.slot)===next);s.tabIndex=Number(s.dataset.slot)===next?0:-1;s.setAttribute('role','button');s.setAttribute('aria-label',Number(s.dataset.slot)===next?'Leg hier de volgende dagplank':'Dagplank');s.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();placePlank(Number(s.dataset.slot));}};});}
 function placePlank(slot){if(done||busy)return;if(selectedPlank===null){speak('Pak eerst een dagplank.');return;}if(slot!==bridgeMissing[0]){speak('Leg de plank op het knipperende plekje.');return;}const q=deck[index];if(selectedPlank!==q.target){answer(selectedPlank);return;}
  const placed=selectedPlank,node=app.querySelector(`[data-slot="${slot}"]`);node.innerHTML=art(placed)+`<strong>${days[placed]}</strong>`;node.className='plank-slot placed';app.querySelector(`[data-card="${placed}"]`).hidden=true;bridgeMissing.shift();selectedPlank=null;app.querySelector('.bridge-bee').style.left=(7+slot*12)+'%';
  if(!bridgeMissing.length){answer(placed);return;}
  const next=bridgeMissing[0];q.today=mod(bridgeStart+next-1);q.target=mod(bridgeStart+next);markBridgeSlot();feedback(`Je brug groeit! Welke dag komt na ${days[q.today]}?`,'success');speak(`Goed gelegd! Welke dag komt na ${days[q.today]}?`);
 }
 function feedback(text,type){const f=app.querySelector('.feedback');f.textContent=text;f.className='feedback '+type;}
 function answer(day){if(done||busy)return;const q=deck[index];if(day===q.target){done=true;q.completed=true;app.querySelector(`[data-day="${day}"]`)?.classList.add('day-chosen');if(wrong)helped++;app.querySelector(`[data-card="${day}"]`)?.classList.add('correct');app.querySelectorAll('.play-area button').forEach(b=>b.disabled=true);app.querySelector('.play-area').classList.add('round-won');app.querySelector('#help').hidden=true;app.querySelector('#next').hidden=false;const text=`${wrong?'Goed doorgezet!':'Goed zo!'} ${q.kind==='listen'?(q.mission==='count'?'Eén week telt zeven dagen.':q.mission==='recognize'?`Je hoorde ${days[day]}.`:`Dat klopt: ${days[day]}.`):q.kind==='order'?'De weekbrug is klaar. Bibi kan naar het feest!':`${asked(q)[0].toUpperCase()+asked(q).slice(1)} ${(q.delta+(q.anchorOffset||0))<0?'was':'is'} het ${days[day]}.`} Je verdient een feestbloem.`;feedback(text,'success');app.querySelectorAll('.petal')[index].classList.add('earned');app.querySelectorAll('.decoration')[index].classList.add('earned');app.querySelector('#party-count').textContent=(index+1)+' / 8';app.querySelector('.progress').setAttribute('aria-label',`${index+1} van 8 feestbloemen`);celebrateFlower();speak(text);return;}
  wrong++;app.querySelector(`[data-card="${day}"]`)?.classList.add('retry');hint(false,day);
 }
 function celebrateFlower(){
  document.querySelector('.flower-reward')?.remove();const current=token,target=app.querySelectorAll('.petal')[index];
  const reward=document.createElement('div');reward.className='flower-reward';reward.setAttribute('aria-hidden','true');
  reward.innerHTML=`<div class="reward-card"><img src="${bee}" alt=""><span class="big-flower">🌸</span><strong>Een feestbloem voor jou!</strong><small>${index+1} van 8 bloemen verzameld</small></div>`;document.body.append(reward);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(()=>{if(current!==token||!reward.isConnected)return;const flower=reward.querySelector('.big-flower'),from=flower.getBoundingClientRect(),to=target.getBoundingClientRect();
   reward.classList.add('collecting');
   if(!reduced)flower.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${to.x+to.width/2-from.x-from.width/2}px,${to.y+to.height/2-from.y-from.height/2}px) scale(.18)`}],{duration:750,easing:'ease-in-out',fill:'forwards'});
   setTimeout(()=>{if(current!==token)return;reward.remove();target.classList.add('new-flower');},reduced?0:750);
  },1700);
 }
 function hint(requested,chosen){if(busy||done)return;if(requested)wrong=Math.max(wrong,2);const q=deck[index];if(q.kind==='listen'&&(q.mission==='count'||q.mission==='recognize')){app.querySelector('#letter').hidden=false;app.querySelector('.shells').hidden=false;app.querySelector('#bottle').classList.add('opened');const text=q.mission==='count'?'Tel mee: maandag, dinsdag, woensdag, donderdag, vrijdag, zaterdag, zondag. Dat zijn zeven dagen.':`Luister nog eens: op ${days[q.target]} gaat Bibi ${q.activity}. Zoek ${days[q.target]}.`;feedback(text,'hint');if(q.mission==='count')app.querySelector('#letter').innerHTML='<p>Een week telt 7 dagen.</p><div class=seven-days>'+days.map((d,i)=>`<span>${i+1}<small>${d}</small></span>`).join('')+'</div>';if(wrong>=2)app.querySelector(`[data-card="${q.target}"]`)?.classList.add('correct');speak(text);return;}
  const direction=q.delta<0?-1:1,steps=Math.abs(q.delta),detailed=wrong>=2;app.querySelector('.play-area').hidden=true;
  const explanation=steps===0?'Vandaag is waar Bibi nu staat. We zetten geen stap.':`${asked(q)[0].toUpperCase()+asked(q).slice(1)}: vanaf ${reference(q)} ${steps===1?'één stap':'twee stappen'} ${direction<0?'terug in de weekcirkel':'vooruit in de weekcirkel'}.`;
  let first=chosen===undefined?'We doen het samen.':`Je koos ${days[chosen]}.`;
  if(chosen!==undefined&&q.kind!=='order'){const relative=[-2,-1,0,1,2].find(d=>mod(q.today+d)===chosen);if(relative!==undefined&&relativeName(q,relative))first+=` Dat ${relative+(q.anchorOffset||0)<0?'was':'is'} ${relativeName(q,relative)}.`;}
  feedback(`${first} ${explanation} ${detailed?'Kijk en tel mee.':'Probeer opnieuw.'}`,'hint');
  const point=(angle,r=175)=>({x:300+Math.cos(angle)*r,y:300+Math.sin(angle)*r});
  const angle=day=>-Math.PI/2+day*2*Math.PI/7;
  const jumpCurves=[];
  const jumps=Array.from({length:steps},(_,i)=>{
   const from=q.today+i*direction,to=from+direction,a=angle(from),b=angle(to);
   const start=point(a,238),end=point(b,238),control=point((a+b)/2,330);
   jumpCurves.push({start,end,control});
   return `<path class="jump" data-jump="${i+1}" data-from="${mod(from)}" data-to="${mod(to)}" d="M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}" pathLength="1" marker-end="url(#jump-head)"/>`;
  }).join('');
  const initial=point(angle(q.today),238);
  app.querySelector('#support').innerHTML=`<div class="support"><h3>${steps===0?'Blijf bij vandaag':direction<0?'We springen terug in de week':'We springen vooruit in de week'}</h3><div class="week-circle" role="group" aria-label="Weekcirkel: maandag, dinsdag, woensdag, donderdag, vrijdag, zaterdag, zondag, en opnieuw maandag"><svg viewBox="0 0 600 600" aria-hidden="true"><defs><marker id="jump-head" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#c57705"/></marker></defs><circle cx="300" cy="300" r="175" fill="none" stroke="#bcdad1" stroke-width="4" stroke-dasharray="5 7"/>${jumps}</svg><div class="circle-center"><strong>De week</strong><small>Na zondag<br>komt maandag</small></div>${days.map((day,i)=>{const pos=point(angle(i)),offset=mod(i-q.today+3)-3;return `<div class="stone ${i===q.today?'today':''}" data-offset="${offset}" style="left:${pos.x/6}%;top:${pos.y/6}%">${art(i)}<strong>${day}</strong><small>${i===q.today?reference(q):''}</small></div>`;}).join('')}<img class="circle-bee" src="${bee}" alt="Bibi staat bij ${reference(q)}" style="left:${initial.x/6}%;top:${initial.y/6}%"></div></div>`;
  // Trim each arc against the actual card bounds, leaving space for the whole arrowhead.
  const circle=app.querySelector('#support .week-circle'),circleBox=circle.getBoundingClientRect(),unit=600/circleBox.width;
  const obstacles=[...circle.querySelectorAll('.stone')].map(el=>{const r=el.getBoundingClientRect();return {l:(r.left-circleBox.left)*unit-17,r:(r.right-circleBox.left)*unit+17,t:(r.top-circleBox.top)*unit-17,b:(r.bottom-circleBox.top)*unit+17};});
  const bezier=(c,t)=>({x:(1-t)**2*c.start.x+2*(1-t)*t*c.control.x+t*t*c.end.x,y:(1-t)**2*c.start.y+2*(1-t)*t*c.control.y+t*t*c.end.y});
  const clear=p=>!obstacles.some(r=>p.x>=r.l&&p.x<=r.r&&p.y>=r.t&&p.y<=r.b);
  jumpCurves.forEach((c,i)=>{
   let first=0,last=1;while(first<.45&&!clear(bezier(c,first)))first+=.01;while(last>.55&&!clear(bezier(c,last)))last-=.01;
   const start=bezier(c,first),end=bezier(c,last),control={x:start.x+(last-first)*((1-first)*(c.control.x-c.start.x)+first*(c.end.x-c.control.x)),y:start.y+(last-first)*((1-first)*(c.control.y-c.start.y)+first*(c.end.y-c.control.y))};
   jumpCurves[i]={start,end,control};circle.querySelector(`[data-jump="${i+1}"]`).setAttribute('d',`M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`);
  });
  const current=token;busy=true;app.querySelector('#repeat').disabled=true;app.querySelector('#help').disabled=true;
  function release(){if(current!==token)return;busy=false;app.querySelector('#repeat').disabled=false;app.querySelector('#help').disabled=false;
   const retry=document.createElement('button');retry.className='primary retry-play';retry.textContent='Ik probeer het zelf!';app.querySelector('#support').append(retry);retry.onclick=()=>{app.querySelector('#support').innerHTML='';app.querySelector('.play-area').hidden=false;if(q.kind==='step'){playerStep=0;positionPlayer();}};
  }
  function showStep(n){
   if(current!==token)return;if(n>steps){release();return;}
   const offset=n*direction;app.querySelector(`[data-jump="${n}"]`).classList.add('show');
   if(!detailed){setTimeout(()=>showStep(n+1),750);return;}
   const marker=app.querySelector('#support .circle-bee');
   const {start:from,end:to,control}=jumpCurves[n-1];
   const frames=Array.from({length:25},(_,i)=>{const t=i/24,u=1-t,p={x:u*u*from.x+2*u*t*control.x+t*t*to.x,y:u*u*from.y+2*u*t*control.y+t*t*to.y};return {left:p.x/6+'%',top:p.y/6+'%'};});
   const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:700;
   marker.animate(frames,{duration,fill:'forwards',easing:'ease-in-out'});
   setTimeout(()=>{if(current!==token)return;
    app.querySelectorAll('.stone').forEach(s=>s.classList.remove('active'));
    const stone=app.querySelector(`[data-offset="${offset}"]`);stone.classList.add('active');stone.querySelector('small').textContent=relativeName(q,offset);
    marker.alt=`Bibi staat bij ${days[mod(q.today+offset)]}`;
    speak(`${relativeName(q,offset)} ${offset+(q.anchorOffset||0)<0?'was':'is'} het ${days[mod(q.today+offset)]}.`,()=>{if(current===token)setTimeout(()=>showStep(n+1),450);});
   },duration);
  }
  speak(`${first} ${explanation}`,()=>{if(current!==token)return;if(!steps){app.querySelector('[data-offset="0"]').classList.add('active');release();}else showStep(1);});
 }
 function finish(){cancel();app.innerHTML=`<section class="panel finish"><div class="eyebrow">Acht feestbloemen verzameld!</div><h1>Het eilandfeest kan beginnen!</h1><img class="bee" src="${bee}" alt="Bibi juicht">${art(7)}<h2>Goed geoefend!</h2><p>Je maakte alle acht opdrachten af.${helped?` Bij ${helped} ${helped===1?'opdracht hielpen':'opdrachten hielpen'} we je op weg. Samen oefenen helpt!`:''}</p><button class="primary" id="again">Nog een ronde →</button> <button id="choose">Kies een level</button></section>`;app.querySelector('#again').onclick=start;app.querySelector('#choose').onclick=home;speak('Hoera! Het eilandfeest kan beginnen. Je hebt alle acht opdrachten afgemaakt. Goed geoefend!');}
 let fitFrame=0;
 function fitScreen(){cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(()=>{const panel=app.firstElementChild;if(!panel)return;const scale=Math.min(1,app.clientHeight/panel.offsetHeight);panel.style.setProperty('--screen-scale',scale);});}
 new MutationObserver(fitScreen).observe(app,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','class']});
 new ResizeObserver(fitScreen).observe(app);window.addEventListener('resize',fitScreen);window.addEventListener('pagehide',cancel);home();
})();

