/************************************
 * Rekendoolhof-generator
 *
 * Doelen:
 * 1. Keuze tussen:
 *    - "sprongen": getallen volgen met sprongen (2 / 5 / 10)
 *    - "maze": leeg rooster + pijlen volgen
 *
 * 2. Thema (icoontjes, uitlegtekst):
 *    herfst / sint / pasen / lente / zomer
 *
 * 3. Pad niet telkens hetzelfde:
 *    we kiezen willekeurig uit meerdere voorgeprogrammeerde paden.
 *
 * 4. Sprong en bereik werken echt:
 *    sprong = stapgrootte, bereikMax = max. afleiders / startkeuze.
 *
 * 5. Meerdere oefeningen op één blad:
 *    we bouwen bv. 2 oefenblokken onder elkaar.
 ************************************/

/* ========= STATE ========== */
const state = {
  type: "sprongen",
  sprong: 5,
  bereikMax: 100,
  thema: "herfst",
  size: 5,
  startMode: "mooi" // "mooi" of "vrij"
};

let worksheetItems = [];



/* ========= THEMA INFO ========== */
function getThemaInfo(thema){
  switch (thema) {
    case "herfst":
      return {
        startIcon: "🐿️",
        endIcon: "🌰",
        uitleg: "Thema herfst. De eekhoorn wil naar zijn eikel."
      };
    case "sint":
      return {
        startIcon: "🎅",
        endIcon: "🎁",
        uitleg: "Thema Sint. De Sint wil naar zijn pakje."
      };
    case "pasen":
      return {
        startIcon: "🐰",
        endIcon: "🥚",
        uitleg: "Thema Pasen. Het konijntje wil naar zijn ei."
      };
    case "lente":
      return {
        startIcon: "🐦",
        endIcon: "🌸",
        uitleg: "Thema lente. Het vogeltje wil naar de bloem."
      };
    case "zomer":
      return {
        startIcon: "🏖️",
        endIcon: "🍦",
        uitleg: "Thema zomer. We gaan naar het ijsje."
      };
    default:
      return {
        startIcon: "🐿️",
        endIcon: "🌰",
        uitleg: "De eekhoorn wil naar zijn eikel."
      };
  }
}

/* ========= PADVARIANTEN ==========
   We geven meerdere 5x5-routes (start linksonder, eind rechtsboven).
   Elke route is een lijst van [r,c].
   We kiezen elke keer één willekeurige route.
   Alle routes hebben bochten.
*/
const PAD_VARIANTEN = [
  // variant A
  [
    [4,0],[4,1],[3,1],[3,2],[2,2],[2,3],[2,4],[1,4],[0,4]
  ],
  // variant B
  [
    [4,0],[4,1],[4,2],[3,2],[2,2],[1,2],[1,3],[1,4],[0,4]
  ],
  // variant C
  [
    [4,0],[3,0],[3,1],[3,2],[2,2],[2,3],[1,3],[1,4],[0,4]
  ],
  // variant D (de oude die u al zag, ook bochtig)
  [
    [4,0],[4,1],[4,2],[3,2],[2,2],[2,3],[2,4],[1,4],[0,4]
  ]
];
// Genereer een pad met variatie voor gegeven rooster-grootte.
// We starten linksonder (row = size-1, col = 0).
// We willen ongeveer richting rechtsboven gaan (row = 0, col = size-1).
// We bouwen stap voor stap. Elke stap is maximaal 1 vakje omhoog, omlaag,
// links of rechts (geen diagonaal).
// We vermijden terug- en terug- en terug-lopen in hetzelfde kleine hoekje.
// We stoppen zodra we voldoende lengte hebben voor een oefening.
function genereerPadVoorSize(size){
  // We bouwen het pad zelf stapsgewijs.
  // Start = linksonder (size-1,0)
  // Doel = rechtsboven (0,size-1)
  // We proberen altijd buur-stappen (up/right) en af en toe een kleine zijsprong
  // (left/down) om bochten te maken, maar we vermijden dubbele cellen.

  const doelR = 0;
  const doelC = size - 1;

  // hulpfunctie om unieke cellen toe te voegen
  function pushUniek(padArr, r, c){
    const last = padArr[padArr.length-1];
    if (!last || last[0] !== r || last[1] !== c){
      padArr.push([r,c]);
    }
  }

  function maakKandidaat(){
    let r = size - 1;
    let c = 0;
    const padArr = [[r,c]];

    // we bouwen tot we de rechterbovenhoek bereikt hebben
    // maar om variatie te hebben, kiezen we soms eerst "rechts", soms eerst "omhoog".
    // We laten max size*size stappen om te voorkomen dat we vastlopen.

    for (let steps = 0; steps < size*size; steps++){
      if (r === doelR && c === doelC){
        break; // we zijn al aan het doel
      }

      // mogelijke richtingen
      const opties = [];

      // voorkeur: naar rechts als nog niet laatste kolom
      if (c < doelC) {
        opties.push("right");
        opties.push("right"); // dubbel gewicht
      }
      // voorkeur: omhoog als we nog niet op rij 0 zitten
      if (r > doelR){
        opties.push("up");
        opties.push("up"); // dubbel gewicht
      }

      // extra variatie: heel soms een kleine zijsprong "om te kronkelen",
      // maar alleen als we NIET terug buiten het bord gaan
      if (c > 0) {
        opties.push("left");
      }
      if (r < size-1){
        opties.push("down");
      }

      // we willen niet meteen exact terugkeren (right dan left onmiddellijk, of up dan down)
      function tegengesteld(a,b){
        return (
          (a==="right" && b==="left") ||
          (a==="left"  && b==="right")||
          (a==="up"    && b==="down") ||
          (a==="down"  && b==="up")
        );
      }

      // laatste richting?
      let lastDir = null;
      if (padArr.length >= 2){
        const [pr,pc] = padArr[padArr.length-2];
        if (r === pr && c === pc+1) lastDir = "right";
        else if (r === pr && c === pc-1) lastDir = "left";
        else if (c === pc && r === pr-1) lastDir = "up";
        else if (c === pc && r === pr+1) lastDir = "down";
      }

      // filter opties die meteen perfect tegengesteld zouden zijn
      const gefilterd = opties.filter(dir => !(lastDir && tegengesteld(lastDir,dir)));

      if (gefilterd.length === 0){
        break; // geen geldige richting meer -> stoppen
      }

      // kies willekeurig uit de gefilterde lijst
      const dir = gefilterd[Math.floor(Math.random()*gefilterd.length)];

      // voer die stap uit als die binnen het rooster blijft
      let nr = r;
      let nc = c;
      if (dir === "right") nc = c+1;
      else if (dir === "left") nc = c-1;
      else if (dir === "up") nr = r-1;
      else if (dir === "down") nr = r+1;

      if (nr < 0 || nr >= size || nc < 0 || nc >= size){
        // ongeldige stap, probeer opnieuw door de loop verder te laten draaien
        continue;
      }

      // voeg cel toe als nieuwe stap
      pushUniek(padArr, nr, nc);
      r = nr;
      c = nc;

      // als we dichtbij het doel zijn maar nog niet exact,
      // duwen we de rest gewoon recht naar boven en dan naar rechts (of omgekeerd)
      if (r === doelR && c !== doelC){
        while (c < doelC){
          c++;
          pushUniek(padArr, r, c);
        }
      }
      if (c === doelC && r !== doelR){
        while (r > doelR){
          r--;
          pushUniek(padArr, r, c);
        }
      }
      if (r === doelR && c === doelC){
        break;
      }
    }

    // als we na de lus nog niet bij het doel zijn, maak rechtstreekse "sluipweg"
    if (!(r === doelR && c === doelC)){
      while (r > doelR){
        r--;
        pushUniek(padArr, r, c);
      }
      while (c < doelC){
        c++;
        pushUniek(padArr, r, c);
      }
    }

    return padArr;
  }

  // We proberen een paar keer een kandidaat en kiezen de langste (meer bochten).
  let beste = null;
  for (let t=0; t<4; t++){
    const cand = maakKandidaat();
    if (!beste || cand.length > beste.length){
      beste = cand;
    }
  }
  return beste;
}




