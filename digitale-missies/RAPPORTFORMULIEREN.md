# ICT-observatieformulieren en oefenrondes

## Aanpassing: papier naast de iPad

Slimme systemen is uitsluitend bereikbaar via **Voor de leerkracht → Slimme systemen: A5-opdrachtkaarten afdrukken**. De kinder-tegel is verwijderd. De QR-route bevat deze papieropdrachten niet, ook niet wanneer hun doelen op het rapportformulier staan. Geef daarvoor de papieren kaart mee. Er zijn vier verschillende kaarten voor 6–7 en vier voor 7–8, telkens met pictogrammen per stap. Elk leeftijdspakket bestaat als echte A5-pagina's (148 × 210 mm) en als twee kaarten op liggend A4 met kniplijn. Druk 100%, enkelzijdig af.

De blanco observatieformulieren zijn de gewone werkwijze: afdrukken, meekijken en bollen/feedback op papier aankruisen. Optioneel digitaal invullen blijft beschikbaar. De afbeeldingen en tekst van alle acht kaarten zijn visueel nagekeken in de gerenderde PDF's.

De Zoekexpeditie bevat alleen echte externe zoekopdrachten. De leerling kiest Schooltv of Jeugdbieb, typt de gegeven zoekterm op die website, opent twee echte resultaten en legt de bronkeuze uit. De terugkeerknop levert geen automatisch bewijs op. In de QR-route gebruiken zoeken en bronkeuze dezelfde echte zoekopdrachten.

Bronnen gecontroleerd op 17 september 2026: [Schooltv primair onderwijs](https://schooltv.nl/onderwijsvorm/primair-onderwijs), [Jeugdbieb](https://www.jeugdbieb.nl/), [WikiKids](https://wikikids.nl/). WikiKids noemt 8–15 jaar als doelgroep en is daarom geen standaard zoekkeuze voor deze 6–8-route. Schooltv en Jeugdbieb bedienen meerdere leeftijden: de leerkracht helpt met leeftijdskeuze, leest zo nodig voor en controleert de resultaten vooraf. Er wordt geen universele leeftijdsgeschiktheid van elk resultaat beloofd.

De overige secties hieronder beschrijven ook de eerdere mogelijkheden. Waar deze afwijken, geldt bovenstaande papierwerkwijze.

Open **Voor de leerkracht → Observatieformulieren & QR**. De formulieren staan in `rapport.html` en werken zonder leerlingaccounts. Inloggen of automatisch leerlinggegevens bijhouden is niet nodig.

## Jaarvoorstellen

Er zijn aparte voorstellen voor 6–7 en 7–8 jaar, elk met een keuze tussen 3 en 4 rapportperiodes. De periodeverdeling is een voorstel, geen voorschrift uit het leerplan. Alle 19 respectievelijk 20 broncodes zijn opgenomen. Een concrete observatiehandeling kan meerdere codes combineren.

| Aantal rapporten | Periode | Accent |
|---|---|---|
| 3 | 1 | App- en mediabediening, typen, digitaal of rechtstreeks werken |
| 3 | 2 | Invoer/verwerking/uitvoer, pijlenplannen lezen, maken en verbeteren |
| 3 | 3 | Zoeken, bronnen vergelijken, passende tools kiezen en eigen werk maken |
| 4 | 1 | Toestelbediening, materiaalzorg en samenwerkafspraken |
| 4 | 2 | Typen, informatieverwerking en pijlenplannen herkennen |
| 4 | 3 | Pijlenplannen maken, zoeken en bruikbare bronnen kiezen |
| 4 | 4 | Passende apps kiezen, een boodschap maken, controleren en verbeteren |

Materiaalzorg en gezond/sociaal mediagebruik komen in elke periode terug. Voor 7–8 komt bestandsbeheer erbij: herkennen via openen, betekenisvol benoemen/bewaren/sluiten/heropenen, en gericht een oefenkopie verwijderen. Bij 3 rapporten valt dit achtereenvolgens in periodes 1, 2 en 3; bij 4 rapporten in 2, 3 en 4. In 6–7 zijn internetwerking en de functie van een zoektool expliciet opgenomen.

De leerkracht kan doelen aan een periode toevoegen of eruit halen. Elke combinatie van leeftijd, aantal rapporten en rapportperiode bewaart tijdens het invullen haar eigen beoordelingen. Een wijziging van de indeling neemt geen beoordelingen automatisch mee.

## Observeren en feedback

- Rood: lukt nog niet.
- Geel: lukt met hulp.
- Groen: lukt zelfstandig.
- Blauw: lukt zelfstandig in een andere situatie.
- Leeg: niet geobserveerd, geen beoordeling op het rapport.

Blauw is geen verplicht leerplanniveau. Begeleiding bij het ontwerpen van een algoritme en aangereikte zoekwoorden horen bij de leerplandoelen. De concrete kijkpunten benoemen dit. De leerkracht kan context, hulp en observatiedatum noteren.

Na een beoordeling verschijnen een positieve feedbackzin, een oefenzin en ruimte voor eigen tekst. Er wordt niets automatisch geselecteerd op basis van een kleur. De rapportbijlage bevat alleen geobserveerde doelen en gekozen feedback. De interne observatienotitie wordt niet naar de ouderbijlage gekopieerd.

Beschikbaar: blanco observatieblad (ook met feedbackvakjes), ingevuld observatieblad, rapportbijlage en kopieerbare rapporttekst. De afdrukknop opent een schone weergave met een eigen knop voor afdrukken of bewaren als PDF. Blanco afdrukken bevatten geen leerlingnaam, beoordeling of ingevulde feedback.

Bewaren is expliciet: lokaal op de laptop of via een downloadbaar JSON-formulier. Een download kan opnieuw worden geopend; de inhoud wordt gevalideerd. Er is geen uploadsysteem voor rapportgegevens. De QR-code bevat nooit namen, feedback of kleuren.

## QR en publicatie

De QR-code verwijst naar het online adres, met leeftijd, aantal periodes, gekozen periode en publieke activiteit-ID’s. Aangepaste doelkeuzes worden meegenomen. De leerling krijgt passende opdrachtkaarten en geen beoordelingsformulier. Bij bestandsbeheer volgt op de oefenhandeling ook een begeleide handeling in de echte iPad-app.

De QR-bibliotheek is lokaal meegeleverd: qrcode-generator 1.4.4, Kazuhiko Arase, MIT; zie `QR-LICENSE.txt`. De code wordt in de browser gemaakt, niet door een externe QR-dienst.

Het standaard online adres is gebaseerd op de bestaande `CNAME`: `https://tools.jufzisa.be/digitale-missies/`. Een lokaal adres zoals `127.0.0.1` wordt geweigerd voor de QR. **De nieuwe bestanden moeten eerst gepubliceerd worden** voordat deze leerlingroutes online functioneren. Die publicatie is in deze taak niet uitgevoerd. Test daarna scannen en de echte iPad-apps op school.

## Controle

`check-report.cjs` verifieert volledige leerplandekking voor beide leeftijden en beide jaarindelingen, scheiding tussen periodes en leeftijden, optioneel lokaal bewaren/heropenen, geen automatische feedbackkeuze, blanco versus ingevulde afdrukken, alleen gekozen feedback op het rapport, geen leerlinggegevens in de QR en de koppeling naar de juiste kinderopdrachten. Afdrukweergaven en bollen zijn visueel nagekeken in de testbrowser. De bestaande curriculumcontrole blijft slagen. Een fysieke QR-scan en Safari-toesteltest staan nog open.
