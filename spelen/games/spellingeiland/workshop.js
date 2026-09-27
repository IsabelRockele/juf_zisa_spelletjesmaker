/* A construction game, independent from the detective's platform adventure. */
(() => {
  'use strict';
  const PARTS=[
    {name:'het onderstel',kit:0,x:525,y:365,w:420,h:170,bolt:false},
    {name:'het achterwiel',kit:1,x:405,y:440,w:96,h:96,bolt:[930,282]},
    {name:'het voorwiel',kit:1,x:675,y:440,w:96,h:96,bolt:[930,282]},
    {name:'de stoel',kit:3,x:493,y:289,w:90,h:115,bolt:[167,823]},
    {name:'de koplamp',kit:2,x:728,y:352,w:68,h:70,bolt:[1301,349]}
  ];
  class Workshop {
    constructor({count,onChallenge,onFinish,onStop}) {
      Object.assign(this,{count,onChallenge,onFinish,onStop});this.parts=PARTS.map(p=>({...p}));this.done=0;this.built=[];this.car=0;this.phase='plan';this.turns=0;this.color=0;this.t=0;this.drive=0;this.drag=null;
      this.gates=Array.from({length:count},(_,i)=>({title:'Maak '+this.parts[i%5].name}));
      this.root=document.createElement('section');this.root.id='adventure-root';this.root.className='real-workshop';
      this.root.innerHTML='<canvas id="shop-canvas" aria-label="Werkbank waarop je een wagen bouwt"></canvas><header class="world-hud"><div><span class="world-eyebrow">De Woordenwerkplaats</span><strong>Maak je eigen wagen!</strong></div><div class="world-score"><span id="world-parts">0 / '+count+'</span><small>bouwkaarten</small></div><button id="world-stop">Pauze</button></header><p id="world-message" role="status"></p><div class="shop-coach"><img src="assets/zisa-werkplaats.png" alt="Zisa in de werkplaats"><span id="shop-project"></span></div><div id="shop-tray"><span id="shop-part-name"></span><canvas id="shop-part" width="160" height="140" tabindex="0" role="button" aria-label="Onderdeel: tik om het op de werkbank te zetten"></canvas></div><div class="shop-actions"><div id="shop-colors" hidden><button data-color="0">Blauw</button><button data-color="125">Roze</button><button data-color="280">Groen</button></div><button id="world-action" class="primary"></button></div><div id="shop-shelf" aria-label="Jouw afgewerkte wagens"></div>';
      document.body.append(this.root);this.canvas=this.root.querySelector('#shop-canvas');this.ctx=this.canvas.getContext('2d');this.partCanvas=this.root.querySelector('#shop-part');
      this.images={};for(const [key,file] of Object.entries({room:'werkplaats-binnen',kit:'werkplaats-onderdelen',wagon:'avontuur-wagen'})){const im=new Image();im.src='assets/'+file+'.png';this.images[key]=im;}
      this.images.kit.onload=()=>{this.measureParts();this.drawTray();};
      this.action=this.root.querySelector('#world-action');this.action.onclick=()=>this.act();this.root.querySelector('#world-stop').onclick=onStop;
      this.root.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{this.color=Number(b.dataset.color);this.root.querySelectorAll('[data-color]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));});
      this.partCanvas.onpointerdown=e=>{if(this.phase!=='assemble')return;e.preventDefault();this.partCanvas.setPointerCapture(e.pointerId);this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};};
      this.partCanvas.onpointermove=e=>{if(this.drag?.id===e.pointerId){this.drag.x=e.clientX;this.drag.y=e.clientY;}};
      this.partCanvas.onpointerup=e=>{if(this.drag?.id!==e.pointerId)return;const d=this.drag;this.drag=null;const p=this.part(),target=this.screen(p.x,p.y);if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<10||Math.hypot(e.clientX-target.x,e.clientY-target.y)<Math.max(65,100*this.scale))this.place();else this.message('Bijna! Sleep naar de gouden rand. Of tik op het onderdeel.');};
      this.partCanvas.onpointercancel=()=>{this.drag=null;};this.partCanvas.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();this.place();}};
      this.resize=()=>{const d=Math.min(devicePixelRatio||1,2);this.w=innerWidth;this.h=innerHeight;this.canvas.width=this.w*d;this.canvas.height=this.h*d;this.ctx.setTransform(d,0,0,d,0,0);this.scale=Math.min(this.w/1000,this.h/670);this.ox=(this.w-1000*this.scale)/2;this.oy=(this.h-670*this.scale)*.48;};
      this.observer=new ResizeObserver(this.resize);this.observer.observe(this.root);this.resize();this.renderControls();
      this.frame=t=>{if(this.destroyed)return;const dt=Math.min((t-(this.last||t))/1000,.04);this.last=t;if(!document.hidden&&!document.querySelector('dialog[open]')){this.t+=dt;this.updateRace?.(dt);if(this.phase==='drive'){this.drive+=dt;if(this.drive>4.5)this.endDrive();}if(['world','play'].includes(document.body.dataset.view))this.draw();}this.raf=requestAnimationFrame(this.frame);};this.raf=requestAnimationFrame(this.frame);
    }
    measureParts(){this.rects=[[26,161,711,223],[774,103,346,349],[1247,164,183,256],[88,530,427,358],[632,531,341,366],[1064,624,426,220]];}
    part(){return this.parts[Math.min(4,(this.phase==='plan'||this.phase==='question'?this.done:Math.max(0,this.done-1))%5)];}
    screen(x,y){return{x:this.ox+x*this.scale,y:this.oy+y*this.scale};}
    message(t){this.root.querySelector('#world-message').textContent=t;}
    renderControls(){
      const p=this.part(),button=this.action,tray=this.root.querySelector('#shop-tray');
      this.root.querySelector('#world-parts').textContent=this.done+' / '+this.count;
      this.root.querySelector('#shop-project').textContent='Wagen '+(this.car+1)+' van '+(this.count/5);
      this.root.querySelector('#shop-part-name').textContent=p.name;
      tray.hidden=!['plan','assemble'].includes(this.phase);this.partCanvas.classList.toggle('part-locked',this.phase==='plan');
      this.root.querySelector('#shop-colors').hidden=this.phase!=='paint';button.hidden=false;
      if(this.phase==='plan'){button.textContent='Maak de bouwkaart';this.message('We hebben '+p.name+' nodig. Maak de bouwkaart!');}
      if(this.phase==='assemble'){button.textContent='Zet op zijn plek';this.message('Sleep '+p.name+' naar de gouden rand. Aantikken mag ook.');}
      if(this.phase==='tighten'){button.textContent='Draai vast · '+this.turns+' / 3';this.message('Pak de sleutel! Tik drie keer om '+p.name+' vast te draaien.');}
      if(this.phase==='paint'){button.textContent='Testrit!';this.message('Je wagen is klaar! Kies een kleur en probeer hem uit.');}
      if(this.phase==='drive'){button.hidden=true;this.message('Hij rijdt! Kijk eens wat jij gemaakt hebt!');}
      this.drawTray();
    }
    act(){if(this.phase==='plan'){this.phase='question';this.onChallenge();}else if(this.phase==='assemble')this.place();else if(this.phase==='tighten'){this.turns++;if(this.turns===3)this.nextPart();else this.renderControls();}else if(this.phase==='paint'){this.phase='drive';this.drive=0;this.renderControls();}}
    solve(word){this.word=word;this.done++;this.phase='assemble';this.turns=0;this.renderControls();}
    place(){if(this.phase!=='assemble')return;const index=(this.done-1)%5;if(!this.built.includes(index))this.built.push(index);this.placedAt=this.t;if(this.parts[index].bolt){this.phase='tighten';this.turns=0;this.renderControls();}else this.nextPart();}
    nextPart(){this.phase=this.done%5===0?'paint':'plan';this.renderControls();}
    endDrive(){
      if(this.phase!=='drive')return;
      this.car++;if(this.done===this.count){this.phase='complete';this.onFinish();return;}
      const mini=document.createElement('canvas');mini.width=160;mini.height=100;const mc=mini.getContext('2d');mc.scale(.32,.32);mc.translate(-290,-210);for(const p of this.parts)this.partImage(mc,p.kit,p.x,p.y,p.w,p.h);this.partImage(mc,4,580,295,70,110);const img=document.createElement('img');img.src=mini.toDataURL('image/png');img.alt='Wagen '+this.car+' klaar';this.root.querySelector('#shop-shelf').append(img);
      this.built=[];this.phase='plan';this.color=0;this.drive=0;this.renderControls();
    }
    partImage(c,index,x,y,w,h,alpha=1){if(!this.rects)return;const r=this.rects[index];if(!r)return;const size=Math.min(w/r[2],h/r[3]);c.save();c.globalAlpha=alpha;if((index===0||index===3)&&this.color)c.filter='hue-rotate('+this.color+'deg)';c.drawImage(this.images.kit,...r,x-r[2]*size/2,y-r[3]*size/2,r[2]*size,r[3]*size);c.restore();}
    drawTray(){const c=this.partCanvas.getContext('2d');c.clearRect(0,0,160,140);this.partImage(c,this.part().kit,80,70,145,120);}
    draw(){
      const c=this.ctx;c.clearRect(0,0,this.w,this.h);const bg=this.images.room;if(bg.complete&&bg.naturalWidth){const z=Math.max(this.w/bg.naturalWidth,this.h/bg.naturalHeight);c.drawImage(bg,(this.w-bg.naturalWidth*z)/2,(this.h-bg.naturalHeight*z)/2,bg.naturalWidth*z,bg.naturalHeight*z);}else{c.fillStyle='#d2b27e';c.fillRect(0,0,this.w,this.h);}
      c.save();c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);
      // The construction mat remains clear against the richly illustrated room.
      c.fillStyle='#e9f4e8e8';c.strokeStyle='#799b83';c.lineWidth=3;c.beginPath();c.moveTo(280,440);c.lineTo(770,440);c.lineTo(840,520);c.lineTo(230,520);c.closePath();c.fill();c.stroke();
      if(this.phase==='drive')c.translate(Math.sin(Math.min(1,this.drive/4.5)*Math.PI*2)*190,-Math.abs(Math.sin(this.drive*9))*3);
      for(const [i,p] of this.parts.entries()){
        const built=this.built.includes(i);if(built){if(p.kit===1&&this.phase==='drive'){c.save();c.translate(p.x,p.y);c.rotate(this.drive*8);this.partImage(c,p.kit,0,0,p.w,p.h);c.restore();}else this.partImage(c,p.kit,p.x,p.y,p.w,p.h);}
        else if(i===this.done%5&&this.phase==='plan'||i===(this.done-1)%5&&this.phase==='assemble'){
          this.partImage(c,p.kit,p.x,p.y,p.w,p.h,.18);c.strokeStyle='#dc9b22';c.lineWidth=4;c.setLineDash([9,7]);c.strokeRect(p.x-p.w/2-9,p.y-p.h/2-9,p.w+18,p.h+18);c.setLineDash([]);
        }
      }
      if(this.built.includes(3))this.partImage(c,4,580,295,70,110);
      if(this.phase==='tighten'&&this.rects){
        const p=this.part(),r=this.rects[p.kit],s=Math.min(p.w/r[2],p.h/r[3]);
        const bx=p.x+(p.bolt[0]-r[0]-r[2]/2)*s,by=p.y+(p.bolt[1]-r[1]-r[3]/2)*s;
        // Rotate about the open jaw, aligned with the visible fastener in each part.
        const tool=this.rects[5],size=.24,jaw=[1120,696];
        c.save();c.translate(bx,by);c.rotate(-.5+this.turns*.65);
        c.drawImage(this.images.kit,...tool,(tool[0]-jaw[0])*size,(tool[1]-jaw[1])*size,tool[2]*size,tool[3]*size);c.restore();
      }
      c.restore();
      if(this.drag){this.partImage(c,this.part().kit,this.drag.x,this.drag.y,140,130,.9);}
    }
    destroy(){this.destroyed=true;cancelAnimationFrame(this.raf);this.observer.disconnect();this.root.remove();}
  }
  window.SpellingWorkshop=Workshop;
})();
