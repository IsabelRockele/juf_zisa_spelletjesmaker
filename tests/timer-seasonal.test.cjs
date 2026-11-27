const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const W=require('../timer-seasonal.js');
test('short timers have one or two visits; longer timers get more with quiet gaps',()=>{
 assert.equal(W.schedule(60).length,2);assert.equal(W.schedule(120).length,4);assert.ok(W.schedule(600).length>W.schedule(300).length);
 for(const duration of [1,60,90,120,300,600,10800]){
  const visits=W.schedule(duration);visits.forEach((v,i)=>{assert.ok(v.start>0&&v.start+v.length<duration);assert.ok(v.length<=16);if(i)assert.ok(v.start>visits[i-1].start+visits[i-1].length);assert.equal(W.frame((v.start+v.length/2)/duration,duration).visit.kind,v.kind)});
  assert.equal(W.frame(0,duration).visit,null);assert.equal(W.frame(1,duration).visit,null);
 }
 assert.equal(new Set(W.schedule(300).map(v=>v.kind)).size,6);
});
test('all worlds have deterministic pauseable PNG scenes, complete and reset',()=>{
 for(const theme of W.themes){for(const p of [0,.05,.1,.25,.5,.75,.99,1]){
  const a=W.scene(theme,p,300),b=W.scene(theme,p,300);assert.deepEqual(a,b);assert.ok(a.caption);
  for(const item of a.items){if(item.foreground)continue;assert.ok(W.atlas[item.sheet]?.[item.cell]);assert.ok([item.x,item.y,item.h,item.opacity??1].every(Number.isFinite));assert.ok(item.h>0);}
 }assert.ok(W.scene(theme,1,300).frame.complete);assert.equal(W.scene(theme,0,300).frame.delivered,0);}
});
test('horse uses distinct leg poses and traverses the scene; no visit at pause boundary or finish',()=>{
 const d=300,v=W.schedule(d).find(v=>v.kind===4),at=t=>W.scene('sint',(v.start+t)/d,d).items.find(i=>i.sheet==='sint-poses');
 assert.notEqual(at(1).cell,at(1.25).cell);assert.ok(at(2).x<at(12).x);assert.equal(W.frame(1,d).visit,null);
});
test('entry pages load PNG renderer before shared controller without changing access controls',()=>{
 for(const file of ['timer.html','pro/timer.html','ontdek/timer.html']){const html=fs.readFileSync(file,'utf8');for(const theme of W.themes)assert.ok(html.includes(`data-theme="${theme}"`));assert.ok(html.indexOf('timer-seasonal.js')<html.indexOf('timer-worlds.js'));}
 assert.ok(fs.readFileSync('pro/timer.html','utf8').includes('guard.js'));assert.ok(fs.readFileSync('ontdek/timer.html','utf8').includes('tijd-ontdek.js'));
});

test('Piet leaves gifts at doors only after putting them down, and restart clears them',()=>{
 const d=300,deliveries=W.schedule(d).filter(v=>v.kind===2);
 const gifts=p=>W.scene('sint',p,d).items.filter(i=>i.placed);
 assert.equal(W.schedule(d)[0].start,2);
 for(const [i,v] of deliveries.entries()){
  assert.equal(gifts((v.start+v.length*.59)/d).length,i);
  assert.equal(gifts((v.start+v.length*.61)/d).length,i+1);
  const gift=gifts((v.start+v.length*.61)/d)[i];
  assert.equal(gift.x,[235,625,990][i%3]+Math.floor(i/3)*20);assert.equal(gift.y,492);
  assert.deepEqual(gifts(1)[i],gift);
 }
 assert.equal(gifts(0).length,0);
});
test('rabbit reaches the ornament on a ladder, then the ornament stays at the hand position',()=>{
 const d=300,v=W.schedule(d)[0],at=t=>W.scene('christmas',(v.start+t*v.length)/d,d).items;
 const before=at(.61),rabbit=before.find(i=>i.sheet==='christmas-climb'&&i.cell===2);
 assert.ok(before.some(i=>i.sheet==='christmas-ladder'));
 const ball=at(.63).find(i=>i.placed);
 assert.equal(ball.x,rabbit.x+50);assert.equal(ball.y,rabbit.y-82);
 assert.deepEqual(W.scene('christmas',1,d).items.find(i=>i.placed),ball);
 assert.equal(W.scene('christmas',0,d).items.filter(i=>i.placed).length,0);
});

