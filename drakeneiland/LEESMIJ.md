# Drakeneiland — de lichtkristallen

Open index.html in een browser. Het spel werkt lokaal zonder installatie of internet.

## Het verhaal

Vargos is een vriendelijke, ondeugende draak die de lichtkristallen heeft meegenomen. Zijn magische schild beschermt ze. De kinderen zijn ridderteams. Goede antwoorden worden rekenspreuken die het schild verzwakken. Het schild barst zichtbaar in drie fasen. Breken de teams het op tijd, dan komen de kristallen vrij. Is de tijd om, dan ontsnapt Vargos met de kristallen.

- Ridderduel: elk team heeft een zichtbare eigen ridder en eigen draak. Een spreuk vliegt van de ridder naar zijn draak; daarna vliegt een kristal terug. De kristallen blijven zichtbaar bij het team. De acht stukken van het schild verdwijnen naarmate de draak verzwakt.
- Het eerste team dat zijn draak verslaat, krijgt plaats 1 met een eindtijd. De antwoorden van dat team sluiten. De overige teams spelen verder voor plaats 2, 3 en 4. De gezamenlijke uitslag volgt pas als alle teams klaar zijn, na een korte overwinningsanimatie.
- Standaard is er geen tijdslimiet: de klok toont de verstreken tijd. Met een gekozen tijdslimiet sluit de ronde bij nul. Teams die nog niet klaar zijn krijgen geen voltooide eindplaats; hun verzamelde kristallen worden vermeld.
- Samen: alle teams raken één schild. Het doel is schildkracht per team maal het aantal teams. Kleine teammeters tonen de bijdragen.
- Dubbele toverkracht: elke 30 seconden krijgen alle teams 8 seconden een bonus. Een goed antwoord verdient dan 2 kristallen in plaats van 1 en verzwakt het schild dubbel. Er gaat niets verloren. Bij de laatste treffer stopt een team bij zijn doel.

## Oefeningen

Splitsen, optellen en aftrekken tot 10 of 20; afzonderlijke maal- en deeltafels van 1 tot 10. Bij plus en min tot 20: zonder brug, met brug of gemengd. Sommen tot aan of vanaf 10 vallen onder zonder brug.

Elk team krijgt een willekeurige oefening die verschilt van alle op dat moment zichtbare oefeningen. Omgekeerde optellingen en vermenigvuldigingen tellen als dezelfde oefening. Ook de zojuist gemaakte oefening wordt uitgesloten. De gekozen oefencategorie geldt voor alle teams. Splitsbenen en getallen staan op vaste posities in één schaalbaar diagram.

Eén kind per team aan het bord. Na een goed antwoord wisselt de speler. Een fout antwoord wordt uitgeschakeld, de andere knoppen blijven beschikbaar. Pauze stopt de klok en antwoordinvoer. Gelijktijdige aanraking hangt af van de multitouchondersteuning van bord en browser.

## Controle

`node drakeneiland/math.test.cjs`: 3.793 oefeningen en 12.600 asynchrone teamwissels.

`node drakeneiland/game.test.cjs`: speltoestanden via een minimale DOM-testomgeving, inclusief pauze, dubbel tikken, storm, verlies, eigen draken, doorlopende ronde na winst, plaatsen 1–4, onbeperkte speeltijd en eindanimatie. Dit is geen visuele browsertest.

## Illustratie

vargos.png is gemaakt met de ingebouwde imagegen-tool. Definitieve bewerkingsprompt:

> Edit this illustration for a classroom game ages 6–9. Preserve the beautiful bright floating island, castle, luminous crystals, sunlight and painterly storybook quality. Make the dragon considerably friendlier and less scary: rounded soft face, large kind round eyes with relaxed eyebrows, small rounded ivory horns, soft rounded body proportions, relaxed wings, gentle mischievous closed-mouth smile, no sharp teeth, no sharp claws, no menacing expression. He is a lovable cheeky crystal thief the children want to challenge, not a frightening monster. Keep teal and coral colors. No text. No emojis. Whole character remains clearly visible.

ridder.png is gemaakt met de ingebouwde imagegen-tool, als transparante illustratie. De vuurridder gebruikt deze oorspronkelijke afbeelding. De andere teams hebben eigen illustraties: ridder-water.png, ridder-bos.png en ridder-ster.png. Huid en harnas worden niet meer met een kleurfilter aangepast. Prompt:

> Use case: illustration-story. Create a single polished full-body storybook child knight game character on a genuinely transparent background. Friendly courageous young knight, rounded silver armour, warm orange tunic and flowing coral cape, open helmet showing kind cheerful face, short brown hair. Standing in a dynamic spellcasting stance facing three-quarter right, right arm holding a slim magical wand pointing diagonally upwards right, left arm holds a rounded shield. Whole body and wand visible, feet at bottom, generous transparent margin. Beautiful hand-painted gouache style with soft dimensional shading to match a sunlit fairytale island game ages 6-9. Character large and readable at 120 pixels tall. No scenery, no ground, no text, no emoji, no border, no threatening weapons, no extra characters. Portrait composition.


## Overwinning en bewegingspauze

Een verslagen draak krijgt een eigen eindhouding (vargos-verslagen.png): zittend met witte vlag en een teruggegeven kristal. De ridder springt blij, scherven en kristallen vliegen uiteen en de eindplaats verschijnt. De andere teams spelen verder. Na de laatste winnaar volgt vijf seconden feest voor de uitslag. De nieuwe beeldprompts staan in ILLUSTRATIES.md.

