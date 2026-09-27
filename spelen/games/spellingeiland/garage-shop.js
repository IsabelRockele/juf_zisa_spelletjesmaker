/* Earned coins only: each five completed exercises buys one visible choice. */
(() => {
 const Base=window.SpellingWorkshop;
 const rounds=[{title:'Kies jouw auto',choices:['Raceauto','Monstertruck','Strandbuggy'],values:[0,1,2]},
  {title:'Kies je lak',choices:['Oceaanblauw','Frambozenroze','Appelgroen'],values:[0,125,280]},
  {title:'Kies je velgen',choices:['Goud','Zilver','Koper'],values:[0,1,2]},
  {title:'Kies je racenummer',choices:['Nummer 7','Nummer 8','Nummer 9'],values:[7,8,9]}];
 window.SpellingWorkshop=class extends Base {
  constructor(opts){super(opts);this.coins=0;this.purchases=0;this.rim=0;this.number=null;this.shopReady=true;
   this.root.classList.add('coin-workshop');
   const panel=document.createElement('section');panel.id='garage-store';panel.hidden=true;
   panel.innerHTML='<h2></h2><p>50 muntjes · verdiend met 5 woorden</p><div id="store-options"></div><button id="buy-choice" class="primary">Kopen · 50 muntjes</button>';
   this.root.append(panel);this.store=panel;
   panel.querySelector('#buy-choice').onclick=()=>this.buy();
   super.choose(0);this.phase='earn';
   this.renderControls();
   this.rewardTimer=setTimeout(()=>{if(!this.destroyed&&this.phase==='earn')this.challenge();},0);
  }
  choose(i){if(this.phase!=='store'||this.purchases!==0)return;super.choose(i);this.selection=i;this.phase='store';this.renderControls();}
  challenge(){if(this.phase!=='earn')return;clearTimeout(this.rewardTimer);this.phase='question';this.onChallenge();}
  act(){if(this.phase==='earn')this.challenge();else if(this.phase==='ready')this.startRace();else if(this.phase==='podium'){this.phase='complete';this.onFinish();}else if(!this.shopReady)super.act();}
  solve(word){if(this.phase!=='question')return;this.word=word;this.done++;this.coins+=10;
   this.phase=this.done%5===0?'store':'earn';this.selection=0;this.renderControls();
   if(this.phase==='earn'){
    this.message('+10 muntjes! Nog '+(5-this.done%5)+' woorden tot de winkel.');
    const next=()=>{if(this.destroyed||this.phase!=='earn')return;if(document.hidden||document.querySelector('dialog[open]')){this.rewardTimer=setTimeout(next,400);return;}this.challenge();};
    this.rewardTimer=setTimeout(next,1600);
   }
  }
  buy(){if(this.phase!=='store'||this.coins<50||this.purchases>=rounds.length)return;
   const value=rounds[this.purchases].values[this.selection];
   if(this.purchases===0){super.choose(value);this.built=[0,1,2,3,4];}
   if(this.purchases===1)this.color=value;if(this.purchases===2)this.rim=value;if(this.purchases===3)this.number=value;
   this.coins-=50;this.purchases++;this.purchaseAt=this.t;this.phase=this.done>=this.count?'ready':'earn';this.renderControls();
   this.message(this.phase==='ready'?'Jouw auto is klaar. Jij mag sturen!':'Gekocht! Spaar nu voor '+rounds[this.purchases].title.toLowerCase()+'.');
  }
  renderControls(){if(!this.shopReady)return super.renderControls();
   if(['race','podium'].includes(this.phase)){super.renderControls();this.store.hidden=true;return;}
   const choosing=false,shopping=this.phase==='store';
   this.root.querySelector('#vehicle-choice').hidden=true;
   this.root.querySelector('#race-controls').hidden=true;this.root.querySelector('#shop-tray').hidden=true;this.root.querySelector('#shop-colors').hidden=true;
   this.root.querySelector('.shop-coach').hidden=choosing;this.root.querySelector('.shop-actions').hidden=choosing||shopping;
   this.root.querySelector('.world-hud strong').textContent='Spaar jouw raceauto!';
   this.root.querySelector('#world-parts').textContent=this.coins+' muntjes';this.root.querySelector('.world-score small').textContent=this.done+' / '+this.count+' woorden';
   const goal=rounds[Math.min(this.purchases,3)].title;
   this.root.querySelector('#shop-project').textContent=this.phase==='ready'?'Op naar de race!':goal+' · '+this.coins+' / 50';
   this.action.hidden=false;this.action.textContent=this.phase==='ready'?'Naar de race!':'Oefenen en sparen';
   this.message(choosing?'Kies jouw droomauto.':this.phase==='ready'?'Houd Gas ingedrukt en stuur met de pijlen.':'Elk geoefend woord is 10 muntjes waard. Ook als je hulp krijgt.');
   this.store.hidden=!shopping;
   if(shopping){const round=rounds[this.purchases];this.store.querySelector('h2').textContent=round.title;
    this.store.querySelector('#store-options').innerHTML=round.choices.map((label,i)=>'<button data-option="'+i+'" aria-pressed="'+(i===this.selection)+'">'+label+'</button>').join('');
    this.store.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{if(this.purchases===0)this.choose(Number(b.dataset.option));else{this.selection=Number(b.dataset.option);this.renderControls();}});
    this.store.querySelector('#buy-choice').disabled=this.coins<50;this.message('Je hebt 50 muntjes! Kies en koop.');
   }
  }
  drawAssembly(c,side){
   // The opaque body and its own wheel coordinates always stay together.
   const body=this.parts[0];this.partImage(c,body.kit,body.x,body.y,body.w,body.h);
   const rim=this.phase==='store'&&this.purchases===2?this.selection:this.rim;
   for(const p of this.vehicleGeometry(this.vehicle).wheels){this.partImage(c,1,p.x,p.y,p.d,p.d);
    if(rim){c.save();c.beginPath();c.arc(p.x,p.y,p.d*.235,0,Math.PI*2);c.clip();c.filter=rim===1?'grayscale(1) brightness(1.35)':'hue-rotate(325deg)';this.partImage(c,1,p.x,p.y,p.d,p.d);c.restore();}}
   const number=this.phase==='store'&&this.purchases===3?rounds[3].values[this.selection]:this.number;
   if(number){const spots=[[541,397],[531,361],[525,396]],p=spots[this.vehicle];c.save();c.fillStyle='#fff8e5';c.beginPath();c.arc(p[0],p[1],12,0,Math.PI*2);c.fill();c.fillStyle='#244c51';c.font='bold 17px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(number),p[0],p[1]+1);c.restore();}
  }
  draw(){if(!this.shopReady)return super.draw();if(['race','podium'].includes(this.phase))return this.drawRace();
   const c=this.ctx,bg=this.images.room;c.clearRect(0,0,this.w,this.h);
   if(bg.complete&&bg.naturalWidth){const z=Math.max(this.w/bg.naturalWidth,this.h/bg.naturalHeight);c.drawImage(bg,(this.w-bg.naturalWidth*z)/2,(this.h-bg.naturalHeight*z)/2,bg.naturalWidth*z,bg.naturalHeight*z);}
   if(this.purchases===0&&this.phase!=='store')return;
   const old=this.color;if(this.phase==='store'&&this.purchases===1)this.color=rounds[1].values[this.selection];
   c.save();c.translate(this.ox,this.oy-(this.phase==='store'?60*this.scale:0));c.scale(this.scale,this.scale);this.drawAssembly(c,0);c.restore();this.color=old;
  }
  topCar(c,x,y,angle,index,tint=0){super.topCar(c,x,y,angle,index,tint);if(index===this.vehicle&&this.number){c.save();c.translate(x,y);c.rotate(angle-Math.PI/2);c.fillStyle='#fff8e5';c.beginPath();c.arc(0,3,7,0,Math.PI*2);c.fill();c.fillStyle='#244c51';c.textAlign='center';c.font='bold 10px sans-serif';c.fillText(String(this.number),0,6);c.restore();}}
  destroy(){clearTimeout(this.rewardTimer);super.destroy();}
 };
 // A separate local demonstration needs no spelling round and never earns progress.
 if(new URLSearchParams(location.search).get('proef')==='winkel'&&['localhost','127.0.0.1'].includes(location.hostname)){
  document.addEventListener('DOMContentLoaded',()=>{document.body.dataset.view='world';const demo=new window.SpellingWorkshop({count:20,onChallenge:()=>demo.solve('proefwoord'),onFinish:()=>location.reload(),onStop:()=>location.href='?spel=workshop'});demo.choose(0);demo.done=5;demo.coins=50;demo.phase='store';demo.selection=0;demo.renderControls();
   const note=document.createElement('div');note.className='store-demo';note.innerHTML='Winkelproef <button>Volgende winkelkeuze</button>';demo.root.append(note);note.querySelector('button').onclick=()=>{if(demo.purchases>=4){demo.startRace();return;}demo.done=(demo.purchases+1)*5;demo.coins=50;demo.phase='store';demo.selection=0;demo.renderControls();};
  });
 }
})();
