(()=>{
 const imageBase=window.ZISA_START_SENTENCE_IMAGE_BASE||'https://zisa-leesprenten-start.pages.dev/zinnen/';
 const sceneImages={'object:boot':'boot','object:vis':'vis','object:roos':'roos',a01:'sam-mam',a07:'kat-mat',a11:'sam-boek',a10:'sam-bal',b06:'kat-boek',b07:'sam-mam-kat'};
 const scenes=[
  ['object:boot',['dit is een boot.','dit is een doos.','dit is een beer.']],
  ['object:vis',['dit is een vis.','dit is een kip.','dit is een aap.']],
  ['object:roos',['dit is een roos.','dit is een pen.','dit is een boom.']],
  ['a01',['sam is bij mam.','sam is bij de kat.','sam is bij de bus.']],
  ['a07',['de kat zit op de mat.','de kat zit in de doos.','de kat zit op de boot.']],
  ['a11',['sam is bij het boek.','sam is bij de boot.','sam is bij de bus.']],
  ['a10',['sam is bij de bal.','sam is bij de boot.','sam is bij de vis.']],
  ['b06',['de kat ziet het boek.','de kat ziet een vis.','de kat ziet een muis.']],
  ['b07',['sam en mam zien de kat.','sam en mam zien de vis.','sam en mam zien de muis.']]
 ];
 const choicePlan={kim:{'Kern 3':[0,1],'Kern 4':[3,4],'Kern 5':[5,6],'Kern 6':[7,8],'Kern 7':[2]},zoem:{'Anker 2':[0,1],'Anker 3':[3,4,5,6],'Anker 4':[7,8],'Anker 5':[2]}};
 for(const book of window.ZISA_BOOKS.filter(b=>b.learnedLetters)){
  const possible=(choicePlan[book.method]?.[book.stage]||[]).map(index=>index===2?[scenes[index][0],['de roos staat in het perk.','de roos staat in de kast.','de roos staat op de trap.']]:scenes[index]);
  if(!possible.every(([,options])=>options.every(text=>text.match(/[a-z]+/g).every(w=>window.ZISA_START_WORD_ALLOWED(w,book.method,book.stage,book.learnedLetters)))))throw Error('Zinkeuze past niet bij '+book.stage);
  if(!possible.length)continue;
  const id=book.id+'-zin-kiezen';
  window.ZISA_FLUENCY_BOOKS[id]=possible.map(([scene,options],i)=>{
   const order=i%3;return {title:'Welke zin past?',q:'Kijk. Lees. Kies.',sentenceChoice:{src:`${imageBase}choice-${sceneImages[scene]}.png`,options:[...options.slice(order),...options.slice(0,order)],answer:options[0]}};
  });
  book.startPractice.push({...book,id,title:'Welke zin past?',startPractice:null,practiceParent:book.id,blurb:`${book.stage} · ${possible.length} prenten met drie zinnen.`});
  book.blurb=book.blurb.replace(/\d+ extra leesreeksen/,`${book.startPractice.reduce((n,b)=>n+window.ZISA_FLUENCY_BOOKS[b.id].length,0)} extra leesreeksen`);
 }
 const image=name=>`images/start-eigen/${name}.png`;
 const rhymeImage=name=>(window.ZISA_START_RHYME_IMAGE_BASE||'https://zisa-leesprenten-start.pages.dev/rijmen/')+name+'.png';
 const pairs=[
  {left:'muis',right:'huis',leftImage:image('muis'),rightImage:image('huis')},
  {left:'doos',right:'roos',leftImage:image('doos'),rightImage:image('roos')},
  {left:'mus',right:'bus',leftImage:'images/start/mus.webp',rightImage:image('bus')},
  {left:'vis',right:'mis',leftImage:image('vis'),rightImage:rhymeImage('mis')},
  {left:'kat',right:'mat',leftImage:image('kat'),rightImage:rhymeImage('mat')},
  {left:'jas',right:'was',leftImage:image('jas'),rightImage:rhymeImage('was')},
  {left:'pen',right:'den',leftImage:image('pen'),rightImage:rhymeImage('den')},
  {left:'maan',right:'haan',leftImage:'images/start/maan.webp',rightImage:rhymeImage('haan')},
  {left:'beer',right:'meer',leftImage:image('beer'),rightImage:rhymeImage('meer')},
  {left:'boek',right:'koek',leftImage:rhymeImage('boek'),rightImage:rhymeImage('koek')},
  {left:'wip',right:'kip',leftImage:rhymeImage('wip'),rightImage:image('kip')},
  {left:'boot',right:'noot',leftImage:image('boot'),rightImage:rhymeImage('noot')},
  {left:'boor',right:'oor',leftImage:rhymeImage('boor'),rightImage:rhymeImage('oor')},
  {left:'been',right:'teen',leftImage:rhymeImage('been'),rightImage:rhymeImage('teen')},
  {left:'peer',right:'veer',leftImage:rhymeImage('peer'),rightImage:rhymeImage('veer')},
  {left:'vuur',right:'muur',leftImage:image('vuur'),rightImage:rhymeImage('muur')},
  {left:'reep',right:'zeep',leftImage:rhymeImage('reep'),rightImage:rhymeImage('zeep')}
 ];
 const rhymeBook=window.ZISA_BOOKS.find(b=>b.id==='start-rijmen');
 if(rhymeBook){
  rhymeBook.blurb='Verbind, kies en speel rijmmemory.';
  // Three short games per visit. No repeated words or ambiguous rhyme endings
  // within a game; the other vocabulary appears on the next visit.
  const rounds=[[[9,10,11],[12,13,14],[1,15,16]],[[6,7,8],[0,2,3],[4,5,9]]];
  const makeRound=round=>{window.ZISA_FLUENCY_BOOKS['start-rijmen']=rounds[round].map((set,i)=>({title:['Wat rijmt?','Kies het rijm','Rijmmemory'][i],q:['Zoek het rijm.','Wat rijmt?','Zoek twee rijmwoorden.'][i],rhymeMode:['connect','choose','memory'][i],rhymePairs:set.map(n=>pairs[n]),order:i%2?[1,2,0]:[2,0,1]}))};
  let nextRound=0;
  try{nextRound=Number(localStorage.getItem('zisa_rhyme_next_round'))===1?1:0}catch(e){}
  makeRound(nextRound);
  const refresh=window.ZISA_REFRESH_START_PRACTICE;
  window.ZISA_REFRESH_START_PRACTICE=book=>{
   if(book.id!=='start-rijmen'){refresh?.(book);return}
   makeRound(nextRound);nextRound=1-nextRound;
   try{localStorage.setItem('zisa_rhyme_next_round',String(nextRound))}catch(e){}
  };
 }
})();
