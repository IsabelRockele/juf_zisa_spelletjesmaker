(() => {
  const el=id=>document.getElementById(id);
  let vakken=Array(20).fill(null),wegBollen=[],geschiedenis=[],tip=0,sleep=null;
  const isMin=()=>el('vrij-bewerking').value==='min';
  const toestand=()=>({vakken:vakken.slice(),wegBollen:wegBollen.slice()});
  const tips={
    plus:['Kijk naar het eerste getal in je boek. Leg zoveel blauwe stippen.','Kijk naar het tweede getal. Leg zoveel rode stippen erbij. Vul eerst het eerste tienraam tot 10.','Hoeveel rode stippen gebruikte je om 10 te maken? Hoeveel kwamen daarna? Schrijf die splitsing in je boek.','Tel wat er samen ligt. Schrijf de tussenstappen en het antwoord in je boek.'],
    min:['Kijk naar het eerste getal in je boek. Leg zoveel blauwe stippen.','Kijk hoeveel je moet wegnemen. Haal eerst stippen weg tot er 10 overblijven.','Hoeveel nam je eerst weg? Hoeveel moet je nog wegnemen? Schrijf die splitsing in je boek.','Neem de rest weg. Tel wat overblijft en schrijf je tussenstappen en antwoord in je boek.']
  };
  function wijzig(fn){const vorig=toestand();fn();if(JSON.stringify(vorig)!==JSON.stringify(toestand())){geschiedenis.push(vorig);if(geschiedenis.length>100)geschiedenis.shift();}render();}
  function neemWeg(i){if(!vakken[i])return;wijzig(()=>{if(isMin())wegBollen.push(vakken[i]);vakken[i]=null;});}
  function leg(kleur,plek=vakken.indexOf(null)){
    if(isMin()&&kleur==='rood')return;
    if(plek<0){el('vrij-melding').textContent='De twee tienramen zijn vol. Neem eerst een stip weg.';return;}
    if(vakken[plek])return;
    wijzig(()=>{vakken[plek]=kleur;if(wegBollen.length>0){const index=wegBollen.lastIndexOf(kleur);wegBollen.splice(index<0?wegBollen.length-1:index,1);}});
  }
  function render(){
    el('vrij-weg').hidden=!isMin();
    el('vrij-sleeptip').textContent=isMin()?'Sleep bollen naar het raam. Sleep ze weg naar het weglegvak.':'Sleep bollen naar het raam. Een bol te veel? Sleep hem terug naar de voorraad.';
    document.querySelector('.vrij-bron[data-kleur="rood"]').hidden=isMin();
    el('vrij-melding').textContent='';el('vrij-ramen').replaceChildren();
    for(let r=0;r<2;r++){
      const raam=document.createElement('div');raam.className='tienraam';raam.setAttribute('aria-label','Tienraam '+(r+1));
      for(let j=0;j<10;j++){
        const i=r*10+j,cel=document.createElement('div');cel.className='cel';cel.dataset.plek=i;
        if(vakken[i]){const s=document.createElement('button');s.className='stip vrij-stip'+(vakken[i]==='rood'?' rood':'');s.dataset.plek=i;s.setAttribute('aria-label',`Sleep ${vakken[i]==='rood'?'rode':'blauwe'} stip weg`);cel.append(s);}
        raam.append(cel);
      }el('vrij-ramen').append(raam);
    }
    el('vrij-terug').disabled=!geschiedenis.length;
    el('vrij-weg-bollen').replaceChildren();
    wegBollen.forEach(kleur=>{const bol=document.createElement('span');bol.className='stip'+(kleur==='rood'?' rood':'');bol.setAttribute('aria-hidden','true');el('vrij-weg-bollen').append(bol);});
    el('vrij-weg-aantal').textContent=wegBollen.length?`${wegBollen.length} weggelegd`:'';
    const weggenomen=wegBollen.length;
    const blauw=vakken.filter(k=>k==='blauw').length,rood=vakken.filter(k=>k==='rood').length;
    el('vrij-weg-som').textContent=wegBollen.length?`${blauw+rood+wegBollen.length} − ${wegBollen.length} = …`:'';
    const som=el('vrij-som');som.replaceChildren();
    if(blauw+rood+weggenomen===0){const p=document.createElement('p');p.textContent='Leg stippen. Dan verschijnt jouw som.';som.append(p);}
    else {
      const optelling=weggenomen===0&&blauw>0&&rood>0;
      const zin=document.createElement('p');zin.textContent=weggenomen||optelling?'Staat deze som ook in je boek?':'Dit heb je gelegd.';som.append(zin);
      const regel=document.createElement('div');regel.className='vrij-somregel';
      const termen=weggenomen?[blauw+rood+weggenomen,'−',weggenomen,'=','…']:optelling?[blauw,'+',rood,'=','…']:[blauw+rood];
      termen.forEach((tekst,i)=>{const span=document.createElement('span');span.textContent=tekst;if(optelling&&(i===0||i===2))span.className=i===0?'som-blauw':'som-rood';regel.append(span);});som.append(regel);
    }
  }

  el('vrij-leeg').addEventListener('click',()=>{wijzig(()=>{vakken.fill(null);wegBollen=[];});tip=0;toonTip();});
  el('vrij-terug').addEventListener('click',()=>{if(geschiedenis.length){const vorig=geschiedenis.pop();vakken=vorig.vakken;wegBollen=vorig.wegBollen;render();}});
  function toonTip(){el('vrij-hint').textContent=tips[el('vrij-bewerking').value][tip];el('vrij-hulp-volgende').disabled=tip===3;}
  el('vrij-hulp-volgende').addEventListener('click',()=>{tip=Math.min(3,tip+1);toonTip();});
  el('vrij-hulp-opnieuw').addEventListener('click',()=>{tip=0;toonTip();});
  el('vrij-bewerking').addEventListener('change',()=>{tip=0;wegBollen=[];geschiedenis=[];if(isMin())vakken=vakken.map(k=>k?'blauw':null);render();toonTip();});
  el('alleen-les').addEventListener('pointerdown',e=>{
    const target=e.target.closest('.vrij-bron,.vrij-stip');if(!target)return;
    sleep={target,id:e.pointerId,x:e.clientX,y:e.clientY,ghost:null,bron:target.classList.contains('vrij-bron'),plek:Number(target.dataset.plek),kleur:target.dataset.kleur};target.setPointerCapture(e.pointerId);
  });
  el('alleen-les').addEventListener('pointermove',e=>{
    if(!sleep||sleep.id!==e.pointerId)return;
    if(!sleep.ghost&&Math.hypot(e.clientX-sleep.x,e.clientY-sleep.y)>8){const kleur=sleep.bron?sleep.kleur:vakken[sleep.plek];sleep.ghost=document.createElement('span');sleep.ghost.className='stip sleepstip'+(kleur==='rood'?' rood':'');document.body.append(sleep.ghost);}
    if(sleep.ghost){sleep.ghost.style.left=e.clientX-19+'px';sleep.ghost.style.top=e.clientY-19+'px';}
  });
  el('alleen-les').addEventListener('pointerup',e=>{
    if(!sleep)return;const s=sleep;sleep=null;if(!s.ghost)return;s.ghost.remove();
    const hit=document.elementFromPoint(e.clientX,e.clientY),cel=hit?.closest('#vrij-ramen .cel');
    if(cel){const naar=Number(cel.dataset.plek);if(!vakken[naar]){if(s.bron)leg(s.kleur,naar);else wijzig(()=>{vakken[naar]=vakken[s.plek];vakken[s.plek]=null;});}}
    else if(!s.bron&&(isMin()?hit?.closest('#vrij-weg'):hit?.closest('.vrij-bron')))neemWeg(s.plek);
  });
  el('alleen-les').addEventListener('pointercancel',()=>{sleep?.ghost?.remove();sleep=null;});
  el('vrij-help-open').addEventListener('click',()=>el('vrij-hulp').showModal());
  el('vrij-help-sluit').addEventListener('click',()=>el('vrij-hulp').close());
  render();toonTip();
})();
