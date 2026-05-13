/* ============================================================
   ZINNEN-BIBLIOTHEEK VOOR OV09 — KLINKERDIEF — GRAAD 1
   
   Per stukjeswoord (meervoud-vorm) 3 natuurlijke context-zinnen.
   Bij OV09 ⭐⭐⭐⭐ wordt het woord in zo'n zin vervangen door
   de FOUTE schrijfwijze, en kind moet de fout herstellen.
   
   API: window.SpellingKlinkerdiefZinnen.zoekVoor(stukjeswoord, graad)
        window.SpellingKlinkerdiefZinnen.willekeurigeSet(woorden, n, seedFn)
        window.SpellingKlinkerdiefZinnen.statistiek(graad)
   ============================================================ */

window.SpellingKlinkerdiefZinnen = window.SpellingKlinkerdiefZinnen || {};

window.SpellingKlinkerdiefZinnen.graad1 = {

  /* ============================================================
     STUKJES-VERDUBBELEN (korte klank, verdubbel medeklinker)
     ============================================================ */

  "katten": [
    "De katten van de buren spelen in de tuin.",
    "Op het hek zitten drie katten.",
    "Sommige katten houden van vis."
  ],
  "bommen": [
    "In het verhaal vallen twee bommen.",
    "De soldaten ontmantelen oude bommen.",
    "Op het oude plein lagen veel bommen."
  ],
  "ballen": [
    "Op het veld liggen vijf ballen.",
    "De kinderen schoppen tegen de ballen.",
    "In de zak zitten allemaal ballen."
  ],
  "kippen": [
    "Achter het hek lopen vier kippen.",
    "Op de boerderij leggen kippen eieren.",
    "Drie kippen pikken in het zand."
  ],
  "poppen": [
    "Op de plank zitten lieve poppen.",
    "Lien speelt met haar poppen.",
    "In de doos liggen oude poppen."
  ],
  "muggen": [
    "Op het balkon zoemen veel muggen.",
    "'s Avonds steken muggen vaak.",
    "In het bos zitten kleine muggen."
  ],
  "petten": [
    "Op de tafel liggen drie petten.",
    "Alle kinderen dragen rode petten.",
    "In de winkel hangen veel petten."
  ],
  "stippen": [
    "Op haar jurk staan witte stippen.",
    "Het lieveheersbeestje heeft zwarte stippen.",
    "Sara tekent kleurige stippen."
  ],
  "bussen": [
    "Voor het station staan drie bussen.",
    "Iedere ochtend rijden veel bussen voorbij.",
    "Op het plein wachten twee bussen."
  ],
  "mussen": [
    "Op het dak zitten kleine mussen.",
    "De mussen pikken naar de kruimels.",
    "In de heg wonen veel mussen."
  ],
  "vissen": [
    "In de vijver zwemmen veel vissen.",
    "Sam ziet twee gele vissen.",
    "De kat kijkt naar de vissen."
  ],
  "pannen": [
    "Op het fornuis staan drie pannen.",
    "Mama wast de vuile pannen af.",
    "In de kast hangen veel pannen."
  ],
  "dassen": [
    "Op het rek hangen mooie dassen.",
    "Papa kiest tussen twee dassen.",
    "In de kast liggen veel dassen."
  ],
  "bellen": [
    "Aan de fietsen hangen rode bellen.",
    "Sara hoort vele bellen rinkelen.",
    "Op de slee zitten kleine bellen."
  ],
  "kassen": [
    "Achter het tuincentrum staan grote kassen.",
    "In de kassen groeien veel tomaten.",
    "Twee glazen kassen vangen het zonlicht."
  ],
  "rokken": [
    "In de kast hangen vrolijke rokken.",
    "Lien past drie rokken.",
    "Op het rek liggen lange rokken."
  ],
  "vossen": [
    "In het bos sluipen drie vossen.",
    "Vossen jagen vaak 's nachts.",
    "Achter de heg verdwijnen twee vossen."
  ],
  "spinnen": [
    "In de hoek wonen kleine spinnen.",
    "Sommige spinnen maken mooie webben.",
    "Tom is bang van spinnen."
  ],
  "matten": [
    "In de gang liggen natte matten.",
    "De turners gebruiken zachte matten.",
    "Bij de deur liggen twee matten."
  ],
  "latten": [
    "Papa zaagt drie houten latten.",
    "Tegen de muur staan lange latten.",
    "Op zolder liggen veel latten."
  ],
  "ratten": [
    "In de schuur zitten twee ratten.",
    "Op zolder rennen kleine ratten.",
    "De kat vangt grijze ratten."
  ],
  "takken": [
    "Op de grond liggen veel takken.",
    "De wind breekt drie takken af.",
    "Sam verzamelt droge takken."
  ],
  "zakken": [
    "In de tuin staan zware zakken aarde.",
    "Mama draagt twee zakken boodschappen.",
    "Op de grond liggen lege zakken."
  ],
  "lappen": [
    "In de doos zitten kleurige lappen.",
    "Oma naait met oude lappen.",
    "Op tafel liggen vijf lappen."
  ],
  "bakken": [
    "Achter de winkel staan grote bakken.",
    "Papa stapelt drie bakken op elkaar.",
    "In de loods liggen veel bakken."
  ],
  "sokken": [
    "In de la liggen warme sokken.",
    "Lien zoekt haar twee sokken.",
    "Aan de waslijn hangen veel sokken."
  ],
  "knoppen": [
    "Op de afstandsbediening zitten kleine knoppen.",
    "Druk eerst op de groene knoppen.",
    "Aan haar jas zitten gouden knoppen."
  ],
  "kikkers": [
    "In de vijver zwemmen vier kikkers.",
    "'s Avonds kwaken veel kikkers.",
    "Op het blad zitten twee kikkers."
  ],
  "ladders": [
    "Tegen de muur staan drie ladders.",
    "De brandweer heeft lange ladders.",
    "In de schuur liggen twee ladders."
  ],
  "emmers": [
    "Onder de kraan staan vier emmers.",
    "Sam vult drie emmers met zand.",
    "Achter de stal staan lege emmers."
  ],
  "letters": [
    "Op het bord staan grote letters.",
    "In mijn naam zitten vier letters.",
    "Sara leert nieuwe letters."
  ],

  /* Werkwoorden (infinitief) — meervoud-vorm is gelijk */
  "rennen": [
    "De kinderen rennen over het veld.",
    "Bij de speeltuin rennen veel kinderen.",
    "Twee jongens rennen naar de bus."
  ],
  "zwemmen": [
    "In het meer zwemmen mensen.",
    "Sara en Tom zwemmen graag.",
    "Vissen zwemmen door het water."
  ],
  "vallen": [
    "In de herfst vallen veel bladeren.",
    "Sommige peren vallen van de boom.",
    "Bij gladheid vallen kinderen vaak."
  ],
  "zitten": [
    "Op de bank zitten drie poezen.",
    "De vogels zitten in de boom.",
    "Tom en Lien zitten in de klas."
  ],
  "tikken": [
    "Op het raam tikken regendruppels.",
    "De vingers tikken op het toetsenbord.",
    "We tikken zachtjes op de deur."
  ],
  "stoppen": [
    "De bussen stoppen aan de halte.",
    "De auto's stoppen voor het rode licht.",
    "Wij stoppen onze boeken in de tas."
  ],
  "bakken": [
    "Wij bakken samen koekjes.",
    "Oma en mama bakken een taart.",
    "In de oven bakken brode broodjes."
  ],

  /* ============================================================
     STUKJES-VERENKELEN (lange klank, verenkel klinker)
     ============================================================ */

  "bomen": [
    "In het bos staan veel bomen.",
    "Achter het huis groeien hoge bomen.",
    "De wind beweegt de bomen."
  ],
  "muren": [
    "In de kamer staan vier muren.",
    "Tussen de huizen staan oude muren.",
    "De kunstenaar beschildert de muren."
  ],
  "namen": [
    "Op het bord staan vele namen.",
    "Sara kent alle namen uit haar klas.",
    "Drie namen beginnen met een S."
  ],
  "kazen": [
    "Op de markt liggen veel kazen.",
    "In de winkel hangen grote kazen.",
    "Wij proeven verschillende kazen."
  ],
  "vazen": [
    "Op de kast staan vier vazen.",
    "Mama vult drie vazen met bloemen.",
    "Alle vazen zijn van glas."
  ],
  "palen": [
    "Naast de weg staan veel palen.",
    "In de wei staan houten palen.",
    "De wind buigt twee dunne palen."
  ],
  "manen": [
    "Een leeuw heeft mooie manen.",
    "De leeuw schudt zijn lange manen.",
    "Sam kleurt de gele manen."
  ],
  "buren": [
    "Onze buren zijn heel vriendelijk.",
    "Wij groeten alle buren.",
    "Sam helpt de oude buren."
  ],
  "uren": [
    "Een dag telt vierentwintig uren.",
    "Papa wacht al enkele uren.",
    "Hoeveel uren zitten er in een dag?"
  ],
  "haren": [
    "Op haar hoofd zitten lange haren.",
    "Lien kamt haar mooie haren.",
    "Sommige haren zijn al grijs."
  ],
  "banen": [
    "Op de weg liggen vier banen.",
    "De atleten lopen op aparte banen.",
    "Sommige banen zijn breed."
  ],
  "beren": [
    "In het bos leven grote beren.",
    "Wij zien twee beren in de zoo.",
    "Sommige beren slapen in de winter."
  ],
  "veren": [
    "In het kussen zitten witte veren.",
    "Op de grond liggen kleurige veren.",
    "De pauw heeft prachtige veren."
  ],
  "hanen": [
    "Op de boerderij kraaien drie hanen.",
    "Trotse hanen lopen rond.",
    "Twee hanen vechten om de kippen."
  ],
  "kranen": [
    "In de keuken zijn twee kranen.",
    "Alle kranen lekken een beetje.",
    "Papa repareert drie kranen."
  ],
  "ramen": [
    "In het huis zijn zes ramen.",
    "Alle ramen staan open.",
    "Lien wast drie ramen."
  ],
  "schapen": [
    "Op de wei grazen witte schapen.",
    "Sam telt twintig schapen.",
    "Drie schapen liggen onder een boom."
  ],
  "peren": [
    "In de mand liggen rijpe peren.",
    "Sara plukt vijf peren.",
    "Op de markt liggen veel peren."
  ],
  "boten": [
    "In de haven liggen veel boten.",
    "Op het meer varen vijf boten.",
    "Drie kleine boten wachten op de kade."
  ],

  /* Verenkel-werkwoorden */
  "lepels": [
    "Op tafel liggen vijf lepels.",
    "In de la zitten veel lepels.",
    "Mama vraagt drie lepels."
  ],
  "vaders": [
    "Op het feest komen alle vaders.",
    "Drie vaders staan te praten.",
    "Vaders werken vaak hard."
  ],
  "tafels": [
    "In de klas staan zes tafels.",
    "Alle tafels zijn afgeruimd.",
    "Twee tafels staan tegen de muur."
  ],
  "wateren": [
    "In de stad zijn veel wateren.",
    "Vissen leven in zoete wateren.",
    "De zon weerspiegelt in de wateren."
  ],
  "bekers": [
    "Op de plank staan tien bekers.",
    "Mama vult drie bekers met sap.",
    "Alle bekers zijn al uit."
  ],
  "lopen": [
    "De kinderen lopen over het pad.",
    "Bij de school lopen veel mensen.",
    "Wij lopen samen naar de winkel."
  ],
  "slapen": [
    "'s Nachts slapen de meeste mensen.",
    "Baby's slapen vaak overdag.",
    "Sommige dieren slapen in de winter."
  ],
  "eten": [
    "Wij eten elke dag groenten.",
    "Kinderen eten graag pannenkoeken.",
    "Vogels eten zaden en wormen."
  ],

  /* ============================================================
     STUKJES-GEEN-REGEL (al 2 medeklinkers, schrijf wat je hoort)
     ============================================================ */

  "handen": [
    "Sam wast zijn vuile handen.",
    "Wij klappen met onze handen.",
    "Twee koude handen warmen op."
  ],
  "manden": [
    "In de winkel staan grote manden.",
    "Oma vlecht mooie manden.",
    "Drie manden zijn al vol."
  ],
  "lampen": [
    "Aan het plafond hangen drie lampen.",
    "'s Avonds branden alle lampen.",
    "In de winkel hangen veel lampen."
  ],
  "rampen": [
    "Op het nieuws horen we over rampen.",
    "Sommige rampen zijn heel groot.",
    "Mensen helpen elkaar bij rampen."
  ],
  "liften": [
    "In het gebouw zijn twee liften.",
    "Soms zijn de liften kapot.",
    "Wij wachten op de liften."
  ],
  "wolken": [
    "Aan de hemel drijven witte wolken.",
    "Achter de bergen verschijnen donkere wolken.",
    "Vier wolken bedekken de zon."
  ],
  "tenten": [
    "Op de camping staan vijf tenten.",
    "In het bos staan drie tenten.",
    "Wij slapen graag in tenten."
  ],
  "kasten": [
    "In de kamer staan vier kasten.",
    "Alle kasten zijn vol speelgoed.",
    "Mama opent twee kasten."
  ],
  "helmen": [
    "Op de fietsen liggen drie helmen.",
    "Alle bouwers dragen helmen.",
    "In de doos zitten twee helmen."
  ],
  "monden": [
    "De kinderen openen hun monden.",
    "Twee hongerige monden willen eten.",
    "Op het schilderij zie ik vier monden."
  ],
  "winden": [
    "In de herfst waaien sterke winden.",
    "Boven zee staan koude winden.",
    "Verschillende winden komen samen."
  ],
  "planten": [
    "Op het raam staan veel planten.",
    "In de tuin groeien mooie planten.",
    "Drie planten hebben water nodig."
  ],
  "armen": [
    "Sam strekt zijn armen uit.",
    "Bij dansen bewegen onze armen.",
    "De baby heeft kleine armen."
  ],
  "paarden": [
    "Op de wei lopen drie paarden.",
    "Wilde paarden rennen vrij.",
    "Twee paarden drinken water."
  ],
  "poorten": [
    "Aan het kasteel zijn twee poorten.",
    "Alle poorten staan open.",
    "De ridders verdedigen de poorten."
  ],
  "kaarten": [
    "Op tafel liggen veel kaarten.",
    "Wij spelen met kaarten.",
    "Drie kaarten zijn omgedraaid."
  ],
  "zwaarden": [
    "De ridders dragen zware zwaarden.",
    "In het museum hangen oude zwaarden.",
    "Twee zwaarden kruisen elkaar."
  ],
  "baarden": [
    "Sommige mannen hebben lange baarden.",
    "Drie kabouters hebben witte baarden.",
    "Zijn baarden groeien snel."
  ],
  "feesten": [
    "In de zomer zijn er veel feesten.",
    "Wij vieren graag feesten.",
    "Twee grote feesten staan gepland."
  ],
  "boorden": [
    "Aan zijn hemd zitten witte boorden.",
    "Mama strijkt de boorden.",
    "Sommige boorden zijn versleten."
  ],
  "beesten": [
    "In de zoo wonen wilde beesten.",
    "Op de boerderij zijn lieve beesten.",
    "Drie beesten slapen in de schaduw."
  ],
  "hoofden": [
    "Op het schilderij zie ik veel hoofden.",
    "Onze hoofden draaien naar de juf.",
    "De drie kabouters knikken met hun hoofden."
  ],
  "wortels": [
    "Het konijn eet drie wortels.",
    "In de tuin groeien veel wortels.",
    "Mama schilt vier wortels."
  ],
  "winters": [
    "Sara heeft al zes winters meegemaakt.",
    "De laatste twee winters waren koud.",
    "Sommige winters duren lang."
  ]
};

