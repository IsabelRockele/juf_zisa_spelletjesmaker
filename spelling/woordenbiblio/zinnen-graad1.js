/* ==========================================================
   zinnen-graad1.js
   Bibliotheek met handgeschreven zinnen per woord voor graad 1.
   
   Gebruikt door OV06 (Zinnen invullen) om kwalitatief betere zinnen
   aan te bieden dan de generieke sjablonen.
   
   Structuur:
   - window.SpellingZinnen.graad1 = { "woord": ["zin 1", "zin 2", "zin 3"] }
   - Elke zin moet het woord exact bevatten (lowercase, zonder lidwoord
     of buiging — OV06 vervangt het bij invul-moment door ___ of streep)
   
   Fallback: als een woord niet in deze bibliotheek staat, valt OV06
   terug op de bestaande sjabloon-zinnen.
   
   Pedagogische principes:
   - Zinnen pedagogisch goedgekeurd door Isabel Rockelé (juf Zisa)
   - Korte zinnen, leefwereld lj 1
   - In zinnen voor ei/ij-woorden: andere ei/ij-woorden vermeden waar mogelijk
   - Verlengingsregel-woorden (baard/eend/rood/brood/woord/hoed) staan
     NIET in deze bib (horen apart, zie verlengingsregel-categorie)
   ========================================================== */

window.SpellingZinnen = window.SpellingZinnen || {};

