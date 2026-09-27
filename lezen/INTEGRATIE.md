# Zisa Lezen - aansluiting op bestaand Pro-project

Status: lokale testintegratie, niet gedeployed en nog niet verkoopklaar. Dit document vervangt het eerdere voorstel met een afzonderlijk Firebase-project.

## Vastgelegd

- Bestaand Firebase-project `zisa-spelletjesmaker-pro`, bestaande e-mail/wachtwoordaanmelding, standaard appnaam voor gedeelde sessie op dezelfde origin.
- Leesrechten afzonderlijk in `readingTest*`-collecties. Geen schrijven naar `licenses`/`Licenties`, geen Pro-licentie voor een leesbetaling.
- Bestaande gratis collega's behouden hun bestaande toegang; geen nieuwe registratie in `zisa-collegas` voor leeskopers.
- Mollie-profiel **Juf Zisa's spelletjesmaker**, niet het JouwWeb-profiel **Juf Zisa**. Configuratie legt het verwachte `pfl_...`-nummer vast; checkout controleert de sleutel via `/profiles/me`.
- Prijs EUR 3,99/maand, automatische verlenging, eigenaar kan opzeggen, reeds betaalde leestoegang blijft.
- Bestaande Pro-betalingen gebruiken hun huidige livesleutel. De leesintegratie gebruikt alleen `MOLLIE_READING_TEST_KEY`; nergens een fallback op bestaande Pro-secrets.

## Wat is aangesloten in de lokale code?

`reading-http.ts` exporteert via index.ts vier apart te deployen functies:

- `readingApi`: account, checkout, cancel, leerlinglink, beschermde catalogus en factuurdownload. Alleen POST met geverifieerd Pro-ID-token; intrekkingscontrole en e-mailbevestiging. Testaccounts moeten op de UID-lijst staan. Leerlingtoken mag alleen de catalogus opvragen.
- `readingMollieWebhook`: accepteert uitsluitend een betaal-ID en haalt status opnieuw op met de aparte testsleutel. Ontbrekende orderbinding/fout geeft retry, nooit toegang op basis van browsermelding.
- `readingReconcile`: hercontrole van betalingen/abonnementen, paginering door orders en markering voor beoordeling bij onzekerheden.
- `readingMail`: standaard uit. Indien expliciet ingeschakeld gaan ALLE testberichten uitsluitend naar het ingestelde testadres. De bestaande post_msft-mailverwerker kan die afhandelen, met vaste berichtsleutels tegen dubbel queueën.

`reading-service.ts` verbindt Firestore, Mollie, het betalingenregister, opzegging en links. Klant/order en stabiele operatie-ID's worden vooraf opgeslagen. Een onzekere POST ouder dan 50 minuten wordt niet blind herhaald (Mollies idempotentiecache duurt één uur). Daarvoor blijft beoordeling/reconciliatie nodig. Een gelijktijdige opzegging wint van een net aangemaakte subscription. Ontbrekend/ongeldig mandaat wordt bij hercontrole opnieuw onderzocht.

`reading-invoice-store.ts` gebruikt de centrale `counters/test_invoice_seq`, privé-opslag `Facturen/test/<uitgiftejaar>/...`, de factuur-PDF-renderer en afzonderlijke uitgaande klant-/boekhoudtaken. Het uitgiftejaar wordt met de nummerreservering bewaard. Betaal-ID bepaalt de onveranderlijke factuur. Geen echte mail zolang de expliciete mailschakelaar uitstaat. De livefactuurteller en livefacturen worden niet gebruikt. Een mail in de wachtrij is nog geen bewijs van bezorging; controleer de bestaande mailuitbreiding bij de end-to-end-proef.

`mijn-account.html/js`: echte client voor aanmelden/registreren, verificatie/herstel, betalen, status, opzeggen, factuurdownload en leerlinglink/QR. `config.js` staat uit. `demo.html` blijft de klikbare demonstratie. De nieuwe bibliotheek vraagt catalogusdata pas na een servercontrole op. Catalogus wordt tijdens build samengesteld uit de bestaande 16 gegevensbestanden.

## Gecontroleerd in Firebase (alleen gelezen)

- Authentication e-mail/wachtwoord staat volgens de gebruikerscontrole aan.
- Firestore en Storage weigeren momenteel alle rechtstreekse client-reads/writes. Dat past bij servergestuurde toegang; geen nieuwe publieke regels nodig. Snapshots onder output/reading-existing-*.rules, niet voor publicatie.
- `MOLLIE_READING_TEST_KEY` bestaat nog niet (Secret Manager gaf 404). Geen secretwaarden gelezen, gewijzigd of opgeslagen.
- Geen functies, instellingen, regels, gebruikers of abonnementen gedeployed/aangepast tijdens de voorbereiding.

## Eerst nodig voor de cloudproef

