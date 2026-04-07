
const STORAGE_KEY = 'taakbord_test_v4';
const SMILEYS = ['','😊','🙂','😐','😟'];
const SMILEY_LABELS = ['','Super!','Ging goed','Beetje moeilijk','Te moeilijk'];

const DEFAULT_TASKS = [
  {id:'lezen',label:'Lezen',icon:'📖'},{id:'rekenen',label:'Rekenen',icon:'🔢'},
  {id:'schrijven',label:'Schrijven',icon:'✏️'},{id:'spelling',label:'Spelling',icon:'🔤'},
  {id:'tekenen',label:'Tekenen',icon:'🎨'},{id:'computer',label:'Computer',icon:'💻'},
  {id:'knippen',label:'Knippen',icon:'✂️'},{id:'muziek',label:'Muziek',icon:'🎵'},
  {id:'werkblad',label:'Werkblad',icon:'📄'},{id:'project',label:'Project',icon:'🗂️'},
  {id:'werkboek',label:'Werkboek',icon:'📒'},{id:'meetkunde',label:'Meetkunde',icon:'📐'},
  {id:'winkeltje',label:'Winkeltje',icon:'🛒'},{id:'getallen',label:'Getallen',icon:'🔣'},
  {id:'metendrekenen',label:'Metend rekenen',icon:'📏'},
];
const EMOJIS = [
  '📖','🔢','✏️','🔤','🎨','💻','✂️','🎵','📄','🗂️','📒','📐','🛒','🔣','📏',
  '⭐','🏆','🎯','🔬','📚','🌍','🎭','🏃','🍎','🧩','🎲','🖍️','🌱','💡','🧪','🎸','⚽','🏊','🌈','🖊️','📝','🗒️','🔍','💬','🎓',
];

// STATE
// progress: { pupilId: { taskId: { status:0-2, smiley:0-4 } } }
// notes: { pupilId: string }
// customIcons: { taskId: dataURL } – eigen afbeelding per taak
// pupilPhotos: { pupilId: dataURL } – foto/afbeelding per leerling
let state = { pupils:[], activeTasks:[], progress:{}, customTasks:[], pupilTaskOverrides:{}, notes:{}, showNumbers:false, showLastname:false, showSmileys:false, customIcons:{}, pupilPhotos:{}, taskLabelOverrides:{}, boardSize:"normal" };
let currentMode='board', currentTab='leerlingen';
let selectedEmoji='⭐', ptSelectedEmoji='⭐';
let editingId=null, editingPupilTasksId=null, editingNotesId=null;
let dragSrc=null, bulkOrder='voornaam';

// Smiley popup state
let pendingSmileyPid=null, pendingSmileyTid=null;

function loadState(){
  try{
    const r=localStorage.getItem(STORAGE_KEY);
    if(r){
      const s=JSON.parse(r);
      if(s.pupils&&s.pupils.length&&typeof s.pupils[0]==='string') s.pupils=s.pupils.map(n=>{const p=n.trim().split(' ');return{id:uid(),voornaam:p[0],achternaam:p.slice(1).join(' ')};});
      // migrate old progress format {taskId:0-2} to {taskId:{status,smiley}}
      if(s.progress){
        Object.keys(s.progress).forEach(pid=>{
          const pr=s.progress[pid];
          Object.keys(pr).forEach(tid=>{
            if(typeof pr[tid]==='number') pr[tid]={status:pr[tid],smiley:0};
          });
        });
      }
      state={...state,...s};
      // Zorg dat deze velden altijd objecten zijn, ook bij oudere opgeslagen data
      if(!state.customIcons||typeof state.customIcons!=='object') state.customIcons={};
      if(!state.pupilPhotos||typeof state.pupilPhotos!=='object') state.pupilPhotos={};
      if(!state.taskLabelOverrides||typeof state.taskLabelOverrides!=='object') state.taskLabelOverrides={};
      if(!state.boardSize) state.boardSize='normal';
      if(!state.taskLabelOverrides||typeof state.taskLabelOverrides!=='object') state.taskLabelOverrides={};
    }
  }catch(e){}
}
function saveState(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){} }
function uid(){ return '_'+Math.random().toString(36).slice(2)+Date.now(); }

// TASK HELPERS
function allBaseTasks(){
  const overrides=state.taskLabelOverrides||{};
  const defaults=DEFAULT_TASKS.map(t=>overrides[t.id]?{...t,label:overrides[t.id]}:t);
  return [...defaults,...state.customTasks];
}
function classActiveTasks(){ return allBaseTasks().filter(t=>state.activeTasks.includes(t.id)); }
function pupilTasks(pid){
  const ov=state.pupilTaskOverrides[pid]||{};
  const removed=ov.removed||[], extra=ov.extra||[];
  return [...classActiveTasks().filter(t=>!removed.includes(t.id)),...extra];
}
function getEntry(pid,tid){ return(state.progress[pid]||{})[tid]||{status:0,smiley:0}; }
function getStatus(pid,tid){ return getEntry(pid,tid).status; }
function getSmiley(pid,tid){ return getEntry(pid,tid).smiley; }
function isPupilComplete(pid){ const t=pupilTasks(pid); if(!t.length) return false; return t.every(x=>getStatus(pid,x.id)===2); }
function pupilStats(pid){
  const t=pupilTasks(pid),pr=state.progress[pid]||{};
  return{done:t.filter(x=>(pr[x.id]?.status||0)===2).length,busy:t.filter(x=>(pr[x.id]?.status||0)===1).length,total:t.length};
}
function hasOverrides(pid){ const ov=state.pupilTaskOverrides[pid]||{}; return(ov.removed?.length||0)+(ov.extra?.length||0)>0; }

// Undo state
let lastAction = null;

function cycleStatus(pid,tid){
  if(!state.progress[pid]) state.progress[pid]={};
  if(!state.progress[pid][tid]) state.progress[pid][tid]={status:0,smiley:0};
  const cur=state.progress[pid][tid].status;
  const next=(cur+1)%3;
  // Bewaar voor undo
  lastAction = { type:'status', pid, tid, prevStatus: cur, prevSmiley: state.progress[pid][tid].smiley||0 };
  state.progress[pid][tid].status=next;
  const tasks=pupilTasks(pid);
  const wasDone=tasks.every(t=>t.id===tid?cur===2:getStatus(pid,t.id)===2);
  if(isPupilComplete(pid)&&!wasDone){ const p=state.pupils.find(x=>x.id===pid); if(p) setTimeout(()=>showCelebration(displayName(p)),80); }
  saveState(); renderBoard();
  showUndoBtn();
  if(next===2){ openSmileyPopup(pid,tid); }
}

function undoLastAction(){
  if(!lastAction) return;
  if(lastAction.type==='status'){
    const {pid,tid,prevStatus,prevSmiley}=lastAction;
    if(!state.progress[pid]) state.progress[pid]={};
    state.progress[pid][tid]={status:prevStatus,smiley:prevSmiley};
    saveState(); renderBoard();
  }
  lastAction=null;
  hideUndoBtn();
}

function showUndoBtn(){
  const btn=document.getElementById('btn-undo');
  if(btn) btn.classList.remove('hidden');
  // Auto-verberg na 8 seconden
  clearTimeout(window._undoTimer);
  window._undoTimer=setTimeout(()=>{ hideUndoBtn(); lastAction=null; },8000);
}
function hideUndoBtn(){
  const btn=document.getElementById('btn-undo');
  if(btn) btn.classList.add('hidden');
}

function setSmiley(val){
  if(pendingSmileyPid&&pendingSmileyTid){
    if(!state.progress[pendingSmileyPid]) state.progress[pendingSmileyPid]={};
    if(!state.progress[pendingSmileyPid][pendingSmileyTid]) state.progress[pendingSmileyPid][pendingSmileyTid]={status:2,smiley:0};
    state.progress[pendingSmileyPid][pendingSmileyTid].smiley=val;
    saveState(); renderBoard();
  }
  closeSmileyPopup();
}

function openSmileyPopup(pid,tid){
  pendingSmileyPid=pid; pendingSmileyTid=tid;
  const p=state.pupils.find(x=>x.id===pid);
  const t=pupilTasks(pid).find(x=>x.id===tid);
  if(p&&t) document.getElementById('sp-title').textContent=`${displayName(p)}: ${t.icon} ${t.label}`;
  const pop=document.getElementById('smiley-popup');
  pop.classList.remove('hidden');
  // Center popup
  pop.style.top='50%'; pop.style.left='50%';
  pop.style.transform='translate(-50%,-50%)';
}
function closeSmileyPopup(){ document.getElementById('smiley-popup').classList.add('hidden'); pendingSmileyPid=null; pendingSmileyTid=null; }

function resetAll(){ state.progress={}; saveState(); renderBoard(); }

// NAME HELPERS
function displayName(p){ if(state.showLastname&&p.achternaam) return p.voornaam+' '+p.achternaam; return p.voornaam; }
function sortKey(p){ const a=p.achternaam?p.achternaam.toLowerCase():''; return a?a+' '+p.voornaam.toLowerCase():p.voornaam.toLowerCase(); }

// PUPILS
function parseName(str){
  const parts=str.trim().split(/\s+/); if(!parts[0]) return null;
  if(parts.length===1) return{voornaam:parts[0],achternaam:''};
  if(bulkOrder==='achternaam') return{voornaam:parts[parts.length-1],achternaam:parts.slice(0,parts.length-1).join(' ')};
  return{voornaam:parts[0],achternaam:parts.slice(1).join(' ')};
}
function setOrder(o){ bulkOrder=o; document.getElementById('order-btn-voor').classList.toggle('active',o==='voornaam'); document.getElementById('order-btn-ach').classList.toggle('active',o==='achternaam'); }

