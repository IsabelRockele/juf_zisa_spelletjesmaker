/* ==========================================================
   dictee-zinnen-graad2.js
   Voorbeeldzinnen voor het weekdictee — graad 2 (L3 + L4)
   
   Format per regel:
     "<groep>|<grondvorm>": "Voorbeeldzin met het woord erin."
   
   - <groep>     = exact dezelfde key als in graad2.js (zonder -g2 suffix)
   - <grondvorm> = de "tekst" van het woord (bij meervouden: enkelvoud,
                   bij verkleinwoorden: grondwoord, bij werkwoorden: infinitief)
   
   Zinnen graad 2 mogen iets complexer zijn dan graad 1:
   - Wat langere zinnen (8-12 woorden)
   - Subwoord nog steeds bekend
   - Mag zinsbouw bevatten die past bij L3/L4 (samengestelde zinnen, etc.)
   ========================================================== */
window.SpellingDicteeZinnen = window.SpellingDicteeZinnen || {};

window.SpellingDicteeZinnen.graad2 = {

  // ==========================================================
  // HOORWOORDEN
  // ==========================================================

  // ----- ng / nk woorden -----
  "ng-nk|ring": "De zilveren ring glanst in het licht.",
  "ng-nk|slang": "De slang kruipt langzaam door het hoge gras.",
  "ng-nk|long": "Een dokter luistert aandachtig naar mijn long.",
  "ng-nk|wang": "Na het rennen werd haar wang helemaal rood.",
  "ng-nk|sprong": "Met één grote sprong bereikte hij de overkant.",
  "ng-nk|jongen": "De jongen helpt zijn buur met de zware tas.",
  "ng-nk|koning": "De koning begroet de mensen vanaf het balkon.",
  "ng-nk|gang": "In de lange gang brandt nog één lamp.",
  "ng-nk|woning": "Hun nieuwe woning ligt vlak bij het park.",
  "ng-nk|tekening": "Mila hangt haar tekening trots aan de muur.",
  "ng-nk|richting": "De pijl wijst ons in de juiste richting.",
  "ng-nk|oefening": "Deze oefening lukt beter na wat extra uitleg.",
  "ng-nk|regering": "De regering bespreekt vandaag een nieuw voorstel.",
  "ng-nk|vergadering": "Tijdens de vergadering maakt de juf enkele afspraken.",
  "ng-nk|aankondiging": "De aankondiging hangt duidelijk naast de schoolpoort.",
  "ng-nk|verandering": "Na de verandering ziet het lokaal er ruimer uit.",
  "ng-nk|bank": "Opa rust even uit op een houten bank.",
  "ng-nk|plank": "Papa bevestigt de plank stevig aan de muur.",
  "ng-nk|klank": "Luister goed naar de laatste klank van het woord.",
  "ng-nk|pink": "Aan haar pink draagt ze een kleine ring.",
  "ng-nk|vink": "Een vink pikt zaadjes onder de struik.",
  "ng-nk|drank": "Na de wandeling krijgt iedereen een koele drank.",
  "ng-nk|dank": "Als dank schrijft Noor een vriendelijk kaartje.",
  "ng-nk|schenking": "Dankzij de schenking krijgt de bib nieuwe boeken.",
  "ng-nk|enkel": "Tijdens het sporten verzwikte Amir zijn enkel.",
  "ng-nk|wenkbrauw": "Er kleeft een klein pluisje aan mijn wenkbrauw.",
  "ng-nk|kink": "Door een kink in de kabel werkt de lamp niet.",
  "ng-nk|bedankt": "De meester bedankt de klas voor alle hulp.",
  "ng-nk|dronken": "De dorstige hond heeft zijn kom leeggedronken.",
  "ng-nk|dankbaar": "Lina is dankbaar voor het onverwachte cadeau.",
  "ng-nk|stinkend": "We gooien de stinkende sok meteen in de wasmand.",

  // ----- sch-woorden -----
  "sch-woorden|school": "Voor de school wachten ouders op hun kinderen.",
  "sch-woorden|schoen": "Er zit een losse veter aan mijn schoen.",
  "sch-woorden|schip": "Het schip vaart rustig de haven binnen.",
  "sch-woorden|schaar": "Knip de vorm voorzichtig uit met de schaar.",
  "sch-woorden|schaap": "Het jonge schaap blijft dicht bij zijn moeder.",
  "sch-woorden|schat": "De piraten verbergen hun schat op het eiland.",
  "sch-woorden|schaal": "Mama legt het verse fruit in een schaal.",
  "sch-woorden|schop": "Met een schop graaft Sem een diepe kuil.",
  "sch-woorden|schil": "De schil van deze appel is felrood.",
  "sch-woorden|schoon": "Na het poetsen is het raam weer schoon.",
  "sch-woorden|scheef": "De fotolijst hangt een beetje scheef.",
  "sch-woorden|schilderij": "In de hal hangt een kleurrijk schilderij.",
  "sch-woorden|schoolbord": "De juf tekent een tijdlijn op het schoolbord.",
  "sch-woorden|schoonmaak": "Bij de grote schoonmaak ruimen we alles op.",
  "sch-woorden|schitteren": "De sterren schitteren boven het donkere bos.",
  "sch-woorden|schaduw": "Onder de boom zoeken we koele schaduw.",
  "sch-woorden|schikken": "De kinderen schikken de bloemen in een vaas.",
  "sch-woorden|schipper": "De schipper stuurt de boot veilig naar de kade.",
  "schr-woorden|schroef": "Draai de schroef stevig vast met een schroevendraaier.",
  "schr-woorden|schrijven": "Vandaag schrijven we een brief aan onze penvriend.",
  "schr-woorden|schrik": "Met een schrik springt de kat van de vensterbank.",
  "schr-woorden|schreeuwen": "In de bibliotheek mag je niet schreeuwen.",
  "schr-woorden|schram": "Na zijn val heeft Tuur een schram op zijn knie.",
  "schr-woorden|schrobben": "We moeten de vuile vloer grondig schrobben.",
  "schr-woorden|schrappen": "Je mag het verkeerde antwoord netjes schrappen.",
  "schr-woorden|schrijver": "De schrijver leest voor uit zijn nieuwste boek.",

  // ----- Clusters (meerdere medeklinkers in midden) -----
  "clusters|masker": "Voor het feest maakt ze een grappig masker.",
  "clusters|kasteel": "Boven op de heuvel staat een oud kasteel.",
  "clusters|onder": "De kat verstopt zich onder de lage kast.",
  "clusters|vinger": "Er zit een druppel verf op mijn vinger.",
  "clusters|honger": "Na de zwemles heeft iedereen grote honger.",
  "clusters|lantaarn": "Een lantaarn verlicht het donkere tuinpad.",
  "clusters|trompet": "De muzikant speelt een vrolijk lied op zijn trompet.",
  "clusters|kompas": "Met een kompas vinden de wandelaars het noorden.",
  "clusters|prinses": "De prinses opent zelf de poort van het paleis.",
  "clusters|werkster": "De werkster zet de stoelen netjes op hun plaats.",
  "clusters|wintertijd": "In de wintertijd wordt het vroeger donker.",
  "clusters|klanten": "De bakker helpt zijn klanten met een glimlach.",
  "clusters|versterking": "De ploeg krijgt na de rust extra versterking.",
  "clusters|wandeling": "Tijdens de wandeling verzamelen we mooie bladeren.",
  "clusters|plotseling": "Plotseling begon het heel hard te regenen.",
  "clusters|lente": "In de lente verschijnen de eerste bloemen.",
  "clusters|winter": "Deze winter lag er dagenlang een dik pak sneeuw.",
  "clusters|gisteren": "Gisteren bezocht onze klas het museum.",
  "clusters|kelder": "In de kelder bewaart opa lege dozen.",
  "clusters|kalkoen": "De kalkoen stapt statig over het erf.",

  // ----- ei / ij woorden -----
  // TODO

  // ----- au / ou woorden -----
  // TODO

  // ----- aai / ooi / oei / eeuw / ieuw / uw -----
  "aai-ooi-oei-eeuw-ieuw-uw|haai": "Een haai zwemt geruisloos onder de boot.",
  "aai-ooi-oei-eeuw-ieuw-uw|kraai": "Op de schoorsteen zit een zwarte kraai.",
  "aai-ooi-oei-eeuw-ieuw-uw|draai": "Na een snelle draai staat de danser weer stil.",
  "aai-ooi-oei-eeuw-ieuw-uw|lawaai": "Door het lawaai kon ik de uitleg niet horen.",
  "aai-ooi-oei-eeuw-ieuw-uw|zwaai": "Met een vrolijke zwaai neemt Noor afscheid.",
  "aai-ooi-oei-eeuw-ieuw-uw|saai": "Zonder kleur vond hij de tekening nogal saai.",
  "aai-ooi-oei-eeuw-ieuw-uw|fraai": "De kunstenaar maakt een fraai beeld van klei.",
  "aai-ooi-oei-eeuw-ieuw-uw|naai": "Ik naai de losse knoop weer aan mijn jas.",
  "aai-ooi-oei-eeuw-ieuw-uw|naait": "Oma naait een zachte kussensloop voor mij.",
  "aai-ooi-oei-eeuw-ieuw-uw|maai": "In de zomer maai ik samen met papa het gras.",
  "aai-ooi-oei-eeuw-ieuw-uw|papegaai": "De papegaai bootst de stem van de verzorger na.",
  "aai-ooi-oei-eeuw-ieuw-uw|kaai": "Langs de kaai liggen kleine vissersboten.",
  "aai-ooi-oei-eeuw-ieuw-uw|kooi": "Het deurtje van de kooi staat open.",
  "aai-ooi-oei-eeuw-ieuw-uw|hooi": "De boer bewaart het droge hooi in de schuur.",
  "aai-ooi-oei-eeuw-ieuw-uw|mooi": "Wat heb jij die kaart mooi versierd!",
  "aai-ooi-oei-eeuw-ieuw-uw|gooi": "Gooi de bal voorzichtig naar je partner.",
  "aai-ooi-oei-eeuw-ieuw-uw|strooi": "Ik strooi wat zaad voor de vogels.",
  "aai-ooi-oei-eeuw-ieuw-uw|vlooi": "De hond krabt omdat een vlooi hem bijt.",
  "aai-ooi-oei-eeuw-ieuw-uw|plooi": "Er zit een scherpe plooi in het papier.",
  "aai-ooi-oei-eeuw-ieuw-uw|rooi": "In de herfst rooi ik aardappelen met mijn oom.",
  "aai-ooi-oei-eeuw-ieuw-uw|boei": "De rode boei drijft ver van het strand.",
  "aai-ooi-oei-eeuw-ieuw-uw|groei": "Door zon en regen komt de plant goed tot groei.",
  "aai-ooi-oei-eeuw-ieuw-uw|bloei": "De appelboom staat in het voorjaar volop in bloei.",
  "aai-ooi-oei-eeuw-ieuw-uw|stoei": "Ik stoei soms met mijn broer op het tapijt.",
  "aai-ooi-oei-eeuw-ieuw-uw|knoei": "Knoei niet met verf op je nieuwe trui.",
  "aai-ooi-oei-eeuw-ieuw-uw|roei": "Elke woensdag roei ik met mijn club op het meer.",
  "aai-ooi-oei-eeuw-ieuw-uw|foei": "Foei, je mag de poes niet aan haar staart trekken!",
  "aai-ooi-oei-eeuw-ieuw-uw|broei": "Door de broei wordt het warm in de composthoop.",
  "aai-ooi-oei-eeuw-ieuw-uw|vermoeid": "Na de lange tocht kwam iedereen vermoeid thuis.",
  "aai-ooi-oei-eeuw-ieuw-uw|boeiend": "De gids vertelt een boeiend verhaal over het kasteel.",
  "aai-ooi-oei-eeuw-ieuw-uw|leeuw": "De leeuw rust in de schaduw van een rots.",
  "aai-ooi-oei-eeuw-ieuw-uw|sneeuw": "Vannacht bedekte verse sneeuw alle daken.",
  "aai-ooi-oei-eeuw-ieuw-uw|eeuw": "Dit gebouw is bijna een eeuw oud.",
  "aai-ooi-oei-eeuw-ieuw-uw|spreeuw": "Een spreeuw bouwt een nest onder de dakgoot.",
  "aai-ooi-oei-eeuw-ieuw-uw|meeuw": "De meeuw zweeft hoog boven de golven.",
  "aai-ooi-oei-eeuw-ieuw-uw|geeuw": "Tijdens de stille film ontsnapt mij een geeuw.",
  "aai-ooi-oei-eeuw-ieuw-uw|eeuwig": "Het wachten op de bus leek wel eeuwig te duren.",
  "aai-ooi-oei-eeuw-ieuw-uw|sneeuwbal": "De sneeuwbal spat uiteen tegen de boomstam.",
  "aai-ooi-oei-eeuw-ieuw-uw|kieuw": "Door zijn kieuw haalt de vis zuurstof uit het water.",
  "aai-ooi-oei-eeuw-ieuw-uw|nieuw": "Mijn nieuwe jas heeft twee diepe zakken.",
  "aai-ooi-oei-eeuw-ieuw-uw|opnieuw": "Na de fout probeert ze de som opnieuw.",
  "aai-ooi-oei-eeuw-ieuw-uw|nieuws": "Op de radio horen we het nieuws van vandaag.",
  "aai-ooi-oei-eeuw-ieuw-uw|vernieuwen": "In de vakantie gaan ze het speelplein vernieuwen.",
  "aai-ooi-oei-eeuw-ieuw-uw|nieuwtje": "Sam fluistert een spannend nieuwtje in mijn oor.",
  "aai-ooi-oei-eeuw-ieuw-uw|ruw": "De ruwe steen voelt scherp aan mijn hand.",
  "aai-ooi-oei-eeuw-ieuw-uw|schuw": "Het schuwe dier verstopt zich achter een struik.",
  "aai-ooi-oei-eeuw-ieuw-uw|duw": "Met één flinke duw gaat de zware deur open.",
  "aai-ooi-oei-eeuw-ieuw-uw|duwen": "Samen duwen we de kast naar de andere muur.",
  "aai-ooi-oei-eeuw-ieuw-uw|sluw": "De sluwe vos lokt de kippen uit hun hok.",
  "aai-ooi-oei-eeuw-ieuw-uw|stuwen": "De sterke stroming kan het water vooruit stuwen.",

  // ----- ch / cht / gt -----
  // TODO

  // ----- Doffe klank -----
  // TODO


  // ==========================================================
  // REGELWOORDEN
  // ==========================================================

  // ----- Verdubbel / verenkel -----
  // TODO

  // ----- Verlengingsregel t/d + p/b -----
  // TODO

  // ----- Verkleinwoorden (-je, -tje, -pje, -etje, -kje) -----
  // TODO

  // ----- Meervouden (-en, -s, -'s, -eren) -----
  // TODO

  // ----- Doffe klank in voorvoegsel -----
  // TODO

  // ----- Doffe klank in achtervoegsel -----
  // TODO


  // ==========================================================
  // WERKWOORDEN
  // ==========================================================

  // ----- OTT (onvoltooid tegenwoordige tijd) -----
  // TODO

  // ----- VTT (voltooid tegenwoordige tijd) -----
  // TODO

  // ----- OVT zwak -----
  // TODO

  // ----- OVT sterk -----
  // TODO

  // ----- VVT (voltooid verleden tijd) -----
  // TODO


  // ==========================================================
  // HOOFDLETTERS
  // ==========================================================
  // TODO


  // ==========================================================
  // L4-SPECIFIEK
  // ==========================================================

  // ----- -teit / -heid -----
  // TODO

  // ----- Leenwoorden -----
  // TODO

};
