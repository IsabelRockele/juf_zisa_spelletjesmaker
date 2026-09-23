const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function setup(){
 const c=vm.createContext({window:{},document:{readyState:'loading',addEventListener(){}},console});
 for(const f of ['woordenbibliotheek.js','woordenbiblio/graad1.js','woordenbiblio/zinnen-graad1.js','afbeeldingen.js','afbeeldingen-helper.js','schrijflijnen.js','thema-oefeningen.js','bundel.js']) vm.runInContext(fs.readFileSync(path.join(root,'spelling',f),'utf8'),c);
 return c.window;
}
function words(w,pairs){return pairs.map(([categorie,tekst])=>({...w.SpellingWoordenbibliotheek.graad1[categorie].woorden.find(x=>x.tekst===tekst),categorie,graad:1}));}
test('nieuwe oefeningen volgen graad en spellingdoel',()=>{
 const w=setup(),a=w.SpellingThemaOefeningen;
 for(const f of a.forms) assert.equal(a.pastBijDoelen(f.id,2,['mkm-a','lk-aa','zinnen-prent-g1','leestekens-eind-g1']),false);
 assert.equal(a.pastBijDoelen('tafereel',1,['zinnen-prent-g1']),true);
 assert.equal(a.pastBijDoelen('tafereel',1,['mkm-a']),false);
 assert.equal(a.pastBijDoelen('volgorde',1,['zinnen-volgorde-g1']),true);
 assert.equal(a.pastBijDoelen('leestekens',1,['leestekens-eind-g1']),true);
 assert.equal(a.pastBijDoelen('dialoog',1,['leestekens-binnen-g1']),false);
 assert.equal(a.pastBijDoelen('sorteren',1,['mkm-a']),false);
 assert.equal(a.pastBijDoelen('sorteren',1,['mkm-a','lk-aa']),true);
 assert.equal(a.pastBijDoelen('klinkers',1,['stukjes-verdubbelen']),false);
});
test('klankoefeningen gebruiken uitsluitend de geselecteerde woorden',()=>{
 const w=setup(),a=w.SpellingThemaOefeningen;
 const pool=words(w,[['mkm-a','kat'],['lk-aa','maan'],['tw-oe','boek']]);
 for(const id of ['sorteren','klinkers','symbolen','prenten','bedek','invulzin']){
  const b=a.maakBlok(id,pool);
  assert.deepEqual([...b.woorden.map(w=>w.tekst)].sort(),['boek','kat','maan']);
 }
 const b=a.maakBlok('sorteren',pool.slice(0,2));
 assert.deepEqual([...b.soorten],[0,1]);
 assert.throws(()=>a.maakBlok('sorteren',pool.slice(0,1)),/twee klanksoorten/);
 for(const id of ['klankzin','woordzin']) {
  const selected=words(w,[['mkm-a','kat'],['lk-aa','maan'],['mkm-o','pot'],['lk-oo','boot']]);
  const r=a.maakBlok(id,selected).rijen;
  assert.ok(r.length>0);
  for(const row of r) assert.ok(['kat','maan','pot','boot'].includes(row[2]));
 }
});
test('prentkeuze, schrijflijnen en oplossingen gebruiken dezelfde snapshot',()=>{
 const w=setup();
 const item={categorie:'g1-tafereel',seed:1,opties:{'g1-tafereel':{prent:'huis',lijntype:'type5',lijnhoogte:'klein'}},gekozenWoordenSnapshot:[],gekozenCategorieIdsSnapshot:['zinnen-prent-g1']};
 const b=w.SpellingBundel;
 const html=b._renderItemHTML(item,false);
 w._weekdictee_gekozenWoorden=[{tekst:'ander'}];
 const answers=b._renderItemHTML(item,true);
 assert.match(html,/taferelen\/huis.png/);assert.match(answers,/taferelen\/huis.png/);
 assert.match(html,/data-type="type5"/);assert.match(html,/data-hoogte="klein"/);
 assert.doesNotMatch(html,/De kat zit in de doos\./);assert.match(answers,/De kat zit in de doos\./);
 assert.equal(w._weekdictee_gekozenWoorden[0].tekst,'ander');
 assert.throws(()=>b._renderItemHTML({...item,categorie:'g1-sorteren',opties:{'g1-sorteren':{}}},false));
 assert.equal(w._weekdictee_gekozenWoorden[0].tekst,'ander');
});
test('alle prenten oefenen duidelijk op, in en voor bij dezelfde dieren',()=>{
 const a=setup().SpellingThemaOefeningen;
 for(const s of Object.values(a.scenes)){
  assert.ok(fs.existsSync(path.join(root,'spelling',s.src)));
  const q=s.vragen.map(r=>r[0]).join(' '),ans=s.vragen.map(r=>r[1]).join(' ');
  assert.match(q,/Waar zit de kat/);assert.match(q,/Waar zit de mus/);
  for(const prep of ['op','in','voor']) assert.equal(ans.split(' '+prep+' ').length-1,1);
  assert.doesNotMatch(q+' '+ans,/tussen|onder|vak/);
 }
});
test('alle nieuwe modules leveren gewone werkbladen met dezelfde kop en opdrachtstijl',()=>{
 const w=setup(),a=w.SpellingThemaOefeningen;
 w._weekdictee_gekozenWoorden=words(w,[['mkm-a','kat'],['mkm-a','bal'],['mkm-a','man'],['mkm-a','tas'],['lk-aa','maan'],['tw-oe','boek'],['lk-oo','boot']]);
 for(const f of a.forms) for(const opl of [false,true]){
  const html=w.SpellingModules['g1-'+f.id].genereerBlad({['g1-'+f.id]:{}},opl);
  assert.match(html,/class="werkblad to-blad/);assert.match(html,/class="ov01-header"/);
  assert.match(html,/class="ov01-stappen"/);assert.match(html,/class="ov01-voettekst"/);
  assert.doesNotMatch(html,/undefined|NaN/);
 }
 assert.equal(fs.readFileSync(path.join(root,'spelling/index.html'),'utf8').includes('thema-oefeningen-paneel'),false);
});

test('sorteren vergelijkt soorten, buitenbeentje kan ook a tegenover o vergelijken',()=>{
 const w=setup(),a=w.SpellingThemaOefeningen;
 for(const cats of [['mkm-a'],['mkm-a','mkm-o'],['lk-aa','lk-oo'],['tw-oe','tw-ui']]) assert.equal(a.pastBijDoelen('sorteren',1,cats),false);
 assert.equal(a.pastBijDoelen('sorteren',1,['mkm-a','tw-oe']),true);
 assert.equal(a.pastBijDoelen('buitenbeentje',1,['mkm-a']),false);
 assert.equal(a.pastBijDoelen('buitenbeentje',1,['mkm-a','mkm-o']),true);
 const pool=words(w,[['mkm-a','kat'],['mkm-a','bal'],['mkm-a','man'],['mkm-a','tas'],['mkm-o','pot']]);
 const b=a.maakBlok('buitenbeentje',pool);
 for(const r of b.rijen){assert.equal(r.woorden.length,5);assert.equal(r.antwoord,'pot');assert.equal(r.woorden.filter(x=>/o/.test(x)).length,1);}
});
test('klinkeropdracht benoemt alleen gekozen soorten en gebruikt een korte lijn',()=>{
 const w=setup();w._weekdictee_gekozenWoorden=words(w,[['mkm-a','kat']]);
 const render=()=>w.SpellingModules['g1-klinkers'].genereerBlad({},false);
 assert.doesNotMatch(render(),/tweetekenklank/);assert.match(render(),/width="76"/);
 w._weekdictee_gekozenWoorden=words(w,[['tw-oe','boek']]);assert.match(render(),/tweetekenklank/);
});
test('zinnen volgen de klankkeuze, alle prenten bestaan en oplossingen blijven gelijk',()=>{
 const w=setup(),a=w.SpellingThemaOefeningen;
 for(const groep of Object.keys(a.zinKlanken)) for(const id of ['tafereel','zelfzin','volgorde']){
  const opties={klankgroep:groep};
  const b=a.maakBlok(id,[],opties);
  const html=w.SpellingModules['g1-'+id].genereerBlad({['g1-'+id]:opties},false);
  if(groep==='kort-lang'){
   assert.doesNotMatch(html,/tweetekenklanken/);
   for(const r of b.vragen||[]) assert.doesNotMatch(r[1],/oe|eu|ui|ie|aai|ooi|oei/);
  }
  if(groep==='aai-ooi-oei'){
   assert.match(html,/Gebruik in elke zin een woord met aai, ooi of oei/);
   for(const r of b.vragen||[]) assert.match(r[1],/aai|ooi|oei/);
  }
  for(const match of html.matchAll(/<img[^>]+src="([^"]+)"/g)) assert.ok(fs.existsSync(path.join(root,'spelling',match[1])),match[1]);
 }
});
test('lettercode en verbindingen gebruiken gekozen doelwoorden',()=>{
 const w=setup(),a=w.SpellingThemaOefeningen;
 const pool=words(w,[['mkm-a','kat'],['mkm-a','bal'],['mkm-a','man'],['mkm-a','tas']]);
 w._weekdictee_gekozenWoorden=pool;
 assert.match(w.SpellingModules['g1-code'].genereerBlad({},true),/11 – 1 – 20/);
 const b=a.maakBlok('verbinden',pool);
 for(const r of b.delen) assert.ok(pool.some(w=>w.tekst===r.begin+r.eind));
 assert.equal(a.definities.find(f=>f.id==='g1-code').niveaus[0],'verdieping');
 assert.equal(a.definities.find(f=>f.id==='g1-verbinden').niveaus[0],'basis');
});

test('kolommen sorteren vereist ook effectief geselecteerde woorden uit twee soorten',()=>{
 const w=setup(),a=w.SpellingThemaOefeningen;
 const kort=words(w,[['mkm-a','kat']]),lang=words(w,[['lk-aa','maan']]);
 assert.equal(a.pastBijDoelen('sorteren',1,['mkm-a','lk-aa'],kort),false);
 assert.equal(a.pastBijDoelen('sorteren',1,['mkm-a','lk-aa'],lang),false);
 assert.equal(a.pastBijDoelen('sorteren',1,['mkm-a','lk-aa'],[]),false);
 assert.equal(a.pastBijDoelen('sorteren',1,['mkm-a','lk-aa'],[...kort,...lang]),true);
});

test('symbolen en gecombineerd blad blijven binnen de gekozen klanken',()=>{
 const w=setup(),a=w.SpellingThemaOefeningen;
 const kort=words(w,[['mkm-a','bal'],['mkm-a','kat'],['mkm-a','tas'],['mkm-a','man']]);
 for(const [pool,verboden] of [[kort,/━|▲|lange klank|tweetekenklank/],[[...kort,...words(w,[['lk-aa','maan']])],/▲|tweetekenklank/]]){
  w._weekdictee_gekozenWoorden=pool;
  assert.doesNotMatch(w.SpellingModules['g1-symbolen'].genereerBlad({},false),verboden);
  assert.doesNotMatch(w.SpellingModules['g1-klankmix'].genereerBlad({},false),verboden);
 }
 assert.equal(a.maakBlok('klankmix',kort).blokken.length,2);
 const mix=a.maakBlok('klankmix',[...kort,...words(w,[['mkm-o','pot']])]);
 assert.equal(mix.blokken.length,3);
 for(const rij of mix.blokken[2].rijen){assert.equal(rij.antwoord,'pot');assert.ok(rij.woorden.every(t=>kort.some(w=>w.tekst===t)||t==='pot'));}
 for(const id of ['klinkers','symbolen','buitenbeentje']) assert.ok(!a.definities.some(f=>f.id==='g1-'+id));
 assert.ok(a.definities.some(f=>f.id==='g1-klankmix'));
});

test('de volledige groep korte klanken bevat geen MK/KM of ui in de klankmix',()=>{
 const w=setup(),data=w.SpellingWoordenbibliotheek.graad1,a=w.SpellingThemaOefeningen;
 assert.notEqual(data['mk-km'].groep,'korte-klanken');
 const pool=Object.entries(data).filter(([id,c])=>c.groep==='korte-klanken').flatMap(([categorie,c])=>c.woorden.map(x=>({...x,categorie})));
 // Ook een oude selectie met MK/KM en foutief gemarkeerde woorden mag niet lekken.
 pool.push({tekst:'uit',categorie:'mk-km'},{tekst:'uit',categorie:'mkm-u'});
 const b=a.maakBlok('klankmix',pool);
 assert.ok(!b.woorden.some(w=>w.tekst==='uit'));
 for(const rij of b.blokken.find(b=>b.id==='buitenbeentje').rijen) assert.ok(!rij.woorden.includes('uit'));
 w._weekdictee_gekozenWoorden=pool;
 const html=w.SpellingModules['g1-klankmix'].genereerBlad({},false);
 assert.doesNotMatch(html,/tweetekenklank|▲|━/);
});

test('kort-lang-keuzes vereisen beide werkelijk gekozen klanken, ook in afleiders',()=>{
 const w=setup(),a=w.SpellingThemaOefeningen;
 for(const id of ['klankzin','woordzin']) {
  assert.equal(a.pastBijDoelen(id,1,['mkm-a','mkm-o']),false);
  assert.equal(a.pastBijDoelen(id,1,['lk-aa','lk-oo']),false);
  assert.equal(a.pastBijDoelen(id,1,['mkm-a','lk-oo']),false);
  assert.equal(a.pastBijDoelen(id,1,['mkm-a','lk-aa']),true);
  const pool=words(w,[['mkm-a','kat'],['lk-aa','maan']]);
  for(const r of a.maakBlok(id,pool).rijen) assert.equal(r[0],id==='klankzin'?'a / aa':'man / maan');
 }
});