function addPupil(){
  const v=document.getElementById('input-voornaam').value.trim(),a=document.getElementById('input-achternaam').value.trim();
  if(!v){document.getElementById('input-voornaam').focus();return;}
  if(state.pupils.some(p=>p.voornaam.toLowerCase()===v.toLowerCase()&&(p.achternaam||'').toLowerCase()===a.toLowerCase())){alert(`"${v}${a?' '+a:''}" staat al in de lijst.`);return;}
  state.pupils.push({id:uid(),voornaam:v,achternaam:a});
  document.getElementById('input-voornaam').value=''; document.getElementById('input-achternaam').value='';
  document.getElementById('input-voornaam').focus();
  saveState(); renderPupilList(); renderBoard();
}
function bulkAdd(){
  const lines=document.getElementById('bulk-input').value.split('\n').map(s=>s.trim()).filter(Boolean);
  let added=0;
  lines.forEach(line=>{const parsed=parseName(line);if(!parsed)return;if(!state.pupils.some(p=>p.voornaam.toLowerCase()===parsed.voornaam.toLowerCase()&&(p.achternaam||'').toLowerCase()===parsed.achternaam.toLowerCase())){state.pupils.push({id:uid(),...parsed});added++;}});
  document.getElementById('bulk-input').value='';
  if(!added){alert('Geen nieuwe namen gevonden.');return;}
  saveState(); renderPupilList(); renderBoard();
}
function bulkReplace(){
  const lines=document.getElementById('bulk-input').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const parsed=lines.map(parseName).filter(Boolean); if(!parsed.length) return;
  confirmAction('custom',`${state.pupils.length} leerlingen vervangen door ${parsed.length} nieuwe namen?`,()=>{
    const newPupils=parsed.map(p=>({id:uid(),...p})),newProg={},newOv={},newNotes={};
    newPupils.forEach(np=>{const old=state.pupils.find(op=>op.voornaam.toLowerCase()===np.voornaam.toLowerCase()&&(op.achternaam||'').toLowerCase()===np.achternaam.toLowerCase());if(old){if(state.progress[old.id])newProg[np.id]=state.progress[old.id];if(state.pupilTaskOverrides[old.id])newOv[np.id]=state.pupilTaskOverrides[old.id];if(state.notes[old.id])newNotes[np.id]=state.notes[old.id];}});
    state.pupils=newPupils;state.progress=newProg;state.pupilTaskOverrides=newOv;state.notes=newNotes;
    document.getElementById('bulk-input').value='';
    saveState(); renderPupilList(); renderBoard();
  });
}
function removePupil(id){ state.pupils=state.pupils.filter(p=>p.id!==id);delete state.progress[id];delete state.pupilTaskOverrides[id];delete state.notes[id];saveState();renderPupilList();renderBoard(); }
function sortAlpha(){ state.pupils.sort((a,b)=>sortKey(a).localeCompare(sortKey(b),'nl'));saveState();renderPupilList();renderBoard(); }
function toggleNumbers(){ state.showNumbers=document.getElementById('toggle-numbers').checked;saveState();renderPupilList();renderBoard(); }
function toggleLastname(){ state.showLastname=document.getElementById('toggle-lastname').checked;saveState();renderPupilList();renderBoard(); }
function toggleSmileys(){ state.showSmileys=document.getElementById('toggle-smileys').checked;saveState();renderBoard(); }
function insertAfter(idx){ const v=(prompt('Voornaam:')||'').trim();if(!v)return;const a=(prompt('Achternaam (leeg = geen):')||'').trim();if(state.pupils.some(p=>p.voornaam.toLowerCase()===v.toLowerCase()&&(p.achternaam||'').toLowerCase()===a.toLowerCase())){alert('Naam bestaat al.');return;}state.pupils.splice(idx+1,0,{id:uid(),voornaam:v,achternaam:a});saveState();renderPupilList();renderBoard(); }
function startEdit(id){ editingId=id;const p=state.pupils.find(x=>x.id===id);if(!p)return;document.getElementById('edit-voornaam').value=p.voornaam;document.getElementById('edit-achternaam').value=p.achternaam||'';document.getElementById('edit-overlay').classList.remove('hidden');setTimeout(()=>document.getElementById('edit-voornaam').select(),50); }
function saveEdit(){ const v=document.getElementById('edit-voornaam').value.trim(),a=document.getElementById('edit-achternaam').value.trim();if(!v){document.getElementById('edit-voornaam').focus();return;}const idx=state.pupils.findIndex(p=>p.id===editingId);if(idx>=0){state.pupils[idx].voornaam=v;state.pupils[idx].achternaam=a;}closeEdit();saveState();renderPupilList();renderBoard(); }
function closeEdit(){ document.getElementById('edit-overlay').classList.add('hidden');editingId=null; }

// NOTES
function openNotesModal(pid){ editingNotesId=pid;const p=state.pupils.find(x=>x.id===pid);if(!p)return;document.getElementById('notes-title').textContent=`🔒 Bevindingen: ${displayName(p)}`;document.getElementById('notes-input').value=state.notes[pid]||'';document.getElementById('notes-overlay').classList.remove('hidden');setTimeout(()=>document.getElementById('notes-input').focus(),50); }
function saveNotes(){ if(!editingNotesId)return;const val=document.getElementById('notes-input').value.trim();if(val) state.notes[editingNotesId]=val; else delete state.notes[editingNotesId];closeNotesModal();saveState();renderPupilList();renderBoard(); }
function closeNotesModal(){ document.getElementById('notes-overlay').classList.add('hidden');editingNotesId=null; }

// PER-PUPIL TASKS
function openPupilTasksModal(pid){ editingPupilTasksId=pid;const p=state.pupils.find(x=>x.id===pid);if(!p)return;document.getElementById('pt-title').textContent=`Taken voor ${displayName(p)}`;document.getElementById('pupil-tasks-overlay').classList.remove('hidden');renderPupilTasksModal(); }
function closePupilTasksModal(){ document.getElementById('pupil-tasks-overlay').classList.add('hidden');editingPupilTasksId=null;renderPupilList();renderBoard(); }
function renderPupilTasksModal(){
  const pid=editingPupilTasksId,ov=state.pupilTaskOverrides[pid]||{},removed=ov.removed||[],extra=ov.extra||[];
  document.getElementById('pt-class-chips').innerHTML=classActiveTasks().map(t=>{const r=removed.includes(t.id);return`<div class="task-chip ${r?'removed':'active'}" onclick="togglePupilClassTask('${pid}','${t.id}')">${t.icon} ${esc(t.label)}</div>`;}).join('');
  document.getElementById('pt-extra-chips').innerHTML=extra.length?extra.map(t=>`<div class="task-chip extra">${t.icon} ${esc(t.label)} <button class="remove-chip" onclick="removePupilExtraTask('${pid}','${t.id}')">✕</button></div>`).join(''):'<span style="font-size:12px;color:#a0aec0">Nog geen extra taken</span>';
  document.getElementById('pt-emoji-picker').innerHTML=EMOJIS.slice(0,20).map(e=>`<button class="emoji-btn ${e===ptSelectedEmoji?'selected':''}" onclick="setPtEmoji('${e}')">${e}</button>`).join('');
}
function setPtEmoji(e){ ptSelectedEmoji=e;renderPupilTasksModal(); }
function togglePupilClassTask(pid,tid){ if(!state.pupilTaskOverrides[pid])state.pupilTaskOverrides[pid]={};const ov=state.pupilTaskOverrides[pid];if(!ov.removed)ov.removed=[];if(ov.removed.includes(tid))ov.removed=ov.removed.filter(x=>x!==tid);else{ov.removed.push(tid);if(state.progress[pid])delete state.progress[pid][tid];}saveState();renderPupilTasksModal(); }
function addPupilTask(){ const label=document.getElementById('pt-task-input').value.trim();if(!label)return;if(!state.pupilTaskOverrides[editingPupilTasksId])state.pupilTaskOverrides[editingPupilTasksId]={};const ov=state.pupilTaskOverrides[editingPupilTasksId];if(!ov.extra)ov.extra=[];ov.extra.push({id:'pe_'+Date.now(),label,icon:ptSelectedEmoji});document.getElementById('pt-task-input').value='';saveState();renderPupilTasksModal(); }
function removePupilExtraTask(pid,tid){ const ov=state.pupilTaskOverrides[pid];if(!ov?.extra)return;ov.extra=ov.extra.filter(t=>t.id!==tid);if(state.progress[pid])delete state.progress[pid][tid];saveState();renderPupilTasksModal(); }

// TASKS
function toggleTask(id){ state.activeTasks=state.activeTasks.includes(id)?state.activeTasks.filter(t=>t!==id):[...state.activeTasks,id];saveState();renderTaskSettings();renderBoard(); }
function addCustomTask(){ const inp=document.getElementById('input-task'),label=inp.value.trim();if(!label)return;const id='c_'+Date.now();state.customTasks.push({id,label,icon:selectedEmoji});state.activeTasks.push(id);inp.value='';saveState();renderTaskSettings();renderBoard(); }
function removeCustomTask(id){ state.customTasks=state.customTasks.filter(t=>t.id!==id);state.activeTasks=state.activeTasks.filter(t=>t!==id);saveState();renderTaskSettings();renderBoard(); }

// Taaknaam hernoemen (werkt voor zowel standaard als eigen taken)
let renamingTaskId=null;
function openTaskRenameModal(taskId, currentLabel){
  renamingTaskId=taskId;
  document.getElementById('rename-task-input').value=currentLabel;
  document.getElementById('rename-task-overlay').classList.remove('hidden');
  setTimeout(()=>{ const inp=document.getElementById('rename-task-input'); inp.focus(); inp.select(); },50);
}
function saveTaskRename(){
  const newLabel=document.getElementById('rename-task-input').value.trim();
  if(!newLabel||!renamingTaskId) return;
  // Zoek in customTasks
  const ct=state.customTasks.find(t=>t.id===renamingTaskId);
  if(ct){ ct.label=newLabel; }
  else {
    // Standaard taak: sla de naam-override op
    if(!state.taskLabelOverrides) state.taskLabelOverrides={};
    state.taskLabelOverrides[renamingTaskId]=newLabel;
  }
  saveState();
  closeTaskRename();
  renderTaskSettings();
  renderBoard();
}
function closeTaskRename(){
  document.getElementById('rename-task-overlay').classList.add('hidden');
  renamingTaskId=null;
}

