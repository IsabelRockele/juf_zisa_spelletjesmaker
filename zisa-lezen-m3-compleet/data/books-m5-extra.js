// M5: begeleide eerste stappen binnen de GO!-doelen voor 8–9 jaar.
(() => {
  const img = (folder, n) => `images/${folder}/${String(n).padStart(2, '0')}.webp`;
  const mand = n => img('m5-lege-mand', n).replace('.webp','-v3.webp');
  const papier = n => img('m5-nieuw-papier', n);
  const choice = (q,a,correct,hint,reviewPage) => ({type:'choice',q,a,correct,hint,...(Number.isInteger(reviewPage)?{reviewPage}:{})});
  const page = (text,image,task) => ({text,image,...(task?{task}:{})});
  const game = (title,q,a,correct,hint,context,reviewPage) => ({...choice(q,a,correct,hint,reviewPage),icon:'🔎',title,...(context?{context}:{})});
  window.ZISA_BOOKS.push({
    id:'m5-lege-mand',level:'M5',title:'Het raadsel van de lege mand',
    blurb:'De noten van Haas zijn weg. Welk spoor helpt hem verder?',cover:mand(1),
    pages:[
      page('Haas heeft een mand vol hazelnoten verzameld voor de bosmaaltijd.\nHij zet zijn voorraad onder de oude eik.\nEgel komt hem vragen om een bank naar de schuur te dragen.',mand(1)),
      page('Samen dragen ze de bank over het kronkelende bospad.\nDe schuur ligt achter de bomen, ver van de eik.\nBinnen zetten ze de bank naast een lange tafel.',mand(2),choice('Waarom gaat Haas met Egel mee?',['Hij wil een nieuwe mand kopen.','Hij helpt om een bank te dragen.','Hij wil alle noten alleen opeten.'],1,'Lees wat Egel hem vraagt.')),
      page('Dan tikken de eerste regendruppels tegen het raam.\nHaas denkt meteen aan zijn mand onder de boom.\nHij trekt zijn sjaal recht en haast zich naar buiten.',mand(3)),
      page('Onder de eik staat zijn mand nog precies op dezelfde plek.\nMaar alle hazelnoten zijn verdwenen!\nHaas kijkt onder de bladeren, terwijl Egel de mand onderzoekt.',mand(4),choice('Wat is het probleem van Haas?',['Zijn mand staat niet meer onder de boom.','Zijn mand is kapotgegaan door de regen.','Zijn noten zijn uit de mand verdwenen.'],2,'Vergelijk de mand met het begin van het verhaal.')),
      page('Aan het hengsel hangt een klein plukje roodbruine vacht.\n‘Zou Vos hier geweest zijn?’ vraagt Haas.\n‘Misschien,’ zegt Egel, ‘maar Eekhoorn heeft ook zo’n kleur.’\nZe besluiten eerst te vragen wat er gebeurd is.',mand(5)),
      page('Zonder mand lopen Haas en Egel naar Vos op het bospad.\nHij schudt de regen van zijn jas.\n‘Ik zag Eekhoorn met een kar het bos in rijden,’ vertelt hij.\n‘Daarna verdween hij achter de bomen.’\nDankbaar voor de aanwijzing gaan Haas en Egel verder.',mand(6),choice('Waarom bewijst het plukje vacht niet dat Vos de noten meenam?',['Eekhoorn heeft ook een roodbruine vacht.','Vos draagt nooit een jas.','De mand stond in de schuur.'],0,'Denk aan wat Egel over de kleur zegt.')),
      page('In de zachte aarde lopen twee smalle wielsporen.\nHaas en Egel volgen ze dieper het bos in.\nHet pad buigt tussen de varens door.\nAchter elke bocht zoeken ze de sporen weer op.',mand(7)),
      page('Even later komen ze bij de schuur.\nDe sporen eindigen bij een kar naast de blauwe deur.\nOp de grond liggen twee hazelnoten.\nBinnen klinkt een kort, scherp gekraak.\nHaas klopt aan voordat hij de deur opent.',mand(8),choice('Welke aanwijzingen vinden Haas en Egel bij de schuur?',['Een sjaal en een lege tafel.','Een houten kar en twee hazelnoten.','Een rode jas en een kapotte bank.'],1,'Kijk wat er naast de deur staat en ligt.')),
      page('Aan de tafel zit Eekhoorn met een notenkraker.\nVoor hem staat een grote schaal vol hazelnoten.\nHaas herkent zijn voorraad en haalt opgelucht adem.\n‘Hoe zijn mijn noten hier terechtgekomen?’ vraagt hij.',mand(9)),
      page('‘Er kwam regen aan,’ legt Eekhoorn uit.\n‘Ik bracht de noten in deze schaal naar de droge schuur.\nOnder de mand legde ik een briefje voor jou.’\nHaas heeft helemaal geen briefje gezien.',mand(10),choice('Waarom bracht Eekhoorn de noten naar de schuur?',['Hij wilde ze verstoppen voor Haas.','Hij wilde de kar schoonmaken.','Hij wilde de noten droog houden.'],2,'Lees waarom Eekhoorn ze naar binnen bracht.')),
      page('Haas en Egel lopen terug naar de oude eik.\nDaar kantelt Haas de lege mand voorzichtig.\nEen nat briefje kleeft aan de onderkant.\nEgel maakt het los en leest de boodschap hardop:\n‘Je noten staan droog in de schuur. Groetjes, Eekhoorn.’',mand(11)),
      page('Nu passen de aanwijzingen bij elkaar.\nEekhoorn gebruikte de kar om de zware schaal te vervoeren.\nOnderweg vielen er twee noten af.\nHet gekraak kwam van zijn notenkraker.',mand(12),choice('Waardoor hoorden Haas en Egel gekraak in de schuur?',['Eekhoorn kraakte noten met zijn notenkraker.','Vos brak de houten bank in stukken.','De regen tikte tegen een metalen emmer.'],0,'Lees waar het geluid vandaan kwam.')),
      page('Met de lege mand lopen ze weer naar de schuur.\nOnderweg komen ze Vos tegen met een kist appels.\nHaas vertelt dat de noten terecht zijn.\n‘Dank je dat je ons verder hielp,’ zegt hij.\nSamen lopen ze verder naar de bosmaaltijd.',mand(13)),
      page('Iedereen helpt om de bosmaaltijd klaar te maken.\nEgel zet de borden neer en Haas draagt de schaal.\nEekhoorn kraakt de laatste noten, want die zitten nog in hun harde dop.\nBuiten breekt de zon weer door de wolken.',mand(14),choice('Welk woord geeft in de zin over Eekhoorn een reden aan?',['laatste','want','harde'],1,'Zoek het woord dat de reden met de rest van de zin verbindt.')),
      page('Even later zitten de vrienden samen aan tafel.\n‘Dit is de gezelligste maaltijd van het jaar,’ vindt Haas.\nEgel wijst lachend naar de mand met de overgebleven noten.\nDeze keer weet iedereen waar de voorraad staat.',mand(15))
    ],
    endTask:choice('Welke zin vat het verhaal het best samen?',['Haas koopt een nieuwe mand voor Egel.','Haas zoekt zijn noten en ontdekt dat Eekhoorn ze veilig heeft weggezet.','Vos bouwt een schuur voor de dieren.'],1,'Denk aan het probleem en de oplossing.')
  },{
    id:'m5-nieuw-papier',level:'M5',title:'Papier krijgt een tweede leven',
    blurb:'Lina en Sem maken een bedankkaart van oud papier. Maar hun eerste vel scheurt.',cover:papier(1),
    pages:[
      page('Amir heeft de klas geholpen met de nieuwe schooltuin.\nLina en Sem willen hem een bijzondere bedankkaart geven.\nDe juf toont een stevig vel dat ze zelf heeft gemaakt.\n‘Dit was ooit oud papier,’ vertelt ze.',papier(1)),
      page('In de klas staat een doos met gebruikte tekenbladen.\nDe kinderen zoeken papier dat aan beide kanten vol staat.\nBladen met een lege achterkant bewaren ze om nog op te tekenen.\nPlastic en nietjes halen ze uit de doos.',papier(2),choice('Waarom bewaren ze bladen met een lege achterkant?',['Daar kunnen ze nog op tekenen.','Die bladen kunnen niet nat worden.','Daar zitten altijd nietjes in.'],0,'Lees waarvoor de achterkant nog bruikbaar is.')),
      page('Lina en Sem scheuren het gekozen papier in kleine snippers.\nZe stoppen alles in een bak met water.\nHet papier moet eerst goed zacht worden.\nDaarom laten ze de snippers een dag weken.',papier(3)),
      page('De bak blijft op de knutseltafel staan.\nDoor het raam valt de laatste zon op het water.\nLina zou het liefst meteen haar kaart maken.\nMaar voor dit werk heeft ze ook geduld nodig.',papier(4),choice('Waarom kunnen de kinderen nog niet meteen papier scheppen?',['De doos moet eerst geschilderd worden.','Amir moet eerst alle potloden tellen.','De snippers moeten eerst zacht worden in het water.'],2,'Denk aan de vorige bladzijde.')),
      page('De volgende dag maakt de juf de natte snippers fijn met een mixer.\nLina en Sem kijken toe.\nEr ontstaat een zachte, natte brij.\n‘Dit noemen we pulp,’ legt de juf uit.',papier(5)),
      page('Papier bestaat uit heel kleine vezels, vertelt de juf.\nDie vezels zitten nu los in de natte pulp.\nZe giet wat pulp in een ruime bak met water.\nDaarna laat ze een houten raam met fijn gaas zien.',papier(6),choice('Wat is pulp in dit verhaal?',['Een stevig vel dat al helemaal droog is.','Een natte brij van fijngemaakt papier.','Een houten raam met fijn gaas.'],1,'Lees de uitleg bij de natte snippers.')),
      page('Op tafel ligt een kort stappenplan voor het scheppen:\n1. Schep met het raam een dun laagje pulp op.\n2. Laat het water boven de bak uit het raam druppen.\n3. Keer het raam voorzichtig om op een schone doek.',papier(7)),
      page('Sem schept een laagje pulp op het gaas.\nHij wil het natte vel meteen met zijn vingers optillen.\nMaar er scheurt een hoekje af.\nTeleurgesteld kijkt hij naar het slappe papier.',papier(8),choice('Welke stap slaat Sem over als hij het vel met zijn vingers optilt?',['Het raam omkeren op een schone doek.','Een bedankkaart aan Amir geven.','De droge kaart met potlood versieren.'],0,'Lees stap drie van het stappenplan opnieuw.')),
      page('‘Moeten we nu helemaal opnieuw beginnen?’ vraagt Sem.\nDe juf schudt haar hoofd en wijst naar de bak.\nHet gescheurde vel kan terug bij de pulp.\nSem roert voorzichtig tot de stukjes weer los zijn.',papier(9)),
      page('Deze keer houden Lina en Sem het raam samen vast.\nZe scheppen een dun laagje op en houden het raam recht.\nHet water drupt langzaam terug in de bak.\nOp het gaas blijft een laagje vezels liggen.',papier(10),choice('Wat loopt er door het gaas terug in de bak?',['Het houten raam.','De schone doek.','Het water.'],2,'Lees wat drupt en wat op het gaas blijft.')),
      page('Samen keren ze het raam om op een schone doek.\nLina drukt een spons tegen de achterkant van het gaas.\nDe spons neemt water op.\nDan tillen ze het raam weg en blijft het vel op de doek liggen.',papier(11)),
      page('Ze drukken met een tweede doek nog wat water uit het vel.\nDaarna leggen ze het met de onderste doek op een rek.\nHet papier moet helemaal drogen voordat ze erop kunnen tekenen.\nDe juf zet het rek op een rustige plek.',papier(12),choice('Waarom leggen ze het vel eerst op het rek?',['Het moet helemaal drogen.','Het moet weer in snippers vallen.','Het moet dezelfde kleur als het rek krijgen.'],0,'Lees wat er moet gebeuren voor ze kunnen tekenen.')),
      page('Twee dagen later voelt het vel droog en stevig aan.\nDe rand is wat rafelig, maar nergens zit een gat.\n‘Ons papier is veel mooier dan winkelpapier,’ vindt Lina.\nSem voelt trots over het ruwe oppervlak.',papier(13)),
      page('Met kleurpotloden tekenen ze bloemen op hun nieuwe kaart.\nBinnenin schrijven ze een bedankje voor Amir.\nDe juf noemt hun werk een voorbeeld van recycleren.\nZe hebben van oud materiaal iets nieuws gemaakt.',papier(14),choice('Waarom is dit een voorbeeld van recycleren?',['Ze kopen een nieuwe doos papier.','Ze maken van oud papier een nieuw vel.','Ze gooien alle tekenbladen weg.'],1,'Lees wat er met het oude materiaal is gebeurd.')),
      page('In de schooltuin geven Lina en Sem hun kaart aan Amir.\nHij strijkt met zijn vinger langs de dikke rand.\n‘Die krijgt een mooi plekje bij mij thuis,’ zegt hij.\nLina en Sem kijken elkaar trots aan.\nHun oude tekenbladen zijn nu een cadeau!',papier(15))
    ],
    endTask:choice('Wat is de hoofdgedachte van het verhaal?',['Een klas maakt een nieuwe kaart van gebruikt papier.','Amir koopt nieuwe kleurpotloden.','Lina verliest haar tekening in de schooltuin.'],0,'Denk aan wat de kinderen leren en maken.')
  });

  window.ZISA_LEVEL_GAMES={...(window.ZISA_LEVEL_GAMES||{}),
    'm5-lege-mand':[
      game('De hoofdgedachte','Welke zin vertelt het belangrijkste van het hele verhaal?',['Egel draagt een oranje sjaal.','Haas zoekt zijn noten en ontdekt dat Eekhoorn ze droog heeft weggezet.','Vos brengt appels naar een tafel.'],1,'Denk aan het probleem én de oplossing.',null,11),
      {type:'sequence',icon:'⏳',title:'Van raadsel naar oplossing',q:'Zet de gebeurtenissen in de juiste volgorde.',items:['Haas laat zijn volle mand bij de eik staan.','Haas ontdekt dat de noten verdwenen zijn.','Vos vertelt over Eekhoorn en de kar.','Haas vindt zijn noten in de schuur.'],hint:'Wat gebeurt er voor Haas gaat zoeken?'},
      {type:'sentence',icon:'🧩',title:'Bouw de zin',q:'Zet de zin in de goede volgorde.',image:mand(14),parts:[{text:'Haas',role:'wie'},{text:'draagt',role:'doet'},{text:'de volle schaal',role:'wat'},{text:'naar de tafel',role:'waar'}]},
      game('Een aanwijzing','Waarom is alleen het plukje vacht niet genoeg?',['De vacht kan van meer dan één dier zijn.','De mand heeft geen hengsel.','Haas heeft de noten al opgegeten.'],0,'Vergelijk de vacht van Vos en Eekhoorn.',null,4),
      game('Woordenschat','Wat betekent opgelucht hier?',['boos omdat iemand te laat is','moe van het dragen','blij omdat de zorgen voorbij zijn'],2,'Haas heeft zijn noten teruggevonden.','Haas herkent zijn voorraad en haalt opgelucht adem.',8),
      game('Feit of mening','Welke zin is een mening?',['De noten staan in een schaal.','Dit is de gezelligste maaltijd van het jaar.','Eekhoorn gebruikt een notenkraker.'],1,'Een mening vertelt wat iemand vindt.',null,14),
      game('Oorzaak en gevolg','Waarom staan de noten nu in de schuur?',['Haas wilde de mand verkopen.','Eekhoorn wilde ze tegen de regen beschermen.','Egel wilde het pad versieren.'],1,'Zoek de reden die Eekhoorn geeft.',null,9),
      game('Het werkwoord','Welk woord is het werkwoord?',['draagt','Haas','schaal'],0,'Het werkwoord vertelt hier wat Haas doet.','Haas draagt de schaal.'),
      game('Het onderwerp','Wat is het onderwerp van deze zin?',['leest','de boodschap','Egel'],2,'Vraag: wie leest de boodschap?','Egel leest de boodschap.'),
      game('De persoonsvorm','Wat is de persoonsvorm van deze zin?',['Vos','brengt','appels'],1,'Maak er een vraag van: Brengt Vos appels?','Vos brengt appels.'),
      game('Het voegwoord','Welk voegwoord past bij de reden?',['want','maar','of'],0,'Het tweede deel vertelt waarom ze naar binnen gaan.','De dieren gaan naar binnen, … het regent.'),
      game('Fictie en non-fictie','Waarom is dit verhaal fictie?',['Noten kunnen in een mand liggen.','Regen kan uit wolken vallen.','De schrijver verzint pratende dieren die samen een raadsel oplossen.'],2,'Fictie is een verzonnen verhaal.')
    ],
    'm5-nieuw-papier':[
      game('De hoofdgedachte','Welke zin vat het verhaal het best samen?',['Lina en Sem maken een bedankkaart van oud papier.','De juf verplaatst een rek in de klas.','Amir koopt een doos met tekenbladen.'],0,'Kies wat bij het hele verhaal past.',null,14),
      {type:'sequence',icon:'⏳',title:'Van oud naar nieuw',q:'Zet de stappen in de juiste volgorde.',items:['Het oude papier wordt gescheurd en geweekt.','De juf maakt de snippers fijn tot pulp.','De kinderen scheppen een laagje op het raam.','Het vel droogt en wordt een kaart.'],hint:'De snippers moeten zacht zijn voordat je ze fijnmaakt.'},
      {type:'sentence',icon:'🧩',title:'Bouw de zin',q:'Zet de zin in de goede volgorde.',image:papier(11),parts:[{text:'Lina',role:'wie'},{text:'drukt',role:'doet'},{text:'de spons',role:'wat'},{text:'tegen het gaas',role:'waar'}]},
      game('Het tekstdoel','Waarvoor dient het stappenplan op tafel?',['Om te vertellen wie de mooiste kaart heeft.','Om uit te leggen hoe je papier schept.','Om een spannend raadsel te vertellen.'],1,'Een stappenplan helpt je om iets in de juiste volgorde te doen.',null,6),
      game('Een instructie lezen','Wat doen de kinderen vlak na het scheppen?',['Ze schrijven meteen op het natte vel.','Ze geven het raam aan Amir.','Ze laten het water boven de bak uitdruppen.'],2,'Zoek stap twee in het stappenplan.',null,6),
      game('Woordenschat','Wat betekent rafelig?',['helemaal glad','met losse vezeltjes aan de rand','zo nat dat het drupt'],1,'Bekijk de uitleg bij het blauwe woord.','De rand is wat rafelig, maar nergens zit een gat.',12),
      game('Feit of mening','Welke zin is een feit dat je in het verhaal kunt controleren?',['Zelfgemaakt papier is altijd mooier.','Knutselen is het leukste vak.','De kinderen gebruiken een raam met gaas.'],2,'Een feit kun je controleren. Een mening vertelt wat iemand vindt.',null,5),
      game('Een duidelijk gevolg','Wat gebeurt er doordat de spons water opneemt?',['Het vel wordt minder nat.','Het vel verandert in plastic.','Het gaas krijgt grotere gaten.'],0,'Denk aan waar het water naartoe gaat.',null,10),
      game('Het werkwoord','Welk woord is het werkwoord?',['Sem','papier','scheurt'],2,'Het werkwoord vertelt hier wat Sem doet.','Sem scheurt papier.'),
      game('Het onderwerp','Wat is het onderwerp van deze zin?',['Lina','tekent','bloemen'],0,'Vraag: wie tekent bloemen?','Lina tekent bloemen.'),
      game('De persoonsvorm','Wat is de persoonsvorm van deze zin?',['droogt','het papier','op het rek'],0,'Maak er een vraag van: Droogt het papier op het rek?','Het papier droogt op het rek.'),
      game('Het voegwoord','Welk voegwoord past bij de tegenstelling?',['want','maar','of'],1,'Het eerste vel mislukt. Toch geeft Sem niet op.','Het vel scheurt, … Sem probeert het opnieuw.')
    ]
  };
  window.ZISA_SPEED_GAMES={...(window.ZISA_SPEED_GAMES||{}),
    'm5-lege-mand':{words:['hazelnoten','verzameld','bosmaaltijd','voorraad','schuur','regendruppels','verdwenen','hengsel','roodbruine','aanwijzing','wielsporen','notenkraker','opgelucht','terechtgekomen','boodschap','vervoeren','gekraak','overgebleven']},
    'm5-nieuw-papier':{words:['schooltuin','bijzondere','bedankkaart','tekenbladen','achterkant','plastic','nietjes','snippers','weken','geduld','mixer','pulp','vezels','stappenplan','teleurgesteld','voorzichtig','spons','rafelig','oppervlak','kleurpotloden','recycleren','materiaal']}
  };
  window.ZISA_FLUENCY_BOOKS={...(window.ZISA_FLUENCY_BOOKS||{}),
    'm5-lege-mand':[
      {title:'Lees in groepjes',q:'Welke leesgroepjes maken de zin duidelijk?',a:['Onder de oude eik / staat een mand / met hazelnoten.','Onder de / oude eik staat / een mand met hazelnoten.','Onder de oude eik staat een / mand met / hazelnoten.'],correct:0,good:'Juist! Woorden die bij elkaar horen, lees je samen.'},
      {title:'Woorddelen',q:'Welke twee woorden vormen wielsporen?',focus:'wielsporen',a:['wiels en poren','wiel en sporen','wie en lsporen'],correct:1,good:'Juist! wiel en sporen vormen wielsporen.'},
      {title:'Lettergrepen',q:'Hoe verdeel je hazelnoten in lettergrepen?',focus:'hazelnoten',a:['haz-el-not-en','ha-zel-no-ten','ha-zel-not-en'],correct:1,good:'Juist! ha-zel-no-ten: vier lettergrepen.'},
      {title:'Klanksoorten',q:'In welk woord zie je een korte klank?',a:['mand','noot','huis'],correct:0,good:'Juist! In mand hoor je de korte klank a.'},
      {title:'Lezen met intonatie',q:'Hoe lees je de vraag van Haas?',focus:'Waar zijn mijn noten gebleven?',a:['Alsof Haas een rustig lijstje opzegt.','Alsof Haas blij iemand bedankt.','Alsof Haas verbaasd iets wil weten.'],correct:2,good:'Juist! Lees de zin nu hardop met een vragende stem.'},
      {title:'Goed kijken naar woorden',q:'Welk woord betekent meer dan één hazelnoot?',focus:'hazelnoot',a:['hazelnoten','hazelnootje','hazelboom'],correct:0,good:'Juist! hazelnoten is het meervoud van hazelnoot.'}
    ],
    'm5-nieuw-papier':[
      {title:'Lees in groepjes',q:'Welke leesgroepjes maken de zin duidelijk?',a:['Op het / houten raam blijft / een dun laagje liggen.','Op het houten raam blijft een / dun laagje / liggen.','Op het houten raam / blijft een dun laagje / liggen.'],correct:2,good:'Juist! Lees de woorden die bij elkaar horen samen.'},
      {title:'Woorddelen',q:'Welke twee woorden vormen kleurpotloden?',focus:'kleurpotloden',a:['kleurt en potloden','kleur en potloden','kleu en rpotloden'],correct:1,good:'Juist! kleur en potloden vormen kleurpotloden.'},
      {title:'Lettergrepen',q:'Hoe verdeel je papier in lettergrepen?',focus:'papier',a:['pap-ier','papi-er','pa-pier'],correct:2,good:'Juist! pa-pier: twee lettergrepen.'},
      {title:'Klanksoorten',q:'In welk woord zie je een lange klank?',a:['nat','doek','raam'],correct:2,good:'Juist! In raam hoor je de lange klank aa.'},
      {title:'Klanksoorten',q:'In welk woord zie je een tweetekenklank?',a:['spons','doek','raam'],correct:1,good:'Juist! In doek hoor je de tweetekenklank oe.'},
      {title:'Lezen met intonatie',q:'Welke stem past bij deze uitroep?',focus:'Hoera, ons papier is droog!',a:['een vrolijke stem','een verdrietige stem','een boze stem'],correct:0,good:'Juist! Lees de uitroep nu hardop met een vrolijke stem.'}
    ]
  };
  window.ZISA_STORY_GLOSSARIES={...(window.ZISA_STORY_GLOSSARIES||{}),
    'm5-lege-mand':{
      voorraad:'Iets wat je bewaart om later te gebruiken. Haas bewaart noten voor de maaltijd.',
      schuur:'Een gebouw waarin je spullen kunt bewaren. De dieren zetten er hun tafel en banken.',
      hengsel:{text:'Het handvat waaraan je een mand optilt.',image:'images/woorduitleg/m5-hengsel.webp'},
      vacht:'Alle haren op het lijf van een dier.',
      aanwijzing:'Iets wat je helpt om een vraag of een raadsel op te lossen.',
      wielsporen:'Afdrukken die de wielen van een kar achterlaten in zachte grond.',
      notenkraker:{text:'Een hulpmiddel waarmee je de harde dop van een noot openbreekt.',image:'images/woorduitleg/m5-notenkraker.webp'},
      opgelucht:'Blij en rustig omdat je je geen zorgen meer hoeft te maken.',
      kantelt:'Houdt iets schuin door één kant omhoog te tillen.',
      kleeft:'Blijft aan iets vastzitten.',
      boodschap:'Wat iemand je wil laten weten, bijvoorbeeld in een briefje.',
      vervoeren:'Iets van de ene plek naar een andere plek brengen.'
    },
    'm5-nieuw-papier':{
      bedankkaart:'Een kaart waarmee je iemand bedankt.',
      snippers:'Kleine stukjes papier die je hebt gescheurd of geknipt.',
      weken:'Iets een tijd in water laten liggen zodat het zacht wordt.',
      geduld:'Rustig kunnen wachten, ook als je graag meteen verder wilt.',
      pulp:{text:'Een zachte, natte brij. Hier is die gemaakt van papier en water.',image:'images/woorduitleg/m5-pulp.webp'},
      vezels:'Heel dunne draadjes. Papier bestaat uit veel vezels die aan elkaar vastzitten.',
      gaas:{text:'Een netwerk van dunne draadjes met kleine gaatjes ertussen. Water kan erdoor.',image:'images/woorduitleg/m5-gaas.webp'},
      stappenplan:'Een uitleg die stap voor stap vertelt wat je moet doen.',
      teleurgesteld:'Verdrietig omdat iets niet gaat zoals je had gehoopt.',
      rafelig:'Met losse vezeltjes aan de rand, dus niet helemaal glad.',
      oppervlak:'De buitenkant van iets die je kunt zien of aanraken.',
      recycleren:'Van gebruikt materiaal opnieuw bruikbaar materiaal maken.',
      materiaal:'Een stof waarvan je iets kunt maken, zoals papier, hout of klei.'
    }
  };
})();
