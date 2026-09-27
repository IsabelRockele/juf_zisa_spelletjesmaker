# Zisa Lezen - actuele voorbereiding

De actuele architectuur en resterende stappen staan in [INTEGRATIE.md](INTEGRATIE.md). Dit vervangt de eerdere voorbereiding met een apart Firebase-project.

- Gedeelde aanmelding in het bestaande Pro-project, afzonderlijke leesrechten.
- EUR 3,99 per maand, automatische verlenging, maandelijkse opzegging met behoud van betaalde toegang.
- Bestaande gratis collega's behouden hun toegang. Deze interne afspraak niet op de verkooppagina uitleggen.
- Mollie-profiel: Juf Zisa's spelletjesmaker. JouwWeb en de bestaande Pro-livesleutel blijven ongewijzigd.
- Facturen: centrale administratie bij Pro, aparte testreeks, klantkopie en boekhoudkopie. Testmail standaard uit en bij expliciete inschakeling uitsluitend naar het ingestelde testadres.
- Demo: account.html. Echte maar uitgeschakelde client: mijn-account.html. Voorbeeldfactuur: voorbeeldfactuur.pdf.
- Server: readingApi, readingMollieWebhook, readingReconcile, readingMail. Alleen lokaal gebouwd, niet gedeployed.

Build en lokale tests worden bijgehouden in de taak. Cloudtests zijn nog niet uitgevoerd. Firebase-regels zijn alleen uitgelezen en staan dicht voor clienttoegang. De aparte Mollie-testsleutel ontbreekt nog. Bestaande gratis/Pro-pagina's en rechten zijn niet gewijzigd.

**Niet publiceren als verkoopklaar.** Lees de concrete resterende grenzen in INTEGRATIE.md voordat test of live geactiveerd wordt.

## Laatste controles

TypeScript-build geslaagd; 30 lokale tests geslaagd (nagebootste Firestore/Mollie, geen cloudtransacties). Nieuwe account- en bibliotheekpagina in de browser gecontroleerd met de configuratie uit: geen accountactie, geen boekgegevens geladen, geen consolefouten op de accountpagina. De echte server-PDF-renderer lokaal gegenereerd en visueel gecontroleerd. Factuurnummering in Firebase is daarbij niet aangeroepen.


### Eerlijk gebruik en schoolfacturatie (27 september)
De voorbereiding vermeldt één leerkracht en de eigen klas voor €3,99 per maand. Thuis lezen via de klas-QR blijft mogelijk zonder sessie- of apparaatlimiet. De QR blijft afhankelijk van actieve leestoegang en kan vervangen worden.
Peppolvelden, apart facturatie-e-mailadres en de boekhoudmelding voor handmatige verzending zijn toegevoegd. De schoolbestelling voor meerdere collega’s is doorklikbaar in `demo.html#school`, maar bundelbetalingen, toewijzing van accounts en gezamenlijk PDF-document zijn nog niet gekoppeld. Zie INTEGRATIE.md voor de resterende stappen. 33 lokale tests geslaagd; niets live gezet.


### Schoolkoppeling lokaal afgebouwd
De testbackend en accountpagina ondersteunen nu meerdere plaatsen, uitnodigen/aanvaarden met eigen accounts, opnieuw uitnodigen, plaats vrijmaken/vervangen en gezamenlijke maandfacturen. 40 lokale tests geslaagd. Nieuwe testfacturen worden per product en kalenderjaar opgeslagen onder `Facturen/test/Zisa Lezen/<jaar>/`; herkenbare bestandsnamen beginnen met `factuur-zisa-lezen-`. De eerdere opmerking dat alleen een schooldemo bestaat is daarmee achterhaald. Er is nog niets naar Firebase/Mollie gepubliceerd: echte testaccounts en veilige testconfiguratie zijn de volgende stap.
