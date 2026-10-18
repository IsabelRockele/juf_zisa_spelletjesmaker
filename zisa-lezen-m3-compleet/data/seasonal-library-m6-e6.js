(()=>{
 const stories=window.ZISA_FINAL_STORIES||[];
 window.ZISA_BOOKS=window.ZISA_BOOKS.filter(b=>!b.theme||!['M6','E6'].includes(b.level));
 const illustrated={
  'm6-schaduw-ontsnapt':['nar','kier','draaiboek'],
  'm6-pakjestrein':['locomotief','wissel','doorgang'],
  'e6-museum-middernacht':['sokkel','miniatuurschip','vitrine'],
  'e6-brief-zonder-naam':['adresregel','kozijn','verouderd']
 };
 for(const s of stories){
  const image=n=>`images/seizoenen-v2/${s.id}/${String(n).padStart(2,'0')}.png`;
  const pages=s.pages.map((text,i)=>({text,image:image(i+1)}));
  for(const [n,q,a,correct,hint] of s.questions)pages[n-1].task={type:'choice',q,a:[...a],correct,hint};
  window.ZISA_SPEED_GAMES[s.id]={words:[...new Set([...s.words,...Object.keys(s.glossary)])].filter(w=>s.pages.join(' ').toLowerCase().match(new RegExp('\\b'+w+'\\b')))};
  const glossary={...s.glossary};
  for(const word of illustrated[s.id])glossary[word]={text:glossary[word],image:`images/woordenschat-m6-e6/${word}.png`};
  // Inflected words in the story keep the same explanation.
  const aliases={vermoeden:'vermoedens',vitrines:'vitrine',vitrinekast:'vitrine',bevestigde:'bevestigt',bevestigd:'bevestigt'};
  for(const [form,base] of Object.entries(aliases))if(glossary[base])glossary[form]=glossary[base];
  window.ZISA_STORY_GLOSSARIES[s.id]=glossary;
  window.ZISA_LEVEL_GAMES[s.id]=[
   {type:'story-comic',title:'Het avontuur in vier prenten',q:'Sleep de prenten in de volgorde van het verhaal.',frames:s.order.map(n=>({image:image(n),text:s.pages[n-1].split('\n')[0]}))},
   ...s.endTasks,
   {type:'match',title:'Woord en prent',q:'Verbind de prenten met de juiste woorden.',pairs:illustrated[s.id].map((w,i)=>[{image:glossary[w].image,alt:`Woordprent ${i+1}`},w])},
   {type:'match',title:'De betekenis vinden',q:'Verbind elk woord met de juiste uitleg.',pairs:Object.entries(s.glossary).slice(-3)}
  ];
  window.ZISA_BOOKS.push({id:s.id,level:s.level,theme:s.theme,seasonalUpper:true,title:s.title,blurb:s.blurb,cover:image(1),pages,missionTitle:'Opdrachten bij het verhaal',readingAdventure:`extra-m6-e6.html#${s.id}`,readingAdventureLabel:'Extra leesspel ›'});
 }
})();