test('horse returns facing backwards, roof walk stays on right house, tree Piet returns above the canopy',()=>{
 const d=600,visits=W.schedule(d),at=(v,t)=>W.scene('sint',(v.start+v.length*t)/d,d);
 const horses=visits.filter(v=>v.kind===4);
 const horse=(v,t)=>at(v,t).items.find(i=>i.sheet==='sint-poses');
 assert.equal(horse(horses[0],.5).flip,false);assert.equal(horse(horses[1],.5).flip,true);
 assert.ok(horse(horses[1],.25).x>horse(horses[1],.75).x);
 const roof=visits.find(v=>v.kind===3);
 for(const t of [.2,.4]){const p=at(roof,t).items.find(i=>i.actor==='piet');assert.ok(p.x>850&&p.x<1200&&p.y<250);}
 assert.ok(at(roof,.65).items.some(i=>i.sheet==='piet-climb-cycle'));
 assert.ok(at(roof,.95).items.find(i=>i.actor==='piet').y>480);
 const tree=visits.find(v=>v.kind===5),peek=t=>at(tree,t).items.find(i=>i.rotation);
 assert.equal(peek(.5).rotation,Math.PI);assert.ok(peek(.98).y<peek(.5).y);
});
test('squirrel deposits exactly the same independent gift and leaves empty-handed',()=>{
 const d=300,v=W.schedule(d)[1],at=t=>W.scene('christmas',(v.start+t*v.length)/d,d).items;
 const held=at(.679).find(i=>i.carriedGift),placed=at(.681).find(i=>i.placedGift);
 for(const key of ['sheet','cell','x','y','h'])assert.equal(held[key],placed[key]);
 assert.equal(at(.9).filter(i=>i.carriedGift).length,0);
 assert.ok(at(.9).some(i=>i.sheet==='squirrel-walk-cycle'&&i.cell>=4));
 const finalGift=W.scene('christmas',1,d).items.find(i=>i.placedGift);for(const key of ['sheet','cell','x','y','h'])assert.equal(finalGift[key],placed[key]);assert.equal(finalGift.opacity,1);
});
test('rabbit feet follow the leaning ladder while ascending and descending',()=>{
 const d=300,v=W.schedule(d)[4],at=t=>W.scene('christmas',(v.start+t*v.length)/d,d).items;
 const foot=t=>{const p=at(t).find(i=>i.sheet==='christmas-climb'&&i.cell<6);return {x:p.x+[-12,-6,0,6,-13,-5][p.cell],y:p.y};};
 assert.ok(foot(.4).x>foot(.25).x);assert.ok(foot(.4).y<foot(.25).y);
 assert.ok(foot(.82).x<foot(.7).x);assert.ok(foot(.82).y>foot(.7).y);
});

test('each Easter egg is unique, keeps its artwork and stays in the basket after release',()=>{
 const d=600,v=W.schedule(d)[0],at=t=>W.scene('easter',(v.start+t*v.length)/d,d).items;
 for(const t of [.01,.12,.3,.65,.749,.751,.9]){
  const eggs=at(t).filter(i=>i.eggId!==undefined);
  assert.equal(eggs.length,6);assert.equal(new Set(eggs.map(i=>i.eggId)).size,6);
 }
 const held=at(.749).find(i=>i.eggId===0),placed=at(.751).find(i=>i.eggId===0);
 assert.equal(held.sheet,placed.sheet);assert.equal(held.cell,placed.cell);assert.equal(held.h,placed.h);
 assert.ok(Math.abs(held.x-placed.x)<.1&&Math.abs(held.y-placed.y)<.1);
 assert.ok(placed.inBasket);assert.equal(at(.9).filter(i=>i.carriedEgg).length,0);
 assert.deepEqual(W.scene('easter',1,d).items.find(i=>i.eggId===0),at(.95).find(i=>i.eggId===0));
});

