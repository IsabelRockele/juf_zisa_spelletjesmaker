const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const policy=require('./access-policy.js');
const base='https://example.org/school/';
function boot(path,protocol='https:') {
 const events={},scripts=[],nodes={};
 const context=vm.createContext({URL,AdventurePolicy:policy,location:{pathname:path,protocol,hostname:protocol==='file:'?'':'example.org'},document:{currentScript:{src:base+'drakeneiland/access.js'},documentElement:{dataset:{}},head:{appendChild(s){scripts.push(s);}},createElement(){return {};},addEventListener(type,fn){events[type]=fn;},getElementById(id){return nodes[id]||=( {} );}}});
 vm.runInContext(fs.readFileSync(__dirname+'/access.js','utf8'),context);events.DOMContentLoaded();return {context,scripts,nodes};
}
let test=boot('/school/pro/drakeneiland/index.html');
assert.equal(test.context.AdventureAccess.ready,false);
assert.equal(test.scripts[0].src,base+'pro/guard.js');
assert.equal(test.nodes.menuLink.href,base+'pro/app.html');
test.context.onProReady();assert.equal(test.context.AdventureAccess.ready,true);
test=boot('/school/drakeneiland/index.html');assert.equal(test.scripts[0].src,base+'drakeneiland/colleague-access.js');assert.equal(test.nodes.menuLink.href,base+'index.html');
test=boot('/school/ontdek/drakeneiland/index.html');assert.equal(test.scripts.length,0);assert.equal(test.context.AdventureAccess.edition,'ontdek');assert.equal(test.nodes.menuLink.href,base+'ontdek/app.html');
test=boot('/school/pro/drakeneiland/index.html','file:');assert.equal(test.context.AdventureAccess.ready,true);assert.equal(test.scripts.length,0);
const attempted={world:'space',operation:'mul',range:20,count:4,target:30,duration:0,coop:true,storms:true};
const limited=policy.config(attempted,'ontdek');assert.deepEqual([limited.world,limited.operation,limited.range,limited.count,limited.target,limited.duration,limited.coop,limited.storms],['dragon','add',10,2,10,90,false,false]);assert.deepEqual(policy.config(attempted,'pro'),attempted);
const root=fs.readFileSync(__dirname+'/index.html','utf8');
for(const edition of ['pro','ontdek']) {
 const html=fs.readFileSync(`${__dirname}/../${edition}/drakeneiland/index.html`,'utf8');
 assert.equal(html,root.replace('<head>','<head><base href="../../drakeneiland/">').replaceAll('href="../index.html"',`href="../${edition}/app.html"`));
 const menu=fs.readFileSync(`${__dirname}/../${edition}/app.html`,'utf8');assert.match(menu,/<a[^>]+href="\.\/drakeneiland\/index.html"[^>]+target="_blank"/);
}
assert.match(fs.readFileSync(__dirname+'/../ontdek/ontdek-menu.js','utf8'),/\['Rekenavonturen', '\.\/drakeneiland\/index.html'\]/);
console.log('Edities getest: Pro-inlogpoort en terugroute, collega-inlog, Ontdek-beperkingen, aparte tabs en gelijke gedeelde pagina’s.');
