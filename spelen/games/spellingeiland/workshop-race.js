/* One chosen vehicle grows through up to twenty cards, then races local opponents. */
(() => {
 const Base=window.SpellingWorkshop;
 const VEHICLES=['Raceauto','Monstertruck','Strandbuggy'];
 const EXTRA=[
  ['de motor',10,605,354,60,50],['de achtervering',11,435,403,35,45],['de voorvering',11,565,415,35,45],['de bumper',12,680,395,55,32],['de uitlaat',13,385,390,50,32],
  ['de voorruit',14,548,317,45,45],['de spoiler',9,400,328,80,40],['de daklampen',15,510,272,60,30],['het voorste vlaggetje',16,610,310,32,65],['de gouden ster',17,540,372,25,25],
  ['de achterbumper',12,390,390,45,28],['de extra koplamp',2,673,345,28,28],['het achterste vlaggetje',16,418,300,30,65],['de sierster',17,475,367,22,22],['de motorkaplampen',15,615,325,42,25]
 ];
 window.SpellingWorkshop=class extends Base{
  constructor(opts){
   super(opts);this.vehicle=0;this.side=0;this.phase='choose';this.parts[0].kit=6;this.parts[3]={...this.parts[1],name:'het achterwiel rechts'};this.parts[4]={...this.parts[2],name:'het voorwiel rechts'};this.parts[1].name='het achterwiel links';this.parts[2].name='het voorwiel links';
   this.parts.push(...EXTRA.map(([name,kit,x,y,w,h])=>({name,kit,x,y,w,h,bolt:false})));
   this.gates=Array.from({length:this.count},(_,i)=>({title:'Bouw '+this.parts[i].name}));
   this.root.classList.add('racing-workshop');
   const side=new Image();side.src='assets/voertuigen-zijaanzicht.png';this.images.sideCars=side;side.onload=()=>this.drawChoices();
   const im=new Image();im.src='assets/race-onderdelen.png';this.images.raceKit=im;im.onload=()=>{this.measureRace();this.drawChoices();this.drawTray();};
   for(const [key,file] of Object.entries({driver:'zisa-in-boot',rival:'pip-beweging',robotDriver:'ro-robot',scenery:'avontuur-landschap'})){const img=new Image();img.src='assets/'+file+'.png';this.images[key]=img;}
   const choice=document.createElement('section');choice.id='vehicle-choice';choice.innerHTML='<h2>Wat ga jij bouwen?</h2><p>Kies jouw wagen voor de race.</p><div>'+VEHICLES.map((name,i)=>'<button data-vehicle="'+i+'"><canvas width="220" height="130"></canvas><strong>'+name+'</strong></button>').join('')+'</div>';this.root.append(choice);
   choice.querySelectorAll('button').forEach(b=>b.onclick=()=>this.choose(Number(b.dataset.vehicle)));
   const controls=document.createElement('div');controls.id='race-controls';controls.hidden=true;controls.innerHTML='<button data-lane="-1" aria-label="Een baan omhoog">↑ Omhoog</button><span id="race-status" role="status"></span><button data-lane="1" aria-label="Een baan omlaag">Omlaag ↓</button>';this.root.append(controls);
   controls.querySelectorAll('button').forEach(b=>b.onclick=()=>this.changeLane(Number(b.dataset.lane)));
   this.raceKey=e=>{if(this.phase!=='race'||document.querySelector('dialog[open]'))return;const dir=['ArrowUp','ArrowLeft'].includes(e.key)?-1:['ArrowDown','ArrowRight'].includes(e.key)?1:0;if(dir){e.preventDefault();if(!e.repeat)this.changeLane(dir);}};window.addEventListener('keydown',this.raceKey);
   this.renderControls();
  }
  measureRace(){const im=this.images.raceKit,cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const cx=cv.getContext('2d');cx.drawImage(im,0,0);const d=cx.getImageData(0,0,cv.width,cv.height).data;this.raceRects=Array.from({length:12},(_,i)=>{const x=Math.floor(i%4*cv.width/4),y=Math.floor(Math.floor(i/4)*cv.height/3),w=Math.floor(cv.width/4),h=Math.floor(cv.height/3);let l=x+w,r=x,t=y+h,b=y;for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)if(d[(py*cv.width+px)*4+3]>80){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}return[l,t,r-l+1,b-t+1];});}
  drawChoices(){this.root.querySelectorAll('[data-vehicle] canvas').forEach((cv,i)=>{const c=cv.getContext('2d'),g=this.vehicleGeometry(i);c.clearRect(0,0,220,130);c.save();c.translate(110,101);c.scale(.43,.43);c.translate(-525,-420);this.partImage(c,6+i,525,g.cy,420,300);for(const p of g.wheels)this.partImage(c,1,p.x,p.y,p.d,p.d);c.restore();});}

  vehicleGeometry(i){
   const rects=[[36,242,716,190],[779,116,737,286],[49,584,706,280]],arches=[[[172,398],[585,398]],[[947,378],[1373,378]],[[174,842],[634,842]]];
   const r=rects[i],scale=420/r[2],cy=420-(arches[i][0][1]-r[1]-r[3]/2)*scale;
   return{r,scale,cy,wheels:arches[i].map(([x,y])=>({x:525+(x-r[0]-r[2]/2)*scale,y:cy+(y-r[1]-r[3]/2)*scale,d:i===1?108:98}))};
  }
  choose(i){this.vehicle=i;this.side=0;const g=this.vehicleGeometry(i);Object.assign(this.parts[0],{kit:6+i,x:525,y:g.cy,w:420,h:300});for(let n=1;n<=4;n++){const a=g.wheels[(n-1)%2];Object.assign(this.parts[n],{x:a.x,y:a.y,w:a.d,h:a.d,bolt:[0,0]});}this.positionExtras(g);this.phase='plan';this.renderControls();}
  positionExtras(g){
   const rear=g.wheels[0],front=g.wheels[1],body=this.parts[0],roof=body.y-g.r[3]*g.scale/2;
   const put=(i,x,y,w,h)=>Object.assign(this.parts[i],{x,y,w,h});
   put(5,front.x-8,403,48,38);put(6,rear.x,404,28,42);put(7,front.x,404,28,42);
   put(8,726,420,28,22);put(9,330,430,32,22);put(10,552,roof+48,34,36);
   put(11,365,this.vehicle===0?roof+20:roof+72,65,30);put(12,525,roof-9,46,22);
   put(13,690,383,22,46);put(14,550,405,22,22);put(15,323,421,24,20);
   put(16,721,403,22,22);put(17,350,385,22,46);put(18,500,405,19,19);put(19,666,389,26,18);
  }
  internalPart(i){return [5,6,7].includes(i);}
  assemblyIndex(){return ['plan','question'].includes(this.phase)?this.done:this.done-1;}
  drawAssembly(c,side,inspect=false){
   const current=this.assemblyIndex(),inside=inspect&&[5,6,7,8,9,10,11,12,13,15,16,17,19].includes(current)&&['plan','assemble'].includes(this.phase);
   // Internal parts only appear in the temporary cutaway for their own assembly step.
   for(const i of this.built){if(!this.internalPart(i))continue;if(inside&&i===current){const p=this.parts[i];this.partImage(c,p.kit,p.x,p.y,p.w,p.h);}}
   if(this.built.includes(0)){const p=this.parts[0];this.partImage(c,p.kit,p.x,p.y,p.w,p.h,inside?.20:1);}
   for(const i of this.built){
    if(i===0||this.internalPart(i))continue;
    if(i<=4&&(side?i<3:i>2))continue;
    // Factory-fitted glazing and lights are already represented by the body artwork.
    if([8,9,10,11,12,13,15,16,17,19].includes(i))continue;
    const p=this.parts[i];this.partImage(c,p.kit,p.x,p.y,p.w,p.h,inside&&i<=4?.16:1);
   }
  }
  screen(x,y){return super.screen(this.side?1050-x:x,y);}

  part(){return this.parts?.[Math.min(this.count-1,['plan','question'].includes(this.phase)?this.done:Math.max(0,this.done-1))]||super.part();}
  partImage(c,index,x,y,w,h,alpha=1){if((index===1||index>=6&&index<=8)&&this.images.sideCars?.complete){const r=index===1?[940,536,414,403]:this.vehicleGeometry(index-6).r,scale=Math.min(w/r[2],h/r[3]);c.save();c.globalAlpha=alpha;if(this.color&&index!==1)c.filter='hue-rotate('+this.color+'deg)';if(index===1&&['drive','race'].includes(this.phase)){c.translate(x,y);c.rotate(this.phase==='race'?this.distance/18:this.drive*5);x=0;y=0;}c.drawImage(this.images.sideCars,...r,x-r[2]*scale/2,y-r[3]*scale/2,r[2]*scale,r[3]*scale);c.restore();return;}if(index<6)return super.partImage(c,index,x,y,w,h,alpha);const r=this.raceRects?.[index-6];if(!r)return;const size=Math.min(w/r[2],h/r[3]);c.save();c.globalAlpha=alpha;if(this.color)c.filter='hue-rotate('+this.color+'deg)';c.drawImage(this.images.raceKit,...r,x-r[2]*size/2,y-r[3]*size/2,r[2]*size,r[3]*size);c.restore();}
  renderControls(){
   if(!this.root.querySelector('#vehicle-choice'))return super.renderControls();
   const choosing=this.phase==='choose',racing=['race','podium'].includes(this.phase);
   this.root.querySelector('#vehicle-choice').hidden=!choosing;this.root.querySelector('#race-controls').hidden=this.phase!=='race';
   this.root.querySelector('.shop-coach').hidden=choosing||racing;this.root.querySelector('.shop-actions').hidden=choosing||this.phase==='race';
   this.root.querySelector('#shop-tray').hidden=choosing||racing||!['plan','assemble'].includes(this.phase);
   this.root.querySelector('#world-parts').textContent=this.done+' / '+this.count;
   this.root.querySelector('#shop-project').textContent=(this.done<5?(this.side?'Rechterkant · ':'Linkerkant · '):'')+['De basis','Motor en vering','Jouw racestijl','De laatste extra’s'][Math.min(3,Math.floor(this.done/5))];
   this.root.querySelector('#shop-part-name').textContent=this.part().name;
   if(this.done<=5)this.root.querySelector('#shop-project').textContent=(this.side?'Rechterkant':'Linkerkant')+' · '+this.built.filter(i=>i>=1&&i<=4).length+' / 4 wielen';
   this.partCanvas.classList.toggle('part-locked',this.phase==='plan');this.action.hidden=false;
   this.root.querySelector('#shop-colors').hidden=this.phase!=='paint';
   if(choosing){this.message('Kies een wagen. Jij bouwt hem en rijdt de race!');return;}
   if(this.phase==='turn'){this.action.textContent='Draai de wagen om';this.message('Twee wielen klaar! Nu de twee wielen aan de andere kant.');}
   if(this.phase==='plan'){this.action.textContent='Maak de bouwkaart';this.message(this.internalPart(this.assemblyIndex())?'We kijken binnenin voor '+this.part().name+'. Maak een woord.':'Bouw '+this.part().name+'. Maak eerst een woord.');}
   if(this.phase==='assemble'){this.action.textContent='Zet op zijn plek';this.message(this.internalPart(this.assemblyIndex())?'Kijk binnenin! Zet '+this.part().name+' op de gouden plek.':'Sleep '+this.part().name+' naar de gouden rand. Of tik erop.');}
   if(this.phase==='tighten'){this.action.textContent='Draai vast · '+this.turns+' / 3';this.message('Zet het onderdeel stevig vast.');}
   if(this.phase==='checkpoint'){this.action.textContent='Even testen!';this.message(['','De basis rijdt! Test de wielen.','De motor is klaar! Probeer hem.','Mooi! Kijk hoe jouw wagen rijdt.'][Math.min(3,this.done/5)]);}
   if(this.phase==='drive'){this.action.hidden=true;this.message('Hij rijdt! Daarna bouwen we verder aan dezelfde wagen.');}
   if(this.phase==='paint'){this.action.textContent='Naar de race!';this.message('Kies je kleur. Daarna race je tegen Pip en Robbie!');}
   if(this.phase==='race'){this.root.querySelector('.world-score small').textContent='van de race';this.root.querySelector('.world-hud strong').textContent=VEHICLES[this.vehicle]+' · Eilandrace';this.message('Wissel van baan. Pak sterren en de gouden versnelling!');}
   if(this.phase==='podium'){this.action.textContent='Klaar!';this.message('Finish! Plaats '+this.rank+' van 3 · '+this.stars+' sterren. Goed gereden!');}
   this.drawTray();
  }
  act(){if(this.phase==='turn'){this.side=1;this.phase='plan';this.renderControls();}else if(this.phase==='checkpoint'){this.phase='drive';this.drive=0;this.renderControls();}else if(this.phase==='paint')this.startRace();else if(this.phase==='podium'){this.phase='complete';this.onFinish();}else super.act();}
  place(){if(this.phase!=='assemble')return;const i=this.done-1;if(!this.built.includes(i))this.built.push(i);if(this.parts[i].bolt){this.phase='tighten';this.turns=0;this.renderControls();}else this.nextPart();}
  nextPart(){this.phase=this.done===3?'turn':this.done===this.count?'paint':this.done%5===0?'checkpoint':'plan';this.renderControls();}
  endDrive(){if(this.phase==='drive'){this.phase='plan';this.drive=0;this.renderControls();}}
  startRace(){this.phase='race';this.raceTime=0;this.distance=0;this.lane=1;this.visualLane=1;this.stars=0;this.boost=0;this.slow=0;this.rivals=[{name:'Pip',distance:20,lane:0,speed:67},{name:'Robbie',distance:45,lane:2,speed:69}];this.pickups=Array.from({length:26},(_,i)=>({distance:180+i*145,lane:(i*7+1)%3,boost:i%4===3,used:false}));this.renderControls();}
  changeLane(dir){if(this.phase==='race'&&!document.querySelector('dialog[open]'))this.lane=Math.max(0,Math.min(2,this.lane+dir));}
  updateRace(dt){if(this.phase!=='race'||document.body.dataset.view!=='world')return;this.raceTime+=dt;if(this.raceTime<3){this.root.querySelector('#race-status').textContent=String(3-Math.floor(this.raceTime));return;}
   this.visualLane+=(this.lane-this.visualLane)*Math.min(1,dt*10);this.boost=Math.max(0,this.boost-dt);this.slow=Math.max(0,this.slow-dt);
   const old=this.distance;this.distance+=dt*(this.boost?102:this.slow?49:72);
   this.rivals.forEach((r,i)=>{r.distance+=dt*(r.speed+Math.sin(this.raceTime*.65+i)*8);r.lane=(Math.floor(this.raceTime/(6+i))+i*2)%3;if(r.lane===this.lane&&Math.abs(r.distance-this.distance)<13&&this.slow===0){this.slow=1.2;this.message('Even uitwijken! Kies een vrije baan.');}});
   this.pickups.forEach(p=>{if(!p.used&&p.distance>=old-8&&p.distance<=this.distance+8&&this.lane===p.lane){p.used=true;if(p.boost){this.boost=2.5;this.message('Zoef! Een versnelling!');}else{this.stars++;this.message('Een ster! Op naar de finish!');}}});
   this.rank=1+this.rivals.filter(r=>r.distance>this.distance).length;
   this.root.querySelector('#race-status').textContent='Plaats '+this.rank+' / 3 · '+this.stars+' sterren';
   this.root.querySelector('#world-parts').textContent=Math.min(100,Math.floor(this.distance/40))+'%';
   if(this.distance>=4000){this.phase='podium';this.renderControls();}
  }
  drawCar(c,x,y,scale,opponent=0){c.save();c.translate(x,y);c.scale(scale,scale);c.translate(-525,-450);const oldColor=this.color;if(opponent)this.color=(oldColor+opponent*100)%360;
   this.drawAssembly(c,0);this.drawDriver(c,opponent);this.color=oldColor;c.restore();
  }
  drawDriver(c,opponent){
   c.save();c.beginPath();c.rect(472,this.vehicle===1?293:255,78,this.vehicle===1?56:98);c.clip();
   if(opponent===1){const im=this.images.rival;if(im?.complete)c.drawImage(im,0,im.naturalHeight/2,im.naturalWidth/4,im.naturalHeight/2,472,258,78,100);}
   else if(opponent===2){const im=this.images.robotDriver;if(im?.complete)c.drawImage(im,472,255,78,110);}
   else{const im=this.images.driver;if(im?.complete)c.drawImage(im,180,0,700,1100,472,245,78,123);}
   c.restore();
  }
  draw(){
   if(['race','podium'].includes(this.phase)){this.drawRace();return;}
   if(!this.raceRects){super.draw();return;}
   const c=this.ctx,bg=this.images.room;c.clearRect(0,0,this.w,this.h);if(bg.complete){const z=Math.max(this.w/bg.naturalWidth,this.h/bg.naturalHeight);c.drawImage(bg,(this.w-bg.naturalWidth*z)/2,(this.h-bg.naturalHeight*z)/2,bg.naturalWidth*z,bg.naturalHeight*z);}
   if(this.phase==='choose')return;
   c.save();c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);if(this.side){c.translate(1050,0);c.scale(-1,1);}
   if(this.phase==='drive')c.translate(Math.sin(this.drive*1.5)*90,0);
   this.drawAssembly(c,this.side,true);
   const p=this.part();if(['plan','assemble'].includes(this.phase)){this.partImage(c,p.kit,p.x,p.y,p.w,p.h,.3);c.strokeStyle='#f3bc44';c.lineWidth=4;c.setLineDash([8,6]);c.strokeRect(p.x-p.w/2-6,p.y-p.h/2-6,p.w+12,p.h+12);c.setLineDash([]);}
   if(this.phase==='tighten'&&this.rects){const r=this.rects[p.kit],s=Math.min(p.w/r[2],p.h/r[3]),tool=this.rects[5];c.save();c.translate(p.kit===1?p.x:p.x+(p.bolt[0]-r[0]-r[2]/2)*s,p.kit===1?p.y:p.y+(p.bolt[1]-r[1]-r[3]/2)*s);c.rotate(-.5+this.turns*.65);c.drawImage(this.images.kit,...tool,(tool[0]-1120)*.24,(tool[1]-696)*.24,tool[2]*.24,tool[3]*.24);c.restore();}
   c.restore();if(this.drag)this.partImage(c,p.kit,this.drag.x,this.drag.y,140,130,.9);
  }
  drawRace(){const c=this.ctx,W=this.w,H=this.h,bg=this.images.scenery;c.clearRect(0,0,W,H);if(bg.complete)c.drawImage(bg,0,0,W,H*.6);
   const top=H*.39,bottom=H*.84,laneH=(bottom-top)/3,ys=i=>top+laneH*(i+.85),carScale=Math.min(W/1900,laneH/260),playerX=W*.28;
   c.fillStyle='#697c81';c.fillRect(0,top,W,bottom-top);c.fillStyle='#f4dfac';c.fillRect(0,top-7,W,7);c.fillRect(0,bottom,W,7);
   c.strokeStyle='#fff7d5';c.lineWidth=4;c.setLineDash([35,28]);c.lineDashOffset=this.distance*2;for(let i=1;i<3;i++){c.beginPath();c.moveTo(0,top+laneH*i);c.lineTo(W,top+laneH*i);c.stroke();}c.setLineDash([]);
   for(const p of this.pickups){const x=playerX+(p.distance-this.distance)*3;if(p.used||x< -80||x>W+80)continue;if(p.boost){c.fillStyle='#f9c64f';c.fillRect(x-25,ys(p.lane)-20,65,16);c.fillStyle='#614621';c.font='bold 21px sans-serif';c.fillText('»',x-5,ys(p.lane)-3);}else this.partImage(c,17,x,ys(p.lane)-20,36,36);}
   const racers=[{x:playerX,y:ys(this.visualLane),name:'Zisa',you:true},...this.rivals.map((r,i)=>({opponent:i+1,x:playerX+(r.distance-this.distance)*3,y:ys(r.lane),name:r.name}))].sort((a,b)=>a.y-b.y);
   racers.forEach(r=>{this.drawCar(c,r.x,r.y,carScale,r.opponent||0);c.font='bold 15px Trebuchet MS';c.textAlign='center';c.fillStyle=r.you?'#fff3ae':'white';c.fillText(r.name,r.x,r.y-155*carScale);});
   const finish=playerX+(4000-this.distance)*3;if(finish<W+50){for(let i=0;i<12;i++){c.fillStyle=i%2?'#fff':'#253f42';c.fillRect(finish,top+i*(bottom-top)/12,18,(bottom-top)/12);}}
   if(this.raceTime<3){c.fillStyle='#fff9e9';c.font='bold 80px Trebuchet MS';c.textAlign='center';c.fillText(String(3-Math.floor(this.raceTime)),W/2,H*.33);}
  }
  destroy(){window.removeEventListener('keydown',this.raceKey);super.destroy();}
 };
})();