// EXPORT / IMPORT / KLASLIJST
function exportData(){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  a.download='klasbord-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
  // Sla tijdstip laatste backup op
  localStorage.setItem('last_export_'+STORAGE_KEY, Date.now());
  hideBackupReminder();
}
function importData(e){ const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(!d.pupils){alert('Ongeldig bestand.');return;}confirmAction('custom',`Bord vervangen door backup van ${f.name}?`,()=>{state={...state,...d};saveState();renderShell();});}catch{alert('Kon bestand niet lezen.');}};r.readAsText(f);e.target.value=''; }
function saveClassList(){ const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({pupils:state.pupils},null,2)],{type:'application/json'}));a.download='klaslijst-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href); }
let _loadNames=null;
function loadClassList(e){ const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result),names=d.pupils||d;if(!Array.isArray(names)){alert('Ongeldig bestand.');return;}_loadNames=names.map(n=>typeof n==='string'?{id:uid(),...parseName(n)}:n.id?n:{id:uid(),...n});confirmAction('classload',`${_loadNames.length} namen gevonden in ${f.name}.`);}catch{alert('Kon bestand niet lezen.');}};r.readAsText(f);e.target.value=''; }
function loadClassListAction(replace){ if(!_loadNames)return;if(replace){const np={},no={},nn={};_loadNames.forEach(n=>{const old=state.pupils.find(op=>op.voornaam.toLowerCase()===n.voornaam.toLowerCase()&&(op.achternaam||'').toLowerCase()===(n.achternaam||'').toLowerCase());if(old){if(state.progress[old.id])np[n.id]=state.progress[old.id];if(state.pupilTaskOverrides[old.id])no[n.id]=state.pupilTaskOverrides[old.id];if(state.notes[old.id])nn[n.id]=state.notes[old.id];}});state.pupils=_loadNames;state.progress=np;state.pupilTaskOverrides=no;state.notes=nn;}else{_loadNames.forEach(n=>{if(!state.pupils.some(p=>p.voornaam.toLowerCase()===n.voornaam.toLowerCase()&&(p.achternaam||'').toLowerCase()===(n.achternaam||'').toLowerCase()))state.pupils.push(n);});}saveState();renderPupilList();renderBoard();closeConfirm(); }

