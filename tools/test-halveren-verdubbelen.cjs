const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require('C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd(),output=path.join(root,'output/qa-halveren');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1450,height:1000},acceptDownloads:true}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER',e.message);});
 await page.route('**/jspdf*.js',r=>r.fulfill({path:path.join(root,'leesbooster/vendor/jspdf.umd.min.js'),contentType:'application/javascript'}));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 // Isolated UI test: leave production account guards untouched.
 await page.route('**/guard.js*',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 const url=`http://127.0.0.1:${server.address().port}`;
 for(const folder of ['rekenbundel','pro/rekenbundel','ontdek/rekenbundel']){
  console.log('Route',folder);await page.goto(`${url}/${folder}/index.html`);await page.waitForSelector('#hv-add',{state:'attached'});
  await page.getByText('½ Halveren en verdubbelen',{exact:true}).click();assert.ok(await page.locator('#tab-halveren').isVisible());
 }
 await page.goto(`${url}/rekenbundel/index.html`);await page.getByText('½ Halveren en verdubbelen',{exact:true}).click();
 await page.locator('[name="hv-type"]').evaluateAll(nodes=>nodes.forEach(n=>n.checked=true));
 await page.locator('#hv-count-kort').fill('6');await page.locator('#hv-add').click();
 assert.equal(await page.locator('.hv-card').count(),18);assert.equal(await page.locator('.hv-uitleg').count(),4);
 assert.equal(await page.evaluate(()=>{const b=App.getLaatsteBlok();return new Set(b.oefeningen.map(o=>o.sleutel)).size;}),6);
 await page.locator('.hv-blok .btn-add-oef').last().click();assert.equal(await page.locator('.hv-card').count(),19);
 await page.locator('.hv-blok .btn-del-oef').last().click();assert.equal(await page.locator('.hv-card').count(),18);
 const first=page.locator('.hv-answer').first();await first.fill('12');
 await page.evaluate(()=>Preview.toggleOplossingen());assert.equal(await page.locator('.hv-answer').count(),0);
 await page.evaluate(()=>Preview.toggleOplossingen());assert.equal(await page.locator('.hv-answer').first().inputValue(),'12');
 await page.locator('.hv-answer').first().fill('');
 await page.locator('.hv-blok').first().screenshot({path:path.join(output,'preview.png')});
 // Export each block through the real PDF engine, both work sheet and key.
 const blocks=await page.evaluate(()=>[...document.querySelectorAll('.hv-blok')].length);assert.equal(blocks,4);
 // PDF checks are opt-in while the antivirus report is being investigated.
 for(const solutions of process.env.HV_TEST_PDF==='1'?[false,true]:[]){
  const download=page.waitForEvent('download');await page.evaluate(s=>s?App.downloadSleutel():App.downloadPDF(),solutions);
  await(await download).saveAs(path.join(output,solutions?'oplossingen.pdf':'werkblad.pdf'));
 }
 const math=await page.evaluate(()=>['tekenen','schema','zinnen','kort'].every(t=>HalverenVerdubbelen.pool(t).every(o=>o.n>=1&&o.n<=10&&HalverenVerdubbelen.layout(t,o,true).fields.every(f=>f.x+f.width<=360&&f.y+f.height<=HalverenVerdubbelen.maten(t)[1]))));assert.ok(math);
 assert.deepEqual(errors,[]);console.log('PASS: three versions, counts, unique exercises, add/delete, answer persistence and solutions. PDF exports: '+(process.env.HV_TEST_PDF==='1'?'tested':'skipped'));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