function kiesPad(avoidPadIndex = -1){
  // kies willekeurige index die niet gelijk is aan avoidPadIndex
  let idx;
  do {
    idx = Math.floor(Math.random()*PAD_VARIANTEN.length);
  } while (idx === avoidPadIndex && PAD_VARIANTEN.length > 1);
  return { path: PAD_VARIANTEN[idx], index: idx };
}
// pad uit 5x5 rekken naar bv. 7x7 of 10x10
function schaalPad(pad5, size){
  if (size === 5) return pad5;
  const maxIdx = 4; // originele pad gebruikt r/c 0..4
  const factor = (size-1)/maxIdx;
  const nieuw = [];
  for (const [r,c] of pad5){
    const nr = Math.round(r * factor);
    const nc = Math.round(c * factor);
    if (
      !nieuw.length ||
      nieuw[nieuw.length-1][0] !== nr ||
      nieuw[nieuw.length-1][1] !== nc
    ){
      nieuw.push([nr,nc]);
    }
  }
  // zorg dat eerste echt linksonder zit, laatste echt rechtsboven
  nieuw[0] = [size-1,0];
  nieuw[nieuw.length-1] = [0,size-1];
  return nieuw;
}


/* ========= MAZE PIJLEN ==========
   Voor het lege doolhof met pijlen. Kinderen volgen pijlen met de vinger.
   U kunt hier varianten maken of randomiseren als u wenst.
*/
// Maak pijlenreeks op basis van het gekozen pad
// pad is bv. [[4,0],[4,1],[3,1],...]
// We vertalen beweging per stap:
// (r,c)->(r,c+1)  = →
 // (r,c)->(r,c-1)  = ← (komt zelden voor maar kan)
// (r,c)->(r-1,c)  = ↑
// (r,c)->(r+1,c)  = ↓
function pijlenUitPad(pad){
  const pijlen = [];
  for (let i=0; i<pad.length-1; i++){
    const [r1,c1] = pad[i];
    const [r2,c2] = pad[i+1];
    if (r2 === r1 && c2 === c1+1) pijlen.push("→");
    else if (r2 === r1 && c2 === c1-1) pijlen.push("←");
    else if (c2 === c1 && r2 === r1-1) pijlen.push("↑");
    else if (c2 === c1 && r2 === r1+1) pijlen.push("↓");
  }
  return pijlen;
}
// Voeg een extra pijl toe vóór de start (richting in) en na het einde (richting uit)
function pijlenMetInEnUit(pad) {
  const pijlen = pijlenUitPad(pad);

  // eerste stap: waar ligt de ingang?
  const [r1, c1] = pad[0];
  const [r2, c2] = pad[1];
  // Bepaal de richting van buiten naar de tweede cel
  if (r2 === r1 && c2 === c1 + 1) pijlen.unshift("→");
  else if (r2 === r1 && c2 === c1 - 1) pijlen.unshift("←");
  else if (c2 === c1 && r2 === r1 - 1) pijlen.unshift("↑");
  else if (c2 === c1 && r2 === r1 + 1) pijlen.unshift("↓");

  // laatste stap: waar ligt de uitgang?
  const [rn1, cn1] = pad[pad.length - 2];
  const [rn2, cn2] = pad[pad.length - 1];
  // Richting van de voorlaatste naar buiten
  if (rn2 === rn1 && cn2 === cn1 + 1) pijlen.push("→");
  else if (rn2 === rn1 && cn2 === cn1 - 1) pijlen.push("←");
  else if (cn2 === cn1 && rn2 === rn1 - 1) pijlen.push("↑");
  else if (cn2 === cn1 && rn2 === rn1 + 1) pijlen.push("↓");

  return pijlen;
}


