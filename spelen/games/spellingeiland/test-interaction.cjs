const {chromium}=require(require.resolve('playwright',{paths:[process.env.NODE_PATH||'C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});
 const base='http://127.0.0.1:8765/spelen/games/spellingeiland/index.html',errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);

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
 async function prep(mode,cat){
  await page.evaluate(({mode,cat})=>localStorage.setItem('zisa-spelling-settings-v1',JSON.stringify({mode,categories:[cat],count:10})),{mode,cat});await page.goto(base);
  await page.evaluate(()=>{const A=SpellingAdventure;window.SpellingAdventure=class extends A{constructor(o){super(o);window.testWorld=this;}};const W=SpellingWorkshop;window.SpellingWorkshop=class extends W{constructor(o){super(o);window.testWorld=this;}};const orig=SpellingEngine.makeExercise;SpellingEngine.makeExercise=(...args)=>(window.testExercise=orig(...args));speechSynthesis.speak=u=>{window.lastSpoken=u.text;setTimeout(()=>u.onend?.(),20);};});
  while(await page.locator('#setup-next').count())await page.locator('#setup-next').click();await page.locator('#start').click();while(await page.locator('dialog[open]').count())await page.locator('dialog button').last().click();await reachTask();
 }
 await prep('detective','kort');
 assert.equal(await page.locator('.key-row').first().locator('[data-key]').allTextContents().then(x=>x.join('')),'azertyuiop');
 assert.equal(await page.locator('.key-row').nth(1).locator('[data-key]').allTextContents().then(x=>x.join('')),'qsdfghjklm');
 assert(await page.locator('#listen.listen-needed').count());assert(await page.locator('#listen img.speaker-png').count());await page.locator('#listen').click();assert.equal(await page.locator('#listen.listen-needed').count(),0);
 const answer=await page.evaluate(()=>testExercise.answer),wrong=answer[0]+'z'+answer.slice(2);
 await page.locator('#answer').click();await page.keyboard.type(wrong);await page.locator('#check').click();
 assert(await page.locator('.repairing').count());assert.equal(await page.locator('.answer-letter.missing').count(),1);
 assert.equal(await page.locator('.answer-letter.confirmed').count(),answer.length-1);
 await page.screenshot({path:path.join(__dirname,'preview-repair.png')});
 await page.locator('[data-key="'+answer[1]+'"]').click();await page.locator('#check').click();
 assert.equal(await page.locator('#next').count(),0);assert(await page.locator('.word-sparkles').count());

 await page.locator('.success-message').waitFor({state:'hidden'});await reachTask();
 assert.match(await page.locator('.task-meta').innerText(),/Opdracht 2 van 10/);assert(await page.locator('#listen.listen-needed').count());
 // A letter can also be replaced before checking, with no backspacing through the word.
 const second=await page.evaluate(()=>testExercise.answer);await page.locator('#answer').click();await page.keyboard.type('z'+second.slice(1));await page.locator('[data-edit="0"]').click();await page.locator('[data-key="'+second[0]+'"]').click();
 await page.locator('#check').click();assert(await page.locator('.success-message').count());await page.locator('.success-message').waitFor({state:'hidden'});await reachTask();
 // Pausing a success animation must not silently move past the word.
 const third=await page.evaluate(()=>testExercise.answer);await page.locator('#answer').click();await page.keyboard.type(third);await page.locator('#check').click();await page.locator('#stop').click();
 await page.waitForTimeout(2100);assert(await page.locator('dialog[open]').count());await page.locator('dialog button').first().click();await page.locator('.success-message').waitFor({state:'hidden'});await reachTask();assert.match(await page.locator('.task-meta').innerText(),/Opdracht 4 van 10/);
 // In the workshop, correct blocks remain and incorrect blocks return to the bank.
 await prep('workshop','mmkm');const ex=await page.evaluate(()=>testExercise);
 for(let i=ex.answer.length-1;i>=0;i--)await page.locator('[data-token]:not(:disabled)').filter({hasText:new RegExp('^'+ex.answer[i]+'$')}).first().click();
 await page.locator('#check').click();assert(await page.locator('.slot.needs-fill').count());
 for(let i=0;i<ex.answer.length;i++)if(!(await page.locator('[data-slot="'+i+'"]').innerText()))await page.locator('[data-token]:not(:disabled)').filter({hasText:new RegExp('^'+ex.answer[i]+'$')}).first().click();
 await page.locator('#check').click();assert(await page.locator('.success-message').count());await page.screenshot({path:path.join(__dirname,'preview-machine.png')});await page.locator('.success-message').waitFor({state:'hidden'});await reachTask();
 assert.equal(errors.length,0,errors.join('\n'));console.log('Geslaagd: AZERTY, luisterknop, gerichte lettercorrectie, letter vervangen, automatisch doorgaan, animaties, pauzeren en husselwoorden herstellen.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
