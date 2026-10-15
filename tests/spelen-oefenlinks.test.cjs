const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
function setup(search='',config={grade1:true},reject=false){
  const elements=new Map(),session=new Map(),redirects=[],calls=[];
  const element=()=>({value:'',children:[],hidden:true,addEventListener(){},replaceChildren(...children){this.children=children},append(...children){this.children.push(...children)},querySelector(){return element()}});
  const context={URL,URLSearchParams,console:{error(){}},navigator:{userAgent:'Desktop'},crypto:{randomUUID:()=> 'test-device'},
    location:{href:'https://example.test/spelen/'+search,search,hostname:'example.test',replace:url=>redirects.push(url)},
    document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element},
    sessionStorage:{getItem:key=>session.get(key)||null,setItem:(key,value)=>session.set(key,value),removeItem:key=>session.delete(key)},
    localStorage:{getItem:()=>null,setItem(){}},initializeApp:()=>({}),getApps:()=>[],getFunctions:()=>({}),getAuth:()=>({}),
    httpsCallable:(_,name)=>async()=>{calls.push(name);if(reject)throw Error('denied');return {data:{config,registeredCount:1}}},
    Option:function(label,value){this.textContent=label;this.value=value}
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(read('spelen/oefenlinks.js'),context);
  return {context,elements,session,redirects,calls};
}
async function open(options){
  const state=setup(...options);
  vm.runInContext(read('spelen/spelen.js').replace(/^import .*;\r?\n/gm,''),state.context);
  await new Promise(resolve=>setImmediate(resolve));
  return state;
}
test('all fixed destinations exist and IDs are unique',()=>{
  const {games}=setup().context.ZisaPlayLinks;
  assert.equal(new Set(games.map(g=>g.id)).size,games.length);
  for(const game of games)assert.ok(fs.existsSync(path.join(root,'spelen/games',game.path.split('?')[0])),game.path);
});
test('shared URL preserves class code and replaces only exercise',()=>{
  const {url}=setup().context.ZisaPlayLinks;
  const result=new URL(url('https://example.test/spelen/?code=abc&oefening=old','dagen-week'));
  assert.equal(result.searchParams.get('code'),'abc');
  assert.equal(result.searchParams.get('oefening'),'dagen-week');
  assert.equal(new URL(url(result.href,'')).searchParams.has('oefening'),false);
});
test('fresh colleague link opens days and establishes student session',async()=>{
  const s=await open(['?gratis=1&leerjaren=1&oefening=dagen-week']);
  assert.equal(s.redirects[0],'https://example.test/spelen/games/bibi-dagen/index.html');
  assert.equal(s.session.get('zisa_play_grade'),'1');
  assert.equal(s.session.get('zisa_colleague_play'),'1');
  assert.equal(s.calls.length,0);
});
test('PRO exercise waits for normal class access check',async()=>{
  const s=await open(['?code=abc&oefening=dagen-week']);
  assert.deepEqual(s.calls,['joinPlayClass']);
  assert.equal(s.redirects.length,1);
  assert.equal(s.session.get('zisa_play_code'),'abc');
});
test('denied access never redirects to exercise',async()=>{
  const s=await open(['?code=abc&oefening=dagen-week',{grade1:true},true]);
  assert.equal(s.redirects.length,0);
  assert.equal(s.elements.get('errorState').hidden,false);
});
test('disabled grades, unknown destinations and old links keep grade menu',async()=>{
  for(const search of ['?code=abc&oefening=dagen-week','?code=abc&oefening=https://evil.test','?code=abc']){
    const s=await open([search,{grade2:true}]);
    assert.equal(s.redirects.length,0);
    assert.equal(s.elements.get('gameMenu').hidden,false);
    assert.equal(s.elements.get('gradeGrid').children.length,1);
  }
});
test('selection resets when its grade is disabled',()=>{
  const s=setup(),select=s.context.document.createElement('select');
  select.value='dagen-week';s.context.ZisaPlayLinks.fill(select,[1,2]);assert.equal(select.value,'dagen-week');
  s.context.ZisaPlayLinks.fill(select,[2]);assert.equal(select.value,'');
});
test('both share pages contain selector and syntactically valid scripts',()=>{
  for(const file of ['zisa-spelen.html','pro/zisa-spelen.html']){
    const html=read(file);assert.match(html,/id="exercise"/);
    for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1].replace(/^\s*import .*;\r?\n/gm,''));
  }
});
