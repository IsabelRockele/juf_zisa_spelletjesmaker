// Afzonderlijke zinprenten, lokaal tot de gratis Cloudflare-upload is gecontroleerd.
// Korte functiewoorden zijn toegestaan door de gebruiker; ieder grafeem blijft gekend.
(()=>{
 const imageBase=window.ZISA_START_SENTENCE_IMAGE_BASE||'https://zisa-leesprenten-start.pages.dev/zinnen/';
 const names={a01:'sam-mam',a07:'kat-mat',a11:'sam-boek',a10:'sam-bal',b06:'kat-boek',a08:'mat-kat',boot:'vaar-boot',jas:'jas-aan',pen:'pak-pen',neus:'ruik-neus',huis:'woon-huis',kaas:'eet-kaas',riem:'riem-om',vos:'vos',roos:'roos',geit:'geit',vuur:'vuur',muis:'muis'};
 const scene=(text,name)=>({text,src:`${imageBase}match-${names[name]}.png`});
 const object=scene;
 const groups=[
  [scene('sam is bij mam.','a01'),scene('de kat zit op de mat.','a07'),scene('sam is bij het boek.','a11')],
  [scene('sam is bij de bal.','a10'),scene('de kat ziet het boek.','b06'),scene('de mat is bij de kat.','a08')],
  [object('ik vaar met een boot.','boot'),object('ik doe de jas aan.','jas'),object('pak een pen.','pen')],
  [object('ik ruik met mijn neus.','neus'),object('ik woon in een huis.','huis'),object('ik eet kaas.','kaas')],
  [object('doe de riem om.','riem'),object('waar is de vos?','vos'),object('ik zie een roos.','roos')],
  [object('de geit is een dier.','geit'),object('het vuur is heet.','vuur'),object('ik zie een muis.','muis')]
 ];
 const plan={kim:{'Kern 4':[0,2],'Kern 5':[1],'Kern 6':[3,5],'Kern 7':[4]},zoem:{'Anker 3':[0,2],'Anker 4':[3,5],'Anker 5':[1,4]}};
 for(const book of window.ZISA_BOOKS.filter(b=>b.learnedLetters)){
  const sets=(plan[book.method]?.[book.stage]||[]).map(index=>{
   let texts=null;
   if(index===4)texts=['de riem is bruin.','de vos staat in het bos.','de roos staat in het perk.'];
   if(index===1&&book.stage==='Anker 5')texts=['sam staat bij de bal.','de kat kijkt in het boek.','de mat ligt naast de kat.'];
   return groups[index].map((pair,n)=>({...pair,text:texts?texts[n]:pair.text}));
  });
  if(!sets.every(g=>g.every(p=>p.text.match(/[a-z]+/g).every(w=>window.ZISA_START_WORD_ALLOWED(w,book.method,book.stage,book.learnedLetters)))))throw Error('Zinnen passen niet bij '+book.stage);
  if(!sets.length)continue;
  const id=book.id+'-zinnen-verbinden';
  const pages=sets.map((pairs,i)=>({title:'Verbind de zinnen',q:'Tik op een zin. Tik op de juiste prent.',sentenceMatch:pairs,order:i%2?[1,2,0]:[2,0,1]}));
  window.ZISA_FLUENCY_BOOKS[id]=pages;
  book.startPractice.push({...book,id,title:'Zinnen verbinden',startPractice:null,practiceParent:book.id,blurb:book.stage});
  book.blurb=book.blurb.replace('18 extra leesreeksen',`${18+pages.length} extra leesreeksen`);
 }
})();
