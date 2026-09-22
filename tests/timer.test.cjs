const { test } = require('node:test');
const {quietFrame}=require('../timer-worlds.js');
test('quiet clock uses minute markings, shrinks to zero and supports long durations',()=>{
 const start=quietFrame(0,1200),half=quietFrame(.5,1200),end=quietFrame(1,1200);
 assert.equal(start.capacity,60);assert.equal(start.remaining,20);
 assert.ok(Math.abs(start.angle-Math.PI*2/3)<1e-10);
 assert.equal(half.remaining,10);assert.equal(end.path,'');
 assert.equal(quietFrame(0,3600).angle,Math.PI*2);
 assert.equal(quietFrame(0,5400).capacity,120);
 assert.equal(quietFrame(0,10800).capacity,180);
});
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// A small DOM double to exercise the real timer controller with a controllable clock.
class Element {
    constructor() {
        this.dataset = {}; this.children = []; this.listeners = {}; this.style = { setProperty() {} };
        this.textContent = ''; this.value = ''; this.hidden = false; this.tagName = 'DIV';
        const classes = new Set();
        this.classList = { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle: (x, on) => (on ?? !classes.has(x)) ? classes.add(x) : classes.delete(x) };
    }
    addEventListener(type, handler) { this.listeners[type] = handler; }
    async click() { await this.listeners.click?.(); await this.onclick?.(); }
    setAttribute(name, value) { this[name] = value; }
    appendChild(child) { this.children.push(child); return child; }
    prepend(child) { this.children.unshift(child); }
    before() {} after() {} remove() {} scrollIntoView() {}
    querySelector() { return new Element(); }
    querySelectorAll() { return []; }
    getTotalLength() { return 100; }
}
function documentDouble() {
    const ids = new Map(); const made = [];
    return { ids, made, body: new Element(), head: new Element(), documentElement: new Element(), activeElement: new Element(),
        getElementById(id) { if (!ids.has(id)) ids.set(id,new Element()); return ids.get(id); },
        createElement() { const e = new Element(); made.push(e); return e; },
        querySelector() { return Object.assign(new Element(),{src:'https://example.test/timer.js'}); },
        querySelectorAll() { return []; }, addEventListener() {}
    };
}
async function setup() {
    const document = documentDouble(); let ready; let now = 100000; let sequence = 0;
    const intervals = new Map(); const floatingIntervals = new Map(); const animationFrames = new Map();
    const themes = ['rainbow','star','aquarium','balloon','garden','space'].map(theme => Object.assign(new Element(),{dataset:{theme}}));
    document.querySelectorAll = selector => selector === '.theme-buttons button' ? themes : [];
    document.addEventListener = (event, fn) => { if (event === 'DOMContentLoaded') ready = fn; };
    const floating = { document: documentDouble(), closed: false, listeners: {}, focus() {},
        setInterval(fn) { floatingIntervals.set(++sequence,fn); return sequence; }, clearInterval(id) { floatingIntervals.delete(id); },
        addEventListener(e,fn) { this.listeners[e] = fn; }, close() { this.closed = true; this.listeners.pagehide?.(); } };
    const window = { requestAnimationFrame(fn){animationFrames.set(++sequence,fn);return sequence;},cancelAnimationFrame(id){animationFrames.delete(id);},isSecureContext:true, confirm:()=>true, TimerWorld:{ create:()=>({ render:()=> 'Chapter' }) }, documentPictureInPicture:{ requestWindow:async()=>floating } };
    const context = { document, window, URL, Date:{now:()=>now}, Audio:class {play(){return Promise.resolve();}}, setInterval(fn){intervals.set(++sequence,fn);return sequence;},clearInterval(id){intervals.delete(id);} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../timer.js'),'utf8'),context);
    ready();
    await themes[3].click();
    document.getElementById('customMinutes').value = '1';
    await document.getElementById('startSelectedTimer').click();
    return {document, window, floating, intervals, floatingIntervals, animationFrames,
        animate(){const pending=[...animationFrames.entries()];for(const [id,fn] of pending){animationFrames.delete(id);fn();}},
        element:id=>document.getElementById(id),
        async click(id) { await document.getElementById(id).click(); },
        advance(ms, visibleOnly=false) { now+=ms; for(const fn of [...(visibleOnly?floatingIntervals:intervals).values()]) fn(); },
        async openFloating() { await document.made.find(e=>e.className==='control-button floating-button').click(); }
    };
}
test('pause, resume, extra minute and restart preserve the selected duration', async()=>{
    const app = await setup();
    await app.click('startButton'); app.advance(15000);
    assert.equal(app.element('countdown').textContent,'00:45');
    await app.click('pauseButton'); app.advance(20000);
    assert.equal(app.element('countdown').textContent,'00:45');
    await app.click('startButton'); app.advance(5000);
    assert.equal(app.element('countdown').textContent,'00:40');
    await app.click('addMinuteButton');
    assert.equal(app.element('countdown').textContent,'01:40');
    await app.click('restartButton');
    assert.equal(app.element('countdown').textContent,'02:00');
    assert.equal(app.intervals.size,0);
});
test('completion and adding a minute after completion do not restart the old duration',async()=>{
    const app=await setup(); await app.click('startButton'); app.advance(65000);
    assert.equal(app.element('countdown').textContent,'00:00');
    assert.equal(app.element('timerMessage').textContent,'Tijd is om!');
    await app.click('addMinuteButton'); await app.click('startButton'); app.advance(1000);
    assert.equal(app.element('countdown').textContent,'00:59');
    assert.equal(app.element('timerMessage').textContent,'');
});
test('floating controls share state and a visible-window tick catches up a covered main tab',async()=>{
    const app=await setup(); await app.openFloating();
    const mini=id=>app.floating.document.getElementById(id);
    await mini('miniToggle').click(); app.advance(15000,true);
    assert.equal(mini('miniTime').textContent,'00:45');
    assert.equal(app.element('countdown').textContent,'00:45');
    await mini('miniToggle').click(); app.advance(10000,true);
    assert.equal(mini('miniTime').textContent,'00:45');
    assert.equal(mini('miniState').textContent,'Gepauzeerd');
    await mini('miniAdd').click();
    assert.equal(mini('miniTime').textContent,'01:45');
    await app.click('newTimerButton');
    assert.equal(app.floating.closed,true);
    assert.equal(app.floatingIntervals.size,0);
});
test('an unsupported browser gives a helpful explanation',async()=>{
    const app=await setup(); delete app.window.documentPictureInPicture;
    await app.openFloating();
    assert.match(app.document.made.find(e=>e.className==='floating-help').textContent,/Chrome of Edge/);
});

const {frame}=require('../timer-worlds.js');
test('star starts very small and long journeys contain more encounters',()=>{
    assert.ok(frame('star',0).size<=20);
    assert.ok(frame('star',1).size>=300);
    assert.ok(frame('balloon',.4,1800).encounterCount>frame('balloon',.4,60).encounterCount);
    assert.notDeepEqual(frame('aquarium',.4,1800).position,frame('aquarium',.4,60).position);
    assert.equal(frame('aquarium',.9).treasure,0,'chest remains closed until arrival');
    assert.equal(frame('rainbow',.9).treasure,0,'rainbow completes before opening begins');
});
for(const theme of ['balloon','garden','aquarium','space','rainbow','star']) {
    test(`${theme}: every duration ends with the same complete scene`,()=>{
        const ending=frame(theme,1);
        for(const minutes of [1,2,5,10,20,30,45,180]) {
            const duration=minutes*60;
            const result=frame(theme,(duration-0)/duration);
            assert.deepEqual(result,ending);
            assert.ok(result.reveals.every(value=>value===1));
            assert.equal(result.finale,1);
            assert.equal(result.treasure,1);
            assert.equal(result.bloom,1);
            assert.equal(result.arrived,true);
        }
        assert.ok(frame(theme,.9).reveals.every(value=>value===1),'no half-revealed details at the end');
        assert.deepEqual(frame(theme,.92).position,ending.position,'landing finishes before zero');
    });
}

const {journeyPlan,journeyFrame}=require('../timer-worlds.js');
for(const theme of ['aquarium','space','balloon']) {
 test(`${theme}: camera travels continuously and longer timers have a longer world`,()=>{
  assert.ok(journeyPlan(theme,1800).width>journeyPlan(theme,300).width);
  for(const duration of [60,300,1800,10800]) {
   let previous=-1;
   for(let step=0;step<=100;step++) {
    const f=journeyFrame(theme,step/100,duration);
    assert.ok(f.camera>=previous);previous=f.camera;
    assert.ok(f.position[0]>=f.camera);
   }
   const start=journeyFrame(theme,0,duration),end=journeyFrame(theme,1,duration);
   const destinationX=start.width-1200+(theme==='aquarium'?1010:1005);
   assert.ok(destinationX-start.camera>1200,'destination starts beyond the viewport');
   assert.ok(destinationX-journeyFrame(theme,.7,duration).camera>1200,'destination remains beyond the viewport through most of the trip');
   assert.equal(end.position[0]-end.camera,theme==='balloon'?1100:theme==='aquarium'?820:1005);
   assert.equal(end.arrived,true);assert.equal(end.chestOpen,1);
  }
 });
}

const {gardenFrame}=require('../timer-worlds.js');
test('garden: rabbit stays behind beds and waters each bed before it grows',()=>{
 for(let i=0;i<6;i++) {
  const watering=(i+.6)/6*.86;
  const state=gardenFrame(watering);
  assert.equal(state.watering,true);
  assert.equal(state.position[0],285+i*104);
  assert.ok(state.position[1]<480,'feet stay behind flower tops');
  assert.ok(state.growth[i]>0);
  if(i<5) assert.equal(state.growth[i+1],0);
 }
 assert.ok(gardenFrame(1).growth.every(value=>value===1));
 assert.equal(gardenFrame(1).watering,false);
});

const {rainbowAmount,fishFrame}=require('../timer-worlds.js');
test('rainbow keeps building until the final three seconds, then opens without a gap',()=>{
 for(const duration of [60,300,1800]) {
  const opening=1-3/duration;
  assert.ok(rainbowAmount(opening-.001,6,duration)<1);
  assert.equal(rainbowAmount(opening,6,duration),1);
  assert.equal(frame('rainbow',opening,duration).treasure,0);
  assert.ok(frame('rainbow',opening+.001,duration).treasure>0);
  assert.equal(frame('rainbow',1,duration).treasure,1);
 }
});
test('fish travel horizontally and turn instead of merely bobbing',()=>{
 const a=fishFrame(1000,300,0,0),b=fishFrame(1000,300,12,0),c=fishFrame(1000,300,30,0);
 assert.ok(b.x-a.x>200);assert.ok(a.direction>0&&c.direction<0);
 assert.ok(Math.abs(b.y-a.y)<45);
});

test('animation loop stops on pause, reset and completion without duplicate loops',async()=>{
 const app=await setup();await app.click('startButton');assert.equal(app.animationFrames.size,1);
 app.animate();assert.equal(app.animationFrames.size,1);
 await app.click('pauseButton');assert.equal(app.animationFrames.size,0);
 await app.click('startButton');assert.equal(app.animationFrames.size,1);
 await app.click('restartButton');assert.equal(app.animationFrames.size,0);
 await app.click('startButton');app.advance(65000);assert.equal(app.animationFrames.size,0);
});

test('balloon always lands on the same meadow regardless of route duration',()=>{
 for(const duration of [60,120,300,600,1800,2700,10800]) {
  const end=journeyFrame('balloon',1,duration);
  const sourceX=((end.camera*.65+1100+end.panoramaOffset)%1845+1845)%1845;
  assert.ok(Math.abs(sourceX-1750)<.00001);
  assert.equal(end.position[1],600);
  assert.equal(Math.abs(end.angle),0);
 }
});

