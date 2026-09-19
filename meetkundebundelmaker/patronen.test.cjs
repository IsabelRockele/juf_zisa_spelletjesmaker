const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 for(const file of ['meetkundebundelmaker/index.html','pro/meetkundebundelmaker/index.html','ontdek/meetkundebundelmaker/index.html']){
  const page=await browser.newPage({viewport:{width:1500,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+path.resolve(file).replaceAll('\\','/'));
  await page.locator('[data-tab="patterns"]').click();
  await page.locator('[data-panel="patterns"] .group-title').evaluateAll(nodes=>nodes.forEach(n=>n.click()));

  await page.click('#generate');
  assert.equal(await page.locator('#pages .exercise').count(),7);
  assert.equal(await page.locator('#pages .pattern-row').count(),6);
  assert.ok(await page.locator('#pages .page').count()<7,'Different types share a page');
  assert.ok(await page.locator('#pages .pattern-cell').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().width>=49 && n.getBoundingClientRect().height>=60)));
  assert.equal(await page.locator('#pages .pattern-cell svg').count(),0);
  assert.equal(await page.locator('#pages .pattern-write').allTextContents().then(a=>a.join('')),'');
  assert.equal(await page.locator('#pages .pattern-draw svg').count(),0);
  const original=await page.evaluate(()=>JSON.stringify(state.exercises));
  const checkLayout=async()=>{
   const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('#pages .page')).flatMap(p=>Array.from(p.querySelectorAll('.exercise')).filter(e=>e.getBoundingClientRect().bottom>p.querySelector('.page-footer').getBoundingClientRect().top-3).map(e=>e.querySelector('h3').textContent)));
   if(overflow.length){await page.locator('#pages .exercise').filter({hasText:'Groeiend patroon verderzetten'}).first().screenshot({path:'output/patronen-overflow.png'});console.log(await page.evaluate(()=>Array.from(document.querySelectorAll('#pages .pattern-row')).map(e=>({h:e.clientHeight,w:e.clientWidth}))))};assert.deepEqual(overflow,[],'Exercises must fit above footer');
  };
  await checkLayout();
  await page.locator('[data-panel="patterns"] .group-title').filter({hasText:'Is het een herhalend patroon?'}).click();
  await page.fill('#count-patternRecognize','4');
  await page.click('#generate');
  const recognized=await page.evaluate(()=>state.exercises.filter(ex=>ex.type==='patternRecognize').slice(-4));
  assert.equal(recognized.filter(ex=>ex.patternValid).length,2,'Four rows contain two repeating and two non-repeating patterns');
  assert.ok(await page.locator('#pages .pattern-recognize-line').evaluateAll(lines=>lines.every(line=>{
    const svg=line.querySelector('svg').getBoundingClientRect(),box=line.querySelector('.pattern-write').getBoundingClientRect();
    return box.left>=svg.right && Math.abs((box.top+box.bottom)/2-(svg.top+svg.bottom)/2)<2;
  })),'Checkbox is after the pattern on the same line');
  await page.click('#solutions');
  const checks=await page.locator('#pages [data-pattern-type="patternRecognize"] .pattern-write').allTextContents();
  assert.equal(checks.slice(-4).filter(text=>text==='×').length,2);
  await page.click('#solutions');
  // Restore the original exercises for the existing stability checks.
  await page.evaluate(data=>{state.exercises=JSON.parse(data);render()},original);
  await page.click('#solutions');
  assert.ok(await page.locator('#pages .pattern-draw svg').count()>0);
  assert.ok((await page.locator('#pages .pattern-write').allTextContents()).join('').match(/[HG]/));
  await checkLayout();
  assert.equal(await page.evaluate(()=>JSON.stringify(state.exercises)),original);
  await page.click('#solutions');
  assert.equal(await page.locator('#pages .pattern-draw svg').count(),0);
  const repeatRows=page.locator('#pages [data-pattern-type="patternRepeat"]');
  const originalRow=await repeatRows.first().locator('.pattern-row').innerHTML();
  await repeatRows.first().locator('[data-act="addsame"]').click();
  assert.equal(await page.locator('#pages .exercise').count(),8);
  assert.equal(await page.locator('#pages .pattern-row').count(),7);
  assert.equal(await repeatRows.count(),2);
  assert.equal(await repeatRows.locator('h3').count(),1,'One heading for both rows');
  assert.equal(await repeatRows.locator('.prompt').count(),1,'One instruction for both rows');
  assert.equal(await repeatRows.first().locator('.pattern-row').innerHTML(),originalRow,'Existing drawing is unchanged');
  const before=JSON.parse(original);
  const after=await page.evaluate(()=>state.exercises);
  for(const ex of before)assert.deepEqual(after.find(row=>row.id===ex.id),ex,'Every existing exercise is preserved');
  await repeatRows.last().locator('[data-act=delete]').click();
  assert.equal(await repeatRows.first().locator('.pattern-row').innerHTML(),originalRow);
  assert.equal(await page.locator('#pages .exercise').count(),7);
  assert.equal(await page.locator('#pages .pattern-row').count(),6);
  // Selected counts also share one instruction, and deleting the first row keeps it attached.
  await page.locator('[data-panel="patterns"] .group-title').filter({hasText:'Herhalend patroon verderzetten'}).click();
  await page.fill('#count-patternRepeat','3');
  await page.click('#generate');
  assert.equal(await repeatRows.count(),4);
  assert.equal(await repeatRows.locator('.prompt').count(),2);
  await repeatRows.nth(1).locator('[data-act=delete]').click();
  assert.equal(await repeatRows.count(),3);
  assert.equal(await repeatRows.locator('.prompt').count(),2);
  await checkLayout();
  // All growing variants must fit on the printed page, including the longest drawing rows.
  await page.locator('[data-panel="patterns"] .group-title').filter({hasText:'Herhalend of groeiend patroon?'}).click();
  await page.fill('#count-patternClassify','4');
  await page.click('#generate');
  assert.deepEqual(await page.evaluate(()=>{
    const rows=state.exercises.filter(ex=>ex.type==='patternClassify').slice(-4);
    return [rows.filter(ex=>ex.patternGrowing).length,rows.filter(ex=>!ex.patternGrowing).length];
  }),[2,2],'Four classification rows include two of each kind');
  await page.click('#solutions');
  const classificationAnswers=(await page.locator('#pages [data-pattern-type="patternClassify"] .pattern-write').allTextContents()).slice(-4).sort();
  assert.deepEqual(classificationAnswers,['G','G','H','H']);
  await page.click('#solutions');
  await page.evaluate(()=>{state.exercises=[makeUnique('patternClassify',{patternGrowing:true},[])];render()});
  await page.locator('#pages [data-pattern-type="patternClassify"] [data-act="addsame"]').click();
  assert.deepEqual(await page.evaluate(()=>state.exercises.map(ex=>ex.patternGrowing)),[true,false],'Adding a row balances an existing growing pattern');
  const templates=['AB','AAB','ABC','ABBA','ABB','ABBC','ABA'];
  await page.evaluate(()=>{state.exercises=Array.from({length:7},(_,i)=>make('patternRepeat',{gridVariant:i*120}));render()});
  const actualTemplates=await page.locator('#pages .pattern-given-unit:first-child').evaluateAll(nodes=>nodes.map(node=>{
    const colors=Array.from(node.querySelectorAll('svg>g')).map(g=>g.getAttribute('fill'));
    const unique=[...new Set(colors)];return colors.map(color=>'ABC'[unique.indexOf(color)]).join('');
  }));
  assert.deepEqual(actualTemplates,templates);
  assert.ok(await page.locator('#pages .pattern-inline').evaluateAll(rows=>rows.every(row=>row.lastElementChild.getBoundingClientRect().right<=row.getBoundingClientRect().right+1)),'All pattern lengths fit beside the drawing boxes');
  await checkLayout();
  await page.evaluate(()=>{state.exercises=Array.from({length:7},(_,i)=>make('patternRecognize',{gridVariant:i*120,patternValid:true}));render()});
  const recognizedTemplates=await page.locator('#pages .pattern-strip').evaluateAll(nodes=>nodes.map(node=>{
    const colors=Array.from(node.querySelectorAll('svg>g')).map(g=>g.getAttribute('fill')).slice(0,node.querySelectorAll('svg').length/3);
    const unique=[...new Set(colors)];return colors.map(color=>'ABC'[unique.indexOf(color)]).join('');
  }));
  assert.deepEqual(recognizedTemplates,templates);
  await page.evaluate(()=>{state.exercises=Array.from({length:24},(_,gridVariant)=>make('patternGrow',{gridVariant,patternSteps:2}));render()});
  await checkLayout();
  await page.evaluate(()=>{state.exercises=['patternRepeat','patternGrow','patternMosaic'].map(type=>make(type,{gridVariant:241,patternSteps:2}));render()});
  assert.equal(await page.locator('.pattern-given-unit').count(),2,'Exactly two given repetitions');
  const inlineLayout=await page.evaluate(()=>Array.from(document.querySelectorAll('#pages .pattern-inline')).every(row=>{
    const children=Array.from(row.children),first=children[0].getBoundingClientRect(),last=children.at(-1).getBoundingClientRect();
    return last.left>=first.right && Math.abs((first.top+first.bottom)/2-(last.top+last.bottom)/2)<2 && last.right<=row.getBoundingClientRect().right+1;
  }));
  assert.ok(inlineLayout,'Drawing spaces stay next to the given pattern, within the page');
  const mosaic=page.locator('#pages .pattern-mosaic');
  assert.equal(await mosaic.locator('[data-mosaic-cell]').count(),32,'Two rows of 16 adjoining squares');
  assert.equal(await mosaic.locator('[data-given="true"]').count(),16,'Two four-column units are given');
  assert.equal(await mosaic.locator('[data-given="false"] polygon:not([fill="#ffffff"])').count(),0,'Two units remain uncoloured');
  await page.click('#solutions');
  const mosaicColors=await mosaic.locator('[data-mosaic-cell]').evaluateAll(cells=>cells.map(cell=>Array.from(cell.querySelectorAll('polygon'),p=>p.getAttribute('fill'))));
  assert.deepEqual(mosaicColors.slice(0,8),mosaicColors.slice(8,16));
  assert.deepEqual(mosaicColors.slice(0,16),mosaicColors.slice(16,32));
  await page.click('#solutions');
  if(file.startsWith('meetkunde'))await page.locator('#pages .page').first().screenshot({path:'output/patronen-preview.png'});
  const unique=await page.evaluate(()=>{
    const signatures=[];
    for(let i=0;i<1000;i++){
      const ex=makeUnique('patternRepeat',{},[]);
      if(!ex)return {exhausted:true,total:signatures.length,distinct:new Set(signatures).size};
      const host=document.createElement('div');host.innerHTML=renderEx(ex,0);
      signatures.push(host.querySelector('.pattern-given').innerHTML);
    }
    return {exhausted:false};
  });
  assert.ok(unique.exhausted,'Stops when all different patterns have been used');
  assert.ok(unique.total>50,'Many distinct patterns available');
  assert.equal(unique.total,unique.distinct,'No visible duplicates, even after exhausting the pool');
  await page.evaluate(()=>{state.exercises=[];render()});
  await page.locator('[data-panel="patterns"] .group-title').filter({hasText:'Een mozaïekpatroon verderzetten'}).click();
  await page.fill('#count-patternMosaic','4');
  await page.click('#generate');
  const mosaicForms=await page.locator('#pages .pattern-mosaic').evaluateAll(nodes=>nodes.map(node=>{
    const palette=['#ffffff'];
    return Array.from(node.querySelectorAll('[data-given="true"] polygon'),p=>{
      const color=p.getAttribute('fill');if(!palette.includes(color))palette.push(color);return palette.indexOf(color);
    }).join(',');
  }));
  assert.equal(mosaicForms.length,4);
  assert.equal(new Set(mosaicForms).size,4,'Four mosaics have different geometry, not just different colours');
  await checkLayout();
  if(file.startsWith('meetkunde'))await page.locator('#pages .page').first().screenshot({path:'output/mozaiek-variatie.png'});
  assert.deepEqual(errors,[]);
  console.log(file+': UI, answers, stable data, add-same and pagination passed');
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