// PDF (print-based)
function openPdfModal(){ const today=new Date().toISOString().slice(0,10);if(!document.getElementById('pdf-date-from').value)document.getElementById('pdf-date-from').value=today;if(!document.getElementById('pdf-date-to').value)document.getElementById('pdf-date-to').value=today;document.getElementById('pdf-overlay').classList.remove('hidden'); }
function fmtDate(str){ if(!str)return'';try{return new Date(str).toLocaleDateString('nl-BE',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return str;} }

function generateAndPrint(mode){
  // mode: 'download' = echte PDF download via nieuw venster + auto-print-to-save
  //       'print'    = open venster voor afdrukken
  const periodName=document.getElementById('pdf-period-name').value.trim();
  const dateFrom=document.getElementById('pdf-date-from').value;
  const dateTo=document.getElementById('pdf-date-to').value;
  const pl=[periodName];
  if(dateFrom||dateTo) pl.push(fmtDate(dateFrom)+(dateTo&&dateTo!==dateFrom?' – '+fmtDate(dateTo):''));
  const periodLabel=pl.filter(Boolean).join('  ·  ');
  const today=fmtDate(new Date().toISOString().slice(0,10));
  const allTasks=buildAllTasksForBoard();
  const periodDiv=periodLabel?'<div class="pr-period">Periode: '+periodLabel+'</div>':'';

  // Overview rows
  let overviewRows='';
  state.pupils.forEach((p,i)=>{
    const pid=p.id,complete=isPupilComplete(pid);
    const myIds=new Set(pupilTasks(pid).map(t=>t.id));
    let cells='';
    allTasks.forEach(t=>{
      if(!myIds.has(t.id)){cells+='<td class="pr-status-na">—</td>';}
      else{
        const st=getStatus(pid,t.id),sm=getSmiley(pid,t.id);
        if(st===2) cells+='<td><span class="pr-status-done">&#x2713;</span>'+(sm?'<br><span style="font-size:13px">'+SMILEYS[sm]+'</span>':'')+'</td>';
        else if(st===1) cells+='<td><span class="pr-status-busy">Bezig</span></td>';
        else cells+='<td class="pr-status-empty">&#xB7;</td>';
      }
    });
    const num=state.showNumbers?(i+1)+'. ':'';
    overviewRows+='<tr class="'+(complete?'row-complete':'')+'"><td class="name-col">'+num+esc(displayName(p))+'</td>'+cells+'</tr>';
  });
  const taskHeaders=allTasks.map(t=>'<th><div style="font-size:16px">'+t.icon+'</div><div>'+esc(t.label)+'</div></th>').join('');

  // Detail pages
  let detailPages='';
  state.pupils.forEach(function(p){
    const pid=p.id,st2=pupilStats(pid),complete=isPupilComplete(pid);
    const done=st2.done,total=st2.total,tasks=pupilTasks(pid);
    const bc=complete?'badge-complete':done>0?'badge-partial':'badge-empty';
    const bt=complete?'Volledig klaar':done>0?done+' / '+total+' klaar':'Nog niet gestart';
    let rows='';
    tasks.forEach(function(t,i){
      const isX=!!(state.pupilTaskOverrides[pid]&&state.pupilTaskOverrides[pid].extra&&state.pupilTaskOverrides[pid].extra.find(function(x){return x.id===t.id;}));
      const s=getStatus(pid,t.id),sm=getSmiley(pid,t.id);
      const sh=s===2?'<span class="pr-status-done">&#x2713; Klaar</span>':s===1?'<span class="pr-status-busy">Bezig</span>':'<span style="color:#cbd5e0">Niet gestart</span>';
      const smh=sm?'<span class="pr-sc">'+SMILEYS[sm]+'</span><span class="pr-sl">'+SMILEY_LABELS[sm]+'</span>':'<span style="color:#cbd5e0">—</span>';
      const bg=isX?'#fffbeb':i%2?'#f8fafc':'#fff';
      rows+='<tr style="background:'+bg+'"><td><span class="pr-ti">'+t.icon+'</span>'+esc(t.label)+(isX?'<span class="pr-xs">&#x2605; extra</span>':'')+'</td><td>'+sh+'</td><td>'+smh+'</td></tr>';
    });
    const nn=state.notes[pid]?'<div class="pr-nb"><h4>Bevindingen leerkracht</h4><p>'+esc(state.notes[pid])+'</p></div>':'';
    const fn=esc(p.voornaam+(p.achternaam?' '+p.achternaam:''));
    detailPages+='<div class="pr-page pr-dp">'
      +'<div class="pr-ph"><h1>'+esc(displayName(p))+'</h1><span>Detailrapport</span></div>'
      +'<div class="pr-pb">'+periodDiv
      +'<div class="pr-dh"><span class="pr-dn">'+fn+'</span><span class="pr-db '+bc+'">'+bt+'</span></div>'
      +'<table class="pr-tt"><thead><tr><th style="width:40%">Taak</th><th style="width:25%">Status</th><th style="width:35%">Zelfbeoordeling</th></tr></thead><tbody>'+rows+'</tbody></table>'
      +nn+'</div></div>';
  });

  // Summary
  const incomplete=state.pupils.filter(function(p){return!isPupilComplete(p.id);});
  const complete2=state.pupils.filter(function(p){return isPupilComplete(p.id);});
  let si='',sc='';
  incomplete.forEach(function(p){
    const pr=state.progress[p.id]||{};
    const nd=pupilTasks(p.id).filter(function(t){return(pr[t.id]?pr[t.id].status||0:0)!==2;});
    si+='<div class="sc-card sc-inc"><div class="sc-n">'+esc(displayName(p))+'</div><div class="sc-o">'+nd.map(function(t){return t.icon+' '+t.label;}).join(' · ')+'</div></div>';
  });
  complete2.forEach(function(p){
    sc+='<div class="sc-card sc-ok"><div class="sc-n">&#x2713; '+esc(displayName(p))+'</div><div class="sc-d">Alle '+pupilTasks(p.id).length+' taken afgewerkt</div></div>';
  });

  const css='*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}'
    +'body{font-family:Nunito,sans-serif;background:#f8fafc;color:#1a202c;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
    +'#tb{position:fixed;top:0;left:0;right:0;z-index:100;background:#1e3a8a;color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.2);flex-wrap:wrap}'
    +'#tb h2{font-size:15px;font-weight:800}'
    +'.tbb{display:flex;gap:8px;align-items:center}'
    +'.tb1{padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;font-weight:700;font-size:13px;background:#22c55e;color:#fff}'
    +'.tb2{padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;font-weight:700;font-size:13px;background:rgba(255,255,255,.15);color:#fff}'
    +'.tbh{font-size:11px;opacity:.6;color:#fff}'
    +'#ct{margin-top:62px;padding:20px;max-width:1200px;margin-left:auto;margin-right:auto}'
    +'.pr-page{background:#fff;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.07);margin-bottom:24px;overflow:hidden}'
    +'.pr-ph{background:#1e3a8a;color:#fff;padding:12px 18px;display:flex;justify-content:space-between;align-items:center}'
    +'.pr-ph h1{font-size:16px;font-weight:800}'
    +'.pr-ph span{font-size:10px;opacity:.75}'
    +'.pr-pb{padding:18px}'
    +'.pr-period{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:7px 12px;margin-bottom:14px;font-size:11px;color:#1e40af;font-weight:700}'
    +'.pr-ss{margin-bottom:16px}'
    +'.pr-ss h2{font-size:13px;font-weight:800;margin-bottom:8px;padding-bottom:5px;border-bottom:2px solid}'
    +'.pr-ss h2.r{color:#dc2626;border-color:#fca5a5}'
    +'.pr-ss h2.g{color:#15803d;border-color:#86efac}'
    +'.sc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}'
    +'.sc-card{border:1px solid;border-radius:8px;padding:8px 12px}'
    +'.sc-inc{background:#fff5f5;border-color:#fca5a5}'
    +'.sc-ok{background:#f0fdf4;border-color:#86efac}'
    +'.sc-n{font-weight:800;font-size:13px;margin-bottom:3px}'
    +'.sc-o{color:#dc2626;font-size:11px;line-height:1.4}'
    +'.sc-d{color:#15803d;font-size:11px}'
    +'.pr-ot{width:100%;border-collapse:collapse;font-size:11px}'
    +'.pr-ot th{background:#1e3a8a;color:#fff;padding:8px 6px;text-align:center;font-size:10px;font-weight:800;border:1px solid #1e40af}'
    +'.pr-ot th.nc{text-align:left;min-width:120px}'
    +'.pr-ot td{padding:6px;border:1px solid #e2e8f0;text-align:center;vertical-align:middle}'
    +'.pr-ot td.nc{text-align:left;font-weight:700;font-size:12px}'
    +'.pr-ot tr:nth-child(even) td{background:#f8fafc}'
    +'.pr-ot tr.rc td{background:#f0fdf4!important}'
    +'.sd{background:#dcfce7;color:#15803d;border-radius:4px;padding:2px 6px;font-weight:800;font-size:10px;display:inline-block}'
    +'.sb{background:#fef9c3;color:#92400e;border-radius:4px;padding:2px 6px;font-weight:800;font-size:10px;display:inline-block}'
    +'.se{color:#d1d5db}'
    +'.sn{color:#e5e7eb;font-size:14px}'
    +'.pr-dh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}'
    +'.pr-dn{font-size:18px;font-weight:800;color:#1e3a8a}'
    +'.pr-db{padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800}'
    +'.badge-complete{background:#dcfce7;color:#15803d}'
    +'.badge-partial{background:#fef9c3;color:#92400e}'
    +'.badge-empty{background:#fee2e2;color:#dc2626}'
    +'.pr-tt{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px}'
    +'.pr-tt th{background:#f1f5f9;color:#475569;padding:7px 10px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #e2e8f0}'
    +'.pr-tt td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}'
    +'.pr-ti{font-size:15px;margin-right:5px}'
    +'.pr-xs{color:#d97706;font-size:10px;margin-left:4px;background:#fef9c3;padding:1px 5px;border-radius:4px}'
    +'.pr-sc{font-size:16px}'
    +'.pr-sl{font-size:10px;color:#718096;display:block}'
    +'.pr-nb{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px}'
    +'.pr-nb h4{font-size:10px;font-weight:800;color:#92400e;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em}'
    +'.pr-nb p{font-size:12px;color:#1a202c;line-height:1.7;white-space:pre-wrap}'
    +'@media print{'
    +'#tb{display:none!important}'
    +'body{background:#fff}'
    +'#ct{margin-top:0;padding:8mm;max-width:none}'
    +'.pr-page{box-shadow:none;border-radius:0;margin-bottom:0;page-break-after:always}'
    +'.pr-page:last-child{page-break-after:auto}'
    +'.pr-ow{page-break-after:always}'
    +'}';

  const pspan=periodLabel?'Periode: '+periodLabel+'  &#xB7;  ':'';
  const html='<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8">'
    +'<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">'
    +'<title>Klasbord Rapport<\/title><style>'+css+'<\/style><\/head><body>'
    +'<div id="tb"><div><h2>📄 Klasbord Rapport</h2><span>'+pspan+'Gegenereerd op '+today+'</span></div>'
    +'<div class="tbb">'
    +'<div style="background:rgba(255,255,255,.12);border-radius:8px;padding:8px 14px;font-size:12px;line-height:1.6;color:#fff;">'
    +'<strong>Stap 1:</strong> Klik op de groene knop →<br/>'
    +'<strong>Stap 2:</strong> Kies bij <em>Bestemming</em>: <strong>Opslaan als PDF</strong><br/>'
    +'<strong>Stap 3:</strong> Klik <strong>Opslaan</strong> — PDF staat in je Downloads'
    +'</div>'
    +'<button class="tb2" onclick="window.close()">✕ Sluiten</button>'
    +'<button class="tb1" onclick="window.print()">🖨️ Opslaan als PDF / Afdrukken</button></div></div>'
    +'<div id="ct">'
    +'<div class="pr-page pr-ow">'
    +'<div class="pr-ph"><h1>Klasbord &#x2013; Overzicht</h1><span>Gegenereerd op '+today+'</span></div>'
    +'<div class="pr-pb">'+periodDiv
    +'<div class="pr-ss"><h2 class="r">Niet volledig afgewerkt ('+incomplete.length+')</h2><div class="sc-grid">'+(si||'<p style="color:#a0aec0;font-style:italic;font-size:11px">Iedereen klaar!</p>')+'</div></div>'
    +'<div class="pr-ss"><h2 class="g">Volledig afgewerkt ('+complete2.length+')</h2><div class="sc-grid">'+(sc||'<p style="color:#a0aec0;font-style:italic;font-size:11px">Nog niemand volledig klaar.</p>')+'</div></div>'
    +'<div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin:16px 0 8px">Volledig klasoverzicht</div>'
    +'<table class="pr-ot"><thead><tr><th class="nc">Leerling</th>'+taskHeaders+'</tr></thead><tbody>'+overviewRows+'</tbody></table>'
    +'</div></div>'
    +detailPages
    +'<\/div><\/body><\/html>';

  document.getElementById('pdf-overlay').classList.add('hidden');

  if(mode==='download'){
    // PDF download via html2canvas + jsPDF — zelfde aanpak als andere generators
    const { jsPDF } = window.jspdf;

    // Laad-overlay tonen
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;font-family:Nunito,sans-serif;font-weight:800;font-size:18px;color:#6366f1;z-index:9999;flex-direction:column;gap:12px;';
    ov.innerHTML = '<div>⏳ PDF wordt aangemaakt…</div><div style="font-size:13px;font-weight:600;color:#718096;">even geduld a.u.b.</div>';
    document.body.appendChild(ov);

    // Render-container zichtbaar in het scherm (html2canvas vereist dit)
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:0;top:0;width:900px;background:#fff;z-index:9998;overflow:visible;font-family:Nunito,sans-serif;';
    container.innerHTML =
      '<style>' + css + '*{-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:Nunito,sans-serif;}</style>'
      + '<div id="ct" style="padding:20px;max-width:860px;margin:0 auto;">'
      + '<div class="pr-page" style="margin-bottom:24px;">'
      + '<div class="pr-ph"><h1>Klasbord – Overzicht</h1><span>Gegenereerd op ' + today + '</span></div>'
      + '<div class="pr-pb">' + periodDiv
      + '<div class="pr-ss"><h2 class="r">Niet volledig afgewerkt (' + incomplete.length + ')</h2><div class="sc-grid">' + (si || '<p style="color:#a0aec0;font-size:11px">Iedereen klaar!</p>') + '</div></div>'
      + '<div class="pr-ss"><h2 class="g">Volledig afgewerkt (' + complete2.length + ')</h2><div class="sc-grid">' + (sc || '<p style="color:#a0aec0;font-size:11px">Nog niemand volledig klaar.</p>') + '</div></div>'
      + '<div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin:16px 0 8px">Volledig klasoverzicht</div>'
      + '<table class="pr-ot"><thead><tr><th class="nc">Leerling</th>' + taskHeaders + '</tr></thead><tbody>' + overviewRows + '</tbody></table>'
      + '</div></div>'
      + detailPages
      + '</div>';
    document.body.appendChild(container);

    // Wacht tot fonts geladen zijn, render dan pagina per pagina
    document.fonts.ready.then(async function(){
      try {
        const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
        const pageW = 210, pageH = 297, margin = 10, usableW = pageW - 2 * margin;
        const pages = container.querySelectorAll('.pr-page');

        for(let i = 0; i < pages.length; i++){
          const canvas = await html2canvas(pages[i], {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: 880
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.92);
          const imgH = (canvas.height / canvas.width) * usableW;

          if(i > 0) pdf.addPage();

          if(imgH <= pageH - 2 * margin){
            // Past op één pagina
            pdf.addImage(imgData, 'JPEG', margin, margin, usableW, imgH);
          } else {
            // Te hoog: knip in stukken
            const pxPerMm = canvas.width / usableW;
            const slicePx = Math.floor((pageH - 2 * margin) * pxPerMm);
            let srcY = 0;
            let firstSlice = true;
            while(srcY < canvas.height){
              if(!firstSlice) pdf.addPage();
              firstSlice = false;
              const sliceCanvas = document.createElement('canvas');
              sliceCanvas.width = canvas.width;
              sliceCanvas.height = Math.min(slicePx, canvas.height - srcY);
              sliceCanvas.getContext('2d').drawImage(canvas, 0, -srcY);
              const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
              const sliceH = (sliceCanvas.height / canvas.width) * usableW;
              pdf.addImage(sliceData, 'JPEG', margin, margin, usableW, sliceH);
              srcY += slicePx;
            }
          }
        }

        const filename = 'klasbord-rapport' + (periodName ? '-' + periodName.replace(/[^a-zA-Z0-9]/g,'-') : '') + '-' + new Date().toISOString().slice(0,10) + '.pdf';
        pdf.save(filename);

      } catch(err){
        console.error('PDF fout:', err);
        alert('PDF aanmaken mislukt: ' + err.message + '\n\nProbeer de knop "🖨️ Afdrukken" en kies "Opslaan als PDF".');
      } finally {
        document.body.removeChild(container);
        document.body.removeChild(ov);
      }
    });

  } else {
    // Afdrukken: open rapport in nieuw venster
    const blob = new Blob([html], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, '_blank');
    if(!tab) alert('Pop-up geblokkeerd! Sta pop-ups toe voor deze pagina in je browser.');
    setTimeout(function(){ URL.revokeObjectURL(url); }, 15000);
  }
}

function buildAllTasksForBoard(){
  const ids=new Set();
  state.pupils.forEach(p=>pupilTasks(p.id).forEach(t=>ids.add(t.id)));
  const result=[];
  allBaseTasks().filter(t=>ids.has(t.id)).forEach(t=>result.push(t));
  state.pupils.forEach(p=>{(state.pupilTaskOverrides[p.id]?.extra||[]).forEach(t=>{if(ids.has(t.id)&&!result.find(x=>x.id===t.id))result.push(t);});});
  return result;
}


// ── WELCOME SCREEN ─────────────────────────────────────────────────────────
function updateWelcomeStatus(){
  const hasPupils=state.pupils.length>0, hasTasks=classActiveTasks().length>0;
  var s1=document.getElementById('step-namen');
  var s1s=document.getElementById('step-namen-status');
  var s1c=document.getElementById('step-namen-check');
  if(s1){
    if(hasPupils){s1.classList.add('done');s1s.textContent=state.pupils.length+' leerlingen ingevuld';s1c.textContent='OK';}
    else{s1.classList.remove('done');s1s.textContent='Nog geen namen toegevoegd - klik hier';s1c.textContent='o';}
  }
  var s2=document.getElementById('step-taken');
  var s2s=document.getElementById('step-taken-status');
  var s2c=document.getElementById('step-taken-check');
  if(s2){
    if(hasTasks){s2.classList.add('done');s2s.textContent=classActiveTasks().length+' taken geselecteerd';s2c.textContent='OK';}
    else{s2.classList.remove('done');s2s.textContent='Nog geen taken geselecteerd - klik hier';s2c.textContent='o';}
  }
  var btn=document.getElementById('welcome-go-btn');
  var hint=document.getElementById('welcome-hint');
  if(btn) btn.disabled=!(hasPupils&&hasTasks);
  if(hint){
    if(hasPupils&&hasTasks){hint.textContent='Alles klaar! Klik hieronder om naar het bord te gaan.';hint.style.color='#16a34a';}
    else{var m=[];if(!hasPupils)m.push('leerlingen');if(!hasTasks)m.push('taken');hint.textContent='Voer eerst '+m.join(' en ')+' in.';hint.style.color='#718096';}
  }
  var sub=document.getElementById('welcome-sub');
  if(sub&&(hasPupils||hasTasks)){
    sub.textContent=(hasPupils&&hasTasks)?
      'Je hebt al '+state.pupils.length+' leerlingen en '+classActiveTasks().length+' taken. Ga direct naar het bord of pas aan.':
      'Bijna klaar, doorloop de resterende stap(pen).';
  }
}
function goSetup(tab){
  document.getElementById('welcome-screen').classList.add('hidden');
  currentMode='settings'; currentTab=tab; renderShell();
  setTimeout(updateWelcomeStatus,200);
}
function closeWelcome(){
  document.getElementById('welcome-screen').classList.add('hidden');
  currentMode='board'; renderShell();
}
function closeWelcomeAnyway(){
  document.getElementById('welcome-screen').classList.add('hidden');
  currentMode='board'; renderShell();
}
function closeSettings(){ currentMode='board'; renderShell(); }

// ── EXPORT INFO ─────────────────────────────────────────────────────────────
function showExportInfo(){ document.getElementById('export-overlay').classList.remove('hidden'); }
function showImportInfo(){ document.getElementById('import-overlay').classList.remove('hidden'); }

// ── AFBEELDINGEN UPLOADEN ───────────────────────────────────────────────────
function resizeImageToDataURL(file, size, cb){
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');
      canvas.width=size; canvas.height=size;
      const ctx=canvas.getContext('2d');
      // Letterbox: centreer afbeelding zonder bij te snijden
      const ratio=Math.min(size/img.width, size/img.height);
      const w=img.width*ratio, h=img.height*ratio;
      const x=(size-w)/2, y=(size-h)/2;
      ctx.clearRect(0,0,size,size);
      ctx.drawImage(img,x,y,w,h);
      cb(canvas.toDataURL('image/png'));
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

function uploadTaskIcon(taskId){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/jpeg,image/png,image/gif,image/webp,image/svg+xml';
  inp.onchange=e=>{
    const f=e.target.files[0]; if(!f)return;
    resizeImageToDataURL(f,160,dataURL=>{
      if(!state.customIcons) state.customIcons={};
      state.customIcons[taskId]=dataURL;
      saveState(); renderTaskSettings(); renderBoard();
    });
  };
  inp.click();
}

function removeTaskIcon(taskId){
  if(state.customIcons) delete state.customIcons[taskId];
  saveState(); renderTaskSettings(); renderBoard();
}

function uploadPupilPhoto(pupilId){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/jpeg,image/png,image/gif,image/webp';
  inp.onchange=e=>{
    const f=e.target.files[0]; if(!f)return;
    resizeImageToDataURL(f,120,dataURL=>{
      if(!state.pupilPhotos) state.pupilPhotos={};
      state.pupilPhotos[pupilId]=dataURL;
      saveState(); renderPupilList(); renderBoard();
    });
  };
  inp.click();
}

function removePupilPhoto(pupilId){
  if(state.pupilPhotos) delete state.pupilPhotos[pupilId];
  saveState(); renderPupilList(); renderBoard();
}

// ── EINDE AFBEELDINGEN ───────────────────────────────────────────────────────
var selectedPeriodOption=0;
function openNewPeriod(){
  selectedPeriodOption=0;
  [1,2,3].forEach(function(n){document.getElementById('po'+n).classList.remove('selected');});
  document.getElementById('new-period-confirm').disabled=true;
  document.getElementById('new-period-overlay').classList.remove('hidden');
}
function selectPeriod(n){
  selectedPeriodOption=n;
  [1,2,3].forEach(function(i){document.getElementById('po'+i).classList.toggle('selected',i===n);});
  document.getElementById('new-period-confirm').disabled=false;
}
function doNewPeriod(){
  if(!selectedPeriodOption) return;
  if(selectedPeriodOption===1){ state.progress={}; }
  else if(selectedPeriodOption===2){ state.progress={}; state.notes={}; }
  else { state.pupils=[];state.progress={};state.notes={};state.activeTasks=[];state.customTasks=[];state.pupilTaskOverrides={}; }
  saveState();
  document.getElementById('new-period-overlay').classList.add('hidden');
  if(selectedPeriodOption===3){
    updateWelcomeStatus();
    document.getElementById('welcome-screen').classList.remove('hidden');
  } else { renderShell(); }
}

// MODE / TAB
function toggleMode(){ currentMode=currentMode==='board'?'settings':'board';renderShell(); }
function switchTab(tab){ currentTab=tab;renderSettings(); }

// CONFIRM
let confirmCallback=null;
function confirmAction(type,msg,cb){ confirmCallback=cb||null;document.getElementById('confirm-title').textContent=type==='reset'?'Voortgang wissen':type==='classload'?'Klaslijst laden':'Bevestigen';document.getElementById('confirm-text').textContent=msg||'';const btns=document.getElementById('confirm-btns');if(type==='reset')btns.innerHTML='<button class="btn btn-secondary" onclick="closeConfirm()">Annuleren</button><button class="btn btn-danger" onclick="resetAll();closeConfirm()">Wissen</button>';else if(type==='classload')btns.innerHTML='<button class="btn btn-secondary" onclick="closeConfirm()">Annuleren</button><button class="btn btn-secondary" onclick="loadClassListAction(false)">➕ Samenvoegen</button><button class="btn btn-primary" onclick="loadClassListAction(true)">🔄 Vervangen</button>';else btns.innerHTML='<button class="btn btn-secondary" onclick="closeConfirm()">Annuleren</button><button class="btn btn-primary" onclick="confirmCallback&&confirmCallback();closeConfirm()">Doorgaan</button>';document.getElementById('confirm-overlay').classList.remove('hidden'); }
function closeConfirm(){ document.getElementById('confirm-overlay').classList.add('hidden'); }
function showCelebration(n){ document.getElementById('celeb-name').textContent=n;document.getElementById('celebration').classList.add('show'); }
function closeCelebration(){ document.getElementById('celebration').classList.remove('show'); }

// DRAG & DROP
function onDragStart(e,i){dragSrc=i;e.dataTransfer.effectAllowed='move';}
function onDragOver(e,i){e.preventDefault();document.querySelectorAll('.pupil-row')[i]?.classList.add('drag-over');}
function onDragLeave(i){document.querySelectorAll('.pupil-row')[i]?.classList.remove('drag-over');}
function onDrop(e,i){e.preventDefault();document.querySelectorAll('.pupil-row').forEach(r=>r.classList.remove('drag-over'));if(dragSrc===null||dragSrc===i)return;const a=[...state.pupils],[m]=a.splice(dragSrc,1);a.splice(i,0,m);state.pupils=a;dragSrc=null;saveState();renderPupilList();renderBoard();}
function onDragEnd(){dragSrc=null;document.querySelectorAll('.pupil-row').forEach(r=>r.classList.remove('drag-over'));}

// RENDER
function renderShell(){
  const isB = currentMode === 'board';
  const isS = currentMode === 'settings';

  const topbar = document.getElementById('topbar');
  if(topbar) topbar.classList.toggle('visible', isS);

  const settingsWrap = document.getElementById('settings-wrap');
  if(settingsWrap){
    settingsWrap.classList.toggle('visible', isS);
    settingsWrap.classList.toggle('hidden', !isS);
  }

  const boardWrap = document.getElementById('board-wrap');
  if(boardWrap){
    boardWrap.classList.toggle('visible', isB);
    boardWrap.classList.toggle('hidden', !isB);
  }

  const btnReset = document.getElementById('btn-reset');
  if(btnReset) btnReset.classList.toggle('hidden', !isB);

  if(isS) renderSettings();
  else renderBoard();
}

function renderSettings(){
  document.getElementById('tab-ll').classList.toggle('active',currentTab==='leerlingen');
  document.getElementById('tab-tk').classList.toggle('active',currentTab==='taken');
  document.getElementById('tab-content-leerlingen').classList.toggle('hidden',currentTab!=='leerlingen');
  document.getElementById('tab-content-taken').classList.toggle('hidden',currentTab!=='taken');
  if(currentTab==='leerlingen')renderPupilList();
  if(currentTab==='taken')renderTaskSettings();
}
function renderPupilList(){
  document.getElementById('toggle-numbers').checked=!!state.showNumbers;
  document.getElementById('toggle-lastname').checked=!!state.showLastname;
  document.getElementById('toggle-smileys').checked=!!state.showSmileys;
  document.getElementById('pupil-count-title').textContent=`Leerlingen (${state.pupils.length})`;

  // Eerste-keer-hint foto's (punt 3) — toon als er leerlingen zijn maar nog geen foto
  const hasAnyPhoto = state.pupils.some(p => state.pupilPhotos[p.id]);
  const hintDismissed = localStorage.getItem('hint_photos_dismissed');
  const hintEl = document.getElementById('hint-photos');
  if(hintEl){
    hintEl.style.display = (!hasAnyPhoto && !hintDismissed && state.pupils.length > 0) ? 'flex' : 'none';
  }

  // Leerlingenlijst — foto-knop direct zichtbaar naast elke naam
  const el=document.getElementById('pupil-list');
  if(!state.pupils.length){el.innerHTML='<div style="opacity:.3;text-align:center;padding:28px 0;font-size:13px">Nog geen leerlingen</div>';return;}
  let html='';
  state.pupils.forEach((p,i)=>{
    const ov=hasOverrides(p.id), hasNotes=!!state.notes[p.id];
    const numHtml   = state.showNumbers ? '<span class="pupil-num">'+(i+1)+'.</span>' : '';
    const achHtml   = p.achternaam ? '<span class="pupil-achternaam">'+esc(p.achternaam)+'</span>' : '';
    const extraHtml = ov ? '<span class="pupil-extra-badge">\u2605 taken</span>' : '';
    const noteCls   = hasNotes ? 'has-notes' : '';
    const fullN     = esc(p.voornaam+(p.achternaam?' '+p.achternaam:''));
    const photo     = state.pupilPhotos&&state.pupilPhotos[p.id];
    // Foto-knop: groot en duidelijk zichtbaar in de rij
    const photoCell = photo
      ? `<button class="pupil-photo-btn has-photo" onclick="uploadPupilPhoto('${p.id}')" title="Klik om foto te wijzigen"><img src="${photo}" class="pupil-row-photo" alt="" /></button>`
      : `<button class="pupil-photo-btn no-photo" onclick="uploadPupilPhoto('${p.id}')" title="Foto toevoegen">📷 foto</button>`;
    html += '<div class="insert-zone" onclick="insertAfter('+(i-1)+')"></div>';
    html += '<div class="pupil-row" draggable="true"'
      +' ondragstart="onDragStart(event,'+i+')" ondragover="onDragOver(event,'+i+')"'
      +' ondragleave="onDragLeave('+i+')" ondrop="onDrop(event,'+i+')" ondragend="onDragEnd()">'
      +'<span class="drag-handle">\u2833</span>'
      + numHtml
      + photoCell
      +'<div class="pupil-display">'
        +'<span class="pupil-voornaam">'+esc(p.voornaam)+'</span>'
        + achHtml + extraHtml
      +'</div>'
      +'<div class="row-btns">'
        +(photo?`<button class="row-btn del" onclick="removePupilPhoto('${p.id}')" title="Foto verwijderen" style="font-size:10px;">🗑</button>`:'')
        +'<button class="row-btn" onclick="openPupilTasksModal(\''+p.id+'\')" title="Taken aanpassen">\uD83D\uDCCB</button>'
        +'<button class="row-btn notes-btn '+noteCls+'" onclick="openNotesModal(\''+p.id+'\')" title="Bevindingen">\uD83D\uDD12</button>'
        +'<button class="row-btn" onclick="startEdit(\''+p.id+'\')" title="Naam aanpassen">\u270E</button>'
        +'<button class="row-btn del" onclick="confirmAction(\'custom\',\''+fullN+' verwijderen?\',()=>removePupil(\''+p.id+'\'))" title="Verwijderen">\u2715</button>'
      +'</div>'
      +'</div>';
  });
  html += '<div class="insert-zone" onclick="insertAfter('+(state.pupils.length-1)+')"></div>';
  el.innerHTML=html;
}
function renderTaskSettings(){
  const ci=state.customIcons||{};

  // Eerste-keer-hint pictogrammen (punt 3)
  const hasAnyIcon = Object.keys(ci).length > 0;
  const iconHintDismissed = localStorage.getItem('hint_icons_dismissed');
  const iconHintEl = document.getElementById('hint-icons');
  if(iconHintEl){
    iconHintEl.style.display = (!hasAnyIcon && !iconHintDismissed) ? 'flex' : 'none';
  }

  // Taakchips met direct zichtbaar upload-knopje én naam-bewerk knopje
  const chipsEl=document.getElementById('task-chips');
  chipsEl.innerHTML='';
  allBaseTasks().forEach(t=>{
    const a=state.activeTasks.includes(t.id), c=t.id.startsWith('c_');
    const hasImg=!!ci[t.id];
    const wrap=document.createElement('div');
    wrap.className='task-chip-wrap';

    // De chip zelf (klik = aan/uit)
    const chip=document.createElement('div');
    chip.className='task-chip'+(a?' active':'');
    chip.onclick=()=>toggleTask(t.id);
    const iconHtml=hasImg?`<img class="chip-icon-img" src="${ci[t.id]}" alt="" />`:`${t.icon} `;
    chip.innerHTML=iconHtml+esc(t.label)+(c?`<button class="remove-chip" onclick="event.stopPropagation();removeCustomTask('${t.id}')">✕</button>`:'');
    wrap.appendChild(chip);

    // Knopjesrij onder de chip
    const btnRow=document.createElement('div');
    btnRow.className='chip-btn-row';

    // Naam bewerken knopje
    const editBtn=document.createElement('button');
    editBtn.className='chip-edit-name';
    editBtn.title='Naam aanpassen';
    editBtn.textContent='✎ naam';
    editBtn.onclick=()=>openTaskRenameModal(t.id, t.label);
    btnRow.appendChild(editBtn);

    // Upload-knopje
    const uploadBtn=document.createElement('button');
    uploadBtn.className='chip-upload-inline'+(hasImg?' has-img':'');
    uploadBtn.title=hasImg?'Eigen afbeelding — klik om te vervangen':'Eigen afbeelding uploaden';
    uploadBtn.innerHTML=hasImg?`<img src="${ci[t.id]}" class="chip-upload-preview-img" alt="" /> <span>📷 wijzig</span>`:'📷 afb.';
    uploadBtn.onclick=()=>uploadTaskIcon(t.id);
    btnRow.appendChild(uploadBtn);

    // Verwijder-afbeelding knopje
    if(hasImg){
      const delBtn=document.createElement('button');
      delBtn.className='chip-upload-del';
      delBtn.title='Afbeelding verwijderen';
      delBtn.textContent='🗑';
      delBtn.onclick=()=>removeTaskIcon(t.id);
      btnRow.appendChild(delBtn);
    }

    wrap.appendChild(btnRow);
    chipsEl.appendChild(wrap);
  });

  document.getElementById('emoji-picker').innerHTML=EMOJIS.map(e=>`<button class="emoji-btn ${e===selectedEmoji?'selected':''}" onclick="selectEmoji('${e}')">${e}</button>`).join('');
  document.getElementById('input-task').placeholder=`${selectedEmoji} Taaknaam…`;
}
function selectEmoji(e){selectedEmoji=e;renderTaskSettings();}

function renderBoard(){
  applyBoardSize();
  checkBackupReminder();
  // Sync grootte-knoppen
  ['compact','normal','large'].forEach(s=>{
    const btn=document.getElementById('size-'+s);
    if(btn) btn.classList.toggle('size-btn-active', s===(state.boardSize||'normal'));
  });
  const hp=state.pupils.length>0,ht=classActiveTasks().length>0||state.pupils.some(p=>(state.pupilTaskOverrides[p.id]?.extra||[]).length>0),show=hp&&ht;
  document.getElementById('empty-state').classList.toggle('hidden',show);
  document.getElementById('board-inner').classList.toggle('hidden',!show);
  if(!show){document.getElementById('empty-text').textContent=!hp?'Voeg leerlingen toe via ⚙️ Beheer':'Activeer taken via ⚙️ Beheer → Taken';updateMeta();return;}
  const allTasks=buildAllTasksForBoard();
  document.getElementById('board-inner').style.minWidth=(200+allTasks.length*(100+6)+48)+'px';
  renderTaskHeader(allTasks);renderPupilRows(allTasks);updateProgressBar();updateMeta();
}
function renderTaskHeader(tasks){
  const h=document.getElementById('task-header');
  h.querySelectorAll('.task-header-cell').forEach(e=>e.remove());
  tasks.forEach(t=>{
    const d=document.createElement('div');d.className='task-header-cell';
    const ci=state.customIcons&&state.customIcons[t.id];
    if(ci){
      d.innerHTML=`<div class="t-icon-custom" style="background-image:url(${ci})"></div><span class="t-label">${esc(t.label)}</span>`;
    } else {
      d.innerHTML=`<span class="t-icon">${t.icon}</span><span class="t-label">${esc(t.label)}</span>`;
    }
    h.appendChild(d);
  });
}
function renderPupilRows(allTasks){
  const c=document.getElementById('pupil-rows');c.innerHTML='';
  state.pupils.forEach((pupil,idx)=>{
    const pid=pupil.id,myTasks=pupilTasks(pid),myIds=new Set(myTasks.map(t=>t.id));
    const complete=isPupilComplete(pid),{done,busy,total}=pupilStats(pid),prog=state.progress[pid]||{};
    const hasNotes=!!state.notes[pid];
    const photo=state.pupilPhotos&&state.pupilPhotos[pid];
    const photoHtml=photo?`<img class="pupil-board-photo" src="${photo}" alt="${esc(displayName(pupil))}" />`:'';
    const row=document.createElement('div');
    row.className='pupil-board-row'+(complete?' complete':'');
    const dc=complete?'done':busy>0?'busy':'';
    const bh=busy>0?` · <span class="busy-label">${busy} bezig</span>`:'';
    const nh=state.showNumbers?`<span style="font-size:10px;color:#a0aec0;font-weight:700;flex-shrink:0">${idx+1}.</span>`:'';
    const notesBtn = hasNotes ? '<button class="notes-btn has-notes" onclick="openNotesModal(\''+pid+'\')" title="Bevindingen bekijken">\uD83D\uDD12</button>' : '';
    const medalSpan = complete ? '<span class="pupil-medal">\uD83C\uDFC5</span>' : '';
    row.innerHTML = '<div class="pupil-name-cell">'
      + '<div class="pupil-dot '+dc+'"></div>'+nh
      + photoHtml
      + '<div class="pupil-info">'
        + '<div class="pupil-name">'+esc(displayName(pupil))+'</div>'
        + '<div class="pupil-sub">'+done+'/'+total+bh+'</div>'
      + '</div>'
      + notesBtn + medalSpan
      + '</div>';

    allTasks.forEach(t=>{
      const cell=document.createElement('div');cell.className='task-cell';
      if(!myIds.has(t.id)){
        const ph=document.createElement('div');ph.className='task-ph';ph.textContent='—';cell.appendChild(ph);
      } else {
        const isExtra=!!(state.pupilTaskOverrides[pid]?.extra?.find(x=>x.id===t.id));
        const entry=prog[t.id]||{status:0,smiley:0};
        const s=entry.status||0,sm=entry.smiley||0;
        // Status button — GEEN afbeelding hier, afbeelding staat alleen in de kolomheader
        const btn=document.createElement('button');
        btn.className='task-btn status-'+s+(isExtra?' extra-task':'');
        btn.textContent = s===0 ? '' : s===1 ? '🔄' : '✓';
        btn.title=(isExtra?'★ Extra · ':'')+['Leeg → Bezig','Bezig → Klaar','Klaar → wissen'][s];
        btn.onclick=()=>cycleStatus(pid,t.id);
        cell.appendChild(btn);
        // Smiley: na afvinken toon enkel gekozen smiley (klikbaar om te wijzigen via popup)
        if(s===2||sm>0){
          if(sm>0){
            // Toon enkel de gekozen smiley als knopje – klik opent popup om te wijzigen
            const sr=document.createElement('div');sr.className='smiley-row smiley-row-single';
            const sb=document.createElement('button');
            sb.className='smiley-btn selected smiley-chosen';
            sb.textContent=SMILEYS[sm];
            sb.title=SMILEY_LABELS[sm]+' · Klik om te wijzigen';
            sb.onclick=()=>openSmileyPopup(pid,t.id);
            sr.appendChild(sb);
            cell.appendChild(sr);
          } else if(state.showSmileys){
            // Smileys publiek zichtbaar en nog niet gekozen: toon rij om te kiezen
            const sr=document.createElement('div');sr.className='smiley-row';
            [1,2,3,4].forEach(v=>{
              const sb=document.createElement('button');
              sb.className='smiley-btn';
              sb.textContent=SMILEYS[v];
              sb.title=SMILEY_LABELS[v];
              sb.onclick=()=>{ if(!state.progress[pid])state.progress[pid]={}; if(!state.progress[pid][t.id])state.progress[pid][t.id]={status:s,smiley:0}; state.progress[pid][t.id].smiley=v; saveState();renderBoard(); };
              sr.appendChild(sb);
            });
            cell.appendChild(sr);
          }
          // Als smileys niet publiek en nog geen keuze: geen rij tonen (popup verscheen al)
        }
      }
      row.appendChild(cell);
    });
    c.appendChild(row);
  });
}
function updateProgressBar(){const t=state.pupils.length,d=state.pupils.filter(p=>isPupilComplete(p.id)).length;document.getElementById('progress-fill').style.width=t?(d/t*100)+'%':'0%';document.getElementById('progress-label').textContent=`${d}/${t} klaar`;}
function updateMeta(){var t=state.pupils.length,d=state.pupils.filter(function(p){return isPupilComplete(p.id);}).length;var el=document.getElementById('board-progress-text');if(el)el.textContent=(t>0)?(d+'/'+t+' klaar'):'';var pl=document.getElementById('progress-label');if(pl)pl.textContent=(d+'/'+t+' klaar');}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// INIT
// Punt 5: Bord-grootte instellen
function setBoardSize(size){
  state.boardSize = size;
  saveState();
  applyBoardSize();
  renderBoard();
  // Update actieve knop
  ['compact','normal','large'].forEach(s=>{
    const btn=document.getElementById('size-'+s);
    if(btn) btn.classList.toggle('size-btn-active', s===size);
  });
}
function applyBoardSize(){
  const sizes = {
    compact: { name:'120px', task:'90px',  gap:'5px',  btnW:'46px', btnH:'46px', btnFont:'20px', nameFont:'13px' },
    normal:  { name:'220px', task:'120px', gap:'8px',  btnW:'66px', btnH:'66px', btnFont:'26px', nameFont:'16px' },
    large:   { name:'260px', task:'150px', gap:'10px', btnW:'84px', btnH:'84px', btnFont:'32px', nameFont:'18px' },
  };
  const s = sizes[state.boardSize] || sizes.normal;
  const root = document.documentElement;
  root.style.setProperty('--col-name', s.name);
  root.style.setProperty('--col-task', s.task);
  root.style.setProperty('--gap', s.gap);
  root.style.setProperty('--btn-w', s.btnW);
  root.style.setProperty('--btn-h', s.btnH);
  root.style.setProperty('--btn-font', s.btnFont);
  root.style.setProperty('--name-font', s.nameFont);
}
const isSmartboard = new URLSearchParams(window.location.search).get('modus') === 'smartboard';
function hideBackupReminder(){
  const el = document.getElementById('backup-reminder');
  if(el) el.style.display = 'none';
}
function checkBackupReminder(){
  if(!state.pupils.length) return; // geen data = geen melding nodig
  const last = parseInt(localStorage.getItem('last_export_'+STORAGE_KEY)||'0');
  const days = (Date.now() - last) / (1000*60*60*24);
  const el = document.getElementById('backup-reminder');
  if(!el) return;
  // Toon als: nooit gebackupt (last=0) én er zijn leerlingen, of laatste backup > 7 dagen
  el.style.display = (last === 0 || days > 7) ? 'flex' : 'none';
}

function applySmartboard(){
  if(!isSmartboard) return;
  document.body.classList.add('smartboard');
  currentMode = 'board';
  // Toon het discreet slotje-knopje
  var btn = document.getElementById('smartboard-exit-btn');
  if(btn) btn.style.display = 'block';
}

function exitSmartboard(dest){
  document.getElementById('smartboard-exit-overlay').classList.add('hidden');
  if(dest === 'welkom'){
    window.location.href = 'welkomstbord.html';
  } else {
    // Verwijder smartboard-modus en ga naar beheer
    document.body.classList.remove('smartboard');
    var btn = document.getElementById('smartboard-exit-btn');
    if(btn) btn.style.display = 'none';
    currentMode = 'settings';
    renderShell();
  }
}
function goBackToWelcome(){
  window.location.href = 'welkomstbord.html';
}
function goBackFromBoard(){
  if(isSmartboard) return;
  currentMode = 'settings';
  renderShell();
}

// INIT
loadState();
document.getElementById('toggle-numbers').checked = !!state.showNumbers;
document.getElementById('toggle-lastname').checked = !!state.showLastname;
document.getElementById('toggle-smileys').checked = !!state.showSmileys;

const urlParams = new URLSearchParams(window.location.search);
const startTab = urlParams.get('tab');

currentMode = urlParams.get('view') === 'board' ? 'board' : 'settings';
currentTab = startTab === 'taken' ? 'taken' : 'leerlingen';

applySmartboard();
applyBoardSize();
renderShell();

// ── TIMER ────────────────────────────────────────────────────────────────────
var timerTotalSeconds = 15 * 60;
var timerRemaining    = 15 * 60;
var timerInterval     = null;
var timerPaused       = false;
var timerView         = 'both'; // 'both' | 'analog' | 'digital'
var timerFlashInterval = null;

function toggleTimer(){
  var p = document.getElementById('timer-popup');
  if(!p) return;
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

// Weergave: analoog + digitaal / enkel analoog / enkel digitaal
function setTimerView(mode){
  timerView = mode;
  var clock = document.getElementById('timer-clock');
  var digWrap = document.getElementById('timer-digital-wrap');
  var displayWrap = document.getElementById('timer-display-wrap');
  if(!clock || !digWrap) return;

  if(mode === 'both'){
    clock.style.display   = 'block';
    digWrap.style.display = 'flex';
    displayWrap.style.flexDirection = 'row';
  } else if(mode === 'analog'){
    clock.style.display   = 'block';
    digWrap.style.display = 'none';
    displayWrap.style.flexDirection = 'column';
  } else { // digital only
    clock.style.display   = 'none';
    digWrap.style.display = 'flex';
    displayWrap.style.flexDirection = 'column';
  }

  // Highlight actieve knop
  ['both','analog','digital'].forEach(function(v){
    var btn = document.getElementById('tv-' + v);
    if(!btn) return;
    var active = v === mode;
    btn.style.borderColor = active ? '#6366f1' : '#e0e7ff';
    btn.style.background  = active ? '#eef2ff' : '#f8fafc';
    btn.style.color       = active ? '#6366f1' : '#6b7280';
  });

  drawClock();
}

function adjustTime(delta){
  timerTotalSeconds = Math.max(60, timerTotalSeconds + delta * 60);
  timerRemaining    = timerTotalSeconds;
  updateSetDisplay();
}
function setTimerPreset(minutes){
  timerTotalSeconds = minutes * 60;
  timerRemaining    = timerTotalSeconds;
  updateSetDisplay();
}
function updateSetDisplay(){
  var el = document.getElementById('timer-set-display');
  if(!el) return;
  var m = Math.floor(timerTotalSeconds / 60), s = timerTotalSeconds % 60;
  el.textContent = timerPad(m) + ':' + timerPad(s);
}
function timerPad(n){ return n < 10 ? '0' + n : '' + n; }

function startTimer(){
  timerRemaining = timerTotalSeconds;
  timerPaused    = false;
  document.getElementById('timer-setup').style.display   = 'none';
  document.getElementById('timer-running').style.display = 'block';
  document.getElementById('timer-done').style.display    = 'none';
  setTimerView(timerView);
  clearInterval(timerInterval);
  timerInterval = setInterval(timerTick, 1000);
  timerTick();
}
function timerTick(){
  if(timerPaused) return;
  updateTimerDigital();
  drawClock();
  updateTimerProgress();
  if(timerRemaining <= 0){
    clearInterval(timerInterval);
    timerDone();
    return;
  }
  timerRemaining--;
}
function updateTimerDigital(){
  var el = document.getElementById('timer-digital');
  if(!el) return;
  var m = Math.floor(timerRemaining / 60), s = timerRemaining % 60;
  el.textContent = timerPad(m) + ':' + timerPad(s);
  el.style.color = timerRemaining < 60 ? '#dc2626' : '#1e1b4b';
}
function updateTimerProgress(){
  var bar = document.getElementById('timer-progress');
  if(!bar) return;
  var pct = timerTotalSeconds > 0 ? (timerRemaining / timerTotalSeconds) * 100 : 0;
  bar.style.width = pct + '%';
  if(pct > 50)      bar.style.background = 'linear-gradient(90deg,#6366f1,#22c55e)';
  else if(pct > 20) bar.style.background = 'linear-gradient(90deg,#f59e0b,#fbbf24)';
  else              bar.style.background = 'linear-gradient(90deg,#dc2626,#f87171)';
}
function drawClock(){
  var canvas = document.getElementById('timer-clock');
  if(!canvas || canvas.style.display === 'none') return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, r = W/2 - 6;
  ctx.clearRect(0, 0, W, H);

  var pct = timerTotalSeconds > 0 ? timerRemaining / timerTotalSeconds : 0;
  var fillColor = pct > 0.5 ? '#6366f1' : pct > 0.2 ? '#f59e0b' : '#dc2626';

  // Lege achtergrondcirkel (het al verstreken deel)
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI);
  ctx.fillStyle = '#f0f4f8'; ctx.fill();
  ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 2; ctx.stroke();

  // Gekleurde taartpunt = resterende tijd
  // Start bovenaan (12 uur = -90°), eindigt op de huidige "wijzerstand"
  // De schijf loopt van de huidige positie TOT bovenaan, met de klok mee
  // = van -90° + (2π * (1-pct))  tot  -90° + 2π
  // Wat gelijk is aan: de schijf vult van "huidige positie" naar "12 uur" met klok mee
  // Simpelste correcte aanpak:
  // - De LEGE sector loopt van 12 uur (boven) MET de klok mee, grootte = verstreken fractie
  // - De VOLLE sector is de rest
  if(pct > 0){
    var top = -Math.PI / 2;
    // Huidige "wijzerstand": hoeveel is verstreken = (1 - pct) van de cirkel
    var elapsed_angle = top + 2 * Math.PI * (1 - pct);
    // Volle schijf = van elapsed_angle tot top + 2π (= terug naar boven), met klok mee
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 2, elapsed_angle, top + 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  // Rand bovenop
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI);
  ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 2; ctx.stroke();

  // Uurmarkeringen (wit, bovenop schijf)
  for(var i = 0; i < 12; i++){
    var a = (i / 12) * 2 * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 2),  cy + Math.sin(a) * (r - 2));
    ctx.lineTo(cx + Math.cos(a) * (r - (i % 3 === 0 ? 11 : 7)), cy + Math.sin(a) * (r - (i % 3 === 0 ? 11 : 7)));
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.5;
    ctx.stroke();
  }

  // Secondewijzer — wijst naar hoeveel er AL verstreken is (met klok mee vanaf 12)
  var elapsed = timerTotalSeconds - timerRemaining;
  var sAngle = -Math.PI/2 + (2*Math.PI * (elapsed % 60) / 60);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sAngle) * r * 0.82, cy + Math.sin(sAngle) * r * 0.82);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();

  // Middelpunt
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2*Math.PI);
  ctx.fillStyle = '#fff'; ctx.fill();

  // Tijd in het midden
  ctx.fillStyle = pct > 0.15 ? '#fff' : '#dc2626';
  ctx.font = 'bold ' + Math.round(r * 0.28) + 'px Nunito,Arial,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if(timerRemaining < 60){
    ctx.fillText('0:' + timerPad(timerRemaining % 60), cx, cy);
  } else {
    ctx.fillText(Math.ceil(timerRemaining / 60) + "'", cx, cy);
  }
}

