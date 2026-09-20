// E3: korte zinnen, één zin per regel, eenvoudige één- en tweelettergrepige woorden.
// Elke bladzijde gebruikt een afzonderlijk gemaakte prent in 3:2-boekformaat.
(() => {
  const picture = (book, page) => `images/${book}/${String(page).padStart(2, '0')}-v2.webp`;
  const tent = n => picture('e3-vos-tent', n);
  const boot = n => picture('e3-das-boot', n);
  const choice = (q, a, correct, hint, reviewPage) => ({type:'choice', q, a, correct, hint, ...(Number.isInteger(reviewPage) ? {reviewPage} : {})});
  const page = (text, image, task) => ({text, image, ...(task ? {task} : {})});
  window.ZISA_BOOKS.push({
    id:'e3-vos-tent', level:'E3', title:'Vos en de tent',
    blurb:'Vos en Haas maken een tent. Maar dan komt de wind!', cover:tent(9),
    pages:[
      page('Vos heeft een rood deken.\nHij loopt naar een plek in het bos.\nHier wil hij een tent maken.', tent(1)),
      page('Haas helpt Vos met de tent.\nZe pakken twee stoelen.\nDie zetten ze naast elkaar.', tent(2), choice('Wat pakken Vos en Haas?', ['twee stoelen','twee dozen','twee planken'], 0, 'Lees de tweede zin.')),
      page('Het deken gaat over de stoelen.\nNu is er een dak.\nEr is ook een gat.\nDaar kan Vos in.', tent(3)),
      page('Vos kruipt in de tent.\nHaas kijkt door het gat.\nEr is plek voor Haas en Vos.', tent(4), choice('Wie kruipt in de tent?', ['Muis','Haas','Vos'], 2, 'Lees de eerste zin.')),
      page('Dan komt er een harde wind.\nHet deken glijdt van een stoel.\nO nee!\nHet dak valt op de grond.', tent(5), choice('Hoe komt het dat het dak valt?', ['Haas trekt aan de tent.','De wind blaast het deken los.','Vos duwt de stoel om.'], 1, 'Lees wat er met het deken gebeurt.')),
      page('Haas pakt het deken vast.\nHet dak moet op de stoelen blijven.\nMaar hoe maken ze het vast?', tent(6)),
      page('Vos haalt een mand met knijpers.\nHaas houdt het deken op de stoelen.\nVos pakt een knijper uit de mand.', tent(7), choice('Wat haalt Vos?', ['een mand met knijpers','een mand met brood','een mand met stenen'], 0, 'Lees de eerste zin.')),
      page('Ze maken het deken vast met knijpers.\nAan elke stoel zit een knijper.\nHaas trekt zacht aan het deken.', tent(8)),
      page('De wind blaast weer door het bos.\nMaar het deken blijft nu vast.\nDe tent staat nog!\nVos en Haas zijn trots.', tent(9), choice('Wat doet het deken nu?', ['Het valt op de grond.','Het blijft vast aan de stoelen.','Het vliegt naar een boom.'], 1, 'Lees de tweede zin.')),
      page('Vos en Haas eten brood in de tent.\nDan komt Muis bij het gat.\nKom er maar bij, zegt Vos.\nVoor jou is er ook nog plek!', tent(10))
    ],
    endTask:choice('Wat helpt om het deken vast te maken?', ['het brood','de mand','de knijpers'], 2, 'Denk aan wat er aan elke stoel zit.')
  }, {
    id:'e3-das-boot', level:'E3', title:'Das en de boot',
    blurb:'Das heeft een boot. Wat kan er mee op de boot?', cover:boot(3),
    pages:[
      page('Das heeft een kleine gele boot.\nHij neemt de boot mee naar buiten.\nBij de boom staat een blauwe bak.', boot(1)),
      page('Muis komt met een gieter.\nZe giet water in de bak.\nDas zet zijn boot bij de rand.', boot(2), choice('Waar giet Muis het water in?', ['in de boot','in de bak','in een mand'], 1, 'Lees de tweede zin.')),
      page('Das zet de boot op het water.\nDe boot blijft drijven.\nMuis kijkt blij naar de boot.', boot(3), choice('Wat doet de boot op het water?', ['Hij blijft drijven.','Hij valt om.','Hij gaat stuk.'], 0, 'Lees de tweede zin.')),
      page('Das ziet een steen naast de bak.\nDie mag mee op de boot.\nHij legt de steen in de boot.', boot(4)),
      page('De boot zakt diep in het water.\nHij hangt naar één kant.\nDe steen is te zwaar!\nDas kijkt naar Muis.', boot(5), choice('Hoe komt het dat de boot diep zakt?', ['De bak is leeg.','Muis blaast te hard.','De steen is te zwaar.'], 2, 'Lees de zin over de steen.')),
      page('Muis tilt de steen uit de boot.\nZe legt hem naast de bak.\nDe boot ligt weer recht op het water.', boot(6)),
      page('Das pakt een groen blad.\nDit is niet zwaar, zegt hij.\nMag dit wel mee op de boot?', boot(7), choice('Wat pakt Das nu?', ['een tak','een blad','een steen'], 1, 'Lees de eerste zin.')),
      page('Das legt het blad in de boot.\nDe boot blijft recht op het water.\nJa, het blad kan mee!', boot(8)),
      page('Muis blaast zacht tegen de boot.\nDe boot vaart naar de rand.\nHet blad blijft in de boot.', boot(9), choice('Hoe laat Muis de boot varen?', ['Ze blaast tegen de boot.','Ze trekt aan een touw.','Ze duwt met een tak.'], 0, 'Lees de eerste zin.')),
      page('Das pakt de boot uit het water.\nHij neemt ook het blad mee.\nDe steen blijft naast de bak.\nDat was een fijne tocht!', boot(10))
    ],
    endTask:choice('Wat kan mee zonder dat de boot scheef zakt?', ['de steen','de gieter','het blad'], 2, 'Denk aan wat Das de tweede keer kiest.')
  });
  window.ZISA_LEVEL_GAMES = {...(window.ZISA_LEVEL_GAMES || {}),
    'e3-vos-tent':[
      {...choice('Waarom valt het dak van de tent?', ['De wind blaast het deken los.','Muis springt op het dak.','Vos haalt een stoel weg.'], 0, 'Lees wat de wind doet.', 4), icon:'🧠', title:'Wat weet je nog?'},
      {type:'sentence', icon:'🧩', title:'Bouw de zin', q:'Zet de zin in de goede volgorde.', image:tent(4), imageAlt:'Vos kruipt in de tent', parts:[{text:'Vos',role:'wie'},{text:'kruipt',role:'doet'},{text:'in de tent',role:'waar'}]},
      {...choice('Waar dient een knijper hier voor?', ['Om brood mee te snijden.','Om het deken vast te maken.','Om water in te doen.'], 1, 'Kijk naar de knijper aan de stoel.', 7), icon:'💡', title:'Woordenschat', image:tent(8), imageAlt:'Het deken zit met knijpers aan de stoelen vast'},
      {type:'article', icon:'🏷️', title:'De of het?', q:'Welk lidwoord hoort bij tent?', word:'tent', correct:'de'},
      {...choice('Wie houdt het deken op de stoelen?', ['Vos','Muis','Haas'], 2, 'Lees de zin over Haas.', 6), icon:'📖', title:'Lees en kies', context:'Haas houdt het deken op de stoelen.'},
      {type:'sequence', icon:'⏳', title:'Eerst en dan', q:'Zet de zinnen in de goede volgorde.', items:['Vos en Haas pakken twee stoelen.','De wind blaast het deken los.','Ze maken het deken vast met knijpers.','Muis komt bij de tent.'], hint:'Denk aan het begin en het eind.'},
      {type:'sentence', icon:'🧩', title:'Nog een zin', q:'Bouw de zin over Vos.', image:tent(7), imageAlt:'Vos haalt een mand met knijpers', parts:[{text:'Vos',role:'wie'},{text:'haalt',role:'doet'},{text:'een mand',role:'wat'}]},
      {...choice('Hoe voelen Vos en Haas zich op het eind?', ['boos op Muis','blij met hun tent','bang voor de mand'], 1, 'Hun tent blijft nu staan.', 8), icon:'💡', title:'Lees goed'},
      {type:'article', icon:'🏷️', title:'De of het?', q:'Welk lidwoord hoort bij dak?', word:'dak', correct:'het'},
      {type:'sound', icon:'👂', title:'Klankjacht', q:'In welk woord zie je een tweetekenklank?', sentence:'De stoel staat in het bos.', a:['staat','bos','stoel'], correct:2, kind:'tweetekenklank oe'}
    ],
    'e3-das-boot':[
      {...choice('Waarom haalt Muis de steen uit de boot?', ['De steen is te zwaar.','De steen is te klein.','De steen is groen.'], 0, 'Lees wat er met de boot gebeurt.', 4), icon:'🧠', title:'Wat weet je nog?'},
      {type:'sentence', icon:'🧩', title:'Bouw de zin', q:'Zet de zin in de goede volgorde.', image:boot(8), imageAlt:'Das legt het blad in de boot', parts:[{text:'Das',role:'wie'},{text:'legt',role:'doet'},{text:'het blad',role:'wat'},{text:'in de boot',role:'waar'}]},
      {...choice('De boot blijft drijven. Wat betekent dat?', ['Hij ligt op de grond.','Hij blijft op het water.','Hij vliegt door de lucht.'], 1, 'Kijk waar de boot is.', 2), icon:'💡', title:'Woordenschat', image:boot(3), imageAlt:'De boot drijft op het water'},
      {type:'article', icon:'🏷️', title:'De of het?', q:'Welk lidwoord hoort bij boot?', word:'boot', correct:'de'},
      {...choice('Waar ligt de steen nu?', ['in de boot','in de boom','naast de bak'], 2, 'Lees de zin over de steen.', 9), icon:'📖', title:'Lees en kies', context:'De steen blijft naast de bak.'},
      {type:'sequence', icon:'⏳', title:'Eerst en dan', q:'Zet de zinnen in de goede volgorde.', items:['Muis giet water in de bak.','Das legt een steen in de boot.','Muis tilt de steen uit de boot.','Das legt een blad in de boot.'], hint:'De steen ging eerst mee. Wat kwam daarna?'},
      {type:'sentence', icon:'🧩', title:'Nog een zin', q:'Bouw de zin over Muis.', image:boot(9), imageAlt:'Muis blaast tegen de boot', parts:[{text:'Muis',role:'wie'},{text:'blaast',role:'doet'},{text:'tegen de boot',role:'waar'}]},
      {...choice('Wat ligt in de boot als Muis blaast?', ['de steen','het blad','de gieter'], 1, 'Lees de laatste zin van die bladzijde.', 8), icon:'💡', title:'Lees goed'},
      {type:'article', icon:'🏷️', title:'De of het?', q:'Welk lidwoord hoort bij blad?', word:'blad', correct:'het'},
      {type:'sound', icon:'👂', title:'Klankjacht', q:'In welk woord zie je een lange klank?', sentence:'Das staat in het bos.', a:['Das','staat','bos'], correct:1, kind:'lange klank aa'}
    ]
  };
  window.ZISA_SPEED_GAMES = {...(window.ZISA_SPEED_GAMES || {}),
    'e3-vos-tent':{words:['Vos','Haas','tent','deken','rood','bos','plek','maken','helpt','pakken','twee','stoelen','dak','gat','kruipt','wind','stoel','valt','vast','mand','knijpers','blijft','trots','brood','Muis','zacht']},
    'e3-das-boot':{words:['Das','Muis','boot','kleine','gele','boom','blauwe','bak','gieter','water','rand','drijven','steen','zwaar','diep','kant','tilt','recht','groen','blad','blaast','vaart','blijft','tocht']}
  };
  window.ZISA_FLUENCY_BOOKS = {...(window.ZISA_FLUENCY_BOOKS || {}),
    'e3-vos-tent':[
      {title:'Lees de delen', q:'Waar kun je deken goed splitsen?', focus:'deken', a:['dek-en','de-ken','d-eken'], correct:1, good:'Juist! de-ken.'},
      {title:'Zoek het rijmwoord', q:'Welk woord rijmt op tent?', focus:'tent', a:['tand','tak','rent'], correct:2, good:'Juist! tent en rent rijmen.'},
      {title:'Kijk naar elk teken', q:'Tik precies hetzelfde woord aan.', focus:'stoel', a:['stoel','stoep','steel'], correct:0, good:'Juist! Dit is stoel.'},
      {title:'Kies het goede woord', q:'Welk woord past in de zin?', focus:'Vos pakt een knijper uit de ...', a:['wind','mand','tent'], correct:1, good:'Juist! Vos pakt een knijper uit de mand.'},
      {title:'Korte klanken', q:'Tik de korte klank aan. Laat de lange klank staan.', shortVowels:[{word:'tent',index:1},{word:'Haas',index:null},{word:'Vos',index:1},{word:'dak',index:1}], good:'Goed! Je vond e, o en a.'},
      {title:'Kies het leesteken', q:'Welk leesteken hoort achter deze vraag?', focus:'Hoe maken ze het vast', punctuation:true, a:['!','?','.'], correct:1, good:'Juist! Dit is een vraag.'}
    ],
    'e3-das-boot':[
      {title:'Lees de delen', q:'Waar kun je water goed splitsen?', focus:'water', a:['wat-er','w-ater','wa-ter'], correct:2, good:'Juist! wa-ter.'},
      {title:'Zoek het rijmwoord', q:'Welk woord rijmt op boot?', focus:'boot', a:['poot','pot','bad'], correct:0, good:'Juist! boot en poot rijmen.'},
      {title:'Kijk naar elk teken', q:'Tik precies hetzelfde woord aan.', focus:'steen', a:['steel','steen','staan'], correct:1, good:'Juist! Dit is steen.'},
      {title:'Kies het goede woord', q:'Welk woord past in de zin?', focus:'Muis blaast zacht tegen de ...', a:['boom','steen','boot'], correct:2, good:'Juist! Muis blaast tegen de boot.'},
      {title:'Korte klanken', q:'Tik de korte klank aan. Laat de lange klank staan.', shortVowels:[{word:'Das',index:1},{word:'boot',index:null},{word:'bak',index:1},{word:'blad',index:2}], good:'Goed! In Das, bak en blad hoor je de korte a.'},
      {title:'Kies het leesteken', q:'Welk leesteken hoort achter deze vraag?', focus:'Mag dit mee op de boot', punctuation:true, a:['?','.','!'], correct:0, good:'Juist! Dit is een vraag.'}
    ]
  };
})();
