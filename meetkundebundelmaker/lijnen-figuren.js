/* Recognizable grayscale illustrations for tracing parallel lines. */
(() => {
  const imageUrl=new URL('lijnen/evenwijdige-figuren.png',document.currentScript.src).href;
  const style=document.createElement('style');
  style.textContent=`.parallel-picture{position:relative;width:100%;aspect-ratio:3 / 2;margin:4mm 0 0}.parallel-picture img{display:block;width:100%;height:100%;object-fit:contain}.parallel-picture svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.parallel-picture-note{font-size:10pt;color:#256944;margin:3mm 0 0}`;
  document.head.append(style);
  const count=document.querySelector('#count-parallel-find'),picker=count.closest('.group'),pickerTitle=picker.querySelector('.group-title'),pickerLabel=pickerTitle.textContent;
  count.type='hidden';count.max='1';picker.querySelector('.type-count').style.display='none';
  picker.insertAdjacentHTML('beforeend','<div class="mini">Eén opdracht met vier afbeeldingen. Deze opdracht kan één keer in de bundel.</div>');
  const guard=e=>{if(state.exercises.some(ex=>ex.type==='parallelFind')){e.preventDefault();e.stopImmediatePropagation();}};
  pickerTitle.addEventListener('click',guard,true);pickerTitle.addEventListener('keydown',guard,true);
  const baseUnique=makeUnique;makeUnique=function(type,forced={},existing=state.exercises){if(type==='parallelFind'&&existing.some(ex=>ex.type===type))return null;return baseUnique(type,forced,existing);};
  const baseRefresh=render;render=function(){baseRefresh();const included=state.exercises.some(ex=>ex.type==='parallelFind');pickerTitle.textContent=pickerLabel+(included?' — toegevoegd':'');pickerTitle.setAttribute('aria-disabled',String(included));};
  const baseRender=renderEx;
  renderEx=function(ex,index) {
    const html=baseRender(ex,index);
    if(ex.type!=='parallelFind')return html;
    const holder=document.createElement('div');holder.innerHTML=html;
    holder.querySelectorAll('[data-act="addsame"],[data-act="replace"]').forEach(button=>button.remove());
    holder.querySelector('.prompt').textContent='Zoek in elke figuur minstens twee evenwijdige lijnen. Overtrek ze met groen. Gebruik je lat.';
    const scenes=holder.querySelector('.parallel-scenes');
    const picture=document.createElement('div');picture.className='parallel-picture';
    // Explicit image dimensions reserve the print layout before the PNG has loaded.
    picture.innerHTML=`<img src="${imageUrl}" width="1536" height="1024" alt="Een ladder, een schrift met schrijflijnen, een huis en een hek, getekend in grijswaarden.">${state.solutionMode?'<svg viewBox="0 0 1536 1024" aria-label="Voorbeelden van evenwijdige lijnen in groen"><g fill="none" stroke="#20914c" stroke-width="9" stroke-linecap="round" opacity=".8"><path d="M256 33V491 M522 33V491"/><path d="M956 118H1328 M956 175H1328"/><path d="M148 716V960 M627 716V960"/><path d="M870 624V954 M988 624V954"/></g></svg>':''}`;
    scenes.replaceWith(picture);
    if(state.solutionMode)picture.insertAdjacentHTML('afterend','<p class="parallel-picture-note">Voorbeelden in groen. Andere juiste paren zijn ook goed, zoals de sporten van de ladder, de randen van de ramen en de latten van het hek.</p>');
    return holder.innerHTML;
  };
})();

