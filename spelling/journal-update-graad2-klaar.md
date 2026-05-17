# Journal-update: Spellinggenerator graad 2 — woordenbib KLAAR

Datum sessie: 17 mei 2026

## Wat is gedaan in deze sessie

### Volledig opgebouwd: `graad2.js`
**770 woorden over 23 categorieën**, allemaal verankerd in de L3/L4 leerplandoelen.

| Categorie | Aantal | Hoofdgroep |
|---|---|---|
| ng-nk-g2 | 31 | hoorwoord |
| sch-woorden-g2 | 18 | hoorwoord |
| schr-woorden-g2 (nieuw) | 8 | hoorwoord |
| clusters-g2 | 20 | hoorwoord |
| ei-ij-g2 | 49 | hoorwoord |
| au-ou-g2 | 36 | hoorwoord |
| aai-ooi-oei-eeuw-ieuw-uw-g2 | 50 | hoorwoord |
| ch-cht-gt-g2 | 34 | hoorwoord |
| doffe-klank-g2 | 39 | hoorwoord |
| verdubbel-verenkel-g2 | 30 | regelwoord |
| verlengen-tdpb-g2 | 36 | regelwoord |
| verkleinwoorden-g2 | 62 | regelwoord |
| meervouden-g2 | 50 | regelwoord |
| doffe-klank-voorvoegsel-g2 | 30 | regelwoord |
| doffe-klank-achtervoegsel-g2 | 43 | regelwoord |
| werkwoorden-ott-g2 | 31 | werkwoord (nieuw) |
| werkwoorden-vtt-g2 | 31 | werkwoord |
| werkwoorden-ovt-zwak-g2 | 16 | werkwoord |
| werkwoorden-ovt-sterk-g2 | 15 | werkwoord |
| werkwoorden-vvt-g2 | 31 | werkwoord |
| hoofdletters-g2 | 32 | regelwoord |
| teit-heid-g2 | 30 | onthoudwoord |
| leenwoorden-g2 | 48 | onthoudwoord |

### Aangepast: `woordenbibliotheek.js`
- Nieuwe hoofdgroep **werkwoord** toegevoegd (✍️ icoon)
- GROEP_VOLGORDE uitgebreid met alle nieuwe groepen
- groepLabels en hoofdgroepLabels uitgebreid
- "schr-woorden" als aparte groep toegevoegd

### Skelet aangemaakt: `dictee-zinnen-graad2.js`
- Lege containers per categorie
- Compatibel met bestaand `zoekVoor()` systeem (multi-graad ondersteuning werkt al)

## Belangrijke pedagogische beslissingen genomen

### Verkleinwoord-regels
- **-etje** voor: eenlettergrepige -ing/-ng (ring, jongen) + korte klank+lrmn die verdubbelt + suffix -ing als handeling (tekening → tekeningetje, regering → regeringetje, oefening → oefeningetje)
- **-kje** voor: meerlettergrepige -ing waar -ing onderdeel is van het woord, g valt weg (koning → koninkje, woning → woninkje, beweging → beweginkje)

### Verlengingsregel
- Velden: `tekst`, `verlengd`, `twijfel: "t-d" | "p-b"`
- 21 t/d woorden + 15 p/b woorden = 36 totaal
- Inclusief klinker-wisseling stad → steden

### Meervouden — 4 uitgangen
- `uitgang`-veld: "en" / "s" / "'s" / "eren"
- -'s vooral leenwoorden met lange klank op einde (baby's, auto's, agenda's)
- -eren onregelmatig (kind, volk, ei, kalf)

### Werkwoorden — 31 totaal
- **Zwak (16)**: werken, wandelen, luisteren, fluisteren, spelen, praten, wonen, dansen, leren, fietsen, maken, branden, horen, kloppen, stoppen, antwoorden
- **Sterk (13)**: lopen, eten, drinken, zien, lezen, zingen, vliegen, komen, geven, gaan, worden, zwemmen, rijden (worden hoort bij sterk, niet onregelmatig)
- **Onregelmatig (2)**: hebben, zijn

