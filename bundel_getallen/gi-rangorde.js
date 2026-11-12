/* Rangorde: expliciete telrichting, onafhankelijke opdrachten en correcte rangtelwoorden. */
window.GI_Rangorde = (() => {
  'use strict';
  const $=id=>document.getElementById(id), blue='#087db3';let serial=0;
  const names={plaats:'Welke plaats?',kleuren:'Kleur de gevraagde plaats',positie:'Eerste, laatste, middelste en buren',verbinden:'Verbind woord en rangnummer',schrijven:'Lees het rangtelwoord, schrijf het rangnummer',kleding:'Kijkvragen bij de kledingrij',speelgoed:'Kijkvragen bij de speelgoedplank',dieren:'Kijkvragen bij de dierenrij (zwart-wit)',getallenlijn:'Zoek de plaats op de getallenlijn'};
  const tasks={plaats:'Bekijk de blauwe figuur. Schrijf op welke plaats die staat.',kleuren:'Lees de opdracht. Kleur de juiste figuur blauw.',positie:'Lees de opdracht. Kleur telkens één figuur blauw.',verbinden:'Verbind elk rangtelwoord met het juiste rangnummer.',schrijven:'Lees het rangtelwoord. Schrijf het rangnummer in cijfers, zoals 3e.',kleding:'Bekijk de kledingrij. Vul het rangnummer of de kleur in.',speelgoed:'Bekijk de speelgoedplank. Vul het rangnummer of de kleur in.',dieren:'Bekijk de dierenrij. Vul in en zet het gevraagde kruisje.',getallenlijn:'Lees de opdrachten. Vul de letters bij de juiste getallen in.'};
  const low=['','eerste','tweede','derde','vierde','vijfde','zesde','zevende','achtste','negende','tiende','elfde','twaalfde','dertiende','veertiende','vijftiende','zestiende','zeventiende','achttiende','negentiende'];
  const tens=['','','twintig','dertig','veertig','vijftig','zestig','zeventig','tachtig','negentig'];
  const units=['','een','twee','drie','vier','vijf','zes','zeven','acht','negen'];
  function woord(n){if(!Number.isInteger(n)||n<1||n>100)throw Error('Rangnummer moet tussen 1 en 100 liggen.');if(n<20)return low[n];if(n===100)return 'honderdste';const u=n%10;return (u?units[u]+([2,3].includes(u)?'ën':'en'):'')+tens[Math.floor(n/10)]+'ste';}
  const rand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rand(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function generate(type,o){
    const max=+o.max;if(![10,20,30,100].includes(max)||!names[type])throw Error('Ongeldige keuze');
    const shape=max>10?'kraal':o.shape==='mix'?shuffle(['potlood','appel','ballon','vis'])[0]:o.shape;
    if(max>30&&['plaats','kleuren','positie','kleding','speelgoed','dieren'].includes(type))throw Error('Oefeningen met figuren kunnen tot 30.');
    const start=1;
    let count=Math.min(max,30);
    const m={type,max,shape,start,count,notation:max>=30?'cijfers':o.notation};
    if(type==='dieren'){
      const kinds=['kat','hond','konijn','vis','vogel'];
      m.animals=shuffle(Array.from({length:count},(_,i)=>kinds[i%5]));
      const [firstKind,lastKind]=shuffle(kinds),positions=kind=>m.animals.flatMap((v,i)=>v===kind?[i+1]:[]);
      const at=rand(1,count);
      const neighborKind=shuffle(kinds.filter(k=>positions(k).at(-1)>1))[0],neighbor=positions(neighborKind).at(-1);
      m.mark=rand(1,count);
      m.questions=[{text:`${firstKind==='konijn'?'Het':'De'} eerste ${firstKind} staat op de `,answer:positions(firstKind)[0]+'e',suffix:' plaats.'},{text:`Welk dier staat op de ${at}e plaats? `,answer:m.animals[at-1],suffix:''},{text:`${lastKind==='konijn'?'Het':'De'} laatste ${lastKind} staat op de `,answer:positions(lastKind).at(-1)+'e',suffix:' plaats.'},{text:`Welk dier staat net vóór ${neighborKind==='konijn'?'het laatste':'de laatste'} ${neighborKind}? `,answer:m.animals[neighbor-2],suffix:''}];
      return m;
    }
    if(type==='speelgoed'||type==='kleding'){
      const colors=[['rood','rode','#e85955'],['blauw','blauwe','#479bd5'],['groen','groene','#69b46b'],['geel','gele','#f4cd48'],['paars','paarse','#ab79c6'],['oranje','oranje','#f29a42']];
      const kinds=type==='kleding'?['trui','broek','rok','jurk','jas']:['auto','bal','teddybeer','blok','robot'];
      m.items=shuffle(kinds.flatMap(kind=>colors.map(([color,adjective,fill])=>({kind,color,adjective,fill,article:kind==='blok'?'het':'de'})))).slice(0,count);
      const inner=shuffle(Array.from({length:count-2},(_,i)=>i+2));
      m.questions=[{kind:'plaats',reference:rand(1,count)},{kind:'na',reference:inner[0]},{kind:'voor',reference:inner[1]},{kind:'kleur',reference:rand(1,count)}];
      m.questions.forEach(q=>{q.answer=q.kind==='kleur'?m.items[q.reference-1].color:(q.reference+(q.kind==='na'?1:q.kind==='voor'?-1:0))+'e';});return m;
    }
    if(['plaats','kleuren'].includes(type)){m.target=rand(start,start+count-1);return m;}
    if(type==='positie'){
      m.count=count-1;const end=m.start+m.count-1;
      m.kind=shuffle(['eerste','laatste','middelste','voorlaatste','voor','na'])[0];
      if(m.kind==='eerste')m.target=start;else if(m.kind==='laatste')m.target=end;else if(m.kind==='middelste')m.target=start+(m.count-1)/2;else if(m.kind==='voorlaatste')m.target=end-1;
      else {m.reference=rand(start+1,end-1);m.target=m.reference+(m.kind==='voor'?-1:1);}return m;
    }
    if(type==='verbinden'||type==='schrijven'){m.numbers=shuffle(Array.from({length:max},(_,i)=>i+1)).slice(0,5);m.right=m.numbers.slice(1).concat(m.numbers[0]);return m;}
    m.start=max===10?0:rand(0,max/10-1)*10;m.end=m.start+10;
    m.targets=shuffle(Array.from({length:9},(_,i)=>m.start+i+1)).slice(0,3);
    m.clues=m.targets.map((n,i)=>{if(i===0)return {text:'het getal net na '+(n-1),answer:n};if(i===1&&n+2<=m.end)return {text:'het getal twee plaatsen vóór '+(n+2),answer:n};return {text:'het getal net vóór '+(n+1),answer:n};});return m;
  }
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function svg(content,h){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 ${h}" width="720" height="${h}" role="img">${content}</svg>`;}
  function glyph(kind,fill){
    const body=`data-rang-body="" fill="${fill}" stroke="#263a4b" stroke-width="1.8" stroke-linejoin="round"`;
    const detail='fill="none" stroke="#263a4b" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
    if(kind==='potlood')return `<g transform="rotate(12)"><path d="M-11 -23Q-11 -29 -5 -29H5Q11 -29 11 -23V17L0 34L-11 17Z" ${body}/><path d="M-11 -19H11M-11 -13H11M-4 -12V17L0 21L4 17V-12M-11 17L-4 19M4 19L11 17" ${detail}/><path d="M-4 28L0 34L4 28Z" fill="#263a4b"/></g>`;
    if(kind==='appel')return `<path d="M0 -17C-14 -29 -31 -19 -30 -2C-29 16 -19 32 -9 29Q0 25 9 29C20 32 30 14 30 -2C31 -19 14 -29 0 -17Z" ${body}/><path d="M0 -17Q-3 -29 4 -35M3 -26Q14 -39 25 -31Q20 -19 3 -26Z" ${detail}/><path d="M-18 -12Q-23 -6 -21 3" fill="none" stroke="#c5d9e2" stroke-width="3" stroke-linecap="round"/>`;
    if(kind==='vis')return `<path d="M-20 -5Q-31 -16 -37 -16Q-34 0 -37 16Q-29 16 -20 5M-6 -17Q-3 -29 10 -21L17 -13M-5 17Q-3 28 10 21L17 13" ${body}/><path d="M-24 0C-16 -24 20 -25 31 -3Q34 0 31 3C20 25 -16 24 -24 0Z" ${body}/><path d="M9 -12Q3 0 9 12M-8 -5Q-1 0 -8 6M23 6Q26 8 29 5" ${detail}/><circle cx="20" cy="-6" r="5" fill="white" stroke="#263a4b" stroke-width="1.2"/><circle cx="22" cy="-6" r="2.3" fill="#263a4b"/>`;
    return `<path d="M0 19C-9 16 -23 5 -23 -11C-23 -39 23 -39 23 -11C23 5 9 16 0 19Z" ${body}/><path d="M0 17L-4 23H4Z" ${body}/><path d="M0 23C12 31 -9 34 1 42" ${detail}/><path d="M-13 -20Q-18 -13 -15 -6" fill="none" stroke="#c5d9e2" stroke-width="3" stroke-linecap="round"/>`;
  }
  function rowPicture(m,solved){
    if(m.shape==='kraal'){
      const step=680/m.count,radius=Math.min(14,step/2-2);
      let s='<text x="12" y="19" font-size="15" fill="#38566c">Start bij 1e</text><path d="M115 14H161l-7 -4m7 4l-7 4" fill="none" stroke="#7893a6"/><path d="M10 56H710" fill="none" stroke="#263a4b" stroke-width="1.4"/>';
      for(let i=0;i<m.count;i++){const n=i+1,selected=n===m.target,fill=(m.type==='plaats'||solved)&&selected?'#83cfe9':'white';s+=`<g data-rang-number="${n}" ${selected&&m.type!=='plaats'?'data-rang-target="true"':''}><circle data-rang-body="" cx="${20+step*(i+.5)}" cy="56" r="${radius}" fill="${fill}" stroke="#263a4b" stroke-width="1.5"/></g>`;}
      return svg(s,88);
    }
    let s='';const rows=Math.ceil(m.count/10);for(let r=0;r<rows;r++){
    const y=19+r*108,first=m.start+r*10,amount=Math.min(10,m.count-r*10);
    s+=`<text x="12" y="${y}" font-size="15" fill="#38566c">Start bij ${first}e</text><path d="M115 ${y-5}H161l-7 -4m7 4l-7 4" fill="none" stroke="#7893a6"/>`;
    for(let c=0;c<amount;c++){const n=first+c,selected=n===m.target,fill=m.type==='plaats'&&selected||solved&&selected?'#83cfe9':'white';s+=`<g transform="translate(${38+c*71},${y+47}) scale(.86)" data-rang-number="${n}" ${selected&&m.type!=='plaats'?`data-rang-target="true"`:''}>${glyph(m.shape,fill)}</g>`;}
  }return svg(s,rows*108);}
  function clothesPicture(m){
    const step=680/m.count,scale=Math.min(1.4,(step-3)/32);
    let s='<text x="12" y="19" font-size="15" fill="#38566c">Start bij 1e</text><path d="M115 14H161l-7 -4m7 4l-7 4M12 38H708" fill="none" stroke="#64798b" stroke-width="1.5"/>';
    const paths={trui:'M-6 0L-15 7L-12 19L-8 16V37H8V16L12 19L15 7L6 0Q0 7 -6 0Z',broek:'M-10 0H10L12 43H3L0 18L-3 43H-12Z',rok:'M-7 0H7L14 34Q0 39 -14 34Z',jurk:'M-5 0L-12 6L-9 15L-6 13L-13 43Q0 48 13 43L6 13L9 15L12 6L5 0Q0 6 -5 0Z',jas:'M-5 0L-13 5L-15 28L-10 29L-7 15L-9 43H9L7 15L10 29L15 28L13 5L5 0Z'};
    m.items.forEach((item,i)=>{const detail=item.kind==='broek'?'M-10 6H10M0 6V18':item.kind==='rok'?'M-7 5H7M-3 10L-6 31M3 10L6 31':item.kind==='jas'?'M0 4V42M-5 0L0 9L5 0M-7 29H-2M2 29H7':item.kind==='trui'?'M-8 32H8M-6 0Q0 12 6 0':'M-6 15H6';s+=`<g data-rang-clothing="${i+1}" transform="translate(${20+step*(i+.5)},48) scale(${scale})"><title>${item.adjective} ${item.kind}</title><path d="M0 -16V-10M0 -10L-10 -2H10Z" fill="none" stroke="#64798b" stroke-width="1"/><path d="${paths[item.kind]}" fill="${item.fill}" stroke="#33495a" stroke-width="1.2" stroke-linejoin="round"/><path d="${detail}" fill="none" stroke="#33495a" stroke-width="1"/></g>`;});
    return svg(s,54+50*scale);
  }
  function toyGlyph(item){
    const outline=`fill="${item.fill}" stroke="#263a4b" stroke-width="1.3" stroke-linejoin="round"`;
    const line='fill="none" stroke="#263a4b" stroke-width="1.2" stroke-linecap="round"';
    if(item.kind==='auto')return `<path d="M-15 -6V-14L-10 -16L-6 -24H6L11 -16L15 -14V-6Z" ${outline}/><path d="M-8 -16L-4 -22H4L8 -16Z" fill="white" stroke="#263a4b" stroke-width="1"/><path d="M0 -22V-16" ${line}/><circle cx="-9" cy="-6" r="4" fill="#263a4b"/><circle cx="9" cy="-6" r="4" fill="#263a4b"/><circle cx="-9" cy="-6" r="1.4" fill="white"/><circle cx="9" cy="-6" r="1.4" fill="white"/>`;
    if(item.kind==='bal')return `<circle cx="0" cy="-15" r="14" ${outline}/><path d="M-10 -25Q5 -18 10 -5M-13 -10Q0 -19 13 -20M-3 -29Q-7 -13 3 -1" ${line}/>`;
    if(item.kind==='blok')return `<path d="M-13 -26L5 -32L14 -24V-6L-4 0L-13 -8Z" ${outline}/><path d="M-13 -26L-4 -18L14 -24M-4 -18V0" ${line}/><path d="M-8 -14L-6 -13V-7" fill="none" stroke="white" stroke-width="2"/><path d="M2 -17L9 -19V-12L2 -10Z" fill="white"/>`;
    if(item.kind==='robot')return `<path d="M0 -36V-32" ${line}/><circle cx="0" cy="-37" r="2" fill="#263a4b"/><rect x="-10" y="-32" width="20" height="14" rx="3" ${outline}/><path d="M-8 -17H8V-4H-8ZM-8 -14L-13 -10V-5M8 -14L13 -10V-5M-5 -4V0H-9M5 -4V0H9" ${outline}/><circle cx="-4" cy="-26" r="2" fill="white"/><circle cx="4" cy="-26" r="2" fill="white"/><path d="M-4 -21H4" ${line}/><rect x="-4" y="-13" width="8" height="5" rx="1" fill="white"/>`;
    return `<circle cx="-10" cy="-30" r="5" ${outline}/><circle cx="10" cy="-30" r="5" ${outline}/><ellipse cx="0" cy="-12" rx="9" ry="11" ${outline}/><ellipse cx="-11" cy="-14" rx="4" ry="6" transform="rotate(25 -11 -14)" ${outline}/><ellipse cx="11" cy="-14" rx="4" ry="6" transform="rotate(-25 11 -14)" ${outline}/><ellipse cx="-6" cy="-3" rx="5" ry="3" ${outline}/><ellipse cx="6" cy="-3" rx="5" ry="3" ${outline}/><circle cx="0" cy="-25" r="10" ${outline}/><ellipse cx="0" cy="-21" rx="5" ry="4" fill="#fff4db"/><circle cx="-4" cy="-27" r="1.4" fill="#263a4b"/><circle cx="4" cy="-27" r="1.4" fill="#263a4b"/><circle cx="0" cy="-23" r="1.6" fill="#263a4b"/><ellipse cx="0" cy="-11" rx="4" ry="5" fill="#fff4db"/>`;
  }
  function toyPicture(m){
    const step=680/m.count,scale=Math.min(1.6,(step-4)/30),baseline=37+39*scale;
    let s='<text x="12" y="19" font-size="15" fill="#38566c">Start bij 1e</text><path d="M115 14H161l-7 -4m7 4l-7 4" fill="none" stroke="#64798b" stroke-width="1.5"/>';
    s+=`<rect x="12" y="${baseline+1}" width="696" height="6" rx="2" fill="#e9cc9f" stroke="#8a6a42" stroke-width="1"/>`;
    m.items.forEach((item,i)=>{s+=`<g data-rang-toy="${i+1}" transform="translate(${20+step*(i+.5)},${baseline}) scale(${scale})"><title>${item.adjective} ${item.kind}</title>${toyGlyph(item)}</g>`;});
    return svg(s,baseline+20);
  }
  function animalGlyph(kind){
    const body='fill="white" stroke="#111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"',line='fill="none" stroke="#111" stroke-width="1.3" stroke-linecap="round"';
    if(kind==='vis')return `<path d="M-6 -13L-15 -23V-3Z" ${body}/><path d="M-9 -13Q0 -32 15 -13Q0 6 -9 -13Z" ${body}/><circle cx="8" cy="-15" r="1.7" fill="#111"/><path d="M2 -20Q-1 -13 2 -6" ${line}/>`;
    if(kind==='vogel')return `<path d="M-8 -7L-15 -19L-5 -15Q-5 -24 4 -25Q13 -25 11 -16L16 -13L10 -10Q10 0 -1 0Q-9 0 -8 -7Z" ${body}/><path d="M-5 -11Q7 -16 4 -6Q0 -2 -5 -11M-3 0V4H-6M5 -1V4H8" ${line}/><circle cx="6" cy="-20" r="1.5" fill="#111"/>`;
    if(kind==='konijn')return `<ellipse cx="-5" cy="-27" rx="4" ry="12" ${body}/><ellipse cx="5" cy="-27" rx="4" ry="12" ${body}/><ellipse cx="0" cy="-10" rx="12" ry="13" ${body}/><path d="M-5 -34V-24M5 -34V-24M0 -7V-3M-3 -3Q0 0 3 -3" ${line}/><circle cx="-5" cy="-12" r="1.7" fill="#111"/><circle cx="5" cy="-12" r="1.7" fill="#111"/><path d="M-3 -8H3L0 -5Z" fill="#111"/>`;
    if(kind==='hond')return `<path d="M-8 -23Q-17 -27 -14 -7Q-10 -3 -7 -13M8 -23Q17 -27 14 -7Q10 -3 7 -13" ${body}/><path d="M-9 -22Q0 -28 9 -22L10 -4Q0 7 -10 -4Z" ${body}/><ellipse cx="0" cy="-5" rx="7" ry="5" fill="white" stroke="#111" stroke-width="1"/><circle cx="-4" cy="-15" r="1.7" fill="#111"/><circle cx="4" cy="-15" r="1.7" fill="#111"/><ellipse cx="0" cy="-7" rx="3" ry="2" fill="#111"/><path d="M0 -5V-2M-3 -2Q0 1 3 -2" ${line}/>`;
    return `<path d="M-11 -13L-12 -29L-3 -22Q0 -23 3 -22L12 -29L11 -13Q16 2 0 3Q-16 2 -11 -13Z" ${body}/><circle cx="-5" cy="-12" r="1.7" fill="#111"/><circle cx="5" cy="-12" r="1.7" fill="#111"/><path d="M-2 -7H2L0 -5ZM-4 -5L-14 -8M-4 -2L-14 -1M4 -5L14 -8M4 -2L14 -1" ${line}/>`;
  }
  function animalPicture(m,solved){
    const step=680/m.count,scale=Math.min(1.5,(step-4)/32),baseline=38+39*scale;
    let s='<text x="12" y="19" font-size="15" fill="#111">Start bij 1e</text><path d="M115 14H161l-7 -4m7 4l-7 4" fill="none" stroke="#111"/>';
    m.animals.forEach((kind,i)=>{const x=20+step*(i+.5);s+=`<g data-rang-animal="${i+1}" transform="translate(${x},${baseline}) scale(${scale})"><title>${kind}</title>${animalGlyph(kind)}</g><g data-rang-mark="${i+1}" transform="translate(${x},${baseline+18})"><rect x="-8" y="-8" width="16" height="16" rx="2" fill="white" stroke="#888" stroke-width=".7"/><path d="M-4 -4L4 4M4 -4L-4 4" fill="none" stroke="#111" stroke-width="1.7" ${i+1===m.mark?'data-rang-correct=""':''} ${i+1===m.mark&&!solved?'data-basis-model=""':''} style="display:${solved&&i+1===m.mark?'':'none'}"/></g>`;});
    return svg(s,baseline+36);
  }
  function input(answer,solved){const i=el('input','rang-answer'+(/^\d+e$/.test(answer)?'':' rang-answer-word'));i.type='text';i.dataset.giAnswer=answer;i.setAttribute('aria-label','Antwoord');i.autocomplete='off';if(solved){i.value=answer;i.readOnly=true;i.style.color=blue;}return i;}
  function paintable(host,m,solved){host.querySelectorAll('[data-rang-number]').forEach(group=>{
    const shapes=[...group.querySelectorAll('[data-rang-body]')];if(group.dataset.rangTarget)shapes.forEach(shape=>shape.dataset.giSvgFill='#83cfe9');
    if(m.type==='plaats')return;group.style.cursor='pointer';group.setAttribute('tabindex','0');group.setAttribute('role','button');group.setAttribute('aria-label','Figuur op plaats '+group.dataset.rangNumber);
    const toggle=()=>{if(solved||$('sheet').classList.contains('solutions-mode'))return;const fill=shapes[0].getAttribute('fill')==='white'?'#83cfe9':'white';shapes.forEach(shape=>shape.setAttribute('fill',fill));};group.onclick=toggle;group.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();toggle();}};
  });}
  function content(m,solved=false){const host=el('div','rang-content');
    if(['plaats','kleuren','positie'].includes(m.type)){
      if(m.type==='kleuren')host.append(el('p','rang-question','Kleur de figuur op de '+(m.notation==='woorden'?woord(m.target):m.target+'e')+' plaats blauw.'));
      if(m.type==='positie'){let phrase;if(['voor','na'].includes(m.kind))phrase=`Kleur de figuur net ${m.kind==='voor'?'vóór':'na'} de ${m.reference}e figuur blauw.`;else phrase=`Kleur de ${m.kind} figuur van deze reeks blauw.`;host.append(el('p','rang-question',phrase));}
      const pic=el('div','rang-picture');pic.innerHTML=rowPicture(m,solved);host.append(pic);paintable(pic,m,solved);
      if(m.type==='plaats'){const p=el('div','rang-response','De blauwe figuur staat op de ');p.append(input(m.notation==='woorden'?woord(m.target):m.target+'e',solved),document.createTextNode(' plaats.'));host.append(p);}
    }else if(m.type==='dieren'){
      const pic=el('div','rang-picture');pic.innerHTML=animalPicture(m,solved);host.append(pic);
      pic.querySelectorAll('[data-rang-mark]').forEach(mark=>{mark.setAttribute('role','button');mark.setAttribute('tabindex','0');mark.setAttribute('aria-label','Kruisje bij dier '+mark.dataset.rangMark);mark.style.cursor='pointer';const toggle=()=>{if(solved||$('sheet').classList.contains('solutions-mode'))return;const path=mark.querySelector('path');path.style.display=path.style.display==='none'?'':'none';};mark.onclick=toggle;mark.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();toggle();}};});
      m.questions.forEach(q=>{const row=el('div','rang-response rang-toy-answer',q.text),answer=input(q.answer,solved);if(!/\d+e$/.test(q.answer))answer.classList.add('rang-answer-color');row.append(answer,document.createTextNode(q.suffix));host.append(row);});
      host.append(el('p','rang-question',`Zet een kruisje onder het ${m.mark}e dier.`));
    }else if(m.type==='speelgoed'||m.type==='kleding'){
      const pic=el('div','rang-picture');pic.innerHTML=m.type==='kleding'?clothesPicture(m):toyPicture(m);host.append(pic);
      m.questions.forEach(q=>{const item=m.items[q.reference-1],noun=m.type==='kleding'?'kledingstuk':'speelgoed',verb=m.type==='kleding'?'hangt':'staat';let text;
        if(q.kind==='plaats')text=`${item.article==='het'?'Het':'De'} ${item.adjective} ${item.kind} ${verb} op de `;
        else if(q.kind==='kleur')text=`De kleur van het ${noun} op de ${q.reference}e plaats is `;
        else text=`Het ${noun} net ${q.kind==='voor'?'vóór':'na'} ${item.article} ${item.adjective} ${item.kind} ${verb} op de `;
        const row=el('div','rang-response rang-toy-answer',text),answer=input(q.answer,solved);if(q.kind==='kleur')answer.classList.add('rang-answer-color');row.append(answer,document.createTextNode(q.kind==='kleur'?'.':' plaats.'));host.append(row);
      });
    }else if(m.type==='schrijven'){
      host.classList.add('rang-write-grid');
      m.numbers.forEach((n,i)=>{const p=el('div','rang-write');p.append(el('span','',woord(n)),el('span','','→'),input(n+'e',solved));host.append(p);});
    }else if(m.type==='verbinden'){
      const measure=document.createElement('canvas').getContext('2d');measure.font='18px Arial';const point=12+Math.max(...m.numbers.map(n=>measure.measureText(woord(n)).width))+14,rightPoint=point+180;let s='';m.numbers.forEach((n,i)=>{const j=m.right.indexOf(n),y=28+i*42,ry=28+j*42;s+=`<text x="12" y="${y}" font-size="18" fill="#263a4b">${woord(n)}</text><circle cx="${point}" cy="${y-6}" r="3" fill="#263a4b"/><text x="${rightPoint+22}" y="${y}" font-size="19" fill="#263a4b">${m.right[i]}e</text><circle cx="${rightPoint}" cy="${y-6}" r="3" fill="#263a4b"/><line x1="${point}" y1="${y-6}" x2="${rightPoint}" y2="${ry-6}" stroke="${blue}" stroke-width="2" ${solved?'': 'data-basis-model="" style="display:none"'}/>`;});host.innerHTML=svg(s,218);
    }else{
      let s='<path d="M35 58H685" stroke="#4f7088" stroke-width="2"/>';for(let i=0;i<=10;i++){const n=m.start+i,x=35+i*65;s+=`<path d="M${x} 51V65" stroke="#4f7088"/>`;if(i===0||i===10)s+=`<text x="${x}" y="88" text-anchor="middle" font-size="18">${n}</text>`;else s+=`<text x="${x}" y="38" text-anchor="middle" font-size="18" fill="${blue}" ${solved?'':'data-basis-model="" style="display:none"'}>${m.targets.includes(n)?'ABC'[m.targets.indexOf(n)]:''}</text>`;}
      m.clues.forEach((c,i)=>host.append(el('p','rang-question',`${'ABC'[i]}: Zoek ${c.text}. Schrijf de letter boven het juiste streepje.`)));const pic=el('div','rang-picture');pic.innerHTML=svg(s,100);host.append(pic);
    }
    return host;
  }
  function add(type,o){const api=window.GI_BasisBridge,sheet=$('sheet'),key='rangorde_'+Date.now()+'_'+(++serial);api.title(sheet,key,tasks[type]);
    const title=sheet.querySelector(`.exercise-title[data-title-key="${key}"]`);title.contentEditable='true';title.title='Klik om de opdrachtzin aan te passen';
    const block=el('div','rang-block');block.dataset.titleKey=key;sheet.append(block);let count=0;
    const next=(exclude=null)=>{const used=new Set([...block.children].filter(c=>c!==exclude).map(c=>c._signature));for(let tries=0;tries<150;tries++){const m=generate(type,o),signature=JSON.stringify(m);if(!used.has(signature)&&signature!==exclude?._signature)return {m,signature};}return null;};
    const fill=(card,model)=>{card.dataset.rangType=model.m.type;card._model=model.m;card._signature=model.signature;const solved=card.dataset.example==='true';card.replaceChildren();if(solved)card.append(el('div','rang-example','Voorbeeld'));card.append(content(model.m,solved));
      const tools=el('div','basis-tools rang-tools');const renew=el('button','','↻'),del=el('button','','×');renew.type=del.type='button';renew.title='Vernieuw deze oefening';del.title='Verwijder deze oefening';renew.setAttribute('aria-label',renew.title);del.setAttribute('aria-label',del.title);
      renew.onclick=()=>{const fresh=next(card);if(fresh){fill(card,fresh);window.GI4SetSolutionsMode?.(sheet.classList.contains('solutions-mode'));}};
      del.onclick=()=>{card.remove();if(!block.children.length)title.closest('.title-row').querySelector('.title-delete-btn').click();window.GI_Toets?.updateScoreVakken();};tools.append(renew,del);card.append(tools);
    };
    const append=()=>{const model=next();if(!model)return;const card=el('div','rang-card keep-together exercise');card.dataset.example=String(!!o.example&&count++===0);card.dataset.titleKey=key;fill(card,model);block.append(card);window.GI4SetSolutionsMode?.(sheet.classList.contains('solutions-mode'));window.GI_Toets?.scanEnVoeg();window.GI_Toets?.updateScoreVakken();};api.register(key,append);for(let i=0;i<o.count;i++)append();return block;
  }
  function init(){if(!window.GI_BasisBridge||$('tab-rangorde'))return;const tab=el('div','sidebar-tab tab-rangorde','🏁 Rangorde en rangtelwoorden');tab.onclick=()=>GI_UI.toonTab('rangorde',tab);document.querySelector('.tab-rekentaal').after(tab);
    const panel=el('div','sidebar-content');panel.id='tab-rangorde';panel.style.display='none';panel.innerHTML=`<div class="sectie-titel">Rangorde en rangtelwoorden</div><div class="config-kaart"><div class="kaart-titel">Bereik</div><label>Oefenen tot <select id="rang-max"><option>10</option><option>20</option><option>30</option><option>100</option></select></label><p class="rang-tip">Alle voorwerpen staan op één rij, vanaf de eerste plaats. Tot 10 kies je figuren; tot 20 en 30 gebruiken we kralen die naast elkaar passen. Kijkvragen bij kleding, speelgoed en dieren kunnen tot 30. De dierenrij werkt ook in zwart-wit. Kies één of meerdere oefenvormen. Tot 100: verbinden, rangnummers invullen en getallenlijnen. Rangtelwoorden hoef je niet voluit te schrijven.</p></div><div class="config-kaart"><div class="kaart-titel">Oefenvormen</div>${Object.entries(names).map(([v,t],i)=>`<label class="rang-option"><input type="checkbox" name="rang-type" value="${v}" ${i===0?'checked':''}> ${t}</label>`).join('')}</div><div class="config-kaart"><div class="kaart-titel">Instellingen</div><label>Figuren tot 10 <select id="rang-shape"><option value="mix">Afwisselen</option><option value="potlood">Potloden</option><option value="appel">Appels</option><option value="ballon">Ballonnen</option><option value="vis">Vissen</option></select></label><label>Rangnummer bij figuren <select id="rang-notation"><option value="cijfers">In cijfers: 1e, 2e, 3e…</option><option value="woorden">In woorden: eerste, tweede…</option></select></label><label>Aantal oefeningen per vorm <input id="rang-count" type="number" min="1" max="12" value="3"></label><label class="rang-option"><input id="rang-example" type="checkbox"> Eerste oefening als ingevuld voorbeeld</label></div><details class="config-kaart"><summary>Voorbeeld van de gekozen oefenvorm</summary><div id="rang-sample"></div></details><p id="rang-status" role="status"></p><button type="button" class="btn-toevoegen" id="rang-add">＋ Voeg toe aan de bundel</button>`;
    document.querySelector('.sidebar-footer').before(panel);const settings=()=>({max:+$('rang-max').value,shape:$('rang-shape').value,notation:$('rang-notation').value,count:Math.max(1,Math.min(12,+$('rang-count').value||1)),example:$('rang-example').checked});
    const sample=()=>{const large=+$('rang-max').value>30;panel.querySelectorAll('[name="rang-type"]').forEach(box=>{box.disabled=large&&['plaats','kleuren','positie','kleding','speelgoed','dieren'].includes(box.value);if(box.disabled)box.checked=false;box.closest('label').style.opacity=box.disabled?'0.5':'';});$('rang-shape').disabled=+$('rang-max').value>10;$('rang-notation').disabled=+$('rang-max').value>=30;if(+$('rang-max').value>=30)$('rang-notation').value='cijfers';const type=panel.querySelector('[name="rang-type"]:checked')?.value;if(type)$('rang-sample').replaceChildren(content(generate(type,settings()),true));else $('rang-sample').replaceChildren();};panel.addEventListener('change',sample);sample();
    $('rang-add').onclick=()=>{const types=[...panel.querySelectorAll('[name="rang-type"]:checked')].map(i=>i.value);if(!types.length){$('rang-status').textContent='Kies minstens één oefenvorm.';return;}$('rang-status').textContent='';const o=settings();types.forEach(t=>add(t,o));};
  }
  document.addEventListener('DOMContentLoaded',init);
  return {woord,generate,content,add};
})();
