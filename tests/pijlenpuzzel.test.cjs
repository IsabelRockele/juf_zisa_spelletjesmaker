const assert=require('node:assert/strict');
const {makePuzzle,THEMES}=require('../pijlenpuzzel.js');
for(const theme of Object.keys(THEMES)) for(let level=1;level<=3;level++) for(let sample=0;sample<25;sample++) {
 const p=makePuzzle(theme,level);
 assert.equal(p.cols,[0,6,8,10][level]);
 assert.equal(p.objects.length,p.cols);
 assert.equal(new Set(p.objects).size,p.cols);
 let at=0;
 for(const command of p.commands){
  assert(command.steps>=1&&command.steps<=(level===3?2:1));
  if(level===1)assert.equal(Math.abs(command.dx)+Math.abs(command.dy),1);
  for(let step=0;step<command.steps;step++){
   const before=p.path[at++],after=p.path[at];
   assert.deepEqual(after,[before[0]+command.dx,before[1]+command.dy]);
   assert(after[0]>=0&&after[0]<p.cols&&after[1]>=0&&after[1]<p.rows);
  }
 }
 assert.equal(at,p.path.length-1);
 assert.equal(p.path[0][1],0);
 assert.equal(p.path.at(-1)[1],p.rows-1);
 assert.equal(new Set(p.path.map(point=>point.join(','))).size,p.path.length);
 assert(p.objects.every(source=>source.startsWith('assets/pijlenpuzzel-los/')));
}
console.log('525 puzzels: 6/8/10 kolommen, verschillende voorwerpen, juiste route en eindpunt.');
