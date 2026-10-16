const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function load(storage=new Map()){
 const context={URL,window:{},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{currentScript:{src:'https://example.test/spelen/games/tafel-volgorde.js'},createElement:()=>({}),head:{append(){}},readyState:'loading',addEventListener(){}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'spelen/games/tafel-volgorde.js'),'utf8'),context);
 return context.window.ZisaTafelVolgorde;
}
test('default matches 1 × 2, both choices support all table factors',()=>{
 const setting=load();assert.equal(setting.format(2,3),'3 × 2');
 for(const order of ['achteraan','vooraan']){
  setting.set(order);
  for(let table=0;table<=10;table++)for(let factor=0;factor<=10;factor++){
   const [a,b]=setting.format(table,factor).split(' × ').map(Number);
   assert.equal(order==='achteraan'?b:a,table);assert.equal(a*b,table*factor);
  }
 }
});
test('choice carries over between pages and invalid values fall back safely',()=>{
 const storage=new Map(),setting=load(storage);setting.set('vooraan');assert.equal(load(storage).format(2,3),'2 × 3');
 setting.set('invalid');assert.equal(setting.format(2,3),'3 × 2');
});
test('real level 1 generator applies orientation without changing division',()=>{
 const code=fs.readFileSync(path.join(root,'spelen/games/level1.js'),'utf8');
 const start=code.indexOf('function genereerOpgavenPerTafel()'),end=code.indexOf('\n}',start)+2;
 for(const order of ['achteraan','vooraan']){
  const setting=load();setting.set(order);
  const ctx={ZisaTafelVolgorde:setting,gekozenTafels:[2],sessionStorage:{getItem:()=> 'beide'}};
  vm.runInNewContext(code.slice(start,end),ctx);
  const questions=ctx.genereerOpgavenPerTafel();
  assert.ok(questions.some(q=>q.vraag===(order==='achteraan'?'3 × 2':'2 × 3')&&q.juist===6));
  assert.ok(questions.some(q=>q.vraag==='6 ÷ 2'&&q.juist===3));
 }
});
