// The child URL contains activity choices only; assessment stays on the teacher's laptop.
const reportEntry=document.createElement('a');reportEntry.className='quiet-button report-entry';reportEntry.href='rapport.html';reportEntry.textContent='Observatieformulieren & QR';
document.querySelector('#teacherDialog .dialog-bar').after(reportEntry);
const updateReportEntry=()=>reportEntry.href='rapport.html'+(['6-7','7-8'].includes(state.age)?'?leeftijd='+state.age:'');
document.querySelector('#teacherBtn').addEventListener('click',updateReportEntry);
const routeParams=new URLSearchParams(location.search),routeAge=routeParams.get('leeftijd'),routeCount=Number(routeParams.get('perioden')),routePeriod=Number(routeParams.get('rapport'));
if(['6-7','7-8'].includes(routeAge)&&[3,4].includes(routeCount)&&Number.isInteger(routePeriod)&&routePeriod>=1&&routePeriod<=routeCount){
 const requestedIds=routeParams.get('doelen')?.split(',');
 const selected=(requestedIds?goalsForReport(routeAge).filter(g=>requestedIds.includes(g.id)):proposedReportGoals(routeAge,routeCount,routePeriod)).filter(g=>g.mission!=='systemen');
 const missionIds=new Set(selected.map(g=>g.mission));
 {
  const normalAvailable=available;available=m=>normalAvailable(m)&&missionIds.has(m.id);
  selectAge(routeAge);
  document.querySelector('#dashboardTitle').textContent='Jouw oefenronde '+routePeriod;
  document.body.classList.add('pupil-report-round');
  document.querySelector('#changeAge').hidden=true;
  document.querySelector('#teacherBtn').hidden=true;
  document.querySelector('.classroom-tools').hidden=true;
  const info=document.createElement('p');info.className='round-intro';info.textContent='Kies samen met je leerkracht een opdracht. Je hoeft niet in te loggen.';
  document.querySelector('#missionGrid').before(info);
  const tasks=document.createElement('section');tasks.className='round-targets';
  tasks.innerHTML='<h2>Dit gaan we doen</h2><div class="round-activities">'+selected.map(g=>`<article><img src="${missions.find(m=>m.id===g.mission).image}" alt=""><p>${escapeHtml(g.label)}</p><button data-round-say="${g.id}" aria-label="Lees de opdracht voor">${speakerIcon}</button><button data-round-goal="${g.id}">Start opdracht</button></article>`).join('')+'</div>';
  if(!selected.length)tasks.innerHTML='<p>Je leerkracht geeft je een papieren opdrachtkaart. Je mag Zisa sluiten en de echte app openen.</p>';
  tasks.querySelectorAll('[data-round-say]').forEach(b=>b.onclick=()=>speak(selected.find(g=>g.id===b.dataset.roundSay).label));
  tasks.querySelectorAll('[data-round-goal]').forEach(b=>b.onclick=()=>{
   const goal=selected.find(g=>g.id===b.dataset.roundGoal),mission=missions.find(m=>m.id===goal.mission),candidates=tasksFor(mission);
   let work;
   if(goal.id==='care')work=candidates.filter(t=>t.type==='observe'&&t.goals.includes('IT.044')).slice(0,1);
   else if(goal.id==='read-plan')work=candidates.filter(t=>t.type==='route').slice(0,3);
   else if(goal.id==='make-plan')work=routeAge==='7-8'?[debugRoute]:candidates.filter(t=>t.type==='route').slice(0,2);
   else if(goal.id==='filetype')work=candidates.filter(t=>t.type==='file-open');
   else if(goal.id==='save-file')work=candidates.filter(t=>t.type==='file-edit').slice(0,1);
   else if(goal.id==='delete-file')work=candidates.filter(t=>t.type==='file-delete');
   else work=candidates.filter(t=>t.type==='ipad-transfer');
   if(goal.id==='save-file'||goal.id==='delete-file'){
    const transfer=candidates.find(t=>t.type==='ipad-transfer');
    if(transfer)work.push({...transfer,id:'rapport-echte-ipad-'+goal.id,title:goal.id==='save-file'?'Bewaren en terugvinden':'Ruim de oefenmap op',brief:goal.label,prompt:goal.label,criteria:goal.look,steps:goal.id==='save-file'?transfer.steps.slice(0,3):['Open Bestanden en zoek de oefenmap die je leerkracht klaarzette.','Zoek de afgesproken oefenkopie proefklad. Controleer de naam en verwijder alleen die kopie.','Kijk of het andere werk nog in de map staat. Toon dit aan je leerkracht.']});
   }
   if(!work?.length)work=candidates;
   cleanupPractice();session={mission,tasks:work,index:0,correct:0,answered:false,singlePractice:true};
   document.querySelector('#missionTitle').textContent=mission.title;document.querySelector('#missionNumber').textContent='Oefenronde '+routePeriod+' · '+routeAge+' jaar';renderTask();dialog.showModal();
  });
  document.querySelector('#missionGrid').after(tasks);
 }
}else if(['6-7','7-8'].includes(routeAge)){
 selectAge(routeAge);const target=routeParams.get('missie');if(missions.some(m=>m.id===target&&available(m)))startMission(target);
}