/* Naming and drawing points, lines and segments. SVG units in the drawing grid are millimetres. */
(() => {
  const types={lineNameMatch:'Verbind met de juiste naam',lineNameWrite:'Schrijf de juiste naam',lineGridDraw:'Punten, rechten en lijnstukken tekenen op ruitjes',lineRelationChoose:'Evenwijdig of snijdend aankruisen',lineSceneTrace:'Evenwijdige en snijdende lijnen overtrekken in een afbeelding',lineSidesTrace:'Evenwijdige zijden zoeken in figuren',lineRelationHelp:'Evenwijdig en snijdend overtrekken — met hulp'};
  const panel=document.querySelector('[data-panel="lines"]');
  const style=document.createElement('style');
  style.textContent=`.line-name-sheet{display:block;width:160mm;max-width:100%;height:auto;margin:3mm auto}.line-name-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin:3mm 0}.line-name-card{border:1px solid #a3bac5;border-radius:2mm;padding:3mm}.line-name-card svg{display:block;width:100%;height:25mm}.line-name-answer{height:9mm;border-bottom:1px solid #8397a3;font-size:10pt;display:flex;align-items:flex-end;padding-bottom:1mm;color:#0875bb}.line-grid-task .prompt{margin-bottom:2mm}.line-draw-grid{display:block;width:160mm!important;height:100mm!important;max-width:none;margin:4mm auto 0}.line-grid-note{font-size:9pt;margin:2mm 0;color:#536779}.line-grid-example{height:6mm;font-size:10pt;color:#0875bb;margin:2mm 0}.line-basis>.editbar{position:static;transform:none;justify-content:flex-end;margin-bottom:2mm}@media print{.line-draw-grid{width:160mm!important;height:100mm!important}}`;
  document.head.append(style);
  style.textContent+=`.line-relation-options{font-size:9.5pt;line-height:1.6}.line-check{display:inline-flex;width:3.5mm;height:3.5mm;border:1px solid #8198a5;align-items:center;justify-content:center;margin-right:2mm;color:#0875bb;vertical-align:middle}.line-trace-shapes{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm;margin:5mm 0}.line-trace-shapes svg{display:block;width:100%;height:43mm}.line-trace-house{display:block;width:100mm;height:78mm;margin:4mm auto}.line-help-panels{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.line-help-panel{border:1px solid #a6b4bf;border-radius:3mm;padding:3mm;text-align:center;font-size:11pt}.line-help-panel svg{display:block;width:100%;height:52mm}.line-model-note{font-size:9.5pt;color:#0875bb;margin:3mm 0}`;
  Object.entries(types).forEach(([type,label])=>{
    const group=document.createElement('div');group.className='group exercise-picker';
    group.innerHTML=`<div class="group-title" role="button" tabindex="0" aria-expanded="false">${label}</div><div class="type-count"><span class="mini">Aantal opdrachten</span><label class="field"><input type="number" id="count-${type}" aria-label="Aantal: ${label}" min="0" max="8" value="0"></label></div>${type==='lineGridDraw'?'<div class="mini">Ruitjes van 1 × 1 cm. Teken op de roosterlijnen. Druk af op 100% / ware grootte.</div>':''}`;
    const title=group.querySelector('.group-title'),count=group.querySelector('input');
    const toggle=()=>{const open=group.classList.toggle('selected');title.setAttribute('aria-expanded',String(open));count.value=open?1:0;};
    title.onclick=toggle;title.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle();}};
    panel.append(group);document.querySelector('#addType').add(new Option(label,type));
  });
  // Keep new exercises in their subject section instead of below the final existing heading.
  const sections=[
    ['Punten, rechten en lijnstukken',['lines-vocabulary','lineNameMatch','lineNameWrite','lineGridDraw']],
    ['Lijnen herkennen, meten en tekenen',['lines-floorplan','segments-grid','segments-blank','lines-recognize','lines-draw']],
    ['Evenwijdige en snijdende lijnen',['parallel-draw-name','parallel-judge','parallel-statements','parallel-find','parallel-through-line','parallel-through-point','lineRelationChoose','lineSceneTrace','lineSidesTrace','lineRelationHelp']],
    ['Loodrechte stand',['perpendicular-draw','perpendicular-judge','perpendicular-statements','perpendicular-find','perpendicular-through-point']]
  ];
  panel.querySelectorAll(':scope > h3').forEach(h=>h.remove());
  sections.forEach(([label,ids])=>{const h=document.createElement('h3');h.textContent=label;panel.append(h);ids.forEach(id=>{const input=document.getElementById('count-'+id);if(input)panel.append(input.closest('.group'));});});
  const baseMake=make;
  make=function(type,forced={}){const ex=baseMake(type,forced);if(types[type])ex.gridVariant=forced.gridVariant??n(0,23);return ex;};
  const baseTitle=titleFor;titleFor=t=>types[t]||baseTitle(t);
  const baseDesired=desired;
  desired=function(){const out=baseDesired();if(!panel.classList.contains('active'))return out;Object.keys(types).forEach(type=>{const count=Math.max(0,Math.min(8,Math.floor(Number(document.querySelector('#count-'+type).value)||0)));for(let i=0;i<count;i++){const ex=makeUnique(type,{},[...state.exercises,...out]);if(ex)out.push(ex);}});return out;};
  function data(ex){
    const v=ex.gridVariant||0,letters='ABCDEFGHJKLMNPQRSTUVWXYZ',offset=v%18;
    return {v,p:letters[offset],q:letters[offset+1],a:letters[offset+2],b:letters[offset+3],c:letters[offset+4],d:letters[offset+5],r:'abcdefghkmnp'[v%12],s:'rstuvwxyzabc'[v%12]};
  }
  function items(ex){const d=data(ex);return [
    {kind:'point',label:d.p,answer:`het punt ${d.p}`},
    {kind:'segment',label:d.a,other:d.b,answer:`het lijnstuk [${d.a}${d.b}]`},
    {kind:'line',label:d.r,answer:`de rechte ${d.r}`},
    {kind:'segment',label:d.c,other:d.d,answer:`het lijnstuk [${d.c}${d.d}]`},
    {kind:'point',label:d.q,answer:`het punt ${d.q}`},
    {kind:'line',label:d.s,answer:`de rechte ${d.s}`}
  ];}
  function diagram(item,variant=0){
    const text=(x,y,t)=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="13" fill="#222">${t}</text>`;
    if(item.kind==='point')return `<circle cx="70" cy="30" r="2.6" fill="#222"/>${text(57,49,item.label)}`;
    const y1=variant%2?48:25,y2=variant%2?20:42;
    if(item.kind==='line')return `<path d="M12 ${y1}L143 ${y2}" fill="none" stroke="#333" stroke-width="1.4"/>${text(24,y1+18,item.label)}`;
    return `<path d="M22 ${y1}L132 ${y2}" fill="none" stroke="#333" stroke-width="1.4"/><circle cx="22" cy="${y1}" r="2.5"/><circle cx="132" cy="${y2}" r="2.5"/>${text(16,y1-8,item.label)}${text(128,y2-8,item.other)}`;
  }
  function match(ex){
    const entries=items(ex).slice(0,4),v=ex.gridVariant||0;
    const orders=[[1,0,3,2],[2,3,0,1],[3,2,1,0]],order=orders[v%3];
    let content='';
    entries.forEach((item,i)=>{const y=8+i*85;content+=`<rect x="2" y="${y}" width="158" height="76" rx="7" fill="white" stroke="#7f9fae"/><svg x="5" y="${y+5}" width="150" height="65" viewBox="0 0 155 65">${diagram(item,v+i)}</svg><circle cx="170" cy="${y+38}" r="2.5" fill="#333"/>`;});
    order.forEach((source,i)=>{const y=20+i*85;content+=`<circle cx="405" cy="${y+24}" r="2.5" fill="#333"/><rect x="414" y="${y}" width="190" height="48" rx="7" fill="white" stroke="#7f9fae"/><text x="425" y="${y+29}" font-family="Arial,sans-serif" font-size="15">${entries[source].answer}</text>`;});
    if(state.solutionMode)content+=`<g class="line-model-answer" fill="none" stroke="#0875bb" stroke-width="1.5">${entries.map((_,i)=>`<path d="M170 ${46+i*85}L405 ${44+order.indexOf(i)*85}"/>`).join('')}</g>`;
    return `<p class="prompt">Verbind elke tekening met de juiste naam.</p><svg class="line-name-sheet" viewBox="0 0 610 348" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
  }
  function write(ex){const all=items(ex),v=ex.gridVariant||0,order=v%2?[2,4,1,0,3,5]:[0,5,3,2,1,4];return `<p class="prompt">Schrijf de juiste naam. Benoem het punt, de rechte of het lijnstuk met de letter(s).</p><div class="line-name-cards">${order.map((j,i)=>`<div class="line-name-card"><svg viewBox="0 0 155 65">${diagram(all[j],v+i)}</svg><div class="line-name-answer">${state.solutionMode?all[j].answer:''}</div></div>`).join('')}</div>`;}
  function draw(ex){
    const d=data(ex),length=4+d.v%4,shorter=2+d.v%2;
    let grid='';for(let x=0;x<=160;x+=10)grid+=`<path d="M${x} 0V100"/>`;for(let y=0;y<=100;y+=10)grid+=`<path d="M0 ${y}H160"/>`;
    const label=(x,y,t)=>`<text x="${x}" y="${y}" font-size="3.5" font-family="Arial,sans-serif" fill="#0875bb">${t}</text>`;
    const segment=(x,y,len,a,b)=>`<path d="M${x} ${y}h${len}" stroke="#0875bb" stroke-width=".65"/><circle cx="${x}" cy="${y}" r=".8" fill="#0875bb"/><circle cx="${x+len}" cy="${y}" r=".8" fill="#0875bb"/>${label(x-1,y-2,a)}${label(x+len-1,y-2,b)}`;
    const solution=state.solutionMode?`<g class="line-model-answer">${segment(10,20,length*10,d.a,d.b)}${segment(10,40,shorter*10,d.c,d.d)}<path d="M100 0V100" stroke="#0875bb" stroke-width=".65"/>${label(102,13,d.r)}${[[20,70,d.p],[60,80,d.q],[140,50,'Z']].map(([x,y,t])=>`<circle cx="${x}" cy="${y}" r=".8" fill="#0875bb"/>${label(x+2,y-2,t)}`).join('')}</g>`:'';
    return `<div class="line-grid-task"><p class="prompt">Teken op de roosterlijnen. Gebruik je lat.</p><p class="prompt">• Teken een lijnstuk [${d.a}${d.b}] van ${length} cm.<br>• Teken een lijnstuk [${d.c}${d.d}] dat korter is dan [${d.a}${d.b}].<br>• Teken een rechte ${d.r}.<br>• Teken 3 punten op roosterpunten en geef ze elk een andere hoofdletter.</p><div class="line-grid-example">${state.solutionMode?'Voorbeeldoplossing. Meerdere juiste tekeningen zijn mogelijk.':''}</div><svg class="line-draw-grid" viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg"><g stroke="#8baebf" stroke-width=".18" fill="none">${grid}</g>${solution}</svg><p class="line-grid-note">Elk ruitje is 1 × 1 cm. Afdrukken op 100% / ware grootte; controleer de controlelijn onderaan.</p></div>`;
  }
  const relationPairs=[
    [[12,22,130,22],[45,46,140,46]],
    [[15,12,130,59],[8,37,145,37]],
    [[14,39,102,17],[54,61,142,39]],
    [[35,8,35,65],[120,8,120,65]],
    [[50,8,42,61],[88,8,100,61]],
    [[15,14,138,65],[108,52,127,10]]
  ];
  const isParallel=pair=>{const [a,b]=pair;return (a[2]-a[0])*(b[3]-b[1])===(a[3]-a[1])*(b[2]-b[0]);};
  const linePaths=(pair,color='#333',width=1.3)=>`<g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round">${pair.map(([x,y,X,Y])=>`<path d="M${x} ${y}L${X} ${Y}"/>`).join('')}</g>`;
  function relationChoose(ex){
    const v=ex.gridVariant||0;
    return '<p class="prompt">Kruis aan of de lijnen evenwijdig of snijdend zijn. Controleer met je geodriehoek.</p><div class="line-name-cards">'+relationPairs.map((_,i)=>{
      const pair=relationPairs[(i+v)%6].map(([x,y,X,Y])=>v%2?[155-x,y,155-X,Y]:[x,y,X,Y]),parallel=isParallel(pair);
      const option=(text,correct)=>`<div><span class="line-check">${state.solutionMode&&correct?'×':''}</span>${text}</div>`;
      return `<div class="line-name-card"><svg viewBox="0 0 155 75">${linePaths(pair)}</svg><div class="line-relation-options">${option('Evenwijdige lijnen',parallel)}${option('Snijdende lijnen',!parallel)}</div></div>`;
    }).join('')+'</div><p class="line-grid-note">Lijnen kunnen elkaar ook snijden als je ze verder doortrekt.</p>';
  }
  const sideShapes=[
    [[12,88],[28,27],[112,27],[128,88]],
    [[48,94],[48,53],[28,60],[70,7],[112,60],[92,53],[92,94]],
    [[20,90],[20,50],[60,10],[100,10]],
    [[10,85],[38,20],[128,20],[100,85]],
    [[20,85],[20,30],[110,30],[110,85]],
    [[10,55],[70,10],[130,55],[70,100]]
  ];
  function markedSides(points){
    const edges=points.map((p,i)=>[...p,...points[(i+1)%points.length]]);
    return edges.filter((edge,i)=>edges.some((other,j)=>i!==j&&isParallel([edge,other])));
  }
  function sideTrace(ex){
    const v=ex.gridVariant||0;
    return '<p class="prompt">Overtrek de evenwijdige zijden in elke figuur met groen. Controleer met je geodriehoek.</p><div class="line-trace-shapes">'+[0,1,2].map(i=>{
      const points=sideShapes[(v+i)%sideShapes.length];
      return `<svg viewBox="0 0 140 110"><polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#333" stroke-width="1.3"/>${state.solutionMode?`<g class="line-model-answer">${linePaths(markedSides(points),'#20914c',3)}</g>`:''}</svg>`;
    }).join('')+'</div>';
  }
  function sceneTrace(ex){
    const v=ex.gridVariant||0,roofY=28+v%3*3,doorX=20+(v%3)*10;
    const facade=[[15,45,15,125],[145,45,145,125]],cross=[[85,65,125,65],[125,65,125,90]];
    const house=`<path d="M10 45L40 ${roofY}H120L150 45Z" fill="#ededed"/><rect x="15" y="45" width="130" height="80" fill="#fafafa"/><rect x="${doorX}" y="70" width="25" height="55" fill="white"/><rect x="85" y="65" width="40" height="25" fill="white"/><rect x="85" y="100" width="40" height="16" fill="white"/><path d="M105 65V90 M85 77.5H125 M60 45V${roofY} M100 45V${roofY}"/><circle cx="${doorX+20}" cy="102" r="1" fill="#555"/>`;
    return `<p class="prompt">Overtrek twee evenwijdige lijnen met groen.<br>Overtrek twee snijdende lijnen met blauw.<br>Controleer met je geodriehoek.</p><svg class="line-trace-house" viewBox="0 0 160 130"><g stroke="#444" stroke-width=".7">${house}</g>${state.solutionMode?`<g class="line-model-answer">${linePaths(facade,'#20914c',1.8)}${linePaths(cross,'#0875bb',1.8)}</g>`:''}</svg>${state.solutionMode?'<p class="line-model-note">Voorbeeldoplossing. Andere juiste paren zijn ook goed.</p>':''}`;
  }
  function relationHelp(ex){
    const v=ex.gridVariant||0;
    const panels=[{title:'Evenwijdige lijnen',color:'#20914c',pairs:[relationPairs[v%2?3:0],relationPairs[2]]},{title:'Snijdende lijnen',color:'#0875bb',pairs:[relationPairs[1],relationPairs[v%2?4:5]]}];
    return '<p class="prompt">Overtrek de evenwijdige lijnen met groen.<br>Overtrek de snijdende lijnen met blauw.</p><div class="line-help-panels">'+panels.map(panel=>`<div class="line-help-panel"><b>${panel.title}</b><svg viewBox="0 0 155 160">${panel.pairs.map((pair,i)=>`<g transform="translate(0,${i*80})">${linePaths(pair)}${state.solutionMode?`<g class="line-model-answer">${linePaths(pair,panel.color,2.5)}</g>`:''}</g>`).join('')}</svg></div>`).join('')+'</div>';
  }
  const baseRender=renderEx;
  renderEx=function(ex,index){if(!types[ex.type])return baseRender(ex,index);const builders={lineNameMatch:match,lineNameWrite:write,lineGridDraw:draw,lineRelationChoose:relationChoose,lineSceneTrace:sceneTrace,lineSidesTrace:sideTrace,lineRelationHelp:relationHelp};const body=builders[ex.type](ex);return `<section class="exercise line-basis" data-id="${ex.id}"><div class="editbar no-print"><button data-act="up" title="Omhoog">↑</button><button data-act="down" title="Omlaag">↓</button><button data-act="replace" title="Andere opdracht">↻</button><button data-act="addsame">+ oefening</button><button data-act="delete" title="Verwijderen">✕</button></div><h3>${index+1}. ${types[ex.type]}</h3>${body}</section>`;};
  if(window.MeetkundeShared){const base=window.MeetkundeShared.catalog;window.MeetkundeShared.catalog=()=>[...base(),...Object.entries(types).map(([type,label])=>({group:'Lijnen en hoeken',type,label}))];}
})();
