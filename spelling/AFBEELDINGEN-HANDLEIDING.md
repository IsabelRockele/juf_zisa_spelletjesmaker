# 🖼️ Afbeeldingen toevoegen aan de Spellinggenerator

## Map-structuur

```
/spelling/
  /afbeeldingen/
    /graad1/
      /stukjes/
        kat.png
        bal.png
        muur.png
        ...
```

## Werking

- Elk woord in `graad1.js` heeft een `afbeelding: true/false` flag
- Bij `afbeelding: true` → werkblad laadt `afbeeldingen/graad1/stukjes/{woord}.png`
- Bij `afbeelding: false` → werkblad toont een **emoji-fallback** (uit `afbeeldingen.js`)
- Bij `true` maar bestand ontbreekt → **automatisch fallback** naar emoji (geen kapot werkblad)

## Stap 1 — Afbeelding maken

- Format: **PNG** met transparante achtergrond (of witte achtergrond)
- Grootte: **min. 200×200 pixels** (mag groter, wordt geschaald)
- Stijl: bij voorkeur eenvoudige zwart-wit illustratie of pasteltekening (zoals in de Klinkerdief-bundel)
- Naam = woordenboek-naam, **kleine letters, geen spaties**: `kat.png`, `appel.png`, `lopen.png`

## Stap 2 — Afbeelding opslaan

Sla op in: `afbeeldingen/graad1/stukjes/{woord}.png`

Voorbeeld:
- Voor "kat" → `afbeeldingen/graad1/stukjes/kat.png`
- Voor "muur" → `afbeeldingen/graad1/stukjes/muur.png`

## Stap 3 — Flag aanzetten in graad1.js

Open `graad1.js` en zoek het woord. Verander `afbeelding: false` naar `afbeelding: true`:

```js
// VOOR
{ tekst: "muur", lidwoord: "de", afbeelding: false },

// NA
{ tekst: "muur", lidwoord: "de", afbeelding: true },
```

Bewaar → harde refresh → klaar!

## Stap 4 — Controleer wat al klaar is

In de browser-console:

```javascript
window.SpellingAfbHelper.statistiekPerCategorie(1)
```

Geeft per categorie hoeveel woorden al een afbeelding hebben.

## Welke woorden zijn alvast op `true` gezet?

Dit zijn woorden die in jouw bestaande bundels al afbeeldingen hadden (bv. KinderBundel_DeKlinkerdief). De flag staat al op `true`, maar **de afbeelding-bestanden moeten nog in de juiste map gezet worden** voordat ze in de generator verschijnen (anders wordt automatisch de emoji-fallback gebruikt).

Lijst (135 woorden):
- **Stukjes-verdubbel**: kat, vis, kip, bom, pan, tak, bal, stip, zak, trap, sok, kikker, ladder, letter, zwemmen, vallen, zitten, tikken, rennen
- **Stukjes-verenkel**: muur, boom, schaap, tafel, lepel, lopen, slapen, eten, kraan, raam, ...
- **Stukjes-geen-regel**: hand, lamp, wolk, winter, wortel, paard, kast, plant, arm, hoofd
- **Andere meervouden**: huis, trein, tuin, deur, bloem, leeuw, meeuw, koe, bij, schoen, neus, muis, hond, stoel, boek, broek, struik, berg, appel, vlinder, ui
- **Verkleinwoorden**: buik, droom

## Tips

- **Begin met de 9 woorden die je in OV09 ⭐⭐⭐ wil gebruiken** — die zijn meteen zichtbaar
- Voor OV09 ⭐⭐⭐: je hebt **min. 3 woorden per regel-type** nodig (3× verdubbel, 3× verenkel, 3× hoort)
- Hergebruik afbeeldingen uit je KinderBundel als je die nog hebt

## Console-helpers

```javascript
// Hoeveel woorden hebben afbeelding=true per categorie?
window.SpellingAfbHelper.statistiekPerCategorie(1)

// Welke woorden in een categorie hebben een afbeelding?
window.SpellingWoordenbibliotheek.graad1["stukjes-verdubbelen"].woorden.filter(w => w.afbeelding)
```
