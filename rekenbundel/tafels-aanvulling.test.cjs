const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname+'/modules/tafels-aanvulling.js','utf8')+'\nthis.module=TafelsAanvulling;',context);
const mod=context.module;
for(let t=1;t<=10;t++)for(const soort of ['vermenigvuldigen','groepjes','eerlijk']){
 const oefeningen=mod.verhalen(t,soort);
 assert.equal(oefeningen.length,6);assert.equal(new Set(oefeningen.map(o=>o.tekst)).size,6);
 for(const o of oefeningen){assert.equal(o.n,o.t*o.m);assert.equal(o.antwoord,soort==='vermenigvuldigen'?o.n:o.m);}
}
const pool=mod.genereer({variant:'vraagstukken',tafels:[2,3],soorten:['vermenigvuldigen','groepjes','eerlijk'],aantalOefeningen:0});
assert.equal(pool.length,36);assert.equal(new Set(pool.map(o=>o.sleutel)).size,36);
for(const variant of ['taal','tussenstap','tekenen','koppelen'])for(const bewerking of ['vermenigvuldigen','delen-aftrekking']){
 const oefeningen=mod.genereer({variant,bewerking,tafels:[1,2,5,10],tafelMax:12,aantalOefeningen:0});
 assert.ok(oefeningen.length);
 for(const o of oefeningen){
  const {items,h,w}=mod.tekening(o,{});assert.ok(h<240,`${variant}: ${h}`);
  if(variant==='tekenen')assert.equal(w,88,'Drawing exercises use half-page width');
  if(variant==='taal')assert.equal(w,bewerking==='vermenigvuldigen'?88:182,'Only multiplication language exercises use two columns');
  for(const p of items){assert.ok(p.y+(p.h||0)<=h);assert.ok(p.x+(p.w||0)<=w);}
 }
}
context.document={createElement:()=>({dataset:{}})};
for(const bewerking of ['vermenigvuldigen','delen-aftrekking']){
 const config={variant:'taal',bewerking,tafels:[2],tafelMax:5,aantalOefeningen:2};
 const blok={id:'taal-test',config,opdrachtzin:'Bekijk de groepjes.',oefeningen:mod.genereer(config)};
 assert.match(mod.maakBlokElement(blok).innerHTML,new RegExp(`tafel-rij-${bewerking==='vermenigvuldigen'?2:1}`));
 const kaders=[];
 const doc=new Proxy({splitTextToSize:s=>[s],roundedRect:(x,y,w,h,rx,ry,stijl)=>{if(stijl==='FD')kaders.push({x,y,w,h});}},{get:(o,k)=>o[k]||(()=>{})});
 mod.tekenPdf(blok,doc,15,{ML:14,CW:182,MT:15,PH:297,MB:15,metAntwoorden:false,nieuwePagina:()=>{}});
 assert.equal(kaders.length,2);
 if(bewerking==='vermenigvuldigen'){assert.equal(kaders[0].y,kaders[1].y);assert.equal(kaders[0].w,88);assert.ok(kaders[1].x>kaders[0].x);}
 else {assert.ok(kaders[1].y>kaders[0].y);assert.equal(kaders[0].w,182);}
}
// The first heading and exercise must move together at a page boundary.
for(const start of [15,180,240,270]){
 let page=1,events=[];const doc=new Proxy({splitTextToSize:()=>['Opdracht op twee regels','Tweede regel']},{get:(o,k)=>o[k]||((...args)=>events.push({page,k,args}))});
 const blok={opdrachtzin:'Lange opdracht',config:{antwoordzin:'zelf'},oefeningen:pool.slice(0,6)};
 mod.tekenPdf(blok,doc,start,{ML:14,CW:182,MT:15,PH:297,MB:15,metAntwoorden:false,nieuwePagina:()=>page++});
 const texts=events.filter(e=>e.k==='text');assert.equal(texts[0].page,texts[1].page);
 for(const e of texts)assert.ok(e.args[2]<=282&&e.args[2]>=15,'Text stays within page margins');
}
console.log('Tafels: 180 vraagstukken, begrensde tekeningen, geen dubbele selectie, opdracht en eerste oefening samen.');
vm.runInContext(fs.readFileSync(__dirname+'/modules/tafels.js','utf8')+'\nthis.tafels=Tafels;',context);
for(const type of ['Ontbrekende factor','Koppel'])for(const positie of ['vooraan','achteraan','beide']){
 const oefeningen=context.tafels.genereer({tafels:[2],oefeningstypes:[type],tafelPositie:positie,tafelMax:10,aantalOefeningen:100});
 for(const o of oefeningen){
  if(o.type==='ontbrekende-factor')assert.ok(Number.isFinite(o.product/(o.positie==='links'?o.b:o.a)));
  else assert.ok(o.factor2>0,'No undefined division by zero in a worked example');
 }
}
