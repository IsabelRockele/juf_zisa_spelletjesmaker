// ===== KLASBORD KINDMODUS =====

// ── URL-parameters ────────────────────────────────────────────────────────
const params  = new URLSearchParams(window.location.search);
const bordId  = params.get('bordid');
const type    = params.get('type') || 'klasbord';

// STORAGE_KEY: op de iPad staat geen borden_v1, dus altijd 'klas_' + bordId
// (Dat is exact dezelfde sleutel als de leerkrachtversie gebruikt wanneer
//  het bord aangemaakt wordt via welkomstbord.html.)
const STORAGE_KEY = bordId ? ('klas_' + bordId) : 'klas_test';

// ── State ─────────────────────────────────────────────────────────────────
let state = {
  pupils: [],
  activeTasks: [],
  progress: {},
  customTasks: [],
  pupilTaskOverrides: {},
  notes: {},
  customIcons: {},
  pupilPhotos: {},
  taskLabelOverrides: {}
};

// ── Helpers ───────────────────────────────────────────────────────────────
function esc(s){
  return String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function displayName(p){
  return p.voornaam + (p.achternaam ? ' '+p.achternaam : '');
}

const DEFAULT_TASKS = [
  {id:'lezen',label:'Lezen',icon:'📖'},
  {id:'rekenen',label:'Rekenen',icon:'🔢'},
  {id:'schrijven',label:'Schrijven',icon:'✏️'},
  {id:'spelling',label:'Spelling',icon:'🔤'},
  {id:'tekenen',label:'Tekenen',icon:'🎨'},
  {id:'computer',label:'Computer',icon:'💻'},
  {id:'knippen',label:'Knippen',icon:'✂️'},
  {id:'muziek',label:'Muziek',icon:'🎵'},
  {id:'werkblad',label:'Werkblad',icon:'📄'},
  {id:'project',label:'Project',icon:'🗂️'},
  {id:'werkboek',label:'Werkboek',icon:'📒'},
  {id:'meetkunde',label:'Meetkunde',icon:'📐'},
  {id:'winkeltje',label:'Winkeltje',icon:'🛒'},
  {id:'getallen',label:'Getallen',icon:'🔣'},
  {id:'metendrekenen',label:'Metend rekenen',icon:'📏'}
];

function allBaseTasks(){
  const ov = state.taskLabelOverrides || {};
  return [
    ...DEFAULT_TASKS.map(t => ov[t.id] ? {...t, label:ov[t.id]} : t),
    ...(state.customTasks || [])
  ];
}

function classActiveTasks(){
  return allBaseTasks().filter(t => (state.activeTasks||[]).includes(t.id));
}

function pupilTasks(pid){
  const ov = state.pupilTaskOverrides[pid] || {};
  return [
    ...classActiveTasks().filter(t => !(ov.removed||[]).includes(t.id)),
    ...(ov.extra||[])
  ];
}

function buildAllTasksForBoard(){
  // Verzamel alle unieke taken die op het bord voorkomen (union over alle leerlingen)
  const seen = new Set(), tasks = [];
  (state.pupils||[]).forEach(p => {
    pupilTasks(p.id).forEach(t => {
      if (!seen.has(t.id)){ seen.add(t.id); tasks.push(t); }
    });
  });
  return tasks;
}

function getStatus(pid,tid){
  return (state.progress[pid]?.[tid]?.status) || 0;
}

function getSmiley(pid,tid){
  return (state.progress[pid]?.[tid]?.smiley) || 0;
}

// ── Opslaan / laden ───────────────────────────────────────────────────────
function saveState(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
  if(window.fbSaveShared){
    window.fbSaveShared(STORAGE_KEY, state).catch(console.warn);
  }
}

function applyData(data){
  if(!data) return;
  state = Object.assign({}, state, data);
  // Zorg voor correcte types
  if(!state.progress || typeof state.progress !== 'object') state.progress = {};
  if(!state.pupils || !Array.isArray(state.pupils)) state.pupils = [];
  if(!state.activeTasks || !Array.isArray(state.activeTasks)) state.activeTasks = [];
  if(!state.customTasks || !Array.isArray(state.customTasks)) state.customTasks = [];
  if(!state.pupilTaskOverrides || typeof state.pupilTaskOverrides !== 'object') state.pupilTaskOverrides = {};
  if(!state.taskLabelOverrides || typeof state.taskLabelOverrides !== 'object') state.taskLabelOverrides = {};
  if(!state.customIcons || typeof state.customIcons !== 'object') state.customIcons = {};
}

function loadState(){
  // 1. Lokale opslag (snel, geen netwerk nodig)
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if(r){ applyData(JSON.parse(r)); }
  } catch(e){}

  // 2. Firebase Shared: wacht op auth-ready, laad dan opnieuw
  //    (fbOnReady wacht tot anoniem aanmelden klaar is)
  if(window.fbOnReady){
    window.fbOnReady(function(){
      if(window.fbLoadShared){
        window.fbLoadShared(STORAGE_KEY).then(function(data){
          if(data){
            applyData(data);
            // Cache lokaal zodat volgende keer sneller laadt
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
          }
          renderBoard();
          showKindApp();
        }).catch(function(e){
          console.warn('fbLoadShared fout:', e);
          renderBoard();
          showKindApp();
        });
      } else {
        renderBoard();
        showKindApp();
      }
    });
  } else {
    // Geen Firebase beschikbaar → gewoon lokale data gebruiken
    setTimeout(function(){
      renderBoard();
      showKindApp();
    }, 200);
  }
}

