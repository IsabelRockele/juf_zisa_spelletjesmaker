(()=>{
  function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;return b}
  // Codegetekende instructiepictogrammen, geen losse prent of woordhint.
  const icons={
    listen:'<path d="M12 25h10l12-10v34L22 39H12zM43 24q9 8 0 16M50 17q16 15 0 30"/>',
    choose:'<rect x="5" y="9" width="22" height="16" rx="4"/><rect x="37" y="9" width="22" height="16" rx="4"/><path d="M28 55 17 42q-3-6 3-6l8 5V24q0-7 6-7t6 7v11l13 3v17M45 2l-2 4M58 30l-5-2"/>',
    look:'<path d="M4 32q28-32 56 0-28 32-56 0Z"/><circle cx="32" cy="32" r="9"/>',
    read:'<circle cx="25" cy="17" r="11"/><path d="M21 15h1m6 0h1m-6 7h5M8 56V34q12-5 24 2 12-7 24-2v22q-12-5-24 1-12-6-24-1ZM32 36v21M42 12l8-4m-8 11h11m-12 7 8 3"/>',
    dice:'<rect x="10" y="10" width="44" height="44" rx="9"/><circle cx="22" cy="22" r="3"/><circle cx="42" cy="22" r="3"/><circle cx="32" cy="32" r="3"/><circle cx="22" cy="42" r="3"/><circle cx="42" cy="42" r="3"/>',
    check:'<rect x="10" y="10" width="44" height="44" rx="9"/><path d="m20 32 9 9 16-19"/>',
    swap:'<path d="M10 22h42l-9-9M54 42H12l9 9"/>',
    memory:'<rect x="3" y="9" width="25" height="42" rx="5"/><rect x="36" y="9" width="25" height="42" rx="5"/><path d="M10 30l5 6 7-13M42 30l5 6 7-13"/>',
    rows:'<rect x="6" y="6" width="52" height="52" rx="6"/><path d="M14 19h4m8 0h24M14 32h4m8 0h24M14 45h4m8 0h24"/>'
  };
  window.simplifyStartRoute=page=>{
    const book=document.querySelector('.mini-book');book.classList.add('start-route-simple');
    // Alleen decoratie verwijderen; de vraagprent en antwoordprenten blijven staan.
    document.querySelector('.mini-left').replaceChildren();
    const steps=page.audioPrompt?[['listen','Luister'],['choose','Kies']]:page.chunks?[['read','Lees']]:page.imageSrc||page.imagePrompt?[['look','Kijk'],['choose','Kies']]:[['read','Lees'],['choose','Kies']];
    const title=document.querySelector('.mini-right>h2');title.textContent=page.buildWord?'Bouw het woord':page.focus&&page.audioPrompt?'Maak het woord':page.chunks?'Lees':steps.map(s=>s[1]).join(' en ').toLowerCase().replace(/^./,c=>c.toUpperCase());
    const strip=document.createElement('div');strip.className='start-route-icons';strip.setAttribute('aria-hidden','true');
    steps.forEach(([icon,label],i)=>{if(i){const arrow=document.createElement('span');arrow.className='route-step-arrow';arrow.textContent='→';strip.append(arrow)}const picture=document.createElement('span');picture.className='route-step';picture.innerHTML=`<b class="route-step-number">${i+1}</b><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</svg><strong>${label}</strong>`;strip.append(picture)});
    title.after(strip);
    if(page.audioPrompt||page.chunks||page.imageSrc||page.imagePrompt)document.querySelector('.fluency-question').classList.add('start-instruction-hidden');
    const audio=document.querySelector('.start-audio-prompt');if(audio){audio.textContent='🔊';audio.setAttribute('aria-label','Luister naar het woord');audio.title='Luister naar het woord'}
    const start=document.querySelector('.start-zoom');if(start){start.textContent='▶';start.setAttribute('aria-label','Start met zoemen')}
  };
  function guide(page){
    const box=document.createElement('div');box.className='start-visual-guide';
    const steps=page.sentenceMatch||page.sentenceChoice?[['look','Kijk'],['read','Lees'],['choose','Kies']]:page.startPractice==='dice'?[['dice','Gooi'],['read','Lees'],['check','Tik ✓']]:page.startPractice==='swap'?[['read','Lees'],['swap','Wissel'],['read','Lees']]:[['read','Lees'],['check','Tik ✓']];
    const heading=document.createElement('h3');heading.textContent='Zo doe je dat';box.append(heading);
    const strip=document.createElement('div');strip.className='start-guide-steps';
    steps.forEach(([icon,label],i)=>{
      if(i){const arrow=document.createElement('span');arrow.className='start-guide-arrow';arrow.textContent='↓';arrow.setAttribute('aria-hidden','true');strip.append(arrow)}
      const step=document.createElement('div');step.className='start-guide-step';
      step.innerHTML=`<span class="start-guide-number">${i+1}</span><svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</svg><strong>${label}</strong>`;strip.append(step);
    });
    box.append(strip);
    const sample=document.createElement('div');sample.className='start-guide-example';
    if(page.startPractice==='swap'){
      const before=window.ZISA_START_PRACTICE.split(page.chain[0]);
      const old=document.createElement('span');old.textContent=page.chain[0];sample.append(old,document.createTextNode(' → '));
      const next=document.createElement('span');window.ZISA_START_PRACTICE.split(page.chain[1]).forEach((part,i)=>{const letter=document.createElement(part===before[i]?'span':'mark');letter.textContent=part;next.append(letter)});sample.append(next);
    }else if(page.rows)sample.textContent=`${page.rows[0].slice(0,2).join(' · ')}  ✓`;
    box.append(sample);return box;
  }
  window.renderStartPracticeCover=(book,open,openPage)=>{
    const host=document.querySelector('.mini-right');
      if(book.shortStory){
        document.querySelector('.mini-book').classList.add('start-route-simple','short-story-cover');
        host.replaceChildren();
        const label=document.createElement('small');label.textContent='Korte verhaaltjes';
        const art=document.createElement('img');art.src=leesMedia(book.coverImage);art.alt='';art.className='short-story-cover-art';
        const title=document.createElement('h1');title.textContent=book.title;
        const level=document.createElement('p');level.className='short-story-level';level.textContent=`Vanaf ${book.stage.toLowerCase()}`;
        const start=button('Lees het verhaal ›',()=>openPage(0));start.className='fluency-next';
        host.append(label,art,title,level,start);return;
      }
    if(!book.startPractice&&!book.practiceParent)return;
      if(book.startPractice){
        document.querySelector('.mini-book').classList.add('start-route-simple','start-picture-menu');host.replaceChildren();
        const title=document.createElement('h1');title.textContent=book.stage;host.append(title);
        const menu=document.createElement('nav');menu.className='start-picture-choices';menu.dataset.count=String(book.startPractice.length+1);menu.setAttribute('aria-label','Kies een oefening');
        const tile=(icon,label,name,action)=>{const b=button('',action);b.setAttribute('aria-label',name);b.innerHTML=`<svg aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</svg><span>${label}</span>`;menu.append(b)};
        tile('read','Lees','Open het leesboekje',()=>openPage(0));
        book.startPractice.forEach(b=>{const p=window.ZISA_FLUENCY_BOOKS[b.id][0];const [icon,label]=p.startPractice==='rows'?['rows','Rijtjes']:p.startPractice==='swap'?['swap','Wissel']:p.startPractice==='dice'?['dice','Dobbel en lees']:p.memoryPairs?['memory','Memory']:p.miniStory?['read','Verhaal']:p.sentenceMatch?['choose','Verbind']:['look','Kies'];tile(icon,label,b.title,()=>open(b))});
        host.append(menu);return;
      }
      const opening=window.ZISA_FLUENCY_BOOKS[book.id]?.[0];
      if(book.practiceParent&&!opening?.miniStory){
        document.querySelector('.mini-book').classList.add('start-route-simple','start-child-cover');
        host.replaceChildren();
        const title=document.createElement('h1');title.textContent=book.title;
        let pictureGuide;
        if(opening.memoryPairs){
          pictureGuide=document.createElement('div');pictureGuide.className='memory-cover-pair';
          const word=document.createElement('span');word.textContent=opening.memoryPairs[0].word;
          const image=document.createElement('img');image.src=leesMedia(opening.memoryPairs[0].src);image.alt='';
          pictureGuide.append(word,image);
        }else{pictureGuide=guide(opening);pictureGuide.querySelectorAll('h3,strong,.start-guide-example,.start-guide-number').forEach(el=>el.remove())}
        const play=button('▶',()=>{openPage(0);const instruction=opening.sentenceMatch?'Lees een zin. Tik op de zin en op de prent die erbij hoort.':opening.sentenceChoice?'Kijk naar de prent. Lees de zinnen. Tik op de zin die klopt.':opening.memoryPairs?'Tik op twee kaartjes. Zoek het woord en de prent die bij elkaar horen.':opening.startPractice==='dice'?'Tik op de dobbelsteen. Lees het rijtje. Tik dan op het vinkje.':opening.startPractice==='swap'?'Lees het woord. Tik dan op de pijl.':'Lees het rijtje. Tik dan op het vinkje.';speak(instruction)});play.className='start-big-play';play.setAttribute('aria-label','Start de oefening');
        const back=button('‹',()=>open(window.ZISA_BOOKS.find(b=>b.id===book.practiceParent)));back.className='start-small-back';back.setAttribute('aria-label',`Terug naar ${book.stage}`);
        host.append(title,pictureGuide,play,back);return;
      }
    document.querySelector('.mini-book').classList.add('start-route-simple','start-picture-menu');host.replaceChildren();
    const title=document.createElement('h1');title.textContent='Verhaaltjes';host.append(title);
    const choices=document.createElement('nav');choices.className='start-picture-choices';
    window.ZISA_FLUENCY_BOOKS[book.id].forEach(p=>{const story=p.miniStory;if(!story)return;const b=button('',()=>open({...window.ZISA_BOOKS.find(b=>b.id===`start-verhaal-${book.method}-${story.id}`),practiceParent:book.practiceParent}));const img=document.createElement('img');img.src=leesMedia(story.src);img.alt='';const label=document.createElement('span');label.textContent=story.title;b.append(img,label);choices.append(b)});host.append(choices);

  };
  window.renderStartPractice=(page,activity,done)=>{
    const kind=page.startPractice;
    if(!kind)return false;
    document.querySelector('.mini-book').classList.add('start-practice-book');
    const feedback=document.querySelector('#fluencyFeedback');
    document.querySelector('.mini-left').replaceChildren(guide(page));
    const mobileGuide=guide(page);mobileGuide.classList.add('start-guide-mobile');activity.append(mobileGuide);
    document.querySelectorAll('.start-visual-guide h3,.start-visual-guide strong,.start-guide-example').forEach(el=>el.remove());
    document.querySelector('.fluency-question')?.classList.add('start-instruction-hidden');
    if(kind==='rows'){
      document.querySelector('.mini-book').classList.add('start-rows-book');
      document.querySelector('.mini-right>h2').textContent='Woordrijtjes';
    }
    let finished=false;
    const complete=()=>{if(finished)return;finished=true;feedback.textContent='✓ Klaar!';done()};
    if(kind==='swap'){
      document.querySelector('.mini-book').classList.add('start-route-simple','start-swap-book');mobileGuide.remove();
      document.querySelector('.mini-right>h2').textContent='Lees';document.querySelector('.fluency-question-row').hidden=true;
      let index=0;
      const progress=document.createElement('p');progress.className='start-practice-progress';
      const word=document.createElement('div');word.className='start-swap-word';word.setAttribute('aria-live','polite');
      const history=document.createElement('p');history.className='start-swap-history';
      const help=button('🔊',()=>speak('Lees het woord hardop. Tik daarna op de pijl. Lees het nieuwe woord. De gele letter is veranderd.'));help.className='swap-help';help.setAttribute('aria-label','Luister naar de uitleg');
      const next=button('➜',()=>{if(index===page.chain.length-1){next.disabled=true;complete();return}index++;draw()});next.className='swap-next';
      const draw=()=>{
        progress.textContent=`${index+1} / ${page.chain.length}`;
        word.replaceChildren();
        const before=index?window.ZISA_START_PRACTICE.split(page.chain[index-1]):[];
        window.ZISA_START_PRACTICE.split(page.chain[index]).forEach((part,i)=>{const span=document.createElement('span');span.textContent=part;if(index&&part!==before[i])span.className='changed';word.append(span)});
        history.textContent=index?`${page.chain[index-1]} →`:'';
        next.textContent=index===page.chain.length-1?'✓':'➜';next.setAttribute('aria-label',index===page.chain.length-1?'Klaar':'Volgend woord');
      };
      activity.append(help,progress,word,next);draw();return true;
    }
    const completed=new Set();let active=-1;
    const progress=document.createElement('p');progress.className='start-practice-progress';progress.setAttribute('aria-live','polite');progress.textContent='0 / 6';
    const grid=document.createElement('div');grid.className='start-word-rows';
    const checks=[];const rowElements=[];
    const markers=document.createElement('div');markers.className='start-row-markers';markers.setAttribute('aria-label','Zes leesrijtjes');
    const showRow=index=>{rowElements.forEach((row,i)=>row.hidden=i!==index);[...markers.children].forEach((m,i)=>{m.classList.toggle('done',completed.has(i));m.classList.toggle('current',i===index);m.textContent=completed.has(i)?'✓':String(i+1)})};
    let roll;
    if(kind==='dice'){
      document.querySelector('.mini-book').classList.add('start-route-simple','start-dice-book');
      mobileGuide.remove();
      document.querySelector('.fluency-question-row').hidden=true;
      const faces=[[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
      const dice=document.createElement('span');dice.className='rolling-die';dice.setAttribute('aria-hidden','true');
      const face=value=>{dice.replaceChildren();for(let n=0;n<9;n++){const dot=document.createElement('i');dot.className=faces[value].includes(n)?'pip':'empty';dice.append(dot)}};face(0);
      const caption=document.createElement('span');caption.className='dice-caption';caption.textContent='Dobbel';
      roll=button('',()=>{
        if(roll.disabled)return;
        roll.disabled=true;caption.textContent='…';feedback.textContent='';
        // Trek uit de nog niet gelezen rijtjes: nooit een doodlopend vol bord.
        const available=page.rows.map((_,i)=>i).filter(i=>!completed.has(i));
        const chosen=available[Math.floor(Math.random()*available.length)];
        const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
        dice.classList.add('rolling');let ticks=0;
        const timer=setInterval(()=>{
          if(!dice.isConnected){clearInterval(timer);return}
          ticks++;if(!reduced)face(Math.floor(Math.random()*6));
          if(ticks<9)return;
          clearInterval(timer);dice.classList.remove('rolling');active=chosen;face(active);showRow(active);
          roll.setAttribute('aria-label',`Je gooide ${active+1}`);caption.textContent=String(active+1);
          rowElements.forEach((row,i)=>row.classList.toggle('active',i===active));
          checks.forEach((b,i)=>b.disabled=i!==active);feedback.textContent='Lees het rijtje.';
        },100);
      });
      roll.className='dice-roll-button';roll.setAttribute('aria-label','Dobbel');roll.append(dice,caption);activity.append(roll);
      roll.resetLabel=()=>{caption.textContent='Dobbel';roll.setAttribute('aria-label','Dobbel')};
    }
    page.rows.forEach((words,i)=>{
      const row=document.createElement('div');row.className='start-word-row';
      const marker=document.createElement('span');marker.textContent=String(i+1);markers.append(marker);
      const list=document.createElement('div');list.className='start-row-words';words.forEach(w=>{const span=document.createElement('span');span.textContent=w;list.append(span)});row.append(list);
      const check=button(kind==='dice'?'Gelezen ✓':'✓',()=>{
        if(completed.has(i)||(kind==='dice'&&active!==i))return;
        completed.add(i);check.disabled=true;check.setAttribute('aria-label',`Rijtje ${i+1} is gelezen`);row.classList.add('read');row.classList.remove('active');
        progress.textContent=`${completed.size} / 6`;
        if(roll){active=-1;roll.disabled=completed.size===6;roll.resetLabel();if(completed.size===6)roll.hidden=true}
        showRow(completed.size===6?i:kind==='dice'?-1:page.rows.findIndex((_,n)=>!completed.has(n)));
        if(completed.size===6)complete();else feedback.textContent=kind==='dice'?'Gooi nog eens.':'Lees verder.';
      });
      check.setAttribute('aria-label',`Rijtje ${i+1} gelezen`);check.disabled=kind==='dice';checks.push(check);row.append(check);rowElements.push(row);grid.append(row);
    });
    activity.append(progress,markers,grid);showRow(kind==='dice'?-1:0);return true;
  };
})();
