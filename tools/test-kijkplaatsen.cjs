const {chromium}=require('C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 fs.mkdirSync('output/qa-kijkplaatsen',{recursive:true});
 for(const file of ['meetkundebundelmaker/index.html','pro/meetkundebundelmaker/index.html','ontdek/meetkundebundelmaker/index.html']){
  const page=await browser.newPage({viewport:{width:1550,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Auth flows are outside this isolated generator check.
  await page.route(/guard\.js|ontdek-meetkunde\.js|googleapis|gstatic/,r=>r.fulfill({body:'',contentType:'application/javascript'}));
  await page.goto('file:///'+path.resolve(file).replaceAll('\\','/'));
  await page.evaluate(()=>{
   for(let variant=0;variant<4;variant++){
    const ex=make('objectViews',{id:'balanced-views-'+variant});ex.viewVariant=variant;
    state.solutionMode=true;
    const html=renderEx(ex,0),holder=document.createElement('div');holder.innerHTML=html;
    const positions=[...holder.querySelectorAll('.view-choices')].map(row=>[...row.children].findIndex(c=>c.textContent.includes('☒')));
    if(new Set(positions).size!==4||positions.includes(-1))throw Error('Correct answers must occupy all four positions');
    if(renderEx(ex,0)!==html)throw Error('Answer order changes on rerender');
    const solvedChoices=[...holder.querySelectorAll('.view-choices span')].map(c=>c.textContent.slice(2));
    state.solutionMode=false;holder.innerHTML=renderEx(ex,0);
    if(JSON.stringify(solvedChoices)!==JSON.stringify([...holder.querySelectorAll('.view-choices span')].map(c=>c.textContent.slice(2))))throw Error('Solution order differs from worksheet');
   }
  });
  await page.locator('[data-tab="views"]').click();
  await page.locator('.viewpoint-picker .group-title').evaluateAll(nodes=>nodes.forEach(n=>n.click()));
  await page.fill('#count-viewpointMatch','4');await page.fill('#count-viewpointNumber','4');await page.click('#generate');
  assert.equal(await page.locator('#pages .viewpoint-exercise').count(),9);
  assert.equal(await page.locator('#pages .viewpoint-lines line').count(),0);
  assert.equal((await page.locator('[data-view-answer]').allTextContents()).join(''),'');
  await page.evaluate(async()=>{const urls=[...new Set([...document.querySelectorAll('#pages .viewpoint-exercise image')].map(im=>im.getAttribute('href')))];await Promise.all(urls.map(url=>new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=()=>reject(Error('Missing asset '+url));im.src=url;})));});
  const model=await page.evaluate(()=>{
   const api=ViewpointExercises;
   for(const scene of api.scenes){
    for(let side=0;side<4;side++){
     const view=api.projection(scene,side),opposite=api.projection(scene,(side+2)%4);
     for(const a of view){const b=opposite.find(p=>p.id===a.id);if(Math.abs(a.x+b.x)>1e-9||Math.abs(a.depth+b.depth)>1e-9)throw Error('Opposite perspectives must reverse left/right and depth');}
     if(view.some((v,i)=>i&&v.depth>view[i-1].depth))throw Error('Occlusion layer order');
    }
   }
   return ['viewpointMatch','viewpointNumber'].map(type=>({size:new Set(state.exercises.filter(e=>e.type===type).map(e=>e.sceneId)).size,extra:makeUnique(type,{},state.exercises)}));
  });assert.ok(model.every(x=>x.size===4&&x.extra===null));
  const layout=async()=>{assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('#pages .page')].flatMap(p=>[...p.querySelectorAll('.viewpoint-exercise')].filter(e=>e.getBoundingClientRect().bottom>p.querySelector('.page-footer').getBoundingClientRect().top-3).map(e=>e.dataset.id))),[]);};
  await layout();
  await page.locator('[data-view-start="0"]').first().click();await page.locator('[data-view-end="1"]').first().click();assert.equal(await page.locator('#pages .viewpoint-lines line').count(),1);
  await page.locator('[data-view-answer]').first().fill('3');
  await page.click('#solutions');assert.equal(await page.locator('#pages .viewpoint-lines line').count(),16);assert.equal(await page.locator('#pages .viewpoint-solution').count(),16);await layout();
  await page.evaluate(()=>{for(const ex of state.exercises.filter(e=>e.type==='viewpointNumber')){const answers=[...document.querySelector(`[data-id="${ex.id}"]`).querySelectorAll('[data-view-answer]')].map(n=>n.textContent);if(JSON.stringify(answers)!==JSON.stringify(ViewpointExercises.orders[ex.sceneId].map(n=>String(n+1))))throw Error('Incorrect answer numbers');}});
  if(file==='meetkundebundelmaker/index.html'){
   for(const scene of ['tuin','speelplaats','feest','strand'])await page.locator(`[data-view-type="viewpointMatch"][data-scene="${scene}"]`).screenshot({path:`output/qa-kijkplaatsen/${scene}-oplossing.png`});
  }
  await page.click('#solutions');assert.equal(await page.locator('#pages .viewpoint-lines line').count(),1);assert.equal(await page.locator('[data-view-answer]').first().textContent(),'3');
  await page.emulateMedia({media:'print'});await layout();
  assert.ok(await page.locator('[data-view-answer]').first().evaluate(e=>e.getBoundingClientRect().height>=45));
  if(file==='meetkundebundelmaker/index.html')await page.locator('[data-view-type="viewpointNumber"]').first().screenshot({path:'output/qa-kijkplaatsen/nummers-afdruk.png'});
  await page.emulateMedia({media:'screen'});
  await page.locator('[data-view-type="viewpointMatch"] [data-act="delete"]').first().click();
  await page.locator('[data-view-type="viewpointMatch"] [data-act="addsame"]').first().click();assert.equal(await page.locator('[data-view-type="viewpointMatch"]').count(),4);
  assert.deepEqual(errors,[]);console.log(file+': four unique scenes per type, perspective geometry, editing, solutions and print layout OK');await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
