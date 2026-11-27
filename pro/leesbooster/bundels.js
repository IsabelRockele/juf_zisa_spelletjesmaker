(() => {
  'use strict';
  const data = window.LEESBUNDELS;
  const $ = id => document.getElementById(id);
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let selected = data.find(c => c.id === location.hash.slice(1)) || data[0];
  const gameTypes=[
    {id:'wordsearch',name:'Woordzoeker',hint:'Alleen · zoeken, lezen en afstrepen'},
    {id:'storyhunt',name:'Verhaalspeurder',hint:'Alleen · woorden zoeken en een mini-strip tekenen'},
    {id:'connect',name:'Vier op een rij',hint:'Met twee · lezen en fiches kleuren'},
    {id:'race',name:'Het sterrenpad',hint:'Met twee · een dobbeltocht naar de schat'},
    {id:'emotion',name:'Het leestheater',hint:'Met twee · lezen met gevoel'},
    {id:'ribbon',name:'Woordenslingers',hint:'Alleen · woorden losmaken en lezen'},
    {id:'truefalse',name:'De verhaaldetective',hint:'Alleen · waar of niet waar bij het verhaal'},
    {id:'wordbuilder',name:'Woordbouwers',hint:'Alleen · twee delen samenvoegen'}
  ];
  const gameStorageKey='zisa-leesbundels-spellen-v1';
  let choices={};
  try{const saved=JSON.parse(localStorage.getItem(gameStorageKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))choices=saved;}catch{}
  const availableGames=()=>gameTypes.filter(g=>(g.id!=='truefalse'||selected.statements)&&(g.id!=='wordbuilder'||selected.wordParts));
  const games=()=>Array.isArray(choices[selected.id])?choices[selected.id].filter(id=>availableGames().some(g=>g.id===id)):[];
  function gameChoices(){
    $('gameChoices').innerHTML=availableGames().map(g=>`<label class="game-choice"><input type="checkbox" data-game="${g.id}" ${games().includes(g.id)?'checked':''}><span><b>${g.name}</b><small>${g.hint}</small></span></label>`).join('');
  }
  function saveGames(ids){choices[selected.id]=ids;try{localStorage.setItem(gameStorageKey,JSON.stringify(choices));}catch{}render();}
  let currentStep=0;
  const steps=['category','words','games','lines'];
  function showStep(index,focus=false){
    currentStep=Math.max(0,Math.min(3,index));
    steps.forEach((name,i)=>{
      const tab=$('tab-'+name),active=i===currentStep;
      tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
      $('panel-'+name).hidden=!active;if(active&&focus)tab.focus();
    });
    $('stepLabel').textContent='Stap '+(currentStep+1)+' van 4';
    $('previousStep').disabled=currentStep===0;
    $('nextStep').textContent=currentStep===3?'Bekijk mijn bundel ↓':'Volgende →';
    if(currentStep===3)window.SpellingSchrijflijnen.tekenLijntypePreviews();
    render();
  }
  steps.forEach((name,i)=>{
    $('tab-'+name).addEventListener('click',()=>showStep(i));
    $('tab-'+name).addEventListener('keydown',e=>{
      const next=e.key==='ArrowRight'?(i+1)%4:e.key==='ArrowLeft'?(i+3)%4:e.key==='Home'?0:e.key==='End'?3:null;
      if(next!==null){e.preventDefault();showStep(next,true);}
    });
  });
  $('previousStep').addEventListener('click',()=>showStep(currentStep-1,true));
  $('nextStep').addEventListener('click',()=>{
    if(currentStep<3)showStep(currentStep+1,true);
    else {$('selectedTitle').scrollIntoView({behavior:'smooth',block:'start'});$('downloadPdf').focus({preventScroll:true});}
  });
  let lineType='type3';
  const lineNames=['Klassiek hulp','Standaard','Kleurgecodeerd','Grijs-blauw','Intens kleur','Enkele lijn','Twee lijnen'];
  const writing=(n=1)=>Array.from({length:n},()=>`<div class="writing-set">${window.SpellingSchrijflijnen.htmlCanvas(lineType,$('lineHeight').value,700)}</div>`).join('');
  function lineChoices(){
    $('lineTypes').innerHTML=lineNames.map((name,i)=>`<button type="button" data-line="type${i+1}" aria-pressed="${lineType===`type${i+1}`}" title="Type ${i+1} — ${name}"><canvas class="lijntype-preview" data-preview-type="type${i+1}" width="110" height="52" aria-hidden="true"></canvas>Type ${i+1} · ${name}</button>`).join('');
    window.SpellingSchrijflijnen.tekenLijntypePreviews();
  }
  const count = () => $('wordCount').value === 'auto' ? 10 : Number($('wordCount').value);
  const columns = () => selected.columns.map(c => ({...c, words:c.words.slice(0,count())}));
  function categories() {
    const query = $('search').value.trim().toLowerCase();
    const normalized=query.replace(/^-|-$/g,'');
    const visible = data.filter(c => !query||(normalized.length<=4?c.columns.some(col=>col.label===normalized||col.words.includes(normalized)||(normalized==='e'&&c.targets)):`${c.title} ${c.family} ${c.columns.flatMap(col=>col.words).join(' ')}`.toLowerCase().includes(query)));
    $('categories').innerHTML = visible.map(c => `<button class="category" data-id="${c.id}" aria-pressed="${c.id===selected.id}"><small>${escape(c.family)}</small><b>${escape(c.title)}</b></button>`).join('');
    $('noResults').hidden = visible.length > 0;
  }
  function mark(word,label) {
    if (!$('highlight').checked) return escape(word);
    if(selected.wordParts?.[word])return selected.wordParts[word].map((part,i)=>`<span class="compound-part part-${i}">${escape(part)}</span>`).join('');
    if(Number.isInteger(selected.targets?.[word])){const i=selected.targets[word];return escape(word.slice(0,i))+'<span class="target">'+escape(word[i])+'</span>'+escape(word.slice(i+1));}
    const i = ['er-el','d-t-b-p','end','ig-lijk','ing','tie','ig-lang'].includes(selected.id)?word.lastIndexOf(label):word.indexOf(label);
    return i < 0 ? escape(word) : escape(word.slice(0,i))+`<span class="target">${escape(label)}</span>`+escape(word.slice(i+label.length));
  }
  function page(number,title,body) {
    return `<article class="paper" data-reading-size="${$('readingSize').value}" style="--reading-size:${[12,14,16].includes(Number($('readingSize').value))?Number($('readingSize').value):14}pt"><div class="page-head"><b>Leesbooster</b><span>${escape(selected.title)}</span></div><h2>${number}. ${title}</h2><div class="name"><span>Naam: <i></i></span><span>Datum: <i></i></span></div>${body}<footer class="footer"><span>Juf Zisa · Leesbundels · ${escape(selected.title)}</span><span>${number}</span></footer></article>`;
  }
  function storyImage() {
    const local=location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname);
    const prefix=/\/(pro|ontdek)\/leesbooster\//.test(location.pathname)?'../../':'../';
    const base=window.LEESBUNDELS_IMAGE_BASE||(local?prefix+'output/leesbundels-prenten/pakket/':null);
    return base?`<img class="story-picture" ${location.protocol==='file:'?'':'crossorigin="anonymous"'} src="${escape(base.replace(/\/$/,'')+'/'+selected.imageFile)}" alt="${escape(selected.imageAlt)}">`:'<p class="image-pending">De verhaalprent wacht nog op de Cloudflare-upload.</p>';
  }
  function gameWords() {
    const result=[];
    for(let i=0;i<10;i++)for(const col of selected.columns)if(col.words[i]&&!result.includes(col.words[i]))result.push(col.words[i]);
    return result;
  }
  function connectBoard(words) {
    const cells=Array.from({length:30},(_,i)=>words[(i*7+11)%words.length]);
    return `<div class="player-keys"><span>Speler 1: <i></i> kleur</span><span>Speler 2: <i></i> kleur</span></div><div class="connect-board"><div class="board-crown"><b>WOORDEN OP EEN RIJ</b><span>4 maakt een rij!</span></div><div class="drop-arrows" aria-hidden="true">${Array.from({length:6},()=>'<span>↓</span>').join('')}</div><div class="connect-holes">${cells.map(w=>`<div class="connect-hole"><span class="${w.length>=11?'very-long-word':w.length>=8?'long-word':''}">${escape(w)}</span></div>`).join('')}</div><div class="board-base">LEES · KIES · KLEUR</div></div><div class="win-examples"><span>Vier naast elkaar →</span><span>Vier boven elkaar ↑</span><span>Vier schuin ↗</span></div>`;
  }
  function raceBoard(words) { return window.renderLeesbundelRace(words,escape); }
  // Een vaste puzzel per categorie houdt voorbeeld, afdruk en antwoordblad gelijk.
  function puzzle(words) {
    let seed = Array.from(selected.id).reduce((n,c)=>n+c.charCodeAt(0),7);
    const random = () => {seed = (seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const size = 12, grid = Array.from({length:size},()=>Array(size).fill('')), cells = new Set(), placed=[];
    for (const word of words) {
      let done = false;
      for (let attempt=0;attempt<300&&!done;attempt++) {
        const vertical = random()>.5, dx=vertical?0:1, dy=vertical?1:0;
        const x=Math.floor(random()*(size-dx*(word.length-1))), y=Math.floor(random()*(size-dy*(word.length-1)));
        if (Array.from(word).every((c,i)=>!grid[y+dy*i][x+dx*i]||grid[y+dy*i][x+dx*i]===c)) {
          Array.from(word).forEach((c,i)=>{grid[y+dy*i][x+dx*i]=c;cells.add(`${y+dy*i},${x+dx*i}`);});
          placed.push(word);done=true;
        }
      }
      if (!done) throw new Error('Er kon geen volledige woordzoeker worden gemaakt.');
    }
    const letters='abcdefghijklmnopqrstuvwxyz';
    grid.forEach(row=>row.forEach((c,x)=>{if(!c)row[x]=letters[Math.floor(random()*letters.length)];}));
    return {grid,cells,placed};
  }
  function gridHtml(p, solution=false) {
    return `<table class="wordsearch ${solution?'solution-grid':''}" aria-label="${solution?'Oplossing':'Woordzoeker'}"><tbody>${p.grid.map((row,y)=>`<tr>${row.map((c,x)=>`<td${solution&&p.cells.has(`${y},${x}`)?' class="found"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function fitBoardWords(root=document) {
    root.querySelectorAll('.star-map,.connect-board').forEach(board=>{
      const words=[...board.querySelectorAll('.path-stone b,.connect-hole span')];
      words.forEach(word=>{word.style.fontSize='';});
      let sharedSize=Infinity;
      words.forEach(word=>{
        const view=word.ownerDocument.defaultView, box=word.parentElement;
        const style=view.getComputedStyle(box), base=parseFloat(view.getComputedStyle(word).fontSize);
        const room=box.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-8;
        const width=word.getBoundingClientRect().width;
        sharedSize=Math.min(sharedSize,room>0&&width>room?base*room/width:base);
      });
      if(Number.isFinite(sharedSize))words.forEach(word=>{word.style.fontSize=(Math.floor(sharedSize*100)/100)+'px';});
    });
  }
  window.addEventListener('resize',()=>fitBoardWords());
  window.addEventListener('beforeprint',()=>fitBoardWords());
  window.addEventListener('afterprint',()=>fitBoardWords());
  const comicExamples={
  "klanken": [
    "Mila zit met haar boek in de tuin. Een rillende muis zit bij haar voet.",
    "De muis ligt warm in het huisje van de doos. Mila leest weer op haar stoel."
  ],
  "aai-eeuw": [
    "Noor maakt in de tuin een boot van sneeuw met een vlag.",
    "De vlag staat weer recht. Naast de boot staan een getekende haai en een meeuw van sneeuw. Mama brengt vlaai."
  ],
  "ng-nk": [
    "Finn en de zingende jongen zitten op de bank. Onder een plank blinkt een ring.",
    "De vrouw heeft haar ring terug. De jongens zingen samen verder op de bank."
  ],
  "spr-str-sch-schr": [
    "Saar vindt in haar schrift een brief met een aanwijzing voor een schat.",
    "Het gevonden houten schip staat in de klas. Saar schrijft over de speurtocht."
  ],
  "er-el": [
    "Noor en Sem zien onder een struik een merel met een open snavel.",
    "De merel drinkt uit de schaal. Noor en Sem kijken stil vanaf de bank."
  ],
  "ch-cht": [
    "Lars en Noor lopen in het donkere bos met de boswachter en zijn lamp.",
    "Lars vertelt thuis over de nachtelijke tocht en de nachtvlinder."
  ],
  "d-t-b-p": [
    "Lina en Mo bouwen naast hun tent een zandhut. Er staat een rode emmer bij.",
    "De krab loopt naar het water. Lina en Mo maken hun zandhut af."
  ],
  "be-ge-ver": [
    "Oma komt bij Bo en Sem met een pot en een zakje zaad.",
    "De versierde pot met aarde en zaad staat bij het raam. Er groeit nog geen bloem."
  ],
  "end": [
    "Noor leest op een bank. Finn komt zingend naar haar toe met een belletje.",
    "De juf is bij haar hond Pip. Noor en Finn geven haar het belletje voor hun toneel."
  ],
  "ig-lijk": [
    "Amir pakt de grootste van twee appels. Lotte kijkt droevig naar de kleine appel.",
    "Amir en Lotte eten vrolijk hun appels op en trekken grappige gezichten."
  ],
  "ing": [
    "Mila tekent een kartonnen woning. Raf meet de muren met een liniaal.",
    "De verdieping rust op een stevig rolletje. In de woning staat een poppetje."
  ],
  "doffe-e": [
    "Noor en Bas staan met hun laarzen en een houten boot bij een regenplas.",
    "De boot droogt binnen op een doek. Bas tekent de plas en boot; Noor tekent de vogel."
  ],
  "samenstellingen": [
    "Sara kijkt op het schoolplein in haar tas: haar waterfles is weg.",
    "De fles zit weer in de tas. Sara en Mo lopen terug naar de klas."
  ],
  "tie": [
    "Noor en Sam staan bij hun tent op de camping en willen oma een kaart sturen.",
    "De kaart is klaar, met de tent in het midden, de zon linksboven, een adres en een postzegel."
  ],
  "ig-lang": [
    "Noor en Bas bekijken met papa een stoffig doosje op zolder.",
    "Beneden spelen Noor, Bas en papa met de knikkers uit het doosje."
  ]
};
  let answersOnly=false;
  function render() {
    categories();gameChoices();
    // De eerste twee stappen tonen de leesbasis; bewaarde spelkeuzes blijven intact.
    const included=currentStep>=2?games():[];
    const cols=columns(), labels=[...new Set(cols.map(c=>c.label))];
    const pool=[...new Set(cols.flatMap(c=>c.words))];
    // Neem woorden uit alle kolommen mee, ook bij slechts vijf woorden per kolom.
    const ordered=[];
    for(let i=0;i<10;i++) for(const col of cols) if(col.words[i]&&!ordered.includes(col.words[i]))ordered.push(col.words[i]);
    const searchWords=ordered.slice(0,12), p=puzzle(searchWords);
    const bank=searchWords.map(w=>`<span>${escape(w)}</span>`).join('');
    let html=page(1,'Lees de woordrijtjes',`<p class="instruction">${escape(selected.intro)}</p><div class="word-columns columns-${cols.length}">${cols.map(c=>`<section class="word-column"><h3>${escape(c.label)}</h3>${c.words.map(w=>`<p>${mark(w,c.label)}</p>`).join('')}</section>`).join('')}</div><div class="repeats"><b>Mijn leesmoment</b><br>Lees elke kolom rustig en duidelijk. Kies daarna drie woorden die je nog eens wilt oefenen.<br>Zo ging het: □ met hulp &nbsp; □ al wat vlotter &nbsp; □ helemaal zelf</div><h3>Mijn drie oefenwoorden</h3><div class="practice-boxes">${[1,2,3].map(n=>`<div><span>${n}</span>${writing()}</div>`).join('')}</div>`);
    html+=page(2,escape(selected.storyTitle),`<div class="story-layout"><div class="story">${selected.story.map(s=>`<p>${escape(s)}</p>`).join('')}</div><aside class="story-art">${storyImage()}</aside></div><h3>Wat heb je gelezen?</h3>${selected.questions.map((q,i)=>`<div class="question"><b>${i+1}. ${escape(q[0])}</b>${writing()}</div>`).join('')}`);
    let pageNumber=2;
    if(included.includes('wordsearch'))html+=page(++pageNumber,'Zoek en lees',`<p class="instruction">Zoek van links naar rechts → of van boven naar beneden ↓. Lees elk gevonden woord hardop en streep het af in de lijst.</p><div class="wordbank">${bank}</div>${gridHtml(p)}<div class="repeats">Klaar? Kies drie gevonden woorden. Lees ze voor aan je maatje en gebruik elk woord in een mondelinge zin.</div>`);
    const storyLabels=Object.keys(selected.storyWords);
    const huntColors=[['geel','#fff0a6'],['blauw','#d6eafa'],['groen','#d9edcb'],['roze','#f7dbe9'],['oranje','#ffe0b8'],['paars','#e6dcf5']];
    const singleStoryLabel=storyLabels.length===1?storyLabels[0]:null;
    const huntTask=singleStoryLabel
      ? `<p class="instruction">Zoek in <b>${escape(selected.storyTitle)}</b> ${selected.storyWords[singleStoryLabel].length} verschillende woorden ${selected.id==='doffe-e'?'met een doffe e':'die eindigen op <b>-'+escape(singleStoryLabel)+'</b>'}. Kleur deze woorden eerst geel in het verhaal. Schrijf daarna in elk vak één gekleurd woord. Lees de woorden voor.</p><div class="practice-boxes story-word-boxes">${selected.storyWords[singleStoryLabel].map((_,i)=>`<div><span>${i+1}</span>${writing()}</div>`).join('')}</div>`
      : `<p class="instruction">Zoek in <b>${escape(selected.storyTitle)}</b> de gevraagde woorden. Kleur ze eerst in het verhaal met de kleur van hun kolom. Schrijf daarna de gekleurde woorden over en lees ze voor.</p><table class="sort-table"><thead><tr>${storyLabels.map((l,i)=>`<th style="background:${huntColors[i%huntColors.length][1]}">${escape(l)}<small>${huntColors[i%huntColors.length][0]} · ${selected.storyWords[l].length} ${selected.storyWords[l].length===1?'woord':'woorden'}</small></th>`).join('')}</tr></thead><tbody><tr>${storyLabels.map(l=>`<td>${writing(selected.storyWords[l].length)}</td>`).join('')}</tr></tbody></table>`;
    if(included.includes('storyhunt'))html+=page(++pageNumber,'Speur in het verhaal',`${huntTask}<h3>Een zin uit jouw hoofd</h3><p>Kies één gevonden woord. Bedenk een nieuwe zin die bij het verhaal past.</p>${writing()}<h3>Het verhaal in twee tekeningen</h3><p>Teken hoe het begon en hoe het afliep. Vertel erbij wat er veranderde.</p><div class="story-comic"><section><b>ZO BEGON HET</b><div></div></section><section><b>ZO LIEP HET AF</b><div></div></section></div>`);
    const gamePool=gameWords();
    if(included.includes('connect'))html+=page(++pageNumber,'Vier op een rij',`<p class="game-badge">SPEELBORD · 2 SPELERS · 2 KLEURPOTLODEN</p><p class="instruction">Kies elk een kleur. Kies om de beurt een kolom. Lees het woord in het <b>onderste vrije rondje</b> en kleur het als jouw fiche. Je maatje luistert mee. Lukt het nog niet? Lees samen; kleur het rondje in je volgende beurt als je het zelf kunt lezen.</p>${connectBoard(gamePool)}<p>Vier rondjes in jouw kleur op een rij? Gewonnen! Een volle kolom kun je niet meer kiezen. Vol bord zonder winnaar? Dan is het gelijkspel.</p>`);
    if(included.includes('race'))html+=page(++pageNumber,'Het sterrenpad',`<p class="game-badge">LEESROUTE · 2 SPELERS · DOBBELSTEEN + 2 PIONNEN</p><p class="instruction">Zet je pion vóór vak 1. Gooi om de beurt en volg de nummers. Lees <b>elk woord waar je langs komt</b>. Een lastig woord? Je maatje helpt en jij leest het nog eens. Bij 24 stop je, ook als je hoger gooit. Wie het eerst bij de finish is, wint.</p>${raceBoard(gamePool)}<div class="bonus-card"><h3>Land je op een ster? ★</h3><p>Gooi nog eens, voer de opdracht uit met het woord op je vak en blijf daar staan.</p><div class="dice-missions"><span><b>1–2</b> Maak een gekke zin met het woord.</span><span><b>3–4</b> Omschrijf het woord. Je maatje raadt.</span><span><b>5–6</b> Beeld het woord uit. Je maatje raadt.</span></div></div><p class="race-score">Onze tocht is klaar! &nbsp; □ Ik las zelf. &nbsp; □ Ik hielp mijn maatje.</p>`);
    const extra=window.LeesbundelExtraSpellen.render({included,selected,words:gamePool,page,writing,escape,start:pageNumber});
    html+=extra.html;pageNumber=extra.number;
    const studentPages=pageNumber;
    let answerPages=0;
    if(!answersOnly&&currentStep>=2&&$('answers').checked) {
      answerPages=1;
      html+=page(++pageNumber,'Antwoordblad voor de leerkracht',`<h3>Vragen bij het verhaal</h3><ol class="answer-list">${selected.questions.map(q=>`<li>${escape(q[1])}</li>`).join('')}</ol><p class="hint">Antwoorden in eigen woorden zijn ook goed als de betekenis klopt.</p>${included.includes('wordsearch')?'<h3>Woordzoeker</h3>'+gridHtml(p,true):''}${included.includes('storyhunt')?`<h3>Speurwoorden uit het verhaal · voorbeelden</h3><ul class="answer-list">${storyLabels.map(l=>`<li><b>${escape(l)}:</b> ${selected.storyWords[l].map(escape).join(', ')}</li>`).join('')}</ul>`:''}<p>Andere juiste woorden uit het verhaal mogen ook. Eigen zinnen en tekeningen: eigen antwoord. Spelborden en lezen met gevoel: geen vaste oplossing. Controleer het lezen en of de zinnen bij de woorden passen.</p>`);
    }
    if(!answersOnly&&$('answers').checked){
      const extraAnswers=window.LeesbundelExtraSpellen.answers({included,selected,words:gamePool,escape});
      if(extraAnswers){html+=page(++pageNumber,'Antwoorden bij de extra spellen',extraAnswers);answerPages++;}
    }
    if(!answersOnly&&$('answers').checked&&included.includes('storyhunt')){
      const example=comicExamples[selected.id];
      html+=page(++pageNumber,'Voorbeelden bij de tekenopdracht',`<h3>Het verhaal in twee tekeningen</h3><p>Dit zijn mogelijke tekeningen bij <b>${escape(selected.storyTitle)}</b>. Andere tekeningen zijn ook goed als ze passen bij het begin en het einde van het verhaal.</p><h3>Begin · voorbeeldomschrijving</h3><p>${escape(example?.[0]||'Eigen antwoord: een tekening die het begin van het verhaal laat zien.')}</p><h3>Einde · voorbeeldomschrijving</h3><p>${escape(example?.[1]||'Eigen antwoord: een tekening die het einde van het verhaal laat zien.')}</p><h3>Een zin uit jouw hoofd</h3><p>Eigen antwoord. De zin gebruikt een gevonden woord en past bij het verhaal.</p>`);answerPages++;
    }
    $('pages').innerHTML=html;
    $('showSolutions').textContent=answersOnly?'Terug naar leesbundel':'Oplossingen';
    $('showSolutions').setAttribute('aria-pressed',String(answersOnly));
    $('selectedTitle').textContent=selected.title;
    $('summary').textContent=`${studentPages} leerlingbladen${answerPages?' + '+answerPages+' antwoordblad'+(answerPages>1?'en':''):''} · ${pool.length} woorden in de rijtjes · ${cols.map(c=>c.words.length).join(' / ')} per kolom`;
    if(answersOnly)$('summary').textContent=studentPages+' bladen · ingevulde leerlingenbundel';
    window.SpellingSchrijflijnen.tekenAlle($('pages'));
    if(answersOnly)fillSolutions({included,p,gamePool,huntColors,storyLabels});
    fitBoardWords();
  }
  function fillSolutions({included,p,gamePool,huntColors,storyLabels}) {
    const root=$('pages');
    const fill=(set,text)=>{if(!set)return;let answer=set.querySelector('.solution-entry');if(!answer){answer=document.createElement('span');answer.className='solution-entry';set.appendChild(answer);}answer.textContent=text;};
    root.querySelectorAll('.paper').forEach(paper=>{
      paper.classList.add('filled-paper');
      paper.querySelector('.page-head b').textContent='Leesbooster · oplossingen';
    });
    root.querySelectorAll('.writing-set').forEach(set=>fill(set,'Eigen antwoord'));
    root.querySelectorAll('.question').forEach((q,i)=>fill(q.querySelector('.writing-set'),selected.questions[i][1]));
    root.querySelectorAll('.wordsearch tr').forEach((row,y)=>[...row.children].forEach((cell,x)=>{if(p.cells.has(y+','+x))cell.classList.add('found');}));
    if(included.includes('storyhunt')){
      const singles=root.querySelectorAll('.story-word-boxes .writing-set');
      singles.forEach((set,i)=>fill(set,selected.storyWords[storyLabels[0]][i]));
      root.querySelectorAll('.sort-table td').forEach((cell,i)=>cell.querySelectorAll('.writing-set').forEach((set,j)=>fill(set,selected.storyWords[storyLabels[i]][j])));
      root.querySelectorAll('.story-comic section>div').forEach((box,i)=>{box.classList.add('comic-solution');box.textContent='Voorbeeld: '+comicExamples[selected.id][i];});
      const colors=new Map();storyLabels.forEach((label,i)=>selected.storyWords[label].forEach(word=>colors.set(word.toLowerCase(),huntColors[i%huntColors.length][1])));
      root.querySelectorAll('.story p').forEach(paragraph=>{paragraph.innerHTML=paragraph.textContent.split(/([a-zà-ÿ]+)/gi).map(token=>colors.has(token.toLowerCase())?'<mark style="background:'+colors.get(token.toLowerCase())+'">'+escape(token)+'</mark>':escape(token)).join('');});
    }
    root.querySelectorAll('.word-ribbons section').forEach((section,i)=>{
      const words=window.LeesbundelExtraSpellen.slingers(gamePool)[i];
      section.querySelector('.ribbon-text').textContent=words.join(' | ');
      fill(section.querySelector('.writing-set'),words.filter(w=>w.length===Math.max(...words.map(w=>w.length))).join(' / '));
    });
    root.querySelectorAll('.detective-cards section').forEach((card,i)=>{
      const correct=selected.statements[i][1];
      card.querySelectorAll('.truth-choices i')[correct?0:1].classList.add('solution-checked');
    });
    const detective=root.querySelector('.detective-cards');
    if(detective){const fixes=selected.statements.filter(s=>!s[1]).slice(0,2);detective.closest('.paper').querySelectorAll('.writing-set').forEach((set,i)=>fill(set,fixes[i]?.[2]||'Eigen antwoord'));}
    root.querySelectorAll('.compound-builders section').forEach((card,i)=>{
      const word=selected.columns[i].words[0];
      card.querySelector('.part-space').textContent=selected.wordParts[word][1];
      fill(card.querySelector('.writing-set'),word);
    });
    root.querySelectorAll('.theatre-cards .played').forEach(el=>{el.textContent='Eigen uitvoering · geen vast antwoord';});
    root.querySelectorAll('.race-score').forEach(el=>{el.textContent='Eigen spelverloop. Zinnen en uitbeelden: eigen antwoord.';});
    const board=root.querySelector('.connect-board');if(board)board.parentElement.querySelector('.win-examples').textContent='Eigen spelverloop · geen vast antwoord';
  }
  $('showSolutions').addEventListener('click',()=>{answersOnly=!answersOnly;render();});
  $('downloadSolutions').addEventListener('click',()=>downloadBundle(true));
  $('gameChoices').addEventListener('change',e=>{const input=e.target.closest('[data-game]');if(!input)return;const next=new Set(games());if(input.checked)next.add(input.dataset.game);else next.delete(input.dataset.game);saveGames([...next]);});
  $('allGames').addEventListener('click',()=>saveGames(availableGames().map(g=>g.id)));
  $('noGames').addEventListener('click',()=>saveGames([]));
  $('search').addEventListener('input',categories);
  $('categories').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;selected=data.find(c=>c.id===b.dataset.id);history.replaceState(null,'',`#${selected.id}`);render();});
  window.addEventListener('hashchange',()=>{selected=data.find(c=>c.id===location.hash.slice(1))||data[0];render();});
  ['wordCount','highlight','answers','lineHeight','readingSize'].forEach(id=>$(id).addEventListener('change',render));
  $('lineTypes').addEventListener('click',e=>{const b=e.target.closest('[data-line]');if(!b)return;lineType=b.dataset.line;lineChoices();render();});
  // Teken elk leeswoord als één geheel: html2canvas verschuift anders
  // losse vetgedrukte tekstfragmenten ten opzichte van de gewone letters.
  function drawExportWords(doc) {
    const view=doc.defaultView;
    doc.querySelectorAll('.word-column p').forEach(p=>{
      const style=view.getComputedStyle(p), size=parseFloat(style.fontSize);
      const width=p.clientWidth, height=parseFloat(style.lineHeight);
      if(!width||!height)return;
      const canvas=doc.createElement('canvas');
      canvas.width=Math.ceil(width*2);canvas.height=Math.ceil(height*2);
      canvas.style.cssText='display:block;width:'+width+'px;height:'+height+'px;';
      canvas.setAttribute('aria-label',p.textContent);
      const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.textBaseline='alphabetic';
      const parts=[...p.childNodes].map(node=>{
        const cs=node.nodeType===1?view.getComputedStyle(node):style;
        const font=cs.fontWeight+' '+size+'px Arial';
        ctx.font=font;
        return {text:node.textContent,font,color:cs.color,bg:cs.backgroundColor,
          underline:cs.textDecorationLine.includes('underline'),
          border:parseFloat(cs.borderBottomWidth)||0,borderColor:cs.borderBottomColor,
          width:ctx.measureText(node.textContent).width};
      });
      ctx.font='400 '+size+'px Arial';const metrics=ctx.measureText('Mg');
      const baseline=(height+metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2;
      let x=(width-parts.reduce((sum,part)=>sum+part.width,0))/2;
      parts.forEach(part=>{
        if(part.bg&&part.bg!=='rgba(0, 0, 0, 0)'&&part.bg!=='transparent'){
          ctx.fillStyle=part.bg;ctx.fillRect(x,baseline-size,part.width,size*1.2);
        }
        ctx.font=part.font;ctx.fillStyle=part.color;ctx.fillText(part.text,x,baseline);
        if(part.underline||part.border){
          ctx.strokeStyle=part.underline?part.color:part.borderColor;
          ctx.lineWidth=part.underline?1.5:part.border;
          ctx.beginPath();ctx.moveTo(x,baseline+4);ctx.lineTo(x+part.width,baseline+4);ctx.stroke();
        }
        x+=part.width;
      });
      p.replaceChildren(canvas);
    });
  }
  async function readyImages(){
    if(document.querySelector('.image-pending'))throw new Error('De verhaalprent is nog niet gekoppeld.');
    await Promise.all(Array.from(document.querySelectorAll('#pages img')).map(img=>img.decode()));
  }
  $('printPdf').addEventListener('click',async()=>{try{await readyImages();window.print();}catch{$('status').textContent='De verhaalprent kon niet laden. Controleer de prentenkoppeling en probeer opnieuw.';}});
  $('downloadPdf').addEventListener('click',()=>downloadBundle(false));
  async function downloadBundle(solutions){
    if(!window.html2canvas||!window.jspdf){$('status').textContent='De PDF-bibliotheek is nog niet geladen. Probeer opnieuw of kies Afdrukken en sla op als PDF.';return;}
    const previousMode=answersOnly;answersOnly=solutions;render();
    const controls=Array.from(document.querySelectorAll('button,input,select'));
    controls.forEach(b=>b.disabled=true);
    try {
      await readyImages();
      const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',compress:true});
      const pages=Array.from(document.querySelectorAll('.paper'));
      for(let i=0;i<pages.length;i++){
        $('status').textContent=`PDF maken: blad ${i+1} van ${pages.length}…`;
        const canvas=await window.html2canvas(pages[i],{scale:2,useCORS:true,backgroundColor:'#ffffff',windowWidth:1400,onclone:doc=>{doc.body.classList.add('exporting');doc.querySelectorAll('.ontdek-watermarked').forEach(el=>el.classList.remove('ontdek-watermarked'));doc.querySelectorAll('.ontdek-canvas-watermark').forEach(el=>el.remove());fitBoardWords(doc);drawExportWords(doc);}});
        if(canvas.height/canvas.width>297/210+.003)throw new Error('Blad '+(i+1)+' is te hoog voor A4.');
        if(i)pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,canvas.height*210/canvas.width,undefined,'FAST');
      }
      pdf.save(`leesbundel-${selected.id}${solutions?'-oplossingen':''}.pdf`);
      $('status').textContent='Je PDF is klaar.';
    } catch(error) {
      console.error(error);$('status').textContent=error.message?.includes('te hoog voor A4')?error.message+' Kies minder woorden of kleinere schrijflijnen.':'De PDF kon niet worden gemaakt. Controleer of de verhaalprent geladen is en probeer opnieuw.';
    } finally {answersOnly=previousMode;controls.forEach(b=>b.disabled=false);showStep(currentStep);}
  }
  lineChoices();render();
})();
