const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require('C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output=path.resolve('output/qa-getalinzicht-basis');fs.mkdirSync(output,{recursive:true});
const root=process.cwd();
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');let body=fs.readFileSync(file);if(file.endsWith('gi-pdf.js'))body=body.toString().replace('const pdf = new jsPDF(',`window.__pdfCheck = {cuts:plakjes, factor:canvas.width/sheetRect.width, bounds:[...sheet.querySelectorAll('.basis-card, .title-row')].map(e=>({kind:e.className,top:(e.getBoundingClientRect().top-sheetRect.top)*canvas.width/sheetRect.width,bottom:(e.getBoundingClientRect().bottom-sheetRect.top)*canvas.width/sheetRect.width})), packets:[...sheet.querySelectorAll('.title-row')].map(t=>{const b=t.nextElementSibling, cards=[...b.querySelectorAll('.basis-card')], first=cards[0];if(!first)return null;const top=first.getBoundingClientRect().top, firstRow=cards.filter(c=>Math.abs(c.getBoundingClientRect().top-top)<3);return {top:(t.getBoundingClientRect().top-sheetRect.top)*canvas.width/sheetRect.width,bottom:(Math.max(...firstRow.map(c=>c.getBoundingClientRect().bottom))-sheetRect.top)*canvas.width/sheetRect.width};}).filter(Boolean)};
      const pdf = new jsPDF(`);res.end(body);});
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>{errors.push(d.message());d.dismiss();});
    await page.route('https://cdn.jsdelivr.net/npm/html2canvas@*/**',r=>r.fulfill({path:path.join(root,'leesbooster/vendor/html2canvas.min.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/jspdf@*/**',r=>r.fulfill({path:path.join(root,'leesbooster/vendor/jspdf.umd.min.js'),contentType:'application/javascript'}));
    await page.route('https://fonts.googleapis.com/**',r=>r.abort());
    const url=`http://127.0.0.1:${server.address().port}`;
    for(const folder of ['bundel_getallen','pro/bundel_getallen','ontdek/bundel_getallen']){
      await page.goto(`${url}/${folder}/getalinzicht.html`);await page.waitForSelector('#tab-evenoneven',{state:'attached'});
      assert.equal(await page.locator('.tab-evenoneven').count(),1);assert.equal(await page.locator('.tab-verdelen').count(),1);
    }
    await page.goto(`${url}/bundel_getallen/getalinzicht.html`);
    async function generate(tab,selected,count=2,explain=true){
      await page.locator(`.tab-${tab}`).click();
      for(const type of selected)await page.locator(`#basis-count-${type}`).fill(String(count));
      await page.locator(`#${tab}-explain`).setChecked(explain);
      await page.evaluate(({tab,selected})=>document.querySelectorAll(`input[name="${tab}-type"]`).forEach(e=>e.checked=selected.includes(e.value)),{tab,selected});
      await page.locator(`#${tab}-add`).click();
    }
    await generate('evenoneven',['pairs','parity','numbers','axis','riddles'],4);
    assert.equal(await page.locator('.basis-card').count(),20);
    assert.equal(await page.locator('.basis-notice').count(),0);
    assert.equal(await page.locator('.basis-explain').count(),5);
    assert.ok(await page.locator('.basis-explain').first().isVisible());
    assert.ok((await page.locator('.basis-explain').first().textContent()).includes('Even (paar)'));
    await page.locator('#sheet').screenshot({path:path.join(output,'vier-per-soort-met-uitleg.png')});
    await page.locator('#btnClearSheet').click();
    await generate('evenoneven',['pairs','parity','numbers','axis','riddles']);
    await page.screenshot({path:path.join(output,'generator-preview.png')});
    assert.equal(await page.locator('.sidebar > :last-child').getAttribute('class'),'sidebar-footer');
    assert.equal(await page.locator('.basis-card').count(),10);
    const add=page.locator('.title-add-btn').first();await add.click();assert.equal(await page.locator('.basis-card').count(),11);
    await page.locator('.basis-card .row-delete-btn').first().click();assert.equal(await page.locator('.basis-card').count(),10);
    await page.locator('.exercise-title').first().fill('Maak twee groepen. Is het aantal even of oneven?');
    await page.locator('.basis-card input').first().fill('Testantwoord');
    await page.locator('.basis-card[data-type="parity"] circle').first().click();assert.equal(await page.locator('.basis-card[data-type="parity"] circle').first().getAttribute('fill'),'#86cfa0');
    await page.evaluate(()=>GI_Toets.setModus('toets'));await page.waitForTimeout(100);
    assert.ok(Number(await page.locator('#gi-totaal-getal').textContent())>0);
    await page.evaluate(()=>GI_Toets.setModus('werkbundel'));
    async function pdf(name){
      const download=page.waitForEvent('download');await page.evaluate(name=>GI_Pdf.maakPdf(name),name);await(await download).saveAs(path.join(output,name));
      const check=await page.evaluate(()=>window.__pdfCheck);assert.ok(check.cuts.length>=1,'PDF pages');
      for(const cut of check.cuts.slice(1).map(c=>c.y)){
        for(const b of [...check.bounds,...check.packets])assert.ok(!(cut>b.top+2&&cut<b.bottom-2),`cut ${cut} crosses ${JSON.stringify(b)}`);
      }
      fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(check,null,2));
    }
    await page.locator('#sheet').screenshot({path:path.join(output,'even-preview.png')});await pdf('even-oneven.pdf');
    await page.locator('#btnClearSheet').click();
    for(const [group,selected] of Object.entries({delen:['whole','equal','divide','count','colorparts','compare'],helft:['halfshape','halfamount','doubleshape','doubleamount','statements','problems'],kwart:['quartershape','quartercolor','quarterfind','quarteramount']})){
      await generate('verdelen',selected);
      assert.equal(await page.locator('.basis-card').count(),selected.length*2);
      await page.locator('#sheet').screenshot({path:path.join(output,`${group}-preview.png`)});await pdf(`${group}.pdf`);
      await page.locator('#btnClearSheet').click();
    }
    // Regression: clearing, deleting last card, adding again and + keep original settings.
    await generate('verdelen',['halfamount'],1,false);await page.locator('.row-delete-btn').click();assert.equal(await page.locator('.basis-block').count(),0);assert.equal(await page.locator('.title-row').count(),0);
    await generate('verdelen',['quartercolor'],1,false);await page.locator('#verdelen-shape').selectOption('circle');await page.locator('.title-add-btn').click();assert.equal(await page.locator('.basis-card').count(),2);
    await page.locator('.title-delete-btn').click();assert.equal(await page.locator('.basis-card').count(),0);
    await generate('verdelen',['halfshape','quartershape'],1,false);
    const surface=page.locator('.basis-card svg').first();await surface.scrollIntoViewIfNeeded();const rect=await surface.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+20);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height-20);await page.mouse.up();assert.equal(await page.locator('[data-ink]').count(),1);
    await page.getByRole('button',{name:'Stap terug'}).first().click();assert.equal(await page.locator('[data-ink]').count(),0);
    await page.getByRole('button',{name:'Toon verdeellijnen'}).first().click();assert.equal(await surface.locator('[data-color]').count(),2);await surface.locator('[data-color]').first().click();assert.equal(await surface.locator('[data-color]').first().getAttribute('fill'),'#86cfa0');
    await page.getByRole('button',{name:'Toon verdeellijnen'}).last().click();assert.equal(await page.locator('.basis-card svg').last().locator('[data-color]').count(),4);
    await page.locator('#btnClearSheet').click();
    await generate('evenoneven',['numbers','riddles'],12,false);await page.locator('#evenoneven-max').selectOption('100');
    await page.locator('.title-add-btn').last().click();assert.equal(await page.locator('.basis-card[data-type="riddles"]').count(),13);
    await page.locator('#btnClearSheet').click();
    await page.locator('.tab-verdelen').click();
    await page.locator('#verdelen-shape').selectOption('circle');
    await generate('verdelen',['compare'],4,false);
    assert.equal(await page.locator('.basis-card').count(),4);
    assert.equal(await page.evaluate(()=>new Set([...document.querySelectorAll('.basis-card')].map(c=>c._basisOpgave)).size),4);
    await page.locator('.title-add-btn').click();
    assert.equal(await page.evaluate(()=>new Set([...document.querySelectorAll('.basis-card')].map(c=>c._basisOpgave)).size),5);
    await page.locator('#sheet').screenshot({path:path.join(output,'vergelijk-variatie.png')});
    await page.locator('#btnClearSheet').click();
    for(const kind of ['circle','rect','square']){
      await page.locator('#verdelen-shape').selectOption(kind);
      await generate('verdelen',['divide','halfshape','quartershape'],1,false);
      if(kind==='circle')assert.ok(await page.locator('[data-guide="tick"]').count()>=24);
      else assert.equal(await page.locator('.basis-cm-grid').count(),3);
      await page.locator('#sheet').screenshot({path:path.join(output,`hulplijnen-${kind}.png`)});
      if(kind!=='circle'){
        const measure=await page.evaluate(()=>{
          const sheet=document.getElementById('sheet'),old=sheet.style.width;
          sheet.style.width='794px';sheet.style.setProperty('--gi-pdf-px-per-mm',sheet.getBoundingClientRect().width/191+'px');
          const s=sheet.querySelector('.basis-cm-grid'),mm=s.getBoundingClientRect().width/320*40/sheet.getBoundingClientRect().width*191;
          sheet.style.width=old;sheet.style.removeProperty('--gi-pdf-px-per-mm');return mm;
        });assert.ok(Math.abs(measure-10)<.01,`Grid ${measure} mm`);
      }
      await pdf(`hulplijnen-${kind}.pdf`);
      await page.locator('#btnClearSheet').click();
    }
    await page.locator('#verdelen-shape').selectOption('mix');
    await page.evaluate(()=>document.querySelectorAll('input[name="verdelen-type"]').forEach(e=>e.checked=['whole','compare'].includes(e.value)));
    await page.locator('#basis-count-whole').fill('2');await page.locator('#basis-count-compare').fill('4');
    await page.locator('#verdelen-add').click();
    assert.equal(await page.locator('.basis-card[data-type="whole"]').count(),2);assert.equal(await page.locator('.basis-card[data-type="compare"]').count(),4);
    await page.screenshot({path:path.join(output,'aantal-per-soort.png')});
    assert.deepEqual(errors,[]);console.log('PASS: exercise types, independent counts, unique comparisons, drawing guides, 10 mm grid, preview controls and PDF page boundaries.');
  }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