window.SpellingZinnen.graad1 = {

  /* ============================================================
     KORTE KLANKEN (MKM)
     ============================================================ */

  // ----- MKM-A (21 woorden) -----
  "bal": [
    "De bal rolt over het gras.",
    "Sam gooit de bal hoog.",
    "Lies vangt de rode bal."
  ],
  "kat": [
    "De kat slaapt in de mand.",
    "Mijn kat heet Pluis.",
    "De kat ligt op de mat."
  ],
  "tas": [
    "Mama heeft een grote tas.",
    "In mijn tas zit een boek.",
    "De tas is zwaar."
  ],
  "man": [
    "De man loopt op straat.",
    "Een man met een hoed.",
    "De man is groot."
  ],
  "pan": [
    "De pan staat op het vuur.",
    "In de pan bakt vlees.",
    "In de pan zit soep."
  ],
  "dak": [
    "De vogel zit op het dak.",
    "Het dak is rood.",
    "Op het dak ligt sneeuw."
  ],
  "mat": [
    "De mat ligt voor de deur.",
    "De kat ligt op de mat.",
    "Mijn mat is groen."
  ],
  "kam": [
    "Ik kam mijn haar met de kam.",
    "De kam ligt op tafel.",
    "Mijn kam is wit."
  ],
  "bak": [
    "De bak staat in de tuin.",
    "In de bak zit zand.",
    "De bak is leeg."
  ],
  "tak": [
    "De tak valt van de boom.",
    "Op de tak zit een vogel.",
    "De tak is dik."
  ],
  "zak": [
    "In de zak zit snoep.",
    "Mijn zak is open.",
    "De zak is vol."
  ],
  "lap": [
    "Ik veeg met een lap.",
    "De lap is nat.",
    "De lap is rood."
  ],
  "rat": [
    "De rat loopt snel.",
    "Ik zie een rat.",
    "De rat heeft een lange staart."
  ],
  "vat": [
    "In het vat zit water.",
    "Het vat is groot.",
    "Het vat staat in de schuur."
  ],
  "wal": [
    "Op de wal staat een man.",
    "De wal is hoog.",
    "Het schip vaart langs de wal."
  ],
  "lat": [
    "Met een lat meet ik de tafel.",
    "De lat is lang.",
    "De lat ligt op de grond."
  ],
  "kar": [
    "De kar staat voor de winkel.",
    "Op de kar ligt fruit.",
    "De kar is vol."
  ],
  "vlag": [
    "De vlag waait in de wind.",
    "Onze vlag is rood, geel en zwart.",
    "De vlag hangt aan de mast."
  ],
  "schat": [
    "De piraat zoekt zijn schat.",
    "Mijn schat ligt verstopt.",
    "Lien is mijn schat."
  ],
  "plant": [
    "De plant staat bij het raam.",
    "Ik geef de plant water.",
    "Mijn plant is groen."
  ],
  "kast": [
    "In de kast hangt mijn jas.",
    "De kast is groot.",
    "Open de kast eens."
  ],

  // ----- MKM-I (10 woorden — kim verwijderd, rib naar verlengingsregel) -----
  "kip": [
    "De kip legt een ei.",
    "Mijn kip pikt graan.",
    "De kip kakelt luid."
  ],
  "vis": [
    "De vis zwemt in de kom.",
    "Ik vang een vis.",
    "De vis is rood."
  ],
  "lip": [
    "Mijn lip bloedt.",
    "De lip is rood.",
    "Bijt niet op je lip."
  ],
  "pit": [
    "In de appel zit een pit.",
    "De pit is zwart.",
    "Spuug de pit niet uit."
  ],
  "wit": [
    "De sneeuw is wit.",
    "Mijn jas is wit.",
    "Een wit blad papier."
  ],
  "bil": [
    "Mijn bil doet pijn.",
    "Ik val op mijn bil.",
    "Op mijn bil zit een blauwe plek."
  ],
  "tik": [
    "Ik geef een tik op de deur.",
    "Een zachte tik.",
    "De tik klinkt hard."
  ],
  "kin": [
    "Mijn kin doet pijn.",
    "Op mijn kin zit een puist.",
    "Wrijf over je kin."
  ],
  "dik": [
    "De man is dik.",
    "Het boek is dik.",
    "Een dik konijn."
  ],
  "vink": [
    "De vink zingt mooi.",
    "Een vink op de tak.",
    "De vink heeft kleurige veren.",
    "De vink zingt in de tuin.",
    "Op de tak zit een vink.",
    "De kleine vink pikt zaadjes."
  ],

  // ----- MKM-E (11 woorden — bed naar verlengingsregel) -----
  "pet": [
    "Sam draagt een pet.",
    "De pet is blauw.",
    "Hang je pet aan de kapstok."
  ],
  "hek": [
    "Het hek staat open.",
    "Achter het hek loopt een hond.",
    "Het hek is hoog."
  ],
  "bel": [
    "De bel rinkelt.",
    "Druk op de bel.",
    "De bel is luid."
  ],
  "pen": [
    "Ik schrijf met mijn pen.",
    "De pen ligt op tafel.",
    "Mijn pen is leeg."
  ],
  "mes": [
    "Het mes is scherp.",
    "Snijd met het mes.",
    "Het mes ligt naast het bord."
  ],
  "net": [
    "De visser werpt zijn net.",
    "Het net is groot.",
    "In het net zitten vissen."
  ],
  "vel": [
    "Mijn vel is zacht.",
    "Op het vel zit een wond.",
    "Een vel papier."
  ],
  "les": [
    "Juf geeft les.",
    "De les begint.",
    "Ik vind de les leuk."
  ],
  "wet": [
    "De wet zegt: pas op!",
    "Iedereen volgt de wet.",
    "De wet is duidelijk."
  ],
  "vest": [
    "Ik draag mijn vest.",
    "Het vest is warm.",
    "Mijn vest is rood."
  ],
  "hen": [
    "De hen legt eieren.",
    "Een hen op de boerderij.",
    "De hen pikt zaadjes."
  ],

  // ----- MKM-O (12 woorden) -----
  "pop": [
    "Lien speelt met haar pop.",
    "De pop ligt in bed.",
    "Mijn pop heet Anna."
  ],
  "rok": [
    "Mama draagt een rok.",
    "De rok is lang.",
    "Mijn rok is roze."
  ],
  "vos": [
    "De vos sluipt door het bos.",
    "Ik zie een vos.",
    "De vos is rood."
  ],
  "kom": [
    "In de kom zit soep.",
    "De kom is leeg.",
    "Mama vult de kom."
  ],
  "pot": [
    "De pot staat op het vuur.",
    "In de pot zit jam.",
    "De pot is groot."
  ],
  "zon": [
    "De zon schijnt.",
    "De zon is geel.",
    "Onder de zon is het warm."
  ],
  "mol": [
    "De mol graaft een gang.",
    "Ik zie een mol in de tuin.",
    "De mol is zwart."
  ],
  "bok": [
    "De bok eet gras.",
    "Pas op voor de bok.",
    "De bok heeft horens."
  ],
  "dop": [
    "Op de fles zit een dop.",
    "Draai de dop los.",
    "De dop is rood."
  ],
  "kop": [
    "In de kop zit thee.",
    "De kop staat op tafel.",
    "Mijn kop is leeg."
  ],
  "bon": [
    "Ik krijg een bon in de winkel.",
    "De bon is groen.",
    "Bewaar je bon goed."
  ],
  "los": [
    "De knoop is los.",
    "Mijn schoen is los.",
    "De hond loopt los."
  ],

  // ----- MKM-U (10 woorden) -----
  "bus": [
    "De bus stopt voor de school.",
    "Ik stap op de bus.",
    "De bus is geel."
  ],
  "hut": [
    "De hut staat in het bos.",
    "Mijn hut is gemaakt van takken.",
    "In de hut spelen we."
  ],
  "mus": [
    "De mus zit op de tak.",
    "Een mus pikt zaadjes.",
    "De mus vliegt weg."
  ],
  "pup": [
    "De pup speelt met de bal.",
    "Mijn pup heet Max.",
    "De pup is nog klein."
  ],
  "kus": [
    "Mama geeft mij een kus.",
    "Een kus op mijn wang.",
    "Geef oma een kus."
  ],
  "rug": [
    "Mijn rug doet pijn.",
    "Ik draag een tas op mijn rug.",
    "Ik zit met mijn rug tegen de muur."
  ],
  "put": [
    "In de tuin staat een put.",
    "De put is diep.",
    "Pas op voor de put."
  ],
  "lus": [
    "Maak een lus in het touw.",
    "De lus is stevig.",
    "In het touw zit een lus."
  ],
  "stuk": [
    "Ik krijg een stuk taart.",
    "Het stuk is groot.",
    "Een stuk brood."
  ],
  "duf": [
    "De lucht is duf.",
    "De kamer ruikt duf.",
    "Een duf gevoel."
  ],

  /* ============================================================
     LANGE KLANKEN
     ============================================================ */

  // ----- LK-AA (10 woorden — baard naar verlengingsregel) -----
  "haan": [
    "De haan kraait vroeg in de morgen.",
    "Op de boerderij loopt een grote haan.",
    "De haan heeft een rode kam."
  ],
  "maan": [
    "'s Avonds zie ik de maan aan de hemel.",
    "De maan schijnt op het water.",
    "Vannacht is de maan rond."
  ],
  "paard": [
    "Het paard galoppeert door de wei.",
    "Lien aait het paard op zijn neus.",
    "Het paard eet hooi uit de ruif."
  ],
  "taart": [
    "Mama bakt een taart voor mijn verjaardag.",
    "De taart staat op tafel.",
    "Ik krijg een groot stuk taart."
  ],
  "kaas": [
    "Op mijn boterham ligt kaas.",
    "De muis houdt van kaas.",
    "Papa snijdt een dikke plak kaas."
  ],
  "baan": [
    "De auto rijdt op de baan.",
    "Ik zwem in de eerste baan.",
    "De trein rijdt over zijn baan."
  ],
  "raam": [
    "Door het raam zie ik de tuin.",
    "Sam veegt het raam schoon.",
    "Open het raam, het is warm."
  ],
  "zaal": [
    "We turnen in de grote zaal.",
    "De zaal is vol kinderen.",
    "In de zaal staat een podium."
  ],
  "waar": [
    "Waar is mijn pen?",
    "Weet jij waar Sam is?",
    "Vertel mij waar je woont."
  ],
  "vlaag": [
    "Een vlaag wind blies door de tuin.",
    "De vlaag regen kwam plots.",
    "Een koude vlaag waaide voorbij."
  ],

  // ----- LK-EE (12 woorden — eend naar verlengingsregel, beer + veel toegevoegd) -----
  "been": [
    "Mijn been doet pijn na het lopen.",
    "Ik viel en bezeerde mijn been.",
    "De flamingo staat op één been."
  ],
  "zee": [
    "We gingen zwemmen in de zee.",
    "De zee is blauw en koel.",
    "Op het strand hoor ik de zee."
  ],
  "beek": [
    "Het water in de beek stroomt snel.",
    "Vissen zwemmen in de beek.",
    "We sprongen over de beek."
  ],
  "veer": [
    "Ik vond een veer van een vogel.",
    "De veer is wit en zacht.",
    "Op zijn hoed zit een veer."
  ],
  "meel": [
    "Mama strooit meel op de tafel.",
    "Voor pannenkoeken heb je meel nodig.",
    "De zak meel is leeg."
  ],
  "peer": [
    "Ik bijt in een sappige peer.",
    "De peer ligt in de schaal.",
    "Een peer smaakt zoet."
  ],
  "steen": [
    "Sam gooit een steen in het water.",
    "De steen is zwaar.",
    "Op de grond ligt een grote steen."
  ],
  "geel": [
    "De zon is geel.",
    "Mijn jas is geel.",
    "De bloemen in de tuin zijn geel van kleur."
  ],
  "twee": [
    "Ik heb twee handen.",
    "Op tafel liggen twee boeken.",
    "Lien telt tot twee."
  ],
  "week": [
    "Volgende week ga ik op reis.",
    "Een week heeft zeven dagen.",
    "Deze week leerden we de letter ee."
  ],
  "veel": [
    "In de doos zit veel snoep.",
    "Ik heb veel vrienden in de klas.",
    "Op het feest waren veel kinderen."
  ],
  "beer": [
    "De beer slaapt in een grot.",
    "In het bos woont een grote beer.",
    "Mijn knuffel is een bruine beer."
  ],

  // ----- LK-OO (14 woorden — rood/brood/woord naar verlengingsregel,
  //              droom + room toegevoegd) -----
  "boom": [
    "In onze tuin staat een grote boom.",
    "De vogel zit hoog in de boom.",
    "Sam klimt in de boom."
  ],
  "doos": [
    "In de doos zitten blokken.",
    "Mama draagt een zware doos.",
    "De doos staat op de kast."
  ],
  "boot": [
    "De boot vaart op het meer.",
    "We stappen in de witte boot.",
    "De boot ligt in de haven."
  ],
  "school": [
    "Ik ga elke dag naar school.",
    "Op school leren we lezen.",
    "De school begint om half negen."
  ],
  "oor": [
    "Mijn oor doet pijn.",
    "Het konijn heeft een lang oor.",
    "De juf fluistert in mijn oor."
  ],
  "voor": [
    "De auto staat voor de deur.",
    "Ik zit voor het raam.",
    "Voor de school is een speelplein."
  ],
  "groot": [
    "De olifant is heel groot.",
    "Mijn broer is groot en sterk.",
    "De boom in de tuin is heel groot."
  ],
  "oom": [
    "Mijn oom komt op bezoek.",
    "Oom Jan brengt een cadeau mee.",
    "De oom van Sam is grappig."
  ],
  "kroon": [
    "De koning draagt een gouden kroon.",
    "Op de kroon glinsteren juwelen.",
    "Lien tekent een mooie kroon."
  ],
  "hoog": [
    "De vogel vliegt hoog in de lucht.",
    "De berg is heel hoog.",
    "Het vliegtuig vliegt hoog boven de wolken."
  ],
  "droog": [
    "Het wasgoed is droog.",
    "De handdoek is nog niet droog.",
    "Buiten is het droog weer."
  ],
  "soort": [
    "Welke soort hond heb jij?",
    "In de winkel ligt elke soort fruit.",
    "Dit is een nieuwe soort koek."
  ],
  "droom": [
    "Ik had een mooie droom vannacht.",
    "In mijn droom kon ik vliegen.",
    "Wat een vreemde droom!"
  ],
  "room": [
    "Op de taart ligt witte room.",
    "Mama klopt de room stijf.",
    "In mijn koffie doe ik room."
  ],

  // ----- LK-UU (7 woorden) -----
  "muur": [
    "Aan de muur hangt een schilderij.",
    "De muur is wit geverfd.",
    "Sam leunt tegen de muur."
  ],
  "vuur": [
    "Het vuur in de open haard knettert.",
    "Pas op voor het vuur!",
    "Op het kamp maken we een vuur."
  ],
  "duur": [
    "Dit speelgoed is heel duur.",
    "De auto is te duur voor papa.",
    "Mijn nieuwe jas was duur."
  ],
  "stuur": [
    "Papa houdt het stuur stevig vast.",
    "Het stuur van de fiets is krom.",
    "Met het stuur draai je de auto."
  ],
  "buur": [
    "Mijn buur heeft een grote hond.",
    "De buur van oma is heel lief.",
    "Ik speel vaak bij de buur."
  ],
  "zuur": [
    "De citroen smaakt zuur.",
    "Bah, dit snoep is zuur!",
    "De appel is heel zuur."
  ],
  "uur": [
    "Over een uur eten we.",
    "Ik wachtte een heel uur op de bus.",
    "Een uur heeft zestig minuten."
  ],

  /* ============================================================
     TWEEKLANKEN
     ============================================================ */

  // ----- TW-IE (15 woorden) -----
  "riet": [
    "Aan de vijver groeit hoog riet.",
    "De eend zit verstopt in het riet.",
    "Het riet wuift in de wind."
  ],
  "biet": [
    "Een biet is rood vanbinnen.",
    "Mama maakt soep van een biet.",
    "Op het veld groeit een grote biet."
  ],
  "wiel": [
    "Het wiel van mijn fiets is plat.",
    "Onder de auto zit een groot wiel.",
    "Het wiel draait rond."
  ],
  "fiets": [
    "Ik rij met mijn fiets naar school.",
    "Mijn fiets is rood en wit.",
    "De fiets staat in de garage."
  ],
  "knie": [
    "Ik viel en bezeerde mijn knie.",
    "Op mijn knie zit een pleister.",
    "De knie van Sam doet pijn."
  ],
  "dier": [
    "Het dier in het bos is een vos.",
    "In de dierentuin zag ik een vreemd dier.",
    "Welk dier woont in dit hok?"
  ],
  "vier": [
    "Ik heb vier knikkers in mijn zak.",
    "Lien telt tot vier.",
    "Op tafel liggen vier appels."
  ],
  "hier": [
    "Kom maar hier zitten.",
    "Hier woon ik.",
    "Leg je tas hier neer."
  ],
  "mier": [
    "Op de grond loopt een kleine mier.",
    "De mier draagt een blad.",
    "Een mier is sterk."
  ],
  "pier": [
    "Een pier kruipt door de aarde.",
    "De vogel pikt een pier op.",
    "In de tuin vind ik een pier."
  ],
  "lied": [
    "De juf zingt een lied.",
    "Ken jij dit lied?",
    "We zingen samen een lied."
  ],
  "niet": [
    "Ik wil niet naar bed.",
    "De hond is niet braaf.",
    "Sam komt vandaag niet naar school."
  ],
  "zien": [
    "Ik kan de maan goed zien.",
    "Kom eens kijken, je moet dit zien!",
    "Door de bril kan opa beter zien."
  ],
  "kies": [
    "Mijn kies doet pijn.",
    "De tandarts trekt een kies.",
    "Achter in mijn mond zit een grote kies."
  ],
  "wie": [
    "Wie is er aan de deur?",
    "Wie heeft mijn pen gepakt?",
    "Vertel mij wie dat gezegd heeft."
  ],

  // ----- TW-EI (18 woorden) -----
  "ei": [
    "De kip legt elke dag een ei.",
    "In de pan bakt een ei.",
    "Met Pasen kleurt papa een ei."
  ],
  "trein": [
    "De trein stopt aan het station.",
    "Wij reizen met de trein naar oma.",
    "De trein rijdt heel snel."
  ],
  "plein": [
    "Op het plein spelen veel kinderen.",
    "Het plein voor de school is groot.",
    "Lien fietst rondjes op het plein."
  ],
  "klein": [
    "Mijn zusje is nog klein.",
    "De muis is een klein dier.",
    "In mijn hand past een klein steentje."
  ],
  "lei": [
    "Vroeger schreven kinderen op een lei.",
    "Op de lei kan je vegen en opnieuw schrijven.",
    "De lei is zwart en hard."
  ],
  "geit": [
    "De geit eet gras op het veld.",
    "Op de boerderij staat een witte geit.",
    "De geit heeft kleine horens."
  ],
  "sein": [
    "De vuurtoren geeft een sein.",
    "De wachter geeft een sein met zijn lamp.",
    "Het sein voor de trein staat op rood."
  ],
  "eik": [
    "De eik is een hoge boom.",
    "Onder de eik vinden we eikels.",
    "In het bos staat een dikke eik."
  ],
  "peil": [
    "Het water staat op een hoog peil.",
    "Het peil van de rivier zakt in de zomer.",
    "Op de meter staat het peil aangeduid."
  ],
  "dweil": [
    "Mama veegt de vloer met een dweil.",
    "De dweil is nat van het water.",
    "Hang de dweil te drogen."
  ],
  "brein": [
    "Je brein zit in je hoofd.",
    "Met je brein kan je denken.",
    "Het brein van een mens is heel slim."
  ],
  "wei": [
    "In de wei staan koeien.",
    "Het paard graast in de wei.",
    "De wei is groen en breed."
  ],
  "mei": [
    "In mei bloeien de bloemen.",
    "De maand mei is meestal warm.",
    "Mijn verjaardag valt in mei."
  ],
  "prei": [
    "In de soep zit prei.",
    "Mama snijdt een lange prei.",
    "Prei is een groene groente."
  ],
  "reis": [
    "We maken een lange reis met de auto.",
    "De reis naar oma duurt een uur.",
    "Volgende week begint onze reis."
  ],
  "eiland": [
    "Op het eiland staan palmbomen.",
    "Een eiland ligt in de zee.",
    "We varen met de boot naar het eiland."
  ],
  "leiding": [
    "De juf neemt de leiding in de klas.",
    "De leiding van de kraan is gebroken.",
    "Sam heeft de leiding tijdens het spel."
  ],
  "keizer": [
    "De keizer woont in een groot paleis.",
    "De keizer draagt een rode mantel.",
    "In China was er vroeger een keizer."
  ],

  // ----- TW-IJ (15 woorden) -----
  "bij": [
    "De bij vliegt naar de bloem.",
    "Een bij maakt honing.",
    "Pas op, de bij steekt!"
  ],
  "tijd": [
    "Ik heb geen tijd om te spelen.",
    "Het is bijna tijd om naar bed te gaan.",
    "Hoeveel tijd hebben we nog?"
  ],
  "lijn": [
    "Trek een rechte lijn op je blad.",
    "Op de lijn schrijf ik mijn naam.",
    "De lijn op het plein is wit."
  ],
  "vijf": [
    "Ik heb vijf vingers aan mijn hand.",
    "Op tafel liggen vijf koeken.",
    "Lien telt tot vijf."
  ],
  "ijs": [
    "In de zomer eet ik graag ijs.",
    "Op de vijver ligt ijs.",
    "Mijn ijs is gevallen!"
  ],
  "wijs": [
    "Opa is een wijs man.",
    "De juf is heel wijs.",
    "Een wijs woord van papa."
  ],
  "rijst": [
    "Bij het vlees eten we rijst.",
    "In de pan kookt rijst.",
    "Mama haalt rijst uit de kast."
  ],
  "lijst": [
    "Op de lijst staan tien namen.",
    "De juf maakt een lijst van de klas.",
    "Schrijf de boodschappen op een lijst."
  ],
  "pijl": [
    "De jager schiet met een pijl.",
    "Op het bord staat een pijl naar links.",
    "De pijl wijst de weg."
  ],
  "mijn": [
    "Dat is mijn boek.",
    "Mijn jas hangt aan de kapstok.",
    "Geef mij mijn pen terug."
  ],
  "zijn": [
    "Sam is bij zijn oma.",
    "De hond zoekt zijn baas.",
    "Het kind heeft zijn tas vergeten."
  ],
  "hij": [
    "Hij speelt met de bal.",
    "Daar gaat hij!",
    "Hij heet Tom."
  ],
  "zij": [
    "Zij komt morgen op bezoek.",
    "Zij draagt een rode jas.",
    "Daar staat zij te wachten."
  ],
  "wij": [
    "Wij gaan samen naar het park.",
    "Wij eten pannenkoeken.",
    "Morgen gaan wij zwemmen."
  ],
  "blij": [
    "Ik ben blij met mijn cadeau.",
    "De hond is blij als hij wandelen mag.",
    "Mama is blij dat ik thuis ben."
  ],

  // ----- TW-OU (12 woorden — kabouter toegevoegd vanaf au) -----
  "hout": [
    "De tafel is gemaakt van hout.",
    "In de open haard brandt hout.",
    "Papa zaagt een stuk hout."
  ],
  "koud": [
    "Het is koud buiten.",
    "Mijn handen zijn koud.",
    "In de winter is het water koud."
  ],
  "oud": [
    "Mijn opa is heel oud.",
    "Dit boek is al oud.",
    "Hoe oud ben jij?"
  ],
  "fout": [
    "Ik maakte een fout in mijn dictee.",
    "Een fout op je toets is niet erg.",
    "Sam zoekt zijn fout op."
  ],
  "zout": [
    "In de soep doet mama zout.",
    "Het zout staat op tafel.",
    "Doe niet te veel zout op je ei."
  ],
  "mouw": [
    "De mouw van mijn jas is te lang.",
    "Op mijn mouw zit een vlek.",
    "Stroop je mouw maar op."
  ],
  "vrouw": [
    "Die vrouw is mijn mama.",
    "De vrouw aan de kassa is vriendelijk.",
    "Naast papa zit een vrouw."
  ],
  "hou": [
    "Ik hou veel van mijn mama.",
    "Hou jij van chocolade?",
    "Hou mijn hand even vast."
  ],
  "schouder": [
    "Op mijn schouder zit een vlieg.",
    "Papa draagt mij op zijn schouder.",
    "De tas hangt over mijn schouder."
  ],
  "goud": [
    "De ring is van goud.",
    "In de schat ligt veel goud.",
    "Het kroontje glimt als goud."
  ],
  "jouw": [
    "Is dit jouw boek?",
    "Jouw jas hangt daar.",
    "Geef mij jouw hand."
  ],
  "kabouter": [
    "In het bos woont een kabouter.",
    "De kabouter draagt een rode muts.",
    "Een kabouter is heel klein."
  ],

  // ----- TW-AU (10 woorden — kabouter verhuisd naar ou) -----
  "pauw": [
    "De pauw heeft mooie veren.",
    "In de dierentuin zag ik een pauw.",
    "De pauw spreidt zijn staart open."
  ],
  "saus": [
    "Bij de friet eet ik saus.",
    "Mama maakt saus voor de pasta.",
    "Op het bord ligt rode saus."
  ],
  "gauw": [
    "Kom gauw, we moeten weg!",
    "Sam komt gauw thuis.",
    "Tot gauw, oma!"
  ],
  "blauw": [
    "De lucht is blauw.",
    "Mijn jas is blauw.",
    "De zee is heel blauw."
  ],
  "dauw": [
    "'s Morgens ligt er dauw op het gras.",
    "De dauw glinstert in de zon.",
    "Mijn schoenen zijn nat van de dauw."
  ],
  "flauw": [
    "Die grap is heel flauw.",
    "De soep smaakt flauw.",
    "Wat een flauw boek!"
  ],
  "lauw": [
    "Het water is lauw.",
    "De thee is al lauw geworden.",
    "Lauw water is niet warm en niet koud."
  ],
  "nauw": [
    "De gang is heel nauw.",
    "Het straatje is heel nauw.",
    "De broek zit nauw om mijn benen."
  ],
  "rauw": [
    "Vlees mag je niet rauw eten.",
    "Vis kan je rauw eten.",
    "De groente is nog rauw."
  ],
  "miauw": [
    "De kat zegt miauw.",
    "Ik hoor miauw uit de tuin.",
    "Miauw, miauw, doet de poes."
  ],

  // ----- TW-EU (10 woorden) -----
  "neus": [
    "Mijn neus loopt als ik verkouden ben.",
    "De clown heeft een rode neus.",
    "Ik snuit mijn neus in een papieren zakdoek."
  ],
  "deur": [
    "Doe de deur eens dicht.",
    "Voor de deur staat papa.",
    "De deur van de klas is open."
  ],
  "reus": [
    "In het sprookje woont een grote reus.",
    "De reus heeft enorme voeten.",
    "Mijn broer is bijna een reus geworden."
  ],
  "kleur": [
    "Welke kleur heeft jouw fiets?",
    "Welke kleur kies jij?",
    "Lien kiest een mooie kleur voor haar tekening."
  ],
  "geur": [
    "In de bakkerij hangt een lekkere geur.",
    "De bloemen verspreiden een fijne geur.",
    "De geur van koffie maakt papa wakker."
  ],
  "leuk": [
    "Het feestje was heel leuk.",
    "Ik vind tekenen leuk.",
    "Wat een leuk verhaal!"
  ],
  "peuter": [
    "Mijn zusje is nog een peuter.",
    "De peuter speelt met blokken.",
    "Een peuter kan al een beetje praten."
  ],
  "beurt": [
    "Wacht op je beurt.",
    "Het is jouw beurt om te kiezen.",
    "Sam krijgt straks een beurt aan het bord."
  ],
  "sleutel": [
    "Mama zoekt de sleutel van de auto.",
    "De sleutel past op het slot.",
    "Ik heb een eigen sleutel van de deur."
  ],
  "keuken": [
    "In de keuken bakt papa pannenkoeken.",
    "De keuken ruikt naar koek.",
    "Mama staat in de keuken."
  ],

  // ----- TW-UI (12 woorden) -----
  "huis": [
    "Wij wonen in een groot huis.",
    "Voor het huis staat een boom.",
    "Ik ren naar huis na school."
  ],
  "muis": [
    "Onder de kast loopt een muis.",
    "De muis eet een stukje kaas.",
    "De kat jaagt op de muis."
  ],
  "tuin": [
    "In de tuin bloeien bloemen.",
    "Sam speelt in de tuin.",
    "Achter ons huis ligt een grote tuin."
  ],
  "duin": [
    "Op het duin groeit gras.",
    "We klimmen op het hoge duin.",
    "Vanaf het duin zie je de zee."
  ],
  "kruis": [
    "Op de kerk staat een kruis.",
    "Lien tekent een klein kruis op haar blad.",
    "Het kruis hangt aan een ketting."
  ],
  "fluit": [
    "Ik speel op mijn fluit.",
    "De fluit klinkt mooi.",
    "Papa kocht een nieuwe fluit."
  ],
  "buit": [
    "De rover stopt zijn buit in een zak.",
    "De buit van de piraat is veel goud.",
    "De vos sleept zijn buit naar het hol."
  ],
  "ruit": [
    "De ruit van het raam is gebroken.",
    "Op de ruit zit een vlek.",
    "Door de ruit zie ik de tuin."
  ],
  "bruin": [
    "Mijn haar is bruin.",
    "De koe is wit en bruin.",
    "In de zomer wordt mijn huid bruin."
  ],
  "luier": [
    "De baby krijgt een schone luier.",
    "Mama doet de luier in de vuilbak.",
    "De luier is nat."
  ],
  "snuit": [
    "De hond likt zijn snuit.",
    "Op de snuit van het varken zit modder.",
    "Het konijn beweegt zijn snuit."
  ],
  "lui": [
    "Sam is vandaag een beetje lui.",
    "De kat ligt lui in de zon.",
    "Wees niet zo lui!"
  ],

  // ----- TW-OE (14 woorden — hoed naar verlengingsregel,
  //              groen + moe toegevoegd) -----
  "boek": [
    "Ik lees graag een boek.",
    "Op tafel ligt een dik boek.",
    "Het boek gaat over een hond."
  ],
  "koek": [
    "Bij de koffie eet papa een koek.",
    "In de trommel ligt nog maar één koek.",
    "Mag ik nog een koek?"
  ],
  "voet": [
    "Mijn voet doet pijn.",
    "Sam stoot zijn voet tegen de tafel.",
    "Op mijn voet zit een blaar."
  ],
  "bloem": [
    "In de tuin bloeit een gele bloem.",
    "Mama zet de bloem in een vaas.",
    "Lien plukt een mooie bloem."
  ],
  "stoel": [
    "Ik zit op een houten stoel.",
    "De stoel staat aan de tafel.",
    "Op de stoel ligt mijn jas."
  ],
  "broek": [
    "Mijn broek is te kort.",
    "Sam draagt een blauwe broek.",
    "In mijn broek zit een gat."
  ],
  "schoen": [
    "Mijn schoen zit los.",
    "In mijn schoen zit een steentje.",
    "Papa poetst zijn schoen."
  ],
  "moeder": [
    "Mijn moeder bakt een taart.",
    "De moeder van Sam is lerares.",
    "De moeder helpt de baby."
  ],
  "broeder": [
    "Mijn broeder heet Tom.",
    "Lien speelt met haar broeder.",
    "De broeder van papa is dokter."
  ],
  "snoep": [
    "In de zak zit veel snoep.",
    "Mama geeft mij een stukje snoep.",
    "Snoep is niet goed voor je tanden."
  ],
  "doek": [
    "Mama veegt de tafel met een doek.",
    "De doek is nat.",
    "Ik draag mijn pop in een doek."
  ],
  "vloer": [
    "Op de vloer ligt een tapijt.",
    "De vloer van de keuken is koud.",
    "Papa veegt de vloer."
  ],
  "groen": [
    "Het gras is groen.",
    "Mijn jas is groen.",
    "Het blad aan de boom is groen."
  ],
  "moe": [
    "Na het lopen ben ik moe.",
    "De baby is moe en gaat slapen.",
    "Sam is te moe om te spelen."
  ],

  /* ============================================================
     DRIEKLANKEN
     ============================================================ */

  // ----- TW-AAI (10 woorden) -----
  "haai": [
    "De haai zwemt door de zee.",
    "Ik zag een grote haai in de film.",
    "De haai heeft scherpe tanden."
  ],
  "kraai": [
    "Op het dak zit een zwarte kraai.",
    "De kraai roept luid.",
    "Een kraai vliegt over het veld."
  ],
  "lawaai": [
    "De vrachtwagen maakt veel lawaai.",
    "Door het lawaai kan ik niet slapen.",
    "Wat een lawaai in de klas!"
  ],
  "saai": [
    "Dit boek is heel saai.",
    "De film vind ik saai.",
    "Een saai liedje hoor ik niet graag."
  ],
  "zwaai": [
    "Geef oma een zwaai met je hand.",
    "Met een grote zwaai gooi ik de bal.",
    "Ik zwaai naar mama en papa."
  ],
  "taai": [
    "Het vlees is taai.",
    "De spaghetti is nog niet taai.",
    "Een taai stukje brood."
  ],
  "draai": [
    "Geef het wiel een draai.",
    "Maak een draai met je fiets.",
    "De draai is te scherp."
  ],
  "fraai": [
    "Wat een fraai huis!",
    "De prinses draagt een fraai kleed.",
    "Een fraai schilderij hangt aan de muur."
  ],
  "baai": [
    "De boot ligt in de baai.",
    "In de baai zwemmen vissen.",
    "Vanaf de baai zie ik het strand."
  ],
  "maaien": [
    "Papa gaat het gras maaien.",
    "Ik help papa met het gras te maaien.",
    "Vandaag mag ik niet maaien, het regent."
  ],

  // ----- TW-OOI (6 woorden) -----
  "mooi": [
    "Wat een mooi kleed!",
    "De zonsondergang is mooi.",
    "Lien tekent een mooi huis."
  ],
  "kooi": [
    "De vogel zit in de kooi.",
    "In de dierentuin staat een grote kooi.",
    "De kooi van mijn cavia is rond."
  ],
  "hooi": [
    "Het paard eet hooi.",
    "In de schuur ligt veel hooi.",
    "De boer maakt een baal hooi."
  ],
  "gooi": [
    "Gooi de bal naar mij!",
    "Gooi het papier in de bak.",
    "Met een grote gooi raak ik de doos."
  ],
  "dooi": [
    "Na de winter komt de dooi.",
    "Bij dooi smelt de sneeuw.",
    "De dooi is begonnen."
  ],
  "vlooien": [
    "De hond heeft vlooien.",
    "Vlooien springen heel ver.",
    "Pas op voor de vlooien op de kat!"
  ],

  // ----- TW-OEI (12 woorden, met verbuigingen) -----
  "bloei": [
    "De bloemen staan in volle bloei.",
    "In de lente komt alles in bloei.",
    "De boom in onze tuin staat in bloei."
  ],
  "bloeit": [
    "De roos bloeit in de tuin.",
    "Mijn plant bloeit elk jaar.",
    "In mei bloeit alles fel."
  ],
  "groei": [
    "Mama meet mijn groei elk jaar.",
    "De groei van de plant gaat snel.",
    "Met goede zorg krijg je flinke groei."
  ],
  "groeit": [
    "De boom groeit elk jaar hoger.",
    "Mijn haar groeit snel.",
    "In de tuin groeit een tomaat."
  ],
  "groeien": [
    "De plantjes groeien snel in de zon.",
    "Mijn nagels groeien hard.",
    "Hier groeien veel bloemen."
  ],
  "boei": [
    "In de zee drijft een rode boei.",
    "De boot is vastgemaakt aan de boei.",
    "Pas op voor de boei in het water!"
  ],
  "snoei": [
    "Geef de struik een snoei.",
    "Na de snoei groeit de plant beter.",
    "De boom kreeg een grondige snoei."
  ],
  "snoeit": [
    "Papa snoeit de heg.",
    "Opa snoeit zijn rozen.",
    "De tuinman snoeit de boom."
  ],
  "roei": [
    "Ik roei met de peddel over het meer.",
    "Roei je mee in de boot?",
    "Met de riemen roei ik vooruit."
  ],
  "roeit": [
    "De man roeit naar de overkant.",
    "Mama roeit goed.",
    "Sam roeit met de peddel."
  ],
  "roeien": [
    "Papa kan goed roeien op de zee.",
    "We gaan samen roeien op het meer.",
    "Roeien is een mooie sport."
  ],
  "koeien": [
    "In de wei staan veel koeien.",
    "De koeien geven melk.",
    "De boer voert de koeien."
  ],

  // ----- TW-EEUW (9 woorden, met verbuigingen) -----
  "leeuw": [
    "De leeuw brult luid in de dierentuin.",
    "Een leeuw heeft manen.",
    "De leeuw woont in Afrika."
  ],
  "sneeuw": [
    "In de winter ligt er sneeuw.",
    "Met de sneeuw bouwen we een sneeuwpop.",
    "De sneeuw is wit en koud."
  ],
  "eeuw": [
    "Een eeuw is honderd jaar.",
    "In de vorige eeuw was er nog geen tv.",
    "Mijn opa is bijna een eeuw oud."
  ],
  "meeuw": [
    "De meeuw vliegt boven de zee.",
    "Een meeuw stal mijn boterham!",
    "De meeuw roept luid op het strand."
  ],
  "spreeuw": [
    "Op de tak zit een spreeuw.",
    "De spreeuw zingt mooi.",
    "Een spreeuw heeft glanzende veren."
  ],
  "schreeuw": [
    "Geef geen schreeuw in de klas.",
    "Plots hoorde ik een luide schreeuw.",
    "De schreeuw kwam uit de tuin."
  ],
  "geeuw": [
    "Met een grote geeuw word ik wakker.",
    "Wat een diepe geeuw!",
    "Een geeuw besmet de hele klas."
  ],
  "geeuwen": [
    "Als ik moe ben, moet ik geeuwen.",
    "We zitten allemaal te geeuwen.",
    "Probeer niet te geeuwen tijdens de les."
  ],
  "eeuwig": [
    "Onze vakantie duurt niet eeuwig.",
    "Wachten lijkt soms eeuwig lang.",
    "Een diamant is eeuwig."
  ],

  // ----- TW-IEUW (4 woorden) -----
  "nieuw": [
    "Mijn fiets is nieuw.",
    "We hebben een nieuw boek in de klas.",
    "Lien draagt een nieuw kleed."
  ],
  "opnieuw": [
    "Lees de zin nog eens opnieuw.",
    "Probeer het opnieuw, je kan het!",
    "Mama wast de vaat opnieuw."
  ],
  "kieuw": [
    "Een vis ademt door zijn kieuw.",
    "De kieuw zit aan de zijkant van de vis.",
    "Door de kieuw haalt de vis lucht uit het water."
  ],
  "benieuwd": [
    "Ik ben benieuwd naar het cadeau.",
    "Mama is benieuwd naar mijn rapport.",
    "Sam is heel benieuwd hoe het verhaal eindigt."
  ],

  /* ============================================================
     NG / NK
     ============================================================ */

  // ----- NG-WOORDEN (12 woorden) -----
  "ring": [
    "Mama draagt een mooie ring.",
    "Papa geeft mama een ring.",
    "De ring past niet om mijn vinger."
  ],
  "slang": [
    "In de tuin ligt een slang.",
    "De slang sist in het gras.",
    "Pas op voor de slang!"
  ],
  "long": [
    "Mijn long doet pijn als ik hoest.",
    "Een long zit in je borstkas.",
    "Met je long adem je lucht in."
  ],
  "tong": [
    "Lien steekt haar tong uit.",
    "Met je tong proef je het eten.",
    "Mijn tong is rood."
  ],
  "wang": [
    "Oma kust mijn wang.",
    "Op mijn wang zit een vlek.",
    "Door de kou is mijn wang rood."
  ],
  "jong": [
    "De pup is nog jong.",
    "Mijn broertje is jong.",
    "Een jong katje speelt met de bal."
  ],
  "zang": [
    "De zang van de vogel is mooi.",
    "Op school doen we zang en dans.",
    "Mama houdt van zang."
  ],
  "lang": [
    "Het touw is heel lang.",
    "Ik wacht al lang op de bus.",
    "Mijn haar is lang."
  ],
  "bang": [
    "De hond is bang voor het onweer.",
    "Wees niet bang in het donker.",
    "Sam is bang van spinnen."
  ],
  "ding": [
    "Wat is dat voor een ding?",
    "Op tafel ligt een vreemd ding.",
    "Geef mij dat ding eens."
  ],
  "koning": [
    "De koning woont in een paleis.",
    "De koning draagt een kroon.",
    "In het sprookje is er een koning."
  ],
  "paling": [
    "Een paling zwemt in de rivier.",
    "De paling lijkt op een slang.",
    "Papa eet graag gerookte paling."
  ],

  // ----- NK-WOORDEN (11 woorden) -----
  "bank": [
    "Op de bank zit oma te lezen.",
    "We zetten de bank in de tuin.",
    "De bank is rood en zacht."
  ],
  "tank": [
    "De tank rijdt door het zand.",
    "In de oorlog reed er een tank.",
    "Op het plaatje staat een grote tank."
  ],
  "plank": [
    "Op de plank ligt een boek.",
    "De plank is van hout.",
    "Aan de muur hangt een lange plank."
  ],
  "pink": [
    "Mijn pink doet pijn.",
    "Op mijn pink draag ik een ring.",
    "De pink is mijn kleinste vinger."
  ],
  "klank": [
    "Welke klank hoor je in dit woord?",
    "De klank van de bel is luid.",
    "Een mooie klank uit de piano."
  ],
  "drank": [
    "In het glas zit lekkere drank.",
    "Mama maakt warme drank.",
    "Wil je een koude drank?"
  ],
  "dank": [
    "Veel dank voor het cadeau!",
    "Met dank aan iedereen.",
    "Een woordje van dank is genoeg."
  ],
  "denk": [
    "Ik denk aan oma.",
    "Denk goed na voor je antwoordt.",
    "Sam, denk eens mee!"
  ],
  "dronk": [
    "Papa dronk een glas water.",
    "De kat dronk uit de kom.",
    "Lien dronk haar melk op."
  ],
  "stank": [
    "In de keuken hangt een vieze stank.",
    "Door de stank ren ik weg.",
    "De stank van bedorven eten is erg."
  ],

  /* ============================================================
     MEERVOUDEN (verdubbelaars + verenkelaars + meervoud-en)
     Bevat de meervoudsvormen die in graad1.js voorkomen onder de
     categorieën verdubbelaars, verenkelaars, meervoud-en,
     meervoud-verdubbel en meervoud-verenkel.
     De enkelvouden (kat, boom, etc.) staan al elders in deze bib.
     ============================================================ */

  "ballen": [
    "In de zak zitten veel ballen.",
    "Sam gooit drie ballen in de mand.",
    "De ballen rollen over de speelplaats."
  ],
  "bellen": [
    "Op de fietsen zitten luide bellen.",
    "De bellen rinkelen om 8 uur.",
    "Lien hoort de bellen van de kerk."
  ],
  "bommen": [
    "In de oorlog vielen er bommen.",
    "De bommen ontploften met een knal.",
    "Op het scherm zie ik bommen vallen."
  ],
  "dassen": [
    "Papa heeft drie dassen in de kast.",
    "Mannen dragen vaak dassen.",
    "Mijn dassen zijn van zijde."
  ],
  "kassen": [
    "In de tuin staan twee grote kassen.",
    "De kassen zijn vol planten.",
    "In de kassen groeien tomaten."
  ],
  "katten": [
    "Er lopen twee katten in de tuin.",
    "Mijn oma heeft drie katten.",
    "De katten spelen met een bal."
  ],
  "kippen": [
    "Op de boerderij lopen veel kippen.",
    "De kippen leggen elke dag eieren.",
    "Twee kippen pikken graan."
  ],
  "koppen": [
    "Op tafel staan vijf koppen koffie.",
    "De koppen zijn van porselein.",
    "Mama vult de koppen met thee."
  ],
  "muggen": [
    "In de zomer zijn er veel muggen.",
    "De muggen steken mij overal.",
    "Bij het water vliegen muggen rond."
  ],
  "mussen": [
    "In de boom zitten kleine mussen.",
    "De mussen pikken zaadjes.",
    "Een groep mussen vliegt weg."
  ],

  "pannen": [
    "In de keuken hangen veel pannen.",
    "Mama wast de pannen af.",
    "De pannen staan op het vuur."
  ],
  "pennen": [
    "In mijn pennenzak zitten vijf pennen.",
    "De pennen zijn allemaal blauw.",
    "Lien deelt de pennen uit in de klas."
  ],
  "petten": [
    "De jongens dragen rode petten.",
    "Op het rek hangen drie petten.",
    "Onze petten zijn van de school."
  ],
  "ratten": [
    "In de schuur lopen ratten.",
    "De ratten verstoppen zich onder de planken.",
    "Pas op voor de ratten in de oude kelder!"
  ],
  "rokken": [
    "In de winkel hangen veel rokken.",
    "De rokken zijn lang of kort.",
    "Lien heeft drie rokken in haar kast."
  ],
  "stippen": [
    "Op de jurk staan rode stippen.",
    "De pen maakt kleine stippen.",
    "Tel de stippen op het lieveheersbeestje."
  ],
  "vossen": [
    "In het bos lopen twee vossen.",
    "De vossen sluipen langs de weg.",
    "Vossen jagen op kleine dieren."
  ],
  "bakken": [
    "In de keuken staan vier bakken.",
    "De bakken zijn vol speelgoed.",
    "Mama vult de bakken met water."
  ],
  "bussen": [
    "Voor de school stoppen drie bussen.",
    "De bussen brengen kinderen naar huis.",
    "In de stad rijden veel bussen."
  ],
  "lappen": [
    "Mama wast de lappen schoon.",
    "De lappen zijn nat van het water.",
    "Met de lappen veeg ik de tafel."
  ],

  "latten": [
    "Op de vloer liggen lange latten.",
    "De latten zijn van hout.",
    "Met de latten meten we de tafel."
  ],
  "zakken": [
    "In de winkel liggen veel zakken.",
    "De zakken zitten vol snoep.",
    "Papa draagt de zakken naar de auto."
  ],
  "takken": [
    "Onder de boom liggen takken.",
    "De takken zijn dik en dun.",
    "Met de takken maken we een hut."
  ],
  "matten": [
    "In de turnzaal liggen blauwe matten.",
    "De matten zijn zacht.",
    "We springen op de matten."
  ],
  "bomen": [
    "In het bos staan hoge bomen.",
    "De bomen verliezen hun bladeren.",
    "Vogels zitten in de bomen."
  ],
  "boten": [
    "In de haven liggen veel boten.",
    "De boten varen op zee.",
    "Twee boten komen aan de kade."
  ],
  "kazen": [
    "In de winkel liggen vele kazen.",
    "De kazen komen uit Holland.",
    "Op het bord liggen drie soorten kazen."
  ],
  "namen": [
    "Op de lijst staan alle namen.",
    "De namen zijn van de kinderen.",
    "Lees de namen voor."
  ],
  "manen": [
    "De leeuw heeft mooie manen.",
    "Wij zien de manen van het paard wapperen.",
    "De manen zijn lang en goudkleurig."
  ],
  "vazen": [
    "Op de tafel staan twee vazen.",
    "In de vazen staan bloemen.",
    "Mama heeft mooie vazen in de kast."
  ],

  "muren": [
    "De muren in de klas zijn wit.",
    "Aan de muren hangen tekeningen.",
    "We schilderen de muren blauw."
  ],
  "buren": [
    "Onze buren wonen naast ons.",
    "De buren hebben een grote tuin.",
    "Mama gaat op visite bij de buren."
  ],
  "uren": [
    "Een dag heeft vierentwintig uren.",
    "We wachten al uren op de bus.",
    "De uren vliegen voorbij in het pretpark."
  ],
  "haren": [
    "Mijn haren zijn lang.",
    "Lien borstelt haar haren elke morgen.",
    "De haren van de hond liggen overal."
  ],
  "palen": [
    "Langs de weg staan palen.",
    "De palen zijn van hout.",
    "Tussen de palen hangt een touw."
  ],
  "zalen": [
    "In het sportcomplex zijn veel zalen.",
    "De zalen zijn groot en licht.",
    "We turnen in twee zalen."
  ],
  "dieren": [
    "In de dierentuin wonen veel dieren.",
    "De dieren krijgen elke dag eten.",
    "Welke dieren zijn jouw favoriet?"
  ],
  "hanen": [
    "Op de boerderij kraaien drie hanen.",
    "De hanen wekken iedereen.",
    "Twee hanen vechten om voer."
  ],
  "dieven": [
    "De dieven stelen geld.",
    "De politie zoekt de dieven.",
    "In het verhaal sluipen drie dieven binnen."
  ],
  "kranen": [
    "In de keuken zijn twee kranen.",
    "De kranen lekken water.",
    "Bij de bouw staan grote kranen."
  ],

  "boeren": [
    "Op het platteland werken boeren.",
    "De boeren staan vroeg op.",
    "Twee boeren komen met hun tractor."
  ],
  "deuren": [
    "In ons huis zijn vijf deuren.",
    "De deuren staan open.",
    "Op school sluiten we de deuren."
  ],
  "leeuwen": [
    "In de dierentuin wonen leeuwen.",
    "De leeuwen brullen luid.",
    "Twee leeuwen liggen in de zon."
  ],
  "honden": [
    "In het park lopen veel honden.",
    "De honden blaffen luid.",
    "Mijn buren hebben drie honden."
  ],
  "huizen": [
    "In onze straat staan grote huizen.",
    "De huizen zijn van baksteen.",
    "Aan de overkant staan vijf huizen."
  ],
  "schapen": [
    "Op de wei lopen veel schapen.",
    "De schapen geven wol.",
    "Twee schapen liggen in het gras."
  ],
  "stoelen": [
    "In de klas staan twintig stoelen.",
    "De stoelen zijn rood.",
    "Zet de stoelen op de tafel."
  ],

  "boeken": [
    "In de kast staan veel boeken.",
    "De boeken liggen op tafel.",
    "Op zondag lees ik graag boeken."
  ],
  "garen": [
    "In het naaidoosje liggen klosjes garen.",
    "Mama naait met sterk garen.",
    "De kat speelt met het garen."
  ],
  "muizen": [
    "In de schuur lopen kleine muizen.",
    "De kat jaagt op muizen.",
    "Twee muizen verstoppen zich onder de kast."
  ],
  "neuzen": [
    "Bij vrieskou worden onze neuzen rood.",
    "Snuit jullie neuzen goed!",
    "De neuzen van de clowns zijn groot en rond."
  ],
  "ramen": [
    "In ons huis zijn grote ramen.",
    "De ramen geven veel licht.",
    "Mama wast de ramen schoon."
  ],
  "schoenen": [
    "In de gang staan vijf paar schoenen.",
    "Mijn schoenen zijn nat van de regen.",
    "Trek je schoenen uit voor je binnen komt."
  ],
  "treinen": [
    "In het station stoppen veel treinen.",
    "De treinen rijden snel.",
    "Drie treinen vertrekken tegelijk."
  ],
  "tuinen": [
    "In onze straat zijn mooie tuinen.",
    "De tuinen staan vol bloemen.",
    "Achter de huizen liggen grote tuinen."
  ],
  "veren": [
    "Op de grond liggen kleine veren.",
    "De vogel verliest zijn veren.",
    "Lien verzamelt mooie veren."
  ],
  "voeten": [
    "Mijn voeten doen pijn na het wandelen.",
    "Was je voeten goed.",
    "We staan met onze voeten in het zand."
  ]

};

/* ==========================================================
   API voor OV06: vraag zinnen op voor een woord
   ========================================================== */

window.SpellingZinnen.zoekZinnenVoor = function(woord, graad) {
  if (!woord) return null;
  graad = graad || 1;
  const bib = window.SpellingZinnen[`graad${graad}`];
  if (!bib) return null;
  const key = (typeof woord === "string") ? woord.toLowerCase() : (woord.tekst || "").toLowerCase();
  const zinnen = bib[key];
  if (zinnen && Array.isArray(zinnen) && zinnen.length > 0) {
    return zinnen;
  }
  return null;
};

/* Snelle stat-functie voor debugging */
window.SpellingZinnen.statistiek = function(graad) {
  graad = graad || 1;
  const bib = window.SpellingZinnen[`graad${graad}`];
  if (!bib) return { woorden: 0, zinnen: 0 };
  const woorden = Object.keys(bib).length;
  const zinnen = Object.values(bib).reduce((s, arr) => s + arr.length, 0);
  return { woorden, zinnen };
};