const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('alle edities keren terug naar hun eigen menu zonder extra inlogcontrole',()=>{
 const path=require('node:path');
 for(const [file,menu] of [['stiltemeter/index.html','index.html'],['pro/stiltemeter.html','pro/app.html'],['ontdek/stiltemeter.html','ontdek/app.html']]){
  const html=fs.readFileSync(file,'utf8');
  const back=html.match(/class="back" href="([^"]+)"/)[1];
  assert.equal(path.resolve(path.dirname(file),back),path.resolve(menu));
  assert.doesNotMatch(html,/guard\.js|ontdek-auth\.js|location\.(?:href|replace|assign)/);
  const menuHtml=fs.readFileSync(menu,'utf8');
  const tile=menuHtml.match(/<a[^>]+href="[^"]*stiltemeter[^>]+>/)[0];
  assert.match(tile,/target="_blank"/);
  assert.match(tile,/popup=yes/);
 }
 assert.match(fs.readFileSync('stiltemeter/stiltemeter.css','utf8'),/body\.focus header \.back\{display:inline-flex/);
});
function setup(){
 const html=fs.readFileSync('stiltemeter/index.html','utf8');
 const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,{style:{setProperty(){}},dataset:{},value:id==='minutes'?'10':id==='delay'?'2':'50',checked:id==='timerSound',hidden:false,classList:{toggle(){}},setAttribute(k,v){this[k]=v}}]));
 const listeners={};let resolveStream;let stopped=0;
 class Audio{constructor(){this.state='running';}resume(){return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}createMediaStreamSource(){return{disconnect(){},connect(){}}}createAnalyser(){return{fftSize:2048}}}
 const document={hidden:false,getElementById:id=>elements[id],querySelectorAll:()=>[],documentElement:{style:{setProperty(){}}},addEventListener:(name,fn)=>listeners[name]=fn};
 const context=vm.createContext({document,window:{AudioContext:Audio,addEventListener(){}},navigator:{mediaDevices:{getUserMedia:()=>new Promise(resolve=>resolveStream=resolve)}},performance:{now:()=>100},Date,Math,Float32Array,setInterval:()=>1,clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
 vm.runInContext(fs.readFileSync('stiltemeter/stiltemeter.js','utf8'),context);
 return {elements,document,listeners,run:code=>vm.runInContext(code,context),grant:()=>resolveStream({getTracks:()=>[{stop(){stopped++}}]}),stopped:()=>stopped};
}
test('weergaven wisselen en stoplicht volgt het geluidsniveau',()=>{const s=setup();s.elements.lightView.onclick();assert.equal(s.elements.scene.hidden,true);assert.equal(s.elements.orb.hidden,true);assert.equal(s.elements.trafficLight.hidden,false);s.run("show('red')");assert.equal(s.elements.trafficLight.dataset.mood,'red');s.elements.meterView.onclick();assert.equal(s.elements.orb.hidden,false);s.elements.animalView.onclick();assert.equal(s.elements.scene.hidden,false);});
test('timer starten, pauzeren, hervatten en stil eindigen',()=>{const s=setup();s.elements.timerSound.checked=false;s.elements.timerStart.onclick();assert.equal(s.run('timerState'),'running');s.elements.timerStart.onclick();assert.equal(s.run('timerState'),'paused');s.elements.timerStart.onclick();s.run('timerDeadline=Date.now()-1;tickTimer()');assert.equal(s.run('timerState'),'done');assert.equal(s.elements.timeDigits.textContent,'00:00');s.elements.timerReset.onclick();assert.equal(s.elements.timeDigits.textContent,'10:00');});
test('microfoontoestemming na verlaten tabblad sluit de stream',async()=>{const s=setup();const pending=s.elements.start.onclick();await new Promise(setImmediate);s.document.hidden=true;s.listeners.visibilitychange();s.grant();await pending;assert.equal(s.stopped(),1);assert.equal(s.run('running'),false);assert.equal(s.elements.start.disabled,false);});
test('elke editie heeft lokale bestanden en correcte menulinks',()=>{for(const file of ['stiltemeter/index.html','pro/stiltemeter.html','ontdek/stiltemeter.html']){const html=fs.readFileSync(file,'utf8');const path=require('node:path');for(const [,url] of html.matchAll(/(?:src|href)="([^"?]+)"/g)){if(url.startsWith('data:'))continue;assert.ok(fs.existsSync(path.resolve(path.dirname(file),url)),`${file}: ${url}`);}}for(const file of ['index.html','pro/app.html','ontdek/app.html'])assert.ok(fs.readFileSync(file,'utf8').includes('>Stiltemeter</span>'));});