/* ========= HULPFUNCTIES GETALLEN ========= */

function chooseStartValue(step, maxVal, padLength){
  // We willen een veelvoud van step, of iets dat eindigt op 0 of 5,
  // en we willen dat start + step*(padLength-1) niet boven 100 gaat.
  //
  // We proberen kandidaten zoals 0,5,10,15,20,25,30,...
  // en kiezen de grootste die nog veilig eindigt.
  //
  // "maxVal" = bereikMax (20 of 100), maar we beschermen sowieso tegen 100.

  const kandidaten = [];
  for (let base = 0; base <= 40; base += 5){
    kandidaten.push(base);
  }
  // ook een paar hogere instappen zodat niet altijd van 0 vertrekt:
  for (let base = 50; base <= 80; base += 5){
    kandidaten.push(base);
  }
  // voeg eventueel 20, 25 ... al zitten die er eigenlijk al in

  // filter: eindwaarde
  const geldige = kandidaten.filter(start => {
    const eind = start + step * (padLength - 1);
    if (eind > 100) return false;
    if (eind > maxVal && maxVal < 100) return false; // bv. bereik tot 20
    return true;
  });

  if (geldige.length === 0){
    // fallback: zelfde logica als vroeger
    if (maxVal <= 20){
      if (step === 2)  return 0;
      if (step === 5)  return 5;
      if (step === 10) return 10;
      return 0;
    } else {
      // maxVal ~100
      if (step === 2)  return 20;
      if (step === 5)  return 10;
      if (step === 10) return 0;
      return 10;
    }
  }

  // kies willekeurig uit de geldige om variatie te geven
  const pickIndex = Math.floor(Math.random() * geldige.length);
  return geldige[pickIndex];
}


function makeEmptyGrid(rows, cols){
  const arr = [];
  for (let r=0; r<rows; r++){
    const line = [];
    for (let c=0; c<cols; c++){
      line.push(null);
    }
    arr.push(line);
  }
  return arr;
}

// Vul eerst het echte pad met correcte sprongen:
// padCoords = lijst coördinaten zoals [[4,0],[4,1],[3,1],...]
// startVal = bv. 20
// step = bv. 2
function fillPadNumbers(grid, padCoords, startVal, step){
  if (startVal === null || startVal === undefined){
    // geen geldige start → we vullen niets in
    return { laatsteIndex: -1 };
  }

  let val = startVal;
  let laatsteIndex = -1;

  for (let i = 0; i < padCoords.length; i++){
    const [r,c] = padCoords[i];

    // als dit getal >100 zou zijn, stoppen we VOOR we invullen
    if (val > 100){
      break;
    }

    grid[r][c] = val;
    laatsteIndex = i;

    // bereken volgende mogelijke waarde
    const volgende = val + step;
    // als die volgende boven 100 zou gaan, dan stoppen we hier
    if (volgende > 100){
      break;
    }
    val = volgende;
  }

  return { laatsteIndex };
}




// Vul alle andere vakken met 'afleiders' die NIET
// het juiste volggetal kunnen zijn vanaf een buur op het pad.
// Zo kan een kind echt de route volgen.
function fillOtherNumbers(grid, maxVal){
  const rows = grid.length;
  const cols = grid[0].length;

  // helper om te kijken of (r,c) grenst aan een padcel met een waarde v
  // en of het verwachte volgende getal v+step daar zou moeten staan.
  function forbiddenValuesForCell(rr, cc){
    // we kijken naar alle buren (boven, onder, links, rechts)
    const forbids = new Set();
    const dirs = [
      [-1,0],[1,0],[0,-1],[0,1]
    ];
    for (const [dr,dc] of dirs){
      const nr = rr+dr;
      const nc = cc+dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const v = grid[nr][nc];
      // v is een padgetal als het al een getal is in grid[]
      if (typeof v === "number"){
        // we willen vermijden dat wij exact v+1, v+2, v+5, v+10
        // leggen als dat de "logische stap" zou kunnen zijn.
        // We kennen de sprongen niet hier (2,5,10),
        // dus we verbieden ALLE v+2, v+5, v+10.
        forbids.add(v+2);
        forbids.add(v+5);
        forbids.add(v+10);
        forbids.add(v); // ook hetzelfde getal zelf liever niet dupliceren naast het pad
      }
    }
    return forbids;
  }

  for (let r=0; r<rows; r++){
    for (let c=0; c<cols; c++){
      if (grid[r][c] === null){
        const forb = forbiddenValuesForCell(r,c);
        let candidate;
        let tries = 0;
        do {
          candidate = Math.floor(Math.random()*maxVal) + 1;
          if (candidate > 100) candidate = 100;
          tries++;
          // veiligheidsrem zodat we niet eindeloos blijven proberen
          if (tries > 50) break;
        } while (forb.has(candidate));
        grid[r][c] = candidate;
      }
    }
  }
}


/* ========= CEL-HTML ========= */

function makeSprongCellHTML(r, c, value, isStart, isEnd){
  let cls = "cellSprong";
  if (isStart) cls += " startCell";
  if (isEnd)   cls += " endCell";

  return `
    <div class="${cls}" data-r="${r}" data-c="${c}">
      <div class="cellSprongNumber">${value}</div>

      <span class="gate gate-top"></span>
      <span class="gate gate-bottom"></span>
      <span class="gate gate-left"></span>
      <span class="gate gate-right"></span>
    </div>
  `;
}

