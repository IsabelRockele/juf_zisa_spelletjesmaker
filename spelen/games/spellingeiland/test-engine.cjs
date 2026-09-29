const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.window=globalThis;require('./data.js');require('./engine.js');
const D=SpellingData,E=SpellingEngine;
const shape=word=>word.replace(/aa|ee|oo|uu|oe|ie|eu|ui|ei|ij|ou|au|[aeiou]/g,'K').replace(/[a-z]/g,'M');
for(const cat of D.categories){
 assert(cat.words.length>=3,cat.id);
 for(const word of cat.words){
  assert(E.target(cat,word),cat.id+' '+word.word);
  if(word.image)assert(fs.existsSync(path.resolve(__dirname,word.image)),word.image);
  if(['kort','lang','tweeteken'].includes(cat.id))assert.equal(shape(word.word),'MKM',word.word);
  if(/^m+k+m+$/.test(cat.id)&&word.word!=='herfst')assert.equal(shape(word.word),cat.id.toUpperCase(),word.word);
  if(cat.ending)assert(word.long,word.word);
  for(let i=0;i<6;i++){
   const ex=E.makeExercise({cat,word},'workshop',i,D.pairs);
   if(ex.options)assert.equal(ex.options.filter(o=>o===ex.answer).length,1,word.word);
   if(ex.type==='shuffle')assert.equal([...ex.answer].sort().join(''),[...ex.tokens].sort().join(''));
   if(ex.type==='gap')assert(cat.choices.includes(ex.answer));
  }
 }
 for(const count of [5,10,15,20]){const q=E.makeQueue([cat],count);assert.equal(q.length,count);if(cat.words.length>=count)assert.equal(new Set(q.map(i=>i.word.word)).size,count);}
}
for(let n=1;n<=20;n++){const cats=D.categories.slice(0,n),q=E.makeQueue(cats,20),counts=cats.map(c=>q.filter(i=>i.cat.id===c.id).length);assert.equal(q.length,20);assert(Math.max(...counts)-Math.min(...counts)<=1);}
const q=E.makeQueue([D.categories[0]],20);assert(E.scheduleRepeat(q,0,q[0]));assert.equal(q[3].word,q[0].word);assert(q[3].repeat);assert(!E.scheduleRepeat(q,19,q[19]));assert(!E.scheduleRepeat(q,3,q[3]));assert.equal(E.normalize('  KAT  '),'kat');
console.log('Geslaagd: 29 categorieën, alle woordvormen, prenten, keuzes, letterpatronen, aantallen en herhalingen.');
assert.deepEqual(E.repairLetters('kot','kat'),['k','','t']);
assert.deepEqual(E.repairLetters('kt','kat'),['k','','t']);
assert.deepEqual(E.repairLetters('kaat','kat'),null);
assert.deepEqual(E.repairLetters('hnt','hond'),['h','','n','']);
console.log('Geslaagd: gerichte correcties bij verkeerde, ontbrekende en extra letters.');

// A second round avoids recent words whenever the pool has enough alternatives.
const large={id:'variety',words:Array.from({length:45},(_,i)=>({word:'woord'+i}))};
const first=E.makeQueue([large],20,()=>.37),history=first.map(i=>i.word.word);
const second=E.makeQueue([large],20,()=>.37,history);
assert(second.every(i=>!history.includes(i.word.word)));
const tiny={id:'tiny',words:[{word:'kat'},{word:'vis'},{word:'zon'}]};
const small=E.makeQueue([tiny],10,()=>.37,['kat','vis','zon']);
assert.equal(E.makeQueue([tiny],1,()=>.37,['kat','vis','zon'])[0].word.word,'kat');
assert.equal(new Set(small.map(i=>i.word.word)).size,3);
const balanced=E.makeQueue([large,tiny],20,()=>.37,history);
assert.equal(balanced.filter(i=>i.cat.id==='tiny').length,3);assert.equal(new Set(balanced.map(i=>i.word.word)).size,20);
const pairs=D.pairs;
const sentenceHistory=[];
for(let n=0;n<pairs.length;n++){
 const ex=E.makeExercise({cat:{id:'kort'},word:{word:'man'}},'workshop',0,pairs,()=>.37,sentenceHistory);
 const key='zin:'+ex.pair.words.slice().sort().join('|');assert(!sentenceHistory.includes(key));sentenceHistory.push(key);
 for(let i=0;i<2;i++){const original=pairs.find(p=>p.words.includes(ex.pair.words[i]));assert.equal(ex.pair.sentences[i],original.sentences[original.words.indexOf(ex.pair.words[i])]);}
}
console.log('Geslaagd: nieuwe woorden eerst, oudste woorden bij kleine voorraad, evenwichtige mix en gevarieerde zinnen.');

for(const word of ['maan','mama','kat']){const ex=E.makeExercise({cat:{id:'test'},word:{word}},'workshop',1,[],()=>.99999);assert.notEqual(ex.tokens.join(''),word);}