1. Maak/gebruik in Mollie een **Test**-sleutel van het profiel **Juf Zisa's spelletjesmaker**. Bewaar hem in Secret Manager als `MOLLIE_READING_TEST_KEY`. Niet in chat of git plakken. Pro-livesleutel niet wijzigen of intrekken.
2. Vul alleen de nieuwe variabelen uit `pro_backend/reading.env.example` aan in de bestaande projectconfiguratie. Project-ID blijft Pro. Verwacht Mollie-profiel-ID, gecontroleerde test-UID en expliciet testmailadres nodig. Start met mails uit.
3. Build en lokale tests. Deploy uitsluitend `readingApi`, `readingMollieWebhook`, `readingReconcile`, `readingMail`; geen algemene backenddeploy met andere lokale werkzaamheden.
4. Stel het daadwerkelijke terugkeeradres/domein in en controleer dat dit domein voor Firebase Auth toegestaan is. Daarna alleen de leestestconfiguratie inschakelen. Geen echte verkoopknop op de openbare pagina.
5. Doorloop met een echt testaccount: e-mailbevestiging, Mollie-testcheckout, webhook, geldig mandaat, eerste testfactuur, verlenging, fout, annulering, QR, factuurdownload na afloop. Controleer dat Pro toegang blijft weigeren voor de leeskoper. Dan testmails naar het eigen testadres inschakelen en bezorging controleren.

## Nog NIET afgerond / harde grenzen vóór echte verkoop

- Er is geen echte Mollie-/Firebase-end-to-end-proef uitgevoerd: testsleutel en testconfiguratie ontbreken. Lokale tests gebruiken nagebootste Firestore en Mollie.
- Code staat doelbewust op test-only. Een live-omschakeling vergt aparte gecontroleerde configuratie en aanpassing van de moduscontroles; SEPA-goedkeuring alleen zet niets live.
- De oude openbare boekdata en `?gratis=1` bestaan nog voor de huidige omgeving. De nieuwe route controleert rechten, maar vormt geen algehele afscherming van de oude catalogus. Migratie van gratis collega's/QR's en eventuele verwijdering van publieke volledige data moeten vóór een claim van betaalde inhoudsbeveiliging worden afgewerkt.
- Automatische toewijzing van terugkerende betaalperioden accepteert alleen de verwachte providerkalenderdatum. Afwijkende/herhaalde incasso's op een andere datum gaan naar beoordeling. Verifieer Belgische tijdzone, maandultimo en retry-gedrag in Mollie voordat dit live mag.
- Gedeeltelijke refunds/chargebacks worden conservatief geweigerd voor de betreffende betaalperiode. Creditnota's en teruggedraaide chargebacks zijn nog geen automatische boekhoudflow.
- Voorwaarden/privacy, gebruiksreikwijdte en facturatie voor scholen/ondernemingen (incl. eventuele gestructureerde facturatie) moeten op de bestaande boekhoudwerkwijze afgestemd worden. Het accountformulier is geen bewijs dat die juridische/boekhoudkundige beoordeling klaar is.
- iPad/Safari en gedeelde aanmelding op het echte domein moeten met echte testaccounts worden gecontroleerd.

## Bronnen

- https://docs.mollie.com/docs/recurring-payments
- https://docs.mollie.com/reference/api-idempotency
- https://docs.mollie.com/reference/authentication
- https://firebase.google.com/docs/auth/admin/verify-id-tokens


## Besluit 27 september: vertrouwen en thuis lezen

