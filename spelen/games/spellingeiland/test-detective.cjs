const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:8765/spelen/games/spellingeiland/index.html?spel=detective';await page.goto(base);await page.evaluate(()=>localStorage.setItem('zisa-spelling-settings-v1',JSON.stringify({mode:'detective',count:5,categories:['kort']})));await page.goto(base);
 await page.evaluate(()=>{const A=SpellingAdventure;window.SpellingAdventure=class extends A{constructor(o){super(o);window.world=this;}};const make=SpellingEngine.makeExercise;SpellingEngine.makeExercise=(...a)=>(window.ex=make(...a));speechSynthesis.speak=u=>setTimeout(()=>u.onend?.(),10);});
 while(await page.locator('#setup-next').count())await page.locator('#setup-next').click();await page.locator('#start').click();await page.locator('dialog button').last().click();await page.waitForFunction(()=>Object.values(world.images).every(i=>i.complete&&i.naturalWidth));
 if(process.argv.includes('--ending')){
  await page.evaluate(()=>{cancelAnimationFrame(world.raf);world.phase='finale';world.root.querySelector('.world-controls').hidden=true;});
  for(const time of [0,2.6,3.8,6,9.9,11.2,12.5]){
   await page.evaluate(t=>{world.finishTime=t;world.draw();},time);await page.screenshot({path:path.join(__dirname,'preview-slot-'+time+'.png')});
   const state=await page.evaluate(t=>({scene:world.finaleState(t),width:world.vw}),time);
   for(const actor of [state.scene.z,state.scene.p])if(!actor.air&&!actor.seated)assert(actor.x<=190||actor.x>=state.width-220,'Een staand personage moet op een eiland staan');
  }
  assert.deepEqual(errors,[]);console.log('Slot gecontroleerd: zeven momenten, instappen, passagiers, uitstappen en grondcontact.');await browser.close();return;
 }
 for(let i=0;i<5;i++){
  await page.waitForFunction(()=>world.phase==='explore');
  await page.keyboard.down('ArrowRight');
  if(i%2){await page.waitForFunction(i=>world.x>=world.items[i].x-90,i,{timeout:15000});await page.keyboard.press('Space');}
  await page.waitForFunction(i=>world.collected.has(i),i,{timeout:15000});
  await page.waitForFunction(()=>!document.querySelector('#world-action').hidden&&document.querySelector('#world-action').textContent!=='Zoek het spoor');await page.keyboard.up('ArrowRight');
  assert.equal(await page.evaluate(()=>world.collected.size),i+1);await page.locator('#world-action').click();await page.locator('#answer').waitFor();await page.locator('#answer').click();await page.keyboard.type(await page.evaluate(()=>ex.answer));await page.locator('#check').click();await page.waitForFunction(()=>document.body.dataset.view==='world');
  if(i===2){
   await page.waitForFunction(()=>world.trip?.step==='enter');await page.waitForFunction(()=>world.trip?.step==='ride');await page.waitForTimeout(700);await page.screenshot({path:path.join(__dirname,i===2?'preview-zisa-in-boot.png':'preview-zisa-in-ballon.png')});
   await page.waitForFunction(()=>world.trip?.step==='exit');await page.waitForFunction(()=>world.phase==='explore');assert.equal(await page.evaluate(()=>world.y),410);
  }
 }
 await page.keyboard.down('ArrowRight');await page.locator('#world-action').waitFor({state:'visible'});await page.keyboard.up('ArrowRight');await page.screenshot({path:path.join(__dirname,'preview-pip-gevonden.png')});await page.locator('#world-action').click();await page.waitForFunction(()=>world.storyStep===2);await page.screenshot({path:path.join(__dirname,'preview-pip-terugvaart.png')});await page.waitForFunction(()=>world.storyStep===3&&world.finishTime>10.5);await page.screenshot({path:path.join(__dirname,'preview-pip-thuis.png')});await page.locator('#again').waitFor({timeout:18000});assert.match(await page.locator('.celebration').innerText(),/5 sporen/);assert.deepEqual(errors,[]);console.log('Detective geslaagd: sporen zoeken, op platforms springen, brug, poort, schatkist, instappen, varen/vliegen, uitstappen en Pip vinden.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
