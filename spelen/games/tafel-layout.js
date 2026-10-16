(() => {
 function ready(){
  if(!location.pathname.includes('/spelen/games/'))return;
  document.body.classList.add('tafel-layout');
  const file=location.pathname.split('/').pop().replace('.html','');
  document.body.dataset.tableGame=file;
  if(file==='tornado'){
    const zone=document.querySelector('.tornado-zone'),ring=document.querySelector('#cactus-container');
    if(zone&&ring)new ResizeObserver(()=>{ring.style.setProperty('scale',Math.min(1.3,zone.clientWidth/650,zone.clientHeight/650),'important');}).observe(zone);
  }
  const settings=document.querySelector('.kies-scherm,#selection-screen')||
    (document.querySelector('#start-spel-knop')?document.querySelector('.container'):null);
  if(settings){settings.classList.add('table-settings');const blocks=settings.querySelectorAll(':scope > .keuze-blok');if(blocks.length===1)blocks[0].classList.add('table-single-block');}
  if(/^level[123]$/.test(file)){const side=document.querySelector('#knoppen-links');if(side)document.querySelectorAll('#klokzone,#scorebord,#tafels-overzicht').forEach(el=>side.append(el));}
  function update(){
    const visible=settings&&!settings.hidden&&getComputedStyle(settings).display!=='none';
    const mode=visible?'settings':'play';
    if(document.body.dataset.tableScreen!==mode)document.body.dataset.tableScreen=mode;
    // Older games use an independent access/navigation script. Give that
    // button a real place next to their existing controls as well.
    if(!document.querySelector('script[src*="eiland-navigatie.js"]')){
      const nav=document.querySelector('#zisaNavButton');
      const host=visible?settings:document.querySelector('.knoppen-container,.spel-links,.game-controls');
      if(nav&&host&&nav.parentElement!==host)host.prepend(nav);
      if(nav&&nav.textContent!=='← Terug')nav.textContent='← Terug';
      if(nav&&!visible){const back=document.querySelector('.btn-terug');if(back)nav.onclick=()=>back.click();}
    }
  }
  update();new MutationObserver(update).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','hidden','class']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
