// Kerstverhalen vrijgegeven door de leerkracht.
(()=>{
 const stories=window.ZISA_CHRISTMAS_STORIES||[];
 window.ZISA_BOOKS=window.ZISA_BOOKS.filter(b=>!stories.some(s=>s.id===b.id));
 for(const s of stories){
  const picture=n=>`https://zisa-leesprenten-start.pages.dev/kerst/${s.id}/${String(n).padStart(2,'0')}${s.imageVersions?.[n]||''}.png`;
  const pages=s.pages.map((text,i)=>({text,image:picture(i+1)}));
  for(const [page,q,a,correct] of s.questions)pages[page-1].task={type:'choice',q,a:[...a],correct,hint:s.level==='START'?'kijk maar!':'Lees deze bladzijde nog eens rustig.'};
  window.ZISA_SPEED_GAMES[s.id]={words:s.words};
  window.ZISA_STORY_GLOSSARIES[s.id]=s.glossary;
  const games=[
   {type:'story-comic',title:'Zet het avontuur op een rij',q:'Sleep de prenten naar de vakken bovenaan. Wat gebeurde eerst?',frames:s.order.map(n=>({image:picture(n),text:s.pages[n-1].split('\n')[0]}))},
   {type:'match',title:'Woord en prent',q:'Zoek bij elke prent het juiste woord.',pairs:s.pictureWords.map((word,i)=>[{image:s.glossary[word].image,alt:`Woordprent ${i+1}`},word])},
   {type:'choice',title:s.level==='START'?'kijk maar!':'Denk terug',q:s.extra.q,a:s.extra.a,correct:s.extra.correct,reviewPage:s.extra.page-1}
  ];
  if(s.level==='START'){
   games.push({type:'choice',title:'Lees heel precies',q:'bel',a:['bol','bel','bal'],correct:1,reviewPage:3},
    {type:'match',title:'Zoek precies hetzelfde woord',q:'Kijk naar alle letters. Welke woorden zijn gelijk?',pairs:[['pak','pak'],['pik','pik'],['pek','pek']]});
   window.ZISA_FLUENCY_BOOKS[s.id]=[
    {icon:'👀',title:'Kijk precies',q:'Tik hetzelfde woord aan.',focus:'bel',a:['bol','bal','bel'],correct:2,good:'bel!'},
    {icon:'🎵',title:'Rijmen',q:'Wat rijmt op pak?',focus:'pak',a:['zak','rok','hek'],correct:0,good:'pak — zak!'},
    {icon:'👀',title:'Kijk precies',q:'Tik hetzelfde woord aan.',focus:'poes',a:['poos','poes','pees'],correct:1,good:'poes!'}
   ];
  }else{
   games.push({type:'sentence',title:'Bouw de zin',q:'Zet de stukjes op de juiste plaats.',parts:s.sentence.map((text,i)=>({text,role:(s.sentenceRoles||['wie','doet','wat'])[i]})),reviewPage:s.sentencePage-1});
   const definition=w=>typeof s.glossary[w]==='string'?s.glossary[w]:s.glossary[w].text;
   games.push({type:'match',title:'Wat betekent het?',q:'Verbind het woord met de juiste uitleg.',pairs:s.meaningWords.map(w=>[w,definition(w)])});
   const last=s.questions.at(-1);
   games.push({type:'choice',title:'De speurder kijkt terug',q:last[1],a:last[2],correct:last[3],reviewPage:last[0]-1});
   const near=s.precisionWords||{M3:['doos','boos','roos'],E3:['teugel','tegel','teugels'],M4:['sneeuwpop','sneeuwbal','sneeuwbui'],E4:['vensterbank','vensterglas','vensterraam'],M5:['wegwijzer','wegwijzers','wegwerker'],E5:['microfoon','microfoons','microscoop'],M6:['mechaniek','mechanisme','mechanisch'],E6:['voorraad','voorraadkast','voorraadsysteem']}[s.level];
   const meaning=s.level==='M3'?['leeg',['Er zit niets in.','Er zit een bal in.','Er zit een kat in.']]:[s.pictureWords[0],s.pictureWords.map(definition)];
   window.ZISA_FLUENCY_BOOKS[s.id]=[
    {icon:'👀',title:'Lees precies',q:'Tik precies hetzelfde woord aan.',focus:near[0],a:[near[1],near[0],near[2]],correct:1,good:'Goed! Je keek naar het hele woord.'},
    {icon:'💡',title:'Lees en begrijp',q:`Wat betekent ${meaning[0]}?`,focus:meaning[0],a:meaning[1],correct:0,good:'Juist, die uitleg past bij het woord.'}
   ];
  }
  window.ZISA_LEVEL_GAMES[s.id]=games;
  window.ZISA_BOOKS.push({id:s.id,level:s.level,theme:'kerst',title:s.title,blurb:s.blurb,cover:picture(1),pages,seasonalUpper:['E5','M6','E6'].includes(s.level),missionTitle:'Opdrachten bij het verhaal'});
 }
})();
