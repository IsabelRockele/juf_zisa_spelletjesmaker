# Zisa’s digitale missies — integratiepakket

Dit is de volledige broncode voor integratie in **zisa_spelletjesmaker**. Geen ChatGPT-aanmelding, Sites-hosting of OpenAI API nodig. Er wordt **geen tweede login** toegevoegd: het doelproject levert zijn bestaande sessie en rechten.

Versie 2.0, bijgewerkt op 23 september 2026. De ZIP is een integratiepakket, geen automatisch geïnstalleerde uitbreiding.

## Inhoud

- Dertien missietegels met paginering en leeftijdskeuze, inclusief de zeven toestel-, zorg-, toetsenbord-, bestanden-, gereedschap-, robotdenk- en welzijnsmissies.
- Doelenoverzicht via de knop Leerkracht op het startscherm: /doelen. Filter per missie en leeftijd, lees de officiële doelzin, de oefening en wat je observeert. Van daaruit open je ook de werkjes of het smartboard.
- Naamkaartjes met de klasmappen 1A en 2A, lokale oefenopslag, download en insturen naar de leerkracht.
- Tekenen met vinger, kleuren, gommen, tekst en opmaak; PNG bewaren en naar de leerkracht sturen.
- Leerkrachtenscherm: klascode/QR, werkjes ontvangen, selecteren, afdrukken en voordoen op smartboard.
- Zeven filmpjes: hoedje, muizentrappetje, vliegtuig, vis tekenen, mannetje tekenen, kat tekenen, veters strikken. Met echte afspeel/pauze/stopknoppen, drie doe-opdrachten per filmpje, terugspoelen en volume-opdrachten.
- Robotroutes met bewegend robotje en oplopende moeilijkheid.
- Veilig met media, met voorleesknoppen.
- Slim zoeken, inclusief meerdere antwoorden aanvinken waar nodig.
- Zelf opzoeken: externe bronnen en een eigen bibliotheek met 12 oefenwoorden, verklaring, afbeelding en voorlezen pas na zoeken.
- Vier PDF-werkbladen en een aparte oplossingenbundel.

## Geef aan Codex

Open de repository van zisa_spelletjesmaker in Codex, voeg deze zip toe en gebruik **CODEX-OPDRACHT.md**. Codex moet de module aan die bestaande applicatie koppelen. De huidige repository van de spelletjesmaker is niet in dit pakket aanwezig; bestaande accounts en leerlinggegevens zijn dus niet gewijzigd of gekopieerd.

## Belangrijk: bestaande login

`integration/host-session.ts` is het expliciete koppelbestand voor de bestaande server-gecontroleerde sessie. Het geeft voorlopig `null` terug, zodat geen onbeveiligde toegang ontstaat. Codex vervangt dit met de bestaande sessiecontrole en leerkrachtrechten. Dit is geen nieuwe login en geen nieuw accountstelsel.

Tot dat koppelbestand is ingevuld, geeft het leerkrachtenscherm bewust geen toegang. De leerlingmodules zijn in de losse bronversie bereikbaar voor ontwikkeling. **Voor publicatie moet Codex de hele module in de bestaande beschermde omgeving plaatsen**, inclusief het statische atelier en de bijbehorende API, volgens de toegangsregels van de spelletjesmaker. Een QR-code mag die bescherming niet ongemerkt omzeilen.

## Techniek en lokaal ontwikkelen

React 19, TypeScript, Next.js, CSS/Tailwind, bestaande UI-componenten en Lucide-pictogrammen. Het tekenatelier zelf is gewone HTML/CSS/JavaScript in `public/atelier.html`, `public/app.js`, `public/style.css`.

Voor een lokale referentieversie: Node.js 22.13 of nieuwer (getest met Node 24), pnpm volgens `package.json`:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Voor productie:

```sh
pnpm build
pnpm start
```

Gebruik HTTPS. De ontvangfunctie vereist een backend; alleen uploaden naar GitHub Pages is onvoldoende. De bestaande app hoeft niet naar Next.js te worden omgebouwd: Codex kan de React-modules en losse tekenbestanden overnemen in de bestaande stack.

## Opslag

`lib/local-storage.ts` is een zelfstandige Node-adapter met SQLite (`node:sqlite`) en PNG-bestanden onder `ZISA_DATA_DIR` (standaard `./data`). Er zijn geen Cloudflare D1/R2-bindings meer nodig. Dit is geschikt voor één Node-server met blijvende schijf. Gebruik op serverless hosting of meerdere instanties de bestaande database en bestandopslag van de spelletjesmaker; laat Codex deze adapter vervangen.

- Database: lessen met een eigenaar, klascode en open/gesloten status; werkjes gekoppeld aan een les.
- Bestanden staan buiten `public`. Opvragen verloopt via een API die de eigenaar controleert.
- Inzendingen zijn beperkt tot een PNG van 1200 × 800, maximaal 4 MiB, met een geldige geopende klascode.
- Een klascode alleen geeft geen toegang tot het leerkrachtenscherm of ontvangen afbeeldingen.
- Bewaar de database en afbeeldingen samen. Er worden geen bestaande lessen of werkjes uit de online versie meegeleverd.
- Bij integratie in meerdere leerkrachtaccounts moet `userId` een stabiele, server-gecontroleerde eigenaar-ID zijn.

## Paden en QR-codes

De referentieversie gebruikt paden vanaf de domeinroot. Voor plaatsing onder bijvoorbeeld `/digitale-missies/` moet Codex routes, links, API-paden, statische assets, CSS-afbeeldingen, iframes en QR-codebestemmingen samen aanpassen. Alleen een Next `basePath` instellen is daarvoor niet genoeg. API-routing in `app/api/atelier/[...path]/route.ts` moet dezelfde prefix gebruiken.

De PDF's in dit pakket bevatten bewust **geen oude QR-code naar de ChatGPT-site**. De werkbladen blijven bruikbaar. Zodra de definitieve woordenboek-URL bekend is, kan Codex met Python + reportlab de PDF's opnieuw maken:

```sh
ZISA_WOORDENBOEK_URL=https://jouw-domein/definitief-pad/opzoeken#woordenboek python scripts/make-word-worksheets.py
```

De lettertypen en hun licentie staan bij het script. Zonder de omgevingsvariabele worden PDF's zonder QR-code gemaakt.

## Stemmen en filmpjes

Voorlezen gebruikt de spraakfunctie van het apparaat, bij voorkeur een Nederlandstalige Belgische stem. Er zijn geen sleutels of betaalde spraakdiensten nodig. Codex mag de bestaande Vlaamse stemdienst van de spelletjesmaker aansluiten als die daar al is ingericht; plaats geheime sleutels nooit in de browsercode.

Filmpjes zijn ingebed vanaf YouTube, niet gedownload of meegeleverd. De maker en bron blijven vermeld. De zeven video-ID's staan in `app/kijken/lessons.ts`. Internet en toegang tot YouTube zijn nodig. De speler kan reclame tonen; de tool kan die niet verwijderen. Het werkelijke iPad-mediavolume wordt door het kind bediend en kan niet door de site worden gemeten.

## Afbakening en controle

Dit pakket is bedoeld om door Codex te worden geïntegreerd; de koppeling met de bestaande sessie, routes en eventueel opslag moet in het doelproject gebeuren. De volledige integratie met zisa_spelletjesmaker is hier nog niet getest. Zie CONTROLE.md voor uitgevoerde checks en de resterende integratiecontrole.
