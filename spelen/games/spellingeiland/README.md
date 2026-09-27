# Spellingeiland — lokale proef

Start vanuit de hoofdmap van het project:

```text

node spelen/games/spellingeiland/preview.cjs

```

Open vervolgens <http://127.0.0.1:8765/spelen/games/eilanden-leerjaar2.html>.

De HTML-pagina's werken ook via de bestaande VS Code Live Server. Voor een echte iPad kan die lokale server via het lokale netwerk worden gebruikt. De meegeleverde proefserver luistert alleen op deze computer.

## Twee verschillende spellen

**Spellingdetective:** buitenwereld waarin Zisa loopt en springt, pootafdrukkaartjes verzamelt en woorden schrijft. Verhoogde platforms geven het springen een doel. Brug, poort en schatkist wisselen af met een echte boot- en ballonoversteek zonder brug. Zisa stapt in, reist mee en stapt uit. Geen springveer of losse lamp meer. Het doel is Pip vinden.

**De Woordenwerkplaats:** een werkplaats binnen met een werkbank. Elke bouwkaart bevat een spellingopdracht met de gekozen oefenvorm. Daarna plaats je het onderdeel door slepen of aantikken, draai je het vast en groeit je wagen. Na vijf kaarten kies je een kleur en maak je een testrit. Bij 10, 15 of 20 woorden bouw je twee, drie of vier wagens. Afgewerkte wagens verschijnen op de plank. Dit spel gebruikt `workshop.js`; de buitenroute gebruikt `adventure.js`.

Op iPad werken de grote knoppen met aanraking; slepen heeft steeds een tikalternatief. Er is geen tijdslimiet of verlies van levens. De spelling en hulp bij fouten blijven gedeeld in `app.js`.

## Wat zit erin?

- Twee spelvormen met gedeelde instellingen: Spellingdetective en De Woordenwerkplaats.

- 29 categorieën met 254 woordrecords uit een gecontroleerde selectie van de bestaande bibliotheek. Dezelfde woorden kunnen in meerdere categorieën voorkomen.

- 5, 10, 15 of 20 opdrachten. Elke categorie komt aan bod; de verdeling verschilt hoogstens één opdracht.

- Maximaal drie uitgestelde herhalingen, binnen het gekozen aantal. Die vervangen een latere opdracht in dezelfde categorie, met minstens twee opdrachten ertussen. Bij fouten vlak voor het einde is geen herhaling meer mogelijk.

- Gerichte hint, daarna voorbeeld en zelfstandig opnieuw schrijven. Een fout verhindert de ontknoping niet.

- Prenten, ontbrekende stukjes, drie schrijfwijzen, husselwoorden, twee zinnen met sleepwoorden, lidwoorden, verkleinwoorden en meervouden.

- Sleepbediening met Pointer Events en een alternatief met aantikken; een eigen lettertoetsenbord en ondersteuning voor een fysiek toetsenbord.

- Het eigen toetsenbord is AZERTY. Een letter kan direct worden vervangen door erop te tikken. Na de eerste fout blijven correct gespelde letters staan en worden de te herstellen plekken oranje. Bij husselwoorden keren alleen de verkeerde letters terug naar de voorraad.

- De luisterknop heeft een eigen luidspreker-PNG en licht op bij elke nieuwe opdracht. Na een goed antwoord volgt een animatie en gaat het spel automatisch door. Bij stoppen of een verborgen tab wordt die overgang gepauzeerd.

- Zisa draagt speurderskleding bij de detective en een werkbroek bij de woordenwerkplaats. De gids gebruikt de bestaande Zisa als referentie; Pip en Robbie zijn bijfiguren.

- Elke eilandpagina is een afzonderlijke geïllustreerde speelwereld met aanklikbare gebouwen. De drie keuzestappen en de nieuwe spellingopdrachten zijn gecontroleerd op 1024×768, 1180×700, 768×1024 en 390×844, zonder paginascroll.

- De twee zinnen samen tellen als één opdracht. De zinnenoefening vergelijkt korte en lange klanken.

- Geen accounts of resultatenoverzicht toegevoegd. Alleen de gekozen instellingen worden lokaal bewaard. Antwoorden en voortgang verdwijnen bij het verlaten of vernieuwen van de pagina.

## Geluid en prenten

Voorlezen gebruikt de Nederlandse stem van de browser, met voorkeur voor nl-BE. Gebruik de knop ‘Test het geluid’. Beschikbaarheid en klank van stemmen verschillen per apparaat; het geluid moet nog op de eigen iPad worden beluisterd. Sommige woorden zonder bestaande prent hebben een luisteropdracht.

## Eilanden uitbreiden

De nieuwe kaart staat naast het bestaande menu. Het bestaande menu heeft één extra link gekregen.

Voeg een object toe aan `../eilanden-leerjaar2.js` met een unieke `id`, `title`, `icon`, `description` en `games`. Elk spel heeft een titel, beschrijving en lokale URL. Een nieuw eiland zonder kaartpositie verschijnt automatisch als extra bestemming onder de kaart.

Voor een nieuw getekend eiland voeg je ook een illustratie (`art`) en een positie (`map: {left, top, width, height}` in procenten) toe. Als de huidige zee te vol wordt, kan de achtergrond worden uitgebreid zonder de spelcode te wijzigen. De eerste drie eilanden zijn in de wereldillustratie getekend; hun namen en links blijven echte HTML en zijn dus eenvoudig aanpasbaar.

