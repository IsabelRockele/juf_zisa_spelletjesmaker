(()=>{
 const pictured='aap beer boom boot bus doek doos fiets gaas geit hout huis ijs jas kaas kat kip koe muis neus pen raam riem roos saus schaar schip spin spoor stoel trein uil vis vos vuur zak zee'.split(' ');
 const mix=(a,seed)=>{const out=[...a];for(let i=out.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out};
 for(const book of window.ZISA_BOOKS.filter(b=>b.learnedLetters)){
  const available=pictured.filter(w=>window.ZISA_START_WORD_ALLOWED(w,book.method,book.stage,book.learnedLetters));
  const focused=available.filter(w=>book.practiceFocusWords.includes(w));
  const words=[...focused,...available.filter(w=>!focused.includes(w))];
  if(words.length<3)continue;
  const id=book.id+'-memory';
  const count=Math.min(6,words.length);
  window.ZISA_FLUENCY_BOOKS[id]=Array.from({length:1},(_,i)=>{
   const deck=[...mix(focused,101+i*57+book.stage.length),...mix(words.filter(w=>!focused.includes(w)),73+i)].slice(0,count);
   return {title:'Woord en prent',q:'Zoek de paren.',memoryPairs:deck.map(word=>({word,src:`images/start-eigen/${word}.png`})),seed:i+43};
  });
  book.startPractice.push({...book,id,title:'Memory',startPractice:null,practiceParent:book.id,blurb:`${book.stage} · één spel met ${count} woord-prentparen.`});
  book.blurb=book.blurb.replace(/\d+ extra leesreeksen/,`${book.startPractice.reduce((n,b)=>n+window.ZISA_FLUENCY_BOOKS[b.id].length,0)} extra leesreeksen`);
  const old=window.ZISA_FLUENCY_BOOKS[book.id];
  const prompts=old.filter(p=>p.imageSrc&&p.a);
  if(prompts.length<2)continue;
  const quiz=[];
  for(let i=0;i<prompts.length;i+=4){
   const group=prompts.slice(i,i+4);
   quiz.push({title:'Welk woord past?',q:'Kijk. Kies.',pictureQuiz:group.map((p,n)=>{
    const correct=p.a[p.correct];const others=mix(words.filter(w=>w!==correct),i+n+19).slice(0,2);
    const choices=mix([correct,...others],i+n+45);
    return {word:correct,src:p.imageSrc,options:choices};
   })});
  }
  const rest=old.filter(p=>!prompts.includes(p));
  quiz.forEach((p,i)=>rest.splice(Math.min(i*9,rest.length),0,p));
  window.ZISA_FLUENCY_BOOKS[book.id]=rest;
 }
})();
