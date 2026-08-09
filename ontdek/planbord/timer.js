// === TIMER ===
// Timer-vak met visuele stijlen: cijfers, klok, taart, zandloper, voortgangsbalk
// Plus geluidsmodus (stilte/fluister) en alarm bij afloop

// Houd actieve timers bij om ze te kunnen stoppen/resetten
const _actieveTimers = new Map(); // timerId → { intervalId, startTijd, totaleMs, pauzeMs, isLopend }

// === HTML VAN EEN TIMER-VAK ===
function _maakTimerVakHTML(opties = {}) {
  const minuten = opties.minuten || 5;
  const seconden = opties.seconden || 0;
  const stijl = opties.timerStijl || 'cijfers';
  const geluid = opties.geluidsmodus || 'normaal'; // normaal / fluister / stilte

  return `
    <div class="vak-titel" contenteditable="true" data-placeholder="Titel (bv. 'Werktijd')">${_escape(opties.titel || '')}</div>
    <div class="timer-inhoud">
      <div class="timer-visueel" data-stijl="${stijl}">
        ${_maakTimerVisueelHTML(stijl)}
      </div>
      <div class="timer-cijfers">
        <span class="timer-tijd">${_formatTijd(minuten * 60 + seconden)}</span>
      </div>
      <div class="timer-knoppen">
        <button class="timer-knop timer-start" type="button" title="Start/Pauze">▶</button>
        <button class="timer-knop timer-reset" type="button" title="Reset">↺</button>
        <button class="timer-knop timer-instellen" type="button" title="Instellen">⚙</button>
      </div>
      <div class="timer-geluidsicoon" data-modus="${geluid}" title="Klik om geluidsmodus te wisselen">
        ${_geluidIcoon(geluid)}
      </div>
    </div>
  `;
}

function _maakTimerVisueelHTML(stijl) {
  switch (stijl) {
    case 'klok':
      return `
        <svg viewBox="0 0 100 100" class="timer-svg timer-klok">
          <circle cx="50" cy="50" r="44" class="klok-rand" />
          <path class="klok-sector" d="M50,50 L50,6 A44,44 0 1,1 49.99,6 Z" />
          <circle cx="50" cy="50" r="3" class="klok-midden" />
        </svg>`;
    case 'taart':
      return `
        <svg viewBox="0 0 100 100" class="timer-svg timer-taart">
          <g class="taart-segmenten"></g>
          <circle cx="50" cy="50" r="3" class="taart-midden" />
        </svg>`;
    case 'zandloper':
      return `
        <svg viewBox="0 0 100 120" class="timer-svg timer-zandloper">
          <path d="M20,10 L80,10 L80,15 L55,55 L80,95 L80,110 L20,110 L20,95 L45,55 L20,15 Z"
                class="zandloper-glas" />
          <path class="zandloper-zand-boven" d="M22,12 L78,12 L55,52 L45,52 Z" />
          <path class="zandloper-zand-onder" d="" />
          <rect class="zandloper-deksel" x="18" y="8" width="64" height="4" rx="1" />
          <rect class="zandloper-bodem" x="18" y="108" width="64" height="4" rx="1" />
        </svg>`;
    case 'balk':
      return `
        <div class="balk-buiten">
          <div class="balk-vulling"></div>
        </div>`;
    case 'cijfers':
    default:
      return ''; // cijfers tonen we al elders
  }
}

