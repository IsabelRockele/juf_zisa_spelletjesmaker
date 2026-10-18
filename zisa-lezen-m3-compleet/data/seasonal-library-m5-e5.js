// Lokale nieuwe verhalen M5 en E5, met dezelfde leesondersteuning als de andere boeken.
(()=>{
 const stories=window.ZISA_UPPER_STORIES||[];
 const levels=new Set(stories.map(s=>s.level));
 window.ZISA_BOOKS=(window.ZISA_BOOKS||[]).filter(b=>!b.theme||!levels.has(b.level));
 window.ZISA_SPEED_GAMES||={};window.ZISA_STORY_GLOSSARIES||={};window.ZISA_LEVEL_GAMES||={};
 for(const s of stories){
  const image=n=>`images/seizoenen-v2/${s.id}/${String(n).padStart(2,'0')}.png`;
  const pages=s.pages.map((text,i)=>({text,image:image(i+1)}));
  for(const [page,q,a,correct,hint] of s.questions)pages[page-1].task={type:'choice',q,a:[...a],correct,hint};
  const vocabulary=new Set(s.pages.join(' ').toLowerCase().match(/[a-zà-ÿ]+/g));
  window.ZISA_SPEED_GAMES[s.id]={words:s.words.filter(w=>vocabulary.has(w.toLowerCase()))};
  window.ZISA_STORY_GLOSSARIES[s.id]=s.glossary;
  window.ZISA_LEVEL_GAMES[s.id]=[
   {type:'story-comic',title:'Wat gebeurde eerst?',q:'Sleep de prenten in de juiste volgorde. Begin links.',frames:s.order.map(n=>({image:image(n),text:s.pages[n-1].split('\n')[0]}))},
   ...s.endTasks
  ];
  window.ZISA_BOOKS.push({id:s.id,level:s.level,seasonalUpper:true,theme:s.theme,title:s.title,blurb:s.blurb,cover:image(1),pages,missionTitle:'Opdrachten bij het verhaal',readingAdventure:`extra-bovenbouw.html#${s.id}`,readingAdventureLabel:'Extra leesspel ›'});
 }
})();
