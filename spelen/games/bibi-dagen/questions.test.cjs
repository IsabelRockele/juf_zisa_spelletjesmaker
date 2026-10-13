const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/game.js','utf8');
const generator=source.slice(source.indexOf(' const recentQuestions='),source.indexOf(' function start()'));
const activityDeclaration=source.match(/ const activities=\[[^;]+;/)[0];
const run=new vm.Script(`${activityDeclaration}
const mod=n=>(n%7+7)%7;let mode,level;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
${generator}
for(mode of ['step','plan','listen','order'])for(level of [1,2])for(let round=0;round<100;round++){
 const deck=buildDeck();assert.equal(deck.length,8);assert.equal(new Set(deck.map(questionKey)).size,8,mode+' repeats');
 assert(new Set(deck.map(q=>q.today)).size>=5,'day variety');
 if(mode==='listen'||mode==='plan')assert(new Set(deck.map(q=>q.activity)).size>=5,'activity variety');
 for(const q of deck){if(q.mission!=='count')assert(q.delta!==0);assert.equal(q.target,q.mission==='count'?7:q.mission==='recognize'?q.today:mod(q.today+q.delta));if(q.anchorOffset)assert.equal(q.delta,-q.anchorOffset);if(mode==='order'){assert.equal(new Set(q.missing).size,4);assert(!q.missing.includes(0));}}
}
`);
run.runInNewContext({assert,Math});run.runInNewContext({assert,Math:Object.assign(Object.create(Math),{random:()=>0})});
console.log('PASS 1600 rounds: eight unique questions per round, varied days and activities, inverse questions and bridge patterns; also with constant random output.');
