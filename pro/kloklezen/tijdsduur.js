'use strict';
const Tijdsduur = (() => {
  const activiteiten = [
    {prent:'zandkasteel',vraag:'Een groot zandkasteel bouwen',antwoord:'lang'},
    {prent:'schoenveter',vraag:'Een schoenveter strikken',antwoord:'kort'},
    {prent:'deur',vraag:'Een deur met de sleutel openen',antwoord:'kort'},
    {prent:'slapen',vraag:'Een hele nacht slapen',antwoord:'lang'},
    {prent:'jas',vraag:'Een jas aandoen',antwoord:'kort'},
    {prent:'licht',vraag:'Het licht aandoen',antwoord:'kort'},
    {prent:'potlood',vraag:'Een potlood slijpen',antwoord:'kort'},
    {prent:'neus',vraag:'Je neus snuiten',antwoord:'kort'},
    {prent:'film',vraag:'Een film kijken',antwoord:'lang'},
    {prent:'voetbal',vraag:'Een voetbalwedstrijd spelen',antwoord:'lang'},
    {prent:'boswandeling',vraag:'Een wandeling in het bos maken',antwoord:'lang'}
  ];
  const opdracht = 'Kruis aan of de activiteit kort of lang duurt.';
  const images = {};
  let laden;
  function laad() {
    return laden ||= Promise.all(activiteiten.map(({prent})=>new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>{images[prent]=img;resolve();};
      img.onerror=()=>reject(new Error('Prent kon niet laden. Probeer opnieuw.'));
      img.src='../kalender/afbeeldingen/tijdsbesef/'+prent+'.png';
    }))).catch(e=>{laden=null;throw e;});
  }
  function maak(aantal=4,bestaande=[]) {
    const gebruikt=new Set(bestaande.map(v=>v.prent));
    const schud=lijst=>lijst.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
    const vragen=schud(activiteiten.filter(v=>!gebruikt.has(v.prent)));
    while(vragen.length<aantal)vragen.push(...schud(activiteiten));
    return {type:'tijdsduur',vragen:vragen.slice(0,aantal).map(v=>({...v}))};
  }
  function canvas(v,antwoord=false) {
    const c=document.createElement('canvas');c.width=800;c.height=560;
    const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,800,560);
    x.strokeStyle='#b8cfdd';x.lineWidth=2;x.strokeRect(3,3,794,554);
    const im=images[v.prent];if(im){const k=Math.min(640/im.width,340/im.height);x.drawImage(im,400-im.width*k/2,15+(340-im.height*k)/2,im.width*k,im.height*k);}
    x.fillStyle='#222';x.textAlign='center';x.font='29px Arial';x.fillText(v.vraag,400,398);
    for(const [i,label]of ['kort','lang'].entries()){
      const px=210+i*270;x.strokeStyle='#222';x.lineWidth=2;x.strokeRect(px,455,30,30);
      x.fillStyle='#222';x.font='32px Arial';x.fillText(label,px+94,481);
      if(antwoord&&v.antwoord===label){x.fillStyle='#087daf';x.font='39px Arial';x.fillText('×',px+15,483);}
    }
    return c;
  }
  function preview(container,inst,wijzig) {
    const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px';
    inst.vragen.forEach((v,i)=>{
      const card=document.createElement('div');card.style.position='relative';
      const c=canvas(v);c.style.cssText='width:100%;height:auto';card.append(c);
      if(wijzig&&inst.vragen.length>1){const b=document.createElement('button');b.textContent='×';b.title='Verwijder deze situatie';b.style.cssText='position:absolute;right:5px;top:5px';b.onclick=()=>{inst.vragen.splice(i,1);wijzig();};card.append(b);}
      grid.append(card);
    });container.append(grid);
  }
  function pdf(doc,inst,y,margin,volgendePagina,antwoord=false) {
    const w=(doc.internal.pageSize.getWidth()-2*margin-5)/2,h=w*.7;
    for(let i=0;i<inst.vragen.length;i+=2){
      if(y+h>doc.internal.pageSize.getHeight()-margin-5)y=volgendePagina();
      inst.vragen.slice(i,i+2).forEach((v,j)=>doc.addImage(canvas(v,antwoord).toDataURL('image/png'),'PNG',margin+j*(w+5),y,w,h,undefined,'FAST'));
      y+=h+5;
    }return y;
  }
  function leesInstellingen(){return maak(+document.getElementById('duurAantal').value);}
  document.addEventListener('DOMContentLoaded',()=>{
    const stijl=document.createElement('style');stijl.textContent='#tab-tijdsduur label{display:block;font-weight:600}#tab-tijdsduur select,#tab-tijdsduur textarea{display:block;width:100%;box-sizing:border-box;margin-top:10px;padding:10px;border:1px solid #ccdcf1;border-radius:8px;font:inherit}#tab-tijdsduur .kaart-titel{font-weight:700}.tab-tijdsduur{background:#ffe0b2}';document.head.append(stijl);
    const tab=document.createElement('div');tab.className='sidebar-tab tab-tijdsduur';tab.textContent='Besef tijdsduur';tab.title='Schat in of een activiteit kort of lang duurt.';tab.onclick=()=>toonTab('tijdsduur',tab);
    document.querySelector('#sidebarTabs .tab-klok').after(tab);
    const panel=document.createElement('div');panel.id='tab-tijdsduur';panel.className='sidebar-content';
    panel.innerHTML='<div class="config-kaart"><div class="kaart-titel">Kort of lang?</div><p>De leerling bekijkt de prent en kruist aan of de activiteit kort of lang duurt.</p><img src="../kalender/afbeeldingen/tijdsbesef/jas.png" alt="Een jas aandoen: een korte activiteit" style="width:45%"><img src="../kalender/afbeeldingen/tijdsbesef/boswandeling.png" alt="Een boswandeling maken: een lange activiteit" style="width:45%"></div><div class="config-kaart"><label>Aantal oefeningen <select id="duurAantal"><option>2</option><option selected>4</option><option>6</option><option>8</option></select></label></div><div class="config-kaart"><label>Opdrachtzin<textarea id="duurOpdracht" rows="3"></textarea></label></div><p id="duurStatus" role="status"></p><button id="duurToevoegen" class="genereer-knop">+ Voeg toe aan bundel</button>';
    document.querySelector('.sidebar').append(panel);document.getElementById('duurOpdracht').value=opdracht;
    document.getElementById('duurToevoegen').onclick=async()=>{
      const b=document.getElementById('duurToevoegen'),s=document.getElementById('duurStatus');b.disabled=true;s.textContent='Prenten laden…';
      try{await laad();Bundel.voegToe(leesInstellingen(),document.getElementById('duurOpdracht').value);s.textContent='Toegevoegd aan de bundel.';}catch(e){s.textContent=e.message;}finally{b.disabled=false;}
    };
  });
  return {maak,laad,canvas,preview,pdf,leesInstellingen,opdracht};
})();
