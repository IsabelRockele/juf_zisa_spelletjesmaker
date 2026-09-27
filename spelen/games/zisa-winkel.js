(() => {
  'use strict';

  const grade = Number(document.body.dataset.grade || 2);
  const discoverMode = new URLSearchParams(location.search).get('ontdek') === '1' || sessionStorage.getItem('zisa_discover_preview') === '1';
  if(new URLSearchParams(location.search).get('ontdek')==='1')sessionStorage.setItem('zisa_discover_preview','1');
  const theme = grade === 2 ? {
    title: "Zisa's winkel", subtitle: 'Speel met euro’s en centen',
    mascot: 'tafels_afbeeldingen/speel_zisa.png', happy: 'tafels_afbeeldingen/zisa_wint.png',
    levels: [20, 50, 100], gradeLabel: 'Tweede leerjaar'
  } : {
    title: 'Karls Cactusmarkt', subtitle: 'Speel met grotere geldbedragen',
    mascot: 'leerjaar3_afbeeldingen/speel_karl.png', happy: 'leerjaar3_afbeeldingen/karl_juichend.png',
    levels: [100, 500, 1000], gradeLabel: 'Derde leerjaar'
  };

  const root = document.getElementById('moneyGame');
  const assetRoot = '../../geldrekenen/assets/';
  const catalog={appelen:[3,'supermarkt'],choco:[4,'supermarkt'],eieren:[3,'supermarkt'],kaas:[4,'supermarkt'],koekjes:[2,'supermarkt'],melk:[1,'supermarkt'],pasta:[2,'supermarkt'],sap:[2,'supermarkt'],trosbananen:[2,'supermarkt'],springtouw:[5,'speelgoed'],strip:[8,'speelgoed'],voetbal:[12,'speelgoed'],knuffel:[15,'speelgoed'],gezelschapsspel:[25,'speelgoed'],robot:[30,'speelgoed'],skates:[40,'speelgoed'],step:[60,'speelgoed']};
  const products=Object.keys(catalog);
  let nextTimer=null,collected=[];
  const speaker='spellingeiland/assets/luidspreker.png';
  const soundIcon=`<img class="sound-icon" src="${speaker}" alt="">`;
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
  const productImage = name => `${assetRoot}producten/${catalog[name]?.[1]||'supermarkt'}/${name}.png`;
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

  function showSetup(){
    clearTimeout(nextTimer);collected=[];document.querySelector('#zisa-purchases')?.remove();
    const choices=[['direct','Betaal gepast','bibi-wereld/mandje.png'],['shop','Samen kopen',productImage('koekjes')],['change','Geef terug',moneyImage(10,'euro')],['cent','Met centen',moneyImage(50,'cent')],['mixed','Alles door elkaar',productImage('gezelschapsspel')]];
    shell(`<section class="panel shop-menu"><h2>Wat doe jij in de winkel?</h2><div class="shop-mode-grid">${choices.map(([id,label,src])=>`<div class="shop-mode"><button data-mode="${id}"><img src="${src}" alt=""><strong>${label}</strong></button><button class="speak-choice" data-say="${label}" aria-label="Luister: ${label}">${soundIcon}</button></div>`).join('')}</div></section>`);
    root.querySelectorAll('[data-mode]').forEach(b=>markPro(b,discoverMode&&b.dataset.mode!=='direct'));
    root.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>speak(b.dataset.say));root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(discoverMode&&b.dataset.mode!=='direct'){showProNotice();return;}chosenMode=b.dataset.mode;showLevel();});
  }
  function showLevel(){
    shell(`<section class="panel shop-menu"><h2>Tot hoeveel euro?</h2><div class="level-row">${theme.levels.map(n=>`<button data-level="${n}"><img src="${moneyImage(n,'euro')}" alt=""><strong>€ ${n}</strong></button>`).join('')}</div>${chosenMode==='direct'?`<h3>Hoe wil je betalen?</h3><div class="pay-row">${[[1,'Gepast'],[2,'Zo weinig mogelijk'],[3,'Op 2 manieren']].map(([n,t])=>`<button data-pay-level="${n}" ${chosenPayLevel===n?'class="active"':''}>${t}</button>`).join('')}</div>`:''}<div class="start-row"><button class="secondary" id="shop-choices">Andere oefening</button><button class="primary" id="startMoney" disabled>Open de kassa →</button></div><button id="level-listen" class="secondary">${soundIcon} Luister</button></section>`);
    root.querySelectorAll('[data-level]').forEach(b=>markPro(b,discoverMode&&Number(b.dataset.level)!==20));
    root.querySelectorAll('[data-pay-level]').forEach(b=>markPro(b,discoverMode&&Number(b.dataset.payLevel)!==1));
    const refresh=()=>{root.querySelector('#startMoney').disabled=!chosenLevel||(chosenMode==='direct'&&!chosenPayLevel);};
    root.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{if(discoverMode&&Number(b.dataset.level)!==20){showProNotice();return;}chosenLevel=Number(b.dataset.level);root.querySelectorAll('[data-level]').forEach(v=>v.classList.toggle('active',v===b));refresh();});
    root.querySelectorAll('[data-pay-level]').forEach(b=>b.onclick=()=>{if(discoverMode&&Number(b.dataset.payLevel)!==1){showProNotice();return;}chosenPayLevel=Number(b.dataset.payLevel);root.querySelectorAll('[data-pay-level]').forEach(v=>v.classList.toggle('active',v===b));refresh();});
    if(chosenLevel)root.querySelector(`[data-level="${chosenLevel}"]`)?.classList.add('active');refresh();root.querySelector('#startMoney').onclick=startGame;root.querySelector('#shop-choices').onclick=showSetup;root.querySelector('#level-listen').onclick=()=>speak('Kies tot twintig, vijftig of honderd euro.'+(chosenMode==='direct'?' Kies dan gepast betalen, zo weinig mogelijk geldstukken, of betalen op twee manieren.':''));
  }
  function markPro(button,locked){if(!locked)return;button.classList.add('discover-pro');button.insertAdjacentHTML('beforeend',' <small style="background:#ffd45c;color:#493300;border-radius:999px;padding:2px 6px;font-weight:900">PRO</small>')}
  function showProNotice(){if(confirm('Deze geldkeuze hoort bij PRO. Wil je de mogelijkheden van PRO bekijken?'))window.open('https://demo.jufzisa.be/#zg-prijzen','_blank','noopener')}

  function updateStart(){ document.getElementById('startMoney').disabled = !(chosenLevel && chosenMode && (chosenMode!=='direct'||chosenPayLevel)); }

  function buildRounds(){
    let types;
    if(chosenMode === 'mixed') types = ['direct','shop','change','centShop','centChange','shop','change','makeEuro'];
    else if(chosenMode === 'cent') types = ['centShop','centChange','makeEuro','centShop','centChange','makeEuro','centShop','centChange'];
    else types = Array(8).fill(chosenMode);
    const used=new Set();rounds=shuffle(types).map(type=>{let r,key;for(let attempt=0;attempt<100;attempt++){r=makeRound(type);key=r.type==='direct'?`${r.type}:${r.target}:${r.payLevel}`:JSON.stringify(r);if(!used.has(key))break;}used.add(key);return r;});
  }

  function twoProducts(){
    const product = products[randomInt(0, products.length-1)];
    const others = products.filter(item => item !== product);
    return [product, others[randomInt(0, others.length-1)]];
  }

  function makeRound(type){
    let [product, secondProduct] = twoProducts();
    if(type==='centShop'||type==='centChange'){product='koekjes';secondProduct='sap';}
    if(type === 'direct'){
      return {type,target:randomInt(2,chosenLevel),unit:'euro',product,payLevel:chosenPayLevel||randomInt(1,3)};
    }
    if(type==='shop'){
      const combos=products.flatMap((a,i)=>products.slice(i+1).map(b=>({product:a,secondProduct:b,prices:[catalog[a][0],catalog[b][0]]}))).filter(r=>r.prices[0]+r.prices[1]<=chosenLevel&&r.prices[0]+r.prices[1]>=chosenLevel*.4);
      const pair=combos[randomInt(0,combos.length-1)];return {type:'shop',...pair,target:pair.prices[0]+pair.prices[1],unit:'euro'};
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
    const affordable=products.filter(p=>catalog[p][0]<paid);const actual=affordable[randomInt(0,affordable.length-1)],price=catalog[actual][0];return {type:'change',target:paid-price,unit:'euro',product:actual,price,paid,paidUnit:'euro'};
  }

  function startGame(){
    if(discoverMode&&(chosenMode!=='direct'||chosenLevel!==20||chosenPayLevel!==1)){showProNotice();return;}
    buildRounds();
    roundIndex = 0;
    picked = [];
    collected=[];renderRound();
  }

  function taskContent(round){
    if(round.type === 'direct'){
      return `<div class="shop-card"><img src="bibi-wereld/mandje.png" alt="Boodschappen"><div class="price-tag">Rekening: € ${round.target}</div></div>`;
    }
    if(round.type === 'shop' || round.type === 'centShop'){
      return `<div class="shop-card product-pair"><strong>Wat kosten ze samen?</strong>${round.unit==='cent'?'<span class="sale-label">Uitverkoop: de laatste pakjes</span>':''}<div class="two-products"><div><img src="${productImage(round.product)}" alt="Product"><span class="price-tag">${round.prices[0]} ${unitText(round.unit)}</span></div><b>+</b><div><img src="${productImage(round.secondProduct)}" alt="Product"><span class="price-tag">${round.prices[1]} ${unitText(round.unit)}</span></div></div></div>`;
    }
    if(round.type === 'makeEuro'){
      return `<div class="shop-card"><img src="${moneyImage(1,'euro')}" alt="Munt van 1 euro"><div class="price-tag">Maak 1 euro</div></div>`;
    }
    return `<div class="shop-card change-card"><div class="cost-panel"><strong>${round.unit==='cent'?'Uitverkoop':'Dit kost'}</strong><img src="${productImage(round.product)}" alt="${round.product}"><div class="price-tag">${round.price} ${unitText(round.unit)}</div></div><div class="received-panel"><strong>Je krijgt</strong><img src="${moneyImage(round.paid,round.paidUnit)}" alt=""><div class="price-tag">${round.paid} ${round.paidUnit}</div></div></div>`;
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
    shell(`<section class="panel"><div class="game-top"><div class="game-choice-actions"><button class="secondary" id="changeGame">← Andere keuze</button>${quickLevelButton}</div><div class="progress"><span style="width:${roundIndex/8*100}%"></span></div><div class="round-label">Opdracht ${roundIndex+1} van 8</div></div><div class="task-layout">${taskContent(round)}<section class="task-card"><div class="task-text">${instruction(round)}</div><div class="amount-display"><div class="amount-box" id="currentBox"><small id="currentLabel">Jouw totaal</small><strong id="currentAmount">?</strong></div></div><div class="money-bank" id="moneyBank">${availableDenoms(round).map(value=>`<button class="money-choice ${round.unit==='cent'||value<=2?'coin':''}" data-value="${value}" aria-label="${value} ${unitText(round.unit)}"><img src="${moneyImage(value,round.unit)}" alt=""><b>${value} ${unitText(round.unit)}</b></button>`).join('')}</div><div class="tray-title">${trayTitle}</div>${round.payLevel===3?'<div class="saved-method" id="savedMethod"><strong>Manier 1</strong><span>Leg eerst je geld hieronder.</span></div><strong id="methodHeading">Manier 1</strong>':''}<div class="payment-tray" id="paymentTray"><span class="empty-tray">Tik hierboven op het geld.</span></div><div class="payment-actions"><button class="secondary" id="undoMoney">↶ Laatste weg</button><button class="danger" id="clearMoney">Alles weg</button><button class="primary" id="checkMoney">Kijk na ✓</button><button class="secondary" id="listenTask">${soundIcon} Luister</button></div><div class="feedback" id="moneyFeedback"></div></section></div></section>`);
    document.getElementById('changeGame').onclick = () => showSetup(false);
    document.getElementById('changePayLevel')?.addEventListener('click',showLevel);
    root.querySelectorAll('[data-value]').forEach(button => button.onclick = () => addMoney(Number(button.dataset.value)));
    document.getElementById('undoMoney').onclick = () => { if(!locked){ picked.pop(); renderTray(); } };
    document.getElementById('clearMoney').onclick = () => { if(!locked){ picked=[]; renderTray(); } };
    document.getElementById('checkMoney').onclick = checkAnswer;
    document.getElementById('listenTask').onclick = () => speak(instruction(round));
    const helpButton = document.createElement('button');
    helpButton.type = 'button';
    helpButton.className = 'secondary';
    helpButton.textContent = 'Hulp';
    helpButton.onclick = () => {helpActive=true;renderTray();const tip=round.type==='change'||round.type==='centChange'?`${round.paidUnit==='euro'&&round.unit==='cent'?100:round.paid} − ${round.price} = … of ${round.price} + … = ${round.paidUnit==='euro'&&round.unit==='cent'?100:round.paid}`:round.prices?round.prices.join(' + ')+' = …':instruction(round);document.getElementById('moneyFeedback').textContent=tip;speak(tip);};
    document.querySelector('.payment-actions').append(helpButton);
  }

  function addMoney(value){ if(!locked){ picked.push(value); renderTray(); } }

  function renderTray(){
    const round = rounds[roundIndex];
    const tray = document.getElementById('paymentTray');
    tray.innerHTML = picked.length ? picked.map((value,i)=>`<button class="remove-piece" data-remove="${i}" aria-label="Neem ${value} ${unitText(round.unit)} terug"><img class="tray-money" src="${moneyImage(value,round.unit)}" alt="${value} ${unitText(round.unit)}"></button>`).join('') : '<span class="empty-tray">Tik hierboven op het geld.</span>';
    tray.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(!locked){picked.splice(Number(b.dataset.remove),1);renderTray();}});
    document.getElementById('currentBox').classList.toggle('help-active',helpActive);
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
        document.getElementById('savedMethod').innerHTML=`<strong>Manier 1 ✓</strong><div>${picked.map(v=>`<img src="${moneyImage(v,round.unit)}" alt="${v} euro">`).join('')}</div>`;document.getElementById('savedMethod').classList.add('complete');document.getElementById('methodHeading').textContent='Manier 2';
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
      recordPurchase(round);nextTimer=setTimeout(nextRound,1900);
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

  function recordPurchase(round){const goods=round.type==='direct'?[]:[round.product,round.secondProduct].filter(Boolean);collected=goods;let basket=document.querySelector('#zisa-purchases');if(!basket){basket=document.createElement('aside');basket.id='zisa-purchases';document.body.append(basket);}basket.innerHTML=`<img class="shopping-basket" src="bibi-wereld/mandje.png" alt="Mandje"><div>${goods.map(p=>`<img src="${productImage(p)}" alt="${p}">`).join('')}</div><strong>Goed geholpen!</strong>`;}
  function nextRound(){if(document.querySelector('#island-menu[open]')||document.hidden)return;roundIndex++;document.querySelector('#zisa-purchases')?.remove();roundIndex>=8?showFinish():renderRound();}
  addEventListener('zisa:navigation-open',()=>clearTimeout(nextTimer));addEventListener('zisa:navigation-close',()=>{if(locked&&document.getElementById('moneyFeedback')?.classList.contains('good'))nextTimer=setTimeout(nextRound,1900);});document.addEventListener('visibilitychange',()=>{clearTimeout(nextTimer);if(!document.hidden&&locked&&document.getElementById('moneyFeedback')?.classList.contains('good'))nextTimer=setTimeout(nextRound,1900);});
  function showFinish(){
    shell(`<section class="panel finish"><span class="eyebrow">KLAAR!</span><h2>Je werk in de winkel zit erop!</h2><img src="${theme.happy}" alt="Blije mascotte"><div><button class="primary" id="againMoney">Nog eens spelen</button> <button class="secondary" id="newMoneyChoice">Andere keuze</button></div></section>`);
    document.getElementById('againMoney').onclick = startGame;
    document.getElementById('newMoneyChoice').onclick = () => showSetup(false);
    speak('Goed gewerkt in de winkel!');
  }

  showSetup();
})();
