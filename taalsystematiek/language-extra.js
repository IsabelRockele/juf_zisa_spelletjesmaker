(() => {
const pairs=[['kat','mat'],['kip','stip'],['huis','muis'],['maan','haan'],['boek','koek'],['vis','mis'],['boot','noot'],['peer','beer'],['tak','dak'],['ring','ding'],['bloem','zoem'],['zak','pak']];
const verses=[['Op de stoel slaapt onze kat.','Naast de stoel ligt een zachte mat.','kat','mat'],['In de wei loopt een witte kip.','Op haar veer zit een zwarte stip.','kip','stip'],['Ik loop naar ons kleine huis.','Bij de deur zit een grijze muis.','huis','muis'],['In de nacht schijnt de maan.','In de ochtend kraait de haan.','maan','haan'],['Op mijn schoot ligt een boek.','Naast mijn thee ligt een koek.','boek','koek'],['Op het water drijft een boot.','In mijn hand ligt een noot.','boot','noot'],['In de boom groeit een peer.','Onder de boom slaapt een beer.','peer','beer'],['Een vogel zit op een tak.','Hij vliegt daarna naar het dak.','tak','dak']];
const statements=[['De hond slaapt in zijn mand','.'],['Waar ligt jouw jas','?'],['Noor tekent een bloem','.'],['Wie wil er mee','?'],['Het paard eet gras','.'],['Is de soep al klaar','?'],['Oma leest een boek','.'],['Mag ik naast jou zitten','?'],['De bus stopt bij de school','.'],['Hoe heet jouw kat','?'],['De zon schijnt door het raam','.'],['Wanneer begint het spel','?']];
const starters=[['De kat','De kat slaapt op de mat.'],['Mijn vriend','Mijn vriend leest een boek.'],['In de klas','In de klas staat een kast.'],['De kip','De kip eet graan.'],['Onze juf','Onze juf tekent een huis.'],['In de tuin','In de tuin bloeit een bloem.'],['De muis','De muis eet een zaadje.'],['Op de tafel','Op de tafel ligt mijn schrift.']];
const wordSets=[['hond – mand','De hond ligt in de mand.'],['kind – bal','Het kind speelt met de bal.'],['juf – boek','De juf leest een boek.'],['vis – water','De vis zwemt in het water.'],['oma – fiets','Oma rijdt op haar fiets.'],['kip – ei','De kip legt een ei.'],['bloem – tuin','De bloem groeit in de tuin.'],['muis – kaas','De muis eet kaas.']];
function model(item,s,solutions){
const G=TaalGenerator,e=G.esc,r=G.rng(item.seed),support=item.level==='support',hard=item.level==='challenge',removed=new Set(item.removed||[]),blocks=[];
const line=(n=1)=>Array.from({length:n},()=>'<span class="write-line">'+SpellingSchrijflijnen.htmlCanvas(s.lineType,s.lineHeight,640)+'</span>').join('');
const answer=(text,n=2)=>solutions?'<div class="answer">'+e(text)+'</div>':line(n);
const rows=a=>G.shuffle(a,r).slice(0,item.count).map((value,i)=>({value,key:'row-'+i})).filter(x=>!removed.has(x.key));
const add=(html,key)=>{if(key&&removed.has(key))return;blocks.push('<div class="question-block"'+(key?' data-question-key="'+key+'"':'')+'>'+html+'</div>');};
let instruction='',hint='',example='';
const actions=TaalData.themedActions(item.articleTheme);
const rhymeThemes={
 autumn:[['Het regent op het herfstpad.','Mijn nieuwe laarzen worden nat.','herfstpad','nat'],['De wind blaast door mijn jas.','Mijn laars belandt midden in een plas.','jas','plas'],['Ik loop langs een kale boom.','De wind klinkt zacht als in een droom.','boom','droom'],['Onder het blad ligt een noot.','De eekhoorn vindt hem reuzegroot.','noot','reuzegroot']],
 halloween:[['Op straat zie ik een zwarte kat.','Ze loopt over het donkere pad.','kat','pad'],['De heks vliegt op een bezem door de lucht.','Daar gaat ze, met een grote zucht.','lucht','zucht'],['Ik zie een griezel voor het raam.','Hij roept ineens mijn naam.','raam','naam'],['We griezelen vannacht.','De pompoen geeft licht en lacht.','vannacht','lacht']],
 christmas:[['Aan de tak hangt een kerstbal.','Ik vang hem als hij vallen zal.','kerstbal','zal'],['We zingen bij de kerstboom een lied.','Mijn kleine zusje kent het niet.','lied','niet'],['Aan het pak zit een strik.','Voor wie is het pak, denk ik?','strik','ik'],['In de sneeuw ligt een den.','Ik weet precies waar ik ben.','den','ben']],
 saint:[['Bij de deur staat mijn schoen.','Ik zal er snel een wortel in doen.','schoen','doen'],['Sint brengt een pak.','Het komt uit de grote zak.','pak','zak'],['Het paard stapt op het dak.','Ik hoor een hoef, vlak bij de schoorsteen, krak.','dak','krak'],['Op zijn hoofd staat een mijter van goud.','De Sint heeft het buiten koud.','goud','koud']],
 forest:[['Een vogel landt op een tak.','Onder mijn voet klinkt krak.','tak','krak'],['Onder de den ligt een noot.','Voor de muis is die te groot.','noot','groot'],['De boswachter loopt op het pad.','Door de regen is het nat.','pad','nat'],['We blijven staan bij een den.','Ik vraag me af waar ik ben.','den','ben']]
};
const rhymeVerses=TaalData.themePool(rhymeThemes,item.articleTheme,verses);
const rhymePairs=rhymeVerses===verses?pairs:rhymeVerses.map(v=>v.slice(2));
const themedStatements=actions.flatMap(a=>[[a.text.slice(0,-1),'.'],[a.question.slice(0,-1),'?']]);
const themedStarters=actions.map(a=>[a.subject,a.text]);
const themedWordSets=actions.map(a=>[[a.subject,a.verb,a.rest,a.particle].filter(Boolean).join(' – '),a.text]);
if(item.type.startsWith('tell-')){
hint='Een mededelende zin vertelt iets. Begin met een hoofdletter en sluit af met een punt.';example=support?'Bijvoorbeeld: Mijn zus tekent een ster.':'';
if(item.type==='tell-recognize') {instruction='Kruis de mededelende zinnen aan: de zinnen die iets vertellen.';rows(actions.length?themedStatements:statements).forEach(({value:[text,sign],key})=>add('<p class="tell-choice"><span class="tick-box">'+(solutions&&sign==='.'?'×':'')+'</span><span>'+e(text)+sign+'</span></p>'+(hard?'<p class="support-note">Maak van deze zin ook '+(sign==='.'?'een vraag.':'een mededelende zin.')+'</p>'+answer('Eigen passende zin met hoofdletter en '+(sign==='.'?'vraagteken.':'punt.')):''),key));}
if(item.type==='tell-complete'){instruction='Maak een mededelende zin. Begin met de gegeven woorden.';rows(actions.length?themedStarters:starters).forEach(({value:[start,solution],key})=>add('<p>Begin met: <b>'+e(start)+'</b></p>'+(support?'<p class="support-note">Maak af met: '+e(solution.slice(start.length).trim())+'</p>':'')+answer('Bijvoorbeeld: '+solution)+(hard?'<p class="support-note">Vertel ook waar of wanneer het gebeurt.</p>':''),key));}
if(item.type==='tell-words'){
 instruction='Zet de woorden of woordgroepen in een goede volgorde. Schrijf een mededelende zin. Je mag woorden toevoegen.';
 rows(actions.length?themedWordSets:wordSets).forEach(({value:[words,solution],key})=>{
  const parts=words.split(' – ');
  const shuffled=G.shuffle(parts,r);
  if(shuffled.every((part,i)=>part===parts[i]))shuffled.push(shuffled.shift());
  add('<p><b>'+shuffled.map(e).join(' – ')+'</b></p>'+answer('Bijvoorbeeld: '+solution)+(hard?'<p class="support-note">Maak je zin langer met waar of wanneer.</p>':''),key);
 });
}
if(item.type==='tell-picture'){instruction='Schrijf bij elke prent een mededelende zin.'+(hard?' Vertel ook waar of wanneer.':'');rows(actions.length?TaalPunctuation.picturePool(item.articleTheme):TaalData.nouns.filter(n=>n.image)).forEach(({value:n,key})=>add('<div class="picture-sentence"><img src="'+e(n.image)+'" alt="'+e(n.word)+'"><div class="sentence-space">'+(support?'<p class="support-note">Begin met: '+e(n.article+' '+n.word)+'</p>':'')+answer('Bijvoorbeeld: '+(n.statement||('Op de prent zie ik '+n.article+' '+n.word+'.')))+'</div></div>',key));}
}else{
hint='Rijmwoorden klinken aan het einde hetzelfde. Luister naar de klanken: kat en mat rijmen.';
if(item.type==='rhyme-match'||item.type==='rhyme-color'){
 const selected=rows(rhymePairs);instruction=item.type==='rhyme-match'?'Verbind elk woord links met het rijmwoord rechts.':'Geef woorden die rijmen dezelfde kleur. Gebruik voor elk paar een andere kleur.';
 for(let i=0;i<selected.length;i+=(support?2:4)){const group=selected.slice(i,i+(support?2:4)),right=G.shuffle(group,r);if(right.length>1&&right.every((x,j)=>x===group[j]))right.push(right.shift());
 if(item.type==='rhyme-match')add('<div class="rhyme-match'+(solutions?' match-solved':'')+'">'+group.map((x,j)=>'<div class="rhyme-match-row" data-question-key="'+x.key+'"><span>'+e(x.value[0])+' <b data-match-left="'+x.key+'">•</b></span><span><b data-match-right="'+right[j].key+'">•</b> '+e(right[j].value[1])+'</span></div>').join('')+'</div>');
 else add('<div class="rhyme-words">'+G.shuffle(group.flatMap(x=>x.value.map(w=>({w,key:x.key}))),r).map(x=>'<span data-question-key="'+x.key+'">'+e(x.w)+'</span>').join('')+'</div>'+(solutions?'<div class="answer">'+group.map(x=>x.value.map(e).join(' – ')).join(' / ')+'</div>':''));
 }
 if(hard)add('<p>Bedenk zelf nog twee woorden die rijmen.</p>'+answer('Eigen rijmpaar.',1),'row-100');
}
if(item.type==='rhyme-find'||item.type==='rhyme-fill'){
 instruction=item.type==='rhyme-find'?'Lees elk tekstje. Omkring de twee woorden die rijmen.':'Omkring het laatste woord van de eerste zin. Vul de tweede zin aan met een passend rijmwoord.';
 rows(rhymeVerses).forEach(({value:[a,b,x,y],key})=>{const marked=(text,word)=>solutions?e(text.slice(0,-word.length-1))+'<strong class="marked">'+e(word)+'</strong>.':e(text);
 add((support&&item.type==='rhyme-fill'?'<p class="support-note">Kies uit: '+G.shuffle([y,'stoel','regen'].filter((v,i,arr)=>arr.indexOf(v)===i),r).map(e).join(' · ')+'</p>':'')+'<p>'+marked(a,x)+'</p><p>'+ (item.type==='rhyme-find'?marked(b,y):e(b.slice(0,-y.length-1))+(solutions?'<b class="answer">'+e(y)+'</b>':'<span class="rhyme-gap">'+line()+'</span>')+'.')+'</p>'+(hard?'<p>Schrijf zelf nog een zin die hierop rijmt.</p>'+answer('Eigen rijmzin. Controleer of het laatste woord rijmt op '+x+'.'):''),key);});
}
if(item.type==='rhyme-write'){instruction='Schrijf twee zinnen die rijmen. Eindig de eerste zin met het eerste woord en de tweede met het rijmwoord.';rows(rhymePairs).forEach(({value:[a,b],key})=>add('<p><b>'+e(a+' – '+b)+'</b></p>'+(support?'<p class="support-note">Begin bijvoorbeeld met: Ik zie… of Daar is…</p>':'')+answer('Eigen zinnen met eindwoorden '+a+' en '+b+'.',2)+(hard?'<p class="support-note">Laat de twee zinnen samen een klein verhaaltje vertellen.</p>':''),key));}
}
return{instruction,hint,example,blocks};
}
window.TaalLanguageExtra={model,pairs,verses,statements};
})();
