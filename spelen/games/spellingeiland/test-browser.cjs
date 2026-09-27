/* Run against preview.cjs. Uses the locally available Playwright package. */
const {chromium}=require(require.resolve('playwright',{paths:[process.env.NODE_PATH||'C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
 const base='http://127.0.0.1:8765/spelen/games/';
 await page.goto(base+'eilanden-leerjaar2.html');
 assert.equal(await page.locator('.island-link').count(),3);
 await page.screenshot({path:path.join(__dirname,'preview-islands.png'),fullPage:true});
 await page.getByRole('link',{name:/Spellingeiland/}).click();
 await page.getByRole('link',{name:/De Woordenwerkplaats/}).click();
 assert(await page.locator('.setup-shell').count());
 await page.screenshot({path:path.join(__dirname,'preview-settings.png'),fullPage:true});
 const categoryIds=await page.evaluate(()=>SpellingData.categories.map(c=>c.id));
 let tasks=0;

 async function reachTask(){
  if(await page.locator('#check').count())return;
  if(await page.locator('.real-workshop').count()){
   while(await page.evaluate(()=>['assemble','tighten'].includes(testWorld.phase)))await page.locator('#world-action').click();
   if(await page.evaluate(()=>testWorld.phase==='paint')){await page.locator('#world-action').click();await page.waitForFunction(()=>testWorld.phase!=='drive');}
   if(await page.evaluate(()=>testWorld.phase==='plan'))await page.locator('#world-action').click();return;
  }
  await page.evaluate(()=>{testWorld.phase='explore';testWorld.collected.add(testWorld.done);testWorld.x=testWorld.gates[testWorld.done].x-100;});
  await page.locator('#world-action').waitFor({state:'visible'});await page.locator('#world-action').click();
 }
 async function dismiss(){while(await page.locator('dialog[open]').count())await page.locator('dialog button').last().click();}
 async function prepare(mode,ids,count=5){
  await page.evaluate(({mode,ids,count})=>localStorage.setItem('zisa-spelling-settings-v1',JSON.stringify({mode,categories:ids,count})),{mode,ids,count});
  await page.goto(base+'spellingeiland/index.html');
  await page.evaluate(()=>{const A=SpellingAdventure;window.SpellingAdventure=class extends A{constructor(o){super(o);window.testWorld=this;}};const W=SpellingWorkshop;window.SpellingWorkshop=class extends W{constructor(o){super(o);window.testWorld=this;}};const make=SpellingEngine.makeExercise;SpellingEngine.makeExercise=(...args)=>{window.testItem=args[0];return window.testExercise=make(...args);};});
  while(await page.locator('#setup-next').count())await page.locator('#setup-next').click();
  await page.locator('#start').click();await dismiss();await reachTask();
 }
 async function answer(){
  const ex=await page.evaluate(()=>testExercise);
  if(await page.locator('#answer').count()){
    await page.locator('#answer').click();await page.keyboard.type(ex.answer);
  }else if(ex.type==='choice'||ex.type==='gap')await page.locator('[data-choice]').filter({hasText:new RegExp('^'+ex.answer+'$')}).click();
  else if(ex.type==='sentences'){
    for(let i=0;i<2;i++){await page.locator('[data-token]').filter({hasText:new RegExp('^'+ex.pair.words[i]+'$')}).click();await page.locator('[data-slot="'+i+'"]').click();}
  }else{
    for(const letter of ex.answer){const tile=page.locator('[data-token]:not(:disabled)').filter({hasText:new RegExp('^'+letter+'$')}).first();await tile.click();}
  }
  await page.locator('#check').click();assert(await page.locator('.success-message').count(),'Answer rejected: '+JSON.stringify(ex));tasks++;
  await page.locator('.success-message').waitFor({state:'hidden'});await dismiss();if(await page.evaluate(()=>testWorld.done<testWorld.count))await reachTask();
 }
 if(!process.argv.includes('--visual')){
 if(!process.argv.includes('--finish'))for(const mode of ['workshop','detective']){
  for(const id of categoryIds){
   await prepare(mode,[id]);
   for(let i=0;i<5;i++)await answer();
   if(mode==='workshop'){while(await page.evaluate(()=>['assemble','tighten'].includes(testWorld.phase)))await page.locator('#world-action').click();await page.locator('#world-action').click();}
   else await page.evaluate(()=>{testWorld.phase='finale';testWorld.finishTime=5.1;});await page.locator('#again').waitFor();
   assert(await page.locator('#again').count());
  }
 }
 // Wrong answer -> hint -> model -> independent recall, and delayed repeat within 20.
 await prepare('detective',['kort'],20);
 const first=await page.evaluate(()=>testExercise.answer);
 for(let i=0;i<2;i++){await page.locator('[data-key="clear"]').click();await page.locator('#answer').click();await page.keyboard.type('zzz');await page.locator('#check').click();}
 assert(await page.locator('#retry').count());
 await page.locator('#retry').click();assert.equal(await page.locator('#answer .filled').count(),0);
 assert(!(await page.locator('.task-card').innerText()).includes(first),'Answer leaked after model');
 await page.locator('#answer').click();await page.keyboard.type(first);await page.locator('#check').click();await page.locator('.success-message').waitFor({state:'hidden'});
 for(let i=1;i<20;i++){
   await dismiss();await reachTask();if(i===3){assert.equal(await page.evaluate(()=>testItem.repeat),true);assert.equal(await page.evaluate(()=>testExercise.answer),first);}
   await answer();
 }
 assert.equal(await page.evaluate(()=>testWorld.done),20);
 }
 // Actual pointer drag, including duplicate-safe token IDs and a mobile-sized screen.
 await prepare('workshop',['mmkm']);
 const ex=await page.evaluate(()=>testExercise),token=ex.tokens.findIndex(t=>t===ex.answer[0]);
 const from=await page.locator('[data-token="'+token+'"]').boundingBox(),to=await page.locator('[data-slot="0"]').boundingBox();
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:10});await page.mouse.up();
 assert.equal(await page.locator('[data-slot="0"]').innerText(),ex.answer[0]);
 await page.screenshot({path:path.join(__dirname,'preview-game.png'),fullPage:true});
 await page.setViewportSize({width:768,height:1024});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#stop').click();await page.locator('dialog button').last().click();assert(await page.locator('#start').count());
 assert.equal(errors.length,0,errors.join('\n'));
 console.log(process.argv.includes('--visual')?'Geslaagd: nieuwe eilandkaart, links, slepen, tikbediening, schermformaten en stoppen.':`Geslaagd: ${tasks} opdrachten; hints, modelantwoord, zelfstandig opnieuw schrijven, herhaling binnen 20 opdrachten, slepen, schermformaten en links.`);
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
