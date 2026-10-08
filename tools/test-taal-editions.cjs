const {chromium}=require('C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(process.env.TAAL_TEST_ROOT || '.');
const server=http.createServer((req,res)=>{let p=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root)){res.writeHead(403).end();return}try{const data=fs.readFileSync(p);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(p)]||'application/octet-stream');res.end(data)}catch{res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({channel:'msedge',headless:true});try{
 let used=0,failed=false,mode='active';
 const context=await browser.newContext();
 await context.route('https://www.gstatic.com/firebasejs/**',async route=>{
  const url=route.request().url();let body='';
  if(url.endsWith('firebase-app.js'))body='export const getApp=()=>({}),getApps=()=>[{}],initializeApp=()=>({});';
  if(url.endsWith('firebase-functions.js'))body=`export const getFunctions=()=>({});export const httpsCallable=(f,name)=>async args=>({data:await window.mockCall(name,args)});`;
  if(url.endsWith('firebase-auth.js'))body=`export const getAuth=()=>({});export const onAuthStateChanged=(a,cb)=>setTimeout(()=>cb(${mode==='anon'?'null':'{getIdToken:async()=>"token"}'}),0);export const onIdTokenChanged=()=>{};`;
  if(url.endsWith('firebase-app-check.js'))body='export const initializeAppCheck=()=>({}),getToken=async()=>({token:"test"});export class ReCaptchaV3Provider{}';
  await route.fulfill({contentType:'text/javascript',body});
 });
 await context.exposeBinding('mockCall',async(_,name,args)=>{
  if(name==='getAccessStatus'){if(mode==='error')throw Error('network');return {allowed:true}}
  if(name==='registerDevice')return {};
  assert.equal(name,'reserveDiscoverDownload');assert.equal(args.toolId,'taalsystematiek');assert(args.pages>0);assert(args.reservationKey);
  if(failed)throw Error('network');if(used>=3)throw Error('TOOL_LIMIT');used++;return {byTool:{taalsystematiek:used},toolLimit:3,totalRemaining:15-used,totalLimit:15};
 });
 await context.route('**/ontdek/ontdek-auth.js',route=>route.fulfill({contentType:'text/javascript',body:`export function startOntdekAuth({onState}){window.authState=onState;window.openOntdekAuth=()=>window.loginOpened=true;onState({user:{uid:'test'},trial:{byTool:{},totalRemaining:15}})}` }));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function load(url){await page.goto(origin+url);await page.waitForFunction(()=>window.TaalApp);await page.evaluate(()=>TaalApp.load({items:[{type:'article-word',level:'basic',count:2,seed:3}]}));}
 for(const [edition,url,back] of [['gratis','/taalsystematiek/index.html','/index.html'],['pro','/pro/taalsystematiek/index.html','/pro/app.html'],['ontdek','/ontdek/taalsystematiek/index.html','/ontdek/app.html']]){
  await load(url);assert.equal(new URL(await page.locator('.edition-back').getAttribute('href'),page.url()).pathname,back);
  assert.equal(await page.locator('#preview .ontdek-watermarked').count(),edition==='ontdek'?1:0);
  if(edition==='ontdek')assert.notEqual(await page.locator('#preview .page').evaluate(p=>getComputedStyle(p,'::after').backgroundImage),'none');
 }
 await page.evaluate(()=>{window.saves=0;window.badWatermark=false;const real=window.html2canvas;window.html2canvas=async el=>{window.badWatermark ||= el.classList.contains('ontdek-watermarked');return real(el,{scale:.5,logging:false})};jspdf.jsPDF.API.save=function(){window.pdfBytes=this.output('arraybuffer').byteLength;window.saves++;return this}});
 async function download(id){await page.click('#'+id);await page.waitForFunction(()=>/gedownload|Download mislukt/.test(document.getElementById('exportStatus').textContent));}
 await download('pdf');await download('answerPdf');await download('print');assert.equal(used,3);assert.equal(await page.evaluate(()=>saves),3);
 await download('pdf');assert.match(await page.locator('#exportStatus').innerText(),/opgebruikt/);assert.equal(await page.evaluate(()=>saves),3);assert.equal(await page.evaluate(()=>badWatermark),false);assert(await page.evaluate(()=>pdfBytes)>1000);
 await page.evaluate(()=>authState({user:null,trial:null}));await download('pdf');assert.equal(await page.evaluate(()=>loginOpened),true);assert.equal(new URL(page.url()).pathname,'/ontdek/taalsystematiek/index.html');
 await page.evaluate(()=>authState({user:{uid:'test'},trial:null}));failed=true;await download('pdf');assert.match(await page.locator('#exportStatus').innerText(),/niet worden gecontroleerd/);assert.equal(await page.evaluate(()=>saves),3);
 failed=false;await load('/ontdek/taalsystematiek/index.html');await page.waitForFunction(()=>window.OntdekTrial);const blocked=await page.evaluate(()=>OntdekTrial.authorizeDownload(1).then(()=>false,e=>e.message));assert.match(blocked,/opgebruikt/);
 mode='error';await load('/pro/taalsystematiek/index.html');await page.waitForSelector('#pro-verification-error');assert.equal(new URL(page.url()).pathname,'/pro/taalsystematiek/index.html');
 mode='anon';await page.route('**/pro/index.html',r=>r.fulfill({contentType:'text/html',body:'<h1>Login</h1>'}));await page.goto(origin+'/pro/taalsystematiek/index.html');await page.waitForURL('**/pro/index.html');
 assert.deepEqual(errors,[]);
 for(const edition of ['pro','ontdek']){const menu=fs.readFileSync(path.join(root,edition,'app.html'),'utf8');assert(menu.includes('href="./taalsystematiek/index.html"'))}
 console.log('PASS: 3 edities, navigatie, watermerk alleen in preview, echte PDF in geheugen, gedeelde limiet van 3, vierde geblokkeerd na herladen, accountdialoog en Pro fout zonder loginlus. Firebase-antwoorden gesimuleerd.');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
