'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const guitar = electric => `<path d="M65 46L105 5l9 8-39 44c14 25-8 45-29 39C20 90 20 64 42 57c0-16 13-20 23-11" fill="${electric?'#8063be':'#dc9e4c'}" stroke="#513950" stroke-width="4"/><circle cx="54" cy="72" r="10" fill="#513950"/><path d="M47 81L108 10" stroke="#fff4cb" stroke-width="3"/>`;
  const instruments = [
    {name:'Piano',file:'piano-C4.mp3',art:'<rect x="8" y="22" width="124" height="70" rx="8" fill="#35334a"/><path d="M14 37h112v46H14z" fill="white"/><path d="M30 37v46m16-46v46m16-46v46m16-46v46m16-46v46m16-46v46" stroke="#35334a"/><path d="M27 37v26m16-26v26m32-26v26m16-26v26m16-26v26" stroke="#35334a" stroke-width="8"/>'},
    {name:'Gitaar',file:'guitar-acoustic-C4.mp3',art:guitar(false)},
    {name:'Xylofoon',file:'xylophone-C5.mp3',rate:.5,art:[0,1,2,3,4].map((n)=>`<rect x="${12+n*24}" y="${18+n*6}" width="20" height="${78-n*10}" rx="4" fill="${['#ec635f','#f5a24c','#f5d451','#55b985','#7a77cc'][n]}"/>`).join('')+'<path d="M25 10l65 75" stroke="#745437" stroke-width="5"/><circle cx="25" cy="10" r="8" fill="#745437"/>'},
    {name:'Trommel',file:'drum-snare.wav',art:'<path d="M22 44v43c0 22 98 22 98 0V44" fill="#e97176" stroke="#624150" stroke-width="3"/><ellipse cx="71" cy="44" rx="49" ry="19" fill="#fff6de" stroke="#624150" stroke-width="4"/><path d="M31 53l10 39 18-30 18 38 18-36 17 29M20 10l55 36m40-38L78 42" fill="none" stroke="#886045" stroke-width="5"/>'},
    {name:'Boomwhackers',file:'boom-C4.wav',art:[0,1,2,3,4].map(n=>`<rect x="${8+n*26}" y="${8+n*10}" width="20" height="${93-n*10}" rx="6" fill="${['#e64451','#ef8d2c','#e9c92d','#58b465','#8655b2'][n]}"/><ellipse cx="${18+n*26}" cy="${13+n*10}" rx="7" ry="3" fill="#0004"/>`).join('')},
    {name:'Elektrische gitaar',file:'guitar-electric-C4.mp3',art:guitar(true)+'<path d="M116 52l-13 22h12l-12 25 27-31h-13l12-16z" fill="#e7b423"/>'}
  ];
  let ctx, sources=[], operation=0, level=2, round=0, deck=[], answer, solved=false, heard=false;
  const buffers=new Map();
  const shuffle = list => {const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const pool = () => instruments.slice(0,level===2?4:6);
  function stop(){operation++;for(const s of sources){try{s.stop()}catch{}}sources=[];$('listen').disabled=false;}
  function show(){
    stop();solved=false;heard=false;answer=deck[round];
    $('listen').hidden=false;$('listen').textContent='🔊 Luister';$('next').hidden=true;$('restart').hidden=true;
    $('round').textContent=`Geluid ${round+1} van 6`;$('feedback').textContent='Tik eerst op Luister.';
    $('stars').textContent=Array.from({length:6},(_,i)=>i<round?'★':'☆').join(' ');$('stars').setAttribute('aria-label',`${round} van 6 gevonden`);
    const choices=shuffle([answer,...shuffle(pool().filter(i=>i!==answer)).slice(0,level-1)]);
    $('choices').replaceChildren();$('choices').style.setProperty('--count',level);
    choices.forEach(inst=>{const b=document.createElement('button');b.className='choice';b.disabled=true;b.innerHTML=`<svg viewBox="0 0 140 112" aria-hidden="true">${inst.art}</svg><span>${inst.name}</span>`;b.onclick=()=>choose(inst,b);$('choices').append(b)});
  }
  function begin(n){level=n;round=0;deck=[];while(deck.length<6){const options=shuffle(pool());for(const inst of options)if(inst!==deck.at(-1)&&deck.length<6)deck.push(inst)}$('easy').setAttribute('aria-pressed',n===2);$('hard').setAttribute('aria-pressed',n===3);show();}
  async function listen(){
    stop();const run=operation,inst=answer;$('listen').disabled=true;$('feedback').textContent='Even de klank laden…';
    try{
      ctx ||= new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();
      if(!buffers.has(inst.file)){const res=await fetch('audio/'+inst.file);if(!res.ok)throw Error();buffers.set(inst.file,await ctx.decodeAudioData(await res.arrayBuffer()))}
      if(run!==operation)return;
      const buffer=buffers.get(inst.file);let peak=0;for(let c=0;c<buffer.numberOfChannels;c++)for(const v of buffer.getChannelData(c))peak=Math.max(peak,Math.abs(v));
      for(let i=0;i<3;i++){const t=ctx.currentTime+.03+i*.48,s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=buffer;s.playbackRate.value=inst.rate||1;g.gain.setValueAtTime(Math.min(2,.65/(peak||1)),t);g.gain.setValueAtTime(Math.min(2,.65/(peak||1)),t+.32);g.gain.linearRampToValueAtTime(0,t+.44);s.connect(g).connect(ctx.destination);sources.push(s);s.start(t);s.stop(t+.45)}
      heard=true;$('listen').textContent='🔊 Luister nog eens';$('feedback').textContent=solved?`Ja! Dit is de ${answer.name.toLowerCase()}.`:'Welk instrument hoor je?';
      if(!solved)$('choices').querySelectorAll('button').forEach(b=>b.disabled=false);
    }catch{if(run===operation)$('feedback').textContent='De klank kon niet laden. Tik opnieuw op Luister.'}
    finally{if(run===operation)$('listen').disabled=false}
  }
  function choose(inst,button){
    if(!heard||solved)return;
    if(inst!==answer){$('feedback').textContent='Dat is het nog niet. Luister nog eens en probeer opnieuw.';return}
    solved=true;stop();button.classList.add('correct');$('choices').querySelectorAll('button').forEach(b=>b.disabled=true);
    $('feedback').textContent=`Ja! Dit is de ${answer.name.toLowerCase()}.`;
    $('stars').textContent=Array.from({length:6},(_,i)=>i<=round?'★':'☆').join(' ');$('stars').setAttribute('aria-label',`${round+1} van 6 gevonden`);
    if(round===5){$('round').textContent='Alle 6 gevonden!';$('restart').hidden=false}else $('next').hidden=false;
  }
  $('easy').onclick=()=>begin(2);$('hard').onclick=()=>begin(3);$('listen').onclick=listen;$('stop').onclick=stop;$('next').onclick=()=>{if(solved&&round<5){round++;show()}};$('restart').onclick=()=>begin(level);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);begin(2);
})();
