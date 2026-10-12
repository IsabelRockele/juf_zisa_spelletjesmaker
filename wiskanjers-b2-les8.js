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
let jumps=0;
function drawJumps(){const g=$('jump-board'),start=bounded('start',0,20),step=Number($('jump').value);g.replaceChildren();line(g,60,200,940,200,{stroke:'#456572','stroke-width':3});for(let i=0;i<=10;i++){const x=60+i*88;line(g,x,193,x,207);if(i<=jumps)txt(g,x,240,start+i*step,30);if(i<jumps){g.append(el('path',{d:`M${x} 185 Q${x+44} 70 ${x+88} 185`,fill:'none',stroke:'#28705d','stroke-width':4}));txt(g,x+44,115,`+${step}`,22);}}$('jump-back').disabled=!jumps;$('jump-next').disabled=jumps===10;}
$('jump-next').onclick=()=>{jumps=Math.min(10,jumps+1);drawJumps();};$('jump-back').onclick=()=>{jumps=Math.max(0,jumps-1);drawJumps();};['start','jump'].forEach(id=>$(id).onchange=()=>{jumps=0;drawJumps();});$('jump-reset').onclick=()=>{jumps=0;drawJumps();};
let cards=[],target=3,buildHistory=[];
function counts(){return cards.map(c=>c.filter(Boolean).length);}
function saveBuild(){buildHistory.push(cards.map(c=>[...c]));}
function drawBuild(){const g=$('group-board');g.replaceChildren();cards.forEach((card,i)=>{const box=document.createElement('div');box.className='group';box.setAttribute('role','group');box.setAttribute('aria-label',`Groep ${i+1}`);card.forEach((on,j)=>{const b=document.createElement('button');b.className=on?'filled':'';b.setAttribute('aria-label',`Groep ${i+1}, vakje ${j+1}: ${on?'blokje wegnemen':'blokje leggen'}`);b.setAttribute('aria-pressed',String(on));b.onclick=()=>{saveBuild();cards[i][j]=!on;$('build-title').textContent='Zijn alle groepen even groot?';drawBuild();};box.append(b);});g.append(box);});$('build-undo').disabled=!buildHistory.length;$('add-group').disabled=cards.every(c=>c.filter(Boolean).length===target);}
function prepare(){target=bounded('each',1,11);cards=Array.from({length:bounded('groups',1,12)},()=>Array(12).fill(false));buildHistory=[];clearBuildWriting();$('build-title').textContent=`Maak ${cards.length} groepen met telkens ${target} blokjes.`;drawBuild();}
$('prepare').onclick=prepare;$('build-clear').onclick=()=>{saveBuild();cards=cards.map(c=>c.map(()=>false));clearBuildWriting();drawBuild();};$('add-group').onclick=()=>{const i=cards.findIndex(c=>c.filter(Boolean).length!==target);if(i<0)return;saveBuild();cards[i]=cards[i].map((_,j)=>j<target);drawBuild();};$('build-undo').onclick=()=>{if(buildHistory.length){cards=buildHistory.pop();drawBuild();}};$('build-check').onclick=()=>{$('build-title').textContent=counts().every(n=>n===target)?`Juist: ${cards.length} gelijke groepen van ${target}.`:`Zorg dat in elk van de ${cards.length} groepen precies ${target} blokjes liggen.`;};
const exercises=[];
[[3,4],[5,2],[4,5],[6,3]].forEach(([a,b],i)=>{exercises.push({kind:'picture',a,b},{kind:'sum',a:i+3,b:i===3?15:i+2},{kind:'times',a:[4,2,3,6][i],b:[2,5,11,8][i]},{kind:'draw',a:i+2,b:i+2,cross:i%2===1},{kind:'equal',a:3,b:i+2,unequal:i%2===0},{kind:'words',a:[3,4,2,5][i],b:[2,4,5,3][i]},{kind:'expand',a:[4,3,2,5][i],b:[3,5,8,4][i],cross:true},{kind:'match',sets:[[[2,4],[4,2],[3,3]],[[2,3],[3,2],[4,4]],[[3,4],[4,3],[2,5]],[[2,6],[6,2],[3,5]]][i]});});
let list=exercises,index=0,revealed=false,help=false,tool='pen',history=[],active=null,stroke=null,startPoint=null;
const board=$('board'),ink=$('ink'),current=()=>list[index],sum=e=>Array(e.a).fill(e.b).join(' + ');
function drawExercise(){const e=current(),g=$('exercise'),s=$('solution');g.replaceChildren();s.replaceChildren();ink.style.opacity=revealed?'.15':'1';$('progress').textContent=`Oefening ${index+1} van ${list.length}`;$('prev').disabled=index===0;$('next').disabled=index===list.length-1;
const questions={words:'Schrijf op vijf manieren wat je ziet.',expand:'Schrijf op vier manieren. Teken daarna groepjes kruisjes.',match:'Geef wat bij elkaar hoort dezelfde kleur.',picture:'Schrijf de optelling en de vermenigvuldiging.',sum:'Schrijf deze optelling korter met het maalteken.',times:'Schrijf als herhaalde optelling. Leg uit wat elk getal zegt.',draw:`Teken ${e.a} keer een groep van ${e.b} ${e.cross?'kruisjes':'stippen'}.`,equal:'Kun je dit schrijven als gelijke groepen? Leg uit.'};$('question').textContent=questions[e.kind];
if(e.kind==='picture'||e.kind==='equal'){const c=Array(e.a).fill(e.b);if(e.unequal)c[c.length-1]++;groups(g,c);}
if(e.kind==='sum')txt(g,550,75,sum(e)+' = …',40);if(e.kind==='times')txt(g,550,75,`${e.a} × ${e.b}`,46);
if(!['draw','words','expand','match'].includes(e.kind)){line(g,80,245,1020,245);line(g,80,325,1020,325);}
if(revealed&&!['words','expand','match'].includes(e.kind)){if(e.kind==='draw')groups(s,Array(e.a).fill(e.b),40,10,1020,180,e.cross);if(e.kind==='equal')txt(s,550,232,e.unequal?'Nee, niet in elke groep ligt evenveel.':`Ja, ${e.a} gelijke groepen van ${e.b}: ${e.a} × ${e.b}.`,28);else{txt(s,550,232,sum(e)+` = ${e.a*e.b}`,e.a>5?30:34);txt(s,550,312,`${e.a} × ${e.b} = ${e.a*e.b}`,38);}}
$('matching').hidden=e.kind!=='match';$('practice-writing').hidden=e.kind==='match';
if(e.kind==='match')drawMatches();
if(e.kind==='words'){
 groups(g,Array(e.a).fill(e.b),15,40,440,235);
 const labels=['Optelling','Keer een groep','Keer','Maal','Vermenigvuldiging'];
 const answers=[sum(e),`${e.a} keer een groep van ${e.b}`,`${e.a} keer ${e.b}`,`${e.a} maal ${e.b}`,`${e.a} × ${e.b}`];
 labels.forEach((label,i)=>{const y=58+i*65;txt(g,490,y-25,label,16,{'text-anchor':'start',fill:'#60746b'});line(g,490,y+12,1080,y+12);if(revealed)txt(s,510,y+3,answers[i],28,{'text-anchor':'start'});});
}
if(e.kind==='expand'){
 txt(g,275,40,`${e.a} × ${e.b}`,38);
 const labels=['Maal','Keer','Keer een groep','Optelling'];
 const answers=[`${e.a} maal ${e.b}`,`${e.a} keer ${e.b}`,`${e.a} keer een groep van ${e.b}`,sum(e)];
 labels.forEach((label,i)=>{const y=99+i*72;txt(g,35,y-23,label,16,{'text-anchor':'start'});line(g,35,y+13,520,y+13);if(revealed)txt(s,45,y+3,answers[i],27,{'text-anchor':'start'});});
 g.append(el('rect',{x:565,y:45,width:510,height:290,rx:14,fill:'none',stroke:'#b8cdcc','stroke-width':2}));txt(g,820,28,'Teken hier de groepjes kruisjes.',20);
 if(revealed)groups(s,Array(e.a).fill(e.b),570,50,500,280,true);
}
$('answer').textContent=revealed?'Verberg voorbeeldantwoord':'Toon voorbeeldantwoord';$('help').textContent=help?'Verberg hulp':'Toon hulp';$('feedback').textContent=help?(e.kind==='match'?'Kies een kleur. Tik op vier vakjes die dezelfde groepen voorstellen. Kies voor de andere groepen een andere kleur.':'Tel de groepen. Tel hoeveel er in één groep zitten. Schrijf: aantal groepen × aantal in elke groep.'):e.kind==='match'?'Kies een kleur en tik op de vakjes die bij elkaar horen.':'';
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
 matchOrder.forEach(([set,form],i)=>{const [a,b]=current().sets[set],button=document.createElement('button');const label=form===0?`${a} keer een groep van ${b}`:form===1?`${a} × ${b}`:form===2?Array(a).fill(b).join(' + '):`${a} groepjes van ${b} stippen`;
 const color=revealed?set:matchColors[i];button.setAttribute('aria-label',`${label}, ${color===null?'ongekleurd':colors[color].name}`);if(color!==null){button.style.background=colors[color].fill;button.style.borderColor=colors[color].border;}
 if(form===3){const svg=el('svg',{viewBox:'0 0 280 90','aria-hidden':'true'});groups(svg,Array(a).fill(b),0,0,280,90);button.append(svg);}else button.textContent=label;
 button.onclick=()=>{if(revealed)return;matchHistory.push([...matchColors]);matchColors[i]=matchColors[i]===paint?null:paint;$('feedback').textContent='';drawMatches();};target.append(button);
 });$('match-undo').disabled=revealed||!matchHistory.length;$('match-clear').disabled=revealed;$('match-check').disabled=revealed;
}
$('match-undo').onclick=()=>{if(matchHistory.length){matchColors=matchHistory.pop();$('feedback').textContent='';drawMatches();}};
$('match-clear').onclick=()=>{matchHistory.push([...matchColors]);matchColors.fill(null);$('feedback').textContent='';drawMatches();};
$('match-check').onclick=()=>{if(matchColors.some(c=>c===null)){$('feedback').textContent='Geef eerst elk vakje een kleur.';return;}const sets=[0,1,2].map(set=>new Set(matchOrder.map(([s],i)=>s===set?matchColors[i]:null).filter(c=>c!==null)));const correct=sets.every(s=>s.size===1)&&new Set(sets.map(s=>[...s][0])).size===3;$('feedback').textContent=correct?'Juist! Dezelfde groepjes, woorden en bewerkingen hebben dezelfde kleur.':'Kijk naar het aantal groepen én het aantal in elke groep. Probeer opnieuw.';};
groups($('memory-picture'),[3,3,3,3],0,0,600,170);drawJumps();prepare();fresh();
})();
