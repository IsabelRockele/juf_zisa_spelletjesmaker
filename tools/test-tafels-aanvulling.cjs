const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd(),out=path.join(root,'output/qa-tafels');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const folder of ['rekenbundel','pro/rekenbundel','ontdek/rekenbundel']){
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/jspdf*.js',r=>r.fulfill({path:path.join(root,'leesbooster/vendor/jspdf.umd.min.js'),contentType:'application/javascript'}));
  await page.route(/guard\.js|ontdek-pilot\.js|ontdek-trial\.js/,r=>r.fulfill({body:'',contentType:'application/javascript'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/${folder}/index.html`);
  assert.equal(await page.locator('.tab-halveren br').count(),1,'Narrow two-line halving tab');
  await page.locator('.sidebar-tab.tab-tafels').click();
  await page.check('#tafels-eerste-voorbeeld');
  await page.waitForFunction(()=>document.querySelector('#tafel-voorbeeld-oefenen .tafel-uitgewerkt .tafel-vast-antwoord'));
  await page.selectOption('#tafel-oefenvorm','vraagstukken');
  await page.check('[name="tafel-vraagsoort"][value="groepjes"]');await page.check('[name="tafel-vraagsoort"][value="eerlijk"]');
  await page.selectOption('#inp-aantal-tafels','18');await page.locator('#tab-tafels .btn-toevoegen').click();
  assert.equal(await page.locator('#preview-inhoud .tafel-oefening').count(),18);
  assert.equal(await page.locator('#preview-inhoud .tafel-uitgewerkt').count(),1);
  assert.equal(await page.locator('#tafel-voorbeeld-oefenen .tafel-oefening').count(),3,'Example for each selected story type');
  await page.locator('#preview-inhoud .preview-blok .btn-add-oef').last().click();assert.equal(await page.locator('#preview-inhoud .tafel-oefening').count(),18,'Pool exhausted without duplication');
  await page.locator('#preview-inhoud .tafel-oefening .btn-del-oef').first().click();assert.equal(await page.locator('#preview-inhoud .tafel-oefening').count(),17);
  await page.locator('#preview-inhoud .preview-blok .btn-add-oef').last().click();assert.equal(await page.locator('#preview-inhoud .tafel-oefening').count(),18);
  await page.locator('#btn-toggle-oplossingen').click();assert.equal(await page.locator('.tafel-oplossing').first().evaluate(e=>getComputedStyle(e).visibility),'visible');
  await page.locator('#btn-toggle-oplossingen').click();
  assert.equal(await page.locator('#preview-inhoud .tafel-uitgewerkt .tafel-oplossing').first().evaluate(e=>getComputedStyle(e).visibility),'visible','Worked example remains visible after hiding all answers');
  await page.locator('.sidebar-tab.tab-tafels-inzicht').click();
  await page.check('#inzicht-eerste-voorbeeld');
  for(const variant of ['taal','tussenstap','koppelen']){await page.selectOption('#inzicht-oefenvorm',variant);if(variant==='koppelen')assert.equal(await page.locator('#inp-aantal-inzicht').inputValue(),'1');await page.locator('#tab-tafels-inzicht .btn-toevoegen').click();}
  assert.equal(await page.locator('#preview-inhoud .tafel-aanvulling').nth(3).locator('.tafel-oefening').count(),1,'One matching exercise by default');
  assert.equal(await page.locator('#preview-inhoud .tafel-aanvulling').nth(3).locator('rect.tafel-oplossing[fill^="rgb"]').count(),12,'All matching cards have real colour fills');
  assert.equal(await page.locator('#preview-inhoud .tafel-rij-2').first().locator('.tafel-oefening').count(),2,'Two intermediate-step exercises per row');
  await page.locator('[name="inzicht-bewerking"][value="delen-aftrekking"]').locator('..').click();
  await page.selectOption('#inzicht-oefenvorm','tekenen');await page.locator('#tab-tafels-inzicht .btn-toevoegen').click();
  assert.equal(await page.locator('#preview-inhoud .tafel-aanvulling').nth(4).locator('.tafel-rij-2').first().locator('.tafel-oefening').count(),2,'Two drawing exercises per row');
  await page.locator('[name="inzicht-bewerking"][value="delen-verdelen"]').locator('..').click();
  assert.equal(await page.locator('#inzicht-oefenvorm').inputValue(),'bestaand');
  await page.locator('#tab-tafels-inzicht .btn-toevoegen').click();
  // Every retained representation has a real, expandable example.
  for(const soort of ['verdelen-emoji','verdelen-splitshuis','verdelen-100veld']) {
   await page.locator(`[name="inzicht-type-vd"][value="${soort}"]`).locator('..').click();
   await page.waitForFunction(()=>document.querySelector('#tafel-voorbeeld-begrijpen .preview-blok-body'));
   await page.locator('#tafel-voorbeeld-begrijpen').locator('..').getByText('Vergroot voorbeeld').click();
   assert.ok(await page.locator('#tafel-voorbeeld-dialog').isVisible());
   await page.locator('#tafel-voorbeeld-dialog>button').click();
  }
  for(const [bewerking,varianten] of [['vermenigvuldigen',['getekend','zelf']],['delen-aftrekking',['delen-getekend','delen-zelf']],['delen-rest',['delen-rest-getekend','delen-rest-zelf']]]) {
   await page.locator(`[name="inzicht-bewerking"][value="${bewerking}"]`).locator('..').click();
   await page.locator('[name="inzicht-type"][value="getallenlijn"]').locator('..').click();
   for(const variant of varianten){
    await page.locator(`[name="gl-variant-inzicht"][value="${variant}"]`).locator('..').click();
    await page.waitForFunction(()=>document.querySelector('#tafel-voorbeeld-begrijpen .gl-oefening'));
   }
  }
  if(folder==='rekenbundel')await page.locator('#tab-tafels-inzicht').screenshot({path:path.join(out,'keuzevoorbeeld-getallenlijn.png')});
  await page.evaluate(()=>{
   const Original=window.jspdf.jsPDF;window.pdfLogs=[];
   window.jspdf.jsPDF=function(...args){const doc=new Original(...args);const text=doc.text.bind(doc),rect=doc.roundedRect.bind(doc);
    doc.text=(s,x,y,...rest)=>{window.pdfLogs.push({type:'text',s,x,y,page:doc.internal.getCurrentPageInfo().pageNumber});return text(s,x,y,...rest);};
    doc.roundedRect=(x,y,w,h,...rest)=>{window.pdfLogs.push({type:'rect',x,y,w,h,filled:rest[2]==='FD',fill:doc.getFillColor(),page:doc.internal.getCurrentPageInfo().pageNumber});return rect(x,y,w,h,...rest);};
    doc.save=()=>{window.pdfData=doc.output('datauristring');};return doc;};
  });
  if(folder.startsWith('ontdek')) {
   // The discovery edition keeps its three-page limit. Test its renderer on a small bundle.
   await page.evaluate(async()=>{
    const config={variant:'vraagstukken',tafels:[2],soorten:['groepjes','eerlijk'],aantalOefeningen:3,antwoordzin:'deels'};
    const b={id:'test',bewerking:'tafels-aanvulling',config,opdrachtzin:TafelsAanvulling.opdrachten.vraagstukken,oefeningen:TafelsAanvulling.genereer(config)};
    if(await PdfEngine.telPaginas([b],'Tafels')>3)throw new Error('Small bundle exceeds discovery limit');
    await PdfEngine.genereer([b],'Tafels');
   });
  } else await page.evaluate(()=>App.downloadPDF());
  const result=await page.evaluate(()=>({data:window.pdfData,logs:window.pdfLogs}));
  assert.ok(result.data?.startsWith('data:application/pdf'));
  for(const e of result.logs.filter(e=>e.type==='rect'))assert.ok(e.y>=15&&e.y+e.h<=282.1,JSON.stringify(e));
  if(!folder.startsWith('ontdek'))assert.equal(result.logs.filter(e=>e.type==='rect'&&e.filled&&/^#fff[78]d[d-f]$/i.test(e.fill)).length,6,'One coloured worked example per block');
  for(let i=0;i<result.logs.length;i++) {
   const e=result.logs[i];
   if(e.type==='text'&&/Lees elk vraagstuk|Bekijk de groepjes|Schrijf de passende|Geef wat bij elkaar|Teken de deling|Verdeel eerlijk/.test(String(e.s))){
    const first=result.logs.slice(i+1).find(e=>e.type==='rect');assert.equal(first?.page,e.page,'Assignment stays with first exercise');
   }
  }
  fs.writeFileSync(path.join(out,folder.replaceAll('/','-')+'.pdf'),Buffer.from(result.data.split(',')[1],'base64'));
  if(!folder.startsWith('ontdek'))await page.evaluate(()=>App.downloadSleutel());
  if(folder==='rekenbundel'){
   await page.locator('#preview-inhoud .tafel-aanvulling').first().locator('.tafel-eerste-rij').screenshot({path:path.join(out,'vraagstuk-preview.png')});
   await page.locator('#preview-inhoud .tafel-aanvulling').nth(1).locator('.tafel-eerste-rij').screenshot({path:path.join(out,'rekentaal-preview.png')});
   await page.locator('#preview-inhoud .tafel-aanvulling').nth(2).locator('.tafel-eerste-rij').screenshot({path:path.join(out,'tussenstap-preview.png')});
   await page.locator('#preview-inhoud .tafel-aanvulling').nth(4).locator('.tafel-eerste-rij').screenshot({path:path.join(out,'tekenen-twee-per-rij.png')});
   await page.locator('#preview-inhoud .tafel-aanvulling').nth(3).locator('.tafel-eerste-rij').screenshot({path:path.join(out,'koppelen-compact-gekleurd.png')});
   fs.writeFileSync(path.join(out,'oplossingen.pdf'),Buffer.from((await page.evaluate(()=>window.pdfData)).split(',')[1],'base64'));
  }
  assert.deepEqual(errors,[]);console.log(folder+': bediening, alle nieuwe vormen, PDF en oplossingen geslaagd.');await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
