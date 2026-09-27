const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1024,height:768}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/spelen/games/spellingeiland/?spel=workshop');
if(process.argv.includes('--preferences')){
 await page.evaluate(()=>{localStorage.setItem('zisa-spelling-settings-v1',JSON.stringify({mode:'workshop',count:5,categories:['mmkm']}));localStorage.setItem('zisa-recent-words-v1',JSON.stringify(['bloem','stoel']));});await page.reload();
 await page.locator('#setup-next').click();assert.deepEqual(await page.locator('[data-count]').evaluateAll(bs=>bs.map(b=>Number(b.dataset.count))),[10,15,20]);assert.equal(await page.locator('[data-count="10"]').getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{window.queueRecent=null;const original=SpellingEngine.makeQueue;SpellingEngine.makeQueue=(...a)=>{queueRecent=a[3];return original(...a);};});
 await page.locator('#start').click();assert.deepEqual(await page.evaluate(()=>queueRecent),['bloem','stoel']);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: oude 5 wordt 10, alleen 10/15/20, woordgeheugen na herladen gebruikt.');return;
}
await page.evaluate(()=>localStorage.setItem('zisa-spelling-settings-v1',JSON.stringify({mode:'workshop',count:20,categories:['mmkm']})));await page.reload();
await page.evaluate(()=>{const A=SpellingWorkshop;window.SpellingWorkshop=class extends A{constructor(o){super(o);window.shop=this;}};const make=SpellingEngine.makeExercise;SpellingEngine.makeExercise=(...a)=>(window.ex=make(...a));speechSynthesis.speak=u=>setTimeout(()=>u.onend?.(),10);});
while(await page.locator('#setup-next').count())await page.locator('#setup-next').click();await page.locator('#start').click();await page.locator('dialog button').last().click();
await page.waitForFunction(()=>Object.values(shop.images).every(i=>i.complete&&i.naturalWidth));assert(await page.locator('#vehicle-choice').isHidden());
for(let i=1;i<=20;i++){
 await page.waitForFunction(()=>document.body.dataset.view==='play');
 const ex=await page.evaluate(()=>window.ex);
 for(const letter of ex.answer)await page.locator('[data-token]:not(:disabled)').filter({hasText:new RegExp('^'+letter+'$')}).first().click();
 await page.locator('#check').click();await page.waitForFunction(n=>shop.done===n,i);
 if(i%5===0){await page.locator('#garage-store').waitFor();assert.equal(await page.evaluate(()=>shop.coins),50);
 await page.locator('[data-option="1"]').click();if(i===5)assert.equal(await page.evaluate(()=>shop.vehicle),1);
 await page.screenshot({path:__dirname+'/shop-'+i+'.png'});
 await page.locator('#buy-choice').click();assert.equal(await page.evaluate(()=>shop.coins),0);
 if(i<20)await page.locator('#world-action').click();
 }
}
assert.equal(await page.evaluate(()=>shop.phase),'ready');assert.equal(await page.evaluate(()=>shop.purchases),4);
await page.locator('#world-action').click();await page.waitForTimeout(3300);assert.equal(await page.evaluate(()=>shop.carState.speed),0);
await page.keyboard.down('ArrowUp');await page.waitForTimeout(700);await page.keyboard.down('ArrowRight');await page.waitForTimeout(300);await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowUp');assert(await page.evaluate(()=>shop.carState.speed)>0);
for(const count of [10,15,20]){const result=await page.evaluate(count=>{shop.destroy();window.shop=new SpellingWorkshop({count,onChallenge:()=>{},onStop:()=>{},onFinish:()=>{}});shop.choose(0);for(let i=0;i<count;i++){shop.phase='question';shop.solve('woord');clearTimeout(shop.rewardTimer);if((i+1)%5===0)shop.buy();}return {phase:shop.phase,coins:shop.coins,purchases:shop.purchases};},count);assert.deepEqual(result,{phase:'ready',coins:0,purchases:count/5});}
for(const size of [{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){await page.setViewportSize(size);await page.evaluate(()=>{shop.purchases=2;shop.done=15;shop.coins=50;shop.phase='store';shop.selection=1;shop.renderControls();});const box=await page.locator('#garage-store').boundingBox();assert(box.y>=0&&box.y+box.height<=size.height);await page.screenshot({path:__dirname+'/shop-'+size.width+'.png'});}
assert.deepEqual(errors,[]);console.log('PASS: 20 echte oefeningen, 4 aankopen, alle rondelengtes, racegas en sturen, 3 schermformaten');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
