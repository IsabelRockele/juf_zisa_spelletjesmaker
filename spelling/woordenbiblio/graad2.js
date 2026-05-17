/* ==========================================================
   woordenbiblio/graad2.js
   Woordenset voor graad 2 (derde + vierde leerjaar)
   
   Gebaseerd op de leerplandoelen voor schrijven L3 en L4:
   - Hoorwoord-categorieën: herhalen + uitbreiden met moeilijkere woorden
   - Regelwoorden: bestaande regels + nieuwe uitbreidingen (-etje, -kje, -'s, -eren)
   - Werkwoorden: volledig nieuw (OTT, VTT, OVT zwak/sterk, VVT)
   - Doffe klank in voor-/achtervoegsels: volledig nieuw
   - L4-specifiek: -teit/-heid, leenwoorden
   ========================================================== */
window.SpellingWoordenbibliotheek.registreerGraad(2, {

  /* ============================================================
     HOORWOORDEN — herhalen uit graad 1 + uitbreiden
     ============================================================ */

  // ===== ng / nk woorden =====
  "ng-nk-g2": {
    naam: "ng / nk woorden",
    groep: "ng-nk",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -ng of -nk, klank goed leren onderscheiden.",
    woorden: [
      // TODO: woorden invullen
    ]
  },

  // ===== sch- woorden =====
  "sch-woorden-g2": {
    naam: "sch-woorden",
    groep: "sch-woorden",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met de sch-klank, in begin, midden of einde.",
    woorden: [
      // TODO: woorden invullen
    ]
  },

  // ===== Clusters: meerdere medeklinkers in het midden =====
  "clusters-g2": {
    naam: "Medeklinkerclusters",
    groep: "clusters",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met meerdere medeklinkers in het midden (masker, kasteel, onder).",
    woorden: [
      // TODO: woorden invullen
    ]
  },

  // ===== ei / ij woorden =====
  "ei-ij-g2": {
    naam: "ei / ij woorden",
    groep: "ei-ij",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met ei of ij — beide klinken hetzelfde, schrijven onthouden.",
    woorden: [
      // TODO: woorden invullen
    ]
  },

  // ===== au / ou woorden =====
  "au-ou-g2": {
    naam: "au / ou woorden",
    groep: "au-ou",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met au of ou — beide klinken hetzelfde, schrijven onthouden.",
    woorden: [
      // TODO: woorden invullen
    ]
  },

  // ===== aai / ooi / oei / eeuw / ieuw / uw =====
  "aai-ooi-oei-eeuw-ieuw-uw-g2": {
    naam: "aai / ooi / oei / eeuw / ieuw / uw",
    groep: "aai-ooi-oei-eeuw-ieuw-uw",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met de samengestelde klinker-medeklinker combinaties.",
    woorden: [
      // TODO: woorden invullen
    ]
  },

  // ===== ch / cht / gt =====
  "ch-cht-gt-g2": {
    naam: "ch / cht / gt woorden",
    groep: "ch-cht-gt",
    hoofdgroep: "hoorwoord",
    beschrijving: "Woorden met -ch, -cht of -gt — klank vs spelling onderscheiden.",
    woorden: [
      // TODO: woorden invullen
    ]
  },

  // ===== Doffe klank in onbeklemtoonde lettergrepen =====
  "doffe-klank-g2": {
    naam: "Doffe klank",
    groep: "doffe-klank",
    hoofdgroep: "hoorwoord",
    beschrijving: "Doffe klank in onbeklemtoonde lettergrepen (dokter, havik, avond, datum).",
    woorden: [
      // TODO: woorden invullen
    ]
  },


  /* ============================================================
     REGELWOORDEN — bestaande regels + uitbreidingen
     ============================================================ */

  // ===== Verdubbelingsregel =====
  "verdubbel-verenkel-g2": {
    naam: "Verdubbelaars / Verenkelaars",
    groep: "verdubbel-verenkel",
    hoofdgroep: "regelwoord",
    beschrijving: "Regel: korte klank vóór medeklinker → verdubbelen (teller, passer). Lange klank → verenkelen (kamer, lepel).",
    woorden: [
      // TODO: woorden invullen
    ]
  },

  // ===== Verlengingsregel (t/d + p/b uitbreiding) =====
  "verlengen-tdpb-g2": {
    naam: "Verlengingsregel (t/d + p/b)",
    groep: "verlengen-tdpb",
    hoofdgroep: "regelwoord",
    beschrijving: "Verleng om te weten of je t/d of p/b schrijft: paart → paarden (paard), rip → ribben (rib).",
    woorden: [
      // TODO: woorden invullen — telkens grondvorm + verlengvorm
      // Voorbeeld structuur: { tekst: "paard", verlengvorm: "paarden", twijfel: "t-d" }
      //                     { tekst: "rib", verlengvorm: "ribben", twijfel: "p-b" }
    ]
  },

  // ===== Verkleinwoorden (incl. -etje en -kje) =====
  "verkleinwoorden-g2": {
    naam: "Verkleinwoorden",
    groep: "verkleinwoorden",
    hoofdgroep: "regelwoord",
    beschrijving: "Verkleinwoorden op -je, -tje, -pje, -etje en -kje (onregelmatig).",
    woorden: [
      // TODO: woorden invullen — telkens grondwoord + verkleinwoord + uitgang
      // Voorbeeld: { tekst: "som", verkleinwoord: "sommetje", uitgang: "etje" }
      //           { tekst: "koning", verkleinwoord: "koninkje", uitgang: "kje" }
    ]
  },

  // ===== Meervouden (incl. -'s en -eren) =====
  "meervouden-g2": {
    naam: "Meervouden",
    groep: "meervouden",
    hoofdgroep: "regelwoord",
    beschrijving: "Meervouden op -en, -s, -'s en -eren (kind → kinderen).",
    woorden: [
      // TODO: woorden invullen — telkens enkelvoud + meervoud + uitgang
      // Voorbeeld: { tekst: "agenda", meervoud: "agenda's", uitgang: "'s" }
      //           { tekst: "kind", meervoud: "kinderen", uitgang: "eren" }
    ]
  },

  // ===== Doffe klank in voorvoegsel =====
  "doffe-klank-voorvoegsel-g2": {
    naam: "Doffe klank in voorvoegsel",
    groep: "doffe-klank-voorvoegsel",
    hoofdgroep: "regelwoord",
    beschrijving: "Doffe klank in voorvoegsels ge-, ver-, be- (gelopen, verkocht, beslapen).",
    woorden: [
      // TODO: woorden invullen
      // Voorbeeld: { tekst: "gelopen", grondwoord: "lopen", voorvoegsel: "ge" }
    ]
  },

  // ===== Doffe klank in achtervoegsel =====
  "doffe-klank-achtervoegsel-g2": {
    naam: "Doffe klank in achtervoegsel",
    groep: "doffe-klank-achtervoegsel",
    hoofdgroep: "regelwoord",
    beschrijving: "Doffe klank in achtervoegsels -elen, -eren, -ig, -lijk (wandelen, fluisteren, gelukkig, vriendelijk).",
    woorden: [
      // TODO: woorden invullen
      // Voorbeeld: { tekst: "wandelen", grondwoord: "wandel", achtervoegsel: "elen" }
    ]
  },


  /* ============================================================
     WERKWOORDEN — volledig nieuw in graad 2
     
     Structuur per werkwoord:
     {
       tekst: "werken",         // infinitief
       type: "zwak",            // "zwak" | "sterk" | "onregelmatig"
       stam: "werk",
       
       // OTT (Onvoltooid Tegenwoordige Tijd)
       ott: {
         ik: "werk", jij: "werkt", hij: "werkt",
         wij: "werken", jullie: "werken", zij: "werken"
       },
       
       // VTT (Voltooid Tegenwoordige Tijd) — hulpww + voltooid deelwoord
       vtt: { hulpww: "hebben", deelwoord: "gewerkt" },
       
       // OVT (Onvoltooid Verleden Tijd)
       ovt: {
         ik: "werkte", jij: "werkte", hij: "werkte",
         wij: "werkten", jullie: "werkten", zij: "werkten"
       },
       
       // VVT (Voltooid Verleden Tijd) — hulpww OVT + voltooid deelwoord
       vvt: { hulpww: "hebben", deelwoord: "gewerkt" }
     }
     ============================================================ */

  // ===== Werkwoorden in OTT =====
  "werkwoorden-ott-g2": {
    naam: "Werkwoorden in OTT",
    groep: "werkwoorden-ott",
    hoofdgroep: "werkwoord",
    beschrijving: "Vervoegen in de onvoltooid tegenwoordige tijd: stam + uitgang (ik werk, jij denkt, wij wandelen).",
    woorden: [
      // TODO: werkwoorden invullen
    ]
  },

  // ===== Werkwoorden in VTT =====
  "werkwoorden-vtt-g2": {
    naam: "Werkwoorden in VTT",
    groep: "werkwoorden-vtt",
    hoofdgroep: "werkwoord",
    beschrijving: "Voltooid tegenwoordige tijd: hebben/zijn + voltooid deelwoord (ik heb gewerkt, ik ben gekomen).",
    woorden: [
      // TODO: werkwoorden invullen
    ]
  },

  // ===== Zwakke werkwoorden in OVT =====
  "werkwoorden-ovt-zwak-g2": {
    naam: "Zwakke werkwoorden in OVT",
    groep: "werkwoorden-ovt-zwak",
    hoofdgroep: "werkwoord",
    beschrijving: "Verleden tijd zonder klankverandering: stam + de(n) of te(n) (ik werkte, wij wandelden).",
    woorden: [
      // TODO: werkwoorden invullen
    ]
  },

  // ===== Sterke werkwoorden in OVT =====
  "werkwoorden-ovt-sterk-g2": {
    naam: "Sterke werkwoorden in OVT",
    groep: "werkwoorden-ovt-sterk",
    hoofdgroep: "werkwoord",
    beschrijving: "Verleden tijd met klankverandering, geen vaste regel (jij dacht, hij ging, jullie aten).",
    woorden: [
      // TODO: werkwoorden invullen
    ]
  },

  // ===== Werkwoorden in VVT =====
  "werkwoorden-vvt-g2": {
    naam: "Werkwoorden in VVT",
    groep: "werkwoorden-vvt",
    hoofdgroep: "werkwoord",
    beschrijving: "Voltooid verleden tijd: had/was + voltooid deelwoord (ik had gewerkt, ik was gekomen).",
    woorden: [
      // TODO: werkwoorden invullen
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
      // TODO: woorden invullen
    ]
  },


  /* ============================================================
     L4-SPECIFIEK
     ============================================================ */

  // ===== Woorden op -teit en -heid =====
  "teit-heid-g2": {
    naam: "Woorden op -teit en -heid",
    groep: "teit-heid",
    hoofdgroep: "onthoudwoord",
    beschrijving: "Abstracte woorden met de uitgangen -teit (kwaliteit) en -heid (snelheid).",
    woorden: [
      // TODO: woorden invullen
    ]
  },

  // ===== Leenwoorden =====
  "leenwoorden-g2": {
    naam: "Leenwoorden",
    groep: "leenwoorden",
    hoofdgroep: "onthoudwoord",
    beschrijving: "Woorden uit andere talen die we overnemen (agenda, game, cacao, koala).",
    woorden: [
      // TODO: woorden invullen
    ]
  }

});