function _formatTijd(seconden) {
  const m = Math.floor(seconden / 60);
  const s = seconden % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function _geluidIcoon(modus) {
  if (modus === 'fluister') return '🤫';
  if (modus === 'stilte') return '🔇';
  return '🔊';
}

// === TIMER LOGICA ===
function _initTimer(vak) {
  const totaleMs = (parseInt(vak.dataset.minuten) || 5) * 60000 + (parseInt(vak.dataset.seconden) || 0) * 1000;

  _actieveTimers.set(vak.id, {
    intervalId: null,
    resterend: totaleMs,
    totaal: totaleMs,
    isLopend: false,
  });

  _toonResterendeTijd(vak);
  _updateVisueel(vak, 1.0); // 1.0 = volle taart/balk/etc

  // Knoppen
  vak.querySelector('.timer-start').addEventListener('click', (e) => {
    e.stopPropagation();
    _toggleTimer(vak);
  });
  vak.querySelector('.timer-start').addEventListener('mousedown', (e) => e.stopPropagation());

  vak.querySelector('.timer-reset').addEventListener('click', (e) => {
    e.stopPropagation();
    _resetTimer(vak);
  });
  vak.querySelector('.timer-reset').addEventListener('mousedown', (e) => e.stopPropagation());

  vak.querySelector('.timer-instellen').addEventListener('click', (e) => {
    e.stopPropagation();
    _toonTimerInstellen(vak);
  });
  vak.querySelector('.timer-instellen').addEventListener('mousedown', (e) => e.stopPropagation());

  // Geluidsicoon: klikken cycleert door modi
  const geluidsIcoon = vak.querySelector('.timer-geluidsicoon');
  if (geluidsIcoon) {
    geluidsIcoon.addEventListener('mousedown', (e) => e.stopPropagation());
    geluidsIcoon.addEventListener('click', (e) => {
      e.stopPropagation();
      _wisselGeluidsmodus(vak);
    });
  }
}

function _toggleTimer(vak) {
  const status = _actieveTimers.get(vak.id);
  if (!status) return;

  if (status.isLopend) {
    // Pauze
    clearInterval(status.intervalId);
    status.isLopend = false;
    vak.querySelector('.timer-start').textContent = '▶';
  } else {
    // Start
    status.startTik = Date.now();
    status.isLopend = true;
    vak.querySelector('.timer-start').textContent = '⏸';
    status.intervalId = setInterval(() => _tikTimer(vak), 100);
  }
}

function _tikTimer(vak) {
  const status = _actieveTimers.get(vak.id);
  if (!status || !status.isLopend) return;

  const verstreken = Date.now() - status.startTik;
  status.startTik = Date.now();
  status.resterend = Math.max(0, status.resterend - verstreken);

  _toonResterendeTijd(vak);
  const fractie = status.resterend / status.totaal;
  _updateVisueel(vak, fractie);

  if (status.resterend <= 0) {
    clearInterval(status.intervalId);
    status.isLopend = false;
    vak.querySelector('.timer-start').textContent = '▶';
    _timerAfgelopen(vak);
  }
}

function _resetTimer(vak) {
  const status = _actieveTimers.get(vak.id);
  if (!status) return;
  if (status.isLopend) {
    clearInterval(status.intervalId);
    status.isLopend = false;
  }
  status.resterend = status.totaal;
  vak.querySelector('.timer-start').textContent = '▶';
  vak.classList.remove('tijd-om');
  _toonResterendeTijd(vak);
  _updateVisueel(vak, 1.0);
}

function _toonResterendeTijd(vak) {
  const status = _actieveTimers.get(vak.id);
  if (!status) return;
  const sec = Math.ceil(status.resterend / 1000);
  vak.querySelector('.timer-tijd').textContent = _formatTijd(sec);
}

// === VISUELE UPDATE PER STIJL ===
function _updateVisueel(vak, fractie) {
  // fractie: 1.0 = vol, 0.0 = leeg
  fractie = Math.max(0, Math.min(1, fractie));
  const visueel = vak.querySelector('.timer-visueel');
  if (!visueel) return;
  const stijl = visueel.dataset.stijl;

  if (stijl === 'klok') {
    _updateKlok(visueel, fractie);
  } else if (stijl === 'taart') {
    _updateTaart(visueel, fractie);
  } else if (stijl === 'zandloper') {
    _updateZandloper(visueel, fractie);
  } else if (stijl === 'balk') {
    _updateBalk(visueel, fractie);
  }
}

function _updateKlok(svg, fractie) {
  // Cirkel-sector tekenen vanaf bovenkant (90° in atan2-terminologie)
  // 1.0 = volledige cirkel, 0.0 = niks
  const path = svg.querySelector('.klok-sector');
  if (!path) return;
  if (fractie >= 0.9999) {
    path.setAttribute('d', 'M50,50 L50,6 A44,44 0 1,1 49.99,6 Z');
    return;
  }
  if (fractie <= 0.0001) {
    path.setAttribute('d', '');
    return;
  }
  const hoek = 360 * fractie;
  const radHoek = (hoek - 90) * Math.PI / 180;
  const eindX = 50 + 44 * Math.cos(radHoek);
  const eindY = 50 + 44 * Math.sin(radHoek);
  const grootBoog = hoek > 180 ? 1 : 0;
  path.setAttribute('d', `M50,50 L50,6 A44,44 0 ${grootBoog},1 ${eindX},${eindY} Z`);
}

function _updateTaart(svg, fractie) {
  // Taart heeft segmenten (1 per minuut, maximaal 12); leeg een per een uit
  const g = svg.querySelector('.taart-segmenten');
  if (!g) return;
  g.innerHTML = '';

  // Aantal segmenten bepalen: gelijk aan oorspronkelijke minuten, max 12, min 4
  const totaalMinuten = parseInt(svg.closest('.vak')?.dataset.minuten || '5');
  const aantalSegmenten = Math.max(4, Math.min(12, totaalMinuten));

  const segmentFractie = 1 / aantalSegmenten;
  for (let i = 0; i < aantalSegmenten; i++) {
    const start = i * segmentFractie;
    const eind = (i + 1) * segmentFractie;
    // Toon segment als het binnen de resterende fractie ligt
    const actief = fractie > start;
    if (!actief) continue;

    // Hoeveel van dit segment nog?
    const sLocal = Math.min((fractie - start) / segmentFractie, 1);
    const hoekStart = start * 360 - 90;
    const hoekEind = (start + segmentFractie * sLocal) * 360 - 90;
    const r1 = hoekStart * Math.PI / 180;
    const r2 = hoekEind * Math.PI / 180;
    const x1 = 50 + 42 * Math.cos(r1);
    const y1 = 50 + 42 * Math.sin(r1);
    const x2 = 50 + 42 * Math.cos(r2);
    const y2 = 50 + 42 * Math.sin(r2);
    const grootBoog = (hoekEind - hoekStart) > 180 ? 1 : 0;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M50,50 L${x1},${y1} A42,42 0 ${grootBoog},1 ${x2},${y2} Z`);
    path.setAttribute('class', `taart-segment taart-segment-${i % 4}`);
    g.appendChild(path);
  }
}

function _updateZandloper(svg, fractie) {
  const zandBoven = svg.querySelector('.zandloper-zand-boven');
  const zandOnder = svg.querySelector('.zandloper-zand-onder');
  if (!zandBoven || !zandOnder) return;

  // Boven: verklein vanaf bovenkant naar het midden — fractie = hoeveel zand er nog is
  // Bovenste deel-pad: trapezium van y=12 tot y=52, x van 22-78 naar 45-55
  // We tekenen het in en korten van bovenaf
  const topY = 12;
  const middenY = 52;
  const hoogteBoven = middenY - topY; // 40
  const zandHoogte = hoogteBoven * fractie;
  const zandTopY = middenY - zandHoogte;
  // Breedte bovenkant interpoleren
  const breedteBovenkant = 22 + (45 - 22) * (1 - fractie); // van 22 naar 45 als zand zakt
  const xLinks = 22 + (45 - 22) * ((middenY - zandTopY) / hoogteBoven * 0);
  // Eenvoudig: verklein het trapezium
  // top: x van xL tot xR op zandTopY (ingekrompen breedte)
  // bottom: x van 45 tot 55 op middenY (vast punt)
  const tBoven = (middenY - zandTopY) / hoogteBoven; // 0 → leeg, 1 → vol
  const xL = 22 + (45 - 22) * (1 - tBoven);
  const xR = 78 - (78 - 55) * (1 - tBoven);
  if (fractie > 0.01) {
    zandBoven.setAttribute('d', `M${xL},${zandTopY} L${xR},${zandTopY} L55,${middenY} L45,${middenY} Z`);
  } else {
    zandBoven.setAttribute('d', '');
  }

  // Onder: hoogte = (1 - fractie) * (110 - 55) ≈ 55
  const bovenY = 95;
  const bottomY = 110;
  const hoogteOnder = bottomY - bovenY; // 15 — visueel klein, want zand stapelt zich op
  // Met meer fractie weg = meer zand onder
  const zandOnderHoogte = (1 - fractie) * (bottomY - 55) * 0.5; // schaal voor visueel mooi
  const zandOnderTop = bottomY - zandOnderHoogte;
  if (fractie < 0.99) {
    // Trapezium-vorm: hoekig stapelend
    const xLinksOnder = 45 - (45 - 22) * (1 - fractie);
    const xRechtsOnder = 55 + (78 - 55) * (1 - fractie);
    zandOnder.setAttribute('d', `M45,55 L55,55 L${xRechtsOnder},${zandOnderTop} L78,${bottomY} L22,${bottomY} L${xLinksOnder},${zandOnderTop} Z`);
  } else {
    zandOnder.setAttribute('d', '');
  }
}

function _updateBalk(container, fractie) {
  const vulling = container.querySelector('.balk-vulling');
  if (vulling) vulling.style.width = (fractie * 100) + '%';
}

// === TIMER AFGELOPEN ===
function _timerAfgelopen(vak) {
  vak.classList.add('tijd-om');
  vak.querySelector('.timer-tijd').textContent = 'Tijd om!';
  _speelAlarm();
  // Knipperen stopt na 6 seconden
  setTimeout(() => vak.classList.remove('tijd-om'), 6000);
}

// === ALARMGELUID (Web Audio, 3 sec, zacht en vriendelijk) ===
let _audioCtx = null;

function _speelAlarm() {
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = _audioCtx;
    // Resume context if suspended (Chrome auto-suspend policy)
    if (ctx.state === 'suspended') ctx.resume();

    // Drie tonen (do-mi-sol), elk 0.4s, herhaald
    const tonen = [523.25, 659.25, 783.99]; // C5, E5, G5
    const beginTijd = ctx.currentTime;

    // Speel reeks 2x = ongeveer 2.4s, plus laatste lange noot = 3s totaal
    [0, 1.2].forEach((offsetSec) => {
      tonen.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = beginTijd + offsetSec + i * 0.18;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    });
  } catch (err) {
    console.warn('Kon alarmgeluid niet afspelen:', err);
  }
}

// === GELUIDSMODUS ===
function _wisselGeluidsmodus(vak) {
  const modi = ['normaal', 'fluister', 'stilte'];
  const huidig = vak.dataset.geluidsmodus || 'normaal';
  const idx = modi.indexOf(huidig);
  const nieuwe = modi[(idx + 1) % modi.length];
  vak.dataset.geluidsmodus = nieuwe;
  const icoon = vak.querySelector('.timer-geluidsicoon');
  if (icoon) {
    icoon.dataset.modus = nieuwe;
    icoon.textContent = _geluidIcoon(nieuwe);
  }
}

// === TIMER INSTELLEN MODAL ===
function _toonTimerInstellen(vak) {
  const modal = document.getElementById('timer-modal');
  if (!modal) return;

  // Huidige waarden
  document.getElementById('timer-minuten').value = parseInt(vak.dataset.minuten) || 5;
  document.getElementById('timer-seconden').value = parseInt(vak.dataset.seconden) || 0;

  const huidigeStijl = vak.querySelector('.timer-visueel')?.dataset.stijl || 'cijfers';
  document.querySelectorAll('#timer-modal .timer-stijl-knop').forEach((k) => {
    k.classList.toggle('actief', k.dataset.stijl === huidigeStijl);
  });

  modal.classList.remove('verborgen');
  modal.dataset.timerId = vak.id;
}

function _initTimerModal() {
  const modal = document.getElementById('timer-modal');
  if (!modal) return;

  // Stijl-knoppen
  document.querySelectorAll('#timer-modal .timer-stijl-knop').forEach((knop) => {
    knop.addEventListener('click', () => {
      document.querySelectorAll('#timer-modal .timer-stijl-knop').forEach((k) => k.classList.remove('actief'));
      knop.classList.add('actief');
    });
  });

  document.getElementById('timer-annuleer').addEventListener('click', () => {
    modal.classList.add('verborgen');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('verborgen');
  });

  document.getElementById('timer-ok').addEventListener('click', () => {
    const vakId = modal.dataset.timerId;
    const vak = document.getElementById(vakId);
    if (!vak) { modal.classList.add('verborgen'); return; }

    const minuten = Math.max(0, Math.min(120, parseInt(document.getElementById('timer-minuten').value) || 0));
    const seconden = Math.max(0, Math.min(59, parseInt(document.getElementById('timer-seconden').value) || 0));
    if (minuten === 0 && seconden === 0) { alert('Geef minstens 1 seconde in.'); return; }

    const stijlKnop = document.querySelector('#timer-modal .timer-stijl-knop.actief');
    const stijl = stijlKnop ? stijlKnop.dataset.stijl : 'cijfers';

    vak.dataset.minuten = minuten;
    vak.dataset.seconden = seconden;

    // Stijl en visueel opnieuw renderen
    const visueel = vak.querySelector('.timer-visueel');
    if (visueel) {
      visueel.dataset.stijl = stijl;
      visueel.innerHTML = _maakTimerVisueelHTML(stijl);
    }

    // Reset met nieuwe waardes
    const status = _actieveTimers.get(vak.id);
    const totaleMs = minuten * 60000 + seconden * 1000;
    if (status) {
      if (status.isLopend) {
        clearInterval(status.intervalId);
        status.isLopend = false;
      }
      status.totaal = totaleMs;
      status.resterend = totaleMs;
      vak.querySelector('.timer-start').textContent = '▶';
    }
    vak.classList.remove('tijd-om');
    _toonResterendeTijd(vak);
    _updateVisueel(vak, 1.0);

    modal.classList.add('verborgen');
  });
}

// Aangeroepen vanuit vakken.js wanneer een timer-vak verwijderd wordt
function _stopTimer(vakId) {
  const status = _actieveTimers.get(vakId);
  if (status && status.intervalId) {
    clearInterval(status.intervalId);
  }
  _actieveTimers.delete(vakId);
}
