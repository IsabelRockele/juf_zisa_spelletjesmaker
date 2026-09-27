const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1024,height:768}}),base='http://127.0.0.1:8765/spelen/games/',errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 if(process.argv.includes('--small-prices')){
  await page.addInitScript(()=>{Math.random=()=>.999;});await page.goto(base+'bibi-winkel.html');await page.locator('[data-mode="budget"]').click();await page.locator('[data-level="10"]').click();
  const milk=page.locator('[data-buy]').filter({has:page.getByText('melk',{exact:true})}),cookies=page.locator('[data-buy]').filter({has:page.getByText('koekjes',{exact:true})});assert.equal(await milk.locator('strong').textContent(),'€ 1');assert.equal(await cookies.locator('strong').textContent(),'€ 2');await milk.click();await cookies.click();await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('te veel'));await cookies.click();await page.locator('#pay').click();await page.waitForTimeout(2100);
  assert((await page.locator('.budget-amount').textContent()).includes('€ 3'));await milk.click();await cookies.click();await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('Dat kan je kopen'));assert.equal(await page.locator('.basket-goods img').count(),2);
  await page.goto(base+'bibi-winkel.html');await page.locator('[data-mode="pay"]').click();await page.locator('[data-level="20"]').click();assert(await page.locator('#pay').isVisible());assert.deepEqual(errors,[]);await browser.close();console.log('PASS 1 + 2 euro shopping combination and larger baskets');return;
 }
 if(process.argv.includes('--shopping')){
  for(const width of [1024,390]){
   await page.setViewportSize({width,height:width===390?844:768});await page.goto(base+'bibi-winkel.html');assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2));await page.locator('[data-mode="pay"]').click();await page.locator('[data-level="20"]').click();assert.equal(await page.locator('#checkout').count(),0);assert.equal(await page.locator('.basket-goods img').count(),0);
   let left=(await page.locator('.price').allTextContents()).reduce((n,s)=>n+Number(s.replace(/\D/g,'')),0);const count=await page.locator('.shop-product').count();for(const n of [10,5,2,1])while(left>=n){await page.locator(`[data-money="${n}"]`).click();left-=n;}await page.locator('#pay').click();assert.equal(await page.locator('.basket-goods img').count(),count);await page.waitForTimeout(2100);assert.equal(await page.locator('.basket-goods img').count(),0);
   await page.goto(base+'bibi-winkel.html');await page.locator('[data-mode="budget"]').click();await page.locator('[data-level="20"]').click();await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('Kies eerst'));for(const b of await page.locator('[data-buy]').all())await b.click();await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('te veel'));assert.equal(await page.locator('.basket-goods img').count(),0);
   const buttons=await page.locator('[data-buy]').all();for(const b of buttons)await b.click();await buttons[0].click();assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2));await page.screenshot({path:__dirname+'/budget-'+width+'.png'});await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('Dat kan je kopen'));assert.equal(await page.locator('.basket-goods img').count(),1);await page.waitForTimeout(2100);assert.equal(await page.locator('.basket-goods img').count(),0);assert.equal(await page.locator('[aria-pressed="true"]').count(),0);
  }
  assert.deepEqual(errors,[]);await browser.close();console.log('PASS direct checkout, basket after payment, budget overspend/correction/leftover, reset, two sizes');return;
 }
 if(process.argv.includes('--hint')){
  for(const width of [1024,390]){
   await page.setViewportSize({width,height:width===390?844:768});await page.goto(base+'bibi-winkel.html');await page.locator('[data-mode="change"]').click();await page.locator('[data-level="20"]').click();
   const cost=Number(await page.locator('[data-cost]').getAttribute('data-cost')),paid=Number(await page.locator('[data-tender]').getAttribute('data-tender'));
   await page.locator('[data-money="20"]').click();await page.locator('#pay').click();assert.deepEqual(await page.locator('#change-hint strong').allTextContents(),[`${paid} − ${cost} = …`,`${cost} + … = ${paid}`]);assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2));
   await page.locator('#change-hint button').last().click();await page.screenshot({path:__dirname+'/change-hint-'+width+'.png'});
   await page.locator('[data-piece]').click();assert(await page.locator('#change-hint').isVisible());let left=paid-cost;for(const n of [10,5,2,1])while(left>=n){await page.locator(`[data-money="${n}"]`).click();left-=n;}await page.locator('#pay').click();assert.equal(await page.locator('#change-hint').count(),0);await page.waitForTimeout(2100);assert.equal(await page.locator('#change-hint').count(),0);
   await page.locator('#count-help').click();assert(await page.locator('#change-hint').isVisible());
  }
  assert.deepEqual(errors,[]);await browser.close();console.log('PASS both hint equations, speech buttons, persistence, reset, tablet/mobile fit');return;
 }
 if(process.argv.includes('--images')){
  for(const mode of ['minimum','twoways'])for(const width of [1024,390]){
   await page.setViewportSize({width,height:width===390?844:768});await page.goto(base+'bibi-winkel.html');await page.locator(`[data-mode="${mode}"]`).click();await page.locator('[data-level="20"]').click();await page.waitForFunction(()=>[...document.images].every(im=>im.complete&&im.naturalWidth));
   assert(await page.locator('.customer-goods img').evaluateAll(ims=>ims.every(im=>getComputedStyle(im).objectFit==='contain')));await page.screenshot({path:__dirname+'/proportions-'+mode+'-'+width+'.png'});assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2));
  }
  assert.deepEqual(errors,[]);await browser.close();console.log('PASS proportions and layout for both payment modes');return;
 }
 if(process.argv.includes('--variety')){
  await page.addInitScript(()=>{const original=window.setTimeout;window.setTimeout=(fn,ms,...args)=>original(fn,ms===1900?50:ms,...args);});
  for(const mode of (process.argv.includes('--two-only')?['twoways']:['exchange','minimum','twoways','change']))for(const max of [10,20]){
   await page.setViewportSize({width:max===20?390:1024,height:max===20?844:768});await page.goto(base+'bibi-winkel.html');assert.equal(await page.locator('[data-mode]').count(),6);assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2));await page.locator(`[data-mode="${mode}"]`).click();await page.locator(`[data-level="${max}"]`).click();const amounts=[];
   const clear=async()=>{while(await page.locator('[data-piece]').count())await page.locator('[data-piece]').first().click();};
   const put=async ns=>{for(const n of ns)await page.locator(`[data-money="${n}"]`).click();};
   const greedy=n=>{const ns=[];for(const d of [20,10,5,2,1])while(n>=d){ns.push(d);n-=d;}return ns;};
   let step=0;
   while(!(await page.locator('#again').count())){
    assert(step<12);await page.locator('#pay:not(:disabled)').waitFor();const target=mode==='change'?Number(await page.locator('[data-tender]').getAttribute('data-tender'))-Number(await page.locator('[data-cost]').getAttribute('data-cost')):Number((await page.locator(mode==='exchange'?'.exchange-source strong':'.payment-target strong').textContent()).replace(/\D/g,''));
    const cost=mode==='change'?Number(await page.locator('[data-cost]').getAttribute('data-cost')):target;if(step<8)amounts.push(cost);
    let solution=greedy(target);
    if(mode==='exchange'){const src=await page.locator('.source-pieces img').evaluateAll(ims=>ims.map(im=>Number(im.alt.replace(/\D/g,''))));if(step===0){await put(src);await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('hetzelfde geld'));await clear();}if([...src].sort().join() === [...solution].sort().join())solution=Array(target).fill(1);if([...src].sort().join() === [...solution].sort().join())solution=[2,...Array(target-2).fill(1)];}
    if(mode==='minimum'&&step===0){await put(Array(target).fill(1));await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('minder'));await clear();}
    await put(solution);await page.locator('#pay').click();
    if(mode==='twoways'){assert(await page.locator('[data-way="1"].checked').isVisible());assert(await page.locator('[data-check-way="1"]').isDisabled());assert(await page.locator('[data-check-way="2"]').isEnabled());if(step===0){await put([...solution].reverse());await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('dezelfde manier'));await clear();}await put(Array(target).fill(1));await page.screenshot({path:__dirname+'/two-current.png'});assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'two methods fit');if(step===3)await page.screenshot({path:__dirname+'/two-methods-'+max+'.png'});await page.locator('#pay').click();}
    await page.waitForTimeout(120);step++;
   }
   assert.equal(new Set(amounts).size,8);assert.equal(step,mode==='change'?8:9);console.log('PASS unique rounds, validation and retry',mode,max);
  }
  assert.deepEqual(errors,[]);await browser.close();return;
 }
 if(process.argv.includes('--modes')){
  await page.addInitScript(()=>{const original=window.setTimeout;window.setTimeout=(fn,ms,...args)=>original(fn,ms===1900?50:ms,...args);});
  for(const mode of ['exchange','change'])for(const max of [10,20]){
   await page.setViewportSize({width:max===20?390:1024,height:max===20?844:768});await page.goto(base+'bibi-winkel.html');await page.locator(`[data-mode="${mode}"]`).click();await page.locator(`[data-level="${max}"]`).click();
   for(let i=0;i<8;i++){
    await page.locator('#pay:not(:disabled)').waitFor();let target;
    if(mode==='exchange'){target=Number((await page.locator('.exchange-source strong').textContent()).replace(/\D/g,''));assert.equal(await page.locator('[data-money]').count(),max===20?5:4);
     await page.locator(`[data-money="${target}"]`).click();await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('hetzelfde geld'));assert(await page.locator('#pay').isEnabled());await page.locator('[data-piece]').click();
     if(i===0){await page.locator(`[data-money="${max}"]`).click();await page.locator('[data-money="1"]').click();await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('Te veel'));while(await page.locator('[data-piece]').count())await page.locator('[data-piece]').first().click();}
    }
    else{target=Number(await page.locator('[data-tender]').getAttribute('data-tender'))-Number(await page.locator('[data-cost]').getAttribute('data-cost'));assert(target>0&&target<max);}
    if(i===0){await page.locator('#pay').click();assert(await page.locator('.feedback').textContent());await page.locator('[data-money="1"]').click();await page.locator('[data-piece]').click();assert.equal(await page.locator('[data-piece]').count(),0);}
    assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'no scroll '+mode+max);
    if(i===3)await page.screenshot({path:__dirname+'/'+mode+'-'+max+'.png'});
    let left=target;for(const n of [10,5,2,1])if((mode!=='exchange'||n<target)&&await page.locator(`[data-money="${n}"]`).count())while(left>=n){await page.locator(`[data-money="${n}"]`).click();left-=n;}
    await page.locator('#pay').click();await page.waitForTimeout(120);
   }
   assert(await page.locator('#again').isVisible());console.log('PASS',mode,max);
  }
  assert.deepEqual(errors,[]);await browser.close();return;
 }
 const fillBasket=async()=>{
  if(await page.locator('#pay').count())return;
  await page.locator('[data-product]').first().waitFor();assert.equal(await page.locator('.basket-goods img').count(),0);assert(await page.locator('#checkout').isDisabled());
  const buttons=await page.locator('[data-product]').all();for(const button of buttons)await button.click();assert.equal(await page.locator('.basket-goods img').count(),buttons.length);assert(await page.locator('#checkout').isEnabled());await page.screenshot({path:__dirname+'/filled-basket-'+page.viewportSize().width+'.png'});assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'shelf fits');await page.locator('#checkout').click();
 };
 if(process.argv.includes('--money')){
  for(const width of [1024,390]){
   await page.setViewportSize({width,height:width===390?844:768});await page.goto(base+'bibi-winkel.html');await page.locator('[data-mode="pay"]').click();await page.locator('[data-level="20"]').click();await fillBasket();
   await page.locator('[data-money="5"]').click();await page.locator('[data-money="5"]').click();assert.equal(await page.locator('.money-tray .note').count(),2);await page.screenshot({path:__dirname+'/notes-'+width+'.png'});
   await page.locator('.money-tray .note').first().click();await page.locator('.money-tray .note').first().click();
   const price=(await page.locator('.price').allTextContents()).reduce((n,s)=>n+Number(s.replace(/\D/g,'')),0);for(let n=0;n<price;n++)await page.locator('[data-money="1"]').click();await page.locator('#pay').click();await page.waitForTimeout(600);await page.screenshot({path:__dirname+'/basket-'+width+'.png'});await page.waitForTimeout(1500);
   await fillBasket();for(let n=0;n<22;n++)await page.locator('[data-money="1"]').click();assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'22 coins fit '+width);
   await page.locator('#island-menu-button').click();const url=page.url();await page.locator('.nav-speak').first().click();assert.equal(page.url(),url);assert(await page.locator('#island-menu').isVisible());
  }
  await browser.close();console.log('PASS individual notes, basket, 22 coins fit, speaker does not navigate');return;
 }
 const loaded=()=>page.waitForFunction(()=>[...document.images].every(im=>im.complete&&im.naturalWidth));
 if(!process.argv.includes('--prices'))for(const size of [{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){
  await page.setViewportSize(size);await page.goto(base+'start_leerjaar1.html');await loaded();assert.equal(await page.locator('[data-zone]').count(),4);await page.screenshot({path:__dirname+'/world-'+size.width+'.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'world scroll '+size.width);
  await page.locator('[data-zone="rekenen"]').click();await loaded();assert.equal(await page.locator('.bee-card').count(),3);assert((await page.locator('a[href*="wolkentrein"]').getAttribute('href')).includes('leerjaar=1'));await page.screenshot({path:__dirname+'/rekenen-'+size.width+'.png'});
  await page.goto(base+'bibi-winkel.html?leerjaar=1&eiland=rekenen');await page.locator('[data-mode="pay"]').click();await page.locator('[data-level="10"]').click();await fillBasket();await loaded();await page.screenshot({path:__dirname+'/shop-'+size.width+'.png'});assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'shop scroll '+size.width);for(const button of await page.locator('.money-bank button,#pay,#island-menu-button').all()){const b=await button.boundingBox();assert(b.width>=44&&b.height>=44);assert(b.y+b.height<=size.height);}
 }
 await page.setViewportSize({width:1024,height:768});
 for(const max of [10,20]){if(max===20)await page.setViewportSize({width:390,height:844});
  await page.goto(base+'bibi-winkel.html?leerjaar=1');await page.evaluate(()=>{speechSynthesis.speak=()=>{}});await page.locator('[data-mode="pay"]').click();await page.locator('[data-level="'+max+'"]').click();const prices=[];
  for(let i=0;i<8;i++){
   await fillBasket();await page.locator('#pay:not(:disabled)').waitFor();const price=(await page.locator('.price').allTextContents()).reduce((n,s)=>n+Number(s.replace(/\D/g,'')),0);prices.push(price);assert(price>=1&&price<=max);if(max===20){assert(price>=(i<2?8:11));assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'large order fits');if(i===7)await page.screenshot({path:__dirname+'/large-order.png'});}
   if(i===0){await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('Tik op het geld'));await page.locator('[data-money="5"]').click();await page.locator('[data-remove="5"]').click();assert.equal(await page.locator('[data-remove]').count(),0);}
   let left=price;for(const n of [10,5,2,1])if(await page.locator('[data-money="'+n+'"]').count())while(left>=n){await page.locator('[data-money="'+n+'"]').click();left-=n;}
   await page.locator('#pay').click();assert((await page.locator('.feedback').textContent()).includes('Juist betaald!'));await page.waitForTimeout(2000);
  }
  await page.locator('#again').waitFor();assert((await page.locator('.basket img').count())>=1);assert(prices.every(p=>p<=max));console.log('Whole euros complete',max,prices);
 }
 if(process.argv.includes('--prices')){assert.deepEqual(errors,[]);await browser.close();console.log('PASS realistic prices and higher totals');return;}
 await page.goto(base+'start_leerjaar1.html#spelling');assert(await page.getByText('Wordt nog aan gebouwd',{exact:true}).isVisible());
 const routes=[['splitsen_bibi.html','splitsen'],['splits_bijenkorf.html?max=10','splitsen'],['splits_bingo.html','splitsen'],['honingpot.html','splitsen'],['splitsmachine/index.html?leerjaar=1','splitsen'],['bloemenweide_keuze.html','rekenen'],['bloemenweide_spel.html?level=10&operation=plus','rekenen'],['honingpot_vullen_keuze.html','rekenen'],['honingpot_vullen_spel.html?level=10&operation=plus','rekenen'],['bijenrace_keuze.html','rekenen'],['bijenrace_spel.html?level=10&operation=plus','rekenen'],['../../wolkentrein/?leerjaar=1','rekenen'],['../../pentomino_studio_volledige_tool.html?play=1&leerjaar=1','puzzelen']];
 const newErrors=[...errors];
 for(const [path,island]of routes){await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded'});await page.locator('#island-menu-button').click();assert((await page.locator('#island-siblings').getAttribute('href')).endsWith('start_leerjaar1.html#'+island));assert((await page.locator('#island-game-choices').getAttribute('href')).includes('leerjaar=1'));}
 await page.goto(base+'start_leerjaar1.html');await page.evaluate(()=>sessionStorage.setItem('zisa_play_grades','[1]'));await page.reload();await page.locator('#island-menu-button').click();assert(await page.locator('#island-grades').isHidden());
 assert.deepEqual(newErrors,[]);await browser.close();console.log('PASS Bibi world, spoken controls, 10/20 euro purchases, 3 screen sizes, grade-1 return routes. Legacy page errors:',errors.slice(newErrors.length));
})().catch(e=>{console.error(e);process.exit(1)});
