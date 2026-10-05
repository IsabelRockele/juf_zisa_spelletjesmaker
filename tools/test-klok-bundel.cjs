const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd();
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  for(const folder of ['kloklezen','pro/kloklezen','ontdek/kloklezen']){
   const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/jspdf*.js',r=>r.fulfill({path:path.join(root,'leesbooster/vendor/jspdf.umd.min.js'),contentType:'application/javascript'}));
   // Authentication is outside this isolated local generator test.
   await page.route(/guard\.js|tijd-ontdek\.js/,r=>r.fulfill({body:'',contentType:'application/javascript'}));
   await page.goto(`http://127.0.0.1:${server.address().port}/${folder}/kloklezen.html`);
   await page.evaluate(()=>{
    const Native=window.jspdf.jsPDF;
    window.jspdf.jsPDF=function(...args){const doc=new Native(...args),text=doc.text;doc.testTexts=[];doc.text=function(value,...rest){doc.testTexts.push({value:Array.isArray(value)?value.join(' '):value,page:doc.internal.getCurrentPageInfo().pageNumber});return text.call(doc,value,...rest);};return doc;};
   });
   await page.fill('#numKlokken','11');await page.click('#voegToeBtn');
   await page.waitForSelector('.pdf-klok-acties',{timeout:30000});
   assert.equal(await page.locator('.pdf-klok-acties').count(),11);
   await page.getByRole('button',{name:'Verwijder deze klok',exact:true}).first().click();
   await page.waitForFunction(()=>document.querySelectorAll('.pdf-klok-acties').length===10);
   await page.getByRole('button',{name:'Klok toevoegen aan deze opdracht',exact:true}).last().click();
   await page.waitForFunction(()=>document.querySelectorAll('.pdf-klok-acties').length===11);
   await page.getByRole('button',{name:'Vervang deze klok',exact:true}).first().click();
   await page.waitForFunction(()=>document.querySelector('.bundel-pdf-paginas')?.getAttribute('aria-busy')!=='true');
   const check=async(expected)=>{
    const data=await page.evaluate(async()=>{const doc=await Bundel.downloadPdf(false,true);return {anchors:doc.klokAnkers,headings:doc.previewAnkers,texts:doc.testTexts,pages:doc.internal.getNumberOfPages(),h:doc.internal.pageSize.getHeight()};});
    assert.equal(data.anchors.length,expected);
    assert.ok(data.pages>1);
    assert.equal(data.headings.length,1,'Only one assignment heading across all pages');
    const rows=new Map();for(const a of data.anchors){assert.ok(a.y>=22&&a.y+a.hoogte<=data.h-14,'Clock stays between header and footer');const key=a.pagina+':'+a.y;rows.set(key,(rows.get(key)||0)+1);}assert.ok([...rows.values()].every(n=>n<=3));
    assert.equal(data.headings[0].pagina,data.anchors[0].pagina,'Heading stays with first row');
    return data;
   };
   await check(11);
   await page.selectOption('#previewWeergave','bewerken');
   await page.waitForSelector('#bundelPreview .losse-klok-acties');
   assert.equal(await page.locator('#bundelPreview .losse-klok-acties').count(),11);
   await page.getByRole('button',{name:'Verwijder deze klok',exact:true}).first().click();
   await page.waitForFunction(()=>document.querySelectorAll('#bundelPreview .losse-klok-acties').length===10);
   // Test digital clocks, help clocks and combined answers on fresh documents.
   for(const mode of ['digitaal','hulp','beide']){
    await page.evaluate(async mode=>{
     const old=await Bundel.downloadPdf(false,true);for(const a of old.previewAnkers)Bundel.verwijderGroep(a.groepId);
     const inst=KlokLezen.leesInstellingen();inst.klokType=mode==='digitaal'?'digitaal':'analoog';inst.gekleurdeHulpklok=mode==='hulp';inst.invulmethode=mode==='beide'?'beide':mode==='digitaal'?'digitaalWekker':'digitaal';inst.digitaalNotatie=mode==='digitaal'?'12u':null;
     Bundel.voegToe(inst,'Unieke opdracht voor '+mode);
    },mode);
    const data=await check(11);
    assert.equal(data.texts.filter(t=>t.value==='Unieke opdracht voor '+mode).length,1);
   }
   await page.selectOption('#previewWeergave','pdf');await page.waitForSelector('.pdf-klok-acties');
   fs.mkdirSync('output/qa-klokken',{recursive:true});
   if(folder==='kloklezen')await page.locator('.pdf-voorbeeld-pagina').first().screenshot({path:'output/qa-klokken/preview.png'});
   if(folder==='kloklezen')await page.locator('.pdf-voorbeeld-pagina').last().screenshot({path:'output/qa-klokken/vervolgpagina.png'});
   // A following assignment must not overlap a previous one or strand its heading.
   const mixed=await page.evaluate(async()=>{
    const inst=KlokLezen.leesInstellingen();inst.tijden=inst.tijden.slice(0,5);inst.numClocks=5;
    Bundel.voegToe(inst,'Tweede opdracht');
    const doc=await Bundel.downloadPdf(false,true);
    return {headings:doc.previewAnkers,anchors:doc.klokAnkers};
   });
   assert.equal(mixed.headings.length,2);
   for(const h of mixed.headings){const first=mixed.anchors.find(a=>a.groepId===h.groepId);assert.equal(first.pagina,h.pagina);assert.ok(first.y>=h.y+h.hoogte);}
   const deletion=await page.evaluate(async()=>{
    const doc=await Bundel.downloadPdf(false,true);
    for(const a of doc.klokAnkers)Bundel.verwijder(a.id);
    return document.querySelectorAll('.preview-leeg').length;
   });
   assert.equal(deletion,1,'Deleting the last clock also removes its empty assignment');
   assert.deepEqual(errors,[]);
   console.log(folder+': exact counts, visible individual controls, three per row, single heading and page bounds OK');
   await page.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
// Documents are checked in memory; this test never saves a PDF file.
