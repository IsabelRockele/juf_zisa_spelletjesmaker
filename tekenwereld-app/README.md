# Zisa's tekenwereld — zelfstandige gratis versie

De browsercode staat hier; de gepubliceerde bestanden staan in `../tekenwereld/`.
De oorspronkelijke aangeleverde map `Zisa-Tekenwereld` blijft ongewijzigd.

## Bouwen

Gebruik Node 22. `npm ci`, `npm run check`, `npm run build`.
Neem de broncode én de vernieuwde map `tekenwereld/` mee in de GitHub Pages-commit.
`public/art` bevat de oorspronkelijke 65 figuren en vier achtergronden; de vier
vrije tekenbladen worden tijdens het printen opgebouwd.

## Toegang en opslag

- De leerkracht gebruikt dezelfde standaard Firebase-app en aanmelding als
  `login_collega.html` (project `zisa-collegas`). Geen ChatGPT-account nodig.
- Alleen de gratis startpagina heeft een tegel; Pro en Ontdek worden nog niet uitgebreid.
- De aparte serverfunctie `tekenwereldApi` gebruikt de bestaande serveromgeving
  `zisa-spelletjesmaker-pro`, maar accepteert uitsluitend de gratis collega-login.
  Dit geeft geen toegang tot Pro en verandert geen andere serverfuncties.
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

De acht tests en een online proef met tijdelijk collega-account, QR-upload,
privé-opslag, ophalen en verwijderen zijn geslaagd. De browserweergave,
bibliotheek, testanimatie en QR-dialoog zijn gecontroleerd. Een fysieke
iPadcamera met een echt ingekleurd blad blijft een praktijktest.
