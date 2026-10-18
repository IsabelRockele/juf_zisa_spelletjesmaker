(() => {
'use strict';
const $ = id => document.getElementById(id), NS = 'http://www.w3.org/2000/svg';
const node = (tag, attrs = {}, text) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v)); if (text !== undefined) e.textContent = text; return e; };
function picture(type) {
  const svg = node('svg', {viewBox:'0 0 180 100',role:'img','aria-label':`Een groep van tien ${type}`});
  if(type === 'eieren') {
    svg.setAttribute('viewBox','0 0 250 180');
    svg.setAttribute('aria-label','Een open eierdoos met tien eieren in twee rijen van vijf');
    svg.append(node('image',{href:'wiskanjers-eierdoos.svg',width:250,height:180}));
    return svg;
    /* Previous illustration retained below temporarily. */
    svg.setAttribute('viewBox','0 0 180 120');
    svg.setAttribute('aria-label','Een open eierdoos met tien eieren in twee rijen van vijf');
    svg.append(node('path',{d:'M13 12H167L158 48H22Z',fill:'#f8e9b9',stroke:'#d5bd7f','stroke-width':3}),node('path',{d:'M24 20H156L151 39H29Z',fill:'#fff5d3'}),node('path',{d:'M16 58H164L158 108H22Z',fill:'#ecdbab',stroke:'#cbb37e','stroke-width':2}));
    for(let row=0;row<2;row++)for(let col=0;col<5;col++){
      const x=34+col*28,y=67+row*27;
      svg.append(node('ellipse',{cx:x,cy:y+8,rx:12,ry:6,fill:'#d7c28d'}),node('path',{d:`M${x-9} ${y+3}C${x-10} ${y-5} ${x-5} ${y-17} ${x} ${y-17}C${x+5} ${y-17} ${x+10} ${y-5} ${x+9} ${y+3}C${x+8} ${y+13} ${x-8} ${y+13} ${x-9} ${y+3}Z`,fill:'#fffdf0',stroke:'#d1bc8b','stroke-width':1.5}));
    }
    svg.append(node('path',{d:'M19 106L28 115H152L161 106',fill:'#f2e3b8',stroke:'#d0b981','stroke-width':2}));
    return svg;
  }
  for(let i=0;i<10;i++) {
    const x=22+(i%5)*34,y=29+Math.floor(i/5)*43;
    if(type==='potloden') { svg.append(node('rect',{x:x-7,y:y-12,width:14,height:30,rx:2,fill:['#dc6879','#e9b844','#4997ae','#7daf67','#9e78bb'][i%5]}),node('path',{d:`M${x-7} ${y-12}L${x} ${y-23}L${x+7} ${y-12}Z`,fill:'#c9a078'})); }
    else if(type==='beertjes') { for(const [dx,dy,r] of [[-7,-10,5],[7,-10,5],[0,-5,9],[0,9,10],[-9,14,5],[9,14,5]]) svg.append(node('circle',{cx:x+dx,cy:y+dy,r,fill:'#e87fa9',stroke:'#c95885','stroke-width':1})); }
    else if(type==='bloemen') { svg.append(node('path',{d:`M${x} ${y}v18`,stroke:'#578a4e','stroke-width':3})); for(let p=0;p<5;p++){const a=p*Math.PI*2/5;svg.append(node('circle',{cx:x+7*Math.cos(a),cy:y+7*Math.sin(a),r:5,fill:'#cda3d7'}));}svg.append(node('circle',{cx:x,cy:y,r:4,fill:'#e7b841'})); }
    else if(type==='blokken') svg.append(node('rect',{x:x-11,y:y-11,width:22,height:22,rx:2,fill:['#5aa2b4','#e6b34c','#dc7981','#73b176'][i%4],stroke:'#536c65','stroke-width':1}));
    else svg.append(node('ellipse',{cx:x,cy:y,rx:11,ry:16,fill:'#fffdf0',stroke:'#b89952','stroke-width':1.5}));
  }
  return svg;
}
function groups(target,n,type='eieren',labels=false) {
  target.replaceChildren();
  for(let i=0;i<n;i++){const f=document.createElement('figure');f.className='bundle';f.append(picture(type));if(labels){const c=document.createElement('figcaption');c.textContent=(i+1)*10;f.append(c);}target.append(f);}
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==b.dataset.tab);
  document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));
}));
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){} };
for(let n=10;n<=100;n+=10){const o=document.createElement('option');o.value=n;o.textContent=n;$('amount').append(o);}$('amount').value='50';
let total=50,bundled=0,selected=new Set(),showBuild=false;
function drawBuild(){
  $('loose').replaceChildren();
  for(let i=bundled*10;i<total;i++){const b=document.createElement('button');b.setAttribute('aria-label',`Ei ${i+1}`);b.setAttribute('aria-pressed',String(selected.has(i)));b.onclick=()=>{if(selected.has(i))selected.delete(i);else selected.add(i);drawBuild();};$('loose').append(b);}
  groups($('bundles'),bundled,'eieren',showBuild);
  $('undo-group').disabled=bundled===0;$('bundle').disabled=bundled*10===total;
  $('build-total').hidden=!showBuild;
  $('build-total').textContent=`${bundled} groepen van 10 = ${bundled} tientallen = ${bundled*10}${bundled*10<total?` · nog ${total-bundled*10} losse voorwerpen`:''}`;
  $('build-answer').textContent=showBuild?'Verberg aantallen':'Toon aantallen';
}
$('prepare').onclick=()=>{total=Number($('amount').value);bundled=0;selected.clear();showBuild=false;$('build-feedback').textContent='Hoe kunnen we deze voorwerpen handig tellen?';drawBuild();};
$('bundle').onclick=()=>{if(selected.size && selected.size!==10){$('build-feedback').textContent=`Je koos ${selected.size} voorwerpen. Kies er precies tien.`;return;}bundled++;selected.clear();$('build-feedback').textContent=bundled*10===total?'Alles zit in groepen van tien. Hoeveel tientallen zie je?':'Er is een tiental bij. Hoeveel groepen hebben we nu?';drawBuild();};
$('undo-group').onclick=()=>{if(bundled>0)bundled--;selected.clear();$('build-feedback').textContent='Eén tiental ligt weer los.';drawBuild();};
$('build-answer').onclick=()=>{showBuild=!showBuild;drawBuild();};
let count=0,labels=false,countNotes={};
function axis(target,callback,visible=true,active=-1){
  target.replaceChildren();for(let n=0;n<=100;n+=10){const b=document.createElement('button');b.textContent=visible||n===0||n===100?n:'?';b.setAttribute('aria-label',visible?String(n):`Plaats ${n/10+1} op de getallenas`);b.classList.toggle('selected',n===active);b.onclick=()=>callback(n,b);target.append(b);}
}
function drawCount(){groups($('count-groups'),count/10,'eieren',false);$('count-value').textContent=labels?`${count/10} tientallen = ${count}`:'';
  $('count-axis').replaceChildren();for(let n=0;n<=100;n+=10){const cell=document.createElement('div');cell.className='axis-cell'+(n===count?' selected':'');const input=document.createElement('input');input.type='text';input.inputMode='numeric';input.setAttribute('aria-label',`Noteer het tiental op plaats ${n/10+1}`);input.value=labels?n:countNotes[n]||'';input.readOnly=labels;input.oninput=()=>{countNotes[n]=input.value;};cell.append(input);$('count-axis').append(cell);}
  $('minus').disabled=count===0;$('plus').disabled=count===100;$('labels').textContent=labels?'Verberg voorbeeldantwoorden':'Toon voorbeeldantwoorden';$('labels').setAttribute('aria-pressed',String(labels));}
