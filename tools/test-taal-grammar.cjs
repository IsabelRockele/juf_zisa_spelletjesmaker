const {chromium}=require('C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1450,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///'+path.resolve('taalsystematiek/index.html').replaceAll('\\','/'));
 for(const [tab,count]of [['dimin',3],['syntax',7],['syn',3]]){await page.click('#tab-'+tab);assert.equal(await page.locator('#catalog .choice').count(),count);assert.equal(await page.locator('#catalog .task-level').count(),count)}
 const checks=await page.evaluate(()=>{
  const s={lineType:'type3',lineHeight:'middel',fontSize:22};
  const results=TaalGrammar.types.map(t=>{const item={type:t.id,level:t.level,count:TaalGrammar.limits[t.id],seed:512};const student=TaalGenerator.model(item,s,false),solved=TaalGenerator.model(item,s,true);const html=student.blocks.join('');const removed=TaalGenerator.model({...item,removed:['row-1']},s,false).blocks.join('');if(removed.includes('data-question-key="row-1"'))throw Error(t.id+' delete');if(html.includes('undefined'))throw Error(t.id+' undefined');return{type:t.id,blocks:student.blocks.length,solutions:solved.blocks.length}});
  for(const [text,question,subject,verb]of TaalGrammar.sentences){if(!text.toLowerCase().includes(subject.toLowerCase())||!question.toLowerCase().startsWith(verb.toLowerCase()+' '))throw Error('Grammar answer mismatch')}
  const m=TaalGenerator.model({type:'syntax-mark',level:'basic',count:12,seed:123},s,true);const temp=document.createElement('div');temp.innerHTML=m.blocks.join('');if(temp.querySelectorAll('.subject-answer').length!==12||temp.querySelectorAll('.marked').length!==12)throw Error('Marking mismatch');
  for(const [text,question,subject] of TaalGrammar.subjectSentences){if(!text.toLowerCase().includes(subject.toLowerCase())||!question.startsWith('Wie ')||!question.endsWith('?'))throw Error('Wie-vraag of onderwerp klopt niet')}
  for(const type of ['subject-who','subject-ask','subject-text']){const model=TaalGenerator.model({type,level:'basic',count:3,seed:123},s,true);if(/persoonsvorm/i.test(model.instruction+model.blocks.join('')))throw Error('Onderwerpoefening vraagt persoonsvorm');const student=TaalGenerator.model({type,level:'basic',count:3,seed:123},s,false);if(student.blocks.join('').includes('subject-answer'))throw Error('Antwoord al zichtbaar');if(type==='subject-text'){const doc=document.createElement('div');doc.innerHTML=model.blocks.join('');if(doc.querySelectorAll('.subject-answer').length!==12)throw Error('Volledige onderwerpen ontbreken')}}
  return results;
 });assert.equal(checks.length,13);checks.forEach(x=>{assert(x.blocks);assert.equal(x.blocks,x.solutions)});
 const ready=()=>page.waitForFunction(()=>/pagina’s in dit voorbeeld/.test(document.getElementById('exportStatus').textContent));
 for(const fontSize of [14,22]){
 await page.evaluate(fontSize=>localStorage.setItem('zisa-taalsystematiek-v1',JSON.stringify({settings:{fontSize,lineHeight:'middel',hints:true},items:TaalGrammar.types.map(t=>({type:t.id,level:t.level,count:Math.min(4,TaalGrammar.limits[t.id]),seed:512}))})),fontSize);
 await page.reload();await ready();assert.equal(await page.locator('#preview .exercise-intro').count(),13);assert.equal(await page.locator('#preview .hint').count(),4);
 for(const solutions of [false,true]){await page.locator('#answers').setChecked(solutions);await ready();const overflow=await page.locator('#preview .page').evaluateAll(pages=>pages.some(p=>[...p.querySelectorAll('.page-body>.question-block')].some(e=>e.getBoundingClientRect().bottom>p.querySelector('.page-body').getBoundingClientRect().bottom+1)));assert(!overflow)}
 }
 fs.mkdirSync('output/qa-taal-grammar',{recursive:true});await page.locator('#preview .page').first().screenshot({path:'output/qa-taal-grammar/verkleinwoorden.png'});
 await page.evaluate(()=>localStorage.setItem('zisa-taalsystematiek-v1',JSON.stringify({items:[{type:'syntax-steps',level:'support',count:2,seed:123}]})));await page.reload();await ready();await page.locator('#preview .page').first().screenshot({path:'output/qa-taal-grammar/onderwerp-persoonsvorm.png'});
 await page.evaluate(()=>{window.pdfSize=0;jspdf.jsPDF.API.save=function(){window.pdfSize=this.output('arraybuffer').byteLength;return this}});await page.click('#pdf');await page.waitForFunction(()=>window.pdfSize>1000,{},{timeout:60000});assert.deepEqual(errors,[]);
 console.log('13 oefenvormen: niveaus, antwoorden, verwijderen, pagina-indeling op 14/22 punt en PDF-opbouw geslaagd.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