/* ============================================================
   API
   ============================================================ */

/* Zoek alle context-zinnen voor één stukjeswoord. */
window.SpellingKlinkerdiefZinnen.zoekVoor = function (woord, graad) {
  if (!woord) return null;
  graad = graad || 1;
  const bib = window.SpellingKlinkerdiefZinnen[`graad${graad}`];
  if (!bib) return null;
  const key = (typeof woord === "string")
    ? woord.toLowerCase()
    : (woord.meervoud || woord.tekst || "").toLowerCase();
  const zinnen = bib[key];
  return (zinnen && zinnen.length > 0) ? zinnen : null;
};

/* Selecteer willekeurig N zinnen voor N stukjeswoorden uit een lijst.
   Returns: [{ stukjeswoord, grondwoord, zin, categorie }, ...]
   Voor OV09: stukjeswoord = de meervoud-vorm (kan ook werkw-infinitief zijn) */
window.SpellingKlinkerdiefZinnen.willekeurigeSet = function (woorden, aantal, seedFn) {
  const rng = seedFn || Math.random;
  const beschikbaar = woorden.filter(w => {
    const sw = (w.meervoud || w.tekst || w).toString().toLowerCase();
    return window.SpellingKlinkerdiefZinnen.zoekVoor(sw);
  });
  const kopie = [...beschikbaar];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  const gekozen = kopie.slice(0, Math.min(aantal, kopie.length));
  return gekozen.map(w => {
    const stukjeswoord = (w.meervoud || w.tekst).toString().toLowerCase();
    const grondwoord = w.tekst || stukjeswoord;
    const zinnen = window.SpellingKlinkerdiefZinnen.zoekVoor(stukjeswoord);
    const zinIdx = Math.floor(rng() * zinnen.length);
    return {
      stukjeswoord: stukjeswoord,
      grondwoord: grondwoord,
      zin: zinnen[zinIdx],
      categorie: w.categorie
    };
  });
};

/* Stat voor debugging */
window.SpellingKlinkerdiefZinnen.statistiek = function (graad) {
  graad = graad || 1;
  const bib = window.SpellingKlinkerdiefZinnen[`graad${graad}`];
  if (!bib) return { woorden: 0, zinnen: 0 };
  const woorden = Object.keys(bib).length;
  const zinnen = Object.values(bib).reduce((s, arr) => s + arr.length, 0);
  return { woorden, zinnen };
};