function pauseResumeTimer(){
  timerPaused = !timerPaused;
  var btn = document.getElementById('timer-pause-btn');
  if(btn) btn.textContent = timerPaused ? '▶ Verder' : '⏸ Pauze';
}
function resetTimer(){
  clearInterval(timerInterval);
  timerInterval = null;
  // Stop knipperen en herstel stijl
  if(typeof timerFlashInterval !== 'undefined'){ clearInterval(timerFlashInterval); timerFlashInterval = null; }
  var pop = document.getElementById('timer-popup');
  if(pop){ pop.style.background = '#fff'; pop.style.border = '3px solid #e0e7ff'; pop.style.boxShadow = '0 8px 40px rgba(0,0,0,.22)'; }
  timerPaused   = false;
  timerRemaining = timerTotalSeconds;
  document.getElementById('timer-setup').style.display   = 'block';
  document.getElementById('timer-running').style.display = 'none';
  document.getElementById('timer-done').style.display    = 'none';
  updateSetDisplay();
}
function timerDone(){
  document.getElementById('timer-running').style.display = 'none';
  document.getElementById('timer-done').style.display    = 'block';

  // Geluid: herhalend alarm gedurende ~10 seconden
  // 3 tonen per cyclus, 5 cycli met korte pauze ertussen
  try {
    var ac = new (window.AudioContext || window.webkitAudioContext)();
    // Melodie: hoog-laag-hoog patroon, 5 keer herhalen
    var pattern = [
      {freq:880, t:0},    {freq:660, t:0.18}, {freq:880, t:0.36},
      {freq:880, t:0.9},  {freq:660, t:1.08}, {freq:880, t:1.26},
      {freq:880, t:1.8},  {freq:660, t:1.98}, {freq:880, t:2.16},
      {freq:880, t:2.7},  {freq:660, t:2.88}, {freq:880, t:3.06},
      {freq:880, t:3.6},  {freq:660, t:3.78}, {freq:880, t:3.96},
      {freq:1046,t:4.8},  {freq:1046,t:5.0},  {freq:1046,t:5.2}  // 3 hoge slottonen
    ];
    pattern.forEach(function(note){
      var osc = ac.createOscillator(), gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = note.freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.45, ac.currentTime + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + note.t + 0.16);
      osc.start(ac.currentTime + note.t);
      osc.stop(ac.currentTime + note.t + 0.2);
    });
  } catch(e){}

  // Visuele puls: blijft knipperen tot leerkracht op "Nieuwe timer" klikt
  var pop = document.getElementById('timer-popup');
  pop.style.border = '3px solid #dc2626';
  pop.style.boxShadow = '0 0 0 0 rgba(220,38,38,0.7)';
  var fc = 0;
  timerFlashInterval = setInterval(function(){
    fc++;
    pop.style.background = fc % 2 === 0 ? '#fff5f5' : '#fff';
    pop.style.border     = fc % 2 === 0 ? '3px solid #dc2626' : '3px solid #fca5a5';
  }, 600);
}