Datastructuur per werkwoord:
- OTT: 6 persoonsvormen (ik/jij/hij/wij/jullie/zij)
- VTT/VVT: `deelwoord` + `hulpww`/`hulpww_ovt` als array (lopen=["hebben","zijn"])
- OVT zwak: 6 persoonsvormen + `uitgang_ovt: "te"|"de"` ('t kofschip)
- OVT sterk: 6 persoonsvormen (klankverandering)

7 werkwoorden krijgen beide hulpwerkwoorden: wandelen, fietsen, stoppen, lopen, vliegen, zwemmen, rijden

### Hoofdletters
- `type_hl`-veld: "eigennaam", "geografisch", "windstreek", "feestdag", "taal", "titel"
- 32 voorbeelden over 6 types

### Leenwoorden
- `taal`-veld: "frans" (21), "engels" (15), "italiaans" (4), "spaans" (2), "australisch" (2), "maori" (1), "japans" (1), "braziliaans" (1), "afrikaans" (1)
- 48 woorden totaal
- chauffeur expliciet NIET opgenomen (3de graad omdat au niet meer hoorbaar)

## Wat is NIET gedaan / staat open

### Fase 1: Graad 2 zichtbaar maken in app (snel)
- index.html aanpassen: `<script src="woordenbiblio/graad2.js">` toevoegen
- index.html aanpassen: `<script src="dictee-zinnen-graad2.js">` toevoegen
- Testen of graad-2-tab werkt in zijbalk
- Visueel valideren: 23 categorieën zichtbaar, gegroepeerd per hoofdgroep

### Fase 2: Bestaande OV's compatibel maken
- **OV07 Verkleinwoord** uitbreiden met -etje + -kje filters
- **OV08 Meervoud** uitbreiden met -'s + -eren filters
- **OV verlengingsregel** check of p/b twijfel werkt (was alleen t/d in G1)
- **OV verdubbel-verenkel** check met G2 data

### Fase 3: Werkwoord-OV's bouwen (5 nieuwe)
- **OV11 OTT-vervoegen**: vervoeg "werken" voor ik/jij/hij/wij/jullie/zij
- **OV12 VTT**: "ik heb ___ (gewerkt)"
- **OV13 OVT zwak**: 't kofschip toepassen
- **OV14 OVT sterk**: klankverandering memoriseren
- **OV15 VVT**: had/was + deelwoord

Belangrijk: werkwoord-OV's hebben **geen PNG nodig** (scheelt veel werk!)

### Fase 4: Resterende OV's
- **OV hoofdletters**: zinnen met fouten waar kind hoofdletters moet aanvinken
- **OV leenwoorden**: pure memorisatie (woordzoeker? matching met taal?)
- **OV -teit/-heid**: keuze tussen 2 uitgangen

### Fase 5: Dictee-zinnen invullen
- Voor 770 woorden zin schrijven (groot werk, kan stapsgewijs)
- Werkwoord-zin-templates met persoonsvorm-placeholder
- Auto-sjabloon werkt al als fallback

## Belangrijke design-keuzes voor volgende sessies

### Werkwoord-OV's: datastructuur uitdaging
De woorden in werkwoord-categorieën hebben **rijke objecten** (geen simpele `tekst` + `lidwoord`):
```js
{ tekst: "werken", type: "zwak", stam: "werk",
  ott: { ik: "werk", jij: "werkt", hij: "werkt", wij: "werken", jullie: "werken", zij: "werken" } }
```

OV-modules moeten dit kunnen lezen. Mogelijk template-prompts:
- "Vervoeg 'werken' in de tegenwoordige tijd: ik ___, jij ___, hij ___"
- "Vul aan: gisteren ___ ik in de tuin. (werken)"
- Drag-drop matching: werkwoord → juiste deelwoord

### Hoofdletter-OV: andere oefenvormen nodig
Niet één-woord-invullen maar volzin-oefeningen:
- "in belgië woont anna in antwerpen." → kind plaatst hoofdletters
- "vandaag is het maandag" → past hoofdletter aan begin toe

## Bestanden in deze sessie aangepast

In `/mnt/user-data/outputs/`:
- `graad2.js` — KLAAR, 770 woorden
- `woordenbibliotheek.js` — KLAAR met werkwoord-hoofdgroep
- `dictee-zinnen-graad2.js` — skelet leeg

## Concrete volgende stap

Begin met **Fase 1**: index.html aanpassen om graad 2-scripts te laden en zichtbaarheid te testen in de zijbalk. Dat is de snelste manier om visuele validatie te krijgen voor we OV-werk doen.
