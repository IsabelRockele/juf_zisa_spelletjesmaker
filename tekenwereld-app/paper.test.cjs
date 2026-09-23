const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PNG}=require('pngjs');
require('esbuild').buildSync({entryPoints:['lib/paper.ts'],outfile:'.preview/paper-test.cjs',bundle:true,platform:'node',format:'cjs'});
const {removePaperPixels}=require('./.preview/paper-test.cjs');
const w=300,h=360;
const cases={
 white:(x,y)=>[250,250,250],
 grey:(x,y)=>[170,170,170],
 gradient:(x,y)=>{const n=125+100*x/w+15*y/h;return [n,n,n];},
 warm_shadow:(x,y)=>{const n=240-75*Math.exp(-(((x-60)/75)**2));return [n,n*.92,n*.84];},
 cool_shadow:(x,y)=>{const n=230-55*Math.exp(-(((y-230)/85)**2));return [n*.87,n*.95,n];}
};
for(const [label,light] of Object.entries(cases)){
 const p=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=(y*w+x)*4,r=Math.hypot(x-150,y-180),bg=light(x,y);
  let color=bg;
  if(r>=66&&r<70&&!(x>218&&Math.abs(y-180)<1))color=bg.map(v=>v*.1);
  else if(r<66&&x<135)color=bg.map((v,c)=>v*[.95,.25,.2][c]);
  else if(r<30&&x>165)color=bg.map(v=>v*.45);
  p.set([...color,255],k);
 }
 const before=new Uint8ClampedArray(p);removePaperPixels(p,w,h);
 let remainingOutside=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=(y*w+x)*4,r=Math.hypot(x-150,y-180);
  if(r>85&&p[k+3])remainingOutside++;
  if(r<60){assert.equal(p[k+3],255,label+' white/grey/colour inside remains');for(let ch=0;ch<3;ch++)assert.equal(p[k+ch],before[k+ch],label+' original colour');}
 }
 assert.equal(remainingOutside,0,label+' surrounding paper removed');
 fs.writeFileSync(`.preview/paper-${label}-before.png`,PNG.sync.write({width:w,height:h,data:Buffer.from(before)}));
 fs.writeFileSync(`.preview/paper-${label}-after.png`,PNG.sync.write({width:w,height:h,data:Buffer.from(p)}));
 console.log('PASS',label,'paper transparent; white, grey and colour inside preserved');
}
const black=new Uint8ClampedArray(w*h*4);for(let i=3;i<black.length;i+=4)black[i]=255;
assert.throws(()=>removePaperPixels(black,w,h),/papier/,'do not send an opaque rectangle');
console.log('PASS unusable photo rejected');
