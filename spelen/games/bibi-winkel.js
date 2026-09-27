/* Whole euros, one purchase at a time. All feedback can be heard. */
(() => {
 const main=document.querySelector('#bee-shop'),root='../../geldrekenen/assets/',speaker='spellingeiland/assets/luidspreker.png';
 const products=[['appelen','appelen',3],['koekjes','koekjes',2],['sap','sap',2],['melk','melk',1],['bananen','trosbananen',2],['kaas','kaas',4],['brood','../bakker/bruinbrood',3],['eieren','eieren',3]];
 const image=p=>root+'producten/supermarkt/'+p[1]+'.png',money=v=>root+v+'euro.png';
 let firstWay=null,hadError=false,mode="pay",basketItems=[],max=10,rounds=[],index=0,picked=[],locked=false,timer=null,success=false;
 const sum=()=>picked.reduce((a,b)=>a+b,0),current=()=>rounds[index];
 function speak(text){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='nl-BE';u.rate=.82;speechSynthesis.speak(u);}
 function shuffle(items){for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
 const listen=text=>`<button class="listen" aria-label="Luister" data-speech="${text}"><img src="${speaker}" alt="">Luister</button>`;
 function bindSpeech(){main.querySelectorAll('[data-speech]').forEach(b=>b.onclick=()=>speak(b.dataset.speech));}
 const modes={pay:'Gepast betalen',exchange:'Geld omwisselen',change:'Geld teruggeven',minimum:'Zo weinig mogelijk',twoways:'Betaal op 2 manieren',budget:'Wat kan je kopen?'};
 function setup(){clearTimeout(timer);success=false;locked=false;document.querySelector('#shopping-basket')?.remove();main.className='shop-panel';main.innerHTML=`<h2>Wat wil je doen?</h2><div class="shop-modes">${Object.entries(modes).map(([key,label])=>`<div class="mode-row"><button data-mode="${key}"><img src="${key==='pay'?'bibi-wereld/mandje.png':money(key==='exchange'?5:10)}" alt=""><span>${label}</span></button><button class="mode-listen" data-speech="${label}" aria-label="Luister: ${label}"><img src="${speaker}" alt=""></button></div>`).join('')}</div>`;bindSpeech();main.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;chooseLevel();});}
 const answer=()=>mode==='change'?current().tender-current().price:current().price;
 const signature=pieces=>[...pieces].sort((a,b)=>a-b).join(',');
 const denominations=()=>[1,2,5,10,20].filter(n=>n<=max);
 function fewest(value){let count=0;for(const n of [...denominations()].reverse()){count+=Math.floor(value/n);value%=n;}return count;}
 function start(level){max=level;
  let history=[];try{history=JSON.parse(localStorage.getItem('bibi-money-history-'+mode+'-'+max)||'[]');}catch{}
  const fresh=list=>shuffle(list).sort((a,b)=>Number(history.includes(a.key))-Number(history.includes(b.key)));
  const baskets=Array.from({length:255},(_,n)=>products.filter((_,i)=>(n+1)&(1<<i)));
  const totals=max===20?[...shuffle([8,9,10]).slice(0,2),...shuffle([11,12,13,14]).slice(0,2),...shuffle([15,16,17]).slice(0,2),...shuffle(mode==='change'?[18,19]:[18,19,20]).slice(0,2)]:shuffle([2,3,4,5,6,7,8,9]);
  rounds=totals.map(price=>{
   if(mode==='change'&&price===20)price=17;
   const choices=baskets.filter(items=>items.reduce((n,p)=>n+p[2],0)===price).map(items=>({items,key:items.map(p=>p[0]).sort().join('|')}));
   const choice=fresh(choices)[0];return {price,items:shuffle([...choice.items]),key:choice.key};
  });
  if(mode==='exchange'){
   const pool=[];
   function combinations(start,parts,total){if(total>=2)pool.push({price:total,source:[...parts],items:[],key:signature(parts)});if(parts.length===4)return;const coins=denominations();for(let i=start;i<coins.length;i++)if(total+coins[i]<=max)combinations(i,[...parts,coins[i]],total+coins[i]);}
   combinations(0,[],0);rounds=[];const usedTotals=new Set();
   for(const r of fresh(pool).sort((a,b)=>Number(a.price>10)-Number(b.price>10))){if(!usedTotals.has(r.price)){rounds.push(r);usedTotals.add(r.price);}if(rounds.length===(max===20?2:8))break;}
   if(max===20)for(const r of fresh(pool.filter(r=>r.price>10))){if(!usedTotals.has(r.price)){rounds.push(r);usedTotals.add(r.price);}if(rounds.length===8)break;}
  }
  if(mode==='change'){
   const costs=new Set();rounds.forEach(r=>{if(costs.has(r.price)){r.price=[...Array(max-2)].map((_,i)=>i+2).find(n=>!costs.has(n));r.items=baskets.find(items=>items.reduce((n,p)=>n+p[2],0)===r.price);}costs.add(r.price);r.tender=[5,10,20].find(n=>n>r.price&&n<=max);r.key=r.price+'-'+r.tender;});
  }
  try{localStorage.setItem('bibi-money-history-'+mode+'-'+max,JSON.stringify([...history,...rounds.map(r=>r.key)].slice(-40)));}catch{}
  index=0;showRound();
 }
 function chooseLevel(){clearTimeout(timer);locked=false;success=false;document.querySelector('#shopping-basket')?.remove();main.className='shop-panel';main.innerHTML=`<h2>Tot hoeveel euro?</h2><p class="shop-intro">${modes[mode]}</p><div class="shop-levels">${[10,20].map(n=>`<button data-level="${n}" aria-label="Winkelen tot ${n} euro"><span>tot</span><b>€ ${n}</b><img src="${money(n)}" alt=""></button>`).join('')}</div>${listen('Kom winkelen bij Bibi! Kies tot tien euro of tot twintig euro. Daarna leg je het geld voor je boodschappen.')}<p class="shop-intro">Tik op jouw keuze.</p>`;bindSpeech();main.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>start(Number(b.dataset.level)));}
 function renderBasket(){
  let basket=document.querySelector('#shopping-basket');if(!basket){basket=document.createElement('aside');basket.id='shopping-basket';document.body.append(basket);}
  const poses=[[32,5,-16],[65,7,13],[48,0,-5],[24,-7,-23],[76,-5,19],[43,-10,9],[62,-12,-12]];
  basket.innerHTML=`<img class="basket-shell" src="bibi-wereld/mandje.png" alt="${basketItems.length?'Jouw boodschappenmandje':'Je lege mandje'}"><div class="basket-goods">${basketItems.map((p,i)=>{const [x,y,angle]=poses[i%poses.length];return `<img style="left:${basketItems.length===1?50:x}%;bottom:${y}%;--tilt:${angle}deg;z-index:${i}" src="${image(p)}" alt="${p[0]}">`;}).join('')}</div><img class="basket-front" src="bibi-wereld/mandje.png" alt=""><span>${basketItems.length?basketItems.length+(basketItems.length===1?' boodschap':' boodschappen'):'Je lege mandje'}</span>`;
 }
 function showRound(){
  firstWay=null;hadError=false;basketItems=[];
  if(mode==='budget'){showBudget();return;}
  if(mode==='pay'){showCheckout();return;}
  showMoneyTask();
 }
 function showBudget(){
  picked=[];locked=false;success=false;main.className='shop-panel budget-task';renderBasket();const r=current();
  const stock=shuffle([...products]);
  main.innerHTML=`<div class="shop-progress">${rounds.map((_,i)=>`<i class="${i<index?'done':i===index?'current':''}"></i>`).join('')}</div><h2>Wat kan je kopen?</h2><div class="budget-amount">Je hebt <strong>€ ${r.price}</strong></div><p class="shop-intro">Kies zelf. Geld overhouden mag.</p><div class="budget-shelf">${stock.map((p,i)=>`<button data-buy="${i}" aria-pressed="false"><img src="${image(p)}" alt="${p[0]}"><span>${p[0]}</span><strong>€ ${p[2]}</strong></button>`).join('')}</div>${listen(`Je hebt ${r.price} euro. Kies wat je wilt kopen. Alles samen mag niet meer kosten dan ${r.price} euro. Je mag geld overhouden. Tik nog eens op een product om het weg te leggen.`)}<div class="feedback" role="status" aria-live="polite"></div><div class="actions"><button id="count-help">Tel mee</button><button id="pay" class="primary">Koop ✓</button></div>`;
  bindSpeech();main.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{if(locked)return;const i=Number(b.dataset.buy),at=picked.indexOf(i);if(at<0)picked.push(i);else picked.splice(at,1);b.setAttribute('aria-pressed',String(at<0));feedback('');});
  main.querySelector('#count-help').onclick=()=>feedback(`Je kiest voor ${picked.reduce((n,i)=>n+stock[i][2],0)} euro. Je hebt ${r.price} euro.`);
  main.querySelector('#pay').onclick=()=>{
   if(locked)return;if(!picked.length){feedback('Kies eerst iets dat je wilt kopen.');return;}
   const total=picked.reduce((n,i)=>n+stock[i][2],0);if(total>r.price){hadError=true;feedback('Dat kost te veel. Leg iets terug: tik er nog eens op.');return;}
   basketItems=picked.map(i=>stock[i]);renderBasket();locked=true;success=true;if(hadError&&!r.retry&&rounds.filter(q=>q.retry).length<3)rounds.push({...r,retry:true});main.classList.add('shop-success');main.querySelectorAll('button').forEach(b=>b.disabled=true);feedback(`Dat kan je kopen!${total<r.price?' Je houdt '+(r.price-total)+' euro over.':''}`,true);scheduleNext();
  };speak(`Je hebt ${r.price} euro. Wat wil je kopen?`);
 }
 function showCheckout(){main.classList.remove('collecting');picked=[];locked=false;success=false;main.classList.remove('shop-success','many-pieces');const r=current();main.classList.toggle('large-order',r.items.length>4);renderBasket();main.innerHTML=`<div class="shop-progress" aria-label="Boodschap ${index+1} van ${rounds.length}">${rounds.map((_,i)=>`<i class="${i<index?'done':i===index?'current':''}"></i>`).join('')}</div><h2>Aan de kassa</h2><div class="shop-task">${r.items.map(p=>`<div class="shop-product"><img class="product" src="${image(p)}" alt="${p[0]}"><p class="product-name">${p[0]}</p><div class="price">€ ${p[2]}</div></div>`).join('<span class="plus">+</span>')}</div>${listen(r.items.map(p=>p[0]+' kost '+p[2]+' euro').join('. ')+'. Hoeveel betaal je samen? Leg het geld en tik op Betaal.')}<div class="money-bank">${[1,2,5,...(max===20?[10]:[])].map(n=>`<button data-money="${n}" aria-label="Leg ${n} euro"><img src="${money(n)}" alt=""><strong>€ ${n}</strong></button>`).join('')}</div><div class="money-tray" aria-label="Jouw geld"></div><div class="feedback" role="status" aria-live="polite"></div><div class="actions"><button id="count-help">Tel mee</button><button class="primary" id="pay">Betaal ✓</button></div>`;bindSpeech();renderTray();main.querySelectorAll('[data-money]').forEach(b=>b.onclick=()=>{if(locked)return;if(sum()+Number(b.dataset.money)>max+2){feedback('Tel eerst je geld. Tik op geld in je bakje om het terug te nemen.');return;}picked.push(Number(b.dataset.money));renderTray();feedback('');});main.querySelector('#pay').onclick=pay;main.querySelector('#count-help').onclick=()=>feedback(`Je hebt ${sum()} euro. Je moet ${r.price} euro betalen.`);speak(r.items.length>1?'Hoeveel betaal je samen? Tel de prijzen op.':'Kijk naar de prijs en leg het geld.');}
 function showMoneyTask(){
  picked=[];locked=false;success=false;document.querySelector('#shopping-basket')?.remove();main.className='shop-panel money-task';const r=current();
  const instruction=mode==='minimum'?`Betaal ${r.price} euro met zo weinig mogelijk munten en briefjes.`:mode==='twoways'?`Leg ${r.price} euro op twee verschillende manieren. Begin met de eerste manier.`:mode==='exchange'?`Wissel ${r.price} euro. Leg hetzelfde bedrag met ander geld.`:`De boodschappen kosten ${r.price} euro. De klant betaalt ${r.tender} euro. Hoeveel geef je terug?`;
  main.innerHTML=`<div class="shop-progress">${rounds.map((_,i)=>`<i class="${i<index?'done':i===index?'current':''}"></i>`).join('')}</div><h2>${modes[mode]}</h2>${r.retry?'<p class="retry-note">Nog eens proberen</p>':''}${mode==='exchange'?`<div class="exchange-source"><div class="source-pieces">${r.source.map(n=>`<img src="${money(n)}" alt="${n} euro">`).join('')}</div><strong>€ ${r.price}</strong></div><p class="shop-intro">Hetzelfde bedrag, ander geld.</p>`:mode==='minimum'||mode==='twoways'?`<div class="payment-target"><div class="customer-goods">${r.items.map(p=>`<img src="${image(p)}" alt="${p[0]}">`).join('')}</div><strong>€ ${r.price}</strong></div><p class="shop-intro" id="method-label">${mode==='minimum'?'Gebruik zo weinig mogelijk munten en briefjes.':'Manier 1 van 2'}</p><div id="first-way" hidden></div>`:`<div class="cash-compare"><div class="cost-card"><div class="cash-label"><span>Dit kost</span><button data-speech="De boodschappen kosten ${r.price} euro." aria-label="Luister: dit kost ${r.price} euro"><img src="${speaker}" alt=""></button></div><div class="customer-goods">${r.items.map(p=>`<img src="${image(p)}" alt="${p[0]}">`).join('')}</div><strong class="price-tag" data-cost="${r.price}">€ ${r.price}</strong></div><div class="received-card"><div class="cash-label"><span>Je krijgt</span><button data-speech="De klant geeft jou ${r.tender} euro. Daar geef je geld van terug." aria-label="Luister: je krijgt ${r.tender} euro"><img src="${speaker}" alt=""></button></div><img src="${money(r.tender)}" alt="${r.tender} euro"><strong data-tender="${r.tender}">€ ${r.tender}</strong></div></div>`}${listen(instruction)}<div class="money-bank">${[1,2,5,10,20].filter(n=>n<=max).map(n=>`<button data-money="${n}" aria-label="Leg ${n} euro"><img src="${money(n)}" alt=""><strong>€ ${n}</strong></button>`).join('')}</div><div class="money-tray" aria-label="${mode==='change'?'Wisselgeld':'Jouw geld'}"></div><div class="feedback" role="status" aria-live="polite"></div><div class="actions"><button id="count-help">Tel mee</button><button id="pay" class="primary">${mode==='change'?'Geef terug':mode==='exchange'?'Wissel':'Kijk na'} ✓</button></div>`;
  if(mode==='twoways'){
   main.classList.add('two-ways');main.querySelector('#first-way')?.remove();main.querySelector('#pay').remove();
   main.querySelector('.money-tray').outerHTML=`<div class="method-boxes">${[1,2].map(n=>`<section class="method-box" data-way="${n}"><h3>Manier ${n}</h3><div class="method-tray"></div><button class="primary method-check" data-check-way="${n}" ${n===2?'disabled':''}>Kijk na ✓</button></section>`).join('')}</div>`;
  }
  bindSpeech();renderTray();main.querySelectorAll('[data-money]').forEach(b=>b.onclick=()=>{if(locked)return;const n=Number(b.dataset.money);if(sum()+n>max+2){feedback('Tel eerst je geld.');return;}picked.push(n);renderTray();feedback('');});
  main.querySelector('#pay').onclick=pay;main.querySelector('#count-help').onclick=()=>{if(mode==='change')showChangeHint();else feedback(`Je hebt ${sum()} euro. Maak hetzelfde bedrag: ${r.price} euro.`);};speak(instruction);
 }
 function renderMethods(){
  const active=firstWay?2:1;main.classList.toggle('many-pieces',picked.length>7);
  main.querySelectorAll('.method-box').forEach(box=>{
   const n=Number(box.dataset.way),saved=n===1&&firstWay,values=saved?firstWay:n===active?picked:[];
   box.classList.toggle('active',n===active);box.classList.toggle('checked',!!saved);box.classList.toggle('waiting',n>active);
   box.querySelector('h3').textContent=`Manier ${n}${saved?' ✓':''}`;
   box.querySelector('.method-tray').innerHTML=values.length?values.map((v,i)=>saved?`<span class="saved-piece ${v>=5?'note':'coin'}"><img src="${money(v)}" alt="${v} euro"></span>`:`<button data-piece="${i}" class="${v>=5?'note':'coin'}" aria-label="Neem ${v} euro terug"><img src="${money(v)}" alt="${v} euro"></button>`).join(''):`<span class="tray-note">${n===active?'Leg hier je geld.':'Eerst manier 1.'}</span>`;
   const check=box.querySelector('.method-check');check.removeAttribute('id');check.disabled=n!==active||locked;check.textContent=saved?'Juist ✓':'Kijk na ✓';if(n===active)check.id='pay';check.onclick=pay;
   box.querySelectorAll('[data-piece]').forEach(b=>b.onclick=()=>{if(locked)return;picked.splice(Number(b.dataset.piece),1);renderMethods();feedback('');});
  });
 }
 function renderTray(){if(mode==='twoways'){renderMethods();return;}main.classList.toggle('many-pieces',picked.length>7);const tray=main.querySelector('.money-tray');tray.innerHTML=picked.length?picked.map((n,i)=>`<button data-remove="${n}" data-piece="${i}" class="${n>=5?'note':'coin'}" aria-label="Neem dit ${n>=5?'briefje':'muntje'} van ${n} euro terug"><img src="${money(n)}" alt="${n} euro"></button>`).join(''):`<span class="tray-note">${mode==='change'?'Wat geef jij terug? Leg het hier.':'Leg hier je geld.'}</span>`;tray.querySelectorAll('[data-piece]').forEach(b=>b.onclick=()=>{if(locked)return;picked.splice(Number(b.dataset.piece),1);renderTray();feedback('');});}

 function feedback(text,good=false){if(good){main.querySelector('#change-hint')?.remove();main.classList.remove('has-change-hint');}const el=main.querySelector('.feedback');el.textContent=text;el.classList.toggle('good',good);if(text)speak(text);}
 function showChangeHint(message=''){
  const r=current();let hint=main.querySelector('#change-hint');if(!hint){hint=document.createElement('div');hint.id='change-hint';main.querySelector('.feedback').after(hint);}
  main.classList.add('has-change-hint');
  hint.innerHTML=`<button aria-label="Luister naar de aftrekking"><span>Trek af</span><strong>${r.tender} − ${r.price} = …</strong><img src="${speaker}" alt=""></button><button aria-label="Luister naar doortellen"><span>Tel door</span><strong>${r.price} + … = ${r.tender}</strong><img src="${speaker}" alt=""></button>`;
  const subtraction=`Je krijgt ${r.tender} euro. De boodschappen kosten ${r.price} euro. Hoeveel is ${r.tender} min ${r.price}?`;
  const counting=`Begin bij ${r.price} euro. Hoeveel moet erbij om bij ${r.tender} euro te komen?`;
  hint.children[0].onclick=()=>speak(subtraction);hint.children[1].onclick=()=>speak(counting);speak(message+' '+counting);
 }
 function mistake(text){if(picked.length)hadError=true;feedback(text);if(mode==='change')showChangeHint(text);}
 function pay(){
  if(locked)return;const r=current(),total=sum();
  if(mode==='exchange'&&signature(picked)===signature(r.source)){mistake('Dat is hetzelfde geld. Leg hetzelfde bedrag met ander geld.');return;}
  if(total!==answer()){mistake(!picked.length?'Tik op het geld.':total<answer()?'Nog te weinig. Leg er geld bij.':'Te veel. Tik op geld in je bakje om het terug te nemen.');return;}
  if(mode==='minimum'&&picked.length!==fewest(r.price)){mistake('Het bedrag klopt! Kan het met minder munten en briefjes?');return;}
  if(mode==='twoways'){
   if(!firstWay){firstWay=[...picked];picked=[];renderTray();main.querySelector('#method-label').textContent='Leg het nu anders in manier 2.';feedback('Juist! Leg nu hetzelfde bedrag op een andere manier.',true);return;}
   if(signature(picked)===signature(firstWay)){mistake('Dat is dezelfde manier. Kies een andere combinatie.');return;}
  }
  if(hadError&&!r.retry&&rounds.filter(q=>q.retry).length<3)rounds.push({...r,retry:true});
  locked=true;success=true;if(mode==='pay'){basketItems=[...r.items];renderBasket();}main.classList.add('shop-success');feedback(mode==='pay'?'Juist betaald! Je boodschappen mogen mee.':mode==='change'?'Juist! De klant krijgt het juiste wisselgeld.':mode==='twoways'?'Goed! Twee verschillende manieren.':mode==='minimum'?'Goed! Met zo weinig mogelijk munten en briefjes.':'Juist! Evenveel geld, anders gelegd.',true);main.querySelectorAll('.money-bank button,.money-tray button,.actions button,.method-box button').forEach(b=>b.disabled=true);scheduleNext();
 }
 function scheduleNext(){clearTimeout(timer);timer=setTimeout(()=>{if(document.querySelector('#island-menu[open]')||document.hidden)return;advance();},1900);}
 function advance(){if(!success)return;success=false;index++;if(index<rounds.length)showRound();else finish();}
 function finish(){main.className='shop-panel';if(mode!=='pay'&&mode!=='budget')basketItems=[];main.innerHTML=`<h2>Goed gedaan!</h2><div class="basket">${basketItems.map(p=>`<img src="${image(p)}" alt="${p[0]}">`).join('')}</div><p class="shop-intro">${rounds.length} opdrachten klaar!</p><div class="actions"><button class="primary" id="again">Nog eens</button><button id="new-level">Ander spel?</button></div>${listen('Je hebt alle boodschappen gekocht. Goed gedaan! Wil je nog eens winkelen?')}`;main.querySelector('#again').onclick=()=>start(max);main.querySelector('#new-level').onclick=setup;bindSpeech();speak('Alle winkelbeurten zijn klaar. Goed gewinkeld!');}
 addEventListener('zisa:navigation-open',()=>clearTimeout(timer));addEventListener('zisa:navigation-close',()=>{if(success)scheduleNext();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);window.speechSynthesis?.cancel();}else if(success)scheduleNext();});addEventListener('pagehide',()=>{clearTimeout(timer);window.speechSynthesis?.cancel();});
 setup();
})();
