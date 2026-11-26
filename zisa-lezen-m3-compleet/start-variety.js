(()=>{
 let resize,changes,frame;
 window.fitStartExercise=()=>{
  resize?.disconnect();changes?.disconnect();cancelAnimationFrame(frame);
  const card=document.querySelector('.mini-right'),book=document.querySelector('.mini-book');
  if(!card||!book)return;
  const fit=()=>{
   if(!card.isConnected)return;
   card.style.zoom='1';card.style.maxHeight='none';
   const style=getComputedStyle(book);
   const height=book.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-8;
   const natural=Math.max(card.scrollHeight,card.getBoundingClientRect().height);
   let factor=Math.min(1,height/natural);
   card.style.zoom=String(factor);card.style.maxHeight=`${height/factor}px`;
   // Zoom kan tekst opnieuw laten afbreken. Meet daarom ook de uiteindelijke indeling.
   for(let n=0;n<4&&card.scrollHeight>card.clientHeight+1;n++){
    factor*=Math.max(.5,(card.clientHeight-4)/card.scrollHeight);
    card.style.zoom=String(factor);card.style.maxHeight=`${height/factor}px`;
   }
   card.scrollTop=0;
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fit)};
  resize=new ResizeObserver(schedule);resize.observe(book);
  changes=new MutationObserver(schedule);changes.observe(card,{childList:true,subtree:true,characterData:true});
  card.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',schedule,{once:true})});
  fit();schedule();
 };
 window.renderStartVariety=(page,activity,done,say)=>{
  if(window.renderStartGames?.(page,activity,done,say))return true;
  if(!page.buildWord&&!page.sentenceMatch)return false;
  const feedback=document.querySelector('#fluencyFeedback');
  if(page.buildWord){
   const audio=document.createElement('button');audio.className='start-audio-prompt';audio.type='button';audio.textContent='🔊';audio.setAttribute('aria-label','Luister naar het woord');audio.onclick=()=>say(page.buildWord);activity.append(audio);
   const slots=document.createElement('div');slots.className='build-slots';
   const choices=document.createElement('div');choices.className='build-choices';
   const picked=[],history=[];
   const undo=document.createElement('button');undo.type='button';undo.className='build-undo';undo.textContent='↶';undo.setAttribute('aria-label','Laatste klank terug');
   const draw=()=>{slots.replaceChildren();page.parts.forEach((part,i)=>{const tile=document.createElement('span');tile.textContent=picked[i]?.part||'·';tile.dataset.slot=String(i);slots.append(tile)});undo.disabled=!history.length};
   // Een stabiele andere volgorde, nooit het antwoord al op volgorde aanbieden.
   const order=page.parts.map((part,i)=>({part,i}));order.push(order.shift());
   order.forEach(({part,i})=>{const b=document.createElement('button');b.type='button';b.textContent=part;
   const place=(slot=page.parts.findIndex((_,n)=>!picked[n]))=>{
    if(b.disabled||slot<0||picked[slot])return;
    b.disabled=true;picked[slot]={part,b};history.push(slot);draw();
    if(history.length===page.parts.length){
     if(picked.map(x=>x.part).join('')===page.buildWord){choices.querySelectorAll('button').forEach(x=>x.disabled=true);undo.disabled=true;feedback.textContent='✓ Goed!';slots.classList.add('complete');done()}
     else{feedback.textContent='Probeer opnieuw.';picked.forEach(x=>x.b.disabled=false);picked.length=0;history.length=0;draw()}
    }
   };
   let drag=null,suppressClickUntil=0;
   b.onclick=e=>{if(e.detail&&Date.now()<suppressClickUntil)return;place()};
   const clearDrag=()=>{drag?.ghost?.remove();drag=null;slots.classList.remove('drag-over');slots.querySelectorAll('.drop-target').forEach(t=>t.classList.remove('drop-target'))};
   b.onpointerdown=e=>{if(b.disabled||e.button!==0)return;suppressClickUntil=0;drag={x:e.clientX,y:e.clientY,id:e.pointerId};b.setPointerCapture(e.pointerId)};
   b.onpointermove=e=>{
    if(!drag||drag.id!==e.pointerId)return;
    if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;
    if(!drag.ghost){const ghost=document.createElement('div');ghost.className='build-drag-ghost';ghost.textContent=part;document.body.append(ghost);drag.ghost=ghost}
    e.preventDefault();drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
    slots.querySelectorAll('span').forEach((tile,n)=>{const r=tile.getBoundingClientRect();tile.classList.toggle('drop-target',!picked[n]&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)});
   };
   b.onpointerup=e=>{
    if(!drag)return;const moved=!!drag.ghost;let target=-1;
    if(moved){suppressClickUntil=Date.now()+500;[...slots.children].forEach((tile,n)=>{const r=tile.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)target=n})}
    clearDrag();if(moved&&target>=0)place(target);
    else if(!moved&&e.pointerType==='touch'){suppressClickUntil=Date.now()+500;place()}
   };
   b.onpointercancel=clearDrag;b.onlostpointercapture=clearDrag;choices.append(b)});
   undo.onclick=()=>{const slot=history.pop();const last=picked[slot];if(last){last.b.disabled=false;delete picked[slot]}feedback.textContent='';draw()};
   activity.append(slots,choices,undo);draw();return true;
  }
  const book=document.querySelector('.mini-book');book.classList.add('start-route-simple','sentence-match-book');
  document.querySelector('.mini-left').replaceChildren();
  document.querySelector('.fluency-question').textContent='Zin → prent';
  const board=document.createElement('div');board.className='sentence-match-board';
  const sentences=document.createElement('div');sentences.className='match-sentences';
  const pictures=document.createElement('div');pictures.className='match-pictures';
  let selected=null;const matched=new Set();const sentenceButtons=[];const pictureButtons=[];
  page.sentenceMatch.forEach((pair,i)=>{
   const b=document.createElement('button');b.type='button';b.className='match-sentence';b.textContent=pair.text;b.setAttribute('aria-pressed','false');
   b.onclick=()=>{selected=i;sentenceButtons.forEach((x,n)=>{x.classList.toggle('selected',n===i);x.setAttribute('aria-pressed',String(n===i))});feedback.textContent='Kies de prent.'};
   sentenceButtons.push(b);sentences.append(b);
  });
  page.order.forEach(i=>{
   const b=document.createElement('button');b.type='button';b.className='match-picture';b.setAttribute('aria-label',`Prent ${pictures.children.length+1}`);
   const img=document.createElement('img');img.src=page.sentenceMatch[i].src;img.alt='';b.append(img);pictureButtons[i]=b;
   b.onclick=()=>{
    if(selected===null){feedback.textContent='Kies eerst een zin.';return}
    if(selected!==i){feedback.textContent='Kijk nog eens.';return}
    matched.add(i);b.disabled=true;sentenceButtons[i].disabled=true;
    for(const item of [b,sentenceButtons[i]]){item.classList.remove('selected');item.classList.add('matched');item.style.setProperty('--pair-color',['#167467','#7850b4','#a56212'][i]);const badge=document.createElement('span');badge.className='match-badge';badge.textContent=`${i+1} ✓`;item.append(badge)}
    sentenceButtons[i].setAttribute('aria-pressed','false');selected=null;
    feedback.textContent=matched.size===3?'✓ Alles verbonden!':`${matched.size} / 3 ✓`;
    if(matched.size===3)done();
   };pictures.append(b);
  });
  board.append(sentences,pictures);activity.append(board);return true;
 };
})();
