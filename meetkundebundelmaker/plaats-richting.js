/* Original PNG artwork, deterministic exercises and shared print/preview markup. */
(() => {
  const asset = new URL('ruimte/robot-en-voorwerpen.png', document.currentScript.src).href;
  const types = {
    spacePlace: ['Waar ligt de bal?', 'Kijk vanuit de robot. Omkring het juiste antwoord.'],
    spaceDraw: ['Teken op de juiste plaats', 'Kijk vanuit de robot en teken de gevraagde tekens.'],
    spaceObjects: ['Plaats op het blad benoemen', 'Waar ligt de bal ten opzichte van de rugzak? Schrijf het juiste woord.'],
    spaceRoute: ['Een route tekenen', 'Teken een weg van de robot naar de rugzak. Ga langs de stip. Loop horizontaal of verticaal van vak naar vak.'],
    spaceTurn: ['De robot draait', 'De robot draait een kwartslag naar rechts. Verplaats de stippen mee: ze blijven op dezelfde plaats ten opzichte van de robot.']
  };
  const directions = [[0,-1],[1,0],[0,1],[-1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
  const relativeCell = (facing,rel) => {let [x,y]=directions[rel];for(let i=0;i<facing;i++)[x,y]=[-y,x];return cell(x,y);};
  const relative = ['voor','rechts van','achter','links van','schuin links voor','schuin rechts voor','schuin links achter','schuin rechts achter'];
  const cell = (x,y) => (y+1)*3+x+1;
  const xy = i => [i%3-1,Math.floor(i/3)-1];
  const turn = i => { const [x,y]=xy(i); return cell(-y,x); };
  const sprite = id => `<span class="space-sprite space-${id}" style="background-image:url('${asset}')" role="img" aria-label="${id==='bag'?'rugzak':id==='ball'?'bal':'robot'}"></span>`;
  const pose = ['back','right','front','left'];
  const arrow = ['↑','→','↓','←'];
  function model(ex) {
    const v=ex.spaceVariant||0, facing=v%4;
    // Interleave straight and diagonal positions, including diagonally behind.
    const rel=[0,6,1,4,2,7,3,5][Math.floor(v/4)%8];
    const other=(Math.floor(v/32)%2+3+rel)%8;
    if(ex.type==='spaceObjects') {
      const a=Math.floor(v/8)%9, b=(a+1+v%8)%9;
      const [ax,ay]=xy(a),[bx,by]=xy(b);
      return {a,b,answer:[by<ay?'boven':by>ay?'onder':'',bx<ax?'links van':bx>ax?'rechts van':''].filter(Boolean).join(' en ')};
    }
    if(ex.type==='spaceRoute') {
      const a=Math.floor(v/8)%9,b=(a+1+v%8)%9;
      const free=Array.from({length:9},(_,i)=>i).filter(i=>i!==a&&i!==b);
      return {a,b,via:free[Math.floor(v/72)%7],facing};
    }
    const first=relativeCell(facing,rel), second=relativeCell(facing,other);
    if(ex.type==='spaceTurn') {
      const offsets=Math.floor(v/32)%2?[0,2,4,6]:[0,1,3,5];
      const colors=['#d63c35','#2878c8','#27934b','#efb522'];
      return {facing,dots:offsets.map((offset,i)=>({cell:relativeCell(facing,(rel+offset)%8),color:colors[i]}))};
    }
    return {facing,rel,other,first,second};
  }
  function grid(items,ex,key='main',solvedPath='') {
    const paths=state.solutionMode?'':(ex.spacePaths?.[key]||[]).map(points=>`<polyline points="${points}"/>`).join('');
    return `<div class="space-grid">${Array.from({length:9},(_,i)=>`<div class="space-cell">${items[i]||''}</div>`).join('')}<svg class="space-ink" data-grid="${key}" viewBox="0 0 300 300" aria-label="Tekenveld">${solvedPath}${paths}</svg></div>`;
  }
  const dot = (color,label='') => `<span class="space-dot" style="background:${color}">${label}</span>`;
  const robot = facing => `${sprite(pose[facing])}<b class="space-facing">${arrow[facing]}</b>`;
  function route(a,b) {
    const points=[a]; let [x,y]=xy(a); const [tx,ty]=xy(b);
    while(x!==tx){x+=Math.sign(tx-x);points.push(cell(x,y));}
    while(y!==ty){y+=Math.sign(ty-y);points.push(cell(x,y));}
    return points;
  }
  function help() {
    return `<div class="space-help"><b>Plaats en richting</b><p>Bij de robot kijk je vanuit de robot. De pijl toont waar hij naartoe kijkt. Voor is in de richting van de pijl; achter is de andere kant. Zijn rechterkant en linkerkant draaien mee. <b>Schuin achter</b> ligt in een van de twee hoekvakken achter de robot; <b>schuin voor</b> in een van de twee hoekvakken voor hem.</p><div class="space-help-row">${grid({0:'<small>schuin links<br>voor</small>',1:'voor',2:'<small>schuin rechts<br>voor</small>',3:'links',4:robot(0),5:'rechts',6:'<small>schuin links<br>achter</small>',7:'achter',8:'<small>schuin rechts<br>achter</small>'},{},'help')}<p>Op het blad betekent <b>boven</b> naar de bovenrand en <b>onder</b> naar de onderrand. Schuin combineert twee richtingen, bijvoorbeeld boven en rechts.<br><br>Een route bestaat uit stappen van vak naar vak. Er kunnen verschillende goede routes zijn.</p></div></div>`;
  }
  function body(ex) {
    const m=model(ex), solved=state.solutionMode;
    if(ex.type==='spacePlace')return grid({4:robot(m.facing),[m.first]:sprite('ball')},ex)+`<div class="space-options">${relative.map((word,i)=>`<span data-space-choice="${i}" class="${(solved?i===m.rel:i===ex.spaceChoice)?'space-correct':''}">${word}</span>`).join('')}</div><p class="space-note">Ten opzichte van de robot. De pijl toont zijn kijkrichting.</p>`;
    if(ex.type==='spaceDraw')return `<p>Teken een cirkel ${relative[m.rel]} de robot en een kruis ${relative[m.other]} de robot.</p>`+grid({4:robot(m.facing),...(solved?{[m.first]:'○',[m.second]:'×'}:{})},ex);
    if(ex.type==='spaceObjects')return grid({[m.a]:sprite('bag'),[m.b]:sprite('ball')},ex)+`<p class="space-note">Kies uit: boven, onder, links van, rechts van. Combineer bij een schuine plaats twee richtingen.</p><div class="space-response">De bal ligt <span class="space-answer" contenteditable="${!solved}" data-answer="true">${escapeHtml(solved?m.answer:ex.spaceAnswer||'')}</span> de rugzak.</div>`;
    if(ex.type==='spaceRoute') {
      const path=[...route(m.a,m.via),...route(m.via,m.b).slice(1)].map(i=>`${i%3*100+50},${Math.floor(i/3)*100+50}`).join(' ');
      return grid({[m.a]:robot(m.facing),[m.b]:sprite('bag'),[m.via]:dot('#8c62ad','•')},ex,'main',solved?`<polyline points="${path}"/>`:'')+`<p>${solved?'Eén mogelijke route. Andere routes langs de stip zijn ook goed.':'Vertel aan je buur hoe je de weg hebt gevonden en welke stappen je hebt gezet.'}</p>`;
    }
    if(ex.type==='spaceTurn') {
      const dots=rotated=>Object.fromEntries(m.dots.map(d=>[rotated?turn(d.cell):d.cell,dot(d.color)]));
      return `<div class="space-pair"><div><p>Voor de draai</p>${grid({4:robot(m.facing),...dots(false)},ex,'before')}</div><b>→</b><div><p>Na de draai</p>${grid({4:robot((m.facing+1)%4),...(solved?dots(true):{})},ex,'after')}</div></div><p class="space-note">Teken de vier rondjes op hun nieuwe plaats. Gebruik voor elk rondje dezelfde kleur als voor de draai.</p>`;
    }
    return help();
  }
  const style=document.createElement('style');
  style.textContent=`.tab[data-tab="space"]{background:#cceee5;color:#175f55}.tab[data-tab="space"].active{background:#176b5d;color:#fff;border-color:#125448}.space-exercise{break-inside:avoid;padding-bottom:3mm}.space-exercise>.editbar{position:static;transform:none;justify-content:flex-end}.space-grid{width:75mm;height:75mm;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);position:relative;margin:3mm auto;border-left:1px solid #546576;border-top:1px solid #546576;box-sizing:border-box}.space-cell{border-right:1px solid #546576;border-bottom:1px solid #546576;display:flex;align-items:center;justify-content:center;position:relative;font-size:20pt;color:#175f55}.space-sprite{display:block;width:23mm;height:23mm;flex-shrink:0;background-size:300% 200%;background-repeat:no-repeat}.space-front{background-position:0 0}.space-back{background-position:50% 0}.space-left{background-position:100% 0}.space-right{background-position:0 100%}.space-bag{background-position:50% 100%}.space-ball{background-position:100% 100%}.space-facing{position:absolute;right:1mm;bottom:0;color:#152d3e;font-size:17pt}.space-ink{position:absolute;inset:0;width:100%;height:100%;touch-action:none}.space-ink polyline{fill:none;stroke:#247c62;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.space-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));text-align:center;gap:2mm;margin:3mm;font-size:10pt}.space-options span{padding:2mm}.space-correct{outline:1mm solid #247c62;border-radius:50%}.space-answer{display:inline-flex;min-width:65mm;min-height:12mm;border:1px solid #8fa7b6;align-items:center;padding:1mm 2mm;box-sizing:border-box}.space-response{display:flex;align-items:center;gap:2mm;flex-wrap:wrap}.space-note{font-size:9pt;color:#43576a}.space-pair{display:flex;align-items:center;justify-content:center;gap:4mm}.space-pair .space-grid{width:65mm;height:65mm}.space-pair .space-sprite{width:20mm;height:20mm}.space-dot{width:8mm;height:8mm;border-radius:50%;color:white;display:grid;place-items:center;font-size:12pt;font-weight:bold}.space-help{background:#f1faf7;border:1px solid #8fc3b5;padding:4mm;border-radius:3mm;font-size:10pt}.space-help-row{display:flex;gap:5mm;align-items:center}.space-help-row .space-grid{width:60mm;height:60mm;flex-shrink:0}.space-help .space-cell{font-size:11pt;text-align:center}.space-help .space-cell small{font-size:8pt;line-height:1.3}.space-help .space-sprite{width:18mm;height:18mm}@media print{.space-sprite,.space-dot,.space-help{print-color-adjust:exact;-webkit-print-color-adjust:exact}.space-ink{pointer-events:none}}`;
  document.head.append(style);
  const tab=document.createElement('button');tab.className='tab';tab.dataset.tab='space';tab.textContent='Plaats en richting';$('#tabs').prepend(tab);
  const panel=document.createElement('div');panel.className='tab-panel';panel.dataset.panel='space';
  panel.innerHTML='<div class="choose-intro">Plaats benoemen, tekenen, routes en draaien met robot Robi. Elk aantal levert verschillende opgaven.</div><label class="check"><input id="spaceHelp" type="checkbox" checked> Uitlegkader toevoegen</label>'+Object.entries(types).map(([type,[label,hint]])=>`<div class="group exercise-picker"><div class="group-title" role="button" tabindex="0" aria-expanded="false">${label}</div><div class="mini">${hint}</div><div class="type-count"><span>Aantal oefeningen</span><input id="count-${type}" aria-label="Aantal: ${label}" type="number" min="0" max="12" value="0"></div></div>`).join('');
  $('.add-selection').before(panel);
  tab.onclick=()=>{$$('.tab,.tab-panel').forEach(el=>el.classList.remove('active'));tab.classList.add('active');panel.classList.add('active');tab.scrollIntoView({block:'nearest',inline:'nearest'});};
  panel.querySelectorAll('.group').forEach(group=>{const title=group.querySelector('.group-title'),input=group.querySelector('input');const toggle=()=>{const on=group.classList.toggle('selected');title.setAttribute('aria-expanded',on);input.value=on?1:0;};title.onclick=toggle;title.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();toggle();}};});
  Object.entries(types).forEach(([type,[label]])=>$('#addType').add(new Option(label,type)));
  const isSpace=type=>!!types[type]||type==='spaceHelp';
  const baseMake=make;make=function(type,forced={}){if(!isSpace(type))return baseMake(type,forced);return {id:uid(),type,spaceVariant:n(0,31),...forced};};
  const key=ex=>JSON.stringify([ex.type,model(ex)]);
  const baseUnique=makeUnique;makeUnique=function(type,forced={},existing=state.exercises){
    if(!isSpace(type))return baseUnique(type,forced,existing);
    if(type==='spaceHelp')return existing.some(e=>e.type===type)?null:make(type);
    const total=type==='spaceRoute'?504:type==='spaceObjects'?72:type==='spacePlace'?32:64;
    const used=new Set(existing.filter(e=>e.type===type).map(key)),start=n(0,total-1);
    for(let i=0;i<total;i++){const ex=make(type,{...forced,spaceVariant:(start+i)%total});if(!used.has(key(ex)))return ex;}
    return null;
  };
  const baseDesired=desired;desired=function(){if(!panel.classList.contains('active'))return baseDesired();const out=[];for(const type of Object.keys(types)){const count=Math.min(12,Math.max(0,Math.floor(Number($('#count-'+type).value)||0)));for(let i=0;i<count;i++){const ex=makeUnique(type,{},[...state.exercises,...out]);if(ex)out.push(ex);}}if(out.length&&$('#spaceHelp').checked&&!state.exercises.some(e=>e.type==='spaceHelp'))out.unshift(make('spaceHelp'));return out;};
  const baseTitle=titleFor;titleFor=t=>types[t]?.[0]||(t==='spaceHelp'?'Plaats en richting: uitleg':baseTitle(t));
  const baseRender=renderEx;renderEx=function(ex,index){if(!isSpace(ex.type))return baseRender(ex,index);const number=typeof meetkundeAssignmentGroups==='function'?meetkundeAssignmentGroups().findIndex(g=>g.includes(ex))+1:index+1;return `<section class="exercise space-exercise" data-id="${ex.id}"><div class="editbar no-print"><button data-act="up">↑</button><button data-act="down">↓</button>${ex.type==='spaceHelp'?'':'<button data-act="replace">↻</button><button data-act="addsame">+ oefening</button><button data-space-clear>Tekening wissen</button>'}<button data-act="delete">✕</button></div><h3>${number||index+1}. ${escapeHtml(titleFor(ex.type))}</h3>${types[ex.type]?`<p class="prompt" contenteditable="${!state.solutionMode}" data-space-prompt>${escapeHtml(ex.spacePrompt||types[ex.type][1])}</p>`:''}${body(ex)}</section>`;};
  const baseBind=bindEdit;bindEdit=function(){baseBind();$$('#pages .space-exercise').forEach(section=>{const ex=state.exercises.find(e=>String(e.id)===section.dataset.id);if(!ex)return;const answer=section.querySelector('[data-answer]');if(answer)answer.oninput=()=>ex.spaceAnswer=answer.textContent;const prompt=section.querySelector('[data-space-prompt]');if(prompt)prompt.oninput=()=>ex.spacePrompt=prompt.textContent;const clear=section.querySelector('[data-space-clear]');if(clear)clear.onclick=()=>{ex.spacePaths={};render();};if(state.solutionMode)return;section.querySelectorAll('.space-ink').forEach(svg=>{if(ex.type==='spaceHelp')return;let points=null,line;const add=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());points.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);line.setAttribute('points',points.join(' '));};svg.onpointerdown=e=>{e.preventDefault();points=[];line=document.createElementNS('http://www.w3.org/2000/svg','polyline');svg.append(line);svg.setPointerCapture(e.pointerId);add(e);};svg.onpointermove=e=>{if(points)add(e);};const finish=()=>{if(!points)return;ex.spacePaths??={};(ex.spacePaths[svg.dataset.grid]??=[]).push(points.join(' '));points=null;};svg.onpointerup=finish;svg.onpointercancel=finish;});});};
  const bindSpatial=bindEdit;
  bindEdit=function(){
    bindSpatial();
    $$('#pages .space-exercise').forEach(section=>{
      const index=state.exercises.findIndex(e=>String(e.id)===section.dataset.id),ex=state.exercises[index];
      if(!ex)return;
      const replace=section.querySelector('[data-act="replace"]');
      if(replace)replace.onclick=()=>{const fresh=makeUnique(ex.type,{},state.exercises);if(fresh){state.exercises.splice(index,1,fresh);render();}};
      section.querySelectorAll('[data-space-choice]').forEach(option=>{
        if(state.solutionMode)return;
        option.tabIndex=0;option.setAttribute('role','button');
        const select=()=>{ex.spaceChoice=Number(option.dataset.spaceChoice);render();};
        option.onclick=select;option.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();select();}};
      });
    });
  };
  if(window.MeetkundeShared){const catalog=window.MeetkundeShared.catalog;window.MeetkundeShared.catalog=()=>[...catalog(),...Object.entries(types).map(([type,[label]])=>({group:'Plaats en richting',type,label}))];}
  window.SpaceExercises={model,key,turn,route,types:Object.keys(types)};
  // The first visible tab is also the initial selection.
  $$('.tab,.tab-panel').forEach(el=>el.classList.remove('active'));
  tab.classList.add('active');
  panel.classList.add('active');
})();
