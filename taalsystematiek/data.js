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
{id:'article-text',topic:'Lidwoorden',name:'Lidwoorden in een tekstje',description:'Vul de, het of een in een kort tekstje in.'},
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
{id:'punct-write',topic:'Leestekens',name:'Schrijf zelf een zin',description:'Bedenk een vertelzin, een vraag of een uitroep.'},
{"id":"tell-recognize","topic":"Leestekens","name":"Herken mededelende zinnen","description":"Vul het leesteken in en kruis aan wat iets vertelt."},
{"id":"tell-complete","topic":"Leestekens","name":"Maak een mededelende zin af","description":"Begin met de gegeven woorden en vertel iets."},
{"id":"tell-words","topic":"Leestekens","name":"Maak een zin met woorden","description":"Gebruik de woorden in een mededelende zin."},
{"id":"tell-picture","topic":"Leestekens","name":"Vertel bij de prent","description":"Schrijf een mededelende zin bij een duidelijke afbeelding."},
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
window.TaalData={scenes,nouns,sentences,capitals,types,levels:{support:{name:'Extra steun',symbol:'●',help:'Korte woorden, keuzemogelijkheden en voorbeelden.'},basic:{name:'Basis',symbol:'■',help:'Zelf toepassen in woorden en korte zinnen.'},challenge:{name:'Uitbreiding',symbol:'▲',help:'Zelf formuleren, combineren en uitleggen.'}}};
})();
