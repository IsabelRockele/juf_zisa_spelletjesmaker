/* Uitbreidbaar met nieuwe tekens. Alleen . ? ! zijn nu beschikbaar. */
(() => {
const signs={
'.':{name:'punt',article:'de',action:'vertellen',kind:'mededelende zin',purpose:'Je vertelt rustig iets.',stem:'Ik zie'},
'?':{name:'vraagteken',article:'het',action:'vragen',kind:'vraag',purpose:'Je stelt een vraag.',stem:'Waar is'},
'!':{name:'uitroepteken',article:'het',action:'roepen',kind:'uitroep',purpose:'Je roept luid of met veel gevoel.',stem:'Pas op voor'}
};
const data=[
['De poes ligt op de mat','.','De poes ligt'],['Mijn broer leest een boek','.','Mijn broer leest'],['We eten straks soep','.','We eten straks'],['In de tuin staat een boom','.','In de tuin staat'],['Oma bakt een taart','.','Oma bakt'],['Ik fiets naar school','.','Ik fiets naar'],
['Waar ligt mijn jas','?','Waar ligt'],['Mag ik buiten spelen','?','Mag ik'],['Wie klopt er op de deur','?','Wie klopt'],['Hoe heet jouw hond','?','Hoe heet'],['Wanneer komt oma','?','Wanneer komt'],['Heb jij een rode pen','?','Heb jij'],
['Pas op voor die fiets','!','Pas op voor','Je waarschuwt luid.'],['We hebben gewonnen','!','We hebben','Je juicht luid.'],['Blijf van het vuur af','!','Blijf van','Je waarschuwt luid.'],['Wat een mooie verrassing','!','Wat een','Je roept blij en verrast.'],['Stop met duwen','!','Stop met','Je roept luid dat iets moet stoppen.'],['Help mij','!','Help','Je roept dringend om hulp.']
].map(([text,sign,stem,purpose])=>({text,sign,stem,purpose:purpose||signs[sign].purpose}));
const pictures={
 neutral:['Op de speelplaats','Een toren van blokken valt om','Een hondje pikt een boterham','Spetteren in een plas'],
 autumn:['Een windvlaag in het park','Een vlieger zit vast in de boom','Een appel rolt de helling af','Kastanjes vallen uit een mand'],
 halloween:['Halloween aan de voordeur','Een kat springt tussen de pompoenen','Een grote pompoen rolt weg','Snoep valt uit een zak'],
 christmas:['De kerstboom versieren','Een hond trekt aan een cadeaulint','De neus van de sneeuwman valt','Een kerstkoekje glijdt van het bord'],
 saint:['Sinterklaas en zijn paard','Een spoor van pepernoten','Een pakje glijdt van de stapel','Een wortel voor het paard van Sint'],
 forest:['Een eekhoorn in het bos','Een konijn steekt het pad over','Een specht klopt op een boom','Een kikker springt in de vijver']
};
const pictureWords={
 neutral:['bal','toren','hond','plas'],
 autumn:['blad','vlieger','appel','mand'],
 halloween:['masker','kat','pompoen','zak'],
 christmas:['kerstboom','lint','sneeuwpop','koekje'],
 saint:['paard','schoen','pak','wortel'],
 forest:['eekhoorn','konijn','specht','kikker']
};
const hetWords=new Set(['blad','masker','lint','koekje','paard','pak','konijn']);
const pictureStatements={
 neutral:['De bal vliegt over de speelplaats.','De toren van blokken valt om.','De hond loopt weg met een boterham.','Een kind springt in de plas.'],
 autumn:['De wind blaast de muts weg.','De vlieger zit vast in de boom.','De appel rolt de helling af.','De kastanjes vallen uit de mand.'],
 halloween:['De kinderen vieren Halloween.','De kat springt tussen de pompoenen.','De pompoen rolt weg.','Het snoep valt uit de zak.'],
 christmas:['De kinderen versieren de kerstboom.','De hond trekt aan het lint.','De neus van de sneeuwman valt.','Een koekje glijdt van het bord.'],
 saint:['Het paard wil een wortel.','De kinderen vinden pepernoten bij de schoen.','Er glijdt een pak van de stapel.','Het paard steekt zijn hoofd over de staldeur.'],
 forest:['De eekhoorn springt naar een andere tak.','Het konijn steekt het pad over.','De specht klopt op de boom.','De kikker springt in de vijver.']
};
function picturePool(theme){
 const themes=theme==='all'?Object.keys(pictures):[Object.hasOwn(pictures,theme)?theme:'neutral'];
 return themes.flatMap(key=>pictures[key].map((name,index)=>({
  name,
  statement:pictureStatements[key][index],
  word:pictureWords[key][index],
  article:hetWords.has(pictureWords[key][index])?'het':'de',
  image:'assets/leestekens-'+key+(index?'-'+(index+1):'')+'.png'
 })));
}
const exclamationExamples={
 neutral:[['bal','Pas op voor de bal!'],['taart','Wat een mooie taart!'],['hond','Kijk, daar loopt de hond!'],['fiets','Kijk uit voor die fiets!']],
 autumn:[['plas','Pas op voor die plas!'],['regenjas','Wat een natte regenjas!'],['eikel','Kijk, daar valt een eikel!'],['pompoen','Wat een grote pompoen!']],
 halloween:[['spin','Help, daar zit een spin!'],['spook','Pas op voor het spook!'],['masker','Wat een eng masker!'],['pompoen','Kijk, de pompoen rolt weg!']],
 christmas:[['kerstbal','Pas op, de kerstbal valt!'],['kerstboom','Wat een mooie kerstboom!'],['ster','Kijk, daar schittert een ster!'],['pak','Wat een groot pak!']],
 saint:[['paard','Kijk, daar komt het paard!'],['pak','Wat een groot pak!'],['pepernoot','Pas op, daar rolt een pepernoot!'],['mijter','Kijk, de mijter waait weg!']],
 forest:[['tak','Pas op voor die tak!'],['eekhoorn','Kijk, daar springt een eekhoorn!'],['paddenstoel','Wat een grote paddenstoel!'],['konijn','Kijk, daar rent een konijn!']]
};
function model(item,s,solutions){
 const G=TaalGenerator,esc=G.esc,r=G.rng(item.seed),support=item.level==='support',hard=item.level==='challenge',removed=new Set(item.removed||[]),blocks=[];
 const actions=TaalData.themedActions(item.articleTheme);
 const themed=actions.flatMap(({text,question,subject})=>[
  {text:text.slice(0,-1),sign:'.',stem:subject,purpose:signs['.'].purpose},
  {text:question.slice(0,-1),sign:'?',stem:question.split(' ')[0],purpose:signs['?'].purpose},
  {text:'Kijk, '+text[0].toLowerCase()+text.slice(1,-1).replace(/^(noor|milan|lina|sinterklaas) /,name=>name[0].toUpperCase()+name.slice(1)),sign:'!',stem:'Kijk,',purpose:signs['!'].purpose}
 ]);
 const source=actions.length?(item.articleTheme==='all'?[...data,...themed]:themed):data;
 const pools=Object.fromEntries(Object.keys(signs).map(sign=>[sign,G.shuffle(source.filter(x=>x.sign===sign),r)]));
 const deck=[];for(let i=0;i<6;i++)for(const sign of G.shuffle(Object.keys(signs),r))deck.push(pools[sign][i]);
 const chosen=deck.slice(0,item.count).map((q,i)=>({...q,key:'row-'+i})).filter(q=>!removed.has(q.key));
 const lines=(n=2)=>Array.from({length:n},()=>'<div class="write-line">'+SpellingSchrijflijnen.htmlCanvas(s.lineType,s.lineHeight,640)+'</div>').join('');
 const answer=(text,n=2)=>solutions?'<div class="answer">'+text+'</div>':lines(n);
 const block=(html,key)=>blocks.push('<div class="question-block"'+(key?' data-question-key="'+key+'"':'')+'>'+html+'</div>');
 let instruction='',hint='Een punt sluit een gewone mededelende zin af. Een vraagteken hoort bij een vraag. Een uitroepteken gebruik je als je iets roept of met veel gevoel zegt.',example=support?'Ik lees een boek. · Lees jij ook? · Pas op!':'';
 if(item.type==='punct-find'){
  instruction='Omkring het leesteken aan het einde van elke zin.'+(hard?' Schrijf ernaast: vertellen, vragen of roepen.':'');
  chosen.forEach(q=>block('<div class="punct-find-row"><p>'+esc(q.text)+(solutions?'<b class="marked">'+q.sign+'</b>':q.sign)+'</p>'+(hard?'<div class="punct-reason">'+answer(esc(signs[q.sign].action),1)+'</div>':'')+'</div>',q.key));
 }
 if(item.type==='punct-fill'){
  instruction='Schrijf . ? of ! in het vakje. Let op wat de spreker wil doen.';
  for(let i=0;i<chosen.length;i+=2)block('<div class="punct-pair">'+chosen.slice(i,i+2).map(q=>'<div class="punct-item" data-question-key="'+q.key+'"><small class="support-note">'+esc(q.purpose)+(support?' Gebruik '+signs[q.sign].article+' '+esc(signs[q.sign].name)+'.':'')+'</small><p>'+esc(q.text)+' <span class="punct-box'+(solutions?' answer-mark':'')+'">'+(solutions?q.sign:'')+'</span></p></div>').join('')+'</div>');
  if(hard&&!removed.has('row-100'))block('<p>Maak van één mededelende zin hierboven een vraag. Schrijf de hele vraag op.</p>'+answer('Eigen vraag die bij een mededelende zin past. Controleer hoofdletter en vraagteken.'),'row-100');
 }
 if(item.type==='punct-complete'){
  instruction='Maak de zin af. Begin met de gegeven woorden en gebruik het aangegeven leesteken.';
  chosen.forEach(q=>block('<p class="sentence-prompt"><span>Begin met: <b>'+esc(q.stem)+'</b></span><span>Gebruik het leesteken: <b>'+q.sign+'</b></span></p>'+(support?'<p class="support-note">Maak af met: '+esc(q.text.slice(q.stem.length).trim())+'</p>':'')+answer('Bijvoorbeeld: '+esc(q.text)+q.sign)+(hard?'<p>Schrijf een andere zin met hetzelfde leesteken.</p>'+answer('Eigen andere zin met '+esc(signs[q.sign].name)+'.'):''),q.key));
 }
 if(item.type==='punct-write'){
  const words=G.shuffle(actions.length?TaalData.themedNouns(item.articleTheme).map(n=>n.word):['bal','hond','boek','fiets','taart','boom','kat','jas','bloem','trein','appel','deur'],r);
  instruction='Schrijf bij elke opdracht een hele zin met het opgegeven woord. '+(hard?'Kies het juiste leesteken.':'Gebruik het gevraagde leesteken.');
  const exclamations=G.shuffle(TaalData.themePool(exclamationExamples,item.articleTheme,exclamationExamples.neutral),r);
  let exclamationIndex=0;
  chosen.forEach((q,i)=>{
   const [word,sample]=q.sign==='!'?exclamations[exclamationIndex++%exclamations.length]:[words[i%words.length]];
   const noun=TaalData.themedNouns(item.articleTheme).find(n=>n.word===word);
   const phrase=(noun?.article||'de')+' '+word;
   const example=sample||(q.sign==='?'?'Zie jij '+phrase+' ook?':'Ik zie '+phrase+'.');
   const solution='Bijvoorbeeld: '+esc(example);
   block('<p>Schrijf een '+signs[q.sign].kind+' met het woord <b>'+esc(word)+'</b>.'+(hard?'':' Gebruik <b class="punct-cue">'+q.sign+'</b>')+'</p>'+(support?'<p class="support-note">Je kunt beginnen met: '+esc(q.sign==='!'?'Kijk, … / Wat een … / Pas op, …':signs[q.sign].stem)+'</p>':'')+answer(solution),q.key);
  });

 }

 const labels={'.':'Mededelende zin','?':'Vraagzin','!':'Uitroepende zin'};
 const taskRow=(html,i)=>{
  const key='row-'+i;
  if(!removed.has(key))block(html,key);
 };
 if(item.type==='punct-kind'){
  instruction='Schrijf M bij een mededelende zin, V bij een vraagzin en U bij een uitroepende zin.';
  const codes={'.':'M','?':'V','!':'U'};
  chosen.forEach(q=>block('<p><span class="punct-box">'+(solutions?codes[q.sign]:'')+'</span> '+esc(q.text)+q.sign+'</p>',q.key));
 }
 if(item.type==='punct-rewrite'){
  instruction='Lees de zinnen. Schrijf ze opnieuw en voeg telkens een punt, vraagteken of uitroepteken toe.';
  chosen.forEach(q=>block('<p>'+esc(q.text)+'</p>'+answer(esc(q.text)+q.sign,1),q.key));
 }
 if(item.type==='punct-sort'){
  instruction='Schrijf elke zin bij de juiste soort. Voeg het passende leesteken toe.';
  for(let i=0;i<Math.min(item.count,6);i++){
   const group=Object.values(pools).map(pool=>pool[i]);
   const prompt=G.shuffle([...group],r).map(q=>esc(q.text)).join(' · ');
   taskRow('<div class="word-bank">'+prompt+'</div>'+group.map(q=>'<p>'+labels[q.sign]+'</p>'+answer(esc(q.text)+q.sign,1)).join(''),i);
  }
 }
 if(item.type==='punct-picture'){
  instruction='Bekijk de prent. Bedenk een mededelende zin, een vraagzin en een uitroepende zin. Let op de hoofdletter en het leesteken.';
  const scenes=G.shuffle(picturePool(item.articleTheme),r).slice(0,item.count);
  scenes.forEach((scene,i)=>{
   const examples={'.':scene.statement,'?':'Zie jij '+scene.article+' '+scene.word+' ook?','!':'Kijk, '+scene.statement[0].toLowerCase()+scene.statement.slice(1,-1)+'!'};
   taskRow('<img class="scene" src="'+esc(scene.image)+'" alt="'+esc(scene.name)+'">'+Object.keys(labels).map(sign=>'<p>'+labels[sign]+'</p>'+answer('Bijvoorbeeld: '+esc(examples[sign]),1)).join(''),i);
  });
 }
 if(item.type==='punct-transform'){
  instruction='Maak van elke mededelende zin een vraagzin en van elke vraagzin een mededelende zin. Verander de woordvolgorde en kies het juiste leesteken.';
  const pairs=[
   ['Jij eet graag pannenkoeken.','Eet jij graag pannenkoeken?'],
   ['Mila bakt vandaag koekjes.','Bakt Mila vandaag koekjes?'],
   ['De soep staat op tafel.','Staat de soep op tafel?'],
   ['Jullie drinken water bij het eten.','Drinken jullie water bij het eten?'],
   ['Opa maakt frietjes.','Maakt opa frietjes?'],
   ['De winkel verkoopt verse wafels.','Verkoopt de winkel verse wafels?'],
   ['Wij nemen fruit mee.','Nemen wij fruit mee?'],
   ['De kinderen proeven de taart.','Proeven de kinderen de taart?']
  ];
  G.shuffle(actions.length?actions.map(a=>[a.text,a.question]):pairs,r).slice(0,item.count).forEach((pair,i)=>{
   const from=i%2;
   taskRow('<p>'+esc(pair[from])+'</p>'+answer(esc(pair[1-from]),1),i);
  });
 }
 return{instruction,hint,example,blocks};
}
window.TaalPunctuation={model,data,signs,picturePool};
})();