test('Piet grips one gift, lowers it to the exact resting position and releases before walking away',()=>{
 const d=300,v=W.schedule(d)[0],at=t=>W.scene('sint',(v.start+t*v.length)/d,d).items;
 const held=t=>at(t).find(i=>i.carriedGift);
 assert.ok(held(.3).y<held(.47).y);assert.ok(held(.47).y<held(.58).y);
 const last=held(.599),placed=at(.601).find(i=>i.placed);
 for(const key of ['sheet','cell','x','y','h'])assert.equal(last[key],placed[key]);
 assert.equal(at(.7).filter(i=>i.carriedGift).length,0);
 assert.ok(at(.8).some(i=>i.sheet==='piet-walk-cycle'&&i.cell>=4&&i.flip));
});
test('ladder has one fixed size at every branch; chicks leave the screen and rabbit stays outside basket',()=>{
 const d=600,visits=W.schedule(d);
 const ladders=visits.filter(v=>v.index%2===0).map(v=>W.scene('christmas',(v.start+v.length*.5)/d,d).items.find(i=>i.sheet==='christmas-ladder'));
 assert.equal(new Set(ladders.map(i=>i.h)).size,1);
 const v=W.schedule(d,'easter')[1],chick=t=>W.scene('easter',(v.start+v.length*t)/d,d).items.find(i=>i.sheet==='easter-poses');
 assert.ok(chick(.01).y-chick(.01).h>675);assert.ok(chick(.99).y-chick(.99).h>675);assert.equal(chick(.99).opacity,undefined);
 const bunny=visits[0];for(const t of [.65,.75,.82,.9]){
  const p=W.scene('easter',(bunny.start+bunny.length*t)/d,d).items.find(i=>i.actor==='rabbit');
  assert.ok(p.x<=877);
 }
});

test('Piet uses one opaque complete figure without cross-fades and walk frames follow distance',()=>{
 const d=300,v=W.schedule(d)[0],phases=new Set();
 for(let t=.01;t<1;t+=.01){
  const items=W.scene('sint',(v.start+t*v.length)/d,d).items.filter(i=>i.actor==='piet');
  assert.equal(items.length,1);assert.equal(items[0].opacity??1,1);
  if(items[0].sheet==='piet-walk-cycle')phases.add(items[0].walkPhase);
 }
 assert.equal(phases.size,4);
});
test('snowman visits the tree, looks up, turns and exits; rabbit and butterfly finish outside scene',()=>{
 const d=300,visits=W.schedule(d),at=(theme,v,t)=>W.scene(theme,(v.start+t*v.length)/d,d).items;
 const snow=t=>at('christmas',visits[3],t).find(i=>i.actor==='snowman');
 assert.ok(snow(.01).x>1200);assert.equal(snow(.46).cell,4);
 assert.ok(snow(.8).flip);assert.ok(snow(.99).x>1200);
 const rabbit=at('easter',visits[0],.999).find(i=>i.actor==='rabbit');
 assert.ok(rabbit.y-rabbit.h>675);
 const butterfly=at('easter',W.schedule(d,'easter').find(v=>v.kind===2),.999).find(i=>i.actor==='butterfly');
 assert.ok(butterfly.x>1250);assert.equal(butterfly.opacity,undefined);
});

test('egg stays at the crouching paws until the rabbit changes to its raised-arm pose',()=>{
 const d=300,v=W.schedule(d)[0],at=t=>W.scene('easter',(v.start+t*v.length)/d,d).items;
 for(const t of [.121,.16,.20,.239]){
  const items=at(t),egg=items.find(i=>i.carriedEgg),rabbit=items.find(i=>i.actor==='rabbit');
  assert.equal(rabbit.cell,0);assert.equal(egg.y,460);
  assert.ok(items.indexOf(egg)<items.indexOf(rabbit));
 }
 const raised=at(.241);assert.equal(raised.find(i=>i.actor==='rabbit').sheet,'easter-walk-cycle');
 assert.ok(raised.find(i=>i.carriedEgg).y<460);
});
test('chicks pass in the foreground in front of the basket without being clipped by it',()=>{
 const d=300,v=W.schedule(d,'easter')[1];
 for(const t of [.6,.65,.7,.75,.8]){
  const items=W.scene('easter',(v.start+t*v.length)/d,d).items;
  const chicks=items.find(i=>i.actor==='chicks'),basket=items.find(i=>i.basketFront);
  assert.ok(chicks.x-60>500&&chicks.x+60<890&&chicks.y>500);assert.ok(items.indexOf(chicks)>items.indexOf(basket));
  assert.equal(chicks.clip,undefined);
 }
});

