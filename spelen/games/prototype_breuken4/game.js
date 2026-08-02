(()=>{
  const canvas=document.getElementById('foodCanvas'),ctx=canvas.getContext('2d');
  const foods={pizza:load('assets/pizza.png'),taart:load('assets/taart.png'),chocolade:load('assets/chocolade.png')};
  const modes={
    parts:{title:'Verdeel & tik',rounds:[
      {food:'pizza',num:3,den:4},{food:'taart',num:5,den:6},{food:'chocolade',num:9,den:12},
      {food:'pizza',num:3,den:8},{food:'taart',num:2,den:5},{food:'chocolade',num:5,den:12}
    ]},
    choose:{title:'Welke voorstelling klopt?',rounds:[
      choice(3,4,[[1,4],[1,2],[3,4],[4,4]],'pizza'),choice(2,3,[[1,3],[1,2],[2,3],[3,3]],'taart'),
      choice(3,8,[[2,8],[3,8],[4,8],[6,8]],'pizza'),choice(5,6,[[1,6],[3,6],[5,6],[6,6]],'taart'),
      choice(2,5,[[1,5],[2,5],[3,5],[4,5]],'pizza'),choice(3,4,[[2,3],[2,4],[3,4],[4,4]],'taart')
    ]},
    drag:{title:'Sleep naar de juiste breuk',rounds:[
      dragRound(1,2,[[1,3],[1,2],[2,3]],'pizza'),dragRound(3,4,[[2,4],[3,4],[4,4]],'taart'),
      dragRound(2,5,[[1,5],[2,5],[3,5]],'pizza'),dragRound(5,6,[[4,6],[5,6],[6,6]],'taart'),
      dragRound(3,8,[[2,8],[3,8],[5,8]],'pizza'),dragRound(2,3,[[1,2],[2,3],[3,4]],'taart')
    ]},
    line:{title:'Breuken op de getallenas',rounds:[[1,4],[3,4],[1,2],[2,3],[1,5],[4,5]].map(v=>({num:v[0],den:v[1]}))}
  };
  let mode='parts',rounds=modes.parts.rounds,index=0,score=0,locked=true,W=650,H=600;
  let selected=new Set(),selectedChoice=-1,droppedTray=-1,dragging=false,dragPos=null,tokenX=null,lineTouched=false;
  let foodRect={},choiceRects=[],trayRects=[],lineGeom={};
  function load(src){const image=new Image();image.src=src;image.onload=draw;return image}
  function choice(num,den,options,food){return{num,den,options:shuffle(options.map(x=>({num:x[0],den:x[1]}))),food}}
  function dragRound(num,den,labels,food){return{num,den,labels:shuffle(labels.map(x=>({num:x[0],den:x[1]}))),food}}
  function shuffle(a){return a.sort(()=>Math.random()-.5)}
  function round(){return rounds[index]}
  function resize(){const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();W=Math.max(360,r.width||650);H=Math.max(380,r.height||600);canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);draw()}
  addEventListener('resize',resize);setTimeout(resize,0);
  function clearCanvas(){ctx.clearRect(0,0,W,H);ctx.lineJoin='round';ctx.lineCap='round'}
  function draw(){clearCanvas();if(!round())return;if(mode==='parts')drawParts();if(mode==='choose')drawChoose();if(mode==='drag')drawDrag();if(mode==='line')drawLine()}

  function drawParts(){const r=round(),img=foods[r.food];if(!img.complete)return;if(r.food==='chocolade'){drawChocolate(img,r);return}const size=Math.min(W,H)*.78;foodRect={x:(W-size)/2,y:(H-size)/2,w:size,h:size};drawWholeFood(img,foodRect,r.den);for(const part of selected)fillWedge(foodRect,part,r.den,'#35cfe070')}
  function drawWholeFood(img,rect,den){const{x,y,w,h}=rect;ctx.save();ctx.beginPath();ctx.arc(x+w/2,y+h/2,w/2,0,Math.PI*2);ctx.clip();ctx.drawImage(img,x,y,w,h);ctx.restore();ctx.strokeStyle='#fff';ctx.lineWidth=4;for(let i=0;i<den;i++){const a=-Math.PI/2+i*2*Math.PI/den;ctx.beginPath();ctx.moveTo(x+w/2,y+h/2);ctx.lineTo(x+w/2+Math.cos(a)*w/2,y+h/2+Math.sin(a)*w/2);ctx.stroke()}ctx.beginPath();ctx.arc(x+w/2,y+h/2,w/2,0,Math.PI*2);ctx.strokeStyle='#173f6266';ctx.lineWidth=3;ctx.stroke()}
  function fillWedge(rect,part,den,color){const{x,y,w}=rect,a=-Math.PI/2+part*2*Math.PI/den,b=-Math.PI/2+(part+1)*2*Math.PI/den;ctx.beginPath();ctx.moveTo(x+w/2,y+w/2);ctx.arc(x+w/2,y+w/2,w/2,a,b);ctx.closePath();ctx.fillStyle=color;ctx.fill()}
  function drawChocolate(img,r){const ratio=img.naturalWidth/img.naturalHeight,maxW=W*.86,maxH=H*.58;let w=maxW,h=w/ratio;if(h>maxH){h=maxH;w=h*ratio}const x=(W-w)/2,y=(H-h)/2;foodRect={x,y,w,h};ctx.drawImage(img,x,y,w,h);const cols=4,rows=3,cw=w/cols,ch=h/rows;for(const part of selected){const col=part%cols,row=Math.floor(part/cols);ctx.fillStyle='#38d8e08a';roundRect(x+col*cw+5,y+row*ch+5,cw-10,ch-10,10,true)}ctx.fillStyle='#173f62';ctx.font='800 19px Arial';ctx.textAlign='center';ctx.fillText('Elke chocoladeblok is 1 van de 12 gelijke delen.',W/2,y+h+36)}

  function drawMissingFood(img,cx,cy,radius,num,den){for(let i=0;i<num;i++){const a=-Math.PI/2+i*2*Math.PI/den,b=-Math.PI/2+(i+1)*2*Math.PI/den;ctx.save();ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,radius,a+.012,b-.012);ctx.closePath();ctx.clip();ctx.drawImage(img,cx-radius,cy-radius,radius*2,radius*2);ctx.restore();ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,radius,a+.012,b-.012);ctx.closePath();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke()}ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.strokeStyle='#173f6238';ctx.lineWidth=2;ctx.stroke()}
  function drawChoose(){const r=round(),img=foods[r.food];if(!img.complete)return;choiceRects=[];const gap=18,boxW=(W-gap*3)/2,boxH=(H-gap*3)/2;for(let i=0;i<4;i++){const col=i%2,row=Math.floor(i/2),x=gap+col*(boxW+gap),y=gap+row*(boxH+gap),rect={x,y,w:boxW,h:boxH};choiceRects.push(rect);roundRect(x,y,boxW,boxH,20,true,selectedChoice===i?'#d8f3fa':'#fff');ctx.strokeStyle=selectedChoice===i?'#20a9ca':'#cbdde6';ctx.lineWidth=selectedChoice===i?5:2;roundRect(x,y,boxW,boxH,20,false);const o=r.options[i],rad=Math.min(boxW*.31,boxH*.34);drawMissingFood(img,x+boxW/2,y+boxH*.46,rad,o.num,o.den);ctx.fillStyle='#173f62';ctx.font='900 21px Arial';ctx.textAlign='center';ctx.fillText(`Keuze ${String.fromCharCode(65+i)}`,x+boxW/2,y+boxH-16)}}

  function drawDrag(){const r=round(),img=foods[r.food];if(!img.complete)return;trayRects=[];const gap=12,tw=(W-gap*4)/3,ty=H-105;for(let i=0;i<3;i++){const x=gap+(tw+gap)*i,rect={x,y:ty,w:tw,h:82};trayRects.push(rect);roundRect(x,ty,tw,82,18,true,droppedTray===i?'#dff7e8':'#fff');ctx.strokeStyle=droppedTray===i?'#249764':'#c7dce7';ctx.lineWidth=3;roundRect(x,ty,tw,82,18,false);ctx.fillStyle='#173f62';ctx.font='900 27px Arial';ctx.textAlign='center';ctx.fillText(`${r.labels[i].num}/${r.labels[i].den}`,x+tw/2,ty+51)}const p=dragPos||{x:W/2,y:H*.37};dragPos=p;const radius=Math.min(W,H)*.2;foodRect={x:p.x-radius,y:p.y-radius,w:radius*2,h:radius*2};ctx.save();ctx.shadowColor='#173f6255';ctx.shadowBlur=dragging?22:12;ctx.shadowOffsetY=8;drawMissingFood(img,p.x,p.y,radius,r.num,r.den);ctx.restore();ctx.fillStyle='#557183';ctx.font='800 17px Arial';ctx.textAlign='center';ctx.fillText('Houd vast en sleep naar het juiste kaartje',W/2,ty-18)}

  function drawLine(){
    const r=round(),left=W*.1,right=W*.9,y=H*.62;lineGeom={left,right,y};
    ctx.strokeStyle='#173f62';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
    for(let i=0;i<=r.den;i++){const x=left+(right-left)*i/r.den;ctx.beginPath();ctx.moveTo(x,y-15);ctx.lineTo(x,y+15);ctx.strokeStyle='#173f62';ctx.lineWidth=4;ctx.stroke();if(i===0||i===r.den){ctx.fillStyle='#173f62';ctx.font='900 24px Arial';ctx.textAlign='center';ctx.fillText(i===0?'0':'1',x,y+49)}}
    const x=lineTouched?tokenX:W*.18,cardY=H*.16;
    ctx.save();ctx.shadowColor='#173f6255';ctx.shadowBlur=15;roundRect(x-58,cardY,116,78,18,true,'#ef7125');ctx.restore();
    ctx.fillStyle='#fff';ctx.font='900 31px Arial';ctx.textAlign='center';ctx.fillText(`${r.num}/${r.den}`,x,cardY+50);
    if(lineTouched){ctx.strokeStyle='#ef7125';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,cardY+79);ctx.lineTo(x,y-25);ctx.stroke();ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fillStyle='#ef7125';ctx.fill()}
    else{ctx.fillStyle='#ef7125';ctx.font='900 18px Arial';ctx.fillText('PAK MIJ EN SLEEP',x,cardY+108)}
    ctx.fillStyle='#557183';ctx.font='800 18px Arial';ctx.fillText('Sleep het losse kaartje naar de juiste plaats.',W/2,H*.84)
  }

  function point(e){const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left)*W/b.width,y:(e.clientY-b.top)*H/b.height}}
  function inRect(p,r){return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h}
  canvas.addEventListener('pointerdown',e=>{if(locked)return;const p=point(e);canvas.setPointerCapture(e.pointerId);if(mode==='parts'){const part=hitPart(p);if(part>=0){selected.has(part)?selected.delete(part):selected.add(part);updateSelection();draw()}}else if(mode==='choose'){const hit=choiceRects.findIndex(r=>inRect(p,r));if(hit>=0){selectedChoice=hit;updateSelection();draw();setTimeout(autoCheck,120)}}else if(mode==='drag'&&inRect(p,foodRect)){dragging=true;dragPos=p;draw()}else if(mode==='line'){dragging=true;lineTouched=true;tokenX=Math.max(lineGeom.left,Math.min(lineGeom.right,p.x));draw()}});
  canvas.addEventListener('pointermove',e=>{if(!dragging||locked)return;const p=point(e);if(mode==='drag')dragPos=p;if(mode==='line')tokenX=Math.max(lineGeom.left,Math.min(lineGeom.right,p.x));draw()});
  canvas.addEventListener('pointerup',e=>{if(!dragging)return;const p=point(e);dragging=false;if(mode==='drag'){droppedTray=trayRects.findIndex(r=>inRect(p,r));if(droppedTray<0)dragPos=null;updateSelection()}draw();if((mode==='drag'&&droppedTray>=0)||mode==='line')setTimeout(autoCheck,120)});
  function hitPart(p){const r=round(),f=foodRect;if(p.x<f.x||p.x>f.x+f.w||p.y<f.y||p.y>f.y+f.h)return-1;if(r.food==='chocolade'){const col=Math.min(3,Math.floor((p.x-f.x)/(f.w/4))),row=Math.min(2,Math.floor((p.y-f.y)/(f.h/3)));return row*4+col}const dx=p.x-(f.x+f.w/2),dy=p.y-(f.y+f.h/2);if(Math.hypot(dx,dy)>f.w/2)return-1;let a=Math.atan2(dy,dx)+Math.PI/2;if(a<0)a+=Math.PI*2;return Math.floor(a/(Math.PI*2/r.den))}
  function updateSelection(){const el=document.getElementById('selectionText'),r=round();if(mode==='parts')el.textContent=`Je koos ${selected.size} van de ${r.den} delen.`;if(mode==='choose')el.textContent=selectedChoice<0?'Tik één van de vier voorstellingen aan.':`Je koos voorstelling ${selectedChoice+1}.`;if(mode==='drag')el.textContent=droppedTray<0?'Sleep het eten naar één breukenkaartje.':`Je koos ${r.labels[droppedTray].num}/${r.labels[droppedTray].den}.`;if(mode==='line')el.textContent=`Waar ligt ${r.num}/${r.den} tussen 0 en 1?`}
  function showRound(){locked=false;selected.clear();selectedChoice=-1;droppedTray=-1;dragging=false;dragPos=null;tokenX=null;const r=round();document.getElementById('gameTitle').textContent=modes[mode].title;document.getElementById('roundText').textContent=`Opdracht ${index+1} van ${rounds.length}`;document.getElementById('scoreText').textContent=`★ ${score}`;document.getElementById('feedback').className='feedback';document.getElementById('feedback').textContent='';const label=document.getElementById('modeLabel'),title=document.getElementById('instructionText'),help=document.getElementById('helperText');if(mode==='parts'){label.textContent=r.food.toUpperCase();title.innerHTML=`Tik <span>${r.num}/${r.den}</span> van het geheel aan.`;help.textContent=r.food==='chocolade'?'De reep heeft 12 echte blokjes. Elk blokje is één twaalfde.':`Kies ${r.num} van de ${r.den} gelijke stukken.`}if(mode==='choose'){label.textContent='KIJK GOED';title.innerHTML=`Welke toont <span>${r.num}/${r.den}</span>?`;help.textContent='De ontbrekende stukken zijn echt weg. Kijk dus naar wat nog overblijft.'}if(mode==='drag'){label.textContent='SLEEP';title.innerHTML=`Welke breuk zie je?`;help.textContent='Bekijk hoeveel stukken nog aanwezig zijn en sleep het eten naar de juiste breuk.'}if(mode==='line'){label.textContent='GETALLENAS';title.innerHTML=`Plaats <span>${r.num}/${r.den}</span>.`;help.textContent='Verdeel de afstand van 0 tot 1 in even grote sprongen.'}updateSelection();draw()}
  function isCorrect(){const r=round();if(mode==='parts')return selected.size===r.num;if(mode==='choose'){const o=r.options[selectedChoice];return!!o&&o.num*r.den===r.num*o.den}if(mode==='drag'){const o=r.labels[droppedTray];return!!o&&o.num*r.den===r.num*o.den}if(mode==='line'){const target=lineGeom.left+(lineGeom.right-lineGeom.left)*r.num/r.den;return Math.abs(tokenX-target)<(lineGeom.right-lineGeom.left)*.045}return false}
  function hasAnswer(){if(mode==='parts')return selected.size>0;if(mode==='choose')return selectedChoice>=0;if(mode==='drag')return droppedTray>=0;if(mode==='line')return lineTouched}
  document.getElementById('clearButton').onclick=()=>{if(locked)return;selected.clear();selectedChoice=-1;droppedTray=-1;dragPos=null;tokenX=null;lineTouched=false;updateSelection();draw()};
  document.getElementById('checkButton').onclick=()=>{if(locked)return;const feedback=document.getElementById('feedback');if(!hasAnswer()){feedback.className='feedback bad';feedback.textContent=mode==='line'?'Sleep de breuk eerst naar een plaats op de lijn.':'Maak eerst een keuze.';return}if(!isCorrect()){feedback.className='feedback bad';feedback.textContent=mode==='line'?'Nog niet. Verdeel het stuk tussen 0 en 1 in gelijke delen en probeer opnieuw.':'Dat klopt nog niet. Kijk naar de teller én de noemer en probeer opnieuw.';return}locked=true;score++;feedback.className='feedback good';feedback.textContent='Juist! Heel goed gekeken.';setTimeout(()=>{lineTouched=false;index++;if(index>=rounds.length){document.getElementById('completeText').textContent=`Je loste alle ${rounds.length} opdrachten van “${modes[mode].title}” op.`;document.getElementById('complete').hidden=false}else showRound()},850)};
  function autoCheck(){if(!locked)document.getElementById('checkButton').click()}
  function start(chosen){mode=chosen;rounds=modes[mode].rounds;index=0;score=0;lineTouched=false;document.getElementById('checkButton').hidden=mode!=='parts';document.getElementById('intro').hidden=true;document.getElementById('complete').hidden=true;showRound()}
  document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>start(button.dataset.mode));
  document.getElementById('menuButton').onclick=()=>document.getElementById('intro').hidden=false;
  document.getElementById('otherButton').onclick=()=>{document.getElementById('complete').hidden=true;document.getElementById('intro').hidden=false};
  document.getElementById('againButton').onclick=()=>start(mode);
  function roundRect(x,y,w,h,r,fill,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=color||'#fff';ctx.fill()}else ctx.stroke()}
})();