function makeMazeCellHTML(r, c, isStart, isEnd){
  let cls = "cellMaze";
  if (isStart) cls += " startCell";
  if (isEnd)   cls += " endCell";

  return `
    <div class="${cls}" data-r="${r}" data-c="${c}">
      <div class="cellMazePlus">+</div>

      <span class="gate gate-top"></span>
      <span class="gate gate-bottom"></span>
      <span class="gate gate-left"></span>
      <span class="gate gate-right"></span>
    </div>
  `;
}

/* ========= ÉÉN SPRONGEN-OEFENING BOUWEN ========= */
// Bepaalt of we een geldig startgetal kunnen kiezen zodat
// start + sprong * (padLengte-1) <= 100.
// Geeft een geschikt startgetal terug of null als het onmogelijk is.
function berekenVeiligeStartwaarde(sprong, padLengte){
  // We willen dat de eindwaarde niet boven 100 gaat.
  // eindwaarde = start + sprong*(padLengte-1) <= 100
  // => start <= 100 - sprong*(padLengte-1)

  const maxStart = 100 - sprong * (padLengte - 1);

  // We willen starts die logisch zijn voor kinderen:
  // veelvouden van 5, of 0,5,10,15,20,25,...
  // en ook niet negatief.
  const kandidaten = [];
  for (let base = 0; base <= 100; base += 5){
    kandidaten.push(base);
  }

  // filter op haalbaar volgens maxStart
  const geldige = kandidaten.filter(v => v <= maxStart && v >= 0);

  if (geldige.length === 0){
    return null; // met deze sprong en dit pad wordt de eindwaarde >100
  }

  // kleine variatie: kies een willekeurige van de geldige
  const pick = Math.floor(Math.random() * geldige.length);
  return geldige[pick];
}
// kiest een 'mooi' startgetal dat past bij de sprong en onder 100 blijft
function berekenMooieStartwaarde(sprong, padLengte){
  // voor sprong 2: we willen een even getal
  // voor sprong 5 of 10: we willen iets dat eindigt op 0 of 5
  //
  // en we eisen dat eind <= 100.

  const maxStart = 100 - sprong * (padLengte - 1);

  const kandidaten = [];

  if (sprong === 2){
    // even getallen tot maxStart
    for (let v = 0; v <= maxStart; v++){
      if (v % 2 === 0) kandidaten.push(v);
    }
  } else if (sprong === 5 || sprong === 10){
    // getallen die eindigen op 0 of 5
    for (let v = 0; v <= maxStart; v++){
      const lastDigit = v % 10;
      if (lastDigit === 0 || lastDigit === 5){
        kandidaten.push(v);
      }
    }
  } else {
    // andere sprongen: neem multiples van sprong als 'mooi'
    for (let v = 0; v <= maxStart; v++){
      if (v % sprong === 0){
        kandidaten.push(v);
      }
    }
  }

  if (kandidaten.length === 0){
    return null;
  }

  // variatie: kies willekeurig
  const pick = Math.floor(Math.random() * kandidaten.length);
  return kandidaten[pick];
}

// kiest een 'vrije' startwaarde (mag eender wat), zolang eind <= 100
function berekenVrijeStartwaarde(sprong, padLengte){
  const maxStart = 100 - sprong * (padLengte - 1);

  // we laten alle waarden 0..maxStart toe
  if (maxStart < 0){
    return null;
  }

  const kandidaten = [];
  for (let v = 0; v <= maxStart; v++){
    kandidaten.push(v);
  }

  if (kandidaten.length === 0){
    return null;
  }

  const pick = Math.floor(Math.random() * kandidaten.length);
  return kandidaten[pick];
}
// Neem een volledig pad (lijst coördinaten [r,c])
// en hou alleen de eerste N stappen.
// Zo maken we een korter pad als de sprong anders boven 100 zou gaan.
function knipPadOpLengte(pad, maxStappen){
  if (pad.length <= maxStappen){
    return pad.slice();
  }
  return pad.slice(0, maxStappen);
}
// Probeer een startwaarde te vinden zodat we het HELE pad
// (van pad[0] = linksonder tot pad[pad.length-1] = rechtsboven)
// kunnen vullen met sprongen 'sprong'
// zonder boven limiet (100 of bereikMax) te gaan.
//
// mode "mooi" = netjes (even voor sprong 2, op 0/5 voor sprong 5/10, ...)
// mode "vrij" = eender welke start binnen bereik.
//
// Geeft: een startwaarde (number) OF null als het onmogelijk is.
function berekenStartVoorVolledigPad(sprong, padLength, bereikMax, mode){
  // We willen eindwaarde <= limiet.
  // limiet = min(100, bereikMax als die <100 anders 100)
  const limiet = (bereikMax < 100 ? bereikMax : 100);

  // We willen: start + sprong*(padLength-1) <= limiet
  // => start <= limiet - sprong*(padLength-1)
  const maxStart = limiet - sprong * (padLength - 1);

  if (maxStart < 0){
    // zelfs als we bij 0 starten komen we al boven de limiet
    return null;
  }

  // kandidaten opstellen
  const kandidaten = [];

  if (mode === "mooi"){
    if (sprong === 2){
      // mooie start = even getallen
      for (let v = 0; v <= maxStart; v++){
        if (v % 2 === 0) kandidaten.push(v);
      }
    } else if (sprong === 5 || sprong === 10){
      // mooie start = getallen die eindigen op 0 of 5
      for (let v = 0; v <= maxStart; v++){
        const lastDigit = v % 10;
        if (lastDigit === 0 || lastDigit === 5){
          kandidaten.push(v);
        }
      }
    } else {
      // andere sprongen: veelvoud van sprong
      for (let v = 0; v <= maxStart; v++){
        if (v % sprong === 0){
          kandidaten.push(v);
        }
      }
    }
  } else {
    // "vrij": alles 0..maxStart is toegestaan
    for (let v = 0; v <= maxStart; v++){
      kandidaten.push(v);
    }
  }

  if (kandidaten.length === 0){
    return null;
  }

  // kies willekeurig voor variatie
  const pick = Math.floor(Math.random() * kandidaten.length);
  return kandidaten[pick];
}

