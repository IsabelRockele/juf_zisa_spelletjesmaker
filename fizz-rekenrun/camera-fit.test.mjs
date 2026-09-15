import assert from 'node:assert/strict';
import {fitGateCamera} from './camera-fit.mjs';
import {course} from './core.mjs';

let count=0;
// Small laptops, browser zoom, iPad portrait/landscape and phones.
for(const [w,h] of [[1366,768],[1024,600],[820,1180],[1180,820],[768,1024],[1024,768],[390,844],[844,390]]){
  const safe={left:16,right:w-16,top:h<500?230:320,bottom:h-110};
  for(let level=0;level<5;level++)for(const gate of course(level).gates){
    for(const dx of [-6,0,3,6,8.3])for(const jump of [0,2,4]){
      const player={x:gate.x+dx,y:gate.y+jump};
      const camera=fitGateCamera(w,h,safe,gate,player);
      const pixels=w/camera.span;
      const project=(x,y)=>({x:w/2+(x-camera.x)*pixels,y:h/2-(y-camera.y)*pixels});
      const points=[[player.x-1,player.y],[player.x+1,player.y+2.2]];
      for(let i=0;i<3;i++)points.push([gate.x+i*3-.9,gate.y+2],[gate.x+i*3+.9,gate.y+3.9]);
      for(const [x,y] of points){
        const p=project(x,y);
        assert.ok(p.x>=safe.left-.01&&p.x<=safe.right+.01,`horizontal clipping at ${w}x${h}`);
        assert.ok(p.y>=safe.top-.01&&p.y<=safe.bottom+.01,`vertical clipping at ${w}x${h}`);
      }
      count++;
    }
  }
}
console.log(`${count} camera layouts passed: Fizz and all three blocks stay within the unobscured area.`);
