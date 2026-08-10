(function(){
  const params=new URLSearchParams(location.search);
  const isPro=params.get('pro')==='1';
  const isPlay=params.get('play')==='1';
  if(isPlay)import('./spelen/games/zisa-play-guard.js');
  const home=document.getElementById('studioStart');
  const choices=document.getElementById('puzzleChoices');
  const header=document.getElementById('toolHeader');
  const studioHome=document.getElementById('studioHome');
  const menuLink=document.getElementById('menuLink');
  const grid=document.getElementById('puzzleGrid');

  // De oorspronkelijke `butterfly2` is dezelfde puzzel als `butterfly`.
  // Toon daarom één heldere, opeenvolgende reeks van drie unieke vlinders.
  delete FIG.butterfly2;
  FIG.butterfly.label='Vlinder 1';
  FIG.butterfly3.label='Vlinder 2';
  FIG.butterfly4.label='Vlinder 3';
  FIG.iguano.label='Dinosaurus';
  const figureOrder=['butterfly','butterfly3','butterfly4',...Object.keys(FIG).filter(key=>!['butterfly','butterfly3','butterfly4'].includes(key))];
  ['mFig','gFig'].forEach(id=>{
    const select=$(id),current=select.value;select.replaceChildren();
    figureOrder.forEach(key=>select.add(new Option(FIG[key].label,key)));
    select.value=FIG[current]?current:'butterfly';
  });

  if(isPro){menuLink.href='pro/app.html';menuLink.textContent='← Pro-menu'}
  if(isPlay){menuLink.href=params.get('back')||'spelen/index.html';menuLink.textContent='← Spellen';home.querySelector('[data-open="maker"]').hidden=true;home.querySelector('.start-hero p').textContent='Kies een voorbeeld en bouw de figuur met de 12 puzzelstukken.'}

  function miniSvg(data){
    const d=dims(data.rows), owner=ownerMap(data), w=d.w*10+6,h=d.h*10+6;
    let q=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Voorbeeld van ${data.label}">`;
    for(let y=0;y<d.h;y++)for(let x=0;x<data.rows[y].length;x++)if(data.rows[y][x]==='#'){
      const i=owner[x+','+y];q+=`<rect x="${3+x*10}" y="${3+y*10}" width="10" height="10" rx="1" fill="${COLORS[i]}" stroke="#5b4b35" stroke-width=".7"/>`;
    }
    return q+'</svg>';
  }
  figureOrder.forEach(key=>{const data=FIG[key];
    const button=document.createElement('button');button.type='button';button.className='puzzle-choice';
    button.innerHTML=`<span class="puzzle-preview">${miniSvg(data)}</span><b>${data.label}</b><span>12 stukken · Start puzzel →</span>`;
    button.addEventListener('click',()=>openGame(key));grid.appendChild(button);
  });

  function showOnly(section){
    home.hidden=section!=='home';choices.hidden=section!=='choices';header.hidden=!['maker','game'].includes(section);studioHome.hidden=section==='home';
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===section));
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===section));
    document.body.classList.toggle('game-mode',section==='game');scrollTo(0,0);
  }
  function openMaker(){showOnly('maker');renderMaker()}
  function openGame(key){$('gFig').value=key;showOnly('game');setTimeout(()=>{gSetup();fitGame()},20)}
  function fitGame(){
    if(!document.getElementById('game').classList.contains('active'))return;
    const data=FIG[$('gFig').value],d=dims(data.rows),boardCard=document.querySelector('#game>.card:nth-child(2)');
    if(innerWidth>680){
      const tray=$('gTray'),mw=Math.max(220,boardCard.clientWidth-22),mh=Math.max(220,boardCard.clientHeight-62);
      const boardCell=Math.floor(Math.min(mw/d.w,mh/d.h));
      const trayCell=Math.floor(Math.sqrt(Math.max(1,tray.clientWidth*tray.clientHeight)/95));
      gCell=Math.max(12,Math.min(innerWidth<=1100?20:24,boardCell,trayCell));gSetupWithCell(data,d)
    }
  }
  function gSetupWithCell(data,d){
    gSelected=null;gOutlines=false;gHelp=0;$('gOutline').textContent='👀 Toon omtreklijnen';$('gTray').innerHTML='';
    $('gameBoard').style.width=d.w*gCell+gPad*2+'px';$('gameBoard').style.height=d.h*gCell+gPad*2+'px';$('gameBg').setAttribute('width',d.w*gCell+gPad*2);$('gameBg').setAttribute('height',d.h*gCell+gPad*2);
    gState={};NAMES.forEach(gMakePiece);gDrawBoard();gLayout();gScore();$('gMessage').className='status';$('gMessage').textContent='Tik op een stuk, draai het indien nodig en sleep het in de figuur.';
  }

  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>b.dataset.open==='maker'?openMaker():showOnly('choices')));
  document.getElementById('choiceBack').addEventListener('click',()=>showOnly('home'));
  studioHome.addEventListener('click',()=>showOnly(isPlay?'choices':'home'));
  document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',e=>{e.stopImmediatePropagation();tab.dataset.tab==='game'?showOnly('choices'):openMaker()}));

  const originalScore=gScore;
  gScore=function(){originalScore();const placed=NAMES.filter(n=>gState[n]?.placed).length;$('gScore').innerHTML+=` · <b>${placed}/12</b> gelegd`};
  const originalChoose=gChoose;
  gChoose=function(n){originalChoose(n);$('gMessage').textContent=`Stuk ${n} gekozen. Draai, spiegel of sleep het naar de puzzel.`};
  const originalCheck=gCheck;
  gCheck=function(){originalCheck();if(NAMES.every(n=>gState[n].placed)){$('gMessage').innerHTML='🎉 <b>Fantastisch!</b> Helemaal klaar. <button type="button" id="nextPuzzle">Kies een nieuwe puzzel</button>';document.getElementById('nextPuzzle').onclick=()=>showOnly('choices')}gScore()};
  addEventListener('keydown',e=>{if(!document.body.classList.contains('game-mode'))return;if(e.key.toLowerCase()==='r')$('gRotate').click();if(e.key.toLowerCase()==='s')$('gFlip').click();if(e.key==='Escape')showOnly('choices')});
  let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fitGame,120)});
  showOnly(isPlay?'choices':'home');
})();
