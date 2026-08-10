(function(){
  const params=new URLSearchParams(location.search);
  const isPro=params.get('pro')==='1';
  const isPlay=params.get('play')==='1';
  const isDiscover=params.get('ontdek')==='1';
  const isFree=!isPro&&!isPlay&&!isDiscover;
  if(isPro)import('./pro/guard.js');
  // Alleen de afgeschermde PRO-leerlingroute heeft de Zisa Spelen-controle
  // nodig. Een leerkracht die vanuit Gratis of Ontdek een spelpopup opent,
  // moet onmiddellijk kunnen spelen.
  if(isPlay&&isPro)import('./spelen/games/zisa-play-guard.js');
  const home=document.getElementById('studioStart');
  const choices=document.getElementById('puzzleChoices');
  const header=document.getElementById('toolHeader');
  const studioHome=document.getElementById('studioHome');
  const menuLink=document.getElementById('menuLink');
  const grid=document.getElementById('puzzleGrid');
  const openGameWindow=document.getElementById('openGameWindow');

  if(!isPlay){
    const chooserUrl=new URL(location.href);
    chooserUrl.searchParams.set('play','1');
    chooserUrl.searchParams.delete('teacher');
    chooserUrl.searchParams.delete('figure');
    openGameWindow.href=chooserUrl.href;
  }

  // De oorspronkelijke `butterfly2` is dezelfde puzzel als `butterfly`.
  // Toon daarom één heldere, opeenvolgende reeks van drie unieke vlinders.
  delete FIG.butterfly2;
  FIG.butterfly.label='Vlinder 1';
  FIG.butterfly3.label='Vlinder 2';
  FIG.butterfly4.label='Vlinder 3';
  FIG.iguano.label='Dinosaurus';
  const figureOrder=['butterfly','butterfly3','butterfly4',...Object.keys(FIG).filter(key=>!['butterfly','butterfly3','butterfly4'].includes(key))];
  const discoverFigures=new Set(['butterfly','fish','rocket']);
  const selectableFigures=isDiscover?figureOrder.filter(key=>discoverFigures.has(key)):figureOrder;
  ['mFig','gFig'].forEach(id=>{
    const select=$(id),current=select.value;select.replaceChildren();
    figureOrder.forEach(key=>{
      const locked=isDiscover&&!discoverFigures.has(key);
      const option=new Option(`${FIG[key].label}${locked?' — PRO':''}`,key);
      // Toon in Ontdek de volledige PRO-keuze, maar laat alleen de drie
      // probeerfiguren selecteren.
      option.disabled=locked;
      select.add(option);
    });
    select.value=FIG[current]&&(!isDiscover||discoverFigures.has(current))?current:'butterfly';
  });

  if(isPro){menuLink.href='pro/app.html';menuLink.textContent='← Pro-menu';home.querySelector('.start-hero .eyebrow').textContent='ZISA PRO · CREATIEF EN BOUWEN';home.querySelector('.play-notice').innerHTML='<span>⭐</span><div><b>Volledige PRO-versie</b><p>Alle 19 unieke figuren zijn beschikbaar voor bouwkaarten, digibord en Zisa Spelen.</p></div>'}
  if(isFree){menuLink.href=params.get('back')||'index.html';menuLink.textContent='← Keuzemenu';home.querySelector('.start-hero .eyebrow').textContent='JUF ZISA · CREATIEF EN BOUWEN';home.querySelector('.play-notice').innerHTML='<span>🧩</span><div><b>Pentomino Studio</b><p>Maak bouwkaarten en speel met alle beschikbare figuren.</p></div>'}
  if(isDiscover){menuLink.href=params.get('back')||'ontdek/app.html';menuLink.textContent=params.get('back')==='index.html'?'← Keuzemenu':'← Ontdek-menu';document.body.classList.add('discover-mode');home.querySelector('.start-hero .eyebrow').textContent='ONTDEK · CREATIEF EN BOUWEN';home.querySelector('.start-hero p').textContent='Probeer drie volledige figuren als bouwkaart en als spel. Alle andere figuren horen bij PRO.';const note=home.querySelector('.play-notice');note.innerHTML='<span>⭐</span><div><b>Ontdek: 3 figuren inbegrepen</b><p>Vlinder 1, Vis en Raket zijn volledig bruikbaar. Met PRO krijg je alle unieke figuren voor bouwkaarten, digibord en Zisa Spelen.</p></div>'}
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
    const locked=isDiscover&&!discoverFigures.has(key);button.classList.toggle('pro-locked',locked);button.dataset.figure=key;
    button.innerHTML=`<span class="puzzle-preview">${miniSvg(data)}${locked?'<em class="pro-badge">PRO</em>':''}</span><b>${data.label}</b><span>${locked?'Beschikbaar in PRO':'12 stukken · Start puzzel →'}</span>`;
    button.addEventListener('click',()=>locked?showPro(data.label):openGame(key));grid.appendChild(button);
  });

  function showPro(label){
    let modal=document.getElementById('pentominoProModal');
    if(!modal){modal=document.createElement('div');modal.id='pentominoProModal';modal.className='pro-modal';modal.innerHTML='<section role="dialog" aria-modal="true"><span class="pro-pill">⭐ PRO</span><h2></h2><p>In Ontdek kun je Vlinder 1, Vis en Raket volledig maken en spelen. Met PRO krijg je alle figuren voor bouwkaarten, het digibord en Zisa Spelen.</p><div><button type="button">Verder ontdekken</button><a href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">Bekijk PRO</a></div></section>';document.body.appendChild(modal);modal.querySelector('button').onclick=()=>modal.hidden=true;modal.onclick=e=>{if(e.target===modal)modal.hidden=true}}
    modal.querySelector('h2').textContent=`${label} hoort bij PRO`;modal.hidden=false;
  }

  function showOnly(section){
    home.hidden=section!=='home';choices.hidden=section!=='choices';header.hidden=!['maker','game'].includes(section);studioHome.hidden=section==='home';
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===section));
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===section));
    document.body.classList.toggle('game-mode',section==='game');scrollTo(0,0);
  }
  function openMaker(){showOnly('maker');renderMaker()}
  function openGame(key){
    if(!isPlay){
      const gameUrl=new URL(location.href);gameUrl.searchParams.set('play','1');gameUrl.searchParams.set('figure',key);gameUrl.searchParams.delete('teacher');
      const gameWindow=window.open(gameUrl.href,'pentomino-online-spel');
      if(gameWindow)gameWindow.opener=null;
      return;
    }
    $('gFig').value=key;showOnly('game');setTimeout(()=>{gSetup();fitGame()},20)
  }
  function fitGame(){
    if(!document.getElementById('game').classList.contains('active'))return;
    const data=FIG[$('gFig').value],d=dims(data.rows),boardCard=document.querySelector('#game>.card:nth-child(2)');
    if(innerWidth>680){
      const help=document.querySelector('.puzzle-help'),mw=Math.max(220,boardCard.clientWidth-22),mh=Math.max(200,boardCard.clientHeight-(help?.offsetHeight||0)-58);
      const boardCell=Math.floor(Math.min(mw/d.w,mh/d.h));
      gCell=Math.max(18,Math.min(innerWidth<=1100?34:40,boardCell));gSetupWithCell(data,d)
    }
  }
  function gSetupWithCell(data,d){
    gSelected=null;gOutlines=false;gHelp=0;$('gOutline').textContent='1. Toon de plaatsen van de stukken';$('gTray').innerHTML='';
    $('gameBoard').style.width=d.w*gCell+gPad*2+'px';$('gameBoard').style.height=d.h*gCell+gPad*2+'px';$('gameBg').setAttribute('width',d.w*gCell+gPad*2);$('gameBg').setAttribute('height',d.h*gCell+gPad*2);
    gState={};NAMES.forEach(gMakePiece);gDrawBoard();gLayout();gScore();$('gMessage').className='status';$('gMessage').textContent='Tik op een stuk, draai het indien nodig en sleep het in de figuur.';
  }

  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.open==='maker')openMaker();
    else if(isPlay)showOnly('choices');
  }));
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
  const requestedFigure=params.get('figure');
  if(isPlay&&requestedFigure&&FIG[requestedFigure]&&selectableFigures.includes(requestedFigure))openGame(requestedFigure);
  else showOnly(isPlay?'choices':'home');
})();