$('minus').onclick=()=>{count=Math.max(0,count-10);drawCount();};$('plus').onclick=()=>{count=Math.min(100,count+10);drawCount();};$('zero').onclick=()=>{count=0;drawCount();};$('hundred').onclick=()=>{count=100;drawCount();};$('labels').onclick=()=>{labels=!labels;drawCount();};
const exercises=[];
const counts=[5,8,4,6,7,3,4,8,10,2,9,1];
counts.forEach((n,i)=>exercises.push({kind:i<4?'groups':i<6?'number':i<8?'place':'groups',n,type:i<4?'eieren':['potloden','beertjes','bloemen','blokken'][i%4]}));
for(let i=0;i<4;i++)exercises.push({kind:'missing',holes:[[2,6,9],[1,3,4,7,8],[3,5,7,9],[2,4,6,8]][i]});
let list=exercises,index=0,reveal=false,help=false,placed=null,entries={},wrongPlaces=new Set(),solved=false;
const current=()=>list[index];
function drawExercise(){
  const e=current();$('progress').textContent=`Oefening ${index+1} van ${list.length}`;$('previous').disabled=index===0;$('next').disabled=index===list.length-1;
  $('question').textContent=e.kind==='groups'?'Hoeveel tientallen? Schrijf ook het getal.':e.kind==='number'?`Hoeveel ${e.type} zijn er? Schrijf het getal.`:e.kind==='place'?`Hoeveel ${e.type}? Tik het juiste tiental op de getallenas aan.`:'Vul de ontbrekende tientallen in.';
  groups($('picture'),e.n||0,e.type);$('exercise-axis').hidden=!['place','missing'].includes(e.kind);$('axis-feedback').textContent='';
  if(e.kind==='place'){
    axis($('exercise-axis'),n=>{placed=n;if(n===e.n*10)solved=true;else wrongPlaces.add(n);drawExercise();},reveal);
    [...$('exercise-axis').children].forEach((b,i)=>{const n=i*10;if(wrongPlaces.has(n))b.classList.add('wrong-place');if((solved||reveal)&&n===e.n*10){b.textContent=n;b.classList.remove('wrong-place');b.classList.add('correct');}});
    if(placed!==null)$('axis-feedback').textContent=placed===e.n*10?`Juist: ${e.n} tientallen is ${e.n*10}.`:'Dat is nog niet de juiste plaats. Tel de sprongen van tien en probeer opnieuw.';
  }
  if(e.kind==='missing'){
    $('exercise-axis').replaceChildren();
    for(let n=0;n<=10;n++){const c=document.createElement('div');c.className='axis-cell';if(e.holes.includes(n)){const input=document.createElement('input');input.type='number';input.min=0;input.max=100;input.step=10;input.setAttribute('aria-label',`Ontbrekend tiental op plaats ${n+1}`);input.value=reveal?n*10:entries[n]??'';input.readOnly=reveal;input.oninput=()=>{entries[n]=input.value;};if(reveal)c.classList.add(Number(entries[n])===n*10&&entries[n]!==''&&entries[n]!==undefined?'correct':'incorrect');c.append(input);}else c.textContent=n*10;$('exercise-axis').append(c);}
  }
  $('solution').hidden=!reveal;$('solution').textContent=e.kind==='missing'?'De ontbrekende tientallen: '+e.holes.map(n=>n*10).join(' · '):`${e.n} groepen van 10 = ${e.n} tientallen = ${e.n*10}`;
  $('answer').textContent=reveal?'Verberg antwoord':'Toon antwoord';$('help-text').hidden=!help;$('help').textContent=help?'Verberg hulp':'Toon hulp';$('help-text').textContent=e.kind==='missing'?'Begin bij 0. Tel bij ieder vakje 10 erbij. Controleer ook door terug te tellen vanaf 100.':'In elke groep zitten tien voorwerpen. Tel de groepen en tel dan met sprongen van tien: 10, 20, 30…';
}
function resetExercise(){reveal=false;help=false;placed=null;entries={};wrongPlaces.clear();solved=false;$('ink').replaceChildren();strokes=[];drawExercise();}
$('previous').onclick=()=>{if(index>0){index--;resetExercise();}};$('next').onclick=()=>{if(index<list.length-1){index++;resetExercise();}};
$('kind').onchange=()=>{list=exercises.filter(e=>$('kind').value==='all'||e.kind===$('kind').value);index=0;resetExercise();};$('answer').onclick=()=>{reveal=!reveal;drawExercise();};$('help').onclick=()=>{help=!help;drawExercise();};
let tool='pen',strokes=[],active=null;
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
const write=$('write');
function point(e){const p=write.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(write.getScreenCTM().inverse());}
write.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const p=point(e);active=node('path',{d:`M${p.x} ${p.y}l0.1 0`,'stroke':tool==='eraser'?'#ffffff':tool==='green'?'#28705d':'#244b77','stroke-width':tool==='eraser'?26:4,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'});$('ink').append(active);strokes.push(active);write.setPointerCapture(e.pointerId);};
write.onpointermove=e=>{if(!active)return;const p=point(e);active.setAttribute('d',active.getAttribute('d')+`L${p.x} ${p.y}`);};
write.onpointerup=write.onpointercancel=()=>{active=null;};
$('ink-undo').onclick=()=>strokes.pop()?.remove();$('ink-clear').onclick=()=>{$('ink').replaceChildren();strokes=[];};
groups($('memory-groups'),5);drawBuild();drawCount();drawExercise();
})();
