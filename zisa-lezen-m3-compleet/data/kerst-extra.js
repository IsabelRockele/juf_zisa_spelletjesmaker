// Kerstverhalen vrijgegeven door de leerkracht.
(()=>{
 const choice=(title,q,focus,a,correct=0,extra={})=>({title,q,focus,a,correct,...extra});
 const say=(title,text,tip)=>({title,q:'Lees hardop.',text,tip});
 const configs={
 START:{kind:'memory',title:'zoek twee',intro:'zoek het woord bij de prent.',practice:s=>[
 {title:'zoem maar',q:'lees het woord.',chunks:['b','e','l'],word:'bel'},
 choice('kijk goed','wat is net zo?','pak',['pik','pak','pek'],1),
 {title:'woord en prent',q:'kijk en lees.',text:'poes',pictures:['bel','pak','poes'].map(w=>({src:s.glossary[w].image,alt:'prent'})),correct:2},
 choice('rijm maar','wat rijmt?','tik',['tak','pik','pak'],1),
 {title:'de korte klank',q:'tik op de korte klank.',shortVowels:[{word:'bel',index:1},{word:'pak',index:1},{word:'tik',index:1}],good:'dat is goed!'}]},
 M3:{kind:'delivery',title:'Een pak voor Sam en Mo',intro:'Lees het briefje. Sleep het juiste ding naar Sam of Mo.',practice:s=>[
 choice('Lees precies','Welk woord is hetzelfde?','klep',['klap','klep','klop'],1),
 {title:'Lees en kijk',q:'Welke prent past?',text:'mo gaat in de doos.',pictures:[1,3,9].map(n=>({src:picture(s,n),alt:'Prent uit het verhaal'})),correct:1},
 {title:'Korte klanken',q:'Tik op de korte klank.',shortVowels:[{word:'kat',index:1},{word:'bal',index:1},{word:'bel',index:1}],good:'Goed! Je hoorde de korte klanken.'},
 choice('Wie is hij?','Over wie gaat hij?','sam ziet mo. hij aait de kat.',['sam','mo','mam']),
 say('Lees met een stem','tik, tik!\nwie zit in de doos?\nhet is mo!','Lees de vraag nieuwsgierig. Laat horen dat Sam blij is als hij Mo ziet.') ]},
 E3:{kind:'memory',title:'Hik, zoek het paar!',intro:'Zoek telkens een zin en de passende prent. Onthoud waar ze liggen.',practice:s=>[
 choice('Lange woorden','Welk woord lees je?','ren — dier',['rendier','renbaan','dierentuin']),
 {title:'De zin vertelt het',q:'Welke prent past bij de hele zin?',text:'Pip houdt de teugel vast. Het rendier blijft staan.',pictures:[5,7,10].map(n=>({src:picture(s,n),alt:'Prent uit het verhaal'})),correct:0},
 choice('Wie doet het?','Naar wie verwijst hij?','De kerstman neemt een slokje. Hij zet de kop neer.',['de kerstman','Pip','het rendier']),
 choice('Wat komt waardoor?','Waarom zet het rendier een stap?','De bel rinkelt. Het rendier stapt vooruit.',['De bel is het teken om te gaan.','Het rendier wil thee.','Pip zingt een lied.']),
 {...say('Een waarschuwing','Ho, wacht!','Lees alsof Pip wil voorkomen dat de slee te vroeg vertrekt.'),moods:['bezorgd','slaperig','vrolijk'],correctMood:0}]},
 M4:{kind:'detective',title:'Wouts pakjesspeurder',intro:'Wout helpt de kerstman. Lees de sporen en klap alle pakjes weg die niet passen.',practice:s=>[
 choice('Een woord in twee delen','Wat doet een sneeuwgids?','sneeuw + gids',['De weg wijzen in de sneeuw.','De sneeuw warm maken.','Pakjes in sneeuw verstoppen.']),
 choice('Vul het verband aan','Welk woord past?','Wout gaat naar buiten, … het binnen te warm is.',['omdat','maar','of']),
 choice('Van wie?','Van wie is de buik?','Wout voelt een druppel. Zijn buik wordt zacht.',['van Wout','van Pip','van de kerstman']),
 choice('Lees de volgorde','Wat gebeurt vóór de kerstman het pad gebruikt?','Wout schuift de sneeuw opzij. Daarna ziet de kerstman de stoep.',['Wout maakt het pad vrij.','De kerstman rijdt naar de stal.','Pip maakt een sneeuwtaart.']),
 {...say('Van teleurstelling naar trots','Ik kan nergens mee naar binnen.\nMaar buiten weet ik de weg!','Lees de eerste zin teleurgesteld en de tweede trots.'),moods:['eerst verdrietig, dan trots','steeds boos','steeds slaperig'],correctMood:0}]},
 E4:{kind:'memory',title:'Het geheugen van Moos',intro:'Zoek een gebeurtenis en de prent die daarbij hoort. Alle kaartjes worden opnieuw geschud.',practice:s=>[
 choice('Tegenstellingen','Welk woord betekent bijna het tegenovergestelde?','piepklein',['reusachtig','onzichtbaar','voorzichtig']),
 choice('Hetzelfde woord, andere betekenis','Wat is de voet in deze zin?','Moos bekijkt de houten voet onder de bol.',['de onderkant waarop de bol staat','een lichaamsdeel van Moos','een laars van de kerstman']),
 choice('Waar is daar?','Waar zoekt Moos in de tweede zin?','Moos kijkt onder de tafel. Daar zit de kerstman ook niet.',['onder de tafel','in de sneeuwbol','op de stoel']),
 choice('Oorzaak en gevolg','Welke zin geeft de oorzaak?','Moos houdt de bol schuin. De sneeuw vliegt in het rond.',['Moos houdt de bol schuin.','De sneeuw vliegt in het rond.','De kerstman heeft een muts.']),
 {...say('Lees het grappige einde','Volgende keer neem ik een vakantie zonder sneeuw!','De kerstman is weer veilig. Lees met opluchting en een lach.'),moods:['opgelucht en vrolijk','woedend','bang'],correctMood:0}]},
 M5:{kind:'stage',title:'Jij regisseert de kerstshow',intro:'Lees het regiebriefje. Sleep de juiste speler naar de juiste plek. Laat de scène daarna spelen.',practice:s=>[
 choice('Afleiden uit de zin','Wat betekent onverwachte hier?','De elf had een onverwachte bezoeker. Niemand had Ster op het toneel gepland.',['een bezoeker op wie niemand rekende','een bezoeker die te laat kwam','een bezoeker die niet welkom was']),
 choice('Tijdwoorden','Wat is al gebeurd als Mila de wortel pakt?','Nadat de juf de muziek zachter zet, pakt Mila een wortel.',['De muziek is zachter gezet.','Ster staat alweer buiten.','De laatste buiging is voorbij.']),
 choice('Wie weet wat?','Wat weet de lezer wél, maar het publiek op dat moment niet?','De ouders denken dat Ster bij de show hoort.',['Het rendier is per ongeluk binnengekomen.','Er staat een kerstboom op het toneel.','Finn draagt een elfenmuts.']),
 choice('Een conclusie controleren','Welk detail toont dat Ster niet echt meebuigt?','Ster laat zijn kop zakken tijdens de buiging.',['Er ligt een stukje wortel op de vloer.','De ouders klappen hard.','Mila en Finn buigen ook.']),
 {...say('Met dubbele betekenis','Ik zocht mijn rendier, maar blijkbaar heeft het al werk gevonden.','Lees de grap van de kerstman met een kleine pauze voor maar.'),moods:['geamuseerd','verdrietig','dreigend'],correctMood:0}]},
 E5:{kind:'radio',title:'Radio Sneeuwvlok: zoek het adres',intro:'Combineer de radioberichten. Klap de huizen weg die niet passen en stuur de slee naar het juiste huis.',practice:s=>[
 choice('Feit of mening?','Welke zin kun je controleren?','Denk aan het verschil tussen een feit en een mening.',['Het feest is in de sportzaal aan de Beukenlaan.','De sportzaal is de gezelligste plek van het dorp.','De kerstman vindt zwemmen vast heel leuk.']),
 choice('Een bruikbaar bericht','Welk bericht helpt de kerstman het snelst?','Er is geruis op de radio. Kies de noodzakelijke informatie.',['Sportzaal, Beukenlaan, naast het groene hek. Niet het zwembad.','Het wordt een heel gezellig feest met lekkere koekjes.','Iedereen is blij en Fien heeft ontzettend hard gewerkt.']),
 choice('Verwijswoorden','Wie zijn jullie?','Fien belt naar de studio: Kunnen jullie het adres herhalen?',['Mila en Bas','Fien en de kerstman','de bezoekers en Fien']),
 choice('Een gevolg afleiden','Waarom herhaalt Mila het adres zonder grapjes?','De kerstman hoorde door gekraak maar een deel van het bericht.',['Dan kan hij de ontbrekende informatie beter opvangen.','Dan verdwijnt alle storing uit zijn toestel.','Dan duurt de rit vanzelf minder lang.']),
 say('Jij bent de omroeper','Niet het zwembad. Wel de sportzaal aan de Beukenlaan, naast het groene hek.','Lees rustig. Benadruk niet en wel. Pauzeer even voor het herkenningspunt.') ]},
 M6:{kind:'concept-memory',title:'Het geheugen van de werkplaats',intro:'Zoek bij elk begrip de juiste uitleg. Lees nauwkeurig: sommige betekenissen lijken op elkaar.',practice:s=>[
 choice('Vermoeden of bewijs?','Welke zin is een vermoeden?','Otis en Lena onderzoeken het geluid.',['Misschien loopt het muziekdoosje vanzelf.','Het pak staat op de werkbank.','Buiten klinkt opnieuw hetzelfde getik.']),
 choice('Een verklaring uitsluiten','Waarom verzwakt dit hun eerste vermoeden?','Het pak staat binnen. Toch klinkt het getik buiten bij de slee.',['Het geluid blijft bij de slee en niet bij het verplaatste pak.','Het papier om het pak is blauw.','Een muziekdoosje kan nooit stukgaan.']),
 choice('Helder formuleren','Welke zin maakt het duidelijkst wie luistert?','Lena geeft Otis het pak. Hij luistert nog één keer.',['Otis luistert nog één keer naar het pak.','Hij luistert nog één keer naar hem.','Die luistert daar nog één keer.']),
 choice('Letterlijk of figuurlijk?','Wat wordt bedoeld?','De kerstman barst in lachen uit.',['Hij begint plots heel hard te lachen.','Zijn jas scheurt door het lachen.','Hij wordt boos op Otis.']),
 say('Lees als een onderzoeker','Het pak staat nog op de bank. Buiten klinkt opnieuw hetzelfde getik. Dan kwam het geluid niet uit de doos!','Pauzeer na de waarneming. Laat daarna de ontdekking in je stem horen.') ]},
 E6:{kind:'snow',title:'Regel de kleurensneeuw',intro:'Lees het weerbericht en de afspraken. Stel de machine en het opvangdoek zo in dat de voorstelling kan doorgaan.',practice:s=>[
 choice('Doel en middel','Wat is het uiteindelijke doel van het nieuwe plan?','Noa stelt kleurensneeuw voor.',['Een feestelijke voorstelling geven die eerlijk aangekondigd en opruimbaar is.','Zoveel mogelijk papier over het plein verspreiden.','Doen alsof de gekleurde snippers echte sneeuw zijn.']),
 choice('Een argument beoordelen','Welk argument maakt zeven ongeschikt?','Ze willen wit papier en gekleurde confetti scheiden.',['De vlokken en snippers zijn even klein.','De zak heeft een gekleurd etiket.','De kerstman heeft nog geen koekjes gekregen.']),
 choice('Voorwaarde en gevolg','Wanneer is Noa bereid het plan uit te voeren?','Maar alleen als we die snippers ook weer kunnen opruimen.',['Als het papier na afloop opgeruimd kan worden.','Zodra de machine harder kan blazen.','Alleen als niemand de kleur opmerkt.']),
 choice('Eerlijk samenvatten','Welke samenvatting bewaart probleem én oplossing?','Kies zonder iets bij te verzinnen.',['Door gemengde voorraad ontstaat kleurensneeuw. Ze testen opvang en kondigen de wijziging eerlijk aan.','Eva bestelt echte sneeuw en opa laat die in alle kleuren smelten.','De machine is kapot, dus wordt het hele feest afgelast.']),
 say('Een duidelijke aankondiging','Onze voorstelling is veranderd: vandaag ziet u kleurensneeuw. Het zijn papieren snippers. Blijf achter de rand van het podium; na afloop verzamelen we het papier opnieuw.','Maak hoorbaar wat verandert, wat het publiek moet doen en wat er daarna gebeurt.') ]}
 };
 function picture(s,n){return `https://zisa-leesprenten-start.pages.dev/kerst/${s.id}/${String(n).padStart(2,'0')}${s.imageVersions?.[n]||''}.png`}
 window.ZISA_CHRISTMAS_GAME_CONFIGS={};
 for(const s of window.ZISA_CHRISTMAS_STORIES||[]){
  const config=configs[s.level];if(!config)continue;
  window.ZISA_CHRISTMAS_GAME_CONFIGS[s.id]={...config,id:s.id,level:s.level,bookTitle:s.title,story:s,picture:n=>picture(s,n)};
  window.ZISA_FLUENCY_BOOKS[s.id]=[...config.practice(s),{type:'christmas-game',title:config.title,q:config.intro}];
  const book=window.ZISA_BOOKS.find(b=>b.id===s.id);if(book)book.readingAdventure=`kerst-leesspel.html?verhaal=${s.id}`;
 }
})();
