# 🧪 takenbord_test — alles klaar voor testen

## Wat zit erin?

Deze map bevat **alle bestanden van je echte Takenbord + alle patches voor de graadsklas-weergave al toegepast**. Je hoeft niks handmatig te wijzigen. Je raakt je productie-bestanden in `/pro/Takenbord/` **niet** aan.

## Installatie

1. **Kopieer deze hele map** naar `/pro/Takenbord/takenbord_test/` in je GitHub-repo
2. **Push via GitHub Desktop**
3. **Test op:**
   ```
   https://isabelrockele.github.io/[jouw-repo]/pro/Takenbord/takenbord_test/welkomstbord.html
   ```
4. (of lokaal via Live Server in VS Code — dat lijkt te werken blijkens je screenshot)

## Te starten vanaf `welkomstbord.html`!

**Open NIET direct `klasbord_graad.html`** — dan krijg je de foutmelding "Geen graadid in URL" (dat is normaal gedrag, zoals je al zag).

Start altijd bij `welkomstbord.html`. Scroll onderaan en je ziet de nieuwe sectie **"📊 Graadsklas-weergave"**.

## Testvolgorde

### 1. Zet 2 testborden klaar
Als je nog geen 2 klasborden hebt: maak er eerst 2 aan (bv. "Test-3A" en "Test-4A"), voeg wat namen en taken toe. Het maakt niet uit of het bestaande borden zijn of nieuwe — maar pas op met verwijderen, want het is **dezelfde Firestore-database als je echte borden!**

### 2. Maak een graadsklas-weergave aan
- Scroll onderaan → klik **"➕ Graadsklas-weergave aanmaken"**
- Geef een naam (bv. "Mijn test-graadsklas")
- Kies bord 1 + label (bv. "3A")
- Kies bord 2 + label (bv. "4A")
- Klik **"Aanmaken en openen"** → je komt automatisch in de graadsklas-weergave

### 3. Test de leerkrachtweergave
- 2 borden naast elkaar in oranje/blauw?
- Tik op een taakhokje: leeg → 🔄 bezig → ✓ klaar
- Scroll-pijltjes ◀ ▶ werken per bord?
- Sticky namen (blijven staan bij horizontaal scrollen)?
- Sticky taakrij (blijft staan bij verticaal scrollen)?

### 4. Test de ⚙️ Beheer-knop
- Klik ⚙️ Beheer op bord 1 → opent nieuw tabblad met het gewone klasbord in instellingen-modus
- Voeg daar een leerling of taak toe, sluit tabblad
- Kijk terug naar graadsklas-weergave: zie je de wijziging verschijnen (binnen ~5 seconden via live-listener)?

### 5. Test de 📄 PDF-knop
- Klik **📄 PDF 3A** → opent bord 1 in nieuw tabblad met PDF-modal meteen open
- Klik hetzelfde voor 4A

### 6. Test de 📱 QR-knop
- Klik **📱 QR voor iPad** → toont QR-code + link
- Open die link op je telefoon of in een incognito-tabblad
- Je ziet keuzescherm 🦒 3A + 🦓 4A
- Tik een klas → komt in kindbord
- Vink taak af → zie je dat live verschijnen in de graadsklas-weergave?

### 7. Test verwijderen
- Terug naar welkomstbord → klik 🗑 bij je testgraadsklas → bevestig
- Check: zijn je 2 originele klasborden nog aanwezig? (Ja — de koppeling is weg, de borden blijven)

## Als iets niet werkt

Open de browser-console (F12) en kijk naar foutmeldingen. Stuur die door dan help ik verder.

## Technische merkwaardigheid

Omdat deze map op `/pro/Takenbord/takenbord_test/` staat (één niveau dieper dan de echte bestanden), zijn alle paden naar `device-id.js` en `guard.js` aangepast van `../` naar `../../`. Bij de echte livegang terug naar `/pro/Takenbord/` mag dat weer `../` worden — maar in de echte productie-bestanden staat dat al goed en daar komt dit pakket niet aan.
