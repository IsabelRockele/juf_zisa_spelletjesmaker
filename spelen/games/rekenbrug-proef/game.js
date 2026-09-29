(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const grade=new URLSearchParams(location.search).get('leerjaar')==='1'?1:2;
  const gameName=grade===1?'Bibi’s rekenbrug':'Zisa’s rekenbrug';
  document.title=gameName+' · tot 20';
  document.querySelector('.intro h1').textContent=gameName;
  const home=document.querySelector('header a');
  home.textContent=grade===1?'← Bibi’s rekenhuis':'← Zisa’s rekeneiland';
  home.href=grade===1?'../start_leerjaar1.html#rekenen':'../eilanden-leerjaar2.html#rekenen';
  if(new URLSearchParams(location.search).get('ontdek')==='1'){
    home.textContent='← Terug naar Ontdek';
    home.href='../../../ontdek/zisa-spelen.html';
  }
  let config, exercises, index, stage, first, rest, answer, helped, error, records;
  let advanceTimer;
  const cancelAdvance = () => { clearTimeout(advanceTimer); advanceTimer=null; };
  const result = e => e.op === '+' ? e.a + e.b : e.a - e.b;
  const isBridge = e => e.op === '+' ? e.a < 10 && result(e) > 10 : e.a > 10 && e.a < 20 && e.b < 10 && result(e) < 10;
  const shuffle = a => { for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  function pool(op, bridge) {
    const out=[];
    for(let a=1;a<20;a++) for(let b=1;b<10;b++) {
      const e={a,b,op}; if(result(e)<0 || result(e)>20) continue;
      if(isBridge(e)===bridge) out.push(e);
    }
    return shuffle(out);
  }
  function start() {
    cancelAdvance();
    const pools={}; for(const op of ['+','−']) for(const bridge of [true,false]) pools[op+bridge]=pool(op,bridge);
    const kinds=config.mode==='bridge'?Array(10).fill(true):shuffle([true,false,true,false,true,false,true,false,true,false]);
    const ops=config.op==='both'?shuffle(['+','−','+','−','+','−','+','−','+','−']):Array(10).fill(config.op);
    exercises=kinds.map((b,i)=>pools[ops[i]+b].pop());index=0;records=[];
    $('setup').hidden=true;$('finish').hidden=true;$('game').hidden=false;load();
  }
  function load(){cancelAdvance();window.scrollTo(0,0);first=null;rest=null;answer=null;helped=false;error=false;stage=config.mode==='bridge'?(config.support==='mental'?'answer':'place'):'recognize';render();}
  const current = () => exercises[index];
  function feedback(message,good=false){$('feedback').textContent=message;$('feedback').className=good?'good':'';}
  function splitMarkup(){return `<div class="split"><svg viewBox="0 0 110 32" aria-hidden="true"><path d="M55 0L20 30M55 0L90 30" fill="none" stroke="#53796c" stroke-width="3"/></svg><div class="split-values"><span class="${stage==='first'?'active':''}">${first??'?'}</span><span class="${stage==='rest'?'active':''}">${rest??'?'}</span></div></div>`;}
  function drawTenRing(){
    const equation=$('equation');
    equation.querySelector('.ten-ring')?.remove();
    if(first===null || $('game').hidden) return;
    const start=equation.querySelector('.number .value');
    const part=equation.querySelector('.split-values span');
    if(!start || !part) return;
    const box=equation.getBoundingClientRect(), a=start.getBoundingClientRect(), b=part.getBoundingClientRect();
    const x1=a.x+a.width/2-box.x, y1=a.y+a.height/2-box.y;
    const x2=b.x+b.width/2-box.x, y2=b.y+b.height/2-box.y;
    const cx=(x1+x2)/2, cy=(y1+y2)/2;
    const angle=Math.atan2(y2-y1,x2-x1)*180/Math.PI;
    const radius=Math.hypot(x2-x1,y2-y1)/2+42;
    const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg');
    svg.setAttribute('class','ten-ring');
    svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
    svg.setAttribute('aria-label',`${current().a} ${current().op} ${first} maakt 10`);
    svg.setAttribute('role','img');
    const ring=document.createElementNS(ns,'ellipse');
    for(const [key,value] of Object.entries({cx,cy,rx:radius,ry:35,transform:`rotate(${angle} ${cx} ${cy})`})) ring.setAttribute(key,value);
    const label=document.createElementNS(ns,'text');
    const radians=angle*Math.PI/180;
    const top=cy-Math.hypot(radius*Math.sin(radians),35*Math.cos(radians));
    label.setAttribute('x',x1);label.setAttribute('y',top-10);label.textContent='10';
    svg.append(ring,label);equation.append(svg);
  }
  new ResizeObserver(()=>requestAnimationFrame(drawTenRing)).observe($('equation'));
  function render(){
    const e=current(), guided=config.support==='guided'||helped;
    $('game').classList.toggle('has-entry',['first','rest','answer'].includes(stage));
    $('game').classList.toggle('recognizing',stage==='recognize'||(config.mode==='recognize'&&stage==='done'));
    $('counter').textContent=`Oefening ${index+1} van 10`;
    $('progress').innerHTML=exercises.map((_,i)=>`<span class="${i<index?'done':i===index?'current':''}"></span>`).join('');
    $('mode-label').textContent=config.mode==='recognize'?'BRUG SPEUREN':config.mode==='mixed'?'ALLES DOOR ELKAAR':'REKENEN MET BRUG';
    const prompts={recognize:'Met brug of zonder brug?',place:guided?'Plaats de splitsbenen.':'Los de bewerking op.',first:guided?(e.op==='+'?'Maak eerst 10.':'Ga eerst terug naar 10.'):'Vul je splitsing aan.',rest:guided?'Hoeveel blijft er nog over?':'Vul je splitsing aan.',answer:'Wat is het antwoord?',done:'Goed gewerkt!'};
    $('prompt').textContent=prompts[stage];
    $('instruction').textContent=stage==='recognize'?'Kijk naar de getallen. Je hoeft nog niet uit te rekenen.':stage==='place'?'Tik op het getal dat je gaat splitsen.':stage==='first'&&guided?(e.op==='+'?`Hoeveel moet er bij ${e.a} om 10 te maken?`:`Hoeveel moet er van ${e.a} af om 10 te krijgen?`):stage==='rest'&&guided?`Je splitst ${e.b} in ${first} en …`:stage==='answer'&&first!==null?`Reken verder vanaf 10.`:'Neem rustig de tijd.';
    $('equation').innerHTML=`<div class="number">${stage==='place'?`<button data-place="a" aria-label="Splits ${e.a}">${e.a}</button>`:`<div class="value">${e.a}</div>`}</div><span class="symbol">${e.op}</span><div class="number">${stage==='place'?`<button data-place="b" aria-label="Splits ${e.b}">${e.b}</button>`:`<div class="value">${e.b}</div>`}${first!==null||['first','rest'].includes(stage)?splitMarkup():''}</div><span class="symbol">=</span><div class="value">${answer??'?'}</div>`;
    $('work').innerHTML=first!==null?`<span class="ten-step">${e.a} ${e.op} ${first} = 10</span>${rest!==null?`<div>10 ${e.op} ${rest} = ${answer??'?'}</div>`:''}`:'';
    drawTenRing();
    $('interaction').replaceChildren();feedback('');$('next').hidden=stage!=='done'||config.mode==='recognize';$('help').hidden=stage==='done';
    if(stage==='recognize') {
      for(const [label,value] of [['🌉 Met brug',true],['Zonder brug',false]]) {const b=document.createElement('button');b.textContent=label;b.onclick=()=>recognize(value);$('interaction').append(b);}
    } else if(['first','rest','answer'].includes(stage)) {
      const form=document.createElement('form');form.innerHTML='<label for="entry" class="quiet">Jouw getal</label><div class="entry-row"><output id="entry" aria-label="Jouw getal" aria-live="polite"></output><button class="primary">Controleer ✓</button></div>';
      form.onsubmit=ev=>{ev.preventDefault();if($('entry').value===''){feedback('Kies eerst je getal.');return;}submit(Number($('entry').value));};
      $('interaction').append(form);
      const keypad=document.createElement('div');keypad.className='keypad';keypad.setAttribute('role','group');keypad.setAttribute('aria-label','Cijferknoppen');
      for(const key of ['1','2','3','4','5','⌫','6','7','8','9','0','Wis']) {
        const button=document.createElement('button');button.type='button';button.textContent=key;
        if(key==='⌫')button.setAttribute('aria-label','Laatste cijfer wissen');
        button.onclick=()=>enterDigit(key);keypad.append(button);
      }
      $('interaction').append(keypad);
    }
    document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{if(b.dataset.place==='a'){error=true;feedback(e.op==='+'?'Dat kan bij optellen ook. We oefenen nu om het eerste getal aan te vullen tot 10. Splits daarvoor het tweede getal.':'Splits het getal dat je eraf trekt. Het eerste getal is waar je begint.');return;}stage='first';render();});
  }
  function enterDigit(key){
    const input=$('entry');if(!input)return;
    if(key==='Wis')input.value='';
    else if(key==='⌫')input.value=input.value.slice(0,-1);
    else input.value=input.dataset.replace==='true'||input.value.length>=2?key:input.value+key;
    delete input.dataset.replace;
  }
  document.addEventListener('keydown',event=>{
    if($('game').hidden || !$('entry') || event.ctrlKey || event.metaKey || event.altKey)return;
    if(/^[0-9]$/.test(event.key)){event.preventDefault();enterDigit(event.key);}
    else if(event.key==='Backspace'){event.preventDefault();enterDigit('⌫');}
    else if(event.key==='Enter' && event.target===$('entry')){event.preventDefault();$('entry').form.requestSubmit();}
  });
  function explanation(){const e=current();if(e.op==='+')return isBridge(e)?`${e.a} heeft nog ${10-e.a} nodig tot 10. Je telt er ${e.b} bij: je gaat voorbij 10.`:result(e)===10?'Je komt precies op 10. Je gaat er niet voorbij, dus zonder brug.':'Je hoeft niet voorbij het volgende tiental: zonder brug.';return isBridge(e)?`Je hebt ${e.a%10} eenheden en moet er ${e.b} aftrekken. Je gaat voorbij 10 naar beneden.`:result(e)===10?'Je komt precies op 10. Je gaat er niet voorbij, dus zonder brug.':'Je hoeft geen tiental te overschrijden: zonder brug.';}
  function recognize(value){if(stage!=='recognize')return;if(value!==isBridge(current())){error=true;feedback('Kijk nog eens. '+explanation());return;}if(config.mode==='recognize'){complete();feedback('Juist! '+explanation(),true);advanceTimer=setTimeout(nextExercise,1800);}else{stage=isBridge(current())&&config.support!=='mental'?'place':'answer';render();feedback('Juist! '+explanation(),true);}}
  function submit(value){const e=current();const expected=stage==='first'?(e.op==='+'?10-e.a:e.a-10):stage==='rest'?e.b-first:result(e);if(value!==expected){error=true;feedback(stage==='first'?'Probeer opnieuw. Welke stap brengt je precies bij 10?':stage==='rest'?`De twee delen moeten samen ${e.b} zijn. Je hebt al ${first}.`:'Nog niet helemaal. Probeer opnieuw of tik op ‘Help mij’.');$('entry').dataset.replace='true';return;}if(stage==='first'){first=value;stage='rest';render();}else if(stage==='rest'){rest=value;stage='answer';render();}else{answer=value;complete();feedback('Dat klopt! Je hebt deze oefening afgewerkt.',true);}}
  function complete(){stage='done';records.push({helped,error});render();}
  $('help').onclick=()=>{helped=true;const e=current();if(stage==='answer'&&isBridge(e)&&first===null){stage='place';render();feedback('We doen het samen. Splits het tweede getal om eerst bij 10 te komen.');}else if(stage==='recognize'){feedback(e.op==='+'?'Kijk naar de eenheden. Zijn die samen meer dan 10? Dan is het met brug. Precies 10 is zonder brug.':e.a===10?'Je begint op 10 en rekent terug. Dat oefenen we zonder brug.':`Kijk naar de eenheden. Heb je genoeg eenheden om ${e.b} af te trekken?`);}else{render();feedback(stage==='place'?'We splitsen het tweede getal. Zo rekenen we eerst naar 10.':stage==='first'?'Gebruik het eerste deel om precies bij 10 te komen.':stage==='rest'?`Wat moet er nog bij ${first} om ${e.b} te maken?`:e.op==='+'?'Tel de eenheden erbij. Je mag je vingers of materiaal gebruiken.':'Trek de eenheden eraf. Je mag je vingers of materiaal gebruiken.');}};
  function nextExercise(){cancelAdvance();if(++index<10){load();return;}$('game').hidden=true;$('finish').hidden=false;const independent=records.filter(r=>!r.helped&&!r.error).length;const help=records.filter(r=>r.helped).length;$('results').textContent=`10 oefeningen afgewerkt. ${independent} lukten meteen zonder hulp. Bij ${help} oefeningen gebruikte je de hulpknop. Opnieuw proberen mag altijd!`;};
  $('next').onclick=nextExercise;
  function choose(){cancelAdvance();window.scrollTo(0,0);$('setup').hidden=false;$('game').hidden=true;$('finish').hidden=true;}
  $('back').onclick=choose;$('choose').onclick=choose;$('again').onclick=start;
  $('settings').onsubmit=e=>{e.preventDefault();config=Object.fromEntries(new FormData(e.target));start();};
  $('settings').onchange=()=>{$('support').hidden=new FormData($('settings')).get('mode')==='recognize';};$('support').hidden=true;
})();
