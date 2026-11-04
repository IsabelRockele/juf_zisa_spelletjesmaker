(() => {
const dimin=[['de boom','boompje'],['de trap','trapje'],['de fles','flesje'],['het boek','boekje'],['het land','landje'],['het kasteel','kasteeltje'],['de bloem','bloempje'],['de stoel','stoeltje'],['de deur','deurtje'],['het raam','raampje'],['de school','schooltje'],['de fiets','fietsje'],['de muis','muisje'],['de tuin','tuintje'],['de jas','jasje'],['het huis','huisje']];
dimin.push(['de duim','duimpje'],['de pluim','pluimpje'],['de bezem','bezempje'],['de riem','riempje'],['de worm','wormpje'],['het scherm','schermpje'],['de bal','balletje'],['de bel','belletje'],['de man','mannetje'],['de pan','pannetje'],['de ster','sterretje'],['de kam','kammetje'],['de zon','zonnetje'],['de kom','kommetje']);
dimin.push(['de koning','koninkje','kje'],['de woning','woninkje','kje'],['de ketting','kettinkje','kje'],['de haring','harinkje','kje'],['de buiging','buiginkje','kje'],['de vertaling','vertalinkje','kje'],['de helling','hellinkje','kje'],['de schutting','schuttinkje','kje'],['de ring','ringetje']);
const endings=['je','tje','pje','etje','kje'],defaultEndings=['je','tje','pje'];
const normalizeEndings=value=>Array.isArray(value)?[...new Set(value.filter(x=>endings.includes(x)))]:[...defaultEndings];
const suffix=word=>['etje','pje','tje','je'].find(end=>word.endsWith(end));
const diminPool=(value,theme)=>{
 const nouns=TaalData.themedNouns(theme).filter(n=>n.dimin&&n.dimin!==n.word);
 const themed=nouns.map(n=>[n.article+' '+n.word,n.dimin]);
 const pool=theme==='all'?[...dimin,...themed]:themed.length?themed:dimin;
 return pool.filter(([,word,ending])=>normalizeEndings(value).includes(ending||suffix(word)));
};

// Zelfgeschreven zinnen met expliciete oplossingen, ook bij omgekeerde woordvolgorde.
const sentences=[
 ['De hond slaapt op de mat.','Slaapt de hond op de mat?','de hond','slaapt'],
 ['Mila leest een spannend boek.','Leest Mila een spannend boek?','Mila','leest'],
 ['In de tuin groeit een hoge boom.','Groeit in de tuin een hoge boom?','een hoge boom','groeit'],
 ['De kinderen spelen op het plein.','Spelen de kinderen op het plein?','de kinderen','spelen'],
 ['Vandaag bakt oma een taart.','Bakt oma vandaag een taart?','oma','bakt'],
 ['De rode bus stopt bij de school.','Stopt de rode bus bij de school?','de rode bus','stopt'],
 ['Naast het huis staat een fiets.','Staat naast het huis een fiets?','een fiets','staat'],
 ['Noor en Sam bouwen een hut.','Bouwen Noor en Sam een hut?','Noor en Sam','bouwen'],
 ['Mijn kleine broer tekent een draak.','Tekent mijn kleine broer een draak?','mijn kleine broer','tekent'],
 ['Na de speeltijd drinken de leerlingen water.','Drinken de leerlingen na de speeltijd water?','de leerlingen','drinken'],
 ['Op de tak zit een merel.','Zit op de tak een merel?','een merel','zit'],
 ['De juf draagt een groene tas.','Draagt de juf een groene tas?','de juf','draagt']
];
const stories=[
 [['Onze klas bezoekt de boerderij.','onze klas','bezoekt'],['Bij het hek staat een geit.','een geit','staat'],['De boer geeft de dieren eten.','de boer','geeft'],['Daarna eten wij onze boterhammen.','wij','eten']],
 [['Mila viert haar verjaardag.','Mila','viert'],['Op de tafel staat een taart.','een taart','staat'],['Haar vrienden zingen een lied.','haar vrienden','zingen'],['Na het eten spelen de kinderen buiten.','de kinderen','spelen']],
 [['Sam wandelt door het bos.','Sam','wandelt'],['Tussen de bomen loopt een ree.','een ree','loopt'],['Een eekhoorn verzamelt noten.','een eekhoorn','verzamelt'],['Bij de beek rust Sam even.','Sam','rust']]
];
// Alleen personen, zodat een wie-vraag bij elke zin natuurlijk past.
const subjectStories=[
 [['De juf opent de klasdeur.','Wie opent de klasdeur?','de juf'],['Bij het raam legt Mila haar boek.','Wie legt bij het raam haar boek?','Mila'],['Mijn beste vriend deelt de schriften uit.','Wie deelt de schriften uit?','mijn beste vriend'],['Daarna leest onze meester een verhaal.','Wie leest daarna een verhaal?','onze meester']],
 [['Oma bakt een appeltaart.','Wie bakt een appeltaart?','oma'],['In de keuken wast mijn grote broer de appels.','Wie wast in de keuken de appels?','mijn grote broer'],['Mijn zusje zet de borden klaar.','Wie zet de borden klaar?','mijn zusje'],['Na het eten ruimt papa de tafel af.','Wie ruimt na het eten de tafel af?','papa']],
 [['Onze buurvrouw wandelt naar het park.','Wie wandelt naar het park?','onze buurvrouw'],['Bij de vijver tekent Sam een eend.','Wie tekent bij de vijver een eend?','Sam'],['De man met de rode pet leest de krant.','Wie leest de krant?','de man met de rode pet'],['Op het gras speelt mijn kleine neef met een bal.','Wie speelt op het gras met een bal?','mijn kleine neef']]
];
const subjectSentences=subjectStories.flat();
const synonyms=[
 ['blij','vrolijk','Mila is blij met haar cadeau.'],['boos','kwaad','De buurman is boos over het lawaai.'],['mooi','prachtig','De tekening is mooi.'],['lekker','heerlijk','De soep is lekker.'],['snel','vlug','Sam loopt snel naar huis.'],['langzaam','traag','De slak kruipt langzaam vooruit.'],['bang','angstig','Het kind kijkt bang naar de grote hond.'],['moe','vermoeid','Na de wandeling is oma moe.'],['praten','spreken','De kinderen praten over hun vakantie.'],['dikwijls','vaak','Ik speel dikwijls met mijn buurmeisje.'],['beginnen','starten','We beginnen met het spel.']
];
const types=[
 ['dimin-choice','Verkleinwoorden','Kies het verkleinwoord','support'],['dimin-write','Verkleinwoorden','Maak een verkleinwoord','basic'],['dimin-sentence','Verkleinwoorden','Gebruik een verkleinwoord in een zin','challenge'],
 ['subject-who','Onderwerp en persoonsvorm','Onderwerp: beantwoord de wie-vraag','support'],['subject-ask','Onderwerp en persoonsvorm','Onderwerp: maak zelf de wie-vraag','basic'],['subject-text','Onderwerp en persoonsvorm','Onderwerp: zoek met wie-vragen in een tekst','challenge'],
 ['alphabet-gap','Alfabetiseren','Vul de ontbrekende letters in','support'],
 ['alphabet-neighbors','Alfabetiseren','Schrijf de letterburen','support'],
 ['alphabet-pair','Alfabetiseren','Welk woord komt eerst?','support'],
 ['alphabet-sort','Alfabetiseren','Sorteer op de eerste letter','basic'],
 ['alphabet-insert','Alfabetiseren','Welk woord past ertussen?','basic'],
 ['alphabet-error','Alfabetiseren','Zoek de fout in de alfabetische rij','challenge'],
 ['alphabet-second','Alfabetiseren','Sorteer op de tweede letter','challenge'],
 ['verb-words','Werkwoorden','Omkring het werkwoord tussen de woorden','support'],
 ['verb-find','Werkwoorden','Zoek het werkwoord in de zin','basic'],
 ['verb-choose','Werkwoorden','Kies het werkwoord dat past','basic'],
 ['verb-tense','Werkwoorden','Kleur het werkwoord: nu of vroeger','challenge'],
 ['syntax-yes-no','Onderwerp en persoonsvorm','Herken ja-neevragen en vind de persoonsvorm','support'],
 ['syntax-steps','Onderwerp en persoonsvorm','Zoek met een ja-neevraag','support'],['syntax-mark','Onderwerp en persoonsvorm','Duid onderwerp en persoonsvorm aan','basic'],['syntax-question','Onderwerp en persoonsvorm','Maak een ja-neevraag','basic'],['syntax-text','Onderwerp en persoonsvorm','Zoek onderwerp en persoonsvorm in een tekst','challenge'],
 ['syn-match','Synoniemen','Verbind de synoniemen','support'],['syn-replace','Synoniemen','Vervang door een synoniem','basic'],['syn-sentence','Synoniemen','Schrijf met een synoniem','challenge']
].map(([id,topic,name,level])=>({id,topic,name,level,description:name}));
TaalData.types.push(...types);
const limits=Object.fromEntries(types.map(t=>[t.id,t.id.startsWith('alphabet-')?12:t.id.startsWith('verb-')?8:t.id==='syntax-text'?stories.length:t.id.startsWith('syntax-')?sentences.length:t.id.startsWith('dimin-')?dimin.length:synonyms.length]));
Object.assign(limits,{'subject-who':subjectSentences.length,'subject-ask':subjectSentences.length,'subject-text':subjectStories.length});
const inversionByTheme={
 autumn:[['Onder de boom liggen kastanjes.','Liggen er kastanjes onder de boom?','kastanjes','liggen'],['Na de regen springt Noor in de plassen.','Springt Noor na de regen in de plassen?','Noor','springt']],
 halloween:[['Aan de deur hangt een papieren spook.','Hangt er een papieren spook aan de deur?','een papieren spook','hangt'],['Vanavond draagt Milan een masker.','Draagt Milan vanavond een masker?','Milan','draagt']],
 christmas:[['Onder de boom ligt een groot pak.','Ligt er een groot pak onder de boom?','een groot pak','ligt'],['Na school versiert Noor de kerstboom.','Versiert Noor na school de kerstboom?','Noor','versiert']],
 saint:[['Naast de schoen ligt een wortel.','Ligt er een wortel naast de schoen?','een wortel','ligt'],['Morgen schrijft Lina een brief aan Sinterklaas.','Schrijft Lina morgen een brief aan Sinterklaas?','Lina','schrijft']],
 forest:[['Hoog in de boom zit een specht.','Zit er hoog in de boom een specht?','een specht','zit'],['Bij het bospad ziet Milan een konijn.','Ziet Milan bij het bospad een konijn?','Milan','ziet']]
};
const practiceStories={
 autumn:[[['Noor wandelt met haar laarzen door het park.','Noor','wandelt'],['Onder een boom liggen veel kastanjes.','veel kastanjes','liggen'],['Noor stopt de grootste kastanje in haar jaszak.','Noor','stopt'],['Thuis toont ze haar vondst aan mama.','ze','toont']]],
 halloween:[[['Lina zet een pompoen aan de voordeur.','Lina','zet'],['In de pompoen brandt een klein lampje.','een klein lampje','brandt'],['Even later bellen twee verklede kinderen aan.','twee verklede kinderen','bellen'],['Lina geeft hun een handvol snoep.','Lina','geeft']]],
 christmas:[[['Milan en Noor versieren de kerstboom.','Milan en Noor','versieren'],['Aan de onderste tak hangt een rode bal.','een rode bal','hangt'],['Plots valt de bal op het tapijt.','de bal','valt'],['Noor hangt hem weer in de boom.','Noor','hangt']]],
 saint:[[['Lina zet haar schoen bij de deur.','Lina','zet'],['In de schoen ligt een wortel voor het paard.','een wortel','ligt'],['De volgende ochtend loopt Lina naar de deur.','Lina','loopt'],['Naast haar schoen staat een pakje.','een pakje','staat']]],
 forest:[[['Milan wandelt met zijn zus door het bos.','Milan','wandelt'],['Hoog in een boom klopt een specht op de stam.','een specht','klopt'],['De kinderen blijven even staan.','de kinderen','blijven'],['Even later vliegt de specht naar een andere boom.','de specht','vliegt']]]
};
const openQuestions={
 neutral:['Wat doe je graag op de speelplaats?','Waarom speel je graag buiten?','Hoe zou je een nieuw spel uitleggen?','Wat vind je leuk aan de klas?'],
 autumn:['Wat verzamel je graag in de herfst?','Waarom vallen de bladeren?','Hoe ziet het park er in de herfst uit?','Wat doe je graag als het regent?'],
 halloween:['Waarom kies je dat masker?','Hoe zou jij een pompoen versieren?','Wat vind je spannend aan Halloween?','Wat gebeurt er op het griezelfeest?'],
 christmas:['Hoe versier jij de kerstboom?','Wat zou je op een kerstkaart schrijven?','Waarom kies je die versiering?','Wat doe je graag in de kerstvakantie?'],
 saint:['Wat schrijf jij in een brief aan Sinterklaas?','Waarom zet je je schoen klaar?','Hoe zou jij het paard verzorgen?','Wat vind je leuk aan het sinterklaasfeest?'],
 forest:['Wat ontdek je graag in het bos?','Waarom klimt de eekhoorn in de boom?','Hoe herken je het spoor van een dier?','Wat hoor je tijdens een boswandeling?']
};
const verbExamples={
 neutral:[
  ['Mila','leest','las','een boek','blaft','boek','tafel'],
  ['De bal','rolt','rolde','over het plein','leest','plein','bal'],
  ['De hond','slaapt','sliep','in zijn mand','rekent','hond','mand'],
  ['De soep','is','was','warm','fietst','soep','pan'],
  ['De kamer','wordt','werd','donker','drinkt','kamer','lamp'],
  ['Sam','fietst','fietste','naar school','blaft','school','helm'],
  ['Noor','tekent','tekende','een boot','drinkt','boot','potlood'],
  ['Het kind','eet','at','een boterham','leest','brood','kind']
 ],
 autumn:[
  ['De eekhoorn','zoekt','zocht','een eikel','zingt','eikel','tak'],
  ['Een blad','valt','viel','van de boom','leest','blad','boom'],
  ['Noor','raapt','raapte','een kastanje op','proeft','kastanje','mand'],
  ['De plas','is','was','diep','danst','plas','laars'],
  ['Het park','wordt','werd','nat','eet','park','regenjas'],
  ['De wind','blaast','blies','de muts weg','drinkt','muts','wind'],
  ['Milan','springt','sprong','over de plas','schrijft','regen','plas'],
  ['De egel','schuilt','schuilde','onder de bladeren','fietst','egel','blad']
 ],
 halloween:[
  ['De spin','maakt','maakte','een web','drinkt','spin','web'],
  ['Milan','draagt','droeg','een masker','eet','masker','mantel'],
  ['De kaars','brandt','brandde','in de pompoen','schrijft','kaars','pompoen'],
  ['Het spokenpak','is','was','wit','fietst','spokenpak','lantaarn'],
  ['De straat','wordt','werd','donker','tekent','straat','schaduw'],
  ['Noor','vult','vulde','de zak met snoep','leest','zak','snoep'],
  ['De kat','springt','sprong','over de pompoen','bakt','kat','pompoen'],
  ['De heks','zoekt','zocht','haar bezem','drinkt','heks','bezem']
 ],
 christmas:[
  ['Noor','hangt','hing','een ster in de boom','leest','ster','boom'],
  ['De kerstbal','valt','viel','op het tapijt','drinkt','kerstbal','tapijt'],
  ['Milan','pakt','pakte','het cadeau uit','zingt','cadeau','papier'],
  ['De sneeuw','is','was','koud','leest','sneeuw','want'],
  ['De klas','wordt','werd','gezellig met de kerstlichtjes','schrijft','klas','kerstlichtje'],
  ['De hond','trekt','trok','aan het lint','bakt','hond','lint'],
  ['Lina','bakt','bakte','kerstkoekjes in de oven','tekent','koekje','oven'],
  ['Het rendier','loopt','liep','door de sneeuw','leest','rendier','sneeuw']
 ],
 saint:[
  ['Het paard','eet','at','een wortel','schrijft','paard','wortel'],
  ['Lina','schrijft','schreef','een brief aan Sinterklaas','drinkt','brief','papier'],
  ['De helper','tilt','tilde','de zware zak op','leest','zak','pakje'],
  ['De mijter','is','was','rood','rent','mijter','staf'],
  ['De schoen','wordt','werd','nat in de regen','danst','schoen','wortel'],
  ['Noor','zet','zette','haar schoen bij de deur','eet','deur','schoen'],
  ['Een pepernoot','rolt','rolde','onder de kast','schrijft','pepernoot','kast'],
  ['Sinterklaas','zwaait','zwaaide','naar de kinderen','drinkt','kind','mijter']
 ],
 forest:[
  ['Het konijn','springt','sprong','over een tak','schrijft','konijn','tak'],
  ['De specht','tikt','tikte','met zijn snavel op de stam','leest','specht','stam'],
  ['De eekhoorn','klimt','klom','in een hoge boom','bakt','eekhoorn','boom'],
  ['Het bospad','is','was','smal','drinkt','bospad','blad'],
  ['Het bos','wordt','werd','stil','fietst','bos','den'],
  ['De kikker','zwemt','zwom','in de vijver','leest','kikker','vijver'],
  ['De boswachter','vindt','vond','een spoor in de modder','drinkt','spoor','modder'],
  ['Milan','zoekt','zocht','een dennenappel onder de boom','zingt','dennenappel','boom']
 ]
};
const alphabetExtra={
 neutral:['beker blok brug','doos deur draad','kat kip koe','laars lepel lint','melk mier moer','sok sap surfplank'],
 autumn:['appel akker avond','blad beek bol','den draad doos','eikel emmer egel','paddenstoel pet pompoen','sjaal sloop spin'],
 halloween:['bezem bot bril','cape clown circus','deur dolk draak','ketel kip kraai','nacht neus noot','pak pompoen pruik'],
 christmas:['bal beker boom','doos den draad','geschenk glans goud','kaart kerstkaart klok','muts melk maan','slinger sneeuwpop ster'],
 saint:['brief boek beker','dak deur doos','geit goud griffel','koek ketel klomp','staf schip suiker','wortel wind want'],
 forest:['bos blad beek','den das dijk','egel eikel emmer','haas hert hond','kever kikker krab','regen riet rots']
};
const grammarExamples={
 neutral:['Noor','rent','rende','naar de bus'],
 autumn:['Lina','veegt','veegde','de bladeren bij elkaar'],
 halloween:['Sam','knipt','knipte','een spook uit papier'],
 christmas:['Noor','plakt','plakte','een ster op haar kerstkaart'],
 saint:['Mila','legt','legde','een tekening bij haar schoen'],
 forest:['Sam','luistert','luisterde','naar de vogels in het bos']
};
const alphabet='abcdefghijklmnopqrstuvwxyz';
const alphabetSecond={
 neutral:['bal boek bus','raam rekenrek ring','jas jojo juf','map mes muts','pan pen pot','tas tent trap'],
 autumn:['kastanje kegel korf','tak thermos trui','regen roest rugzak','laars licht loof','blad boom bui','mand mist muts'],
 halloween:['kaars ketel kostuum','masker mist monster','lamp licht lucht','snoep spook suikerspin','griezel gedaante gordijn','heks hoed huis'],
 christmas:['kaars kerstbal klok','pakje piek poeder','slee sneeuw ster','lichtje luik lamp','krans kerstboom koek','rendier rood ruit'],
 saint:['pakje pen piet','mantel mijter muts','schoen staf suiker','boot brief banket','koek kast klomp','lantaarn licht lont'],
 forest:['blad beek boswachter','den dier duizendpoot','tak tulp tonderzwam','mos mier muis','pad prent poel','eikel egel eekhoorn']
};
function model(item,s,solutions){
 const [exampleSubject,exampleVerb,examplePast,exampleRest]=grammarExamples[item.articleTheme]||grammarExamples.neutral;
 const exampleSentence=exampleSubject+' '+exampleVerb+' '+exampleRest+'.';
 const actions=TaalData.themedActions(item.articleTheme);
 const syntax=[
  ...actions.map(a=>[a.text,a.question,a.subject,a.verb]),
  ...TaalData.themePool(inversionByTheme,item.articleTheme)
 ];
 const subjects=actions.map(a=>[a.text,'Wie '+a.verb+' '+[a.rest,a.particle].filter(Boolean).join(' ')+'?',a.subject]);
 const storiesOf=rows=>Array.from({length:Math.ceil(rows.length/4)},(_,i)=>rows.slice(i*4,i*4+4));
 const G=TaalGenerator,e=G.esc,r=G.rng(item.seed),removed=new Set(item.removed||[]),blocks=[];
 const lines=(n=1)=>Array.from({length:n},()=>'<div class="write-line">'+SpellingSchrijflijnen.htmlCanvas(s.lineType,s.lineHeight,640)+'</div>').join('');
 const answer=(text,n=1)=>solutions?'<div class="answer">'+text+'</div>':lines(n);
 const chosen=pool=>G.shuffle(pool,r).slice(0,item.count).map((value,i)=>({value,key:'row-'+i})).filter(x=>!removed.has(x.key));
 const add=(html,key)=>blocks.push('<div class="question-block"'+(key?' data-question-key="'+key+'"':'')+'>'+html+'</div>');
 const mark=(text,subject,verb)=>{const pattern=new RegExp('(\\b'+subject+'\\b|\\b'+verb+'\\b)','gi');return text.split(pattern).map(w=>w.toLowerCase()===subject.toLowerCase()?'<u class="subject-answer">'+e(w)+'</u>':w.toLowerCase()===verb.toLowerCase()?'<b class="marked">'+e(w)+'</b>':e(w)).join('')};
 let instruction='',hint='',example='',exampleHtml='';
 if(item.type.startsWith('alphabet-')){
  const theme=item.articleTheme;
  const alphabetTopics=theme==='all'?[...Object.values(alphabetSecond).flat(),...Object.values(alphabetExtra).flat()]:[...(alphabetSecond[theme]||alphabetSecond.neutral),...(alphabetExtra[theme]||alphabetExtra.neutral)];
  const words=[...new Set([...TaalData.themedNouns(theme).map(n=>n.word),...alphabetTopics.flatMap(row=>row.split(' '))])];
  const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b,'nl'));
  const scramble=values=>{
   const shuffled=G.shuffle(values,r);
   if(shuffled.every((word,i)=>word===values[i]))shuffled.push(shuffled.shift());
   return shuffled;
  };
  const alphabetHelp='Alfabet\n'+[...alphabet.slice(0,13)].join('\u2002')+'\n'+[...alphabet.slice(13)].join('\u2002');
  const cards=[];
  const card=(html,key)=>cards.push('<div class="alphabet-card" data-question-key="'+key+'">'+html+'</div>');
  const gap=letter=>solutions?'<b class="marked">'+e(letter)+'</b>':'<span class="question-word-blank alphabet-letter">'+SpellingSchrijflijnen.htmlCanvas(s.lineType,s.lineHeight,46)+'</span>';
  const isLetterTask=['alphabet-gap','alphabet-neighbors'].includes(item.type);
  hint=isLetterTask?'Letters staan in een vaste volgorde. Zoek welke letter vlak vóór of vlak na een andere letter komt.':'Vergelijk de woorden letter voor letter, vanaf links. De letter die het eerst in het alfabet komt, bepaalt welk woord eerst staat.';
  const prompts={
   'alphabet-gap':'Vul de ontbrekende letters in. Schrijf één letter op elke lijn.',
   'alphabet-neighbors':'Schrijf links de vorige letter en rechts de volgende letter.',
   'alphabet-pair':'Kijk naar de eerste letter. Omkring het woord dat eerst komt in het alfabet.',
   'alphabet-sort':'Kleur de eerste letter geel. Schrijf de woorden in alfabetische volgorde.',
   'alphabet-insert':'Kies het woord dat op de lege plek past. De rij moet alfabetisch blijven.',
   'alphabet-error':'Zoek het woord dat op de verkeerde plaats staat. Schrijf de hele rij in alfabetische volgorde op de schrijflijn.',
   'alphabet-second':'Kleur de eerste letter geel en de tweede blauw. De eerste letter is gelijk. Gebruik de tweede letter om de woorden alfabetisch te sorteren.'
  };
  instruction=prompts[item.type];
  if(item.type==='alphabet-gap')example='Voorbeeld: a · ___ · c → schrijf b.';
  if(item.type==='alphabet-neighbors')example='Voorbeeld: ___ · d · ___ → schrijf c links en e rechts.';
  if(item.type==='alphabet-pair')example='Voorbeeld: zon / fiets → Omkring fiets. De f komt vóór de z.';
  if(item.type==='alphabet-sort')example='Voorbeeld: zon · fiets · appel → appel · fiets · zon.';
  if(item.type==='alphabet-insert')example='Voorbeeld: appel · ___ · zon (fiets / aap) → fiets past ertussen.';
  if(item.type==='alphabet-error'){
   const [prompt,correct]=item.alphabetErrorMode==='same'?['roos · raam · ring','raam · ring · roos']:item.alphabetErrorMode==='distinct'?['zon · appel · fiets · peer','appel · fiets · peer · zon']:['zon · appel · raam · roos','appel · raam · roos · zon'];
   example='Voorbeeld: '+prompt+'\nOp de schrijflijn: '+correct;
  }
  if(item.type==='alphabet-second')example='Voorbeeld: roos · ring · raam → raam · ring · roos. Vergelijk a, i en o.';
  const distinctStarts=()=>[...new Map(G.shuffle(words,r).map(word=>[word[0],word])).values()];
  const letterStarts=G.shuffle([...alphabet.slice(1,item.type==='alphabet-gap'?23:-1)],r);
  const correctOnLeft=['alphabet-pair','alphabet-insert'].includes(item.type)?Array.from({length:6},()=>G.shuffle([true,false],r)).flat():[];
  const secondGroups=G.shuffle(alphabetTopics,r).map(row=>{
   const group=row.split(' ');
   return [...new Map(group.map(word=>[word[1],word])).values()];
  }).filter(group=>group.length>1).slice(0,item.count);
  for(let i=0;i<(item.type==='alphabet-second'?secondGroups.length:item.count);i++){
   const key='row-'+i;
   if(removed.has(key))continue;
   const letterIndex=alphabet.indexOf(letterStarts[i%letterStarts.length]);
   if(item.type==='alphabet-gap'){
    const start=Math.min(letterIndex-1,21);
    const letters=[...alphabet.slice(start,start+5)];
    card('<div class="alphabet-letter-row">'+letters.map((letter,index)=>'<div class="alphabet-stop">'+(index===1||index===3?gap(letter):e(letter))+'</div>').join('')+'</div>',key);
   }else if(item.type==='alphabet-neighbors'){
    card('<div class="alphabet-letter-row alphabet-houses"><div class="alphabet-stop">'+gap(alphabet[letterIndex-1])+'</div><div class="alphabet-stop"><b>'+alphabet[letterIndex]+'</b></div><div class="alphabet-stop">'+gap(alphabet[letterIndex+1])+'</div></div>',key);
   }else if(item.type==='alphabet-pair'){
    const pair=sorted(distinctStarts().slice(0,2));
    const options=correctOnLeft[i]?pair:[...pair].reverse();
    card('<p>'+options.map(word=>solutions&&word===pair[0]?'<b class="marked">'+e(word)+'</b>':e(word)).join(' / ')+'</p>',key);
   }else if(item.type==='alphabet-insert'){
    const [outside,first,middle,last]=sorted(distinctStarts().slice(0,4));
    card('<p>'+e(first)+' · '+(solutions?'<b class="marked">'+e(middle)+'</b>':'<span class="alphabet-missing-word"></span>')+' · '+e(last)+'</p><p class="alphabet-choices"><small>Kies uit: '+(correctOnLeft[i]?[middle,outside]:[outside,middle]).map(word=>'<span>'+e(word)+'</span>').join(' / ')+'</small></p>',key);
   }else if(item.type==='alphabet-error'){
    const mode=item.alphabetErrorMode;
    const sameStart=secondGroups[i%secondGroups.length];
    const group=mode==='same'?sameStart:mode==='distinct'?distinctStarts().slice(0,4):[
     ...sameStart.slice(0,2),
     ...distinctStarts().filter(word=>word[0]!==sameStart[0][0]).slice(0,2)
    ];
    const correct=sorted(group);
    const misplaced=correct.length>2?(r()<0.5?correct[0]:correct.at(-1)):correct[0];
    const row=correct.filter(word=>word!==misplaced);
    if(misplaced===correct[0])row.push(misplaced);
    else row.unshift(misplaced);
    const prompt=row.map(word=>solutions&&word===misplaced?'<b class="marked">'+e(word)+'</b>':e(word)).join(' · ');
    add('<div class="alphabet-error-row"><p>'+prompt+'</p>'+answer(correct.map(e).join(' · '),1)+'</div>',key);
   }else{
    const group=sorted(item.type==='alphabet-second'?secondGroups[i]:distinctStarts().slice(0,Math.min(5,i+3)));
    card('<p>'+scramble(group).map(e).join(' · ')+'</p>'+answer(group.map(e).join('<br>'),group.length),key);
   }
  }
  if(item.alphabetHelp!=='write')example=alphabetHelp+'\n'+example;
  if(['alphabet-sort','alphabet-second'].includes(item.type)){
   const second=item.type==='alphabet-second';
   const colorLetters=word=>'<span class="alphabet-first-letter">'+e(word[0])+'</span>'+
    (second?'<span class="alphabet-second-letter">'+e(word[1])+'</span>':'')+e(word.slice(second?2:1));
   const words=second?['roos','ring','raam']:['zon','fiets','appel'];
   const colored=words.map(colorLetters).join(' · ');
   const before=example.slice(0,example.lastIndexOf('Voorbeeld:'));
   exampleHtml=e(before)+'Voorbeeld: '+colored+' → '+sorted(words).map(e).join(' · ')+'.';
  }
  if(item.alphabetHelp==='write'){
   const alphabetAnswer=[alphabet.slice(0,13),alphabet.slice(13)].map(row=>[...row].join(' · ')).join('<br>');
   exampleHtml='<div class="alphabet-write-help"><strong>Schrijf hier eerst het hele alfabet uit je hoofd.</strong>'+answer(alphabetAnswer,2)+'</div>'+(exampleHtml||e(example));
  }
  for(let i=0;i<cards.length;i+=2){
   add('<div class="alphabet-card-grid">'+cards.slice(i,i+2).join('')+'</div>');
  }

 }
 if(item.type.startsWith('verb-')){
  hint='Een werkwoord zegt wat iemand of iets doet, wat er gebeurt of hoe iets is. Ook zijn en worden zijn werkwoorden.';

  const theme=item.articleTheme;
  const pool=theme==='all'?Object.values(verbExamples).flat():verbExamples[theme]||verbExamples.neutral;
  const [,,,,other,nounA,nounB]=pool[0];
  const examples={
   'verb-words':nounA+' / '+examplePast+' / '+nounB+' → Omkring '+examplePast+'.',
   'verb-find':exampleSentence+' → Omkring '+exampleVerb+'.',
   'verb-choose':exampleSubject+' '+other+' / '+exampleVerb+' '+exampleRest+'. → Kies '+exampleVerb+'.',
   'verb-tense':'Nu: '+exampleSentence+' → Kleur '+exampleVerb+' blauw.\nVroeger: '+exampleSubject+' '+examplePast+' '+exampleRest+'. → Kleur '+examplePast+' rood.'
  };
  example=examples[item.type];
  const shuffled=G.shuffle(pool,r).slice(0,item.count);
  const pastFirst=r()<0.5;
  const highlighted=(word,css='marked')=>solutions?'<b class="'+css+'">'+e(word)+'</b>':e(word);
  const instructions={
   'verb-words':'Omkring in elke rij het werkwoord. Sommige werkwoorden staan in de verleden tijd.',
   'verb-find':'Lees de zinnen. Omkring in elke zin het werkwoord.',
   'verb-choose':'Omkring het werkwoord dat het best in de zin past.',
   'verb-tense':'Kleur het werkwoord blauw als het over nu gaat en rood als het over vroeger gaat.'
  };
  instruction=instructions[item.type];
  shuffled.forEach(([subject,present,past,rest,other,nounA,nounB],i)=>{
   const key='row-'+i;
   if(removed.has(key))return;
   const earlier=(i%2===0)===pastFirst;
   const verb=earlier?past:present;
   if(item.type==='verb-words'){
    const words=G.shuffle([verb,nounA,nounB],r);
    add('<p class="word-row">'+words.map(word=>word===verb?highlighted(word):e(word)).join(' / ')+'</p>',key);
   }else if(item.type==='verb-choose'){
    const choices=G.shuffle([present,other],r).map(word=>word===present?highlighted(word):e(word));
    add('<p>'+e(subject)+' '+choices.join(' / ')+' '+e(rest)+'.</p>',key);
   }else{
    const css=item.type==='verb-tense'?'verb-'+(earlier?'past':'present'):'marked';
    const tense=solutions&&item.type==='verb-tense'?' <small class="support-note">('+ (earlier?'verleden tijd':'tegenwoordige tijd')+')</small>':'';
    add('<p>'+e(subject)+' '+highlighted(verb,css)+' '+e(rest)+'.'+tense+'</p>',key);
   }
  });
 }
 if(item.type.startsWith('dimin-')){
  hint='Een verkleinwoord maakt iets klein. '+normalizeEndings(item.diminEndings).map(end=>({je:'-je: de boot → het bootje.',tje:'-tje: de steen → het steentje.',pje:'-pje: de duim → het duimpje.',etje:'-etje: de bal → het balletje.',kje:'-kje: de koning → het koninkje. De g valt weg.'}[end])).join(' ')+' Bij één verkleinwoord gebruik je het.';
  instruction=item.type==='dimin-choice'?'Omkring het juiste verkleinwoord.':item.type==='dimin-write'?'Maak van elk woord een verkleinwoord. Schrijf ook het lidwoord het.':'Maak een verkleinwoord en gebruik het in een volledige zin.';
  const selected=chosen(diminPool(item.diminEndings,item.articleTheme));
  if(item.type==='dimin-write')for(let i=0;i<selected.length;i+=2)add('<div class="dimin-pair">'+selected.slice(i,i+2).map(({value:[word,small],key})=>'<div class="grammar-word-row" data-question-key="'+key+'"><span>'+e(word)+' →</span><div>'+answer('het '+e(small))+'</div></div>').join('')+'</div>');
  else selected.forEach(({value:[word,small],key})=>{
   if(item.type==='dimin-choice'){const stem=word.split(' ').slice(1).join(' ');const choices=G.shuffle([small,stem+'s',stem],r);add('<p>'+e(word)+' → '+choices.map(w=>solutions&&w===small?'<b class="marked">het '+e(w)+'</b>':'het '+e(w)).join(' / ')+'</p>',key)}
   else add('<p>Gebruik het verkleinwoord van <b>'+e(word)+'</b> in een zin.</p>'+answer('Eigen volledige zin met <b>het '+e(small)+'</b>. Controleer de hoofdletter en het leesteken.',2),key);
  });
 }
 if(item.type.startsWith('subject-')){
  hint='Zoek over wie iets wordt gezegd. Maak een vraag die begint met Wie. Het volledige antwoord is het onderwerp. Voorbeeld: De nieuwe buurman fietst naar huis. → Wie fietst naar huis? → De nieuwe buurman. Bij dingen gebruik je een wat-vraag; hier oefenen we met personen.';
  instruction=item.type==='subject-who'?'Lees de zin en de wie-vraag. Schrijf het volledige onderwerp op.':item.type==='subject-ask'?'Lees de zin. Schrijf een passende wie-vraag en daarna het volledige onderwerp op.':'Lees de tekst. Stel bij elke zin in je hoofd een wie-vraag. Onderstreep het volledige onderwerp.';
  if(item.type==='subject-text')chosen(actions.length?storiesOf(subjects):subjectStories).forEach(({value,key})=>add('<div class="grammar-story">'+value.map(([text,question,subject])=>{const start=text.toLowerCase().indexOf(subject.toLowerCase());return '<p>'+(solutions?e(text.slice(0,start))+'<u class="subject-answer">'+e(text.slice(start,start+subject.length))+'</u>'+e(text.slice(start+subject.length)):e(text))+'</p>'+(solutions?'<div class="answer">'+e(question)+' → '+e(subject)+'</div>':'')}).join('')+'</div>',key));
  else chosen(actions.length?subjects:subjectSentences).forEach(({value:[text,question,subject],key})=>add('<div class="grammar-card"><p>'+e(text)+'</p>'+(item.type==='subject-who'?'<p>Wie-vraag: '+e(question)+'</p>':'<div class="grammar-field"><span>Wie-vraag:</span><div>'+answer(e(question))+'</div></div>')+'<div class="grammar-field"><span>Onderwerp:</span><div>'+answer(e(subject))+'</div></div></div>',key));
 }
 if(item.type.startsWith('syntax-')){
  hint='Maak een ja-neevraag van de zin. De persoonsvorm komt dan vooraan. Vraag: wie of wat doet iets of over wie of wat wordt iets gezegd? Dat is het onderwerp. Voorbeeld: De poes slaapt. → Slaapt de poes? Persoonsvorm: slaapt. Onderwerp: de poes.';
  instruction=item.type==='syntax-steps'?'Maak een ja-neevraag. Schrijf daarna de persoonsvorm en het volledige onderwerp op.':item.type==='syntax-question'?'Maak een ja-neevraag. Onderstreep in beide zinnen het volledige onderwerp en omkring de persoonsvorm.':'Onderstreep het volledige onderwerp en omkring de persoonsvorm in elke zin.';
  if(item.type==='syntax-yes-no'){
   instruction='Lees de vragen. Kruis de ja-neevragen aan. Omkring in die vragen de persoonsvorm.';
   const open=G.shuffle(TaalData.themePool(openQuestions,item.articleTheme,openQuestions.neutral),r);
   const yes=G.shuffle(syntax.length?syntax:sentences,r);
   const count=Math.min(item.count,yes.length+open.length);
   const yesCount=Math.min(yes.length,Math.max(Math.ceil(count/2),count-open.length));
   const questions=[...yes.slice(0,yesCount).map(([,question])=>({question,yes:true})),...open.slice(0,count-yesCount).map(question=>({question,yes:false}))];
   chosen(questions).forEach(({value:{question,yes},key})=>{
    const space=question.indexOf(' ');
    const text=solutions&&yes?'<b class="marked">'+e(question.slice(0,space))+'</b>'+e(question.slice(space)):e(question);
    add('<p class="tell-choice"><span class="tick-box">'+(solutions&&yes?'×':'')+'</span><span>'+text+'</span></p>',key);
   });
  }
  else if(item.type==='syntax-text')chosen(TaalData.themePool(practiceStories,item.articleTheme,stories)).forEach(({value,key})=>add('<div class="grammar-story">'+value.map(([text,subject,verb])=>'<p>'+(solutions?mark(text,subject,verb):e(text))+'</p>').join('')+'</div>',key));
  else chosen(actions.length?syntax:sentences).forEach(({value:[text,question,subject,verb],key})=>{
   if(item.type==='syntax-steps')add('<div class="grammar-card"><p>'+e(text)+'</p><span class="support-note">Zet het werkwoord vooraan om een ja-neevraag te maken. Zoek daarna over wie of wat iets wordt gezegd.</span>'+['Ja-neevraag','Persoonsvorm','Onderwerp'].map((label,i)=>'<div class="grammar-field"><span>'+label+':</span><div>'+answer(e([question,verb,subject][i]))+'</div></div>').join('')+'</div>',key);
   else add('<p>'+(solutions?mark(text,subject,verb):e(text))+'</p>'+(item.type==='syntax-question'?answer(mark(question,subject,verb),2):''),key);
  });
 }
 if(item.type.startsWith('syn-')){
  hint='Synoniemen zijn woorden met dezelfde of ongeveer dezelfde betekenis. Bijvoorbeeld: aardig en vriendelijk. Kies een woord dat in de zin past.';
  instruction=item.type==='syn-match'?'Verbind elk woord links met het synoniem rechts.':item.type==='syn-replace'?'Schrijf de zin opnieuw. Vervang het vetgedrukte woord door een synoniem.':'Bedenk een synoniem voor het gegeven woord. Schrijf daarna een zin met dat synoniem.';
  const alternatives={springt:'hupt',ziet:'bemerkt',kruipt:'sluipt',krijgt:'ontvangt',tekent:'schetst',tilt:'heft',pakt:'neemt',versiert:'tooit',ruikt:'snuffelt',eet:'proeft',vindt:'ontdekt',klimt:'klautert',hoort:'verneemt'};
  const themed=actions.filter(a=>!a.particle&&['ziet','krijgt','tekent','tilt','pakt','versiert','vindt','klimt','hoort','springt','kruipt','eet','ruikt'].includes(a.verb)).map(a=>[a.verb,alternatives[a.verb],a.text]);
  const selected=chosen(actions.length?themed:synonyms);
  if(item.type==='syn-match')for(let i=0;i<selected.length;i+=4){const group=selected.slice(i,i+4);let right=G.shuffle(group,r);if(right.length>1&&right.every((x,j)=>x===group[j]))right.push(right.shift());add('<div class="rhyme-match'+(solutions?' match-solved':'')+'">'+group.map((x,j)=>'<div class="rhyme-match-row" data-question-key="'+x.key+'"><span>'+e(x.value[0])+' <b data-match-left="'+x.key+'">•</b></span><span><b data-match-right="'+right[j].key+'">•</b> '+e(right[j].value[1])+'</span></div>').join('')+'</div>')}
  else selected.forEach(({value:[word,syn,text],key})=>add(item.type==='syn-replace'?'<p>'+e(text).replace(word,'<b>'+e(word)+'</b>')+'</p>'+answer('Bijvoorbeeld: '+e(text.replace(word,syn)),2):'<p>Woord: <b>'+e(word)+'</b></p><div class="grammar-field"><span>Synoniem:</span><div>'+answer('Bijvoorbeeld: '+e(syn))+'</div></div><p>Mijn zin:</p>'+answer('Eigen zin met bijvoorbeeld '+e(syn)+'. Andere passende synoniemen zijn ook juist.',2),key));
 }
 const hintStructure=item.type.startsWith('syntax-')?{steps:['Maak een ja-neevraag van de zin. Het eerste woord is de persoonsvorm.','Vraag over wie of wat iets wordt gezegd. Het volledige antwoord is het onderwerp.'],example:[['Zin',exampleSentence],['Ja-neevraag',exampleVerb[0].toUpperCase()+exampleVerb.slice(1)+' '+exampleSubject+' '+exampleRest+'?'],['Persoonsvorm',exampleVerb],['Onderwerp',exampleSubject]]}:item.type.startsWith('subject-')?{steps:['Zoek over wie iets wordt gezegd.','Maak een vraag die begint met Wie.','Het volledige antwoord is het onderwerp.'],example:[['Zin',exampleSentence],['Wie-vraag','Wie '+exampleVerb+' '+exampleRest+'?'],['Onderwerp',exampleSubject]],note:'Bij dingen gebruik je een wat-vraag. Hier oefenen we met personen.'}:null;
 return {instruction,hint,example,exampleHtml,blocks,hintStructure};
}
window.TaalGrammar={model,limits,types,dimin,diminPool,normalizeEndings,sentences,stories,synonyms,subjectSentences,subjectStories};
})();
