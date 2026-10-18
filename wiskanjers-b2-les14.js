(() => {
'use strict';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const split=n=>[Math.floor(n/100),Math.floor(n%100/10),n%10];
function block(type){const n=el('span',type);n.setAttribute('role','img');n.setAttribute('aria-label',type==='rod'?'1 tiental':type==='unit'?'1 eenheid':'1 honderdtal');for(let i=0;i<(type==='rod'?10:type==='hundred-block'?100:0);i++)n.append(el('span'));return n;}
function board(target,values,show=false,eggs=false){
  target.replaceChildren();const grid=el('div','place-board');
  ['H','T','E'].forEach((name,i)=>{const col=el('div',`place-col ${name.toLowerCase()}`);col.append(el('h3',null,`${name} · ${['honderdtallen','tientallen','eenheden'][i]}`));const mat=el('div','material');
    for(let j=0;j<values[i];j++){if(eggs&&i===1){const carton=el('div','egg-carton');carton.setAttribute('aria-label','10 eieren');for(let k=0;k<10;k++)carton.append(el('span','egg'));mat.append(carton);}else mat.append(eggs&&i===2?el('span','egg'):block(['hundred-block','rod','unit'][i]));}
    const value=el('div','place-value');
    if(target.id==='build-board'){const input=el('input');input.type='text';input.inputMode='numeric';input.setAttribute('aria-label',`Noteer ${name}`);input.value=notes[i];input.oninput=()=>{notes[i]=input.value;};value.append(input);}else value.textContent=show?String(values[i]):'?';
    col.append(mat,value);grid.append(col);
  });target.append(grid);
}
function read(id){const n=Number($(id).value);if(!Number.isInteger(n)||n<0||n>100||$(id).value===''){ $(id).setCustomValidity('Kies een geheel getal van 0 tot en met 100.');$(id).reportValidity();return null;}$(id).setCustomValidity('');return n;}
['build-number','card-number'].forEach(id=>$(id).oninput=()=>$(id).setCustomValidity(''));
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==b.dataset.tab);document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){}};
let values=[0,0,0],show=false,notes=['','',''];
$('build-number').parentElement.remove();$('lay').remove();
const buildWriting=el('div','zone');buildWriting.innerHTML='<div class="controls"><button data-build-pen="pen" aria-pressed="true">Pen</button><button data-build-pen="green" aria-pressed="false">Groene pen</button><button data-build-pen="eraser" aria-pressed="false">Gum</button><button id="build-undo-ink">↶ Pennenstreek</button><button id="build-clear-ink">Wis schrijfvlak</button></div><svg id="build-write" viewBox="0 0 1100 200" aria-label="Noteer samen alles over het getal"><path d="M25 65H1075M25 130H1075M25 195H1075" stroke="#b8cdcc" fill="none" stroke-width="2"/><g id="build-ink"></g></svg>';
$('build-result').after(buildWriting);
// Match the writing coordinates to its visible size so line spacing stays generous.
const writingObserver=new ResizeObserver(()=>{
  const svg=$('build-write'),r=svg.getBoundingClientRect();
  if(!r.width||!r.height)return;
  svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);
  const gap=r.height/3;
  svg.querySelector('path').setAttribute('d',[1,2,3].map(i=>`M20 ${gap*i-10}H${r.width-20}`).join(''));
});
writingObserver.observe($('build-write'));
const total=()=>values[0]*100+values[1]*10+values[2];
function draw(){board($('build-board'),values,show);$('build-result').textContent=show?`${values[0]} H, ${values[1]} T en ${values[2]} E = ${total()}`:'';$('build-answer').textContent=show?'Verberg aantallen':'Toon voorbeeldantwoord';$('add-ten').disabled=total()+10>100;$('add-one').disabled=total()===100;$('remove-ten').disabled=values[1]===0;$('remove-one').disabled=values[2]===0;$('exchange').disabled=values[2]<10;$('hundred').disabled=values[1]<10;}
$('empty').onclick=()=>{values=[0,0,0];show=false;notes=['','',''];$('build-clear-ink').click();draw();};
$('add-ten').onclick=()=>{if(total()<=90)values[1]++;draw();};$('add-one').onclick=()=>{if(total()<100)values[2]++;draw();};$('remove-ten').onclick=()=>{if(values[1])values[1]--;draw();};$('remove-one').onclick=()=>{if(values[2])values[2]--;draw();};
$('exchange').onclick=()=>{if(values[2]>=10){values[2]-=10;values[1]++;$('build-hint').textContent='10 eenheden zijn geruild voor 1 tiental. Het getal blijft even groot.';draw();}};
$('hundred').onclick=()=>{if(values[1]>=10){values[1]-=10;values[0]++;$('build-hint').textContent='10 tientallen zijn 1 honderdtal: 100.';draw();}};
$('build-answer').onclick=()=>{show=!show;draw();};
const supply=el('div','controls');
['rod','unit'].forEach((type,i)=>{const b=el('button','build-supply');b.id=i?'supply-e':'supply-t';b.append(block(type),el('span',null,i?'Sleep een eenheid':'Sleep een tiental'));b.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const ghost=block(type);ghost.classList.add('build-ghost');document.body.append(ghost);const move=ev=>{ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';};move(e);const up=ev=>{ghost.remove();document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);const zone=document.elementFromPoint(ev.clientX,ev.clientY)?.closest(i?'#build-board .e':'#build-board .t');if(zone){show=false;$(i?'add-one':'add-ten').click();}};document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});};b.onclick=e=>{if(e.detail===0)$(i?'add-one':'add-ten').click();};supply.append(b);});
$('build-board').before(supply);
let buildTool='pen',buildStroke=null,buildStrokes=[];const bw=$('build-write');
document.querySelectorAll('[data-build-pen]').forEach(b=>b.onclick=()=>{buildTool=b.dataset.buildPen;document.querySelectorAll('[data-build-pen]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
function bp(e){const p=bw.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(bw.getScreenCTM().inverse());}
bw.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const p=bp(e);buildStroke=document.createElementNS('http://www.w3.org/2000/svg','path');Object.entries({d:`M${p.x} ${p.y}l.1 0`,stroke:buildTool==='eraser'?'white':buildTool==='green'?'#28705d':'#244b77','stroke-width':buildTool==='eraser'?26:4,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'}).forEach(([k,v])=>buildStroke.setAttribute(k,v));$('build-ink').append(buildStroke);buildStrokes.push(buildStroke);bw.setPointerCapture(e.pointerId);};bw.onpointermove=e=>{if(buildStroke){const p=bp(e);buildStroke.setAttribute('d',buildStroke.getAttribute('d')+`L${p.x} ${p.y}`);}};bw.onpointerup=bw.onpointercancel=()=>{buildStroke=null;};$('build-undo-ink').onclick=()=>buildStrokes.pop()?.remove();$('build-clear-ink').onclick=()=>{$('build-ink').replaceChildren();buildStrokes=[];};
let cardT=null,cardE=null,joined=false,cardShow=false;
$('card-number').parentElement.remove();$('card-lay').remove();
const cardControls=$('join').parentElement;
const cardEmpty=el('button',null,'Leeg bord');cardEmpty.id='cards-empty';cardControls.append(cardEmpty);
const cardAnswer=el('button',null,'Toon voorbeeldantwoord');cardAnswer.id='cards-answer';cardControls.append(cardAnswer);
const palette=el('div','card-palette');palette.id='card-palette';
['T','E'].forEach(type=>{const row=el('div','controls');row.append(el('strong',null,type==='T'?'Tientallen':'Eenheden'));const nums=type==='T'?[10,20,30,40,50,60,70,80,90,100]:[0,1,2,3,4,5,6,7,8,9];nums.forEach(n=>{const b=el('button',type==='T'?'palette-ten':'palette-one',n);b.dataset.cardType=type;b.dataset.cardValue=n;b.onclick=()=>placeCard(type,n);b.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const ghost=b.cloneNode(true);ghost.classList.add('card-ghost');document.body.append(ghost);let moved=false;const sx=e.clientX,sy=e.clientY;const move=ev=>{if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>5)moved=true;ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';};move(e);const up=ev=>{ghost.remove();document.removeEventListener('pointermove',move);if(document.elementFromPoint(ev.clientX,ev.clientY)?.closest('#value-cards')||!moved)placeCard(type,n);};document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});};row.append(b);});palette.append(row);});
$('value-cards').before(palette);
function placeCard(type,n){if(type==='T'){cardT=n;if(n===100)cardE=null;}else{if(cardT===100)return;cardE=n;}joined=false;cardShow=false;drawCards();}
function drawCards(){const box=$('value-cards');box.replaceChildren();box.classList.toggle('joined',joined&&cardT!==null&&cardT<100&&cardE!==null);
  if(cardT===null&&cardE===null)box.append(el('span','card-drop-hint','Sleep je kaarten hierheen'));
  if(cardT!==null)box.append(el('div','value-card',joined&&cardT<100&&cardE!==null?cardT/10:cardT));
  if(cardE!==null)box.append(el('div','value-card ones',cardE));
  $('join').disabled=cardT===null||cardE===null;$('join').textContent=joined?'Schuif uit elkaar':'Schuif samen';
  $('card-result').textContent=cardShow?`${cardT||0} + ${cardE||0} = ${(cardT||0)+(cardE||0)}`:'';
  cardAnswer.textContent=cardShow?'Verberg voorbeeldantwoord':'Toon voorbeeldantwoord';cardAnswer.disabled=cardT===null&&cardE===null;
}
$('join').onclick=()=>{joined=!joined;drawCards();};cardAnswer.onclick=()=>{cardShow=!cardShow;drawCards();};
const cw=el('div','zone');cw.innerHTML=buildWriting.innerHTML.replaceAll('build-','cards-');$('card-board').replaceWith(cw);cw.id='cards-writing';
let ct='pen',cs=null,cst=[];const csv=$('cards-write');
document.querySelectorAll('[data-cards-pen]').forEach(b=>b.onclick=()=>{ct=b.dataset.cardsPen;document.querySelectorAll('[data-cards-pen]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
function cp(e){const p=csv.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(csv.getScreenCTM().inverse());}
csv.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const p=cp(e);cs=document.createElementNS('http://www.w3.org/2000/svg','path');Object.entries({d:`M${p.x} ${p.y}l.1 0`,stroke:ct==='eraser'?'white':ct==='green'?'#28705d':'#244b77','stroke-width':ct==='eraser'?26:4,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'}).forEach(([k,v])=>cs.setAttribute(k,v));$('cards-ink').append(cs);cst.push(cs);csv.setPointerCapture(e.pointerId);};csv.onpointermove=e=>{if(cs){const p=cp(e);cs.setAttribute('d',cs.getAttribute('d')+`L${p.x} ${p.y}`);}};csv.onpointerup=csv.onpointercancel=()=>{cs=null;};$('cards-undo-ink').onclick=()=>cst.pop()?.remove();$('cards-clear-ink').onclick=()=>{$('cards-ink').replaceChildren();cst=[];};cardEmpty.onclick=()=>{cardT=cardE=null;joined=cardShow=false;$('cards-clear-ink').click();drawCards();};
new ResizeObserver(()=>{const r=csv.getBoundingClientRect();if(!r.width||!r.height)return;csv.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);csv.querySelector('path').setAttribute('d',[1,2,3].map(i=>`M20 ${r.height*i/3-10}H${r.width-20}`).join(''));}).observe(csv);
// Keep concrete material available beside the cards; neither fills in the other.
const cm=el('div');cm.id='cards-material';
const cmTools=el('div','controls');let cmValues=[0,0,0];
function cmDraw(){board(cm,cmValues);cm.querySelectorAll('.place-value').forEach((v,i)=>{v.textContent='';const input=el('input');input.setAttribute('aria-label',`Noteer ${['H','T','E'][i]} bij de kaarten`);v.append(input);});}
['rod','unit'].forEach((type,i)=>{const b=el('button','build-supply');b.append(block(type),el('span',null,i?'Sleep een eenheid':'Sleep een tiental'));const add=()=>{const sum=cmValues[0]*100+cmValues[1]*10+cmValues[2];if(sum+(i?1:10)<=100){cmValues[i?2:1]++;cmDraw();}};b.onclick=add;b.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const ghost=block(type);ghost.classList.add('build-ghost');document.body.append(ghost);const move=ev=>{ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';};move(e);const up=ev=>{ghost.remove();document.removeEventListener('pointermove',move);if(document.elementFromPoint(ev.clientX,ev.clientY)?.closest(i?'#cards-material .e':'#cards-material .t'))add();};document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});};cmTools.append(b);});
const cmWrap=el('div');cmWrap.id='cards-concrete';cmWrap.append(cmTools,cm);$('cards-writing').before(cmWrap);cmDraw();const oldEmpty=cardEmpty.onclick;cardEmpty.onclick=()=>{oldEmpty();cmValues=[0,0,0];cmDraw();};
const exercises=[];
[45,37,97,59,47,62,40,4,100].forEach(n=>exercises.push({kind:'picture',n}));
[94,51,72,39,63,80,6,100].forEach(n=>exercises.push({kind:'split',n}));
[94,83,25,41,58,30,9,100].forEach(n=>exercises.push({kind:'compose',n}));
[38,53,70,9].forEach(n=>exercises.push({kind:'eggs',n}));
let list=exercises,index=0,revealed=false,help=false,strokes=[];
function drawExercise(){const x=list[index],v=split(x.n);$('progress').textContent=`Oefening ${index+1} van ${list.length}`;$('prev').disabled=index===0;$('next').disabled=index===list.length-1;
  $('question').textContent=x.kind==='split'?'Ontleed het getal in H, T en E.':x.kind==='compose'?'Stel het getal samen.':'Hoeveel tientallen en eenheden? Welk getal is dit?';
  $('practice-board').hidden=['split','compose'].includes(x.kind);if(!$('practice-board').hidden)board($('practice-board'),v,revealed,x.kind==='eggs');
  $('prompt').textContent=x.kind==='split'?String(x.n):x.kind==='compose'?`${v[0]} H · ${v[1]} T · ${v[2]} E`:'';
  $('fields').replaceChildren();
  const specs=x.kind==='compose'?[['number','Het getal',x.n,100]]:[['h','H',v[0],1],['t','T',v[1],9],['e','E',v[2],9],...(x.kind==='split'?[]:[['number','Het getal',x.n,100]])];
  specs.forEach(([id,label,val,max])=>{const l=el('label','answer-field',label+' '),input=el('input');input.type='number';input.min=0;input.max=max;input.step=1;input.id='response-'+id;input.dataset.correct=val;input.required=true;input.setAttribute('aria-label',label);l.append(input);$('fields').append(l);});
  $('feedback').textContent='';$('help-text').hidden=!help;$('help-text').textContent='Tel eerst de tientallen: ieder staafje of elke volle eierdoos is 10. Tel daarna de losse eenheden. Bij 100 gebruik je 1 H, 0 T en 0 E.';$('help').textContent=help?'Verberg hulp':'Toon hulp';$('answer').textContent='Toon antwoord';
}
function reset(){revealed=false;help=false;strokes=[];$('ink').replaceChildren();drawExercise();}
$('prev').onclick=()=>{if(index>0){index--;reset();}};$('next').onclick=()=>{if(index<list.length-1){index++;reset();}};$('kind').onchange=()=>{list=exercises.filter(e=>$('kind').value==='all'||e.kind===$('kind').value);index=0;reset();};
$('check-form').onsubmit=e=>{e.preventDefault();const inputs=[...$('fields').querySelectorAll('input')];const ok=inputs.every(i=>i.value!==''&&Number(i.value)===Number(i.dataset.correct));$('feedback').textContent=ok?'Juist! Verwoord samen de waarde van elk cijfer.':'Kijk nog eens naar H, T en E. Tel de tientallen en de losse eenheden opnieuw.';};
$('answer').onclick=()=>{revealed=!revealed;const x=list[index],v=split(x.n);if(['picture','eggs'].includes(x.kind))board($('practice-board'),v,revealed,x.kind==='eggs');$('feedback').textContent=revealed?`${v[0]} H, ${v[1]} T en ${v[2]} E = ${x.n}`:'';$('answer').textContent=revealed?'Verberg antwoord':'Toon antwoord';};
$('help').onclick=()=>{help=!help;$('help-text').hidden=!help;$('help').textContent=help?'Verberg hulp':'Toon hulp';};
let tool='pen',active=null;document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
const write=$('write');function point(e){const p=write.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(write.getScreenCTM().inverse());}
write.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const p=point(e);active=document.createElementNS('http://www.w3.org/2000/svg','path');Object.entries({d:`M${p.x} ${p.y}l0.1 0`,stroke:tool==='eraser'?'white':tool==='green'?'#28705d':'#244b77','stroke-width':tool==='eraser'?26:4,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'}).forEach(([k,v])=>active.setAttribute(k,v));$('ink').append(active);strokes.push(active);write.setPointerCapture(e.pointerId);};
write.onpointermove=e=>{if(active){const p=point(e);active.setAttribute('d',active.getAttribute('d')+`L${p.x} ${p.y}`);}};write.onpointerup=write.onpointercancel=()=>{active=null;};$('undo').onclick=()=>strokes.pop()?.remove();$('clear').onclick=()=>{$('ink').replaceChildren();strokes=[];};
draw();drawCards();drawExercise();board($('memory-board'),[0,4,3],true);
})();
