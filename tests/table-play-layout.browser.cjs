const assert=require('node:assert/strict');
const http=require('http'),fs=require('fs'),path=require('path');const server=http.createServer((req,res)=>{let f=path.join(process.cwd(),decodeURIComponent(req.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/octet-stream');fs.readFile(f,(err,data)=>{res.statusCode=err?404:200;res.end(err?'missing':data)})}).listen(8766,'127.0.0.1');
const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});const p=await b.newPage();await p.addInitScript(()=>{for(const f of ['tafels','memory','vierop1rij','level1','level2','level3','ganzenbord_spel','tornado','woestijnjacht_spel','sombrero_spel'])sessionStorage.setItem('zisa_help_seen_'+f+'.html','1');sessionStorage.setItem('tafels','[2]');sessionStorage.setItem('tafel_type','maal');for(const key of ['sombrero','woestijnjacht','tornado','ganzenbord']){localStorage.setItem(key+'_tafels','[2]');localStorage.setItem(key+'_soort','maal')}});
for(const size of [{width:1920,height:1080},{width:1024,height:768},{width:768,height:1024}]){await p.setViewportSize(size);
for(const name of ['tafels','memory','vierop1rij','ganzenbord_spel','tornado','woestijnjacht_spel','sombrero_spel','level1','level2','level3']){
 await p.goto('http://127.0.0.1:8766/spelen/games/'+name+'.html');
 if(['tafels','memory','vierop1rij'].includes(name)){await p.locator('[data-type="maal"]').click();await p.locator('[data-tafel="2"]').click();if(name!=='tafels')await p.locator('[data-aantal="1"]').click();await p.locator('#startSpel').click();}
 if(name==='level3')await p.locator('#start-knop').click();
 await p.waitForTimeout(200);
 console.log(name,size.width,await p.evaluate(()=>JSON.stringify({h:document.documentElement.scrollHeight,w:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('#island-navigation button,#zisaNavButton,.btn-opnieuw')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {label:e.textContent.trim(),x:r.x,y:r.y,w:r.width,h:r.height,clear:e===top||e.contains(top)}})})));
 const bounds=await p.evaluate(()=>({h:document.documentElement.scrollHeight,w:document.documentElement.scrollWidth}));assert.ok(bounds.h<=size.height+1&&bounds.w<=size.width+1,name+' exceeds viewport '+JSON.stringify(bounds));if(size.width===1024)await p.screenshot({path:'output/play-'+name+'.png'});
}
}
await b.close();server.close()})().catch(e=>{console.error(e);process.exit(1)});
