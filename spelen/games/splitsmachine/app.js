(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const els = {
    settings: $('settingsPanel'), game: $('gamePanel'), finish: $('finishPanel'), bridge: $('bridgeField'),
    bridgeChoices: $('bridgeChoices'), bridgeHelp: $('bridgeHelp'), positionStep: $('positionStep'),
    start: $('startButton'), change: $('changeButton'), finishChange: $('finishChangeButton'), again: $('againButton'),
    form: $('answerForm'), input: $('answerInput'), feedback: $('feedback'), machine: $('machine'),
    total: $('totalCell'), left: $('leftCell'), right: $('rightCell'), round: $('roundLabel'), progress: $('progressBar'),
    score: $('scoreValue'), energy: $('energyFill'), bolts: $('bolts'), encouragement: $('encouragement'),
    sound: $('soundButton'), confetti: $('confetti')
  };
  els.lever = $('machineLever');
  const messages = ['Goed bezig!', 'De machine zoemt!', 'Knap gesplitst!', 'Jij bent een rekenster!', 'Bijna volgeladen!'];
  const grade = new URLSearchParams(location.search).get('leerjaar') === '2' ? 2 : 1;
  let settings = {}, exercise = null, round = 0, locked = false, soundOn = true, lastSignature = '';
  let lastCelebration = '';

  function selected(name) { return document.querySelector(`input[name="${name}"]:checked`)?.value; }
  function random(array) { return array[Math.floor(Math.random() * array.length)]; }
  function shuffle(array) { return [...array].sort(() => Math.random() - .5); }

  function bridgeOptions(level) {
    if (level === 20) return [
      ['without', 'Zonder brug', 'De eenheden maken geen nieuw tiental.'],
      ['with', 'Met brug', 'De eenheden maken samen een nieuw tiental.'],
      ['mixed', 'Gemengd', 'Met en zonder brug door elkaar.']
    ];
    if (level === 100) return [
      ['tens', 'Enkel tientallen', 'Bijvoorbeeld 30 en 40 samen.'],
      ['without', 'Zonder brug', 'De eenheden maken geen nieuw tiental.'],
      ['with', 'Met brug', 'De eenheden maken samen een nieuw tiental.'],
      ['mixed', 'Gemengd', 'Alle soorten door elkaar.']
    ];
    return [];
  }

  function updateBridgeUI() {
    const level = Number(selected('level'));
    const options = bridgeOptions(level);
    els.bridge.hidden = options.length === 0;
    els.positionStep.textContent = options.length ? '3.' : '2.';
    els.bridgeChoices.innerHTML = options.map(([value, label], index) =>
      `<label><input type="radio" name="bridge" value="${value}" ${index === options.length - 1 ? 'checked' : ''}><span><b>${label}</b></span></label>`
    ).join('');
    els.bridgeChoices.classList.toggle('four', options.length === 4);
    els.bridgeHelp.textContent = options.length ? 'Een brug ontstaat als de eenheden samen een nieuw tiental vormen.' : '';
  }

  function applyGrade() {
    document.body.className = grade === 1 ? 'bee-theme' : 'zebra-theme';
    $('backLink').href = grade === 1 ? '../splits_spelletjes.html' : '../start_leerjaar2.html';
    $('themeMascot').src = grade === 1
      ? 'bibi-splitsmachine.png'
      : 'zisa-splitsmachine.png';
    $('themeMascot').alt = grade === 1 ? 'Bibi het bijtje' : 'Zisa de zebra';
    $('finishMascot').src = grade === 1 ? '../leerjaar1_afbeeldingen/juichende_bibi.png' : '../tafels_afbeeldingen/juf_zisa.png';
    $('levelChoices').innerHTML = grade === 1
      ? `<label><input type="radio" name="level" value="5"><span><b>tot 5</b><small>eerste splitsingen</small></span></label><label><input type="radio" name="level" value="10" checked><span><b>tot 10</b><small>vriendjes van 10</small></span></label><label><input type="radio" name="level" value="20"><span><b>tot 20</b><small>met of zonder brug</small></span></label>`
      : `<label><input type="radio" name="level" value="10" checked><span><b>tot 10</b><small>splitsingen herhalen</small></span></label><label><input type="radio" name="level" value="20"><span><b>tot 20</b><small>met of zonder brug</small></span></label><label><input type="radio" name="level" value="100"><span><b>tot 100</b><small>tientallen en brug</small></span></label>`;
    document.querySelectorAll('input[name="level"]').forEach(input => input.addEventListener('change', updateBridgeUI));
  }

  function candidates(level, mode) {
    const list = [];
    for (let total = 1; total <= level; total++) {
      for (let left = 0; left <= total; left++) {
        const right = total - left;
        const crosses = (left % 10) + (right % 10) >= 10;
        const tensOnly = left % 10 === 0 && right % 10 === 0;
        if (mode === 'tens' && !tensOnly) continue;
        if (mode === 'without' && (crosses || tensOnly)) continue;
        if (mode === 'with' && !crosses) continue;
        list.push({ total, left, right });
      }
    }
    return list;
  }

  function makeExercise() {
    const mode = settings.level <= 10 ? 'all' : settings.bridge;
    let pool;
    if (mode === 'mixed') {
      const available = ['without', 'with'];
      if (settings.level === 100) available.push('tens');
      pool = candidates(settings.level, random(available));
    } else pool = candidates(settings.level, mode);
    if (!pool.length) pool = candidates(settings.level, 'all');
    let item = random(pool);
    let position = settings.position === 'mixed' ? random(['left', 'right', 'total']) : settings.position === 'parts' ? random(['left', 'right']) : settings.position;
    for (let tries = 0; tries < 12 && `${item.total}-${item.left}-${position}` === lastSignature; tries++) item = random(pool);
    lastSignature = `${item.total}-${item.left}-${position}`;
    return { ...item, position, answer: item[position] };
  }

  function renderExercise() {
    exercise = makeExercise();
    ['total', 'left', 'right'].forEach(key => {
      const cell = els[key];
      cell.classList.toggle('missing', exercise.position === key);
      if (exercise.position === key) {
        cell.replaceChildren();
        cell.append(els.input);
      } else {
        cell.textContent = exercise[key];
      }
    });
    els.input.value = '';
    els.feedback.textContent = '';
    els.feedback.className = 'feedback';
    els.round.textContent = `Opdracht ${round + 1} van ${settings.totalRounds}`;
    els.progress.style.width = `${round / settings.totalRounds * 100}%`;
    els.score.textContent = round;
    const percent = round / settings.totalRounds * 100;
    els.energy.style.height = `${percent}%`;
    document.querySelector('.energy-card')?.style.setProperty('--energy', `${percent}%`);
    [...els.bolts.children].forEach((bolt, index) => bolt.classList.toggle('on', index < round));
    locked = false;
    els.lever.disabled = false;
    els.lever.classList.add('ready');
    els.lever.classList.remove('pulled');
  }

  function beep(good) {
    if (!soundOn || !window.AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = good ? 'sine' : 'square';
    oscillator.frequency.setValueAtTime(good ? 520 : 175, context.currentTime);
    if (good) oscillator.frequency.exponentialRampToValueAtTime(780, context.currentTime + .16);
    gain.gain.setValueAtTime(.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .23);
    oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .24);
    oscillator.onended = () => context.close();
  }

  function checkAnswer() {
    if (locked) return;
    const value = els.input.value.trim();
    if (value === '') { els.feedback.textContent = 'Vul eerst een getal in.'; els.feedback.className = 'feedback bad'; return; }
    if (Number(value) !== exercise.answer) {
      beep(false);
      els.input.value = '';
      const missingCell = els[exercise.position];
      missingCell.classList.remove('wrong');
      void missingCell.offsetWidth;
      missingCell.classList.add('wrong');
      els.feedback.textContent = 'Oeps, dat klopt nog niet. Probeer opnieuw!';
      els.feedback.className = 'feedback bad';
      els.machine.classList.remove('shake'); void els.machine.offsetWidth; els.machine.classList.add('shake');
      setTimeout(() => missingCell.classList.remove('wrong'), 900);
      els.input.focus();
      return;
    }
    locked = true; beep(true); round++;
    els.feedback.textContent = round === settings.totalRounds ? 'Helemaal juist!' : `Juist! ${exercise.total} is ${exercise.left} en ${exercise.right}.`;
    els.feedback.className = 'feedback good';
    els.machine.classList.remove('flash'); void els.machine.offsetWidth; els.machine.classList.add('flash');
    const percent = round / settings.totalRounds * 100;
    els.progress.style.width = `${percent}%`; els.score.textContent = round; els.energy.style.height = `${percent}%`;
    document.querySelector('.energy-card')?.style.setProperty('--energy', `${percent}%`);
    [...els.bolts.children].forEach((bolt, index) => bolt.classList.toggle('on', index < round));
    els.encouragement.textContent = random(messages);
    celebrateCorrect();
  }

  function startGame() {
    settings = { level: Number(selected('level')), bridge: selected('bridge') || 'all', position: selected('position'), totalRounds: Number(selected('rounds')) };
    round = 0; lastSignature = ''; document.body.classList.add('play-mode'); document.body.classList.remove('finish-mode'); els.settings.hidden = true; els.finish.hidden = true; els.game.hidden = false;
    els.encouragement.textContent = 'Daar gaan we!'; renderExercise();
  }
  function showSettings() { document.body.classList.remove('play-mode', 'finish-mode'); els.game.hidden = true; els.finish.hidden = true; els.settings.hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function finishGame() {
    document.body.classList.add('finish-mode'); els.game.hidden = true; els.finish.hidden = false; $('finishText').textContent = `Je loste ${settings.totalRounds} splitsingen op. Knap gerekend!`; $('finishBadge').textContent = random(['🏆 Splitskampioen', '⚙️ Machinebaas', '💡 Rekenuitvinder', '⭐ Getallenheld']); launchConfetti(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function launchConfetti() {
    burstCelebration('finale', 110);
    setTimeout(() => els.confetti.replaceChildren(), 3800);
  }
  function celebrateCorrect() {
    const choices = ['confetti', 'bubbles', 'stars', 'streamers', 'candy', 'balloons'].filter(type => type !== lastCelebration);
    lastCelebration = random(choices);
    burstCelebration(lastCelebration, lastCelebration === 'bubbles' ? 20 : 30);
  }
  function burstCelebration(type, amount) {
    els.confetti.replaceChildren(); const colors = ['#5b43d6','#ff9f1c','#18a66b','#ef4d6d','#31a8ff'];
    els.confetti.className = `confetti ${type}`;
    for (let i = 0; i < amount; i++) { const piece = document.createElement('i'); piece.style.left = `${12 + Math.random() * 76}vw`; piece.style.setProperty('--color', random(colors)); piece.style.background = random(colors); piece.style.animationDelay = `${Math.random() * .45}s`; piece.style.animationDuration = `${1.9 + Math.random() * 1.4}s`; if (type === 'stars') piece.textContent = random(['★','✦','●']); if (type === 'candy') piece.textContent = random(['🍬','🍭','🍪']); if (type === 'balloons') piece.textContent = '🎈'; if (type === 'finale') piece.textContent = random(['★','✦','●','🍬','🎈']); els.confetti.append(piece); }
    setTimeout(() => els.confetti.replaceChildren(), 3200);
  }

  applyGrade();
  els.start.addEventListener('click', startGame); els.again.addEventListener('click', startGame); els.change.addEventListener('click', showSettings); els.finishChange.addEventListener('click', showSettings);
  els.form.addEventListener('submit', event => { event.preventDefault(); pullLever(); });
  $('keypad').addEventListener('click', event => { const key = event.target.closest('button')?.dataset.key; if (!key || locked) return; if (key === 'back') els.input.value = els.input.value.slice(0, -1); else if (key === 'ok') pullLever(); else if (els.input.value.length < 3) els.input.value += key; els.input.focus(); });
  els.input.addEventListener('input', () => { els.input.value = els.input.value.replace(/\D/g, '').slice(0, 3); });
  els.input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); pullLever(); } });
  els.sound.addEventListener('click', () => { soundOn = !soundOn; els.sound.textContent = soundOn ? '🔊' : '🔇'; els.sound.setAttribute('aria-pressed', String(soundOn)); });
  function pullLever() {
    if (els.lever.disabled || locked) return;
    els.lever.disabled = true; els.lever.classList.remove('ready'); els.lever.classList.add('pulled'); els.machine.classList.add('processing');
    setTimeout(() => {
      checkAnswer();
      setTimeout(() => {
        els.machine.classList.remove('processing');
        if (locked) round >= settings.totalRounds ? finishGame() : renderExercise();
        else { els.lever.classList.remove('pulled'); els.lever.classList.add('ready'); els.lever.disabled = false; }
      }, 600);
    }, 350);
  }
  els.lever.addEventListener('click', pullLever);
  els.bolts.innerHTML = Array.from({ length: 10 }, () => '<span>⚡</span>').join('');
  updateBridgeUI();
})();
