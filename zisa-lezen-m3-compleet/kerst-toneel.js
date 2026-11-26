// A scene has a cast, a starting arrangement and a timed sequence of actions.
window.ZISA_PLAY_CHRISTMAS_STAGE=function(ctx){
 const {$,state,shuffle,feedback,nextBanner,later,finish,esc}=ctx;
 const names={mila:'Mila',finn:'Finn',ster:'Ster',kerstman:'De kerstman'},xs=[12,34,59,86];
 const places=['links bij het gordijn','bij de kerstboom','midden op het toneel','rechts bij het gordijn'];
 const base='https://zisa-leesprenten-start.pages.dev/kerst/m5-kerst-rendier/';
 for(const name of ['mila-wortel','finn-schrik','finn-buigt','ster-eet']){const img=new Image();img.src=base+name+'.png'}
 const chapters=[
 {title:'Een onverwachte bezoeker',cast:['mila','finn','ster'],plans:[[0,2,3],[3,2,0]],action:'arrival'},
 {title:'De pakjes vallen',cast:['mila','finn','ster'],plans:[[0,1,2],[3,0,1]],action:'boxes'},
 {title:'Sneeuw op Finns muts',cast:['mila','finn','ster'],plans:[[0,2,1],[3,0,1]],action:'snow'},
 {title:'Volg de wortel',cast:['mila','finn','ster','kerstman'],plans:[[0,2,1,3],[1,0,2,3]],action:'carrot'},
 {title:'Daar is de kerstman!',cast:['mila','finn','ster','kerstman'],plans:[[0,2,1,3],[3,2,1,0]],action:'reveal'},
 {title:'Een buiging… of een hapje?',cast:['mila','finn','ster','kerstman'],plans:[[0,2,1,3],[3,1,2,0]],action:'bow'}
 ];
 [chapters[3],chapters[4]]=[chapters[4],chapters[3]];
 state.round=0;let current,placements={},performing=false,sound=false,audio;
 function pose(actor,file){const el=document.querySelector(`[data-player="${actor}"] img`);if(el)el.src=base+file+'.png'}
 function player(actor){return document.querySelector(`[data-player="${actor}"]`)}
 function move(actor,x,duration=1800){const el=player(actor);if(!el)return;el.style.transition=`left ${duration}ms ease-in-out, opacity .6s`;el.style.left=x+'%';el.dataset.x=x;el.classList.add('crossing');later(()=>el.classList.remove('crossing'),duration)}
 function line(actor,text){document.querySelector('.scene-dialogue').innerHTML=`<strong>${names[actor]}</strong> ${esc(text)}`;document.querySelectorAll('.stage-player').forEach(el=>el.classList.toggle('speaking',el.dataset.player===actor));if(sound){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='nl-BE';u.rate=.9;speechSynthesis.speak(u)}}
 function chime(){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=1047;g.gain.setValueAtTime(.05,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.4);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.4)}catch{}}
 function prop(cls,x,html){const el=document.createElement('div');el.className='scene-prop '+cls;el.style.left=x+'%';el.innerHTML=html;document.querySelector('.theatre-floor').append(el);return el}
 function schedule(ms,fn){later(fn,ms)}
 function play(){
  if(performing)return;
  const wrong=current.cast.filter(a=>placements[a]!==current.positions[a]);
  if(wrong.length){feedback('Kijk nog eens naar de aanwijzing voor '+wrong.map(a=>names[a]).join(', ')+'. Je mag de spelers verplaatsen.');wrong.forEach(a=>player(a)?.classList.add('wrong-place'));return}
  performing=true;state.busy=true;document.querySelector('.multi-stage').classList.add('performing');$('perform').disabled=true;$('perform').textContent='De scène speelt…';$('placedCount').textContent='Iedereen staat goed. Kijk naar het toneel!';feedback('De gordijnen gaan open…');
  const curtain=document.querySelector('.scene-curtain');curtain.classList.add('closed');schedule(500,()=>curtain.classList.remove('closed'));
  const action=current.action;
  if(action==='arrival'){
   schedule(700,()=>line('mila','De elf zocht de kerstman.'));
   schedule(3200,()=>line('finn','Heeft iemand de kerstman gezien?'));
   schedule(5700,()=>{chime();move('ster',36,2100);line('mila','Maar daar kwam een andere bezoeker…')});
   schedule(8100,()=>{pose('finn','finn-schrik');line('finn','Een écht rendier! Dat hebben we niet geoefend!')});
  }else if(action==='boxes'){
   const a=prop('stage-gift gift-a',66,'<i></i>'),b=prop('stage-gift gift-b',74,'<i></i>');
   schedule(700,()=>{line('mila','Ster ruikt wortels achter de pakjes.');move('finn',24,1300)});
   schedule(2900,()=>{move('ster',53,1900);line('finn','Pas op voor die dozen!')});
   schedule(4600,()=>{pose('ster','ster-eet');a.classList.add('toppled');chime()});
   schedule(5100,()=>b.classList.add('toppled'));
   schedule(6500,()=>{pose('finn','finn-schrik');line('mila','Oei! Gelukkig zijn de dozen leeg.')});
   schedule(9000,()=>{pose('finn','finn');line('finn','Wacht! We spelen gewoon verder.')});
  }else if(action==='snow'){
   schedule(700,()=>line('finn','Misschien weet dit rendier waar de kerstman is.'));
   schedule(3500,()=>{move('ster',25,1000);line('mila','Ster stapt achteruit, tegen de decorboom.')});
   schedule(4600,()=>{const fx=Number(player('finn').dataset.x);for(let i=0;i<24;i++){const flake=prop('theatre-snow',fx-9+Math.random()*18,'❄');flake.style.setProperty('--delay',Math.random()*.9+'s')}pose('finn','finn-schrik')});
   schedule(6500,()=>line('finn','Nu weet ik zeker dat je uit het noorden komt!'));
   schedule(9400,()=>line('mila','De hele zaal moet lachen.'));
  }else if(action==='carrot'){
   schedule(700,()=>{line('kerstman','Mila, lok Ster rustig met één wortel.');move('finn',12,1000)});
   schedule(3300,()=>{pose('mila','mila-wortel');line('mila','Kom maar, Ster. Kijk eens wat ik heb!')});
   schedule(5200,()=>{move('mila',72,3000);move('ster',52,3300)});
   schedule(8600,()=>{line('finn','Onze bezoeker heeft de weg gevonden!');chime()});
   schedule(11000,()=>line('kerstman','Daar ben je! Ik was je al aan het zoeken.'));
  }else if(action==='reveal'){
   player('kerstman').classList.add('behind-curtain');
   schedule(700,()=>line('mila','Achter het gordijn wacht nog iemand.'));
   schedule(3400,()=>{pose('finn','finn-schrik');line('finn','Daar is de kerstman! Nu meen ik het echt!')});
   schedule(5900,()=>{player('kerstman').classList.remove('behind-curtain');move('finn',22,1400);move('kerstman',60,2200)});
   schedule(8400,()=>line('kerstman','Ik zocht mijn rendier. Maar het heeft al werk gevonden!'));
  }else{
   const carrot=prop('floor-carrot',Number(player('ster').dataset.x)+7,'<i></i>');
   schedule(700,()=>line('mila','En zo kwam de kerstman toch nog op het toneel.'));
   schedule(3300,()=>{pose('finn','finn-buigt');line('finn','Dank jullie wel voor het kijken!')});
   schedule(5900,()=>{pose('ster','ster-eet');line('kerstman','Kijk, Ster buigt ook!')});
   schedule(8000,()=>{carrot.classList.add('eaten');line('mila','Nee hoor! Hij heeft nog een stukje wortel gevonden.')});
  }
  const duration=action==='carrot'?14000:12500;
  schedule(duration,()=>{document.querySelector('.scene-dialogue').textContent='Applaus! Jouw scène is gespeeld.';document.querySelector('.multi-stage').classList.add('applause');$('progress').textContent=`${state.round+1} / 6 scènes`;feedback('Goed geregisseerd!');});
  schedule(duration+2200,()=>{state.round++;if(state.round===chapters.length)finish('Jullie kerstshow is gespeeld!');else{round();nextBanner('Nieuwe scène! Lees eerst alle aanwijzingen.')}});
 }
 function clue(actor,position){
  const where=places[position];
  if(actor==='mila')return `Mila vertelt het verhaal. Zet haar ${where}.`;
  if(actor==='finn')return `De jongen in het elfenpak is Finn. Hij staat ${where}.`;
  if(actor==='ster')return `Het rendier begint ${where}. Zet Ster daar klaar.`;
  return `De kerstman wacht ${where} tot hij aan de beurt is.`;
 }
 function place(actor,spot){if(performing||!current.cast.includes(actor))return;const old=placements[actor],occupant=Object.keys(placements).find(key=>key!==actor&&placements[key]===spot);if(occupant){if(old!==undefined)placements[occupant]=old;else delete placements[occupant]}placements[actor]=spot;state.selected=null;drawPlayers();feedback('Je kunt iedereen nog verplaatsen. Lees ook de andere aanwijzingen.')}
 function drawPlayers(){
  const layer=document.querySelector('.scene-players');layer.replaceChildren();
  for(const [actor,spot] of Object.entries(placements)){const el=document.createElement('button');el.className='stage-player '+actor;el.dataset.player=actor;el.dataset.x=xs[spot];el.style.left=xs[spot]+'%';el.setAttribute('aria-label',names[actor]+' verplaatsen');el.draggable=true;el.innerHTML=`<img src="${base+actor}.png" alt="${names[actor]}">`;el.onclick=()=>{if(performing)return;state.selected=actor;document.querySelectorAll('.stage-player').forEach(x=>x.classList.toggle('selected-player',x===el));feedback('Tik nu op de nieuwe plek voor '+names[actor]+'.')};el.ondragstart=e=>{if(performing){e.preventDefault();return}state.selected=actor;e.dataTransfer.setData('text/plain',actor)};layer.append(el)}
  document.querySelectorAll('.cast-choice').forEach(el=>{el.classList.toggle('already-placed',placements[el.dataset.actor]!==undefined);el.setAttribute('aria-pressed',placements[el.dataset.actor]!==undefined)});
  const count=Object.keys(placements).length;$('placedCount').textContent=`${count} van ${current.cast.length} spelers staan klaar`;$('perform').disabled=count!==current.cast.length;
 }
 function round(){
  const chapter=chapters[state.round],plan=shuffle(chapter.plans)[0];current={...chapter,positions:Object.fromEntries(chapter.cast.map((a,i)=>[a,plan[i]]))};placements={};performing=false;state.busy=false;state.selected=null;
  $('play').innerHTML=`<aside class="regie-panel"><span class="round-tag">Scène ${state.round+1} van 6</span><h2>${chapter.title}</h2><ol class="regie-clues">${shuffle(chapter.cast).map(a=>`<li class="clue">${esc(clue(a,current.positions[a]))}</li>`).join('')}</ol><p id="placedCount" role="status"></p><p class="game-help">Zet alle spelers klaar. Sleep of tik op een speler en daarna op een plek.</p><button id="sceneSound">Geluid: ${sound?'aan':'uit'}</button><button id="perform" class="primary" disabled>Speel de scène!</button></aside><div class="multi-stage"><div class="theatre-floor"><div class="scene-dialogue" role="status">Zet ${chapter.cast.length} spelers op hun beginplek.</div><div class="stage-dropzones">${places.map((p,i)=>`<button class="stage-dropzone" data-spot="${i}"><span>${p}</span></button>`).join('')}</div><div class="scene-players"></div><div class="scene-curtain"><i></i><i></i></div></div><div class="cast-tray">${shuffle(chapter.cast).map(actor=>`<button class="cast-choice" data-actor="${actor}" draggable="true"><img src="${base+actor}.png" alt="${names[actor]}"><span>${names[actor]}</span></button>`).join('')}</div></div>`;
  document.querySelectorAll('.cast-choice').forEach(el=>{el.onclick=()=>{if(performing)return;state.selected=el.dataset.actor;document.querySelectorAll('.cast-choice').forEach(x=>x.classList.toggle('selected',x===el))};el.ondragstart=e=>{if(performing){e.preventDefault();return}state.selected=el.dataset.actor;e.dataTransfer.setData('text/plain',el.dataset.actor)}});
  document.querySelectorAll('.stage-dropzone').forEach(el=>{el.onclick=()=>place(state.selected,Number(el.dataset.spot));el.ondragover=e=>{e.preventDefault();el.classList.add('over')};el.ondragleave=()=>el.classList.remove('over');el.ondrop=e=>{e.preventDefault();el.classList.remove('over');place(e.dataTransfer.getData('text/plain'),Number(el.dataset.spot))}});
  $('sceneSound').onclick=()=>{sound=!sound;$('sceneSound').textContent='Geluid: '+(sound?'aan':'uit');if(!sound)speechSynthesis.cancel()};$('perform').onclick=play;drawPlayers();$('progress').textContent=`${state.round} / 6 scènes`;
 }
 round();
};
