/* ==========================================================
   woordenbiblio/graad2.js
   Woordenset voor graad 2 (derde + vierde leerjaar)

   Gebaseerd op de leerplandoelen voor schrijven L3 en L4:
   - Hoorwoord-categorieën: herhalen + uitbreiden met moeilijkere woorden
   - Onthoudwoorden: ei/ij, au/ou (spelling onthouden, klanken klinken hetzelfde)
   - Regelwoorden: bestaande regels + nieuwe uitbreidingen (-etje, -kje, -'s, -eren)
   - Werkwoorden: volledig nieuw (OTT, VTT, OVT zwak/sterk, VVT)
   - Doffe klank in voor-/achtervoegsels: volledig nieuw
   - L4-specifiek: -teit/-heid, leenwoorden

   Structuur: elke groep heeft één of meer aparte categorieën zodat de
   leerkracht in de woordenkiezer per subcategorie kan aanvinken
   (bv. enkel -aai-woorden, enkel verdubbelaars).
   ========================================================== */
window.SpellingWoordenbibliotheek.registreerGraad(2, {

  /* ============================================================
     HOORWOORDEN — herhalen uit graad 1 + uitbreiden
     ============================================================ */

  // ===== ng woorden =====
  "ng-g2": {
    naam: "ng-woorden",
    groep: "ng-nk",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -ng, klank goed leren onderscheiden van -nk.",
    woorden: [
      { tekst: "ring", lidwoord: "de", afbeelding: false },
      { tekst: "slang", lidwoord: "de", afbeelding: false },
      { tekst: "long", lidwoord: "de", afbeelding: false },
      { tekst: "wang", lidwoord: "de", afbeelding: false },
      { tekst: "sprong", lidwoord: "de", afbeelding: false },
      { tekst: "jongen", lidwoord: "de", afbeelding: false },
      { tekst: "koning", lidwoord: "de", afbeelding: false },
      { tekst: "gang", lidwoord: "de", afbeelding: false },
      { tekst: "woning", lidwoord: "de", afbeelding: false },
      { tekst: "tekening", lidwoord: "de", afbeelding: false },
      { tekst: "richting", lidwoord: "de", afbeelding: false },
      { tekst: "oefening", lidwoord: "de", afbeelding: false },
      { tekst: "regering", lidwoord: "de", afbeelding: false },
      { tekst: "vergadering", lidwoord: "de", afbeelding: false },
      { tekst: "aankondiging", lidwoord: "de", afbeelding: false },
      { tekst: "verandering", lidwoord: "de", afbeelding: false }
    ]
  },

  // ===== nk woorden =====
  "nk-g2": {
    naam: "nk-woorden",
    groep: "ng-nk",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -nk, klank goed leren onderscheiden van -ng.",
    woorden: [
      { tekst: "bank", lidwoord: "de", afbeelding: false },
      { tekst: "plank", lidwoord: "de", afbeelding: false },
      { tekst: "klank", lidwoord: "de", afbeelding: false },
      { tekst: "pink", lidwoord: "de", afbeelding: false },
      { tekst: "vink", lidwoord: "de", afbeelding: false },
      { tekst: "drank", lidwoord: "de", afbeelding: false },
      { tekst: "dank", lidwoord: "de", afbeelding: false },
      { tekst: "schenking", lidwoord: "de", afbeelding: false },
      { tekst: "enkel", lidwoord: "de", afbeelding: false },
      { tekst: "wenkbrauw", lidwoord: "de", afbeelding: false },
      { tekst: "kink", lidwoord: "de", afbeelding: false },
      { tekst: "bedankt", lidwoord: null, afbeelding: false },
      { tekst: "dronken", lidwoord: null, afbeelding: false },
      { tekst: "dankbaar", lidwoord: null, afbeelding: false },
      { tekst: "stinkend", lidwoord: null, afbeelding: false }
    ]
  },

  // ===== sch- woorden =====
  "sch-woorden-g2": {
    naam: "sch-woorden",
    groep: "sch-woorden",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met de sch-klank (zonder cluster).",
    woorden: [
      { tekst: "school", lidwoord: "de", afbeelding: false },
      { tekst: "schoen", lidwoord: "de", afbeelding: false },
      { tekst: "schip", lidwoord: "het", afbeelding: false },
      { tekst: "schaar", lidwoord: "de", afbeelding: false },
      { tekst: "schaap", lidwoord: "het", afbeelding: false },
      { tekst: "schat", lidwoord: "de", afbeelding: false },
      { tekst: "schaal", lidwoord: "de", afbeelding: false },
      { tekst: "schop", lidwoord: "de", afbeelding: false },
      { tekst: "schil", lidwoord: "de", afbeelding: false },
      { tekst: "schoon", lidwoord: null, afbeelding: false },
      { tekst: "scheef", lidwoord: null, afbeelding: false },
      { tekst: "schilderij", lidwoord: "het", afbeelding: false },
      { tekst: "schoolbord", lidwoord: "het", afbeelding: false },
      { tekst: "schoonmaak", lidwoord: "de", afbeelding: false },
      { tekst: "schitteren", lidwoord: null, afbeelding: false },
      { tekst: "schaduw", lidwoord: "de", afbeelding: false },
      { tekst: "schikken", lidwoord: null, afbeelding: false },
      { tekst: "schipper", lidwoord: "de", afbeelding: false }
    ]
  },

  // ===== schr- woorden =====
  "schr-woorden-g2": {
    naam: "schr-woorden",
    groep: "schr-woorden",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met de schr-cluster aan het begin.",
    woorden: [
      { tekst: "schroef", lidwoord: "de", afbeelding: false },
      { tekst: "schrijven", lidwoord: null, afbeelding: false },
      { tekst: "schrik", lidwoord: "de", afbeelding: false },
      { tekst: "schreeuwen", lidwoord: null, afbeelding: false },
      { tekst: "schram", lidwoord: "de", afbeelding: false },
      { tekst: "schrobben", lidwoord: null, afbeelding: false },
      { tekst: "schrappen", lidwoord: null, afbeelding: false },
      { tekst: "schrijver", lidwoord: "de", afbeelding: false }
    ]
  },

  // ===== Clusters: meerdere medeklinkers in het midden =====
  "clusters-g2": {
    naam: "Medeklinkerclusters",
    groep: "clusters",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met meerdere medeklinkers in het midden (masker, kasteel, onder).",
    woorden: [
      { tekst: "masker", lidwoord: "het", afbeelding: false },
      { tekst: "kasteel", lidwoord: "het", afbeelding: false },
      { tekst: "onder", lidwoord: null, afbeelding: false },
      { tekst: "vinger", lidwoord: "de", afbeelding: false },
      { tekst: "honger", lidwoord: "de", afbeelding: false },
      { tekst: "lantaarn", lidwoord: "de", afbeelding: false },
      { tekst: "trompet", lidwoord: "de", afbeelding: false },
      { tekst: "kompas", lidwoord: "het", afbeelding: false },
      { tekst: "prinses", lidwoord: "de", afbeelding: false },
      { tekst: "werkster", lidwoord: "de", afbeelding: false },
      { tekst: "wintertijd", lidwoord: "de", afbeelding: false },
      { tekst: "klanten", lidwoord: null, afbeelding: false },
      { tekst: "versterking", lidwoord: "de", afbeelding: false },
      { tekst: "wandeling", lidwoord: "de", afbeelding: false },
      { tekst: "plotseling", lidwoord: null, afbeelding: false },
      { tekst: "lente", lidwoord: "de", afbeelding: false },
      { tekst: "winter", lidwoord: "de", afbeelding: false },
      { tekst: "gisteren", lidwoord: null, afbeelding: false },
      { tekst: "kelder", lidwoord: "de", afbeelding: false },
      { tekst: "kalkoen", lidwoord: "de", afbeelding: false }
    ]
  },

  // ===== aai woorden =====
  "aai-g2": {
    naam: "aai-woorden",
    groep: "aai-ooi-oei-eeuw-ieuw-uw",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -aai.",
    woorden: [
      { tekst: "haai", lidwoord: "de", afbeelding: false },
      { tekst: "kraai", lidwoord: "de", afbeelding: false },
      { tekst: "draai", lidwoord: "de", afbeelding: false },
      { tekst: "lawaai", lidwoord: "het", afbeelding: false },
      { tekst: "zwaai", lidwoord: "de", afbeelding: false },
      { tekst: "saai", lidwoord: null, afbeelding: false },
      { tekst: "fraai", lidwoord: null, afbeelding: false },
      { tekst: "naai", lidwoord: null, afbeelding: false },
      { tekst: "naait", lidwoord: null, afbeelding: false },
      { tekst: "maai", lidwoord: null, afbeelding: false },
      { tekst: "papegaai", lidwoord: "de", afbeelding: false },
      { tekst: "kaai", lidwoord: "de", afbeelding: false }
    ]
  },

  // ===== ooi woorden =====
  "ooi-g2": {
    naam: "ooi-woorden",
    groep: "aai-ooi-oei-eeuw-ieuw-uw",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -ooi.",
    woorden: [
      { tekst: "kooi", lidwoord: "de", afbeelding: false },
      { tekst: "hooi", lidwoord: "het", afbeelding: false },
      { tekst: "mooi", lidwoord: null, afbeelding: false },
      { tekst: "gooi", lidwoord: null, afbeelding: false },
      { tekst: "strooi", lidwoord: null, afbeelding: false },
      { tekst: "vlooi", lidwoord: "de", afbeelding: false },
      { tekst: "plooi", lidwoord: "de", afbeelding: false },
      { tekst: "rooi", lidwoord: null, afbeelding: false }
    ]
  },

  // ===== oei woorden =====
  "oei-g2": {
    naam: "oei-woorden",
    groep: "aai-ooi-oei-eeuw-ieuw-uw",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -oei.",
    woorden: [
      { tekst: "boei", lidwoord: "de", afbeelding: false },
      { tekst: "groei", lidwoord: "de", afbeelding: false },
      { tekst: "bloei", lidwoord: "de", afbeelding: false },
      { tekst: "stoei", lidwoord: null, afbeelding: false },
      { tekst: "knoei", lidwoord: null, afbeelding: false },
      { tekst: "roei", lidwoord: null, afbeelding: false },
      { tekst: "foei", lidwoord: null, afbeelding: false },
      { tekst: "broei", lidwoord: "de", afbeelding: false },
      { tekst: "vermoeid", lidwoord: null, afbeelding: false },
      { tekst: "boeiend", lidwoord: null, afbeelding: false }
    ]
  },

  // ===== eeuw woorden =====
  "eeuw-g2": {
    naam: "eeuw-woorden",
    groep: "aai-ooi-oei-eeuw-ieuw-uw",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -eeuw.",
    woorden: [
      { tekst: "leeuw", lidwoord: "de", afbeelding: false },
      { tekst: "sneeuw", lidwoord: "de", afbeelding: false },
      { tekst: "eeuw", lidwoord: "de", afbeelding: false },
      { tekst: "spreeuw", lidwoord: "de", afbeelding: false },
      { tekst: "meeuw", lidwoord: "de", afbeelding: false },
      { tekst: "geeuw", lidwoord: "de", afbeelding: false },
      { tekst: "eeuwig", lidwoord: null, afbeelding: false },
      { tekst: "sneeuwbal", lidwoord: "de", afbeelding: false }
    ]
  },

  // ===== ieuw woorden =====
  "ieuw-g2": {
    naam: "ieuw-woorden",
    groep: "aai-ooi-oei-eeuw-ieuw-uw",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -ieuw.",
    woorden: [
      { tekst: "kieuw", lidwoord: "de", afbeelding: false },
      { tekst: "nieuw", lidwoord: null, afbeelding: false },
      { tekst: "opnieuw", lidwoord: null, afbeelding: false },
      { tekst: "nieuws", lidwoord: "het", afbeelding: false },
      { tekst: "vernieuwen", lidwoord: null, afbeelding: false },
      { tekst: "nieuwtje", lidwoord: "het", afbeelding: false }
    ]
  },

  // ===== uw woorden =====
  "uw-g2": {
    naam: "uw-woorden",
    groep: "aai-ooi-oei-eeuw-ieuw-uw",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -uw.",
    woorden: [
      { tekst: "ruw", lidwoord: null, afbeelding: false },
      { tekst: "schuw", lidwoord: null, afbeelding: false },
      { tekst: "duw", lidwoord: "de", afbeelding: false },
      { tekst: "duwen", lidwoord: null, afbeelding: false },
      { tekst: "sluw", lidwoord: null, afbeelding: false },
      { tekst: "stuwen", lidwoord: null, afbeelding: false }
    ]
  },

  // ===== ch woorden =====
  "ch-g2": {
    naam: "ch-woorden",
    groep: "ch-cht-gt",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -ch (zonder -t erna).",
    woorden: [
      { tekst: "ach", lidwoord: null, afbeelding: false },
      { tekst: "lach", lidwoord: "de", afbeelding: false },
      { tekst: "pech", lidwoord: "de", afbeelding: false },
      { tekst: "zich", lidwoord: null, afbeelding: false },
      { tekst: "toch", lidwoord: null, afbeelding: false },
      { tekst: "glimlach", lidwoord: "de", afbeelding: false },
      { tekst: "kuch", lidwoord: "de", afbeelding: false }
    ]
  },

  // ===== cht woorden =====
  "cht-g2": {
    naam: "cht-woorden",
    groep: "ch-cht-gt",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -cht.",
    woorden: [
      { tekst: "acht", lidwoord: null, afbeelding: false },
      { tekst: "nacht", lidwoord: "de", afbeelding: false },
      { tekst: "licht", lidwoord: "het", afbeelding: false },
      { tekst: "hij lacht", lidwoord: null, afbeelding: false },
      { tekst: "hij vecht", lidwoord: null, afbeelding: false },
      { tekst: "recht", lidwoord: null, afbeelding: false },
      { tekst: "hij zucht", lidwoord: null, afbeelding: false },
      { tekst: "vlucht", lidwoord: "de", afbeelding: false },
      { tekst: "hij wacht", lidwoord: null, afbeelding: false },
      { tekst: "hij dacht", lidwoord: null, afbeelding: false },
      { tekst: "dicht", lidwoord: null, afbeelding: false },
      { tekst: "echt", lidwoord: null, afbeelding: false },
      { tekst: "lucht", lidwoord: "de", afbeelding: false },
      { tekst: "gevecht", lidwoord: "het", afbeelding: false },
      { tekst: "prachtig", lidwoord: null, afbeelding: false }
    ]
  },

  // ===== gt woorden (werkwoordsvormen) =====
  "gt-g2": {
    naam: "gt-woorden",
    groep: "ch-cht-gt",
    hoofdgroep: "hoorwoord",
    beschrijving: "Werkwoordsvormen met -gt (klinkt als -cht maar je schrijft -gt).",
    woorden: [
      { tekst: "hij zegt", lidwoord: null, afbeelding: false },
      { tekst: "hij vraagt", lidwoord: null, afbeelding: false },
      { tekst: "hij legt", lidwoord: null, afbeelding: false },
      { tekst: "hij jaagt", lidwoord: null, afbeelding: false },
      { tekst: "hij vliegt", lidwoord: null, afbeelding: false },
      { tekst: "hij veegt", lidwoord: null, afbeelding: false },
      { tekst: "hij liegt", lidwoord: null, afbeelding: false },
      { tekst: "hij klaagt", lidwoord: null, afbeelding: false },
      { tekst: "hij buigt", lidwoord: null, afbeelding: false },
      { tekst: "hij ligt", lidwoord: null, afbeelding: false },
      { tekst: "hij beweegt", lidwoord: null, afbeelding: false },
      { tekst: "hij weegt", lidwoord: null, afbeelding: false }
    ]
  },

  // ===== Doffe klank in onbeklemtoonde lettergrepen =====
  "doffe-klank-g2": {
    naam: "Doffe klank",
    groep: "doffe-klank",
    hoofdgroep: "hoorwoord",
    beschrijving: "Doffe klank in onbeklemtoonde lettergrepen (dokter, havik, avond, datum).",
    woorden: [
      // Behouden uit G1 — eindigt op -el
      { tekst: "tafel", lidwoord: "de", afbeelding: false },
      { tekst: "appel", lidwoord: "de", afbeelding: false },
      { tekst: "vogel", lidwoord: "de", afbeelding: false },
      { tekst: "engel", lidwoord: "de", afbeelding: false },
      { tekst: "wortel", lidwoord: "de", afbeelding: false },
      { tekst: "lepel", lidwoord: "de", afbeelding: false },
      { tekst: "winkel", lidwoord: "de", afbeelding: false },
      { tekst: "kabel", lidwoord: "de", afbeelding: false },
      { tekst: "sleutel", lidwoord: "de", afbeelding: false },
      { tekst: "nagel", lidwoord: "de", afbeelding: false },
      // Behouden uit G1 — eindigt op -er
      { tekst: "dokter", lidwoord: "de", afbeelding: false },
      { tekst: "vlinder", lidwoord: "de", afbeelding: false },
      { tekst: "vader", lidwoord: "de", afbeelding: false },
      { tekst: "moeder", lidwoord: "de", afbeelding: false },
      { tekst: "water", lidwoord: "het", afbeelding: false },
      { tekst: "boter", lidwoord: "de", afbeelding: false },
      { tekst: "letter", lidwoord: "de", afbeelding: false },
      { tekst: "meester", lidwoord: "de", afbeelding: false },
      { tekst: "bakker", lidwoord: "de", afbeelding: false },
      // Behouden uit G1 — eindigt op -en
      { tekst: "lopen", lidwoord: null, afbeelding: false },
      { tekst: "eten", lidwoord: null, afbeelding: false },
      { tekst: "drinken", lidwoord: null, afbeelding: false },
      { tekst: "spelen", lidwoord: null, afbeelding: false },
      { tekst: "slapen", lidwoord: null, afbeelding: false },
      { tekst: "vragen", lidwoord: null, afbeelding: false },
      // Nieuw G2 — doffe -ik
      { tekst: "havik", lidwoord: "de", afbeelding: false },
      { tekst: "monnik", lidwoord: "de", afbeelding: false },
      // Nieuw G2 — doffe -ond
      { tekst: "avond", lidwoord: "de", afbeelding: false },
      // Nieuw G2 — doffe -um
      { tekst: "datum", lidwoord: "de", afbeelding: false },
      { tekst: "museum", lidwoord: "het", afbeelding: false },
      { tekst: "podium", lidwoord: "het", afbeelding: false },
      // Nieuw G2 — doffe -em
      { tekst: "bezem", lidwoord: "de", afbeelding: false },
      // Nieuw G2 — doffe -on
      { tekst: "stadion", lidwoord: "het", afbeelding: false },
      // Nieuw G2 — doffe -en (met klemtoon vooraan)
      { tekst: "examen", lidwoord: "het", afbeelding: false },
      // Nieuw G2 — extra -er en -el / -en
      { tekst: "kalender", lidwoord: "de", afbeelding: false },
      { tekst: "zomer", lidwoord: "de", afbeelding: false },
      { tekst: "winter", lidwoord: "de", afbeelding: false },
      { tekst: "zuster", lidwoord: "de", afbeelding: false },
      { tekst: "kleuter", lidwoord: "de", afbeelding: false }
    ]
  },


  /* ============================================================
     ONTHOUDWOORDEN — klanken klinken hetzelfde, je moet onthouden
     hoe het geschreven wordt
     ============================================================ */

  // ===== ei woorden =====
  "ei-g2": {
    naam: "ei-woorden",
    groep: "ei-ij",
    hoofdgroep: "onthoudwoord",
    beschrijving: "Woorden met ei — klinkt hetzelfde als ij, je moet onthouden welke je schrijft.",
    woorden: [
      { tekst: "trein", lidwoord: "de", afbeelding: false },
      { tekst: "klein", lidwoord: null, afbeelding: false },
      { tekst: "geit", lidwoord: "de", afbeelding: false },
      { tekst: "ei", lidwoord: "het", afbeelding: false },
      { tekst: "weide", lidwoord: "de", afbeelding: false },
      { tekst: "reis", lidwoord: "de", afbeelding: false },
      { tekst: "meid", lidwoord: "de", afbeelding: false },
      { tekst: "lei", lidwoord: "de", afbeelding: false },
      { tekst: "zeil", lidwoord: "het", afbeelding: false },
      { tekst: "eiland", lidwoord: "het", afbeelding: false },
      { tekst: "eik", lidwoord: "de", afbeelding: false },
      { tekst: "kei", lidwoord: "de", afbeelding: false },
      { tekst: "klei", lidwoord: "de", afbeelding: false },
      { tekst: "plein", lidwoord: "het", afbeelding: false },
      { tekst: "einde", lidwoord: "het", afbeelding: false },
      { tekst: "feit", lidwoord: "het", afbeelding: false },
      { tekst: "leiding", lidwoord: "de", afbeelding: false },
      { tekst: "fontein", lidwoord: "de", afbeelding: false },
      { tekst: "kapitein", lidwoord: "de", afbeelding: false },
      { tekst: "veilig", lidwoord: null, afbeelding: false },
      { tekst: "bereiding", lidwoord: "de", afbeelding: false },
      { tekst: "bereiken", lidwoord: null, afbeelding: false },
      { tekst: "veiling", lidwoord: "de", afbeelding: false },
      { tekst: "dweil", lidwoord: "de", afbeelding: false },
      { tekst: "zeilen", lidwoord: null, afbeelding: false }
    ]
  },

  // ===== ij woorden =====
  "ij-g2": {
    naam: "ij-woorden",
    groep: "ei-ij",
    hoofdgroep: "onthoudwoord",
    beschrijving: "Woorden met ij — klinkt hetzelfde als ei, je moet onthouden welke je schrijft.",
    woorden: [
      { tekst: "tijd", lidwoord: "de", afbeelding: false },
      { tekst: "vijf", lidwoord: null, afbeelding: false },
      { tekst: "fijn", lidwoord: null, afbeelding: false },
      { tekst: "wijn", lidwoord: "de", afbeelding: false },
      { tekst: "rijst", lidwoord: "de", afbeelding: false },
      { tekst: "lijn", lidwoord: "de", afbeelding: false },
      { tekst: "pijp", lidwoord: "de", afbeelding: false },
      { tekst: "pijn", lidwoord: "de", afbeelding: false },
      { tekst: "prijs", lidwoord: "de", afbeelding: false },
      { tekst: "rijm", lidwoord: "het", afbeelding: false },
      { tekst: "kijk", lidwoord: null, afbeelding: false },
      { tekst: "mijn", lidwoord: null, afbeelding: false },
      { tekst: "schrijf", lidwoord: null, afbeelding: false },
      { tekst: "bij", lidwoord: "de", afbeelding: false },
      { tekst: "ijs", lidwoord: "het", afbeelding: false },
      { tekst: "schilderij", lidwoord: "de", afbeelding: false },
      { tekst: "bakkerij", lidwoord: "de", afbeelding: false },
      { tekst: "woestijn", lidwoord: "de", afbeelding: false },
      { tekst: "partij", lidwoord: "de", afbeelding: false },
      { tekst: "vrijdag", lidwoord: "de", afbeelding: false },
      { tekst: "vrijheid", lidwoord: "de", afbeelding: false },
      { tekst: "gelijkenis", lidwoord: "de", afbeelding: false },
      { tekst: "gelijkmatig", lidwoord: null, afbeelding: false },
      { tekst: "vergelijken", lidwoord: null, afbeelding: false }
    ]
  },

  // ===== au woorden =====
  "au-g2": {
    naam: "au-woorden",
    groep: "au-ou",
    hoofdgroep: "onthoudwoord",
    beschrijving: "Woorden met au — klinkt hetzelfde als ou, je moet onthouden welke je schrijft.",
    woorden: [
      { tekst: "pauw", lidwoord: "de", afbeelding: false },
      { tekst: "saus", lidwoord: "de", afbeelding: false },
      { tekst: "dauw", lidwoord: "de", afbeelding: false },
      { tekst: "blauw", lidwoord: null, afbeelding: false },
      { tekst: "flauw", lidwoord: null, afbeelding: false },
      { tekst: "nauw", lidwoord: null, afbeelding: false },
      { tekst: "paus", lidwoord: "de", afbeelding: false },
      { tekst: "klauw", lidwoord: "de", afbeelding: false },
      { tekst: "miauw", lidwoord: null, afbeelding: false },
      { tekst: "auto", lidwoord: "de", afbeelding: false },
      { tekst: "augustus", lidwoord: null, afbeelding: false },
      { tekst: "applaus", lidwoord: "het", afbeelding: false },
      { tekst: "astronaut", lidwoord: "de", afbeelding: false },
      { tekst: "pauze", lidwoord: "de", afbeelding: false },
      { tekst: "lauw", lidwoord: null, afbeelding: false },
      { tekst: "mauwen", lidwoord: null, afbeelding: false },
      { tekst: "rauw", lidwoord: null, afbeelding: false }
    ]
  },

  // ===== ou woorden =====
  "ou-g2": {
    naam: "ou-woorden",
    groep: "au-ou",
    hoofdgroep: "onthoudwoord",
    beschrijving: "Woorden met ou — klinkt hetzelfde als au, je moet onthouden welke je schrijft.",
    woorden: [
      { tekst: "koud", lidwoord: null, afbeelding: false },
      { tekst: "oud", lidwoord: null, afbeelding: false },
      { tekst: "bout", lidwoord: "de", afbeelding: false },
      { tekst: "hout", lidwoord: "het", afbeelding: false },
      { tekst: "fout", lidwoord: "de", afbeelding: false },
      { tekst: "goud", lidwoord: "het", afbeelding: false },
      { tekst: "schouder", lidwoord: "de", afbeelding: false },
      { tekst: "vrouw", lidwoord: "de", afbeelding: false },
      { tekst: "trouw", lidwoord: "de", afbeelding: false },
      { tekst: "mouw", lidwoord: "de", afbeelding: false },
      { tekst: "touw", lidwoord: "het", afbeelding: false },
      { tekst: "bouwen", lidwoord: null, afbeelding: false },
      { tekst: "vouwen", lidwoord: null, afbeelding: false },
      { tekst: "stout", lidwoord: null, afbeelding: false },
      { tekst: "zout", lidwoord: "het", afbeelding: false },
      { tekst: "houden", lidwoord: null, afbeelding: false },
      { tekst: "kabouter", lidwoord: "de", afbeelding: false },
      { tekst: "kousen", lidwoord: "de", afbeelding: false },
      { tekst: "ouders", lidwoord: "de", afbeelding: false }
    ]
  },


  /* ============================================================
     REGELWOORDEN — STUKJESWOORDEN (4 categorieën + direct-type-B)
     ============================================================ */

  // ===== Verdubbelaars (korte klank + 1 medeklinker → verdubbel bij meervoud) =====
  "stukjes-verdubbelaars-g2": {
    naam: "Verdubbelaars",
    groep: "stukjeswoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Korte klank + 1 medeklinker. Bij meervoud verdubbel je de medeklinker (kat → katten, bom → bommen).",
    woorden: [
      // Behouden uit G1
      { tekst: "kat", lidwoord: "de", meervoud: "katten", afbeelding: false },
      { tekst: "bal", lidwoord: "de", meervoud: "ballen", afbeelding: false },
      { tekst: "kip", lidwoord: "de", meervoud: "kippen", afbeelding: false },
      { tekst: "pop", lidwoord: "de", meervoud: "poppen", afbeelding: false },
      { tekst: "bus", lidwoord: "de", meervoud: "bussen", afbeelding: false },
      { tekst: "vis", lidwoord: "de", meervoud: "vissen", afbeelding: false },
      { tekst: "spin", lidwoord: "de", meervoud: "spinnen", afbeelding: false },
      // Nieuw G2
      { tekst: "fles", lidwoord: "de", meervoud: "flessen", afbeelding: false },
      { tekst: "bril", lidwoord: "de", meervoud: "brillen", afbeelding: false },
      { tekst: "kop", lidwoord: "de", meervoud: "koppen", afbeelding: false },
      { tekst: "les", lidwoord: "de", meervoud: "lessen", afbeelding: false },
      { tekst: "kus", lidwoord: "de", meervoud: "kussen", afbeelding: false },
      { tekst: "stem", lidwoord: "de", meervoud: "stemmen", afbeelding: false },
      { tekst: "mug", lidwoord: "de", meervoud: "muggen", afbeelding: false },
      { tekst: "ster", lidwoord: "de", meervoud: "sterren", afbeelding: false },
      { tekst: "bom", lidwoord: "de", meervoud: "bommen", afbeelding: false },
      { tekst: "pet", lidwoord: "de", meervoud: "petten", afbeelding: false }
    ]
  },

  // ===== Verenkelaars (lange klank + 1 medeklinker → verenkel bij meervoud) =====
  "stukjes-verenkelaars-g2": {
    naam: "Verenkelaars",
    groep: "stukjeswoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Lange klank + 1 medeklinker. Bij meervoud schrijf je de klinker enkelvoudig (boom → bomen, raam → ramen).",
    woorden: [
      // Behouden uit G1
      { tekst: "boom", lidwoord: "de", meervoud: "bomen", afbeelding: false },
      { tekst: "muur", lidwoord: "de", meervoud: "muren", afbeelding: false },
      { tekst: "naam", lidwoord: "de", meervoud: "namen", afbeelding: false },
      { tekst: "kaas", lidwoord: "de", meervoud: "kazen", afbeelding: false },
      { tekst: "paal", lidwoord: "de", meervoud: "palen", afbeelding: false },
      { tekst: "maan", lidwoord: "de", meervoud: "manen", afbeelding: false },
      { tekst: "schaap", lidwoord: "het", meervoud: "schapen", afbeelding: false },
      { tekst: "beer", lidwoord: "de", meervoud: "beren", afbeelding: false },
      { tekst: "kraan", lidwoord: "de", meervoud: "kranen", afbeelding: false },
      // Nieuw G2
      { tekst: "straat", lidwoord: "de", meervoud: "straten", afbeelding: false },
      { tekst: "boot", lidwoord: "de", meervoud: "boten", afbeelding: false },
      { tekst: "smaak", lidwoord: "de", meervoud: "smaken", afbeelding: false },
      { tekst: "stoof", lidwoord: "de", meervoud: "stoven", afbeelding: false },
      { tekst: "staaf", lidwoord: "de", meervoud: "staven", afbeelding: false },
      { tekst: "zaag", lidwoord: "de", meervoud: "zagen", afbeelding: false },
      { tekst: "raam", lidwoord: "het", meervoud: "ramen", afbeelding: false }
    ]
  },

  // ===== Korte klank + 2 medeklinkers (geen verdubbeling, niets veranderen) =====
  "stukjes-kort-2mk-g2": {
    naam: "Korte klank + 2 medeklinkers",
    groep: "stukjeswoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Korte klank + 2 medeklinkers. Bij meervoud verandert er niets (kast → kasten, hond → honden).",
    woorden: [
      // Sommige woorden staan ook in verlengen-tdpb-g2 (voor verlengingsregel-OV).
      // Dat is bewust — bij taal hoort één woord soms in meerdere categorieën.
      { tekst: "kast", lidwoord: "de", meervoud: "kasten", afbeelding: false },
      { tekst: "plant", lidwoord: "de", meervoud: "planten", afbeelding: false },
      { tekst: "hand", lidwoord: "de", meervoud: "handen", afbeelding: false },
      { tekst: "wind", lidwoord: "de", meervoud: "winden", afbeelding: false },
      { tekst: "hemd", lidwoord: "het", meervoud: "hemden", afbeelding: false },
      { tekst: "vest", lidwoord: "het", meervoud: "vesten", afbeelding: false },
      { tekst: "kerk", lidwoord: "de", meervoud: "kerken", afbeelding: false },
      { tekst: "balk", lidwoord: "de", meervoud: "balken", afbeelding: false },
      { tekst: "hark", lidwoord: "de", meervoud: "harken", afbeelding: false },
      { tekst: "perk", lidwoord: "het", meervoud: "perken", afbeelding: false },
      { tekst: "lamp", lidwoord: "de", meervoud: "lampen", afbeelding: false },
      { tekst: "korst", lidwoord: "de", meervoud: "korsten", afbeelding: false },
      { tekst: "tent", lidwoord: "de", meervoud: "tenten", afbeelding: false },
      { tekst: "hond", lidwoord: "de", meervoud: "honden", afbeelding: false },
      { tekst: "mond", lidwoord: "de", meervoud: "monden", afbeelding: false },
      { tekst: "rand", lidwoord: "de", meervoud: "randen", afbeelding: false },
      { tekst: "bed", lidwoord: "het", meervoud: "bedden", afbeelding: false },
      { tekst: "land", lidwoord: "het", meervoud: "landen", afbeelding: false }
    ]
  },

  // ===== Lange klank + 2 medeklinkers (geen verenkeling, niets veranderen) =====
  "stukjes-lang-2mk-g2": {
    naam: "Lange klank + 2 medeklinkers",
    groep: "stukjeswoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Lange klank + 2 medeklinkers. Bij meervoud verandert er niets (paard → paarden, baard → baarden).",
    woorden: [
      // Sommige woorden staan ook in verlengen-tdpb-g2 — bewust dubbel.
      { tekst: "paard", lidwoord: "het", meervoud: "paarden", afbeelding: false },
      { tekst: "baard", lidwoord: "de", meervoud: "baarden", afbeelding: false },
      { tekst: "poort", lidwoord: "de", meervoud: "poorten", afbeelding: false },
      { tekst: "taart", lidwoord: "de", meervoud: "taarten", afbeelding: false },
      { tekst: "soort", lidwoord: "de", meervoud: "soorten", afbeelding: false },
      { tekst: "staart", lidwoord: "de", meervoud: "staarten", afbeelding: false },
      { tekst: "naald", lidwoord: "de", meervoud: "naalden", afbeelding: false },
      { tekst: "maand", lidwoord: "de", meervoud: "maanden", afbeelding: false }
    ]
  },

  // ===== Stukjeswoorden — direct schrijven bij plaatje (Type B) =====
  "stukjeswoorden-direct-g2": {
    naam: "Stukjeswoorden — direct schrijven",
    groep: "stukjeswoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Woorden waar de verdubbel- of verenkelregel al in de spelling zit. " +
                  "Kind schrijft het woord bij een plaatje en moet zelf de juiste spelling oproepen.",
    woorden: [
      // ===== VERDUBBELEN (korte klank → verdubbelde medeklinker zichtbaar) =====
      { tekst: "appel",   lidwoord: "de",  klanktype: "kort-verdubbeld", afbeelding: true },
      { tekst: "kikker",  lidwoord: "de",  klanktype: "kort-verdubbeld", afbeelding: true },
      { tekst: "ladder",  lidwoord: "de",  klanktype: "kort-verdubbeld", afbeelding: true },
      { tekst: "bakker",  lidwoord: "de",  klanktype: "kort-verdubbeld", afbeelding: true },
      { tekst: "kussen",  lidwoord: "het", klanktype: "kort-verdubbeld", afbeelding: true },

      // ===== VERENKELEN (lange klank → één medeklinker) =====
      { tekst: "hamer",   lidwoord: "de",  klanktype: "lang-verenkeld",  afbeelding: true },
      { tekst: "lepel",   lidwoord: "de",  klanktype: "lang-verenkeld",  afbeelding: true },
      { tekst: "meter",   lidwoord: "de",  klanktype: "lang-verenkeld",  afbeelding: true },
      { tekst: "zomer",   lidwoord: "de",  klanktype: "lang-verenkeld",  afbeelding: true },
      { tekst: "bezem",   lidwoord: "de",  klanktype: "lang-verenkeld",  afbeelding: true },
      { tekst: "kamer",   lidwoord: "de",  klanktype: "lang-verenkeld",  afbeelding: true },

      // ===== ZOALS JE HET HOORT (korte klank + 2 verschillende medeklinkers) =====
      { tekst: "wortel",  lidwoord: "de",  klanktype: "kort-2mk",        afbeelding: true },
      { tekst: "dokter",  lidwoord: "de",  klanktype: "kort-2mk",        afbeelding: true },
      { tekst: "sleutel", lidwoord: "de",  klanktype: "kort-2mk",        afbeelding: true },
      { tekst: "kelder",  lidwoord: "de",  klanktype: "kort-2mk",        afbeelding: true },
      { tekst: "masker",  lidwoord: "het", klanktype: "kort-2mk",        afbeelding: true }
    ]
  },


  /* ============================================================
     REGELWOORDEN — VERLENGINGSREGEL (t/d + p/b)
     ============================================================ */

  // ===== Verlengingsregel t-d twijfel =====
  "verlengen-td-g2": {
    naam: "Verlengen: t of d?",
    groep: "verlengen-tdpb",
    hoofdgroep: "regelwoord",
    beschrijving: "Verleng om te weten of je t of d schrijft: paart → paarden (paard), hont → honden (hond).",
    woorden: [
      // Behouden uit G1
      { tekst: "hand", lidwoord: "de", verlengd: "handen", twijfel: "t-d", afbeelding: false },
      { tekst: "hoed", lidwoord: "de", verlengd: "hoeden", twijfel: "t-d", afbeelding: false },
      { tekst: "tand", lidwoord: "de", verlengd: "tanden", twijfel: "t-d", afbeelding: false },
      { tekst: "bed", lidwoord: "het", verlengd: "bedden", twijfel: "t-d", afbeelding: false },
      { tekst: "hond", lidwoord: "de", verlengd: "honden", twijfel: "t-d", afbeelding: false },
      { tekst: "wind", lidwoord: "de", verlengd: "winden", twijfel: "t-d", afbeelding: false },
      { tekst: "land", lidwoord: "het", verlengd: "landen", twijfel: "t-d", afbeelding: false },
      { tekst: "mond", lidwoord: "de", verlengd: "monden", twijfel: "t-d", afbeelding: false },
      { tekst: "rand", lidwoord: "de", verlengd: "randen", twijfel: "t-d", afbeelding: false },
      { tekst: "baard", lidwoord: "de", verlengd: "baarden", twijfel: "t-d", afbeelding: false },
      { tekst: "poort", lidwoord: "de", verlengd: "poorten", twijfel: "t-d", afbeelding: false },
      { tekst: "taart", lidwoord: "de", verlengd: "taarten", twijfel: "t-d", afbeelding: false },
      { tekst: "paard", lidwoord: "het", verlengd: "paarden", twijfel: "t-d", afbeelding: false },
      // Nieuw G2
      { tekst: "vriend", lidwoord: "de", verlengd: "vrienden", twijfel: "t-d", afbeelding: false },
      { tekst: "pond", lidwoord: "het", verlengd: "ponden", twijfel: "t-d", afbeelding: false },
      { tekst: "soort", lidwoord: "de", verlengd: "soorten", twijfel: "t-d", afbeelding: false },
      { tekst: "start", lidwoord: "de", verlengd: "starten", twijfel: "t-d", afbeelding: false },
      { tekst: "post", lidwoord: "de", verlengd: "posten", twijfel: "t-d", afbeelding: false },
      { tekst: "markt", lidwoord: "de", verlengd: "markten", twijfel: "t-d", afbeelding: false },
      { tekst: "gezond", lidwoord: null, verlengd: "gezonder", twijfel: "t-d", afbeelding: false },
      { tekst: "stad", lidwoord: "de", verlengd: "steden", twijfel: "t-d", afbeelding: false }
    ]
  },

  // ===== Verlengingsregel p-b twijfel =====
  "verlengen-pb-g2": {
    naam: "Verlengen: p of b?",
    groep: "verlengen-tdpb",
    hoofdgroep: "regelwoord",
    beschrijving: "Verleng om te weten of je p of b schrijft: rip → ribben (rib), krap → krabben (krab).",
    woorden: [
      // Behouden uit G1
      { tekst: "krab", lidwoord: "de", verlengd: "krabben", twijfel: "p-b", afbeelding: false },
      { tekst: "web", lidwoord: "het", verlengd: "webben", twijfel: "p-b", afbeelding: false },
      { tekst: "rib", lidwoord: "de", verlengd: "ribben", twijfel: "p-b", afbeelding: false },
      { tekst: "trap", lidwoord: "de", verlengd: "trappen", twijfel: "p-b", afbeelding: false },
      { tekst: "step", lidwoord: "de", verlengd: "steppen", twijfel: "p-b", afbeelding: false },
      { tekst: "klap", lidwoord: "de", verlengd: "klappen", twijfel: "p-b", afbeelding: false },
      { tekst: "pop", lidwoord: "de", verlengd: "poppen", twijfel: "p-b", afbeelding: false },
      { tekst: "kip", lidwoord: "de", verlengd: "kippen", twijfel: "p-b", afbeelding: false },
      // Nieuw G2
      { tekst: "top", lidwoord: "de", verlengd: "toppen", twijfel: "p-b", afbeelding: false },
      { tekst: "klep", lidwoord: "de", verlengd: "kleppen", twijfel: "p-b", afbeelding: false },
      { tekst: "slip", lidwoord: "de", verlengd: "slippen", twijfel: "p-b", afbeelding: false },
      { tekst: "kop", lidwoord: "de", verlengd: "koppen", twijfel: "p-b", afbeelding: false },
      { tekst: "knop", lidwoord: "de", verlengd: "knoppen", twijfel: "p-b", afbeelding: false },
      { tekst: "lap", lidwoord: "de", verlengd: "lappen", twijfel: "p-b", afbeelding: false },
      { tekst: "slab", lidwoord: "de", verlengd: "slabben", twijfel: "p-b", afbeelding: false }
    ]
  },


  /* ============================================================
     REGELWOORDEN — VERKLEINWOORDEN (5 aparte categorieën)
     ============================================================ */

  "verklein-je-g2": {
    naam: "Verkleinwoord -je",
    groep: "verkleinwoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Standaardvorm: -je achter de meeste woorden (boek → boekje, huis → huisje).",
    woorden: [
      { tekst: "boek", lidwoord: "het", verklein: "boekje", uitgang: "je", afbeelding: false },
      { tekst: "huis", lidwoord: "het", verklein: "huisje", uitgang: "je", afbeelding: false },
      { tekst: "muis", lidwoord: "de", verklein: "muisje", uitgang: "je", afbeelding: false },
      { tekst: "neus", lidwoord: "de", verklein: "neusje", uitgang: "je", afbeelding: false },
      { tekst: "voet", lidwoord: "de", verklein: "voetje", uitgang: "je", afbeelding: false },
      { tekst: "vest", lidwoord: "het", verklein: "vestje", uitgang: "je", afbeelding: false },
      { tekst: "hand", lidwoord: "de", verklein: "handje", uitgang: "je", afbeelding: false },
      { tekst: "dorp", lidwoord: "het", verklein: "dorpje", uitgang: "je", afbeelding: false },
      { tekst: "buik", lidwoord: "de", verklein: "buikje", uitgang: "je", afbeelding: false },
      { tekst: "plant", lidwoord: "de", verklein: "plantje", uitgang: "je", afbeelding: false },
      { tekst: "doos", lidwoord: "de", verklein: "doosje", uitgang: "je", afbeelding: false },
      { tekst: "kast", lidwoord: "de", verklein: "kastje", uitgang: "je", afbeelding: false }
    ]
  },

  "verklein-tje-g2": {
    naam: "Verkleinwoord -tje",
    groep: "verkleinwoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Na lange klinker, -l, -n, -r of -w: -tje (stoel → stoeltje, auto → autootje).",
    woorden: [
      { tekst: "stoel", lidwoord: "de", verklein: "stoeltje", uitgang: "tje", afbeelding: false },
      { tekst: "deur", lidwoord: "de", verklein: "deurtje", uitgang: "tje", afbeelding: false },
      { tekst: "schoen", lidwoord: "de", verklein: "schoentje", uitgang: "tje", afbeelding: false },
      { tekst: "trein", lidwoord: "de", verklein: "treintje", uitgang: "tje", afbeelding: false },
      { tekst: "kraan", lidwoord: "de", verklein: "kraantje", uitgang: "tje", afbeelding: false },
      { tekst: "tuin", lidwoord: "de", verklein: "tuintje", uitgang: "tje", afbeelding: false },
      { tekst: "muur", lidwoord: "de", verklein: "muurtje", uitgang: "tje", afbeelding: false },
      { tekst: "broer", lidwoord: "de", verklein: "broertje", uitgang: "tje", afbeelding: false },
      { tekst: "auto", lidwoord: "de", verklein: "autootje", uitgang: "tje", afbeelding: false },
      { tekst: "koe", lidwoord: "de", verklein: "koetje", uitgang: "tje", afbeelding: false }
    ]
  },

  "verklein-pje-g2": {
    naam: "Verkleinwoord -pje",
    groep: "verkleinwoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Na -m met lange klank: -pje (boom → boompje, raam → raampje).",
    woorden: [
      { tekst: "boom", lidwoord: "de", verklein: "boompje", uitgang: "pje", afbeelding: false },
      { tekst: "duim", lidwoord: "de", verklein: "duimpje", uitgang: "pje", afbeelding: false },
      { tekst: "arm", lidwoord: "de", verklein: "armpje", uitgang: "pje", afbeelding: false },
      { tekst: "raam", lidwoord: "het", verklein: "raampje", uitgang: "pje", afbeelding: false },
      { tekst: "bloem", lidwoord: "de", verklein: "bloempje", uitgang: "pje", afbeelding: false },
      { tekst: "droom", lidwoord: "de", verklein: "droompje", uitgang: "pje", afbeelding: false },
      { tekst: "riem", lidwoord: "de", verklein: "riempje", uitgang: "pje", afbeelding: false }
    ]
  },

  "verklein-etje-g2": {
    naam: "Verkleinwoord -etje",
    groep: "verkleinwoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Korte klank + 1 medeklinker → verdubbel medeklinker + -etje (bal → balletje, man → mannetje).",
    woorden: [
      { tekst: "bel", lidwoord: "de", verklein: "belletje", uitgang: "etje", afbeelding: false },
      { tekst: "bal", lidwoord: "de", verklein: "balletje", uitgang: "etje", afbeelding: false },
      { tekst: "kam", lidwoord: "de", verklein: "kammetje", uitgang: "etje", afbeelding: false },
      { tekst: "ster", lidwoord: "de", verklein: "sterretje", uitgang: "etje", afbeelding: false },
      { tekst: "kar", lidwoord: "de", verklein: "karretje", uitgang: "etje", afbeelding: false },
      { tekst: "som", lidwoord: "de", verklein: "sommetje", uitgang: "etje", afbeelding: false },
      { tekst: "man", lidwoord: "de", verklein: "mannetje", uitgang: "etje", afbeelding: false },
      { tekst: "pan", lidwoord: "de", verklein: "pannetje", uitgang: "etje", afbeelding: false },
      { tekst: "pen", lidwoord: "de", verklein: "pennetje", uitgang: "etje", afbeelding: false },
      { tekst: "bom", lidwoord: "de", verklein: "bommetje", uitgang: "etje", afbeelding: false },
      { tekst: "vlam", lidwoord: "de", verklein: "vlammetje", uitgang: "etje", afbeelding: false },
      { tekst: "spin", lidwoord: "de", verklein: "spinnetje", uitgang: "etje", afbeelding: false },
      { tekst: "ring", lidwoord: "de", verklein: "ringetje", uitgang: "etje", afbeelding: false },
      { tekst: "jongen", lidwoord: "de", verklein: "jongetje", uitgang: "etje", afbeelding: false },
      { tekst: "tekening", lidwoord: "de", verklein: "tekeningetje", uitgang: "etje", afbeelding: false },
      { tekst: "regering", lidwoord: "de", verklein: "regeringetje", uitgang: "etje", afbeelding: false },
      { tekst: "oefening", lidwoord: "de", verklein: "oefeningetje", uitgang: "etje", afbeelding: false }
    ]
  },

  "verklein-kje-g2": {
    naam: "Verkleinwoord -kje",
    groep: "verkleinwoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Meerlettergrepig op -ing met klemtoon vooraan: g valt weg, -kje (koning → koninkje).",
    woorden: [
      { tekst: "koning", lidwoord: "de", verklein: "koninkje", uitgang: "kje", afbeelding: false },
      { tekst: "ketting", lidwoord: "de", verklein: "kettinkje", uitgang: "kje", afbeelding: false },
      { tekst: "pudding", lidwoord: "de", verklein: "puddinkje", uitgang: "kje", afbeelding: false },
      { tekst: "haring", lidwoord: "de", verklein: "harinkje", uitgang: "kje", afbeelding: false },
      { tekst: "penning", lidwoord: "de", verklein: "penninkje", uitgang: "kje", afbeelding: false },
      { tekst: "woning", lidwoord: "de", verklein: "woninkje", uitgang: "kje", afbeelding: false },
      { tekst: "zending", lidwoord: "de", verklein: "zendinkje", uitgang: "kje", afbeelding: false },
      { tekst: "landing", lidwoord: "de", verklein: "landinkje", uitgang: "kje", afbeelding: false },
      { tekst: "afdeling", lidwoord: "de", verklein: "afdelinkje", uitgang: "kje", afbeelding: false },
      { tekst: "redding", lidwoord: "de", verklein: "reddinkje", uitgang: "kje", afbeelding: false },
      { tekst: "mening", lidwoord: "de", verklein: "meninkje", uitgang: "kje", afbeelding: false },
      { tekst: "beweging", lidwoord: "de", verklein: "beweginkje", uitgang: "kje", afbeelding: false },
      { tekst: "paling", lidwoord: "de", verklein: "palinkje", uitgang: "kje", afbeelding: false },
      { tekst: "korting", lidwoord: "de", verklein: "kortinkje", uitgang: "kje", afbeelding: false },
      { tekst: "lading", lidwoord: "de", verklein: "ladinkje", uitgang: "kje", afbeelding: false },
      { tekst: "aardbeving", lidwoord: "de", verklein: "aardbevinkje", uitgang: "kje", afbeelding: false }
    ]
  },


  /* ============================================================
     REGELWOORDEN — MEERVOUDEN (4 aparte categorieën)
     ============================================================ */

  "meervoud-en-g2": {
    naam: "Meervoud op -en",
    groep: "meervouden",
    hoofdgroep: "regelwoord",
    beschrijving: "Standaard meervoud op -en (voet → voeten, hond → honden).",
    woorden: [
      { tekst: "voet", lidwoord: "de", meervoud: "voeten", uitgang: "en", afbeelding: false },
      { tekst: "hond", lidwoord: "de", meervoud: "honden", uitgang: "en", afbeelding: false },
      { tekst: "stoel", lidwoord: "de", meervoud: "stoelen", uitgang: "en", afbeelding: false },
      { tekst: "huis", lidwoord: "het", meervoud: "huizen", uitgang: "en", afbeelding: false },
      { tekst: "boek", lidwoord: "het", meervoud: "boeken", uitgang: "en", afbeelding: false },
      { tekst: "dief", lidwoord: "de", meervoud: "dieven", uitgang: "en", afbeelding: false },
      { tekst: "leeuw", lidwoord: "de", meervoud: "leeuwen", uitgang: "en", afbeelding: false },
      { tekst: "deur", lidwoord: "de", meervoud: "deuren", uitgang: "en", afbeelding: false },
      { tekst: "neus", lidwoord: "de", meervoud: "neuzen", uitgang: "en", afbeelding: false },
      { tekst: "muis", lidwoord: "de", meervoud: "muizen", uitgang: "en", afbeelding: false },
      { tekst: "trein", lidwoord: "de", meervoud: "treinen", uitgang: "en", afbeelding: false },
      { tekst: "tuin", lidwoord: "de", meervoud: "tuinen", uitgang: "en", afbeelding: false },
      { tekst: "schoen", lidwoord: "de", meervoud: "schoenen", uitgang: "en", afbeelding: false },
      { tekst: "plant", lidwoord: "de", meervoud: "planten", uitgang: "en", afbeelding: false },
      { tekst: "straat", lidwoord: "de", meervoud: "straten", uitgang: "en", afbeelding: false },
      { tekst: "boom", lidwoord: "de", meervoud: "bomen", uitgang: "en", afbeelding: false },
      { tekst: "kerk", lidwoord: "de", meervoud: "kerken", uitgang: "en", afbeelding: false },
      { tekst: "vriend", lidwoord: "de", meervoud: "vrienden", uitgang: "en", afbeelding: false },
      { tekst: "vraag", lidwoord: "de", meervoud: "vragen", uitgang: "en", afbeelding: false },
      { tekst: "koe", lidwoord: "de", meervoud: "koeien", uitgang: "en", afbeelding: false }
    ]
  },

  "meervoud-s-g2": {
    naam: "Meervoud op -s",
    groep: "meervouden",
    hoofdgroep: "regelwoord",
    beschrijving: "Na doffe klank (-el, -en, -er, -em) → meervoud op -s (moeder → moeders, winkel → winkels).",
    woorden: [
      { tekst: "moeder", lidwoord: "de", meervoud: "moeders", uitgang: "s", afbeelding: false },
      { tekst: "vader", lidwoord: "de", meervoud: "vaders", uitgang: "s", afbeelding: false },
      { tekst: "winkel", lidwoord: "de", meervoud: "winkels", uitgang: "s", afbeelding: false },
      { tekst: "vlinder", lidwoord: "de", meervoud: "vlinders", uitgang: "s", afbeelding: false },
      { tekst: "sleutel", lidwoord: "de", meervoud: "sleutels", uitgang: "s", afbeelding: false },
      { tekst: "dokter", lidwoord: "de", meervoud: "dokters", uitgang: "s", afbeelding: false },
      { tekst: "bakker", lidwoord: "de", meervoud: "bakkers", uitgang: "s", afbeelding: false },
      { tekst: "meester", lidwoord: "de", meervoud: "meesters", uitgang: "s", afbeelding: false },
      { tekst: "schipper", lidwoord: "de", meervoud: "schippers", uitgang: "s", afbeelding: false },
      { tekst: "kabel", lidwoord: "de", meervoud: "kabels", uitgang: "s", afbeelding: false },
      { tekst: "broer", lidwoord: "de", meervoud: "broers", uitgang: "s", afbeelding: false },
      { tekst: "kleuter", lidwoord: "de", meervoud: "kleuters", uitgang: "s", afbeelding: false },
      { tekst: "vijver", lidwoord: "de", meervoud: "vijvers", uitgang: "s", afbeelding: false },
      { tekst: "appel", lidwoord: "de", meervoud: "appels", uitgang: "s", afbeelding: false }
    ]
  },

  "meervoud-apostrof-g2": {
    naam: "Meervoud op -'s",
    groep: "meervouden",
    hoofdgroep: "regelwoord",
    beschrijving: "Na lange klinker (a/o/u/i/y): apostrof + s (baby → baby's, auto → auto's).",
    woorden: [
      { tekst: "baby", lidwoord: "de", meervoud: "baby's", uitgang: "'s", afbeelding: false },
      { tekst: "kiwi", lidwoord: "de", meervoud: "kiwi's", uitgang: "'s", afbeelding: false },
      { tekst: "auto", lidwoord: "de", meervoud: "auto's", uitgang: "'s", afbeelding: false },
      { tekst: "flamingo", lidwoord: "de", meervoud: "flamingo's", uitgang: "'s", afbeelding: false },
      { tekst: "paraplu", lidwoord: "de", meervoud: "paraplu's", uitgang: "'s", afbeelding: false },
      { tekst: "koala", lidwoord: "de", meervoud: "koala's", uitgang: "'s", afbeelding: false },
      { tekst: "foto", lidwoord: "de", meervoud: "foto's", uitgang: "'s", afbeelding: false },
      { tekst: "oma", lidwoord: "de", meervoud: "oma's", uitgang: "'s", afbeelding: false },
      { tekst: "opa", lidwoord: "de", meervoud: "opa's", uitgang: "'s", afbeelding: false },
      { tekst: "menu", lidwoord: "het", meervoud: "menu's", uitgang: "'s", afbeelding: false },
      { tekst: "cola", lidwoord: "de", meervoud: "cola's", uitgang: "'s", afbeelding: false },
      { tekst: "agenda", lidwoord: "de", meervoud: "agenda's", uitgang: "'s", afbeelding: false }
    ]
  },

  "meervoud-eren-g2": {
    naam: "Meervoud op -eren",
    groep: "meervouden",
    hoofdgroep: "regelwoord",
    beschrijving: "Onregelmatig — een klein lijstje woorden krijgt -eren (kind → kinderen).",
    woorden: [
      { tekst: "kind", lidwoord: "het", meervoud: "kinderen", uitgang: "eren", afbeelding: false },
      { tekst: "volk", lidwoord: "het", meervoud: "volkeren", uitgang: "eren", afbeelding: false },
      { tekst: "ei", lidwoord: "het", meervoud: "eieren", uitgang: "eren", afbeelding: false },
      { tekst: "kalf", lidwoord: "het", meervoud: "kalveren", uitgang: "eren", afbeelding: false }
    ]
  },


  /* ============================================================
     REGELWOORDEN — DOFFE KLANK IN VOORVOEGSEL (3 aparte)
     ============================================================ */

  "voorvoegsel-ge-g2": {
    naam: "Voorvoegsel ge-",
    groep: "doffe-klank-voorvoegsel",
    hoofdgroep: "regelwoord",
    beschrijving: "Doffe klank in voorvoegsel ge- (getal, gevaar, geheim).",
    woorden: [
      { tekst: "getal", lidwoord: "het", voorvoegsel: "ge", afbeelding: false },
      { tekst: "gevaar", lidwoord: "het", voorvoegsel: "ge", afbeelding: false },
      { tekst: "geheim", lidwoord: "het", voorvoegsel: "ge", afbeelding: false },
      { tekst: "gevoel", lidwoord: "het", voorvoegsel: "ge", afbeelding: false },
      { tekst: "gewicht", lidwoord: "het", voorvoegsel: "ge", afbeelding: false },
      { tekst: "gedachte", lidwoord: "de", voorvoegsel: "ge", afbeelding: false },
      { tekst: "gevecht", lidwoord: "het", voorvoegsel: "ge", afbeelding: false },
      { tekst: "gelukkig", lidwoord: null, voorvoegsel: "ge", afbeelding: false },
      { tekst: "gezond", lidwoord: null, voorvoegsel: "ge", afbeelding: false },
      { tekst: "gezellig", lidwoord: null, voorvoegsel: "ge", afbeelding: false }
    ]
  },

  "voorvoegsel-ver-g2": {
    naam: "Voorvoegsel ver-",
    groep: "doffe-klank-voorvoegsel",
    hoofdgroep: "regelwoord",
    beschrijving: "Doffe klank in voorvoegsel ver- (verhaal, verkeer, verjaardag).",
    woorden: [
      { tekst: "verhaal", lidwoord: "het", voorvoegsel: "ver", afbeelding: false },
      { tekst: "verkeer", lidwoord: "het", voorvoegsel: "ver", afbeelding: false },
      { tekst: "verjaardag", lidwoord: "de", voorvoegsel: "ver", afbeelding: false },
      { tekst: "verschil", lidwoord: "het", voorvoegsel: "ver", afbeelding: false },
      { tekst: "verandering", lidwoord: "de", voorvoegsel: "ver", afbeelding: false },
      { tekst: "verkoper", lidwoord: "de", voorvoegsel: "ver", afbeelding: false },
      { tekst: "vervelend", lidwoord: null, voorvoegsel: "ver", afbeelding: false },
      { tekst: "verkoudheid", lidwoord: "de", voorvoegsel: "ver", afbeelding: false },
      { tekst: "vergissing", lidwoord: "de", voorvoegsel: "ver", afbeelding: false },
      { tekst: "vertelling", lidwoord: "de", voorvoegsel: "ver", afbeelding: false }
    ]
  },

  "voorvoegsel-be-g2": {
    naam: "Voorvoegsel be-",
    groep: "doffe-klank-voorvoegsel",
    hoofdgroep: "regelwoord",
    beschrijving: "Doffe klank in voorvoegsel be- (begin, bezoek, belofte).",
    woorden: [
      { tekst: "begin", lidwoord: "het", voorvoegsel: "be", afbeelding: false },
      { tekst: "bezoek", lidwoord: "het", voorvoegsel: "be", afbeelding: false },
      { tekst: "belofte", lidwoord: "de", voorvoegsel: "be", afbeelding: false },
      { tekst: "besluit", lidwoord: "het", voorvoegsel: "be", afbeelding: false },
      { tekst: "beleefd", lidwoord: null, voorvoegsel: "be", afbeelding: false },
      { tekst: "bedoeling", lidwoord: "de", voorvoegsel: "be", afbeelding: false },
      { tekst: "belangrijk", lidwoord: null, voorvoegsel: "be", afbeelding: false },
      { tekst: "beweging", lidwoord: "de", voorvoegsel: "be", afbeelding: false },
      { tekst: "bekend", lidwoord: null, voorvoegsel: "be", afbeelding: false },
      { tekst: "bedrog", lidwoord: "het", voorvoegsel: "be", afbeelding: false }
    ]
  },


  /* ============================================================
     REGELWOORDEN — DOFFE KLANK IN ACHTERVOEGSEL (4 aparte)
     ============================================================ */

  "achtervoegsel-elen-g2": {
    naam: "Achtervoegsel -elen",
    groep: "doffe-klank-achtervoegsel",
    hoofdgroep: "regelwoord",
    beschrijving: "Doffe klank in werkwoorden op -elen (wandelen, mompelen, kabbelen).",
    woorden: [
      { tekst: "wandelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false },
      { tekst: "mompelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false },
      { tekst: "stempelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false },
      { tekst: "rommelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false },
      { tekst: "kibbelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false },
      { tekst: "wiebelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false },
      { tekst: "kabbelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false },
      { tekst: "kriebelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false },
      { tekst: "krabbelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false },
      { tekst: "knabbelen", lidwoord: null, achtervoegsel: "elen", afbeelding: false }
    ]
  },

  "achtervoegsel-eren-g2": {
    naam: "Achtervoegsel -eren",
    groep: "doffe-klank-achtervoegsel",
    hoofdgroep: "regelwoord",
    beschrijving: "Doffe klank in werkwoorden op -eren (fluisteren, glinsteren, knipperen).",
    woorden: [
      { tekst: "fluisteren", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "donderen", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "glinsteren", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "knipperen", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "slingeren", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "schitteren", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "sluimeren", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "wapperen", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "klepperen", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "peuteren", lidwoord: null, achtervoegsel: "eren", afbeelding: false },
      { tekst: "bladeren", lidwoord: null, achtervoegsel: "eren", afbeelding: false }
    ]
  },

  "achtervoegsel-ig-g2": {
    naam: "Achtervoegsel -ig",
    groep: "doffe-klank-achtervoegsel",
    hoofdgroep: "regelwoord",
    beschrijving: "Doffe klank in bijvoeglijke naamwoorden op -ig (gelukkig, handig, prachtig).",
    woorden: [
      { tekst: "gelukkig", lidwoord: null, achtervoegsel: "ig", afbeelding: false },
      { tekst: "handig", lidwoord: null, achtervoegsel: "ig", afbeelding: false },
      { tekst: "modderig", lidwoord: null, achtervoegsel: "ig", afbeelding: false },
      { tekst: "prachtig", lidwoord: null, achtervoegsel: "ig", afbeelding: false },
      { tekst: "machtig", lidwoord: null, achtervoegsel: "ig", afbeelding: false },
      { tekst: "stevig", lidwoord: null, achtervoegsel: "ig", afbeelding: false },
      { tekst: "rustig", lidwoord: null, achtervoegsel: "ig", afbeelding: false },
      { tekst: "schattig", lidwoord: null, achtervoegsel: "ig", afbeelding: false },
      { tekst: "kleurig", lidwoord: null, achtervoegsel: "ig", afbeelding: false },
      { tekst: "nuttig", lidwoord: null, achtervoegsel: "ig", afbeelding: false }
    ]
  },

  "achtervoegsel-lijk-g2": {
    naam: "Achtervoegsel -lijk",
    groep: "doffe-klank-achtervoegsel",
    hoofdgroep: "regelwoord",
    beschrijving: "Doffe klank in bijvoeglijke naamwoorden op -lijk (vrolijk, mogelijk, vriendelijk).",
    woorden: [
      { tekst: "vrolijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "mogelijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "vriendelijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "gemakkelijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "moeilijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "duidelijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "pijnlijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "werkelijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "eindelijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "gewoonlijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "belangrijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false },
      { tekst: "gevaarlijk", lidwoord: null, achtervoegsel: "lijk", afbeelding: false }
    ]
  },


  /* ============================================================
     WERKWOORDEN — volledig nieuw in graad 2

     Structuur per werkwoord:
     { tekst, type, stam, ott, vtt, ovt, vvt }

     Voor nu één gegroepeerde categorie per tijd. Splitsing in
     zwak/sterk/onregelmatig komt later wanneer we de werkwoord-OV's bouwen.
     ============================================================ */

  // ===== Werkwoorden in OTT =====
  "werkwoorden-ott-g2": {
    naam: "Werkwoorden in OTT",
    groep: "werkwoorden-ott",
    hoofdgroep: "werkwoord",
    beschrijving: "Vervoegen in de onvoltooid tegenwoordige tijd: stam + uitgang (ik werk, jij denkt, wij wandelen).",
    woorden: [
      // ===== ZWAKKE WERKWOORDEN =====
      { tekst: "werken", type: "zwak", stam: "werk",
        ott: { ik: "werk", jij: "werkt", hij: "werkt", wij: "werken", jullie: "werken", zij: "werken" } },
      { tekst: "wandelen", type: "zwak", stam: "wandel",
        ott: { ik: "wandel", jij: "wandelt", hij: "wandelt", wij: "wandelen", jullie: "wandelen", zij: "wandelen" } },
      { tekst: "luisteren", type: "zwak", stam: "luister",
        ott: { ik: "luister", jij: "luistert", hij: "luistert", wij: "luisteren", jullie: "luisteren", zij: "luisteren" } },
      { tekst: "fluisteren", type: "zwak", stam: "fluister",
        ott: { ik: "fluister", jij: "fluistert", hij: "fluistert", wij: "fluisteren", jullie: "fluisteren", zij: "fluisteren" } },
      { tekst: "spelen", type: "zwak", stam: "speel",
        ott: { ik: "speel", jij: "speelt", hij: "speelt", wij: "spelen", jullie: "spelen", zij: "spelen" } },
      { tekst: "praten", type: "zwak", stam: "praat",
        ott: { ik: "praat", jij: "praat", hij: "praat", wij: "praten", jullie: "praten", zij: "praten" } },
      { tekst: "wonen", type: "zwak", stam: "woon",
        ott: { ik: "woon", jij: "woont", hij: "woont", wij: "wonen", jullie: "wonen", zij: "wonen" } },
      { tekst: "dansen", type: "zwak", stam: "dans",
        ott: { ik: "dans", jij: "danst", hij: "danst", wij: "dansen", jullie: "dansen", zij: "dansen" } },
      { tekst: "leren", type: "zwak", stam: "leer",
        ott: { ik: "leer", jij: "leert", hij: "leert", wij: "leren", jullie: "leren", zij: "leren" } },
      { tekst: "fietsen", type: "zwak", stam: "fiets",
        ott: { ik: "fiets", jij: "fietst", hij: "fietst", wij: "fietsen", jullie: "fietsen", zij: "fietsen" } },
      { tekst: "maken", type: "zwak", stam: "maak",
        ott: { ik: "maak", jij: "maakt", hij: "maakt", wij: "maken", jullie: "maken", zij: "maken" } },
      { tekst: "branden", type: "zwak", stam: "brand",
        ott: { ik: "brand", jij: "brandt", hij: "brandt", wij: "branden", jullie: "branden", zij: "branden" } },
      { tekst: "horen", type: "zwak", stam: "hoor",
        ott: { ik: "hoor", jij: "hoort", hij: "hoort", wij: "horen", jullie: "horen", zij: "horen" } },
      { tekst: "kloppen", type: "zwak", stam: "klop",
        ott: { ik: "klop", jij: "klopt", hij: "klopt", wij: "kloppen", jullie: "kloppen", zij: "kloppen" } },
      { tekst: "stoppen", type: "zwak", stam: "stop",
        ott: { ik: "stop", jij: "stopt", hij: "stopt", wij: "stoppen", jullie: "stoppen", zij: "stoppen" } },
      { tekst: "antwoorden", type: "zwak", stam: "antwoord",
        ott: { ik: "antwoord", jij: "antwoordt", hij: "antwoordt", wij: "antwoorden", jullie: "antwoorden", zij: "antwoorden" } },

      // ===== STERKE WERKWOORDEN =====
      { tekst: "lopen", type: "sterk", stam: "loop",
        ott: { ik: "loop", jij: "loopt", hij: "loopt", wij: "lopen", jullie: "lopen", zij: "lopen" } },
      { tekst: "eten", type: "sterk", stam: "eet",
        ott: { ik: "eet", jij: "eet", hij: "eet", wij: "eten", jullie: "eten", zij: "eten" } },
      { tekst: "drinken", type: "sterk", stam: "drink",
        ott: { ik: "drink", jij: "drinkt", hij: "drinkt", wij: "drinken", jullie: "drinken", zij: "drinken" } },
      { tekst: "zien", type: "sterk", stam: "zie",
        ott: { ik: "zie", jij: "ziet", hij: "ziet", wij: "zien", jullie: "zien", zij: "zien" } },
      { tekst: "lezen", type: "sterk", stam: "lees",
        ott: { ik: "lees", jij: "leest", hij: "leest", wij: "lezen", jullie: "lezen", zij: "lezen" } },
      { tekst: "zingen", type: "sterk", stam: "zing",
        ott: { ik: "zing", jij: "zingt", hij: "zingt", wij: "zingen", jullie: "zingen", zij: "zingen" } },
      { tekst: "vliegen", type: "sterk", stam: "vlieg",
        ott: { ik: "vlieg", jij: "vliegt", hij: "vliegt", wij: "vliegen", jullie: "vliegen", zij: "vliegen" } },
      { tekst: "komen", type: "sterk", stam: "kom",
        ott: { ik: "kom", jij: "komt", hij: "komt", wij: "komen", jullie: "komen", zij: "komen" } },
      { tekst: "geven", type: "sterk", stam: "geef",
        ott: { ik: "geef", jij: "geeft", hij: "geeft", wij: "geven", jullie: "geven", zij: "geven" } },
      { tekst: "gaan", type: "sterk", stam: "ga",
        ott: { ik: "ga", jij: "gaat", hij: "gaat", wij: "gaan", jullie: "gaan", zij: "gaan" } },
      { tekst: "worden", type: "sterk", stam: "word",
        ott: { ik: "word", jij: "wordt", hij: "wordt", wij: "worden", jullie: "worden", zij: "worden" } },
      { tekst: "zwemmen", type: "sterk", stam: "zwem",
        ott: { ik: "zwem", jij: "zwemt", hij: "zwemt", wij: "zwemmen", jullie: "zwemmen", zij: "zwemmen" } },
      { tekst: "rijden", type: "sterk", stam: "rijd",
        ott: { ik: "rijd", jij: "rijdt", hij: "rijdt", wij: "rijden", jullie: "rijden", zij: "rijden" } },

      // ===== ONREGELMATIGE WERKWOORDEN =====
      { tekst: "hebben", type: "onregelmatig", stam: "heb",
        ott: { ik: "heb", jij: "hebt", hij: "heeft", wij: "hebben", jullie: "hebben", zij: "hebben" } },
      { tekst: "zijn", type: "onregelmatig", stam: "ben",
        ott: { ik: "ben", jij: "bent", hij: "is", wij: "zijn", jullie: "zijn", zij: "zijn" } }
    ]
  },

  // ===== Werkwoorden in VTT =====
  "werkwoorden-vtt-g2": {
    naam: "Werkwoorden in VTT",
    groep: "werkwoorden-vtt",
    hoofdgroep: "werkwoord",
    beschrijving: "Voltooid tegenwoordige tijd: hebben/zijn + voltooid deelwoord (ik heb gewerkt, ik ben gekomen).",
    woorden: [
      { tekst: "werken", type: "zwak", stam: "werk", deelwoord: "gewerkt", hulpww: ["hebben"] },
      { tekst: "wandelen", type: "zwak", stam: "wandel", deelwoord: "gewandeld", hulpww: ["hebben", "zijn"] },
      { tekst: "luisteren", type: "zwak", stam: "luister", deelwoord: "geluisterd", hulpww: ["hebben"] },
      { tekst: "fluisteren", type: "zwak", stam: "fluister", deelwoord: "gefluisterd", hulpww: ["hebben"] },
      { tekst: "spelen", type: "zwak", stam: "speel", deelwoord: "gespeeld", hulpww: ["hebben"] },
      { tekst: "praten", type: "zwak", stam: "praat", deelwoord: "gepraat", hulpww: ["hebben"] },
      { tekst: "wonen", type: "zwak", stam: "woon", deelwoord: "gewoond", hulpww: ["hebben"] },
      { tekst: "dansen", type: "zwak", stam: "dans", deelwoord: "gedanst", hulpww: ["hebben"] },
      { tekst: "leren", type: "zwak", stam: "leer", deelwoord: "geleerd", hulpww: ["hebben"] },
      { tekst: "fietsen", type: "zwak", stam: "fiets", deelwoord: "gefietst", hulpww: ["hebben", "zijn"] },
      { tekst: "maken", type: "zwak", stam: "maak", deelwoord: "gemaakt", hulpww: ["hebben"] },
      { tekst: "branden", type: "zwak", stam: "brand", deelwoord: "gebrand", hulpww: ["hebben"] },
      { tekst: "horen", type: "zwak", stam: "hoor", deelwoord: "gehoord", hulpww: ["hebben"] },
      { tekst: "kloppen", type: "zwak", stam: "klop", deelwoord: "geklopt", hulpww: ["hebben"] },
      { tekst: "stoppen", type: "zwak", stam: "stop", deelwoord: "gestopt", hulpww: ["hebben", "zijn"] },
      { tekst: "antwoorden", type: "zwak", stam: "antwoord", deelwoord: "geantwoord", hulpww: ["hebben"] },

      { tekst: "lopen", type: "sterk", stam: "loop", deelwoord: "gelopen", hulpww: ["hebben", "zijn"] },
      { tekst: "eten", type: "sterk", stam: "eet", deelwoord: "gegeten", hulpww: ["hebben"] },
      { tekst: "drinken", type: "sterk", stam: "drink", deelwoord: "gedronken", hulpww: ["hebben"] },
      { tekst: "zien", type: "sterk", stam: "zie", deelwoord: "gezien", hulpww: ["hebben"] },
      { tekst: "lezen", type: "sterk", stam: "lees", deelwoord: "gelezen", hulpww: ["hebben"] },
      { tekst: "zingen", type: "sterk", stam: "zing", deelwoord: "gezongen", hulpww: ["hebben"] },
      { tekst: "vliegen", type: "sterk", stam: "vlieg", deelwoord: "gevlogen", hulpww: ["hebben", "zijn"] },
      { tekst: "komen", type: "sterk", stam: "kom", deelwoord: "gekomen", hulpww: ["zijn"] },
      { tekst: "geven", type: "sterk", stam: "geef", deelwoord: "gegeven", hulpww: ["hebben"] },
      { tekst: "gaan", type: "sterk", stam: "ga", deelwoord: "gegaan", hulpww: ["zijn"] },
      { tekst: "worden", type: "sterk", stam: "word", deelwoord: "geworden", hulpww: ["zijn"] },
      { tekst: "zwemmen", type: "sterk", stam: "zwem", deelwoord: "gezwommen", hulpww: ["hebben", "zijn"] },
      { tekst: "rijden", type: "sterk", stam: "rijd", deelwoord: "gereden", hulpww: ["hebben", "zijn"] },

      { tekst: "hebben", type: "onregelmatig", stam: "heb", deelwoord: "gehad", hulpww: ["hebben"] },
      { tekst: "zijn", type: "onregelmatig", stam: "ben", deelwoord: "geweest", hulpww: ["zijn"] }
    ]
  },

  // ===== Zwakke werkwoorden in OVT =====
  "werkwoorden-ovt-zwak-g2": {
    naam: "Zwakke werkwoorden in OVT",
    groep: "werkwoorden-ovt-zwak",
    hoofdgroep: "werkwoord",
    beschrijving: "Verleden tijd zonder klankverandering: stam + de(n) of te(n) (ik werkte, wij wandelden).",
    woorden: [
      { tekst: "werken", type: "zwak", stam: "werk", uitgang_ovt: "te",
        ovt: { ik: "werkte", jij: "werkte", hij: "werkte", wij: "werkten", jullie: "werkten", zij: "werkten" } },
      { tekst: "wandelen", type: "zwak", stam: "wandel", uitgang_ovt: "de",
        ovt: { ik: "wandelde", jij: "wandelde", hij: "wandelde", wij: "wandelden", jullie: "wandelden", zij: "wandelden" } },
      { tekst: "luisteren", type: "zwak", stam: "luister", uitgang_ovt: "de",
        ovt: { ik: "luisterde", jij: "luisterde", hij: "luisterde", wij: "luisterden", jullie: "luisterden", zij: "luisterden" } },
      { tekst: "fluisteren", type: "zwak", stam: "fluister", uitgang_ovt: "de",
        ovt: { ik: "fluisterde", jij: "fluisterde", hij: "fluisterde", wij: "fluisterden", jullie: "fluisterden", zij: "fluisterden" } },
      { tekst: "spelen", type: "zwak", stam: "speel", uitgang_ovt: "de",
        ovt: { ik: "speelde", jij: "speelde", hij: "speelde", wij: "speelden", jullie: "speelden", zij: "speelden" } },
      { tekst: "praten", type: "zwak", stam: "praat", uitgang_ovt: "te",
        ovt: { ik: "praatte", jij: "praatte", hij: "praatte", wij: "praatten", jullie: "praatten", zij: "praatten" } },
      { tekst: "wonen", type: "zwak", stam: "woon", uitgang_ovt: "de",
        ovt: { ik: "woonde", jij: "woonde", hij: "woonde", wij: "woonden", jullie: "woonden", zij: "woonden" } },
      { tekst: "dansen", type: "zwak", stam: "dans", uitgang_ovt: "te",
        ovt: { ik: "danste", jij: "danste", hij: "danste", wij: "dansten", jullie: "dansten", zij: "dansten" } },
      { tekst: "leren", type: "zwak", stam: "leer", uitgang_ovt: "de",
        ovt: { ik: "leerde", jij: "leerde", hij: "leerde", wij: "leerden", jullie: "leerden", zij: "leerden" } },
      { tekst: "fietsen", type: "zwak", stam: "fiets", uitgang_ovt: "te",
        ovt: { ik: "fietste", jij: "fietste", hij: "fietste", wij: "fietsten", jullie: "fietsten", zij: "fietsten" } },
      { tekst: "maken", type: "zwak", stam: "maak", uitgang_ovt: "te",
        ovt: { ik: "maakte", jij: "maakte", hij: "maakte", wij: "maakten", jullie: "maakten", zij: "maakten" } },
      { tekst: "branden", type: "zwak", stam: "brand", uitgang_ovt: "de",
        ovt: { ik: "brandde", jij: "brandde", hij: "brandde", wij: "brandden", jullie: "brandden", zij: "brandden" } },
      { tekst: "horen", type: "zwak", stam: "hoor", uitgang_ovt: "de",
        ovt: { ik: "hoorde", jij: "hoorde", hij: "hoorde", wij: "hoorden", jullie: "hoorden", zij: "hoorden" } },
      { tekst: "kloppen", type: "zwak", stam: "klop", uitgang_ovt: "te",
        ovt: { ik: "klopte", jij: "klopte", hij: "klopte", wij: "klopten", jullie: "klopten", zij: "klopten" } },
      { tekst: "stoppen", type: "zwak", stam: "stop", uitgang_ovt: "te",
        ovt: { ik: "stopte", jij: "stopte", hij: "stopte", wij: "stopten", jullie: "stopten", zij: "stopten" } },
      { tekst: "antwoorden", type: "zwak", stam: "antwoord", uitgang_ovt: "de",
        ovt: { ik: "antwoordde", jij: "antwoordde", hij: "antwoordde", wij: "antwoordden", jullie: "antwoordden", zij: "antwoordden" } }
    ]
  },

  // ===== Sterke werkwoorden in OVT =====
  "werkwoorden-ovt-sterk-g2": {
    naam: "Sterke werkwoorden in OVT",
    groep: "werkwoorden-ovt-sterk",
    hoofdgroep: "werkwoord",
    beschrijving: "Verleden tijd met klankverandering, geen vaste regel (jij dacht, hij ging, jullie aten).",
    woorden: [
      { tekst: "lopen", type: "sterk", stam: "loop",
        ovt: { ik: "liep", jij: "liep", hij: "liep", wij: "liepen", jullie: "liepen", zij: "liepen" } },
      { tekst: "eten", type: "sterk", stam: "eet",
        ovt: { ik: "at", jij: "at", hij: "at", wij: "aten", jullie: "aten", zij: "aten" } },
      { tekst: "drinken", type: "sterk", stam: "drink",
        ovt: { ik: "dronk", jij: "dronk", hij: "dronk", wij: "dronken", jullie: "dronken", zij: "dronken" } },
      { tekst: "zien", type: "sterk", stam: "zie",
        ovt: { ik: "zag", jij: "zag", hij: "zag", wij: "zagen", jullie: "zagen", zij: "zagen" } },
      { tekst: "lezen", type: "sterk", stam: "lees",
        ovt: { ik: "las", jij: "las", hij: "las", wij: "lazen", jullie: "lazen", zij: "lazen" } },
      { tekst: "zingen", type: "sterk", stam: "zing",
        ovt: { ik: "zong", jij: "zong", hij: "zong", wij: "zongen", jullie: "zongen", zij: "zongen" } },
      { tekst: "vliegen", type: "sterk", stam: "vlieg",
        ovt: { ik: "vloog", jij: "vloog", hij: "vloog", wij: "vlogen", jullie: "vlogen", zij: "vlogen" } },
      { tekst: "komen", type: "sterk", stam: "kom",
        ovt: { ik: "kwam", jij: "kwam", hij: "kwam", wij: "kwamen", jullie: "kwamen", zij: "kwamen" } },
      { tekst: "geven", type: "sterk", stam: "geef",
        ovt: { ik: "gaf", jij: "gaf", hij: "gaf", wij: "gaven", jullie: "gaven", zij: "gaven" } },
      { tekst: "gaan", type: "sterk", stam: "ga",
        ovt: { ik: "ging", jij: "ging", hij: "ging", wij: "gingen", jullie: "gingen", zij: "gingen" } },
      { tekst: "worden", type: "sterk", stam: "word",
        ovt: { ik: "werd", jij: "werd", hij: "werd", wij: "werden", jullie: "werden", zij: "werden" } },
      { tekst: "zwemmen", type: "sterk", stam: "zwem",
        ovt: { ik: "zwom", jij: "zwom", hij: "zwom", wij: "zwommen", jullie: "zwommen", zij: "zwommen" } },
      { tekst: "rijden", type: "sterk", stam: "rijd",
        ovt: { ik: "reed", jij: "reed", hij: "reed", wij: "reden", jullie: "reden", zij: "reden" } },

      { tekst: "hebben", type: "onregelmatig", stam: "heb",
        ovt: { ik: "had", jij: "had", hij: "had", wij: "hadden", jullie: "hadden", zij: "hadden" } },
      { tekst: "zijn", type: "onregelmatig", stam: "ben",
        ovt: { ik: "was", jij: "was", hij: "was", wij: "waren", jullie: "waren", zij: "waren" } }
    ]
  },

  // ===== Werkwoorden in VVT =====
  "werkwoorden-vvt-g2": {
    naam: "Werkwoorden in VVT",
    groep: "werkwoorden-vvt",
    hoofdgroep: "werkwoord",
    beschrijving: "Voltooid verleden tijd: had/was + voltooid deelwoord (ik had gewerkt, ik was gekomen).",
    woorden: [
      { tekst: "werken", type: "zwak", stam: "werk", deelwoord: "gewerkt", hulpww_ovt: ["had"] },
      { tekst: "wandelen", type: "zwak", stam: "wandel", deelwoord: "gewandeld", hulpww_ovt: ["had", "was"] },
      { tekst: "luisteren", type: "zwak", stam: "luister", deelwoord: "geluisterd", hulpww_ovt: ["had"] },
      { tekst: "fluisteren", type: "zwak", stam: "fluister", deelwoord: "gefluisterd", hulpww_ovt: ["had"] },
      { tekst: "spelen", type: "zwak", stam: "speel", deelwoord: "gespeeld", hulpww_ovt: ["had"] },
      { tekst: "praten", type: "zwak", stam: "praat", deelwoord: "gepraat", hulpww_ovt: ["had"] },
      { tekst: "wonen", type: "zwak", stam: "woon", deelwoord: "gewoond", hulpww_ovt: ["had"] },
      { tekst: "dansen", type: "zwak", stam: "dans", deelwoord: "gedanst", hulpww_ovt: ["had"] },
      { tekst: "leren", type: "zwak", stam: "leer", deelwoord: "geleerd", hulpww_ovt: ["had"] },
      { tekst: "fietsen", type: "zwak", stam: "fiets", deelwoord: "gefietst", hulpww_ovt: ["had", "was"] },
      { tekst: "maken", type: "zwak", stam: "maak", deelwoord: "gemaakt", hulpww_ovt: ["had"] },
      { tekst: "branden", type: "zwak", stam: "brand", deelwoord: "gebrand", hulpww_ovt: ["had"] },
      { tekst: "horen", type: "zwak", stam: "hoor", deelwoord: "gehoord", hulpww_ovt: ["had"] },
      { tekst: "kloppen", type: "zwak", stam: "klop", deelwoord: "geklopt", hulpww_ovt: ["had"] },
      { tekst: "stoppen", type: "zwak", stam: "stop", deelwoord: "gestopt", hulpww_ovt: ["had", "was"] },
      { tekst: "antwoorden", type: "zwak", stam: "antwoord", deelwoord: "geantwoord", hulpww_ovt: ["had"] },

      { tekst: "lopen", type: "sterk", stam: "loop", deelwoord: "gelopen", hulpww_ovt: ["had", "was"] },
      { tekst: "eten", type: "sterk", stam: "eet", deelwoord: "gegeten", hulpww_ovt: ["had"] },
      { tekst: "drinken", type: "sterk", stam: "drink", deelwoord: "gedronken", hulpww_ovt: ["had"] },
      { tekst: "zien", type: "sterk", stam: "zie", deelwoord: "gezien", hulpww_ovt: ["had"] },
      { tekst: "lezen", type: "sterk", stam: "lees", deelwoord: "gelezen", hulpww_ovt: ["had"] },
      { tekst: "zingen", type: "sterk", stam: "zing", deelwoord: "gezongen", hulpww_ovt: ["had"] },
      { tekst: "vliegen", type: "sterk", stam: "vlieg", deelwoord: "gevlogen", hulpww_ovt: ["had", "was"] },
      { tekst: "komen", type: "sterk", stam: "kom", deelwoord: "gekomen", hulpww_ovt: ["was"] },
      { tekst: "geven", type: "sterk", stam: "geef", deelwoord: "gegeven", hulpww_ovt: ["had"] },
      { tekst: "gaan", type: "sterk", stam: "ga", deelwoord: "gegaan", hulpww_ovt: ["was"] },
      { tekst: "worden", type: "sterk", stam: "word", deelwoord: "geworden", hulpww_ovt: ["was"] },
      { tekst: "zwemmen", type: "sterk", stam: "zwem", deelwoord: "gezwommen", hulpww_ovt: ["had", "was"] },
      { tekst: "rijden", type: "sterk", stam: "rijd", deelwoord: "gereden", hulpww_ovt: ["had", "was"] },

      { tekst: "hebben", type: "onregelmatig", stam: "heb", deelwoord: "gehad", hulpww_ovt: ["had"] },
      { tekst: "zijn", type: "onregelmatig", stam: "ben", deelwoord: "geweest", hulpww_ovt: ["was"] }
    ]
  },


  /* ============================================================
     HOOFDLETTERS — uitbreiding L3 + L4
     ============================================================ */

  "hoofdletters-g2": {
    naam: "Hoofdletters & leestekens",
    groep: "hoofdletters",
    hoofdgroep: "regelwoord",
    beschrijving: "Hoofdletters bij zinsbegin, eigennamen, titels (L3) + aardrijkskundige namen, feestdagen, talen (L4).",
    woorden: [
      // ===== EIGENNAMEN PERSONEN =====
      { tekst: "Erwin", type_hl: "eigennaam", afbeelding: false },
      { tekst: "Anna", type_hl: "eigennaam", afbeelding: false },
      { tekst: "Sofie", type_hl: "eigennaam", afbeelding: false },
      { tekst: "Marie", type_hl: "eigennaam", afbeelding: false },
      { tekst: "Liam", type_hl: "eigennaam", afbeelding: false },
      { tekst: "Noa", type_hl: "eigennaam", afbeelding: false },
      { tekst: "Jan", type_hl: "eigennaam", afbeelding: false },
      { tekst: "Lotte", type_hl: "eigennaam", afbeelding: false },

      // ===== AARDRIJKSKUNDIGE NAMEN =====
      { tekst: "België", type_hl: "geografisch", afbeelding: false },
      { tekst: "Vlaanderen", type_hl: "geografisch", afbeelding: false },
      { tekst: "Brussel", type_hl: "geografisch", afbeelding: false },
      { tekst: "Antwerpen", type_hl: "geografisch", afbeelding: false },
      { tekst: "Gent", type_hl: "geografisch", afbeelding: false },
      { tekst: "Brugge", type_hl: "geografisch", afbeelding: false },
      { tekst: "Limburg", type_hl: "geografisch", afbeelding: false },
      { tekst: "Mechelen", type_hl: "geografisch", afbeelding: false },

      // ===== WINDSTREKEN =====
      { tekst: "Noord", type_hl: "windstreek", afbeelding: false },
      { tekst: "Zuid", type_hl: "windstreek", afbeelding: false },
      { tekst: "Oost", type_hl: "windstreek", afbeelding: false },
      { tekst: "West", type_hl: "windstreek", afbeelding: false },

      // ===== FEESTDAGEN =====
      { tekst: "Nieuwjaar", type_hl: "feestdag", afbeelding: false },
      { tekst: "Kerstmis", type_hl: "feestdag", afbeelding: false },
      { tekst: "Pasen", type_hl: "feestdag", afbeelding: false },
      { tekst: "Sinterklaas", type_hl: "feestdag", afbeelding: false },
      { tekst: "Halloween", type_hl: "feestdag", afbeelding: false },

      // ===== TALEN =====
      { tekst: "Nederlands", type_hl: "taal", afbeelding: false },
      { tekst: "Frans", type_hl: "taal", afbeelding: false },
      { tekst: "Engels", type_hl: "taal", afbeelding: false },
      { tekst: "Duits", type_hl: "taal", afbeelding: false },

      // ===== TITELS BOEKEN / FILMS =====
      { tekst: "De Smurfen", type_hl: "titel", afbeelding: false },
      { tekst: "Sjakie en de chocoladefabriek", type_hl: "titel", afbeelding: false },
      { tekst: "Toverberg", type_hl: "titel", afbeelding: false }
    ]
  },


  /* ============================================================
     L4-SPECIFIEK — ONTHOUDWOORDEN
     ============================================================ */

  // ===== Woorden op -teit en -heid =====
  "teit-heid-g2": {
    naam: "Woorden op -teit en -heid",
    groep: "teit-heid",
    hoofdgroep: "onthoudwoord",
    beschrijving: "Abstracte woorden met de uitgangen -teit (kwaliteit) en -heid (snelheid).",
    woorden: [
      // ===== -teit =====
      { tekst: "kwaliteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "identiteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "universiteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "activiteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "specialiteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "mentaliteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "realiteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "populariteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "autoriteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "elektriciteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "capaciteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "flexibiliteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "creativiteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "publiciteit", lidwoord: "de", uitgang: "teit", afbeelding: false },
      { tekst: "productiviteit", lidwoord: "de", uitgang: "teit", afbeelding: false },

      // ===== -heid =====
      { tekst: "vrijheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "gezondheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "snelheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "veiligheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "schoonheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "eenheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "waarheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "mensheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "wijsheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "moeheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "blijheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "dwaasheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "werkelijkheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "mogelijkheid", lidwoord: "de", uitgang: "heid", afbeelding: false },
      { tekst: "gelijkheid", lidwoord: "de", uitgang: "heid", afbeelding: false }
    ]
  },

  // ===== Leenwoorden =====
  "leenwoorden-g2": {
    naam: "Leenwoorden",
    groep: "leenwoorden",
    hoofdgroep: "onthoudwoord",
    beschrijving: "Woorden uit andere talen die we overnemen (agenda, game, cacao, koala).",
    woorden: [
      // ===== FRANS — eten en drinken =====
      { tekst: "aubergine", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "mayonaise", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "jus d'orange", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "champagne", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "croissant", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "dessert", lidwoord: "het", taal: "frans", afbeelding: false },
      // ===== FRANS — kleding en uiterlijk =====
      { tekst: "parfum", lidwoord: "het", taal: "frans", afbeelding: false },
      { tekst: "coiffeur", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "blouse", lidwoord: "de", taal: "frans", afbeelding: false },
      // ===== FRANS — wonen en interieur =====
      { tekst: "fauteuil", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "bureau", lidwoord: "het", taal: "frans", afbeelding: false },
      { tekst: "etalage", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "plafond", lidwoord: "het", taal: "frans", afbeelding: false },
      { tekst: "trottoir", lidwoord: "het", taal: "frans", afbeelding: false },
      { tekst: "vitrage", lidwoord: "de", taal: "frans", afbeelding: false },
      // ===== FRANS — vervoer en reizen =====
      { tekst: "garage", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "bagage", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "valies", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "route", lidwoord: "de", taal: "frans", afbeelding: false },
      { tekst: "station", lidwoord: "het", taal: "frans", afbeelding: false },
      { tekst: "perron", lidwoord: "het", taal: "frans", afbeelding: false },

      // ===== ENGELS — technologie =====
      { tekst: "e-mail", lidwoord: "de", taal: "engels", afbeelding: false },
      { tekst: "laptop", lidwoord: "de", taal: "engels", afbeelding: false },
      { tekst: "online", lidwoord: null, taal: "engels", afbeelding: false },
      { tekst: "chatten", lidwoord: null, taal: "engels", afbeelding: false },
      { tekst: "deadline", lidwoord: "de", taal: "engels", afbeelding: false },
      // ===== ENGELS — sport / vrije tijd =====
      { tekst: "goal", lidwoord: "de", taal: "engels", afbeelding: false },
      { tekst: "hockey", lidwoord: "het", taal: "engels", afbeelding: false },
      { tekst: "mountainbike", lidwoord: "de", taal: "engels", afbeelding: false },
      { tekst: "ticket", lidwoord: "het", taal: "engels", afbeelding: false },
      { tekst: "weekend", lidwoord: "het", taal: "engels", afbeelding: false },
      { tekst: "barbecueën", lidwoord: null, taal: "engels", afbeelding: false },
      // ===== ENGELS — dagelijks =====
      { tekst: "baby", lidwoord: "de", taal: "engels", afbeelding: false },
      { tekst: "manager", lidwoord: "de", taal: "engels", afbeelding: false },
      { tekst: "team", lidwoord: "het", taal: "engels", afbeelding: false },
      { tekst: "fluffy", lidwoord: null, taal: "engels", afbeelding: false },

      // ===== ITALIAANS / SPAANS =====
      { tekst: "pizza", lidwoord: "de", taal: "italiaans", afbeelding: false },
      { tekst: "spaghetti", lidwoord: "de", taal: "italiaans", afbeelding: false },
      { tekst: "macaroni", lidwoord: "de", taal: "italiaans", afbeelding: false },
      { tekst: "lasagne", lidwoord: "de", taal: "italiaans", afbeelding: false },
      { tekst: "cacao", lidwoord: "de", taal: "spaans", afbeelding: false },
      { tekst: "patio", lidwoord: "de", taal: "spaans", afbeelding: false },

      // ===== ANDERE TALEN =====
      { tekst: "koala", lidwoord: "de", taal: "australisch", afbeelding: false },
      { tekst: "kiwi", lidwoord: "de", taal: "maori", afbeelding: false },
      { tekst: "kangoeroe", lidwoord: "de", taal: "australisch", afbeelding: false },
      { tekst: "sushi", lidwoord: "de", taal: "japans", afbeelding: false },
      { tekst: "piranha", lidwoord: "de", taal: "braziliaans", afbeelding: false },
      { tekst: "chimpansee", lidwoord: "de", taal: "afrikaans", afbeelding: false }
    ]
  }

});