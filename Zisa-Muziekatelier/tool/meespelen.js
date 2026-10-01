'use strict';
const $=id=>document.getElementById(id);
const pitches=[60,62,64,65,67,69,71,72],names=['do','re','mi','fa','sol','la','si','hoge do'],files=['C4','D4','E4','F4','G4','A4','B4','C5'],colors=['#de3e45','#e77a2e','#edc62d','#9cc538','#329a4e','#8052ae','#c84389','#de3e45'];
let ctx,buffers=[],sources=[],token=0,frame=0,playing=false,paused=false,offset=0,startTime=0,seconds=60/70,manual=-1,mode='play',sequence={events:[],beats:0},drops=[],targets=[],scoreNotes=[];
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function color(e,i){e.style.setProperty('--color',colors[i]);if(i===2||i===3)e.style.color='#302b20';return e}
async function audio(){ctx??=new(window.AudioContext||window.webkitAudioContext)();await ctx.resume();if(!buffers.length)buffers=await Promise.all(files.map(async f=>{const r=await fetch('audio/boom-'+f+'.wav');if(!r.ok)throw Error('audio');return ctx.decodeAudioData(await r.arrayBuffer())}));}
function track(s){sources.push(s);s.onended=()=>{sources=sources.filter(x=>x!==s)}}
function note(pitch,time){const s=ctx.createBufferSource();s.buffer=buffers[pitches.indexOf(pitch)];const g=ctx.createGain();g.gain.value=.8;s.connect(g).connect(ctx.destination);track(s);s.start(time)}
function click(time,strong){const s=ctx.createOscillator(),g=ctx.createGain();s.frequency.value=strong?1000:700;g.gain.setValueAtTime(.08,time);g.gain.exponentialRampToValueAtTime(.001,time+.045);s.connect(g).connect(ctx.destination);track(s);s.start(time);s.stop(time+.05)}
function silence(){for(const s of sources){try{s.stop()}catch{}}sources=[];cancelAnimationFrame(frame)}
function lock(active){for(const id of ['song','part','speed','melody','tick','echo'])$(id).disabled=active;$('melody').disabled=active||$('echo').checked;$('pause').disabled=!active;$('stop').disabled=!active&&!paused;$('start').textContent=paused?'▶ Verder spelen':'▶ Speel mee'}
function clearLights(){targets.forEach(t=>t.classList.remove('active'));scoreNotes.forEach(n=>n.classList.remove('current'))}
function stop(reset=true){token++;playing=false;silence();if(reset){paused=false;offset=0;manual=-1}lock(false);clearLights();$('countdown').hidden=true;$('boardMessage').hidden=false;$('boardMessage').textContent='';$('playCue').className='play-cue';$('playCue').disabled=true;$('cueAction').textContent='Klaar?';$('cueNote').textContent='♫';$('cueName').textContent='Kies ‘Speel mee’';$('nextNote').textContent='—';$('modeLabel').textContent='Klaar om te oefenen';$('progress').style.width='0%';drops.forEach(d=>d.hidden=true)}
function selected(){return buildSong(SONGS[$('song').value],$('part').value)}
function makeSequence(){const base=selected();if(!$('echo').checked||mode==='listen')return{...base,echo:false};const events=[];let beat=0;const groups=[...new Set(base.events.map(e=>e.phrase))];for(const p of groups){const es=base.events.filter(e=>e.phrase===p),first=es[0].beat,length=es.reduce((n,e)=>n+e.duration,0);for(const phase of ['listen','answer']){es.forEach(e=>events.push({...e,beat:beat+e.beat-first,phase}));beat+=length}}return{events,beats:beat,echo:true}}
function makeDrops(){ $('drops').replaceChildren();drops=sequence.events.map(e=>{const i=pitches.indexOf(e.pitch),d=color(el('div','drop'+(e.duration>1?' long':''),i+1),i);d.style.left=((i+.5)*12.5)+'%';d.hidden=true;$('drops').append(d);return d})}
function currentBeat(){return offset+(ctx.currentTime-startTime)/seconds}
function render(){
 if(!playing)return;
 const beat=currentBeat(),relative=beat-offset;
 const head=sequence.events.filter(e=>e.beat<=beat).at(-1);
 clearLights();$('countdown').hidden=true;$('boardMessage').hidden=true;
 const cue=$('playCue');cue.className='play-cue';cue.disabled=true;
 if(relative<0){
  const count=Math.max(1,Math.min(4,Math.ceil(-relative)));
  $('cueAction').textContent='Bijna beginnen';$('cueNote').textContent=String(count);$('cueName').textContent='Nog even wachten';
  $('modeLabel').textContent='We tellen af';$('beatLabel').textContent='4 · 3 · 2 · 1';
 }else{
  const listening=mode==='listen'||(sequence.echo&&head?.phase==='listen');
  const strike=head&&beat-head.beat<Math.min(.48,head.duration*.7);
  $('beatLabel').textContent='Tel '+(Math.floor(Math.max(0,beat))%4+1);
  $('modeLabel').textContent=listening?'👂 Luister eerst':'Jij speelt mee!';
  if(strike){
   const i=pitches.indexOf(head.pitch);cue.classList.add('now');cue.disabled=listening;cue.dataset.pitch=String(head.pitch);cue.style.setProperty('--cue-color',colors[i]);cue.style.setProperty('--cue-ink',[2,3].includes(i)?'#302b20':'#fff');
   $('cueAction').textContent=listening?'Luister!':'Tik!';$('cueNote').textContent=String(i+1);$('cueName').textContent=names[i];targets[i].classList.add('active');
  }else{$('cueAction').textContent='Wacht even';$('cueNote').textContent='…';$('cueName').textContent='Je volgende kleur komt zo';}
 }
 const next=sequence.events.find(e=>e.beat>beat&&e.beat>=offset);
 $('nextNote').textContent=next?(pitches.indexOf(next.pitch)+1)+' '+names[pitches.indexOf(next.pitch)]:'Klaar';
 $('progress').style.width=Math.max(0,Math.min(100,beat/sequence.beats*100))+'%';
 if(beat>=sequence.beats){playing=false;silence();offset=0;paused=false;lock(false);clearLights();cue.className='play-cue';$('cueAction').textContent='Goed gespeeld!';$('cueNote').textContent='★';$('cueName').textContent='Nog een keer?';$('status').textContent='Nog eens, of een ander liedje?';$('modeLabel').textContent='Klaar!';if($('loop').checked)begin(mode);return}
 frame=requestAnimationFrame(render);
}
async function begin(nextMode){const resume=paused&&mode===nextMode;const saved=resume?offset:0;stop();mode=nextMode;offset=saved;const run=token;$('status').textContent='Instrumentklanken laden…';try{await audio();if(run!==token)return;seconds=60/Number($('speed').value);sequence=makeSequence();makeDrops();startTime=ctx.currentTime+.12+4*seconds;playing=true;lock(true);const countStart=startTime-4*seconds;for(let i=0;i<4;i++)click(countStart+i*seconds,i===0);for(let b=Math.ceil(offset);b<sequence.beats;b++){if($('tick').checked)click(startTime+(b-offset)*seconds,b%4===0)}for(const e of sequence.events){if(e.beat<offset)continue;const audible=mode==='listen'||(sequence.echo?e.phase==='listen':$('melody').checked);if(audible)note(e.pitch,startTime+(e.beat-offset)*seconds)}$('status').textContent=sequence.echo?'Om de beurt: luister naar één deel en speel dat meteen na. De kleuren helpen.':'Tik op de kleur zodra het grote vak oplicht. Bij ‘Wacht even’ speel je nog niet.';render()}catch(e){stop();$('status').textContent='De klanken konden niet laden. Controleer de verbinding en probeer opnieuw.'}}
function rebuild(){stop();const song=SONGS[$('song').value];$('songNote').textContent=song.note;const used=new Set(selected().events.map(e=>e.pitch));$('needed').replaceChildren();pitches.forEach((p,i)=>{targets[i].classList.toggle('unused',!used.has(p));$('lanes').children[i].classList.toggle('unused',!used.has(p));if(used.has(p))$('needed').append(color(el('span','needed',(i+1)+' '+names[i]),i))});$('score').replaceChildren();scoreNotes=[];song.phrases.forEach((phrase,p)=>{const box=el('div','phrase'+($('part').value===String(p)?' picked':'')),b=el('button','', 'Oefen deel '+(p+1)),strip=el('div','phrase-strip');b.onclick=()=>{$('part').value=String(p);rebuild()};box.append(b,strip);phrase.forEach(([pitch,duration])=>{const i=pitches.indexOf(pitch),n=color(el('span','phrase-note',i+1),i);n.style.flex=String(duration);n.title=names[i]+': '+duration+' tel(len)';strip.append(n);scoreNotes.push(n)});$('score').append(box)});sequence=selected();makeDrops()}
pitches.forEach((p,i)=>{const lane=color(el('div','lane'),i);$('lanes').append(lane);const t=color(el('button','target'),i);t.append(el('span','',(i+1)+' '+names[i]),el('small','',files[i]));t.setAttribute('aria-label','Speel '+names[i]);t.onclick=async()=>{try{await audio();note(p,ctx.currentTime);t.classList.add('tapped');setTimeout(()=>t.classList.remove('tapped'),180)}catch{$('status').textContent='Kan de klank niet laden.'}};targets.push(t);$('targets').append(t)});
function changeSong(){$('part').replaceChildren(new Option('Het hele lied','all'));SONGS[$('song').value].phrases.forEach((_,i)=>$('part').add(new Option('Deel '+(i+1),String(i))));rebuild()}
$('playCue').onclick=async()=>{const pitch=Number($('playCue').dataset.pitch);if(!pitches.includes(pitch))return;try{await audio();note(pitch,ctx.currentTime)}catch{$('status').textContent='De klank kon niet laden. Probeer opnieuw.'}};
$('song').onchange=changeSong;$('part').onchange=rebuild;$('speed').onchange=()=>stop();$('echo').onchange=()=>{stop();$('melody').disabled=$('echo').checked};$('start').onclick=()=>begin('play');$('listen').onclick=()=>begin('listen');$('stop').onclick=()=>stop();$('pause').onclick=()=>{offset=Math.max(0,sequence.events.find(e=>e.beat>=currentBeat()-.001)?.beat??0);stop(false);paused=true;lock(false);$('status').textContent='Pauze. Verder spelen telt opnieuw vier tellen af.'};
$('step').onclick=async()=>{const next=manual+1;stop();manual=next%selected().events.length;const run=token,e=selected().events[manual],i=pitches.indexOf(e.pitch);targets[i].classList.add('active');$('boardMessage').hidden=true;$('playCue').className='play-cue now';$('playCue').disabled=false;$('playCue').dataset.pitch=String(e.pitch);$('playCue').style.setProperty('--cue-color',colors[i]);$('playCue').style.setProperty('--cue-ink',[2,3].includes(i)?'#302b20':'#fff');$('cueAction').textContent='Probeer maar';$('cueNote').textContent=String(i+1);$('cueName').textContent=names[i];$('modeLabel').textContent='Op je eigen tempo';$('status').textContent='Speel '+names[i]+' na. Klik daarna op ‘Probeer één kleur’.';try{await audio();if(run===token)note(e.pitch,ctx.currentTime)}catch{$('status').textContent='Volg de kleur. Het voorbeeldgeluid kon niet laden.'}};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('board').requestFullscreen)await $('board').requestFullscreen();else $('status').textContent='Draai je toestel horizontaal voor een groter speelbord.'}catch{$('status').textContent='Groot scherm is niet beschikbaar in deze browser.'}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',()=>stop());changeSong();
