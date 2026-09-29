/* Chase-camera island race with road-relative steering for young players. */
(() => {
 const Base=window.SpellingWorkshop,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const tracks={island:{name:'Eiland',background:'avontuur-landschap',obstacle:'race-wegversperring',ground:['#86bd65','#80b85f'],road:['#657781','#60737e'],bend:1},desert:{name:'Woestijn',background:'race-woestijn',obstacle:'race-rots',ground:['#e8b567','#e5af61'],road:['#bc8b56','#b88551'],bend:.75},jungle:{name:'Jungle',background:'race-jungle',obstacle:'race-boomstam',ground:['#417c40','#39743a'],road:['#a48b67','#9b825e'],bend:1.15}};
 window.SpellingWorkshop=class extends Base{
  constructor(opts){super(opts);this.held=new Set();const barrier=new Image();barrier.src='assets/race-wegversperring.png';this.images.barrier=barrier;this.trackId='island';this.trackImages={};for(const [id,t] of Object.entries(tracks)){this.trackImages[id]={};for(const key of ['background','obstacle']){const image=new Image();image.src='assets/'+t[key]+'.png';this.trackImages[id][key]=image;}}this.rearCars=[];this.rearRects=[];this.driverCars=[];this.driverRects=[];
   for(const driver of [false,true])(driver?['raceauto-zisa-helm.png','monstertruck-zisa-helm.png','buggy-zisa-helm.png']:['race-raceauto-achter.png','race-achteraanzicht.png','race-buggy-achter.png']).forEach((file,index)=>{const im=new Image();(driver?this.driverCars:this.rearCars)[index]=im;this.images[(driver?'driverCar':'rearCar')+index]=im;im.onload=()=>{const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const cx=cv.getContext('2d');cx.drawImage(im,0,0);const data=cx.getImageData(0,0,cv.width,cv.height).data;let l=cv.width,t=cv.height,r=0,b=0;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(data[(y*cv.width+x)*4+3]>40){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}(driver?this.driverRects:this.rearRects)[index]=[l,t,r-l+1,b-t+1];};im.src='assets/'+file;});
   window.removeEventListener('keydown',this.raceKey);
   const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'gas',ArrowDown:'brake',' ':'brake'};
   this.raceKey=e=>{if(this.phase!=='race'||document.querySelector('dialog[open]'))return;if(e.key.toLowerCase()==='x'){e.preventDefault();if(!e.repeat)this.useTurbo();return;}const key=keys[e.key];if(key){e.preventDefault();this.held.add(key);}};
   this.releaseKey=e=>{if(keys[e.key])this.held.delete(keys[e.key]);};this.releaseAll=()=>this.held.clear();window.addEventListener('keydown',this.raceKey);window.addEventListener('keyup',this.releaseKey);window.addEventListener('blur',this.releaseAll);document.addEventListener('visibilitychange',this.releaseAll);
   const controls=this.root.querySelector('#race-controls');controls.innerHTML='<div class="steering"><button data-drive="left" aria-label="Stuur links">←</button><button data-drive="right" aria-label="Stuur rechts">→</button></div><span id="race-status" role="status"></span><div class="pedals"><button data-drive="brake">Rem</button><button data-drive="gas">Gas</button></div>';
   controls.querySelectorAll('button').forEach(b=>{b.onpointerdown=e=>{if(this.phase!=='race'||document.querySelector('dialog[open]'))return;e.preventDefault();b.setPointerCapture(e.pointerId);this.held.add(b.dataset.drive);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>this.held.delete(b.dataset.drive);});
  }
  useTurbo(){if(this.phase!=='race'||this.raceTime<3||!this.turboCharges||document.querySelector('dialog[open]'))return;this.turboCharges--;this.turbosUsed++;this.boost=2.5;this.carState.speed=Math.max(this.carState.speed,270);this.message('Turbo! Zoek een vrije plek om in te halen.');this.updateTurbo();}
  updateTurbo(){const b=this.root.querySelector('#race-turbo');if(b){b.textContent='Turbo · '+(this.turboCharges||0);b.disabled=!this.turboCharges||this.raceTime<3;}}
  showPodium(){if(!this.finishPanel){this.finishPanel=document.createElement('section');this.finishPanel.id='race-podium';this.root.append(this.finishPanel);}
   const order=[...this.rivals.map(r=>({name:r.name,score:r.finished||Infinity})),{name:'Jij',player:true,score:this.raceTime}].sort((a,b)=>a.score-b.score);
   this.finishPanel.innerHTML='<div class="finish-confetti" aria-hidden="true">'+Array.from({length:24},(_,i)=>'<i style="--i:'+i+'"></i>').join('')+'</div><img src="assets/zisa-werkplaats.png" alt="Zisa viert de finish"><div><p>Zelf gebouwd. Zelf geracet!</p><h2>'+(['','Gewonnen!','Knap, tweede!','Goed uitgereden!'][this.rank])+'</h2><div class="finish-places">'+[1,0,2].map(i=>'<section class="place place-'+(i+1)+(order[i].player?' player-place':'')+'"'+(order[i].player?' aria-label="Jouw plaats: '+(i+1)+'"':'')+'><strong>'+order[i].name+'</strong><b>'+(i+1)+'</b></section>').join('')+'</div><p>'+Math.round(this.raceTime-3)+' seconden · '+this.turbosUsed+' keer turbo</p><div class="finish-buttons"><button id="race-again" class="primary">Revanche!</button><button id="race-done">Klaar</button></div></div>';
   this.finishPanel.hidden=false;this.root.querySelector('.shop-actions').hidden=true;this.finishPanel.querySelector('#race-again').onclick=()=>this.pickTrack();this.finishPanel.querySelector('#race-done').onclick=()=>{this.phase='complete';this.onFinish();};
  }
  pickTrack(){this.phase='track-choice';this.held.clear();this.renderControls();if(this.finishPanel)this.finishPanel.hidden=true;
   if(!this.trackPanel){this.trackPanel=document.createElement('section');this.trackPanel.id='race-track-choice';this.root.append(this.trackPanel);}
   this.trackPanel.innerHTML='<h2>Waar ga jij racen?</h2><div>'+Object.entries(tracks).map(([id,t])=>'<button data-track="'+id+'"><img src="assets/'+t.background+'.png" alt=""><strong>'+t.name+'</strong><img class="track-obstacle" src="assets/'+t.obstacle+'.png" alt="Hindernis"></button>').join('')+'</div>';this.trackPanel.hidden=false;
   this.trackPanel.querySelectorAll('[data-track]').forEach(b=>b.onclick=()=>{this.trackId=b.dataset.track;this.trackPanel.hidden=true;this.startRace();});
  }
  startRace(){if(this.finishPanel)this.finishPanel.hidden=true;this.turboCharges=1;this.turbosUsed=0;this.phase='race';this.raceTime=0;this.trackLength=4600;this.totalDistance=this.trackLength*2;this.distance=0;this.held.clear();this.carState={progress:0,speed:0,offset:0,angle:0};this.boost=0;this.bump=0;this.contacts=new Map();this.rank=1;this.stars=0;
   this.rivals=[{name:'Pip',progress:0,lane:-.62,home:-.62,speed:185,velocity:0,tint:110},{name:'Robbie',progress:0,lane:.62,home:.62,speed:195,velocity:0,tint:255}];
   this.obstacles=Array.from({length:6},(_,i)=>({distance:1100+i*1350,lane:[0,-.55,.55][(i+(this.raceNumber||0))%3],hit:false}));this.obstacleHits=0;this.blockedObstacle=null;
   this.pads=Array.from({length:12},(_,i)=>({distance:600+i*700,lane:[-.55,0,.55][(i+(this.raceNumber||0))%3],used:false}));this.raceNumber=(this.raceNumber||0)+1;this.renderControls();
  }
  renderControls(){super.renderControls();if(this.phase==='race'){this.root.classList.add('chase-race');this.root.querySelector('.world-hud strong').textContent='Zisa’s '+(this.trackId==='desert'?'woestijnrace':this.trackId==='jungle'?'junglerace':'eilandrace');this.root.querySelector('.world-score small').textContent='ronden';this.root.querySelector('#world-parts').textContent='1 / 2';this.message('Gele platen maken je sneller. Stuur en haal in!');if(!this.root.querySelector('#race-turbo')){const b=document.createElement('button');b.id='race-turbo';b.onclick=()=>this.useTurbo();this.root.querySelector('#race-controls').append(b);}this.updateTurbo();if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('proef')==='race'&&!this.root.querySelector('#race-switch-track')){const switcher=document.createElement('button');switcher.id='race-switch-track';switcher.textContent='Andere piste';switcher.onclick=()=>this.pickTrack();this.root.append(switcher);}}else this.root.classList.remove('chase-race');if(this.phase==='podium'){this.message('Finish!');this.root.querySelector('#world-parts').textContent='2 / 2';this.showPodium();}}
  updateRace(dt){if(this.phase!=='race'||document.body.dataset.view!=='world'||document.hidden||document.querySelector('dialog[open]'))return;
   if(dt>1/60+.000001){let left=Math.min(dt,.25);while(left>0){const step=Math.min(left,1/60);this.updateRace(step);left-=step;}return;}
   this.raceTime+=dt;const car=this.carState;if(this.raceTime<3){this.root.querySelector('#race-status').textContent=String(3-Math.floor(this.raceTime));return;}
   this.boost=Math.max(0,this.boost-dt);this.bump=Math.max(0,this.bump-dt);
   const steer=Number(this.held.has('right'))-Number(this.held.has('left')),gas=this.held.has('gas'),brake=this.held.has('brake');
   if(brake)this.boost=0;
   car.speed=clamp(car.speed+dt*(brake?-410:gas||this.boost>0?150:-90),0,this.boost>0?310:235);
   const priorLanes=[car.offset,...this.rivals.map(r=>r.lane)];
   car.offset=clamp(car.offset+(steer*.9+(car.sideVelocity||0))*dt,-.8,.8);car.sideVelocity=(car.sideVelocity||0)*Math.exp(-6*dt);car.angle+=(steer*.12-car.angle)*Math.min(1,dt*8);
   const before=car.progress,previous=this.rivals.map(r=>r.progress);car.progress+=car.speed*dt;

   for(const [i,r] of this.rivals.entries()){
    if(r.finished)continue;
    const nearby=[{progress:car.progress,lane:car.offset},...this.rivals.filter(v=>v!==r)];
    const clearLane=lane=>!nearby.some(v=>Math.abs(v.progress-r.progress)<260&&v.lane>Math.min(r.lane,lane)-.5&&v.lane<Math.max(r.lane,lane)+.5);
    const upcoming=this.obstacles.filter(o=>!o.hit&&o.distance>=r.progress-20&&o.distance-r.progress<650).sort((a,b)=>a.distance-b.distance);
    const obstruction=upcoming.find(o=>Math.abs(o.lane-r.lane)<.48||Math.abs(o.lane-r.home)<.48);
    const following=car.progress-r.progress>0&&car.progress-r.progress<650&&Math.abs(car.offset-r.lane)<.5;
    const choices=[r.home,0,-r.home];
    const laneTarget=choices.find(lane=>clearLane(lane)&&(!obstruction||Math.abs(lane-obstruction.lane)>.48)&&(!following||Math.abs(lane-car.offset)>.5));
    r.lane=clamp(r.lane+(r.sideVelocity||0)*dt,-.8,.8);r.sideVelocity=(r.sideVelocity||0)*Math.exp(-6*dt);
    if(laneTarget!==undefined){const next=r.lane+(laneTarget-r.lane)*Math.min(1,dt*1.35);if(!nearby.some(v=>Math.abs(v.progress-r.progress)<300&&Math.abs(v.lane-next)<.55))r.lane=next;}
    // A blocked lane requires braking, even while the driver is trying to merge.
    const blocker=upcoming.find(o=>Math.abs(o.lane-r.lane)<.48);
    const lag=car.progress-r.progress,catchup=lag>20?70:lag>0?35:0;
    let targetSpeed=r.speed+Math.sin(this.raceTime*.6+i)*5+catchup;
    if(blocker)targetSpeed=Math.min(targetSpeed,Math.sqrt(2*300*Math.max(0,blocker.distance-r.progress-110)));
    r.velocity=clamp(targetSpeed,r.velocity-400*dt,r.velocity+130*dt);
    r.velocity=Math.max(0,r.velocity);r.progress+=dt*r.velocity;
    if(blocker&&r.progress>blocker.distance-110){r.progress=blocker.distance-110;r.velocity=0;}
   }
   this.resolveCarContacts([before,...previous],priorLanes);
   for(const r of this.rivals)if(!r.finished&&r.progress>=this.totalDistance)r.finished=this.raceTime;
   for(const pad of this.pads)if(!pad.used&&!brake&&before<=pad.distance+80&&car.progress>=pad.distance&&Math.abs(car.offset-pad.lane)<.42){pad.used=true;{this.boost=2.5;car.speed=310;this.turbosUsed++;this.message('Zoef! De gele plaat geeft je turbo!');}}
   for(const o of this.obstacles){if(Math.abs(o.lane-car.offset)>=.48)continue;const stop=o.distance-110;
    if(before<=stop+1&&car.progress>=stop){car.progress=stop;car.speed=0;this.boost=0;if(this.blockedObstacle!==o){this.obstacleHits++;this.bump=.5;}this.blockedObstacle=o;this.message('Bots! Stuur links of rechts langs de hindernis.');}
    else if(before>stop+1&&Math.abs(before-o.distance)<110&&Math.abs(priorLanes[0]-o.lane)>=.48){car.offset=priorLanes[0];car.sideVelocity=0;}
   }
   if(this.blockedObstacle&&Math.abs(this.blockedObstacle.lane-car.offset)>=.48)this.blockedObstacle=null;

   this.distance=car.progress;this.updateTurbo();
   this.rank=1+this.rivals.filter(r=>r.progress>car.progress||r.finished).length;
   this.root.querySelector('#world-parts').textContent=Math.min(2,1+Math.floor(car.progress/this.trackLength))+' / 2';
   this.root.querySelector('#race-status').textContent='Plaats '+this.rank+' / 3 · '+Math.round(car.speed*.32)+' km/u'+(this.boost?' · Zoef!':'');
   if(this.raceTime>8&&this.boost===0&&this.bump===0&&!this.blockedObstacle){const chaser=this.rivals.filter(r=>!r.finished&&r.progress<car.progress&&car.progress-r.progress<900).sort((a,b)=>b.progress-a.progress)[0];this.message(this.rank===1&&chaser?chaser.name+' nadert! Nog '+Math.round((car.progress-chaser.progress)*.12)+' meter achter jou.':'Ontwijk de versperringen. Pak turbo en haal in!');}
   if(car.progress>=this.totalDistance){this.phase='podium';this.held.clear();this.renderControls();}
  }
  resolveCarContacts(previous,priorLanes){
   const cars=[this.carState,...this.rivals],lane=c=>c===this.carState?c.offset:c.lane,setLane=(c,x)=>{if(c===this.carState)c.offset=x;else c.lane=x;},speed=c=>c===this.carState?c.speed:c.velocity,setSpeed=(c,v)=>{if(c===this.carState)c.speed=v;else c.velocity=v;};
   // Only cars alongside each other can push sideways. A car ahead may slow
   // forward travel, but must never prevent steering into the free lane behind it.
   for(let pass=0;pass<3;pass++)for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
    const a=cars[i],b=cars[j];if(a.finished||b.finished||Math.abs(a.progress-b.progress)>=260||Math.abs(lane(a)-lane(b))>=.5)continue;
    if(Math.abs(previous[i]-previous[j])<95){
     const direction=Math.sign(priorLanes[j]-priorLanes[i])||Math.sign(lane(b)-lane(a))||1;
     const overlap=.51-direction*(lane(b)-lane(a));
     const roomA=direction>0?lane(a)+.8:.8-lane(a),roomB=direction>0?.8-lane(b):lane(b)+.8;
     let pushA=Math.min(overlap/2,roomA),pushB=Math.min(overlap-pushA,roomB);pushA=Math.min(overlap-pushB,roomA);
     setLane(a,clamp(lane(a)-direction*pushA,-.8,.8));setLane(b,clamp(lane(b)+direction*pushB,-.8,.8));
     const key=i+':'+j;this.contacts??=new Map();
     if(this.raceTime-(this.contacts.get(key)??-10)>.3){
      a.sideVelocity=-direction*.38;b.sideVelocity=direction*.38;setSpeed(a,speed(a)*.9);setSpeed(b,speed(b)*.9);this.contacts.set(key,this.raceTime);
      if(i===0){this.boost=0;this.bump=.7;this.message('Bots! Stuur naar een vrije plek.');}
     }
    }else{
     const front=previous[i]>previous[j]?a:b,back=front===a?b:a,backIndex=front===a?j:i;
     back.progress=Math.max(previous[backIndex],Math.min(back.progress,front.progress-260));setSpeed(back,Math.min(speed(back),speed(front)));if(back===this.carState)this.boost=0;
     if(i===0&&!this.bump){this.message('Er rijdt iemand voor je. Stuur ernaast om in te halen!');this.bump=.7;}
    }
   }
  }
  roadPath(s){return (Math.sin(s/1150)*700+Math.sin(s/620)*150)*(tracks[this.trackId]?.bend||1);}
  roadPoint(z){const W=this.w,H=this.h,d=this.distance||0,p=250/(z+250),horizon=H*.31,bottom=H*.95,slope=(Math.cos(d/1150)*700/1150+Math.cos(d/620)*150/620)*(tracks[this.trackId]?.bend||1);
   const bend=this.roadPath(d+z)-this.roadPath(d)-slope*z;
   return{x:W/2+bend*p*.5-(this.carState?.offset||0)*W*.12*p,y:Math.round(horizon+(bottom-horizon)*p),half:W*.66*p,p};}
  polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}
  carPaint(im,tint,model,driver){
   if(!tint)return im;
   this.paintCache??=new Map();const key=im.src+':'+tint+':'+model+':'+!!driver;if(this.paintCache.has(key))return this.paintCache.get(key);
   const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');c.drawImage(im,0,0);const pixels=c.getImageData(0,0,cv.width,cv.height),d=pixels.data;
   const bounds=[[.38,.025,.22,.36],[.30,.18,.15,.125],[.30,.12,.21,.27]][model]||[0,0,0,0];
   // Recolour pixels directly: canvas filters are not reliable on every iPad.
   const hue=tint===280?115:tint===125?325:(190+tint)%360;
   for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],x=(i/4%cv.width)/cv.width,y=Math.floor(i/4/cv.width)/cv.height;
    if(!d[i+3]||(driver&&x>=bounds[0]&&x<=bounds[0]+bounds[2]&&y>=bounds[1]&&y<=bounds[1]+bounds[3])||!(g>r*1.25&&b>r*1.3&&Math.min(g,b)>60))continue;
    const hi=Math.max(r,g,b)/255,lo=Math.min(r,g,b)/255,l=(hi+lo)/2,s=tint==='primer'?0:(hi-lo)/(1-Math.abs(2*l-1)||1),ch=(1-Math.abs(2*l-1))*s,h=hue/60,z=ch*(1-Math.abs(h%2-1)),m=l-ch/2;
    const rgb=tint==='primer'?[0,0,0]:h<1?[ch,z,0]:h<2?[z,ch,0]:h<3?[0,ch,z]:h<4?[0,z,ch]:h<5?[z,0,ch]:[ch,0,z];
    for(let k=0;k<3;k++)d[i+k]=Math.round((rgb[k]+m)*255);
   }
   c.putImageData(pixels,0,0);this.paintCache.set(key,cv);return cv;
  }
  rearSprite(c,x,y,width,tint,label,player=false){const model=player?(this.vehicle??1):(label==='Pip'?2:1),im=(player?this.driverCars:this.rearCars)?.[model];if(!im?.complete||!im.naturalWidth)return;const r=(player?this.driverRects:this.rearRects)?.[model]||[0,0,im.naturalWidth,im.naturalHeight],scale=width/r[2],h=r[3]*scale,left=x-width/2,top=y-h;
   c.save();c.fillStyle='#172e3a55';c.beginPath();c.ellipse(x,y-4,width*.39,width*.055,0,0,Math.PI*2);c.fill();c.drawImage(this.carPaint(im,tint,model,player),...r,left,top,width,h);c.restore();
   if(label){c.font='bold '+Math.max(12,width*.1)+'px Trebuchet MS';c.textAlign='center';c.fillStyle='#fff9e9';c.strokeStyle='#234750';c.lineWidth=3;c.strokeText(label,x,y-h-7);c.fillText(label,x,y-h-7);}}

  drawRace(){const c=this.ctx,W=this.w,H=this.h;c.clearRect(0,0,W,H);const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#81d5f7');sky.addColorStop(.45,'#def8ff');sky.addColorStop(1,'#138bb9');c.fillStyle=sky;c.fillRect(0,0,W,H);
   const theme=tracks[this.trackId]||tracks.island,bg=this.trackImages?.[this.trackId]?.background||this.images.scenery;if(bg?.complete&&bg.naturalWidth)c.drawImage(bg,0,0,bg.naturalWidth,bg.naturalHeight*.75,0,0,W,H*.56);
   c.fillStyle=theme.ground[0];c.fillRect(0,H*.56,W,H*.44);
   const n=100,step=36;
   for(let i=n-1;i>=0;i--){const z=i*step,a=this.roadPoint(z),b=this.roadPoint(z+step),stripe=Math.floor((this.distance+z)/120)%2;
    this.polygon(c,[{x:a.x-a.half*1.55,y:a.y},{x:a.x+a.half*1.55,y:a.y},{x:b.x+b.half*1.55,y:b.y},{x:b.x-b.half*1.55,y:b.y}],theme.ground[stripe?0:1]);
    this.polygon(c,[{x:a.x-a.half*1.1,y:a.y},{x:a.x+a.half*1.1,y:a.y},{x:b.x+b.half*1.1,y:b.y},{x:b.x-b.half*1.1,y:b.y}],stripe?'#fff2cb':'#d87858');
    this.polygon(c,[{x:a.x-a.half,y:a.y},{x:a.x+a.half,y:a.y},{x:b.x+b.half,y:b.y},{x:b.x-b.half,y:b.y}],theme.road[stripe?0:1]);
    if(stripe)for(const lane of [-.333,.333])this.polygon(c,[{x:a.x+a.half*(lane-.012),y:a.y},{x:a.x+a.half*(lane+.012),y:a.y},{x:b.x+b.half*(lane+.012),y:b.y},{x:b.x+b.half*(lane-.012),y:b.y}],'#fff4d3');
   }
   for(const r of this.rivals)if(!r.finished&&r.progress>=this.totalDistance)r.finished=this.raceTime;
   for(const pad of this.pads){const z=pad.distance-this.distance+85;if(pad.used||z<0||z>3000)continue;const a=this.roadPoint(z),b=this.roadPoint(z+80),l=pad.lane;
    this.polygon(c,[{x:a.x+a.half*(l-.23),y:a.y},{x:a.x+a.half*(l+.23),y:a.y},{x:b.x+b.half*(l+.23),y:b.y},{x:b.x+b.half*(l-.23),y:b.y}],'#ffcf4d');
    c.fillStyle='#fffbea';c.font='bold '+Math.max(10,45*a.p)+'px sans-serif';c.textAlign='center';c.fillText('↑',a.x+a.half*l,a.y-5*a.p);
   }
   const startZ=85-this.distance;if(startZ>=0){const a=this.roadPoint(startZ),b=this.roadPoint(startZ+40);for(let j=0;j<16;j++)this.polygon(c,[{x:a.x+a.half*(-1+j/8),y:a.y},{x:a.x+a.half*(-1+(j+1)/8),y:a.y},{x:b.x+b.half*(-1+(j+1)/8),y:b.y},{x:b.x+b.half*(-1+j/8),y:b.y}],j%2?'#fff':'#223942');}
   const finishZ=this.totalDistance-this.distance+85;if(finishZ>=0&&finishZ<3000){const a=this.roadPoint(finishZ),b=this.roadPoint(finishZ+50);for(let j=0;j<12;j++)this.polygon(c,[{x:a.x+a.half*(-1+j/6),y:a.y},{x:a.x+a.half*(-1+(j+1)/6),y:a.y},{x:b.x+b.half*(-1+(j+1)/6),y:b.y},{x:b.x+b.half*(-1+j/6),y:b.y}],j%2?'#fff':'#223942');}
   const size=Math.min(W*.235,H*.31)/this.roadPoint(85).p;
   const racers=[...this.obstacles.filter(o=>!o.hit).map(o=>({...o,obstacle:true,z:o.distance-this.distance+85})),...this.rivals.map(r=>({...r,z:r.progress-this.distance+85})),{player:true,z:85,lane:this.carState.offset,tint:this.color}].filter(r=>r.z>15&&r.z<3000).sort((a,b)=>b.z-a.z);
   for(const r of racers){const p=this.roadPoint(r.z);if(r.obstacle){const im=this.trackImages?.[this.trackId]?.obstacle||this.images.barrier;if(im?.complete&&im.naturalWidth){const width=p.half*.48,height=width*im.naturalHeight/im.naturalWidth;c.drawImage(im,p.x+p.half*r.lane-width/2,p.y-height,width,height);}continue;}c.save();c.translate(p.x+p.half*r.lane,p.y);this.rearSprite(c,0,0,size*p.p,r.tint,r.player?null:r.name,!!r.player);c.restore();}
   if(this.raceTime<3){c.textAlign='center';c.font='bold 76px Trebuchet MS';c.fillStyle='#fff8df';c.strokeStyle='#26667a';c.lineWidth=7;const t=String(3-Math.floor(this.raceTime));c.strokeText(t,W/2,H*.48);c.fillText(t,W/2,H*.48);}

  }
  destroy(){window.removeEventListener('keyup',this.releaseKey);window.removeEventListener('blur',this.releaseAll);document.removeEventListener('visibilitychange',this.releaseAll);super.destroy();}
 };
})();
