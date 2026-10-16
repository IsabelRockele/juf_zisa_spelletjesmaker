const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../spelen/games/zisa-play-guard.js'),'utf8');
function navigation({discover=false,start=false,grade='1'}={}){
  const elements=[],redirects=[];let observer;
  const element=(label='',href='')=>({textContent:label,style:{setProperty(){}},getAttribute:()=>href,matches:()=>false});
  const exit=element('← Rekenhuis','../eilanden-leerjaar1.html#rekenen'),play=element('Opnieuw spelen'),settings=element('Spel instellen');elements.push(exit,play,settings);
  const body={classList:{contains:()=>false},append(el){el.parentElement=this;if(!elements.includes(el))elements.push(el)}};
  const context={URL,folder:'bibi-dagen',startMatch:start?['','1']:null,discoverParams:new URLSearchParams(),sessionStorage:{getItem:()=>grade},gamesRootUrl:new URL('https://test/spelen/games/'),playHomeUrl:'https://test/spelen/',isDiscoverPreview:discover,
    document:{querySelector:()=>null,documentElement:{classList:{contains:()=>false}},body,getElementById:id=>elements.find(el=>el.id===id),createElement:()=>element(),querySelectorAll:selector=>selector==='a,button'?elements:[]},
    location:{assign:url=>redirects.push(url)},window:{},MutationObserver:class{constructor(fn){observer=fn}observe(){}}};
  vm.runInNewContext(source.slice(source.indexOf('function addZisaNavigation()'),source.indexOf('function showDiscoverProMessage()')).replaceAll('import.meta.url',"'https://test/spelen/games/zisa-play-guard.js'"),context);
  context.addZisaNavigation();context.addZisaNavigation();observer();
  return {elements,redirects,exit,play,settings,button:elements.find(el=>el.id==='zisaNavButton')};
}
test('one back button goes straight to own grade; duplicate exit hidden, gameplay kept',()=>{
 const n=navigation();assert.equal(n.elements.filter(el=>el.id==='zisaNavButton').length,1);
 assert.equal(n.exit.hidden,true);assert.ok(!n.play.hidden);assert.ok(!n.settings.hidden);
 n.button.onclick();assert.equal(n.redirects[0],'https://test/spelen/games/start_leerjaar1.html');
});
test('discover returns to discover; grade menu returns to grade selection',()=>{
 const d=navigation({discover:true});d.button.onclick();assert.equal(d.redirects[0],'https://test/ontdek/zisa-spelen.html');
 const g=navigation({start:true});g.button.onclick();assert.equal(g.redirects[0],'https://test/spelen/');
});
test('island navigation no longer builds a route chooser',()=>{
 const island=fs.readFileSync(require('node:path').join(__dirname,'../spelen/games/eiland-navigatie.js'),'utf8');
 assert.ok(!island.includes('showModal'));assert.ok(!island.includes('Waar wil je naartoe?'));
 assert.ok(island.includes("other.textContent='🏝️ Ander eiland'"));
 assert.ok(island.includes("'tafel_spelletjes.html':'tafel_overzicht.html'"));
 assert.ok(!island.includes('position:fixed'));
});