- Eén individuele licentie van €3,99 per maand voor een leerkracht en de eigen klas.
- Geen leerlingaccounts, tijdslimieten, IP-beperkingen of apparaatlimieten. Leerlingen mogen thuis lezen.
- Nieuwe klas-QR-records hebben `expiresAt: null`; de actuele leestoegang en linkversie blijven verplicht. Oude records met een einddatum blijven die respecteren. Vervangen QR vervalt onmiddellijk; opzegging laat de betaalde periode intact.
- Schoolbestelling is lokaal geïmplementeerd in de testbackend: 2–100 plaatsen, serverberekening van prijs (399 cent per plaats), onveranderlijk aantal gedurende de looptijd, één Mollie-betaling/abonnement en één PDF per betaalperiode. De verantwoordelijke krijgt niet automatisch een leerkrachtplaats; die kan zichzelf uitnodigen. Een actief persoonlijk betaald leesabonnement moet eerst eindigen voor omzetting naar een schoolplaats. Nieuwe schoolbestelling na einde/opzegging kan; tussentijds aantal wijzigen is geen ondersteunde actie.
- `reading-school.ts`: uitnodigingen met 32 willekeurige bytes, hash in uitnodigingsrecord, 14 dagen geldig, alleen te aanvaarden via geverifieerde aanmelding met overeenkomend e-mailadres. Plaats en versie worden transactioneel gecontroleerd. Uitsluitend de koper beheert plaatsen; leerkrachten krijgen geen schoolfacturen of opzegrecht. Opnieuw versturen vervangt de uitnodiging; verwijderen/vervangen trekt de gekoppelde schoolrechten en bestaande QR-versie in. Schoolverlenging en betaalperiode gelden voor alle toegewezen plaatsen.
- Uitnodigingen gaan via de bestaande duurzame testmailwachtrij, met een activeringsknop. De verzender slaat inmiddels verlopen, vervangen of geaccepteerde uitnodigingen over. Alle mail blijft UIT tot expliciet ingeschakeld, en wordt dan uitsluitend naar het testmailadres omgeleid. Voeg ook alle leerkracht-testaccounts toe aan READING_TEST_UIDS voor de cloudproef. Geen echte school of collega is benaderd.
- `mijn-account.html/js` ondersteunt het aantal plaatsen, uitnodigen/vervangen/vrijmaken, opnieuw uitnodigen, activatie na e-mailverificatie en directe doorverwijzing naar de bibliotheek. Uitnodigingstoken wordt uit de URL-fragment naar sessionStorage gehaald om aanmelden/verifiëren op te vangen. Bij een ander apparaat opent de gebruiker de originele uitnodigingslink opnieuw. De aparte demo verstuurt nog steeds niets.
- Schoolfacturatie voor één licentie is voorbereid: afzonderlijk facturatie-e-mailadres, officiële schoolnaam/adres, Peppol-ID, optioneel GLN en bestelreferentie worden onveranderlijk meegenomen bij de factuur. Peppol/GLN-controle controleert vorm, geen registratie bij een Peppol-dienstverlener.
- Iedere nieuwe Peppol-factuur krijgt `peppolStatus: pending_manual`. De boekhoudmail bevat de opdracht en gegevens voor handmatige verzending. Nooit een tweede factuur aanmaken voor die verzending. Een beheerscherm voor markeren als verzonden met verzendreferentie en controle van de nummering in de gebruikte boekhoudsoftware moet nog toegevoegd worden. Geen Peppol-verzending uitgevoerd of geautomatiseerd.
- Alle 40 lokale tests slagen. QR zonder vervaldatum, intrekking/afgelopen recht, Peppol-gegevens en facturatieadres versus accounteigenaar zijn gecontroleerd met nagebootste diensten. Er is niets naar Firebase of Mollie gepubliceerd.


## Factuurarchief per product en kalenderjaar
Nieuwe testleesfacturen: `Facturen/test/Zisa Lezen/<uitgiftejaar>/factuur-zisa-lezen-TEST-....pdf`. Jaar en uitgiftedatum worden bij de eerste reservering vastgesteld (Europe/Brussels) en bij retries hergebruikt. Bestaande archiefpaden worden behouden. Live-equivalent bij latere live-inrichting: `Facturen/live/Zisa Lezen/<uitgiftejaar>/factuur-zisa-lezen-<nummer>.pdf`. Centrale factuurnummering blijft gedeeld met Pro. Pro-bestanden worden niet verplaatst. Download en mailbijlage hebben hetzelfde herkenbare voorvoegsel.
De schoolkoppeling is gebouwd en lokaal met nagebootste diensten getest, maar nog niet gedeployed of met echte Firebase/Mollie getest. Geen regels of productie-instellingen gewijzigd. De eerdere liveblokkades hierboven blijven gelden. PDF-voorbeeld voor vier plaatsen visueel gecontroleerd; geen echte factuur gereserveerd.


## Testpublicatie 27 september 2026
De vier leesfuncties zijn nu afzonderlijk naar het bestaande Pro-project gepubliceerd, met Mollie in testmodus en een expliciete test-UID en testmailontvanger. Bestaande Pro-functies zijn niet meegenomen. Alleen HTTP-ingangen readingApi en readingMollieWebhook zijn publiek bereikbaar; readingApi controleert Firebase-aanmelding en de test-UID, de webhook haalt betaalgegevens zelf bij Mollie op. Zonder login retourneert readingApi/account de applicatiemelding Aanmelden vereist.
De client wordt alleen via de expliciete query `?test=1` ingeschakeld. De gewone verkooppagina blijft een demo. Deze query is geen toegangsrecht: dat wordt op de server gecontroleerd. Geheime sleutel en privé-testconfiguratie staan niet in Git. De publicatiewerkmap bevat een lokale `.env.zisa-spelletjesmaker-pro`; nooit breed stage/add uitvoeren.
De opgeslagen testsleutel is intern gecontroleerd en hoort bij het spelletjesmaker-profiel. De eerste cloudbuild faalde door de oudere lockfile; de lockfile is gelijkgezet met de reeds bestaande Node 22-instelling. Vervolgens zijn alle vier de leesfuncties succesvol gepubliceerd. Volledige aangemelde aankoop, e-mailbezorging, activering en annulering met echte testaccounts moeten nog doorlopen worden.
