function renderSeasonalPlay(game,activity){
  const comic=game.type==='story-comic',count=comic?game.frames.length:game.tokens.length;
  const order=shuffledWrong(Array.from({length:count},(_,i)=>i));let step=0;
  const card=activity.closest('.mission-card');card.classList.add('compact-play');
  const question=card.querySelector('.mission-question');question.textContent=comic?'Sleep de prenten in de vakken.':'Breng het kaartje naar de juiste plek.';
  const speech=card.querySelector('.mission-question-row [data-say]');if(speech)speech.dataset.say=question.textContent;
  const root=document.createElement('div');root.className='compact-game';activity.append(root);
  if(comic){renderPictureSorting(game,root);return;}
  const progress=document.createElement('div');progress.className='compact-progress';progress.setAttribute('aria-live','polite');
  const stage=document.createElement('div');stage.className=comic?'compact-frames':'compact-delivery';root.append(progress,stage);
  function accept(index,button){
    if(step===count)return;
    if(index!==(comic?step:order[step])){button.classList.add('try-again');setMissionFeedback(comic?'Die prent komt later. Probeer nog eens.':'Die plek klopt nog niet. Probeer nog eens.','bad');return;}
    step++;draw();
    if(step===count)finishGame(null,comic?'Je verhaal staat weer goed!':'Alles staat op de juiste plek!');
    else setMissionFeedback(comic?'Goed! Welke prent komt daarna?':'Bezorg nu het volgende kaartje.','good');
  }
  function draw(){
    stage.replaceChildren();progress.replaceChildren();
    const status=document.createElement('span');status.textContent=`${step} / ${count}`;progress.append(status);
    for(let i=0;i<count;i++){
      const mark=document.createElement('span');mark.className='compact-mark'+(i<step?' filled':'');
      if(comic&&i<step){const img=document.createElement('img');img.src=game.frames[i].image;img.alt=`Prent ${i+1} geplaatst`;mark.append(img);}else mark.textContent=i<step?'✓':String(i+1);
      progress.append(mark);
    }
    if(step===count){const win=document.createElement('div');win.className='compact-win';win.textContent='Gelukt!';stage.append(win);return;}
    if(comic){
      order.forEach(i=>{
        const button=document.createElement('button');button.type='button';button.className='compact-frame';button.dataset.frame=i;button.disabled=i<step;button.setAttribute('aria-label',game.frames[i].text);
        const img=document.createElement('img');img.src=game.frames[i].image;img.alt='';
        const text=document.createElement('span');text.textContent=i<step?'✓':game.frames[i].text.split(/(?<=[.!?])\s+|\n/)[0];
        button.append(img,text);button.onclick=()=>accept(i,button);stage.append(button);
      });
    }else{
      const current=order[step],parcel=document.createElement('div');parcel.className='compact-parcel';parcel.draggable=true;parcel.dataset.token=current;
      const symbol=document.createElement('span');symbol.className='parcel-symbol';
      const word=game.tokens[current].toLowerCase();
      const icons={wind:'🌬️',mo:'🐈',mam:'👩',sam:'👦',noor:'👧',doos:'📦',pak:'🎁',sok:'🧦',lint:'🎀',zak:'🎒',bo:'🧒',sem:'👦'};
      symbol.textContent=game.symbols?.[current]||icons[word]||(/zak|pak|krat/.test(word)?'🎁':/licht|lamp/.test(word)?'🏮':/foto/.test(word)?'📷':/maan/.test(word)?'🌙':/regen/.test(word)?'🌧️':'🔎');if(game.colors)symbol.style.background=game.colors[current];
      const label=document.createElement('strong');label.textContent=game.tokens[current];parcel.append(symbol,label);
      if(hasAudioSupport())parcel.append(makeListenButton(game.tokens[current],'Lees het kaartje voor'));
      parcel.ondragstart=e=>e.dataTransfer.setData('text/plain',String(current));stage.append(parcel);
      const targets=document.createElement('div');targets.className='compact-targets';stage.append(targets);
      game.targets.forEach((text,i)=>{
        const button=document.createElement('button');button.type='button';button.className='compact-target';button.dataset.target=i;button.textContent=text;
        if(game.targetColors)button.style.borderColor=game.targetColors[i];button.onclick=()=>accept(i,button);
        button.ondragover=e=>e.preventDefault();button.ondrop=e=>{e.preventDefault();accept(i,button);};targets.append(button);
      });
    }
  }
  draw();
}

