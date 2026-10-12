(() => {
'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
function el(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
function txt(g,x,y,text,size=28,attrs={}){g.append(el('text',{x,y,'font-size':size,'text-anchor':'middle',...attrs},text));}
function line(g,x1,y1,x2,y2,attrs={}){g.append(el('line',{x1,y1,x2,y2,stroke:'#b8cdcc','stroke-width':2,...attrs}));}
function groups(g,counts,x=40,y=20,w=1020,h=155,cross=false){const cols=Math.min(counts.length,6),rows=Math.ceil(counts.length/cols),cw=w/cols,ch=h/rows;counts.forEach((n,i)=>{const gx=x+(i%cols)*cw,gy=y+Math.floor(i/cols)*ch;g.append(el('rect',{x:gx+5,y:gy+5,width:cw-10,height:ch-10,rx:12,fill:'#f5faf8',stroke:'#7fa69a','stroke-width':2}));const dc=Math.min(n,4),dr=Math.ceil(n/dc),gap=Math.min(36,(cw-25)/dc,(ch-20)/dr);for(let j=0;j<n;j++){if(cross){txt(g,gx+cw/2+(j%dc-(dc-1)/2)*gap,gy+ch/2+(Math.floor(j/dc)-(dr-1)/2)*gap,'×',Math.min(26,gap),{'dominant-baseline':'central'});continue;}g.append(el('circle',{cx:gx+cw/2+(j%dc-(dc-1)/2)*gap,cy:gy+ch/2+(Math.floor(j/dc)-(dr-1)/2)*gap,r:Math.min(13,gap*.34),fill:'#3988a4'}));}});}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==b.dataset.tab);document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
$('fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
function bounded(id,min,max){const n=Math.max(min,Math.min(max,Math.round(Number($(id).value)||min)));$(id).value=n;return n;}
let total=8,size=2,locations=[],selected=new Set(),buildHistory=[],showCounts=false;
function sizes(){const n=bounded('total',2,30),old=Number($('size').value)||2;$('size').replaceChildren();for(let d=1;d<=n;d++)if(n%d===0){const o=document.createElement('option');o.value=d;o.textContent=d;$('size').append(o);}const valid=old<=n&&n%old===0; $('size').value=valid?old:(n%2===0?2:1);}
function saveBuild(){buildHistory.push({locations:[...locations],selected:[...selected]});}
function drawBuild(){const g=$('grouping');g.replaceChildren();const used=locations.filter(n=>n>=0),max=used.length?Math.max(...used):-1,cw=150,ch=205/Math.ceil((total/size)/5),gh=Math.min(ch-8,Math.ceil(size/5)*36+18);
 g.append(el('rect',{x:15,y:12,width:295,height:215,rx:16,fill:'#fff9e9',stroke:'#c6b790','stroke-width':2}));txt(g,160,40,'Nog te verdelen',22);
 for(let group=0;group<=max;group++){const x=340+(group%5)*150,y=12+Math.floor(group/5)*ch;g.append(el('rect',{x,y,width:140,height:gh,rx:10,fill:'#f1f8f4',stroke:'#28705d','stroke-width':2}));}
 locations.forEach((group,id)=>{let x,y,tokenSize=28;if(group<0){x=42+(id%6)*46;y=62+Math.floor(id/6)*32;}else{const slot=locations.slice(0,id).filter(n=>n===group).length;const cols=Math.min(size,5),rows=Math.ceil(size/cols),step=Math.min(29,(gh-10)/rows);tokenSize=Math.min(25,step-3);x=340+(group%5)*cw+70+(slot%cols-(cols-1)/2)*27-tokenSize/2;y=12+Math.floor(group/5)*ch+gh/2+(Math.floor(slot/cols)-(rows-1)/2)*step-tokenSize/2;}
 const token=el('rect',{x,y,width:tokenSize,height:tokenSize,rx:5,fill:selected.has(id)?'#f6bf53':'#65abc4',stroke:selected.has(id)?'#8b5b00':'#28617a','stroke-width':2,'data-token':id,tabindex:0,role:'button','aria-label':`Voorwerp ${id+1}${group<0?', nog te verdelen':', in een groep'}`});g.append(token);
 });if(showCounts)txt(g,720,240,`Nog ${locations.filter(n=>n<0).length} over · ${max+1} groepen gemaakt`,22);
 $('build-undo').disabled=!buildHistory.length;$('make-group').disabled=locations.every(n=>n>=0);$('counts').textContent=showCounts?'Verberg aantallen':'Toon aantallen';
}
function choose(id){if(locations[id]>=0){$('build-hint').textContent='Gebruik Groep terug om de laatste groep weer uit elkaar te halen.';return;}if(selected.has(id))selected.delete(id);else selected.add(id);drawBuild();}
$('grouping').onclick=e=>{const node=e.target.closest('[data-token]');if(node)choose(Number(node.dataset.token));};$('grouping').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){const node=e.target.closest('[data-token]');if(node){e.preventDefault();choose(Number(node.dataset.token));}}};
function prepare(){total=bounded('total',2,30);size=Number($('size').value);locations=Array(total).fill(-1);selected.clear();buildHistory=[];showCounts=false;clearBuildWriting();$('build-title').textContent=`Verdeel ${total} voorwerpen in groepen van ${size}.`;$('build-hint').textContent='Tik op voorwerpen om ze te kiezen. Maak daarmee één groep. Zonder selectie neemt de knop de volgende voorwerpen.';drawBuild();}
$('total').onchange=()=>{sizes();};$('prepare').onclick=prepare;$('build-clear').onclick=()=>{prepare();};
$('make-group').onclick=()=>{const ids=selected.size?[...selected]:locations.map((n,i)=>n<0?i:-1).filter(i=>i>=0).slice(0,size);if(ids.length!==size){$('build-hint').textContent=`Kies precies ${size} voorwerpen voor één groep.`;return;}saveBuild();const next=Math.max(-1,...locations)+1;ids.forEach(id=>locations[id]=next);selected.clear();$('build-hint').textContent='Schrijf wat je wegneemt. Kun je nog een groep maken?';drawBuild();};
$('build-undo').onclick=()=>{if(buildHistory.length){const old=buildHistory.pop();locations=old.locations;selected=new Set(old.selected);$('build-hint').textContent='De laatste groep ligt weer bij de voorraad. Maak opnieuw een gelijke groep.';drawBuild();}};$('counts').onclick=()=>{showCounts=!showCounts;drawBuild();};$('build-check').onclick=()=>{$('build-hint').textContent=locations.every(n=>n>=0)?`Juist: ${total} : ${size} = ${total/size}. Je maakte ${total/size} groepen van ${size}.`:'Er zijn nog voorwerpen over. Maak verder gelijke groepen.';};
const exercises=[];
[[12,3],[16,4],[18,6],[20,5],[10,2]].forEach(([a,b],i)=>exercises.push(
 {kind:'picture',a,b},{kind:'division',a:[8,15,18,20,12][i],b:[2,3,3,10,4][i]},
 {kind:'subtraction',a:[9,14,16,12,20][i],b:[3,7,2,6,4][i]},
 {kind:'draw',a:[10,12,15,16,18][i],b:[5,4,5,4,3][i]},
 {kind:'words',a:[18,20,12,8,15][i],b:[9,2,3,4,3][i]},
 {kind:'match',sets:[[[12,3],[12,4],[10,2]],[[8,2],[15,5],[16,4]],[[18,3],[18,6],[12,2]],[[20,4],[20,5],[9,3]],[[14,7],[16,2],[10,5]]][i]}
));
let list=exercises,index=0,revealed=false,help=false,tool='pen',history=[],active=null,stroke=null,startPoint=null;
const board=$('board'),ink=$('ink'),current=()=>list[index],sum=e=>e.a+' − '+Array(e.a/e.b).fill(e.b).join(' − ');
function drawExercise(){const e=current(),g=$('exercise'),s=$('solution');g.replaceChildren();s.replaceChildren();ink.style.opacity=revealed?'.15':'1';$('progress').textContent=`Oefening ${index+1} van ${list.length}`;$('prev').disabled=index===0;$('next').disabled=index===list.length-1;
const questions={picture:'Schrijf de herhaalde aftrekking en de deling.',division:'Schrijf de herhaalde aftrekking bij deze deling.',subtraction:'Schrijf deze aftrekking korter als een deling.',draw:'Verwoord de deling en teken groepjes kruisjes.',words:`Je hebt ${e.a} voorwerpen. Maak groepen van ${e.b}. Hoeveel groepen kun je maken?`,match:'Geef wat bij elkaar hoort dezelfde kleur.'};$('question').textContent=questions[e.kind];
$('matching').hidden=e.kind!=='match';$('practice-writing').hidden=e.kind==='match';if(e.kind==='match')drawMatches();
if(e.kind==='picture')groups(g,Array(e.a/e.b).fill(e.b),25,5,1050,125);
if(e.kind==='division'||e.kind==='draw')txt(g,550,45,`${e.a} : ${e.b}`,38);
if(e.kind==='subtraction')txt(g,550,65,sum(e)+' = 0',e.a/e.b>6?30:36);
if(e.kind==='draw'){
 txt(g,30,100,`${e.a} verdelen in groepen van`,24,{'text-anchor':'start'});line(g,380,112,520,112);g.append(el('rect',{x:30,y:140,width:1040,height:195,rx:12,fill:'none',stroke:'#b8cdcc','stroke-width':2}));if(revealed){txt(s,440,100,e.b,28);groups(s,Array(e.a/e.b).fill(e.b),35,145,1030,185,true);}
}else if(e.kind!=='match'){
 const ys=e.kind==='picture'?[190,260,330]:[170,250,330];ys.forEach(y=>line(g,45,y,1055,y));
 if(revealed){txt(s,550,ys[0]-12,`${e.a} verdelen in groepen van ${e.b}`,28);txt(s,550,ys[1]-12,sum(e)+' = 0',e.a/e.b>6?28:32);txt(s,550,ys[2]-12,`${e.a} : ${e.b} = ${e.a/e.b}`,36);}
}
$('answer').textContent=revealed?'Verberg voorbeeldantwoord':'Toon voorbeeldantwoord';$('help').textContent=help?'Verberg hulp':'Toon hulp';$('feedback').textContent=help?'Hoeveel heb je in totaal? Hoeveel in elke groep? Haal telkens één groep weg tot er niets over is. Tel de groepen.':e.kind==='match'?'Kies een kleur en tik op de vakjes die bij elkaar horen.':'';
}
function fresh(){matchColors=Array(12).fill(null);matchHistory=[];ink.replaceChildren();history=[];revealed=help=false;active=stroke=null;drawExercise();}
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
const matchOrder=[[0,0],[1,2],[2,1],[0,3],[2,2],[1,1],[0,2],[2,3],[1,0],[0,1],[1,3],[2,0]];
const colors=[{name:'Blauw',fill:'#dbe8ff',border:'#164bd6'},{name:'Oranje',fill:'#ffe2bf',border:'#b85b00'},{name:'Paars',fill:'#eddcff',border:'#803caf'}];
let matchColors=Array(12).fill(null),matchHistory=[],paint=0;
function drawMatches(){
 const palette=$('palette');palette.replaceChildren();colors.forEach((color,i)=>{const b=document.createElement('button');b.textContent=color.name;b.style.borderColor=color.border;b.style.background=i===paint?color.fill:'white';b.setAttribute('aria-pressed',String(i===paint));b.onclick=()=>{paint=i;drawMatches();};palette.append(b);});
 const target=$('match-cards');target.replaceChildren();
 matchOrder.forEach(([set,form],i)=>{const [a,b]=current().sets[set],button=document.createElement('button');const label=form===0?`${a} verdelen in groepen van ${b}`:form===1?`${a} : ${b}`:form===2?a+' − '+Array(a/b).fill(b).join(' − ')+' = 0':`${a} stippen in groepen van ${b}`;
 const color=revealed?set:matchColors[i];button.setAttribute('aria-label',`${label}, ${color===null?'ongekleurd':colors[color].name}`);if(color!==null){button.style.background=colors[color].fill;button.style.borderColor=colors[color].border;}
 if(form===3){const svg=el('svg',{viewBox:'0 0 280 90','aria-hidden':'true'});groups(svg,Array(a/b).fill(b),0,0,280,90);button.append(svg);}else button.textContent=label;
 button.onclick=()=>{if(revealed)return;matchHistory.push([...matchColors]);matchColors[i]=matchColors[i]===paint?null:paint;$('feedback').textContent='';drawMatches();};target.append(button);
 });$('match-undo').disabled=revealed||!matchHistory.length;$('match-clear').disabled=revealed;$('match-check').disabled=revealed;
}
$('match-undo').onclick=()=>{if(matchHistory.length){matchColors=matchHistory.pop();$('feedback').textContent='';drawMatches();}};
$('match-clear').onclick=()=>{matchHistory.push([...matchColors]);matchColors.fill(null);$('feedback').textContent='';drawMatches();};
$('match-check').onclick=()=>{if(matchColors.some(c=>c===null)){$('feedback').textContent='Geef eerst elk vakje een kleur.';return;}const sets=[0,1,2].map(set=>new Set(matchOrder.map(([s],i)=>s===set?matchColors[i]:null).filter(c=>c!==null)));const correct=sets.every(s=>s.size===1)&&new Set(sets.map(s=>[...s][0])).size===3;$('feedback').textContent=correct?'Juist! Dezelfde groepjes, woorden en bewerkingen hebben dezelfde kleur.':'Kijk naar het aantal groepen én het aantal in elke groep. Probeer opnieuw.';};
groups($('memory-picture'),[3,3,3,3],0,0,600,170);sizes();prepare();fresh();
})();
