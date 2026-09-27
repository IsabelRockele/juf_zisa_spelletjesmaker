(() => {
  'use strict';
  const D=window.SpellingData, E=window.SpellingEngine;
  const app=document.querySelector('#app'), dialog=document.querySelector('#help-dialog');
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=s=>app.querySelector(s);
  let settings={mode:'detective',count:10,categories:['kort']};
  try {const old=JSON.parse(localStorage.getItem('zisa-spelling-settings-v1'));if(old&&['detective','workshop'].includes(old.mode)&&[5,10,15,20].includes(old.count)){const ids=old.categories.filter(id=>D.categories.some(c=>c.id===id));settings={...old,count:Math.max(10,old.count),categories:ids.length?ids:['kort']};}}catch{}
  let recentWords=[];
  try{const saved=JSON.parse(localStorage.getItem('zisa-recent-words-v1'));if(Array.isArray(saved))recentWords=saved.filter(w=>typeof w==='string').slice(-1200);}catch{}
  function rememberWords(words){for(const w of words){const key=E.normalize(w);recentWords=recentWords.filter(v=>v!==key);recentWords.push(key);}recentWords=recentWords.slice(-1200);try{localStorage.setItem('zisa-recent-words-v1',JSON.stringify(recentWords));}catch{}}
  const requestedMode=new URLSearchParams(location.search).get('spel');
  if(['detective','workshop'].includes(requestedMode))settings.mode=requestedMode;
  let queue=[], index=0, item, exercise, attempts=0, assisted=false, stage='setup', input='', slots=[], selected=null, feedback='', feedbackType='', seen=new Set();
  let drag=null, suppressClick=0, lastFocus=null;
  let heard=false,repairCells=null,fixedCells=[],editAt=null,advanceTimer=null,adventure=null;
  const speaker=()=>'<img class="speaker-png" src="assets/luidspreker.png" width="36" height="36" alt="">';
  const clearAdvance=()=>{clearTimeout(advanceTimer);advanceTimer=null;};
  function autoAdvance(){clearAdvance();advanceTimer=setTimeout(()=>{if(stage==='correct'&&!dialog.open&&!document.hidden)next();},1150);}
  function save(){try{localStorage.setItem('zisa-spelling-settings-v1',JSON.stringify(settings));}catch{}}
  function announce(text){document.querySelector('#announcer').textContent=text;}
  function cancelSpeech(){if('speechSynthesis'in window)speechSynthesis.cancel();}
  function speak(text,onEnd){
    if(!('speechSynthesis'in window)){announce('Deze browser kan niet voorlezen. Probeer Safari, Chrome of Edge met geluid.');return;}
    cancelSpeech();const utterance=new SpeechSynthesisUtterance(text),voices=speechSynthesis.getVoices();
    utterance.voice=voices.find(v=>v.lang.toLowerCase()==='nl-be')||voices.find(v=>v.lang.toLowerCase().startsWith('nl'))||null;
    utterance.lang=utterance.voice?.lang||'nl-BE';utterance.rate=.78;
    utterance.onend=()=>{document.querySelector('.is-speaking')?.classList.remove('is-speaking');onEnd?.();};
    utterance.onerror=event=>{if(!['canceled','interrupted'].includes(event.error)){announce('Het voorlezen lukte niet. Controleer het geluid en probeer opnieuw.');const status=$('#audio-status');if(status)status.textContent='Geen geluid? Controleer het volume en tik opnieuw op Luister.';}};
    speechSynthesis.speak(utterance);
  }
  function openDialog(title,body,buttons){
    lastFocus=document.activeElement;
    document.querySelector('#dialog-content').innerHTML=`<h2 id="dialog-title">${escape(title)}</h2>${body}<div class="actions">${buttons.map((b,i)=>`<button class="${i===buttons.length-1?'primary':''}" data-dialog="${i}">${escape(b.label)}</button>`).join('')}</div>`;
    [...dialog.querySelectorAll('[data-dialog]')].forEach((button,i)=>button.onclick=()=>{dialog.close();buttons[i].action?.();});dialog.showModal();
  }
  dialog.addEventListener('close',()=>lastFocus?.isConnected&&lastFocus.focus());
  let setupStep=requestedMode?2:1, categoryPage=0;
  const buddy=()=>'<img class="buddy-img" src="assets/'+(settings.mode==='detective'?'zisa-detective':'zisa-werkplaats')+'.png" alt="Zisa helpt je">';
  function view(name){document.body.dataset.view=name;document.body.dataset.mode=settings.mode;window.scrollTo(0,0);}
  function setup(){
    stage='setup';clearAdvance();cancelSpeech();adventure?.destroy();adventure=null;view('setup');
    const groups=[...new Set(D.categories.map(c=>c.group))];
    const group=groups[categoryPage],n=settings.categories.length;
    const labels=['Kies je avontuur','Wat wil je oefenen?','Klaar voor vertrek?'];
    let content='';
    if(setupStep===1)content='<div class="adventure-choices">'+[['detective','zisa-detective','Spellingdetective','Luister, schrijf en vind Pip.'],['workshop','zisa-werkplaats','De Woordenwerkplaats','Verdien onderdelen en bouw jouw raceauto.']].map(([id,img,title,desc])=>'<button class="adventure-card" data-mode="'+id+'" aria-pressed="'+(settings.mode===id)+'"><img src="assets/'+img+'.png" alt=""><strong>'+title+'</strong><span>'+desc+'</span></button>').join('')+'</div>';
    if(setupStep===2)content='<div class="category-picker"><nav class="category-tabs" aria-label="Woordgroepen">'+groups.map((g,i)=>'<button data-group="'+i+'" aria-pressed="'+(i===categoryPage)+'">'+escape(g)+'<small>'+D.categories.filter(c=>c.group===g&&settings.categories.includes(c.id)).length+' gekozen</small></button>').join('')+'</nav><section class="category-details"><h2>'+escape(group)+'</h2><p>Tik op wat je wilt oefenen. Een mix mag ook!</p><div class="category-options">'+D.categories.filter(c=>c.group===group).map(c=>'<label class="chip"><input type="checkbox" value="'+c.id+'" '+(settings.categories.includes(c.id)?'checked':'')+'><span>'+escape(c.label)+'</span></label>').join('')+'</div><p class="category-total" aria-live="polite">'+n+' '+(n===1?'categorie':'categorieën')+' gekozen</p><button class="quiet" id="clear-categories">Alles uitvinken</button></section></div>';
    if(setupStep===3)content='<div class="departure"><div class="departure-buddy">'+buddy()+'</div><section><h2>Hoeveel opdrachten?</h2><div class="count-choices">'+[10,15,20].map(count=>'<button data-count="'+count+'" aria-pressed="'+(count===settings.count)+'"><strong>'+count+'</strong><small>opdrachten</small></button>').join('')+'</div><p id="selection-info" aria-live="polite"></p><button id="test-sound">Test het geluid</button><p class="note" id="sound-info">Zet je geluid aan. Je krijgt hulp als het moeilijk is.</p></section></div>';
    app.innerHTML='<section class="setup-shell"><header class="wizard-heading"><div><p class="eyebrow">Spellingeiland · stap '+setupStep+' van 3</p><h1>'+labels[setupStep-1]+'</h1></div><span class="step-count">'+setupStep+' / 3</span></header><div class="wizard-content">'+content+'</div><nav class="wizard-bottom"><button id="setup-back">'+(setupStep===1?'Naar het eiland':'Terug')+'</button><span>'+(setupStep===2?n+' gekozen':'Op jouw tempo')+'</span><button class="primary" id="'+(setupStep===3?'start':'setup-next')+'">'+(setupStep===3?'Spelen!':'Verder')+' →</button></nav></section>';
    app.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{settings.mode=button.dataset.mode;save();setup();});
    app.querySelectorAll('[data-group]').forEach(button=>button.onclick=()=>{categoryPage=Number(button.dataset.group);setup();});
    app.querySelectorAll('.chip input').forEach(box=>box.onchange=()=>{settings.categories=settings.categories.filter(id=>id!==box.value);if(box.checked)settings.categories.push(box.value);save();setup();});
    app.querySelectorAll('[data-count]').forEach(button=>button.onclick=()=>{settings.count=Number(button.dataset.count);save();setup();});
    $('#setup-back').onclick=()=>{if(setupStep>1){setupStep--;setup();}else location.href='../eilanden-leerjaar2.html#spelling';};
    $('#setup-next')?.addEventListener('click',()=>{setupStep++;setup();});
    if(setupStep===2)$('#setup-next').disabled=!n;
    $('#clear-categories')?.addEventListener('click',()=>{settings.categories=[];save();setup();});
    $('#test-sound')?.addEventListener('click',()=>speak('Welkom op Spellingeiland. Kun je mij goed horen?'));
    $('#start')?.addEventListener('click',start);
    if(setupStep===3)selectionInfo();
  }
  function selectionInfo(){
    const n=settings.categories.length,valid=n>0&&n<=settings.count;
    $('#selection-info').textContent=!n?'Kies eerst een categorie.':n>settings.count?'Je koos '+n+' categorieën. Kies meer opdrachten of minder categorieën.':n+' '+(n===1?'categorie':'categorieën')+' · '+settings.count+' opdrachten';
    $('#selection-info').className=valid?'':'error';$('#start').disabled=!valid||!('speechSynthesis'in window);
    if(!('speechSynthesis'in window))$('#sound-info').textContent='Open het spel in een browser met voorleesstem, zoals Safari.';
  }
  function start(){
    save();queue=E.makeQueue(D.categories.filter(c=>settings.categories.includes(c.id)),settings.count,Math.random,recentWords);index=0;seen=new Set();
    adventure?.destroy();adventure=null;
    openDialog(settings.mode==='detective'?'Vind Pip op het eiland!':'Bouw jouw raceauto!',`<div class="tutorial-demo">${buddy()}</div><p>${settings.mode==='detective'?'Loop en spring met Zisa naar Pip. Maak bruggen en open poorten met woorden.':'Kies eerst je raceauto, monstertruck of strandbuggy. Na elk woord verdien je een onderdeel. Halverwege kies je de kleur. Na het laatste woord is je auto compleet.'}</p><p>${settings.mode==='detective'?'Zoek de sporen. Houd de pijl vast en tik op Spring.':'Ook na verbeteren met hulp krijg je jouw onderdeel. Aan het einde stuur je zelf in de race tegen Pip en Robbie.'}</p>`,[{label:'Op avontuur!',action:()=>{
      adventure=new (settings.mode==='workshop'?SpellingWorkshop:SpellingAdventure)({mode:settings.mode,count:queue.length,onChallenge:loadTask,onFinish:finish,onStop:stop});
      stage='explore';view('world');speak(settings.mode==='detective'?'Zoek de sporen van Pip. Houd de pijl vast en tik op Spring.':'Welkom in de werkplaats. Laten we een echte wagen maken.');
    }}]);
  }

  function loadTask(){
    clearAdvance();heard=false;repairCells=null;fixedCells=[];editAt=null;
    item=queue[index];exercise=item.retrySpec||E.makeExercise(item,settings.mode,index,D.pairs.filter(p=>p.words.every(w=>!queue.some((q,i)=>i!==index&&E.normalize(q.word.word)===E.normalize(w))&&!queue.slice(0,index).some(q=>q.usedWords?.includes(w)))),Math.random,recentWords);item.usedWords=exercise.type==='sentences'?exercise.pair.words:[item.word.word];rememberWords(item.usedWords);attempts=0;assisted=false;input='';slots=Array(exercise.type==='sentences'?2:exercise.tokens?.length||0).fill(null);selected=null;feedback='';feedbackType='';stage='question';renderTask();
    const kind=exercise.type==='gap'?'gap':exercise.type==='choice'&&item.cat.transform==='article'?'article':exercise.type;
    if(!seen.has(kind)){seen.add(kind);announce(taskInstructions());}
  }
  function tutorial(kind){
    const tutorials={
      type:['Luister en schrijf','Luister → typ → klaar','Tik op de knipperende luidspreker. Typ het woord en tik op Klaar. Een letter veranderen? Tik op die letter en kies een nieuwe. Met Wis letter haal je een letter weg.'],
      gap:['Vul het stukje aan','g … t → ei / ij','Kijk naar de prent en luister naar het woord. Tik op het ontbrekende stukje. Tik daarna op Klaar.'],
      choice:['Kies de juiste schrijfwijze','Kijk → kies → controleer','Bekijk de prent en luister. Welk woord is goed geschreven? Kies het woord en tik op Klaar.'],
      shuffle:['Bouw het woord','s · i · v → v i s','Sleep de letters naar de vakjes. Je kunt ook op de letters tikken: ze komen dan vanzelf in het volgende vakje. Tik op een gevulde plek om die letter terug te leggen.'],
      sentences:['Geef elk woord een plek','man ↔ maan','Lees of beluister de twee zinnen. Sleep elk woord naar de passende zin. Of tik eerst op een woord en daarna op een leeg vak. Deze twee zinnen tellen samen als één opdracht.'],
      article:['Kies de of het','de kat · het huis','Lees het woord of luister. Kies het lidwoord dat erbij hoort en tik op Klaar. Onthoud het lidwoord samen met het woord.']
    };
    const [title,demo,text]=tutorials[kind];openDialog(title,`<div class="tutorial-demo">${escape(demo)}</div><p>${text}</p>`,[{label:'Ik snap het!',action:()=>{}}]);
  }
  function heading(){
    if(exercise.repeatSentence)return 'Schrijf de twee woorden';
    if(item.cat.transform==='small')return 'Maak het verkleinwoord';
    if(item.cat.transform==='plural')return 'Maak het meervoud';
    if(item.cat.transform==='article')return 'Hoort er de of het bij?';
    return {type:'Luister en schrijf',gap:'Welk stukje ontbreekt?',choice:'Welk woord is goed geschreven?',shuffle:'Bouw het woord',sentences:'Welk woord past in de zin?'}[exercise.type];
  }
  function spokenPrompt(){
    if(exercise.repeatSentence)return `Schrijf achter elkaar: ${exercise.answer.split(' ').join(', en ')}.`;
    if(exercise.type==='sentences')return exercise.pair.sentences.map(s=>s.replace('…','...')).join(' ');
    const w=item.word;
    if(item.cat.transform==='small')return `Het woord is ${w.word}. Maak het verkleinwoord van ${w.word}.`;
    if(item.cat.transform==='plural')return `Eén ${w.word}. Schrijf het meervoud van ${w.word}.`;
    if(item.cat.transform==='article')return `Welk lidwoord hoort bij ${w.word}? De, of het?`;
    return `${w.word}. ${w.sentence||''} Schrijf ${w.word}.`;
  }
  function taskInstructions(){
    if(exercise.repeatSentence)return 'Schrijf de twee woorden na elkaar, met een spatie ertussen.';
    if(exercise.type==='sentences')return 'Sleep elk woord naar een zin. Of tik op een woord en dan op het vak.';
    if(exercise.type==='shuffle')return 'Sleep de letters op hun plek of tik ze in de juiste volgorde aan.';
    if(exercise.type==='type')return repairCells?'Vul de oranje vakjes aan.':!heard?'Tik op de luidspreker.':item.repeat?'Dit woord ken je al. Typ het nog eens.':'Typ het woord. Tik dan op Klaar.';
    return 'Kijk, luister en kies. Tik daarna op Klaar.';
  }
  function keyboard(){return `<div class="keyboard" aria-label="AZERTY-lettertoetsenbord">${['azertyuiop','qsdfghjklm','wxcvbn'].map(row=>`<div class="key-row">${[...row].map(l=>`<button data-key="${l}" aria-label="Letter ${l}">${l}</button>`).join('')}${row==='wxcvbn'?'<button class="wide-key" data-key="back" aria-label="Wis de gekozen of laatste letter">⌫ Wis letter</button>':''}</div>`).join('')}<div class="key-row"><button class="wide-key" data-key="space">spatie</button><button class="wide-key" data-key="clear">Begin opnieuw</button></div></div>`;}
  function answerMarkup(){
    const letters=repairCells||[...input];
    return `<div id="answer" class="answer-editor ${repairCells?'repairing':''}" role="group" tabindex="0" aria-label="Jouw woord. Tik op een letter om ze te veranderen.">${letters.map((letter,i)=>`<button class="answer-letter ${letter?'filled':'missing'} ${repairCells&&fixedCells[i]&&fixedCells[i]===letter?'confirmed':''} ${editAt===i?'editing':''}" data-edit="${i}" aria-label="Letter ${i+1}: ${escape(letter||'leeg')}">${escape(letter===' '?'·':letter)||'?'}</button>`).join('')}${!repairCells?`<button class="answer-letter append-letter ${editAt===null?'editing':''}" data-edit="end" aria-label="Typ de volgende letter">${letters.length?'':'…'}</button>`:''}</div>`;
  }
  function wireEditor(){app.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>{if(stage!=='question')return;editAt=button.dataset.edit==='end'?null:Number(button.dataset.edit);refreshEditor();});}
  function refreshEditor(){const box=$('#answer');if(!box)return;box.outerHTML=answerMarkup();wireEditor();}
  function renderTask(){
    view('play');document.body.dataset.exercise=stage==='model'?'model':exercise.type;document.body.classList.toggle('answer-success',stage==='correct');
    const c=item.cat,w=item.word,isSentence=exercise.type==='sentences';
    const showPicture=settings.mode==='workshop'&&!isSentence&&!exercise.repeatSentence&&w.image;
    const modelAnswer=isSentence?exercise.pair.words.join(' · '):exercise.type==='gap'?w.word:exercise.answer;
    app.innerHTML=`<div class="session-header"><h1>${adventure?.gates[index]?.title||'Spellingavontuur'}</h1><button class="quiet" id="stop">Stoppen</button></div><div class="game-layout"><section class="task-card" aria-label="Spellingopdracht"><div class="task-meta"><span class="tag">${escape(c.label)}</span><span>Opdracht ${index+1} van ${queue.length}</span></div><progress value="${index}" max="${queue.length}" aria-label="Voortgang"></progress><h2 class="task-title">${heading()}</h2><p class="task-instruction">${taskInstructions()}</p>
      <div class="prompt-row">${showPicture?`<img class="word-picture" src="${escape(w.image)}" alt="Prent bij de opdracht">`:''}<button class="sound ${!heard&&stage==='question'?'listen-needed':''}" id="listen">${speaker()}<span>${isSentence?'Luister naar de zinnen':'Luister'}</span></button></div><p class="note" id="audio-status" role="status"></p>
      ${c.transform?`<p class="base-word">${escape(w.word)} ${c.transform==='article'?'':'→ …'}</p>`:''}
      <div id="response-area">${stage==='model'?`<div class="model-coach"><div class="model-zisa">${buddy()}</div><div><p>Zisa doet het even voor.</p><div class="example-answer">${escape(modelAnswer)}</div><p>Kijk goed. Straks mag jij!</p></div></div>`:exercise.type==='type'?`${answerMarkup()}${keyboard()}`:isSentence?`${exercise.pair.sentences.map((s,i)=>{const [a,b]=s.split('…');return `<div class="sentence-row"><span>${escape(a)}</span><button class="slot ${slots[i]!==null?'filled':''}" data-slot="${i}" aria-label="Woord bij zin ${i+1}">${slots[i]!==null?escape(exercise.tokens[slots[i]]):'…'}</button><span>${escape(b)}</span></div>`;}).join('')}<div class="tiles">${tokenButtons()}</div>`:exercise.type==='shuffle'?`<div class="slots">${slots.map((token,i)=>`<button class="slot ${token!==null?'filled':attempts?'needs-fill':''}" data-slot="${i}" aria-label="Letterplek ${i+1}${token!==null?', '+escape(exercise.tokens[token]):', leeg'}">${token!==null?escape(exercise.tokens[token]):''}</button>`).join('')}</div><div class="tiles">${tokenButtons()}</div><button class="quiet" id="reset-tiles">Leg de letters terug</button>`:`${exercise.blank?`<div class="blank-word">${escape(exercise.blank)}</div>`:''}<div class="choice-row">${exercise.options.map(option=>`<button data-choice="${escape(option)}" class="${input===option?'selected':''}" aria-pressed="${input===option}">${escape(option)}</button>`).join('')}</div>`}</div>
      <div id="feedback" class="feedback ${feedbackType}" role="status">${escape(feedback)}</div><div class="actions">${stage==='model'?'<button class="primary" id="retry">Nu jij! →</button>':stage==='correct'?'<div class="success-message">'+'Gelukt! Kijk wat er gebeurt…'+'</div>':'<button class="primary" id="check">Klaar! ✓</button>'}</div><div class="mini-help"><button class="quiet" id="help">Help mij</button></div></section></div>`;
    wireEditor();
    $('#stop').onclick=stop;$('#listen').onclick=()=>{heard=true;$('#listen').classList.remove('listen-needed');$('#listen').classList.add('is-speaking');const instructions=$('.task-instruction');if(instructions)instructions.textContent=taskInstructions();speak(stage==='model'?modelAnswer:spokenPrompt());};
    $('#help').onclick=()=>tutorial(exercise.type==='choice'&&c.transform==='article'?'article':exercise.type);
    $('#check')?.addEventListener('click',check);$('#retry')?.addEventListener('click',retry);
    app.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>typeKey(b.dataset.key));
    app.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(stage!=='question')return;input=b.dataset.choice;renderTask();});
    app.querySelectorAll('[data-token]').forEach(b=>b.onclick=()=>{if(Date.now()<suppressClick||stage!=='question')return;const token=Number(b.dataset.token);if(exercise.type==='shuffle')placeToken(token,slots.indexOf(null));else{selected=selected===token?null:token;renderTask();}});
    app.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{if(Date.now()<suppressClick||stage!=='question')return;const slot=Number(b.dataset.slot);if(selected!==null){placeToken(selected,slot);}else{slots[slot]=null;renderTask();}});
    $('#reset-tiles')?.addEventListener('click',()=>{slots.fill(null);selected=null;renderTask();});
    if(stage==='correct'){app.querySelectorAll('#response-area button,#listen,#help').forEach(b=>b.disabled=true);celebrateWord();}
    if(stage==='model')$('#retry').focus();
  }
  function tokenButtons(){return exercise.tokens.map((token,i)=>`<button class="tile ${exercise.type==='sentences'?'word-tile':''} ${selected===i?'selected':''}" data-token="${i}" ${slots.includes(i)?'disabled':''} aria-label="${exercise.type==='sentences'?'Woord':'Letter'} ${escape(token)}">${escape(token)}</button>`).join('');}
  function placeToken(token,slot){if(stage!=='question'||slot<0||slots.includes(token))return;slots[slot]=token;selected=null;renderTask();}
  function typeKey(key){
    if(stage!=='question'||exercise.type!=='type')return;
    if(key==='clear'){input='';repairCells=null;fixedCells=[];editAt=null;feedback='Typ het woord opnieuw.';$('#feedback').textContent=feedback;}
    else if(repairCells){
      if(editAt===null||editAt>=repairCells.length)editAt=repairCells.indexOf('');
      if(editAt<0)editAt=repairCells.length-1;
      if(key==='back'){repairCells[editAt]='';}
      else{repairCells[editAt]=key==='space'?' ':key;const nextEmpty=repairCells.findIndex((c,i)=>i>editAt&&!c);editAt=nextEmpty>=0?nextEmpty:repairCells.indexOf('');if(editAt<0)editAt=null;}
      input=repairCells.join('');
    }else if(key==='back'){const pos=editAt===null?input.length-1:editAt;input=input.slice(0,Math.max(0,pos))+input.slice(pos+1);editAt=null;}
    else if(input.length<Math.max(12,exercise.answer.length+3)){const letter=key==='space'?' ':key;if(editAt!==null){input=input.slice(0,editAt)+letter+input.slice(editAt+1);editAt=null;}else input+=letter;}
    refreshEditor();
  }
  function celebrateWord(){
    const card=$('.task-card');card.insertAdjacentHTML('beforeend',`<div class="word-sparkles" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--i:${i};--h:${35+i*23}"></i>`).join('')}</div>`);
  }

  function check(){
    if(stage!=='question')return;
    const answer=exercise.type==='sentences'?slots.map(t=>t===null?'':exercise.tokens[t]).join('|'):exercise.type==='shuffle'?slots.map(t=>t===null?'':exercise.tokens[t]).join(''):input;
    if(!answer.trim()||(exercise.tokens&&slots.some(t=>t===null))||repairCells?.some(c=>!c)){feedback='Vul eerst alle vakjes in.';feedbackType='help';renderTask();return;}
    if(E.normalize(answer)===E.normalize(exercise.answer)){
      stage='correct';const whole=exercise.type==='gap'?item.word.word:exercise.type==='sentences'?exercise.pair.words.join(' en '):item.cat.transform==='article'?`${item.word.article} ${item.word.word}`:exercise.answer;
      feedback=`${assisted?'Goed geoefend!':'Goed zo!'} ${whole}.`;feedbackType='good';renderTask();speak(whole);autoAdvance();return;
    }
    attempts++;assisted=true;
    if(attempts===1){
      if(exercise.type==='sentences'){slots.fill(null);feedback='Bijna! Geef elk woord een andere plek.';}
      else if(exercise.type==='type'){repairCells=E.repairLetters(answer,exercise.answer);fixedCells=repairCells?[...repairCells]:[];input=repairCells?repairCells.join(''):'';editAt=repairCells?repairCells.indexOf(''):null;feedback=repairCells?'Bijna! Vul de oranje vakjes aan.':'Bijna! Typ het woord nog eens.';}
      else if(exercise.type==='shuffle'){slots=slots.map((t,i)=>t!==null&&exercise.tokens[t]===exercise.answer[i]?t:null);feedback='Bijna! De juiste letters blijven staan. Vul de lege vakjes.';}
      else{input='';feedback='Bijna! Kies nog eens.';}
      feedbackType='help';renderTask();speak(feedback+' '+(exercise.type==='sentences'?'Lees elke zin helemaal.':E.hint(item.cat,item.word)));
    }else{stage='model';feedback='Kijk goed naar het woord. Tik dan op Nu jij!';feedbackType='help';renderTask();speak('Zisa helpt je. '+(exercise.type==='sentences'?exercise.pair.words.join(' en '):exercise.type==='gap'?item.word.word:exercise.answer)+'. Kijk goed. Tik dan op Nu jij.');}
  }
  function retry(){
    const wasSentence=exercise.type==='sentences';
    exercise={type:'type',answer:wasSentence?exercise.pair.words.join(' '):exercise.type==='gap'?item.word.word:exercise.answer,repeatSentence:wasSentence||exercise.repeatSentence};
    stage='question';attempts=0;input='';slots=[];selected=null;repairCells=null;editAt=null;heard=false;feedback='Nu mag jij! Luister en typ het woord.';feedbackType='help';renderTask();
  }
  function next(){
    if(stage!=='correct')return;clearAdvance();cancelSpeech();document.body.classList.remove('answer-success');
    if(assisted&&settings.mode!=='workshop'){const retryItem=exercise.type==='sentences'||exercise.repeatSentence?{...item,retrySpec:{type:'type',answer:exercise.type==='sentences'?exercise.pair.words.join(' '):exercise.answer,repeatSentence:true}}:item;E.scheduleRepeat(queue,index,retryItem);}
    index++;stage='explore';view('world');adventure.solve(exercise.type==='gap'?item.word.word:exercise.answer.replaceAll('|',' '));
  }
  function finish(){
    stage='finished';view('celebration');cancelSpeech();const cats=D.categories.filter(c=>settings.categories.includes(c.id)).map(c=>c.label);
    app.innerHTML=`<section class="celebration"><div class="celebration-buddy">${buddy()}</div><p class="eyebrow">Missie volbracht</p><h1>${settings.mode==='detective'?'Hoera, Pip gevonden!':'Jullie wonderwagen rijdt!'}</h1><p>${settings.mode==='detective'?`Je hebt Pip gevonden en veilig thuisgebracht. Dank je wel, detective!`:'Jullie wonderwagen rijdt! Bedankt voor je hulp!'}<br>${settings.mode==='detective'?'Je volgde '+queue.length+' sporen van Pip.':'Je oefende '+queue.length+' woorden, bouwde jouw raceauto en reed de eilandrace.'}</p><p class="note">Je hebt geoefend met ${cats.length} ${cats.length===1?'categorie':'categorieën'}.</p><div class="actions"><button class="primary" id="again">Nog een avontuur</button><button id="choose">Andere keuzes</button></div><p><a href="../eilanden-leerjaar2.html">Terug naar de eilanden</a></p></section>`;
    $('#again').onclick=start;$('#choose').onclick=setup;speak(settings.mode==='detective'?'Hoera, Pip gevonden! Goed geoefend.':'Hoera, jullie wonderwagen rijdt! Goed geoefend.');
  }
  function stop(){clearAdvance();openDialog('Even stoppen?', '<p>Je keuzes blijven bewaard.</p>',[{label:'Verder spelen',action:()=>{if(stage==='correct')autoAdvance();}},{label:'Naar de keuzes',action:setup}]);}
  document.addEventListener('keydown',event=>{
    if(dialog.open||stage!=='question'||exercise?.type!=='type'||event.ctrlKey||event.metaKey||event.altKey)return;
    if(/^[a-z]$/i.test(event.key)){event.preventDefault();typeKey(event.key.toLowerCase());}
    else if(event.key==='Backspace'){event.preventDefault();typeKey('back');}
    else if(event.key===' '&&!document.activeElement?.matches('button')){event.preventDefault();typeKey('space');}
    else if(event.key==='Enter'&&!document.activeElement?.matches('button')){event.preventDefault();check();}
  });
  // Pointer events support real dragging with a finger on Safari, plus the tap alternative.
  app.addEventListener('pointerdown',event=>{
    const button=event.target.closest('[data-token]');if(!button||button.disabled||stage!=='question')return;
    drag={token:Number(button.dataset.token),x:event.clientX,y:event.clientY,button,id:event.pointerId,ghost:null};button.setPointerCapture(event.pointerId);
  });
  app.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>7){drag.ghost=drag.button.cloneNode(true);drag.ghost.classList.add('drag-ghost');drag.ghost.removeAttribute('data-token');document.body.append(drag.ghost);}
    if(drag.ghost){drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';event.preventDefault();}
  });
  app.addEventListener('pointerup',event=>{
    if(!drag||event.pointerId!==drag.id)return;const current=drag;drag=null;
    if(current.ghost){current.ghost.remove();suppressClick=Date.now()+350;const slot=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-slot]');if(slot)placeToken(current.token,Number(slot.dataset.slot));}
  });
  app.addEventListener('pointercancel',()=>{drag?.ghost?.remove();drag=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelSpeech();clearAdvance();}else if(stage==='correct')autoAdvance();});
  window.addEventListener('zisa:navigation-open',clearAdvance);
  window.addEventListener('zisa:navigation-close',()=>{if(stage==='correct')autoAdvance();});
  window.addEventListener('pagehide',()=>{cancelSpeech();clearAdvance();});
  setup();
})();
