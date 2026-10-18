(()=>{'use strict';
const $=s=>document.querySelector(s),id=location.hash.slice(1),story=window.ZISA_UPPER_STORIES.find(s=>s.id===id)||window.ZISA_UPPER_STORIES[0];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const pic=n=>`images/seizoenen-v2/${story.id}/${String(n).padStart(2,'0')}.png`;
const kind=story.id.startsWith('m5-heks')?'memory':story.id.startsWith('m5-pakjes')?'harbour':story.id.startsWith('e5-verkeerde')?'doors':'lift';
const titles={memory:'Taartenreddersmemory',harbour:'De havenmeester',doors:'Ontsnap uit het toverhuis',lift:'Jij bestuurt de pakjeslift'};
$('#title').textContent=titles[kind];$('#book').textContent='Extra leesspel · '+story.title;
const url=new URL('index.html',location.href);for(const key of ['gratis','ontdek','teacher','code','methode'])if(new URLSearchParams(location.search).has(key))url.searchParams.set(key,new URLSearchParams(location.search).get(key));url.searchParams.set('niveau',story.level);
for(const sel of ['#back','#books']){$(sel).href=url.href;$(sel).textContent=(sel==='#back'?'‹ ':'Terug naar ')+'boekjes '+story.level;}url.searchParams.set('verhaal',story.id);$('#story').href=url.href;
let generation=0,round=0,selected=null,slots=[],pieces=[],answer=[],busy=false,readText='';
function say(text){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='nl-BE';speechSynthesis.speak(u);}
$('#speak').onclick=()=>say(readText);$('#restart').onclick=reset;$('#again').onclick=()=>{$('#win').close();reset();};
function feedback(t){$('#feedback').textContent=t;}
function win(t){busy=true;$('#wintext').textContent=t;$('#win').showModal();}
function reset(){doorDragCleanup?.();window.ZisaLift?.stop();generation++;round=0;busy=false;selected=null;feedback('');$('#score').textContent='';if(kind==='memory')memory();else if(kind==='doors')doors();else if(kind==='lift')window.ZisaLift.start({container:$('#game'),feedback,win,read:t=>readText=t});else puzzle();}
function button(text,fn,cls=''){const b=document.createElement('button');b.className=cls;b.textContent=text;b.onclick=fn;return b;}
function shell(title,clues,boardClass){$('#game').innerHTML='<aside class="notes"><h2></h2><div class="clues"></div></aside><div class="board"></div>';$('.notes h2').textContent=title;for(const t of clues){const p=document.createElement('p');p.className='clue';p.textContent=t;$('.clues').append(p);}$('.board').classList.add(boardClass);readText=title+'. '+clues.join(' ');}
function memory(){const pairs=[[4,'Omdat Mila helpt bij het hek, laat ze de kar even los.'],[6,'Noor waarschuwt de bezoekers, zodat het pad vrij wordt.'],[8,'In het gras zakken de wielen weg en stopt de kar.'],[10,'Bas controleert eerst of Mila zich pijn heeft gedaan.'],[12,'Het gebroken stukje suiker krijgt een nieuwe plek op de taart.'],[15,'Na het avontuur stappen Mila en Noor rustig naar huis.']];let open=[],found=0;const token=generation;
 $('#game').innerHTML='<div class="memory-wrap"><p class="instruction">Zoek zes paren: lees de zin en vind de passende prent. Draai telkens twee kaarten om.</p><div class="memory"></div></div>';readText=$('.instruction').textContent;
 for(const c of shuffle(pairs.flatMap((p,i)=>[{i,image:p[0]},{i,text:p[1]}]))){const b=button('',()=>{if(busy||b.classList.contains('open')||b.classList.contains('found'))return;b.classList.add('open');if(c.image)b.innerHTML=`<img src="${pic(c.image)}" alt="Scène uit het verhaal">`;else{b.innerHTML='';const t=document.createElement('span');t.textContent=c.text;b.append(t);readText=c.text;}open.push({b,c});if(open.length===2){busy=true;const same=open[0].c.i===open[1].c.i;setTimeout(()=>{if(token!==generation)return;for(const x of open){if(same)x.b.classList.add('found');else{x.b.classList.remove('open');x.b.innerHTML='<span class="back">🎃</span>';}}if(same){found++;feedback('Een zin en de juiste prent gevonden!');}else feedback('Deze twee horen niet bij elkaar. Onthoud waar ze liggen.');open=[];busy=false;$('#score').textContent=found+' / 6 paren';if(found===6)win('Je hebt alle zes gebeurtenissen herkend.');},same?700:1800);}},'card');b.innerHTML='<span class="back">🎃</span>';b.setAttribute('aria-label','Draai een kaart om');$('.memory').append(b);}
}
const vessels=[{name:'Ster',art:'⭐',color:'#f2c44c'},{name:'Maan',art:'🌙',color:'#719fd4'},{name:'Vis',art:'🐟',color:'#b8d776'},{name:'Anker',art:'⚓',color:'#e99985'}];
const parcels=[{name:'poppenhuis',art:'🏠'},{name:'pannen',art:'🍳'},{name:'boeken',art:'📚'},{name:'blokken',art:'🧱'}];
function puzzle(){generation++;speechSynthesis.cancel();busy=false;selected=null;slots=Array(4).fill(null);pieces=shuffle((kind==='harbour'?vessels:parcels).map((v,i)=>({...v,id:i})));answer=shuffle(pieces.map(p=>p.id));const name=id=>pieces.find(p=>p.id===id).name;let clues;
 if(kind==='harbour'){clues=[`De boot ${name(answer[0])} ligt aan de steiger helemaal links.`,`De boot ${name(answer[3])} ligt helemaal rechts.`,`De boot ${name(answer[1])} ligt direct rechts van ${name(answer[0])}.`,`De boot ${name(answer[2])} ligt tussen ${name(answer[1])} en ${name(answer[3])}.`];if(round===1)clues=[`De boot ${name(answer[1])} ligt direct rechts van ${name(answer[0])}.`,`De boot ${name(answer[2])} ligt direct rechts van ${name(answer[1])}.`,`De boot ${name(answer[3])} ligt rechts van ${name(answer[2])}.`];if(round===2)clues=[`De boot ${name(answer[2])} ligt direct links van ${name(answer[3])}.`,`De boot ${name(answer[0])} ligt twee steigers links van ${name(answer[2])}.`,`De boot ${name(answer[1])} ligt tussen ${name(answer[0])} en ${name(answer[2])}.`];shell('Waar meren ze aan?',shuffle(clues),'dock');}
 else{const recipients={poppenhuis:'een kind. Dat pak moet naar het dek',pannen:'de kok. Hij wacht in de keuken',boeken:'de kinderen. Breng ze naar het dek',blokken:'de kinderen. Breng ze naar het dek'};pieces.forEach(p=>{p.floor='';p.destination=[{poppenhuis:'dek',pannen:'keuken',boeken:'dek',blokken:'dek'},{poppenhuis:'dek',pannen:'ruim',boeken:'keuken',blokken:'dek'},{poppenhuis:'dek',pannen:'dek',boeken:'keuken',blokken:'ruim'}][round][p.name];});clues=[`Eerst vertrekt het pak met ${name(answer[0])}.`,`De ${name(answer[2])} gaan meteen na de ${name(answer[1])}.`,`De ${name(answer[3])} vertrekken als laatste.`];shell('Plan de ritten',shuffle(clues),'lift');const p=document.createElement('p');p.textContent=['Speelgoed en leesboeken gaan naar het dek. De kok wacht in de keuken op zijn pannen.','Het poppenhuis en de blokken gaan naar het dek. De kookboeken moeten naar de keuken. De pannen zijn voorraad voor het ruim.','Het poppenhuis en de pannen zijn geschenken: naar het dek! De kookboeken gaan naar de keuken. De blokken blijven in het ruim.'][round];$('.notes').append(p);readText+=' '+p.textContent;}
 const tip=document.createElement('p');tip.className='instruction';tip.textContent=kind==='harbour'?'Sleep de boten naar de steigers, of tik op een boot en daarna op een steiger.':'Zet de pakjes klaar in de juiste vertrekvolgorde. Kies onder elk pakje de verdieping.';$('.board').append(tip);if(kind==='lift'){const machine=document.createElement('div');machine.className='lift-machine';machine.innerHTML='<div class=lift-shaft><div class=lift-cabin>📦</div></div><div class=lift-floors><span>Dek</span><span>Keuken</span><span>Ruim</span></div>';$('.board').append(machine);}
 const slotbox=document.createElement('div');slotbox.className='slots';const bank=document.createElement('div');bank.className='bank';$('.board').append(slotbox,bank);
 $('.notes').append(button(kind==='harbour'?'Laat de havenmeester kijken':'Start de lift',checkPuzzle,'primary'));drawPieces();$('#score').textContent='Puzzel '+(round+1)+' / 3';feedback('Lees alle aanwijzingen. Je kunt nog wisselen voordat je start.');
 if(kind==='harbour'){$('.notes h2').textContent=`Havenplan ${round+1}: waar meren ze aan?`;$('.notes h2').tabIndex=-1;$('.notes h2').focus({preventScroll:true});}
}
function finishHarbour(){
 busy=true;selected=null;speechSynthesis.cancel();
 document.querySelectorAll('.dock .piece').forEach(b=>{b.disabled=true;b.draggable=false;});
 document.querySelectorAll('.dock .slot').forEach(s=>s.classList.add('done'));
 const message='Dit havenplan is klaar! Alle boten liggen op de juiste plek.';
 $('.notes h2').textContent='Goed aangemeerd!';$('.clues').replaceChildren();const p=document.createElement('p');p.textContent=message;$('.clues').append(p);readText=message;
 feedback('Kies ‘Volgende puzzel’ voor nieuwe aanwijzingen.');round++;
 if(round===3){win('Alle boten liggen goed. Je hebt drie verschillende havenplannen opgelost!');return;}
 const next=$('.notes .primary');next.textContent='Volgende puzzel ›';next.onclick=puzzle;
}
function drawPieces(){const bank=$('.bank'),box=$('.slots');bank.innerHTML='';box.innerHTML='';for(let i=0;i<4;i++){const slot=document.createElement('div');slot.className='slot';slot.setAttribute('aria-label',(kind==='harbour'?'Steiger ':'Rit ')+(i+1));const label=document.createElement('b');label.textContent=(kind==='harbour'?'Steiger ':'Rit ')+(i+1);slot.append(label);slot.onclick=()=>{if(selected!==null)place(selected,i);};slot.ondragover=e=>e.preventDefault();slot.ondrop=e=>{e.preventDefault();const v=Number(e.dataTransfer.getData('text/plain'));if(pieces.some(p=>p.id===v))place(v,i);};if(slots[i]!==null){const p=pieces.find(p=>p.id===slots[i]);slot.append(pieceButton(p));if(kind==='lift'){const sel=document.createElement('select');sel.className='floor';sel.setAttribute('aria-label','Bestemming voor '+p.name);sel.innerHTML='<option value="">Verdieping?</option><option value="dek">Dek</option><option value="keuken">Keuken</option><option value="ruim">Ruim</option>';sel.value=p.floor;sel.onclick=e=>e.stopPropagation();sel.onchange=()=>p.floor=sel.value;slot.append(sel);}}box.append(slot);}for(const p of pieces)if(!slots.includes(p.id))bank.append(pieceButton(p));}
function pieceButton(p){const b=button('',e=>{if(busy)return;if(selected!==null&&selected!==p.id&&slots.includes(p.id)){place(selected,slots.indexOf(p.id));return;}selected=selected===p.id?null:p.id;drawPieces();},'piece'+(selected===p.id?' selected':''));b.innerHTML=kind==='harbour'?`<img class="harbour-boat" draggable="false" src="images/woordenschat-seizoenen/boot-${p.name.toLowerCase()}.png" alt=""><span class="boat-name">${p.name}</span>`:`<span class=gift-box><span>${p.art}</span></span><span>${p.name}</span>`;b.draggable=true;b.ondragstart=e=>{selected=p.id;e.dataTransfer.setData('text/plain',String(p.id));};b.addEventListener('click',e=>e.stopPropagation());if(p.color)b.style.background=p.color;return b;}
function place(id,index){if(busy)return;const previous=slots.indexOf(id);if(previous===index){selected=null;drawPieces();return;}const displaced=slots[index];if(previous>=0)slots[previous]=displaced;slots[index]=id;selected=null;drawPieces();feedback('Je plan is aangepast. Controleer ook de andere aanwijzingen.');}
function checkPuzzle(){if(busy)return;if(slots.includes(null)){feedback('Er staan nog niet overal boten of pakjes.');return;}if(kind==='lift'&&pieces.some(p=>!p.floor)){feedback('Kies bij elk pakje een bestemming.');return;}if(!slots.every((v,i)=>v===answer[i])){feedback('Deze volgorde past nog niet bij alle aanwijzingen. Lees ze nog eens en wissel wat nodig is.');return;}if(kind==='lift'&&pieces.some(p=>p.floor!==p.destination)){feedback('De volgorde klopt. Controleer nog voor wie de pakjes zijn en waar die moeten zijn.');return;}if(kind==='harbour'){finishHarbour();return;}busy=true;const token=generation;const boxes=[...document.querySelectorAll('.slot')];let i=0;function travel(){if(token!==generation)return;if(i===4){round++;if(round===3)win(kind==='harbour'?'Alle boten liggen goed. Je hebt drie verschillende havenplannen opgelost!':'Alle pakjes zijn in de juiste volgorde op de juiste verdieping aangekomen!');else{$('.notes .primary').textContent='Volgende puzzel ›';$('.notes .primary').onclick=puzzle;feedback('Alles klopt! Klaar voor een nieuw plan?');}return;}boxes[i].classList.add('running','done');if(kind==='lift'){const item=pieces.find(p=>p.id===slots[i]);$('.lift-cabin').textContent=item.art;$('.lift-cabin').style.bottom=item.floor==='dek'?'70%':item.floor==='keuken'?'35%':'0%';setTimeout(()=>{if(token===generation)$('.lift-cabin').style.bottom='0%';},350);}i++;setTimeout(travel,650);}travel();}
const doorNames=['maan','blad','ster'];
const doorSymbols=[
 '<path d="M47 8C19 11 15 47 43 55C17 64 0 41 9 22C17 7 32 2 47 8Z"/>',
 '<path d="M51 7C25 6 7 17 12 37C17 55 43 51 51 7Z"/><path d="M10 56L39 22" fill="none" stroke="#fff3bb" stroke-width="4"/>',
 '<path d="M32 4L40 23L60 25L45 39L49 59L32 48L15 59L19 39L4 25L24 23Z"/>'
];
const emblem=n=>`<svg viewBox="0 0 64 64" aria-hidden="true">${doorSymbols[n]}</svg>`;
const keyNames=['ronde','driehoekige','vierkante'];
function keyArt(n){return `<svg viewBox="0 0 150 70" aria-hidden="true"><g fill="#ffe3a0" stroke="#976026" stroke-width="4" stroke-linejoin="round"><path d="M52 31H137V46H125V39H114V47H102V39H52Z"/>${['<circle cx="33" cy="34" r="23"/><circle cx="33" cy="34" r="11" fill="#fff7df"/>','<path d="M33 6L61 57H5Z"/><path d="M33 25L43 45H23Z" fill="#fff7df"/>','<rect x="9" y="10" width="48" height="48" rx="5"/><rect x="23" y="24" width="20" height="20" rx="2" fill="#fff7df"/>'][n]}</g></svg>`;}
let rooms=0,doorTarget=0,keyTarget=0,soundOn=false,doorDragCleanup=null;
const residents=[
 ['spookje','Pip het spookje','Boe… welkom! Ik bewaar het eerste toverlichtje. Neem het maar mee.'],
 ['kat','Minoes de toverkat','Miauw! Je hebt mijn deur gevonden. Dit lichtje lag onder mijn kussen.'],
 ['uil','Ollie de uil','Goed gelezen! Tussen mijn boeken vond ik een toverlichtje voor jou.'],
 ['pompoen','Pom de pompoen','Dag speurneus! Mijn lichtje glom tussen de bladeren. Nog één deur te gaan!'],
 ['draak','Dorus het draakje','Daar ben je! Met jouw vijf toverlichtjes kan de zilveren bel weer klinken.']
];
const roomNames=['De hal','De spiegelkamer','De bibliotheek','De serre','De geheime kamer'];
const doorRiddles=[
 ['Zoek het teken dat aan de nachtelijke hemel staat. Het is geen ster.','Kies het teken dat aan een boom groeit.','Zoek het teken met vijf punten.'],
 ['Mijn teken lijkt op een smal stukje van de maan.','Mijn teken groeit aan een tak en kan in de herfst vallen.','Mijn teken heeft vijf punten. Je ziet zulke tekens ook boven op een kerstboom.'],
 ['In het boek staat een maan en een ster. Kies de deur met de maan.','In mijn boek droog ik iets dat ik onder een boom vond. Het heeft een steeltje en nerven.','Op de kaft staat een ster met vijf punten. Zoek hetzelfde teken op de deur.'],
 ['De tuinman zoekt een teken van de nacht. Hij bedoelt niet de ster.','Dit teken hoort bij een plant. Het is geen bloem, maar een blad.','Er staat geen maan of blad op mijn deur. Welk teken blijft over?'],
 ['De laatste deur heeft de vorm van een smalle maan als teken.','Kies de deur met een blad, niet met iets uit de ruimte.','Zoek het teken met vijf punten, niet de maan.']
];
const keyRiddles=[
 ['De kop van de sleutel is rond, zonder hoeken.','De kop van de sleutel heeft precies drie hoeken.','De kop van de sleutel is een vierkant.'],
 ['De kop heeft geen rechte zijden.','Zoek de sleutel met een driehoekige kop.','De kop heeft vier gelijke zijden en vier hoeken.'],
 ['De kop lijkt op een rond muntstuk.','De kop heeft één hoek minder dan een vierkant.','De kop is niet rond en heeft geen drie hoeken.'],
 ['Kies de sleutel zonder hoeken aan de kop.','De kop heeft drie rechte zijden.','Kies de sleutel met een vierkante opening in de kop.'],
 ['De opening in de kop is een cirkel.','De opening in de kop is een driehoek.','De opening in de kop heeft vier gelijke zijden.']
];
let doorAudio;
function magicSound(success){if(!soundOn)return;try{doorAudio||=new (window.AudioContext||window.webkitAudioContext)();doorAudio.resume();const now=doorAudio.currentTime;for(const [i,f] of (success?[523,659,784,1047]:[180,140]).entries()){const o=doorAudio.createOscillator(),g=doorAudio.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(doorAudio.destination);g.gain.setValueAtTime(0,now+i*.13);g.gain.linearRampToValueAtTime(.08,now+i*.13+.02);g.gain.exponentialRampToValueAtTime(.001,now+i*.13+.35);o.start(now+i*.13);o.stop(now+i*.13+.4);}}catch{}}
function doors(){busy=false;selected=null;if(round===0)rooms=0;doorTarget=Math.floor(Math.random()*3);keyTarget=Math.floor(Math.random()*3);
 shell(roomNames[rooms],[doorRiddles[rooms][doorTarget],keyRiddles[rooms][keyTarget]],'house');
 const goal=document.createElement('p');goal.className='house-goal';goal.textContent='Verzamel vijf toverlichtjes en vind de zilveren bel.';$('.notes h2').after(goal);
 const progress=document.createElement('div');progress.className='magic-progress';progress.setAttribute('aria-label',`${rooms} van 5 toverlichtjes`);progress.innerHTML=Array.from({length:5},(_,i)=>`<span class="${i<rooms?'lit':''}">✦</span>`).join('');$('.notes').append(progress);
 const sound=button(soundOn?'♫ Geluid aan':'♫ Geluid uit',()=>{soundOn=!soundOn;sound.textContent=soundOn?'♫ Geluid aan':'♫ Geluid uit';sound.setAttribute('aria-pressed',String(soundOn));if(soundOn)magicSound(true);},'house-sound');sound.setAttribute('aria-pressed',String(soundOn));$('.notes').append(sound);
 const hint=document.createElement('p');hint.className='inventory';hint.textContent='Lees beide aanwijzingen. Sleep de juiste sleutel naar de deur. Je kunt ook op de sleutel en daarna op de deur tikken.';$('.board').append(hint);readText+=' '+hint.textContent;
 const row=document.createElement('div');row.className='doors';for(const n of shuffle([0,1,2])){const b=button('',()=>openDoor(n),'door');b.dataset.door=n;b.setAttribute('aria-label','Deur met '+doorNames[n]);b.innerHTML=`<span class="door-beyond"><img src="images/toverhuis-spel/${residents[rooms][0]}.png" alt="" draggable="false"></span><span class="door-leaf"><span class="door-emblem">${emblem(n)}</span><span class="door-panels"></span><span class="door-lock">●</span></span>`;row.append(b);}$('.board').append(row);
 const bank=document.createElement('div');bank.className='bank';for(const n of shuffle([0,1,2])){const b=button('',()=>{if(busy)return;selected=n;for(const other of bank.children){other.classList.toggle('selected',other===b);other.setAttribute('aria-pressed',String(other===b));}feedback('Sleutel gekozen. Zoek nu de deur die bij de andere aanwijzing past.');},'piece key');b.setAttribute('aria-pressed','false');b.innerHTML=keyArt(n)+`<span>${keyNames[n]} sleutel</span>`;bank.append(b);}$('.board').append(bank);
 bindKeyDragging();$('#score').textContent='Kamer '+(rooms+1)+' / 5';feedback('Wie zou er achter de deur wonen?');
}
function bindKeyDragging(){
 doorDragCleanup?.();
 let active=null,ghost=null,over=null,suppressClick=false;
 const clear=()=>{if(active){active.button.classList.remove('key-dragging');if(active.button.hasPointerCapture(active.id))active.button.releasePointerCapture(active.id);}ghost?.remove();over?.classList.remove('key-over');active=null;ghost=null;over=null;};
 const buttons=[...document.querySelectorAll('.house .key')];
 const preventClick=e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}};
 for(const b of buttons){b.draggable=false;b.addEventListener('click',preventClick,true);
  b.onpointerdown=e=>{if(busy||!e.isPrimary||e.button!==0)return;clear();suppressClick=false;active={button:b,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId);};
  b.onpointermove=e=>{if(!active||active.id!==e.pointerId)return;if(!active.moved&&Math.hypot(e.clientX-active.x,e.clientY-active.y)<8)return;
   if(!active.moved){active.moved=true;b.click();b.classList.add('key-dragging');ghost=b.cloneNode(true);ghost.className='dragged-magic-key';ghost.removeAttribute('aria-pressed');ghost.setAttribute('aria-hidden','true');document.body.append(ghost);}
   ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.house .door');if(over!==target){over?.classList.remove('key-over');over=target;over?.classList.add('key-over');}
  };
  b.onpointerup=e=>{if(!active||active.id!==e.pointerId)return;const moved=active.moved,target=over;clear();if(moved){suppressClick=true;if(target&&!busy)openDoor(Number(target.dataset.door));else feedback('Sleep de sleutel tot boven een deur en laat daar los.');}};
  b.onpointercancel=()=>{suppressClick=true;clear();};
 }
 doorDragCleanup=()=>{clear();for(const b of buttons){b.onpointerdown=b.onpointermove=b.onpointerup=b.onpointercancel=null;b.removeEventListener('click',preventClick,true);}doorDragCleanup=null;};
}
function openDoor(n){if(busy)return;const door=document.querySelector(`[data-door="${n}"]`);if(selected===null){feedback('Kies eerst een sleutel. Lees welke vorm de kop moet hebben.');return;}
 if(n!==doorTarget||selected!==keyTarget){magicSound(false);door.classList.remove('rattle');void door.offsetWidth;door.classList.add('rattle');feedback('Het slot blijft dicht. Lees beide aanwijzingen nog eens: passen de sleutel én het teken op de deur?');return;}
 busy=true;door.classList.add('opening');magicSound(true);for(const b of document.querySelectorAll('.house .door,.house .key'))b.disabled=true;feedback('Klik… de deur gaat open!');const token=generation;
 setTimeout(()=>{if(token!==generation)return;const [asset,name,greeting]=residents[rooms];const meet=document.createElement('section');meet.className='resident-welcome';meet.setAttribute('aria-label','Ontmoeting met '+name);meet.innerHTML=`<div><small>Toverlichtje ${rooms+1} gevonden!</small><h2>${name}</h2><p>${greeting}</p></div>`;const next=button(rooms===4?'Laat de bel klinken!':'Naar de volgende kamer ›',()=>{rooms++;round++;if(rooms===5){magicSound(true);win('Ding! Je hebt alle vijf toverlichtjes verzameld. De zilveren bel klinkt en de uitgang is open!');}else doors();},'primary');meet.append(next);$('.house').append(meet);$('.house').classList.add('has-visitor');const lights=$('.magic-progress').children;lights[rooms].classList.add('lit');$('.magic-progress').setAttribute('aria-label',`${rooms+1} van 5 toverlichtjes`);readText=name+'. '+greeting;feedback('Een nieuwe vriend en een toverlichtje!');next.focus();},850);
}

window.addEventListener('hashchange',()=>location.reload());reset();
})();
