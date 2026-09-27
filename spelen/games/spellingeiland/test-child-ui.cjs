const {chromium}=require(require.resolve('playwright',{paths:[process.env.NODE_PATH||'C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});
 const base='http://127.0.0.1:8765/spelen/games/',errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.url());});
 async function fits(label){const size=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,off:[...document.querySelectorAll('main button,main a,main input')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().bottom>innerHeight+2).map(e=>e.textContent)}));assert(size.sw<=size.w+1&&size.sh<=size.h+1&&!size.off.length,label+' '+JSON.stringify(size));}

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
 for(const viewport of [{width:1024,height:768},{width:1180,height:700},{width:768,height:1024},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  await page.goto(base+'eilanden-leerjaar2.html');await fits('world '+JSON.stringify(viewport));
  const logo=await page.locator('.brand img').boundingBox();assert(logo.width<50&&logo.height<60);
  for(const island of ['spelling','rekenen','puzzelen']){
   await page.goto(base+'eilanden-leerjaar2.html#'+island);await page.locator('.game-spot').first().waitFor();await fits(island);
   if(viewport.width===1024)await page.screenshot({path:path.join(__dirname,'preview-'+island+'.png')});
  }
  for(const [mode,category] of [['detective','kort'],['workshop','mmkm'],['workshop','ei-ij'],['workshop','aai'],['workshop','kort'],['workshop','je'],['workshop','lidwoord']]){
   await page.evaluate(({mode,category})=>localStorage.setItem('zisa-spelling-settings-v1',JSON.stringify({mode,categories:[category],count:5})),{mode,category});
   await page.goto(base+'spellingeiland/index.html');await page.evaluate(()=>{const A=SpellingAdventure;window.SpellingAdventure=class extends A{constructor(o){super(o);window.testWorld=this;}};const W=SpellingWorkshop;window.SpellingWorkshop=class extends W{constructor(o){super(o);window.testWorld=this;}};});await fits('wizard 1');
   await page.locator('#setup-next').click();
   const groups=await page.locator('[data-group]').count();for(let i=0;i<groups;i++){await page.locator('[data-group="'+i+'"]').click();await fits('group '+i);}
   if(viewport.width===1024&&mode==='detective')await page.screenshot({path:path.join(__dirname,'preview-categories.png')});
   await page.locator('#setup-next').click();await fits('wizard 3');
   if(viewport.width===1024)await page.screenshot({path:path.join(__dirname,'preview-departure-'+mode+'.png')});
   await page.locator('#start').click();await dismiss();await reachTask();await fits('task '+mode+' '+category);
   if(mode==='detective'){
    for(let i=0;i<2;i++){await page.locator('[data-key="clear"]').click();await page.locator('#answer').click();await page.keyboard.type('zzzzzzzzzzzz');await page.locator('#check').click();await fits('wrong '+i);}
    await page.locator('#retry').click();await fits('retry');
    if(viewport.width===1024)await page.screenshot({path:path.join(__dirname,'preview-keyboard.png')});
   }
  }
 }
 assert.equal(errors.length,0,errors.join('\n'));console.log('Geslaagd: geen scrollen of buiten beeld vallende knoppen op 4 schermformaten; 3 eilanden, 3 keuzestappen, 7 oefenvormen, hints en opnieuw schrijven. Zisa-logo correct begrensd.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
