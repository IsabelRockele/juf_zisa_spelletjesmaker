// Printed work belongs to the teacher area, not to the child's screen route.
missions.find(m=>m.id==='systemen').teacherOnly=true;
const renderWithoutPaperCards=render;
render=function(){
 renderWithoutPaperCards();grid.querySelector('[data-id="systemen"]')?.remove();
 const online=missions.filter(available).filter(m=>!m.teacherOnly),done=online.filter(m=>state.done.includes(m.id)).length;
 $('#starCount').textContent=done+' / '+online.length;$('#progressFill').style.width=(online.length?done/online.length*100:0)+'%';
};
const startWithoutPaperCards=startMission;
startMission=function(id){if(id==='systemen'){location.href='kaarten.html';return}startWithoutPaperCards(id)};
const cardsEntry=document.createElement('a');cardsEntry.className='quiet-button report-entry';cardsEntry.href='kaarten.html';cardsEntry.textContent='Slimme systemen: A5-opdrachtkaarten afdrukken';
document.querySelector('#teacherDialog .dialog-bar').after(cardsEntry);
const openTeacherWithoutScreenSystems=openTeacher;
openTeacher=function(){
 openTeacherWithoutScreenSystems();
 document.querySelectorAll('#teacherGoals [data-practice]').forEach(button=>{
  if(missions.find(m=>m.id==='systemen').tasks.some(t=>t.id===button.dataset.practice)){
   const link=document.createElement('a');link.href='kaarten.html';link.textContent='Open de afdrukbare A5-kaarten';button.replaceWith(link);
  }
 });
};
$('#teacherBtn').onclick=()=>openTeacher();
if(state.age)render();
