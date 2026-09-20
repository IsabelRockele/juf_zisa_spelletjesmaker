/* Picture-based exercises; model answers are rendered only in solution mode. */
(() => {
  const assetBase=new URL('figuren/',document.currentScript.src);
  const types={
    flatCross:['flat','Vlakke figuren zoeken met gekleurde kruisjes'],
    flatColorTable:['flat','Vormen op de juiste plaats tekenen in een kleurentabel'],
    flatColor:['flat','Vlakke figuren kleuren volgens de legende'],
    flatPhotoMatch:['flat','Foto’s verbinden met de juiste vlakke figuur'],
    flatPhotoFind:['flat','Vlakke figuren herkennen in foto’s'],
    flatPictureFind:['flat','Vormen herkennen in samengestelde figuurtjes'],
    flatPiecesMatch:['flat','Losse vormen verbinden met een figuurtje'],
    solidHelp:['solids','Uitleg: vlakke figuren en ruimtelichamen'],
    solidSortPictures:['solids','Vlakke figuren en ruimtelichamen sorteren'],
    solidRollSlide:['solids','Ruimtelichamen: rollen en schuiven']
  };
  const palette={circle:'#087bb9',triangle:'#e97c25',square:'#ce3b32',rectangle:'#2d934e'};
  const variants={flatCross:12,flatColor:12,flatColorTable:4,flatPhotoMatch:3,flatPhotoFind:3,flatPictureFind:3,flatPiecesMatch:3,solidHelp:1,solidSortPictures:3,solidRollSlide:3};
  const limitedTypes=new Set(['flatPictureFind','flatPiecesMatch','flatPhotoMatch','flatPhotoFind','solidSortPictures','solidRollSlide','solidHelp']);
  const characterSet=ex=>((ex.gridVariant||0)%3+3)%3;
  const characterIds=ex=>Array.from({length:4},(_,i)=>characterSet(ex)*4+i);
  const names={circle:'cirkel',triangle:'driehoek',square:'vierkant',rectangle:'rechthoek'};
  const keys=Object.keys(names);
  const solids={cube:'kubus',block:'balk',sphere:'bol',cylinder:'cilinder',cone:'kegel',pyramid:'piramide'};
  const style=document.createElement('style');
  style.textContent=`.figure-extra>.editbar{position:static;transform:none;justify-content:flex-end;margin-bottom:2mm}.figure-extra-svg{display:block;width:100%;height:auto;margin:3mm auto}.figure-photo{display:block;width:100%;height:34mm}.figure-picture{display:block;width:100%;height:39mm}.figure-object-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin:3mm 0}.figure-object-card{text-align:center;font-size:10pt}.figure-options{text-align:left;font-size:9pt;display:grid;grid-template-columns:1fr 1fr;gap:2mm}.figure-check{display:inline-flex;width:3.5mm;height:3.5mm;border:1px solid #6d8595;color:#087bb9;align-items:center;justify-content:center;margin-right:1mm}.figure-table{width:100%;border-collapse:collapse;margin:3mm 0;font-size:10pt}.figure-table th,.figure-table td{border:1px solid #829eaf;text-align:center;height:18mm;padding:2mm}.figure-sort-answers{table-layout:fixed}.figure-sort-answers th,.figure-sort-answers td{height:12mm;padding:2mm}.figure-sort-answers th{font-size:10pt;font-weight:400}.figure-number-line{display:block;width:80%;margin:auto;border-bottom:1px solid #aebbc4;height:5mm}.figure-table th svg,.figure-table td svg{width:16mm;height:14mm;display:block;margin:auto}.figure-help{border:1px solid #7aafa2;border-radius:3mm;padding:4mm;margin:3mm 0;font-size:10.5pt;line-height:1.4}.figure-help h4{margin:0 0 2mm;color:#257967}.figure-help p{margin:2mm 0}.figure-solid-row{display:grid;grid-template-columns:repeat(6,1fr);gap:2mm;text-align:center;font-size:9pt}.figure-solid-row svg{width:100%;height:25mm}.figure-sort-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4mm}.figure-sort-grid .figure-sort-cell>svg{width:100%;height:30mm}.figure-sort-cell{text-align:center;font-size:10pt}.figure-solution{color:#087bb9}.figure-legend{font-size:10pt;line-height:1.6;margin:2mm 0}.figure-venn-labels{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;font-size:9pt}.figure-venn-labels>div{border:1px solid #829eaf;min-height:32mm;padding:2mm 3mm 3mm;text-align:center}.figure-venn-line{display:block;width:100%;height:8mm;border-bottom:.25mm solid #829eaf;color:#087bb9;font-weight:700;font-size:9pt;line-height:8mm}.figure-venn-line:first-of-type{margin-top:5mm}`;
  document.head.append(style);
  style.textContent+=`.figure-object-grid{gap:0}.figure-object-card{min-width:0;padding:2mm 2.5mm}.figure-object-card + .figure-object-card{border-left:.3mm solid #829eaf}.figure-options{column-gap:1mm;margin-top:2mm}.figure-options>div{white-space:nowrap}`;
  for(const [type,[tab,label]] of Object.entries(types)){
    const heading={flatCross:'Vormen herkennen en kleuren',flatPhotoMatch:'Vormen in foto’s en figuurtjes',solidHelp:'Vlakke figuren en ruimtelichamen',solidRollSlide:'Rollen en schuiven'}[type];
    if(heading){const h=document.createElement('h3');h.textContent=heading;document.querySelector(`[data-panel="${tab}"]`).append(h);}
    const group=document.createElement('div');group.className='group exercise-picker';group.innerHTML=`<div class="group-title" role="button" tabindex="0" aria-expanded="false">${label}</div><div class="type-count"><span class="mini">Aantal opdrachten</span><label class="field"><input id="count-${type}" type="number" min="0" max="${Math.min(8,variants[type])}" value="0" aria-label="Aantal: ${label}"></label></div>`;
    const title=group.querySelector('.group-title'),input=group.querySelector('input');const toggle=()=>{const open=group.classList.toggle('selected');title.setAttribute('aria-expanded',String(open));input.value=open?1:0;};title.onclick=toggle;title.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}};
    document.querySelector(`[data-panel="${tab}"]`).append(group);document.querySelector('#addType').add(new Option(label,type));
    if(limitedTypes.has(type)){
      group.insertAdjacentHTML('beforeend',`<div class="mini">${type==='solidHelp'?'Dit uitlegkader kan één keer in de bundel.':'Maximaal 3 opdrachten met verschillende afbeeldingen.'}</div>`);
      const guard=e=>{if(state.exercises.filter(ex=>ex.type===type).length>=variants[type]){e.preventDefault();e.stopImmediatePropagation();}};
      title.addEventListener('click',guard,true);title.addEventListener('keydown',guard,true);
    }
  }
  const baseMake=make;make=function(type,forced={}){const ex=baseMake(type,forced);if(types[type])ex.gridVariant=forced.gridVariant??n(0,variants[type]-1);return ex;};
  const baseUnique=makeUnique;
  makeUnique=function(type,forced={},existing=state.exercises){
    if(!limitedTypes.has(type))return baseUnique(type,forced,existing);
    const same=existing.filter(ex=>ex.type===type),used=new Set(same.map(characterSet));
    if(same.length>=variants[type])return null;
    const available=Array.from({length:variants[type]},(_,i)=>i).filter(id=>!used.has(id));
    return available.length?make(type,{...forced,gridVariant:available[n(0,available.length-1)]}):null;
  };
  const baseRefresh=render;
  render=function(){baseRefresh();for(const type of limitedTypes){const remaining=variants[type]-state.exercises.filter(ex=>ex.type===type).length,input=document.getElementById('count-'+type),group=input.closest('.group');input.max=String(Math.max(0,remaining));input.value=Math.min(Number(input.value)||0,Math.max(0,remaining));input.disabled=remaining<=0;group.querySelector('.group-title').setAttribute('aria-disabled',String(remaining<=0));document.querySelector(`#addType option[value="${type}"]`).disabled=remaining<=0;}};
  const baseTitle=titleFor;titleFor=t=>types[t]?.[1]||baseTitle(t);
  const baseDesired=desired;desired=function(){const out=baseDesired(),tab=document.querySelector('.tab-panel.active')?.dataset.panel;for(const [type,[group]] of Object.entries(types)){if(group!==tab)continue;const count=Math.max(0,Math.min(8,Math.floor(Number(document.querySelector('#count-'+type).value)||0)));for(let i=0;i<count;i++){const ex=makeUnique(type,{},[...state.exercises,...out]);if(ex)out.push(ex);}}return out;};
  function shape(type,x=0,y=0,size=50,fill='white',rotation=0){
    const drawing={circle:'<circle cx="30" cy="30" r="22"/>',triangle:'<path d="M30 6 55 52H5Z"/>',square:'<rect x="9" y="9" width="42" height="42"/>',rectangle:'<rect x="3" y="17" width="54" height="26"/>',oval:'<ellipse cx="30" cy="30" rx="14" ry="25"/>',hexagon:'<path d="M16 7H44L58 30 44 53H16L2 30Z"/>',pentagon:'<path d="M30 3 57 23 46 55H14L3 23Z"/>',trapezoid:'<path d="M15 10H45L57 50H3Z"/>'}[type];
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 60 60"><g transform="rotate(${rotation} 30 30)" fill="${fill}" stroke="#333" stroke-width="1.2">${drawing}</g></svg>`;
  }
  let cropSequence=0;
  function crop(index,characters=false,x=0,y=0,w=140,h=110){
    const cols=characters?2:4,rows=characters?2:3,cw=1536/cols,ch=1024/rows;
    const file=characters?['vormenfiguurtjes.png','vormenfiguurtjes-2.png','vormenfiguurtjes-3.png'][Math.floor(index/4)]:[ 'voorwerpen.png','voorwerpen-2.png','voorwerpen-3.png'][Math.floor(index/12)];
    index%=characters?4:12;
    const sx=(index%cols)*cw,sy=Math.floor(index/cols)*ch,clipId='figure-crop-'+(++cropSequence);
    // Clip to the source cell, not just the viewport: letterboxing must not reveal its neighbours.
    return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${sx} ${sy} ${cw} ${ch}" overflow="hidden"><defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${sx}" y="${sy}" width="${cw}" height="${ch}"/></clipPath></defs><image clip-path="url(#${clipId})" href="${new URL(file,assetBase).href}" width="1536" height="1024"/></svg>`;
  }
  const ordered=(a,v)=>a.slice(v%a.length).concat(a.slice(0,v%a.length));
  function shapeSearch(ex,coloring=false){const v=ex.gridVariant||0,entries=ordered(['circle','triangle','square','rectangle','oval','hexagon','square','circle','trapezoid','triangle','rectangle','pentagon'],v);return `<p class="prompt">${coloring?'Kleur de vormen volgens de legende. Laat de andere vormen wit.':'Zet een kruisje in elke gevraagde figuur. Laat de andere figuren leeg.'}</p><p class="figure-legend">Blauw: cirkels · Oranje: driehoeken · Rood: vierkanten · Groen: rechthoeken die geen vierkant zijn.</p><svg class="figure-extra-svg" viewBox="0 0 600 245">${entries.map((type,i)=>{const x=8+(i%6)*100,y=8+Math.floor(i/6)*120,c=palette[type],angle=(type==='square'||type==='rectangle')?(i%2?35:0):0;return shape(type,x,y,80,state.solutionMode&&coloring&&c?c:'white',angle)+(state.solutionMode&&!coloring&&c?`<path class="figure-model" d="M${x+32} ${y+32}l16 16m0-16-16 16" fill="none" stroke="${c}" stroke-width="2"/>`:'');}).join('')}</svg>`;}
  function colorWord(color,type){const words={'#e97c25':['oranje','oranje'],'#ce3b32':['rood','rode'],'#2d934e':['groen','groene'],'#087bb9':['blauw','blauwe']};return words[color][type==='square'?0:1];}
  function colorTable(ex){const v=ex.gridVariant||0,columns=ordered(keys,v),colors=ordered(['#e97c25','#ce3b32','#2d934e','#087bb9'],v+1),wanted=ordered(keys,v+2);return `<p class="prompt">Teken op de juiste plaats:</p><ul class="figure-legend" style="margin:0 0 3mm;padding-left:6mm">${colors.map((c,i)=>`<li>een <span style="color:${c}">${colorWord(c,wanted[i])}</span> ${names[wanted[i]]}${i===colors.length-1?'.':';'}</li>`).join('')}</ul><table class="figure-table"><thead><tr><th></th>${columns.map(t=>`<th>${shape(t)}</th>`).join('')}</tr></thead><tbody>${colors.map((c,i)=>`<tr><th style="background:${c};width:14mm"></th>${columns.map(t=>`<td>${state.solutionMode&&wanted[i]===t?shape(t,0,0,50,c):''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
  const photoMatchSets=[[8,11,10,9],[12,13,14,15],[24,25,26,27]];
  const photoAnswers=['circle','triangle','square','rectangle'];
  function photoMatch(ex){const v=characterSet(ex),objects=photoMatchSets[v],bottom=ordered(keys,v+1);return `<p class="prompt">Welke vlakke figuur herken je in de omtrek? Verbind elke foto met de juiste figuur.</p><svg class="figure-extra-svg" viewBox="0 0 600 280">${objects.map((id,i)=>`${crop(id,false,i*150,0,140,110)}<circle cx="${70+i*150}" cy="115" r="2"/>`).join('')}${bottom.map((t,i)=>`<circle cx="${70+i*150}" cy="200" r="2"/>${shape(t,40+i*150,210,60)}`).join('')}${state.solutionMode?objects.map((id,i)=>`<path class="figure-model" d="M${70+i*150} 115L${70+bottom.indexOf(photoAnswers[i])*150} 200" stroke="#087bb9" stroke-width="1.5"/>`).join(''):''}</svg>`;}
  const characterShapes=id=>[...new Set(characterPieces[id].map(([kind])=>['tail','finLeft','finRight'].includes(kind)?'triangle':kind))];
  const photoFindSets=[
    [{id:0,caption:'Het dak en de ramen',shapes:['triangle','square']},{id:1,caption:'De laadbak en de wielen',shapes:['rectangle','circle']},{id:2,caption:'De wijzerplaat',shapes:['circle']},{id:9,caption:'De omtrek van de kaart',shapes:['rectangle']}],
    ['Het bord','De geodriehoek','De tegel','Het boek'].map((caption,i)=>({id:12+i,caption:'De omtrek: '+caption.toLowerCase(),shapes:[photoAnswers[i]]})),
    ['De pizza','De boterham','Het servet','Het krijtbord'].map((caption,i)=>({id:24+i,caption:'De omtrek: '+caption.toLowerCase(),shapes:[photoAnswers[i]]}))
  ];
  function photoFind(ex){const entries=photoFindSets[characterSet(ex)];return '<p class="prompt">Welke vlakke figuren herken je in de genoemde delen van de foto? Kruis aan. Kies bij een vierkant alleen ‘vierkant’.</p><div class="figure-object-grid">'+entries.map(e=>`<div class="figure-object-card"><svg class="figure-photo" viewBox="0 0 140 110">${crop(e.id)}</svg><p>${e.caption}</p><div class="figure-options">${keys.map(t=>`<div><span class="figure-check">${state.solutionMode&&e.shapes.includes(t)?'×':''}</span>${names[t]}</div>`).join('')}</div></div>`).join('')+'</div>';}
  function pictureFind(ex){return '<p class="prompt">Kruis de vlakke figuren aan die je in elk figuurtje herkent. Kleine ogen tellen ook mee. Kies bij vierkanten alleen ‘vierkant’.</p><div class="figure-object-grid">'+characterIds(ex).map(id=>`<div class="figure-object-card"><svg class="figure-picture" viewBox="0 0 140 110">${crop(id,true)}</svg><div class="figure-options">${keys.map(t=>`<div><span class="figure-check">${state.solutionMode&&characterShapes(id).includes(t)?'×':''}</span>${names[t]}</div>`).join('')}</div></div>`).join('')+'</div>';}
  // One entry per physical part, including each eye, window, arm and leg.
  const characterPieces=[
    [['circle',36,36,'#0088f5'],['tail',18,29,'#ff8800'],['circle',5,5,'#000000']],
    [['rectangle',19,35,'#0088f5'],['triangle',25,17,'#ff1717'],['finLeft',15,23,'#ff8800'],['finRight',15,23,'#ff8800'],['circle',12,12,'#ffe000']],
    [['square',33,33,'#ff8800'],['triangle',38,18,'#ff1717'],['rectangle',10,19,'#0088f5'],['square',9,9,'#0088f5'],['square',9,9,'#0088f5']],
    [['square',21,21,'#35c82c'],['rectangle',25,30,'#0088f5'],['rectangle',6,20,'#ff8800'],['rectangle',6,20,'#ff8800'],['rectangle',8,22,'#ff8800'],['rectangle',8,22,'#ff8800'],['circle',4.5,4.5,'#000000'],['circle',4.5,4.5,'#000000']],
    [['rectangle',38,8,'#0067d5'],['rectangle',4,32,'#81501f'],['finLeft',22,25,'#f00000'],['finRight',22,25,'#ffe000']],
    [['triangle',20,12,'#008536'],['triangle',28,14,'#008536'],['triangle',36,16,'#008536'],['rectangle',9,13,'#81501f']],
    [['rectangle',38,9,'#0067d5'],['square',22,22,'#f00000'],['square',10,10,'#ffe000'],['rectangle',6,15,'#000000'],['circle',13,13,'#000000'],['circle',13,13,'#000000'],['circle',13,13,'#000000']],
    [['circle',32,32,'#ffe000'],['circle',20,20,'#ffe000'],['circle',5,5,'#000000'],['tail',10,10,'#ff8800'],['rectangle',4,15,'#ff8800'],['rectangle',4,15,'#ff8800']],
    [['rectangle',32,24,'#0067ff'],['rectangle',14,36,'#0067ff'],['rectangle',14,36,'#0067ff'],['triangle',17,14,'#ff1010'],['triangle',17,14,'#ff1010'],['rectangle',9,16,'#ffe000']],
    [['circle',12,12,'#ffe000'],['circle',15,15,'#ff1010'],['circle',15,15,'#ff1010'],['circle',15,15,'#ff1010'],['circle',15,15,'#ff1010'],['rectangle',5,30,'#18aa12'],['tail',15,15,'#18aa12'],['tail',15,15,'#18aa12']],
    [['rectangle',38,9,'#0067ff'],['rectangle',25,14,'#ff1010'],['square',7,7,'#ffe000'],['square',7,7,'#ffe000'],['circle',12,12,'#000000'],['circle',12,12,'#000000']],
    [['circle',36,36,'#ff8800'],['triangle',15,20,'#ff8800'],['triangle',15,20,'#ff8800'],['circle',5,5,'#000000'],['circle',5,5,'#000000'],['triangle',9,7,'#ff1010']]
  ];
  function loosePieces(id,row){return `<g class="figure-piece-set" data-character="${id}">${characterPieces[id].map(([kind,w,h,color],j)=>{
    const x=5+(j%4)*40+(38-w)/2,y=row*110+(characterPieces[id].length>4?26+Math.floor(j/4)*45:55)-h/2;
    const drawing=kind==='circle'?`<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}"/>`:kind==='triangle'?`<path d="M${w/2} 0L${w} ${h}H0Z"/>`:kind==='tail'?`<path d="M0 0L${w} ${h/2}L0 ${h}Z"/>`:kind==='finLeft'?`<path d="M${w} 0V${h}H0Z"/>`:kind==='finRight'?`<path d="M0 0L${w} ${h}H0Z"/>`:`<rect width="${w}" height="${h}"/>`;
    return `<g class="figure-loose-piece" data-kind="${kind}" transform="translate(${x},${y})" fill="${color}" stroke="#222" stroke-width=".8">${drawing}</g>`;
  }).join('')}</g>`;}
  function piecesMatch(ex){const left=characterIds(ex),right=[left[2],left[0],left[3],left[1]];const connector=(x,y)=>`<circle class="figure-connector" cx="${x}" cy="${y}" r="4" fill="white" stroke="#526c7b" stroke-width="1.5"/>`;return `<p class="prompt">Verbind de open rondjes: elk kader met losse vormen hoort bij één figuurtje. Gebruik alle vormen uit het kader, elk precies één keer. Ook kleine onderdelen, zoals ogen, tellen mee.</p><svg class="figure-extra-svg" viewBox="0 0 600 460">${left.map((id,i)=>`<rect class="figure-piece-frame" x="1" y="${4+i*110}" width="164" height="98" rx="6" fill="white" stroke="#829eaf" stroke-width="1.2"/>${loosePieces(id,i)}${connector(177,55+i*110)}`).join('')}${right.map((id,i)=>`${connector(403,55+i*110)}${crop(id,true,418,i*110,175,105)}`).join('')}${state.solutionMode?left.map((id,i)=>`<path class="figure-model" d="M181 ${55+i*110}L399 ${55+right.indexOf(id)*110}" stroke="#087bb9" stroke-width="1.5"/>`).join(''):''}</svg>`;}
  function help(){return `<div class="figure-help"><h4>Vlakke figuren</h4><p>Een vlakke figuur heeft lengte en breedte. We tekenen ze plat.</p><svg viewBox="0 0 400 65" style="width:100%;height:22mm">${keys.map((t,i)=>shape(t,40+i*85,0,60,'#c9deed')).join('')}</svg><h4>Ruimtelichamen</h4><p>Een ruimtelichaam heeft ook hoogte of diepte. Het neemt ruimte in.</p><div class="figure-solid-row">${Object.entries(solids).map(([t,name])=>`<div>${solidSVG(t)}${name}</div>`).join('')}</div></div>`;}
  function sort(ex){const v=characterSet(ex),flatSets=[['triangle','rectangle','circle','square'],['oval','pentagon','trapezoid','hexagon'],['square','triangle','rectangle','circle']],photos=v===0?[4,3,6,7,5,2]:Array.from({length:6},(_,i)=>v*12+4+i),entries=[...flatSets[v].map((flat,i)=>({flat,rotation:v===2?30+i*15:0})),...photos.map(photo=>({photo}))].map((_,i,a)=>a[[4,0,5,6,1,7,2,8,9,3][i]]);return `<p class="prompt">Is het een vlakke figuur of een ruimtelichaam? Schrijf de nummers op de juiste plaats.</p><div class="figure-sort-grid">${entries.map((e,i)=>`<div class="figure-sort-cell"><b>${i+1}</b>${e.flat?shape(e.flat,0,0,50,'white',e.rotation):e.solid?solidSVG(e.solid):`<svg viewBox="0 0 140 110">${crop(e.photo)}</svg>`}</div>`).join('')}</div><table class="figure-table figure-sort-answers"><colgroup><col style="width:38mm">${Array.from({length:6},()=>'<col>').join('')}</colgroup>${['Vlakke figuren','Ruimtelichamen'].map((label,row)=>{const numbers=entries.flatMap((e,i)=>Boolean(e.flat)===(row===0)?[i+1]:[]);return `<tr><th>${label}</th>${Array.from({length:6},(_,i)=>`<td class="figure-solution">${state.solutionMode?(numbers[i]??''):'<span class="figure-number-line"></span>'}</td>`).join('')}</tr>`;}).join('')}</table>`;}
  function rollSlide(ex){const v=characterSet(ex),entries=['sphere','cone','block','pyramid','cylinder'],photos=v===0?[4,3,6,7,5]:Array.from({length:5},(_,i)=>v*12+4+i),nums=group=>entries.flatMap((t,i)=>group.includes(t)?[i+1]:[]).join(', ');return `<p class="prompt">Schrijf de nummers in de juiste delen van de verzamelingen. Geef de drie vakken onderaan de juiste naam.</p><p class="figure-legend">Kies uit: alleen rollen · rollen en schuiven · alleen schuiven.<br>Denk aan de ideale vorm van het voorwerp. We bekijken of een lichaam kan rollen op een gebogen oppervlak of schuiven op een plat vlak.</p><div class="figure-sort-grid">${entries.map((t,i)=>`<div class="figure-sort-cell">${`<svg viewBox="0 0 140 110">${crop(photos[i])}</svg>`}<b>${i+1}</b></div>`).join('')}</div><svg class="figure-extra-svg" viewBox="0 0 600 190"><ellipse cx="230" cy="85" rx="130" ry="72" fill="none" stroke="#444"/><ellipse cx="370" cy="85" rx="130" ry="72" fill="none" stroke="#444"/><g fill="none" stroke="#829eaf"><path d="M170 135L100 185M300 130V185M430 135L500 185"/></g>${state.solutionMode?`<g class="figure-model" font-family="Arial" font-size="18" fill="#087bb9"><text x="165" y="90">${nums(['sphere'])}</text><text x="275" y="90">${nums(['cone','cylinder'])}</text><text x="400" y="90">${nums(['block','pyramid'])}</text></g>`:''}</svg><div class="figure-venn-labels">${['alleen rollen','rollen en schuiven','alleen schuiven'].map((t,i)=>`<div>Vak ${i+1}<span class="figure-venn-line">${state.solutionMode?(i===1?'rollen en':t):''}</span><span class="figure-venn-line">${state.solutionMode&&i===1?'schuiven':''}</span></div>`).join('')}</div>`;}
  const builders={flatCross:ex=>shapeSearch(ex),flatColor:ex=>shapeSearch(ex,true),flatColorTable:colorTable,flatPhotoMatch:photoMatch,flatPhotoFind:photoFind,flatPictureFind:pictureFind,flatPiecesMatch:piecesMatch,solidHelp:help,solidSortPictures:sort,solidRollSlide:rollSlide};
  const baseRender=renderEx;renderEx=function(ex,index){if(!types[ex.type])return baseRender(ex,index);const full=limitedTypes.has(ex.type)&&state.exercises.filter(item=>item.type===ex.type).length>=variants[ex.type];return `<section class="exercise figure-extra" data-id="${ex.id}" data-figure-type="${ex.type}"><div class="editbar no-print"><button data-act="up">↑</button><button data-act="down">↓</button>${full?`<span class="mini">${ex.type==='solidHelp'?'Uitleg toegevoegd':'Alle 3 afbeeldingssets toegevoegd'}</span>`:'<button data-act="replace" title="Andere opdracht">↻</button><button data-act="addsame">+ oefening</button>'}<button data-act="delete">✕</button></div><h3>${index+1}. ${types[ex.type][1]}</h3>${builders[ex.type](ex)}</section>`;};
  const baseBind=bindEdit;bindEdit=function(){baseBind();document.querySelectorAll('#pages .figure-extra [data-act="replace"]').forEach(button=>{const section=button.closest('.exercise');if(!limitedTypes.has(section.dataset.figureType))return;button.onclick=()=>{const i=state.exercises.findIndex(ex=>String(ex.id)===section.dataset.id);if(i<0)return;const fresh=makeUnique(state.exercises[i].type,{},state.exercises);if(fresh){state.exercises.splice(i,1,fresh);render();}};});};
})();

// Pattern rows share one assignment; other exercise records are complete assignments.
function meetkundeAssignmentGroups(exercises=state.exercises){
  const groups=[],byKey=new Map();
  for(const ex of exercises){
    const key=ex.type.startsWith('pattern')&&ex.type!=='patternHelp'
      ?`${ex.type}:${ex.patternGroup??ex.id}`:`exercise:${ex.id}`;
    if(!byKey.has(key)){const group=[];byKey.set(key,group);groups.push(group);}
    byKey.get(key).push(ex);
  }
  return groups;
}

/* Number and move assignments, including all their rows. */
(() => {
  const baseRender=renderEx;
  renderEx=function(ex,index){
    const actualIndex=state.exercises.indexOf(ex);
    const number=meetkundeAssignmentGroups().findIndex(group=>group.includes(ex))+1;
    return baseRender(ex,actualIndex<0?index:actualIndex).replace(/(<h3\b[^>]*>)\d+\./,`$1${number||index+1}.`);
  };
  const baseBind=bindEdit;
  bindEdit=function(){
    baseBind();
    document.querySelectorAll('#pages [data-act="up"],#pages [data-act="down"]').forEach(button=>{
      button.title=button.dataset.act==='up'?'Hele opdracht omhoog':'Hele opdracht omlaag';
      button.onclick=()=>{
        const groups=meetkundeAssignmentGroups(),id=button.closest('.exercise').dataset.id;
        const from=groups.findIndex(group=>group.some(ex=>String(ex.id)===id));
        const to=from+(button.dataset.act==='up'?-1:1);
        if(from<0||to<0||to>=groups.length)return;
        [groups[from],groups[to]]=[groups[to],groups[from]];
        state.exercises.splice(0,state.exercises.length,...groups.flat());
        render();
      };
    });
  };
})();

/* Fill gaps without separating rows belonging to the same assignment. */
(() => {
  const label=document.createElement('label');label.className='check';
  label.innerHTML='<input type="checkbox" id="compactPages" checked> Vul lege ruimte met een volgende passende opdracht';
  document.getElementById('pageNumbers').closest('label').after(label);
  const compact=label.querySelector('input');compact.onchange=()=>render();
  // An explicit move takes precedence over automatic packing.
  document.getElementById('pages').addEventListener('click',event=>{
    if(event.target.closest('[data-act="up"],[data-act="down"]'))compact.checked=false;
  },true);
  const sequentialPaginate=paginate;
  paginate=function(){
    const baseline=sequentialPaginate();
    if(!compact.checked||state.solutionMode||baseline.length<2)return baseline;
    const original=state.exercises.slice(),pending=meetkundeAssignmentGroups(),pages=[];
    let current=[],m=makeMeasurePage(0);
    const nextPage=()=>{pages.push(current);current=[];m.host.remove();m=makeMeasurePage(pages.length);};
    const append=ex=>{
      const holder=document.createElement('div');
      holder.innerHTML=renderEx(ex,state.exercises.indexOf(ex));
      const node=holder.firstElementChild;m.content.append(node);return node;
    };
    const fits=node=>node.getBoundingClientRect().bottom<=m.page.querySelector('.page-footer').getBoundingClientRect().top-6;
    try{
      while(pending.length){
        let chosen=-1;
        for(let i=0;i<pending.length;i++){
          state.exercises.splice(0,state.exercises.length,...pages.flat(),...current,...pending[i],...pending.filter((_,j)=>j!==i).flat());
          const node=append(pending[i][0]),canStart=fits(node)||!current.length;
          node.remove();if(canStart){chosen=i;break;}
        }
        if(chosen<0){nextPage();continue;}
        for(const ex of pending.splice(chosen,1)[0]){
          const node=append(ex);
          if(!fits(node)&&current.length){node.remove();nextPage();append(ex);}
          current.push(ex);
        }
      }
      if(current.length)pages.push(current);
    }finally{m.host.remove();state.exercises.splice(0,state.exercises.length,...original);}
    if(pages.length>baseline.length)return baseline;
    // Keep numbering and the move/delete controls aligned with the visible order.
    state.exercises.splice(0,state.exercises.length,...pages.flat());
    return pages;
  };
})();
