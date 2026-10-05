const {chromium}=require('C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  fs.mkdirSync('output/qa-ruimte',{recursive:true});
  for(const file of ['meetkundebundelmaker/index.html','pro/meetkundebundelmaker/index.html','ontdek/meetkundebundelmaker/index.html']){
   const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   // Isolated local UI test: authentication is not part of this generator test.
   await page.route(/guard\.js|ontdek-meetkunde\.js|googleapis|gstatic/,r=>r.fulfill({body:'',contentType:'application/javascript'}));
   await page.goto('file:///'+path.resolve(file).replaceAll('\\','/'));
   await page.locator('[data-tab="space"]').click();
   await page.locator('[data-panel="space"] .group-title').evaluateAll(nodes=>nodes.forEach(n=>n.click()));
   for(const type of ['spacePlace','spaceDraw','spaceObjects','spaceRoute','spaceTurn'])await page.fill('#count-'+type,'4');
   await page.click('#generate');
   assert.equal(await page.locator('#pages .space-exercise').count(),21);
   await page.evaluate(async()=>{const image=new Image();image.src=document.querySelector('.space-sprite').style.backgroundImage.slice(5,-2);await image.decode();});
   const verify=await page.evaluate(()=>{
    const uniqueness=SpaceExercises.types.map(type=>{const all=state.exercises.filter(e=>e.type===type);return {type,count:all.length,unique:new Set(all.map(SpaceExercises.key)).size};});
    const overflow=Array.from(document.querySelectorAll('#pages .page')).flatMap(p=>Array.from(p.querySelectorAll('.exercise')).filter(e=>e.getBoundingClientRect().bottom>p.querySelector('.page-footer').getBoundingClientRect().top-3).map(e=>e.dataset.id));
    return {uniqueness,overflow};
   });
   assert.ok(verify.uniqueness.every(x=>x.count===4&&x.unique===4));assert.deepEqual(verify.overflow,[]);
   await page.evaluate(()=>{
    for(let v=0;v<64;v++){
     const m=SpaceExercises.model({type:'spaceTurn',spaceVariant:v});
     if(m.dots.length!==4||new Set(m.dots.map(d=>d.cell)).size!==4||new Set(m.dots.map(d=>d.color)).size!==4||m.dots.some(d=>d.cell===4))throw Error('Four distinct coloured circles required');
    }
    for(const ex of state.exercises.filter(e=>e.type==='spaceTurn')){
     const section=document.querySelector(`[data-id="${ex.id}"]`);
     const dots=[...section.querySelectorAll('.space-dot')];
     if(dots.length!==4||dots.some(d=>d.textContent.trim()))throw Error('Circles must have no numbers');
    }
    // Every facing must cover all eight neighbours, including both rear corners.
    for(let facing=0;facing<4;facing++){
     const cells=new Set();
     for(let r=0;r<8;r++){
      const m=SpaceExercises.model({type:'spacePlace',spaceVariant:r*4+facing});
      cells.add(m.first);
      if(m.rel>=4){
       const x=m.first%3-1,y=Math.floor(m.first/3)-1;
       if(Math.abs(x)!==1||Math.abs(y)!==1)throw Error('Diagonal must be a corner');
       const forward=[[0,-1],[1,0],[0,1],[-1,0]][facing];
       const projection=x*forward[0]+y*forward[1];
       if(projection!==(m.rel>=6?-1:1))throw Error('Front/back diagonal is reversed');
      }
     }
     if(cells.size!==8||cells.has(4))throw Error('Missing spatial position');
    }
    for(const type of SpaceExercises.types){
     const list=[];
     for(let i=0;i<12;i++){const ex=makeUnique(type,{},list);if(!ex)throw Error('Insufficient unique exercises: '+type);list.push(ex);}
     if(new Set(list.map(SpaceExercises.key)).size!==12)throw Error('Duplicate exercise');
    }
    for(let i=0;i<9;i++){let rotated=i;for(let j=0;j<4;j++)rotated=SpaceExercises.turn(rotated);if(rotated!==i)throw Error('Rotation mismatch');}
    for(let a=0;a<9;a++)for(let b=0;b<9;b++){
     const route=SpaceExercises.route(a,b);
     if(route[0]!==a||route.at(-1)!==b)throw Error('Route endpoints');
     for(let i=1;i<route.length;i++)if(Math.abs(route[i]%3-route[i-1]%3)+Math.abs(Math.floor(route[i]/3)-Math.floor(route[i-1]/3))!==1)throw Error('Invalid route step');
    }
   });
   await page.locator('[data-space-choice="0"]').first().click();
   assert.ok(await page.evaluate(()=>state.exercises.some(e=>e.spaceChoice===0)));
   await page.locator('#pages .space-exercise').nth(1).screenshot({path:'output/qa-ruimte/'+file.split('/')[0]+'-preview.png'});
   const answer=page.locator('[data-answer]').first();await answer.fill('eigen antwoord');
   const prompt=page.locator('[data-space-prompt]').first();await prompt.fill('Mijn opdrachtzin');
   await page.locator('#pages .space-exercise [data-act="addsame"]').first().click();
   assert.equal(await page.locator('#pages .space-exercise').count(),22);
   assert.equal(await page.locator('[data-answer]').first().textContent(),'eigen antwoord');
   assert.equal(await page.locator('[data-space-prompt]').first().textContent(),'Mijn opdrachtzin');
   const svg=page.locator('#pages .space-exercise .space-ink').nth(1);await svg.scrollIntoViewIfNeeded();const box=await svg.boundingBox();
   await page.mouse.move(box.x+20,box.y+20);await page.mouse.down();await page.mouse.move(box.x+45,box.y+45);await page.mouse.up();
   assert.ok(await page.evaluate(()=>state.exercises.some(e=>e.spacePaths?.main?.length)));
   await page.click('#solutions');assert.ok(await page.locator('.space-correct').count()>0);
   await page.click('#solutions');assert.ok(await page.evaluate(()=>state.exercises.some(e=>e.spacePaths?.main?.length)));
   await page.emulateMedia({media:'print'});
   assert.ok(await page.locator('[data-answer]').first().evaluate(e=>e.getBoundingClientRect().height>=45));
   await page.locator('#pages .page').first().screenshot({path:'output/qa-ruimte/'+file.split('/')[0]+'-print.png'});
   assert.deepEqual(errors,[]);
   console.log(file+': 4 unique per type, explanation, editing, drawing, solutions and print layout OK');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