// ── Smiley popup ──────────────────────────────────────────────────────────
let _smileyPid = null, _smileyTid = null;

function openSmileyPopup(pid, tid){
  _smileyPid = pid; _smileyTid = tid;
  const popup = document.getElementById('smiley-popup');
  if(!popup) return;
  document.getElementById('sp-title').textContent = 'Hoe ging het?';
  // Positie: midden-scherm
  popup.style.left = '50%';
  popup.style.top  = '50%';
  popup.style.transform = 'translate(-50%,-50%)';
  popup.classList.remove('hidden');
  popup.style.display = 'block';
}

window.setSmiley = function(v){
  if(!_smileyPid || !_smileyTid) return;
  if(!state.progress[_smileyPid]) state.progress[_smileyPid] = {};
  if(!state.progress[_smileyPid][_smileyTid]) state.progress[_smileyPid][_smileyTid] = {status:0};
  state.progress[_smileyPid][_smileyTid].smiley = v;
  saveState();
  closeSmileyPopup();
  renderBoard();
};

window.closeSmileyPopup = function(){
  const popup = document.getElementById('smiley-popup');
  if(popup){ popup.classList.add('hidden'); popup.style.display = 'none'; }
  _smileyPid = null; _smileyTid = null;
};

// ── Status wisselen ───────────────────────────────────────────────────────
window.cycleStatus = function(pid, tid){
  if(!state.progress[pid]) state.progress[pid] = {};
  if(!state.progress[pid][tid]) state.progress[pid][tid] = {status:0, smiley:0};

  const cur  = state.progress[pid][tid].status || 0;
  const next = (cur + 1) % 3;
  state.progress[pid][tid].status = next;
  saveState();
  renderBoard();

  // Na afvinken (status 2 = klaar) → smiley vragen
  if(next === 2){ openSmileyPopup(pid, tid); }
};

// ── Renderen ─────────────────────────────────────────────────────────────
const SMILEYS = ['','😊','🙂','😐','😟'];

