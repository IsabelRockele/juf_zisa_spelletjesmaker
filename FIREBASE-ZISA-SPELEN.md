# Firebase instellen voor Zisa Spelen

De code voor Zisa Spelen staat klaar in de bestaande Firebase Functions-backend. De leerling-QR is gekoppeld aan de actuele PRO-licentie van de leerkracht.

## Wat de nieuwe functies doen

- `getPlayClass`: maakt of laadt de vaste leerling-QR van de ingelogde PRO-leerkracht.
- `updatePlayClass`: bewaart welke leerjaren leerlingen mogen zien.
- `rotatePlayClassCode`: vervangt een gedeelde of misbruikte QR en wist de gekoppelde toestellen.
- `clearPlayClassDevices`: maakt opnieuw plaats voor leerlingentoestellen.
- `removePlayClassDevice`: verwijdert één gekozen leerlingentoestel.
- `joinPlayClass`: controleert bij elk gebruik de QR, de actuele PRO-licentie en de toestelgrenzen.

## Firestore-gegevens

De backend maakt zelf deze collectie aan:

```text
playClasses/{uid}
```

Hierin staan de willekeurige QR-code, de geactiveerde leerjaren en gehashte toestel-ID's. Er worden geen namen, e-mailadressen of andere gegevens van leerlingen opgeslagen.

## Firestore Rules

De browser hoeft deze collectie nooit rechtstreeks te lezen of te wijzigen. Voeg daarom binnen
`match /databases/{database}/documents { ... }` deze regel toe:

```text
match /playClasses/{userId} {
  allow read, write: if false;
}
```

Firebase Functions gebruikt de Admin SDK en blijft met deze regel gewoon werken.

## Authentication

Er hoeft geen leerlinglogin en ook geen anonieme Firebase Authentication te worden aangezet. Alleen de leerkracht logt in met haar bestaande PRO-account.

## Publiceren

Voer vanuit de hoofdmap uit:

```text
firebase deploy --only functions
```

Publiceer daarna de website zoals gewoonlijk via GitHub Pages. Zowel de map `pro` als de nieuwe map `spelen` moeten online staan.

## Controle na publicatie

1. Log in als een PRO-leerkracht.
2. Open **Zisa Spelen** in de linkerbalk.
3. Controleer of een QR verschijnt.
4. Scan de QR met een ander toestel.
5. Controleer of het toestel in het leerkrachtenoverzicht verschijnt.
6. Vervang één keer de QR en controleer of de oude QR niet meer werkt.

## Ingebouwde grenzen

- maximaal 50 geregistreerde leerlingentoestellen;
- maximaal 30 toestellen die in de laatste vijf minuten actief waren;
- toestelregistraties die 60 dagen niet gebruikt zijn, worden bij een volgende aanmelding automatisch opgeruimd;
- de leerlingentoegang stopt onmiddellijk wanneer de PRO-licentie niet meer actief is;
- tijdens het spelen controleert elk toestel om de twee minuten of de toegang nog geldig is.
