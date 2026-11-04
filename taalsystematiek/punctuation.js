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
const questionsByTheme={
 neutral:[
  ['open','Wat speel je het liefst op de speelplaats?','Ik bouw graag een parcours met hoepels.'],
  ['ja-nee','Heb je vandaag buiten gespeeld?','Ja.'],
  ['meerkeuze','Welke bal kies je voor het spel?','De rode bal.',['De rode bal','De blauwe bal']],
  ['kort','Waar berg je de bal na het spel op?','In de kast.']
 ],
 autumn:[
  ['open','Waarom wandel je graag in de herfst?','Ik hoor graag de bladeren onder mijn laarzen kraken.'],
  ['ja-nee','Heb je vandaag kastanjes geraapt?','Ja.'],
  ['meerkeuze','Wat leg je in je herfstmand?','Een eikel.',['Een eikel','Een steen']],
  ['kort','Welke kleur heeft dit rijpe herfstblad?','Oranje.']
 ],
 halloween:[
  ['open','Hoe zou jij een pompoen versieren voor Halloween?','Ik zou er grote ogen en een gekke mond in snijden.'],
  ['ja-nee','Draag je met Halloween een masker?','Ja.'],
  ['meerkeuze','Als wat verkleed jij je?','Als een spook.',['Als een spook','Als een heks']],
  ['kort','Welk dier maakt een web bij de pompoen?','Een spin.']
 ],
 christmas:[
  ['open','Hoe zou jij de kerstboom versieren?','Ik zou er zelfgemaakte sterren en lichtjes in hangen.'],
  ['ja-nee','Staat er een kerstboom in de klas?','Ja.'],
  ['meerkeuze','Wat hang je boven in de kerstboom?','Een ster.',['Een ster','Een strik']],
  ['kort','Wat gebruik je als neus voor de sneeuwman?','Een wortel.']
 ],
 saint:[
  ['open','Wat zou jij in een brief aan Sinterklaas schrijven?','Ik zou vertellen hoe ik thuis voor het paard een wortel klaarleg.'],
  ['ja-nee','Heb je je schoen klaargezet?','Ja.'],
  ['meerkeuze','Welk schoencadeautje kies je?','Een boek.',['Een boek','Een puzzel']],
  ['kort','Hoe heet de rode hoofdbedekking van Sinterklaas?','Een mijter.']
 ],
 forest:[
  ['open','Wat zou jij graag ontdekken tijdens een boswandeling?','Ik zou graag zien waar een eekhoorn zijn nootjes verstopt.'],
  ['ja-nee','Heb je ooit een specht in het bos gehoord?','Ja.'],
  ['meerkeuze','Welk pad kies je bij de splitsing?','Het pad naar de vijver.',['Het pad naar de vijver','Het pad naar de hut']],
  ['kort','Welk dier tikt met zijn snavel tegen een boom?','Een specht.']
 ]
};
const questionExamples={
 neutral:['staat je fiets?','Mijn fiets staat in de gang.','Waarom draag je een fietshelm?','Draag je een fietshelm?'],
 autumn:['liggen je laarzen?','Mijn laarzen liggen in de gang.','Waarom draag je laarzen in de herfst?','Draag je laarzen in de herfst?'],
 halloween:['staat je lantaarn?','Mijn lantaarn staat op de vensterbank.','Hoe versier je een lantaarn voor Halloween?','Maak jij een lantaarn voor Halloween?'],
 christmas:['hangt de kerstkrans?','De kerstkrans hangt aan de voordeur.','Hoe maak je een kerstkrans?','Hangt er bij jou een kerstkrans?'],
 saint:['ligt je verlanglijstje?','Mijn verlanglijstje ligt in mijn schoen.','Wat wil je op je verlanglijstje schrijven en waarom?','Heb je een verlanglijstje gemaakt?'],
 forest:['staat de hoge den?','De hoge den staat aan de rand van het bos.','Hoe herken je een den?','Zie je daar een den?']
};
const interrogativeWords=['Wie','Wat','Waar','Wanneer','Waarom','Hoe'];
const interrogativeTopics={
 neutral:[
  ['heeft de bal meegenomen?','Mila heeft de bal meegenomen.'],
  ['ligt er in de boekentas?','Er ligt een schrift in de boekentas.'],
  ['ligt de bal?','De bal ligt onder de bank.'],
  ['begint de speeltijd?','De speeltijd begint om tien uur.'],
  ['draag je een helm?','Ik draag een helm om mijn hoofd te beschermen.'],
  ['kom je naar school?','Ik kom met de fiets naar school.']
 ],
 autumn:[
  ['raapt de kastanjes?','Noor raapt de kastanjes.'],
  ['valt er uit de boom?','Er valt een blad uit de boom.'],
  ['liggen de eikels?','De eikels liggen naast het pad.'],
  ['gaan jullie bladeren zoeken?','We gaan na school bladeren zoeken.'],
  ['trek je je regenjas aan?','Ik trek mijn regenjas aan omdat het regent.'],
  ['verzamel je de kastanjes?','Ik stop de kastanjes in een mand.']
 ],
 halloween:[
  ['draagt het spokenpak?','Milan draagt het spokenpak.'],
  ['staat er aan de deur?','Er staat een pompoen aan de deur.'],
  ['ligt het masker?','Het masker ligt op de tafel.'],
  ['begint het griezelfeest?','Het griezelfeest begint vanavond.'],
  ['staat er een lampje in de pompoen?','Het lampje laat de ogen van de pompoen oplichten.'],
  ['maak jij een spinnenweb voor het raam?','Ik maak het web met witte draad.']
 ],
 christmas:[
  ['hangt de ster op?','Noor hangt de ster op.'],
  ['ligt er onder de kerstboom?','Er ligt een pakje onder de kerstboom.'],
  ['staat de sneeuwpop?','De sneeuwpop staat naast de voordeur.'],
  ['versieren jullie de kerstboom?','We versieren de kerstboom op zaterdag.'],
  ['doe je handschoenen aan?','Ik doe handschoenen aan omdat mijn vingers koud zijn.'],
  ['pak jij het cadeau in?','Ik vouw papier om het cadeau en strik er een lint omheen.']
 ],
 saint:[
  ['schrijft een brief aan Sinterklaas?','Lina schrijft een brief aan Sinterklaas.'],
  ['eet het paard?','Het paard eet een wortel.'],
  ['staat je schoen?','Mijn schoen staat bij de deur.'],
  ['zet je je schoen klaar?','Ik zet mijn schoen na het avondeten klaar.'],
  ['leg je een wortel in je schoen?','Ik leg een wortel in mijn schoen voor het paard.'],
  ['bezorgt Sint de pakjes in dit verhaal?','Sint bezorgt de pakjes met een grote boot.']
 ],
 forest:[
  ['wijst het spoor aan?','De boswachter wijst het spoor aan.'],
  ['vindt de eekhoorn?','De eekhoorn vindt een eikel.'],
  ['zit de specht?','De specht zit hoog in een boom.'],
  ['vertrekken jullie naar het bos?','We vertrekken morgenvroeg naar het bos.'],
  ['blijven jullie op het pad?','We blijven op het pad om de dieren niet te storen.'],
  ['springt de kikker in de vijver?','De kikker springt met een grote boog in het water.']
 ]
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
 const sentenceSign={statement:'.',question:'?',exclamation:'!'}[item.sentenceKind];
 const chosen=(sentenceSign&&item.type==='punct-write'?pools[sentenceSign]:deck).slice(0,item.count).map((q,i)=>({...q,key:'row-'+i})).filter(q=>!removed.has(q.key));
 const lines=(n=2)=>Array.from({length:n},()=>'<div class="write-line">'+SpellingSchrijflijnen.htmlCanvas(s.lineType,s.lineHeight,640)+'</div>').join('');
 const answer=(text,n=2)=>solutions?'<div class="answer">'+text+'</div>':lines(n);
 const block=(html,key)=>blocks.push('<div class="question-block"'+(key?' data-question-key="'+key+'"':'')+'>'+html+'</div>');
 let instruction='',hint='Een punt sluit een gewone mededelende zin af. Een vraagteken hoort bij een vraag. Een uitroepteken gebruik je als je iets roept of met veel gevoel zegt.',example=support?'Ik lees een boek. · Lees jij ook? · Pas op!':'';
 if(item.type==='punct-period-question'){
  instruction='Lees de zinnen. Schrijf een punt achter elke mededelende zin en een vraagteken achter elke vraagzin.';
  hint='Een mededelende zin vertelt iets. Een vraagzin vraagt iets.';
  const pairCount=Math.ceil(item.count/2);
  const mixed=G.shuffle([...pools['.'].slice(0,pairCount),...pools['?'].slice(0,Math.floor(item.count/2))],r);
  mixed.forEach((q,i)=>{
   const key='row-'+i;
   if(!removed.has(key))block('<p>'+esc(q.text)+' <span class="punct-box'+(solutions?' answer-mark':'')+'">'+(solutions?q.sign:'')+'</span></p>',key);
  });
 }
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
  instruction=(sentenceSign?'Schrijf bij elk woord een '+signs[sentenceSign].kind+'. ':'Schrijf bij elke opdracht een hele zin met het opgegeven woord. ')+(hard?'Kies het juiste leesteken.':'Gebruik het gevraagde leesteken.');
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
  instruction=sentenceSign?'Bekijk de prent. Schrijf een '+signs[sentenceSign].kind+'. Let op de hoofdletter en het leesteken.':'Bekijk de prent. Bedenk een mededelende zin, een vraagzin en een uitroepende zin. Let op de hoofdletter en het leesteken.';
  const scenes=G.shuffle(picturePool(item.articleTheme),r).slice(0,item.count);
  scenes.forEach((scene,i)=>{
   const examples={'.':scene.statement,'?':'Zie jij '+scene.article+' '+scene.word+' ook?','!':'Kijk, '+scene.statement[0].toLowerCase()+scene.statement.slice(1,-1)+'!'};
   taskRow('<img class="scene" src="'+esc(scene.image)+'" alt="'+esc(scene.name)+'">'+(sentenceSign?[sentenceSign]:Object.keys(labels)).map(sign=>'<p>'+labels[sign]+'</p>'+answer('Bijvoorbeeld: '+esc(examples[sign]),1)).join(''),i);
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
 if(item.type.startsWith('punct-interrogative-')){
  hint='Begin met een vraagwoord. Schrijf het werkwoord en de rest van de zin. Eindig met een vraagteken. Wie vraagt naar iemand, wat naar iets, waar naar een plaats, wanneer naar een tijd, waarom naar een reden en hoe naar een manier.';
  const [rest,response]=questionExamples[item.articleTheme]||questionExamples.neutral;
  if(item.type==='punct-interrogative-word')example='_____ '+rest+' (plaats) → Waar '+rest;
  if(item.type==='punct-interrogative-complete')example='Vraagwoord: Waar\nAntwoord: '+response+'\nPassende vraag: Waar '+rest;
  const themes=item.articleTheme==='all'?G.shuffle(Object.keys(interrogativeTopics),r):[interrogativeTopics[item.articleTheme]?item.articleTheme:'neutral'];
  const entries=interrogativeWords.map((word,i)=>{
   const [rest,response]=interrogativeTopics[themes[i%themes.length]][i];
   return {word,rest,response,clue:['persoon','ding','plaats','tijd','reden','manier'][i],question:word+' '+rest};
  });
  const rows=G.shuffle(entries,r).slice(0,item.count).map((q,i)=>({...q,key:'row-'+i})).filter(q=>!removed.has(q.key));
  if(item.type==='punct-interrogative-word'){
   instruction='Vul het vraagwoord in. Kies uit wie, wat, waar, wanneer, waarom en hoe.';
   rows.forEach(q=>block('<p>'+ (solutions?'<b class="marked">'+esc(q.word)+'</b>':'<span class="question-word-blank" aria-label="Vul het vraagwoord in">'+SpellingSchrijflijnen.htmlCanvas(s.lineType,s.lineHeight,150)+'</span>')+' '+esc(q.rest)+' <small class="question-word-clue">('+esc(q.clue)+')</small></p>',q.key));
  }
  if(item.type==='punct-interrogative-link'){
   instruction='Verbind elke vraag met het passende antwoord.';
   const right=G.shuffle(rows,r);
   if(right.length>1&&right.every((q,i)=>q===rows[i]))right.push(right.shift());
   if(rows.length)block('<div class="rhyme-match question-match'+(solutions?' match-solved':'')+'">'+rows.map((q,i)=>'<div class="rhyme-match-row" data-question-key="'+q.key+'"><span>'+esc(q.question)+' <b data-match-left="'+q.key+'">•</b></span><span><b data-match-right="'+right[i].key+'">•</b> '+esc(right[i].response)+'</span></div>').join('')+'</div>');
  }
  if(item.type==='punct-interrogative-complete'){
   instruction='Lees het antwoord. Schrijf een passende vraag. Begin met het gegeven vraagwoord.';
   rows.forEach(q=>block('<p><strong>'+esc(q.word)+'</strong> · '+esc(q.response)+'</p>'+answer('Bijvoorbeeld: '+esc(q.question),1),q.key));
  }
  if(item.type==='punct-interrogative-picture'){
   instruction='Bekijk de prent. Schrijf bij elk vraagwoord een vraag die bij de prent past.';
   const picture=G.shuffle(picturePool(item.articleTheme),r)[0],phrase=picture.article+' '+picture.word;
   const examples=['Wie ziet '+phrase+' het eerst?','Wat gebeurt er met '+phrase+'?','Waar zie je '+phrase+' op de prent?','Wanneer zou jij '+phrase+' kunnen zien?','Waarom is '+phrase+' hier belangrijk?','Hoe zou jij '+phrase+' beschrijven?'];
   block('<img class="scene" src="'+esc(picture.image)+'" alt="'+esc(picture.name)+'">');
   interrogativeWords.forEach((word,i)=>taskRow('<p><strong>'+word+'</strong></p>'+answer('Bijvoorbeeld: '+esc(examples[i]),1),i));
  }
 }
 if(item.type.startsWith('punct-question-')){
  hint='Een vraag begint met een hoofdletter en eindigt met een vraagteken. Bij een open vraag geef je een antwoord in je eigen woorden. Bij een gesloten vraag antwoord je kort, bijvoorbeeld met ja of nee, één woord of één keuze.';
  const [rest,response,openExample,closedExample]=questionExamples[item.articleTheme]||questionExamples.neutral;
  if(item.type==='punct-question-kind')example=openExample+' → open vraag.\n'+closedExample+' → gesloten vraag.';
  if(['punct-question-match','punct-question-write'].includes(item.type))example='Antwoord: '+response+'\nPassende vraag: Waar '+rest;
  const questionText=q=>q[1]+(q[3]?' A. '+q[3][0]+' · B. '+q[3][1]:'');
  const questionSets=item.articleTheme==='all'?Object.values(questionsByTheme):[questionsByTheme[item.articleTheme]||questionsByTheme.neutral];
  const shuffledSets=G.shuffle(questionSets,r);
  const rows=G.shuffle(shuffledSets[0],r).map((q,i)=>{
   const pool=shuffledSets[i%shuffledSets.length];
   return {q:pool.find(other=>other[0]===q[0]),pool};
  }).slice(0,item.count);
  if(item.type==='punct-question-match'){
   instruction='Lees het antwoord. Kruis de vraag aan die erbij past.';
   rows.forEach(({q,pool},i)=>{
    const alternatives=G.shuffle(pool.filter(other=>other!==q),r).slice(0,2);
    const options=G.shuffle([q,...alternatives],r);
    taskRow('<p><strong>Antwoord</strong> '+esc(q[2])+'</p>'+options.map(other=>'<p class="tell-choice"><span class="tick-box">'+(solutions&&other===q?'×':'')+'</span><span>'+esc(questionText(other))+'</span></p>').join(''),i);
   });
  }
  if(item.type==='punct-question-kind'){
   instruction='Lees de vraag. Omkring open vraag of gesloten vraag.';
   rows.forEach((q,i)=>{
    const options=['open vraag','gesloten vraag'].map((label,index)=>solutions&&(q[0]==='open')===(index===0)?'<b class="marked">'+label+'</b>':label);
    taskRow('<p>'+esc(questionText(q))+'</p><p>'+options.join(' / ')+'</p>',i);
   });
  }
  if(item.type==='punct-question-picture'){
   instruction='Bekijk de prent. Schrijf één open en één gesloten vraag. Gebruik het gegeven woord in beide vragen.';
   G.shuffle(picturePool(item.articleTheme),r).slice(0,item.count).forEach((p,i)=>{
    const phrase=p.article+' '+p.word;
    taskRow('<img class="scene" src="'+esc(p.image)+'" alt="'+esc(p.name)+'"><p><strong>Woord</strong> '+esc(p.word)+'</p><p>Open vraag</p>'+answer('Bijvoorbeeld: Wat gebeurt er met '+esc(phrase)+' op de prent?',1)+'<p>Gesloten vraag</p>'+answer('Bijvoorbeeld: Zie jij '+esc(phrase)+' op de prent?',1),i);
   });
  }
  if(item.type==='punct-question-write'){
   instruction='Lees het antwoord of de keuzes. Bedenk er een passende vraag bij. Eindig met een vraagteken.';
   rows.forEach((q,i)=>{
    const prompt=q[3]?'A. '+q[3][0]+' · B. '+q[3][1]:q[2];
    taskRow('<p><strong>'+(q[3]?'Keuzes':'Antwoord')+'</strong> '+esc(prompt)+'</p>'+answer('Bijvoorbeeld: '+esc(questionText(q)),1),i);
   });
  }
 }
 return{instruction,hint,example,blocks};
}
window.TaalPunctuation={model,data,signs,picturePool};
})();
