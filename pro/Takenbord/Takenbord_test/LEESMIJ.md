# 📊 Graadsklas-weergave — Productieversie

## Wat zit er in dit pakket?

**Nieuwe bestanden** om in je `/pro/Takenbord/` map te plaatsen:

1. `klasbord_graad.html` — Leerkrachtweergave (2 borden naast elkaar op smartboard)
2. `klasbord_graad.js` — JavaScript voor leerkrachtweergave
3. `klasbord_kind_graad.html` — Keuzescherm voor kinderen op iPad

**Patch-instructies** voor bestaande bestanden:

4. `WELKOMSTBORD_PATCH.txt` — 4 kleine wijzigingen in `welkomstbord.html`
5. `KLASBORD_JS_PATCH.txt` — 1 kleine wijziging in `klasbord.js` (4 regels)

## Installatie-volgorde

1. **Kopieer de 3 nieuwe bestanden** naar `/pro/Takenbord/` naast je bestaande `klasbord.html`
2. **Open `welkomstbord.html`** in VS Code en pas de 4 edits toe uit `WELKOMSTBORD_PATCH.txt`
3. **Open `klasbord.js`** en pas de 1 edit toe uit `KLASBORD_JS_PATCH.txt`
4. Push via GitHub Desktop

## Hoe het werkt

### Voor de leerkracht

**Aanmaken:**
1. Open `welkomstbord.html` (zoals anders)
2. Maak gewoon je 2 klasborden aan (3A met derde-leerjaars-namen en -taken, 4A idem)
3. Scroll naar onder → zie je de nieuwe sectie **"📊 Graadsklas-weergave"**
4. Klik **"➕ Graadsklas-weergave aanmaken"**
5. Kies de 2 borden + geef elk een korte klaslabel (bv. 3A, 4A)
6. Klik "Aanmaken en openen" → je komt direct in de graadsklas-weergave

**Gebruiken op smartboard:**
- 2 borden naast elkaar, elk in eigen kleurschema (oranje / blauw)
- Tik op een taakhokje → leeg → 🔄 bezig → ✓ klaar
- Pijltjes ◀ ▶ per bord om naar meer taken te scrollen
- Sticky namen en taakrij: blijven altijd zichtbaar
- Live-sync: als kinderen op de iPad iets aanvinken, verschijnt dat hier meteen

**Beheer vanuit graadsklas-weergave:**
- **⚙️ Beheer**-knop per bord → opent dat bord in een **nieuw tabblad**
  → volledig beheer (namen, taken, foto's, bevindingen, pupilTaskOverrides, …) zoals je gewoon bent
- Wijzigingen zijn na korte tijd ook zichtbaar in de graadsklas-weergave (live listener)
- **📄 PDF**-knop per bord → opent dat bord met PDF-exportvenster open
- **📱 QR voor iPad**-knop → QR-code voor het keuzescherm voor de kinderen

### Voor de kinderen (iPad)

1. QR scannen → keuzescherm met 🦒 **3A** en 🦓 **4A** (grote knoppen)
2. Kind tikt op zijn klas → wordt doorgestuurd naar het normale kindbord van dat bord
3. Daar werkt alles zoals gewoon: taken aftikken, smileys, … (volledig het bestaande `klasbord_kind.html`)
4. Via de knop "← Andere klas" kan een kind terug naar keuzescherm als hij zich vergiste

## Technische details

### Data-opslag

De graadsklas-koppeling wordt op 2 plaatsen opgeslagen:

1. **In je meta-doc** (samen met de borden-index) → `graadsklassen[]` array → voor het welkomstbord-dashboard
2. **In `klasbord_shared/graadsklas_{id}`** → voor iPads om zonder login de set te kunnen laden via de QR

De individuele klasborden blijven gewoon waar ze waren — die worden op geen enkele manier aangepast.

### Firestore-regels

Geen wijzigingen nodig. De bestaande regels voor `klasbord_shared` werken ook voor de nieuwe `graadsklas_{id}`-documenten.

### Wat er NIET is aangepast

- `klasbord.html` — ongewijzigd, je bord-beheer blijft identiek
- `klasbord_kind.html` + `klasbord_kind.js` — ongewijzigd, het kindbord blijft identiek
- `firebase-klasbord.js` — ongewijzigd, hergebruikt bestaande functies
- `device-id.js`, `guard.js` — ongewijzigd

### Edge cases die al afgedekt zijn

- Als een leerkracht een bord verwijdert dat gebruikt wordt in een graadsklas-koppeling: het openen van de graadsklas-weergave toont dan een leeg bord met melding "Geen leerlingen — klik ⚙️ Beheer om toe te voegen". De koppeling blijft bestaan tot de leerkracht hem zelf verwijdert.
- Als een leerkracht minder dan 2 klasborden heeft: de "Graadsklas-weergave aanmaken"-knop is uitgegrijsd met melding "Eerst 2 klasborden aanmaken".
- Op touch-apparaten (iPad, telefoon) zijn de scroll-pijltjes automatisch verborgen; swipen werkt gewoon.
- Als een leerkracht in een ander tabblad taken aanpast in het gewone klasbord, wordt dat binnen een paar seconden automatisch in de graadsklas-weergave zichtbaar (via `fbListenShared`).

## Testvolgorde na deployment

1. Ga naar welkomstbord → scroll onderaan → zie je de nieuwe sectie?
2. Klik aanmaken → kies 2 borden → geef labels → klik "Aanmaken en openen"
3. Graadsklas-weergave opent: zie je 2 borden naast elkaar? Werkt scroll-pijltjes? Werkt status-tikken?
4. Klik **⚙️ Beheer** op bord 1 → opent dat nieuwe tabblad naar instellingen? Voeg een taak toe, sluit tabblad → zie je die nieuwe taak na een paar seconden in de graadsklas-weergave?
5. Klik **📄 PDF 3A** → opent klasbord met PDF-dialoog?
6. Klik **📱 QR voor iPad** → scan met iPad → keuzescherm werkt?
7. Kies 3A op iPad → kind aftikken → gaat dat terug naar de graadsklas-weergave op smartboard?
8. Verwijder de graadsklas-koppeling via het welkomstbord → zie je dat hij weg is? Zijn je 2 originele klasborden nog aanwezig?

Veel succes met de livegang!
