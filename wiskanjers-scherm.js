(() => {
  'use strict';
  // Fit the current board lesson to the available display, including open help.
  const main=document.querySelector('main');if(!main)return;
  const style=document.createElement('style');style.textContent='html,body{margin-bottom:0!important}body{overflow:hidden}main{transform-origin:top center}';document.head.append(style);
  let pending=false;
  function fit(){pending=false;main.style.zoom='1';main.style.width=(window.innerWidth-8)+'px';main.style.maxWidth='none';const top=main.getBoundingClientRect().top;const room=Math.max(100,window.innerHeight-top-8);const h=main.getBoundingClientRect().height;const width=main.scrollWidth;let scale=Math.min(1,room/Math.max(h,1),(window.innerWidth-8)/Math.max(width,1));main.style.zoom=String(scale);for(let i=0;i<3;i++){const r=main.getBoundingClientRect();if(r.bottom<=window.innerHeight-4)break;scale*=room/Math.max(r.height,1);main.style.zoom=String(scale);}}
  function schedule(){if(!pending){pending=true;requestAnimationFrame(fit);}}
  window.addEventListener('resize',schedule);document.addEventListener('fullscreenchange',schedule);document.addEventListener('click',schedule);document.addEventListener('input',schedule);window.addEventListener('load',schedule);
  new MutationObserver(schedule).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','open']});
  document.fonts?.ready.then(schedule);schedule();
})();