function buildSprongenOefening(themaInfo, sprong, bereikMax, size, avoidIdx = -1, startMode = "mooi"){
  // VEILIGHEIDSREGEL:
  // Voorlopig ondersteunen we alleen een betrouwbaar pad voor 5x5.
  if (size !== 5){
    const warningHTML = `
      <section class="exerciseBlock">
        <div class="sheet-header">
          <div class="titles">
            <div class="mainTitle">Rekendoolhof</div>
            <div class="subTitle">Maak sprongen van ${sprong}.</div>
            <div class="explain" style="color:#b00; font-weight:bold;">
              Voor sprongoefeningen is het doolhof voorlopig alleen beschikbaar in 5×5.
              Kies 5×5 om een juist pad te krijgen.
            </div>
          </div>
          <div class="legendBox">
            <div class="legendRow"><span>${themaInfo.startIcon}</span><span>start</span></div>
            <div class="legendRow"><span>${themaInfo.endIcon}</span><span>einde</span></div>
          </div>
        </div>
      </section>
    `;
    return {
      blockHTML: warningHTML,
      startCell: [4,0],
      endCell: [0,4],
      startIcon: themaInfo.startIcon,
      endIcon: themaInfo.endIcon,
      padIndex: -1
    };
  }

  // ... de rest van de functie blijft hieronder staan, maar aangepast voor vaste paden ...

  // Vanaf hier weten we: size === 5
  const rows = 5;
  const cols = 5;

  // Een lijst van veilige paden voor 5×5.
  const PAD_VARIANTEN_5X5 = [
    // variant 1: slinger omhoog en naar rechts
    [
      [4,0],[4,1],[4,2],[3,2],[2,2],[2,1],[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4]
    ],
    // variant 2: eerst horizontaal dan zigzag naar boven
    [
      [4,0],[4,1],[4,2],[4,3],[4,4],[3,4],[2,4],[2,3],[1,3],[1,2],[1,1],[0,1],[0,2],[0,3],[0,4]
    ],
    // variant 3: kronkel via het midden
    [
      [4,0],[3,0],[2,0],[2,1],[2,2],[3,2],[4,2],[4,3],[3,3],[2,3],[1,3],[0,3],[0,4]
    ],
    // variant 4: langer pad met veel wissels
    [
      [4,0],[4,1],[3,1],[3,2],[3,3],[4,3],[4,4],[3,4],[2,4],[1,4],[1,3],[0,3],[0,4]
    ]
  ];
  // Kortere paden speciaal voor sprong 10 (max. 9 getallen op het pad)
  const PAD_VARIANTEN_5X5_SPRONG10 = [
    // variant 1: recht omhoog, dan naar rechts
    [
      [4,0],[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4]
    ],
    // variant 2: via kolom 1 naar boven
    [
      [4,0],[4,1],[3,1],[2,1],[1,1],[0,1],[0,2],[0,3],[0,4]
    ],
    // variant 3: kleine kronkel in het midden
    [
      [4,0],[3,0],[3,1],[3,2],[2,2],[1,2],[0,2],[0,3],[0,4]
    ]
  ];

   // Kies passende padvariant (korter pad voor sprong 10)
  const padVarianten = (sprong === 10)
    ? PAD_VARIANTEN_5X5_SPRONG10
    : PAD_VARIANTEN_5X5;

  let padIndex;
  do {
    padIndex = Math.floor(Math.random() * padVarianten.length);
  } while (padIndex === avoidIdx && padVarianten.length > 1);

  const pad = padVarianten[padIndex];

  // Limiet = min(100, bereikMax)
  const limiet = (bereikMax < 100 ? bereikMax : 100);
  const maxStart = limiet - sprong*(pad.length-1);

  if (maxStart < 0){
    const warningHTML = `
      <section class="exerciseBlock">
        <div class="sheet-header">
          <div class="titles">
            <div class="mainTitle">Rekendoolhof</div>
            <div class="subTitle">Maak sprongen van ${sprong}.</div>
            <div class="explain" style="color:#b00; font-weight:bold;">
              Met sprong ${sprong} lukt het niet binnen ${limiet} om tot aan de eikel te tellen.
              Kies een andere sprong.
            </div>
          </div>
        </div>
      </section>
    `;
    return {
      blockHTML: warningHTML,
      startCell: [4,0],
      endCell: [0,4],
      startIcon: themaInfo.startIcon,
      endIcon: themaInfo.endIcon,
          padIndex
    };
  }

  // Kies een startwaarde
  let mogelijkeStarts = [];
  for (let s = 0; s <= maxStart; s++){
    if (startMode === "mooi"){
      if (sprong === 2 && s % 2 !== 0) continue;
      if ((sprong === 5 || sprong === 10) && (s % 5 !== 0)) continue;
      if (sprong !== 2 && sprong !== 5 && sprong !== 10){
        if (s % sprong !== 0) continue;
      }
    }
    mogelijkeStarts.push(s);
  }

  if (mogelijkeStarts.length === 0){
    const warningHTML = `
      <section class="exerciseBlock">
        <div class="sheet-header">
          <div class="titles">
            <div class="mainTitle">Rekendoolhof</div>
            <div class="subTitle">Maak sprongen van ${sprong}.</div>
            <div class="explain" style="color:#b00; font-weight:bold;">
              Geen geschikt startgetal gevonden binnen ${limiet}.
              Kies een andere sprong of gebruik "vrij".
            </div>
          </div>
        </div>
      </section>
    `;
    return {
      blockHTML: warningHTML,
      startCell: [4,0],
      endCell: [0,4],
      startIcon: themaInfo.startIcon,
      endIcon: themaInfo.endIcon,
          padIndex
    };
  }

  const gekozenStart = mogelijkeStarts[Math.floor(Math.random()*mogelijkeStarts.length)];

  const gridData = makeEmptyGrid(rows, cols);
  let val = gekozenStart;
  for (let i=0; i<pad.length; i++){
    const [rr,cc] = pad[i];
    gridData[rr][cc] = val;
    val += sprong;
  }

  fillOtherNumbers(gridData, bereikMax);

  const startCell = [4,0];
  const endCell   = [0,4];

  let gridCellsHTML = "";
  for (let r=0; r<rows; r++){
    for (let c=0; c<cols; c++){
      const isStart = (r === startCell[0] && c === startCell[1]);
      const isEnd   = (r === endCell[0]   && c === endCell[1]);
      gridCellsHTML += makeSprongCellHTML(r,c,gridData[r][c],isStart,isEnd);
    }
  }

  const extraUitleg = (startMode === "mooi")
    ? `(netjes tellen met sprongen van ${sprong})`
    : `(tel verder vanaf een vrij startgetal)`;

  const headerHTML = `
    <div class="sheet-header">
      <div class="titles">
        <div class="mainTitle">Rekendoolhof</div>
        <div class="subTitle">Maak sprongen van ${sprong}. ${extraUitleg}</div>
        <div class="explain">${themaInfo.uitleg}</div>
      </div>
      <div class="legendBox">
        <div class="legendRow"><span>${themaInfo.startIcon}</span><span>start</span></div>
        <div class="legendRow"><span>${themaInfo.endIcon}</span><span>einde</span></div>
      </div>
    </div>
  `;

  const gridWrapperHTML = `
    <div class="gridRowWrapper">
      <div class="grid oefgrid" style="
        grid-template-columns: repeat(${cols}, 60px);
        grid-template-rows: repeat(${rows}, 60px);
      ">
        ${gridCellsHTML}
      </div>
    </div>
  `;

  return {
    blockHTML: `<section class="exerciseBlock">${headerHTML}${gridWrapperHTML}</section>`,
    startCell,
    endCell,
    startIcon: themaInfo.startIcon,
    endIcon: themaInfo.endIcon,
        padIndex
  };
}

