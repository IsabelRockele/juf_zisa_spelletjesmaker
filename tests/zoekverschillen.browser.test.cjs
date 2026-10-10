const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const focusedScene = process.env.DIFFERENCE_SCENE;
const output = path.join(root, 'output', 'zoekverschillen-controle');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
        res.writeHead(error ? 404 : 200, { 'Content-Type': ({'.js':'application/javascript','.html':'text/html','.png':'image/png','.css':'text/css'})[path.extname(file)] || 'application/octet-stream' });
        res.end(error ? 'Not found' : data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({channel: 'msedge', headless: true});
    const errors = [];
    try {
        const page = await browser.newPage({viewport:{width:1600,height:1000}});
        page.on('pageerror', e => errors.push(e.message));
        // Auth en externe diensten zijn buiten deze lokale beeldtest gehouden.
        await page.route('**/*', route => {
            const url = route.request().url();
            if (!url.startsWith(base) || /\/(guard|device-id|ontdek-auth|ontdek-shell|taal-ontdek|catalogus-pro-themas)\.js/.test(url)) return route.fulfill({body:'',contentType:'application/javascript'});
            return route.continue();
        });
        for (const route of focusedScene ? ['', 'pro/'] : ['', 'pro/', 'ontdek/']) {
            await page.goto(`${base}/${route}zoekverschillen.html`);
            await page.click('#openCatalogBtn');
            assert.equal(await page.locator('#catalogThemes button').count(), 21);
            const themes = await page.locator('#catalogThemes button').evaluateAll(buttons => buttons.map(b => b.dataset.theme));
            for (const theme of focusedScene ? ['prehistorie'] : themes) {
                await page.locator(`#catalogThemes [data-theme="${theme}"]`).click();
                assert.equal(await page.locator('.catalog-status.available').count(), 2, `${route}${theme}`);
            }
            await page.locator(`#catalogThemes [data-theme="${focusedScene ? 'prehistorie' : 'voertuigen'}"]`).click();
            await page.locator(`[data-name="${focusedScene || 'drukke-straat'}"]`).click();
            await page.waitForFunction(() => !document.querySelector('#downloadPngBtn').disabled);
            for (let count=5; count<=10; count++) {
                await page.selectOption('#differenceCount', String(count));
                await page.click('#makeAutoDifferencesBtn');
                await page.waitForFunction(n => !document.querySelector('#differenceSummary').hidden && document.querySelectorAll('#differenceSummaryList li').length === n, count);
                await page.click('#toggleSolutionBtn');
                assert.match(await page.locator('#solutionOverlayCanvas').getAttribute('class'), /visible/);
            }
            console.log(`Catalogus + aantallen + oplossing OK: /${route}zoekverschillen.html`);
        }
        await page.goto(`${base}/zoekverschillen.html`);
        const images = [];
        for (const theme of fs.readdirSync(path.join(root,'zoekverschillen_catalogus'))) {
            const dir = path.join(root,'zoekverschillen_catalogus',theme);
            if (!fs.statSync(dir).isDirectory()) continue;
            for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.png') && !n.includes('-verschillen-') && (!focusedScene || n===focusedScene+'.png'))) images.push({theme,name:name.slice(0,-4)});
        }
        const report = await page.evaluate(async ({base,images}) => {
            const api = window.ZoekVerschillenAanvullingen;
            if(Object.keys(api.scenes).length!==16) throw Error('Alleen de zestien nog af te werken kleurplaten mogen veranderen.');
            const result = [];
            for (const {theme,name} of images) {
                const img = new Image();
                await new Promise((resolve,reject) => { img.onload=resolve;img.onerror=reject;img.src=`${base}/zoekverschillen_catalogus/${theme}/${name}.png`; });
                const scene = api.scenes[name];
                if (!scene) {
                    // Controleer ook dat alle bestaande zes varianten laden.
                    for(let count=5;count<=10;count++) {
                        const variant=new Image(); await new Promise((resolve,reject)=>{variant.onload=resolve;variant.onerror=reject;variant.src=img.src.replace('.png',`-verschillen-${count}.png`);});
                    }
                    result.push({name,existing:true}); continue;
                }
                await api.prepare(name);
                if(scene.changes.some(c=>c[0]!=='patch')) throw Error('Geen opgeplakte symbolen: '+name);
                const canvas = document.createElement('canvas'); canvas.width=scene.width;canvas.height=scene.height;
                const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,canvas.width,canvas.height);
                const original=ctx.getImageData(0,0,canvas.width,canvas.height);
                let previous=original;
                const steps=[];let five;
                for(let count=1;count<=10;count++) {
                    ctx.putImageData(original,0,0);api.draw(ctx,name,count);
                    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
                    if(name==='grotschilderingen') {
                        // De mammoet mag het oorspronkelijke hoofd en haar niet wijzigen.
                        for(let hy=175;hy<360;hy++) for(let hx=770;hx<925;hx++) {
                            const hi=(hy*canvas.width+hx)*4;
                            for(let channel=0;channel<4;channel++) {
                                if(pixels.data[hi+channel]!==original.data[hi+channel]) throw Error('Hoofd of haar gewijzigd bij grotschilderingen');
                            }
                        }
                    }
                    const point=api.points(name)[count-1];let changed=0,outside=0;
                    for(let i=0;i<pixels.data.length;i+=4) {
                        if(Math.max(...[0,1,2].map(c=>Math.abs(pixels.data[i+c]-previous.data[i+c])))<10)continue;
                        changed++;const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width);
                        if(Math.hypot(x-point[0]*canvas.width,y-point[1]*canvas.height)>point[2]*canvas.width)outside++;
                    }
                    steps.push({changed,outside});previous=pixels;
                    if(count===5) five=canvas.toDataURL('image/png');
                }
                // Vergelijk per ingreep een uitsnede voor en na, met omschrijving.
                const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=1500;
                const sc=sheet.getContext('2d');sc.fillStyle='white';sc.fillRect(0,0,1000,1500);
                scene.changes.forEach(([type,x,y,s,text,a,b,destination],index)=>{
                    const col=index%2,row=Math.floor(index/2),left=col*500,top=row*300;
                    let size=Math.max(100,['erase','flip','cat','move','patch'].includes(type)?Math.max(a,b)+30:s*3.8);
                    if(type==='move') {size=Math.max(a+Math.abs(destination[0]-x),b+Math.abs(destination[1]-y))+30;x=(x+destination[0])/2;y=(y+destination[1])/2;}
                    sc.fillStyle='#111';sc.font='14px Arial';sc.fillText(`${index+1}. ${text}`,left+8,top+20,480);
                    sc.drawImage(img,(x-size/2)*img.width/scene.width,(y-size/2)*img.height/scene.height,size*img.width/scene.width,size*img.height/scene.height,left+10,top+40,225,225);
                    sc.drawImage(canvas,x-size/2,y-size/2,size,size,left+255,top+40,225,225);
                    sc.font='12px Arial';sc.fillText('Origineel',left+10,top+285);sc.fillText('Met verschil',left+255,top+285);
                });
                result.push({name,steps,five,preview:sheet.toDataURL('image/png'),full:canvas.toDataURL('image/png')});
            }
            return result;
        }, {base,images});
        for (const item of report) {
            if(item.existing) continue;
            fs.writeFileSync(path.join(output,`${item.name}.png`),Buffer.from(item.preview.split(',')[1],'base64'));
            fs.writeFileSync(path.join(output,`${item.name}-volledig.png`),Buffer.from(item.full.split(',')[1],'base64'));
            fs.writeFileSync(path.join(output,`${item.name}-vijf.png`),Buffer.from(item.five.split(',')[1],'base64'));
            delete item.five;
            delete item.preview;
            delete item.full;
            assert.equal(item.steps.length,10);
            item.steps.forEach((step,i)=>{assert.ok(step.changed>35,`${item.name} verschil ${i+1} zichtbaar`);assert.equal(step.outside,0,`${item.name} verschil ${i+1} binnen oplossingscirkel`);});
        }
        assert.deepEqual(errors,[]);
        fs.writeFileSync(path.join(output,focusedScene ? focusedScene+'-controle.json' : 'controle.json'),JSON.stringify(report,null,2));
        console.log(focusedScene ? focusedScene+': alle tien ingrepen gecontroleerd; oorspronkelijk hoofd en haar behouden.' : '42 kleurplaten: 156 bestaande varianten laden; 160 nieuwe ingrepen zichtbaar en binnen hun oplossingscirkel.');
    } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

