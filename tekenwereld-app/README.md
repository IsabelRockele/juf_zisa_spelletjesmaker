# Zisa's tekenwereld — Gratis, Pro en Ontdek

De browsercode staat hier; de gepubliceerde bestanden staan in `../tekenwereld/`.
De oorspronkelijke aangeleverde map `Zisa-Tekenwereld` blijft ongewijzigd.

## Bouwen

Gebruik Node 22. `npm ci`, `npm run check`, `npm run build`.
Neem de broncode én de vernieuwde map `tekenwereld/` mee in de GitHub Pages-commit.
`public/art` bevat de oorspronkelijke 65 figuren en vier achtergronden; de vier
vrije tekenbladen worden tijdens het printen opgebouwd.

## Automatisch uitknippen

Nieuwe afdrukken hebben vier `ZISA2:<template>:<hoek>`-codes buiten het tekenvak.
`lib/sheet-scan.ts` deelt de maatvoering met de afdruk, herkent de vier hoeken,
herstelt perspectief en oriëntatie en houdt kader, codes en bladtekst buiten de
uitsnede. Alleen vier geldige codes van hetzelfde blad geven een automatische
uitsnede. Ontbrekende codes leiden tot een verzoek om een nieuwe foto; oude
`ZISA:`-bladen blijven met de optionele handmatige uitsnede bruikbaar.
De bestaande papierverwijdering maakt daarna meteen het bewegende voorbeeld.

Voer `node scan.test.cjs` uit vanuit deze map. De test controleert gedraaide en
perspectivische foto's, kleurbehoud, oriëntatie, het uitsluiten van kader/tekst/QR,
en ontbrekende of gemengde codes. Testbeelden worden in de genegeerde `.preview/`
map gezet. Test daarnaast het fotoverloop in de browser. Een echte camera- en
printertest blijft nuttig voor belichting, onscherpte en printerinstellingen.

## Toegang en opslag

- Zonder editieparameter blijft de gratis collega-versie beschikbaar met de
  bestaande aanmelding (`zisa-collegas`). Geen ChatGPT-account nodig.
- `?editie=pro` en `?editie=ontdek` gebruiken de bestaande aanmelding van
  `zisa-spelletjesmaker-pro` en keren terug naar hun eigen toolmenu.
- Ontdek biedt Aquarium volledig aan: 17 bibliotheekbladen en testanimaties
  zonder login; foto's bewaren en klas-QR na gratis Ontdek-login. De andere
  werelden linken naar Pro. Er geldt geen PDF-proeflimiet voor deze bibliotheek.
- De server verifieert beide tokenuitgevers en houdt hun opslag gescheiden.
  Voor Pro-accounts bepaalt de nieuwste actieve, niet-verlopen licentie
  (licenses/Licenties, eerst uid en dan email) welke werelden beschikbaar zijn.
  Zonder Pro-licentie is alleen Aquarium toegestaan, ook bij directe API-aanroepen.
  Licentietoegang wordt maximaal 60 seconden bewaard. Pro-klas-QR's verlopen
  uiterlijk met de licentie. De URL-parameter verleent zelf geen rechten.
- Metadata staat in `tekenwereldOwners` en `tekenwereldSessions`; PNG-bestanden
  onder `tekenwereld/` in de bestaande private bucket. Firebase-clientregels
  geven geen rechtstreekse toegang tot deze gegevens. Afbeeldingen worden via
  de geauthenticeerde server geladen, zonder openbare downloadlinks.
- Een klas-QR bevat een willekeurige code van 96 bits in het URL-fragment, is
  12 uur geldig en mag alleen insturen naar de gekozen wereld. Vervangen of
  sluiten maakt de oude code meteen ongeldig. Leerlingen kunnen niet lezen
  of verwijderen. Een sluiting tijdens het insturen wordt opnieuw gecontroleerd.
- Maximaal 100 tekeningen / 40 MiB per collega; maximaal 60 uploads per minuut.
  De leerkracht kan eigen tekeningen verwijderen. Oude ChatGPT-tekeningen worden
  niet automatisch geïmporteerd; bestaande klas-QR's horen bij de oude omgeving.

## Server publiceren

Vanuit de hoofdmap:

```
npm ci --prefix tekenwereld-backend
npm test --prefix tekenwereld-backend
firebase deploy --config tekenwereld.firebase.json --only functions:tekenwereld --project zisa-spelletjesmaker-pro
```

Gebruik de aparte configuratie zodat andere lokale serverwijzigingen niet
meegaan. De servertests controleren collega-isolatie, QR-rechten, verloop,
vervanging, gelijktijdig sluiten/insturen, capaciteit en polling.

De oorspronkelijke tests en een online proef met tijdelijk collega-account, QR-upload,
privé-opslag, ophalen en verwijderen zijn geslaagd. De browserweergave,
bibliotheek, testanimatie en QR-dialoog zijn gecontroleerd. Een fysieke
iPadcamera met een echt ingekleurd blad blijft een praktijktest.

Papierverwijdering gebruikt de papierkleur langs de lege randen om belichting en
kleurzweem te compenseren. Alleen met de buitenrand verbonden papier wordt
transparant; witte vlakken binnen gesloten figuren blijven staan. Een grotendeels
ondoorzichtige buitenrand wordt afgewezen, zodat geen heel blad als figuur wordt
verstuurd. `node paper.test.cjs` controleert grijze, warme, koele en geschaduwde
achtergronden, kleurbehoud, gesloten witte vlakken en onbruikbare foto's.

De leerlingpagina volgt gewijzigde QR-fragmenten zonder herladen. Een nieuwe of
verlopen QR wist de vorige verbinding en de oude foto; late antwoorden van een
vorige verbindingspoging worden genegeerd. De leerkrachtdialoog toont alleen een
QR die bij de gekozen wereld hoort. Browsercontrole: aquarium → bloementuin,
verlopen QR, snel wisselen met vertraagd antwoord, Andere klas-QR, en nieuwe
leerkracht-QR na een wereldwissel.

De editie-tests controleren ook accountisolatie tussen Firebase-projecten,
Aquarium-inzendingen door Ontdek-leerkracht en leerling, geblokkeerde Pro-werelden,
licentiestatus en verlopen Pro-toegang inclusief QR en gecachte lijsten.
