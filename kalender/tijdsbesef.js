'use strict';
const Tijdsbesef = (() => {
  const dagen = ['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'];
  const prenten = ['maan','dino','hond','onweer','vrienden','zaag','zon'];
  const activiteiten = [
    {prent:'zandkasteel', vraag:'Een groot zandkasteel bouwen', antwoord:'lang'},
    {prent:'schoenveter', vraag:'Een schoenveter strikken', antwoord:'kort'},
    {prent:'deur', vraag:'Een deur met de sleutel openen', antwoord:'kort'},
    {prent:'slapen', vraag:'Een hele nacht slapen', antwoord:'lang'}
  ];
  const namen = {cirkel:'Weekcirkel',nachten:'Hoeveel keer slapen?',verhalen:'Verhaaltjes over dagen',duur:'Kort of lang?'};
  const opdrachten = {cirkel:'Hoeveel keer slapen? Teken de pijlen en vul in.',nachten:'Hoeveel keer slapen? Vul in.',verhalen:'Lees en los op.',duur:'Kruis aan of de activiteit kort of lang duurt.'};
  const images = {};
  let laden;
  function laad() {
    return laden ||= Promise.all([...prenten,...activiteiten.map(a=>a.prent)].map(naam => new Promise((resolve,reject) => {
      const img = new Image(); img.onload=()=>{images[naam]=img;resolve();};
      img.onerror=()=>reject(new Error('Prent kon niet laden: '+naam)); img.src='afbeeldingen/tijdsbesef/'+naam+'.png';
    }))).catch(e=>{laden=null;throw e;});
  }
  const mod = n => (n%7+7)%7;
  const nachten = n => `${n} ${n===1?'nacht':'nachten'}`;
  function maak(variant,aantal=4,bestaande=[]) {
    const vragen=[];
    const paren=shuffleArr(Array.from({length:42},(_,i)=>({van:Math.floor(i/6),stappen:i%6+1})));
    const sleutel=v=>[v.van,v.tot??mod(v.van+v.stappen)].sort((a,b)=>a-b).join('-');
    const gebruikt=new Set(bestaande.map(sleutel));
    for(let i=0;i<aantal;i++) {
      const vorige=vragen.at(-1)||bestaande.at(-1);
      const anders=p=>!vorige||(p.van!==vorige.van&&mod(p.van+p.stappen)!==vorige.tot&&p.stappen!==vorige.stappen);
      const p=paren.find(p=>!gebruikt.has(sleutel(p))&&anders(p))||paren.find(p=>!gebruikt.has(sleutel(p)))||paren.find(p=>anders(p)&&sleutel(p)!==sleutel(vorige))||paren[i%42];
      gebruikt.add(sleutel(p));
      const {van,stappen}=p, tot=mod(van+stappen);
      let v={van,tot,stappen,prent:prenten[tot],vraag:`Van ${dagen[van]} tot ${dagen[tot]}`,antwoord:nachten(stappen)};
      if(variant==='duur') v={...shuffleArr(activiteiten)[0]};
      if(variant==='verhalen') {
        const soort=i%4;
        if(soort===0) v={...v,prent:'slapen',vraag:`Op ${dagen[van]} ga je logeren. Op ${dagen[tot]} kom je weer thuis. Hoeveel nachten blijf je slapen?`};
        if(soort===1) v={...v,prent:'zandkasteel',vraag:`Het is ${dagen[van]}. Over ${nachten(stappen)} ga je naar zee. Welke dag is dat?`,antwoord:dagen[tot]};
        if(soort===2) v={...v,prent:'vrienden',vraag:`Het is ${dagen[van]}. Volgende week ${dagen[tot]} komen je vrienden spelen. Hoeveel nachten moet je nog slapen?`,antwoord:nachten(7-van+tot)};
        if(soort===3) v={...v,prent:'onweer',vraag:`Het is ${dagen[van]}. ${nachten(stappen)} geleden was er onweer. Welke dag was dat?`,antwoord:dagen[mod(van-stappen)]};
      }
      vragen.push(v);
    }
    if(variant==='duur') {
      const lijst=[]; while(lijst.length<aantal) lijst.push(...shuffleArr(activiteiten));
      vragen.splice(0,vragen.length,...lijst.slice(0,aantal).map(a=>({...a})));
    }
    return {type:'tijdsbesef',variant,vragen};
  }
  function canvas(inst,v,antwoord=false) {
    const c=document.createElement('canvas'); c.width=800; c.height=inst.variant==='cirkel'?740:inst.variant==='verhalen'?210:560;
    const x=c.getContext('2d'); x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
    x.strokeStyle='#b8cfdd';x.lineWidth=2;x.strokeRect(3,3,c.width-6,c.height-6);
    function tekst(s,px,py,size=28,color='#222'){x.font=`${size}px Arial`;x.fillStyle=color;x.textAlign='center';x.fillText(s,px,py);}
    function prent(naam,px,py,w,h) {const im=images[naam];if(!im)return;const k=Math.min(w/im.width,h/im.height);x.drawImage(im,px+(w-im.width*k)/2,py+(h-im.height*k)/2,im.width*k,im.height*k);}
    function schrijflijn(links,y,breedte,tussenruimte=16,lettergrootte=28) {
      const aantal=String(v.antwoord).match(/^(\d+)\s+(nacht(?:en)?|dag(?:en)?)$/);
      const lijnBreedte=aantal?100:breedte;
      x.strokeStyle='#333';x.lineWidth=.65;x.beginPath();
      for(const hoogte of [y-tussenruimte,y]){x.moveTo(links,hoogte);x.lineTo(links+lijnBreedte,hoogte);}x.stroke();
      if(aantal){const eenheidGrootte=inst.variant==='verhalen'?20:inst.variant==='nachten'?30:28;x.textAlign='left';x.font=`${eenheidGrootte}px Arial`;x.fillStyle='#222';x.fillText(antwoord?aantal[2]:aantal[2].startsWith('nacht')?'nachten':'dagen',links+lijnBreedte+18,y);}
      if(antwoord){x.textAlign='left';x.font=`${lettergrootte}px Arial`;x.fillStyle='#087daf';x.fillText(aantal?aantal[1]:v.antwoord,links+5,y-1);}
    }
    if(inst.variant==='cirkel') {
      // A clockwise week arrow starts at Monday and returns to Monday.
      const einde=-Math.PI/2+2*Math.PI-.43;
      x.strokeStyle='#89aec7';x.lineWidth=8;x.beginPath();x.arc(400,330,225,-Math.PI/2+.43,einde);x.stroke();
      const ex=400+225*Math.cos(einde),ey=330+225*Math.sin(einde);
      x.fillStyle='#89aec7';x.beginPath();x.moveTo(ex,ey);x.lineTo(ex+31*Math.sin(einde)+17*Math.cos(einde),ey-31*Math.cos(einde)+17*Math.sin(einde));x.lineTo(ex+31*Math.sin(einde)-17*Math.cos(einde),ey-31*Math.cos(einde)-17*Math.sin(einde));x.fill();
      for(let i=0;i<7;i++) {const a=-Math.PI/2+i*2*Math.PI/7,px=400+Math.cos(a)*225,py=330+Math.sin(a)*225;
        prent(prenten[i],px-32,py-87,64,60);
        x.fillStyle='#fff';x.strokeStyle='#9abacf';x.lineWidth=1.5;x.beginPath();x.roundRect(px-88,py-22,176,44,5);x.fill();x.stroke();
        tekst(dagen[i],px,py+9,28);
        if(i===v.van||i===v.tot){x.fillStyle=i===v.van?'#167ea0':'#ef8338';x.beginPath();x.arc(px+87,py-24,13,0,7);x.fill();}
      }
      if(antwoord) for(let j=0;j<v.stappen;j++){const a=-Math.PI/2+(v.van+j)*2*Math.PI/7,b=a+2*Math.PI/7;
        x.strokeStyle='#087daf';x.lineWidth=4;x.beginPath();x.arc(400,330,125,a+.05,b-.08);x.stroke();
        const a2=b-.08,px=400+125*Math.cos(a2),py=330+125*Math.sin(a2);x.fillStyle='#087daf';x.beginPath();x.moveTo(px,py);x.lineTo(px+17*Math.sin(a2)+7*Math.cos(a2),py-17*Math.cos(a2)+7*Math.sin(a2));x.lineTo(px+17*Math.sin(a2)-7*Math.cos(a2),py-17*Math.cos(a2)-7*Math.sin(a2));x.fill();
      }
      tekst(v.vraag,400,625);tekst('Van de blauwe stip naar de oranje stip.',400,660,22);
      tekst('→',250,709,32);schrijflijn(300,713,320,25,36);
    } else if(inst.variant==='nachten') {
      prent(prenten[v.van],70,45,240,260);prent(prenten[v.tot],490,45,240,260);
      tekst('→',400,205,70,'#ed8238');tekst(dagen[v.van],190,355,34);tekst(dagen[v.tot],610,355,34);
      tekst('Hoeveel nachten?',400,420,30);schrijflijn(285,485,330,25,36);
    } else if(inst.variant==='duur') {
      prent(v.prent,80,15,640,340);tekst(v.vraag,400,398,29);
      for(const [i,label] of ['kort','lang'].entries()){const px=210+i*270;x.strokeStyle='#222';x.lineWidth=2;x.strokeRect(px,455,30,30);tekst(label,px+94,481,32);if(antwoord&&v.antwoord===label)tekst('×',px+15,483,39,'#087daf');}
    } else {
      prent(v.prent,18,22,170,160);x.textAlign='left';x.fillStyle='#222';x.font='20px Arial';
      let line='',y=52;for(const word of v.vraag.split(' ')){const test=line+word+' ';if(x.measureText(test).width>550&&line){x.fillText(line,220,y);line=word+' ';y+=29;}else line=test;}x.fillText(line,220,y);
      schrijflijn(220,y+54,550);
    }
    return c;
  }
  function preview(container,inst) {
    container.replaceChildren();
    const controls=document.createElement('div'); controls.className='tijdsbesef-acties';
    const vernieuw=document.createElement('button');vernieuw.textContent='Vernieuwen';vernieuw.onclick=()=>{inst.vragen=maak(inst.variant,inst.vragen.length).vragen;preview(container,inst);};
    const voeg=document.createElement('button');voeg.textContent='+ Oefening';voeg.onclick=()=>{inst.vragen.push(maak(inst.variant,1,inst.vragen).vragen[0]);preview(container,inst);};controls.append(vernieuw,voeg);container.append(controls);
    const grid=document.createElement('div');grid.className='tijdsbesef-raster '+(inst.variant==='verhalen'?'breed':'');
    inst.vragen.forEach((v,i)=>{const card=document.createElement('div');card.className='tijdsbesef-oefening';card.append(canvas(inst,v));const b=document.createElement('button');b.textContent='×';b.title='Verwijder deze oefening';b.onclick=()=>{inst.vragen.splice(i,1);preview(container,inst);};card.append(b);grid.append(card);});container.append(grid);
  }
  function pdf(doc,inst,y,margin,pageW,pageH,antwoord=false) {
    const cols=inst.variant==='verhalen'?1:2,gap=5,w=(pageW-2*margin-gap*(cols-1))/cols;
    for(let i=0;i<inst.vragen.length;i+=cols){const row=inst.vragen.slice(i,i+cols).map(v=>canvas(inst,v,antwoord)),h=row[0].height/row[0].width*w;
      if(y+h>pageH-margin-8){doc.addPage();y=18;}
      row.forEach((c,j)=>doc.addImage(c.toDataURL('image/png'),'PNG',margin+j*(w+gap),y,w,h,undefined,'FAST'));y+=h+gap;
    }return y;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const tab=document.createElement('div');tab.className='sidebar-tab';tab.textContent='🌙 Tijdsbesef';tab.onclick=()=>toonTab('tijdsbesef',tab);document.querySelector('#sidebarTabs .tab-dagen').after(tab);
    const panel=document.createElement('div');panel.id='tab-tijdsbesef';panel.className='sidebar-content';
    panel.innerHTML='<div class="config-kaart"><div class="kaart-titel">Dagen en tijdsduur</div><p>Kies een oefening. De prenten helpen bij het lezen.</p><div class="tijdsbesef-keuzes"></div></div><div class="config-kaart"><label>Aantal oefeningen <select id="tijdAantal"><option>2</option><option selected>4</option><option>6</option><option>8</option></select></label></div><div class="config-kaart"><label>Opdrachtzin<textarea id="tijdOpdracht" rows="3"></textarea></label></div><div id="tijdVoorbeeld"></div><p id="tijdStatus" role="status"></p><button id="tijdToevoegen" class="genereer-knop">+ Voeg toe aan bundel</button>';
    document.querySelector('.sidebar').append(panel);
    let variant='cirkel';
    function kies(k){variant=k;panel.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.variant===k));document.getElementById('tijdOpdracht').value=opdrachten[k];}
    for(const [k,label] of Object.entries(namen)){const b=document.createElement('button');b.type='button';b.dataset.variant=k;b.innerHTML=`<img src="afbeeldingen/tijdsbesef/${k==='duur'?'schoenveter':k==='verhalen'?'slapen':k==='nachten'?'dino':'maan'}.png" alt=""><span>${label}</span><small>${k==='cirkel'?'Dagen in een kring, teken de sprongen':k==='nachten'?'Van de ene weekdag naar de andere':k==='verhalen'?'Vooruit, terug en volgende week':'Activiteiten vergelijken'}</small>`;b.onclick=()=>kies(k);panel.querySelector('.tijdsbesef-keuzes').append(b);}
    kies(variant);
    document.getElementById('tijdToevoegen').onclick=async()=>{const b=document.getElementById('tijdToevoegen'),s=document.getElementById('tijdStatus');b.disabled=true;s.textContent='Prenten laden…';try{await laad();Bundel.voegToe(maak(variant,+document.getElementById('tijdAantal').value),document.getElementById('tijdOpdracht').value);s.textContent='Toegevoegd aan de bundel.';}catch(e){s.textContent=e.message+' Probeer opnieuw.';}finally{b.disabled=false;}};
  });
  return {maak,laad,canvas,preview,pdf};
})();
