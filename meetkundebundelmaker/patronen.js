/* Shared by the regular and PRO bundle. All answers use the same stored pattern data. */
(() => {
  const types = {
    patternHelp: ['Patronen: uitleg met voorbeelden', 'Een helder uitlegkader over herhalen, groeien en de patrooneenheid.'],
    patternRecognize: ['Is het een herhalend patroon?', 'Kruis de herhalende patronen aan en duid de kleinste patrooneenheid aan.'],
    patternRepeat: ['Herhalend patroon verderzetten', 'Duid de patrooneenheid aan en teken het patroon twee keer verder.'],
    patternUnit: ['De patrooneenheid tekenen', 'Teken het kleinste stukje dat telkens terugkomt.'],
    patternClassify: ['Herhalend of groeiend patroon?', 'Schrijf H of G bij het patroon.'],
    patternGrow: ['Groeiend patroon verderzetten', 'Zet het groeiende patroon 2 keer verder.'],
    patternMosaic: ['Een mozaïekpatroon verderzetten', 'Kleur de lege tegels en herhaal de patrooneenheid twee keer.']
  };
  const css = document.createElement('style');
  css.textContent = `.tab[data-tab="patterns"]{background:#d9f1e9}.pattern-row{margin:3mm 0;padding:3mm;border:1px solid #c5d9df;border-radius:3mm;break-inside:avoid}.pattern-strip{display:block;width:100%;height:auto}.pattern-caption{font-size:9pt;color:#536779;margin:1mm 0 2mm}.pattern-response{display:flex;align-items:center;gap:3mm;margin-top:2mm;font-size:10pt}.pattern-write{display:inline-flex;min-width:12mm;height:7mm;border:1px solid #9aacba;align-items:center;justify-content:center;color:#14714c;font-weight:bold}.pattern-draw{display:inline-flex;min-width:42mm;min-height:12mm;border:1px dashed #9aacba;border-radius:2mm;align-items:center}.pattern-draw svg{width:12mm;height:12mm}.pattern-help{padding:4mm;background:#f1faf7;border:1px solid #9acbbc;border-radius:3mm;margin-bottom:4mm;font-size:10.5pt;line-height:1.4}.pattern-help h4{margin:0 0 2mm;color:#176c60}.pattern-help p{margin:2mm 0}.pattern-answer{color:#14714c}.pattern-note{font-size:9pt;color:#526779;margin:2mm 0}`;
  document.head.append(css);
  // Padding stays inside the exercise during pagination and also applies when printing.
  css.textContent += `.page-content > .exercise + .exercise:has(> h3){padding-top:5mm}`;
  css.textContent += `.pattern-recognize-line{display:flex;align-items:center;gap:4mm}.pattern-recognize-line .pattern-strip{flex:1;min-width:0}.pattern-recognize-line .pattern-write{flex:0 0 7mm;min-width:7mm;height:7mm;color:#14714c}.pattern-recognize-note{text-align:right;margin-top:2mm;font-size:9pt}`;
  css.textContent += `.pattern-inline{display:flex;align-items:center;gap:1mm;flex-wrap:nowrap;min-height:20mm}.pattern-given{display:flex;align-items:center;flex:0 0 auto}.pattern-given>svg{width:8mm;height:12mm}.pattern-inline .pattern-cell{width:16mm;flex-basis:16mm}.pattern-inline-group{display:flex;align-items:center;gap:.5mm;padding-right:2mm;border-right:1px solid #c5d9df}.pattern-inline-group svg{width:8mm;height:12mm}.pattern-grow-space{height:22mm;flex:1;min-width:0;border:1px dashed #91a6b7;border-radius:1.5mm;display:flex;align-items:center;justify-content:space-around}.pattern-grow-space svg{width:9mm;height:12mm}.pattern-given-unit{display:flex;align-items:center}.pattern-given-unit.solved{outline:1px solid #218565}.pattern-given-unit svg{width:8mm;height:12mm}`;
  css.textContent += `.pattern-cells{display:flex;flex-wrap:wrap;gap:1.5mm;margin:2mm 0}.pattern-cell{width:16mm;height:16mm;flex:0 0 16mm;border:1px dashed #91a6b7;border-radius:1.5mm;display:grid;place-items:center}.pattern-cell svg{width:12mm;height:12mm}.pattern-draw{min-width:76mm;min-height:18mm}.pattern-grow-given{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3mm}.pattern-exercise>.editbar{position:static;transform:none;justify-content:flex-end;margin:0 0 2mm}.pattern-exercise{padding-bottom:3mm;margin-bottom:3mm}.pattern-row{margin-bottom:0}.pattern-exercise .prompt{margin-bottom:2mm}`;
  const tab = document.createElement('button');
  tab.className = 'tab'; tab.dataset.tab = 'patterns'; tab.textContent = 'Patronen';
  $('#tabs').append(tab);
  const panel = document.createElement('div'); panel.className = 'tab-panel'; panel.dataset.panel = 'patterns';
  panel.innerHTML = '<div class="choose-intro">Oefen met herhalende en groeiende patronen. De antwoorden verschijnen alleen in de oplossingenweergave.</div>' + Object.entries(types).map(([type, [label, hint]]) => `<div class="group exercise-picker"><div class="group-title" role="button" tabindex="0" aria-expanded="false">${label}</div><div class="mini">${hint}</div><div class="type-count"><span class="mini">Aantal oefeningen (1 = 1 rij)</span><label class="field"><input aria-label="Aantal: ${label}" id="count-${type}" type="number" min="0" max="8" value="0"></label></div></div>`).join('') + '';
  $('.add-selection').before(panel);
  tab.onclick = () => { $$('.tab,.tab-panel').forEach(x => x.classList.remove('active')); tab.classList.add('active'); panel.classList.add('active'); tab.scrollIntoView({block:'nearest',inline:'nearest'}); };
  panel.querySelectorAll('.group').forEach(group => {
    const title = group.querySelector('.group-title'), count = group.querySelector('input');
    const toggle = () => { const open = group.classList.toggle('selected'); title.setAttribute('aria-expanded', String(open)); count.value = open ? 1 : 0; };
    title.onclick = toggle; title.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
  });
  Object.entries(types).forEach(([type, [label]]) => $('#addType').add(new Option(label, type)));

  const colors = ['#ef9765','#529cce','#ac83c4','#e5b841','#57ae92','#e37f96'];
  const unitTemplates=['AB','AAB','ABC','ABBA','ABB','ABBC','ABA'];
  const variantCount=120*unitTemplates.length;
  css.textContent += `.pattern-inline-long .pattern-given-unit svg{width:6mm}.pattern-inline-long .pattern-cell{width:13mm;flex-basis:13mm}`;
  function icon(id, x=0, y=0, size=32, simple=false) {
    const c = colors[id % colors.length];
    const shapes = [
      '<path d="M10 15C5 7 15 3 20 10C25 3 35 7 30 15L20 29Z"/>',
      '<path d="m20 4 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z"/>',
      '<g><ellipse cx="13" cy="13" rx="9" ry="10"/><ellipse cx="27" cy="13" rx="9" ry="10"/><ellipse cx="13" cy="28" rx="7" ry="8"/><ellipse cx="27" cy="28" rx="7" ry="8"/></g><path d="M20 10v23m0-22-4-6m4 6 4-6" fill="none" stroke="#425066" stroke-width="2.5"/>',
      '<g><circle cx="20" cy="9" r="7"/><circle cx="30" cy="16" r="7"/><circle cx="26" cy="29" r="7"/><circle cx="13" cy="29" r="7"/><circle cx="9" cy="16" r="7"/></g><circle cx="20" cy="20" r="7" fill="#fff4c7"/>',
      '<path d="M20 3 36 33H4Z"/><path d="m20 11 9 17H11Z" fill="#fff" opacity=".28"/>',
      '<rect x="5" y="5" width="30" height="30" rx="8"/><path d="M12 13h16" stroke="#fff" stroke-width="3" opacity=".5"/>'
    ];
    const flat = ['<circle cx="20" cy="20" r="14"/>','<rect x="6" y="6" width="28" height="28"/>','<path d="M20 5 35 34H5Z"/>','<rect x="3" y="10" width="34" height="20"/>','<path d="m20 3 15 17-15 17L5 20Z"/>','<ellipse cx="20" cy="20" rx="16" ry="10"/>'];
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true" data-simple="${simple}"><g fill="${c}" stroke="#344b60" stroke-width="1.1" stroke-linejoin="round">${(simple?flat:shapes)[id % 6]}</g></svg>`;
  }
  const repeat = (unit, n) => Array.from({length:n}, () => unit).flat();
  function rowsFor(ex) {
    const v = ex.gridVariant || 0;
    return Array.from({length:1}, (_, i) => {
      const a=v%6, b=(a+1+Math.floor(v/6)%5)%6;
      const remaining=[0,1,2,3,4,5].filter(x=>x!==a&&x!==b);
      const c=remaining[Math.floor(v/30)%4];
      const template=unitTemplates[Math.floor(v/120)%unitTemplates.length];
      const unit=Array.from(template,letter=>({A:a,B:b,C:c}[letter]));
      const growing = ex.type==='patternGrow' || (ex.type==='patternClassify' && (ex.patternGrowing??((i+v)%2===0)));
      const group = n => Math.floor(v/120)%2===0 ? [...Array(n).fill(a),b] : [a,...Array(n).fill(b)];
      const groups = growing ? (ex.type==='patternGrow'?[1,2]:[1,2,3]).map(group) : repeat([unit],ex.type==='patternRepeat'?2:3);
      const valid = ex.type !== 'patternRecognize' || (ex.patternValid??((i+v)%2===0));
      const shown=groups.flat();
      if(!valid)shown[shown.length-2]=(shown[shown.length-2]+3)%6;
      const next = growing ? Array.from({length:ex.type==='patternGrow'?2:(ex.patternSteps||1)},(_,j)=>group(j+groups.length+1)) : [unit,unit];
      return {unit,shown,groups,next,growing,valid};
    });
  }
  function strip(items, {blank=0, mark=0, mosaic=false, answerFrom=Infinity, width=610, simple=false}={}) {
    const total=items.length+blank, step=Math.min(39,(width-10)/Math.max(total,1)), height=49;
    const tiles = [...items,...Array(blank).fill(null)].map((id,i) => {
      const x=5+i*step, size=Math.min(32,step-3);
      if(mosaic) return `<g transform="translate(${x},8)"><rect width="${size}" height="${size}" fill="white" stroke="#758da2"/>${id===null?'':`<path d="M0 0H${size}L0 ${size}Z" fill="${colors[id%6]}"/><path d="M${size} 0V${size}H0Z" fill="${colors[(id+2)%6]}"/>`}<path d="M0 ${size} ${size} 0" stroke="#758da2" fill="none"/></g>`;
      return id===null ? `<rect x="${x}" y="7" width="${size}" height="34" rx="5" fill="#fff" stroke="#a5b4c1" stroke-dasharray="3 3"/>` : `${icon(id,x,8,size,simple)}${i>=answerFrom?`<path d="M${x} 43h${size}" stroke="#258666" stroke-width="2"/>`:''}`;
    }).join('');
    return `<svg class="pattern-strip" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${tiles}${mark?`<path d="M4 4v40h${mark*step-2}V4" fill="none" stroke="#218565" stroke-width="2"/>`:''}</svg>`;
  }
  function help() {
    return `<div class="pattern-help"><h4>Herhalend patroon</h4>${strip([1,0,1,0,1,0],{mark:2})}<p>Hetzelfde stukje komt telkens terug. Het <b>kleinste stukje</b> dat herhaald wordt, is de <b>patrooneenheid</b>: een ster en een hart.</p></div><div class="pattern-help"><h4>Groeiend patroon</h4>${strip([1,0,1,0,0,1,0,0,0])}<p>Elke volgende groep wordt groter volgens een vaste regel. Hier blijft er één ster en komt er telkens <b>één hart bij</b>.</p></div>`;
  }
  // Each square has four triangular pieces: top, right, bottom, left.
  // Short motifs use four columns; the given part shows two identical units.
  const mosaicMotifs=[
    // Diamonds.
    [[[0,1,1,0],[1,1,0,0]],[[0,0,1,1],[1,0,0,1]],[[0,2,2,0],[2,2,0,0]],[[0,0,2,2],[2,0,0,2]]],
    // Hourglasses.
    [[[1,0,0,1],[0,0,1,1]],[[1,1,0,0],[0,1,1,0]],[[2,0,0,2],[0,0,2,2]],[[2,2,0,0],[0,2,2,0]]],
    // Right-pointing chevrons.
    [[[1,1,0,0],[0,1,1,0]],[[0,0,1,1],[1,0,0,1]],[[2,2,0,0],[0,2,2,0]],[[0,0,2,2],[2,0,0,2]]],
    // Alternating triangles pointing up and down.
    [[[0,1,1,0],[1,1,1,1]],[[0,0,1,1],[1,1,1,1]],[[2,2,2,2],[2,2,0,0]],[[2,2,2,2],[2,0,0,2]]],
    // Small checkerboard squares.
    [[[1,1,1,1],[0,0,0,0]],[[0,0,0,0],[1,1,1,1]],[[2,2,2,2],[0,0,0,0]],[[0,0,0,0],[2,2,2,2]]],
    // Pinwheels.
    [[[1,1,0,0],[0,1,1,0]],[[0,0,1,1],[1,0,0,1]],[[0,2,2,0],[2,2,0,0]],[[2,0,0,2],[0,0,2,2]]],
    // Diamond followed by an hourglass.
    [[[0,1,1,0],[1,1,0,0]],[[0,0,1,1],[1,0,0,1]],[[2,0,0,2],[0,0,2,2]],[[2,2,0,0],[0,2,2,0]]],
    // Two rising diagonal ribbons.
    [[[0,0,1,1],[1,1,0,0]],[[0,1,1,0],[0,0,0,0]],[[0,0,2,2],[2,2,0,0]],[[0,2,2,0],[0,0,0,0]]]
  ];
  const mosaicMotifIndex=ex=>Math.floor((ex.gridVariant||0)/30)%mosaicMotifs.length;
  function mosaicData(ex) {
    const v=ex.gridVariant||0;
    const base=mosaicMotifs[mosaicMotifIndex(ex)];
    const a=v%6,b=(a+1+Math.floor(v/6)%5)%6;
    const palette=['#ffffff',colors[a],colors[b]];
    const columns=base.map(column=>{
      return column.map(parts=>parts.map(color=>palette[color]));
    });
    return columns;
  }
  function mosaicStrip(ex,solved) {
    const unit=mosaicData(ex),size=25,width=unit.length*4*size;
    const triangles=['0,0 25,0 12.5,12.5','25,0 25,25 12.5,12.5','25,25 0,25 12.5,12.5','0,25 0,0 12.5,12.5'];
    let tiles='';
    for(let col=0;col<unit.length*4;col++)for(let row=0;row<2;row++) {
      const given=col<unit.length*2;
      tiles+=`<g data-mosaic-cell="${col},${row}" data-given="${given}" transform="translate(${col*size},${row*size})">${triangles.map((points,i)=>`<polygon points="${points}" fill="${given||solved?unit[col%unit.length][row][i]:'#ffffff'}" stroke="#658ea3" stroke-width=".55"/>`).join('')}</g>`;
    }
    return `<svg class="pattern-strip pattern-mosaic" viewBox="-1 -5 ${width+2} 61" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mozaïekstrook met twee rijen driehoekige vakjes: kleur het beginpatroon twee keer verder">${tiles}<rect width="${width}" height="50" fill="none" stroke="#446d83" stroke-width=".8"/>${solved?`<path d="M0 -2V-4H${unit.length*size}V-2" fill="none" stroke="#218565" stroke-width="1.5"/>`:''}</svg>`;
  }
  function body(ex, showPrompt=true) {
    if(ex.type==='patternHelp')return help();
    const solved=state.solutionMode;
    const prompts={patternRecognize:'Zet een kruisje als het een herhalend patroon is. Duid dan de kleinste patrooneenheid aan.',patternRepeat:'Duid de kleinste patrooneenheid aan. Teken het patroon twee keer verder.',patternUnit:'Teken in het vak de kleinste patrooneenheid.',patternClassify:'Is het een herhalend (H) of groeiend (G) patroon? Schrijf H of G.',patternGrow:'Zet het groeiende patroon 2 keer verder.',patternMosaic:'Duid de kleinste patrooneenheid aan. Kleur het patroon twee keer verder.'};
    return (showPrompt?`<p class="prompt">${prompts[ex.type]}</p>`:'')+rowsFor(ex).map((row,i)=>{
      const extend=['patternRepeat','patternGrow','patternMosaic'].includes(ex.type), next=row.next.flat();
      let figures='';
      if(ex.type==='patternMosaic') {
        figures=mosaicStrip(ex,solved);
      } else if(ex.type==='patternGrow') {
        figures='<div class="pattern-inline">'+row.groups.map(g=>`<div class="pattern-inline-group">${g.map(id=>icon(id,0,0,32,true)).join('')}</div>`).join('')+row.next.map(g=>`<div class="pattern-grow-space" aria-label="Teken de volgende groep">${solved?g.map(id=>icon(id,0,0,32,true)).join(''):''}</div>`).join('')+'</div>';
      } else if(ex.type==='patternRepeat') {
        figures=`<div class="pattern-inline ${row.unit.length===4?'pattern-inline-long':''}"><div class="pattern-given">`+row.groups.map((g,j)=>`<span class="pattern-given-unit ${solved&&j===0?'solved':''}">${g.map(id=>icon(id,0,0,32,true)).join('')}</span>`).join('')+'</div>'+next.map(id=>`<span class="pattern-cell">${solved?icon(id,0,0,40,true):''}</span>`).join('')+'</div>';
      } else figures=strip(solved&&extend?[...row.shown,...next]:row.shown,{blank:extend&&!solved?next.length:0,mark:solved&&row.valid&&ex.type!=='patternClassify'?row.unit.length:0,mosaic:ex.type==='patternMosaic',answerFrom:row.shown.length,simple:ex.type==='patternUnit'});
      const response=ex.type==='patternRecognize'?`<div class="pattern-response"><span class="pattern-write">${solved&&row.valid?'×':''}</span> Herhalend patroon${solved&&!row.valid?'<span class="pattern-answer">— geen vaste herhaling</span>':''}</div>`:ex.type==='patternClassify'?`<div class="pattern-response">H of G: <span class="pattern-write">${solved?(row.growing?'G':'H'):''}</span></div>`:ex.type==='patternUnit'?`<div class="pattern-response">Patrooneenheid: <span class="pattern-draw">${solved?row.unit.map(id=>icon(id,0,0,40,true)).join(''):''}</span></div>`:'';
      if(ex.type==='patternRecognize')return `<div class="pattern-row"><div class="pattern-recognize-line">${figures}<span class="pattern-write" aria-label="Herhalend patroon aankruisen">${solved&&row.valid?'×':''}</span></div>${solved&&!row.valid?'<div class="pattern-answer pattern-recognize-note">Geen vaste herhaling</div>':''}</div>`;
      return `<div class="pattern-row">${figures}${response}</div>`;
    }).join('');
  }
  function drawingCells(items,solved) {
    return `<div class="pattern-cells">${items.map(id=>`<span class="pattern-cell">${solved?icon(id,0,0,40,true):''}</span>`).join('')}</div>`;
  }
  const baseMake=make;
  make=function(type,forced={}) { const ex=baseMake(type,forced); if(types[type]) { ex.gridVariant=forced.gridVariant??n(0,variantCount-1); ex.patternSteps=2; ex.patternGroup=forced.patternGroup??ex.id; } return ex; };
  // Compare the actual visible sequence, not variant numbers (several variants can look identical).
  const seenPatterns=new Set();
  function patternKey(ex) {
    if(ex.type==='patternHelp')return 'patternHelp';
    // A colour change alone is not a new mosaic exercise.
    if(ex.type==='patternMosaic')return JSON.stringify(['mosaic',mosaicMotifs[mosaicMotifIndex(ex)]]);
    const row=rowsFor(ex)[0];
    const style=['patternRepeat','patternGrow','patternUnit'].includes(ex.type)?'flat':ex.type==='patternMosaic'?'mosaic':'illustrated';
    return JSON.stringify([style,row.shown]);
  }
  const baseUnique=makeUnique;
  makeUnique=function(type,forced={},existing=state.exercises) {
    if(!types[type])return baseUnique(type,forced,existing);
    if(type==='patternRecognize'&&forced.patternValid===undefined) {
      const peers=existing.filter(ex=>ex.type===type&&(!forced.patternGroup||ex.patternGroup===forced.patternGroup));
      const validCount=peers.filter(ex=>rowsFor(ex)[0].valid).length;
      forced={...forced,patternValid:peers.length?validCount<peers.length-validCount:Math.random()<.5};
    }
    if(type==='patternClassify'&&forced.patternGrowing===undefined) {
      const peers=existing.filter(ex=>ex.type===type&&(!forced.patternGroup||ex.patternGroup===forced.patternGroup));
      const growingCount=peers.filter(ex=>rowsFor(ex)[0].growing).length;
      forced={...forced,patternGrowing:peers.length?growingCount<peers.length-growingCount:Math.random()<.5};
    }
    const used=new Set([...seenPatterns,...existing.filter(ex=>types[ex.type]).map(patternKey)]);
    const start=n(0,variantCount-1);
    for(let offset=0;offset<variantCount;offset++) {
      const ex=make(type,{...forced,gridVariant:(start+offset)%variantCount});
      const key=patternKey(ex);
      if(!used.has(key)){seenPatterns.add(key);return ex;}
    }
    return null;
  };
  const baseTitle=titleFor; titleFor=t=>types[t]?.[0]||baseTitle(t);
  const baseDesired=desired;
  desired=function() {
    if(!panel.classList.contains('active'))return baseDesired();
    const out=[];
    Object.keys(types).forEach(type=>{
      const count=Math.max(0,Math.min(8,Math.floor(Number($(`#count-${type}`).value)||0)));
      const patternGroup=uid();
      // Choose both kinds deliberately; random selection alone can produce only correct rows.
      const kinds=shuffled(Array.from({length:count},(_,i)=>i%2===0));
      for(let i=0;i<count;i++){
        const forced={patternGroup};
        if(type==='patternRecognize')forced.patternValid=count===1?Math.random()<.5:kinds[i];
        if(type==='patternClassify'&&count>1)forced.patternGrowing=kinds[i];
        const ex=makeUnique(type,forced,[...state.exercises,...out]);
        if(ex)out.push(ex);
      }
    });
    return out;
  };
  const baseRender=renderEx;
  renderEx=function(ex,index) {
    if(!types[ex.type])return baseRender(ex,index);
    const previous=state.exercises[index-1];
    const continuation=ex.type!=='patternHelp'&&previous?.type===ex.type&&previous.patternGroup===ex.patternGroup;
    return `<section class="exercise pattern-exercise" data-id="${ex.id}" data-pattern-type="${ex.type}"><div class="editbar no-print"><button data-act="up" title="Omhoog">↑</button><button data-act="down" title="Omlaag">↓</button><button data-act="replace" title="Deze rij vervangen">↻</button><button data-act="addsame" title="Extra rij bij deze opdracht">+ oefening</button><button data-act="delete" title="Deze rij verwijderen">✕</button></div>${continuation?'':`<h3>${index+1}. ${titleFor(ex.type)}</h3>`}${body(ex,!continuation)}</section>`;
  };
  const baseBindEdit=bindEdit;
  bindEdit=function() {
    baseBindEdit();
    $$('#pages .pattern-exercise .editbar button').forEach(button=>{
      if(!['addsame','replace'].includes(button.dataset.act))return;
      button.onclick=()=>{
        const id=button.closest('.exercise').dataset.id;
        const index=state.exercises.findIndex(ex=>String(ex.id)===id);
        if(index<0)return;
        const original=state.exercises[index];
        const fresh=makeUnique(original.type,{patternGroup:original.patternGroup,patternSteps:original.patternSteps},state.exercises);
        if(!fresh){alert('Er zijn geen andere unieke rijen van deze opdracht meer beschikbaar.');return;}
        if(button.dataset.act==='addsame')state.exercises.splice(index+1,0,fresh);
        else state.exercises.splice(index,1,fresh);
        render();
      };
    });
  };
  if(window.MeetkundeShared) { const catalog=window.MeetkundeShared.catalog; window.MeetkundeShared.catalog=()=>[...catalog(),...Object.entries(types).map(([type,[label]])=>({group:'Patronen',type,label}))]; }
})();
