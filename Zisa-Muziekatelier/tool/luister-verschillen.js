'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const topics={pitch:['laag','hoog'],tempo:['traag','snel'],volume:['zacht','hard']};
  let mode='mixed',topic='pitch',round=0,positions=[],targets=[],questions=[],heard=[false,false],solved=false,playing=false,ctx,sources=[],timer,operation=0;
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function balanced(){const all=[];function fill(a,n){if(a.length===6){all.push(a);return}for(let x=0;x<2;x++){if(!n[x]||(a.length>1&&a.at(-1)===x&&a.at(-2)===x))continue;n[x]--;fill([...a,x],n);n[x]++}}fill([],[3,3]);return all[Math.floor(Math.random()*all.length)]}
  function controls(){for(let i=0;i<2;i++)$('answer'+i).disabled=playing||solved||!heard.every(Boolean)}
  function stop(){operation++;clearTimeout(timer);sources.forEach(s=>{try{s.stop()}catch{}});sources=[];playing=false;window.speechSynthesis?.cancel();for(let i=0;i<2;i++)$('sound'+i).setAttribute('aria-pressed','false');controls()}
  function stars(n){$('stars').textContent=Array.from({length:6},(_,i)=>i<n?'★':'☆').join(' ');$('stars').setAttribute('aria-label',`${n} van 6 gevonden`)}
  function show(){stop();topic=questions[round];heard=[false,false];solved=false;$('round').textContent=`Vraag ${round+1} van 6`;$('question').textContent=`Welk geluid is ${topics[topic][targets[round]]}?`;$('feedback').textContent='Luister naar geluid 1 en geluid 2.';stars(round);$('next').hidden=true;$('restart').hidden=true;for(let i=0;i<2;i++){$('sound'+i).classList.remove('heard');$('sound'+i).textContent='▶ Luister '+(i+1);$('answer'+i).classList.remove('correct')}controls()}
  function begin(value){mode=value;round=0;positions=balanced();if(mode==='mixed'){let deck;do{deck=shuffle(Object.keys(topics).flatMap(topic=>[0,1].map(target=>({topic,target}))))}while(deck.some((q,i)=>i>0&&q.topic===deck[i-1].topic));questions=deck.map(q=>q.topic);targets=deck.map(q=>q.target)}else{questions=Array(6).fill(mode);targets=balanced()}['mixed',...Object.keys(topics)].forEach(key=>$(key).setAttribute('aria-pressed',key===mode));show()}
  function specification(index){const value=index===positions[round]?targets[round]:1-targets[round];return {frequency:topic==='pitch'?(value?660:220):440,gap:topic==='tempo'?(value?.25:.65):.45,gain:topic==='volume'?(value?.18:.045):.12}}
  async function listen(index){
    stop();const run=operation;playing=true;controls();$('feedback').textContent='Luister naar geluid '+(index+1)+'…';$('sound'+index).setAttribute('aria-pressed','true');
    try{ctx ||= new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();if(run!==operation)return;
      const spec=specification(index),now=ctx.currentTime+.04;
      for(let n=0;n<4;n++){const s=ctx.createOscillator(),g=ctx.createGain(),t=now+n*spec.gap;s.type='sine';s.frequency.value=spec.frequency;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(spec.gain,t+.02);g.gain.setValueAtTime(spec.gain,t+.15);g.gain.linearRampToValueAtTime(0,t+.2);s.connect(g).connect(ctx.destination);sources.push(s);s.start(t);s.stop(t+.21)}
      timer=setTimeout(()=>{if(run!==operation)return;playing=false;heard[index]=true;$('sound'+index).setAttribute('aria-pressed','false');$('sound'+index).classList.add('heard');$('sound'+index).textContent='↻ Nog eens '+(index+1);controls();$('feedback').textContent=solved?'Goed gehoord!':heard.every(Boolean)?'Welk geluid kies jij?':'Luister nu ook naar geluid '+(index===0?2:1)+'.'},(3*spec.gap+.28)*1000);
    }catch{if(run===operation){stop();$('feedback').textContent='Het geluid kon niet starten. Tik nog eens op Luister.'}}
  }
  function choose(index){if(playing||solved||!heard.every(Boolean))return;if(index!==positions[round]){$('feedback').textContent='Luister nog eens naar beide geluiden. Probeer opnieuw.';return}solved=true;stop();$('answer'+index).classList.add('correct');stars(round+1);$('feedback').textContent=`Goed gehoord! Geluid ${index+1} is ${topics[topic][targets[round]]}.`;if(round===5){$('round').textContent='Alle 6 gevonden!';$('restart').hidden=false}else $('next').hidden=false;controls()}
  ['mixed',...Object.keys(topics)].forEach(key=>$(key).onclick=()=>begin(key));for(let i=0;i<2;i++){$('sound'+i).onclick=()=>listen(i);$('answer'+i).onclick=()=>choose(i)}
  $('stop').onclick=()=>{stop();$('feedback').textContent='Gepauzeerd. Tik op Luister om het geluid opnieuw te horen.'};$('next').onclick=()=>{if(solved&&round<5){round++;show()}};$('restart').onclick=()=>begin(mode);
  $('help').onclick=()=>{stop();if(!window.speechSynthesis){$('feedback').textContent=$('question').textContent;return}const speech=new SpeechSynthesisUtterance($('question').textContent+' Luister naar geluid één en geluid twee. Kies daarna je antwoord.');speech.lang='nl-BE';speech.rate=.85;window.speechSynthesis.speak(speech)};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);begin('mixed');
})();
