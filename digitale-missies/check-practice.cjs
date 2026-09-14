const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function element(){return {addEventListener(){},querySelectorAll(){return []},replaceWith(){},cloneNode:element};}
const storage=new Map(),context=vm.createContext({console,document:{querySelector:element,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{},setTimeout,clearTimeout,Set,URL});
vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/practice.js','utf8'),context);
const result=vm.runInContext(`['6-7','7-8'].map(age=>{state.age=age;return {age,missions:missions.filter(available).map(m=>({id:m.id,tasks:tasksFor(m).map(t=>({id:t.id,type:t.type,goals:t.goals.filter(goalForAge),cols:t.cols,rows:t.rows,start:t.start,finish:t.finish,solution:t.solution,rocks:t.rocks}))}))}})`,context);
const expected={'6-7':['002','003','004','014','015','019','027','035','037','042','044','045','046','055','058','061','064','092','093'],'7-8':['003','004','014','015','019','027','028','029','030','035','037','042','044','046','055','058','061','064','092','093']};
for(const group of result){const tasks=group.missions.flatMap(m=>m.tasks),goals=[...new Set(tasks.flatMap(t=>t.goals))].sort();assert.deepEqual(JSON.parse(JSON.stringify(goals)),expected[group.age].map(g=>'IT.'+g));assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);
 for(const t of tasks.filter(t=>t.type==='route')){let [x,y]=t.start;for(const step of t.solution){if(step==='↑')y--;if(step==='↓')y++;if(step==='→')x++;if(step==='←')x--;assert(x>=0&&y>=0&&x<t.cols&&y<t.rows,t.id+' boundary');assert(!t.rocks.some(([a,b])=>a===x&&b===y),t.id+' rock');}assert.deepEqual([x,y],Array.from(t.finish));}
 console.log(group.age+': '+tasks.length+' opdrachten, '+goals.length+' leerplandoelen, '+tasks.filter(t=>t.type==='choice').length+' meerkeuzevragen; alle robotroutes geldig.');
}
vm.runInContext(`state.age='7-8';loadPracticeProgress();session={tasks:[{id:'test',goals:['IT.035'],type:'media'}],index:0};addHit('IT.035');addHit('IT.035');`,context);
assert.equal(vm.runInContext(`state.hits['IT.035']`,context),1);
vm.runInContext(`save();state.age='6-7';loadPracticeProgress();`,context);
assert.equal(vm.runInContext(`state.hits['IT.035']||0`,context),0);
vm.runInContext(`session.tasks[0].requiresObservation=true;addHit('IT.035')`,context);
assert.equal(vm.runInContext(`state.hits['IT.035']||0`,context),0);
console.log('Unieke oefenbewijzen, leeftijdsscheiding en observatieblokkering gecontroleerd.');
assert.equal(vm.runInContext(`mediaRequirements({adjust:'volumeUp'},{started:true,adjusted:false,stopped:true}).every(([,done])=>done)`,context),false);
assert.equal(vm.runInContext(`mediaRequirements({adjust:'volumeUp'},{started:true,adjusted:true,stopped:true}).every(([,done])=>done)`,context),true);
assert.equal(vm.runInContext(`mediaRequirements({question:'Kijkvraag'},{started:true,paused:true,answered:true,resumed:true,stopped:false}).every(([,done])=>done)`,context),false);
assert.equal(vm.runInContext(`mediaRequirements({question:'Kijkvraag'},{started:true,paused:true,answered:true,resumed:true,stopped:true}).every(([,done])=>done)`,context),true);
console.log('Media: ontbrekende handelingen blokkeren afronding; complete kijk- en volumetaken kunnen verder.');
