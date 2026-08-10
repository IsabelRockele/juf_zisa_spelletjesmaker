(() => {
  'use strict';

  const grade = Number(document.body.dataset.grade || 2);
  const discoverMode = new URLSearchParams(location.search).get('ontdek') === '1' || sessionStorage.getItem('zisa_discover_preview') === '1';
  const theme = grade === 2 ? {
    title: "Zisa's Zebrawinkel", subtitle: 'Speel met euro’s en centen',
    mascot: 'tafels_afbeeldingen/speel_zisa.png', happy: 'tafels_afbeeldingen/zisa_wint.png',
    levels: [20, 50, 100], gradeLabel: 'Tweede leerjaar'
  } : {
    title: 'Karls Cactusmarkt', subtitle: 'Speel met grotere geldbedragen',
    mascot: 'leerjaar3_afbeeldingen/speel_karl.png', happy: 'leerjaar3_afbeeldingen/karl_juichend.png',
    levels: [100, 500, 1000], gradeLabel: 'Derde leerjaar'
  };

  const root = document.getElementById('moneyGame');
  const assetRoot = '../../geldrekenen/assets/';
  const products = ['appelen','choco','eieren','kaas','koekjes','melk','pasta','sap','trosbananen'];
  const euroDenoms = [500,200,100,50,20,10,5,2,1];
  const centDenoms = [50,20,10,5];
  let chosenLevel = null;
  let chosenMode = null;
  let chosenPayLevel = null;
  let rounds = [];
  let roundIndex = 0;
  let picked = [];
  let locked = false;
  let attempts = 0;
  let helpActive = false;
  let firstPaymentMethod = null;

  const shuffle = values => [...values].sort(() => Math.random() - .5);
  const randomInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  const moneyImage = (value,unit) => `${assetRoot}${value}${unit === 'euro' ? 'euro' : 'cent'}.png`;
  const productImage = name => `${assetRoot}producten/supermarkt/${name}.png`;
  const unitText = unit => unit === 'euro' ? 'euro' : 'cent';
  const speak = text => {
    if(!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nl-BE';
    utterance.rate = .86;
    speechSynthesis.speak(utterance);
  };

  function shell(content){
    root.className = 'money-shell';
    root.innerHTML = `<header class="money-header"><img src="${theme.mascot}" alt=""><div><h1>${theme.title}</h1><p>${theme.subtitle}</p></div></header>${content}`;
  }

  function showSetup(focusPayLevels=false){
    shell(`<section class="panel"><span class="eyebrow">${theme.gradeLabel.toUpperCase()}</span><h2>Kies wat je wilt oefenen</h2><p class="muted">Kies een bedrag en een spel. Daarna helpt ${grade===2?'Zisa':'Karl'} je stap voor stap.</p><div class="selection-grid"><div class="choice-group"><h3>1. Tot hoeveel euro?</h3><div class="choice-buttons" id="levelChoices">${theme.levels.map(v=>`<button class="choice" data-level="${v}"><span>€</span>tot ${v} euro</button>`).join('')}</div></div><div class="choice-group"><h3>2. Welk geldspel?</h3><div class="choice-buttons" id="modeChoices"><button class="choice" data-mode="mixed"><span>🎲</span>Alles door elkaar</button><button class="choice" data-mode="direct"><span>💶</span>Betaal gepast</button><button class="choice" data-mode="shop"><span>🛒</span>Winkelen en optellen</button><button class="choice" data-mode="change"><span>🧾</span>Geld teruggeven</button><button class="choice" data-mode="cent"><span>🪙</span>Spelen met centen</button></div></div><div class="choice-group pay-levels" id="payLevels" hidden><h3>3. Hoe wil je gepast betalen?</h3><div class="choice-buttons"><button class="choice" data-pay-level="1"><span>1</span>Leg het bedrag</button><button class="choice" data-pay-level="2"><span>2</span>Zo weinig mogelijk</button><button class="choice" data-pay-level="3"><span>3</span>Op 2 manieren</button></div></div></div><div class="start-row"><button class="primary" id="startMoney" disabled>▶ Start het geldspel</button></div></section>`);
    root.querySelectorAll('[data-level]').forEach(button => button.onclick = () => {
      if(discoverMode && Number(button.dataset.level) !== theme.levels[0]) return showProNotice();
      chosenLevel = Number(button.dataset.level);
      root.querySelectorAll('[data-level]').forEach(item => item.classList.toggle('active', item === button));
      updateStart();
    });
    root.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => {
      const discoverModeAllowed = grade === 2 ? 'direct' : 'change';
      if(discoverMode && button.dataset.mode !== discoverModeAllowed) return showProNotice();
      chosenMode = button.dataset.mode;
      root.querySelectorAll('[data-mode]').forEach(item => item.classList.toggle('active', item === button));
      document.getElementById('payLevels').hidden = chosenMode !== 'direct';
      updateStart();
    });
    root.querySelectorAll('[data-pay-level]').forEach(button => button.onclick = () => {
      if(discoverMode && Number(button.dataset.payLevel) !== 1) return showProNotice();
      chosenPayLevel = Number(button.dataset.payLevel);
      root.querySelectorAll('[data-pay-level]').forEach(item => item.classList.toggle('active', item === button));
      updateStart();
    });
    document.getElementById('startMoney').onclick = startGame;
    if(chosenLevel) root.querySelector(`[data-level="${chosenLevel}"]`)?.classList.add('active');
    if(chosenMode){
      root.querySelector(`[data-mode="${chosenMode}"]`)?.classList.add('active');
      document.getElementById('payLevels').hidden = chosenMode !== 'direct';
    }
    if(chosenPayLevel) root.querySelector(`[data-pay-level="${chosenPayLevel}"]`)?.classList.add('active');
    updateStart();
    if(discoverMode){
      root.querySelectorAll('[data-level]').forEach(button=>markPro(button,Number(button.dataset.level)!==theme.levels[0]));
      root.querySelectorAll('[data-mode]').forEach(button=>markPro(button,button.dataset.mode!==(grade===2?'direct':'change')));
      root.querySelectorAll('[data-pay-level]').forEach(button=>markPro(button,Number(button.dataset.payLevel)!==1));
      const note=document.createElement('p');note.className='muted';note.style.cssText='text-align:center;font-weight:800;color:#1768ac';note.textContent=grade===2?'Ontdek: betaal gepast tot 20 euro · de andere geldspellen zijn PRO.':'Ontdek: geld teruggeven tot 100 euro · de andere geldspellen zijn PRO.';root.querySelector('.selection-grid').before(note);
    }
    if(focusPayLevels){
      const levels = document.getElementById('payLevels');
      levels.classList.add('level-focus');
      levels.scrollIntoView({behavior:'smooth',block:'center'});
    }
  }

  function markPro(button,locked){if(!locked)return;button.classList.add('discover-pro');button.insertAdjacentHTML('beforeend',' <small style="background:#ffd45c;color:#493300;border-radius:999px;padding:2px 6px;font-weight:900">PRO</small>')}
  function showProNotice(){if(confirm('Deze geldkeuze hoort bij PRO. Wil je de mogelijkheden van PRO bekijken?'))window.open('https://demo.jufzisa.be/#zg-prijzen','_blank','noopener')}

  function updateStart(){ document.getElementById('startMoney').disabled = !(chosenLevel && chosenMode && (chosenMode!=='direct'||chosenPayLevel)); }

  function buildRounds(){
    let types;
    if(chosenMode === 'mixed') types = ['direct','shop','change','centShop','centChange','shop','change','makeEuro'];
    else if(chosenMode === 'cent') types = ['centShop','centChange','makeEuro','centShop','centChange','makeEuro','centShop','centChange'];
    else types = Array(8).fill(chosenMode);
    rounds = shuffle(types).map(makeRound);
  }

  function twoProducts(){
    const product = products[randomInt(0, products.length-1)];
    const others = products.filter(item => item !== product);
    return [product, others[randomInt(0, others.length-1)]];
  }

  function makeRound(type){
    const [product, secondProduct] = twoProducts();
    if(type === 'direct'){
      return {type,target:randomInt(2,chosenLevel),unit:'euro',product,payLevel:chosenPayLevel||randomInt(1,3)};
    }
    if(type === 'shop'){
      const first = randomInt(1, Math.max(2, Math.floor(chosenLevel*.55)));
      const second = randomInt(1, Math.max(1, Math.min(chosenLevel-first, Math.floor(chosenLevel*.4))));
      return {type,target:first+second,unit:'euro',product,secondProduct,prices:[first,second]};
    }
    if(type === 'centShop'){
      const first = randomInt(1,12)*5;
      const second = randomInt(1,Math.max(1,Math.floor((95-first)/5)))*5;
      return {type,target:first+second,unit:'cent',product,secondProduct,prices:[first,second]};
    }
    if(type === 'makeEuro') return {type,target:100,unit:'cent'};
    if(type === 'centChange'){
      const price = randomInt(1,19)*5;
      return {type,target:100-price,unit:'cent',product,price,paid:1,paidUnit:'euro'};
    }
    const payments = (grade===2?[5,10,20,50,100]:[20,50,100,200,500,1000]).filter(value => value <= chosenLevel);
    const paid = payments[randomInt(0,payments.length-1)];
    const price = randomInt(1,paid-1);
    return {type:'change',target:paid-price,unit:'euro',product,price,paid,paidUnit:'euro'};
  }

  function startGame(){
    buildRounds();
    roundIndex = 0;
    picked = [];
    showTutorial();
  }

  function showTutorial(resumeGame=false){
    const modeName = chosenMode==='mixed'?'verschillende winkelopdrachten':chosenMode==='direct'?'gepast betalen':chosenMode==='shop'?'winkelen en optellen':chosenMode==='change'?'geld teruggeven':'euro’s en centen';
    const overlay = document.createElement('div');
    overlay.className = 'tutorial';
    overlay.innerHTML = `<section class="tutorial-card"><h2>Zo speel je met ${modeName}</h2><div class="tutorial-steps"><div class="tutorial-step"><span>👀</span>Kijk naar de prijzen en de opdracht.</div><div class="tutorial-step"><span>🧠</span>Reken zelf uit hoeveel je nodig hebt.</div><div class="tutorial-step"><span>👆</span>Tik op geld en druk op ‘Controleer’.</div></div><div class="tutorial-actions"><button class="secondary" id="listenTutorial">🔊 Luister</button><button class="primary" id="closeTutorial">▶ Ik snap het, spelen!</button></div></section>`;
    document.body.append(overlay);
    const spoken = 'Kijk naar de prijzen en de opdracht. Reken zelf uit hoeveel je moet betalen of teruggeven. Tik op de juiste munten of briefjes en druk op controleer.';
    overlay.querySelector('#listenTutorial').onclick = () => speak(spoken);
    overlay.querySelector('#closeTutorial').onclick = () => {
      if('speechSynthesis' in window) speechSynthesis.cancel();
      overlay.remove();
      if(!resumeGame) renderRound();
    };
  }

  function taskContent(round){
    if(round.type === 'direct'){
      return `<div class="shop-card"><img src="${productImage(round.product)}" alt="Product"><div class="price-tag">Te betalen: ${round.target} euro</div></div>`;
    }
    if(round.type === 'shop' || round.type === 'centShop'){
      return `<div class="shop-card product-pair"><strong>Wat kosten ze samen?</strong><div class="two-products"><div><img src="${productImage(round.product)}" alt="Product"><span class="price-tag">${round.prices[0]} ${unitText(round.unit)}</span></div><b>+</b><div><img src="${productImage(round.secondProduct)}" alt="Product"><span class="price-tag">${round.prices[1]} ${unitText(round.unit)}</span></div></div></div>`;
    }
    if(round.type === 'makeEuro'){
      return `<div class="shop-card"><img src="${moneyImage(1,'euro')}" alt="Munt van 1 euro"><div class="price-tag">Maak 1 euro</div></div>`;
    }
    return `<div class="shop-card change-card"><strong>De klant koopt dit:</strong><img src="${productImage(round.product)}" alt="Product"><div class="price-tag">Prijs: ${round.price} ${unitText(round.unit)}</div><div class="customer-paid">De klant betaalt met <b>${round.paid} ${round.paidUnit}</b></div></div>`;
  }

  function instruction(round){
    if(round.type === 'direct' && round.payLevel===2) return `Betaal precies ${round.target} euro met zo weinig mogelijk munten en biljetten.`;
    if(round.type === 'direct' && round.payLevel===3) return `Betaal precies ${round.target} euro op twee verschillende manieren.`;
    if(round.type === 'direct') return `Betaal precies ${round.target} euro.`;
    if(round.type === 'shop' || round.type === 'centShop') return 'Reken uit wat de twee producten samen kosten. Betaal daarna gepast.';
    if(round.type === 'makeEuro') return 'Maak 1 euro met verschillende centen.';
    return 'Jij bent de winkelier. Geef de klant precies genoeg geld terug.';
  }

  function availableDenoms(round){
    if(round.unit === 'cent') return centDenoms;
    return euroDenoms.filter(value => value <= chosenLevel);
  }

  function answerHeading(round){
    if(round.type === 'makeEuro') return 'Te maken';
    if(round.type === 'direct') return 'Te betalen';
    return round.type==='change'||round.type==='centChange' ? 'Terug te geven' : 'Samen te betalen';
  }

  function renderRound(){
    locked = false;
    picked = [];
    attempts = 0;
    helpActive = false;
    firstPaymentMethod = null;
    const round = rounds[roundIndex];
    const trayTitle = round.type==='change'||round.type==='centChange' ? 'Wisselgeld voor de klant:' : 'Jouw geld:';
    const shownAnswer = round.type==='direct' ? `${round.target} euro` : '?';
    const quickLevelButton = round.type==='direct' ? '<button class="secondary" id="changePayLevel">↕ Ander niveau</button>' : '';
    shell(`<section class="panel"><div class="game-top"><div class="game-choice-actions"><button class="secondary" id="changeGame">← Andere keuze</button>${quickLevelButton}</div><div class="progress"><span style="width:${roundIndex/8*100}%"></span></div><div class="round-label">Opdracht ${roundIndex+1} van 8</div></div><div class="task-layout">${taskContent(round)}<section class="task-card"><div class="task-text">${instruction(round)}</div><div class="amount-display"><div class="amount-box answer-question"><small>${answerHeading(round)}</small><strong>${shownAnswer}</strong></div><div class="amount-box" id="currentBox"><small id="currentLabel">Jouw totaal</small><strong id="currentAmount">?</strong></div></div><div class="money-bank" id="moneyBank">${availableDenoms(round).map(value=>`<button class="money-choice ${round.unit==='cent'||value<=2?'coin':''}" data-value="${value}" aria-label="${value} ${unitText(round.unit)}"><img src="${moneyImage(value,round.unit)}" alt=""><b>${value} ${unitText(round.unit)}</b></button>`).join('')}</div><div class="tray-title">${trayTitle}</div><div class="payment-tray" id="paymentTray"><span class="empty-tray">Tik hierboven op het geld.</span></div><div class="payment-actions"><button class="secondary" id="undoMoney">↶ Laatste weg</button><button class="danger" id="clearMoney">Alles weg</button><button class="primary" id="checkMoney">✓ Controleer</button><button class="secondary" id="listenTask">🔊 Luister</button></div><div class="feedback" id="moneyFeedback"></div></section></div></section>`);
    document.getElementById('changeGame').onclick = () => showSetup(false);
    document.getElementById('changePayLevel')?.addEventListener('click',()=>showSetup(true));
    root.querySelectorAll('[data-value]').forEach(button => button.onclick = () => addMoney(Number(button.dataset.value)));
    document.getElementById('undoMoney').onclick = () => { if(!locked){ picked.pop(); renderTray(); } };
    document.getElementById('clearMoney').onclick = () => { if(!locked){ picked=[]; renderTray(); } };
    document.getElementById('checkMoney').onclick = checkAnswer;
    document.getElementById('listenTask').onclick = () => speak(instruction(round));
    const helpButton = document.createElement('button');
    helpButton.type = 'button';
    helpButton.className = 'secondary';
    helpButton.textContent = '❔ Leg uit';
    helpButton.onclick = () => showTutorial(true);
    document.querySelector('.payment-actions').append(helpButton);
  }

  function addMoney(value){ if(!locked){ picked.push(value); renderTray(); } }

  function renderTray(){
    const round = rounds[roundIndex];
    const tray = document.getElementById('paymentTray');
    tray.innerHTML = picked.length ? picked.map(value=>`<img class="tray-money" src="${moneyImage(value,round.unit)}" alt="${value} ${unitText(round.unit)}">`).join('') : '<span class="empty-tray">Tik hierboven op het geld.</span>';
    document.getElementById('currentAmount').textContent = helpActive ? `${picked.reduce((sum,value)=>sum+value,0)} ${unitText(round.unit)}` : '?';
  }

  function checkAnswer(){
    if(locked) return;
    const round = rounds[roundIndex];
    const total = picked.reduce((sum,value)=>sum+value,0);
    const feedback = document.getElementById('moneyFeedback');
    if(total === round.target && round.type==='direct' && round.payLevel===2 && picked.length>solutionFor(round).length){
      attempts++;
      helpActive=true;
      document.getElementById('currentBox').classList.add('help-active');
      document.getElementById('currentLabel').textContent='Stap 2: jouw totaal';
      renderTray();
      feedback.className='feedback bad';
      feedback.textContent=`Het bedrag klopt, maar het kan met minder geldstukken. Probeer minder dan ${picked.length}.`;
      speak(feedback.textContent);
      return;
    }
    if(total === round.target && round.type==='direct' && round.payLevel===3){
      const method=[...picked].sort((a,b)=>b-a).join('+');
      if(firstPaymentMethod===null){
        firstPaymentMethod=method;
        picked=[];attempts=0;helpActive=false;renderTray();
        document.getElementById('currentBox').classList.remove('help-active');
        document.getElementById('currentLabel').textContent='Jouw totaal';
        feedback.className='feedback good';
        feedback.textContent='De eerste manier is juist! Leg hetzelfde bedrag nu op een andere manier.';
        speak(feedback.textContent);
        return;
      }
      if(method===firstPaymentMethod){
        feedback.className='feedback bad';
        feedback.textContent='Dit is dezelfde manier. Gebruik andere munten of biljetten.';
        speak(feedback.textContent);
        return;
      }
    }
    if(total === round.target){
      locked = true;
      feedback.className = 'feedback good';
      feedback.textContent = 'Heel goed! Dat is precies juist.';
      speak('Heel goed!');
      setTimeout(() => { roundIndex++; roundIndex>=8 ? showFinish() : renderRound(); },1150);
      return;
    }
    attempts++;
    if(attempts === 1){
      helpActive = true;
      document.getElementById('currentBox').classList.add('help-active');
      document.getElementById('currentLabel').textContent = 'Stap 2: jouw totaal';
      renderTray();
      const euroTip = round.type==='makeEuro' ? ' Denk eraan: 1 euro is 100 cent.' : '';
      const calculationTip = round.type==='shop'||round.type==='centShop' ? ` Reken eerst: ${round.prices[0]} + ${round.prices[1]} = ?` : round.type==='centChange' ? ` Denk eraan: 1 euro is 100 cent. Reken eerst: 100 - ${round.price} = ?` : round.type==='change' ? ` Reken eerst: ${round.paid} - ${round.price} = ?` : '';
      feedback.className = 'feedback bad';
      feedback.textContent = `Stap 2: nog niet juist. Je ziet nu hoeveel je al gelegd hebt.${calculationTip}${euroTip}`;
      speak(feedback.textContent);
      return;
    }
    if(attempts === 2){
      const difference = round.target-total;
      feedback.className = 'feedback hint-card';
      feedback.textContent = difference>0 ? `Stap 3: er ontbreekt nog ${difference} ${unitText(round.unit)}.` : `Stap 3: er ligt ${Math.abs(difference)} ${unitText(round.unit)} te veel.`;
      speak(feedback.textContent);
      return;
    }
    showSolution(round,feedback);
  }

  function solutionFor(round){
    let rest = round.target;
    const solution = [];
    for(const value of availableDenoms(round)){
      while(rest >= value){ solution.push(value); rest -= value; }
    }
    return solution;
  }

  function showSolution(round,feedback){
    locked = true;
    helpActive = true;
    renderTray();
    const solution = solutionFor(round);
    feedback.className = 'feedback solution-card';
    feedback.innerHTML = `<strong>Stap 4: kijk naar een juiste oplossing.</strong><div class="solution-money">${solution.map(value=>`<img src="${moneyImage(value,round.unit)}" alt="${value} ${unitText(round.unit)}">`).join('')}</div><span>${solution.join(' + ')} = ${round.target} ${unitText(round.unit)}</span><div><button class="primary" id="nextMoneyRound" type="button">Volgende opdracht →</button></div>`;
    document.getElementById('nextMoneyRound').onclick = () => { roundIndex++; roundIndex>=8 ? showFinish() : renderRound(); };
    speak(`Kijk naar een juiste oplossing. ${solution.join(' plus ')} is ${round.target} ${unitText(round.unit)}.`);
  }

  function showFinish(){
    shell(`<section class="panel finish"><span class="eyebrow">KLAAR!</span><h2>Alle acht opdrachten zijn gelukt</h2><div class="stars">⭐ ⭐ ⭐</div><img src="${theme.happy}" alt="Blije mascotte"><div><button class="primary" id="againMoney">▶ Nog eens spelen</button> <button class="secondary" id="newMoneyChoice">Andere keuze</button></div></section>`);
    document.getElementById('againMoney').onclick = startGame;
    document.getElementById('newMoneyChoice').onclick = () => showSetup(false);
    speak('Knap gedaan! Alle opdrachten zijn gelukt.');
  }

  showSetup();
})();
