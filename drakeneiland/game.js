const $ = id => document.getElementById(id);
const colors = ['#df784f', '#4b9dc5', '#65aa79', '#a48ad6'];
const defaults = ['Vuurridders', 'Waterridders', 'Bosridders', 'Sterrenridders'];
const knightImages = ['ridder.png', 'ridder-water.png', 'ridder-bos.png', 'ridder-ster.png'];
let state = null, sound = false, audioContext, lastTick = 0;
const names = [...defaults];
let setupWorld = 'dragon';
function selectedWorld() { return AdventureWorlds.get($('world').value); }
function limitDemoSettings() {
  if(globalThis.AdventureAccess?.edition!=='ontdek') return;
  for(const [id,value] of Object.entries({range:'10',bridge:'without',teamCount:'2',target:'10',duration:'90',mode:'race',storms:'no'})) {$(id).value=value;$(id).disabled=true;}
  if(!['split','add','sub','mix'].includes($('operation').value)) $('operation').value='add';
  for(const option of $('operation').querySelectorAll('option')) option.disabled=option.hidden=!['split','add','sub','mix'].includes(option.value);
  for(const option of $('world').querySelectorAll('option')) option.disabled=option.hidden=!AdventurePolicy.demoWorlds.includes(option.value);
}
function refreshWorld() {
  if(globalThis.AdventureAccess?.edition==='ontdek' && !AdventurePolicy.demoWorlds.includes($('world').value)) $('world').value='dragon';
  const id=$('world').value || 'dragon', w=AdventureWorlds.get(id), previous=AdventureWorlds.get(setupWorld);
  for(let i=0;i<4;i++) if(names[i]===previous.names[i]) names[i]=w.names[i];
  setupWorld=id; document.body.dataset.world=id;
  const tug=id==='tug';
  $('teamCount').disabled=tug; $('mode').disabled=tug; $('storms').disabled=tug;
  if(tug) {$('teamCount').value='2';$('mode').value='race';$('storms').value='no';}
  $('bonusStepTitle').textContent=tug?'02 · Trek het touw':'02 · Bonusmoment';
  $('bonusStepText').textContent=tug?'Wie meer goede antwoorden heeft, trekt het touw naar zijn kant. Bij gelijkstand ligt het lint in het midden.':'Als de bonus aanstaat, telt elk goed antwoord elke 30 seconden gedurende 8 seconden dubbel.';
  $('tugHelp').hidden=!tug;
  $('teamTag').textContent=tug?'Precies 2 teams':'2, 3 of 4 teams';
  $('raceModeOption').textContent=tug?'Tegen elkaar — één touw':'Elk team zijn eigen missie';
  $('stormsLabel').hidden=tug;
  limitDemoSettings();
  if(globalThis.AdventureAccess?.edition==='ontdek') $('teamTag').textContent='2 teams · Ontdek';
  $('worldTag').textContent=w.tag; $('worldTitle').textContent=w.title; $('worldStory').textContent=w.story; $('worldAction').textContent=w.action;
  $('worldHero').src=w.art; $('worldHero').alt=w.title; $('worldCaption').textContent=w.tag;
  $('stepAction').textContent=w.action; $('stepEnding').textContent=w.ending;
  $('movementOn').textContent=`Aan — doe de ${movementCharacter(id).label} na`;
  $('movementPreload').replaceChildren();
  const moveKey=movementCharacter(id).key;
  if(moveKey!=='knight') for(const motion of ['jump','knees','squat']) {const img=document.createElement('img');img.src=`werelden/bewegen-${moveKey}-${motion}.png`;img.alt='';$('movementPreload').append(img);}
  if(tug) for(const side of ['left','right']) for(const pose of ['won','rest']) {const img=document.createElement('img');img.src=`werelden/tug-${side}-${pose}.png`;img.alt='';$('movementPreload').append(img);}
  for(const card of $('worldCards').children) card.setAttribute('aria-pressed',card.dataset.world===id);
  renderNames();
}
for(const [id,w] of Object.entries(AdventureWorlds.worlds)) {
  if(globalThis.AdventureAccess?.edition==='ontdek' && !AdventurePolicy.demoWorlds.includes(id)) continue;
  const card=document.createElement('button'); card.type='button';card.className='world-card';card.dataset.world=id;
  card.innerHTML=`<img src="${w.art}" alt=""><strong>${w.title}</strong><span>${w.tag}</span>`;
  card.onclick=()=>{$('world').value=id;refreshWorld();};$('worldCards').append(card);
}
$('world').onchange=refreshWorld;
for (let n = 1; n <= 10; n++) {
  const label = document.createElement('label');
  label.innerHTML = `<input type="checkbox" value="${n}" checked><span>${n}</span>`;
  $('tables').append(label);
}
function updateSettings() {
  const tables = ['mul', 'div', 'tables'].includes($('operation').value);
  const toTen = $('operation').value.startsWith('ten-');
  const gaps = $('operation').value.startsWith('gap-');
  $('rangeLabel').hidden = tables || toTen;
  $('gapPositionLabel').hidden = !gaps;
  $('tablePicker').hidden = !tables;
  $('bridgeLabel').hidden = tables || toTen || $('operation').value === 'split' || $('range').value === '10';
  $('mathNote').textContent = tables ? 'Oefen met factoren 1 tot en met 10. Kies minstens één tafel.' : $('operation').value === 'split' ? 'Vul het ontbrekende deel van de splitsing aan. Ook splitsingen met 0 doen mee.' : $('range').value === '10' ? 'Tot 10 oefenen we zonder tientalbrug.' : 'Met brug: bijvoorbeeld 8 + 5 of 14 − 6. Tot aan 10 en vanaf 10 horen bij zonder brug.';
  if (gaps) $('mathNote').textContent = `Tik het getal aan dat op de puntjes hoort. Alle getallen blijven binnen ${$('range').value}. De brugkeuze geldt voor de volledige som.`;
  if (toTen) $('mathNote').textContent = $('operation').value === 'ten-add' ? 'Vul aan tot precies 10, bijvoorbeeld 8 + … = 10.' : $('operation').value === 'ten-sub' ? 'Neem weg uit een getal van 11 tot 20 tot er precies 10 overblijft, bijvoorbeeld 17 − … = 10.' : 'Aanvullen en wegnemen door elkaar: 8 + … = 10 en 17 − … = 10. Het resultaat is altijd 10.';
}
function renderNames() {
  $('teamNames').replaceChildren();
  for (let i = 0; i < +$('teamCount').value; i++) {
    const label = document.createElement('label'); label.style.setProperty('--team', colors[i]);
    label.textContent = `Team ${i + 1}`;
    const input = document.createElement('input'); input.value = names[i]; input.maxLength = 22;
    input.addEventListener('input', () => { names[i] = input.value; }); label.append(input); $('teamNames').append(label);
  }
}
$('operation').onchange = updateSettings; $('range').onchange = updateSettings; $('teamCount').onchange = renderNames;
$('movement').onchange = () => { $('movementIntervalLabel').hidden = $('movementDurationLabel').hidden = $('movement').value !== 'on'; };
const movementExercises = [
  { motion: 'jump', image: 'bewegen-springen-v2.png', crops: [[0,512],[512,508],[1020,516]], title: 'Spring mee!', instruction: 'Buig even door je knieën, spring en land zacht.', frames: [0, 1, 2, 2], cues: ['Klaar…', 'Spring!', 'Land zacht', 'En nog eens!'], beat: .4 },
  { motion: 'knees', image: 'bewegen-knieheffen-v2.png', crops: [[0,512],[512,512],[1024,512]], title: 'Knieën omhoog!', instruction: 'Til om de beurt je ene en je andere knie op.', frames: [0, 1, 2, 1], cues: ['Eén knie omhoog', 'Voet neer', 'Andere knie omhoog', 'Voet neer'], beat: .6 },
  { motion: 'squat', image: 'bewegen-squaten-v2.png', crops: [[0,550],[550,490],[1040,496]], title: 'Zak en strek!', instruction: 'Armen vooruit. Buig je knieën en kom rustig weer recht.', frames: [0, 1, 2, 1], cues: ['Sta recht', 'Zak rustig', 'Even laag', 'Kom omhoog'], beat: .6 }
];
function movementCharacter(world) {
  return ({tug:{key:'sport',label:'sporter'},space:{key:'astronaut',label:'astronaut'},ocean:{key:'diver',label:'duiker'},animals:{key:'ranger',label:'dierenverzorger'},cake:{key:'baker',label:'bakker'}})[world] || {key:'knight',label:'ridder'};
}
// Boundaries sit in the transparent gutters, not across a hand or a shoe.
const movementCuts={
  'astronaut-knees':[532,1025],'astronaut-squat':[534,1056],
  'diver-knees':[528,989],'diver-squat':[553,1046],
  'ranger-jump':[507,1033],'ranger-knees':[570,1029],
  'baker-knees':[508,997],'baker-squat':[563,1109],
  'ranger-squat':[547,1057],
  'sport-jump':[477,1042],'sport-knees':[532,1008],'sport-squat':[557,1061]
};
function updateMovementPose() {
  const exercise = state.movementExercise;
  const step = Math.floor((state.config.movementDuration - state.movementLeft) / exercise.beat) % exercise.frames.length;
  const frame = exercise.frames[step];
  const [left, width] = exercise.crops[frame];
  $('movementSprite').style.setProperty('--frame-ratio', width / 1024);
  $('movementSprite').style.backgroundSize = `${1536 / width * 100}% 100%`;
  $('movementSprite').style.backgroundPosition = `${left / (1536 - width) * 100}% center`;
  $('movementSprite').style.transform = exercise.mirrorLast && frame===2 ? 'scaleX(-1)' : 'none';
  $('movementSprite').dataset.frame = frame;
  $('movementSprite').setAttribute('aria-label', `${exercise.character}: ${exercise.cues[step]}`);
  $('movementCue').textContent = exercise.cues[step];
}
function beginMovement() {
  state.phase = 'movement'; state.movementLeft = state.config.movementDuration;
  const character = movementCharacter(state.config.world);
  const exercise = {...movementExercises[state.movementIndex % movementExercises.length],character:character.label}; state.movementIndex++;
  if(character.key!=='knight') {
    exercise.image=`werelden/bewegen-${character.key}-${exercise.motion}.png`;
    exercise.crops=[[0,512],[512,512],[1024,512]];
    const cuts=movementCuts[`${character.key}-${exercise.motion}`];
    if(cuts) exercise.crops=[[0,cuts[0]],[cuts[0],cuts[1]-cuts[0]],[cuts[1],1536-cuts[1]]];
    exercise.mirrorLast=exercise.motion==='knees' && ['astronaut','baker','sport'].includes(character.key);
  }
  $('movementTitle').textContent = exercise.title; $('movementInstruction').textContent = `Doe de ${character.label} na! ${exercise.instruction}`;
  $('movementDemo').dataset.motion = exercise.motion;
  state.movementExercise = exercise;
  $('movementSprite').style.backgroundImage = `url("${exercise.image}")`;
  updateMovementPose();
  $('movementSeconds').textContent = Math.ceil(state.movementLeft); $('movementOverlay').hidden = false;
  $('skipMovement').focus(); tone(520, .2);
}
function endMovement() {
  if (state?.phase !== 'movement') return;
  state.phase = 'playing'; state.nextMovement = state.elapsed + state.config.movementInterval;
  $('movementOverlay').hidden = true; lastTick = performance.now();
  $('pause').focus(); tone(750, .2);
}
$('skipMovement').onclick = endMovement;
function tone(frequency, duration = .12) {
  if (!sound) return;
  try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume(); const osc = audioContext.createOscillator(), gain = audioContext.createGain(); osc.connect(gain); gain.connect(audioContext.destination); osc.frequency.value = frequency; gain.gain.setValueAtTime(.06, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration); osc.start(); osc.stop(audioContext.currentTime + duration); } catch (_) { /* Audio is optional. */ }
}
$('sound').onclick = () => { sound = !sound; $('sound').textContent = sound ? '♫ Geluid aan' : '♫ Geluid uit'; $('sound').setAttribute('aria-pressed', sound); tone(600); };
$('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch (_) { $('fullscreen').textContent = 'Gebruik F11 voor volledig scherm'; } };
document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? '⛶ Klein scherm' : '⛶ Volledig scherm'; });
$('settings').onsubmit = event => { event.preventDefault(); start(); };
function start() {
  if(globalThis.AdventureAccess && !AdventureAccess.ready) return;
  const config = { operation: $('operation').value, range: +$('range').value, bridge: $('bridge').value, tables: [...$('tables').querySelectorAll('input:checked')].map(x => +x.value), count: +$('teamCount').value, target: +$('target').value, duration: +$('duration').value, coop: $('mode').value === 'coop', storms: $('storms').value === 'yes' };
  config.movement = $('movement').value === 'on'; config.movementInterval = +$('movementInterval').value; config.movementDuration = +$('movementDuration').value;
  config.gapPosition = $('gapPosition').value;
  config.world = $('world').value || 'dragon';
  if(globalThis.AdventureAccess) Object.assign(config,AdventurePolicy.config(config,AdventureAccess.edition));
  if(config.world==='tug') {config.count=2;config.coop=false;config.storms=false;}
  if (['mul', 'div', 'tables'].includes(config.operation) && !config.tables.length) { $('mathNote').textContent = 'Kies eerst minstens één tafel om te starten.'; $('tables').querySelector('input').focus(); return; }
  const questions = DragonMath.shuffle(DragonMath.pool(config));
  state = { config, questions, order: [], elapsed: 0, phase: 'countdown', countdown: 3, storm: false, teams: Array.from({ length: config.count }, (_, i) => ({ name: names[i].trim() || defaults[i], score: 0, index: 0, locked: 0, wrong: 0, done: false })) };
  state.nextMovement = config.movementInterval; state.movementIndex = 0; $('movementOverlay').hidden = true;
  const world=AdventureWorlds.get(config.world);
  document.body.dataset.world=config.world;
  $('overlayIcon').style.backgroundImage=`url("${world.art}")`;
  $('overlay').dataset.outcome = '';
  $('setup').hidden = true; $('game').hidden = false; $('overlay').hidden = false; $('results').replaceChildren(); $('resume').hidden = true; $('again').hidden = true; $('back').hidden = true;
  $('overlayIcon').textContent = ''; $('overlayTitle').textContent = '3'; $('overlayText').textContent = 'Vargos bewaakt de lichtkristallen. Maak je rekenspreuken klaar!';
  if(config.world!=='dragon') $('overlayText').textContent=world.mission;
  $('teams').replaceChildren(); $('race').replaceChildren(); $('knights').replaceChildren(); $('spellEffects').replaceChildren(); $('shieldPieces').replaceChildren(); $('arenaResult').hidden = true;
  $('tugScene').hidden=config.world!=='tug'; $('tugScene').dataset.winner='';
  $('tugScene').dataset.ending='';
  $('tugLeftPlayers').src='werelden/tug-left.png'; $('tugRightPlayers').src='werelden/tug-right.png';
  $('tugLeftPlayers').alt='Oranje team trekt naar links';$('tugRightPlayers').alt='Blauw team trekt naar rechts';
  $('tugRopePath').setAttribute('d','M280 98 C420 98 580 98 720 98');
  $('battle').setAttribute('aria-label',config.world==='tug'?'Twee teams trekken aan een touw':world.title);
  $('battle').classList.remove('victory', 'escaped');
  $('battle').dataset.mode = config.coop ? 'coop' : 'race';
  $('game').dataset.teamCount = config.count;
  $('teams').style.setProperty('--count', config.count); $('knights').style.setProperty('--count', config.count);
  for (let n = 0; n < 8; n++) { const piece = document.createElement('span'); piece.className = 'shield-piece'; piece.style.setProperty('--piece', n); $('shieldPieces').append(piece); }
  $('modeTitle').textContent = config.coop ? 'ÉÉN MISSIE · ALLE TEAMS SAMEN' : 'ELK TEAM TEGEN ZIJN EIGEN DRAAK';
  $('mission').textContent = config.coop ? 'Versla Vargos. Bevrijd de lichtkristallen!' : 'Wie verslaat zijn draak het snelst?';
  if(config.world!=='dragon') { $('modeTitle').textContent=config.coop?'SAMEN ÉÉN MISSIE':'ELK TEAM EEN EIGEN MISSIE';$('mission').textContent=world.mission; }
  if(config.world==='tug') $('modeTitle').textContent='TOUWTREKKEN · TWEE TEAMS';
  state.teams.forEach((team, i) => {
    team.number = i;
    const actor = ['dragon','tug'].includes(config.world) ? document.createElement('div') : AdventureWorlds.create(team,config);
    if(config.world==='tug') actor.innerHTML='<span class="knight-name"></span>';
    if(config.world==='dragon') { actor.className = 'knight'; actor.style.setProperty('--team', colors[i]);
    actor.innerHTML = '<div class="knight-name"></div><div class="duel"><div class="knight-figure"><img src="ridder.png" alt="De ridder van dit team"><div class="cast-word"></div></div><div class="personal-dragon"><img src="vargos.png" alt="De eigen draak van dit team"><div class="personal-shield"></div><span class="dragon-health"></span></div></div><div class="place-label" hidden></div><div class="crystal-count"></div><div class="crystal-treasury" aria-label="Gewonnen kristallen"></div>';
    actor.querySelector('.knight-figure img').src = knightImages[i];
    }
    actor.querySelector('.knight-name').textContent = team.name; $('knights').append(actor); team.actor = actor;
    if(config.world==='dragon') {
      for (let n = 0; n < config.target; n++) { const gem = document.createElement('span'); gem.className = 'tiny-crystal'; actor.querySelector('.crystal-treasury').append(gem); }
      for (let n = 0; n < 8; n++) { const piece = document.createElement('span'); piece.className = 'shield-piece'; piece.style.setProperty('--piece', n); actor.querySelector('.personal-shield').append(piece); }
    }
    const lane = document.createElement('div'); lane.className = 'lane'; lane.style.setProperty('--team', colors[i]);
    lane.innerHTML = '<span class="lane-name"></span><div class="track"><div class="fill"></div></div><span class="lane-score"></span>';
    lane.querySelector('.lane-name').textContent = team.name; $('race').append(lane); team.lane = lane;
    const panel = document.createElement('article'); panel.className = 'team'; panel.style.setProperty('--team', colors[i]);
    panel.innerHTML = '<div class="team-header"><span></span><span class="points">0 punten</span></div><div class="question"></div><div class="answers"></div><div class="feedback" role="status">Reken en tik je antwoord.</div>';
    panel.querySelector('.team-header span').textContent = team.name; $('teams').append(panel); team.panel = panel;
    nextQuestion(team, i); updateProgress(team);
  });
  updateBoss(); updateClock(); updateBanner(); lastTick = performance.now(); tone(400);
}
function nextQuestion(team, i) {
  team.q = DragonMath.pick(state.questions, state.teams.filter(t => t !== team && !t.done).map(t => t.q), team.q); team.locked = 0;
  const question = team.panel.querySelector('.question');
  question.classList.toggle('point-question', !!team.q.equation);
  if (team.q.op === 'split') { question.innerHTML = `<svg class="split-diagram" viewBox="0 0 240 150" role="img" aria-label="Splits ${team.q.text} in ${team.q.part} en hoeveel?"><text x="120" y="39">${team.q.text}</text><path d="M108 55 L65 91 M132 55 L175 91"/><text x="58" y="134">${team.q.part}</text><text class="missing" x="182" y="134">?</text></svg>`; }
  else question.textContent = team.q.equation ? team.q.text : `${team.q.text} = ?`;
  const answers = team.panel.querySelector('.answers'); answers.replaceChildren();
  DragonMath.choices(team.q).forEach(value => { const button = document.createElement('button'); button.textContent = value; button.setAttribute('aria-label', `${team.name}: ${value}`); button.onclick = () => answer(i, value, button); answers.append(button); });
}
function answer(i, value, button) {
  if (state?.phase !== 'playing') return;
  const team = state.teams[i]; if (team.done || team.locked > 0 || button.disabled) return;
  if (value !== team.q.answer) { team.wrong++; button.classList.add('wrong'); button.disabled = true; team.panel.querySelector('.feedback').textContent = 'Bijna! Reken nog eens rustig.'; tone(180); return; }
  const points = state.config.world==='tug'?1:state.config.coop ? (state.storm ? 2 : 1) : Math.min(state.storm ? 2 : 1, state.config.target - team.score); team.score += points; team.locked = 1.15;
  button.classList.add('correct'); team.panel.querySelectorAll('.answers button').forEach(b => { b.disabled = true; });
  team.panel.querySelector('.feedback').textContent = points === 2 ? 'Dubbele toverkracht! +2 kristallen!' : 'Raak! +1 kristal. Wissel!';
  if(state.config.world!=='dragon') {const w=AdventureWorlds.get(state.config.world);team.panel.querySelector('.feedback').textContent=`Goed zo! +${points} ${points===1?w.unit:w.plural}. Wissel!`;}
  updateProgress(team); updateBoss(); castSpell(team, points);
  tone(640 + i * 80);
  if(state.config.world==='tug') {if(team.score>=state.config.target || state.tugOvertime) endTug(i);return;}
  if (state.config.coop) {
    if (state.teams.reduce((sum, t) => sum + t.score, 0) >= state.config.target * state.config.count) beginEnding(true);
  } else if (team.score >= state.config.target) {
    team.done = true; team.finishTime = state.elapsed; state.order.push(team); team.place = state.order.length;
    celebrateTeam(team); team.panel.classList.add('team-finished');
    team.actor.querySelector('.place-label').hidden = false;
    team.actor.querySelector('.place-label').textContent = `${team.place}e plaats!`;
    team.panel.querySelector('.question').innerHTML = `<div class="finish-badge"><strong>${team.place}</strong><span>plaats</span></div>`;
    team.panel.querySelector('.feedback').textContent = `${AdventureWorlds.get(state.config.world).complete} in ${formatTime(team.finishTime)}! Moedig de anderen aan.`;
    if (state.order.length === state.teams.length) beginEnding(true);
    else { $('bossStage').textContent = `${team.name} pakt plaats ${team.place}!`; $('bossRule').textContent = 'De andere teams spelen verder. Wie is de volgende?'; }
  }
}
function formatTime(seconds) { const n = Math.floor(seconds); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; }
function updateTug() {
  const difference=state.teams[0].score-state.teams[1].score;
  const shift=Math.round(-difference/state.config.target*1200)/100;
  $('tugMotion').style.transform=`translateX(${shift}%)`;
  $('tugScene').setAttribute('aria-label',difference?`${state.teams[difference>0?0:1].name} staat ${Math.abs(difference)} goede antwoorden voor.`:'De teams staan gelijk. Het touw is in het midden.');
  $('tugLeftName').textContent=state.teams[0].name; $('tugRightName').textContent=state.teams[1].name;
  $('tugLeftScore').textContent=`${state.teams[0].score} goed`; $('tugRightScore').textContent=`${state.teams[1].score} goed`;
  $('bossStage').textContent=difference?`${state.teams[difference>0?0:1].name} trekt het touw naar zich toe!`:'Gelijk op! Wie trekt het touw naar zich toe?';
  $('bossRule').textContent=state.tugOvertime?'Verlenging: het volgende goede antwoord wint!':`Eerste team met ${state.config.target} goede antwoorden wint. Het verschil bepaalt de positie van het touw.`;
}
function endTug(winner) {
  state.tugWinner=winner;state.phase='ending';state.endingTime=7;state.won=true;state.tugReleased=false;
  state.teams.forEach((team,i)=>{team.done=true;team.place=i===winner?1:2;team.finishTime=state.elapsed;team.panel.querySelectorAll('.answers button').forEach(b=>b.disabled=true);team.panel.querySelector('.feedback').textContent=i===winner?'De beslissende ruk! Gewonnen!':'Goed gespeeld! Jullie worden over de lijn getrokken.';});
  state.order=[state.teams[winner],state.teams[1-winner]];
  $('tugScene').dataset.winner=String(winner);
  $('tugMotion').style.transform=`translateX(${winner===0?-28:28}%)`;
  $('bossStage').textContent=`${state.teams[winner].name} wint!`;
  $('bossRule').textContent='De tegenstanders gaan over de middenlijn!';
  $('banner').textContent='Wat een krachtmeting! Applaus voor beide teams.';
  tone(880,.4);
}
function releaseTug() {
  state.tugReleased=true;
  $('tugScene').dataset.ending='released';
  for(const [i,id] of ['tugLeftPlayers','tugRightPlayers'].entries()) {
    const won=i===state.tugWinner;
    $(id).src=`werelden/tug-${i===0?'left':'right'}-${won?'won':'rest'}.png`;
    $(id).alt=won?'Het winnende team juicht met de handen omhoog':'Het andere team laat los en klapt mee';
  }
  $('tugRopePath').setAttribute('d','M280 180 C340 154 385 197 440 182 S550 165 595 182 S675 198 720 180');
  $('bossRule').textContent='Het touw ligt los. Applaus voor beide teams!';
}
function finishTug() {
  state.phase='finished';
  if(state.tugWinner===null) {
    showOverlay('','Gelijkspel!','De Ontdek-ronde van 90 seconden is afgelopen. Beide teams hebben evenveel goede antwoorden.');
    $('results').replaceChildren();
    for(const team of state.teams){const row=document.createElement('div');row.className='result-row';row.textContent=`${team.name}: ${team.score} goede antwoorden`;$('results').append(row);}
    $('resume').hidden=true;$('again').hidden=false;return;
  }
  showOverlay('',`${state.teams[state.tugWinner].name} wint!`,'De tegenstanders zijn over de middenlijn getrokken. Goed gerekend en gestreden, allebei!');
  $('overlay').dataset.outcome='won';
  $('overlayIcon').style.backgroundImage=`url("werelden/tug-${state.tugWinner===0?'left':'right'}-won.png")`;
  $('results').replaceChildren();
  for(const team of state.order) {const row=document.createElement('div');row.className='result-row';const name=document.createElement('span'),score=document.createElement('span');name.textContent=`${team.place}. ${team.name}`;score.textContent=`${team.score} goede antwoorden`;row.append(name,score);$('results').append(row);}
  $('resume').hidden=true;$('again').hidden=false;
}
function celebrateTeam(team) {
  if(state.config.world!=='dragon') {AdventureWorlds.celebrate(team,state);return;}
  team.actor.classList.add('defeated');
  const dragon = team.actor.querySelector('.personal-dragon');
  const surrendered = document.createElement('img'); surrendered.src = 'vargos-verslagen.png'; surrendered.alt = 'De verslagen draak geeft zich over met een witte vlag'; surrendered.className = 'surrendered-dragon'; dragon.append(surrendered);
  const burst = document.createElement('div'); burst.className = 'victory-burst'; burst.setAttribute('aria-hidden', 'true');
  for (let n = 0; n < 12; n++) { const piece = document.createElement('span'); piece.className = n < 6 ? 'victory-shard' : 'victory-gem'; piece.style.setProperty('--angle', `${n * 30}deg`); piece.style.setProperty('--delay', `${(n % 3) * .12}s`); burst.append(piece); }
  team.actor.append(burst);
  team.panel.querySelector('.answers').replaceChildren();
  const scene = document.createElement('div'); scene.className = 'winner-scene';
  scene.innerHTML = `<img class="winner-knight" src="${knightImages[team.number]}" alt="Juichende ridder"><img class="winner-dragon" src="vargos-verslagen.png" alt="Draak met witte vlag"><strong>Gewonnen!</strong>`;
  team.panel.querySelector('.answers').append(scene);
}
function castSpell(team, points) {
  if(state.config.world==='tug') { $('tugScene').dataset.pulling=String(team.number);return; }
  if(state.config.world!=='dragon') {AdventureWorlds.hit(team,state,points);return;}
  const from = state.config.coop ? 4 + (team.number + .5) * 62 / state.config.count : 2 + (team.number + .25) * 96 / state.config.count;
  const to = state.config.coop ? 82 : 2 + (team.number + .76) * 96 / state.config.count;
  team.actor.classList.remove('casting'); void team.actor.offsetWidth; team.actor.classList.add('casting');
  team.actor.querySelector('.cast-word').textContent = points === 2 ? '+2 kristallen!' : '+1 kristal!';
  for (const kind of ['flying-spell', 'returning-crystal', 'spell-impact']) {
    const effect = document.createElement('span'); effect.className = kind; effect.style.setProperty('--from', `${from}%`); effect.style.setProperty('--to', `${to}%`); effect.style.setProperty('--team', colors[team.number]);
    effect.addEventListener('animationend', () => effect.remove()); $('spellEffects').append(effect);
  }
}
function beginEnding(won) {
  state.phase = 'ending'; state.endingTime = won ? 5 : 2.3; state.won = won;
  if (won && state.config.coop) state.teams.forEach(team => celebrateTeam(team));
  $('battle').classList.add(won ? 'victory' : 'escaped');
  $('arenaResult').hidden = false;
  $('arenaResult').textContent = won ? state.config.coop ? 'Het schild breekt! De kristallen zijn vrij!' : 'Alle draken zijn verslagen! Goed gedaan!' : 'De tijd is om!';
  if(state.config.world!=='dragon' && won) $('arenaResult').textContent=state.config.coop?'Missie geslaagd! Samen gedaan!':'Alle missies voltooid! Goed gedaan!';
  if (won) for (let i = 0; i < 18; i++) { const gem = document.createElement('span'); gem.className = state.config.world==='dragon'?'celebration-crystal':'world-confetti'; gem.style.setProperty('--from', `${5 + i * 5}%`); gem.style.setProperty('--delay', `${(i % 5) * .12}s`); gem.style.setProperty('--n',i%12);gem.style.setProperty('--team',colors[i%4]); $('spellEffects').append(gem); }
}
function updateProgress(team) {
  if(state.config.world==='tug') {team.panel.querySelector('.points').textContent=`${team.score} / ${state.config.target} goed`;return;}
  if(state.config.world!=='dragon') {AdventureWorlds.update(team,state);return;}
  const remaining = Math.max(0, state.config.target - team.score);
  team.lane.querySelector('.fill').style.width = `${state.config.coop ? Math.min(100, team.score / state.config.target * 100) : remaining / state.config.target * 100}%`;
  team.lane.querySelector('.lane-score').textContent = state.config.coop ? `${team.score} raak` : `${remaining} over`;
  team.panel.querySelector('.points').textContent = `${team.score} raak`;
  team.actor.querySelector('.crystal-count').textContent = `${team.score} / ${state.config.target} kristallen`;
  team.actor.querySelector('.crystal-treasury').setAttribute('aria-label', `${team.score} kristallen verzameld`);
  [...team.actor.querySelector('.crystal-treasury').children].forEach((gem, n) => gem.classList.toggle('earned', n < team.score));
  team.actor.querySelector('.dragon-health').textContent = `${remaining} te gaan`;
  [...team.actor.querySelector('.personal-shield').children].forEach((piece, n) => piece.classList.toggle('broken', n < Math.floor(Math.min(1, team.score / state.config.target) * 8)));
}
function updateBoss() {
  const { config, teams } = state;
  if(config.world==='tug') {updateTug();return;}
  if(config.world!=='dragon') {
    if(config.coop) teams.forEach(t=>AdventureWorlds.update(t,state));
    const w=AdventureWorlds.get(config.world);
    $('bossStage').textContent=config.coop?w.mission:state.order.length?`Plaats ${Math.min(state.order.length+1,config.count)} is nog te verdienen!`:w.mission;
    $('bossRule').textContent=config.coop?'Alle teams helpen hetzelfde doel. Elke bijdrage telt!':'Elk goed antwoord helpt jouw missie vooruit. Iedereen speelt uit!';return;
  }
  const damage = config.coop ? teams.reduce((sum, team) => sum + team.score, 0) / (config.target * config.count) : Math.max(...teams.map(team => team.score)) / config.target;
  const remaining = Math.max(0, Math.ceil((1 - damage) * 100));
  $('bossShield').style.width = `${remaining}%`;
  $('bossShieldBar').setAttribute('aria-valuenow', remaining);
  $('shieldValue').textContent = `${remaining}%`;
  $('battle').dataset.stage = damage >= 1 ? 'won' : damage >= .66 ? 'weak' : damage >= .33 ? 'cracked' : 'strong';
  [...$('shieldPieces').children].forEach((piece, n) => piece.classList.toggle('broken', n < Math.floor(Math.min(1, damage) * 8)));
  $('bossStage').textContent = damage >= 1 ? 'Het schild is gebroken!' : damage >= .66 ? 'Nog even! Het schild valt bijna uiteen.' : damage >= .33 ? 'Vargos wankelt. Het schild barst!' : 'Vargos: “Mijn kristallen krijgen jullie nooit!”';
  $('bossRule').textContent = config.coop ? 'Samen toveren: elke treffer bevrijdt een kristal!' : state.order.length ? `${state.order.length} team(s) klaar. Speel door voor de volgende plaats!` : 'Raak jouw draak, verzamel kristallen en verover een plaats!';
  if (!config.coop) $('bossStage').textContent = state.order.length ? `Plaats ${state.order.length + 1} is nog te verdienen!` : 'Ridders, maak jullie rekenspreuken klaar!';
}
function updateClock() { const limited = state.config.duration > 0; const remaining = limited ? Math.max(0, Math.ceil(state.config.duration - state.elapsed)) : Math.floor(state.elapsed); $('clock').textContent = formatTime(remaining); $('clock').classList.toggle('urgent', limited && remaining <= 15); }
function updateBanner() {
  document.body.classList.toggle('storm', state.storm);
  $('banner').textContent = state.storm ? `DUBBELE TOVERKRACHT! Goed antwoord = 2 kristallen. Nog ${Math.ceil(8 - state.elapsed % 30)} seconden!` : state.config.storms ? `Goed antwoord = 1 kristal. Over ${Math.ceil(30 - state.elapsed % 30)} seconden: 8 seconden lang 2 kristallen per goed antwoord!` : 'Goed antwoord = 1 kristal. Bevrijd de kristallen en versla je draak!';
  if(state.config.world!=='dragon') {const w=AdventureWorlds.get(state.config.world);$('banner').textContent=state.storm?`DUBBELE BELONING! +2 ${w.plural} per goed antwoord. Nog ${Math.ceil(8-state.elapsed%30)} seconden!`:state.config.storms?`Goed antwoord = 1 ${w.unit}. Dubbele beloning over ${Math.ceil(30-state.elapsed%30)} seconden!`:`Goed antwoord = 1 ${w.unit}. ${w.mission}`;}
  if(state.config.world==='tug') $('banner').textContent=state.tugOvertime?'Gelijkstand! Het volgende goede antwoord beslist.':`Wie als eerste ${state.config.target} goede antwoorden haalt, trekt het andere team over de lijn!`;
}
function pause() { if (state?.phase !== 'playing') return; state.phase = 'paused'; showOverlay('Ⅱ', 'Even pauze', 'De klok staat stil. Ga verder wanneer iedereen klaarstaat.'); $('resume').hidden = false; $('again').hidden = true; }
function showOverlay(icon, title, text) { $('overlay').hidden = false; $('overlayIcon').textContent = icon; $('overlayTitle').textContent = title; $('overlayText').textContent = text; $('back').hidden = false; }
function finish(reached) {
  if(state.config.world==='tug') {finishTug();return;}
  state.phase = 'finished'; document.body.classList.remove('storm');
  const best = Math.max(...state.teams.map(t => t.score)); const winners = state.teams.filter(t => t.score === best);
  const title = state.config.coop ? reached ? 'Vargos is verslagen!' : 'Vargos ontsnapt…' : reached ? 'Alle draken verslagen!' : 'De ronde is afgelopen!';
  const outcome = state.config.coop ? `Samen raakten jullie het schild ${state.teams.reduce((sum, t) => sum + t.score, 0)} keer.` : best === 0 ? 'Er raakte nog geen spreuk het schild.' : winners.length > 1 ? 'De teams eindigen gelijk.' : `${winners[0].name} ${reached ? 'breekt als eerste het schild!' : 'heeft het meeste schildkracht weggetoverd.'}`;
  showOverlay('', title, state.config.coop ? `${reached ? 'De lichtkristallen zijn vrij. Het eiland straalt weer!' : 'De tijd is om. De draak neemt de kristallen mee. Durven jullie het opnieuw?'} ${outcome}` : reached ? `${state.order[0].name} was het snelst! Iedereen heeft zijn eigen draak verslagen.` : `${state.order.length} van de ${state.teams.length} teams versloegen hun draak. De overige teams hebben nog kristallen te bevrijden.`);
  $('overlay').dataset.outcome = reached ? 'won' : 'lost';
  if(state.config.world!=='dragon') {
    const w=AdventureWorlds.get(state.config.world);
    $('overlayTitle').textContent=reached?'Missie geslaagd!':'De tijd is om!';
    $('overlayText').textContent=reached?state.config.coop?`Samen gelukt! ${w.ending}`:`${state.order[0].name} was het snelst. ${w.ending}`:state.config.coop?`Samen verzamelden jullie ${state.teams.reduce((n,t)=>n+t.score,0)} van de ${state.config.target*state.config.count} ${w.plural}. Probeer het nog eens!`:`Jullie hebben hard gewerkt. ${state.order.length} teams zijn klaar. De andere teams kunnen het nog eens proberen.`;
  } else if(reached) $('overlayIcon').style.backgroundImage='url("vargos-verslagen.png")';
  const ranked = state.config.coop ? [...state.teams].sort((a,b) => b.score-a.score) : [...state.order, ...state.teams.filter(t => !t.done).sort((a,b) => b.score-a.score)];
  $('results').replaceChildren(); ranked.forEach(team => { const row = document.createElement('div'); row.className = 'result-row'; const name = document.createElement('span'), score = document.createElement('span'); name.textContent = `${team.place ? team.place + '. ' : ''}${team.name}`; score.textContent = team.done ? `${formatTime(team.finishTime)} · ${AdventureWorlds.get(state.config.world).complete}` : state.config.coop ? `${team.score} ${AdventureWorlds.get(state.config.world).plural}` : `${team.score}/${state.config.target} · nog niet klaar`; row.append(name, score); $('results').append(row); });
  $('resume').hidden = true; $('again').hidden = false; tone(880, .4);
}
$('pause').onclick = pause; $('stop').onclick = pause;
$('resume').onclick = () => { state.phase = 'playing'; $('overlay').hidden = true; lastTick = performance.now(); };
$('again').onclick = start;
$('back').onclick = () => { state = null; $('overlay').hidden = true; $('game').hidden = true; $('setup').hidden = false; document.body.classList.remove('storm'); };
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') pause(); });
function tick(now) {
  const dt = Math.min((now - lastTick) / 1000, .25); lastTick = now;
  if (document.hidden) { requestAnimationFrame(tick); return; }
  if (state?.phase === 'countdown') { state.countdown -= dt; if (state.countdown <= 0) { state.phase = 'playing'; $('overlay').hidden = true; tone(800); } else $('overlayTitle').textContent = Math.ceil(state.countdown); }
  else if (state?.phase === 'movement') { state.movementLeft = Math.max(0, state.movementLeft - dt); updateMovementPose(); $('movementSeconds').textContent = Math.ceil(state.movementLeft); if (state.movementLeft <= 0) endMovement(); }
  else if (state?.phase === 'ending') {
    state.endingTime -= dt;
    if(state.config.world==='tug' && !state.tugReleased && state.endingTime<=4.2) releaseTug();
    if (state.endingTime <= 0) finish(state.won);
  }
  else if (state?.phase === 'playing') {
    state.elapsed += dt;
    const storm = state.config.storms && state.elapsed >= 30 && state.elapsed % 30 < 8;
    if (storm && !state.storm) tone(330, .3); state.storm = storm;
    for (const [i, team] of state.teams.entries()) if (!team.done && team.locked > 0) { team.locked -= dt; if (team.locked <= 0) { team.index++; nextQuestion(team, i); team.panel.querySelector('.feedback').textContent = 'Nieuwe som, volgende speler!'; } }
    updateClock(); updateBanner(); if (state.config.duration > 0 && state.elapsed >= state.config.duration && !state.tugOvertime) {
      if(state.config.world==='tug') {const difference=state.teams[0].score-state.teams[1].score;if(difference) endTug(difference>0?0:1);else if(globalThis.AdventureAccess?.edition==='ontdek') {state.tugWinner=null;state.phase='ending';state.endingTime=2;state.won=false;releaseTug();$('bossStage').textContent='Gelijkspel!';}else {state.tugOvertime=true;updateTug();updateBanner();}}
      else beginEnding(false);
    }
    else if (state.config.movement && state.elapsed >= state.nextMovement && state.teams.every(t => t.done || t.locked <= 0)) beginMovement();
  }
  requestAnimationFrame(tick);
}
refreshWorld(); updateSettings(); requestAnimationFrame(tick);
