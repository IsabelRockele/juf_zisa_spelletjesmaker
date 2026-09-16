
const app = document.querySelector("#app");
const allBooks = window.ZISA_BOOKS || [];
const books = allBooks;
const levels = ["START","M3","E3","M4","E4","M5","E5","M6","E6"];
let currentLevel = null;
let currentBook = null;
let pageIndex = 0;
let pageTaskPassed = false;
let isTurning = false;
let missionIndex = 0;
let missionScore = 0;
let reviewMode = false;
let reviewEndPage = 0;
let speedTimer = null;
let fluencyIndex = 0;
let fluencyScore = 0;

const roleColors = {wie:"#f4d94e",doet:"#ef6b67",waar:"#a985d6",wat:"#9a6b45",hoe:"#67c98f",wanneer:"#f3a04b"};
const storyGlossaries={
  "m6-raadsel-nachtcamera":{
    nachtcamera:{text:"Een camera die automatisch foto's of filmpjes maakt wanneer er in het donker een dier voorbijkomt.",image:"images/woorduitleg/nachtcamera.png"},sporengids:"Een boek waarmee je kunt herkennen van welk dier een spoor is.",splitsing:"Een plek waar een weg of pad in twee richtingen verdergaat.",omheining:"Een hek of afsluiting rond een plek.",dassenburcht:{text:"Het ondergrondse gangenstelsel waarin dassen wonen.",image:"images/woorduitleg/dassenburcht.png"},veiligheidslijn:"Een lijn die aangeeft tot waar je veilig mag komen.",grijpstok:{text:"Een lange stok met een grijper waarmee je iets vanop afstand kunt pakken.",image:"images/woorduitleg/grijpstok.png"},geheugenkaart:"Een klein kaartje waarop een camera foto's en filmpjes bewaart.",bevestiging:"Het onderdeel waarmee iets stevig vastzit."
  },
  "m6-boomhut-beek":{
    buurttuin:"Een tuin die mensen uit de buurt samen gebruiken en verzorgen.",bouwplan:"Een tekening die toont hoe iets gebouwd is.",risico:"Een kans dat er iets gevaarlijks of ongewensts gebeurt.","risico's":"Mogelijke gevaren waarmee je rekening moet houden.",steunpaal:"Een paal die een bouwwerk helpt dragen.",afvoerrooster:{text:"Een metalen rooster waardoor water kan wegstromen.",image:"images/woorduitleg/afvoerrooster.png"},fundering:"Het stevige onderste deel waarop een bouwwerk rust.",gekeurde:"Gecontroleerd en veilig bevonden.",veiligheidsharnas:{text:"Stevige riemen die iemand beschermen tegen vallen.",image:"images/woorduitleg/veiligheidsharnas.png"},serre:"Een glazen huis waarin planten groeien.",draagbare:"Zo gemaakt dat je het kunt meenemen.",vrijwilligers:"Mensen die uit eigen keuze helpen zonder ervoor betaald te worden.",ondergrond:"De grond waarop iets staat.",waterpas:"Helemaal recht en niet scheef.",goedgekeurd:"Na controle veilig en in orde bevonden.",controlelijst:"Een lijst waarop staat wat je één voor één moet nakijken."
  },
  "e6-kompas-onder-stad":{
    archivaris:"Iemand die oude documenten en andere bronnen bewaart en ordent.",instrument:"Een hulpmiddel waarmee je iets kunt meten of onderzoeken.",beïnvloeden:"Ervoor zorgen dat iets verandert of anders werkt.",legenda:{text:"De uitleg van kleuren en tekens op een kaart.",image:"images/woorduitleg/legenda.png"},windroos:{text:"Een teken op een kaart dat de windrichtingen toont.",image:"images/woorduitleg/windroos.png"},gietijzeren:"Gemaakt van ijzer dat in een vorm is gegoten.",leidingenplan:"Een kaart waarop ondergrondse buizen en leidingen staan.",inspectiedeur:{text:"Een afgesloten deur voor mensen die iets moeten controleren of onderhouden.",image:"images/woorduitleg/inspectiedeur.png"},gemetselde:"Opgebouwd uit stenen die met specie aan elkaar vastzitten.",inspectieluik:{text:"Een kleine opening waardoor een vakmens iets kan nakijken.",image:"images/woorduitleg/inspectieluik.png"},verzegeling:"Een sluiting waaraan je kunt zien of iets al geopend is.",stadsingenieur:"Een deskundige die technische werken voor een stad ontwerpt of controleert.",verstopping:"Een blokkering waardoor water niet meer goed kan doorstromen.",reconstrueren:"Met alle gegevens opnieuw stap voor stap tonen wat er gebeurd is."
  },
  "e6-code-rood-marsbasis":{
    ruimtevaartcentrum:"Een plaats waar mensen ruimtevaart onderzoeken, oefenen en besturen.",noodprotocol:"Vaste veiligheidsstappen die je bij gevaar in de juiste volgorde uitvoert.",simulatie:{text:"Een nagebootste situatie waarmee je veilig kunt oefenen.",image:"images/woorduitleg/simulatie.png"},zuurstofsensoren:{text:"Meettoestellen die controleren hoeveel zuurstof er aanwezig is.",image:"images/woorduitleg/zuurstofsensoren.png"},waarschuwingslicht:"Een lamp die toont dat er mogelijk een probleem is.",tegenstrijdig:"Niet met elkaar overeenkomend.",tijdlijn:{text:"Een overzicht waarop gebeurtenissen in volgorde van tijd staan.",image:"images/woorduitleg/tijdlijn.png"},koeling:"Een systeem dat iets kouder maakt.",condens:{text:"Kleine waterdruppels die ontstaan wanneer vochtige lucht afkoelt.",image:"images/woorduitleg/condens.png"},optische:"Werkend met licht.",reservesensor:"Een extra sensor die klaarstaat als de gewone sensor niet betrouwbaar is.",dienstsluis:"Een afsluitbare doorgang waarmee een technicus veilig een ruimte binnengaat.",geïsoleerde:"Beschermd tegen warmte of koude van buitenaf.",afdichting:{text:"Een rubberen rand die een opening lucht- of waterdicht afsluit.",image:"images/woorduitleg/afdichting.png"},bewijsreeks:"Een rij aanwijzingen die samen laten zien dat een uitleg klopt.",onderhoudsverslag:"Een document waarin staat welke controle of reparatie is uitgevoerd.",controleerbaar:"Zo duidelijk dat iemand anders kan nagaan of het klopt."
  }
};
const bookGames = {
  "m3-pip-draak": [
    {type:"choice",icon:"🧠",title:"Wat weet je nog?",q:"Wat helpt de draak?",a:["Hij denkt aan de zon.","Hij eet het mos.","Hij slaapt in het hol."],correct:0,hint:"Denk aan wat Pip zegt."},
    {type:"sentence",icon:"🧩",title:"Bouw de zin",q:"Zet de zin in de goede volgorde.",image:"images/pip/04.jpg",imageAlt:"Pip helpt de draak",parts:[{text:"Pip",role:"wie"},{text:"helpt",role:"doet"},{text:"de draak",role:"wat"}]},
    {type:"choice",icon:"💡",title:"Woordenschat",q:"De draak is trots. Wat is trots?",image:"images/pip/10.jpg",imageAlt:"De draak stapt trots naast Pip",a:["blij met wat je kunt","heel bang zijn","graag gaan slapen"],correct:0,hint:"De draak kan weer vuur spuw-en."},
    {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij vuur?",word:"vuur",correct:"het"},
    {type:"sound",icon:"👂",title:"Klankjacht",q:"Welk woord heeft een korte klank?",sentence:"De draak blaast op de tak.",a:["draak","blaast","tak"],correct:2,kind:"korte klank"}
  ],
  "m3-bo-maan": [
    {type:"choice",icon:"🧠",title:"Wat weet je nog?",q:"Waarom ziet Bo de maan niet?",a:["Er zit een wolk voor.","De maan slaapt.","De ster is te fel."],correct:0,hint:"Wat duwen Bo en Bas weg?"},
    {type:"sentence",icon:"🧩",title:"Bouw de zin",q:"Zet de zin in de goede volgorde.",image:"images/bo/08.jpg",imageAlt:"Bo en Bas duwen samen de wolk weg",parts:[{text:"Bo en Bas",role:"wie"},{text:"duwen weg",role:"doet"},{text:"de wolk",role:"wat"}]},
    {type:"choice",icon:"💡",title:"Woordenschat",q:"De wolk is dik. Wat wil dik hier zeggen?",image:"images/bo/05.jpg",imageAlt:"Bo vliegt bij een dik pak wolken",a:["Er zit veel wolk.","De wolk is heel dun.","De wolk is rood."],correct:0,hint:"Een dik pak wolk houdt het licht weg."},
    {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij maan?",word:"maan",correct:"de"},
    {type:"sound",icon:"👂",title:"Klankjacht",q:"Welk woord heeft een lange klank?",sentence:"De maan is weg.",a:["maan","is","weg"],correct:0,kind:"lange klank aa"}
  ],
  "e3-noor-rode-laars": [
    {type:"choice",icon:"🧠",title:"Wat weet je nog?",q:"Hoe vindt Noor de baas van de laars?",a:["De hond rent naar Liv.","Sam neemt haar mee.","De laars roept heel luid."],correct:0,hint:"Wat doet de hond na het snuffelen?"},
    {type:"sentence",icon:"🧩",title:"Bouw de zin",q:"Zet de zin in de goede volgorde.",image:"images/noor/08.jpg",imageAlt:"Noor geeft de laars terug aan Liv",parts:[{text:"Noor",role:"wie"},{text:"geeft terug",role:"doet"},{text:"de laars",role:"wat"}]},
    {type:"choice",icon:"💡",title:"Woordenschat",q:"Er zit modder op de laars. Wat is modder?",image:"images/noor/03.jpg",imageAlt:"Een rode laars met modder",a:["natte aarde","droog zand","schoon water"],correct:0,hint:"Modder ligt vaak bij een plas."},
    {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij laars?",word:"laars",correct:"de"},
    {type:"sound",icon:"👂",title:"Klankjacht",q:"Welk woord heeft een tweetekenklank?",sentence:"Noor loopt naar huis.",a:["Noor","loopt","huis"],correct:2,kind:"tweetekenklank ui"}
  ],
  "e3-milo-nest": [
    {type:"choice",icon:"🧠",title:"Wat weet je nog?",q:"Waarom raakt Milo het nest niet aan?",a:["Het nest is van de vogels.","Hij is bang voor gras.","Het nest is leeg."],correct:0,hint:"Denk aan wat mama zegt."},
    {type:"sentence",icon:"🧩",title:"Bouw de zin",q:"Zet de zin in de goede volgorde.",image:"images/milo/08.jpg",imageAlt:"De vogel vliegt naar het nest",parts:[{text:"De vogel",role:"wie"},{text:"vliegt",role:"doet"},{text:"naar het nest",role:"waar"}]},
    {type:"choice",icon:"💡",title:"Woordenschat",q:"Milo hoort gepiep. Wat is gepiep?",image:"images/milo/03.jpg",imageAlt:"Milo luistert naar het nest",a:["een hoog, zacht geluid","een felle kleur","een grote sprong"],correct:0,hint:"De kleine vogels maken dit geluid."},
    {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij nest?",word:"nest",correct:"het"},
    {type:"sound",icon:"👂",title:"Klankjacht",q:"Welk woord heeft een tweetekenklank?",sentence:"Milo hoort weer piep.",a:["Milo","hoort","piep"],correct:2,kind:"tweetekenklank ie"}
  ]
};

const extraBookGames = {
  "m3-pip-draak": [
    {type:"sequence",icon:"⏳",title:"Eerst en dan",q:"Wat kwam eerst? Zet de zinnen goed.",items:["Pip ziet een draak in het hol.","Pip helpt de draak met vuur.","De draak maakt weer vuur.","Pip en de draak gaan op pad."],hint:"Lees het boek van het begin tot het eind."},
    {type:"sentence",icon:"🧩",title:"Nog een zin",q:"Bouw wat er op het eind gebeurt.",image:"images/pip/08.jpg",imageAlt:"De draak maakt een vlam",parts:[{text:"De draak",role:"wie"},{text:"maakt",role:"doet"},{text:"een vlam",role:"wat"}]},
    {type:"choice",icon:"💡",title:"Woordenschat",q:"De draak kijkt sip. Wat is sip?",image:"images/pip/03.jpg",imageAlt:"Een draak die sip kijkt",a:["niet blij","heel boos","vol pret"],correct:0,hint:"Kijk naar het gezicht van de draak."},
    {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij tak?",word:"tak",correct:"de"},
    {type:"sound",icon:"👂",title:"Klankjacht",q:"Welk woord heeft een lange klank?",sentence:"Het vuur is weg.",a:["vuur","is","weg"],correct:0,kind:"lange klank uu"},
    {type:"speed",icon:"⏱️",title:"Tempolezen",q:"Lees drie keer één minuut en probeer jezelf te verslaan.",words:["Pip","vos","bos","hol","sip","vuur","tak","mos","zon","fel","oog","toe","warm","luid","pad","puf","vlam","blij","is","een","de","het","op","in"]}
  ],
  "m3-bo-maan": [
    {type:"sequence",icon:"⏳",title:"Eerst en dan",q:"Wat kwam eerst? Zet de zinnen goed.",items:["Bo ziet dat de maan weg is.","De ster wijst naar de wolk.","Bo en Bas gaan naar de wolk.","De maan schijnt weer op het bos."],hint:"Lees het boek van het begin tot het eind."},
    {type:"sentence",icon:"🧩",title:"Nog een zin",q:"Bouw de zin met de ster.",image:"images/bo/04.jpg",imageAlt:"Een ster wijst naar een wolk",parts:[{text:"De ster",role:"wie"},{text:"wijst",role:"doet"},{text:"naar de wolk",role:"waar"}]},
    {type:"choice",icon:"💡",title:"Woordenschat",q:"De ster wijst. Wat doet de ster?",image:"images/bo/04.jpg",imageAlt:"De ster toont waar de wolk is",a:["hij toont waar iets is","hij doet zijn oog toe","hij valt uit de lucht"],correct:0,hint:"Kijk welke kant het licht op gaat."},
    {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij bos?",word:"bos",correct:"het"},
    {type:"sound",icon:"👂",title:"Klankjacht",q:"Welk woord heeft een tweetekenklank?",sentence:"Bas helpt de uil.",a:["Bas","helpt","uil"],correct:2,kind:"tweetekenklank ui"},
    {type:"speed",icon:"⏱️",title:"Tempolezen",q:"Lees drie keer één minuut en probeer jezelf te verslaan.",words:["Bo","uil","maan","boom","wolk","ster","bos","weg","Bas","dik","kop","wind","nest","fijn","hoog","laag","weer","blij","is","een","de","het","op","in"]}
  ],
  "e3-noor-rode-laars": [
    {type:"sequence",icon:"⏳",title:"Wat gebeurde eerst?",q:"Zet de gebeurtenissen in de goede volgorde.",items:["Noor vindt een rode laars.","De hond snuffelt aan de laars.","De hond rent naar Liv.","Liv trekt de laars weer aan."],hint:"Kijk naar het begin, het midden en het einde."},
    {type:"sentence",icon:"🧩",title:"Nog een zin",q:"Bouw de zin over de hond.",image:"images/noor/05.jpg",imageAlt:"De hond snuffelt aan de laars",parts:[{text:"De hond",role:"wie"},{text:"snuffelt",role:"doet"},{text:"aan de laars",role:"waar"}]},
    {type:"choice",icon:"💡",title:"Woordenschat",q:"De hond snuffelt. Wat doet hij?",image:"images/noor/05.jpg",imageAlt:"De hond ruikt aan de laars",a:["hij ruikt met zijn neus","hij kijkt met zijn oog","hij graaft met zijn poot"],correct:0,hint:"Kijk goed naar de neus van de hond."},
    {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij hond?",word:"hond",correct:"de"},
    {type:"sound",icon:"👂",title:"Klankjacht",q:"Welk woord heeft een lange klank?",sentence:"De voet is droog.",a:["voet","is","droog"],correct:2,kind:"lange klank oo"},
    {type:"speed",icon:"⏱️",title:"Tempolezen",q:"Lees drie keer één minuut en probeer jezelf te verslaan.",words:["Noor","laars","rood","heg","modder","klein","hond","hek","Liv","voet","sok","droog","huis","plas","snuffelt","rent","vindt","bukt","kijkt","loopt","trekt","geeft","dank","nat","vies","blij","neus","poot","straat","terug"]}
  ],
  "e3-milo-nest": [
    {type:"sequence",icon:"⏳",title:"Wat gebeurde eerst?",q:"Zet de gebeurtenissen in de goede volgorde.",items:["Milo hoort gepiep.","Milo vindt het nest.","Mama zegt dat hij van ver moet kijken.","Een vogel brengt een worm."],hint:"Kijk naar het begin, het midden en het einde."},
    {type:"sentence",icon:"🧩",title:"Nog een zin",q:"Bouw de zin over Milo.",image:"images/milo/03.jpg",imageAlt:"Milo kijkt naar het nest",parts:[{text:"Milo",role:"wie"},{text:"kijkt",role:"doet"},{text:"naar het nest",role:"waar"}]},
    {type:"choice",icon:"💡",title:"Woordenschat",q:"De vogel heeft een worm. Wat is een worm?",image:"images/milo/07.jpg",imageAlt:"Een vogel met een worm in zijn bek",a:["een lang, klein dier","een tak met een blad","een veer van een vogel"],correct:0,hint:"Kijk wat de vogel in zijn bek heeft."},
    {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij vogel?",word:"vogel",correct:"de"},
    {type:"sound",icon:"👂",title:"Klankjacht",q:"Welk woord heeft een korte klank?",sentence:"Het nest zit in de boom.",a:["nest","boom","de"],correct:0,kind:"korte klank e"},
    {type:"speed",icon:"⏱️",title:"Tempolezen",q:"Lees drie keer één minuut en probeer jezelf te verslaan.",words:["Milo","nest","boom","muis","kip","piep","vogel","worm","bek","gras","mama","zacht","hoog","rond","omhoog","kijkt","hoort","vindt","vliegt","zwaait","staat","raakt","wacht","klein","tak","veer","geluid","dier","weer","blij"]}
  ]
};
const preReadingGames={};
Object.keys(extraBookGames).forEach(id=>{
  preReadingGames[id]=extraBookGames[id].find(game=>game.type==="speed");
  bookGames[id].push(...extraBookGames[id].filter(game=>game.type!=="speed"));
});
Object.entries(window.ZISA_LEVEL_GAMES||{}).forEach(([id,games])=>{bookGames[id]=games});
Object.entries(window.ZISA_SPEED_GAMES||{}).forEach(([id,game])=>{
  preReadingGames[id]={icon:"⏱️",title:"Tempolezen",q:"Lees drie keer één minuut en probeer jezelf te verslaan.",...game};
});
const vocabularyGames={
  "m6-raadsel-nachtcamera":[
    {type:"choice",icon:"🔵",title:"Moeilijk woord",q:"Wat is een dassenburcht?",a:["Een ondergronds gangenstelsel waar dassen wonen.","Een camera die alleen overdag werkt.","Een hek rond een bezoekerscentrum."],correct:0,hint:"Open het blauwe woord op de bladzijde.",reviewPage:6},
    {type:"vocabulary-image",icon:"🖼️",title:"Woord en beeld",q:"Op welke afbeelding zie je een grijpstok?",a:[{text:"Een lange grijpstok",image:"images/m6-nachtcamera/11.png"},{text:"Pootafdrukken in modder",image:"images/m6-nachtcamera/03.png"},{text:"Een camera aan een paal",image:"images/m6-nachtcamera/14.png"}],correct:0,hint:"Lees de bladzijde met het blauwe woord grijpstok opnieuw.",reviewPage:10}
  ],
  "m6-boomhut-beek":[
    {type:"vocabulary-image",icon:"🖼️",title:"Woord en beeld",q:"Op welke afbeelding zie je het afvoerrooster?",a:[{text:"Het rooster bij de beek",image:"images/m6-boomhut/04.png"},{text:"De ladder bij de boomhut",image:"images/m6-boomhut/08.png"},{text:"Het houten kistje",image:"images/m6-boomhut/09.png"}],correct:0,hint:"Open het blauwe woord afvoerrooster op de bladzijde.",reviewPage:3},
    {type:"choice",icon:"🔵",title:"Moeilijk woord",q:"Wat is een fundering?",a:["Het stevige onderste deel waarop iets gebouwd wordt.","Een touw waarmee je een brug sluit.","Een lijst met namen van vrijwilligers."],correct:0,hint:"Open het blauwe woord fundering op de bladzijde.",reviewPage:12}
  ],
  "e6-kompas-onder-stad":[
    {type:"choice",icon:"🔵",title:"Moeilijk woord",q:"Wat is een legenda op een kaart?",a:["De uitleg van kleuren en tekens.","Een verhaal dat zeker verzonnen is.","De naam van de oudste straat."],correct:0,hint:"Open het blauwe woord legenda op de bladzijde.",reviewPage:2},
    {type:"vocabulary-image",icon:"🖼️",title:"Woord en beeld",q:"Op welke afbeelding zie je het inspectieluik?",a:[{text:"Het kleine luik in de tunnel",image:"images/e6-kompas/10.png"},{text:"De windroos op het marktplein",image:"images/e6-kompas/04.png"},{text:"De tentoonstelling",image:"images/e6-kompas/15.png"}],correct:0,hint:"Lees de bladzijde met het blauwe woord inspectieluik opnieuw.",reviewPage:9}
  ],
  "e6-code-rood-marsbasis":[
    {type:"choice",icon:"🔵",title:"Moeilijk woord",q:"Wat is condens?",a:["Waterdruppels die ontstaan wanneer vochtige lucht afkoelt.","Een alarm dat vanzelf uitgaat.","Een extra voorraad zuurstof."],correct:0,hint:"Open het blauwe woord condens op de bladzijde.",reviewPage:7},
    {type:"vocabulary-image",icon:"🖼️",title:"Woord en beeld",q:"Op welke afbeelding onderzoekt Leila de afdichting?",a:[{text:"De rubberen afdichting",image:"images/e6-marsbasis/13.png"},{text:"Druppels op sensor A",image:"images/e6-marsbasis/07.png"},{text:"De geïsoleerde sensorkap",image:"images/e6-marsbasis/12.png"}],correct:0,hint:"Lees de bladzijde met het blauwe woord afdichting opnieuw.",reviewPage:12}
  ]
};
Object.entries(vocabularyGames).forEach(([id,games])=>{if(bookGames[id])bookGames[id].push(...games)});

const meaningContexts={
  "Wat betekent stoffig?":"In de oude berging zijn de kasten en dozen stoffig.",
  "Wat betekent verdwaald?":"De wolkenwolf is verdwaald en weet de weg naar zijn familie niet meer.",
  "Wat betekent wankelen?":"De jonge vos probeert recht te staan, maar blijft wankelen.",
  "Wat betekent verzorgen?":"De bewoners verzorgen de jonge planten elke dag.",
  "Wat betekent voorzichtig?":"Meester Raf herstelt het oude uurwerk voorzichtig.",
  "Wat betekent opgelucht?":"Mira is opgelucht wanneer de wolf zijn familie terugvindt.",
  "Wat betekent deskundig?":"De dierenhelper bevrijdt de vos deskundig.",
  "Wat betekent ‘omweg’ in dit verhaal?":"Blik reed eerst een omweg, maar brengt de dozen nu rechtstreeks.",
  "Wat betekent ‘versperren’?":"Het stormhout verspert de opening van de grot.",
  "Wat betekent ‘vergeeld’?":"Aya bekijkt een vergeelde foto uit het archief.",
  "Wat betekent ‘onregelmatig’ bij de ademhaling?":"De draak ademt onregelmatig: niet telkens in hetzelfde ritme.",
  "Wat betekent ‘bevestigen’?":"De nieuwe beelden bevestigen de uitleg van Lina en Sem.",
  "Wat betekent ‘waterpas’?":"Na de herstelling staat de boomhut opnieuw waterpas.",
  "Wat betekent ‘stabiel’?":"Tijdens de tweede proef blijven de meetwaarden stabiel.",
  "Wat is een dassenburcht?":"De das verdwijnt via een opening in zijn dassenburcht.",
  "Wat is een fundering?":"De vakman verstevigt de fundering onder de steunpaal.",
  "Wat is een legenda op een kaart?":"Volgens de legenda stelt de blauwe lijn een waterkanaal voor.",
  "Wat is condens?":"Door de koude lucht ontstaat condens op de kap van de sensor.",
  "Wat is een berging?":"De oude spullen worden in de berging bewaard.",
  "Wat betekent stevig vasthouden?":"Mira moet het touw stevig vasthouden tijdens de windvlaag.",
  "Wat is een aanwijzing?":"De blauwe verfdruppel is een aanwijzing in hun zoektocht.",
  "Wat is een aanwijzing op een schatkaart?":"Een getekende rots is een aanwijzing op de schatkaart."
};
function enrichQuestions(){
  const visited=new Set();
  const visit=value=>{
    if(!value||typeof value!=="object"||visited.has(value))return;
    visited.add(value);
    if(value.q&&meaningContexts[value.q])value.context=meaningContexts[value.q];
    else if(value.q&&/wat betekent|betekenis/i.test(`${value.q} ${value.title||""}`)&&value.focus&&/[.!?]/.test(value.focus))value.context=value.focus;
    if(value.q&&/(waarom (past|klopt) de titel|past de titel)/i.test(value.q))value.showBookTitle=true;
    Object.values(value).forEach(visit);
  };
  [allBooks,bookGames,window.ZISA_FLUENCY_BOOKS,window.ZISA_START_BOOKS].forEach(visit);
}
enrichQuestions();

// Verdeel juiste antwoorden per oefensoort bewust over links, midden en rechts.
// De inhoud blijft gelijk; alleen de zichtbare plaats wisselt voorspelbaar af.
function spreadCorrectAnswerPositions(){
  const counters=new Map();
  const visited=new Set();
  const visit=(value)=>{
    if(!value||typeof value!=="object"||visited.has(value))return;
    visited.add(value);
    if(Array.isArray(value.a)&&value.a.length>1&&Number.isInteger(value.correct)){
      const bucket=String(value.type||value.title||"leesvraag").toLowerCase();
      const sequence=counters.get(bucket)||0;
      const desired=sequence%value.a.length;
      counters.set(bucket,sequence+1);
      if(desired!==value.correct){
        [value.a[value.correct],value.a[desired]]=[value.a[desired],value.a[value.correct]];
        value.correct=desired;
      }
    }
    Object.values(value).forEach(visit);
  };
  [allBooks,bookGames,window.ZISA_FLUENCY_BOOKS,window.ZISA_START_BOOKS].forEach(visit);
}
spreadCorrectAnswerPositions();

const targetedReviewPages={
  "m3-pip-draak":{0:6,2:9,7:2},
  "m3-bo-maan":{0:7,2:4,7:3},
  "e3-noor-rode-laars":{0:6,2:2,7:4},
  "e3-milo-nest":{0:4,2:2,7:6},
  "m5-robot-lokaal-7":{2:9,3:13,4:13,5:12,6:0},
  "m5-grot-van-echo":{2:11,3:6,4:14,5:1,6:14},
  "e5-station-code":{2:9,3:1,4:10,5:2,6:5},
  "e5-ijsdraak":{2:9,3:9,4:11,5:14,6:5}
};

document.querySelector("#brandBtn").addEventListener("click", renderLibrary);
document.querySelector("#libraryBtn").addEventListener("click", renderLibrary);

function escapeAttr(text){return String(text).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
let activeUtterance=null;
function clearWordHighlight(root=document){root?.querySelectorAll?.(".word-reading").forEach(word=>word.classList.remove("word-reading"))}
function speak(text,highlightRoot=null){
  if(!("speechSynthesis" in window))return;
  speechSynthesis.cancel();
  clearWordHighlight();
  const spokenText=highlightRoot?String(text):String(text).replaceAll("-","").replaceAll("–",", ");
  const voice=new SpeechSynthesisUtterance(spokenText);
  voice.lang="nl-BE";voice.rate=.82;voice.pitch=1.05;
  const voices=speechSynthesis.getVoices();
  voice.voice=voices.find(item=>item.lang.toLowerCase().startsWith("nl-be"))||voices.find(item=>item.lang.toLowerCase().startsWith("nl"))||null;
  if(highlightRoot){
    const words=[...highlightRoot.querySelectorAll(".read-word")];
    voice.onboundary=event=>{
      if(event.name&&event.name!=="word")return;
      const current=words.find(word=>event.charIndex>=Number(word.dataset.start)&&event.charIndex<Number(word.dataset.end));
      if(!current)return;
      clearWordHighlight(highlightRoot);current.classList.add("word-reading");
    };
  }
  voice.onend=()=>{clearWordHighlight(highlightRoot);if(activeUtterance===voice)activeUtterance=null};
  voice.onerror=voice.onend;
  activeUtterance=voice;
  speechSynthesis.speak(voice);
}
function bindSpeechButtons(root=document){root.querySelectorAll("[data-say]").forEach(button=>button.onclick=event=>{event.stopPropagation();speak(button.dataset.say,button.classList.contains("story-listen")?document.querySelector(".storytext"):null)})}
function makeListenButton(text,label="Beluister dit woord"){
  const button=document.createElement("button");button.type="button";button.className="mini-listen";button.textContent="🔊";button.title=label;button.setAttribute("aria-label",label);button.onclick=event=>{event.stopPropagation();speak(text)};return button;
}
function spokenStartChoice(text){return text==="."?"punt":text==="?"?"vraagteken":text==="!"?"uitroepteken":text}
function hasAudioSupport(kind="task"){
  if(!currentBook)return false;
  return currentBook.level==="START"||currentBook.level==="M3"||(currentBook.level==="E3"&&kind!=="story");
}

function storyTextMarkup(text){
  const glossary=storyGlossaries[currentBook?.id]||{};
  return [...String(text).matchAll(/\S+|\s+/g)].map(match=>{
    if(/\s/.test(match[0]))return match[0];
    const key=match[0].toLocaleLowerCase("nl-BE").replace(/^[^\p{L}]+|[^\p{L}']+$/gu,"");
    const common=`class="read-word${glossary[key]?" difficult-word":""}" data-start="${match.index}" data-end="${match.index+match[0].length}"`;
    return glossary[key]?`<button type="button" ${common} data-word="${escapeAttr(key)}" aria-label="Verklaring van ${escapeAttr(key)}">${escapeAttr(match[0])}</button>`:`<span ${common}>${escapeAttr(match[0])}</span>`;
  }).join("");
}
function bindGlossaryWords(root=document){
  root.querySelectorAll(".difficult-word").forEach(button=>button.onclick=event=>{
    event.stopPropagation();
    document.querySelector(".word-explanation-layer")?.remove();
    const key=button.dataset.word;const entry=storyGlossaries[currentBook?.id]?.[key];if(!entry)return;
    const explanation=typeof entry==="object"?entry.text:entry;const explanationImage=typeof entry==="object"?entry.image:null;
    const layer=document.createElement("div");layer.className="word-explanation-layer";
    layer.innerHTML=`<section class="word-explanation${explanationImage?" has-image":""}" role="dialog" aria-modal="true" aria-labelledby="wordExplanationTitle"><button class="word-explanation-close" type="button" aria-label="Sluiten">×</button>${explanationImage?`<div class="word-explanation-image">${imageBlock(explanationImage,`Afbeelding die ${key} verduidelijkt`)}</div>`:""}<div><small>Moeilijk woord</small><h3 id="wordExplanationTitle">${escapeAttr(key)}</h3><strong class="word-explanation-label">Uitleg</strong><p>${escapeAttr(explanation)}</p></div></section>`;
    const close=()=>layer.remove();layer.onclick=event=>{if(event.target===layer)close()};layer.querySelector(".word-explanation-close").onclick=close;
    document.body.append(layer);layer.querySelector(".word-explanation-close").focus();
  });
}
function shuffled(list){
  const copy=[...list];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
  return copy;
}
function shuffledWrong(list,key=item=>item){
  const copy=shuffled(list);
  if(copy.length>1&&copy.every((item,index)=>key(item)===key(list[index])))copy.push(copy.shift());
  return copy;
}

function isDiscoverLocked(book){
  if(window.ZISA_ACCESS_MODE!=="discover")return false;
  return books.find(candidate=>candidate.level===book.level)?.id!==book.id;
}

function spriteStyle(src){return `background-image:url('${src.src}');--sprite-x:${src.x}%;--sprite-y:${src.y}%;--sprite-w:${src.w||300}%;--sprite-h:${src.h||400}%`}
function imageBlock(src, alt){
  if(src&&typeof src==="object")return `<div class="story-sprite" role="img" aria-label="${escapeAttr(alt)}" style="${spriteStyle(src)}"></div>`;
  return `<div class="story-image" role="img" aria-label="${escapeAttr(alt)}" style="background-image:url('${src}')"></div>`;
}

function renderLibrary(){
  clearInterval(speedTimer);speedTimer=null;
  if("speechSynthesis" in window)speechSynthesis.cancel();
  reviewMode=false;
  document.body.classList.remove("reading-mode","mission-mode");
  document.querySelector(".level-display span").textContent=currentLevel?`AVI ${currentLevel}`:"Kies AVI";
  currentBook = null;
  app.innerHTML = `
    <section class="hero">
      <div class="z"><img src="images/zisa-leest.png" alt="Zisa leest in een boek"></div>
      <div>
        <h1>Zisa Lezen</h1>
        <p>Kies een niveau en een boek. Lees rustig, kijk goed naar de prenten en voer onderweg kleine leesmissies uit.</p>
      </div>
    </section>
    <div class="levels">
      ${levels.map(l=>`<button class="level ${l===currentLevel?"active":""}" data-level="${l}">${l==="START"?"AVI Start":l}</button>`).join("")}
    </div>
    <section class="grid" id="bookGrid"></section>`;

  document.querySelectorAll(".level").forEach(btn=>{
    btn.addEventListener("click",()=>{
      currentLevel = btn.dataset.level;
      renderLibrary();
    });
  });

  const grid = document.querySelector("#bookGrid");
  if(!currentLevel){
    grid.innerHTML=`<section class="choose-level"><img src="images/zisa-leest.png" alt="Zisa leest"><div><h2>Kies eerst je AVI-niveau</h2><p>Daarna verschijnen de boeken die bij jouw leesniveau horen.</p></div></section>`;
    return;
  }
  const list = books.filter(b=>b.level===currentLevel);

  if(!list.length){
    grid.innerHTML = `<section class="hero"><div class="z">📚</div><div><h1>${currentLevel}</h1><p>De twee boeken voor dit AVI-niveau worden hier later toegevoegd.</p></div></section>`;
    return;
  }

  list.forEach(book=>{
    const locked=isDiscoverLocked(book);
    const cardWrap=document.createElement("div");
    cardWrap.className="card-wrap";
    const card = document.createElement("button");
    card.className = `card${locked?" pro-locked":""}`;
    if(locked){
      card.setAttribute("aria-disabled","true");
      card.setAttribute("aria-label",`${book.title} – enkel beschikbaar in Pro`);
    }
    card.innerHTML = `
      <div class="cover">
        <span class="badge">${book.level}</span>
        ${locked?`<span class="pro-lock">🔒 Enkel in Pro</span>`:""}
        ${book.startBook?`<div class="start-card-cover tone-${book.coverTone||"blue"}"><img src="${book.coverImage}" alt=""><strong>${book.title}</strong><small>AVI START</small></div>`:book.cover&&typeof book.cover==="object"?`<div class="cover-sprite" role="img" aria-label="Cover van ${escapeAttr(book.title)}" style="${spriteStyle(book.cover)}"></div>`:`<img class="cover-image" src="${book.cover}" alt="Voorkaft van ${escapeAttr(book.title)}">`}
      </div>
      <div class="cardtext">
        <h3>${book.title}</h3>
        <p>${book.blurb}</p>
      </div>`;
    if(!locked)card.addEventListener("click",()=>openBook(book));
    cardWrap.append(card);
    grid.appendChild(cardWrap);
  });
}

function openBook(book){
  if(!book||isDiscoverLocked(book))return;
  currentBook = book;
  pageIndex = 0;
  pageTaskPassed = false;
  reviewMode = false;
  if(book.startBook){startFluencyBook();return}
  renderBookCover();
}

function renderBookCover(){
  clearInterval(speedTimer);speedTimer=null;
  document.body.classList.add("reading-mode");
  document.body.classList.remove("mission-mode");
  document.querySelector(".level-display span").textContent=`AVI ${currentBook.level}`;
  const booksAtLevel = books.filter(book=>book.level===currentBook.level);
  const bookNumber = booksAtLevel.findIndex(book=>book.id===currentBook.id)+1;
  const hasWordStart = Boolean(preReadingGames[currentBook.id]);
  const hasPractice = Boolean(window.ZISA_FLUENCY_BOOKS?.[currentBook.id]?.length);
  app.innerHTML=`<div class="reader cover-reader">
    <aside class="rail">
      <span class="lvl">${currentBook.level}</span><small>Boek ${bookNumber} van ${booksAtLevel.length}</small>
      <div class="book-thumbs">${booksAtLevel.map(book=>{const locked=isDiscoverLocked(book);return `<button class="book-thumb ${book.id===currentBook.id?"on":""} ${locked?"pro-locked":""}" data-book="${book.id}" ${locked?'aria-disabled="true"':`aria-label="Open ${book.title}"`}>${book.cover&&typeof book.cover==="object"?`<span class="cover-sprite" role="img" aria-label="" style="${spriteStyle(book.cover)}"></span>`:`<img class="thumb-image" src="${book.cover}" alt="">`}<span>${locked?"🔒 Enkel in Pro":book.title}</span></button>`}).join("")}</div>
    </aside>
    <div><section class="book book-cover-stage">
      <div class="bookhead"><h2>${currentBook.title}</h2><div class="count">Voorkaft</div></div>
      <div class="spread cover-spread">
        <div class="art cover-art">${imageBlock(currentBook.cover,`Voorkaft van ${currentBook.title}`)}<div class="art-title">${currentBook.title}</div><div class="cover-byline">Een verhaal van Zisa ♥</div></div>
        <article class="cover-intro"><span class="cover-level">AVI ${currentBook.level}</span><h1>${currentBook.title}</h1><p>${currentBook.blurb}</p><small>${currentBook.pages.length} leesbladzijden</small><div class="cover-actions"><button id="coverStart" class="cover-start">Lees het verhaal ›</button>${hasWordStart?`<button id="coverWords" class="cover-secondary">Oefen eerst de woorden ›</button>`:""}${hasPractice?`<button id="coverPractice" class="cover-practice">Open het extra oefenboekje ›</button>`:""}</div></article>
      </div>
      <div class="controls cover-controls"><button class="btn" id="coverBack">‹ Bibliotheek</button><span>Open het boek wanneer je klaar bent.</span></div>
    </section></div>
  </div>`;
  document.querySelector("#coverBack").onclick=renderLibrary;
  document.querySelector("#coverStart").onclick=renderReader;
  document.querySelector("#coverWords")?.addEventListener("click",renderWordStart);
  document.querySelector("#coverPractice")?.addEventListener("click",startFluencyBook);
  document.querySelectorAll(".book-thumb:not(.pro-locked)").forEach(btn=>btn.onclick=()=>openBook(books.find(book=>book.id===btn.dataset.book)));
}

function renderWordStart(){
  clearInterval(speedTimer);speedTimer=null;
  document.body.classList.add("reading-mode","mission-mode");
  document.querySelector(".level-display span").textContent=`AVI ${currentBook.level}`;
  const game=preReadingGames[currentBook.id];
  if(!game){renderReader();return}
  app.innerHTML=`<section class="mission-stage wordstart-stage">
    <header class="mission-progress"><button id="wordStartBack" aria-label="Terug naar de voorkaft">‹ Voorkaft</button><div><b>Woordstart vóór het verhaal</b><span>Oefen de woorden die straks in het boek staan.</span></div><div class="mission-bar"><i style="width:0"></i></div></header>
    <div class="mission-card"><img class="mission-zebra" src="images/zisa-leest.png" alt="Zisa leest"><div class="mission-icon">⏱️</div><h2>Tempolezen</h2><div class="mission-question-row"><p class="mission-question">Lees drie keer één minuut en probeer jezelf te verslaan.</p></div><div id="missionActivity"></div><p id="missionFeedback" class="mission-feedback" aria-live="polite"></p><button class="wordstart-skip">Sla over en start het verhaal ›</button></div>
  </section>`;
  document.querySelector("#wordStartBack").onclick=renderBookCover;
  document.querySelector(".wordstart-skip").onclick=renderReader;
  renderSpeedGame(game,document.querySelector("#missionActivity"),()=>{
    document.querySelector(".wordstart-skip")?.remove();
    setMissionFeedback("Knap geoefend! Nu zul je de woorden in het verhaal sneller herkennen. ⭐","good");
    const start=document.createElement("button");start.className="mission-next";start.textContent="Start het verhaal ›";start.onclick=renderReader;document.querySelector(".mission-card").append(start);
  });
}

function inlineTaskMarkup(task){
  const answers=task.a.map((answer,index)=>({answer,index}));
  return `<section class="inline-task">
    <div class="inline-task-head"><img src="images/zisa-zebra.png" alt=""><div><b>Leesvraag</b><span>${task.q}</span></div>${hasAudioSupport()?`<button class="listen-btn" data-say="${escapeAttr(task.q)}" aria-label="Lees de vraag voor">🔊</button>`:""}</div>
    <div class="inline-answers">${answers.map(({answer,index})=>hasAudioSupport()?`<div class="inline-answer-wrap"><button class="inline-answer" data-answer="${index}">${answer}</button><button class="mini-listen" data-say="${escapeAttr(answer)}" aria-label="Lees ${escapeAttr(answer)} voor">🔊</button></div>`:`<button class="inline-answer" data-answer="${index}">${answer}</button>`).join("")}</div>
    <div class="inline-feedback" aria-live="polite">Kies een antwoord om door te gaan.</div>
  </section>`;
}

function renderReader(){
  clearInterval(speedTimer);speedTimer=null;
  document.body.classList.add("reading-mode");
  document.body.classList.remove("mission-mode");
  document.querySelector(".level-display span").textContent=`AVI ${currentBook.level}`;
  const page = currentBook.pages[pageIndex];
  const total = currentBook.pages.length;
  const booksAtLevel = books.filter(book=>book.level===currentBook.level);
  const bookNumber = booksAtLevel.findIndex(book=>book.id===currentBook.id)+1;

  app.innerHTML = `
    <div class="reader">
      <aside class="rail">
        <span class="lvl">${currentBook.level}</span>
        <small>Boek ${bookNumber} van ${booksAtLevel.length}</small>
        <div class="book-thumbs">
          ${booksAtLevel.map(book=>{const locked=isDiscoverLocked(book);return `<button class="book-thumb ${book.id===currentBook.id?"on":""} ${locked?"pro-locked":""}" data-book="${book.id}" ${locked?'aria-disabled="true"':`aria-label="Open ${book.title}"`}>${book.cover&&typeof book.cover==="object"?`<span class="cover-sprite" role="img" aria-label="" style="${spriteStyle(book.cover)}"></span>`:`<img class="thumb-image" src="${book.cover}" alt="">`}<span>${locked?"🔒 Enkel in Pro":book.title}</span></button>`}).join("")}
        </div>
      </aside>

      <div>
        <section class="book">
          <div class="bookhead">
            <h2>${currentBook.title}</h2>
            <div class="count">${pageIndex+1} / ${total}</div>
          </div>

          <div class="spread">
            <div class="art">
              ${imageBlock(page.image, `Illustratie bij ${currentBook.title}, pagina ${pageIndex+1}`)}
            </div>
            <article class="story ${currentBook.level==="M3"?"m3-story":""}">
              ${reviewMode?`<div class="review-note">📖 Lees deze ${reviewEndPage>pageIndex?"bladzijden":"bladzijde"} opnieuw. De leesvragen zijn nu weg.</div>`:""}
              ${hasAudioSupport("story")?`<button class="story-listen" data-say="${escapeAttr(page.text)}" aria-label="Lees de bladzijde voor">🔊 Lees voor</button>`:""}
              <div class="storytext">${storyTextMarkup(page.text)}</div>
              ${page.task&&!reviewMode ? inlineTaskMarkup(page.task) : ""}
            </article>
          </div>

          <div class="controls">
            <button class="btn" id="prevBtn" ${pageIndex===0?"disabled":""}>‹ Vorige</button>
            ${reviewMode&&pageIndex>=reviewEndPage?`<button class="return-task" id="returnTask">✓ Ik heb opnieuw gelezen</button>`:reviewMode?`<span class="review-progress">Lees verder tot bladzijde ${reviewEndPage+1}</span>`:`<div class="page-dots" aria-label="Voortgang">${currentBook.pages.map((_,i)=>`<span class="page-dot ${i===pageIndex?"on":""}"></span>`).join("")}</div>`}
            <button class="btn next" id="nextBtn" ${!reviewMode&&page.task&&!pageTaskPassed?"disabled":""}>${reviewMode?(pageIndex>=reviewEndPage?"Terug naar opdracht ›":"Volgende ›"):(page.task&&!pageTaskPassed?"Beantwoord eerst 🔒":pageIndex===total-1?"Eindmissie ›":"Volgende ›")}</button>
          </div>
        </section>
      </div>
    </div>`;

  document.querySelector("#prevBtn").addEventListener("click",()=>{
    if(pageIndex>0) turnPage(-1);
  });

  document.querySelector("#nextBtn").addEventListener("click",()=>{
    if(reviewMode&&pageIndex>=reviewEndPage){reviewMode=false;renderMission()}
    else if(pageIndex < total-1){ turnPage(1); }
    else renderEndTask();
  });
  document.querySelector("#returnTask")?.addEventListener("click",()=>{reviewMode=false;renderMission()});

  document.querySelectorAll(".book-thumb:not(.pro-locked)").forEach(btn=>{
    btn.addEventListener("click",()=>openBook(books.find(book=>book.id===btn.dataset.book)));
  });

  if(page.task&&!reviewMode) bindInlineTask(page.task);
  bindSpeechButtons(app);
  bindGlossaryWords(app);
}

function bindInlineTask(task){
  const answers = document.querySelectorAll(".inline-answer");
  const feedback = document.querySelector(".inline-feedback");
  const next = document.querySelector("#nextBtn");
  answers.forEach(btn=>btn.addEventListener("click",()=>{
    answers.forEach(answer=>answer.classList.remove("good","bad"));
    if(Number(btn.dataset.answer)===task.correct){
      btn.classList.add("good");
      answers.forEach(answer=>answer.disabled=true);
      feedback.textContent="Goed gevonden! Je mag door. ⭐";
      pageTaskPassed=true;
      next.disabled=false;
      next.textContent=pageIndex===currentBook.pages.length-1?"Eindmissie ›":"Volgende ›";
    }else{
      btn.classList.add("bad");
      feedback.textContent=task.hint||"Lees de bladzij nog eens.";
    }
  }));
}

function turnPage(direction){
  if(isTurning) return;
  if("speechSynthesis" in window)speechSynthesis.cancel();
  const nextIndex = pageIndex + direction;
  if(nextIndex<0 || nextIndex>=currentBook.pages.length) return;
  if(window.matchMedia("(max-width: 840px)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    pageIndex = nextIndex;
    pageTaskPassed = false;
    renderReader();
    return;
  }
  isTurning = true;
  const oldSpread = document.querySelector(".spread");
  const currentArt=oldSpread.querySelector(".art").innerHTML;
  const currentStory=oldSpread.querySelector(".story").innerHTML;
  pageIndex = nextIndex;
  pageTaskPassed = false;
  renderReader();
  const spread = document.querySelector(".spread");
  const upcomingArt=spread.querySelector(".art").innerHTML;
  const upcomingStory=spread.querySelector(".story").innerHTML;
  const freeze=document.createElement("div");
  freeze.className=`turn-freeze ${direction>0?"turn-freeze-left art":"turn-freeze-right story"}`;
  freeze.innerHTML=direction>0?currentArt:currentStory;
  const sheet = document.createElement("div");
  sheet.className = `turn-sheet ${direction>0?"turn-next":"turn-prev"}`;
  sheet.innerHTML = direction>0 ? `
    <div class="turn-face turn-front turn-story-face story">${currentStory}</div>
    <div class="turn-face turn-back turn-art-face art">${upcomingArt}</div>` : `
    <div class="turn-face turn-front turn-art-face art">${currentArt}</div>
    <div class="turn-face turn-back turn-story-face story">${upcomingStory}</div>`;
  spread.append(freeze,sheet);
  requestAnimationFrame(()=>sheet.classList.add("turning"));
  window.setTimeout(()=>{
    freeze.remove();sheet.remove();
    isTurning = false;
  },820);
}

function renderTask(task, onCorrect, title){
  const slot = document.querySelector("#taskSlot");
  slot.innerHTML = `
    <section class="task">
      <div class="taskhead">
        <img class="task-zebra" src="images/zisa-zebra.png" alt="Zisa de zebra">
        <div><h3>${title}</h3><p>${task.q}</p></div>
      </div>
      <div class="answers"></div>
      <div class="feedback"></div>
    </section>`;

  const answers = slot.querySelector(".answers");
  const feedback = slot.querySelector(".feedback");

  task.a.forEach((answer,i)=>{
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.textContent = answer;
    btn.addEventListener("click",()=>{
      answers.querySelectorAll(".answer").forEach(b=>b.classList.remove("good","bad"));
      if(i===task.correct){
        btn.classList.add("good");
        feedback.textContent = "Goed gevonden! ⭐";
        answers.querySelectorAll(".answer").forEach(b=>b.disabled=true);
        onCorrect();
      }else{
        btn.classList.add("bad");
        feedback.textContent = task.hint || "Lees nog eens goed.";
      }
    });
    answers.appendChild(btn);
  });
}

function renderEndTask(){
  reviewMode=false;
  missionIndex=0;
  missionScore=0;
  renderMission();
}

function renderMission(){
  clearInterval(speedTimer);speedTimer=null;
  document.body.classList.add("reading-mode","mission-mode");
  const games=bookGames[currentBook.id]||[currentBook.endTask];
  const game=games[missionIndex];
  app.innerHTML=`<section class="mission-stage">
    <header class="mission-progress"><button id="missionBack" aria-label="Terug naar het boek">‹ Boek</button><div><b>Taalreis na het verhaal</b><span>${missionIndex+1} van ${games.length}</span></div><button id="missionFullscreen" class="mission-fullscreen" type="button" aria-label="Open volledig scherm">⛶ <span>Volledig scherm</span></button><div class="mission-bar"><i style="width:${missionIndex/games.length*100}%"></i></div></header>
    <div class="mission-card"><img class="mission-zebra" src="images/zisa-zebra.png" alt=""><div class="mission-icon">${game.icon||"⭐"}</div><h2>${game.title||"Leesmissie"}</h2>${game.showBookTitle?`<div class="question-book-title"><small>Titel van het verhaal</small><strong>${escapeAttr(currentBook.title)}</strong></div>`:""}${game.context?`<blockquote class="meaning-context">${escapeAttr(game.context)}</blockquote>`:""}<div class="mission-question-row"><p class="mission-question">${game.q}</p>${hasAudioSupport()?`<button class="listen-btn" data-say="${escapeAttr(`${game.context?`${game.context} `:""}${game.q}`)}" aria-label="Lees de opdracht voor">🔊</button>`:""}</div><div id="missionActivity"></div><p id="missionFeedback" class="mission-feedback" aria-live="polite"></p></div>
  </section>`;
  document.querySelector("#missionBack").onclick=()=>{reviewMode=false;renderReader()};
  bindMissionFullscreen();
  renderGame(game);
  bindSpeechButtons(app);
}

function bindMissionFullscreen(){
  const button=document.querySelector("#missionFullscreen");
  if(!button)return;
  const canFullscreen=document.fullscreenEnabled&&document.documentElement.requestFullscreen;
  if(!canFullscreen){button.hidden=true;return}
  const update=()=>{const active=Boolean(document.fullscreenElement);button.innerHTML=active?'⛶ <span>Verlaat volledig scherm</span>':'⛶ <span>Volledig scherm</span>';button.setAttribute("aria-label",active?"Verlaat volledig scherm":"Open volledig scherm")};
  button.onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
  document.onfullscreenchange=update;
  update();
}

function renderGame(game){
  const activity=document.querySelector("#missionActivity");
  if(game.image){const figure=document.createElement("figure");figure.className="game-picture";figure.innerHTML=imageBlock(game.image,game.imageAlt||"Prent uit het verhaal");activity.append(figure)}
  if(game.type==="sentence") return renderSentenceGame(game,activity);
  if(game.type==="sequence") return renderSequenceGame(game,activity);
  if(game.type==="speed") return renderSpeedGame(game,activity);
  const answers=game.type==="article"?["de","het"]:game.a;
  if(game.type==="sound"){
    const line=document.createElement("div");line.className="game-sentence";line.textContent=game.sentence;activity.append(line);
  }
  const choices=document.createElement("div");choices.className="game-choices";activity.append(choices);
  answers.map((answer,index)=>({answer,index})).forEach(({answer,index})=>{
    const btn=document.createElement("button");btn.className=`game-choice${game.type==="vocabulary-image"?" picture-choice":""}`;
    const answerText=typeof answer==="object"?answer.text:answer;
    if(game.type==="vocabulary-image")btn.innerHTML=`${imageBlock(answer.image,answer.text)}<span>${escapeAttr(answer.text)}</span>`;
    else btn.textContent=game.type==="article"?`${answer} ${game.word}`:answerText;
    btn.onclick=()=>{
      const correct=game.type==="article"?answer===game.correct:index===game.correct;
      if(correct) finishGame(btn,game.type==="sound"?`Juist! In ${answers[index]} hoor je de ${game.kind}.`:"Juist! Goed gekeken. ⭐");
      else{btn.classList.add("wrong");setTimeout(()=>btn.classList.remove("wrong"),450);setMissionFeedback(game.hint||"Kijk nog eens goed en probeer opnieuw.","bad");offerReread(game)}
    };
    if(hasAudioSupport()){const wrap=document.createElement("div");wrap.className="game-choice-wrap";wrap.append(btn,makeListenButton(answerText,`Beluister ${answerText}`));choices.append(wrap)}
    else choices.append(btn);
  });
}

function renderSentenceGame(game,activity){
  const help=document.createElement("div");help.className="role-help";help.innerHTML=Object.entries(roleColors).slice(0,4).map(([role,color])=>`<span style="--role:${color}">${role}</span>`).join("");
  const bank=document.createElement("div");bank.className="sentence-bank";
  const line=document.createElement("div");line.className="sentence-build";line.innerHTML="<small>Tik de delen in de goede volgorde</small>";
  const shuffled=shuffledWrong(game.parts,part=>part.text);
  let dragged=null;
  const move=(piece,target)=>{target.append(piece);checkBuiltSentence(game,line)};
  [bank,line].forEach(zone=>{
    zone.ondragover=event=>event.preventDefault();
    zone.ondrop=event=>{event.preventDefault();if(dragged)move(dragged,zone);dragged=null};
  });
  shuffled.forEach(part=>{
    const piece=document.createElement("div");piece.className="sentence-piece";piece.draggable=true;piece.dataset.text=part.text;piece.dataset.role=part.role;piece.style.setProperty("--role",roleColors[part.role]);
    piece.ondragstart=()=>{dragged=piece;piece.classList.add("dragging")};piece.ondragend=()=>{piece.classList.remove("dragging");dragged=null};
    const handle=document.createElement("span");handle.className="drag-handle";handle.textContent="⠿";handle.title="Sleep dit zinsdeel";handle.setAttribute("aria-hidden","true");
    handle.onpointerdown=event=>{
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);piece.classList.add("dragging");
      handle.onpointerup=endEvent=>{
        const target=document.elementFromPoint(endEvent.clientX,endEvent.clientY)?.closest(".sentence-bank,.sentence-build");
        piece.classList.remove("dragging");handle.releasePointerCapture(endEvent.pointerId);handle.onpointerup=null;
        if(target)move(piece,target);
      };
      handle.onpointercancel=()=>{piece.classList.remove("dragging");handle.onpointerup=null};
    };
    const word=document.createElement("button");word.type="button";word.className="piece-word";word.textContent=part.text;word.onclick=()=>move(piece,piece.parentElement===bank?line:bank);
    piece.append(handle,word);if(hasAudioSupport())piece.append(makeListenButton(part.text,`Beluister ${part.text}`));bank.append(piece);
  });
  activity.append(help,bank,line);
}

function checkBuiltSentence(game,line){
  const cards=[...line.querySelectorAll(".sentence-piece")];
  if(cards.length<game.parts.length)return;
  const good=cards.every((card,index)=>card.dataset.text===game.parts[index].text);
  if(good){cards.forEach(card=>{card.classList.add("completed");card.draggable=false;card.querySelector(".piece-word").disabled=true});finishGame(null,"Mooi! De kleuren tonen wie wat doet. ⭐")}
  else{line.classList.add("wrong");setMissionFeedback("Nog niet. Tik de delen terug en bouw: wie – doet – wat of waar.","bad");setTimeout(()=>line.classList.remove("wrong"),450)}
}

function renderSequenceGame(game,activity){
  const bank=document.createElement("div");bank.className="sequence-bank";
  const line=document.createElement("div");line.className="sequence-build";
  game.items.forEach((_,index)=>{const slot=document.createElement("div");slot.className="sequence-slot";slot.dataset.index=index;slot.innerHTML=`<span class="sequence-number">${index+1}</span><div class="sequence-drop"><small>Sleep hier</small></div>`;line.append(slot)});
  let dragged=null;
  const dropTargetAt=(x,y)=>{
    const hit=document.elementFromPoint(x,y);
    const direct=hit?.closest(".sequence-bank,.sequence-drop,.sequence-slot");
    if(direct)return direct;
    if(!hit?.closest(".sequence-build"))return null;
    const slots=[...line.querySelectorAll(".sequence-slot")];
    return slots.reduce((nearest,slot)=>{
      const rect=slot.getBoundingClientRect();
      const distance=Math.abs(y-(rect.top+rect.height/2));
      return !nearest||distance<nearest.distance?{slot,distance}:nearest;
    },null)?.slot||null;
  };
  const move=(piece,target)=>{
    if(line.classList.contains("locked")||!target)return;
    const destination=target.classList.contains("sequence-slot")?target.querySelector(".sequence-drop"):target;
    if(!destination?.matches(".sequence-bank,.sequence-drop"))return;
    if(destination.classList.contains("sequence-drop")&&destination.querySelector(".sequence-piece"))bank.append(destination.querySelector(".sequence-piece"));
    destination.append(piece);checkSequenceGame(game,line);
  };
  [bank,line,...line.querySelectorAll(".sequence-slot")].forEach(zone=>{
    zone.ondragover=event=>event.preventDefault();
    zone.ondrop=event=>{event.preventDefault();event.stopPropagation();if(dragged)move(dragged,zone===line?dropTargetAt(event.clientX,event.clientY):zone);dragged=null};
  });
  shuffledWrong(game.items).forEach(item=>{
    const piece=document.createElement("div");piece.className="sequence-piece";piece.draggable=true;piece.dataset.text=item;
    piece.ondragstart=()=>{dragged=piece;piece.classList.add("dragging")};piece.ondragend=()=>{piece.classList.remove("dragging");dragged=null};
    const handle=document.createElement("span");handle.className="drag-handle";handle.textContent="⠿";handle.title="Sleep deze gebeurtenis";handle.setAttribute("aria-hidden","true");
    handle.onpointerdown=event=>{
      event.preventDefault();handle.setPointerCapture(event.pointerId);piece.classList.add("dragging");
      handle.onpointerup=endEvent=>{
        const target=dropTargetAt(endEvent.clientX,endEvent.clientY);
        piece.classList.remove("dragging");handle.releasePointerCapture(endEvent.pointerId);handle.onpointerup=null;if(target)move(piece,target);
      };
      handle.onpointercancel=()=>{piece.classList.remove("dragging");handle.onpointerup=null};
    };
    const textButton=document.createElement("button");textButton.type="button";textButton.className="sequence-text";textButton.textContent=item;textButton.onclick=()=>{const empty=[...line.querySelectorAll(".sequence-drop")].find(drop=>!drop.querySelector(".sequence-piece"));move(piece,piece.parentElement===bank&&empty?empty:bank)};
    piece.append(handle,textButton);if(hasAudioSupport())piece.append(makeListenButton(item,`Beluister ${item}`));bank.append(piece);
  });
  activity.append(bank,line);
}

function checkSequenceGame(game,line){
  const slots=[...line.querySelectorAll(".sequence-slot")];
  const cards=slots.map(slot=>slot.querySelector(".sequence-piece"));
  if(cards.length<game.items.length)return;
  if(cards.some(card=>!card))return;
  const good=cards.every((card,index)=>card.dataset.text===game.items[index]);
  if(good){cards.forEach(card=>{card.classList.add("completed");card.draggable=false;card.querySelector(".sequence-text").disabled=true});finishGame(null,"Goed geordend! Je kent het begin, het midden en het einde. ⭐")}
  else{
    slots.forEach((slot,index)=>slot.classList.toggle("wrong",cards[index].dataset.text!==game.items[index]));
    line.classList.add("locked");cards.forEach(card=>{card.draggable=false;card.querySelector(".sequence-text").disabled=true});
    setMissionFeedback("De rood gemarkeerde zinnen staan nog niet goed. Lees eerst het verhaal opnieuw; daarna mag je verbeteren.","bad");offerReread(game);
  }
}

function reviewPageForGame(game){
  if(game.type==="sequence")return {start:0,end:currentBook.pages.length-1};
  if(Number.isInteger(game.reviewPage))return {start:game.reviewPage,end:game.reviewPage};
  const page=targetedReviewPages[currentBook.id]?.[missionIndex];
  return Number.isInteger(page)?{start:page,end:page}:null;
}
function offerReread(game){
  const target=reviewPageForGame(game);
  if(!target)return;
  if(document.querySelector(".reread-btn"))return;
  const button=document.createElement("button");button.type="button";button.className="reread-btn";button.textContent=target.start===target.end?`📖 Lees bladzijde ${target.start+1} opnieuw`:`📖 Lees het verhaal opnieuw`;
  button.onclick=()=>{reviewMode=true;pageIndex=target.start;reviewEndPage=target.end;pageTaskPassed=true;renderReader()};
  document.querySelector(".mission-card")?.append(button);
}

function renderSpeedGame(game,activity,onComplete=null){
  let round=0,wordIndex=0,readCount=0,secondsLeft=60,running=false;
  const scores=[];
  const showIntro=()=>{
    activity.innerHTML=`<div class="speed-intro"><p><b>Zo werkt het:</b> lees elk woord hardop. Tik daarna op <em>Gelezen</em>. Een moeilijk woord mag je met <em>Nog oefenen</em> overslaan.</p><p class="speed-honesty">⭐ Jij oefent voor jezelf. Tik alleen op ‘Gelezen’ als je het woord echt hardop las.</p><button class="speed-start">Start ronde ${round+1}</button><small>Je krijgt één minuut. Daarna probeer je dezelfde woorden opnieuw.</small></div>`;
    activity.querySelector(".speed-start").onclick=startRound;
  };
  const startRound=()=>{
    running=true;wordIndex=0;readCount=0;secondsLeft=60;
    activity.innerHTML=`<div class="speed-head"><span>Ronde <b>${round+1}</b> van 3</span><strong class="speed-clock">1:00</strong><span><b class="speed-count">0</b> gelezen</span></div><div class="speed-word" aria-live="polite"></div><div class="speed-actions"><button class="speed-skip">Nog oefenen</button><button class="speed-read">Gelezen →</button></div><p class="speed-partner">Met een leesmaatje? Laat je maatje op de knoppen tikken.</p>`;
    const word=activity.querySelector(".speed-word"),count=activity.querySelector(".speed-count"),clock=activity.querySelector(".speed-clock");
    const showWord=()=>{word.textContent=game.words[wordIndex%game.words.length]};
    const advance=didRead=>{if(!running)return;if(didRead){readCount++;count.textContent=readCount}wordIndex++;showWord()};
    activity.querySelector(".speed-read").onclick=()=>advance(true);
    activity.querySelector(".speed-skip").onclick=()=>advance(false);
    showWord();
    const started=Date.now();
    speedTimer=setInterval(()=>{
      secondsLeft=Math.max(0,60-Math.floor((Date.now()-started)/1000));clock.textContent=`${Math.floor(secondsLeft/60)}:${String(secondsLeft%60).padStart(2,"0")}`;
      if(secondsLeft===0){clearInterval(speedTimer);speedTimer=null;running=false;scores.push(readCount);showRoundResult()}
    },200);
  };
  const showRoundResult=()=>{
    const best=Math.max(...scores),improvement=scores.length>1?scores.at(-1)-scores[0]:0;
    activity.innerHTML=`<div class="speed-result"><div class="speed-score">${scores.at(-1)}</div><h3>woorden gelezen</h3><p>${round===0?"Mooi begin! Straks lees je dezelfde woorden opnieuw.":improvement>0?`Je las al ${improvement} woord${improvement===1?"":"en"} meer dan in ronde 1!`:"Blijf rustig en nauwkeurig lezen."}</p><div class="round-scores">${scores.map((score,index)=>`<span>Ronde ${index+1}<b>${score}</b></span>`).join("")}</div></div>`;
    round++;
    if(round<3){const button=document.createElement("button");button.className="speed-start";button.textContent=`Start ronde ${round+1}`;button.onclick=showIntro;activity.querySelector(".speed-result").append(button)}
    else if(onComplete)onComplete(scores,best);
    else finishGame(null,`Knap geoefend! Je scores waren ${scores.join(", ")} woorden. Je beste ronde: ${best}. ⭐`);
  };
  showIntro();
}

function setMissionFeedback(text,kind){const el=document.querySelector("#missionFeedback");el.textContent=text;el.className=`mission-feedback ${kind||""}`}
function finishGame(button,message){
  document.querySelectorAll("#missionActivity .game-choice").forEach(btn=>btn.disabled=true);document.querySelector(".reread-btn")?.remove();button?.classList.add("correct");missionScore++;setMissionFeedback(message,"good");
  const last=missionIndex===(bookGames[currentBook.id]?.length||1)-1;
  if(last){
    const card=document.querySelector(".mission-card");card.classList.add("mission-finished");
    card.querySelector(".mission-icon").textContent="🎉";card.querySelector("h2").textContent="Taalreis klaar!";
    card.querySelector(".question-book-title")?.remove();card.querySelector(".meaning-context")?.remove();
    card.querySelector(".mission-question-row").innerHTML='<p class="mission-question">Je hebt alle opdrachten gemaakt. Ga nu verder naar je vlotleesboekje.</p>';
    document.querySelector("#missionActivity").innerHTML='<div class="mission-finish-panel"><strong>Goed gewerkt!</strong><span>In het vlotleesboekje oefen je nog kort op vlot en nauwkeurig lezen.</span></div>';
    setMissionFeedback("Alles is klaar. ⭐","good");
  }
  const next=document.createElement("button");next.className="mission-next";next.textContent=last?"Open mijn vlotleesboekje ›":"Volgende opdracht ›";next.onclick=()=>{missionIndex++;missionIndex>=(bookGames[currentBook.id]?.length||1)?startFluencyBook():renderMission()};document.querySelector(".mission-card").append(next);
}

function startFluencyBook(){fluencyIndex=-1;fluencyScore=0;renderFluencyBook()}

function renderFluencyBook(){
  clearInterval(speedTimer);speedTimer=null;
  document.body.classList.add("reading-mode","fluency-mode");document.body.classList.remove("mission-mode");
  const pages=window.ZISA_FLUENCY_BOOKS?.[currentBook.id]||[];
  if(!pages.length){renderFinish();return}
  const cover=fluencyIndex<0,page=cover?null:pages[fluencyIndex];
  const sidePage=!cover&&!currentBook.startBook&&currentBook.pages?.length?currentBook.pages[fluencyIndex%currentBook.pages.length]:null;
  app.innerHTML=`<section class="fluency-shell">
    <header class="fluency-head"><button id="fluencyBack">‹ Taalreis</button><div><b>${currentBook.startBook?"Mijn leesstartboekje":"Mijn vlotleesboekje"}</b><span>${cover?"Voorkaft":`${fluencyIndex+1} van ${pages.length}`}</span></div><div class="fluency-dots">${pages.map((_,i)=>`<i class="${i===fluencyIndex?"on":""}"></i>`).join("")}</div></header>
    <div class="mini-book ${cover?"mini-cover":""}">
      <div class="mini-left">${cover&&currentBook.startBook?`<div class="start-mini-cover tone-${currentBook.coverTone||"blue"}"><img src="${currentBook.coverImage}" alt=""><strong>${currentBook.title}</strong><span>AVI START</span></div>`:cover?`<img src="images/zisa-leest.png" alt="Zisa leest"><span>AVI ${currentBook.level}</span>`:currentBook.startBook?`<img class="fluency-illustration" src="${page.iconImage||currentBook.coverImage}" alt=""><h2>${page.title}</h2><p>${currentBook.title}</p>`:`<div class="fluency-side-art">${imageBlock(sidePage.image,`Prent uit ${currentBook.title}`)}</div><h2>${page.title}</h2><p>${currentBook.title}</p>`}</div>
      <article class="mini-right">${cover?`<small>${currentBook.startBook?"AVI START":"BONUSBOEKJE"}</small><h1>${currentBook.startBook?currentBook.title:"Lees vlot<br>en mooi"}</h1><p>${currentBook.startBook?currentBook.blurb:`${pages.length} korte oefenbladzijden die aansluiten bij jouw verhaal.`}</p><small>${pages.length} oefenbladzijden</small><button class="fluency-next" id="fluencyStart">Open het boekje ›</button>`:`<h2>${page.title}</h2>${page.context?`<blockquote class="meaning-context">${escapeAttr(page.context)}</blockquote>`:""}<div class="fluency-question-row"><p class="fluency-question">${page.q}</p>${hasAudioSupport()?`<button class="listen-btn" data-say="${escapeAttr(`${page.context?`${page.context} `:""}${page.q}`)}" aria-label="Lees de opdracht voor">🔊</button>`:""}</div><div id="fluencyActivity"></div><p id="fluencyFeedback" aria-live="polite"></p>`}</article>
    </div></section>`;
  document.querySelector("#fluencyBack").textContent=currentBook.startBook?"‹ Bibliotheek":"‹ Taalreis";
  document.querySelector("#fluencyBack").onclick=()=>{document.body.classList.remove("fluency-mode");if(currentBook.startBook)renderLibrary();else{missionIndex=Math.max(0,(bookGames[currentBook.id]?.length||1)-1);renderMission()}};
  if(cover){document.querySelector("#fluencyStart").onclick=()=>{fluencyIndex=0;renderFluencyBook()};return}
  renderFluencyPage(page,pages.length);
  bindSpeechButtons(app);
}

function renderFluencyPage(page,total){
  const activity=document.querySelector("#fluencyActivity");
  if(page.focus){
    const wrap=document.createElement("div");wrap.className="fluency-focus-wrap";
    const focus=document.createElement("div");focus.className="fluency-focus";focus.textContent=page.focus;wrap.append(focus);
    if(hasAudioSupport())wrap.append(makeListenButton(page.focus,`Beluister ${page.focus}`));
    activity.append(wrap)
  }
  if(page.chunks){
    const train=document.createElement("div");train.className="word-train";
    const instruction=document.createElement("p");instruction.className="train-instruction";activity.append(instruction,train);
    instruction.textContent="Zoem elke klank zolang je ze ziet.";
    const boxes=page.chunks.map(()=>{const box=document.createElement("span");box.className="sound-box";train.append(box);return box});
    const start=document.createElement("button");start.className="start-zoom";start.textContent="Start met zoemen";activity.append(start);
    let step=0;
    const showStep=()=>{
      boxes.forEach(box=>{box.textContent="";box.classList.remove("active")});
      if(step>=page.chunks.length){start.remove();joinWord();return}
      boxes[step].textContent=page.chunks[step];boxes[step].classList.add("active");
      step++;setTimeout(showStep,1700)
    };
    const joinWord=()=>{
      instruction.textContent="Lees nu het hele woord.";
      train.innerHTML=`<div class="joining-word">${page.chunks.map(chunk=>`<span>${chunk}</span>`).join("")}</div>`;
      setTimeout(()=>{train.innerHTML=`<strong>${page.word}</strong>`;instruction.textContent=`Lees nu zelf: ${page.word}.`;document.querySelector("#fluencyFeedback").textContent="Knap! Je maakte het hele woord.";fluencyScore++;addFluencyNext(total)},900)
    };
    start.onclick=()=>{start.disabled=true;start.textContent="Zoem mee…";showStep()}
  }else if(page.pictures){
    const text=document.createElement("div");text.className="fluency-read main sentence-highlight";text.innerHTML=storyTextMarkup(page.text);activity.append(text);
    const listen=makeListenButton(page.text,"Lees de zin voor");listen.classList.add("fluency-listen");listen.onclick=event=>{event.stopPropagation();speak(page.text,text)};activity.append(listen);
    const choices=document.createElement("div");choices.className="fluency-picture-choices";activity.append(choices);
    page.pictures.map((picture,index)=>({picture,index})).forEach(({picture,index})=>{
      const button=document.createElement("button");button.innerHTML=`<img src="${picture.src}" alt="${escapeAttr(picture.alt)}">`;button.setAttribute("aria-label",picture.alt);button.onclick=()=>{
        if(index!==page.correct){button.classList.add("wrong");document.querySelector("#fluencyFeedback").textContent=page.hint||"Lees de zin nog eens en kijk heel goed.";setTimeout(()=>button.classList.remove("wrong"),550);return}
        button.classList.add("correct");choices.querySelectorAll("button").forEach(item=>item.disabled=true);fluencyScore++;document.querySelector("#fluencyFeedback").textContent=page.good||"Juist! Deze prent past bij de zin.";addFluencyNext(total)
      };choices.append(button)
    });
  }else if(page.eiij){
    const grid=document.createElement("div");grid.className="eiij-grid";activity.append(grid);
    page.eiij.forEach((word,index)=>{
      const card=document.createElement("div");card.className="eiij-word";card.dataset.choice="";
      card.innerHTML=`<span>${word.before}</span><div class="eiij-switch"><button type="button" data-part="ei">ei</button><button type="button" data-part="ij">ij</button></div><span>${word.after}</span>`;
      card.querySelectorAll("button").forEach(button=>button.onclick=()=>{
        if(card.classList.contains("locked"))return;
        card.dataset.choice=button.dataset.part;card.classList.remove("wrong");
        card.querySelectorAll("button").forEach(option=>option.classList.toggle("selected",option===button));
      });grid.append(card)
    });
    const check=document.createElement("button");check.type="button";check.className="fluency-check";check.textContent="Controleer mijn woorden";activity.append(check);
    check.onclick=()=>{
      const cards=[...grid.querySelectorAll(".eiij-word")];
      if(cards.some(card=>!card.dataset.choice)){document.querySelector("#fluencyFeedback").textContent="Kies bij elk woord eerst ei of ij.";return}
      let errors=0;
      cards.forEach((card,index)=>{
        const correct=card.dataset.choice===page.eiij[index].correct;
        card.classList.toggle("wrong",!correct);card.classList.toggle("locked",correct);
        card.querySelectorAll("button").forEach(button=>button.disabled=correct);
        if(!correct){errors++;card.dataset.choice="";card.querySelectorAll("button").forEach(button=>button.classList.remove("selected"))}
      });
      if(errors){document.querySelector("#fluencyFeedback").textContent=`${errors===1?"Eén woord is":"Er zijn woorden"} nog niet goed. Verbeter ${errors===1?"het rode woord":"de rode woorden"}.`;return}
      check.disabled=true;fluencyScore++;document.querySelector("#fluencyFeedback").textContent=page.good;addFluencyNext(total)
    };
  }else if(page.a){
    const choices=document.createElement("div");choices.className="fluency-choices";activity.append(choices);
    page.a.map((answer,index)=>({answer,index})).forEach(({answer,index})=>{
      const button=document.createElement("button");button.textContent=answer;button.onclick=()=>{
        if(index!==page.correct){button.classList.add("wrong");document.querySelector("#fluencyFeedback").textContent="Kijk of lees nog eens rustig.";setTimeout(()=>button.classList.remove("wrong"),500);return}
        button.classList.add("correct");choices.querySelectorAll("button").forEach(item=>item.disabled=true);fluencyScore++;
        if(page.punctuation){
          const sentence=document.querySelector(".fluency-focus");if(sentence)sentence.textContent=`${page.focus}${answer}`;
          const listen=document.querySelector(".fluency-focus-wrap .mini-listen");if(listen)listen.onclick=event=>{event.stopPropagation();speak(`${page.focus}${answer}`)}
        }
        document.querySelector("#fluencyFeedback").textContent=page.good||"Goed gelezen!";
        if(page.read){const read=document.createElement("div");read.className="fluency-read";read.textContent=page.read;activity.append(read)}
        addFluencyNext(total);
      };
      if(hasAudioSupport()){const wrap=document.createElement("div");wrap.className="fluency-choice-wrap";button.classList.add("fluency-answer");wrap.append(button,makeListenButton(spokenStartChoice(answer),`Beluister ${spokenStartChoice(answer)}`));choices.append(wrap)}
      else choices.append(button)
    });
  }else{
    if(page.moods){const moods=document.createElement("div");moods.className="fluency-moods";page.moods.forEach((mood,index)=>{const button=document.createElement("button");button.textContent=mood;button.onclick=()=>{moods.querySelectorAll("button").forEach(item=>item.classList.remove("chosen","wrong"));button.classList.add(index===page.correctMood?"chosen":"wrong");document.querySelector("#fluencyFeedback").textContent=index===page.correctMood?"Goed gekozen. Lees de zin nu met die stem.":"Denk aan wat het personage net ontdekt."};moods.append(button)});activity.append(moods)}
    const text=document.createElement("div");text.className="fluency-read main";text.textContent=page.text;activity.append(text);
    if(hasAudioSupport()){const listen=makeListenButton(page.text,"Beluister de zin");listen.classList.add("fluency-listen");activity.append(listen)}
    const tip=document.createElement("p");tip.className="fluency-tip";tip.textContent=page.tip;activity.append(tip);
    const actions=document.createElement("div");actions.className="fluency-self";
    ["Nog eens lezen","Goed gelukt"].forEach((label,index)=>{const button=document.createElement("button");button.textContent=label;button.onclick=()=>{if(index===0){text.classList.add("try-again");setTimeout(()=>text.classList.remove("try-again"),600)}else{fluencyScore++;actions.querySelectorAll("button").forEach(item=>item.disabled=true);document.querySelector("#fluencyFeedback").textContent="Mooi! Je las bewust en met aandacht.";addFluencyNext(total)}};actions.append(button)});activity.append(actions)
  }
}

function addFluencyNext(total){
  if(document.querySelector(".fluency-next-page"))return;
  const button=document.createElement("button");button.className="fluency-next fluency-next-page";button.textContent=fluencyIndex===total-1?"Boekje uit! ›":"Sla de bladzijde om ›";button.onclick=()=>{if(fluencyIndex===total-1){document.body.classList.remove("fluency-mode");renderFinish()}else{fluencyIndex++;renderFluencyBook()}};document.querySelector(".mini-right").append(button)
}

function renderFinish(){
  document.body.classList.add("reading-mode");
  document.body.classList.remove("mission-mode");
  app.innerHTML = `
    <section class="finish">
      <div class="cup">🏆</div>
      <h2>${currentBook.startBook?"Leesstartboekje uit!":"Boek uitgelezen!"}</h2>
      <p>${currentBook.startBook?`Je hebt alle bladzijden van <strong>${currentBook.title}</strong> geoefend.`:`Je hebt <strong>${currentBook.title}</strong> gelezen, ${missionScore} taalspellen opgelost en je vlotleesboekje uitgelezen.`}</p>
      <button class="btn next" id="backBooks">Kies een nieuw boek</button>
    </section>`;
  document.querySelector("#backBooks").addEventListener("click",renderLibrary);
}

renderLibrary();
