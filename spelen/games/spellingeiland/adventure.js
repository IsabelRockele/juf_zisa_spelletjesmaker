/* The adventure owns movement and scenery. Spelling remains in app.js. */
(() => {
  'use strict';
  const FLOOR=410, STRIDE=620;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const THEMES=['De waterval','Het letterbos','De wolkenbrug','De gouden baai'];
  const SPRITES={detective:[[50,50,377,465],[447,63,759,463],[813,53,1134,465],[1198,56,1519,440],[66,537,345,962],[453,513,719,881],[796,603,1152,921],[1152,524,1506,960]],workshop:[[41,71,357,455],[425,81,745,455],[804,76,1120,443],[1172,65,1505,431],[70,550,336,956],[456,523,713,877],[794,600,1152,893],[1152,523,1512,954]]};
  const TASKS=[['bridge','Maak de brug'],['gate','Open de poort'],['boat','Vaar naar de overkant'],['chest','Open de schatkist'],['balloon','Vlieg naar het volgende eiland']];
  class Adventure {
    constructor({mode,count,onChallenge,onFinish,onStop}) {
      Object.assign(this,{mode,count,onChallenge,onFinish,onStop});
      this.root=document.createElement('section');this.root.id='adventure-root';
      this.root.innerHTML='<canvas id="adventure-canvas" aria-label="Spelwereld. Gebruik de pijltjes om te lopen en de spatie om te springen."></canvas><header class="world-hud"><div><span class="world-eyebrow">'+(mode==='detective'?'Zisa en het spoor van Pip':'Zisa en de wonderwagen')+'</span><strong id="world-place">De waterval</strong></div><div class="world-score"><span id="world-parts">0 / '+count+'</span><small>woorden</small><span id="found-clues">0</span><small>sporen</small></div><button id="world-stop">Pauze</button></header><p id="world-message" role="status">Houd de pijl vast om te lopen. Tik op Spring om te springen.</p><div class="world-controls"><div class="walk-controls"><button data-move="-1" aria-label="Loop naar links">◀</button><button data-move="1" aria-label="Loop naar rechts">▶</button></div><button id="world-action" class="primary" hidden></button><button id="world-jump">Spring ↑</button></div><button id="world-sound" aria-pressed="false">Geluid aan</button>';
      document.body.append(this.root);this.canvas=this.root.querySelector('canvas');this.ctx=this.canvas.getContext('2d');
      this.images={};for(const [key,file] of Object.entries({background:'avontuur-landschap',platform:'avontuur-platform',bridge:'avontuur-brug',gate:'avontuur-poort',boat:'avontuur-boot',balloon:'avontuur-ballon',chest:'avontuur-schatkist',finds:'avontuur-vondsten',sitting:'zisa-in-boot',cycle:mode==='detective'?'zisa-animatie-detective':'zisa-animatie-werkplaats',zisa:mode==='detective'?'zisa-detective':'zisa-werkplaats',pip:'pip-detective',robot:'ro-robot'})){const im=new Image();im.src='assets/'+file+'.png';this.images[key]=im;}
      this.x=90;this.y=FLOOR;this.vy=0;this.vx=0;this.camera=0;this.time=0;this.walkDistance=0;this.walking=false;this.done=0;this.phase='explore';this.pressed=new Set();this.ground=true;this.face=1;this.particles=[];this.opened=[];this.finishTime=0;this.audio=null;this.sound=false;this.visible=true;
      this.collected=new Set();this.items=Array.from({length:count},(_,i)=>({x:i*STRIDE+260,y:FLOOR-(i%2?145:55),raised:i%2===1}));
      this.gates=Array.from({length:count},(_,i)=>({x:430+i*STRIDE,type:TASKS[i%5][0],title:TASKS[i%5][1],opened:0}));

      this.action=this.root.querySelector('#world-action');this.action.onclick=()=>this.act();
      this.root.querySelector('#world-stop').onclick=()=>onStop();
      this.root.querySelector('#world-sound').onclick=()=>{this.sound=!this.sound;this.root.querySelector('#world-sound').textContent=this.sound?'Geluid uit':'Geluid aan';this.root.querySelector('#world-sound').setAttribute('aria-pressed',String(this.sound));this.tone(523);};
      this.root.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);this.pressed.add(b.dataset.move);};b.onpointerup=b.onpointercancel=()=>this.pressed.delete(b.dataset.move);b.onlostpointercapture=()=>this.pressed.delete(b.dataset.move);});
      this.root.querySelector('#world-jump').onpointerdown=e=>{e.preventDefault();this.jump();};
      this.root.querySelector('#world-jump').onclick=e=>{if(e.detail===0)this.jump();};
      this.keydown=e=>{if(!['explore','reward'].includes(this.phase)||document.body.dataset.view!=='world'||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey)return;if(['ArrowLeft','ArrowRight','ArrowUp',' '].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')this.pressed.add('-1');if(e.key==='ArrowRight')this.pressed.add('1');if((e.key===' '||e.key==='ArrowUp')&&!e.repeat)this.jump();}if(e.key==='Enter'&&!e.repeat&&!this.action.hidden){e.preventDefault();this.act();}};
      this.keyup=e=>{if(e.key==='ArrowLeft')this.pressed.delete('-1');if(e.key==='ArrowRight')this.pressed.delete('1');};
      this.blur=()=>this.pressed.clear();window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.blur);
      this.resize=()=>{const r=this.root.getBoundingClientRect();this.w=r.width||innerWidth;this.h=r.height||innerHeight;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=this.w*d;this.canvas.height=this.h*d;this.ctx.setTransform(d,0,0,d,0,0);this.scale=Math.min(this.h/600,this.w/660);this.vw=this.w/this.scale;this.vh=this.h/this.scale;};
      this.observer=new ResizeObserver(this.resize);this.observer.observe(this.root);this.resize();
      this.frame=t=>{if(this.destroyed)return;const dt=Math.min((t-(this.last||t))/1000,.035);this.last=t;if(!document.hidden&&!document.querySelector('dialog[open]')){this.time+=dt;this.update(dt);if(['world','play'].includes(document.body.dataset.view))this.draw();}this.raf=requestAnimationFrame(this.frame);};this.raf=requestAnimationFrame(this.frame);
    }
    canMove(){return this.phase==='explore'&&document.body.dataset.view==='world'&&!document.querySelector('dialog[open]');}
    message(text){this.root.querySelector('#world-message').textContent=text;}
    tone(hz=660){if(!this.sound)return;try{this.audio??=new(window.AudioContext||window.webkitAudioContext)();this.audio.resume();const o=this.audio.createOscillator(),g=this.audio.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.07,this.audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+.22);o.connect(g);g.connect(this.audio.destination);o.start();o.stop(this.audio.currentTime+.23);}catch{}}
    jump(){if(this.canMove()&&this.ground){this.vy=-550;this.ground=false;this.tone(330);}}
    act(){if(!this.canMove()||this.action.hidden)return;this.pressed.clear();this.vx=0;if(this.done===this.count){this.phase='finale';this.finishTime=0;this.action.hidden=true;this.message(this.mode==='detective'?'Daar is Pip! Samen terug naar huis!':'Daar gaat jullie wonderwagen!');this.burst(this.x+80,FLOOR-100,60);this.tone(880);return;}if(!this.collected.has(this.done)){this.message('Zoek eerst het spoor van Pip. Spring naar het pootafdrukkaartje!');return;}this.phase='question';this.onChallenge();}
    solve(word){const g=this.gates[this.done];g.word=word;g.opened=this.time;this.opened.push(this.done);this.done++;this.phase='reward';this.rewardEnd=this.time+2.4;this.pressed.clear();this.root.querySelector('#world-parts').textContent=this.done+' / '+this.count;this.message(({bridge:'Kijk! De planken maken een brug. Loop erover!',gate:'De poort gaat omhoog. Je kunt verder!',boat:'Stap in! De boot brengt je naar de overkant.',chest:'De schatkist gaat open. Pip is hier langs geweest!',balloon:'De ballon stijgt op! Daar gaan we!' })[g.type]);this.burst(g.x,FLOOR-60,35);this.action.hidden=true;this.tone(784);if(['boat','balloon'].includes(g.type)){this.phase='travel';this.trip={gate:g,from:this.x,start:this.time};}}
    burst(x,y,n){for(let i=0;i<n;i++)this.particles.push({x,y,vx:(Math.random()-.5)*250,vy:-80-Math.random()*210,life:1.2+Math.random(),color:['#ffd45f','#fff8ba','#62ddcd','#ed9475'][i%4]});}
    update(dt){
      if(this.phase==='reward'&&this.time>=this.rewardEnd)this.phase='explore';
      if(this.phase==='travel'){
        const trip=this.trip,g=trip.gate,t=this.time-trip.start;
        const rideLength=g.type==='boat'?3:4,exitAt=1.5+rideLength;
        if(t<.7){trip.step='approach';this.x=trip.from+(g.x-60-trip.from)*(t/.7);this.y=FLOOR;this.walkDistance+=dt*160;}
        else if(t<1.5){trip.step='enter';const u=(t-.7)/.8;this.x=g.x-60+43*u;this.y=FLOOR+20*u-50*Math.sin(Math.PI*u);}
        else if(t<exitAt){trip.step='ride';const u=(t-1.5)/rideLength;trip.px=g.x+15+(g.type==='boat'?120:180)*u;trip.py=FLOOR+(g.type==='boat'?15:-135)*Math.sin(Math.PI*u);this.x=trip.px;this.y=trip.py;}
        else if(t<exitAt+1){trip.step='exit';const u=t-exitAt;trip.px=g.x+(g.type==='boat'?135:195);trip.py=FLOOR;this.x=trip.px-25+(g.type==='boat'?150:90)*u;this.y=FLOOR+20*(1-u)-50*Math.sin(Math.PI*u);}
        else{this.phase='explore';this.x=g.x+260;this.y=FLOOR;this.ground=true;this.trip=null;this.message('We zijn aan de overkant! Zoek het volgende spoor.');}
        this.camera+=(Math.max(0,this.x-this.vw*.32)-this.camera)*Math.min(1,dt*4);
      }
      if(this.phase==='finale'){this.finishTime+=dt;this.x+=dt*130;this.walkDistance+=dt*130;this.camera+=(this.x-this.vw*.4-this.camera)*Math.min(1,dt*3);if(Math.random()<dt*7)this.burst(this.x+60,FLOOR-160,12);if(this.finishTime>5){this.phase='complete';this.onFinish();}}
      if(this.canMove()){
        const dir=Number(this.pressed.has('1'))-Number(this.pressed.has('-1'));this.vx+=(dir*220-this.vx)*Math.min(1,dt*12);if(dir)this.face=dir;
        const gate=this.gates[this.done],limit=gate?gate.x-70:this.count*STRIDE+110;
        const before=this.x;this.x=clamp(this.x+this.vx*dt,45,limit);this.walking=Math.abs(this.x-before)>.1;this.walkDistance+=Math.abs(this.x-before);const beforeY=this.y;this.vy+=1400*dt;this.y+=this.vy*dt;this.ground=false;
        const surfaces=[];
        for(let i=0;i<=this.count;i++){
          if(this.x>=i*STRIDE-30&&this.x<=i*STRIDE+450)surfaces.push(FLOOR);
          const g=this.gates[i];if(g&&g.opened&&!['boat','balloon'].includes(g.type)&&this.x>=g.x-40&&this.x<=g.x+220)surfaces.push(FLOOR);
          if(i%2&&i<this.count&&this.x>=i*STRIDE+195&&this.x<=i*STRIDE+325)surfaces.push(FLOOR-80);
        }
        for(const floor of surfaces.sort((a,b)=>a-b))if(this.vy>=0&&beforeY<=floor+1&&this.y>=floor){this.y=floor;this.vy=0;this.ground=true;break;}
        if(this.y>FLOOR+210){this.x=Math.max(70,this.done*STRIDE+70);this.y=FLOOR;this.vy=0;this.ground=true;this.message('Zisa is weer veilig. Probeer het rustig opnieuw.');}
        this.items.forEach((p,i)=>{if(!this.collected.has(i)&&Math.hypot(this.x-p.x,this.y-55-p.y)<44){this.collected.add(i);this.root.querySelector('#found-clues').textContent=this.collected.size;this.burst(p.x,p.y,18);this.tone(780);this.message('Een spoor van Pip gevonden! Ga naar de doorgang.');}});
        const near=gate?this.x>gate.x-175:this.x>this.count*STRIDE+70;
        this.action.hidden=!near;this.action.textContent=gate?this.collected.has(this.done)?gate.title:'Zoek het spoor':this.mode==='detective'?'Neem Pip mee!':'Start de wonderwagen!';
        if(near&&this.lastNear!==this.done){this.lastNear=this.done;this.message(gate?gate.title+'. Help Zisa met een woord.':this.mode==='detective'?'Je hebt Pip gevonden! Neem hem mee.':'Alles is klaar. Start jullie wonderwagen!');}
        const chapter=Math.min(3,Math.floor(this.done/5));this.root.querySelector('#world-place').textContent=THEMES[chapter];
        this.camera+=(Math.max(0,this.x-this.vw*.32)-this.camera)*Math.min(1,dt*4);
      }
      this.particles=this.particles.filter(p=>p.life>0);for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;}
    }
    image(key,x,y,w,h,flip=false){const im=this.images[key];if(!im?.complete||!im.naturalWidth)return;const c=this.ctx;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(im,-w/2,-h,w,h);c.restore();}
    round(x,y,w,h,r,color){const c=this.ctx;c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
    draw(){
      const c=this.ctx,W=this.w,H=this.h;c.clearRect(0,0,W,H);
      const bg=this.images.background;
      if(bg.complete&&bg.naturalWidth){
        // One cover image: never tile a landscape with non-matching edges.
        const zoom=Math.max(W/bg.naturalWidth,H/bg.naturalHeight)*1.1;
        const bw=bg.naturalWidth*zoom,bh=bg.naturalHeight*zoom;
        const travel=clamp(this.camera/Math.max(1,this.count*STRIDE),0,1);
        const bx=-(bw-W)*(.2+.6*travel),by=-(bh-H)*.46;
        c.drawImage(bg,bx,by,bw,bh);
      }else{c.fillStyle='#7bd8e8';c.fillRect(0,0,W,H);}
      c.save();c.scale(this.scale,this.scale);c.translate(-this.camera,(this.vh-600)*.45);
      // Foreground piers have real collision limits until their bridge or gate is repaired.
      const left=Math.floor(this.camera/STRIDE)-1,right=Math.ceil((this.camera+this.vw)/STRIDE)+1;
      for(let i=Math.max(0,left);i<=Math.min(this.count,right);i++){
        const x=i*STRIDE;
        const ground=this.images.platform;if(ground.complete&&ground.naturalWidth)c.drawImage(ground,x-30,FLOOR-51,480,160);
        if(i%2&&i<this.count&&ground.complete&&ground.naturalWidth)c.drawImage(ground,x+195,FLOOR-96,130,44);
        // Broad boardwalk connects islands; unopened bridges have a visible gap.
        const g=this.gates[i];if(g){const open=g.opened?clamp((this.time-g.opened)/1.6,0,1):0;
          const bridge=this.images.bridge;
          if(!['boat','balloon'].includes(g.type)&&bridge.complete&&bridge.naturalWidth){
            const bx=g.x-40,by=FLOOR-55,bw=260,bh=87;
            c.save();
            if(g.type==='bridge'&&open<1){c.beginPath();c.rect(bx,by,Math.max(42,bw*open),bh);c.rect(bx+bw-38,by,38,bh);c.clip();}
            c.drawImage(bridge,bx,by,bw,bh);c.restore();
          }
          if(g.type==='bridge'&&!g.opened)this.sign(g.x-26,FLOOR-65,'?', '#dc8944');
          if(g.type==='gate'){
            const gate=this.images.gate;
            if(gate.complete&&gate.naturalWidth){const sw=gate.naturalWidth/4,frame=Math.min(3,Math.floor(open*4));c.drawImage(gate,frame*sw,0,sw,gate.naturalHeight,g.x-50,FLOOR-217,170,255);}
            if(!open)this.sign(g.x+36,FLOOR-215,'?', '#2e897b');
          }
          if(g.type==='chest'){this.image('platform',g.x-144,FLOOR-35,130,65);const im=this.images.chest;if(im.complete&&im.naturalWidth){const sw=im.naturalWidth/2;c.drawImage(im,g.opened?sw:0,0,sw,im.naturalHeight,g.x-190,FLOOR-155,92,92);}}
          if(['boat','balloon'].includes(g.type)){
            const active=this.trip?.gate===g,px=active?(this.trip.px??g.x+15):g.opened?g.x+195:g.x+15,py=active?(this.trip.py??FLOOR):FLOOR;
            this.image(g.type,px,py+(g.type==='boat'?55:35),g.type==='boat'?210:175,g.type==='boat'?140:285);
          }
          if(g.opened&&this.time-g.opened<2.4){const t=clamp((this.time-g.opened)/2.4,0,1);c.save();c.globalAlpha=1-t*.6;c.font='bold 30px Trebuchet MS';c.textAlign='center';const label=g.word||'Gelukt!';const width=c.measureText(label).width+30;this.round(g.x-width/2,FLOOR-120-t*65,width,48,14,'#fff6d5');c.fillStyle='#246e58';c.fillText(label,g.x,FLOOR-86-t*65);c.restore();}
        }
      }

      const finds=this.images.finds;
      if(finds.complete&&finds.naturalWidth){const sw=finds.naturalWidth/2,sh=finds.naturalHeight/2;this.items.forEach((p,i)=>{if(this.collected.has(i))return;const bob=Math.sin(this.time*2+i)*4;c.save();c.shadowColor='#ffe49a';c.shadowBlur=14;c.drawImage(finds,0,sh,sw,sh,p.x-34,p.y-34+bob,68,68);c.restore();});}
      this.drawStoryScenery?.();
      const goal=this.count*STRIDE+190;
      if(goal<this.camera+this.vw+200){
        if(this.mode==='detective'&&!this.drawStoryScenery){this.image('pip',this.phase==='finale'?this.x+83:goal,FLOOR,85,110);}
        else if(this.mode!=='detective'){const gx=this.phase==='finale'?this.x:goal;this.round(gx-70,FLOOR-40,155,30,12,'#e4ad4b');for(const offset of [-43,56]){c.fillStyle='#385761';c.beginPath();c.arc(gx+offset,FLOOR-4,22,0,Math.PI*2);c.fill();c.strokeStyle='#e9c57a';c.lineWidth=5;c.beginPath();c.moveTo(gx+offset-15*Math.cos(this.time*5),FLOOR-4-15*Math.sin(this.time*5));c.lineTo(gx+offset+15*Math.cos(this.time*5),FLOOR-4+15*Math.sin(this.time*5));c.stroke();}this.image('robot',gx+33,FLOOR-39,94,115);}
      }
      const moving=(this.canMove()&&this.walking)||this.phase==='finale';
      const frame=this.trip&&['enter','exit'].includes(this.trip.step)?5:this.trip?.step==='approach'?Math.floor(this.walkDistance/20)%4:this.phase==='finale'&&this.mode==='workshop'?7:!this.ground?(this.vy<0?5:6):moving?Math.floor(this.walkDistance/20)%4:4;
      this.spriteFrame=frame;
      c.fillStyle='#173f4333';c.beginPath();c.ellipse(this.x,FLOOR+6,32,8,0,0,Math.PI*2);c.fill();
      const cycle=this.images.cycle,cy=this.y+3-(this.phase==='finale'&&this.mode==='workshop'?34:0);
      if(this.trip?.step==='ride'&&this.trip.gate.type==='boat'){
        // Keep her PNG proportions and anchor her seated hip to the boat bench.
        const im=this.images.sitting,size=.105,seatX=this.trip.px-32,seatY=this.trip.py-10;
        if(im.complete&&im.naturalWidth)c.drawImage(im,seatX-425*size,seatY-1095*size,im.naturalWidth*size,im.naturalHeight*size);
      }
      else if(cycle.complete&&cycle.naturalWidth){
        const rect=SPRITES[this.mode][frame],sw=rect[2]-rect[0],sh=rect[3]-rect[1],size=.3;
        c.save();c.translate(this.x,cy);if(this.face<0)c.scale(-1,1);
        c.drawImage(cycle,rect[0],rect[1],sw,sh,-sw*size/2,-sh*size,sw*size,sh*size);c.restore();
      }else this.image('zisa',this.x,cy,91,132,this.face<0);
      if(this.trip&&['enter','ride','exit'].includes(this.trip.step)){
        const g=this.trip.gate,px=this.trip.px??g.x+15,py=this.trip.py??FLOOR;c.save();
        // Foreground hull / basket rim hides the lower body while Zisa is aboard.
        c.beginPath();c.rect(px-120,py-(g.type==='boat'?14:28),240,95);c.clip();
        this.image(g.type,px,py+(g.type==='boat'?55:35),g.type==='boat'?210:175,g.type==='boat'?140:285);c.restore();
      }
      for(const p of this.particles){c.globalAlpha=Math.min(1,p.life);this.round(p.x,p.y,7,7,2,p.color);}c.globalAlpha=1;
      c.restore();
    }
    sign(x,y,text,color){const c=this.ctx;this.round(x-26,y-57,52,48,12,color);c.fillStyle='#fff7d6';c.font='bold 33px Trebuchet MS';c.textAlign='center';c.fillText(text,x,y-22);}
    destroy(){this.destroyed=true;cancelAnimationFrame(this.raf);this.observer.disconnect();window.removeEventListener('keydown',this.keydown);window.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.blur);this.audio?.close();this.root.remove();}
  }
  window.SpellingAdventure=Adventure;
})();
