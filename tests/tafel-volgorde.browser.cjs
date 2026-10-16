const assert=require('node:assert/strict');
const http=require('http'),fs=require('fs'),path=require('path');const server=http.createServer((req,res)=>{let f=path.join(process.cwd(),decodeURIComponent(req.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/octet-stream');fs.readFile(f,(err,data)=>{res.statusCode=err?404:200;res.end(err?'missing':data)})}).listen(8766,'127.0.0.1');
const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});const p=await b.newPage({viewport:{width:1024,height:768}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const order of ['achteraan','vooraan']){
 await p.goto('http://127.0.0.1:8766/spelen/games/tafels.html');
 if(await p.locator('#zisaCloseHelp').isVisible())await p.locator('#zisaCloseHelp').click();
 await p.locator('[data-order="'+order+'"]').click();
 assert.equal(await p.locator('[data-order="'+order+'"]').getAttribute('aria-pressed'),'true');
 await p.locator('[data-type="maal"]').click();await p.locator('[data-tafel="2"]').click();await p.locator('#startSpel').click();
 const question=await p.locator('#vraagContainer').innerText();console.log(order,question);
 assert.match(question,order==='achteraan'?/\d+ × 2/:/2 × \d+/);
}
await p.goto('http://127.0.0.1:8766/spelen/games/memory.html');if(await p.locator('#zisaCloseHelp').isVisible())await p.locator('#zisaCloseHelp').click();assert.equal(await p.locator('[data-order="vooraan"]').getAttribute('aria-pressed'),'true');
for(const size of [{width:1024,height:768},{width:390,height:844}]){await p.setViewportSize(size);await p.locator('#tafel-volgorde').scrollIntoViewIfNeeded();for(const button of await p.locator('#tafel-volgorde button').all()){const r=await button.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=size.width);}await p.screenshot({path:'output/tafel-volgorde-'+size.width+'.png'});}
assert.deepEqual(errors,[]);await b.close();server.close();console.log('Keuzekaarten, beide somvolgordes en onthouden getest.');})().catch(e=>{console.error(e);process.exit(1)});
