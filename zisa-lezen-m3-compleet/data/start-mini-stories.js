(()=>{
 // Gratis statische Cloudflare-prenten; alle originele bestanden gecontroleerd.
 const imageBase=window.ZISA_START_STORY_IMAGE_BASE||'https://zisa-leesprenten-start.pages.dev/verhalen/';
 const asset=id=>imageBase+(id==='muis'?'muis-v2':id)+'.png';
 const stories=[
  {id:'doos',title:'de doos',lines:['pim ziet een doos.','de doos is voor pim.','er zit een koek in.','pim eet de koek.'],question:'wat zit er in de doos?',options:['een koek','een boek','een doek'],answer:'een koek'},
  {id:'jas',title:'de jas',lines:['sam is nat.','zijn jas is ook nat.','kom, sam!','kom bij mam.'],question:'wie is nat?',options:['sam','mam'],answer:'sam'},
  {id:'muis',title:'de muis',lines:['een muis ziet kaas.','de kaas is in een doos.','er is een gat in de doos.','de muis gaat door het gat.'],question:'waar is de kaas?',options:['in de doos','op de doos','bij de boom'],answer:'in de doos'}
 ];
 const firstStages=new Set();
 for(const book of window.ZISA_BOOKS.filter(b=>b.learnedLetters)){
  const eligible=stories.filter(s=>[s.title,...s.lines,s.question,...s.options].every(text=>text.match(/[a-z]+/g).every(w=>window.ZISA_START_WORD_ALLOWED(w,book.method,book.stage,book.learnedLetters))));
  if(!eligible.length)continue;
  const id=book.id+'-mini-verhalen';
  window.ZISA_FLUENCY_BOOKS[id]=eligible.map((s,i)=>({title:s.title,q:'Lees. Kies.',miniStory:{...s,src:asset(s.id),options:[...s.options.slice(i%s.options.length),...s.options.slice(0,i%s.options.length)]}}));
  book.startPractice.push({...book,id,title:'Korte verhaaltjes',coverImage:asset(eligible[0].id),startPractice:null,practiceParent:book.id,blurb:`${book.stage} · ${eligible.length} korte verhaaltjes met een vraag.`});
  eligible.forEach(s=>{
   const key=book.method+'-'+s.id;
   if(firstStages.has(key))return;
   firstStages.add(key);
   const storyId='start-verhaal-'+key;
   window.ZISA_FLUENCY_BOOKS[storyId]=[window.ZISA_FLUENCY_BOOKS[id].find(p=>p.miniStory.id===s.id)];
   window.ZISA_BOOKS.push({id:storyId,level:'START',method:book.method,stage:book.stage,title:s.title,blurb:`Vanaf ${book.stage.toLowerCase()} · een kort verhaal met een vraag.`,coverImage:asset(s.id),coverTone:book.coverTone,startBook:true,shortStory:true,pages:[]});
  });
  book.blurb=book.blurb.replace(/\d+ extra leesreeksen/,`${book.startPractice.reduce((n,b)=>n+window.ZISA_FLUENCY_BOOKS[b.id].length,0)} extra leesreeksen`);
 }
})();