test('squirrel lowers the gift with its whole-body poses and draws paws in front of the gift',()=>{
 const d=300,v=W.schedule(d)[1],at=t=>W.scene('christmas',(v.start+t*v.length)/d,d).items;
 let previous=0;
 for(const pair of [[.41,.44],[.48,.51],[.56,.66]]){
  const a=at(pair[0]),b=at(pair[1]),gift=a.find(i=>i.carriedGift),next=b.find(i=>i.carriedGift);
  const actor=a.find(i=>i.actor==='squirrel');
  assert.equal(gift.y,next.y);assert.ok(gift.y>previous);previous=gift.y;
  assert.equal(actor.sheet,'squirrel-gift-poses');assert.equal(actor.includesGift,true);assert.equal(gift.opacity,0);
  assert.equal(a.filter(i=>i.actor==='squirrel').length,1);assert.ok(a.indexOf(gift)<a.indexOf(actor));
 }
 assert.equal(at(.7).find(i=>i.actor==='squirrel').cell,3);
 assert.equal(at(.7).find(i=>i.placedGift).y,530);
});

test('penguin tows the complete sled group through the square and completely off screen',()=>{
 const d=300,v=W.schedule(d)[7],at=t=>W.scene('christmas',(v.start+t*v.length)/d,d).items.find(i=>i.actor==='penguin-sled');
 const start=at(.001),end=at(.999);
 assert.ok(start.y-start.h>675);
 assert.ok(end.y-end.h>675);
 const frames=new Set();for(let t=.01;t<1;t+=.01)frames.add(at(t).cell);assert.equal(frames.size,4);
 assert.equal(at(.5).opacity,undefined);
});

test('penguin and chicks follow the open central paths rather than the planted borders',()=>{
 const d=300,visits=W.schedule(d);
 for(let t=0;t<1;t+=.02){
  const penguin=W.scene('christmas',(visits[7].start+t*visits[7].length)/d,d).items.find(i=>i.actor==='penguin-sled');
  if(penguin&&penguin.y-penguin.h<675){const half=penguin.h*887/443/2;assert.ok(penguin.x-half>225&&penguin.x+half<1000);}
  const chicks=W.scene('easter',(W.schedule(d,'easter')[1].start+t*W.schedule(d,'easter')[1].length)/d,d).items.find(i=>i.actor==='chicks');
  if(chicks)assert.ok(chicks.x-60>500&&chicks.x+60<890);
 }
});