// Draggable + resizable
(function(){
  var el, ox, oy, ol, ot, dragging = false;
  var resizing = false, rx, rw;
  document.addEventListener('mousedown', function(e){
    el = document.getElementById('timer-popup');
    if(!el) return;
    var handle = document.getElementById('timer-drag-handle');
    var resizeH = document.getElementById('timer-resize');
    if(resizeH && e.target === resizeH){
      rx = e.clientX; rw = el.offsetWidth; resizing = true; e.preventDefault();
    } else if(handle && handle.contains(e.target) && e.target.tagName !== 'BUTTON'){
      var rect = el.getBoundingClientRect();
      ox=e.clientX; oy=e.clientY; ol=rect.left; ot=rect.top;
      dragging=true; e.preventDefault();
    }
  });
  document.addEventListener('mousemove', function(e){
    if(!el) return;
    if(dragging){ el.style.left=(ol+e.clientX-ox)+'px'; el.style.top=(ot+e.clientY-oy)+'px'; el.style.right='auto'; }
    if(resizing){
      var newW = Math.max(170, rw+(e.clientX-rx));
      el.style.width = newW + 'px';
      // Canvas mee schalen
      var canvas = document.getElementById('timer-clock');
      if(canvas && timerView !== 'digital'){
        var cSize = Math.min(newW * 0.42, 180);
        canvas.width = cSize; canvas.height = cSize;
        drawClock();
      }
    }
  });
  document.addEventListener('mouseup', function(){ dragging=false; resizing=false; });
})();
