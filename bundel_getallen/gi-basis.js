/* Even/oneven en de concrete voorbereiding op breuken.
   Elke opdracht gebruikt de gedeelde titel-, verwijder- en PDF-afspraken. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
  const pick = a => a[rand(0,a.length-1)];
  const NS = 'http://www.w3.org/2000/svg';
  const types = {
    pairs: ['even','Maak twee groepen. Kleur het vakje groen bij even en oranje bij oneven.'],
    parity: ['even','Tel. Kleur het vakje groen bij even en oranje bij oneven.'],
    numbers: ['even','Kleur even getallen groen en oneven getallen oranje.'],
    axis: ['even','Vul de gevraagde getallen in op de getallenlijn.'],
    riddles: ['even','Lees het raadsel. Schrijf het juiste getal.'],
    whole: ['parts','Kleur telkens de hele figuur.'],
    equal: ['parts','Is het geheel in gelijke delen verdeeld? Kruis aan.'],
    divide: ['parts','Verdeel het geheel in het gevraagde aantal gelijke delen.'],
    count: ['parts','In hoeveel gelijke delen is het geheel verdeeld? Vul in.'],
    colorparts: ['parts','Kleur het gevraagde aantal gelijke delen.'],
    compare: ['parts','Vergelijk de delen van hetzelfde geheel. Kruis het juiste woord aan.'],
    halfshape: ['half','Verdeel de figuur in twee gelijke delen. Kleur één helft.'],
    halfamount: ['half','Kleur de helft van elk aantal. Vul aan.'],
    doubleshape: ['half','Teken op het rooster een figuur met het dubbele aantal vakjes.'],
    doubleamount: ['half','Teken het dubbele aantal. Vul aan.'],
    statements: ['half','Kruis alle juiste uitspraken aan.'],
    problems: ['half','Bereken de helft of het dubbel. Vul in.'],
    quartershape: ['quarter','Verdeel de figuur in vier gelijke delen. Kleur één kwart.'],
    quartercolor: ['quarter','Kleur bij elke figuur één kwart.'],
    quarterfind: ['quarter','Kruis de figuur aan waarvan precies één kwart gekleurd is.'],
    quarteramount: ['quarter','Omring een kwart van het aantal. Vul aan.'],
  };
  const labels = {
    pairs:'Twee groepen maken',parity:'Even of oneven bij afbeeldingen',numbers:'Getallenrooster kleuren',axis:'Getallenlijn aanvullen',riddles:'Getalraadsels',
    whole:'Het geheel kleuren',equal:'Gelijke of ongelijke delen',divide:'Zelf in gelijke delen verdelen',count:'Gelijke delen tellen',colorparts:'Gevraagde delen kleuren',compare:'Delen vergelijken',
    halfshape:'Een halve figuur',halfamount:'De helft van een hoeveelheid',doubleshape:'Het dubbel op een rooster',doubleamount:'Het dubbel van een hoeveelheid',statements:'Juiste uitspraken',problems:'Korte vraagjes',
    quartershape:'Zelf vier gelijke delen tekenen',quartercolor:'Een kwart kleuren',quarterfind:'Een kwart herkennen',quarteramount:'Een kwart van een hoeveelheid'
  };
  let serial = 0;
  const el = (tag, cls, text) => {const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  function svg(w=300,h=160){const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox',`0 0 ${w} ${h}`);s.setAttribute('width',w);s.setAttribute('height',h);return s;}
  function shape(s,tag,attrs){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));s.append(e);return e;}
  function colorable(e){e.dataset.color='true';e.addEventListener('click',()=>{if(e.closest('svg')?.dataset.drawing==='true')return;e.setAttribute('fill',e.getAttribute('fill')==='#86cfa0'?'white':'#86cfa0');});return e;}
  function text(s,x,y,t,size=16){const e=shape(s,'text',{x,y,'text-anchor':'middle','font-size':size,fill:'#243746','font-family':'Arial,sans-serif'});e.textContent=t;return e;}
  function dots(n){const s=svg(300,Math.max(96,Math.ceil(n/5)*31+18));for(let i=0;i<n;i++)colorable(shape(s,'circle',{cx:40+(i%5)*53,cy:23+Math.floor(i/5)*31,r:11,fill:'white',stroke:'#344d60','stroke-width':1.5}));return s;}
  function figure(kind,parts=1,unequal=false,filled=0){
    const s=svg(300,160), stroke='#344d60';
    if(kind==='circle'){
      if(parts===1)colorable(shape(s,'circle',{cx:150,cy:80,r:66,fill:filled?'#86cfa0':'white',stroke,'stroke-width':1.5}));
      else for(let i=0;i<parts;i++){
        const angles=unequal&&parts===2?[0,Math.PI*.65,Math.PI*2]:Array.from({length:parts+1},(_,j)=>j*2*Math.PI/parts);
        const a=angles[i]-Math.PI/2,b=angles[i+1]-Math.PI/2;
        const d=`M150 80 L${150+66*Math.cos(a)} ${80+66*Math.sin(a)} A66 66 0 ${b-a>Math.PI?1:0} 1 ${150+66*Math.cos(b)} ${80+66*Math.sin(b)} Z`;
        colorable(shape(s,'path',{d,fill:i<filled?'#86cfa0':'white',stroke,'stroke-width':1.5}));
      }
    }else if(kind==='triangle'){
      const paths=parts===4?['M150 14 L116 80 L184 80 Z','M116 80 L82 146 L150 146 Z','M184 80 L150 146 L218 146 Z','M116 80 L184 80 L150 146 Z']:parts===2?['M150 14 L82 146 L150 146 Z','M150 14 L150 146 L218 146 Z']:['M150 14 L82 146 L218 146 Z'];
      paths.forEach((d,i)=>colorable(shape(s,'path',{d,fill:i<filled?'#86cfa0':'white',stroke,'stroke-width':1.5})));
    }else{
      const fullWidth=kind==='square'?110:200;
      const widths=unequal&&parts===2?[fullWidth*.275,fullWidth*.725]:Array(parts).fill(fullWidth/parts);let x=150-fullWidth/2;
      widths.forEach((w,i)=>{colorable(shape(s,'rect',{x,y:25,width:w,height:110,fill:i<filled?'#86cfa0':'white',stroke,'stroke-width':1.5}));x+=w;});
    }
    return s;
  }
  // Rastereenheid 40 SVG-eenheden = 10 mm op papier. De PDF geeft de
  // werkelijke exportschaal door, onafhankelijk van de breedte van de preview.
  function divisionFigure(kind,parts,showParts=false){
    if(kind==='circle'){
      const s=figure(kind,showParts?parts:1);
      const marks=parts===3||parts===6?12:8;
      for(let i=0;i<marks;i++){
        const a=i*2*Math.PI/marks-Math.PI/2;
        shape(s,'line',{x1:150+61*Math.cos(a),y1:80+61*Math.sin(a),x2:150+66*Math.cos(a),y2:80+66*Math.sin(a),stroke:'#344d60','stroke-width':1,'data-guide':'tick','pointer-events':'none'});
      }
      return s;
    }
    if(kind==='triangle')return figure(kind,showParts?parts:1);
    const s=svg(320,240);s.classList.add('basis-cm-grid');s.dataset.gridStep='40';
    const width=kind==='square'?160:240,x=(320-width)/2,y=40,height=160;
    const columns=showParts?(parts===8?2:parts===6?3:parts===4?2:parts):1;
    const rows=showParts?parts/columns:1;
    for(let r=0;r<rows;r++)for(let c=0;c<columns;c++)colorable(shape(s,'rect',{x:x+c*width/columns,y:y+r*height/rows,width:width/columns,height:height/rows,fill:'white',stroke:'#344d60','stroke-width':1.5}));
    for(let gx=0;gx<=320;gx+=40)shape(s,'line',{x1:gx,y1:0,x2:gx,y2:240,stroke:'#9bbfd3','stroke-width':.7,'stroke-dasharray':'2 2','data-guide':'grid','pointer-events':'none'});
    for(let gy=0;gy<=240;gy+=40)shape(s,'line',{x1:0,y1:gy,x2:320,y2:gy,stroke:'#9bbfd3','stroke-width':.7,'stroke-dasharray':'2 2','data-guide':'grid','pointer-events':'none'});
    shape(s,'rect',{x,y,width,height,fill:'none',stroke:'#344d60','stroke-width':1.5,'pointer-events':'none'});
    return s;
  }
  function drawing(s,card){
    let path=null,points=[];
    const coords=e=>{const p=s.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(s.getScreenCTM().inverse());};
    s.dataset.drawing='true';
    s.addEventListener('pointerdown',e=>{if(s.dataset.drawing!=='true'||e.button!==0)return;e.preventDefault();s.setPointerCapture(e.pointerId);const p=coords(e);points=[p];path=shape(s,'path',{d:`M${p.x} ${p.y} l.1 .1`,fill:'none',stroke:'#2e6e9c','stroke-width':2.2,'stroke-linecap':'round','stroke-linejoin':'round','pointer-events':'none','data-ink':'true'});});
    s.addEventListener('pointermove',e=>{if(!path)return;const p=coords(e);points.push(p);path.setAttribute('d',points.map((q,i)=>`${i?'L':'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' '));});
    const stop=()=>{path=null;};s.addEventListener('pointerup',stop);s.addEventListener('pointercancel',stop);
    const bar=el('div','basis-tools');
    const mode=el('button','','Tekenen aan');mode.type='button';mode.onclick=()=>{s.dataset.drawing=s.dataset.drawing==='true'?'false':'true';mode.textContent=s.dataset.drawing==='true'?'Tekenen aan':'Kleuren aan';};
    const undo=el('button','','Stap terug');undo.type='button';undo.onclick=()=>s.querySelector('[data-ink]:last-of-type')?.remove();
    const reset=el('button','','Wis');reset.type='button';reset.onclick=()=>{s.querySelectorAll('[data-ink]').forEach(e=>e.remove());s.querySelectorAll('[data-color]').forEach(e=>e.setAttribute('fill','white'));};
    bar.append(mode,undo,reset);card.append(bar);
  }
  function answer(card,label,value,long=false){const row=el('div');if(label)row.append(document.createTextNode(label+' '));const input=el('input','basis-answer'+(long?' basis-long':''));input.type='text';input.setAttribute('aria-label',label||'Antwoord');input.dataset.antwoord=String(value);row.append(input);card.append(row);}
  function check(label){const row=el('div');const box=el('span','basis-check');box.setAttribute('role','checkbox');box.setAttribute('aria-checked','false');box.tabIndex=0;box.setAttribute('aria-label',label);const toggle=()=>{const on=box.getAttribute('aria-checked')!=='true';box.setAttribute('aria-checked',String(on));box.textContent=on?'×':'';};box.onclick=toggle;box.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle();}};row.append(box,document.createTextNode(label));return row;}
  function swatch(card){const p=el('p');p.append(document.createTextNode('Even of oneven: '));const b=el('span','basis-check');b.tabIndex=0;b.setAttribute('role','button');b.setAttribute('aria-label','Kies groen voor even of oranje voor oneven');let i=0;const cycle=()=>{i=(i+1)%3;b.style.backgroundColor=['white','#86cfa0','#ffbd7a'][i];};b.onclick=cycle;b.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();cycle();}};p.append(b);card.append(p);}
  function gridDrawing(n){const s=svg(620,160);for(let y=15;y<=135;y+=24)shape(s,'line',{x1:10,y1:y,x2:610,y2:y,stroke:'#b9d0df','stroke-dasharray':'2 3'});for(let x=10;x<=610;x+=24)shape(s,'line',{x1:x,y1:15,x2:x,y2:135,stroke:'#b9d0df','stroke-dasharray':'2 3'});for(let i=0;i<n;i++)shape(s,'rect',{x:34+(i%4)*24,y:39+Math.floor(i/4)*24,width:24,height:24,fill:'#b7e2f0',stroke:'#344d60'});text(s,255,76,'→',30);return s;}
  function cardFor(type,o,index){
    const card=el('div','basis-card row-delete-wrap keep-together');card.dataset.type=type;
    let n,parts,s,result;
    const kind=o.shape==='mix'?pick(['rect','square','circle','triangle']):o.shape;
    const validParts=kind==='triangle'?[2,4]:kind==='square'?[2,4,8]:[2,3,4,6,8];
    const partName=o.notation?'een kwart (¼)':'een kwart';
    const halfName=o.notation?'de helft (½)':'de helft';
    switch(type){
      case 'pairs': case 'parity':
        n=rand(1,20);s=dots(n);card.append(s);if(type==='pairs')drawing(s,card);swatch(card);result=n%2?'oneven':'even';break;
      case 'numbers':{
        card.classList.add('basis-wide');const grid=el('div','basis-number-grid');const pool=Array.from({length:o.max},(_,i)=>i+1);for(let i=pool.length-1;i>0;i--){const j=rand(0,i);[pool[i],pool[j]]=[pool[j],pool[i]];}
        pool.slice(0,20).forEach(v=>{const cell=el('span','',String(v));cell.tabIndex=0;cell.setAttribute('role','button');cell.setAttribute('aria-label',`${v}: kies groen of oranje`);let state=0;const cycle=()=>{state=(state+1)%3;cell.style.backgroundColor=['white','#86cfa0','#ffbd7a'][state];};cell.onclick=cycle;cell.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();cycle();}};grid.append(cell);});card.append(grid);break;
      }
      case 'axis':{
        card.classList.add('basis-wide');const length=pick([10,20]),start=rand(0,o.max-length);const even=index%2===0;
        card.append(el('p','',`Schrijf de ${even?'even':'oneven'} getallen van ${start} tot ${start+length}.`));s=svg(660,100);
        shape(s,'line',{x1:20,y1:42,x2:640,y2:42,stroke:'#344d60'});
        for(let i=0;i<=length;i++){const x=20+i*620/length;shape(s,'line',{x1:x,y1:34,x2:x,y2:50,stroke:'#344d60'});if(i===0||i===length)text(s,x,75,start+i,14);}
        card.append(s);drawing(s,card);answer(card,'Antwoorden:',Array.from({length:length+1},(_,i)=>start+i).filter(v=>v%2===(even?0:1)).join(', '),true);break;
      }
      case 'riddles':{
        n=rand(2,o.max-2);let question;
        if(index%4===0)question=`Ik ben ${n%2?'oneven':'even'}. Mijn buren zijn ${n-1} en ${n+1}. Welk getal ben ik?`;
        else if(index%4===1)question=`Ik ben ${n%2?'oneven':'even'}, groter dan ${n-1} en kleiner dan ${n+2}. Welk getal ben ik?`;
        else if(index%4===2){n=Math.max(3,n);question=`Wat is het volgende ${n%2?'oneven':'even'} getal na ${n-2}?`;}
        else {n=11;question='Ik ben oneven, kleiner dan 20 en ik heb twee dezelfde cijfers. Welk getal ben ik?';}
        card.append(el('p','',question));answer(card,'Ik ben',n);break;
      }
      case 'whole':parts=pick(validParts);card.append(figure(kind,parts));result='de hele figuur';break;
      case 'equal':{const isEqual=index%2===0;card.append(figure(kind==='triangle'?'rect':kind,2,!isEqual));card.append(check('Gelijke delen'),check('Ongelijke delen'));result=isEqual?'gelijke delen':'ongelijke delen';break;}
      case 'divide':parts=pick(validParts);card.append(el('p','',`Verdeel in ${parts} gelijke delen.`));s=divisionFigure(kind,parts);card.append(s);drawing(s,card);result=parts;break;
      case 'count':parts=pick(validParts);card.append(figure(kind,parts));answer(card,'Aantal gelijke delen:',parts);break;
      case 'colorparts':parts=pick(validParts);n=rand(1,parts-1);card.append(el('p','',`Kleur ${n} van de ${parts} gelijke delen.`),figure(kind,parts));result=n;break;
      case 'compare':{
        const comparisons=[];
        validParts.forEach(a=>validParts.forEach(b=>{if(a!==b)comparisons.push([a,b]);}));
        const [left,right]=comparisons[index%comparisons.length];
        const side=Math.floor(index/comparisons.length)%2===0?'links':'rechts';
        card.classList.add('basis-wide');const pair=el('div','basis-grid');pair.append(figure(kind,left,false,1),figure(kind,right,false,1));
        card.append(pair,el('p','',`Beide figuren zijn even groot. Het gekleurde deel ${side} is … dan het gekleurde deel ${side==='links'?'rechts':'links'}.`));
        card.append(check('kleiner'),check('groter'));result=(side==='links'?left>right:right>left)?'kleiner':'groter';break;
      }
      case 'halfshape':case 'quartershape':
        card.append(el('p','',type==='halfshape'?`Kleur ${halfName}.`:`Kleur ${partName}.`));s=divisionFigure(kind,type==='halfshape'?2:4);card.append(s);drawing(s,card);result=type==='halfshape'?'1 van 2 gelijke delen':'1 van 4 gelijke delen';break;
      case 'halfamount':case 'quarteramount':
        parts=type==='halfamount'?2:4;n=parts*rand(1,Math.floor(20/parts));s=dots(n);card.append(s);if(parts===4)drawing(s,card);answer(card,`${parts===2?'De helft':'Een kwart'}${o.notation?(parts===2?' (½)':' (¼)'):''} van ${n} is`,n/parts);break;
      case 'doubleshape':n=rand(1,5);card.classList.add('basis-wide');s=gridDrawing(n);card.append(s);drawing(s,card);result=2*n;break;
      case 'doubleamount':
        n=rand(1,10);card.append(dots(n),el('p','','Teken het dubbel hieronder.'));s=svg(300,145);shape(s,'rect',{x:1,y:1,width:298,height:143,fill:'white',stroke:'#c8d9e6'});card.append(s);drawing(s,card);answer(card,`Het dubbel van ${n} is`,2*n);break;
      case 'statements':
        n=rand(1,10);card.append(dots(n*2));card.append(check(`${n} is de helft van ${n*2}.`),check(`Het dubbel van ${n*2} is ${n}.`),check(`Het dubbel van ${n} is ${n*2}.`));result='eerste en derde uitspraak';break;
      case 'problems':{
        const half=index%2===0;n=rand(1,10);const words=pick([['appel','appels'],['knikker','knikkers'],['koek','koeken'],['kaart','kaarten']]);const obj=words[!half&&n===1?0:1];const question=half?`De helft van ${n*2} ${obj} is`:`Het dubbel van ${n} ${obj} is`;answer(card,question,half?n:n*2);break;
      }
      case 'quartercolor':card.append(el('p','',`Kleur ${partName}.`),figure(kind,4));result='1 van 4 gelijke delen';break;
      case 'quarterfind':{
        card.classList.add('basis-wide');const options=el('div','basis-find');options.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:16px';const values=[1,2,4];for(let i=2;i>0;i--){const j=rand(0,i);[values[i],values[j]]=[values[j],values[i]];}values.forEach((v,i)=>{const box=el('div');const f=figure(kind,4,false,v);f.querySelectorAll('[data-color]').forEach(e=>e.removeAttribute('data-color'));box.append(f,check(`Figuur ${i+1}`));options.append(box);});card.append(options);result=values.indexOf(1)+1;break;
      }
    }
    if(type==='quarterfind')card.querySelectorAll('svg').forEach(f=>{f.style.pointerEvents='none';});
    if(['divide','halfshape','quartershape'].includes(type)){
      const divisions=type==='halfshape'?2:type==='quartershape'?4:parts;
      const guide=el('button','','Toon verdeellijnen');guide.type='button';
      card.querySelector('.basis-tools').prepend(guide);
      guide.onclick=()=>{const example=divisionFigure(kind,divisions,true);s.replaceChildren(...Array.from(example.childNodes));s.dataset.drawing='false';guide.nextElementSibling.textContent='Kleuren aan';};
    }
    if(result!==undefined)card.dataset.antwoord=String(result);
    return card;
  }
  const explanations={
    even:'Even (paar): je kunt een aantal in twee even grote groepen verdelen. Even getallen eindigen op 0, 2, 4, 6 of 8. Bij oneven (onpaar) blijft er één over; die getallen eindigen op 1, 3, 5, 7 of 9.',
    parts:'Het geheel is alles samen: een hele figuur of alle voorwerpen. Bij een gelijke verdeling is elk deel even groot of bevat elke groep evenveel voorwerpen. Hoe meer gelijke delen van hetzelfde geheel, hoe kleiner elk deel.',
    half:'Verdeel een geheel in twee gelijke delen: één deel is de helft. Neem iets twee keer: dat is het dubbel. De helft van 12 is 6. Het dubbel van 6 is 12.',
    quarter:'Verdeel een geheel in vier gelijke delen. Eén van die vier delen is een kwart. Een kwart van 12 is 3. Twee kwarten samen zijn één helft.'
  };
  function add(type,o){
    const api=window.GI_BasisBridge,sheet=$('sheet'),key=`basis_${++serial}`;
    api.title(sheet,key,types[type][1]);
    const title=sheet.querySelector(`.exercise-title[data-title-key="${key}"]`);title.contentEditable='true';title.spellcheck=false;title.title='Klik om de opdrachtzin te bewerken';
    const block=el('div','basis-block');block.dataset.titleKey=key;
    if(o.explain)block.append(el('div','basis-explain',explanations[types[type][0]]));
    const grid=el('div','basis-grid');block.append(grid);sheet.append(block);
    let index=0;
    const append=()=>{
      // Vergelijk de opgave vóór bewerking: ingevulde antwoorden en tekeningen
      // mogen een bestaande opgave niet opnieuw beschikbaar maken.
      const used=new Set([...sheet.querySelectorAll(`.basis-card[data-type="${type}"]`)].map(c=>c._basisOpgave));
      let card,signature;
      for(let attempt=0;attempt<160;attempt++){
        card=cardFor(type,o,index++);signature=card.innerHTML;
        if(!used.has(signature))break;
        card=null;
      }
      if(!card)return false;
      card._basisOpgave=signature;
      const del=el('button','row-delete-btn','×');del.type='button';del.title='Verwijder deze oefening';del.onclick=()=>{card.remove();if(!grid.children.length)title.closest('.title-row').querySelector('.title-delete-btn').click();window.GI_Toets?.updateScoreVakken();};card.append(del);grid.append(card);
      requestAnimationFrame(()=>{window.GI_Toets?.scanEnVoeg();window.GI_Toets?.updateScoreVakken();});
      return true;
    };
    const exhausted=()=>{
      const tab=types[type][0]==='even'?'evenoneven':'verdelen';
      const notice=el('p','basis-notice',`${labels[type]}: ${grid.children.length} toegevoegd. Er zijn met deze instellingen geen andere unieke opgaven meer. Kies andere figuren of een ander bereik voor meer variatie.`);
      notice.setAttribute('role','status');$(`${tab}-add`).before(notice);
    };
    api.register(key,()=>{if(!append())exhausted();});
    for(let i=0;i<o.count;i++)if(!append()){
      if(!grid.children.length)title.closest('.title-row').querySelector('.title-delete-btn').click();
      exhausted();break;
    }
  }
  function panel(id,groups){
    const root=el('div','sidebar-content');root.id=`tab-${id}`;root.style.display='none';
    root.innerHTML=`<div class="sectie-titel">${id==='evenoneven'?'Even en oneven':'Verdelen en breuken'}</div><div class="config-kaart"><div class="kaart-titel">Instellingen</div>${id==='evenoneven'?`<label>Getallen tot <select id="${id}-max"><option value="20">20</option><option value="100">100</option></select></label><p class="harm-beschrijving">Afbeeldingen blijven tot 20. Het bereik geldt voor getallenroosters, lijnen en raadsels.</p>`:`<label>Figuren <select id="${id}-shape"><option value="mix">Afwisselend</option><option value="rect">Rechthoeken</option><option value="square">Vierkanten</option><option value="circle">Cirkels</option><option value="triangle">Driehoeken</option></select></label><label class="check-label"><input id="${id}-notation" type="checkbox"> Toon ook ½ en ¼</label><p class="harm-beschrijving">Hoeveelheden tot 20; het dubbel van aantallen tot 10.</p>`}<label class="check-label"><input id="${id}-explain" type="checkbox"> Uitlegkader toevoegen</label></div>`;
    groups.forEach(([group,title])=>{
      const box=el('div','config-kaart basis-options');box.append(el('div','kaart-titel',title));
      Object.keys(types).filter(k=>types[k][0]===group).forEach((k,i)=>{
        const row=el('div','basis-option-row'),label=el('label','check-label'),input=el('input');
        input.type='checkbox';input.value=k;input.name=`${id}-type`;input.checked=i===0;
        label.append(input,document.createTextNode(labels[k]));
        const countLabel=el('label','basis-count-label','Aantal');
        const count=el('input');count.type='number';count.min='1';count.max='12';count.value='4';count.id=`basis-count-${k}`;count.setAttribute('aria-label',`Aantal: ${labels[k]}`);
        countLabel.append(count);row.append(label,countLabel);box.append(row);
      });root.append(box);
    });
    const btn=el('button','btn-toevoegen','➕ Voeg gekozen oefeningen toe');btn.type='button';btn.id=`${id}-add`;
    btn.onclick=()=>{
      root.querySelectorAll('.basis-notice').forEach(n=>n.remove());
      const selected=[...root.querySelectorAll(`input[name="${id}-type"]:checked`)];
      if(!selected.length){alert('Kies minstens één oefensoort.');return;}
      const o={max:Number($(`${id}-max`)?.value)||20,shape:$(`${id}-shape`)?.value||'mix',notation:$(`${id}-notation`)?.checked||false,explain:$(`${id}-explain`).checked};
      selected.forEach(input=>{const field=$(`basis-count-${input.value}`);const count=Math.max(1,Math.min(12,Math.floor(Number(field.value)||1)));field.value=String(count);add(input.value,{...o,count});});
    };root.append(btn);return root;
  }
  function init(){
    if(!window.GI_BasisBridge||$('tab-evenoneven'))return;
    const tabs=$('sidebarTabs');
    [['evenoneven','⚖️ Even en oneven'],['verdelen','◒ Verdelen en breuken']].forEach(([id,label])=>{const tab=el('div',`sidebar-tab tab-${id}`,label);tab.onclick=()=>GI_UI.toonTab(id,tab);if(id==='evenoneven')tabs.querySelector('.tab-getallenrij').after(tab);else tabs.append(tab);});
    const footer=document.querySelector('.sidebar-footer');
    footer.before(panel('evenoneven',[['even','Even en oneven']]),panel('verdelen',[['parts','1. Gelijke delen'],['half','2. Helft en dubbel'],['quarter','3. Een kwart']]));
    const help=document.querySelector('#infoModal h2');
    if(help){const note=el('p','','Nieuw: Even en oneven en Verdelen en breuken. Kies oefensoorten en voeg ze toe. In de preview kun je de opdrachtzin aanpassen, antwoorden invullen, kleuren en tekenen. Met “Toon verdeellijnen” kun je gelijke delen zichtbaar maken. + oefening behoudt de instellingen van die opdracht. Je aanpassingen gaan mee naar de PDF.');note.style.cssText='font-size:14px;line-height:1.6';help.after(note);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