De leerkracht kan een bewegingstussendoortje aanzetten (standaard uit). Interval: 30, 60, 90 of 120 seconden actieve speeltijd. Duur: 5, 10, 15 of 20 seconden. Een centrale ridder doet afwisselend springen, afwisselend knieheffen en squaten voor. Speelklok, stormfase en antwoorden blijven tijdens de pauze stilstaan. De laatste antwoordanimaties worden eerst afgerond. Daarna gaat het spel automatisch door; de leerkracht kan ook Verder spelen kiezen. Een verborgen tabblad verbruikt geen bewegingstijd.

De bewegingen gebruiken eigen nieuwe beeldreeksen: bewegen-springen.png, bewegen-knieheffen.png en bewegen-squaten.png. Elke reeks bevat drie getekende houdingen. Het spel wisselt die houdingen op een rustig ritme en toont korte aanwijzingen (zoals Spring, Land zacht en Voet neer). Er wordt geen gewone ridderafbeelding meer ingedrukt om een squat na te bootsen.

## Puntoefeningen

Kies Puntoefeningen: optellen, aftrekken of plus & min. Bereik 10 of 20, met de puntjes vooraan, achteraan of op beide plaatsen afwisselend. Bij bereik 20 blijft de brugkeuze beschikbaar en wordt die beoordeeld op de volledige som. De kinderen kiezen het ontbrekende getal uit de vier antwoordknoppen.

Aanvullen tot 10, Wegnemen tot 10 en Aanvullen & wegnemen tot 10 zijn afzonderlijke keuzes. Aanvullen vertrekt van 0–9; wegnemen vertrekt van 11–20. Het resultaat is altijd 10; bereik- en brugkeuze zijn hierbij niet van toepassing. Ook deze oefeningen blijven verschillend tussen de actieve teams.

## Rekenavonturen: zes spelwerelden

Bovenaan kan de leerkracht kiezen tussen Drakeneiland, Ruimteredding, Schatduikers, Dierenredders, De gekke taartenbakkerij en Het betoverde kasteel. Elke keuze past de titel, uitleg, teamnamen (behalve zelf aangepaste namen), illustraties, beloning en eindanimatie aan.

- Ruimteredding: de raket verschijnt van onder naar boven. Na voltooiing stapt de astronaut in en stijgt de raket op.
- Schatduikers: de duiker haalt parels op. Elke verdiende parel wordt in de open schatkist getoond. De volle kist glanst en de duiker maakt een ereronde.
- Dierenredders: konijnen, vosjes en egels komen naar de opvang. De verzameling bevat evenveel dieren als het team heeft gered. De dieren bewegen in een feestelijke parade.
- Taartenbakkerij: de taart groeit van bord naar lagen, glazuur en kaars. Bij voltooiing gaat het kaarsje aan en presenteert de bakker de taart.
- Kasteel: de brug, muren en torens verschijnen. De poort opent aan het eind, de ridder loopt binnen en de vlag wappert.

Alle werelden delen de rekenkeuzes, 2–4 teams naast elkaar, onafhankelijke oefeningen, plaatsen en eindtijden, dubbele beloning en instelbare bewegingspauzes. Die bewegingen worden nog steeds door de oefenridder voorgedaan. Bij samenwerken tonen de projecten de gezamenlijke voortgang; elk team behoudt zijn eigen parels/dieren en bijdrage. Bij een tijdslimiet blijven onvoltooide missies als onvoltooid vermeld.

De tests controleren alle vijf nieuwe werelden met 2, 3 en 4 teams, plus gezamenlijk spelen, de aantallen verzamelde dieren/parels, opbouw, doorspelen voor volgende plaatsen en tijdslimieten. Illustraties zijn bekeken en bestandskoppelingen/transparantie gecontroleerd. De tests gebruiken een DOM-testomgeving, geen volledige visuele browsertest.

Afbeeldingsprompts: WERELDEN-ILLUSTRATIES.md.


## Touwtrekken en beweging per thema
Touwtrekken is een afzonderlijke spelkeuze voor precies twee teams. Elk goed antwoord telt één keer; de voorsprong bepaalt de richting en positie van het touw. Het eerste team dat het gekozen doel haalt, trekt het andere team over de middenlijn. Met een tijdslimiet wint de koploper; een gelijke stand krijgt verlenging tot het volgende goede antwoord. Beide teams stoppen bij de overwinning.

Bewegingspauzes gebruiken automatisch de ridder, astronaut, duiker, dierenverzorger, bakker of sporter van de gekozen spelwereld. Elk personage heeft aparte houdingen voor springen, knieheffen en squaten. De klok en antwoorden staan stil en het spel hervat vanzelf. De nieuwe illustraties en prompts staan beschreven in THEMA-BEWEGING-ILLUSTRATIES.md.

Bij Schatduikers passen tien parels op een laag in de opening van de kist. Vanaf parel 11 en 21 komt er een nieuwe laag bovenop. De parels volgen de schuine rand van de geschilderde kist.

Controles: node game.test.cjs, node math.test.cjs, python check-movement-art.py. Dit zijn controles van spelbesturing, rekenen en beeldgrenzen; geen visuele digibordtest.
