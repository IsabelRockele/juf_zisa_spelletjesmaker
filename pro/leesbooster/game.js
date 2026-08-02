(() => {
  const doelen=window.LEESBOOSTER_DOELEN;
  const $=s=>document.querySelector(s);
  const families=[['combinaties','Lettercombinaties'],['lettergrepen','Lettergrepen'],['uitspraak','Andere uitspraak']];
  const moves=[
    ['springen','Spring 5 keer!'],['stappen','Stap flink ter plaatse!'],['klappen','Klap 6 keer in je handen!'],['draaien','Draai rustig één keer rond!'],
    ['uitrekken','Maak je zo groot mogelijk!'],['hurken','Maak je zo klein mogelijk!'],['schouders','Tik links en rechts je schouder aan!'],['balanceren','Sta als een flamingo op één been!']
  ];
  const game={family:'combinaties',goals:[],words:[],events:[],index:0,timer:null,remaining:0,paused:false,currentDuration:0,currentStart:0,lastConfig:null};

  function shuffle(list){
    const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;
  }
  function renderFamilies(){
    $('#gameFamilyTabs').innerHTML=families.map(([id,label])=>`<button class="${id===game.family?'active':''}" data-game-family="${id}">${label}</button>`).join('');
  }
  function renderGoals(){
    $('#gameGoals').innerHTML=doelen.filter(d=>d.family===game.family).map(d=>`<label class="${game.goals.includes(d.id)?'selected':''}"><input type="checkbox" value="${d.id}" ${game.goals.includes(d.id)?'checked':''}><span><b>${d.label}</b><small>${d.words.slice(0,3).join(' · ')}</small></span></label>`).join('');
    const chosen=game.goals.map(id=>doelen.find(d=>d.id===id)).filter(Boolean);
    $('#gameChoiceSummary').textContent=chosen.length?`Gekozen: ${chosen.map(d=>d.label).join(' · ')}`:'Kies minstens één leesmoeilijkheid.';
  }
  function pickWords(count,difficulty){
    let pool=game.goals.flatMap(id=>{const d=doelen.find(x=>x.id===id);return d?d.words.map(word=>({word,goal:d.label})):[]});
    pool=[...new Map(pool.map(x=>[x.word,x])).values()].sort((a,b)=>a.word.length-b.word.length);
    if(difficulty==='makkelijk') pool=pool.slice(0,Math.max(count,Math.ceil(pool.length*.65)));
    if(difficulty==='uitdaging') pool=pool.slice(Math.floor(pool.length*.35));
    const result=[];let bag=[];
    while(result.length<count){if(!bag.length)bag=shuffle(pool);result.push(bag.pop())}
    return result;
  }
  function movePositions(count){
    if(!$('#gameMoves').checked||count<6)return [];
    const wanted=count>=24?4:count>=15?3:2;const positions=[];let cursor=2+Math.floor(Math.random()*3);
    while(positions.length<wanted&&cursor<count-1){positions.push(cursor);const left=count-cursor;const slots=wanted-positions.length;cursor+=Math.max(3,Math.floor(left/(slots+1)))+Math.floor(Math.random()*2)}
    return positions.slice(0,wanted);
  }
  function buildGame(){
    const count=+$('#gameWordCount').value,seconds=+$('#gameSeconds').value,difficulty=$('#gameDifficulty').value;
    if(!game.goals.length){$('#gameMessage').textContent='Kies eerst minstens één leesmoeilijkheid.';return false}
    const words=pickWords(count,difficulty),positions=movePositions(count),moveBag=shuffle(moves);
    game.events=[];words.forEach((item,i)=>{game.events.push({type:'word',...item,number:i+1,total:count,duration:seconds*1000});if(positions.includes(i+1))game.events.push({type:'move',move:moveBag.pop(),duration:10000})});
    game.index=0;game.paused=false;game.lastConfig={count,seconds,difficulty};$('#gameMessage').textContent='';return true;
  }
  function setBar(duration){
    const bar=$('#gameTimerBar');bar.style.transition='none';bar.style.width='100%';void bar.offsetWidth;bar.style.transition=`width ${duration}ms linear`;bar.style.width='0%';
    game.currentDuration=duration;game.remaining=duration;game.currentStart=Date.now();clearTimeout(game.timer);game.timer=setTimeout(next,duration);
  }
  function showEvent(){
    if(game.index>=game.events.length){finish();return}
    const event=game.events[game.index];$('#finishStage').hidden=true;
    if(event.type==='word'){
      $('#wordStage').hidden=false;$('#moveStage').hidden=true;$('#flashWord').textContent=event.word;$('#gameProgress').textContent=`Woord ${event.number} van ${event.total}`;$('#gameGoalLabel').textContent=event.goal;
    }else{
      $('#wordStage').hidden=true;$('#moveStage').hidden=false;$('#moveImage').src=`afbeeldingen/bewegen/${event.move[0]}.png`;$('#moveImage').alt=`Zisa: ${event.move[1]}`;$('#moveText').textContent=event.move[1];$('#gameProgress').textContent='Beweegboost';$('#gameGoalLabel').textContent='Even bewegen en dan weer lezen';
    }
    $('#gamePause').textContent='Pauze';setBar(event.duration);
  }
  function next(){game.index++;showEvent()}
  function start(){if(!buildGame())return;$('#gameSetup').hidden=true;$('#gameStage').hidden=false;showEvent()}
  function finish(){
    clearTimeout(game.timer);$('#wordStage').hidden=true;$('#moveStage').hidden=true;$('#finishStage').hidden=false;$('#gameTimerBar').style.transition='none';$('#gameTimerBar').style.width='100%';$('#gameProgress').textContent='Klaar!';$('#gameGoalLabel').textContent='';$('#finishText').textContent=`Jullie lazen samen ${game.lastConfig.count} woorden.`;
  }
  function pause(){
    if(game.paused){game.paused=false;$('#gamePause').textContent='Pauze';setBar(game.remaining);return}
    game.paused=true;clearTimeout(game.timer);game.remaining=Math.max(100,game.currentDuration-(Date.now()-game.currentStart));const bar=$('#gameTimerBar'),width=getComputedStyle(bar).width;bar.style.transition='none';bar.style.width=width;$('#gamePause').textContent='Ga verder';
  }
  function back(){clearTimeout(game.timer);$('#gameStage').hidden=true;$('#gameSetup').hidden=false;game.paused=false;$('#gameMessage').textContent='Pas je instellingen aan en start het spel opnieuw.'}
  function openMode(mode){
    const play=mode==='spel';$('#boosterLauncher').hidden=true;$('.app-layout').hidden=play;$('#gameApp').hidden=!play;$('.header-actions').hidden=play;$('#homeButton').hidden=false;$('#currentMode').hidden=false;$('#currentMode').textContent=play?"Smartboardspel · Zisa's Flitsfeest":'Werkbladen maken';
  }
  function showLauncher(){
    clearTimeout(game.timer);game.paused=false;$('#boosterLauncher').hidden=false;$('.app-layout').hidden=true;$('#gameApp').hidden=true;$('.header-actions').hidden=true;$('#homeButton').hidden=true;$('#currentMode').hidden=true;$('#gameStage').hidden=true;$('#gameSetup').hidden=false;
  }

  document.addEventListener('click',e=>{
    const mode=e.target.closest('[data-open-mode]');if(mode)openMode(mode.dataset.openMode);
    const family=e.target.closest('[data-game-family]');if(family){game.family=family.dataset.gameFamily;renderFamilies();renderGoals()}
  });
  $('#gameGoals').addEventListener('change',e=>{if(!e.target.matches('input'))return;const id=e.target.value;if(e.target.checked&&!game.goals.includes(id))game.goals.push(id);if(!e.target.checked)game.goals=game.goals.filter(x=>x!==id);renderGoals()});
  $('#gameStart').addEventListener('click',start);$('#gamePause').addEventListener('click',pause);$('#gameStop').addEventListener('click',back);$('#backSetup').addEventListener('click',back);$('#gameAgain').addEventListener('click',()=>{if(buildGame()){$('#finishStage').hidden=true;showEvent()}});
  $('#homeButton').addEventListener('click',showLauncher);
  renderFamilies();renderGoals();
})();