test('six larger differently colored eggs keep their individual artwork when collected',()=>{
 const start=W.scene('easter',0,600).items.filter(i=>i.eggId!==undefined);
 const finish=W.scene('easter',1,600).items.filter(i=>i.eggId!==undefined);
 assert.equal(new Set(start.map(i=>i.cell)).size,6);
 for(const egg of start){assert.equal(egg.sheet,'easter-colorful-eggs');assert.equal(egg.h,52);const end=finish.find(i=>i.eggId===egg.eggId);assert.equal(end.cell,egg.cell);assert.equal(end.sheet,egg.sheet);assert.equal(end.h,egg.h);}
});
test('squirrel placing sequence uses whole PNGs with baked-in grip and never doubles the package',()=>{
 const d=300,v=W.schedule(d)[1];
 for(const t of [.42,.5,.58,.7,.76]){
  const items=W.scene('christmas',(v.start+t*v.length)/d,d).items;
  const actor=items.find(i=>i.actor==='squirrel');
  assert.ok(actor.includesGift);assert.equal(actor.sheet,'squirrel-gift-poses');
  assert.equal(items.filter(i=>(i.carriedGift||i.placedGift)&&(i.opacity??1)>0).length,0);
 }
 const after=W.scene('christmas',(v.start+.9*v.length)/d,d).items;
 assert.equal(after.filter(i=>i.placedGift&&i.opacity===1).length,1);
});
test('Easter has frequent varied visits without changing the other worlds',()=>{
 for(const d of [30,60,120,300,600]){
  const plan=W.schedule(d,'easter');assert.equal(plan.length,Math.floor(d/20));
  plan.forEach((v,i)=>{assert.ok(v.start+v.length<d);if(i)assert.equal(v.start-plan[i-1].start-plan[i-1].length,4);});
 }
 assert.equal(W.schedule(300).length,10);assert.equal(W.schedule(300,'easter').length,15);
 assert.deepEqual(W.schedule(300,'easter').slice(0,8).map(v=>v.kind),[0,1,0,2,0,1,0,3]);
});
test('new Easter visitors follow continuous edge routes and pause deterministically',()=>{
 const d=300,plan=W.schedule(d,'easter'),bee=plan.find(v=>v.kind===3),group=plan.filter(v=>v.kind===1)[1];
 const at=(v,t)=>W.scene('easter',(v.start+t*v.length)/d,d);
 for(const t of [.001,.5,.999]){
  const state=at(bee,t);assert.deepEqual(state,at(bee,t));
  const b=state.items.find(i=>i.actor==='bee');assert.ok(b);assert.equal(b.opacity,undefined);
  if(t<.01)assert.ok(b.x+b.h*800/660/2<0);
  if(t>.99)assert.ok(b.x-b.h*800/660/2>1200);
 }
 for(let t=0;t<1;t+=.01){
  const c=at(group,t).items.find(i=>i.actor==='chicks-following');assert.ok(c.x-50>500&&c.x+50<890);
 }
 const eggs=W.scene('easter',.95,d).items.filter(i=>i.inBasket);assert.equal(eggs.length,6);assert.equal(new Set(eggs.map(i=>i.eggId)).size,6);
});
test('pot mouse peeks then retreats behind the foreground without fading',()=>{
 const at=seconds=>W.scene('easter',seconds/300,300).items;
 assert.ok(!at(11.9).some(i=>i.actor==='pot-mouse'));
 for(const time of [12.001,16,20.999]){
  const items=at(time),chick=items.find(i=>i.actor==='pot-mouse');
  assert.ok(chick);assert.equal(chick.opacity,undefined);
  assert.ok(items.findIndex(i=>i.flowerpotFront)>items.indexOf(chick));
  assert.equal(chick.x,1135);
  if(time<13||time>20)assert.ok(chick.y-chick.h>255);
  else assert.ok(chick.y-chick.h<220);
 }
 assert.ok(!at(21).some(i=>i.actor==='pot-mouse'));
});
test('Easter rabbit leaves via the open central path, clear of the flower borders',()=>{
 const d=300;
 for(const v of W.schedule(d,'easter').filter(v=>v.kind===0)){
  for(let t=.801;t<1;t+=.002){
   const rabbit=W.scene('easter',(v.start+t*v.length)/d,d).items.find(i=>i.actor==='rabbit');
   assert.ok(rabbit.x>580);
   // The path narrows between the foreground flower beds below y=590.
   if(rabbit.y>590)assert.ok(rabbit.x+65<790);
  }
  const last=W.scene('easter',(v.start+.999*v.length)/d,d).items.find(i=>i.actor==='rabbit');
  assert.ok(last.y-last.h>675);
 }
});
test('egg covers the far paw while the complete rabbit keeps its near paw in front',()=>{
 const d=300,v=W.schedule(d,'easter')[0];
 for(const t of [.2,.4,.69]){
  const items=W.scene('easter',(v.start+t*v.length)/d,d).items;
  const egg=items.find(i=>i.carriedEgg),front=items.find(i=>i.eggGripFront),rabbit=items.find(i=>i.actor==='rabbit');
  assert.ok(items.indexOf(egg)<items.indexOf(rabbit)&&items.indexOf(front)>items.indexOf(rabbit));
  for(const key of ['sheet','cell','x','y','h'])assert.equal(front[key],egg[key]);
  assert.equal(items.filter(i=>i.actor==='rabbit').length,1);
 }
 assert.ok(!W.scene('easter',(v.start+.8*v.length)/d,d).items.some(i=>i.eggGripFront));
});
