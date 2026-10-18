(() => {
'use strict';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const small=['nul','een','twee','drie','vier','vijf','zes','zeven','acht','negen','tien','elf','twaalf','dertien','veertien','vijftien','zestien','zeventien','achttien','negentien'];
const tens=['','','twintig','dertig','veertig','vijftig','zestig','zeventig','tachtig','negentig'];
function word(n,parts=false){if(n<20)return small[n];if(n===100)return 'honderd';const t=Math.floor(n/10),e=n%10;return e?small[e]+(parts?'-en-':e===2||e===3?'ën':'en')+tens[t]:tens[t];}
function digits(n){const s=el('span');if(n===100){s.textContent='100';return s;}if(n>=10)s.append(el('span','t-digit',Math.floor(n/10)));s.append(el('span','e-digit',n%10));return s;}
const NS='http://www.w3.org/2000/svg';
function svgNode(tag,attrs){const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;}
function carton(){const s=svgNode('svg',{viewBox:'0 0 180 120',role:'img','aria-label':'Een open eierdoos met tien eieren in twee rijen van vijf',class:'real-carton'});
  s.append(svgNode('path',{d:'M13 12H167L158 48H22Z',fill:'#f8e9b9',stroke:'#d5bd7f','stroke-width':3}),svgNode('path',{d:'M24 20H156L151 39H29Z',fill:'#fff5d3'}),svgNode('path',{d:'M16 58H164L158 108H22Z',fill:'#ecdbab',stroke:'#cbb37e','stroke-width':2}));
  for(let row=0;row<2;row++)for(let col=0;col<5;col++){const x=34+col*28,y=67+row*27;s.append(svgNode('ellipse',{cx:x,cy:y+8,rx:12,ry:6,fill:'#d7c28d'}),svgNode('path',{d:`M${x-9} ${y+3}C${x-10} ${y-5} ${x-5} ${y-17} ${x} ${y-17}C${x+5} ${y-17} ${x+10} ${y-5} ${x+9} ${y+3}C${x+8} ${y+13} ${x-8} ${y+13} ${x-9} ${y+3}Z`,fill:'#fffdf0',stroke:'#d1bc8b','stroke-width':1.5}));}
  s.append(svgNode('path',{d:'M19 106L28 115H152L161 106',fill:'#f2e3b8',stroke:'#d0b981','stroke-width':2}));return s;}
function material(target,n,eggs=false){target.replaceChildren();const grid=el('div',eggs?'egg-display':'te-board');
  [Math.floor(n/10),n%10].forEach((count,i)=>{const col=el('div',i?'e-col':'t-col');if(!eggs)col.append(el('h3',null,i?'E · eenheden':'T · tientallen'));const mat=el('div','material');
    for(let j=0;j<count;j++){if(eggs){mat.append(i?el('span','loose-egg'):carton());}else{const b=el('span',i?'unit':'rod');b.setAttribute('aria-label',i?'Eén eenheid':'Eén tiental');if(!i)for(let k=0;k<10;k++)b.append(el('span'));mat.append(b);}}
    col.append(mat);grid.append(col);
  });target.append(grid);
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==b.dataset.tab);document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));if(window.speechSynthesis)window.speechSynthesis.cancel();});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){}};
function speak(n){if(!('speechSynthesis'in window)){ $('speech-status').textContent='Voorlezen is hier niet beschikbaar. Lees het getal zelf hardop.';return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word(n));u.lang='nl-BE';u.rate=.8;const voices=window.speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang==='nl-BE')||voices.find(v=>v.lang.startsWith('nl'))||null;u.onerror=()=>{$('speech-status').textContent='De voorleesstem is niet beschikbaar. De leerkracht kan het woord voorlezen.';};window.speechSynthesis.speak(u);}
let number=0,readingHelp=false,readT=0,readE=0;
const readSection=$('read');
readSection.querySelector('.controls').remove();
const tools=el('div','controls');tools.innerHTML='<button id="supply-ten" class="supply-piece" aria-label="Sleep een tiental naar T"><span class="rod">'+ '<span></span>'.repeat(10)+'</span><span>Sleep een tiental</span></button><button id="supply-one" class="supply-piece" aria-label="Sleep een eenheid naar E"><span class="unit"></span><span>Sleep een eenheid</span></button><button id="read-empty">Leeg bord</button><button id="read-example">Toon voorbeeldantwoord</button>';
readSection.insertBefore(tools,$('read-picture'));
const note=el('p','hint','Sleep materiaal naar T of E. Sleep het terug naar de voorraad om het weg te nemen. Tikken op de voorraad kan ook. Noteer zelf hieronder.');tools.after(note);
const writing=el('div','zone');writing.innerHTML='<div class="controls"><button data-read-tool="pen" aria-pressed="true">Pen</button><button data-read-tool="green" aria-pressed="false">Groene pen</button><button data-read-tool="eraser" aria-pressed="false">Gum</button><button id="read-undo">↶ Pennenstreek</button><button id="read-clear">Wis schrijfvlak</button></div><svg id="read-write" viewBox="0 0 1100 200" aria-label="Noteer zelf de splitsing, het getal en het getalwoord"><path d="M25 65H1075M25 130H1075M25 195H1075" stroke="#b8cdcc" fill="none" stroke-width="2"/><g id="read-ink"></g></svg>';
$('read-cards').before(writing);
function read(){number=readT*10+readE;material($('read-picture'),number);$('read-cards').replaceChildren();$('read-cards').hidden=!readingHelp;$('read-word').textContent=readingHelp?word(number,true):'';$('reading-rule').hidden=true;
  if(readingHelp){$('read-cards').append(el('span',null,readT*10),el('span',null,'+'),el('span',null,readE),el('span',null,'='),digits(number));}
  $('read-example').textContent=readingHelp?'Verberg voorbeeldantwoord':'Toon voorbeeldantwoord';
  ['t','e'].forEach((type,i)=>{const zone=$('read-picture').querySelector(i?'.e-col .material':'.t-col .material');zone.dataset.drop=type;zone.setAttribute('aria-label',i?'Eenheden neerleggen':'Tientallen neerleggen');[...zone.children].forEach(piece=>{piece.dataset.piece=type;piece.classList.add('movable');});});
}
function addPiece(type){if(type==='t'&&number+10<=100)readT++;else if(type==='e'&&readE<9&&number<100)readE++;else return;readingHelp=false;read();}
let drag=null,suppressClick=false;
function startDrag(e,type,fromBoard){if(e.button!==0)return;e.preventDefault();const ghost=(fromBoard?e.target.closest('[data-piece]'):$(type==='t'?'supply-ten':'supply-one').firstElementChild).cloneNode(true);ghost.classList.add('drag-material');document.body.append(ghost);drag={type,fromBoard,ghost,x:e.clientX,y:e.clientY,moved:false};moveDrag(e);}
function moveDrag(e){if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';}
['t','e'].forEach(type=>{const b=$(type==='t'?'supply-ten':'supply-one');b.onpointerdown=e=>startDrag(e,type,false);b.onclick=()=>{if(!suppressClick)addPiece(type);};});
$('read-picture').onpointerdown=e=>{const p=e.target.closest('[data-piece]');if(p)startDrag(e,p.dataset.piece,true);};
document.addEventListener('pointermove',moveDrag);
document.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;d.ghost.remove();const target=document.elementFromPoint(e.clientX,e.clientY);if(d.fromBoard){if(target?.closest('#supply-ten,#supply-one')){if(d.type==='t')readT--;else readE--;readingHelp=false;read();}}else if(target?.closest('[data-drop]')?.dataset.drop===d.type)addPiece(d.type);else if(!d.moved)addPiece(d.type);suppressClick=true;setTimeout(()=>{suppressClick=false;},0);});
document.addEventListener('pointercancel',()=>{if(drag){drag.ghost.remove();drag=null;}});
$('read-example').onclick=()=>{readingHelp=!readingHelp;read();};
let readTool='pen',readStroke=null,readStrokes=[];const rw=$('read-write');
document.querySelectorAll('[data-read-tool]').forEach(b=>b.onclick=()=>{readTool=b.dataset.readTool;document.querySelectorAll('[data-read-tool]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
function rp(e){const p=rw.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(rw.getScreenCTM().inverse());}
rw.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const p=rp(e);readStroke=svgNode('path',{d:`M${p.x} ${p.y}l.1 0`,stroke:readTool==='eraser'?'white':readTool==='green'?'#28705d':'#244b77','stroke-width':readTool==='eraser'?26:4,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'});$('read-ink').append(readStroke);readStrokes.push(readStroke);rw.setPointerCapture(e.pointerId);};rw.onpointermove=e=>{if(readStroke){const p=rp(e);readStroke.setAttribute('d',readStroke.getAttribute('d')+`L${p.x} ${p.y}`);}};rw.onpointerup=rw.onpointercancel=()=>{readStroke=null;};$('read-undo').onclick=()=>readStrokes.pop()?.remove();$('read-clear').onclick=()=>{$('read-ink').replaceChildren();readStrokes=[];};$('read-empty').onclick=()=>{readT=readE=0;readingHelp=false;$('read-clear').click();read();};
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
let series=[],di=0,visible=new Set(),all=false;
const prep=el('details','dictation-prep');
prep.innerHTML='<summary>Voorbereiden vóór je projecteert</summary><p>Kies zelf zes getallen en noteer ze op papier, of open en print de leerkrachtlijst van deze reeks. Klap dit vak daarna dicht en projecteer het bord.</p><div class="controls"><label>Jouw zes getallen <input id="dictation-custom" type="text" placeholder="43, 12, 68, 30, 79, 100" style="width:280px;max-width:100%"></label><button id="dictation-use">Gebruik mijn reeks</button><button id="dictation-print">Open leerkrachtlijst om af te drukken</button></div><p id="dictation-prep-status" class="hint" role="status"></p>';
$('dictation').insertBefore(prep,$('dictation').children[1]);
function useSeries(numbers){series=numbers;di=0;visible.clear();all=false;drawDictation();}
$('dictation-use').onclick=()=>{
  const raw=$('dictation-custom').value.trim().split(/[\s,;]+/);
  const nums=raw.map(Number);
  if(raw.length!==6||raw.some(s=>!/^\d+$/.test(s))||nums.some(n=>!Number.isInteger(n)||n<0||n>100)){$('dictation-prep-status').textContent='Vul precies zes gehele getallen van 0 tot en met 100 in, gescheiden door komma’s.';return;}
  useSeries(nums);$('dictation-custom').value='';$('dictation-prep-status').textContent='Jouw reeks staat klaar. Houd je papieren lijst bij de hand en klap dit vak dicht vóór je projecteert.';
};
$('dictation-print').onclick=()=>{
  const popup=window.open('','_blank','width=650,height=700');
  if(!popup){$('dictation-prep-status').textContent='Sta het openen van het afdrukvenster toe en probeer opnieuw.';return;}
  const doc=popup.document;doc.title='Leerkrachtlijst · Getallendictee · Les 15';
  const style=doc.createElement('style');style.textContent='body{font:22px Arial,sans-serif;padding:35px}li{padding:12px}p{font-size:17px}@media print{button{display:none}}';doc.head.append(style);
  const title=doc.createElement('h1');title.textContent='Getallendictee · Les 15';doc.body.append(title);
  const note=doc.createElement('p');note.textContent='Leerkrachtlijst — druk af vóór je projecteert. Klik daarna niet op Nieuwe reeks: dan veranderen de getallen.';doc.body.append(note);
  const list=doc.createElement('ol');series.forEach(n=>{const item=doc.createElement('li');item.textContent=`${n} — ${word(n)}`;list.append(item);});doc.body.append(list);
  const button=doc.createElement('button');button.textContent='Afdrukken';button.onclick=()=>popup.print();doc.body.append(button);
};
function drawDictation(){ $('dictation-progress').textContent=`Getal ${di+1} van 6`;$('dictation-prompt').textContent='Luister naar het getal of toon het getalwoord.';$('dictation-next').disabled=di===5;$('dictation-cards').replaceChildren();series.forEach((n,i)=>{const b=el('button',null,visible.has(i)?String(n):'?');b.setAttribute('aria-label',`Antwoord ${i+1}${visible.has(i)?': '+n:''}`);b.onclick=()=>{if(visible.has(i))visible.delete(i);else visible.add(i);drawDictation();};$('dictation-cards').append(b);});$('dictation-answer').textContent=all?'Verberg alle getallen':'Toon alle getallen';}
function newDictation(){series=shuffle([12,13,14,16,20,30,40,43,34,53,35,62,26,68,86,79,97,80,90,100]).slice(0,6);di=0;visible.clear();all=false;drawDictation();}
$('new-dictation').onclick=newDictation;$('dictation-word').onclick=()=>{$('dictation-prompt').textContent=word(series[di],true);};$('dictation-speak').onclick=()=>speak(series[di]);$('dictation-next').onclick=()=>{if(di<5)di++;drawDictation();};$('dictation-answer').onclick=()=>{all=!all;visible=all?new Set([0,1,2,3,4,5]):new Set();drawDictation();};
const exercises=[...[68,46,43,85,59,28,51,35,40].map((n,i)=>({kind:'material',n,eggs:i<2})),...[12,13,14,20,30,40,22,23,44,68,59,84,100,0].map(n=>({kind:'word',n})),{kind:'choice',n:53,options:[52,35,53,55]},{kind:'choice',n:36,options:[63,36,35,37]},{kind:'match',numbers:[73,16,44,62,32]}];
let list=exercises,index=0,reveal=false,help=false,chosen=null,selectedWord=null,pairs=new Set(),strokes=[];
function drawMatches(){const box=$('matching');box.replaceChildren();const left=el('div'),right=el('div');const nums=list[index].numbers;
  nums.forEach(n=>{const b=el('button',pairs.has(n)?'matched':selectedWord===n?'selected':'',word(n,true));b.disabled=pairs.has(n);b.onclick=()=>{selectedWord=n;drawMatches();};left.append(b);});
  [...nums.slice(2),...nums.slice(0,2)].forEach(n=>{const b=el('button',pairs.has(n)?'matched':'');b.append(digits(n));b.disabled=pairs.has(n);b.onclick=()=>{if(selectedWord===null){$('feedback').textContent='Kies eerst een getalwoord.';return;}if(selectedWord===n){pairs.add(n);selectedWord=null;$('feedback').textContent=pairs.size===nums.length?'Alles juist verbonden!':'Juist! Kies het volgende woord.';}else $('feedback').textContent='Lees het woord opnieuw. Let op tientallen en eenheden.';drawMatches();};right.append(b);});box.append(left,right);
}
function draw(){const x=list[index];$('progress').textContent=`Oefening ${index+1} van ${list.length}`;$('prev').disabled=index===0;$('next').disabled=index===list.length-1;$('question').textContent={material:'Schrijf T, E en het juiste getal.',word:'Lees het getalwoord. Schrijf het getal.',choice:'Welk getal hoort bij het materiaal?',match:'Verbind: kies eerst een woord, dan het juiste getal.'}[x.kind];
  $('practice-picture').replaceChildren();if(['material','choice'].includes(x.kind))material($('practice-picture'),x.n,x.eggs||x.kind==='choice');$('prompt').textContent=x.kind==='word'?word(x.n,true):'';$('choices').replaceChildren();$('matching').replaceChildren();$('response-form').hidden=['choice','match'].includes(x.kind);
  ['t','e'].forEach(id=>{$('response-'+id).parentElement.hidden=x.kind!=='material';$('response-'+id).required=x.kind==='material';$('response-'+id).value='';});$('response-number').value='';
  if(x.kind==='choice')x.options.forEach(n=>{const b=el('button','choice'+(chosen===n?' selected':'')+(reveal&&n===x.n?' correct':''));b.append(digits(n));b.onclick=()=>{chosen=n;$('feedback').textContent=n===x.n?'Juist! Lees het getal hardop.':'Tel de tientallen en de losse eieren opnieuw.';drawChoices();};$('choices').append(b);});
  if(x.kind==='match')drawMatches();$('help-text').hidden=!help;$('help-text').textContent='Elke volle doos bevat tien eieren. Tel eerst de tientallen, dan de losse eenheden. Bij drie-en-veertig hoor je de eenheden eerst, maar schrijf je de 4 van veertig links.';$('help').textContent=help?'Verberg hulp':'Toon hulp';$('answer').textContent=reveal?'Verberg antwoord':'Toon antwoord';
}
function drawChoices(){[...$('choices').children].forEach((b,i)=>b.classList.toggle('selected',list[index].options[i]===chosen));}
function reset(){reveal=false;help=false;chosen=null;selectedWord=null;pairs.clear();strokes=[];$('ink').replaceChildren();$('feedback').textContent='';draw();}
$('prev').onclick=()=>{if(index>0){index--;reset();}};$('next').onclick=()=>{if(index<list.length-1){index++;reset();}};$('kind').onchange=()=>{list=exercises.filter(x=>$('kind').value==='all'||x.kind===$('kind').value);index=0;reset();};
$('response-form').onsubmit=e=>{e.preventDefault();const x=list[index],n=Number($('response-number').value),ok=n===x.n&&(x.kind!=='material'||Number($('response-t').value)===Math.floor(x.n/10)&&Number($('response-e').value)===x.n%10);$('feedback').textContent=ok?'Juist! Lees het getal hardop.':'Probeer opnieuw. Let op de tientallen links en de eenheden rechts.';};
$('help').onclick=()=>{help=!help;$('help-text').hidden=!help;$('help').textContent=help?'Verberg hulp':'Toon hulp';};
$('answer').onclick=()=>{reveal=!reveal;const x=list[index];if(x.kind==='match'){$('feedback').textContent=reveal?x.numbers.map(n=>`${word(n,true)} = ${n}`).join(' · '):'';}else{$('feedback').textContent=reveal?`${x.n} = ${word(x.n,true)}${x.n<100?' · '+Math.floor(x.n/10)+' T en '+x.n%10+' E':''}`:'';}if(x.kind==='choice')[...$('choices').children].forEach((b,i)=>b.classList.toggle('correct',reveal&&x.options[i]===x.n));$('answer').textContent=reveal?'Verberg antwoord':'Toon antwoord';};
let tool='pen',active=null;document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});const write=$('write');function point(e){const p=write.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(write.getScreenCTM().inverse());}
write.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const p=point(e);active=svgNode('path',{d:`M${p.x} ${p.y}l0.1 0`,stroke:tool==='eraser'?'white':tool==='green'?'#28705d':'#244b77','stroke-width':tool==='eraser'?26:4,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'});$('ink').append(active);strokes.push(active);write.setPointerCapture(e.pointerId);};write.onpointermove=e=>{if(active){const p=point(e);active.setAttribute('d',active.getAttribute('d')+`L${p.x} ${p.y}`);}};write.onpointerup=write.onpointercancel=()=>{active=null;};$('undo').onclick=()=>strokes.pop()?.remove();$('clear').onclick=()=>{$('ink').replaceChildren();strokes=[];};
read();newDictation();draw();
})();
