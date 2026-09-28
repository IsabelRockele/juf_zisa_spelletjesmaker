(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const activities=[
    {title:'Je jas aandoen',art:'jas',answer:'short',explanation:'Kort. Je jas aandoen duurt meestal maar even.'},
    {title:'Een wandeling in het bos maken',art:'bos',answer:'long',explanation:'Lang. Tijdens een boswandeling ben je een hele tijd op pad.'},
    {title:'Je neus snuiten',art:'neus',answer:'short',explanation:'Kort. Je neus snuiten is meestal snel klaar.'},
    {title:'Een hele nacht slapen',art:'nacht',answer:'long',explanation:'Lang. Een hele nacht slapen duurt vele uren.'}
  ];
  let index=0,selected=null,revealed=false;
  function render(){const activity=activities[index];$('duration-index').textContent=`Activiteit ${index+1} van ${activities.length}`;$('duration-title').textContent=activity.title;$('duration-picture').innerHTML=`<img src="assets/wiskanjers/les21/${activity.art}.png" alt="${activity.title}" width="1448" height="1086">`;$('choose-short').setAttribute('aria-pressed',String(selected==='short'));$('choose-long').setAttribute('aria-pressed',String(selected==='long'));$('duration-feedback').textContent=revealed?activity.explanation:'';$('duration-reveal').textContent=revealed?'Verberg antwoord':'Toon antwoord';}
  function next(delta){index=(index+delta+activities.length)%activities.length;selected=null;revealed=false;render();}
  $('duration-prev').onclick=()=>next(-1);$('duration-next').onclick=()=>next(1);
  $('choose-short').onclick=()=>{selected='short';revealed=false;render();};$('choose-long').onclick=()=>{selected='long';revealed=false;render();};$('duration-reveal').onclick=()=>{revealed=!revealed;render();};render();
})();
