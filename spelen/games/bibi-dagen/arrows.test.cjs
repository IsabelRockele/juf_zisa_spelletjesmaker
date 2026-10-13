const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage();
await page.addInitScript(()=>{speechSynthesis.cancel=()=>{};speechSynthesis.speak=()=>{};});
await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(__dirname+'/game.js','utf8').replace("window.addEventListener('pagehide',cancel);home();","window.addEventListener('pagehide',cancel);window.testHint=(today,delta)=>{cancel();deck=[{kind:'step',today,delta,target:mod(today+delta),activity:activities[0]}];index=0;renderQuestion();hint(true);};home();")}));
for(const width of [1100,390]){await page.setViewportSize({width,height:844});await page.goto('http://127.0.0.1:8777/spelen/games/bibi-dagen/');
for(let day=0;day<7;day++)for(const delta of [-2,-1,1,2]){
await page.evaluate(([d,s])=>window.testHint(d,s),[day,delta]);await page.waitForTimeout(40);
const hidden=await page.locator('.jump').evaluateAll(paths=>paths.map(path=>{const p=path.getPointAtLength(path.getTotalLength()),tip=new DOMPoint(p.x,p.y).matrixTransform(path.getScreenCTM());return [...document.querySelectorAll('#support .stone')].some(card=>{const r=card.getBoundingClientRect();return tip.x>=r.left-2&&tip.x<=r.right+2&&tip.y>=r.top-2&&tip.y<=r.bottom+2;});}));
assert(!hidden.some(Boolean),`Hidden tip: width ${width}, day ${day}, delta ${delta}`);
if(width===390&&day===0&&delta===1){await page.locator('.jump').evaluate(el=>{el.style.opacity=1;el.style.strokeDashoffset=0;});await page.screenshot({path:__dirname+'/arrow-check.png'});}
}}
console.log('PASS: arrow tips clear of every day card in 56 desktop/mobile hint cases.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
