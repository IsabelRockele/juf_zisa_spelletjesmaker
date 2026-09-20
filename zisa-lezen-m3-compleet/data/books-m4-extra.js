// Twee extra M4-boeken: een historisch avontuur en een dierenverhaal.
(() => {
  const img = (folder, n) => `images/${folder}/${String(n).padStart(2, '0')}.webp`;
  const nila = n => img('m4-nila-geitje', n);
  const otter = n => img('m4-otter-brug', n);
  const choice = (q, a, correct, hint, reviewPage) => ({type:'choice', q, a, correct, hint, ...(Number.isInteger(reviewPage) ? {reviewPage} : {})});
  const page = (text, image, task) => ({text, image, ...(task ? {task} : {})});
  const sound = (q, sentence, a, correct, kind) => ({type:'sound', icon:'👂', title:'Klankjacht', q, sentence, a, correct, kind});

  window.ZISA_BOOKS.push({
    id:'m4-nila-geitje', level:'M4', title:'Nila zoekt het geitje',
    blurb:'Een avontuur in de prehistorie, bij boeren uit de steentijd.', cover:nila(1),
    pages:[
      page('Nila leeft heel lang geleden, in de prehistorie.\nHet is het einde van de steentijd.\nDe steentijd is een deel van de prehistorie.\nNila woont bij een groep boeren.\nHun huis is van hout, leem en stro.\nLeem is aarde waarmee je muren dicht kunt smeren.', nila(1)),
      page('Moeder maalt graan tussen twee stenen.\nZe schuift de bovenste steen heen en weer.\nZo wordt het graan fijn meel.\nNila helpt nog even mee.', nila(2), choice('Waarom schuift moeder de steen over het graan?', ['Ze wil het graan warm maken.','Ze wil er meel van maken.','Ze wil de steen schoonmaken.'], 1, 'Lees wat er met het graan gebeurt.')),
      page('Dan brengt Nila wat blad naar het geitje.\nMaar het kleine dier is weg!\nIn het hek zit een gat.\nEen paar dunne takken zijn losgeraakt.', nila(3)),
      page('Nila roept haar moeder bij het hek.\nSamen zoeken ze naar een spoor.\nIn de zachte grond zien ze kleine putjes.\nDie zijn van de hoeven van het geitje.', nila(4), choice('Hoe weten ze welke kant het geitje op ging?', ['Ze volgen putjes in de grond.','Ze zien het geitje op het dak.','Ze horen iemand om hulp roepen.'], 0, 'Kijk naar het spoor bij het hek.')),
      page('Het spoor loopt langs een akker.\nDat is een stuk grond waar graan groeit.\nEen paar halmen liggen plat.\nHier is het geitje langsgelopen.', nila(5)),
      page('Bij de beek zijn geen putjes meer te zien.\nNila blijft staan en luistert heel goed.\nDan klinkt er zacht gemekker achter een struik.\nMoeder wijst naar het geluid.', nila(6), choice('Wat helpt Nila nu om het geitje te vinden?', ['een spoor in het zand','een gat in het hek','het geluid achter de struik'], 2, 'Lees wat Nila hoort.')),
      page('Het geitje staat tussen dichte takken.\nEen voorpoot zit vast achter een kromme tak.\nHet dier trekt, maar komt niet los.\nNila praat zacht om het rustig te houden.', nila(7)),
      page('Moeder duwt de kromme tak opzij.\nNu kan het geitje zijn poot terugtrekken.\nHet stapt naar Nila toe.\nZe kijkt goed: het loopt weer zonder pijn.', nila(8), choice('Waarom kan het geitje nu zelf loskomen?', ['Nila trekt hard aan zijn poot.','Moeder maakt ruimte bij de tak.','Het geitje springt over de beek.'], 1, 'Lees wat moeder met de tak doet.')),
      page('Nila houdt een tak met blaadjes voor het geitje.\nHet dier stapt achter haar aan.\nMoeder loopt naast hen terug naar huis.\nDaar begint het zacht te regenen.', nila(9)),
      page('Bij het huis maken ze het hek weer dicht.\nMoeder vlecht nieuwe takken tussen de palen.\nNila geeft de losse takken aan.\nNu zit er geen gat meer in het hek.', nila(10), choice('Waarom maken ze het gat in het hek dicht?', ['Dan kan het geitje niet weer ontsnappen.','Dan kan de regen niet op het dak.','Dan groeit het graan veel sneller.'], 0, 'Denk aan het begin van de zoektocht.')),
      page('Binnen schept moeder warme pap in een kom van klei.\nDe pap is van graan uit hun akker.\nNila heeft trek na de lange tocht.\nBuiten rust het geitje dicht bij zijn moeder.', nila(11)),
      page('Nila en haar tocht zijn bedacht.\nBoeren hielden toen echt geiten.\nZe maakten potten van klei.\nOok maalden ze graan tussen stenen.', nila(12))
    ],
    endTask:choice('Wat leer je in dit verhaal over de steentijd?', ['Boeren kochten meel in een winkel.','Boeren maalden graan tussen stenen.','Boeren woonden allemaal in grotten.'], 1, 'Denk aan het werk van moeder.')
  }, {
    id:'m4-otter-brug', level:'M4', title:'Otter bouwt een brug',
    blurb:'De oude brug is weg. Hoe komen Otter en Muis nu aan de overkant?', cover:otter(1),
    pages:[
      page('Otter loopt met een mand vol noten door het bos.\nMuis gaat mee op bezoek bij Eekhoorn.\nAan de overkant van de beek staat zijn boom.\nZe kennen de weg naar de houten brug.', otter(1)),
      page('Maar bij de beek stopt Otter plots.\nDe oude brug is weg!\nNa de storm is alleen een losse plank te zien.\nDie ligt aan de overkant in het gras.', otter(2), choice('Waardoor is de brug verdwenen?', ['door de storm','door een groot vuur','door de hete zon'], 0, 'Lees wanneer de brug weg is geraakt.')),
      page('Otter kan goed zwemmen, maar Muis durft niet.\nOok de noten moeten droog blijven.\nOtter zet de mand op een hoge steen.\nWe zoeken samen een oplossing, zegt hij.', otter(3)),
      page('Even verderop zit Bever op de kant.\nHij bekijkt een dikke stam in het gras.\nDie stam is lang genoeg voor een brug.\nMaar hij is veel te zwaar om te tillen.', otter(4), choice('Waarom tillen ze de stam niet gewoon op?', ['De stam is te glad.','De stam is te kort.','De stam is te zwaar.'], 2, 'Lees de laatste zin.')),
      page('Muis duwt een ronde tak met haar poot.\nDe tak rolt over de grond.\nDan krijgt ze een slim idee.\nKan de zware stam ook op takken rollen?', otter(5)),
      page('Bever duwt één kant van de stam een stukje omhoog.\nOtter schuift er twee ronde takken onder.\nMuis blijft opzij en kijkt of ze recht liggen.\nNu rust de stam op de takken.', otter(6), choice('Waarvoor leggen ze ronde takken onder de stam?', ['Om de stam erop te laten rollen.','Om de stam aan vast te binden.','Om de stam korter te maken.'], 0, 'Denk aan het idee van Muis.')),
      page('Bever en Otter duwen samen tegen de stam.\nHij rolt langzaam naar de beek.\nStop, roept Muis als een tak scheef schuift.\nPas als alles recht ligt, duwen ze weer.', otter(7)),
      page('Bij de smalle plek duwen ze nog één keer.\nDe lange stam schuift over het water.\nBeide uiteinden rusten stevig op de oevers.\nBever legt dikke stenen naast de stam.', otter(8), choice('Waarom moet de stam op beide oevers rusten?', ['Dan krijgen de noten meer zon.','Dan heeft de brug aan beide kanten steun.','Dan kan Muis beter zwemmen.'], 1, 'Kijk waar de twee uiteinden liggen.')),
      page('Bever duwt eerst zacht tegen de nieuwe brug.\nDe stam rolt niet meer weg.\nDan loopt hij rustig naar de overkant.\nOtter en Muis wachten tot hij er is.', otter(9)),
      page('Nu draagt Otter de mand over de brug.\nMuis loopt vlak achter hem.\nZe zetten kleine stappen op de brede stam.\nAan de overkant zwaait Bever hen toe.', otter(10), choice('Hoe steken Otter en Muis de beek over?', ['Ze springen van steen naar steen.','Ze zwemmen met de mand.','Ze lopen rustig over de stam.'], 2, 'Lees hoe ze hun stappen zetten.')),
      page('Eekhoorn wacht bij zijn boom op zijn bezoek.\nDaar zijn jullie, roept hij blij.\nOtter zet de droge mand voor hem neer.\nMuis vertelt hoe haar idee hen heeft geholpen.', otter(11)),
      page('Bever mag ook blijven eten.\nSamen delen ze de noten uit de mand.\nMuis kijkt trots naar de brug.\nZelfs een klein dier kan een groot idee hebben.', otter(12))
    ],
    endTask:choice('Wat helpt de vrienden om de stam te verplaatsen?', ['Ze laten hem op ronde takken rollen.','Ze dragen hem hoog boven hun hoofd.','Ze laten de wind al het werk doen.'], 0, 'Denk aan het idee van Muis.')
  });

  window.ZISA_LEVEL_GAMES = {...(window.ZISA_LEVEL_GAMES || {}),
    'm4-nila-geitje':[
      {...choice('Waarom volgen Nila en moeder eerst de putjes?', ['Die wijzen de weg naar een winkel.','Daar heeft het geitje gelopen.','Daar ligt het meel verstopt.'], 1, 'Lees van wie de putjes zijn.', 3), icon:'🧠', title:'Wat weet je nog?'},
      {type:'sequence', icon:'⏳', title:'Volg de zoektocht', q:'Zet de gebeurtenissen in de juiste volgorde.', items:['Nila ziet een gat in het hek.','Ze volgen het spoor langs de akker.','Moeder duwt de tak opzij.','Ze maken het hek weer dicht.'], hint:'Wat gebeurt er voor ze het geitje vinden?'},
      {type:'sentence', icon:'🧩', title:'Bouw de zin', q:'Zet de zin in de goede volgorde.', image:nila(10), parts:[{text:'Moeder',role:'wie'},{text:'vlecht',role:'doet'},{text:'nieuwe takken',role:'wat'},{text:'tussen de palen',role:'waar'}]},
      {...choice('Wat is een akker?', ['een plaats om te slapen','een hek rond de geiten','een stuk grond waar gewassen groeien'], 2, 'Lees de uitleg over de grond met graan.', 4), icon:'💡', title:'Woordenschat', context:'Het spoor loopt langs een akker. Daar groeit graan.', image:nila(5)},
      {...choice('Welk woord is een zelfstandig naamwoord?', ['schuift','steen','zacht'], 1, 'Zoek het woord dat een ding noemt.'), icon:'🔎', title:'Zoek de woordsoort', context:'Nila schuift de steen zacht heen en weer.'},
      {type:'article', icon:'🏷️', title:'De of het?', q:'Welk lidwoord hoort bij geitje?', word:'geitje', correct:'het'},
      sound('In welk woord zie je een korte klank?', 'De pot staat naast het vuur.', ['staat','pot','vuur'], 1, 'korte klank o'),
      sound('In welk woord zie je een lange klank?', 'Nila legt graan in een pot.', ['pot','legt','graan'], 2, 'lange klank aa'),
      sound('In welk woord zie je een tweetekenklank?', 'Het dier staat bij de tak.', ['dier','staat','tak'], 0, 'tweetekenklank ie'),
      sound('In welk woord hoor je een doffe e?', 'Moeder legt graan in de kom.', ['graan','kom','moeder'], 2, 'doffe e')
    ],
    'm4-otter-brug':[
      {...choice('Waarom zoekt Otter een brug als hij zelf kan zwemmen?', ['Hij wil bij de beek blijven.','Hij is zijn mand kwijt.','Muis durft niet te zwemmen en de noten moeten droog blijven.'], 2, 'Lees wat Otter over Muis en de noten weet.', 2), icon:'🧠', title:'Denk even na'},
      {type:'sequence', icon:'⏳', title:'Van plan tot brug', q:'Zet de gebeurtenissen in de juiste volgorde.', items:['De vrienden zien dat de brug weg is.','Muis krijgt een idee met ronde takken.','Ze rollen de stam naar de beek.','Otter draagt de mand over de brug.'], hint:'Eerst is er een probleem. Wat doen ze daarna?'},
      {type:'sentence', icon:'🧩', title:'Bouw de zin', q:'Zet de zin in de goede volgorde.', image:otter(10), parts:[{text:'Otter',role:'wie'},{text:'draagt',role:'doet'},{text:'de mand',role:'wat'},{text:'over de brug',role:'waar'}]},
      {...choice('Wat zijn de oevers van de beek?', ['de randen van het land langs het water','de stenen diep in het water','de takken onder de stam'], 0, 'Lees waar de uiteinden van de brug rusten.', 7), icon:'💡', title:'Woordenschat', context:'De stam ligt over de beek. Hij rust op beide oevers.', image:otter(8)},
      {...choice('Welk woord vertelt hoe de stam is?', ['Bever','dikke','bekijkt'], 1, 'Zoek het woord dat meer over de stam vertelt.'), icon:'🎨', title:'Een woord vertelt meer', context:'Bever bekijkt een dikke stam.'},
      {type:'article', icon:'🏷️', title:'De of het?', q:'Welk lidwoord hoort bij brug?', word:'brug', correct:'de'},
      sound('In welk woord zie je een korte klank?', 'De tak ligt bij de boom en de struik.', ['boom','struik','tak'], 2, 'korte klank a'),
      sound('In welk woord zie je een lange klank?', 'Muis loopt met een mand.', ['Muis','loopt','mand'], 1, 'lange klank oo'),
      sound('In welk woord zie je een tweetekenklank?', 'Muis zit bij een boom.', ['Muis','zit','boom'], 0, 'tweetekenklank ui'),
      sound('In welk woord hoor je een doffe e?', 'Bever duwt een stam.', ['stam','duwt','Bever'], 2, 'doffe e')
    ]
  };
  window.ZISA_SPEED_GAMES = {...(window.ZISA_SPEED_GAMES || {}),
    'm4-nila-geitje':{words:['steentijd','boeren','hout','leem','stro','graan','stenen','meel','geitje','takken','spoor','hoeven','akker','halmen','gemekker','struik','voorpoot','kromme','blaadjes','vlecht','palen','pap','klei','bedacht']},
    'm4-otter-brug':{words:['Otter','Muis','Eekhoorn','mand','noten','overkant','houten','brug','storm','plank','zwemmen','oplossing','Bever','stam','ronde','rollen','oevers','uiteinden','stevig','smalle','stappen','trots']}
  };
  window.ZISA_FLUENCY_BOOKS = {...(window.ZISA_FLUENCY_BOOKS || {}),
    'm4-nila-geitje':[
      {title:'Lees in groepjes', q:'Welke leesgroepjes maken de zin duidelijk?', a:['Bij het / huis maken ze het / hek weer dicht.','Bij het huis / maken ze / het hek weer dicht.','Bij / het huis maken / ze het hek weer dicht.'], correct:1, good:'Juist! Woorden die bij elkaar horen, lees je samen.'},
      {title:'Lees de woorddelen', q:'Uit welke twee woorden bestaat voorpoot?', focus:'voorpoot', a:['voor en poot','voort en poot','voor en oot'], correct:0, good:'Juist! voor en poot vormen voorpoot.'},
      {title:'Lees de delen', q:'Waar kun je stenen goed splitsen?', focus:'stenen', a:['sten-en','s-tenen','ste-nen'], correct:2, good:'Juist! ste-nen.'},
      {title:'Kies de klanksoort', q:'Welke klanksoort hoor je in neus?', focus:'neus', a:['een korte klank','een lange klank','een tweetekenklank'], correct:2, good:'Juist! eu is een tweetekenklank.'},
      {title:'Kies het leesteken', q:'Welk leesteken hoort achter deze vraag?', focus:'Waar is het kleine geitje', punctuation:true, a:['?','!','.'], correct:0, good:'Juist! Dit is een vraag.'},
      {title:'Werkelijkheid en fantasie', q:'Welke zin past bij de werkelijkheid van toen?', focus:'Werkelijkheid: wat echt gebeurt. Fantasie: wat je verzint.', a:['Het geitje praat met Nila.','Boeren maakten potten van klei.','De stenen malen het graan vanzelf.'], correct:1, good:'Juist! Boeren maakten echt potten van klei. De andere zinnen zijn fantasie.'}
    ],
    'm4-otter-brug':[
      {title:'Lees in groepjes', q:'Welke leesgroepjes maken de zin duidelijk?', a:['Nu draagt / Otter de / mand over de brug.','Nu / draagt Otter de mand / over de brug.','Nu draagt Otter de / mand over / de brug.'], correct:1, good:'Juist! Zo lees je de zin in duidelijke groepjes.'},
      {title:'Lees de woorddelen', q:'Uit welke twee woorden bestaat boomstam?', focus:'boomstam', a:['bo en omstam','booms en tam','boom en stam'], correct:2, good:'Juist! boom en stam vormen boomstam.'},
      {title:'Lees de delen', q:'Waar kun je takken goed splitsen?', focus:'takken', a:['tak-ken','ta-kken','takk-en'], correct:0, good:'Juist! tak-ken.'},
      {title:'Kies de klanksoort', q:'Welke klanksoort hoor je in voet?', focus:'voet', a:['een tweetekenklank','een lange klank','een korte klank'], correct:0, good:'Juist! oe is een tweetekenklank.'},
      {title:'Kies het leesteken', q:'Welk leesteken hoort achter deze vraag?', focus:'Hoe komen we aan de overkant', punctuation:true, a:['.','?','!'], correct:1, good:'Juist! Dit is een vraag.'},
      {title:'Wat leer je van het verhaal?', q:'Waarom past de laatste zin bij Muis?', focus:'Zelfs een klein dier kan een groot idee hebben.', a:['Muis wordt aan het eind veel groter.','Muis kan de stam alleen dragen.','Muis bedenkt hoe de stam kan rollen.'], correct:2, good:'Juist! Muis is klein, maar haar idee helpt iedereen.'}
    ]
  };
})();
