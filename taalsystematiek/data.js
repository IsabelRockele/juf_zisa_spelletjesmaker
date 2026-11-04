(() => {
const nouns=[
['mand','de','manden','ding',null],['tuin','de','tuinen','ding',null],['vaas','de','vazen','ding',null],['wortel','de','wortels','ding',null],['koek','de','koeken','ding',null],['bal','de','ballen','ding','mkm-a'],['kat','de','katten','dier','mkm-a'],['tas','de','tassen','ding','mkm-a'],['pen','de','pennen','ding','mkm-e'],['kip','de','kippen','dier','mkm-i'],['vis','de','vissen','dier','mkm-i'],['boek','het','boeken','ding','tw-oe'],['huis','het','huizen','ding','tw-ui'],['muis','de','muizen','dier','tw-ui'],['deur','de','deuren','ding','tw-eu'],['stoel','de','stoelen','ding','tw-oe'],['bloem','de','bloemen','ding','tw-oe'],['raam','het','ramen','ding','lk-aa'],['schaap','het','schapen','dier','sch-woorden'],['paard','het','paarden','dier','lk-aa'],['konijn','het','konijnen','dier',null],['kind','het','kinderen','persoon',null],['juf','de','juffen','persoon',null],['bakker','de','bakkers','persoon',null],['meester','de','meesters','persoon',null],['jongen','de','jongens','persoon',null],['meisje','het','meisjes','persoon',null],['tafel','de','tafels','ding',null],['bord','het','borden','ding',null],['bed','het','bedden','ding','mkm-e'],['appel','de','appels','ding',null],['fiets','de','fietsen','ding',null],['hond','de','honden','dier',null],['boom','de','bomen','ding',null],['bank','de','banken','ding',null],['rugzak','de','rugzakken','ding',null]
].map(([word,article,plural,group,folder])=>({word,article,plural,group,image:folder&&!['raam','bed'].includes(word)?`assets/${word}.png`:null}));
const sentences=[
{t:'De kat slaapt op het bed.',n:['kat','bed']}, {t:'Een kind leest een boek.',n:['kind','boek']}, {t:'De juf zet de tas op de stoel.',n:['juf','tas','stoel']}, {t:'Het paard staat bij de boom.',n:['paard','boom']}, {t:'De bakker draagt een mand.',n:['bakker','mand']}, {t:'Een muis zit onder de tafel.',n:['muis','tafel']}, {t:'Het meisje geeft de hond een koek.',n:['meisje','hond','koek']}, {t:'De meester opent het raam.',n:['meester','raam']}, {t:'De jongen tekent een vis.',n:['jongen','vis']}, {t:'Een kip loopt door de tuin.',n:['kip','tuin']}, {t:'De bloem staat in een vaas.',n:['bloem','vaas']}, {t:'Het konijn eet een wortel.',n:['konijn','wortel']}
];
const capitals=['Lina woont in Brugge.','Milan speelt met Noor.','Op maandag gaat Sam naar school.','Mijn hond heet Bas.','In Gent woont mijn oma.','Yara leest een boek.','We fietsen op zondag naar Leuven.','Omar en Emma bouwen een hut.','In België regent het vandaag.','Fien geeft Rayan een appel.','De kat van Lotte heet Minoes.','Op vrijdag komt Jules op bezoek.'];
const types=[
{id:'article-word',topic:'Lidwoorden',name:'Kies de of het',description:'Vul het juiste lidwoord in bij een woord.'},
{id:'article-change',topic:'Lidwoorden',name:'Van een naar de of het',description:'Schrijf de woordgroep opnieuw met de of het.'},
{id:'article-singular',topic:'Lidwoorden',name:'Van meer naar één',description:'Maak enkelvoud en pas het lidwoord aan.'},
{id:'article-text',topic:'Lidwoorden',name:'Lidwoorden in een tekstje',description:'Extra steun: lidwoorden zoeken. Basis: invullen. Uitbreiding: invullen en zelf schrijven.'},
{id:'article-find',topic:'Lidwoorden',name:'Zoek de lidwoorden',description:'Herken de, het en een in korte zinnen.'},
{id:'noun-pictures',topic:'Zelfstandige naamwoorden',name:'Benoem de prenten',description:'Schrijf een zelfstandig naamwoord met lidwoord.'},
{id:'noun-find',topic:'Zelfstandige naamwoorden',name:'Zoek de zelfstandige naamwoorden',description:'Herken naamwoorden in woordenrijen of zinnen.'},
{id:'noun-sort',topic:'Zelfstandige naamwoorden',name:'Persoon, dier of ding',description:'Sorteer woorden en schrijf het lidwoord erbij.'},
{id:'scene',topic:'Zelfstandige naamwoorden',name:'Woorden en zinnen bij een zoekprent',description:'Kies een prent. Schrijf woorden met lidwoorden of maak zinnen.'},
{id:'capital-find',topic:'Hoofdletters',name:'Speur naar hoofdletters',description:'Herken hoofdletters aan het begin en bij namen.'},
{id:'capital-fix',topic:'Hoofdletters',name:'Schrijf de hoofdletters',description:'Schrijf zinnen correct over.'},
{id:'capital-choice',topic:'Hoofdletters',name:'Kies de juiste schrijfwijze',description:'Kies tussen een kleine letter en een hoofdletter.'},
{id:'punct-find',topic:'Leestekens',name:'Omkring de leestekens',description:'Herken de punt, het vraagteken en het uitroepteken.'},
{id:'punct-fill',topic:'Leestekens',name:'Vul het leesteken in',description:'Schrijf . ? of ! in een klein vakje na de zin.'},
{id:'punct-complete',topic:'Leestekens',name:'Maak de zin af',description:'Begin met de gegeven woorden en let op het leesteken.'},
{id:'punct-write',topic:'Soorten zinnen',name:'Schrijf zelf een zin',description:'Bedenk een mededelende zin, een vraag of een uitroep.'},
{"id":"tell-recognize","topic":"Soorten zinnen","name":"Herken mededelende zinnen","description":"Lees de volledige zinnen en kruis aan welke iets vertellen."},
{"id":"tell-complete","topic":"Soorten zinnen","name":"Maak een mededelende zin af","description":"Begin met de gegeven woorden en vertel iets."},
{"id":"tell-words","topic":"Soorten zinnen","name":"Maak een zin met woorden","description":"Gebruik de woorden in een mededelende zin."},
{"id":"tell-picture","topic":"Soorten zinnen","name":"Vertel bij de prent","description":"Schrijf een mededelende zin bij een duidelijke afbeelding."},
{"id":"punct-period-question","topic":"Soorten zinnen","name":"Punt of vraagteken?"},
{"id":"punct-kind","topic":"Soorten zinnen","name":"Duid de soort zin aan"},
{"id":"punct-rewrite","topic":"Leestekens","name":"Herschrijf met het juiste leesteken"},
{"id":"punct-sort","topic":"Soorten zinnen","name":"Schrijf zinnen bij de juiste soort"},
{"id":"punct-picture","topic":"Soorten zinnen","name":"Schrijf drie soorten zinnen bij een prent"},
{"id":"punct-question-match","topic":"Soorten vragen","name":"Kies de vraag bij het antwoord"},
{"id":"punct-question-kind","topic":"Soorten vragen","name":"Open of gesloten vraag?"},
{"id":"punct-question-picture","topic":"Soorten vragen","name":"Schrijf twee vragen bij een prent"},
{"id":"punct-question-write","topic":"Soorten vragen","name":"Bedenk een vraag bij het antwoord"},
{"id":"punct-interrogative-word","topic":"Soorten zinnen","name":"Vul het vraagwoord in"},
{"id":"punct-interrogative-link","topic":"Soorten zinnen","name":"Verbind de vraag met het antwoord"},
{"id":"punct-interrogative-complete","topic":"Soorten zinnen","name":"Schrijf een vraag met het gegeven vraagwoord"},
{"id":"punct-interrogative-picture","topic":"Soorten zinnen","name":"Schrijf vragen bij een prent"},
{"id":"punct-transform","topic":"Soorten zinnen","name":"Wissel tussen vraagzin en mededelende zin"},
{"id":"rhyme-match","topic":"Rijmwoorden","name":"Verbind de rijmwoorden","description":"Zoek de rijmparen in twee kolommen."},
{"id":"rhyme-color","topic":"Rijmwoorden","name":"Kleur de rijmparen","description":"Geef woorden die rijmen dezelfde kleur."},
{"id":"rhyme-find","topic":"Rijmwoorden","name":"Zoek rijm in een tekstje","description":"Omkring rijmwoorden in korte versjes."},
{"id":"rhyme-fill","topic":"Rijmwoorden","name":"Vul het rijmwoord aan","description":"Maak een rijmend tekstje af."},
{"id":"rhyme-write","topic":"Rijmwoorden","name":"Schrijf rijmzinnen","description":"Maak zelf twee zinnen met rijmwoorden."},
{id:'write',topic:'Gemengd',name:'Bedenk zelf zinnen',description:'Gebruik lidwoorden, naamwoorden en hoofdletters samen.'}
];

const scenes=[
{id:'schooltuin',name:'Schooltuin',image:'assets/schooltuin.png',words:[['juf','de','persoon'],['jongen','de','persoon'],['kat','de','dier'],['hond','de','dier'],['boom','de','ding'],['bank','de','ding'],['boek','het','ding'],['bal','de','ding'],['fiets','de','ding'],['bloem','de','ding'],['rugzak','de','ding']]},
{id:'klas',name:'In de klas',image:'assets/klas.png',words:[['juf','de','persoon'],['jongen','de','persoon'],['meisje','het','persoon'],['vis','de','dier'],['tafel','de','ding'],['stoel','de','ding'],['boek','het','ding'],['potlood','het','ding'],['rugzak','de','ding'],['klok','de','ding'],['bord','het','ding'],['raam','het','ding'],['wereldbol','de','ding']]},
{id:'boerderij',name:'Op de boerderij',image:'assets/boerderij.png',words:[['boer','de','persoon'],['meisje','het','persoon'],['koe','de','dier'],['varken','het','dier'],['paard','het','dier'],['kip','de','dier'],['tractor','de','ding'],['schuur','de','ding'],['emmer','de','ding'],['kruiwagen','de','ding'],['boom','de','ding'],['hek','het','ding']]}
].map(scene=>({...scene,words:scene.words.map(([word,article,group])=>({word,article,group}))}));

const themeWords={
 autumn:'de pompoen pompoenen pompoentje|het blad bladeren blaadje|de kastanje kastanjes kastanjetje|de eikel eikels eikeltje|de regenjas regenjassen regenjasje|de plas plassen plasje|de paddenstoel paddenstoelen paddenstoeltje|het bladhoopje bladhoopjes bladhoopje|de egel egels egeltje dier|de slak slakken slakje dier|de eekhoorn eekhoorns eekhoorntje dier|de wandelaar wandelaars wandelaartje persoon|de plukker plukkers plukkertje persoon|het kind kinderen kindje persoon',
 halloween:'de pompoen pompoenen pompoentje|het masker maskers maskertje|de bezem bezems bezempje|de lantaarn lantaarns lantaarntje|het spook spoken spookje|het snoep snoepjes snoepje|de ketel ketels keteltje|de kaars kaarsen kaarsje|de spin spinnen spinnetje dier|de vleermuis vleermuizen vleermuisje dier|de kat katten katje dier|de heks heksen heksje persoon|de griezel griezels griezeltje persoon|het kind kinderen kindje persoon',
 christmas:'de kerstbal kerstballen kerstballetje|de kerstboom kerstbomen kerstboompje|het pak pakken pakje|het lint linten lintje|de bel bellen belletje|de ster sterren sterretje|de kaars kaarsen kaarsje|de sneeuwpop sneeuwpoppen sneeuwpopje|het rendier rendieren rendiertje dier|de hond honden hondje dier|de roodborst roodborsten roodborstje dier|de kerstman kerstmannen kerstmannetje persoon|de helper helpers helpertje persoon|het kind kinderen kindje persoon',
 saint:'de mijter mijters mijtertje|de staf staven stafje|de schoen schoenen schoentje|het paard paarden paardje dier|het pak pakken pakje|de wortel wortels worteltje|de brief brieven briefje|de zak zakken zakje|de pepernoot pepernoten pepernootje|het snoep snoepjes snoepje|de hond honden hondje dier|de schimmel schimmels schimmeltje dier|de helper helpers helpertje persoon|het kind kinderen kindje persoon|de bakker bakkers bakkertje persoon',
 forest:'de boom bomen boompje|de tak takken takje|de den dennen dennetje|de eikel eikels eikeltje|het spoor sporen spoortje|de dennenappel dennenappels dennenappeltje|de paddenstoel paddenstoelen paddenstoeltje|het nest nesten nestje|de eekhoorn eekhoorns eekhoorntje dier|de specht spechten spechtje dier|het konijn konijnen konijntje dier|de boswachter boswachters boswachtertje persoon|de wandelaar wandelaars wandelaartje persoon|het kind kinderen kindje persoon'
};
const themeActions={
 autumn:[
 ['Noor','raapt','een kastanje','op'],['De egel','schuilt','onder een blad',''],['Milan','springt','in de plas',''],['Het kind','draagt','een regenjas',''],['De eekhoorn','zoekt','een eikel',''],['De wandelaar','ziet','een paddenstoel',''],['Lina','draagt','de pompoen',''],['De slak','kruipt','naar het blad','']],
 halloween:[
 ['Noor','draagt','een masker',''],['De heks','zoekt','de bezem',''],['De spin','kruipt','in de ketel',''],['Milan','draagt','een lantaarn',''],['Het kind','krijgt','snoep',''],['De kat','schrikt','van het spook',''],['Lina','tekent','een vleermuis',''],['De griezel','tilt','de pompoen','op']],
 christmas:[
 ['Noor','hangt','de kerstbal','op'],['Milan','pakt','het lint',''],['Het kind','ziet','de ster',''],['De helper','versiert','de kerstboom',''],['De hond','ruikt','aan het pak',''],['Lina','tekent','een rendier',''],['De kerstman','draagt','een bel',''],['De roodborst','zit','bij de sneeuwpop','']],
 saint:[
 ['Noor','zet','de schoen','klaar'],['Het paard','eet','de wortel',''],['Milan','schrijft','een brief',''],['Sinterklaas','draagt','een mijter',''],['De helper','tilt','de zak','op'],['Lina','vindt','een pepernoot',''],['Het kind','krijgt','een pak',''],['De bakker','tekent','een staf','']],
 forest:[
 ['Noor','zoekt','een dennenappel',''],['De eekhoorn','klimt','in de boom',''],['De boswachter','ziet','een spoor',''],['Milan','hoort','de specht',''],['Het konijn','springt','over de tak',''],['Lina','vindt','een paddenstoel',''],['De wandelaar','ziet','een nest',''],['Het kind','raapt','een eikel','op']]
};
const nounPools=Object.fromEntries(Object.entries(themeWords).map(([theme,list])=>[theme,list.split('|').map(entry=>{
 const [article,word,plural,dimin,group='ding']=entry.split(' ');
 return {article,word,plural,dimin,group};
})]));
function themePool(pools,theme,fallback=[]){
 if(theme==='all')return [...fallback,...Object.values(pools).flat()];
 return pools[theme]||fallback;
}
function themedActions(theme){
 return themePool(themeActions,theme).map(([subject,verb,rest,particle])=>{
  const tail=[rest,particle].filter(Boolean).join(' ');
  const person=/^(De|Het) /.test(subject)?subject[0].toLowerCase()+subject.slice(1):subject;
  return {subject,verb,rest,particle,text:subject+' '+verb+' '+tail+'.',question:verb[0].toUpperCase()+verb.slice(1)+' '+person+' '+tail+'?'};
 });
}
window.TaalData={themePool,themedActions,themedNouns:theme=>[...new Map(themePool(nounPools,theme,nouns).map(noun=>[noun.word,noun])).values()],scenes,nouns,sentences,capitals,types,levels:{support:{name:'Extra steun',symbol:'●',help:'Korte woorden, keuzemogelijkheden en voorbeelden.'},basic:{name:'Basis',symbol:'■',help:'Zelf toepassen in woorden en korte zinnen.'},challenge:{name:'Uitbreiding',symbol:'▲',help:'Zelf formuleren, combineren en uitleggen.'}}};
})();
