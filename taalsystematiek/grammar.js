(() => {
const dimin=[['de boom','boompje'],['de trap','trapje'],['de fles','flesje'],['het boek','boekje'],['het land','landje'],['het kasteel','kasteeltje'],['de bloem','bloempje'],['de stoel','stoeltje'],['de deur','deurtje'],['het raam','raampje'],['de school','schooltje'],['de fiets','fietsje'],['de muis','muisje'],['de tuin','tuintje'],['de jas','jasje'],['het huis','huisje']];
dimin.push(['de duim','duimpje'],['de pluim','pluimpje'],['de bezem','bezempje'],['de riem','riempje'],['de worm','wormpje'],['het scherm','schermpje'],['de bal','balletje'],['de bel','belletje'],['de man','mannetje'],['de pan','pannetje'],['de ster','sterretje'],['de kam','kammetje'],['de zon','zonnetje'],['de kom','kommetje']);
dimin.push(['de koning','koninkje','kje'],['de woning','woninkje','kje'],['de ketting','kettinkje','kje'],['de haring','harinkje','kje'],['de buiging','buiginkje','kje'],['de vertaling','vertalinkje','kje'],['de helling','hellinkje','kje'],['de schutting','schuttinkje','kje'],['de ring','ringetje']);
const endings=['je','tje','pje','etje','kje'],defaultEndings=['je','tje','pje'];
const normalizeEndings=value=>Array.isArray(value)?[...new Set(value.filter(x=>endings.includes(x)))]:[...defaultEndings];
const suffix=word=>['etje','pje','tje','je'].find(end=>word.endsWith(end));
const diminPool=value=>dimin.filter(([,word,ending])=>normalizeEndings(value).includes(ending||suffix(word)));

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
const synonyms=[
 ['blij','vrolijk','Mila is blij met haar cadeau.'],['boos','kwaad','De buurman is boos over het lawaai.'],['mooi','prachtig','De tekening is mooi.'],['lekker','heerlijk','De soep is lekker.'],['snel','vlug','Sam loopt snel naar huis.'],['langzaam','traag','De slak kruipt langzaam vooruit.'],['bang','angstig','Het kind kijkt bang naar de grote hond.'],['moe','vermoeid','Na de wandeling is oma moe.'],['praten','spreken','De kinderen praten over hun vakantie.'],['dikwijls','vaak','Ik speel dikwijls met mijn buurmeisje.'],['beginnen','starten','We beginnen met het spel.']
];
const types=[
 ['dimin-choice','Verkleinwoorden','Kies het verkleinwoord','support'],['dimin-write','Verkleinwoorden','Maak een verkleinwoord','basic'],['dimin-sentence','Verkleinwoorden','Gebruik een verkleinwoord in een zin','challenge'],
 ['syntax-steps','Onderwerp en persoonsvorm','Zoek met een ja-neevraag','support'],['syntax-mark','Onderwerp en persoonsvorm','Duid onderwerp en persoonsvorm aan','basic'],['syntax-question','Onderwerp en persoonsvorm','Maak een ja-neevraag','basic'],['syntax-text','Onderwerp en persoonsvorm','Zoek onderwerp en persoonsvorm in een tekst','challenge'],
 ['syn-match','Synoniemen','Verbind de synoniemen','support'],['syn-replace','Synoniemen','Vervang door een synoniem','basic'],['syn-sentence','Synoniemen','Schrijf met een synoniem','challenge']
].map(([id,topic,name,level])=>({id,topic,name,level,description:name}));
TaalData.types.push(...types);
const limits=Object.fromEntries(types.map(t=>[t.id,t.id==='syntax-text'?stories.length:t.id.startsWith('syntax-')?sentences.length:t.id.startsWith('dimin-')?dimin.length:synonyms.length]));
function model(item,s,solutions){
 const G=TaalGenerator,e=G.esc,r=G.rng(item.seed),removed=new Set(item.removed||[]),blocks=[];
 const lines=(n=1)=>Array.from({length:n},()=>'<div class="write-line">'+SpellingSchrijflijnen.htmlCanvas(s.lineType,s.lineHeight,640)+'</div>').join('');
 const answer=(text,n=1)=>solutions?'<div class="answer">'+text+'</div>':lines(n);
 const chosen=pool=>G.shuffle(pool,r).slice(0,item.count).map((value,i)=>({value,key:'row-'+i})).filter(x=>!removed.has(x.key));
 const add=(html,key)=>blocks.push('<div class="question-block"'+(key?' data-question-key="'+key+'"':'')+'>'+html+'</div>');
 const mark=(text,subject,verb)=>{const pattern=new RegExp('('+subject+'|\\b'+verb+'\\b)','gi');return text.split(pattern).map(w=>w.toLowerCase()===subject.toLowerCase()?'<u class="subject-answer">'+e(w)+'</u>':w.toLowerCase()===verb.toLowerCase()?'<b class="marked">'+e(w)+'</b>':e(w)).join('')};
 let instruction='',hint='',example='';
 if(item.type.startsWith('dimin-')){
  hint='Een verkleinwoord maakt iets klein. '+normalizeEndings(item.diminEndings).map(end=>({je:'-je: de boot → het bootje.',tje:'-tje: de steen → het steentje.',pje:'-pje: de duim → het duimpje.',etje:'-etje: de bal → het balletje.',kje:'-kje: de koning → het koninkje. De g valt weg.'}[end])).join(' ')+' Bij één verkleinwoord gebruik je het.';
  instruction=item.type==='dimin-choice'?'Omkring het juiste verkleinwoord.':item.type==='dimin-write'?'Maak van elk woord een verkleinwoord. Schrijf ook het lidwoord het.':'Maak een verkleinwoord en gebruik het in een volledige zin.';
  const selected=chosen(diminPool(item.diminEndings));
  if(item.type==='dimin-write')for(let i=0;i<selected.length;i+=2)add('<div class="dimin-pair">'+selected.slice(i,i+2).map(({value:[word,small],key})=>'<div class="grammar-word-row" data-question-key="'+key+'"><span>'+e(word)+' →</span><div>'+answer('het '+e(small))+'</div></div>').join('')+'</div>');
  else selected.forEach(({value:[word,small],key})=>{
   if(item.type==='dimin-choice'){const stem=word.split(' ').slice(1).join(' ');const choices=G.shuffle([small,stem+'s',stem],r);add('<p>'+e(word)+' → '+choices.map(w=>solutions&&w===small?'<b class="marked">het '+e(w)+'</b>':'het '+e(w)).join(' / ')+'</p>',key)}
   else add('<p>Gebruik het verkleinwoord van <b>'+e(word)+'</b> in een zin.</p>'+answer('Eigen volledige zin met <b>het '+e(small)+'</b>. Controleer de hoofdletter en het leesteken.',2),key);
  });
 }
 if(item.type.startsWith('syntax-')){
  hint='Maak een ja-neevraag van de zin. De persoonsvorm komt dan vooraan. Vraag: wie of wat doet iets of over wie of wat wordt iets gezegd? Dat is het onderwerp. Voorbeeld: De poes slaapt. → Slaapt de poes? Persoonsvorm: slaapt. Onderwerp: de poes.';
  instruction=item.type==='syntax-steps'?'Maak een ja-neevraag. Schrijf daarna de persoonsvorm en het volledige onderwerp op.':item.type==='syntax-question'?'Maak een ja-neevraag. Onderstreep in beide zinnen het volledige onderwerp en omkring de persoonsvorm.':'Onderstreep het volledige onderwerp en omkring de persoonsvorm in elke zin.';
  if(item.type==='syntax-text')chosen(stories).forEach(({value,key})=>add('<div class="grammar-story">'+value.map(([text,subject,verb])=>'<p>'+(solutions?mark(text,subject,verb):e(text))+'</p>').join('')+'</div>',key));
  else chosen(sentences).forEach(({value:[text,question,subject,verb],key})=>{
   if(item.type==='syntax-steps')add('<div class="grammar-card"><p>'+e(text)+'</p><span class="support-note">Zet het werkwoord vooraan om een ja-neevraag te maken. Zoek daarna over wie of wat iets wordt gezegd.</span>'+['Ja-neevraag','Persoonsvorm','Onderwerp'].map((label,i)=>'<div class="grammar-field"><span>'+label+':</span><div>'+answer(e([question,verb,subject][i]))+'</div></div>').join('')+'</div>',key);
   else add('<p>'+(solutions?mark(text,subject,verb):e(text))+'</p>'+(item.type==='syntax-question'?answer(mark(question,subject,verb),2):''),key);
  });
 }
 if(item.type.startsWith('syn-')){
  hint='Synoniemen zijn woorden met dezelfde of ongeveer dezelfde betekenis. Bijvoorbeeld: aardig en vriendelijk. Kies een woord dat in de zin past.';
  instruction=item.type==='syn-match'?'Verbind elk woord links met het synoniem rechts.':item.type==='syn-replace'?'Schrijf de zin opnieuw. Vervang het vetgedrukte woord door een synoniem.':'Bedenk een synoniem voor het gegeven woord. Schrijf daarna een zin met dat synoniem.';
  const selected=chosen(synonyms);
  if(item.type==='syn-match')for(let i=0;i<selected.length;i+=4){const group=selected.slice(i,i+4);let right=G.shuffle(group,r);if(right.length>1&&right.every((x,j)=>x===group[j]))right.push(right.shift());add('<div class="rhyme-match'+(solutions?' match-solved':'')+'">'+group.map((x,j)=>'<div class="rhyme-match-row" data-question-key="'+x.key+'"><span>'+e(x.value[0])+' <b data-match-left="'+x.key+'">•</b></span><span><b data-match-right="'+right[j].key+'">•</b> '+e(right[j].value[1])+'</span></div>').join('')+'</div>')}
  else selected.forEach(({value:[word,syn,text],key})=>add(item.type==='syn-replace'?'<p>'+e(text).replace(word,'<b>'+e(word)+'</b>')+'</p>'+answer('Bijvoorbeeld: '+e(text.replace(word,syn)),2):'<p>Woord: <b>'+e(word)+'</b></p><div class="grammar-field"><span>Synoniem:</span><div>'+answer('Bijvoorbeeld: '+e(syn))+'</div></div><p>Mijn zin:</p>'+answer('Eigen zin met bijvoorbeeld '+e(syn)+'. Andere passende synoniemen zijn ook juist.',2),key));
 }
 return {instruction,hint,example,blocks};
}
window.TaalGrammar={model,limits,types,dimin,diminPool,normalizeEndings,sentences,stories,synonyms};
})();
