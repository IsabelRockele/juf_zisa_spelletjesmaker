(() => {
  'use strict';
  const $ = id => document.getElementById(id), ns = 'http://www.w3.org/2000/svg';
  let hour = 4, arc = true, answer = false, example = 0, targetIndex = 0, selected = null, checked = false;
  const examples = [4,8,11,6], targets = [9,3,10,4,8,11,6,12,2,7,1,5];
  let digitalChoices = false, choices = [];
  function node(tag, attrs = {}, text) { const el = document.createElementNS(ns,tag); for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value); if (text !== undefined) el.textContent = text; return el; }
  function point(angle, radius) { const radians = (angle-90)*Math.PI/180; return {x:200+Math.cos(radians)*radius,y:200+Math.sin(radians)*radius}; }
  function drawClock(svg, value, interactive = false) {
    svg.replaceChildren();
    svg.append(node('circle',{cx:200,cy:200,r:174,fill:'white',stroke:'#5e6d68','stroke-width':3}));
    for(let minute=0;minute<60;minute++) { const a=point(minute*6,minute%5===0?158:166),b=point(minute*6,173); svg.append(node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#65766d','stroke-width':minute%5===0?3:1})); }
    for(let n=1;n<=12;n++){const p=point(n*30,139);svg.append(node('text',{x:p.x,y:p.y+9,'text-anchor':'middle','font-family':'Nunito,Arial','font-size':29,'font-weight':700,fill:'#243b45'},n));}
    if(arc){if(value===12) svg.append(node('circle',{cx:200,cy:200,r:186,fill:'none',stroke:'#ce303a','stroke-width':8})); else {const end=point(value*30,186);svg.append(node('path',{d:`M200 14 A186 186 0 ${value>6?1:0} 1 ${end.x} ${end.y}`,fill:'none',stroke:'#ce303a','stroke-width':8,'stroke-linecap':'round'}));}}
    svg.append(node('path',{d:'M200 200 L200 75',stroke:'#079dca','stroke-width':7,'stroke-linecap':'round'}));
    svg.append(node('path',{d:'M200 59 L191 80 L209 80 Z',fill:'#079dca'}));
    const hand=node('g',{transform:`rotate(${value*30} 200 200)`});
    hand.append(node('path',{d:'M200 206 L200 118',stroke:'#ce303a','stroke-width':10,'stroke-linecap':'round'}),node('path',{d:'M200 100 L188 124 L212 124 Z',fill:'#ce303a'}));
    if(interactive){const hit=node('path',{d:'M200 208 L200 98',stroke:'transparent','stroke-width':42,class:'hour-hit'});hand.append(hit);}
    svg.append(hand,node('circle',{cx:200,cy:200,r:7,fill:'#243b45'}));
  }
  function renderMain(){drawClock($('main-clock'),hour,true);$('hour').value=hour;$('answer').toggleAttribute('hidden',!answer);$('show-answer').textContent=answer?'Verberg antwoord':'Toon antwoord';$('show-answer').setAttribute('aria-pressed',String(answer));$('digital-hours').textContent=String(hour).padStart(2,'0');$('word-hours').textContent=hour;$('main-clock').setAttribute('aria-label',answer?`Wijzerklok: ${hour} uur`:'Wijzerklok met een korte rode en lange blauwe wijzer');}
  function setHour(value){const next=((value-1+12)%12)+1;if(next!==hour){hour=next;answer=false;clearInk();}renderMain();}
  for(let n=1;n<=12;n++){const option=document.createElement('option');option.value=n;option.textContent=`${n} uur`;$('hour').append(option);}
  $('hour').addEventListener('change',()=>setHour(Number($('hour').value)));
  $('previous-hour').addEventListener('click',()=>setHour(hour-1));$('next-hour').addEventListener('click',()=>setHour(hour+1));
  $('next-example').addEventListener('click',()=>{example=(example+1)%examples.length;setHour(examples[example]);});
  $('show-answer').addEventListener('click',()=>{answer=!answer;renderMain();});
  $('arc-toggle').addEventListener('click',()=>{arc=!arc;$('arc-toggle').textContent=arc?'Verberg urenboog':'Toon urenboog';$('arc-toggle').setAttribute('aria-pressed',String(arc));renderMain();renderChoices();renderNear();});
  let clockPointer=null;
  function dragHour(event){const svg=$('main-clock'),p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());if(Math.hypot(q.x-200,q.y-200)<35)return;const a=(Math.atan2(q.x-200,200-q.y)*180/Math.PI+360)%360;setHour(Math.round(a/30)%12||12);}
  $('main-clock').addEventListener('pointerdown',event=>{if(event.button!==0||clockPointer!==null||!event.target.closest('.hour-hit'))return;event.preventDefault();clockPointer=event.pointerId;$('main-clock').setPointerCapture(clockPointer);});
  $('main-clock').addEventListener('pointermove',event=>{if(event.pointerId===clockPointer){event.preventDefault();dragHour(event);}});
  const endClock=event=>{if(event.pointerId===clockPointer)clockPointer=null;};['pointerup','pointercancel','lostpointercapture'].forEach(name=>$('main-clock').addEventListener(name,endClock));
  function renderChoices(){
    const target=targets[targetIndex], wrap=n=>(n-1)%12+1;
    choices=[wrap(target+1+targetIndex%3),wrap(target+5+targetIndex%4)];
    choices.splice((targetIndex+(digitalChoices?1:0))%3,0,target);
    $('target-hours').textContent=String(target).padStart(2,'0');$('clock-choices').replaceChildren();
    $('digital-question').hidden=digitalChoices;$('analog-question').toggleAttribute('hidden',!digitalChoices);
    if(digitalChoices)drawClock($('analog-question'),target);
    $('clock-choices').classList.toggle('digital-choices',digitalChoices);
    $('exercise-count').textContent=`Oefening ${targetIndex+1} van ${targets.length}`;
    $('choose-analog').setAttribute('aria-pressed',String(!digitalChoices));$('choose-digital').setAttribute('aria-pressed',String(digitalChoices));
    choices.forEach((value,i)=>{
      const button=document.createElement('button');button.className='clock-choice';button.setAttribute('aria-pressed',String(selected===i));
      if(digitalChoices){
        button.setAttribute('aria-label',`${String(value).padStart(2,'0')}:00`);
        const display=document.createElement('div');display.className='digital-time';
        for(const [text,className] of [[String(value).padStart(2,'0'),'hours'],[':','colon'],['00','minutes']]){const part=document.createElement('span');part.className=className;part.textContent=text;display.append(part);}button.append(display);
      }else{
        button.setAttribute('aria-label',['Linker klok','Middelste klok','Rechter klok'][i]);const svg=node('svg',{viewBox:'0 0 400 400','aria-hidden':'true'});drawClock(svg,value);const label=document.createElement('span');label.textContent=['Links','Midden','Rechts'][i];button.append(svg,label);
      }
      if(checked&&selected===i)button.classList.add(value===target?'correct':'incorrect');
      button.addEventListener('click',()=>{selected=i;checked=false;renderChoices();});$('clock-choices').append(button);
    });
    $('check-match').disabled=selected===null;
    $('match-feedback').textContent=checked?(choices[selected]===target?`Juist. Het is ${target} uur.`:'Kijk nog eens naar de korte rode wijzer.'):(digitalChoices?'Welke digitale klok hoort erbij?':'Welke wijzerklok hoort erbij?');
  }
  function setMatchType(digital){digitalChoices=digital;targetIndex=0;selected=null;checked=false;renderChoices();}
  $('choose-analog').addEventListener('click',()=>setMatchType(false));$('choose-digital').addEventListener('click',()=>setMatchType(true));
  $('check-match').addEventListener('click',()=>{if(selected!==null){checked=true;renderChoices();}});
  $('reset-match').addEventListener('click',()=>{selected=null;checked=false;renderChoices();});
  function nextTarget(delta){targetIndex=(targetIndex+delta+targets.length)%targets.length;selected=null;checked=false;renderChoices();}
  $('previous-match').addEventListener('click',()=>nextTarget(-1));$('next-match').addEventListener('click',()=>nextTarget(1));
  function mode(match){$('near-panel').hidden=true;$('mode-near').setAttribute('aria-pressed','false');$('read-panel').hidden=match;$('match-panel').hidden=!match;$('mode-read').setAttribute('aria-pressed',String(!match));$('mode-match').setAttribute('aria-pressed',String(match));}
  $('mode-read').addEventListener('click',()=>mode(false));$('mode-match').addEventListener('click',()=>mode(true));
  const paper=$('paper'),ink=$('ink');let pen='#243b45',erase=false,stroke=null,inkPointer=null,history=[];
  function clearInk(){ink.replaceChildren();history=[];$('ink-undo').disabled=true;}
  function remember(){history.push(ink.innerHTML);if(history.length>100)history.shift();$('ink-undo').disabled=false;}
  function penPoint(event){const p=paper.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(paper.getScreenCTM().inverse());}
  function rub(p){for(const path of [...ink.children])for(let d=0;d<=path.getTotalLength();d+=5){const q=path.getPointAtLength(d);if(Math.hypot(p.x-q.x,p.y-q.y)<16){path.remove();break;}}}
  function selectPen(){document.querySelectorAll('[data-pen]').forEach(b=>b.setAttribute('aria-pressed',String(!erase&&b.dataset.pen===pen)));$('eraser').setAttribute('aria-pressed',String(erase));paper.classList.toggle('erasing',erase);}
  document.querySelectorAll('[data-pen]').forEach(b=>b.addEventListener('click',()=>{pen=b.dataset.pen;erase=false;selectPen();}));$('eraser').addEventListener('click',()=>{erase=!erase;selectPen();});
  paper.addEventListener('pointerdown',event=>{if(event.button!==0||inkPointer!==null)return;event.preventDefault();inkPointer=event.pointerId;paper.setPointerCapture(inkPointer);remember();const p=penPoint(event);if(erase){rub(p);return;}stroke=node('path',{stroke:pen,'stroke-width':4,d:`M${p.x} ${p.y}l.1 .1`});ink.append(stroke);});
  paper.addEventListener('pointermove',event=>{if(event.pointerId!==inkPointer)return;event.preventDefault();const samples=event.getCoalescedEvents?.();for(const sample of samples?.length?samples:[event]){const p=penPoint(sample);if(erase)rub(p);else if(stroke)stroke.setAttribute('d',stroke.getAttribute('d')+`L${p.x} ${p.y}`);}});
  const endInk=event=>{if(event.pointerId===inkPointer){inkPointer=null;stroke=null;}};['pointerup','pointercancel','lostpointercapture'].forEach(name=>paper.addEventListener(name,endInk));
  $('ink-undo').addEventListener('click',()=>{if(history.length)ink.innerHTML=history.pop();$('ink-undo').disabled=!history.length;});$('ink-clear').addEventListener('click',()=>{if(ink.children.length){remember();ink.replaceChildren();}});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('message').textContent='Gebruik eventueel F11 voor volledig scherm.';}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Verlaat volledig scherm':'Volledig scherm';});
  const nearHours=[5,9,1,7,12,3,10,2,6,11,4,8];
  let nearMode='mixed',nearIndex=0,nearReveal=false;
  function nearExercises(){return nearHours.flatMap((h,i)=>[{h,type:'before',minute:[55,57,56][i%3]},{h,type:'after',minute:[3,5,4][i%3]}]).filter(e=>nearMode==='mixed'||e.type===nearMode);}
  function renderNear(){const list=nearExercises(),e=list[nearIndex],svg=$('near-clock');const value=e.type==='before'?((e.h+11)%12)+e.minute/60:e.h%12+e.minute/60;
    drawClock(svg,value);
    Array.from(svg.children).filter(n=>n.tagName==='path'&&(n.getAttribute('stroke')==='#079dca'||n.getAttribute('fill')==='#079dca')).forEach(n=>n.setAttribute('transform',`rotate(${e.minute*6} 200 200)`));
    if(arc){const end=point(e.minute*6,200);svg.append(node('path',{d:`M200 0 A200 200 0 ${e.minute>30?1:0} 1 ${end.x} ${end.y}`,fill:'none',stroke:'#079dca','stroke-width':8}));}
    $('near-count').textContent=`Oefening ${nearIndex+1} van ${list.length}`;$('near-prompt').textContent=e.type==='before'?'Het is bijna':'Het is net over';$('near-answer').textContent=nearReveal?'Verberg antwoord':'Toon antwoord';$('near-result').textContent=nearReveal?`Het is ${e.type==='before'?'bijna':'net over'} ${e.h} uur.`:'';
  }
  function resetNear(){nearReveal=false;$('near-input').value='';$('near-ink').replaceChildren();renderNear();}
  $('mode-near').onclick=()=>{$('read-panel').hidden=true;$('match-panel').hidden=true;$('near-panel').hidden=false;$('mode-read').setAttribute('aria-pressed','false');$('mode-match').setAttribute('aria-pressed','false');$('mode-near').setAttribute('aria-pressed','true');};
  $('near-type').onchange=()=>{nearMode=$('near-type').value;nearIndex=0;resetNear();};
  $('near-prev').onclick=()=>{nearIndex=(nearIndex-1+nearExercises().length)%nearExercises().length;resetNear();};$('near-next').onclick=()=>{nearIndex=(nearIndex+1)%nearExercises().length;resetNear();};$('near-answer').onclick=()=>{nearReveal=!nearReveal;renderNear();};
  const nearPaper=$('near-paper'),nearInk=$('near-ink');let nearPointer=null,nearStroke=null;
  function nearPoint(e){const p=nearPaper.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(nearPaper.getScreenCTM().inverse());}
  nearPaper.addEventListener('pointerdown',e=>{if(e.button!==0||nearPointer!==null)return;e.preventDefault();nearPointer=e.pointerId;nearPaper.setPointerCapture(e.pointerId);const p=nearPoint(e);nearStroke=node('path',{d:`M${p.x} ${p.y}l.1 .1`});nearInk.append(nearStroke);});
  nearPaper.addEventListener('pointermove',e=>{if(e.pointerId!==nearPointer)return;const p=nearPoint(e);nearStroke.setAttribute('d',nearStroke.getAttribute('d')+`L${p.x} ${p.y}`);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>nearPaper.addEventListener(type,()=>{nearPointer=null;nearStroke=null;}));
  $('near-undo').onclick=()=>nearInk.lastElementChild?.remove();$('near-clear').onclick=()=>{nearInk.replaceChildren();$('near-input').value='';};
  clearInk();renderMain();renderChoices();renderNear();
})();
