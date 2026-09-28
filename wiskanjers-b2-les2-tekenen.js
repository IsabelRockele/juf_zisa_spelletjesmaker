(() => {
  'use strict';
  const $=id=>document.getElementById(id), ink=$('dot-ink');
  let strokes=[],history=[],mode='pen',gesture=null;
  const copy=()=>strokes.map(s=>s.map(p=>[...p]));
  function render(){
    ink.replaceChildren();
    for(const points of strokes){const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ') +(points.length===1?' l.01 .01':''));path.setAttribute('fill','none');path.setAttribute('stroke','#c74632');path.setAttribute('stroke-width','4');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');ink.append(path);}
    $('dot-undo').disabled=!history.length;$('dot-clear').disabled=!strokes.length;
  }
  function point(e){const p=ink.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(ink.getScreenCTM().inverse());return [q.x,q.y];}
  function distance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy;const t=d?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
  function erase(p,previous){strokes=strokes.filter(s=>!s.some((q,i)=>distance(p,s[Math.max(0,i-1)],q)<16||distance(q,previous,p)<16));}
  function setMode(value){mode=value;$('dot-pen').setAttribute('aria-pressed',String(mode==='pen'));$('dot-eraser').setAttribute('aria-pressed',String(mode==='eraser'));ink.style.cursor=mode==='pen'?'crosshair':'cell';}
  $('dot-pen').onclick=()=>setMode('pen');$('dot-eraser').onclick=()=>setMode('eraser');
  $('dot-undo').onclick=()=>{if(history.length){strokes=history.pop();render();}};
  $('dot-clear').onclick=()=>{history.push(copy());strokes=[];render();};
  $('dot-reset').addEventListener('click',()=>{strokes=[];history=[];gesture=null;setMode('pen');render();});
  ink.addEventListener('pointerdown',e=>{if(gesture||e.button!==0)return;e.preventDefault();const p=point(e);gesture={id:e.pointerId,before:copy(),last:p};ink.setPointerCapture(e.pointerId);if(mode==='pen')strokes.push([p]);else erase(p,p);render();});
  ink.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;e.preventDefault();const p=point(e);if(mode==='pen')strokes[strokes.length-1].push(p);else erase(p,gesture.last);gesture.last=p;render();});
  function finish(e){if(!gesture||gesture.id!==e.pointerId)return;const before=gesture.before;gesture=null;if(e.type==='pointercancel')strokes=before;else if(JSON.stringify(before)!==JSON.stringify(strokes)){history.push(before);if(history.length>100)history.shift();}render();}
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>ink.addEventListener(type,finish));render();
})();
