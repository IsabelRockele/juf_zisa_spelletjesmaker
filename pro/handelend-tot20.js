(() => {
  const el=id=>document.getElementById(id);
  let a=9,b=5,min=false,gedaan=0,wegPosities=[];
  let hulp=0, gereedschap='',pad=null, penkleur='#006bb6';
  const zelf=()=>false;
  const deel=()=>min?a-10:10-a;
  const aantal=()=>a+(min?-gedaan:gedaan);
  function verplaats(plek){if(gedaan>=b)return;if(min){if(!Number.isInteger(plek)){plek=a-1;while(wegPosities.includes(plek))plek--;}if(plek<0||plek>=a||wegPosities.includes(plek))return;wegPosities.push(plek);}gedaan++;render();}
  function stip(kleur,label,actie,plek){const knop=document.createElement('button');knop.type='button';knop.className='stip '+kleur;knop.setAttribute('aria-label',label);if(Number.isInteger(plek))knop.dataset.plek=plek;if(actie)knop.addEventListener('click',()=>verplaats(plek));else knop.disabled=true;return knop;}
  function render(){
    el('a').textContent=a;el('b').textContent=b;el('op').textContent=min?'−':'+';el('teken').textContent=min?'−':'+';
    el('antwoord').textContent=zelf()&&hulp>=3?a+(min?-b:b):'___';
    el('deel1').textContent=zelf()&&hulp>=2?deel():'___';el('deel2').textContent=zelf()&&hulp>=3?b-deel():'___';
    el('ramen').replaceChildren();
    for(let r=0;r<2;r++){
      const raam=document.createElement('div');raam.className='tienraam';raam.style.gridAutoFlow=el('tienraam-structuur').value==='vijf'?'row':'column';raam.setAttribute('aria-label','Tienraam '+(r+1));
      for(let j=0;j<10;j++){
        const i=r*10+j,cel=document.createElement('div');cel.className='cel';
        if(min?i<a&&!wegPosities.includes(i):i<aantal())cel.append(stip(min?'zwart':i<a?'':'rood',min?'Neem deze stip weg':'Gelegde stip',min&&gedaan<b,i));
        raam.append(cel);
      }el('ramen').append(raam);
    }
    el('voorraad-titel').textContent=min?'Al weggenomen: '+gedaan:'Nog erbij';el('losse').replaceChildren();
    for(let i=0;i<(min?gedaan:b-gedaan);i++){
      if(min){const weg=document.createElement('span');weg.className='weg';weg.setAttribute('aria-label','Weggenomen stip');el('losse').append(weg);}
      else el('losse').append(stip('rood','Leg een stip erbij',true));
    }
    el('instructie').textContent=gedaan===b?(zelf()?'Het materiaal ligt klaar. Schrijf je berekening in je boek.':'Het materiaal ligt klaar. Schrijf samen de berekening op.'):gedaan<deel()?(min?'Neem eerst stippen weg tot er 10 overblijven.':'Vul eerst het eerste tienraam aan tot 10.'):(min?'Er zijn er 10. Neem nu de rest weg.':'Het eerste tienraam is vol. Leg nu de rest erbij.');
    el('stappen').replaceChildren();
    for(let i=0;i<2;i++){const s=document.createElement('div');s.className='schrijfregel';s.textContent=zelf()&&hulp>=i+2?(i===0?`${a} ${min?'−':'+'} ${deel()} = 10`:`10 ${min?'−':'+'} ${b-deel()} = ${a+(min?-b:b)}`):'';el('stappen').append(s);}
    el('penbalk').hidden=zelf();el('zelfhulp').hidden=!zelf();el('stap').hidden=zelf();
    el('hulp').textContent=hulp===0?'Geef een hint':hulp===1?'Help bij de eerste schrijf-stap':hulp===2?'Help bij de tweede schrijf-stap':'Alle schrijfhulp getoond';el('hulp').disabled=hulp>=3;
    el('stap').disabled=gedaan===b;el('terug').disabled=gedaan===0;
  }
  function start(x,y){a=x;b=y;gedaan=0;wegPosities=[];hulp=0;el('hint').textContent='';el('inkt').replaceChildren();el('eerste').value=a;el('tweede').value=b;el('fout').textContent='';render();}
  el('eigen').addEventListener('submit',e=>{e.preventDefault();const x=Number(el('eerste').value),y=Number(el('tweede').value);const geldig=Number.isInteger(x)&&Number.isInteger(y)&&y>=1&&y<=9&&(min?x>=11&&x<=18&&x-y>0&&x-y<10:x>=1&&x<=9&&x+y>10);if(!geldig){el('fout').textContent=min?'Kies een aftrekking zoals 13 − 5: vertrek tussen 11 en 18 en ga over 10 heen.':'Kies twee getallen van 1 tot 9 die samen meer dan 10 zijn, zoals 8 + 5.';return;}start(x,y);});
  el('bewerking').addEventListener('change',()=>{min=el('bewerking').value==='min';start(min?13:9,min?5:5);});
  el('nieuw').addEventListener('click',()=>{const pairs=[];for(let x=min?11:2;x<=(min?18:9);x++)for(let y=1;y<=9;y++)if((min?x-y>0&&x-y<10:x+y>10)&&(x!==a||y!==b))pairs.push([x,y]);start(...pairs[Math.floor(Math.random()*pairs.length)]);});
  el('tienraam-structuur').addEventListener('change',render);
  el('opnieuw').addEventListener('click',()=>start(a,b));
  el('stap').addEventListener('click',()=>{const doel=gedaan<deel()?deel():b;while(gedaan<doel)verplaats();});
  el('terug').addEventListener('click',()=>{if(min)wegPosities.pop();gedaan=Math.max(0,gedaan-1);hulp=Math.min(hulp,gedaan<deel()?1:2);el('hint').textContent='';render();});
  function kiesGebruik(alleen){
    kiesPen('');
    el('keuzescherm').hidden=true;el('keuze-terug').hidden=false;document.body.dataset.scherm=alleen?'alleen':'samen';el('schermtitel').textContent=alleen?'Alleen':'Samen met juf';
    el('bord-instellingen').hidden=alleen;el('bord-les').hidden=alleen;el('alleen-les').hidden=!alleen;el('fout').hidden=alleen;
    el('samen').setAttribute('aria-pressed',!alleen);el('alleen').setAttribute('aria-pressed',alleen);
  }
  el('keuze-terug').addEventListener('click',()=>{kiesPen('');document.body.dataset.scherm='keuze';el('schermtitel').textContent='Tot 20 met brug';for(const id of ['bord-instellingen','bord-les','alleen-les','fout','keuze-terug'])el(id).hidden=true;el('keuzescherm').hidden=false;el('samen').focus();});
  document.querySelectorAll('[data-select]').forEach(knop=>knop.addEventListener('click',()=>{const select=el(knop.dataset.select);if(select.value===knop.dataset.waarde)return;select.value=knop.dataset.waarde;select.dispatchEvent(new Event('change'));document.querySelectorAll('[data-select="'+knop.dataset.select+'"]').forEach(k=>k.setAttribute('aria-pressed',k===knop));}));
  el('samen').addEventListener('click',()=>kiesGebruik(false));
  el('alleen').addEventListener('click',()=>kiesGebruik(true));
  el('hulp').addEventListener('click',()=>{
    if(hulp===0){hulp=1;el('hint').textContent=min?`Hoeveel moet je van ${a} wegnemen om 10 over te houden? Bekijk het tweede tienraam.`:`Hoeveel stippen ontbreken er nog bij ${a} om 10 te maken? Bekijk de lege vakjes in het eerste tienraam.`;}
    else if(hulp===1){if(gedaan<deel()){el('hint').textContent='Leg eerst tot 10. Vraag daarna opnieuw schrijfhulp.';return;}hulp=2;el('hint').textContent=`Je gebruikte eerst ${deel()} van de ${b}. Schrijf ${deel()} onder het eerste splitsbeen. De eerste tussenstap staat op de eerste schrijflijn. Schrijf die in je boek.`;}
    else if(hulp===2){if(gedaan<b){el('hint').textContent=min?'Neem eerst de resterende stippen weg. Vraag daarna opnieuw schrijfhulp.':'Leg eerst de resterende stippen erbij. Vraag daarna opnieuw schrijfhulp.';return;}hulp=3;el('hint').textContent=`Er bleef nog ${b-deel()} over van de ${b}. Vul het tweede splitsbeen in. Bekijk de tweede tussenstap en schrijf je antwoord in je boek.`;}
    render();
  });
  el('verberg-hulp').addEventListener('click',()=>{hulp=0;el('hint').textContent='';render();});
  function kiesPen(tool){gereedschap=tool;el('inkt').style.pointerEvents=tool?'auto':'none';el('inkt').style.cursor=tool==='gum'?'cell':'crosshair';document.querySelectorAll('.penkleur').forEach(k=>k.setAttribute('aria-pressed',tool==='pen'&&k.dataset.kleur===penkleur));el('gum').setAttribute('aria-pressed',tool==='gum');}
  document.querySelectorAll('.penkleur').forEach(knop=>knop.addEventListener('click',()=>{
    penkleur=knop.dataset.kleur;
    kiesPen('pen');
  }));
  el('gum').addEventListener('click',()=>kiesPen(gereedschap==='gum'?'':'gum'));
  el('wis').addEventListener('click',()=>el('inkt').replaceChildren());
  const positie=e=>{const r=el('inkt').getBoundingClientRect();return [(e.clientX-r.left)*1000/r.width,(e.clientY-r.top)*300/r.height];};
  function gumBij(e){document.elementsFromPoint(e.clientX,e.clientY).filter(p=>p.parentElement===el('inkt')&&p.tagName.toLowerCase()==='path').forEach(p=>p.remove());}
  el('inkt').addEventListener('pointerdown',e=>{if(!gereedschap)return;e.preventDefault();el('inkt').setPointerCapture(e.pointerId);if(gereedschap==='gum'){gumBij(e);return;}pad=document.createElementNS('http://www.w3.org/2000/svg','path');pad.setAttribute('d','M '+positie(e).join(' '));pad.setAttribute('fill','none');pad.setAttribute('stroke',penkleur);pad.setAttribute('stroke-width','3');pad.setAttribute('stroke-linecap','round');pad.setAttribute('stroke-linejoin','round');el('inkt').append(pad);});
  el('inkt').addEventListener('pointermove',e=>{if(gereedschap==='gum'&&e.buttons){gumBij(e);return;}if(!pad)return;e.preventDefault();pad.setAttribute('d',pad.getAttribute('d')+' L '+positie(e).join(' '));});
  for(const type of ['pointerup','pointercancel'])el('inkt').addEventListener(type,()=>{pad=null;});
  el('volledig').addEventListener('click',async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();});
  // Pointerbediening werkt ook met een vinger op het bord; een tik blijft een gewone klik.
  let sleep=null;
  document.addEventListener('pointerdown',e=>{const target=e.target.closest('#bord-les .stip:not(:disabled)');if(!target)return;sleep={x:e.clientX,y:e.clientY,id:e.pointerId,target,ghost:null};target.setPointerCapture(e.pointerId);});
  document.addEventListener('pointermove',e=>{if(!sleep||e.pointerId!==sleep.id)return;if(!sleep.ghost&&Math.hypot(e.clientX-sleep.x,e.clientY-sleep.y)>8){sleep.ghost=sleep.target.cloneNode();sleep.ghost.classList.add('sleepstip');document.body.append(sleep.ghost);}if(sleep.ghost){sleep.ghost.style.left=(e.clientX-19)+'px';sleep.ghost.style.top=(e.clientY-19)+'px';}});
  document.addEventListener('pointerup',e=>{if(!sleep)return;const old=sleep;sleep=null;if(!old.ghost)return;old.ghost.remove();const zone=el(min?'losse':'ramen').getBoundingClientRect();const goed=e.clientX>=zone.left&&e.clientX<=zone.right&&e.clientY>=zone.top&&e.clientY<=zone.bottom;old.target.addEventListener('click',e=>e.stopImmediatePropagation(),{capture:true,once:true});if(goed)verplaats(old.target.dataset.plek===undefined?undefined:Number(old.target.dataset.plek));});
  document.addEventListener('pointercancel',()=>{sleep?.ghost?.remove();sleep=null;});
  render();
  if(new URLSearchParams(location.search).get('kid')==='1'){
    kiesGebruik(true);
    el('keuze-terug').hidden=true;
    const terug=document.querySelector('header a');
    terug.href='hulpschema-kid.html?kid=1';
    terug.textContent='← Kies bereik';
  }
})();
