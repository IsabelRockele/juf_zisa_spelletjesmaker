# Nieuwe Digitale Missies — 23 september 2026

Het bestaande startadres `/digitale-missies/` en `/digitale-missies/index.html` tonen nu het nieuwe pakket met 13 missies. De tegel op de website hoeft niet te veranderen. De bronmap in Downloads was al identiek aan `Zisa-Digitale-Missies` in deze repository.

Omdat de website statisch wordt gehost, bouwt `Zisa-Digitale-Missies/integration/static/build.mjs` de React-schermen tot gewone websitebestanden. De oorspronkelijke Next.js-server en SQLite-opslag worden niet op de website gebruikt. Alle interne links, afbeeldingen, achtergrondafbeeldingen, PDF-links en video-QR-bestemmingen gebruiken het modulepad. De zelfstandige tekenbestanden staan onder `v2/`, zodat oudere hulpmiddelen geen overschreven scripts laden.

Opnieuw bouwen: voer `npm ci` en `npm run build` uit in `Zisa-Digitale-Missies/integration/static`. Het eigen package-lock legt de bouwpakketten vast. De hoofdpakketten van de website zijn niet gewijzigd. De gitignore-uitzondering zorgt dat de bronbestanden onder `Zisa-Digitale-Missies/lib` kunnen worden meegenomen.

## Uitgevoerde controle

- Productiebouw van de statische websiteversie geslaagd.
- Browsercontrole: 13 unieke tegels; alle missieroutes en afbeeldingen laden zonder lokale 404 of JavaScriptfouten.
- Doelenoverzicht met 13 missiekoppelingen, leeftijdsfilter en zichtbare afdrukweergave.
- Woordenbibliotheek toont de betekenis pas na zoeken.
- Twee geldige PDF-bestanden: vier werkbladen in de opdrachtenbundel en de oplossingenbundel.
- Tekenen verandert het canvas; downloaden levert `mijn-tekening.png`. De test kiest de browserdownload; de native deelfunctie is niet op een fysieke iPad getest.
- Inleverknoppen melden duidelijk dat online ontvangst niet actief is.
- Startscherm visueel gecontroleerd op tablet- en telefoonbreedte; geen horizontale overflow op 390 px.
- Bestaande backendcontrole met geïsoleerde opslag geslaagd: login/licentie, gescheiden klassen, geheime klaslink, PNG-validatie, retry zonder duplicaten, sluiten en verwijderen.

Browsercontrole herhalen: `node Zisa-Digitale-Missies/integration/static/check-website.cjs` vanuit de repository. Dit gebruikt de lokaal beschikbare Codex Playwright-installatie en Chrome.

## Nog niet bevestigd of geactiveerd

Online inleveren blijft volgens de bestaande configuratie uitgeschakeld. De nieuwe knoppen zijn aangesloten op de bestaande Firebase-inleverinterface en upload-only klaslink, niet op de losse achtletterige klascode uit het Next.js-voorbeeld. Downloads werken zonder deze functie. De bestaande leerkrachtpagina blijft verantwoordelijk voor ontvangst en afdrukken; de uitgebreide Next.js-inbox met automatische ontvangst, QR en gezamenlijk afdrukken is niet overgenomen.

Voor echte ontvangst zijn de bestaande activeringsstappen in INLEVERPLEK.md nodig, inclusief controle van de live opslagregels, publicatie van de functies en een test met twee leerkrachtaccounts. Geen online end-to-end-test met echte accounts uitgevoerd. Geen nieuwe login toegevoegd. De bestaande openbare leerlingtoegang van deze gratis tool is behouden; servercontrole van rechten blijft bij de bestaande Firebase-functies.

YouTube-afspelen, Nederlandse stemmen, fysiek aanraken en native delen/downloaden moeten nog op de school-iPads worden geprobeerd. De browsercontrole opent alle missies maar doorloopt niet iedere oefening of video. Werkbladen bevatten geen QR-code; de onjuiste verwijzing daarnaar is uit de schermtekst verwijderd.

Deze vervanging is lokaal uitgevoerd, niet online gepubliceerd. De oude module is vooraf gekopieerd naar `.tmp/digitale-missies-backup/`. Oude hulpbestanden en lokale leerlingopslag zijn niet gewist; oude voortgang wordt niet omgezet naar de nieuwe oefeningen.
