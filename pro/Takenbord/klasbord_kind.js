// ===== KLASBORD KINDMODUS =====

// Haal bord op via URL
const params = new URLSearchParams(window.location.search);
const bordId = params.get('bordid');
const type = params.get('type') || 'klasbord';

// Zelfde STORAGE_KEY logica als hoofdversie
const STORAGE_KEY = (function(){
  if(bordId){
    try {
      const all = JSON.parse(localStorage.getItem('borden_v1')||'{}');
      const lijst = all[type] || [];
      const bord = lijst.find(b => b.id === bordId);
      if(bord && bord.storageKey) return bord.storageKey;
    } catch{}
    return 'klas_'+bordId;
  }
  return 'klas_test';
})();

// Basis state
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

// Helpers
function esc(s){
  return String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

function displayName(p){
  return p.voornaam + (p.achternaam ? ' '+p.achternaam : '');
}

function allBaseTasks(){
  return [...(state.customTasks||[])];
}

function classActiveTasks(){
  return allBaseTasks().filter(t => state.activeTasks.includes(t.id));
}

function pupilTasks(pid){
  const ov = state.pupilTaskOverrides[pid] || {};
  const removed = ov.removed || [];
  const extra = ov.extra || [];

  return [
    ...classActiveTasks().filter(t => !removed.includes(t.id)),
    ...extra
  ];
}

function getStatus(pid,tid){
  return (state.progress[pid]?.[tid]?.status)||0;
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){}

  if(window.fbSave){
    window.fbSave(STORAGE_KEY, state).catch(console.warn);
  }
}

function loadState(){
  try{
    const r = localStorage.getItem(STORAGE_KEY);
    if(r) state = {...state, ...JSON.parse(r)};
  }catch(e){}

  if(window.fbLoad){
    window.fbLoad(STORAGE_KEY).then(data=>{
      if(data){
        state = {...state, ...data};
        renderBoard();
      }
    });
  }
}

// ===== STATUS =====
function cycleStatus(pid,tid){
  if(!state.progress[pid]) state.progress[pid] = {};
  if(!state.progress[pid][tid]) state.progress[pid][tid] = {status:0};

  const cur = state.progress[pid][tid].status;
  const next = (cur+1)%3;

  state.progress[pid][tid].status = next;

  saveState();
  renderBoard();
}

// ===== RENDER =====
function renderBoard(){
  const container = document.getElementById('pupil-rows');
  if(!container) return;

  container.innerHTML = '';

  const tasks = [];
  state.pupils.forEach(p=>{
    pupilTasks(p.id).forEach(t=>{
      if(!tasks.find(x=>x.id===t.id)) tasks.push(t);
    });
  });

  state.pupils.forEach(p=>{
    const row = document.createElement('div');
    row.style.marginBottom = '12px';

    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.textContent = displayName(p);
    row.appendChild(title);

    const taskWrap = document.createElement('div');
    taskWrap.style.display = 'flex';
    taskWrap.style.flexWrap = 'wrap';
    taskWrap.style.gap = '6px';

    tasks.forEach(t=>{
      const btn = document.createElement('button');
      const status = getStatus(p.id,t.id);

      btn.textContent = status===2 ? '✓' : status===1 ? '🔄' : '';
      btn.style.width = '50px';
      btn.style.height = '50px';
      btn.style.borderRadius = '8px';
      btn.style.border = '1px solid #ccc';

      btn.onclick = ()=>cycleStatus(p.id,t.id);

      taskWrap.appendChild(btn);
    });

    row.appendChild(taskWrap);
    container.appendChild(row);
  });
}

// ===== AFSLUITEN =====
function closeBoard(){
  document.body.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      height:100vh;
      font-family:sans-serif;
    ">
      <div style="font-size:40px;">✅</div>
      <div>Klaar voor vandaag</div>
      <div style="font-size:12px;margin-top:8px;">Scan opnieuw om verder te werken</div>
    </div>
  `;
}

// ===== INIT =====
window.addEventListener('load', ()=>{
  loadState();
  setTimeout(renderBoard,300);

  const btn = document.getElementById('exit-btn');
  if(btn){
    btn.onclick = closeBoard;
  }
});