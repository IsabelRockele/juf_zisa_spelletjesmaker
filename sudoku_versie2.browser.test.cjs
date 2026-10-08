const fs=require('node:fs'); const path=require('node:path'); const http=require('node:http'); const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=__dirname, output=path.join(root,'output','sudoku-v2-check');fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    fs.readFile(file,(error,body)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(error?'Not found':body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1500,height:1000},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/sudoku_versie2.html`);
 const settled=()=>page.waitForFunction(()=>!document.querySelector('#downloadPdfBtn').disabled);
 await settled();
 await page.evaluate(()=>{
    // Controleer de echte canvasaanroepen op ontbrekende of niet-geladen plaatjes.
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
        if(image instanceof HTMLImageElement && (!image.complete||!image.naturalWidth))throw Error('Unloaded image');
        return draw.call(this,image,...args);
    };
 });
 for(const size of ['4','6','9'])for(const difficulty of ['easy','medium','hard','expert']){
    await page.selectOption('#gridSizeSelect',size);await page.selectOption('#difficulty',difficulty);await settled();
 }
 await page.check('[name="sudokuType"][value="afbeeldingen"]');
 assert.equal(await page.locator('#downloadPdfBtn').isDisabled(),true);
 await page.selectOption('#themeSelect','herfst');
 await page.waitForFunction(()=>document.querySelectorAll('#selectableThemeImagePreviews button').length===36);
 // Ook onderaan de themalijst blijft de keuze op dezelfde plek en houdt ze toetsenbordfocus.
 const lastChoice=page.locator('#selectableThemeImagePreviews button').nth(35);
 await lastChoice.scrollIntoViewIfNeeded();
 const choiceScroll=await page.locator('#selectableThemeImagePreviews').evaluate(el=>el.scrollTop);
 await lastChoice.click();
 assert.equal(await lastChoice.evaluate(el=>el===document.activeElement),true);
 assert.ok(Math.abs(await page.locator('#selectableThemeImagePreviews').evaluate(el=>el.scrollTop)-choiceScroll)<=1);
 await lastChoice.click();
 const choose=async n=>{for(let i=0;i<n;i++)await page.locator('#selectableThemeImagePreviews button').nth(i).click();};
 await choose(9);await page.click('#confirmThemeImagesBtn');await settled();
 await page.screenshot({path:path.join(output,'9x9-werkblad.png'),fullPage:true});
 assert.equal(await page.locator('#pageIndicator').textContent(),'Pagina 1 van 2');
 await page.click('#nextPageBtn');
 await page.screenshot({path:path.join(output,'9x9-knipstroken.png'),fullPage:true});
 async function download(id,name){const waiting=page.waitForEvent('download');await page.click(id);const d=await waiting;await d.saveAs(path.join(output,name));}
 await download('#downloadPdfBtn','9x9-afbeeldingen.pdf');
 await download('#downloadPngBtn','alle-paginas.png');
 await download('#downloadSolutionsPdfBtn','9x9-oplossingen.pdf');
 await page.click('#toggleSolutionsBtn');assert.equal(await page.locator('#pageIndicator').textContent(),'Pagina 1 van 1');
 await page.click('#toggleSolutionsBtn');assert.equal(await page.locator('#pageIndicator').textContent(),'Pagina 1 van 2');
 // Formaatwissel bewaart het thema en de beschikbare plaatjes.
 await page.selectOption('#gridSizeSelect','4');await settled();
 assert.equal(await page.locator('#themeSelect').inputValue(),'herfst');
 assert.equal(await page.locator('#selectableThemeImagePreviews button').count(),36);
 assert.equal(await page.locator('#selectableThemeImagePreviews button.selected').count(),4);
 await page.selectOption('#gridSizeSelect','6');
 assert.equal(await page.locator('#downloadPdfBtn').isDisabled(),true);
 for(const i of [4,5])await page.locator('#selectableThemeImagePreviews button').nth(i).click();
 await page.click('#confirmThemeImagesBtn');await settled();
 await page.selectOption('#aantalSudokus','4');await settled();
 assert.equal(await page.locator('[name="imageVariety"][value="different"]').isDisabled(),false);
 await page.check('[name="imageVariety"][value="different"]');
 await page.click('#autoThemeImagesBtn');await settled();
 assert.equal(await page.locator('#selectableThemeImagePreviews button.selected').count(),24);
 await download('#downloadPdfBtn','6x6-vier-afbeeldingen.pdf');
 await page.selectOption('#gridSizeSelect','4');await settled();
 assert.equal(await page.locator('#selectableThemeImagePreviews button.selected').count(),16);
 await download('#downloadPdfBtn','4x4-vier-afbeeldingen.pdf');
 // Een foutieve upload mag geen leeg downloadbaar werkblad achterlaten.
 await page.selectOption('#themeSelect','');
 await page.setInputFiles('#imageInput',{name:'stuk.png',mimeType:'image/png',buffer:Buffer.from('invalid')});
 await page.waitForFunction(()=>document.querySelector('#meldingContainer').textContent.includes('geen leesbare'));
 assert.equal(await page.locator('#downloadPdfBtn').isDisabled(),true);
 await page.check('[name="sudokuType"][value="getallen"]');await settled();
 await page.check('[name="sudokuType"][value="afbeeldingen"]');
 assert.equal(await page.locator('#downloadPdfBtn').isDisabled(),true);
 await page.check('[name="imageVariety"][value="same"]');
 await page.setInputFiles('#imageInput',Array.from({length:4},(_,i)=>path.join(root,'sudoku_afbeeldingen','herfst',String(i+1).padStart(2,'0')+'.png')));
 await settled();
 // Alle meegeleverde thema's laden, ook na snel wisselen tijdens het laden.
 for(const theme of ['terug_naar_school','herfst','Halloween','Sinterklaas','winter','Kerst','lente','Pasen','Carnaval','zomer']){
    await page.selectOption('#themeSelect',theme);
    await page.waitForFunction(t=>{
        const images=[...document.querySelectorAll('#selectableThemeImagePreviews img')];
        return images.length===window.SUDOKU_THEME_COUNTS[t]&&images.every(img=>img.src.includes('/'+t+'/')&&img.complete&&img.naturalWidth>0);
    },theme);
 }
 await page.route('**/sudoku_afbeeldingen/herfst/*.png',async route=>{await new Promise(r=>setTimeout(r,200));await route.continue();});
 await page.selectOption('#themeSelect','herfst');
 await page.selectOption('#themeSelect','lente');
 await page.waitForFunction(()=>{
     const images=[...document.querySelectorAll('#selectableThemeImagePreviews img')];
     return images.length===window.SUDOKU_THEME_COUNTS.lente&&images.every(img=>img.src.includes('/lente/'));
 });
 assert.ok(await page.locator('#selectableThemeImagePreviews img').first().getAttribute('src').then(s=>s.includes('/lente/')));
 await page.selectOption('#themeSelect','herfst');
 await page.waitForFunction(()=>document.querySelectorAll('#selectableThemeImagePreviews img').length===36);
 await choose(4);await page.click('#confirmThemeImagesBtn');await settled();
 await page.check('[name="imageVariety"][value="different"]');
 for(let i=4;i<16;i++)await page.locator('#selectableThemeImagePreviews button').nth(i).click();
 await page.click('#confirmThemeImagesBtn');await settled();
 await page.selectOption('#gridSizeSelect','9');
 assert.equal(await page.locator('[name="imageVariety"][value="different"]').isChecked(),true);
 assert.equal(await page.locator('#downloadPdfBtn').isDisabled(),true);
 await page.click('#autoThemeImagesBtn');await settled();
 assert.equal(await page.locator('#selectableThemeImagePreviews button.selected').count(),36);
 await download('#downloadPngBtn','9x9-vier-alle-paginas.png');
 // Oplossingen en werkblad wisselen zonder de puzzels opnieuw te genereren.
 const before=await page.locator('#mainCanvas').evaluate(c=>c.toDataURL());
 await page.click('#toggleSolutionsBtn');await page.click('#toggleSolutionsBtn');
 assert.equal(await page.locator('#mainCanvas').evaluate(c=>c.toDataURL()),before);
 await page.check('[name="sudokuType"][value="getallen"]');await settled();
 await page.selectOption('#gridSizeSelect','4');await settled();
 await download('#downloadPdfBtn','4x4-getallen.pdf');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(output,'mobiel.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 console.log('PASS: browserbediening, 12 formaat/niveau-combinaties, alle 10 thema’s, snel wisselen, capaciteitsgrenzen, uploads, oplossingen, PDF/PNG en mobiele breedte.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
