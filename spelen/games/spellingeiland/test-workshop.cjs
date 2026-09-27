const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.url());});
 const base='http://127.0.0.1:8765/spelen/games/spellingeiland/index.html?spel=workshop';await page.goto(base);
 await page.evaluate(()=>localStorage.setItem('zisa-spelling-settings-v1',JSON.stringify({mode:'workshop',count:20,categories:['mmkm']})));await page.goto(base);
 await page.evaluate(()=>{const A=SpellingWorkshop;window.SpellingWorkshop=class extends A{constructor(o){super(o);window.testShop=this;}};const make=SpellingEngine.makeExercise;SpellingEngine.makeExercise=(...a)=>(window.ex=make(...a));speechSynthesis.speak=u=>setTimeout(()=>u.onend?.(),10);});
 while(await page.locator('#setup-next').count())await page.locator('#setup-next').click();await page.locator('#start').click();await page.locator('dialog button').last().click();
 await page.waitForFunction(()=>testShop.rects&&Object.values(testShop.images).every(i=>i.complete&&i.naturalWidth));assert.equal(await page.locator('[data-move]').count(),0);await page.waitForFunction(()=>testShop.raceRects);assert.equal(await page.locator('[data-vehicle]').count(),3);await page.screenshot({path:path.join(__dirname,'preview-voertuigkeuze.png')});await page.locator('[data-vehicle="1"]').click();
 async function testCircuit(){
  await page.waitForFunction(()=>testShop.raceTime>3.1);const start=await page.evaluate(()=>({...testShop.carState}));await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>testShop.carState.speed),0);
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(700);await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowUp');assert(await page.evaluate(()=>testShop.carState.speed)>0);assert(Math.abs(await page.evaluate(()=>testShop.carState.angle)-start.angle)>.1);
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(900);await page.keyboard.up('ArrowDown');assert.equal(await page.evaluate(()=>testShop.carState.speed),0);await page.screenshot({path:path.join(__dirname,'preview-echt-circuit.png')});
  const result=await page.evaluate(()=>{testShop.startRace();testShop.raceTime=4;let steps=0;for(;steps<18000&&testShop.phase==='race';steps++){const car=testShop.carState,near=testShop.project(car.x,car.y),target=testShop.atDistance(near.progress+65),want=Math.atan2(target.y-car.y,target.x-car.x),diff=Math.atan2(Math.sin(want-car.angle),Math.cos(want-car.angle));testShop.held.clear();testShop.held.add('gas');if(Math.abs(diff)>.025)testShop.held.add(diff>0?'right':'left');testShop.updateRace(.02);}testShop.held.clear();return{phase:testShop.phase,progress:testShop.carState.progress,length:testShop.trackLength,steps};});assert.equal(result.phase,'podium',JSON.stringify(result));assert(result.progress>=result.length*3);
 }
 if(process.argv.includes('--circuit')){await page.evaluate(()=>{testShop.done=20;testShop.built=Array.from({length:20},(_,i)=>i);testShop.startRace();});await testCircuit();assert.deepEqual(errors,[]);console.log('Circuit geslaagd: stilstaan zonder gas, gas, sturen, remmen en drie volledige ronden tegen computers.');await browser.close();return;}
 if(process.argv.includes('--preview')){
  for(let vehicle=0;vehicle<3;vehicle++){
   await page.evaluate(vehicle=>{testShop.choose(vehicle);testShop.done=5;testShop.built=Array.from({length:5},(_,i)=>i);testShop.phase='paint';testShop.renderControls();},vehicle);
   await page.waitForTimeout(80);await page.screenshot({path:path.join(__dirname,'preview-voertuig-'+vehicle+'.png')});
  }
  await page.evaluate(()=>{testShop.choose(1);testShop.side=1;testShop.done=6;testShop.built=[0,1,2,3,4,5];testShop.phase='plan';testShop.renderControls();});
  await page.waitForTimeout(100);await page.screenshot({path:path.join(__dirname,'preview-binnenkant.png')});
  await page.evaluate(()=>{testShop.done=20;testShop.built=Array.from({length:20},(_,i)=>i);testShop.phase='paint';testShop.renderControls();});
  await page.waitForTimeout(100);await page.screenshot({path:path.join(__dirname,'preview-montage-klaar.png')});
  const shown=await page.evaluate(()=>{const original=testShop.partImage,seen=[];testShop.partImage=(c,kit)=>seen.push(kit);testShop.drawAssembly(testShop.ctx,1,false);testShop.partImage=original;return seen;});assert(!shown.includes(10)&&!shown.includes(11),'Motor en veren mogen niet bovenop de gesloten auto staan');
  await page.evaluate(()=>testShop.startRace());await page.waitForTimeout(4200);await page.screenshot({path:path.join(__dirname,'preview-eilandrace.png')});assert.deepEqual(errors,[]);await browser.close();return;
 }
 await page.screenshot({path:path.join(__dirname,'preview-echte-werkplaats.png')});
 for(let i=0;i<20;i++){
  if(await page.evaluate(()=>testShop.phase==='turn'))await page.locator('#world-action').click();
  await page.locator('#world-action').click();await page.locator('#check').waitFor();
  const ex=await page.evaluate(()=>window.ex);for(const letter of ex.answer)await page.locator('[data-token]:not(:disabled)').filter({hasText:new RegExp('^'+letter+'$')}).first().click();await page.locator('#check').click();await page.waitForFunction(()=>testShop.phase==='assemble'&&document.body.dataset.view==='world');
  if(i===0){
   const from=await page.locator('#shop-part').boundingBox(),target=await page.evaluate(()=>testShop.screen(testShop.part().x,testShop.part().y));await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:12});await page.mouse.up();
  }else await page.locator('#world-action').click();
  if(i>0&&i<5){assert.equal(await page.evaluate(()=>testShop.phase),'tighten');for(let turn=0;turn<3;turn++)await page.locator('#world-action').click();}
  if(i%5===4){
   assert.equal(await page.evaluate(()=>testShop.built.length),i+1);assert.equal(await page.evaluate(()=>testShop.phase),i===19?'paint':'checkpoint');if(i===19){await page.locator('[data-color="125"]').click();assert.equal(await page.evaluate(()=>testShop.color),125);}else assert(await page.locator('#shop-colors').isHidden());
   await page.screenshot({path:path.join(__dirname,'preview-wagen-gebouwd.png')});
   for(const viewport of [{width:768,height:1024},{width:390,height:844},{width:1910,height:980}]){await page.setViewportSize(viewport);assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));const b=await page.locator('#world-action').boundingBox();assert(b.y+b.height<=viewport.height);}
   await page.setViewportSize({width:1024,height:768});await page.locator('#world-action').click();await page.waitForFunction(()=>testShop.phase!=='drive',{},{timeout:10000});
  }
 }
 assert.equal(await page.evaluate(()=>testShop.phase),'race');await testCircuit();await page.locator('#world-action').click();await page.locator('#again').waitFor();assert.match(await page.locator('.celebration').innerText(),/20 bouwkaarten/);assert.deepEqual(errors,[]);console.log('Werkplaats geslaagd: drie voertuigkeuzes, twintig bouwkaarten, één uitgebreid voertuig, drie tussentests, kleuren, racebesturing, computertegenstanders, sterren, finish en vier schermmaten.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
