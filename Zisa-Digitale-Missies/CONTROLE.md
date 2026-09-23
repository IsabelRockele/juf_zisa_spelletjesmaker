# Controle van versie 2.0

Uitgevoerd op 23 september 2026:

- Zelfstandige Next.js-productiebouw geslaagd, inclusief TypeScriptcontrole en de nieuwe route /doelen.
- Alle 13 missies aanwezig, inclusief de laatste compacte schermen, batterijoefening, paginering, klasmappen en naamkaartjes.
- 22 doelcodes en de bijbehorende doelzinnen en leeftijdsvlaggen geëxtraheerd uit het aangeleverde leerplanbestand (tabblad ICT). Alle missiekoppelingen verwijzen naar bestaande codes uit deze selectie.
- Geen runtimeverwijzingen naar de oude site, ChatGPT-aanmelding, vaste eigenaar of Cloudflare-opslag in app, lib, integration, public en scripts.
- Geen tweede login. De serveradapter accepteert uitsluitend de bestaande sessie nadat deze in het doelproject gekoppeld is. Tot dan blijven ontvangen werkjes afgeschermd.
- Node/SQLite-referentieopslag gecontroleerd: schrijven/lezen/verwijderen en filteren op eigenaar. Alleen tijdelijke testgegevens buiten het pakket gebruikt.
- De eerder gecontroleerde PDF-werkbladen zonder oude QR-bestemming behouden; nogmaals gecontroleerd op oude site-URL's.
- ZIP gecontroleerd op leesbaarheid, noodzakelijke bestanden en afwezigheid van buildoutput, node_modules, sessies, databasebestanden en geheime instellingen.

Nog uit te voeren in de repository van de spelletjesmaker:

- Bestaande sessie, rechten, leerlingtoegang, opslag en definitieve subpaden aansluiten.
- Complete instuur-/ontvang-/afdrukketen testen met de bestaande accounts, waaronder twee verschillende leerkrachten.
- Fysieke iPadcontrole van spraak, film, touch, schermhoogte en downloadgedrag.
- Doelenoverzicht en afdruk ervan in de definitieve applicatie controleren.

De bron van de actuele missiecode is de gepubliceerde versie met commit 491c54e4a65e95c3a4c343b4595977303daf59eb. Het doelenoverzicht en de onafhankelijke sessie-/opslagkoppeling zijn daarna in dit integratiepakket toegevoegd. De live voorbeeldsite is niet gewijzigd door het maken van deze ZIP.
