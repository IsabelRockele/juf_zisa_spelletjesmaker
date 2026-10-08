const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=__dirname;
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(e,data)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});res.end(e?'Not found':data);});
});
async function mockFirebase(page,scenario){
 await page.addInitScript(s=>{window.scenario=s;window.proReady=0;window.onProReady=()=>window.proReady++;},scenario);
 await page.route('https://www.gstatic.com/firebasejs/**',async route=>{
  const name=route.request().url().split('/').pop();let body='';
  if(name==='firebase-app.js')body='export const initializeApp=()=>({}),getApps=()=>[{}],getApp=()=>({});';
  if(name==='firebase-auth.js')body=`const user=window.scenario==='anonymous'?null:{getIdToken:async()=>{if(window.scenario==='token-error')throw Error('token');return 'test';}};export const getAuth=()=>({}),onAuthStateChanged=(a,cb)=>setTimeout(()=>cb(user),0),onIdTokenChanged=(a,cb)=>setTimeout(()=>cb(user),0);`;
  if(name==='firebase-functions.js')body=`export const getFunctions=()=>({}),httpsCallable=(f,name)=>async()=>{if(window.scenario==='access-error'&&name==='getAccessStatus')throw Error('network');if(name==='registerDevice'&&['device-error','device-limit'].includes(window.scenario))throw Error(window.scenario==='device-limit'?'DEVICE_LIMIT':'network');return {data:{allowed:window.scenario!=='expired'}};};`;
  if(name==='firebase-app-check.js')body=`export class ReCaptchaV3Provider{};export const initializeAppCheck=()=>({}),getToken=async()=>{if(window.scenario==='appcheck-error')throw Error('network');return {};};`;
  await route.fulfill({contentType:'application/javascript',body});
 });
 await page.route('**/ontdek/ontdek-auth.js',route=>route.fulfill({contentType:'application/javascript',body:'export function startOntdekAuth({onState}){onState({user:null,pro:false,trial:null});}'}));
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [entry,target] of [['sudoku.html','/index.html'],['pro/sudoku.html','/pro/app.html'],['ontdek/sudoku.html','/ontdek/app.html']]){
   const page=await browser.newPage();await mockFirebase(page,'success');
   await page.goto(`${base}/${entry}`);await page.waitForFunction(()=>!document.querySelector('#downloadPdfBtn').disabled);
   if(entry.startsWith('pro/'))await page.waitForFunction(()=>window.proReady===1);
   if(entry.startsWith('ontdek/'))await page.waitForSelector('.ontdek-trial-bar');
   await page.check('[name="sudokuType"][value="afbeeldingen"]');await page.selectOption('#themeSelect','herfst');
   await page.waitForFunction(()=>document.querySelectorAll('#selectableThemeImagePreviews button').length===36);
   await page.selectOption('#gridSizeSelect','9');await page.selectOption('#aantalSudokus','4');await page.click('#autoThemeImagesBtn');
   await page.waitForFunction(()=>document.querySelector('#mainCanvas').dataset.pageCount==='8');
   if(entry.startsWith('ontdek/')){
    assert.equal(await page.evaluate(()=>window.ONTDEK_TAAL.pageCount()),8);
    await page.selectOption('#themeSelect','winter');await page.waitForSelector('#ontdekProInfoDialog[open]');
    assert.equal(await page.locator('#themeSelect').inputValue(),'herfst');
    await page.locator('#ontdekProInfoDialog button').click();
   }
   await page.route(`${base}${target}`,route=>route.fulfill({contentType:'text/html',body:'Menu bereikt'}));
   await page.getByRole(entry.startsWith('ontdek/')?'link':'button',{name:/Keuzemenu/}).click();
   await page.waitForURL(`${base}${target}`);await page.close();
  }
  for(const scenario of ['access-error','device-error','token-error','appcheck-error','anonymous','expired','device-limit']){
   const page=await browser.newPage();await mockFirebase(page,scenario);let navigations=0;
   page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
   for(const dest of ['index.html','verlopen.html','apparaten.html'])await page.route(`${base}/pro/${dest}`,route=>route.fulfill({contentType:'text/html',body:'Bestemming'}));
   await page.goto(`${base}/pro/sudoku.html`);
   if(scenario.endsWith('error')){
    await page.waitForSelector('#pro-verification-error[open]');
    assert.equal(new URL(page.url()).pathname,'/pro/sudoku.html');assert.equal(navigations,1);
    assert.equal(await page.evaluate(()=>window.proReady),0);
    await page.getByRole('button',{name:'Opnieuw proberen'}).click();
    await page.waitForSelector('#pro-verification-error[open]');assert.equal(navigations,2);
   }else{
    await page.waitForURL(`${base}/pro/${scenario==='anonymous'?'index.html':scenario==='expired'?'verlopen.html*':'apparaten.html'}`);
    assert.equal(navigations,2);
   }
   await page.close();
  }
  const page=await browser.newPage();await page.goto(`${base}/sudoku_versie2.html?voorbeeld=1#test`);await page.waitForURL(`${base}/sudoku.html?voorbeeld=1#test`);await page.close();
  console.log('PASS: drie menu-routes, gedeelde afbeeldingen, Ontdek-paginatelling/themakeuze, oude link, Pro-toegang en zeven fout-/inlogscenario’s zonder automatische lus.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
