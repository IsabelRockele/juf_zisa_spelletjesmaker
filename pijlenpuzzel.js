/* Pijlenpuzzels: dezelfde puzzels voor voorbeeld, opdracht en oplossing. */
const THEME_SLUGS={Kerst:'kerst',Sint:'sint',Pasen:'pasen',Carnaval:'carnaval',Prehistorie:'prehistorie',Oudheid:'oudheid',Middeleeuwen:'middeleeuwen'};
const PIJLEN_ASSET_BASE=typeof document!=='undefined'?new URL('assets/pijlenpuzzel-los/',document.currentScript.src).href:'assets/pijlenpuzzel-los/';
const THEMES=Object.fromEntries(Object.entries(THEME_SLUGS).map(([name,slug])=>[name,Array.from({length:10},(_,i)=>PIJLEN_ASSET_BASE+slug+'-voorwerp-'+String(i+1).padStart(2,'0')+'.png')]));
const CHARACTERS=Object.fromEntries(Object.entries(THEME_SLUGS).map(([name,slug])=>[name,PIJLEN_ASSET_BASE+slug+'-start.png']));
const ACTORS={Kerst:'de kerstelf',Sint:'Sinterklaas',Pasen:'de paashaas',Carnaval:'de clown',Prehistorie:'het oerkind',Oudheid:'het Romeinse kind',Middeleeuwen:'de ridder'};
const HELP=['','6 kolommen, 8 stappen en vier richtingen. Elke pijl is één stap.','8 kolommen, 12 stappen en ook schuine pijlen. Elke pijl is één stap.','10 kolommen, 16 opdrachten en ook schuine pijlen. Het getal geeft het aantal stappen.'];
function makePuzzle(theme,level){
 const cols=level===1?6:level===2?8:10,rows=level===1?6:level===2?7:8,n=level===1?8:level===2?12:16;
 const dirs=[[1,0],[0,1],[-1,0],[0,-1],...(level>1?[[1,1],[-1,1],[1,-1],[-1,-1]]:[])];
 for(let attempt=0;attempt<2000;attempt++){
  let path=[[Math.floor(Math.random()*cols),0]],commands=[],seen=new Set([path[0].join(',')]);
  for(let i=0;i<n;i++){
   const candidates=[];
   for(const [dx,dy] of dirs)for(let steps=1;steps<=(level===3?2:1);steps++){
    const [x,y]=path[path.length-1];let points=[];
    for(let k=1;k<=steps;k++)points.push([x+dx*k,y+dy*k]);
    if(points.every(([a,b])=>a>=0&&a<cols&&b>=0&&b<rows&&!seen.has([a,b].join(','))))candidates.push({dx,dy,steps,points});
   }
   if(!candidates.length)break;
   const c=candidates[Math.floor(Math.random()*candidates.length)];commands.push(c);for(const pt of c.points){path.push(pt);seen.add(pt.join(','));}
  }
  if(commands.length===n&&path.at(-1)[1]===rows-1)return {theme,level,cols,rows,path,commands,objects:[...THEMES[theme]].sort(()=>Math.random()-.5).slice(0,cols)};
 }
 // Retry from a fresh start if the random walk did not reach the bottom.
 return makePuzzle(theme,level);
}
if(typeof module!=='undefined')module.exports={makePuzzle,THEMES};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id),canvas=$('mainCanvas'),ctx=canvas.getContext('2d');let pages=[],page=0,solution=false,ready=false,generationId=0;const pictures=new Map(),pendingPictures=new Map();
 for(const theme of Object.keys(THEMES))$('theme').add(new Option(theme,theme));
 function text(t,x,y,size=26,color='#253449',align='left'){ctx.fillStyle=color;ctx.font=`${size}px "Segoe UI", Arial, sans-serif`;ctx.textAlign=align;ctx.fillText(t,x,y);}
 function line(x,y,a,b,color='#b9c4ce',width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
 function arrow(dx,dy,x,y){const len=19,ex=x+dx*len,ey=y+dy*len;line(x-dx*len,y-dy*len,ex,ey,'#253449',3);const angle=Math.atan2(dy,dx);for(const off of [-.6,.6])line(ex,ey,ex-12*Math.cos(angle+off),ey-12*Math.sin(angle+off),'#253449',3);}
 function picture(src,x,y,size){const image=pictures.get(src);if(!image)throw Error('Afbeeldingen zijn nog niet geladen.');const ratio=Math.min(size/image.width,size/image.height);ctx.drawImage(image,x-image.width*ratio/2,y-image.height*ratio/2,image.width*ratio,image.height*ratio);}
 function draw(p,answer){
  ctx.fillStyle='white';ctx.fillRect(0,0,1240,1754);
  text("ZISA'S SPELLETJESMAKER",85,80,20,'#3478b8');text('Pijlenpuzzel',85,145,48);text(`${p.theme}  ·  Niveau ${p.level}${answer?'  ·  OPLOSSING':''}`,85,192,27);
  line(85,220,1155,220);text('Naam: __________________________',85,270,24);text('Datum: ______________',815,270,24);
  text('Help '+ACTORS[p.theme]+'. Volg de pijlen vanaf START.',85,330,27);text(p.level===3?'Het getal zegt hoeveel stappen je zet. Omcirkel het eindvoorwerp.':'Elke pijl is één stap. Omcirkel het voorwerp waar je uitkomt.',85,370,25);
  const cw=125,ch=95,top=405;
  p.commands.forEach((c,i)=>{const row=Math.floor(i/8),items=Math.min(8,p.commands.length-row*8),start=(1240-items*cw)/2;const x=start+(i%8)*cw,y=top+row*ch;ctx.strokeStyle='#c9dceb';ctx.strokeRect(x,y,cw,ch);text(String(i+1),x+10,y+22,17,'#66758a');arrow(c.dx,c.dy,x+55,y+56);if(p.level===3)text(String(c.steps),x+99,y+65,25);});
  const gy=top+Math.ceil(p.commands.length/8)*ch+150,gx=140,spacingX=960/(p.cols-1),spacingY=(1465-gy)/(p.rows-1);const point=([x,y])=>[gx+x*spacingX,gy+y*spacingY];
  for(let r=0;r<p.rows;r++)line(gx,gy+r*spacingY,gx+960,gy+r*spacingY);
  for(let c=0;c<p.cols;c++)line(gx+c*spacingX,gy,gx+c*spacingX,1465);
  if(answer)for(let i=1;i<p.path.length;i++)line(...point(p.path[i-1]),...point(p.path[i]),'#3478b8',7);
  const routeDots=new Set(answer?p.path.map(([x,y])=>x+','+y):[]);
  for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++){const onRoute=routeDots.has(c+','+r);ctx.beginPath();ctx.arc(...point([c,r]),9,0,Math.PI*2);ctx.fillStyle=onRoute?'#3478b8':'white';ctx.fill();ctx.strokeStyle=onRoute?'#3478b8':'#566575';ctx.lineWidth=2;ctx.stroke();}
  const [sx,sy]=point(p.path[0]);ctx.beginPath();ctx.arc(sx,sy,11,0,Math.PI*2);ctx.fillStyle='#253449';ctx.fill();picture(CHARACTERS[p.theme],sx,sy-88,110);text('START',sx,sy-23,19,'#253449','center');
  for(let c=0;c<p.cols;c++){const [x,y]=point([c,p.rows-1]);line(x,y+10,x,y+35);picture(p.objects[c],x,y+101,Math.min(140,spacingX*.86));if(answer&&c===p.path.at(-1)[0]){ctx.beginPath();ctx.ellipse(x,y+101,Math.min(82,spacingX*.47),Math.min(82,spacingX*.47),0,0,Math.PI*2);ctx.strokeStyle='#3478b8';ctx.lineWidth=5;ctx.stroke();}}
  line(85,1660,1155,1660);text(p.theme+' · Puzzel '+(pages.indexOf(p)+1)+' · Ruimtelijk inzicht en logisch denken',620,1700,19,'#66758a','center');
 }
 function refresh(){draw(pages[page],solution);$('pageLabel').textContent=`Werkblad ${page+1} van ${pages.length}`;$('previous').disabled=page===0;$('next').disabled=page===pages.length-1;$('toggleSolutionBtn').textContent=solution?'Verberg oplossing':'Toon oplossing';}
 async function generate(){
  const request=++generationId,theme=$('theme').value,level=Number($('level').value),count=Number($('count').value);
  ready=false;loading(true);$('status').textContent='Afbeeldingen laden…';
  try{await loadPictures(theme);if(request!==generationId)return;
   pages=Array.from({length:count},()=>makePuzzle(theme,level));page=0;solution=false;ready=true;loading(false);$('status').textContent='';$('levelHelp').textContent=HELP[level];refresh();
  }catch(e){if(request!==generationId)return;$('status').textContent=e.message;$('genereerBtn').disabled=false;}
 }
 $('genereerBtn').onclick=generate;for(const id of ['theme','level','count'])$(id).onchange=generate;
 $('toggleSolutionBtn').onclick=()=>{solution=!solution;refresh();};$('previous').onclick=()=>{if(page>0){page--;refresh();}};$('next').onclick=()=>{if(page<pages.length-1){page++;refresh();}};
 function download(answer){if(!ready)return;$('status').textContent='';try{if(!window.jspdf)throw Error('De PDF-bibliotheek is niet geladen. Controleer je internetverbinding en herlaad de pagina.');const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});pages.forEach((p,i)=>{if(i)pdf.addPage();draw(p,answer);pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,297);});pdf.save(`pijlenpuzzel-${pages[0].theme.toLowerCase()}-niveau-${pages[0].level}${answer?'-oplossingen':''}.pdf`);}catch(e){$('status').textContent=e.message;}finally{refresh();}}
 $('downloadPdfBtn').onclick=()=>download(false);$('solutionPdfBtn').onclick=()=>download(true);
 const actions=['genereerBtn','toggleSolutionBtn','downloadPdfBtn','solutionPdfBtn','previous','next'];
 function loading(value){for(const id of actions)$(id).disabled=value;}
 async function loadPictures(theme){
  return Promise.all([...THEMES[theme],CHARACTERS[theme]].map(src=>{
   if(pictures.has(src))return Promise.resolve();
   if(pendingPictures.has(src))return pendingPictures.get(src);
   const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{pictures.set(src,image);pendingPictures.delete(src);resolve();};image.onerror=()=>{pendingPictures.delete(src);reject(Error('Een afbeelding kon niet laden. Klik op Maak nieuwe puzzels om opnieuw te proberen.'));};image.src=src;});
   pendingPictures.set(src,promise);return promise;
  }));
 }
 generate();
}