/* ========= ÉÉN MAZE-OEFENING BOUWEN ========= */
// Zet een pad (lijst coördinaten [r,c]) om naar pijlen
// Elke stap tussen twee opeenvolgende cellen levert één pijl.
// ↑ = 1 vakje omhoog, ↓ = 1 vakje omlaag,
// → = 1 vakje naar rechts, ← = 1 vakje naar links.
function padNaarPijlen(pad){
  const pijlen = [];
  for (let i = 0; i < pad.length - 1; i++){
    const [r1,c1] = pad[i];
    const [r2,c2] = pad[i+1];

    if (r2 === r1 && c2 === c1+1){
      pijlen.push("→");
    } else if (r2 === r1 && c2 === c1-1){
      pijlen.push("←");
    } else if (c2 === c1 && r2 === r1-1){
      pijlen.push("↑");
    } else if (c2 === c1 && r2 === r1+1){
      pijlen.push("↓");
    } else {
      // veiligheidsval: als er ooit een sprong van 2 cellen zou zitten (mag niet),
      // tonen we een vraagteken. Dan ziet u meteen dat er iets fout is.
      pijlen.push("?");
    }
  }
  return pijlen;
}

function buildMazeOefening(themaInfo, size, avoidIdx = -1){
  // 1. Alleen 5×5 ondersteund
  if (size !== 5){
    const warningHTML = `
      <section class="exerciseBlock mazeBlock">
        <div class="sheet-header">
          <div class="titles">
            <div class="mainTitle">Doolhof</div>
            <div class="subTitle">Volg de pijlen met je vinger.</div>
            <div class="explain" style="color:#b00; font-weight:bold;">
              Voor dit doolhof is het rooster voorlopig alleen beschikbaar in 5×5.
              Kies 5×5.
            </div>
          </div>
          <div class="legendBox">
            <div class="legendRow"><span>${themaInfo.startIcon}</span><span>start</span></div>
            <div class="legendRow"><span>${themaInfo.endIcon}</span><span>einde</span></div>
          </div>
        </div>
      </section>
    `;
    return {
      blockHTML: warningHTML,
      startCell: [4,0],
      endCell: [0,4],
      startIcon: themaInfo.startIcon,
      endIcon: themaInfo.endIcon,
          padIndex
    };
  }

  // 2. Roostergrootte
  const rows = 5;
  const cols = 5;

  // 3. Veilige paden binnen het rooster (variatie)
  const PAD_VARIANTEN_MAZE = [
    [
      [4,0],[4,1],[4,2],[3,2],[2,2],[1,2],[0,2],[0,3],[0,4]
    ],
    [
      [4,0],[4,1],[3,1],[3,2],[2,2],[2,3],[1,3],[1,4],[0,4]
    ],
    [
      [4,0],[3,0],[3,1],[3,2],[2,2],[2,1],[1,1],[1,2],[1,3],[1,4],[0,4]
    ],
    [
      [4,0],[4,1],[4,2],[3,2],[3,3],[4,3],[4,4],[3,4],[2,4],[1,4],[0,4]
    ]
  ];

  // 4. Kies willekeurig pad (niet twee keer na elkaar hetzelfde)
  let padIndex;
  do {
    padIndex = Math.floor(Math.random() * PAD_VARIANTEN_MAZE.length);
  } while (padIndex === avoidIdx && PAD_VARIANTEN_MAZE.length > 1);

  const pad = PAD_VARIANTEN_MAZE[padIndex];

  // -------- HIER BEGINNEN DE AANPASSINGEN VOOR DE PIJLEN --------

  // Beschrijving van uw layout:
  // - Het echte doolhof-pad eindigt NIET op het beige vak,
  //   maar in het witte vak vlak ervoor.
  // - Daarna moet je 1× naar rechts (wit -> beige),
  //   en daarna nog 1× naar rechts (beige -> buiten bij de eikel).

  const TOP_ROW = 0;
  const LAST_COL_IN_GRID = cols - 1; // bij 5x5 is dat 4

  // We maken een kopie van het gekozen pad en vullen eventueel bij.
  const padGefixt = pad.slice();

  // huidige eindpositie
  let curR = padGefixt[padGefixt.length - 1][0];
  let curC = padGefixt[padGefixt.length - 1][1];

  // STAP A. Zorg dat we op de bovenste rij zitten (rij 0),
  // anders stappen we naar boven tot rij 0.
  let safetyA = 0;
  while (curR !== TOP_ROW && safetyA < 50){
    curR = curR - 1; // omhoog
    padGefixt.push([curR, curC]);
    safetyA++;
  }

  // STAP B. Zorg dat we belanden in het WITTE vak dat net LINKS van de beige uitgang zit.
  // - Beige uitgangscel binnen het rooster = (0, LAST_COL_IN_GRID).
  // - Het witte vak net ervoor zit op kolom LAST_COL_IN_GRID - 1.
  const targetWhiteCol = LAST_COL_IN_GRID - 1;
  let safetyB = 0;
  while (curC < targetWhiteCol && safetyB < 50){
    curC = curC + 1; // naar rechts
    padGefixt.push([curR, curC]);
    safetyB++;
  }

  // STAP C. Stap naar de BEIGE uitgangscel in het rooster (0, LAST_COL_IN_GRID).
  if (!(curR === TOP_ROW && curC === LAST_COL_IN_GRID)){
    curC = curC + 1; // wit -> beige
    padGefixt.push([curR, curC]);
  }

  // STAP D. Nog 1 stap naar rechts BUITEN het rooster, naar de eikel.
  curC = curC + 1; // beige -> buiten
  padGefixt.push([curR, curC]);

  // Nu eindigt padGefixt dus exact bij "einde" buiten het rooster.

  // Definitief start- en eindpunt van de route-met-pijlen
  const startCell = padGefixt[0];
  // let absoluteEndCell = padGefixt[padGefixt.length - 1]; // niet nodig voor return

  // Maak pijlenreeks
  const pijlenLijst = padNaarPijlen(padGefixt);
  const pijlenHTML  = pijlenLijst.join(" ");

  // Voor het rooster zelf (te tekenen vakjes):
  // - start in startCell
  // - einde (het beige vak) = rechtsboven in het rooster = (0, LAST_COL_IN_GRID)
  const visueelEndR = TOP_ROW;
  const visueelEndC = LAST_COL_IN_GRID;

  // We gebruiken deze visuele eindcel als "endCell" voor de rest van de app,
  // want placeIconsForBlock zet daar het label "einde" en de eikel ernaast.
  const endCell = [visueelEndR, visueelEndC];

  // Bouw de gridcellen
  let gridCellsHTML = "";
  for (let r = 0; r < rows; r++){
    for (let c = 0; c < cols; c++){
      const isStart = (r === startCell[0] && c === startCell[1]);
      const isEnd   = (r === visueelEndR && c === visueelEndC);

      gridCellsHTML += makeSprongCellHTML(
        r,
        c,
        "",
        isStart,
        isEnd
      );
    }
  }

  // Header met pijlen en uitleg
  const headerHTML = `
    <div class="sheet-header">
      <div class="titles">
        <div class="mainTitle">Doolhof</div>
        <div class="subTitle">Volg deze richting met je vinger:</div>
        <div class="arrowBox">${pijlenHTML}</div>
        <div class="explain">${themaInfo.uitleg}</div>
      </div>
      <div class="legendBox">
        <div class="legendRow"><span>${themaInfo.startIcon}</span><span>start</span></div>
        <div class="legendRow"><span>${themaInfo.endIcon}</span><span>einde</span></div>
      </div>
    </div>
  `;

  // Rooster-wrapper
  const gridWrapperHTML = `
    <div class="gridRowWrapper">
      <div class="grid oefgrid mazeBlock" style="
        grid-template-columns: repeat(${cols}, 60px);
        grid-template-rows: repeat(${rows}, 60px);
      ">
        ${gridCellsHTML}
      </div>
    </div>
  `;

  // Teruggeven naar renderWorksheet()
  return {
    blockHTML: `<section class="exerciseBlock mazeBlock">${headerHTML}${gridWrapperHTML}</section>`,
    startCell,
    endCell,            // <-- nu bestaat endCell weer en is geldig (roosterhoek)
    startIcon: themaInfo.startIcon,
    endIcon: themaInfo.endIcon,
    padIndex            // voor variatie tussen oefeningen
  };
}


