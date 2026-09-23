# Opdracht aan Codex in zisa_spelletjesmaker

Voeg de bijgevoegde **Zisa’s digitale missies** toe als module aan mijn bestaande zisa_spelletjesmaker. Voer het werk uit; maak niet alleen een plan. Lees eerst de instructies en architectuur van deze repository. Behoud de bestaande stack, navigatie, vormgeving en andere spellen. Maak geen losse ChatGPT-site.

## Aanmelding: geen tweede login

Gebruikers zijn al ingelogd in mijn spelletjesmaker. Gebruik exact die bestaande aanmelding. Voeg geen eigen wachtwoord, tweede loginpagina, nieuw accountstelsel of extra sessiecookie toe. Lees `integration/host-session.ts` en vervang de fail-closed adapter met de bestaande server-gecontroleerde sessie en rechten. Controleer leerkrachtrechten server-side bij iedere les- en werkjes-API. Een leerkracht ziet alleen de eigen lessen/werkjes. Vertrouw nooit een user-id of rol uit localStorage, querystrings of ongeverifieerde headers. Gebruik de bestaande afmeldfunctie van de hostapp.

Plaats de volledige module achter de bestaande toegangscontrole, ook `atelier.html` en de API's. Behoud de bestaande regeling voor leerlinglinks/klascodes; maak geen nieuw aanmeldscherm voor kinderen. Als het doelproject leerlingen via tijdelijke leslinks toegang geeft, hergebruik die regeling uit het doelproject met uitsluitend inzendrechten en zonder inboxrechten.

## Functionaliteit behouden

Behoud alle dertien missietegels in het gezamenlijke overzicht met leeftijdskeuze en paginering, het tekenatelier, de zeven filmpjes en bijbehorende pauzeopdrachten, robotroutes met gelijke vierkante vakjes en het echte robotje, veiligheidssituaties, Slim zoeken met meerdere juiste antwoorden waar nodig, en Zelf opzoeken als aparte tegel. De woordenbibliotheek toont uitleg en afbeelding pas nadat een kind het woord heeft opgezocht. Behoud de luidsprekers bij opdrachten en antwoorden. Behoud de vier zoekwerkbladen en de oplossingen.

Voor het leerkrachtenscherm: klascode en QR, automatische ontvangst, individueel/gezamenlijk afdrukken en smartboarddemonstratie. Gebruik de bestaande database/bestandopslag van deze app indien beschikbaar. De SQLite-/bestandsadapter is een werkende referentie voor één Node-server; zet die niet ongewijzigd op vluchtige serverless opslag. Voeg benodigde tabellen/collecties, regels en indexes toe zonder bestaande gegevens te overschrijven. De SQL en API tonen het huidige datamodel.

Behoud ook de zeven missies uit /ontdekken, de mappen 1A en 2A, naamkaartjes met echte download en inzending, het compacte batterijscherm, en /doelen met leerplandoelen per missie. Gebruik data-curriculum/goals.json als bron voor het overzicht; verander leeftijdsvlaggen of officiële doelteksten niet zonder onderbouwing. De koppelingen in LEERPLANDOELEN.md geven aan wat gedeeltelijk wordt geoefend.

## Integreren

1. Lees LEESMIJ.md. Bepaal een modulepad dat geen bestaande route overschrijft.
2. Neem code/assets over en pas imports aan de bestaande stack aan. Behoud een geschikt huidig dependency-lockbestand van het doelproject; kopieer niet blind package.json of alle dependencies over.
3. Pas ALLE domeinroot-paden aan: navigatie, fetch, API-router, css url(), afbeeldingen, iframes, downloads, leerlinglinks en QR-codes. Scan de losse public/app.js en atelier.html expliciet.
4. Koppel de bestaande sessie/rechten en opslag. Geen beveiliging uitschakelen om een werkende demo te krijgen.
5. Gebruik eventueel de reeds ingestelde Vlaamse stemdienst uit de hostapp. Geen sleutels vragen of hardcoden als die al veilig zijn geconfigureerd.
6. Genereer de PDF's met de definitieve woordenboek-URL via scripts/make-word-worksheets.py. Controleer QR-bestemming en afdruklayout. Laat nooit de oude chatgpt.site-bestemming staan.
7. Test de volledige leerling → klascode → insturen → leerkracht → print-keten met testgegevens. Test ook sessieverloop, verkeerde klascode, gesloten les, herhaalde inzending, ongeauthenticeerd bezoek en twee verschillende leerkrachtaccounts.
8. Controleer mobiel/iPad: vingertekenen zonder scrollen op het canvas, tekstbewerking, spelerknoppen, luidsprekers, vierkante robotvakjes, meerkeuze en woorden zoeken. Laat andere modules ongemoeid.
9. Rond af volgens de normale publicatieprocedure van deze repository. Rapporteer welke koppelingen zijn gemaakt en wat nog werkelijk blokkeert.

Alle beschikbare afbeeldingen en werkbladen zitten in deze zip. De YouTube-filmpjes blijven embeds met bronvermelding. Er zijn geen API-sleutels, gebruikerssessies of leerlinggegevens meegeleverd.
