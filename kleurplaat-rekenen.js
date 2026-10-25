'use strict';
const $=id=>document.getElementById(id);
const palette=[['lichtblauw','#bce5f5'],['geel','#ffe27b'],['oranje','#ffa44d'],['lichtgroen','#96ce79'],['roze','#f4a7bd'],['paars','#bb9bd8'],['blauw','#69a8e5'],['rood','#ef7872'],['bruin','#bc9073'],['donkergroen','#548d5b'],['grijs','#b9c1cb'],['donkerblauw','#5974a6'],['wit','#ffffff'],['lichtbruin','#d7b48a'],['donkerbruin','#795548'],['zwart','#252525'],['beige','#f0d4b4'],['lichtgrijs','#e4e8ec']];
let regions=[], current=[];
function selectedArtwork(){return window.kleurplaatCatalogus[$('picture').value];}
function drawing(){regions=selectedArtwork().regions;return regions;}
function updateDrawingChoices(){
 const choices=Object.entries(window.kleurplaatCatalogus).filter(([,art])=>art.theme===$('theme').value);
 $('picture').replaceChildren(...choices.map(([id,art])=>new Option(art.title,id)));
 generate();
}
function crossesTen(a,b,op,max){
 if(max<=10)return false;
 if(op==='−')return max===20&&a===10?false:a%10<b%10;
 return a%10+b%10>10;
}
function pool(ops,max,tables,bridgeMode='gemengd'){const out=[];
 const push=(text,n,op,a,b)=>{
  const arithmetic=!['×','÷'].includes(op),bridge=arithmetic&&crossesTen(a,b,op,max);
  if(arithmetic&&max===20&&bridgeMode!=='met'&&n<8)return;
  if(arithmetic&&max===100&&n<=20)return;
  if(arithmetic&&max>=20&&bridgeMode!=='gemengd'&&bridge!==(bridgeMode==='met'))return;
  out.push({text,n,op,a,b,bridge});
 };
 for(let a=1;a<=max;a++)for(let b=1;b<=max;b++){
  if(ops.includes('+')&&a+b<=max)push(`${a} + ${b} =`,a+b,'+',a,b);
  if(ops.includes('−')&&a>b)push(`${a} − ${b} =`,a-b,'−',a,b);
  if(ops.includes('split')&&a+b<=max)push(`${a+b} = ${a} + □`,b,'split',a,b);
 }
 for(const t of tables)for(let b=1;b<=10;b++){
  if(ops.includes('×'))push(`${b} × ${t} =`,b*t,'×',b,t);
  if(ops.includes('÷'))push(`${b*t} : ${t} =`,b,'÷',b*t,t);
 }return out;
}
function compactExercise(text){return text.replaceAll(' ','').replace(/=$/,'');}
const textMetricsCache=new Map();let textMetricContext;
function exerciseMetrics(text){
 if(textMetricsCache.has(text))return textMetricsCache.get(text);
 let result={width:text.length*.56,ascent:.74,descent:.02,height:.76};
 if(typeof document!=='undefined'){
  textMetricContext||=document.createElement('canvas').getContext('2d');textMetricContext.font='100px Arial';
  const measured=textMetricContext.measureText(text),ascent=measured.actualBoundingBoxAscent/100,descent=measured.actualBoundingBoxDescent/100;
  result={width:Math.max(measured.width,measured.actualBoundingBoxLeft+measured.actualBoundingBoxRight)/100,ascent,descent,height:Math.max(.72,ascent+descent)};
 }
 textMetricsCache.set(text,result);return result;
}
function fitExercise(region,text){
 const metric=exerciseMetrics(compactExercise(text));
 const boxes=region.boxes||[region];
 const operands=compactExercise(text).match(/^(\d+)([+−×:])(\d+)$/);
 if(region.stackOperands&&operands){
  const lines=[operands[1],operands[2],operands[3]];
  const width=Math.max(...lines.map(line=>exerciseMetrics(line).width));
  const height=2+Math.max(...lines.map(line=>exerciseMetrics(line).height));
  const upright=boxes.filter(box=>!box.angle);
  if(upright.length)return upright.map(box=>({...box,angle:0,lines,font:Math.min(30,(box.width-6)/width,(box.height-4)/height)})).sort((a,b)=>b.font-a.font)[0];
 }
 const horizontal=boxes.map(box=>({...box,angle:box.angle||0,font:Math.min(30,(box.width-6)/metric.width,(box.height-4)/metric.height)})).sort((a,b)=>b.font-a.font)[0];
 if(horizontal.font>=22)return horizontal;
 const vertical=boxes.map(box=>({...box,angle:(box.angle||0)-90,font:Math.min(30,(box.height-6)/metric.width,(box.width-4)/metric.height)})).sort((a,b)=>b.font-a.font)[0];
 let best=vertical.font>horizontal.font*1.15?vertical:horizontal;
 const compact=compactExercise(text);
 const split=compact.match(/^(\d+=)(.*)$/),calculation=compact.match(/^(\d+)([+−×:])(\d+)$/);
 const lines=split?[split[1],split[2]]:calculation?[calculation[1],calculation[2]+calculation[3]]:null;
 if(lines&&best.font<22){
  const longest=Math.max(...lines.map(line=>exerciseMetrics(line).width)),lineHeight=1+Math.max(...lines.map(line=>exerciseMetrics(line).height));
  for(const box of boxes)for(const turn of [false,true]){
   const width=turn?box.height:box.width,height=turn?box.width:box.height;
   const font=Math.min(30,(width-6)/longest,(height-6)/lineHeight);
   if(font>best.font*1.05)best={...box,font,angle:(box.angle||0)-(turn?90:0),lines};
  }
 }
 const bond=compact.match(/^(\d+)=(\d+)\+□$/);
 if(bond&&best.font<22){
  const top=exerciseMetrics(bond[1]),known=exerciseMetrics(bond[2]),empty=exerciseMetrics('□');
  const widthFactor=Math.max(top.width,.9+(known.width+empty.width)/2),heightFactor=1.25+Math.max(top.height,known.height,empty.height);
  for(const box of boxes)for(const turn of [false,true]){
   const width=turn?box.height:box.width,height=turn?box.width:box.height,font=Math.min(30,(width-8)/widthFactor,(height-8)/heightFactor);
   if(font>best.font)best={...box,font,angle:(box.angle||0)-(turn?90:0),bond:{total:bond[1],known:bond[2]}};
  }
 }
 if(region.allowStacked&&calculation&&best.font<22){
  const stacked=[calculation[1],calculation[2],calculation[3]];
  const width=Math.max(...stacked.map(line=>exerciseMetrics(line).width));
  const height=2+Math.max(...stacked.map(line=>exerciseMetrics(line).height));
  for(const box of boxes.filter(box=>!box.angle)){
   const font=Math.min(30,(box.width-6)/width,(box.height-4)/height);
   if(font>best.font*1.05)best={...box,angle:0,font,lines:stacked};
  }
 }
 return best;
}
function generate(){
 const ops=[...document.querySelectorAll('[name=op]:checked')].map(e=>e.value), tables=[...document.querySelectorAll('[name=table]:checked')].map(e=>+e.value);
 if(!ops.length){$('status').textContent='Kies minstens één soort oefening.';return;}
 if(ops.some(o=>['×','÷'].includes(o))&&!tables.length){$('status').textContent='Kies minstens één tafel.';return;}
 const theme=$('theme').value;drawing();
 const max=+$('range').value,bridgeMode=max>=20?$('bridge').value:'gemengd',p=pool(ops,max,tables,bridgeMode);
 $('bridgeSetting').hidden=max<20;
 const available=[...new Set(p.map(e=>e.n))].sort((a,b)=>a-b);
 if(!available.length){$('status').textContent='Deze combinatie biedt geen oefeningen. Pas de brugkeuze of bewerkingen aan.';return;}
 const assigned=regions.map(r=>Number.isInteger(r.fixedColor)?r.fixedColor:r.color);
 const limit=Math.min(available.length,max===10?9:(selectedArtwork().maxColors||12));
 // Merge only related shades if the selected operations allow fewer answers.
 const merges=[...(selectedArtwork().paletteMerges||[]),[17,10],[14,8],[16,13],[7,2],[11,6],[13,8],[4,5],[6,0],[9,3],[5,6]];
 for(const [from,to] of merges){
  if(new Set(assigned).size<=limit)break;
  if(assigned.includes(from)&&assigned.includes(to))for(let i=0;i<assigned.length;i++)if(assigned[i]===from)assigned[i]=to;
 }
 // If necessary, join the closest remaining shades, never add unrelated colors.
 while(new Set(assigned).size>limit){
  const ids=[...new Set(assigned)];let best=[ids[0],ids[1]],distance=Infinity;
  const rgb=c=>palette[c][1].match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16));
  for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
   const ca=rgb(ids[a]),cb=rgb(ids[b]),d=ca.reduce((sum,v,i)=>sum+(v-cb[i])**2,0);
   if(d<distance){distance=d;best=[ids[a],ids[b]];}
  }
  for(let i=0;i<assigned.length;i++)if(assigned[i]===best[1])assigned[i]=best[0];
 }
 const colorIds=[...new Set(assigned)].sort((a,b)=>a-b);
 const colorCount=colorIds.length;
 // Plan the palette first: spread its distinct answers over the allowed range.
 const selected=new Set(),anchors=[],covered=new Set();
 const outcomeStats=new Map(available.map(n=>[n,{ops:new Set(),count:0}]));
 for(const e of p){const stat=outcomeStats.get(e.n);stat.ops.add(e.op);stat.count++;}
 const support=n=>[...outcomeStats.get(n).ops];
 const anchorCount=Math.min(colorCount,ops.length,3);
 for(let i=0;i<anchorCount;i++){
  const candidates=available.filter(n=>!selected.has(n));
  const score=n=>support(n).length+10*support(n).filter(op=>!covered.has(op)).length;
  candidates.sort((a,b)=>score(b)-score(a)||outcomeStats.get(b).count-outcomeStats.get(a).count||a-b);
  const n=candidates[0];selected.add(n);anchors.push(n);support(n).forEach(op=>covered.add(op));
 }
 for(let i=0;selected.size<colorCount&&i<available.length;i++){
  const index=Math.round(i*(available.length-1)/Math.max(1,colorCount-anchorCount-1));
  selected.add(available[Math.min(index,available.length-1)]);
 }
 for(const n of available){if(selected.size>=colorCount)break;selected.add(n);}
 const values=[...selected].sort((a,b)=>a-b);
 if(!values.length){$('status').textContent='Geen oefeningen mogelijk met deze instellingen.';return;}
 const frequent=[...colorIds].sort((a,b)=>assigned.filter(c=>c===b).length-assigned.filter(c=>c===a).length);
 const colorResult=new Map(anchors.map((n,i)=>[frequent[i],n]));
 const remaining=values.filter(n=>!anchors.includes(n));
 colorIds.filter(c=>!colorResult.has(c)).forEach((c,i)=>colorResult.set(c,remaining[i]));
 const exerciseCounts=new Map(),operationCounts=Object.fromEntries(ops.map(op=>[op,0])),bridgeCounts=[0,0];
 const forcedOps=new Map();
 function placeOperation(op,seen=new Set()){
  for(let i=0;i<regions.length;i++){
   if(seen.has(i)||!p.some(e=>e.op===op&&e.n===colorResult.get(assigned[i])))continue;
   seen.add(i);
   if(!forcedOps.has(i)||placeOperation(forcedOps.get(i),seen)){forcedOps.set(i,op);return true;}
  }return false;
 }
 ops.forEach(op=>placeOperation(op));
 current=regions.map((r,i)=>{
  const color=assigned[i],n=colorResult.get(color);let candidates=p.filter(e=>e.n===n);
  if(forcedOps.has(i))candidates=candidates.filter(e=>e.op===forcedOps.get(i));
  // Keep alternatives readable, then exhaust them before repeating an exercise.
  if(r.boxes){
   const readable=candidates.filter(e=>fitExercise(r,e.text).font>=18);
   if(readable.length)candidates=readable;
   else {const largest=Math.max(...candidates.map(e=>fitExercise(r,e.text).font));candidates=candidates.filter(e=>fitExercise(r,e.text).font>=largest-.1);}
  }
  const leastUsed=Math.min(...candidates.map(e=>exerciseCounts.get(e.text)||0));
  candidates=candidates.filter(e=>(exerciseCounts.get(e.text)||0)===leastUsed);
  const sortedOps=[...ops].sort((a,b)=>operationCounts[a]-operationCounts[b]);
  const op=forcedOps.get(i)||sortedOps.find(op=>candidates.some(e=>e.op===op));candidates=candidates.filter(e=>e.op===op);
  if(max>=20&&bridgeMode==='gemengd'&&!['×','÷'].includes(op)){
   const prefer=bridgeCounts[1]<=bridgeCounts[0],balanced=candidates.filter(e=>e.bridge===prefer);
   if(balanced.length)candidates=balanced;
  }
  if(r.boxes){
   const readable=candidates.filter(e=>fitExercise(r,e.text).font>=22);
   if(readable.length)candidates=readable;
   else {const largest=Math.max(...candidates.map(e=>fitExercise(r,e.text).font));candidates=candidates.filter(e=>fitExercise(r,e.text).font>=largest-.1);}
  }
  const e=candidates[Math.floor(Math.random()*candidates.length)];exerciseCounts.set(e.text,(exerciseCounts.get(e.text)||0)+1);operationCounts[e.op]++;if(!['×','÷'].includes(e.op))bridgeCounts[+e.bridge]++;
  return {...r,...e,color};
 });
 $('status').textContent=`${values.length} kleuren met verschillende uitkomsten van ${values[0]} tot ${values.at(-1)}.`;
 window.worksheet={theme,values,key:colorIds.map(color=>({color,n:colorResult.get(color)})),colorRemap:Object.fromEntries(regions.map((r,i)=>[r.color,assigned[i]])),picture:$('picture').value};render();
}
function render(){if(!current.length)return;renderIllustration(window.worksheet.values,$('answers').checked);}
function renderIllustration(values,solution){
 const art=selectedArtwork();
 const svg=current.map(r=>{
  const text=compactExercise(r.text),box=fitExercise(r,r.text);
  const fill=solution?palette[r.color][1]:(art.native?'#fff':'none');
  const ink=solution&&[9,11,14,15].includes(r.color)?'#fff':'#111';
  const lines=solution?[String(r.n)]:box.lines||[text];
  const written=(line,x,y)=>{const m=exerciseMetrics(line);return `<text x="${x}" y="${y+(m.ascent-m.descent)*box.font/2}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${box.font}" fill="${ink}">${line}</text>`;};
  const bond=box.bond&&!solution;
  const content=bond?written(box.bond.total,box.x,box.y-.6*box.font)+`<path d="M${box.x},${box.y-.15*box.font}l${-.45*box.font},${.25*box.font}M${box.x},${box.y-.15*box.font}l${.45*box.font},${.25*box.font}" fill="none" stroke="${ink}" stroke-width="${Math.max(1,box.font*.06)}"/>`+written(box.bond.known,box.x-.45*box.font,box.y+.65*box.font)+written('□',box.x+.45*box.font,box.y+.65*box.font):lines.map((line,i)=>written(line,box.x,box.y+(i-(lines.length-1)/2)*box.font)).join('');
  const label=`<g data-exercise="${r.id}" transform="rotate(${box.angle||0} ${box.x} ${box.y})">${content}</g>`;
  return (r.noPaint?'':`<path d="${r.d}" fill="${fill}"${art.native?' stroke="#202020" stroke-width="4" stroke-linejoin="round"':''}/>`)+label;
 }).join('');
 const details='';
 const illustration=art.native?'':art.lineArtPath?`<path d="${art.lineArtPath}" fill="#111"/>`:`<image href="${art.src}" width="${art.width}" height="${art.height}"/>`;
 const frame=art.frame?`<rect x="${art.frame.x}" y="${art.frame.y}" width="${art.frame.width}" height="${art.frame.height}" fill="none" stroke="#111" stroke-width="4"/>`:'';
 const scene=art.native?`<defs><clipPath id="tekenkader"><rect x="12" y="12" width="976" height="1276"/></clipPath></defs><g clip-path="url(#tekenkader)">${svg}${art.vectorLines||''}</g>`:`${art.lineArtPath?'':illustration}${details}${svg}${art.lineArtPath?illustration:''}`;
 $('preview').innerHTML=`<h2>${art.title}</h2><div class="name"><span>Naam: <i></i></span><span>Datum: <i></i></span></div><p class="instruction">Los elke oefening op. Zoek de uitkomst in de kleurcode en kleur het vak.${current.some(e=>e.op==='split')?' Zoek bij □ het ontbrekende deel.':''}</p>${solution?'<p class="solution">Oplossing</p>':''}<svg viewBox="0 0 ${art.width} ${art.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${art.title}: ${current.length} rekenvakken">${scene}${frame}</svg><div class="key">${window.worksheet.key.map(({n,color})=>`<span><i style="background:${palette[color][1]}"></i>${n} = ${palette[color][0]}</span>`).join('')}</div>`;
}
for(let n=1;n<=10;n++)$('tables').insertAdjacentHTML('beforeend',`<label><input type="checkbox" name="table" value="${n}" ${[2,5,10].includes(n)?'checked':''}>${n}</label>`);
$('generate').onclick=generate;$('answers').onchange=render;$('theme').onchange=updateDrawingChoices;$('print').onclick=()=>window.print();$('picture').onchange=generate;updateDrawingChoices();
$('range').onchange=generate;
$('bridge').onchange=generate;
$('previewSize').onchange=()=>{document.documentElement.dataset.previewSize=$('previewSize').value;};
document.querySelectorAll('[name=op], [name=table]').forEach(input=>input.addEventListener('change',generate));
const requestedPicture=new URLSearchParams(window.location.search).get('kleurplaat');
if(requestedPicture&&window.kleurplaatCatalogus[requestedPicture]){
 $('theme').value=window.kleurplaatCatalogus[requestedPicture].theme;
 updateDrawingChoices();$('picture').value=requestedPicture;generate();
}

if(new URLSearchParams(location.search).get('embedded')==='1')document.documentElement.classList.add('embedded-coloring');