function renderBoard(){
  const hasPupils = (state.pupils||[]).length > 0;
  const allTasks  = buildAllTasksForBoard();
  const hasTasks  = allTasks.length > 0;
  const show      = hasPupils && hasTasks;

  document.getElementById('empty-state').classList.toggle('hidden', show);
  document.getElementById('board-inner').classList.toggle('hidden', !show);
  document.getElementById('task-header').classList.toggle('hidden', !show);
  document.getElementById('legend').classList.toggle('hidden', !show);

  if(!show){
    document.getElementById('empty-text').textContent =
      !hasPupils ? 'Geen leerlingen gevonden voor dit bord'
                 : 'Geen taken ingesteld op dit bord';
    updateProgress(0, 0);
    return;
  }

  // top-fixed sync: horizontaal scrollen mee
  const bs = document.getElementById('board-scroll');
  const tf = document.getElementById('top-fixed');
  if(bs && tf && !bs._syncBound){
    bs._syncBound = true;
    bs.addEventListener('scroll', () => { tf.scrollLeft = bs.scrollLeft; }, {passive:true});
  }

  // Minimale breedte: header/legend krijgen padding mee, rijen niet
  const COL_NAME = 220, COL_TASK = 120, PAD = 14;
  const minW = COL_NAME + allTasks.length * COL_TASK;
  const minWFixed = (minW + PAD * 2) + 'px';
  document.getElementById('board-inner').style.minWidth = minW + 'px';
  document.getElementById('pupil-rows').style.minWidth = minW + 'px';
  document.getElementById('task-header').style.minWidth = minWFixed;
  document.getElementById('legend').style.minWidth = minWFixed;

  renderTaskHeader(allTasks);
  renderPupilRows(allTasks);
  updateProgressFromState();
  updateScrollArrow();
}

function renderTaskHeader(tasks){
  const h = document.getElementById('task-header');
  // Verwijder enkel de taakkolommen, niet de header-corner
  h.querySelectorAll('.task-header-cell').forEach(e => e.remove());

  tasks.forEach(t => {
    const ci = state.customIcons && state.customIcons[t.id];
    const cell = document.createElement('div');
    cell.className = 'task-header-cell';
    if(ci){
      cell.innerHTML = `<div class="t-icon-custom" style="background-image:url(${ci})"></div>
                        <span class="t-label">${esc(t.label)}</span>`;
    } else {
      cell.innerHTML = `<span class="t-icon">${t.icon}</span>
                        <span class="t-label">${esc(t.label)}</span>`;
    }
    h.appendChild(cell);
  });
}

function renderPupilRows(allTasks){
  const container = document.getElementById('pupil-rows');
  container.innerHTML = '';

  let totalDone = 0, totalAll = 0;

  state.pupils.forEach(pupil => {
    const pid   = pupil.id;
    const myIds = new Set(pupilTasks(pid).map(t => t.id));

    let done = 0, total = 0;
    allTasks.forEach(t => {
      if(myIds.has(t.id)){
        total++;
        if(getStatus(pid, t.id) === 2) done++;
      }
    });
    totalDone += done; totalAll += total;
    const complete = total > 0 && done === total;

    // Foto
    const photo = state.pupilPhotos && state.pupilPhotos[pid];
    const photoHtml = photo
      ? `<img class="pupil-board-photo" src="${photo}" alt="${esc(displayName(pupil))}" />`
      : '';

    // Rij
    const row = document.createElement('div');
    row.className = 'pupil-board-row' + (complete ? ' complete' : '');

    // Naam-cel (sticky left)
    const nameCell = document.createElement('div');
    nameCell.className = 'pupil-name-cell' + (complete ? '' : '');
    nameCell.innerHTML =
      `<div class="pupil-dot ${complete ? 'done' : ''}"></div>`
      + photoHtml
      + `<div class="pupil-info">
           <div class="pupil-name">${esc(displayName(pupil))}</div>
           <div class="pupil-sub">${done}/${total}</div>
         </div>`;
    row.appendChild(nameCell);

    // Taak-cellen
    allTasks.forEach(t => {
      const cell = document.createElement('div');
      cell.className = 'task-cell';

      if(!myIds.has(t.id)){
        // Taak niet actief voor deze leerling: lege placeholder
        cell.innerHTML = '<div class="task-ph">—</div>';
      } else {
        const s      = getStatus(pid, t.id);
        const sm     = getSmiley(pid, t.id);
        const smHtml = sm ? `<div style="font-size:16px;margin-top:2px;">${SMILEYS[sm]}</div>` : '';

        const btn = document.createElement('button');
        btn.className = 'task-btn' + (s === 1 ? ' status-1' : s === 2 ? ' status-2' : '');
        btn.title = s === 0 ? 'Nog te doen' : s === 1 ? 'Bezig' : 'Klaar';
        btn.textContent = s === 2 ? '✓' : s === 1 ? '🔄' : '';
        btn.addEventListener('click', function(){ cycleStatus(pid, t.id); });

        cell.appendChild(btn);
        if(smHtml){
          const smDiv = document.createElement('div');
          smDiv.innerHTML = smHtml;
          cell.appendChild(smDiv.firstChild);
        }
      }
      row.appendChild(cell);
    });

    container.appendChild(row);
  });

  updateProgress(totalDone, totalAll);
}