/* ========= START/EINDE ICONEN BUITEN ELKE GRID =========
   We plaatsen per oefening afzonderlijk de icoontjes naast
   de juiste cellen. Let op:
   - We zoeken .oefgrid binnen die oefen-block
   - We plaatsen iconen daarin.
*/
function placeIconsForBlock(blockEl, startCell, endCell, startIcon, endIcon){
  const gridEl = blockEl.querySelector(".oefgrid");
  if (!gridEl) return;

  const isMaze = blockEl.classList.contains("mazeBlock");

  function getCell(r, c){
    return gridEl.querySelector(
      `.cellSprong[data-r="${r}"][data-c="${c}"],
       .cellMaze[data-r="${r}"][data-c="${c}"]`
    );
  }

  const startDiv = getCell(startCell[0], startCell[1]);
  const endDiv   = getCell(endCell[0],   endCell[1]);
  if (!startDiv || !endDiv) return;

  const startBox = startDiv.getBoundingClientRect();
  const endBox   = endDiv.getBoundingClientRect();
  const gridBox  = gridEl.getBoundingClientRect();

  // Altijd: poortcellen markeren (voor openingen)
  startDiv.classList.add("mazeEntry");
  endDiv.classList.add("mazeExit");

  // STARTLABEL
  const startLabel = document.createElement("div");
  startLabel.className = "mazeStartLabel";
  startLabel.style.display = "flex";
  startLabel.style.flexDirection = "column";
  startLabel.style.alignItems = "flex-start";
  startLabel.innerHTML = `
    <span>${startIcon}</span>
    <span class="mazeLabelText">start</span>
  `;
  startLabel.style.left = (startBox.left - gridBox.left - 40) + "px";
  startLabel.style.top  = (
    startBox.top - gridBox.top +
    startBox.height/2 - 20
  ) + "px";
  gridEl.appendChild(startLabel);

  // EINDELABEL
  const endLabel = document.createElement("div");
  endLabel.className = "mazeEndLabel";
  endLabel.style.display = "flex";
  endLabel.style.flexDirection = "column";
  endLabel.style.alignItems = "flex-end";
  endLabel.innerHTML = `
  <span class="mazeLabelText">einde</span>
  <span>${endIcon}</span>
`;

  endLabel.style.left = (
    endBox.left - gridBox.left +
    endBox.width + 8
  ) + "px";
  endLabel.style.top  = (
    endBox.top - gridBox.top +
    endBox.height/2 - 20
  ) + "px";
  gridEl.appendChild(endLabel);
}



