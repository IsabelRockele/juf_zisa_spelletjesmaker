(()=>{
 const makeButton=(label,handler)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=handler;return b};
 const makeImage=src=>{const img=document.createElement('img');img.src=leesMedia(src);img.alt='';return img};
 function setup(kind){
  document.querySelector('.mini-book').classList.add('start-route-simple','start-game-book',kind);
  document.querySelector('.mini-left').replaceChildren();
 }
 window.renderStartGames=(page,activity,done,say)=>{
  if(!page.memoryPairs&&!page.pictureQuiz&&!page.rhymePairs&&!page.sentenceChoice&&!page.miniStory)return false;
  const feedback=document.querySelector('#fluencyFeedback');
  if(page.rhymeMode==='choose'){
   setup('rhyme-choice-book');let index=0;const solved=new Set();
   const draw=()=>{
    activity.replaceChildren();const pair=page.rhymePairs[index];
    const progress=document.createElement('p');progress.textContent=`${index+1} / 3`;activity.append(progress);
    const focus=document.createElement('div');focus.className='rhyme-choice-focus';focus.append(makeImage(pair.leftImage));const label=document.createElement('strong');label.textContent=pair.left;focus.append(label);
    const hear=makeButton('🔊',()=>say(pair.left));hear.className='rhyme-listen';hear.setAttribute('aria-label',`Beluister ${pair.left}`);focus.append(hear);activity.append(focus);
    const choices=document.createElement('div');choices.className='rhyme-choice-options';let answered=false;
    page.order.forEach(n=>{const option=page.rhymePairs[n];const wrap=document.createElement('div');wrap.className='rhyme-choice-option';const b=makeButton('',()=>{
     if(answered)return;if(n!==index){feedback.textContent='Luister nog eens.';return}answered=true;solved.add(n);b.classList.add('correct');feedback.textContent='✓';
     if(solved.size===3){done();return}const next=makeButton('➜',()=>{index++;feedback.textContent='';draw()});next.className='rhyme-choice-next';next.setAttribute('aria-label','Volgend rijmwoord');activity.append(next);
    });b.setAttribute('aria-label',option.right);b.append(makeImage(option.rightImage));const word=document.createElement('span');word.textContent=option.right;b.append(word);
    const listen=makeButton('🔊',()=>say(option.right));listen.className='rhyme-listen';listen.setAttribute('aria-label',`Beluister ${option.right}`);wrap.append(b,listen);choices.append(wrap)});activity.append(choices);
   };draw();return true;
  }
  if(page.rhymeMode==='memory'){
   setup('rhyme-memory-book');let first=null,busy=false,found=0;const board=document.createElement('div');board.className='word-memory-board rhyme-memory-board';
   const deck=page.rhymePairs.flatMap((pair,id)=>[{id,word:pair.left,src:pair.leftImage},{id,word:pair.right,src:pair.rightImage}]);
   [2,5,0,3,1,4].forEach(index=>{const card=deck[index];const wrap=document.createElement('div');wrap.className='rhyme-memory-cell';let b;
    const listen=makeButton('🔊',()=>say(card.word));listen.className='rhyme-listen';listen.hidden=true;listen.setAttribute('aria-label',`Beluister ${card.word}`);
    b=makeButton('?',()=>{
     if(busy||b.disabled||first?.b===b)return;b.replaceChildren(makeImage(card.src));const word=document.createElement('span');word.textContent=card.word;b.append(word);b.classList.add('flipped');b.setAttribute('aria-label',card.word);listen.hidden=false;
     if(!first){first={b,listen,card};return}const previous=first;first=null;
     if(previous.card.id===card.id){[b,previous.b].forEach(tile=>{tile.disabled=true;tile.classList.add('found')});found++;feedback.textContent=`${found} / 3 ✓`;if(found===3)done()}
     else{busy=true;feedback.textContent='Nog eens.';setTimeout(()=>{if(!board.isConnected)return;for(const item of [{b,listen},previous]){item.b.textContent='?';item.b.classList.remove('flipped');item.b.setAttribute('aria-label','Gesloten kaart');item.listen.hidden=true}busy=false;feedback.textContent=''},900)}
    });b.className='memory-tile';b.setAttribute('aria-label',`Gesloten kaart ${index+1}`);wrap.append(b,listen);board.append(wrap);
   });activity.append(board);return true;
  }
  if(page.miniStory){
   setup('mini-story-book');const story=page.miniStory;
   const spread=document.createElement('div');spread.className='mini-story-spread';spread.append(makeImage(story.src));
   const text=document.createElement('div');text.className='mini-story-lines';story.lines.forEach(line=>{const p=document.createElement('p');p.textContent=line;text.append(p)});
   const listen=makeButton('🔊',()=>say(story.lines.join(' ')));listen.className='rhyme-listen';listen.setAttribute('aria-label','Beluister het verhaal');text.append(listen);spread.append(text);activity.append(spread);
   const question=document.createElement('p');question.className='mini-story-question';question.textContent=story.question;
   const options=document.createElement('div');options.className='mini-story-options';
   story.options.forEach(answer=>{const b=makeButton(answer,()=>{
    if(answer!==story.answer){feedback.textContent='Lees nog eens.';return}
    b.classList.add('correct');options.querySelectorAll('button').forEach(x=>x.disabled=true);feedback.textContent='✓ Goed gelezen!';done();
   });options.append(b)});activity.append(question,options);return true;
  }
  if(page.memoryPairs){
   setup('memory-book');let first=null,busy=false,found=0;
   const board=document.createElement('div');board.className='word-memory-board';
   const cards=page.memoryPairs.flatMap((pair,id)=>[{pair,id,image:false},{pair,id,image:true}]);
   let seed=page.seed;for(let i=cards.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[cards[i],cards[j]]=[cards[j],cards[i]]}
   cards.forEach((card,i)=>{
    const b=makeButton('?',()=>{
     if(busy||b.disabled||first?.b===b)return;
     b.classList.add('flipped');b.replaceChildren(card.image?makeImage(card.pair.src):document.createTextNode(card.pair.word));b.setAttribute('aria-label',card.image?`Prent: ${card.pair.word}`:card.pair.word);
     if(!first){first={b,card};return}
     const previous=first;first=null;
     if(previous.card.id===card.id){for(const tile of [b,previous.b]){tile.disabled=true;tile.classList.add('found')}found++;feedback.textContent=`${found} / ${page.memoryPairs.length} ✓`;if(found===page.memoryPairs.length)done()}
     else{busy=true;feedback.textContent='Nog eens.';setTimeout(()=>{if(!board.isConnected)return;for(const tile of [b,previous.b]){tile.classList.remove('flipped');tile.textContent='?';tile.setAttribute('aria-label',`Gesloten kaart`)}busy=false;feedback.textContent=''},900)}
    });b.className='memory-tile';b.setAttribute('aria-label',`Gesloten kaart ${i+1}`);board.append(b);
   });activity.append(board);return true;
  }
  if(page.pictureQuiz){
   setup('picture-quiz-book');const board=document.createElement('div');board.className='picture-quiz-board';let solved=0;
   page.pictureQuiz.forEach((card,i)=>{
    const box=document.createElement('div');box.className='picture-quiz-card';box.style.setProperty('--quiz-color',['#e77991','#9981c7','#64b6ad','#d8ab53'][i%4]);
    box.append(makeImage(card.src));const choices=document.createElement('div');choices.className='picture-quiz-options';
    card.options.forEach(word=>{const b=makeButton(word,()=>{
     if(word!==card.word){feedback.textContent='Kijk nog eens.';b.classList.add('try-again');setTimeout(()=>b.classList.remove('try-again'),500);return}
     b.classList.add('correct');choices.querySelectorAll('button').forEach(x=>x.disabled=true);solved++;feedback.textContent=`${solved} / ${page.pictureQuiz.length} ✓`;if(solved===page.pictureQuiz.length)done();
    });choices.append(b)});box.append(choices);board.append(box);
   });activity.append(board);return true;
  }
  if(page.sentenceChoice){
   setup('sentence-choice-book');const board=document.createElement('div');board.className='sentence-choice-board';board.append(makeImage(page.sentenceChoice.src));
   const choices=document.createElement('div');choices.className='sentence-choice-options';
   page.sentenceChoice.options.forEach(text=>{const b=makeButton(text,()=>{
    if(text!==page.sentenceChoice.answer){feedback.textContent='Kijk nog eens.';return}
    b.classList.add('correct');choices.querySelectorAll('button').forEach(x=>x.disabled=true);feedback.textContent='✓ Goed!';done();
   });choices.append(b)});board.append(choices);activity.append(board);return true;
  }
  setup('rhyme-book');let selected=null,solved=0;
  const board=document.createElement('div');board.className='rhyme-board';
  const left=document.createElement('div'),right=document.createElement('div');left.className=right.className='rhyme-column';const leftButtons=[];
  const tile=(pair,side,id)=>{
   const wrap=document.createElement('div');wrap.className='rhyme-tile';
   const word=side==='left'?pair.left:pair.right;
   const b=makeButton('',()=>{
    if(side==='left'){selected=id;leftButtons.forEach((x,n)=>{x.classList.toggle('selected',n===id);x.setAttribute('aria-pressed',String(n===id))});feedback.textContent='Wat rijmt?';return}
    if(selected===null){feedback.textContent='Kies eerst links.';return}
    if(selected!==id){feedback.textContent='Luister nog eens.';return}
    b.disabled=true;leftButtons[id].disabled=true;leftButtons[id].classList.remove('selected');b.classList.add('correct');leftButtons[id].classList.add('correct');
    for(const matched of [b,leftButtons[id]]){const badge=document.createElement('small');badge.textContent=`${id+1} ✓`;matched.append(badge)}selected=null;solved++;feedback.textContent=`${solved} / 3 ✓`;if(solved===3)done();
   });b.className='rhyme-word';b.setAttribute('aria-label',word);if(side==='left')b.setAttribute('aria-pressed','false');
   const src=side==='left'?pair.leftImage:pair.rightImage;if(src)b.append(makeImage(src));const label=document.createElement('span');label.textContent=word;b.append(label);
   const listen=makeButton('🔊',()=>say(word));listen.className='rhyme-listen';listen.setAttribute('aria-label',`Beluister ${word}`);wrap.append(b,listen);if(side==='left')leftButtons.push(b);return wrap;
  };
  page.rhymePairs.forEach((p,i)=>left.append(tile(p,'left',i)));page.order.forEach(i=>right.append(tile(page.rhymePairs[i],'right',i)));board.append(left,right);activity.append(board);return true;
 };
})();