function updateProgressFromState(){
  let done = 0, total = 0;
  const allTasks = buildAllTasksForBoard();
  state.pupils.forEach(p => {
    const myIds = new Set(pupilTasks(p.id).map(t => t.id));
    allTasks.forEach(t => {
      if(myIds.has(t.id)){ total++; if(getStatus(p.id,t.id)===2) done++; }
    });
  });
  updateProgress(done, total);
}

function updateProgress(done, total){
  const pct = total > 0 ? Math.round(done/total*100) : 0;
  const txt = `${done}/${total} klaar`;
  const el1 = document.getElementById('board-progress-text');
  const el2 = document.getElementById('board-progress-text-inline');
  const fill = document.getElementById('progress-fill');
  const lbl  = document.getElementById('progress-label');
  if(el1) el1.textContent = txt;
  if(el2) el2.textContent = txt;
  if(fill) fill.style.width = pct + '%';
  if(lbl)  lbl.textContent = txt;
}

// ── Scroll-pijlen (kindmodus) ─────────────────────────────────────────────
function updateScrollArrow(){
  const scroll  = document.getElementById('board-scroll');
  const arRight = document.getElementById('scroll-right-arrow');
  const arLeft  = document.getElementById('scroll-left-arrow');
  if(!scroll) return;

  function check(){
    const canRight = scroll.scrollWidth > scroll.clientWidth + 4
                  && scroll.scrollLeft + scroll.clientWidth < scroll.scrollWidth - 4;
    const canLeft  = scroll.scrollLeft > 4;
    if(arRight) arRight.classList.toggle('hidden', !canRight);
    if(arLeft)  arLeft.classList.toggle('hidden',  !canLeft);
  }

  check();
  requestAnimationFrame(check);
  setTimeout(check, 150);
  setTimeout(check, 500);
  setTimeout(check, 1200);

  if(!scroll._arrowBound){
    scroll._arrowBound = true;
    scroll.addEventListener('scroll', check, {passive:true});
    window.addEventListener('resize', check);
  }
}

window.scrollRight = function(){
  const scroll = document.getElementById('board-scroll');
  if(scroll) scroll.scrollBy({ left: 240, behavior:'smooth' });
};

window.scrollLeft = function(){
  const scroll = document.getElementById('board-scroll');
  if(scroll) scroll.scrollBy({ left: -240, behavior:'smooth' });
};

// Swipe links/rechts op touch-apparaten
(function(){
  let startX = 0, startY = 0;
  const el = document.getElementById('board-scroll') || document.body;
  document.addEventListener('touchstart', function(e){
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    // Alleen horizontale swipe (meer horizontaal dan verticaal)
    if(Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    const scroll = document.getElementById('board-scroll');
    if(scroll) scroll.scrollBy({left: dx < 0 ? 240 : -240, behavior:'smooth'});
  }, {passive:true});
})();

// ── Afsluiten ─────────────────────────────────────────────────────────────
window.closeKindScreen = function(){
  document.getElementById('wrap').style.display = 'none';
  document.getElementById('closed-screen').classList.add('show');
};

// ── Opstarten ─────────────────────────────────────────────────────────────
function showKindApp(){
  const loading = document.getElementById('loading');
  const wrap    = document.getElementById('wrap');
  if(loading) loading.style.display = 'none';
  if(wrap)    wrap.style.display = 'flex';
}

window.addEventListener('load', function(){
  // Bord-naam tonen (als die in de URL zit als 'naam' param)
  const naam = params.get('naam');
  if(naam){
    const el = document.getElementById('board-naam-label');
    if(el) el.textContent = decodeURIComponent(naam);
  }

  loadState();
  // showKindApp() wordt aangeroepen vanuit loadState() na Firebase-respons
});