document.addEventListener('DOMContentLoaded',()=>{
  const modal=document.createElement('div');
  modal.className='ontdek-demo-modal';
  modal.innerHTML='<div class="ontdek-demo-card"><h2>Je hebt een volledige ronde gespeeld!</h2><p>In Ontdek kun je één zin helemaal uitspelen, zonder tijdslimiet. Met PRO speel je meerdere zinnen na elkaar.</p><div class="ontdek-demo-actions"><a href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">Bekijk PRO</a><button type="button">Sluiten</button></div></div>';
  document.body.appendChild(modal);
  document.addEventListener('click',event=>{
    if(!event.target.closest('#nextBtn,#nextInlineBtn'))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    modal.classList.add('open');
  },true);
  modal.querySelector('button').addEventListener('click',()=>modal.classList.remove('open'));
});
