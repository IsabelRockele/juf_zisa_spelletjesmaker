(() => {
'use strict';
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
function el(tag,a={},text){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(a))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
const rect=(g,x,y,w,h,fill='#fff',attrs={})=>g.appendChild(el('rect',{x,y,width:w,height:h,fill,stroke:'#456572','stroke-width':2,...attrs}));
const label=(g,x,y,t,size=26,attrs={})=>g.appendChild(el('text',{x,y,'font-size':size,'text-anchor':'middle',...attrs},t));
const line=(g,x1,y1,x2,y2,attrs={})=>g.appendChild(el('line',{x1,y1,x2,y2,stroke:'#456572','stroke-width':3,...attrs}));
function point(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(n=>{n.setAttribute('aria-pressed',String(n===b));$(n.dataset.tab).hidden=n!==b;});});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('message').textContent='Gebruik eventueel F11 voor volledig scherm.';}};

// Elke vorm bestaat uit vier delen met exact dezelfde oppervlakte.
function quarterFigure(g,shape,selected=new Set(),interactive=false,outline=true){
 const attrs=i=>({fill:selected.has(i)?'#72bfa2':'white',stroke:outline?'#456572':'none','stroke-width':2,...(interactive?{'data-cell':i,tabindex:0,role:'button','aria-label':`Deel ${i+1}`,'aria-pressed':String(selected.has(i))}:{})});
 if(shape==='circle')for(let i=0;i<4;i++){const a=(i*90-90)*Math.PI/180,b=a+Math.PI/2;g.append(el('path',{d:`M500 160L${500+120*Math.cos(a)} ${160+120*Math.sin(a)}A120 120 0 0 1 ${500+120*Math.cos(b)} ${160+120*Math.sin(b)}Z`,...attrs(i)}));}
 else if(shape==='triangle')[[[500,30],[420,160],[580,160]],[[420,160],[340,290],[500,290]],[[580,160],[500,290],[660,290]],[[420,160],[580,160],[500,290]]].forEach((p,i)=>g.append(el('polygon',{points:p.map(v=>v.join(',')).join(' '),...attrs(i)})));
 else if(shape==='diagonal')[[[380,40],[620,40],[500,160]],[[620,40],[620,280],[500,160]],[[620,280],[380,280],[500,160]],[[380,280],[380,40],[500,160]]].forEach((p,i)=>g.append(el('polygon',{points:p.map(v=>v.join(',')).join(' '),...attrs(i)})));
 else if(shape==='strip')for(let i=0;i<4;i++)rect(g,260+i*120,90,120,140,'white',attrs(i));
 else for(let i=0;i<4;i++)rect(g,380+(i%2)*120,40+Math.floor(i/2)*120,120,120,'white',attrs(i));
}
let stripStep=0,stripAnswer=false,chosen=0;
const titles=['Wat is het geheel?','Weet je nog? Hoe noemen we het groene deel?','Verdeel elke helft nog eens in twee.','Wijs één van de vier gelijke delen aan.','Kan het ook op een andere manier?','Zijn dit vier kwarten?'];
const explanations=['De hele figuur is het geheel.','Een helft is één van twee gelijke delen.','Het geheel is nu verdeeld in vier gelijke delen.','Dit deel is een kwart. Elk van de andere drie delen is óók een kwart.','Ja. Ook deze vier driehoeken zijn even groot. Elk deel is een kwart.','Nee. Er zijn vier delen, maar ze zijn niet even groot.'];
function strips(){const g=$('strip-board');g.replaceChildren();$('strip-title').textContent=titles[stripStep];$('strip-progress').textContent=`Stap ${stripStep+1} van 6`;$('strip-back').disabled=stripStep===0;$('strip-next').disabled=stripStep===5;$('strip-result').textContent=stripAnswer?explanations[stripStep]:'';$('strip-reveal').textContent=stripAnswer?'Verberg uitleg':'Bespreek';$('strip-hint').textContent=stripStep===0?'We leren een geheel in vier gelijke delen verdelen en één kwart nemen.':stripStep===3||stripStep===4?'Tik op een deel. Kun je ook een ander kwart aanwijzen?':'Laat de kinderen meedenken en, met een eigen blad, meevouwen.';
 if(stripStep===0)rect(g,380,40,240,240,'#66abc1');
 else if(stripStep===1){rect(g,380,40,120,240,'#72bfa2');rect(g,500,40,120,240,'white');}
 else if(stripStep===5){let x=260;[60,120,180,120].forEach((w,i)=>{rect(g,x,80,w,160,i===0?'#72bfa2':'white');x+=w;});}
 else quarterFigure(g,stripStep===4?'diagonal':'square',stripStep===2?new Set():new Set([chosen]),stripStep>=3);
}
$('strip-next').onclick=()=>{stripStep++;chosen=0;stripAnswer=false;strips();};$('strip-back').onclick=()=>{stripStep--;chosen=0;stripAnswer=false;strips();};$('strip-reset').onclick=()=>{stripStep=0;chosen=0;stripAnswer=false;strips();};$('strip-reveal').onclick=()=>{stripAnswer=!stripAnswer;strips();};
function chooseQuarter(e){const n=e.target.closest('[data-cell]');if(n){chosen=Number(n.dataset.cell);strips();}}
$('strip-board').onclick=chooseQuarter;$('strip-board').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseQuarter(e);}};
// Vaste blokposities; vier kaarten met maximaal twintig blokjes per kaart.
let amount=16,locations=[],slots=[],counts=false,selected=null,blockHistory=[],drag=null,activeCard=null;
const zones=[['pool',15,40,270,265,'Het geheel'],['a',310,25,325,140,'Kaart 1'],['b',655,25,325,140,'Kaart 2'],['c',310,185,325,140,'Kaart 3'],['d',655,185,325,140,'Kaart 4']];
function saveBlocks(){blockHistory.push({locations:[...locations],slots:[...slots]});}
function prepare(){amount=Number($('block-amount').value);locations=Array(amount).fill('pool');slots=Array.from({length:amount},(_,i)=>i);counts=false;selected=null;activeCard=null;blockHistory=[];$('block-result').textContent='';blocks();}
function place(id,zone){const used=new Set(slots.filter((_,i)=>locations[i]===zone));let slot=0;while(used.has(slot))slot++;locations[id]=zone;slots[id]=zone==='pool'?id:slot;}
function move(id,zone){if(locations[id]===zone)return;saveBlocks();place(id,zone);selected=null;activeCard=null;$('block-result').textContent='';blocks();}
function blocks(){const g=$('block-board');g.replaceChildren();$('block-title').textContent=`Verdeel ${amount} blokjes eerlijk over vier kaarten.`;$('block-undo').disabled=!blockHistory.length;$('block-action').disabled=locations.filter(z=>z==='pool').length<4;$('block-counts').textContent=counts?'Verberg aantallen':'Toon aantallen';$('block-counts').setAttribute('aria-pressed',String(counts));
 for(const [zone,x,y,w,h,t] of zones){rect(g,x,y,w,h,zone==='pool'?'#fff8e7':activeCard===zone?'#e0f2e9':'white',{rx:12,'data-zone':zone,role:'button',tabindex:0,'aria-label':zone==='pool'?'Leg terug bij het geheel':t});label(g,x+w/2,y+27,t,22,{'pointer-events':'none'});if(counts)label(g,x+w-18,y+27,locations.filter(z=>z===zone).length,22,{'pointer-events':'none'});}
 locations.forEach((zone,id)=>{const z=zones.find(v=>v[0]===zone),slot=slots[id],pool=zone==='pool',cols=pool?5:10;rect(g,z[1]+15+(slot%cols)*(pool?46:29),z[2]+45+Math.floor(slot/cols)*(pool?43:36),pool?30:24,pool?30:24,'#66abc1',{rx:4,'data-id':id,role:'button',tabindex:0,'aria-label':`Blokje ${id+1}`,class:selected===id?'selected-block':''});});
}
function discuss(){const ns=['a','b','c','d'].map(z=>locations.filter(v=>v===z).length);$('block-result').textContent=locations.includes('pool')?'Verdeel eerst alle blokjes. Het geheel bestaat uit alle blokjes samen.':ns.some(n=>n!==amount/4)?'Op de vier kaarten moet evenveel liggen. Pas de verdeling aan.':`Een kwart van ${amount} is ${amount/4}. Tik op een kaart om één kwart aan te wijzen.`;}
function selectZone(zone){if(selected!==null){move(selected,zone);return;}if(zone!=='pool'&&!locations.includes('pool')&&['a','b','c','d'].every(z=>locations.filter(v=>v===z).length===amount/4)){activeCard=zone;blocks();$('block-result').textContent=`Deze ${amount/4} blokjes zijn één kwart van ${amount}. De andere kaarten zijn ook elk één kwart.`;}}
const bb=$('block-board');
bb.addEventListener('pointerdown',e=>{const n=e.target.closest('[data-id]');if(!n)return;e.preventDefault();drag={id:Number(n.dataset.id),token:n,start:point(bb,e),moved:false,ghost:null};bb.setPointerCapture(e.pointerId);});
bb.addEventListener('pointermove',e=>{if(!drag)return;const p=point(bb,e);if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>7){drag.moved=true;if(!drag.ghost){drag.ghost=drag.token.cloneNode(true);drag.ghost.removeAttribute('data-id');drag.ghost.setAttribute('pointer-events','none');bb.append(drag.ghost);drag.token.style.opacity='0';}drag.ghost.setAttribute('x',p.x-15);drag.ghost.setAttribute('y',p.y-15);}});
bb.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;d.ghost?.remove();d.token.style.opacity='';if(d.moved){const p=point(bb,e);const z=zones.find(([,x,y,w,h])=>p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h);if(z)move(d.id,z[0]);}else{selected=d.id;blocks();}});
bb.addEventListener('pointercancel',()=>{if(drag){drag.ghost?.remove();drag.token.style.opacity='';drag=null;}});
bb.onclick=e=>{const n=e.target.closest('[data-zone]');if(n)selectZone(n.dataset.zone);};bb.onkeydown=e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();const n=e.target.closest('[data-id]');if(n){selected=Number(n.dataset.id);blocks();}else{const z=e.target.closest('[data-zone]');if(z)selectZone(z.dataset.zone);}};
$('block-prepare').onclick=prepare;$('block-reset').onclick=prepare;$('block-amount').onchange=prepare;$('block-undo').onclick=()=>{const old=blockHistory.pop();if(old){({locations,slots}=old);selected=null;activeCard=null;$('block-result').textContent='';blocks();}};$('block-counts').onclick=()=>{counts=!counts;blocks();};$('block-check').onclick=discuss;
$('block-action').onclick=()=>{const ids=locations.map((z,i)=>z==='pool'?i:-1).filter(i=>i>=0).slice(0,4);if(ids.length<4)return;saveBlocks();ids.forEach((id,i)=>place(id,['a','b','c','d'][i]));activeCard=null;$('block-result').textContent='';blocks();};
const exercises=[
 {kind:'divide',shape:'rectangle',q:'Verdeel de rechthoek in vier gelijke delen. Schrijf in elk deel ‘een kwart’.'},
 {kind:'color',shape:'circle',q:'Kleur één kwart van de cirkel.'},
 {kind:'recognize',shape:'unequal',correct:false,why:'Dit zijn vier delen, maar ze zijn niet even groot. Het groene deel is geen kwart.'},
 {kind:'amount',n:16,q:'Omkring één kwart van de 16 stippen.'},
 {kind:'number',n:8,q:'Er liggen 8 kastanjes. Je neemt een kwart. Hoeveel neem je?'},
 {kind:'divide',shape:'square',q:'Verdeel het vierkant op een andere manier in vier gelijke delen. Kleur een kwart.'},
 {kind:'color',shape:'triangle',q:'Kleur één kwart van de driehoek.'},
 {kind:'recognize',shape:'strip',correct:true,why:'Eén van vier even grote delen is gekleurd. Dat is een kwart.'},
 {kind:'amount',n:20,q:'Omkring één kwart van de 20 stippen.'},
 {kind:'number',n:12,q:'Er zijn 12 kralen. Een kwart is groen. Hoeveel kralen zijn groen?'},
 {kind:'divide',shape:'circle',q:'Verdeel de cirkel in vier gelijke delen. Kleur één kwart.'},
 {kind:'color',shape:'diagonal',q:'Kleur één kwart. Kies daarna eens een ander kwart.'},
 {kind:'recognize',shape:'half',correct:false,why:'De helft is gekleurd. Een kwart is de helft van een helft.'},
 {kind:'amount',n:8,q:'Omkring één kwart van de 8 stippen.'},
 {kind:'number',n:20,q:'Een doos bevat 20 blokjes. Je neemt een kwart. Hoeveel neem je?'}
];
let list=exercises,index=0,tool='touch',revealed=false,selections=new Set(),choiceSet=new Set(),history=[],pointer=null,stroke=null;
const current=()=>list[index],ink=$('ink'),solution=$('solution'),practiceBoard=$('practice-board');
function dot(g,x,y,attrs={}){g.append(el('circle',{cx:x,cy:y,r:19,fill:'white',stroke:'#456572','stroke-width':2,...attrs}));}
function positions(n){const cols=n===8?4:5;return Array.from({length:n},(_,i)=>[500-(cols-1)*65+(i%cols)*130,45+Math.floor(i/cols)*70]);}
function save(){history.push({ink:ink.innerHTML,selections:[...selections],choices:[...choiceSet]});}
function selectTool(value){tool=value;document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===tool)));}
function drawPractice(){const e=current(),g=$('exercise');g.replaceChildren();solution.replaceChildren();ink.style.opacity=revealed?'.15':'1';ink.setAttribute('pointer-events','none');$('question').textContent=e.q||'Is het groene deel één kwart van het geheel?';$('progress').textContent=`Oefening ${index+1} van ${list.length}`;$('practice').classList.toggle('has-choices',e.kind==='recognize');$('choices').replaceChildren();$('answer').textContent=revealed?'Verberg voorbeeldantwoord':'Toon voorbeeldantwoord';$('practice-check').hidden=!['color','amount'].includes(e.kind);
 $('practice-hint').textContent=e.kind==='divide'?'Teken zelf. Met Aanwijzen / kleuren kun je vakjes kleuren. Gebruik de stempel om ‘een kwart’ te schrijven.':e.kind==='color'?'Tik op één deel. Nog eens tikken wist de kleur. Elk van de vier delen mag.':e.kind==='recognize'?'Zijn de delen even groot? Welk deel is groen?':e.kind==='amount'?'Omkring met de pen. Of tik op stippen: elke tik zet een kring. Tik opnieuw om die weg te nemen.':'Schrijf je antwoord op de lijn of op je wisbord.';
 if(e.kind==='divide'){
  if(e.shape==='circle'){quarterFigure(g,'circle',revealed?new Set():selections,true,false);g.append(el('circle',{cx:500,cy:160,r:120,fill:'none',stroke:'#456572','stroke-width':2,'pointer-events':'none'}));for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,500+114*Math.cos(a),160+114*Math.sin(a),500+120*Math.cos(a),160+120*Math.sin(a),{'stroke-width':1,'pointer-events':'none'});}}
  else{const w=e.shape==='square'?240:480,x=500-w/2,cols=w/40;for(let r=0;r<6;r++)for(let c=0;c<cols;c++){const id=r*cols+c;rect(g,x+c*40,40+r*40,40,40,!revealed&&selections.has(id)?'#72bfa2':'white',{'data-cell':id,tabindex:0,role:'button','aria-label':`Vakje ${id+1}`,stroke:'none'});}for(let c=1;c<cols;c++)line(g,x+c*40,40,x+c*40,280,{stroke:'#95b5c0','stroke-width':1,'stroke-dasharray':'4 4','pointer-events':'none'});for(let y=80;y<280;y+=40)line(g,x,y,x+w,y,{stroke:'#95b5c0','stroke-width':1,'stroke-dasharray':'4 4','pointer-events':'none'});rect(g,x,40,w,240,'none',{'pointer-events':'none'});}
 }
 if(e.kind==='color')quarterFigure(g,e.shape,revealed?new Set():selections,true);
 if(e.kind==='amount')positions(e.n).forEach(([x,y],i)=>{dot(g,x,y,{fill:'#66abc1','data-cell':i,tabindex:0,role:'button','aria-label':`Stip ${i+1}`});if(!revealed&&selections.has(i))g.append(el('circle',{cx:x,cy:y,r:28,fill:'none',stroke:'#28705d','stroke-width':3,'pointer-events':'none'}));});
 if(e.kind==='number'){label(g,230,155,`Een kwart van ${e.n} is`,32,{'text-anchor':'start'});line(g,590,175,810,175,{stroke:'#bcced0'});}
 if(e.kind==='recognize'){
  if(e.shape==='unequal'){let x=260;[60,120,180,120].forEach((w,i)=>{rect(g,x,60,w,190,i===0?'#72bfa2':'white');x+=w;});}
  else if(e.shape==='half'){rect(g,320,60,180,190,'#72bfa2');rect(g,500,60,180,190,'white');}
  else quarterFigure(g,e.shape,new Set([2]));
  [true,false].forEach((value,i)=>{const b=document.createElement('button');b.textContent=value?'Ja, een kwart':'Nee, geen kwart';b.setAttribute('aria-pressed',String(choiceSet.has(i)));if(revealed)b.className=value===e.correct?'correct':choiceSet.has(i)?'incorrect':'';b.onclick=()=>{if(revealed)return;save();choiceSet=new Set([i]);$('practice-result').textContent='';drawPractice();};$('choices').append(b);});
 }
 if(revealed)answerExample();
}
function answerExample(){const e=current(),g=solution;let text='';
 if(e.kind==='divide'){
  if(e.shape==='rectangle'){for(let i=0;i<4;i++){rect(g,260+i*120,40,120,240,'white',{'fill-opacity':.8,stroke:'#28705d'});label(g,320+i*120,168,'een kwart',18);}}
  else if(e.shape==='square'){quarterFigure(g,'square',new Set([2]));}
  else quarterFigure(g,'circle',new Set([3]));
  text='Dit is één mogelijkheid. Er zijn vier even grote delen. Elk deel is een kwart.';
 }
 if(e.kind==='color'){quarterFigure(g,e.shape,new Set([e.shape==='triangle'?3:1]));text='Dit is één kwart. Ook elk van de andere drie gelijke delen is een kwart.';}
 if(e.kind==='amount'){const ps=positions(e.n);for(let i=0;i<e.n/4;i++){const [x,y]=ps[i];g.append(el('circle',{cx:x,cy:y,r:28,fill:'none',stroke:'#28705d','stroke-width':4}));}text=`Een kwart van ${e.n} is ${e.n/4}. Andere groepjes van ${e.n/4} stippen zijn ook juist.`;}
 if(e.kind==='number'){label(g,695,155,e.n/4,44);text=`Een kwart van ${e.n} is ${e.n/4}. Vier groepjes van ${e.n/4} vormen samen ${e.n}.`;}
 if(e.kind==='recognize')text=e.why;
 $('practice-result').textContent=text;
}
function fresh(){revealed=false;selections.clear();choiceSet.clear();history=[];ink.replaceChildren();$('practice-result').textContent='';selectTool(['divide','number'].includes(current().kind)?'pen':'touch');drawPractice();}
$('prev').onclick=()=>{index=(index+list.length-1)%list.length;fresh();};$('next').onclick=()=>{index=(index+1)%list.length;fresh();};$('practice-kind').onchange=()=>{list=$('practice-kind').value==='mixed'?exercises:exercises.filter(e=>e.kind===$('practice-kind').value);index=0;fresh();};$('answer').onclick=()=>{revealed=!revealed;$('practice-result').textContent='';drawPractice();};
$('practice-check').onclick=()=>{const e=current();if(ink.children.length){$('practice-result').textContent='Bespreek samen: heb je precies één van de vier gelijke delen aangeduid?';return;}$('practice-result').textContent=e.kind==='color'?(selections.size===1?'Juist: één van vier gelijke delen is één kwart.':'Kies precies één van de vier gelijke delen.'):(selections.size===e.n/4?`Juist: ${e.n/4} is een kwart van ${e.n}.`:'Kun je met alle stippen vier even grote groepjes maken? Neem één groepje.');};
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>selectTool(b.dataset.tool));
function toggleCell(target){const id=Number(target.dataset.cell);save();selections.has(id)?selections.delete(id):selections.add(id);$('practice-result').textContent='';drawPractice();}
practiceBoard.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.hasAttribute('data-cell')&&!revealed){e.preventDefault();toggleCell(e.target);}};
function rub(p){for(const n of [...ink.children]){const b=n.getBBox();if(p.x>=b.x-15&&p.x<=b.x+b.width+15&&p.y>=b.y-15&&p.y<=b.y+b.height+15){if(n.tagName==='path'&&n.getTotalLength){let hit=false;for(let d=0;d<n.getTotalLength();d+=5){const q=n.getPointAtLength(d);if(Math.hypot(p.x-q.x,p.y-q.y)<20){hit=true;break;}}if(hit)n.remove();}else n.remove();}}}
practiceBoard.addEventListener('pointerdown',e=>{if(pointer!==null||e.button!==0||revealed)return;const p=point(practiceBoard,e);if(tool==='touch'){const n=e.target.closest('[data-cell]');if(n)toggleCell(n);return;}e.preventDefault();save();pointer=e.pointerId;practiceBoard.setPointerCapture(pointer);if(tool==='label'){label(ink,p.x,p.y,'een kwart',20,{'text-anchor':'start'});return;}if(tool==='eraser'){rub(p);return;}stroke=el('path',{d:`M${p.x} ${p.y}l.1 .1`,fill:'none',stroke:tool==='pen'?'#243b45':'#28705d','stroke-width':tool==='paint'?26:4,'stroke-opacity':tool==='paint'?.3:1,'stroke-linecap':'round','stroke-linejoin':'round'});ink.append(stroke);});
practiceBoard.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;const p=point(practiceBoard,e);if(tool==='eraser')rub(p);else if(stroke)stroke.setAttribute('d',stroke.getAttribute('d')+`L${p.x} ${p.y}`);});['pointerup','pointercancel','lostpointercapture'].forEach(type=>practiceBoard.addEventListener(type,()=>{pointer=null;stroke=null;}));
$('ink-undo').onclick=()=>{const old=history.pop();if(old){ink.innerHTML=old.ink;selections=new Set(old.selections);choiceSet=new Set(old.choices);revealed=false;$('practice-result').textContent='';drawPractice();}};$('ink-clear').onclick=()=>{save();ink.replaceChildren();selections.clear();choiceSet.clear();revealed=false;$('practice-result').textContent='';drawPractice();};
const rg=$('remember-dots');for(let group=0;group<4;group++){rect(rg,10+group*102,20,92,120,group===1?'#e0f2e9':'white',{rx:12});for(let i=0;i<4;i++)dot(rg,35+group*102+(i%2)*40,55+Math.floor(i/2)*45,{r:12,fill:group===1?'#72bfa2':'#66abc1'});}strips();prepare();fresh();
})();
