const TafelVoorbeelden = (() => {
  let frame;
  function ververs(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>App.verversTafelVoorbeelden());}
  function vergroot(soort){
    const host=document.getElementById('tafel-voorbeeld-groot');
    host.innerHTML=document.getElementById(`tafel-voorbeeld-${soort}`).innerHTML;
    host.querySelectorAll('.preview-blok-body').forEach(e=>{e.style.zoom='';e.style.width='';});
    document.getElementById('tafel-voorbeeld-dialog').showModal();
  }
  ['click','change','input'].forEach(event=>document.addEventListener(event,e=>{
    if(e.target.closest('#tab-tafels,#tab-tafels-inzicht,.sidebar-tab.tab-tafels,.sidebar-tab.tab-tafels-inzicht'))ververs();
  }));
  window.addEventListener('resize',ververs);
  ververs();
  return {vergroot};
})();
