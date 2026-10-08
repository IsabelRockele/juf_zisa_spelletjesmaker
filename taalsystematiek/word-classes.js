(() => {
// Expliciete annotaties: EN is een eigennaam en telt bij woordsoorten als ZN.
const sentences=[
 'Noor|EN draagt een|LW warme|BN jas|ZN .',
 'De|LW kleine|BN hond|ZN slaapt op het|LW zachte|BN kussen|ZN .',
 'Sam|EN plukt een|LW rode|BN appel|ZN in de|LW grote|BN tuin|ZN .',
 'In Gent|EN staat een|LW oude|BN toren|ZN .',
 'De|LW vrolijke|BN kinderen|ZN spelen met een|LW gele|BN bal|ZN .',
 'Mila|EN leest het|LW spannende|BN boek|ZN .',
 'Een|LW bruine|BN eekhoorn|ZN zoekt verse|BN noten|ZN .',
 'Omar|EN fietst langs het|LW brede|BN kanaal|ZN .',
 'De|LW vriendelijke|BN bakker|ZN verkoopt warme|BN broodjes|ZN .',
 'Lina|EN woont in Brugge|EN naast een|LW drukke|BN straat|ZN .',
 'Op de|LW ronde|BN tafel|ZN staat een|LW blauwe|BN vaas|ZN .',
 'Mijn jonge|BN broer|ZN geeft Minoes|EN een|LW zachte|BN mand|ZN .'
];
const phrases=[['de','rode','jas','warme'],['het','kleine','huis','mooie'],['de','lange','straat','drukke'],['het','spannende','boek','dikke'],['de','zachte','mand','grote'],['de','rijpe','peer','zoete'],['het','ronde','bord','witte'],['de','vrolijke','jongen','vriendelijke'],['de','hoge','boom','oude'],['het','koude','water','heldere'],['de','mooie','bloem','gele'],['het','snelle','paard','bruine']];
const expansions=[
 ['De hond ligt in de mand.','De kleine hond ligt in de zachte mand.'],
 ['Het kind leest een boek.','Het vrolijke kind leest een spannend boek.'],
 ['De juf draagt een tas.','De vriendelijke juf draagt een rode tas.'],
 ['De vogel zit op een tak.','De kleine vogel zit op een dunne tak.'],
 ['Een fiets staat naast het huis.','Een groene fiets staat naast het oude huis.'],
 ['De kat slaapt op het kussen.','De zwarte kat slaapt op het zachte kussen.'],
 ['De bakker verkoopt broodjes.','De vriendelijke bakker verkoopt verse broodjes.'],
 ['De jongen eet een appel.','De kleine jongen eet een sappige appel.']
];
const stories=[
 ['Noor|EN maakt een|LW lekkere|BN soep|ZN .','Ze snijdt verse|BN groenten|ZN .','De|LW warme|BN soep|ZN gaat in een|LW diepe|BN kom|ZN .'],
 ['Omar|EN loopt door het|LW stille|BN bos|ZN .','Een|LW kleine|BN vogel|ZN zit op een|LW hoge|BN tak|ZN .','Op de|LW vochtige|BN grond|ZN liggen bruine|BN bladeren|ZN .'],
 ['Lina|EN speelt in de|LW grote|BN tuin|ZN .','Ze gooit een|LW blauwe|BN bal|ZN naar de|LW jonge|BN hond|ZN .','Het|LW vrolijke|BN dier|ZN rent over het|LW groene|BN gras|ZN .']
];
const guidedStories=[
 ['De|LW citroen|ZN heeft een|LW gele|BN schil|ZN .','Het|LW sap|ZN is zuur|BN .','Binnenin zitten kleine|BN pitten|ZN .'],
 ['Een|LW wortel|ZN groeit in de|LW losse|BN aarde|ZN .','De|LW wortel|ZN is oranje|BN en stevig|BN .','Boven de|LW grond|ZN staan groene|BN bladeren|ZN .'],
 ['De|LW peer|ZN hangt aan een|LW dunne|BN tak|ZN .','De|LW schil|ZN is glad|BN .','Het|LW vruchtvlees|ZN is zacht|BN en sappig|BN .'],
 ['Een|LW egel|ZN heeft scherpe|BN stekels|ZN .','Zijn kleine|BN neus|ZN is vochtig|BN .','Het|LW dier|ZN zoekt een|LW rustige|BN plek|ZN .']
];
const pictureWords=[['de','bal','ronde'],['de','bloem','mooie'],['het','boek','spannende'],['de','deur','hoge'],['het','huis','mooie'],['de','kat','lieve'],['de','kip','kleine'],['de','muis','kleine'],['het','paard','sterke'],['de','pen','mooie'],['het','schaap','zachte'],['de','stoel','stevige'],['de','tas','handige'],['de','vis','kleine']];
const matches=[['de citroen','zuur'],['de suiker','zoet'],['het ijs','koud'],['de steen','hard'],['de spons','zacht'],['de veer','licht'],['de olifant','zwaar'],['de slak','traag'],['het vuur','heet'],['de banaan','krom'],['de spiegel','glad'],['de egel','stekelig']];
const types=[
 ['adj-guided','Bijvoeglijke naamwoorden','Zoek BN met onderstreepte ZN als hulp','support'],
 ['adj-pictures','Bijvoeglijke naamwoorden','Schrijf een BN bij een prent','basic'],
 ['adj-guided-expand','Bijvoeglijke naamwoorden','Vul aan bij de onderstreepte woorden','basic'],
 ['adj-match','Bijvoeglijke naamwoorden','Verbind met een passend BN','support'],
 ['adj-find','Bijvoeglijke naamwoorden','Zoek het bijvoeglijk naamwoord','support'],
 ['adj-replace','Bijvoeglijke naamwoorden','Kies een ander bijvoeglijk naamwoord','basic'],
 ['adj-add','Bijvoeglijke naamwoorden','Voeg een bijvoeglijk naamwoord toe','basic'],
 ['adj-text','Bijvoeglijke naamwoorden','Zoek bijvoeglijke naamwoorden in een tekst','basic'],
 ['adj-expand','Bijvoeglijke naamwoorden','Maak de zinnen rijker','challenge'],
 ['classes-color','Woordsoorten samen','Kleur LW, ZN en BN','basic'],
 ['classes-label','Woordsoorten samen','Noteer LW, ZN en BN','basic'],
 ['proper-find','Eigennamen','Herken eigennamen','support'],
 ['proper-sort','Eigennamen','Eigennamen en soortnamen','basic']
].map(([id,topic,name,level])=>({id,topic,name,level,description:name}));
TaalData.types.push(...types);
const limits=Object.fromEntries(types.map(t=>[t.id,t.id==='adj-guided'?guidedStories.length:t.id==='adj-pictures'?pictureWords.length:t.id==='adj-guided-expand'?expansions.length:t.id==='adj-match'?matches.length:t.id==='adj-text'?stories.length:t.id==='adj-expand'?expansions.length:t.id.startsWith('adj-')?phrases.length:sentences.length]));
const tokens=text=>text.split(' ').map(token=>{const [word,kind='']=token.split('|');return{word,kind}});
function model(item,s,solutions){
 const G=TaalGenerator,e=G.esc,r=G.rng(item.seed),blocks=[],removed=new Set(item.removed||[]);
 const chosen=pool=>G.shuffle(pool,r).slice(0,item.count).map((value,i)=>({value,key:'row-'+i})).filter(x=>!removed.has(x.key));
 const answer=(text,n=1)=>solutions?'<div class="answer">'+text+'</div>':Array.from({length:n},()=>'<div class="write-line">'+SpellingSchrijflijnen.htmlCanvas(s.lineType,s.lineHeight,640)+'</div>').join('');
 const add=(html,key)=>blocks.push('<div class="question-block"'+(key?' data-question-key="'+key+'"':'')+'>'+html+'</div>');
 const sentence=(text,mode)=>tokens(text).map(({word,kind})=>{
  const cls=kind==='EN'?'ZN':kind;
  if(mode==='label')return '<span class="word-tag"><span>'+e(word)+'</span><span class="word-tag-space">'+(solutions&&cls?cls:'&nbsp;')+'</span></span>';
  if(mode==='guided'&&kind==='ZN')return '<u class="subject-answer">'+e(word)+'</u>';
  if(solutions&&((mode==='guided'&&kind==='BN')||(mode==='adj'&&kind==='BN')||(mode==='proper'&&kind==='EN')))return '<b class="marked">'+e(word)+'</b>';
  if(solutions&&mode==='color'&&cls)return '<b class="word-color word-color-'+cls+'">'+e(word)+'</b>';
  return e(word);
 }).join(' ').replace(/ ([.,!?])/g,'$1');
 let instruction='',hint='',example='';
 if(item.type.startsWith('adj-')){
  hint='Een bijvoeglijk naamwoord (BN) vertelt hoe iemand of iets is. Het zegt iets over een zelfstandig naamwoord (ZN). In de zachte trui is zachte het BN en trui het ZN.';
  if(item.type==='adj-guided'){instruction='Lees het tekstje. De zelfstandige naamwoorden zijn onderstreept. Markeer de bijvoeglijke naamwoorden die erbij horen.';chosen(guidedStories).forEach(({value,key})=>add('<div class="grammar-story">'+value.map(t=>'<p>'+sentence(t,'guided')+'</p>').join('')+'</div>',key))}
  if(item.type==='adj-pictures'){instruction='Schrijf bij elke prent een passend bijvoeglijk naamwoord met het lidwoord en het zelfstandig naamwoord.';const selected=chosen(pictureWords);for(let i=0;i<selected.length;i+=2)add('<div class="dimin-pair">'+selected.slice(i,i+2).map(({value:[article,noun,adj],key})=>'<div class="adj-picture" data-question-key="'+key+'"><img src="assets/'+noun+'.png" alt="'+e(noun)+'"><p>'+e(article+' '+noun)+'</p>'+answer('Bijvoorbeeld: '+e(article+' '+adj+' '+noun)+'. Andere passende antwoorden zijn ook juist.')+'</div>').join('')+'</div>')}
  if(item.type==='adj-guided-expand'){instruction='Lees de onderstreepte zelfstandige naamwoorden. Schrijf elke zin opnieuw en voeg bij elk onderstreept woord een passend bijvoeglijk naamwoord toe.';chosen(expansions).forEach(({value:[text,solution],key})=>{const prompt=e(text).replace(/(De|de|Het|het|Een|een) (\w+)/g,(_,article,noun)=>article+' <u class="subject-answer">'+noun+'</u>').replace('verkoopt broodjes','verkoopt <u class="subject-answer">broodjes</u>');add('<p>'+prompt+'</p>'+answer('Bijvoorbeeld: '+e(solution)+' Andere passende antwoorden zijn ook juist.',2),key)})}
  if(item.type==='adj-match'){instruction='Verbind elk zelfstandig naamwoord met een passend bijvoeglijk naamwoord. Gebruik elk woord rechts één keer. Soms zijn meerdere oplossingen mogelijk.';const selected=chosen(matches);for(let i=0;i<selected.length;i+=4){const group=selected.slice(i,i+4),right=G.shuffle(group,r);if(right.length>1&&right.every((x,j)=>x===group[j]))right.push(right.shift());add('<div class="rhyme-match'+(solutions?' match-solved':'')+'">'+group.map((x,j)=>'<div class="rhyme-match-row" data-question-key="'+x.key+'"><span>'+e(x.value[0])+' <b data-match-left="'+x.key+'">•</b></span><span><b data-match-right="'+right[j].key+'">•</b> '+e(right[j].value[1])+'</span></div>').join('')+'</div>'+(solutions?'<p class="answer">Voorbeeldoplossing. Andere passende verbindingen zijn ook juist.</p>':''))}}
  if(item.type==='adj-find'){instruction='Omkring het bijvoeglijk naamwoord in elke woordgroep.';example='Vraag jezelf af: hoe is de persoon, het dier of het ding?';chosen(phrases).forEach(({value:[article,adj,noun],key})=>add('<p>'+e(article)+' '+(solutions?'<b class="marked">'+e(adj)+'</b>':e(adj))+' '+e(noun)+'</p>',key))}
  if(item.type==='adj-replace'||item.type==='adj-add'){
   instruction=item.type==='adj-replace'?'Schrijf de woordgroep opnieuw met een ander bijvoeglijk naamwoord.':'Voeg een passend bijvoeglijk naamwoord toe en schrijf de volledige woordgroep.';
   const selected=chosen(phrases);for(let i=0;i<selected.length;i+=2)add('<div class="dimin-pair">'+selected.slice(i,i+2).map(({value:[article,adj,noun,other],key})=>'<div data-question-key="'+key+'"><p>'+e(article)+' '+(item.type==='adj-replace'?'<b>'+e(adj)+'</b> ':'')+e(noun)+'</p>'+answer('Bijvoorbeeld: '+e(article+' '+other+' '+noun))+'</div>').join('')+'</div>');
  }
  if(item.type==='adj-text'){instruction='Lees elk tekstje. Markeer alle bijvoeglijke naamwoorden.';chosen(stories).forEach(({value,key})=>add('<div class="grammar-story">'+value.map(t=>'<p>'+sentence(t,'adj')+'</p>').join('')+'</div>',key))}
  if(item.type==='adj-expand'){instruction='Schrijf elke zin opnieuw. Voeg minstens twee passende bijvoeglijke naamwoorden toe.';chosen(expansions).forEach(({value:[text,solution],key})=>add('<p>'+e(text)+'</p>'+answer('Bijvoorbeeld: '+e(solution)+' Andere passende bijvoeglijke naamwoorden zijn ook juist.',2),key))}
 }
 if(item.type.startsWith('classes-')){
  hint='LW = lidwoord: de, het, een. ZN = zelfstandig naamwoord: een persoon, dier, ding of naam. BN = bijvoeglijk naamwoord: het zegt hoe iemand of iets is. Een eigennaam, zoals Noor of Gent, telt ook als ZN. Niet elk woord is een LW, ZN of BN.';
  instruction=item.type==='classes-color'?'Kleur de lidwoorden blauw, de zelfstandige naamwoorden groen en de bijvoeglijke naamwoorden oranje. Eigennamen krijgen ook groen.':'Schrijf LW onder de lidwoorden, ZN onder de zelfstandige naamwoorden en BN onder de bijvoeglijke naamwoorden. Schrijf bij eigennamen ook ZN. Laat de andere plaatsen leeg.';
  if(item.type==='classes-color')add('<div class="word-legend"><span class="word-color word-color-LW">LW · blauw</span><span class="word-color word-color-ZN">ZN · groen</span><span class="word-color word-color-BN">BN · oranje</span></div>');
  chosen(sentences).forEach(({value,key})=>add('<p class="'+(item.type==='classes-label'?'tagged-sentence':'')+'">'+sentence(value,item.type==='classes-label'?'label':'color')+'</p>',key));
 }
 if(item.type.startsWith('proper-')){
  hint='Een eigennaam is een zelfstandig naamwoord dat een specifieke persoon, dier of plaats noemt: Noor, Minoes, Gent. Je schrijft een eigennaam met een hoofdletter. Soortnamen zoals meisje, kat en stad zijn ook zelfstandige naamwoorden. Een hoofdletter aan het begin van een zin maakt een woord nog geen eigennaam.';
  instruction=item.type==='proper-find'?'Omkring de eigennamen. Niet elke zin bevat een eigennaam. Let op: niet elk woord met een hoofdletter is een eigennaam.':'Schrijf de eigennamen en de soortnamen uit elke zin op de juiste lijn. Noteer de zelfstandige naamwoorden zonder lidwoord.';
  chosen(sentences).forEach(({value,key})=>{const ts=tokens(value);add('<p>'+sentence(value,item.type==='proper-find'?'proper':'plain')+'</p>'+(item.type==='proper-sort'?['EN','ZN'].map(kind=>'<div class="grammar-field"><span>'+(kind==='EN'?'Eigennamen':'Soortnamen')+':</span><div>'+answer(ts.filter(t=>t.kind===kind).map(t=>e(t.word)).join(', ')||'Geen.')+'</div></div>').join(''):''),key)});
 }
 return{instruction,hint,example,blocks};
}
window.TaalWordClasses={model,limits,types,tokens,sentences,phrases,stories};
})();