function renderPictureSorting(game,root){
  const count=game.frames.length,placed=Array(count).fill(null);
  const order=shuffledWrong(Array.from({length:count},(_,i)=>i));
  let selected=null,complete=false;
  root.classList.add('picture-sorting');
  const slots=document.createElement('div');slots.className='picture-slots';slots.style.setProperty('--slots',count);
  const bank=document.createElement('div');bank.className='picture-bank';bank.style.setProperty('--slots',count);
  slots.setAttribute('aria-label','Verhaalvolgorde van links naar rechts');bank.setAttribute('aria-label','Losse prenten');
  root.append(slots,bank);
  function move(index,destination){
    if(complete)return;
    const old=placed.indexOf(index),displaced=placed[destination];
    if(old>=0)placed[old]=displaced;
    placed[destination]=index;selected=null;draw();
    if(placed.every(i=>i!==null)){
      if(placed.every((value,i)=>value===i)){complete=true;finishGame(null,'Je hebt het verhaal goed gelegd!');}
      else{placed.forEach((value,i)=>{if(value!==i)slots.children[i].classList.add('try-again');});setMissionFeedback('Kijk nog eens naar de oranje vakken. Je kunt prenten wisselen.','bad');}
    }else setMissionFeedback('','');
  }
  function piece(index){
    const button=document.createElement('button');button.type='button';button.className='sorting-piece';button.dataset.frame=index;button.draggable=true;
    button.setAttribute('aria-label',game.frames[index].text);button.setAttribute('aria-pressed',String(selected===index));
    const img=document.createElement('img');img.src=game.frames[index].image;img.alt=game.frames[index].text;img.draggable=false;button.append(img);
    if(selected===index)button.classList.add('selected');
    button.ondragstart=e=>{selected=index;e.dataTransfer.setData('text/plain',String(index));e.dataTransfer.effectAllowed='move';};
    button.onclick=e=>{e.stopPropagation();if(selected!==null&&selected!==index&&placed.includes(index)){move(selected,placed.indexOf(index));return;}selected=selected===index?null:index;draw();};
    // Pointer dragging also works on touch screens, without requiring a page scroll.
    button.onpointerdown=e=>{
      if(e.pointerType==='mouse')return;
      const startX=e.clientX,startY=e.clientY;let dragging=false;
      button.setPointerCapture(e.pointerId);
      button.onpointermove=event=>{if(Math.hypot(event.clientX-startX,event.clientY-startY)>8){dragging=true;button.classList.add('dragging');}};
      button.onpointerup=event=>{
        button.onpointermove=null;button.onpointerup=null;button.classList.remove('dragging');
        if(!dragging)return;
        const zone=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-slot]');
        if(zone){event.preventDefault();move(index,Number(zone.dataset.slot));}
      };
      button.onpointercancel=()=>button.classList.remove('dragging');
    };
    return button;
  }
  function draw(){
    slots.replaceChildren();bank.replaceChildren();
    for(let i=0;i<count;i++){
      const slot=document.createElement('div');slot.className='picture-slot';slot.dataset.slot=i;
      const label=document.createElement('span');label.className='slot-number';label.textContent=String(i+1);slot.append(label);
      if(placed[i]!==null)slot.append(piece(placed[i]));
      else{const target=document.createElement('button');target.className='empty-picture-slot';target.type='button';target.textContent='+';target.setAttribute('aria-label',`Plaats de prent in vak ${i+1}`);target.onclick=()=>{if(selected!==null)move(selected,i);};slot.append(target);}
      slot.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='move';};
      slot.ondrop=e=>{e.preventDefault();const value=e.dataTransfer.getData('text/plain');const index=Number(value);if(value!==''&&Number.isInteger(index)&&index>=0&&index<count)move(index,i);};slots.append(slot);
    }
    order.forEach(i=>{if(!placed.includes(i))bank.append(piece(i));});
  }
  draw();
}
