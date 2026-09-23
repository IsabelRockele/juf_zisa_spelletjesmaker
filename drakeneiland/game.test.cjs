// Tests the game transitions without launching a browser; not a layout test.
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
class Element {
  constructor() { this.children = []; this.nodes = new Map(); this.style = { setProperty() {} }; this.dataset = {}; this.classList = { add() {}, remove() {}, toggle() {} }; this.hidden = false; }
  set innerHTML(value) { this.html = value; this.nodes.clear(); }
  get innerHTML() { return this.html || ''; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  querySelector(selector) { if (!this.nodes.has(selector)) this.nodes.set(selector, new Element()); return this.nodes.get(selector); }
  querySelectorAll(selector) { if (selector === '.answers button') return this.querySelector('.answers').children; if (selector === 'input:checked') return [{value:'2'}]; return []; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener() {}
  focus() {}
}
const html = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(x => [x[1], new Element()]));
for (const [id,value] of Object.entries({operation:'split',range:'20',bridge:'mixed',teamCount:'4',target:'10',duration:'120',mode:'race',storms:'yes',movement:'off',movementInterval:'60',movementDuration:'10'})) elements.get(id).value = value;
const context = vm.createContext({document:{getElementById(id) { assert.ok(elements.has(id),`Missing element ${id}`); return elements.get(id); }, createElement:() => new Element(), body:new Element(),addEventListener(){}},performance:{now:()=>0},requestAnimationFrame(){}, console, window:{}});
vm.runInContext(fs.readFileSync(`${__dirname}/math.js`,'utf8'),context);
vm.runInContext(fs.readFileSync(`${__dirname}/worlds.js`,'utf8'),context);
vm.runInContext(fs.readFileSync(`${__dirname}/game.js`,'utf8'),context);
const run = code => vm.runInContext(code,context);
run('start()');
assert.equal(run('state.teams.length'),4);
assert.equal(run('new Set(state.teams.map(t => DragonMath.key(t.q))).size'),4);
assert.ok(run('state.teams[0].panel.querySelector(".question").innerHTML.includes("<svg")'));
run('state.phase="playing"; answer(0,state.teams[0].q.answer+100,state.teams[0].panel.querySelector(".answers").children[0])');
assert.equal(run('state.teams[0].score'),0);
run('answer(0,state.teams[0].q.answer,state.teams[0].panel.querySelector(".answers").children[1])');
assert.equal(run('state.teams[0].score'),1);
assert.equal(elements.get('shieldValue').textContent,'90%');
run('answer(0,state.teams[0].q.answer,state.teams[0].panel.querySelector(".answers").children[2])');
assert.equal(run('state.teams[0].score'),1,'Double taps must not score twice');
run('pause()'); assert.equal(run('state.phase'),'paused');
run('answer(1,state.teams[1].q.answer,state.teams[1].panel.querySelector(".answers").children[0])');
assert.equal(run('state.teams[1].score'),0);
elements.get('resume').onclick();
run('state.storm=true; answer(1,state.teams[1].q.answer,state.teams[1].panel.querySelector(".answers").children[0])');
assert.equal(run('state.teams[1].score'),2);
run('state.teams[2].score=9; answer(2,state.teams[2].q.answer,state.teams[2].panel.querySelector(".answers").children[0])');
assert.equal(run('state.phase'),'playing','Other teams continue after the first win');
assert.equal(run('state.teams[2].place'),1);
assert.equal(run('state.teams[2].score'),10,'Storm cannot exceed the team target');
run('answer(2,state.teams[2].q.answer,state.teams[2].panel.querySelector(".answers").children[1])');
assert.equal(run('state.order.length'),1,'Finished team cannot earn another place');
run('state.storm=false;state.elapsed=31;nextQuestion(state.teams[3],3);state.teams[3].score=9;answer(3,state.teams[3].q.answer,state.teams[3].panel.querySelector(".answers").children[0])');
assert.equal(run('state.teams[3].place'),2);
assert.equal(run('state.phase'),'playing');
run('state.elapsed=42;nextQuestion(state.teams[0],0);state.teams[0].score=9;answer(0,state.teams[0].q.answer,state.teams[0].panel.querySelector(".answers").children[0])');
assert.equal(run('state.teams[0].place'),3);
assert.equal(run('state.phase'),'playing');
run('state.elapsed=53;nextQuestion(state.teams[1],1);state.teams[1].score=9;answer(1,state.teams[1].q.answer,state.teams[1].panel.querySelector(".answers").children[0])');
assert.equal(run('state.teams[1].place'),4);
assert.equal(run('state.phase'),'ending','Final celebration plays before results');
run('for(let frame=1;frame<=24;frame++)tick(frame*250)');
assert.equal(run('state.phase'),'finished');
assert.equal(elements.get('overlayTitle').textContent,'Alle draken verslagen!');
assert.equal(elements.get('results').children[0].children[0].textContent,'1. Bosridders');
assert.equal(elements.get('results').children[3].children[1].textContent,'0:53 · draak verslagen');
elements.get('mode').value='coop'; run('start(); state.phase="playing"');
run('state.teams[0].score=10;updateBoss()'); assert.equal(elements.get('shieldValue').textContent,'75%');
run('state.teams[0].score=39;answer(1,state.teams[1].q.answer,state.teams[1].panel.querySelector(".answers").children[0])');
assert.equal(run('state.phase'),'ending');
run('for(let frame=1;frame<=24;frame++)tick(frame*250)');
assert.equal(run('state.phase'),'finished');
run('start();state.phase="playing";state.elapsed=120;tick(100)');
assert.equal(run('state.phase'),'ending');
run('for(let frame=1;frame<=24;frame++)tick(100+frame*250)');
assert.equal(elements.get('overlayTitle').textContent,'Vargos ontsnapt…');
elements.get('mode').value='race';elements.get('duration').value='0';run('start();state.phase="playing";state.elapsed=500;tick(100)');
assert.equal(run('state.phase'),'playing','No time limit lets every team finish');
assert.equal(elements.get('knights').children.length,4);
assert.equal(run('state.teams[0].actor.querySelector(".crystal-treasury").children.length'),10);
console.log('Spelbesturing geslaagd: eigen draken, kristallen, doorlopend spel na winst, plaatsen 1–4, eindanimatie, pauze, storm, samenwerken, tijdslimiet en onbeperkt spelen.');
assert.equal(run('state.teams[1].actor.querySelector(".knight-figure img").src'),'ridder-water.png');
assert.equal(run('state.teams[2].actor.querySelector(".knight-figure img").src'),'ridder-bos.png');
assert.equal(run('state.teams[3].actor.querySelector(".knight-figure img").src'),'ridder-ster.png');
elements.get('movement').value='on';run('start();state.phase="playing";state.elapsed=59.9;tick(250)');
assert.equal(run('state.phase'),'movement');
assert.equal(elements.get('movementDemo').dataset.motion,'jump');
assert.ok(elements.get('movementSprite').style.backgroundImage.includes('bewegen-springen-v2.png'));
run('state.movementLeft=9.5;updateMovementPose()');
assert.equal(elements.get('movementSprite').style.backgroundPosition,`${512 / (1536 - 508) * 100}% center`);
assert.equal(elements.get('movementCue').textContent,'Spring!');
run('state.movementLeft=10');
assert.equal(elements.get('movementOverlay').hidden,false);
const frozenElapsed = run('state.elapsed');
run('answer(0,state.teams[0].q.answer,state.teams[0].panel.querySelector(".answers").children[0])');
assert.equal(run('state.teams[0].score'),0);
run('for(let frame=1;frame<=40;frame++)tick(250+frame*250)');
assert.equal(run('state.phase'),'playing');
assert.equal(run('state.elapsed'),frozenElapsed,'Movement must not consume game time');
assert.equal(elements.get('movementOverlay').hidden,true);
assert.equal(run('state.nextMovement'),frozenElapsed+60);
run('beginMovement()');
assert.equal(elements.get('movementDemo').dataset.motion,'knees');
run('state.movementLeft=8.6;updateMovementPose()');
assert.equal(elements.get('movementSprite').style.transform,'none');
assert.equal(elements.get('movementCue').textContent,'Andere knie omhoog');
elements.get('skipMovement').onclick();
assert.equal(run('state.phase'),'playing');
run('beginMovement()');
assert.equal(elements.get('movementDemo').dataset.motion,'squat');
run('state.movementLeft=8.6;updateMovementPose()');
assert.equal(elements.get('movementSprite').style.backgroundPosition,'100% center');
assert.equal(elements.get('movementSprite').style.transform,'none');
console.log('Bewegingspauze geslaagd: interval, drie oefeningen, geblokkeerde antwoorden, stilstaande spelklok, automatisch hervatten en overslaan.');
elements.get('operation').value='gap-mix'; elements.get('gapPosition').value='mixed';elements.get('range').value='10';run('updateSettings();start()');
assert.equal(elements.get('gapPositionLabel').hidden,false);
assert.equal(elements.get('bridgeLabel').hidden,true);
assert.ok(run('state.teams[0].panel.querySelector(".question").textContent.includes("…")'));
assert.ok(!run('state.teams[0].panel.querySelector(".question").textContent.includes("?")'));
elements.get('operation').value='ten-sub';run('updateSettings();start()');
assert.equal(elements.get('rangeLabel').hidden,true);
assert.equal(elements.get('gapPositionLabel').hidden,true);
assert.ok(run('state.teams.every(t=>t.q.text.endsWith("= 10") && t.q.op==="gap-sub")'));
console.log('Puntoefeningen en aanvullen/wegnemen worden correct ingesteld en op het spelbord getoond.');

let worldsChecked=0;
for(const world of ['space','ocean','animals','cake','castle']) {
  elements.get('world').value=world; elements.get('mode').value='race'; elements.get('movement').value='off';
  elements.get('duration').value='0'; elements.get('storms').value='no';
  run('refreshWorld()');
  assert.equal(elements.get('worldTitle').textContent,run(`AdventureWorlds.get('${world}').title`));
  for(const count of [2,3,4]) {
    elements.get('teamCount').value=String(count);run('start();state.phase="playing"');
    assert.equal(run('state.config.world'),world);
    assert.equal(elements.get('knights').children.length,count);
    for(let i=0;i<count;i++) {
      // Answer every question so collection and reveal counts are verified, not only final flags.
      for(let n=0;n<10;n++) {
        run(`state.elapsed+=1;nextQuestion(state.teams[${i}],${i});answer(${i},state.teams[${i}].q.answer,state.teams[${i}].panel.querySelector('.answers').children[0])`);
        assert.equal(run(`state.teams[${i}].score`),n+1);
      }
      assert.equal(run(`state.teams[${i}].place`),i+1);
      assert.equal(run('state.phase'),i===count-1?'ending':'playing');
      if(['ocean','animals'].includes(world)) assert.equal(run(`state.teams[${i}].actor.querySelector('.goal-collection').children.length`),10);
      else assert.equal(run(`state.teams[${i}].actor.querySelector('.goal-art').style.clipPath`),'inset(0% 0 0 0)');
    }
    run('for(let frame=1;frame<=24;frame++)tick(frame*250)');
    assert.equal(run('state.phase'),'finished');assert.equal(elements.get('overlayTitle').textContent,'Missie geslaagd!');
    assert.ok(!elements.get('overlayText').textContent.includes('draak'));
    assert.equal(elements.get('results').children.length,count);
    worldsChecked++;
  }
  elements.get('mode').value='coop';elements.get('teamCount').value='3';run('start();state.phase="playing"');
  for(let n=0;n<30;n++) {const i=n%3;run(`nextQuestion(state.teams[${i}],${i});answer(${i},state.teams[${i}].q.answer,state.teams[${i}].panel.querySelector('.answers').children[0])`);}
  assert.equal(run('state.phase'),'ending');
  assert.ok(run('state.teams.every(t=>t.actor.querySelector(".world-score").textContent.startsWith("Samen 30 / 30"))'));
  run('for(let frame=1;frame<=24;frame++)tick(frame*250)');
  assert.equal(elements.get('overlayTitle').textContent,'Missie geslaagd!');
  elements.get('duration').value='120';run('start();state.phase="playing";state.elapsed=120;tick(100)');
  run('for(let frame=1;frame<=24;frame++)tick(100+frame*250)');
  assert.equal(elements.get('overlayTitle').textContent,'De tijd is om!');
  assert.ok(elements.get('overlayText').textContent.includes('0 van de 30'));
}
console.log(`${worldsChecked} wereld/teamcombinaties getest, plus samen spelen, juiste verzamelingen, bouwwerken, eindvolgorde en tijdslimiet.`);
// The tug is competitive, keeps different exercises and stops both teams on a win.
elements.get('world').value='tug';elements.get('teamCount').value='4';elements.get('mode').value='coop';elements.get('storms').value='yes';elements.get('duration').value='0';run('refreshWorld();start();state.phase="playing"');
assert.equal(run('state.teams.length'),2);assert.equal(run('state.config.coop'),false);assert.equal(run('state.config.storms'),false);
assert.equal(elements.get('teamCount').disabled,true);assert.equal(elements.get('tugScene').hidden,false);
assert.equal(run('new Set(state.teams.map(t=>DragonMath.key(t.q))).size'),2);
const correct=i=>run(`nextQuestion(state.teams[${i}],${i});answer(${i},state.teams[${i}].q.answer,state.teams[${i}].panel.querySelector('.answers').children[0])`);
correct(0);assert.ok(elements.get('tugMotion').style.transform.includes('-1.2%'));
correct(1);assert.equal(elements.get('tugMotion').style.transform,'translateX(0%)');
correct(1);assert.equal(elements.get('tugMotion').style.transform,'translateX(1.2%)');
for(let n=2;n<10;n++)correct(1);
assert.equal(run('state.phase'),'ending');assert.equal(run('state.tugWinner'),1);assert.equal(elements.get('tugMotion').style.transform,'translateX(28%)');
assert.ok(run('state.teams.every(t=>t.done)'));
const scoreBefore=run('state.teams[0].score');correct(0);assert.equal(run('state.teams[0].score'),scoreBefore);
assert.equal(run('state.tugReleased'),false);
run('for(let n=0;n<12;n++)tick(10000+n*250)');
assert.equal(run('state.tugReleased'),true);assert.equal(elements.get('tugRightPlayers').src,'werelden/tug-right-won.png');assert.equal(elements.get('tugLeftPlayers').src,'werelden/tug-left-rest.png');assert.ok(elements.get('tugRopePath').d.includes('180'));
run('for(let n=12;n<30;n++)tick(10000+n*250)');assert.equal(run('state.phase'),'finished');assert.ok(elements.get('overlayTitle').textContent.includes('wint'));
assert.equal(elements.get('results').children.length,2);
// A clock tie continues until the next correct answer, also when neither team scored.
elements.get('duration').value='120';run('start();state.phase="playing";state.elapsed=120;tick(100)');assert.equal(run('state.tugOvertime'),true);assert.equal(run('state.phase'),'playing');
correct(0);assert.equal(run('state.phase'),'ending');assert.equal(run('state.tugWinner'),0);run('releaseTug()');assert.equal(elements.get('tugLeftPlayers').src,'werelden/tug-left-won.png');assert.equal(elements.get('tugRightPlayers').src,'werelden/tug-right-rest.png');
// A timed lead gets the same physical winning animation.
run('start();state.phase="playing"');assert.equal(elements.get('tugScene').dataset.ending,'');assert.equal(elements.get('tugLeftPlayers').src,'werelden/tug-left.png');assert.ok(elements.get('tugRopePath').d.endsWith('720 98'));correct(1);run('state.elapsed=120;tick(100)');assert.equal(run('state.tugWinner'),1);
// Returning to another world allows normal settings again.
elements.get('world').value='ocean';run('refreshWorld()');assert.equal(elements.get('teamCount').disabled,false);assert.equal(elements.get('mode').disabled,false);
// Pearls 11 and 21 start new layers; none exceed their chest opening.
elements.get('target').value='30';run('start();state.teams[0].score=30;updateProgress(state.teams[0])');
const pearls=run('state.teams[0].actor.querySelector(".goal-collection").children');
assert.equal(pearls.length,30);
for(let n=0;n<30;n++){assert.equal(pearls[n].dataset.layer,Math.floor(n/10));assert.ok(parseFloat(pearls[n].style.left)+8<=100);}
assert.equal(pearls[10].style.bottom,'47%');assert.equal(pearls[20].style.bottom,'51%');
console.log('Touwtrekken getest: 2 teams, wisselende voorsprong, beide winrichtingen, eindstop, tijdslimiet en verlenging. Parelstapels getest tot 30.');
// Every theme has matching movement art, all three exercises, and resumes frozen gameplay.
for(const [world,character] of Object.entries({dragon:'ridder',castle:'ridder',space:'astronaut',ocean:'duiker',animals:'dierenverzorger',cake:'bakker',tug:'sporter'})){
 elements.get('world').value=world;elements.get('movement').value='on';run('refreshWorld();start();state.phase="playing"');
 for(let n=0;n<3;n++){
  const before=run('state.elapsed');run('beginMovement()');
  assert.ok(elements.get('movementInstruction').textContent.includes(`de ${character} na`));
  assert.ok(elements.get('movementSprite')['aria-label'].startsWith(character));
  assert.ok(fs.existsSync(`${__dirname}/${run('state.movementExercise.image')}`));
  run('state.movementLeft=.1;tick(10000)');assert.equal(run('state.phase'),'playing');assert.equal(run('state.elapsed'),before);
 }
}
console.log('Bewegingspersonages getest voor alle 7 spelvormen, met alle 3 oefeningen.');
vm.runInContext(fs.readFileSync(`${__dirname}/access-policy.js`,'utf8'),context);
run('globalThis.AdventureAccess={edition:"pro",ready:false}');const beforeBlocked=run('state');run('start()');assert.equal(run('state'),beforeBlocked);
run('AdventureAccess={edition:"ontdek",ready:true}');
elements.get('world').value='space';elements.get('operation').value='mul';elements.get('range').value='20';elements.get('teamCount').value='4';elements.get('target').value='30';elements.get('duration').value='0';run('start()');
assert.equal(run('state.config.world'),'dragon');assert.equal(run('state.config.duration'),90);assert.equal(run('state.config.range'),10);assert.equal(run('state.teams.length'),2);assert.equal(run('state.config.operation'),'add');
elements.get('world').value='tug';run('start();state.phase="playing";state.elapsed=90;tick(20000)');assert.equal(run('state.phase'),'ending');assert.equal(run('state.tugWinner'),null);assert.equal(run('state.tugOvertime'),undefined);run('finishTug()');assert.equal(elements.get('overlayTitle').textContent,'Gelijkspel!');
console.log('Ontdek gecontroleerd: spel geblokkeerd vóór Pro-controle, instellingen begrensd bij start en harde eindtijd bij gelijkstand.');
// Expressions follow each team's own progress, reset, and shared progress in co-op.
run('AdventureAccess={edition:"pro",ready:true}');
elements.get('world').value='dragon';elements.get('mode').value='race';elements.get('target').value='15';elements.get('teamCount').value='3';run('refreshWorld();start()');
for(const [score,expected] of [[0,'strijd'],[4,'strijd'],[5,'verbaasd'],[9,'verbaasd'],[10,'beduusd'],[15,'beduusd']]){
 run(`state.teams[0].score=${score};updateProgress(state.teams[0])`);
 assert.equal(run('state.teams[0].actor.querySelector(".personal-dragon > img").src'),`vargos-${expected}.png`);
 assert.equal(run('state.teams[1].actor.querySelector(".personal-dragon > img").src'),'vargos-strijd.png');
}
run('start()');assert.equal(run('state.teams[0].actor.querySelector(".personal-dragon > img").src'),'vargos-strijd.png');
elements.get('mode').value='coop';run('start();state.teams[0].score=15;updateBoss()');
assert.equal(elements.get('battle').querySelector('.dragon-portrait > img').src,'vargos-verbaasd.png');
run('state.teams[1].score=15;updateBoss()');assert.equal(elements.get('battle').querySelector('.dragon-portrait > img').src,'vargos-beduusd.png');
console.log('Drakenuitdrukkingen getest: grenzen op 1/3 en 2/3, onafhankelijke teams, herstart en samen spelen.');
