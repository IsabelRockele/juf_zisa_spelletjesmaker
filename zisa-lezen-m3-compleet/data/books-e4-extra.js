// E4: dagelijks leven met natuurweetjes en een fantasieverhaal.
(() => {
  const img = (folder, n) => `images/${folder}/${String(n).padStart(2, '0')}.webp`;
  const tuin = n => img('e4-aardbeien', n);
  const reus = n => img('e4-reus-feest', n);
  const choice = (q, a, correct, hint, reviewPage) => ({type:'choice', q, a, correct, hint, ...(Number.isInteger(reviewPage) ? {reviewPage} : {})});
  const page = (text, image, task) => ({text, image, ...(task ? {task} : {})});
  const sound = (q, sentence, a, correct, kind) => ({type:'sound', icon:'👂', title:'Klankjacht', q, sentence, a, correct, kind});
  window.ZISA_BOOKS.push({
    id:'e4-aardbeien', level:'E4', title:'Wie eet de aardbeien?',
    blurb:'Er zitten gaten in de aardbeien. Noor gaat op zoek naar sporen.', cover:tuin(1),
    pages:[
      page('Noor helpt oma in de moestuin achter het huis.\nTussen de groene bladeren hangen rode aardbeien.\nMaar in een rijpe vrucht zit een vreemd gat.\nWie heeft daar stiekem van gegeten?', tuin(1)),
      page('Misschien was het een vogel, denkt Noor.\nOp het hek zit een merel met een gele snavel.\nHij vliegt weg zodra oma de gieter pakt.\nToch hebben ze hem niets zien eten.', tuin(2), choice('Weten Noor en oma al wie de aardbei heeft gegeten?', ['Ja, ze zagen de merel eten.','Nee, ze hebben het nog niet gezien.','Ja, oma heeft het gat gemaakt.'], 1, 'Een vermoeden is nog geen bewijs.')),
      page('Noor bekijkt de aarde rond de planten.\nOver een platte steen loopt een glimmend spoor.\nHet lijkt op een dun, zilveren lint.\nOma buigt zich voorover om beter te kijken.', tuin(3)),
      page('Dat kan een spoor van een slak zijn, zegt oma.\nEen slak glijdt vooruit op een laagje slijm.\nAls het slijm opdroogt, kan het als zilver glanzen.\nMaar waar is het dier nu gebleven?', tuin(4), choice('Waardoor kan het spoor als zilver glanzen?', ['Er ligt een echt lint op de steen.','De steen geeft zelf licht.','Het slijm van een slak is opgedroogd.'], 2, 'Lees wat er met het slijm gebeurt.')),
      page('Onder de bladeren is het koel en vochtig.\nDat betekent dat het daar een beetje nat is.\nSlakken schuilen overdag vaak op zulke plekken.\nNoor zoekt voorzichtig, maar vindt geen slak.', tuin(5)),
      page('Veel slakken komen in de avond tevoorschijn, vertelt oma.\nDan is de felle zon verdwenen.\nNoor wil daarom na het eten terugkomen.\nZe legt alvast een zaklamp bij de achterdeur.', tuin(6), choice('Waarom wil Noor in de avond terugkomen?', ['Dan worden alle aardbeien blauw.','Dan komen veel slakken tevoorschijn.','Dan kan ze het hek schilderen.'], 1, 'Denk aan wat oma over slakken vertelt.')),
      page('Na het eten wordt de lucht langzaam donker.\nNoor en oma lopen samen naar de moestuin.\nDe lamp schijnt op de steen met het spoor.\nDaar kruipt iets bruins onder een blad vandaan.', tuin(7)),
      page('Het is een naaktslak, een slak zonder huisje.\nMet zijn zachte lijf kruipt hij naar een aardbei.\nNoor en oma kijken stil toe.\nZe zien hoe hij aan de rijpe vrucht eet.', tuin(8), choice('Wat weten Noor en oma nu zeker?', ['Deze slak eet van de aardbei.','Elke slak eet alleen aardbeien.','De merel komt nooit in de tuin.'], 0, 'Kies wat ze zelf hebben gezien.')),
      page('Dus jij was aan het smullen, fluistert Noor.\nOma knikt, maar wijst ook naar het hek.\nVogels kunnen óók van aardbeien eten.\nZe weten alleen niet wie de andere gaten maakte.', tuin(9)),
      page('Binnen tekent Noor de slak in haar schrift.\nDaarnaast tekent ze de steen met het glimmende spoor.\nZe schrijft op wat ze zelf heeft gezien.\nZo kan ze het morgen aan haar klas vertellen.', tuin(10), choice('Waarom tekent Noor de slak en het spoor?', ['Ze wil onthouden wat ze heeft ontdekt.','Ze wil de tuin groter maken.','Ze wil een nieuw huis voor oma tekenen.'], 0, 'Denk aan wat ze morgen wil vertellen.')),
      page('De volgende dag plukken ze de rijpe aardbeien.\nOma wast de vruchten voor ze op tafel komen.\nNoor kijkt nog even onder een groen blad.\nWat zou er nog meer in deze tuin leven?', tuin(11)),
      page('Noor en oma bestaan alleen in dit verhaal.\nDe weetjes over slakken kloppen wel.\nSlakken laten slijmsporen achter en zoeken vaak vochtige plekken.\nSommige slakken eten van rijpe aardbeien.', tuin(12))
    ],
    endTask:choice('Wat helpt Noor om meer over de slak te leren?', ['Ze gokt zonder te kijken.','Ze bekijkt sporen en kijkt naar het dier.','Ze vraagt het aan de merel.'], 1, 'Denk aan haar zoektocht.')
  }, {
    id:'e4-reus-feest', level:'E4', title:'Een feest voor Reus',
    blurb:'Reus past niet in het huis van Konijn. Kan hij toch meefeesten?', cover:reus(1),
    pages:[
      page('Reus rust onder een eik aan de rand van het bos.\nKonijn komt aan met een piepkleine brief.\nVanavond geef ik een feest, zegt hij vrolijk.\nJij bent ook welkom in mijn huis!', reus(1)),
      page('Reus trekt zijn nette groene jas aan.\nVoor Konijn plukt hij een bosje veldbloemen.\nMet grote stappen loopt hij naar het kleine huis.\nDoor de ramen ziet hij al slingers hangen.', reus(2), choice('Waaraan merkt Reus dat Konijn een feest voorbereidt?', ['Er hangen slingers voor de ramen.','Er ligt sneeuw op het dak.','De deur zit achter een boom verstopt.'], 0, 'Kijk wat Reus door de ramen ziet.')),
      page('Bij de voordeur zakt Reus door zijn knieën.\nHij buigt zijn hoofd en houdt zijn adem in.\nMaar zelfs zijn schouders passen niet door de opening.\nHij is veel te groot voor het huis.', reus(3)),
      page('Reus zet de bloemen voorzichtig naast de deur.\nGa maar zonder mij feesten, mompelt hij zacht.\nHij draait zich om en kijkt naar de grond.\nKonijn merkt dat zijn vriend verdrietig is.', reus(4), choice('Waarom is Reus verdrietig?', ['Hij vindt de bloemen niet mooi.','Hij denkt dat hij niet mee kan feesten.','Hij wil liever in zijn eentje dansen.'], 1, 'Denk aan het probleem bij de deur.')),
      page('Wacht even, roept Konijn hem achterna.\nEen feest is pas fijn als iedereen erbij kan zijn.\nEgel wijst naar het grasveld naast het huis.\nDaar is ruimte genoeg, zelfs voor een reus.', reus(5)),
      page('Samen dragen de dieren de kleine tafel naar buiten.\nEekhoorn hangt de slingers tussen twee lage takken.\nReus helpt met de slinger die het hoogst moet hangen.\nNu hoeft niemand zich nog klein te maken.', reus(6), choice('Hoe lossen de vrienden het probleem op?', ['Ze laten Reus alleen naar huis gaan.','Ze maken Reus met een spreuk kleiner.','Ze verplaatsen het feest naar buiten.'], 2, 'Lees waar de tafel en slingers nu staan.')),
      page('Konijn zet voor elke gast een beker klaar.\nReus houdt het kleinste bekertje tussen twee vingers.\nDaar past maar één slokje in, lacht hij.\nEgel gaat meteen op zoek naar iets groters.', reus(7)),
      page('Even later rolt Egel een schone emmer over het gras.\nKonijn giet er water voor Reus in.\nReus heft zijn nieuwe beker met een brede glimlach.\nOp onze vriendschap, zegt hij tegen de dieren.', reus(8), choice('Waarom krijgt Reus een emmer als beker?', ['De emmer is groot genoeg voor hem.','De kleine bekers zijn allemaal lek.','Hij wil de bloemen water geven.'], 0, 'Vergelijk de beker met de handen van Reus.')),
      page('Dan speelt Eekhoorn een vrolijk lied op zijn fluit.\nDe dieren dansen in een kring op het gras.\nReus wil meedoen, maar kijkt naar zijn zware laarzen.\nDie komen veel te dicht bij zijn kleine vrienden.', reus(9)),
      page('Ik blijf hier zitten, bedenkt Reus.\nHij tikt zacht met zijn vingers op zijn knieën.\nDat klinkt als een trommel bij het vrolijke lied.\nDe dieren dansen verder op het ritme.', reus(10), choice('Hoe doet Reus toch mee met de muziek?', ['Hij stampt hard tussen de dieren.','Hij tikt een ritme op zijn knieën.','Hij verstopt de fluit van Eekhoorn.'], 1, 'Lees wat hij met zijn vingers doet.')),
      page('Wanneer het donker wordt, gaan de lampjes aan.\nKonijn komt naast de grote laars van Reus zitten.\nFijn dat je gebleven bent, zegt hij tevreden.\nZonder jouw trommel was het feest minder vrolijk.', reus(11)),
      page('Reus kijkt naar de slingers boven het grasveld.\nIn dat kleine huis paste hij niet.\nMaar hier tussen zijn vrienden voelt hij zich thuis.\nVoor een fijn feest is er plaats voor iedereen.', reus(12))
    ],
    endTask:choice('Wat is een belangrijk thema van dit verhaal?', ['Samen zorgen dat iedereen mee kan doen.','Altijd het grootste huis willen hebben.','Liever nooit bezoek krijgen.'], 0, 'Denk aan de plannen van alle vrienden.')
  });
  window.ZISA_LEVEL_GAMES = {...(window.ZISA_LEVEL_GAMES || {}),
    'e4-aardbeien':[
      {...choice('Waarom past de titel Wie eet de aardbeien? bij het verhaal?', ['Noor zoekt uit welk dier van de vruchten eet.','Oma zoekt een recept voor soep.','Noor telt hoeveel planten er staan.'], 0, 'Denk aan het probleem aan het begin.', 0), icon:'📖', title:'De titel'},
      {type:'sequence', icon:'⏳', title:'De zoektocht', q:'Zet de gebeurtenissen in de juiste volgorde.', items:['Noor ziet een gat in een aardbei.','Ze vindt een glimmend spoor.','In de avond ziet ze een slak eten.','Ze tekent haar ontdekking in haar schrift.'], hint:'Wat ziet Noor eerst? Wanneer ziet ze de slak?'},
      {type:'sentence', icon:'🧩', title:'Bouw de zin', q:'Zet de zin in de goede volgorde.', image:tuin(10), parts:[{text:'Noor',role:'wie'},{text:'tekent',role:'doet'},{text:'de bruine slak',role:'wat'},{text:'in haar schrift',role:'waar'}]},
      {...choice('Wat betekent vochtig?', ['helemaal droog','een beetje nat','erg warm'], 1, 'De zin na dit woord legt het uit.', 4), icon:'💡', title:'Woordenschat', context:'Onder de bladeren is het koel en vochtig.'},
      {...choice('Welk woord is een bijvoeglijk naamwoord?', ['rijpe','vrucht','Noor'], 0, 'Het vertelt hoe de vrucht is.'), icon:'🔎', title:'Woordsoorten', context:'Noor bekijkt de rijpe vrucht.'},
      {...choice('Welk woord is een voorzetsel?', ['slak','rust','onder'], 2, 'Dit woord geeft hier de plaats aan.'), icon:'🔎', title:'Woordsoorten', context:'De slak rust onder een blad.'},
      sound('In welk woord zie je een korte klank?', 'De slak kruipt naar een rood blad.', ['rood','slak','kruipt'], 1, 'korte klank a'),
      sound('In welk woord zie je een lange klank?', 'De lamp schijnt op de steen bij de struik.', ['lamp','steen','struik'], 1, 'lange klank ee'),
      sound('In welk woord zie je een tweetekenklank?', 'De lamp ligt naast de stoel bij het raam.', ['stoel','lamp','raam'], 0, 'tweetekenklank oe'),
      {...choice('Wat kunnen ze besluiten nadat ze de slak hebben zien eten?', ['Alle gaten zijn zeker van dezelfde slak.','Deze slak eet aardbei; van de andere gaten weten ze het niet.','Vogels eten nooit aardbeien.'], 1, 'Kies alleen wat ze door het kijken weten.', 8), icon:'🧠', title:'Wat weet je zeker?'}
    ],
    'e4-reus-feest':[
      {...choice('Wie is het hoofdpersonage met het probleem in dit verhaal?', ['Reus','Egel','Eekhoorn'], 0, 'Wie past niet door de deur?', 2), icon:'📖', title:'Het hoofdpersonage'},
      {type:'sequence', icon:'⏳', title:'Van probleem naar feest', q:'Zet de gebeurtenissen in de juiste volgorde.', items:['Konijn nodigt Reus uit.','Reus past niet door de deur.','De vrienden brengen de tafel naar buiten.','Reus tikt mee met de muziek.'], hint:'De uitnodiging komt voor het feest.'},
      {type:'sentence', icon:'🧩', title:'Bouw de zin', q:'Zet de zin in de goede volgorde.', image:reus(6), parts:[{text:'Eekhoorn',role:'wie'},{text:'hangt',role:'doet'},{text:'de vrolijke slingers',role:'wat'},{text:'tussen twee takken',role:'waar'}]},
      {...choice('Wat betekent: Reus voelt zich thuis?', ['Hij zit weer in zijn eigen huis.','Hij wil meteen gaan slapen.','Hij voelt zich welkom bij zijn vrienden.'], 2, 'Denk aan zijn gevoel, niet aan zijn huis.', 11), icon:'💡', title:'Wat bedoelt de schrijver?', context:'Tussen zijn vrienden voelt Reus zich thuis.'},
      {...choice('Welk woord is een verkleinwoord?', ['vrienden','bekertje','slingers'], 1, 'Zoek het woord voor iets kleins.'), icon:'🔎', title:'Woordsoorten'},
      {...choice('Wat is het meervoud van laars?', ['laarzen','laarsen','laarss'], 0, 'Luister naar het woord voor twee van deze schoenen.'), icon:'👢', title:'Enkelvoud en meervoud'},
      sound('In welk woord zie je een korte klank?', 'Reus zet een mand bij de boom.', ['Reus','boom','mand'], 2, 'korte klank a'),
      sound('In welk woord zie je een lange klank?', 'Een tak hangt voor het raam bij de deur.', ['tak','deur','raam'], 2, 'lange klank aa'),
      sound('In welk woord zie je een tweetekenklank?', 'Reus zit op het gras naast een paal.', ['gras','Reus','paal'], 1, 'tweetekenklank eu'),
      {...choice('Wat is een belangrijk thema van dit verhaal?', ['Samen zorgen dat iedereen mee kan doen.','Alleen de grootste gast mag kiezen.','Een feest moet altijd binnen zijn.'], 0, 'Denk aan wat de vrienden telkens voor elkaar doen.', 11), icon:'💬', title:'Het thema'}
    ]
  };
  window.ZISA_SPEED_GAMES = {...(window.ZISA_SPEED_GAMES || {}),
    'e4-aardbeien':{words:['moestuin','bladeren','aardbeien','vrucht','merel','snavel','gieter','glimmend','zilveren','slijm','vochtig','schuilen','voorzichtig','zaklamp','achterdeur','naaktslak','huisje','schrift','slijmsporen']},
    'e4-reus-feest':{words:['Reus','Konijn','piepkleine','veldbloemen','slingers','voordeur','knieën','schouders','opening','verdrietig','grasveld','Eekhoorn','bekertje','vingers','emmer','vriendschap','laarzen','trommel','ritme','tevreden']}
  };
  window.ZISA_FLUENCY_BOOKS = {...(window.ZISA_FLUENCY_BOOKS || {}),
    'e4-aardbeien':[
      {title:'Lees in groepjes', q:'Welke leesgroepjes maken de zin duidelijk?', a:['Na het eten / lopen Noor en oma / naar de moestuin.','Na het / eten lopen Noor / en oma naar de moestuin.','Na het eten lopen / Noor en / oma naar de moestuin.'], correct:0, good:'Juist! Lees woorden die bij elkaar horen samen.'},
      {title:'Een samengesteld woord', q:'Uit welke woorden bestaat zaklamp?', focus:'zaklamp', a:['za en klamp','zak en lamp','zakl en amp'], correct:1, good:'Juist! zak en lamp vormen zaklamp.'},
      {title:'Lettergrepen', q:'Hoe verdeel je bladeren in lettergrepen?', focus:'bladeren', a:['blad-er-en','bla-de-ren','bla-der-en'], correct:1, good:'Juist! bla-de-ren: drie lettergrepen.'},
      {title:'Kies de klanksoort', q:'Welke klanksoort hoor je in tuin?', focus:'tuin', a:['een lange klank','een korte klank','een tweetekenklank'], correct:2, good:'Juist! ui is een tweetekenklank.'},
      {title:'Kies het leesteken', q:'Welk leesteken hoort achter deze vraag?', focus:'Wie heeft van de aardbei gegeten', punctuation:true, a:['.','?',','], correct:1, good:'Juist! Een vragende zin eindigt met een vraagteken.'},
      {title:'Werkelijkheid en fantasie', q:'Welke zin beschrijft werkelijkheid?', a:['Een slak vertelt Noor waar hij woont.','Een aardbei loopt weg voor de slak.','Een slak laat een slijmspoor achter.'], correct:2, good:'Juist! Een slijmspoor hoort bij de werkelijkheid. Pratende slakken en lopende aardbeien zijn fantasie.'}
    ],
    'e4-reus-feest':[
      {title:'Lees in groepjes', q:'Welke leesgroepjes maken de zin duidelijk?', a:['Naast het / huis zetten de dieren / de tafel neer.','Naast het huis / zetten de dieren / de tafel neer.','Naast het huis zetten / de dieren de / tafel neer.'], correct:1, good:'Juist! Zo blijven woorden die bij elkaar horen samen.'},
      {title:'Een samengesteld woord', q:'Uit welke woorden bestaat veldbloemen?', focus:'veldbloemen', a:['vel en bloemen','veld en loemen','veld en bloemen'], correct:2, good:'Juist! veld en bloemen vormen veldbloemen.'},
      {title:'Lettergrepen', q:'Hoe verdeel je trommel in lettergrepen?', focus:'trommel', a:['trom-mel','tro-mmel','tromm-el'], correct:0, good:'Juist! trom-mel: twee lettergrepen.'},
      {title:'Kies de klanksoort', q:'Welke klanksoort hoor je in fluit?', focus:'fluit', a:['een tweetekenklank','een lange klank','een korte klank'], correct:0, good:'Juist! ui is een tweetekenklank.'},
      {title:'Kies het leesteken', q:'Welk leesteken past bij deze uitroep?', focus:'Hoera, iedereen kan meedoen', punctuation:true, a:[',','?','!'], correct:2, good:'Juist! Bij deze vrolijke uitroep past een uitroepteken.'},
      {title:'Werkelijkheid en fantasie', q:'Waardoor herken je dit als een fantasieverhaal?', a:['Er staan bomen naast een huis.','De dieren praten en geven samen met een reus een feest.','Er hangen slingers aan takken.'], correct:1, good:'Juist! Pratende dieren die met een reus feesten, horen bij fantasie.'}
    ]
  };
})();