/* ========= HOOFDFUNCTIE OM HET VOLLE WERKBLAD TE BOUWEN =========
   We gaan NU meteen 2 oefeningen onder elkaar zetten,
   zodat u al ziet hoe "meerdere oefeningen op één blad" kan werken.
   Later kunnen we dit makkelijk uitbreiden naar 3 of meer.
*/
function renderWorksheet(){
  const ws = document.getElementById("worksheet");
  ws.innerHTML = "";

  let previousPadIndex = -1;

  worksheetItems.forEach((item, idx) => {
    const themaInfo = getThemaInfo(item.thema);

    let oef;
  if (item.kind === "sprongen"){
  oef = buildSprongenOefening(
    themaInfo,
    item.sprong,
    item.bereikMax,
    item.size,
    previousPadIndex,
    item.startMode || "mooi"
  );
} else {
  oef = buildMazeOefening(
    themaInfo,
    item.size,
    previousPadIndex
  );
}

    // oefening tonen
    ws.insertAdjacentHTML("beforeend", oef.blockHTML);

    // lijn tussen blokken (behalve na de laatste)
    if (idx < worksheetItems.length - 1){
      ws.insertAdjacentHTML(
        "beforeend",
        "<hr style='margin:2rem 0;border:0;border-top:1px solid #999;'>"
      );
    }

    // iconen plaatsen en openingen zetten
    const allBlocks = ws.querySelectorAll(".exerciseBlock");
    const thisBlock = allBlocks[allBlocks.length-1];
    placeIconsForBlock(
      thisBlock,
      oef.startCell,
      oef.endCell,
      oef.startIcon,
      oef.endIcon
    );

    // onthoud padIndex zodat de volgende oef een ander pad krijgt
    previousPadIndex = oef.padIndex;
  });
}
function hookControls(){
  const typeSelect        = document.getElementById("typeSelect");
  const sprongSelect      = document.getElementById("sprongSelect");
  const bereikSelect      = document.getElementById("bereikSelect");
  const themaSelect       = document.getElementById("themaSelect");
  const sizeSelect        = document.getElementById("sizeSelect");
const startModeSelect  = document.getElementById("startModeSelect");

  const addExerciseBtn    = document.getElementById("addExerciseBtn");
  const clearWorksheetBtn = document.getElementById("clearWorksheetBtn");

  function toggleSprongSettings(){
    if (typeSelect.value === "sprongen"){
      document.getElementById("sprongSettings").style.display = "";
    } else {
      document.getElementById("sprongSettings").style.display = "none";
    }
  }
  toggleSprongSettings();

  // als je wisselt tussen sprongen/maze moeten de sprongvelden verdwijnen/terugkomen
  typeSelect.addEventListener("change", () => {
    toggleSprongSettings();
  });

  // ➕ Voeg oefening toe
  addExerciseBtn.addEventListener("click", () => {
const chosenType      = typeSelect.value;
const chosenSprong    = parseInt(sprongSelect.value,10);
const chosenBereik    = parseInt(bereikSelect.value,10);
const chosenThema     = themaSelect.value;
const chosenSize      = parseInt(sizeSelect.value,10);
const chosenStartMode = startModeSelect.value; // "mooi" of "vrij"

if (chosenType === "sprongen"){
  worksheetItems.push({
    kind: "sprongen",
    sprong: chosenSprong,
    bereikMax: chosenBereik,
    thema: chosenThema,
    size: chosenSize,
    startMode: chosenStartMode
  });
} else {
  worksheetItems.push({
    kind: "maze",
    thema: chosenThema,
    size: chosenSize
  });
}

renderWorksheet();

  });

  // 🗑️ Leeg werkblad
  clearWorksheetBtn.addEventListener("click", () => {
    worksheetItems = [];
    renderWorksheet();
  });
}

/* ========= INIT ========= */
hookControls();
renderWorksheet();
