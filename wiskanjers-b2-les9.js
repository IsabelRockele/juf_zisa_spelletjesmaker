(() => {
'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
function el(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
function txt(g,x,y,text,size=28,attrs={}){g.append(el('text',{x,y,'font-size':size,'text-anchor':'middle',...attrs},text));}
function line(g,x1,y1,x2,y2,attrs={}){g.append(el('line',{x1,y1,x2,y2,stroke:'#b8cdcc','stroke-width':2,...attrs}));}
function groups(g,counts,x=40,y=20,w=1020,h=155,cross=false,cherries=true){const cols=Math.min(counts.length,6),rows=Math.ceil(counts.length/cols),cw=w/cols,ch=h/rows;counts.forEach((n,i)=>{const gx=x+(i%cols)*cw,gy=y+Math.floor(i/cols)*ch;g.append(el('rect',{x:gx+5,y:gy+5,width:cw-10,height:ch-10,rx:12,fill:'#f5faf8',stroke:'#7fa69a','stroke-width':2}));if(cherries&&n===2){const size=Math.min(cw-18,ch-14,110);g.append(el('image',{href:'assets/kersen-paar.svg',x:gx+(cw-size)/2,y:gy+(ch-size)/2,width:size,height:size}));return;}const dc=Math.min(n,4),dr=Math.ceil(n/dc),gap=Math.min(36,(cw-25)/dc,(ch-20)/dr);for(let j=0;j<n;j++){if(cross){txt(g,gx+cw/2+(j%dc-(dc-1)/2)*gap,gy+ch/2+(Math.floor(j/dc)-(dr-1)/2)*gap,'×',Math.min(26,gap),{'dominant-baseline':'central'});continue;}g.append(el('circle',{cx:gx+cw/2+(j%dc-(dc-1)/2)*gap,cy:gy+ch/2+(Math.floor(j/dc)-(dr-1)/2)*gap,r:Math.min(13,gap*.34),fill:'#3988a4'}));}});}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==b.dataset.tab);document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
$('fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
function bounded(id,min,max){const n=Math.max(min,Math.min(max,Math.round(Number($(id).value)||min)));$(id).value=n;return n;}
let jumps=0;
function drawJumps(){const g=$('jump-board'),start=bounded('start',0,20),step=Number($('jump').value);g.replaceChildren();line(g,60,200,940,200,{stroke:'#456572','stroke-width':3});for(let i=0;i<=11;i++){const x=60+i*80;line(g,x,193,x,207);if(i<=jumps)txt(g,x,240,start+i*step,30);if(i<jumps){g.append(el('path',{d:`M${x} 185 Q${x+40} 70 ${x+80} 185`,fill:'none',stroke:'#28705d','stroke-width':4}));txt(g,x+40,115,`+${step}`,22);}}$('jump-next').textContent=jumps===10?'Kan er nog een sprong bij? →':'Maak een sprong →';$('jump-back').disabled=!jumps;$('jump-next').disabled=jumps===11;}
$('jump-next').onclick=()=>{jumps=Math.min(11,jumps+1);drawJumps();};$('jump-back').onclick=()=>{jumps=Math.max(0,jumps-1);drawJumps();};['start','jump'].forEach(id=>$(id).onchange=()=>{jumps=0;drawJumps();});$('jump-reset').onclick=()=>{jumps=0;drawJumps();};
let cards=[],target=2,buildHistory=[];
function counts(){return cards.map(c=>c.filter(Boolean).length);}
function saveBuild(){buildHistory.push(cards.map(c=>[...c]));}
function drawBuild(){$('groups').value=cards.length;const g=$('group-board');g.replaceChildren();cards.forEach((card,i)=>{const box=document.createElement('div');box.className='group';box.setAttribute('role','group');box.setAttribute('aria-label',`Groep ${i+1}`);card.forEach((on,j)=>{const b=document.createElement('button');b.className=on?'filled':'';b.setAttribute('aria-label',`Groep ${i+1}, vakje ${j+1}: ${on?'kers wegnemen':'kers leggen'}`);b.setAttribute('aria-pressed',String(on));b.onclick=()=>{saveBuild();cards[i][j]=!on;$('build-title').textContent='Zijn alle groepen even groot?';drawBuild();};box.append(b);});g.append(box);});$('build-undo').disabled=!buildHistory.length;$('add-group').disabled=cards.length===10&&cards.every(c=>c.filter(Boolean).length===target);}
function prepare(){target=2;cards=Array.from({length:bounded('groups',1,10)},()=>Array(2).fill(false));buildHistory=[];clearBuildWriting();$('build-title').textContent=`Maak ${cards.length} groepen met telkens ${target} kersen.`;drawBuild();}
$('prepare').onclick=prepare;$('build-clear').onclick=()=>{saveBuild();cards=cards.map(c=>c.map(()=>false));clearBuildWriting();drawBuild();};$('add-group').onclick=()=>{saveBuild();const i=cards.findIndex(c=>c.filter(Boolean).length!==target);if(i>=0)cards[i]=[true,true];else if(cards.length<10)cards.push([true,true]);$('groups').value=cards.length;$('build-title').textContent='Welke optelling en vermenigvuldiging horen hierbij?';drawBuild();};$('build-undo').onclick=()=>{if(buildHistory.length){cards=buildHistory.pop();drawBuild();}};$('build-check').onclick=()=>{$('build-title').textContent=counts().every(n=>n===target)?`Juist: ${cards.length} gelijke groepen van ${target}.`:`Zorg dat in elk van de ${cards.length} groepen precies ${target} kersen liggen.`;};
const stories=[
 {a:3,q:'Er staan 3 fietsen. Elke fiets heeft 2 wielen. Hoeveel wielen zijn dat samen?',noun:'wielen'},
 {a:5,q:'Er zijn 5 zakjes. In elk zakje zitten 2 knikkers. Hoeveel knikkers zijn dat samen?',noun:'knikkers'},
 {a:7,q:'Er staan 7 kinderen klaar. Elk kind krijgt 2 linten. Hoeveel linten zijn er nodig?',noun:'linten'},
 {a:4,q:'Er staan 4 bordjes. Op elk bordje liggen 2 koekjes. Hoeveel koekjes zijn dat samen?',noun:'koekjes'},
 {a:8,q:'Er zijn 8 doosjes. In elk doosje zitten 2 kralen. Hoeveel kralen zijn dat samen?',noun:'kralen'}
];
const exercises=[];
for(let i=0;i<5;i++)exercises.push(
 {kind:'picture',a:[2,4,6,8,10][i],b:2},
 {kind:'sum',a:[3,5,7,9,1][i],b:2},
 {kind:'times',a:[1,4,7,10,0][i],b:2},
 {kind:'jumps',a:[4,6,8,10,5][i],b:2},
 {kind:'facts',values:[[0,1,2],[3,4],[5,6],[7,8],[9,10]][i]},
 {kind:'story',b:2,...stories[i]},
 {kind:'match',sets:[[2,5,8],[1,4,7],[3,6,9],[2,6,10],[4,7,10]][i].map(a=>[a,2])}
);
let list=exercises,index=0,revealed=false,help=false,tool='pen',history=[],active=null,stroke=null,startPoint=null;
const board=$('board'),ink=$('ink'),current=()=>list[index],sum=e=>e.a?Array(e.a).fill(e.b).join(' + '):'0';
let objects=false;
function axis(g,count,answers=false){line(g,55,150,1045,150,{stroke:'#456572'});for(let n=0;n<=20;n++){const x=55+n*49.5;line(g,x,150,x,n%5===0?128:140,{stroke:'#456572'});if([0,5,10,20].includes(n))txt(g,x,183,n,22);else if(n%2===0&&n<=count*2){line(g,x-15,190,x+15,190);if(answers&&n<=count*2)txt(g,x,183,n,22);}}if(answers)for(let n=0;n<count;n++){const x=55+n*99;g.append(el('path',{d:`M${x} 126 Q${x+49.5} 20 ${x+99} 126`,fill:'none',stroke:'#28705d','stroke-width':3}));txt(g,x+49.5,63,'+2',22);}}
function storyObjects(g,e){
 groups(g,Array(e.a).fill(2),20,5,1060,105,false,false);
 for(const dot of [...g.querySelectorAll('circle')]){const x=Number(dot.getAttribute('cx')),y=Number(dot.getAttribute('cy')),r=Number(dot.getAttribute('r'));
 if(e.noun==='wielen'){dot.setAttribute('fill','white');dot.setAttribute('stroke','#243b45');dot.setAttribute('stroke-width','3');for(let i=0;i<4;i++){const a=i*Math.PI/4;line(g,x-r*Math.cos(a),y-r*Math.sin(a),x+r*Math.cos(a),y+r*Math.sin(a),{stroke:'#60746b','stroke-width':1.5});}}
 else if(e.noun==='linten'){dot.remove();g.append(el('path',{d:`M${x-r/2} ${y-r}L${x+r/2} ${y-r}L${x+r/2} ${y+r}L${x} ${y+r/2}L${x-r/2} ${y+r}Z`,fill:'#ac3e78'}));}
 else if(e.noun==='koekjes'){dot.setAttribute('fill','#dfb365');dot.setAttribute('stroke','#95622c');for(const [dx,dy] of [[-.3,-.3],[.4,0],[-.2,.4]])g.append(el('circle',{cx:x+dx*r,cy:y+dy*r,r:2,fill:'#784326'}));}
 else if(e.noun==='kralen'){dot.setAttribute('fill','#bd5292');g.append(el('circle',{cx:x,cy:y,r:r*.3,fill:'white'}));}
 else{dot.setAttribute('fill','#268fc8');g.append(el('circle',{cx:x-r*.3,cy:y-r*.35,r:r*.22,fill:'white'}));}
 }
}
function drawExercise(){const e=current(),g=$('exercise'),s=$('solution');g.replaceChildren();s.replaceChildren();ink.style.opacity=revealed?'.15':'1';$('progress').textContent=`Oefening ${index+1} van ${list.length}`;$('prev').disabled=index===0;$('next').disabled=index===list.length-1;
$('practice').classList.toggle('story',e.kind==='story');$('story-objects').hidden=e.kind!=='story';$('story-objects').textContent=objects?'Verberg voorwerpen':'Toon voorwerpen';
const questions={picture:'Schrijf de herhaalde optelling en de vermenigvuldiging.',sum:'Schrijf de vermenigvuldiging. Los op.',times:'Schrijf de optelling en los op.',jumps:`Teken ${e.a} sprongen van 2 vanaf 0. Schrijf +2 en vul aan.`,facts:'Los op. Schrijf het product.',story:e.q,match:'Geef wat bij elkaar hoort dezelfde kleur.'};$('question').textContent=questions[e.kind];
$('matching').hidden=e.kind!=='match';$('practice-writing').hidden=e.kind==='match';
if(e.kind==='match')drawMatches();
if(e.kind==='picture')groups(g,Array(e.a).fill(2));
if(e.kind==='sum')txt(g,550,70,sum(e)+' = …',e.a>7?32:40);
if(e.kind==='times')txt(g,550,70,`${e.a} × 2 = …`,44);
if(['picture','sum','times'].includes(e.kind)){line(g,60,245,1040,245);line(g,60,325,1040,325);if(revealed){txt(s,550,231,sum(e)+` = ${e.a*2}`,e.a>7?30:34);txt(s,550,312,`${e.a} × 2 = ${e.a*2}`,36);}}
if(e.kind==='jumps'){axis(g,e.a);line(g,140,300,960,300);if(revealed){axis(s,e.a,true);txt(s,550,286,`${e.a} × 2 = ${e.a*2}`,34);}}
if(e.kind==='facts')e.values.forEach((n,i)=>{const y=75+i*100;txt(g,270,y,`${n} × 2 =`,40);line(g,420,y+12,990,y+12);if(revealed)txt(s,550,y,n*2,40);});
if(e.kind==='story'){if(objects)storyObjects(g,e);txt(g,40,150,'Bewerking',20,{'text-anchor':'start'});line(g,40,220,1060,220);txt(g,40,305,'Antwoordzin: dat zijn samen',25,{'text-anchor':'start'});line(g,390,320,520,320);txt(g,545,305,e.noun+'.',27,{'text-anchor':'start'});if(revealed){txt(s,550,205,`${e.a} × 2 = ${e.a*2}`,34);txt(s,455,305,e.a*2,32);}}
$('answer').textContent=revealed?'Verberg voorbeeldantwoord':'Toon voorbeeldantwoord';$('help').textContent=help?'Verberg hulp':'Toon hulp';$('feedback').textContent=help?(e.kind==='jumps'?'Begin bij 0. Spring telkens 2 verder. Tel de sprongen.':e.kind==='match'?'Tel de groepjes. Zoek dezelfde optelling, woorden en vermenigvuldiging.':'Hoeveel groepen zijn er? In elke groep zitten er 2. Tel telkens 2 verder.'):e.kind==='match'?'Kies een kleur en tik op de vakjes die bij elkaar horen.':'';
}
$('story-objects').onclick=()=>{objects=!objects;drawExercise();};
function fresh(){objects=false;matchColors=Array(12).fill(null);matchHistory=[];ink.replaceChildren();history=[];revealed=help=false;active=stroke=null;drawExercise();}
$('kind').onchange=()=>{list=$('kind').value==='mixed'?exercises:exercises.filter(e=>e.kind===$('kind').value);index=0;fresh();};$('prev').onclick=()=>{if(index>0){index--;fresh();}};$('next').onclick=()=>{if(index<list.length-1){index++;fresh();}};$('answer').onclick=()=>{revealed=!revealed;drawExercise();};$('help').onclick=()=>{help=!help;drawExercise();};
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
$('undo').onclick=()=>{if(history.length)ink.innerHTML=history.pop();};$('clear').onclick=()=>{history.push(ink.innerHTML);ink.replaceChildren();};
function point(e){const p=board.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(board.getScreenCTM().inverse());}
function erase(p){for(const n of [...ink.children]){if(n.tagName==='path'){const length=n.getTotalLength();for(let d=0;d<=length;d+=5){const q=n.getPointAtLength(d);if(Math.hypot(p.x-q.x,p.y-q.y)<18){n.remove();break;}}}else{const b=n.getBBox();if(p.x>=b.x-10&&p.x<=b.x+b.width+10&&p.y>=b.y-10&&p.y<=b.y+b.height+10)n.remove();}}}
board.addEventListener('pointerdown',e=>{if(active!==null||revealed||e.button!==0)return;e.preventDefault();history.push(ink.innerHTML);active=e.pointerId;startPoint=point(e);board.setPointerCapture(active);const p=startPoint;if(tool==='eraser'){erase(p);return;}if(tool==='dot'){ink.append(el('circle',{cx:p.x,cy:p.y,r:9,fill:'#243b45'}));return;}if(tool==='cross'){txt(ink,p.x,p.y,'×',32,{'dominant-baseline':'central'});return;}stroke=el('path',{d:`M${p.x} ${p.y}l.1 .1`,fill:'none',stroke:tool==='green'?'#28705d':'#243b45','stroke-width':4,'stroke-linecap':'round','stroke-linejoin':'round'});ink.append(stroke);});
board.addEventListener('pointermove',e=>{if(active!==e.pointerId)return;const p=point(e);if(tool==='eraser')erase(p);else if(stroke)stroke.setAttribute('d',tool==='line'?`M${startPoint.x} ${startPoint.y}L${p.x} ${p.y}`:stroke.getAttribute('d')+`L${p.x} ${p.y}`);});['pointerup','pointercancel','lostpointercapture'].forEach(type=>board.addEventListener(type,()=>{active=null;stroke=null;}));
const writeBoard=$('build-write'),buildInk=$('build-ink');
let buildTool='pen',inkHistory=[],writePointer=null,writeStroke=null;
function clearBuildWriting(){buildInk.replaceChildren();inkHistory=[];writePointer=null;writeStroke=null;}
document.querySelectorAll('[data-build-tool]').forEach(b=>b.onclick=()=>{buildTool=b.dataset.buildTool;document.querySelectorAll('[data-build-tool]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
$('build-ink-undo').onclick=()=>{if(inkHistory.length)buildInk.innerHTML=inkHistory.pop();};
$('build-ink-clear').onclick=()=>{inkHistory.push(buildInk.innerHTML);buildInk.replaceChildren();};
function writePoint(e){const p=writeBoard.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(writeBoard.getScreenCTM().inverse());}
function eraseWriting(p){for(const n of [...buildInk.children]){const length=n.getTotalLength();for(let d=0;d<=length;d+=5){const q=n.getPointAtLength(d);if(Math.hypot(p.x-q.x,p.y-q.y)<18){n.remove();break;}}}}
writeBoard.addEventListener('pointerdown',e=>{if(writePointer!==null||e.button!==0)return;e.preventDefault();inkHistory.push(buildInk.innerHTML);writePointer=e.pointerId;writeBoard.setPointerCapture(writePointer);const p=writePoint(e);if(buildTool==='eraser'){eraseWriting(p);return;}writeStroke=el('path',{d:`M${p.x} ${p.y}l.1 .1`,fill:'none',stroke:buildTool==='green'?'#28705d':'#243b45','stroke-width':4,'stroke-linecap':'round','stroke-linejoin':'round'});buildInk.append(writeStroke);});
writeBoard.addEventListener('pointermove',e=>{if(writePointer!==e.pointerId)return;const p=writePoint(e);if(buildTool==='eraser')eraseWriting(p);else if(writeStroke)writeStroke.setAttribute('d',writeStroke.getAttribute('d')+`L${p.x} ${p.y}`);});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>writeBoard.addEventListener(type,()=>{writePointer=null;writeStroke=null;}));
(() => {
const writeBoard=$('table-board'),buildInk=$('table-ink');
let buildTool='pen',inkHistory=[],writePointer=null,writeStroke=null;
function clearBuildWriting(){buildInk.replaceChildren();inkHistory=[];writePointer=null;writeStroke=null;}
document.querySelectorAll('[data-table-tool]').forEach(b=>b.onclick=()=>{buildTool=b.dataset.tableTool;document.querySelectorAll('[data-table-tool]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
$('table-undo').onclick=()=>{if(inkHistory.length)buildInk.innerHTML=inkHistory.pop();};
$('table-clear').onclick=()=>{inkHistory.push(buildInk.innerHTML);buildInk.replaceChildren();};
function writePoint(e){const p=writeBoard.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(writeBoard.getScreenCTM().inverse());}
function eraseWriting(p){for(const n of [...buildInk.children]){const length=n.getTotalLength();for(let d=0;d<=length;d+=5){const q=n.getPointAtLength(d);if(Math.hypot(p.x-q.x,p.y-q.y)<18){n.remove();break;}}}}
writeBoard.addEventListener('pointerdown',e=>{if(writePointer!==null||e.button!==0)return;e.preventDefault();inkHistory.push(buildInk.innerHTML);writePointer=e.pointerId;writeBoard.setPointerCapture(writePointer);const p=writePoint(e);if(buildTool==='eraser'){eraseWriting(p);return;}writeStroke=el('path',{d:`M${p.x} ${p.y}l.1 .1`,fill:'none',stroke:buildTool==='green'?'#28705d':'#243b45','stroke-width':4,'stroke-linecap':'round','stroke-linejoin':'round'});buildInk.append(writeStroke);});
writeBoard.addEventListener('pointermove',e=>{if(writePointer!==e.pointerId)return;const p=writePoint(e);if(buildTool==='eraser')eraseWriting(p);else if(writeStroke)writeStroke.setAttribute('d',writeStroke.getAttribute('d')+`L${p.x} ${p.y}`);});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>writeBoard.addEventListener(type,()=>{writePointer=null;writeStroke=null;}));
})();
const matchOrder=[[0,0],[1,2],[2,1],[0,3],[2,2],[1,1],[0,2],[2,3],[1,0],[0,1],[1,3],[2,0]];
const colors=[{name:'Blauw',fill:'#dbe8ff',border:'#164bd6'},{name:'Oranje',fill:'#ffe2bf',border:'#b85b00'},{name:'Paars',fill:'#eddcff',border:'#803caf'}];
let matchColors=Array(12).fill(null),matchHistory=[],paint=0;
function drawMatches(){
 const palette=$('palette');palette.replaceChildren();colors.forEach((color,i)=>{const b=document.createElement('button');b.textContent=color.name;b.style.borderColor=color.border;b.style.background=i===paint?color.fill:'white';b.setAttribute('aria-pressed',String(i===paint));b.onclick=()=>{paint=i;drawMatches();};palette.append(b);});
 const target=$('match-cards');target.replaceChildren();
 matchOrder.forEach(([set,form],i)=>{const [a,b]=current().sets[set],button=document.createElement('button');const label=form===0?`${a} keer een groep van ${b}`:form===1?`${a} × ${b}`:form===2?Array(a).fill(b).join(' + '):`${a} groepjes van ${b} kersen`;
 const color=revealed?set:matchColors[i];button.setAttribute('aria-label',`${label}, ${color===null?'ongekleurd':colors[color].name}`);if(color!==null){button.style.background=colors[color].fill;button.style.borderColor=colors[color].border;}
 if(form===3){const svg=el('svg',{viewBox:'0 0 280 90','aria-hidden':'true'});groups(svg,Array(a).fill(b),0,0,280,90);button.append(svg);}else button.textContent=label;
 button.onclick=()=>{if(revealed)return;matchHistory.push([...matchColors]);matchColors[i]=matchColors[i]===paint?null:paint;$('feedback').textContent='';drawMatches();};target.append(button);
 });$('match-undo').disabled=revealed||!matchHistory.length;$('match-clear').disabled=revealed;$('match-check').disabled=revealed;
}
$('match-undo').onclick=()=>{if(matchHistory.length){matchColors=matchHistory.pop();$('feedback').textContent='';drawMatches();}};
$('match-clear').onclick=()=>{matchHistory.push([...matchColors]);matchColors.fill(null);$('feedback').textContent='';drawMatches();};
$('match-check').onclick=()=>{if(matchColors.some(c=>c===null)){$('feedback').textContent='Geef eerst elk vakje een kleur.';return;}const sets=[0,1,2].map(set=>new Set(matchOrder.map(([s],i)=>s===set?matchColors[i]:null).filter(c=>c!==null)));const correct=sets.every(s=>s.size===1)&&new Set(sets.map(s=>[...s][0])).size===3;$('feedback').textContent=correct?'Juist! Dezelfde groepjes, woorden en bewerkingen hebben dezelfde kleur.':'Kijk naar het aantal groepen én het aantal in elke groep. Probeer opnieuw.';};
for(let n=0;n<=10;n++){const x=n<6?70:620,y=55+(n<6?n:n-6)*70;txt($('table-prompts'),x,y,`${n} × 2 =`,34,{'text-anchor':'start'});line($('table-prompts'),x+170,y+12,x+380,y+12);}
groups($('memory-picture'),[2,2,2,2],0,0,600,170);drawJumps();prepare();fresh();
})();
