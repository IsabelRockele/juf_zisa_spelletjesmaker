/* One coherent PNG car, assembled from matching regions after each exercise. */
(() => {
 const Base=window.SpellingWorkshop;
 const feature=(name,path)=>({name,path});
 const details=[
  feature('het portier','M1090 221 L1256 221 L1264 354 Q1263 369 1250 369 L1110 369 Q1094 369 1093 351 Z'),
  feature('het zijraam','M1111 134 L1183 134 Q1198 134 1209 149 L1246 200 Q1256 215 1239 215 L1119 215 Q1105 215 1105 201 L1105 146 Q1105 135 1111 134 Z'),
  feature('het achterste spatbord','M831 376 L831 341 C841 277 886 242 947 244 C1013 244 1051 284 1059 344 L1066 394 L1036 394 C1036 327 1006 290 949 287 C895 285 862 317 853 380 Z'),
  feature('het voorste spatbord','M1267 394 L1276 342 C1284 279 1321 249 1380 246 C1448 243 1484 287 1490 350 L1492 374 L1471 379 C1464 323 1434 286 1381 287 C1327 287 1296 326 1290 394 Z'),
  feature('de achterbumper','M781 306 L832 307 L832 371 L782 361 Z'),
  feature('de voorbumper','M1490 297 L1516 297 L1516 367 L1490 376 Z'),
  feature('het achterlicht','M792 231 L820 232 L816 290 L789 292 Z'),
  feature('de koplamp','M1441 235 L1496 242 L1500 279 L1467 270 Z'),
  feature('de deurklink','M1098 235 L1144 235 L1144 256 L1098 256 Z'),
  feature('het dak','M1078 116 L1186 116 Q1203 115 1217 130 L1234 149 L1216 150 L1197 135 L1098 134 L1090 158 L1069 158 Z')
 ];
 const parts=[{name:'het onderstel',region:[779,376,737,26]},
  {name:'de achterband rechts',wheel:0,far:true},{name:'de voorband rechts',wheel:1,far:true},
  {name:'de achterband links',wheel:0},{name:'de voorband links',wheel:1},
  {name:'de laadbak',region:[779,116,298,260],shell:true},
  {name:'de motorkap',region:[1267,116,249,260],shell:true},
  {name:'de cabine',region:[1077,116,190,260],shell:true},
  details[9],details[0],details[1],details[2],details[3],details[4],details[5],details[6],details[7],details[8],
  {name:'de vier velgen',rims:true},{name:'het racenummer',number:true}
 ];
 const models=[
 {name:'Raceauto',badge:[524,403],details:[
  feature('de kuipstoel','M329 242 L446 242 L448 282 L433 315 L360 315 L336 290 Z'),
  feature('het stuur','M446 269 L501 269 L509 314 L438 314 Z'),
  feature('het achterste spatbord','M77 424 L79 360 C82 322 116 302 166 299 C223 298 257 331 269 381 L266 432 L246 432 L246 392 C241 346 217 317 171 316 C125 315 100 343 96 388 L96 424 Z'),
  feature('het voorste spatbord','M498 432 L498 384 C502 335 535 300 583 299 C637 297 675 327 676 380 L676 430 L659 430 L659 389 C651 343 623 318 585 318 C544 318 520 346 516 386 L516 432 Z'),
  feature('de achterbumper','M36 337 L79 349 L79 424 L57 417 L36 387 Z'),
  feature('de voorbumper','M700 376 L752 376 L752 432 L681 432 L681 410 L703 410 Z'),
  feature('de koplamp','M674 330 L738 351 L746 373 L691 353 Z'),
  feature('de luchtinlaat','M269 331 L352 331 L388 373 L388 394 L293 384 Z'),
  feature('de achterspoiler','M36 242 L330 242 L324 293 L193 301 L142 282 L68 281 L70 324 L36 324 Z'),
  feature('de motorkap','M501 285 L659 285 L674 325 L660 338 L623 314 L550 314 L515 332 Z')
 ],regions:[[36,242,232,182],[268,242,232,182],[500,242,252,182]],chassis:[36,424,716,8],sections:['de achterkant','de cockpit','de neus']},
 {name:'Monstertruck',badge:[531,361],details,parts},
 {name:'Strandbuggy',badge:[560,371],details:[
  feature('de kuipstoel','M289 650 L325 650 L386 740 L398 754 L372 775 L313 752 Z'),
  feature('het stuur','M465 671 L505 671 L530 704 L548 731 L527 761 L483 737 L463 757 L452 733 Z'),
  feature('het achterste spatbord','M58 730 L89 720 C189 699 252 718 290 793 L301 847 L276 852 C256 785 233 749 172 750 C119 750 94 770 81 808 L58 799 Z'),
  feature('het voorste spatbord','M516 852 L536 795 C560 739 601 714 650 720 C710 726 746 747 755 790 L755 813 L734 803 C728 766 695 748 652 746 C602 746 569 781 541 852 Z'),
  feature('de achterbumper','M49 774 L63 774 L95 807 L94 837 L73 821 L49 800 Z'),
  feature('de bodembalk','M274 836 L549 836 L549 856 L274 856 Z'),
  feature('de dwarsbalk','M310 785 L320 775 L513 829 L513 841 Z'),
  feature('de zijbalk','M311 754 L505 754 L524 764 L510 782 L316 772 Z'),
  feature('de veiligheidsbeugel','M82 700 L149 653 L231 592 Q250 581 276 584 L448 612 Q477 615 488 640 L520 674 L511 694 L472 652 Q460 635 435 632 L276 606 Q254 600 240 609 L161 670 L103 714 L84 714 Z'),
  feature('de beugelsteun','M191 642 L207 635 L258 680 L269 704 L253 713 Z')
 ],regions:[[49,584,251,272],[300,584,240,272],[540,584,215,272]],chassis:[49,856,706,8],sections:['het achterframe','het middenframe','de voorkant']}
 ];
 for(const m of models)if(!m.parts)m.parts=[{name:'het onderstel',region:m.chassis},...parts.slice(1,5),...m.regions.map((region,i)=>({name:m.sections[i],region,shell:true})),m.details[8],m.details[0],m.details[1],m.details[2],m.details[3],m.details[4],m.details[5],m.details[6],m.details[7],m.details[9],{name:'de vier velgen',rims:true},{name:'het racenummer',number:true}];
 const colors=[['Oceaanblauw',0],['Frambozenroze',125],['Appelgroen',280]];
 window.SpellingWorkshop=class extends Base {
  constructor(opts){super(opts);this.buildReady=true;this.installed=new Set();this.rewardParts=[];this.colorChosen=false;this.color=null;this.number=7;this.buildPreview=false;
   this.root.classList.add('parts-workshop');
   const panel=document.createElement('section');panel.id='build-color';panel.hidden=true;
   panel.innerHTML='<h2>Welke kleur krijgt jouw auto?</h2><div>'+colors.map(([name,value])=>'<button data-paint="'+value+'" aria-pressed="'+false+'">'+name+'</button>').join('')+'</div><button class="primary" id="keep-paint" disabled>Deze kleur!</button>';
   this.root.append(panel);this.paintPanel=panel;
   panel.querySelectorAll('[data-paint]').forEach(b=>b.onclick=()=>{this.color=Number(b.dataset.paint);panel.querySelector('#keep-paint').disabled=false;panel.querySelectorAll('[data-paint]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn===b)));});
   panel.querySelector('#keep-paint').onclick=()=>{if(this.phase!=='paint-choice'||this.color===null)return;this.colorChosen=true;this.nextBuild();};
   const reward=document.createElement('section');reward.id='build-reward';reward.setAttribute('aria-live','polite');reward.innerHTML='<span>Verdiend!</span><strong></strong><canvas width="320" height="180" aria-label="Jouw nieuwe onderdeel"></canvas>';this.root.append(reward);this.rewardPanel=reward;
   this.vehicle=1;this.built=[];this.phase='choose';this.renderControls();
   this.drawChoices();
  }
  choose(i){if(!this.buildReady)return super.choose(i);if(this.phase!=='choose'||!models[i])return;super.choose(i);this.built=[];this.phase='earn';this.renderControls();if(!this.buildPreview)this.challenge();}
  get buildModel(){return models[this.vehicle]||models[1];}
  batch(n){const start=Math.floor((n-1)*parts.length/this.count),end=Math.floor(n*parts.length/this.count);return Array.from({length:end-start},(_,i)=>start+i);}
  challenge(){if(this.phase!=='earn')return;this.phase='question';this.onChallenge();}
  act(){if(!this.buildReady)return super.act();if(this.phase==='earn')this.challenge();else if(this.phase==='ready')this.pickTrack();else if(this.phase==='podium'){this.phase='complete';this.onFinish();}}
  solve(word){if(this.phase!=='question'||this.done>=this.count)return;this.word=word;this.done++;this.rewardParts=this.batch(this.done);this.rewardParts.forEach(i=>this.installed.add(i));this.rewardTime=0;this.phase='reward';this.renderControls();this.drawReward();}
  nextBuild(){this.rewardParts=[];this.phase=this.done>=this.count?'ready':'earn';this.renderControls();if(this.phase==='earn'&&!this.buildPreview)this.challenge();}
  finishReward(){if(this.phase!=='reward')return;if(!this.colorChosen&&this.done>=Math.ceil(this.count/2)){this.phase='paint-choice';this.renderControls();}else this.nextBuild();}
  updateRace(dt){if(!this.buildReady)return super.updateRace(dt);if(this.phase==='reward'&&document.body.dataset.view==='world'){this.rewardTime+=dt;if(this.rewardTime>=3.5+this.rewardParts.length*.2)this.finishReward();}else super.updateRace(dt);}
  renderControls(){if(!this.buildReady||!this.paintPanel)return super.renderControls();
   this.root.dataset.buildPhase=this.phase;const previewPanel=this.root.querySelector('.build-demo');if(previewPanel)previewPanel.hidden=['choose','race','podium'].includes(this.phase);
   if(['race','podium'].includes(this.phase)){super.renderControls();this.paintPanel.hidden=true;this.rewardPanel.hidden=true;return;}
   this.root.querySelector('#vehicle-choice').hidden=this.phase!=='choose';
   for(const id of ['#race-controls','#shop-tray','#shop-colors'])this.root.querySelector(id).hidden=true;
   this.root.querySelector('.shop-coach').hidden=this.phase==='choose';this.root.querySelector('.shop-actions').hidden=!['earn','ready'].includes(this.phase);
   this.root.querySelector('.world-hud strong').textContent=this.phase==='choose'?'Kies jouw auto':('Bouw jouw '+this.buildModel.name.toLowerCase()+'!');
   this.root.querySelector('#world-parts').textContent=this.done+' / '+this.count;this.root.querySelector('.world-score small').textContent='woorden';
   this.root.querySelector('#shop-project').textContent=this.done===0?'Een woord, een onderdeel!':this.installed.size+' / '+parts.length+' onderdelen';
   this.paintPanel.hidden=this.phase!=='paint-choice';this.rewardPanel.hidden=this.phase!=='reward';
   const demoPanel=this.root.querySelector('.build-demo');if(demoPanel)demoPanel.hidden=['choose','race','podium'].includes(this.phase);
   this.action.hidden=false;this.action.textContent=this.phase==='ready'?'Naar de race!':this.buildPreview?'Verdien een onderdeel':'Oefenen en bouwen';
   const names=this.rewardParts.map(i=>this.buildModel.parts[i].name).join(' en ');
   this.message(this.phase==='choose'?'Kies een auto. Oefen, bouw en race!':this.phase==='reward'?'Goed gewerkt! Je verdient '+names+'.':this.phase==='paint-choice'?'Halverwege! Jij kiest de kleur.':this.phase==='ready'?'Compleet! Jij bestuurt de auto in de race.':'Maak een woord. Dan komt er een onderdeel bij.');
   if(this.phase==='reward')this.rewardPanel.querySelector('strong').textContent=names;
  }
  sourceTransform(c){const g=this.vehicleGeometry(this.vehicle);c.translate(525-(g.r[0]+g.r[2]/2)*g.scale,g.cy-(g.r[1]+g.r[3]/2)*g.scale);c.scale(g.scale,g.scale);}
  drawPart(c,i){const model=this.buildModel,details=model.details,p=model.parts[i],im=this.images.sideCars;if(!im?.complete||!im.naturalWidth)return;
   if(p.wheel!==undefined){const w=this.vehicleGeometry(this.vehicle).wheels[p.wheel],dx=p.far?-14:0,dy=p.far?-7:0;c.save();if(p.far)c.filter='brightness(.65)';
    // Tyre and hub are earned separately; matching crops preserve the same axle centre.
    c.beginPath();c.rect(w.x-w.d/2+dx,w.y-w.d/2+dy,w.d,w.d);if(!p.far||!this.installed.has(18))c.arc(w.x+dx,w.y+dy,w.d*.233,0,Math.PI*2);c.clip('evenodd');this.partImage(c,1,w.x+dx,w.y+dy,w.d,w.d);c.restore();return;}
   if(p.rims){for(const far of [false])for(const w of this.vehicleGeometry(this.vehicle).wheels){const x=w.x-(far?14:0),y=w.y-(far?7:0);c.save();if(far)c.filter='brightness(.65)';c.beginPath();c.arc(x,y,w.d*.235,0,Math.PI*2);c.clip();this.partImage(c,1,x,y,w.d,w.d);c.restore();}return;}
   if(p.number){c.save();c.fillStyle='#fff8e5';c.beginPath();c.arc(...model.badge,12,0,Math.PI*2);c.fill();c.fillStyle='#244c51';c.textAlign='center';c.textBaseline='middle';c.font='bold 17px sans-serif';c.fillText(String(this.number),model.badge[0],model.badge[1]+1);c.restore();return;}
   c.save();this.sourceTransform(c);if(p.path)c.clip(new Path2D(p.path));else{c.beginPath();c.rect(...p.region);c.clip();}
   if(p.shell||(this.vehicle===1&&p===details[0])){const mask=new Path2D();mask.rect(...this.vehicleGeometry(this.vehicle).r);for(const d of details){if(this.vehicle===1&&p.shell&&d===details[8])continue;if(!p.shell&&d!==details[8])continue;mask.addPath(new Path2D(d.path));}c.clip(mask,'evenodd');}
   c.drawImage(this.carPaint(im,this.color===null?'primer':this.color,this.vehicle,false),0,0);c.restore();
  }
  drawAssembly(c){
   // Far wheels go behind the body; near wheels and their arches stay in front.
   const order=[1,2,0,5,6,7,8,9,10,13,14,15,16,17,3,4,11,12,18,19];
   for(const i of order){if(!this.installed.has(i))continue;c.save();const pos=this.rewardParts.indexOf(i);if(this.phase==='reward'&&pos>=0){const u=Math.max(0,Math.min(1,(this.rewardTime-.65-pos*.2)/1.3)),ease=1-Math.pow(1-u,3);c.translate(160*(1-ease),-85*Math.sin((1-ease)*Math.PI/2));c.globalAlpha=Math.min(1,u*4);}this.drawPart(c,i);c.restore();}
  }
  drawReward(){const cv=this.rewardPanel.querySelector('canvas'),c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);const temp=document.createElement('canvas');temp.width=900;temp.height=620;const tc=temp.getContext('2d');this.rewardParts.forEach(i=>this.drawPart(tc,i));const data=tc.getImageData(0,0,900,620).data;let l=900,t=620,r=0,b=0;for(let y=0;y<620;y++)for(let x=0;x<900;x++)if(data[(y*900+x)*4+3]>10){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}if(r>=l){const w=r-l+1,h=b-t+1,z=Math.min(290/w,155/h);c.drawImage(temp,l,t,w,h,(320-w*z)/2,(180-h*z)/2,w*z,h*z);}}
  draw(){if(!this.buildReady)return super.draw();if(['race','podium'].includes(this.phase))return this.drawRace();const c=this.ctx,bg=this.images.room;c.clearRect(0,0,this.w,this.h);if(bg.complete&&bg.naturalWidth){const z=Math.max(this.w/bg.naturalWidth,this.h/bg.naturalHeight);c.drawImage(bg,(this.w-bg.naturalWidth*z)/2,(this.h-bg.naturalHeight*z)/2,bg.naturalWidth*z,bg.naturalHeight*z);}
   c.save();c.translate(this.ox,this.oy-35*this.scale);c.scale(this.scale,this.scale);
   c.fillStyle='#e4eddf';c.strokeStyle='#618d7c';c.lineWidth=2;c.beginPath();c.roundRect(295,420+this.vehicleGeometry(this.vehicle).wheels[0].d/2,470,18,9);c.fill();c.stroke();
   if(this.phase!=='choose')this.drawAssembly(c);c.restore();
  }
  topCar(c,x,y,angle,index,tint=0){super.topCar(c,x,y,angle,index,tint);if(index===this.vehicle){c.save();c.translate(x,y);c.rotate(angle-Math.PI/2);c.fillStyle='#fff8e5';c.beginPath();c.arc(0,3,7,0,Math.PI*2);c.fill();c.fillStyle='#244c51';c.textAlign='center';c.font='bold 10px sans-serif';c.fillText(String(this.number),0,6);c.restore();}}
  destroy(){clearTimeout(this.startTimer);super.destroy();}
 };
 const query=new URLSearchParams(location.search);
 if(['bouw','winkel','race'].includes(query.get('proef'))&&['localhost','127.0.0.1'].includes(location.hostname))document.addEventListener('DOMContentLoaded',()=>{
  document.body.dataset.view='world';const demo=new window.SpellingWorkshop({count:[10,15,20].includes(Number(query.get('aantal')))?Number(query.get('aantal')):20,onChallenge:()=>demo.solve('proefwoord'),onFinish:()=>location.reload(),onStop:()=>location.href='?spel=workshop'});demo.buildPreview=true;
  const panel=document.createElement('aside');panel.className='build-demo';panel.innerHTML='<span>Bouwproef · zonder oefeningen</span><p>Tik onderaan om een onderdeel te verdienen.</p><button id="demo-reset">Opnieuw bouwen</button><button id="demo-race">Meteen de race testen</button>';demo.root.append(panel);
  panel.querySelector('#demo-reset').onclick=()=>location.reload();
  panel.querySelector('#demo-race').onclick=()=>{if(demo.phase==='choose')demo.choose([0,1,2].includes(Number(query.get('auto')))?Number(query.get('auto')):1);demo.installed=new Set(parts.map((_,i)=>i));demo.done=demo.count;demo.rewardParts=[];demo.colorChosen=true;demo.pickTrack();panel.hidden=true;};
  demo.renderControls();if(query.get('proef')==='race')panel.querySelector('#demo-race').click();
 });
})();
