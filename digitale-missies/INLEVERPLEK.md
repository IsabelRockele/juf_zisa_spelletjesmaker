# Inleverplek: gebouwd, nog niet online actief

De configuratie staat bewust uit. Er wordt vanuit de lokale site geen leerlingwerk naar Firebase verzonden. Dit is geen lokale nep-inlevermap: de echte route gebruikt de bestaande Firebase-backend en is pas beschikbaar na gecontroleerde activering.

## Gebruik na activering

1. De leerkracht meldt zich op dezelfde website aan met het bestaande Zisa PRO-account en opent `inleverplek.html` via Voor de leerkracht.
2. De leerkracht geeft een klasnaam en opent een ronde. Eén actieve ronde per account; een nieuwe ronde sluit de oude. De geheime klaslink wordt één keer getoond en kan gekopieerd worden naar de klas-iPads. Ze verloopt na 24 uur.
3. Kinderen openen die link, maken hun kaart/tekening, typen alleen hun voornaam en bewaren hun werk. Inleveren controleert de bestemming en vraagt bevestiging. Pas na serverbevestiging staat er Ingeleverd. Bij fouten blijft het lokale werk behouden.
4. De leerkracht vernieuwt het overzicht, opent een werkstuk, downloadt de PNG of drukt het af. Sluiten stopt nieuwe inzendingen; verwijderen wist de hele ronde inclusief afbeeldingen.

## Afbakening

- Klaslink is een upload-only bearer capability met 192 willekeurige bits, alleen als hash bewaard op de server. Wie de link krijgt kan insturen; dit bewijst geen leerlingidentiteit. Deel uitsluitend in de klas. Leerlingen kunnen geen werk ophalen of rondes opsommen.
- Leerkrachtacties controleren server-side authenticatie, actieve bestaande PRO-toegang en eigenaarschap bij ieder verzoek. Een klasnaam of voornaam geldt nooit als autorisatie.
- Maximaal 250 werkstukken per ronde, PNG kleiner dan 590 KB en begrensde afmetingen. De server beperkt inzendtempo. Grote foto's kunnen worden geweigerd; downloaden blijft mogelijk. Voor bredere publieke uitrol is aanvullende abuse-monitoring nodig.
- Geen leerlingmail, publieke afbeeldings-URL, nieuwe leerlingaccounts of automatisch versturen. Alleen voornaam, opdracht, PNG en inzendtijd worden opgeslagen.
- Na 24 uur sluit inleveren, maar het werk wordt NIET automatisch verwijderd. De leerkracht kan de ronde verwijderen. Maak voor schoolgebruik een concrete bewaartermijnafspraak en voeg zo nodig automatische opschoning toe.
- Functionele tests gebruiken geïsoleerde testopslag. Er is nog GEEN online end-to-end-test, Firebase Rules-emulatortest of test op een echte iPad uitgevoerd.

## Vereiste activering (nog niet uitgevoerd)

1. Controleer de daadwerkelijk geldende Firestore-regels. `missionInboxes/{round}` met ALLE subcollecties en `missionInboxTeachers/{uid}` mogen voor browserclients nooit rechtstreeks leesbaar/schrijfbaar zijn. Uitsluitend Admin SDK vanuit de functies. Een extra `allow ...: if false` neutraliseert geen ruimere bestaande `allow`: verwijder of begrens zulke overlappende regels. Test anonieme én aangemelde clients. Er zijn geen bestaande regels overschreven of gepubliceerd.
2. Publiceer uitsluitend de vier nieuwe functies `manageMissionInbox`, `previewMissionInbox`, `submitMissionWork`, `readMissionInbox` na review. Backend-activering vereist `MISSION_INBOX_ENABLED=true`; standaard weigeren ze alles. Controleer project, regio, schoolafspraken en kosten voordat opslag voor kinderen wordt ingeschakeld.
3. Test op een HTTPS-testomgeving met twee verschillende leerkrachtaccounts: vreemde klas/afbeelding geweigerd, verlopen/gesloten link geweigerd, verlies van netwerk gevolgd door retry zonder dubbel werk, hele ronde verwijderen. Test bestaande login op dezelfde origin.
4. Pas daarna `inlever-config.js` op `enabled: true` zetten en de website publiceren. De lokale server op 127.0.0.1 is geen adres dat klas-iPads kunnen openen. De huidige preview blijft lokaal.
5. Proef met uitsluitend fictieve gegevens op de echte school-iPads: klaslink, naam, tekenhandelingen, bewaren, inleveren, ontvangst op ander toestel, download en afdrukvoorbeeld.

## Lokale controles

`npm run build` in `pro_backend`; daarna `node check-mission-inbox.cjs`. De test raakt geen echte Firebase-opslag. `node digitale-missies/check-practice.cjs` blijft de bestaande oefeningen controleren.