## Controles

```text

node spelen/games/spellingeiland/test-engine.cjs

node spelen/games/spellingeiland/test-browser.cjs

node spelen/games/spellingeiland/test-child-ui.cjs

node spelen/games/spellingeiland/test-interaction.cjs

node spelen/games/spellingeiland/test-detective.cjs
node spelen/games/spellingeiland/test-workshop.cjs

```

De tweede controle gebruikt de lokaal gebundelde Playwright-installatie en Microsoft Edge; een andere installatie kan via `NODE_PATH` worden doorgegeven. `--visual` controleert de kaart en bediening; `--finish` controleert ook de foutafhandeling en een ronde van twintig opdrachten. De proefserver moet draaien.

Getest in een browser op iPad-schermmaten; dit vervangt geen test op een echte iPad met Safari en de daar geïnstalleerde stem.

De illustratie en de gebruikte generatieprompt staan in `assets`. Er is niets gecommit, gepusht of gepubliceerd door deze wijziging.


## Uitgebreide zoektocht naar Pip
De detective gebruikt story.js voor aanwijzingen, hoofdstukken, de holle boom en de terugvaart. De laatste opdracht opent altijd de toegang tot Pip. De werkplaats blijft onafhankelijk. Test: node spelen/games/spellingeiland/test-detective.cjs.

Nieuwe prenten: assets/pip-verhaal.png, gegenereerd met de ingebouwde imagegen-tool. Prompt: transparante 3×2 spelatlas met een rood sjaaltje, turquoise veer, pootafdrukkenkaart, holle boom, huis met turquoise dak en herfststruiken; warme geïllustreerde 3D-stijl, zonder tekst of personages.

## Voertuigkeuze en eilandrace
De werkplaats gebruikt workshop-race.js. Eén voertuig krijgt 5, 10, 15 of 20 onderdelen; na elke vijf bouwkaarten volgt een tussentest, na de laatste kaart de race. Keuzes: raceauto, monstertruck, strandbuggy. De race loopt uitsluitend lokaal met twee computertegenstanders. De pijlen wisselen banen; sterren tellen mee en gouden stroken versnellen. Spelfouten hebben geen invloed op racesnelheid. Test-workshop.cjs speelt twintig kaarten, test vier schermformaten en simuleert de race tot de finish; --preview maakt beelden van de drie voertuigen.

Nieuwe PNG’s via ingebouwde imagegen:
- assets/pip-beweging.png: exact dezelfde ronde goudbruine hamster met turquoise sjaaltje, transparante 4×2 atlas met vier loopfasen, rust, zwaaien, zitten en springen; zonder vergrootglas of blokjes.
- assets/race-onderdelen.png: transparante 4×3 atlas met raceauto-, monstertruck- en buggycarrosserie, spoiler, motor, veren, bumper, uitlaat, ruit, koplampen, vlag en ster; turquoise en goud, geïllustreerde 3D-stijl.

Plaatsingscorrecties: schuilplaats vóór de personages in de tekenvolgorde; prenten tot hun zichtbare randen bijsnijden tijdens tekenen; Zisa stopt vóór Pip; kisten staan op een zijrichel en tonen hun gevonden routekaart; instappen richt op de zitplaats.

## Correctie: vier wielen en vaste zijaanzichten
De eerste vijf bouwkaarten zijn het onderstel en vier afzonderlijke wielen. Na het linker paar kiest het kind 'Draai de wagen om'; het rechter paar wordt op de andere zijde gemonteerd. De race tekent de twee wielen aan de zichtbare kant, met draaiende banden. De bouwstatus bewaart alle vier wielen.
Nieuw bestand assets/voertuigen-zijaanzicht.png, ingebouwde imagegen: transparante 2×2 atlas, strikt orthografisch zijaanzicht van raceauto, pickup en buggy zonder wielen, plus één ronde band met gouden naaf. De assen zijn per carrosserie op de wielkasten vastgelegd.
De detective heeft geen schatkisten of poorten in vooraanzicht meer. Het slot heeft vaste eiland-, boot- en zitposities en afzonderlijke sprongen om in en uit te stappen. test-detective.cjs --ending controleert zeven momenten en verifieert dat staande personages op land staan.

## Actuele racebesturing en montage (vervangt de eerdere driebanenrace)
De actieve race staat in circuit.js: gas vasthouden, remmen en doorlopend links/rechts sturen op een gesloten circuit. Geen automatische voortbeweging. De twee tegenstanders rijden lokaal. Drie ronden met een finishlijn; gras vertraagt. Alleen aan het einde van de volledige bouw wordt een kleur gekozen.
Interne onderdelen verschijnen tijdelijk in een transparante montageweergave. In de gesloten wagen worden ze niet over de carrosserie getekend. Bumpers, ruiten, verlichting en uitlaat zijn na montage geïntegreerd in de afgewerkte carrosserie; alleen stickers blijven als aparte laag zichtbaar.
Asset assets/race-bovenaanzicht.png: ingebouwde imagegen, transparante 3×2 atlas met volledig gemonteerde raceauto, pickup en buggy vanuit recht boven, turquoise plus computerkleuren, zonder weg of tekst.
Controle: test-workshop.cjs --circuit test stilstand, gas, sturen, remmen en drie ronden met een stuurregelaar; test-workshop.cjs speelt twintig spellingopdrachten inclusief één kleurkeuze door. De stuurregelaar zit alleen in de test.
