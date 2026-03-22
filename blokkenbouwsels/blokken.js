// blokken.js — Oblique projectie renderer + hoogtemap generator
//
// Een bouwsel = hoogtemap: hmap[y][x] = aantal blokken op die positie
//   y = rij (0 = voorste rij, groter = verder achter)
//   x = kolom (0 = links)
// Grondvlak altijd 3×3 of 4×4.
// GARANTIE: hmap[y][x] >= hmap[y-1][x] → achterste rijen nooit lager dan voorste
// → achterste blokken altijd zichtbaar in de projectie

// ─────────────────────────────────────────────
// KLEURENPALET — 4 kleuren, 3 vlakken elk
// ─────────────────────────────────────────────
var BLOK_KLEUREN = [
    { voor:'#f9c523', boven:'#fde97a', rechts:'#d4970a', rand:'#7a5200' }, // zonnegeel
    { voor:'#3ec6f0', boven:'#8de4f8', rechts:'#1090c8', rand:'#004870' }, // hemelsblauw
    { voor:'#4dd96a', boven:'#96edaa', rechts:'#1aaa40', rand:'#085820' }, // frisgroen
    { voor:'#f05a5a', boven:'#f8a0a0', rechts:'#c01818', rand:'#580000' }, // knalrood
    { voor:'#c060e8', boven:'#e0a0f8', rechts:'#8820c0', rand:'#420060' }, // paars
    { voor:'#f07828', boven:'#f8b878', rechts:'#c04808', rand:'#602000' }, // oranje
];

var KLEURPATRONEN = ['schaakbord', 'laag', 'kolom'];
var _patroonIdx = 0;

function volgendSchema() {
    var p = KLEURPATRONEN[_patroonIdx % KLEURPATRONEN.length];
    _patroonIdx++;
    return { patroon: p };
}

function getBlokKleur(x, y, z, patroon, eenKleur) {
    if (patroon === '_een' && eenKleur) return eenKleur;
    var n = BLOK_KLEUREN.length;
    if (patroon === 'laag')   return BLOK_KLEUREN[z % n];
    if (patroon === 'kolom')  return BLOK_KLEUREN[x % n];
    /* schaakbord */          return BLOK_KLEUREN[(x * 2 + y * 3) % n];
}

// ─────────────────────────────────────────────
// RENDERER — oblique projectie (zoals test-iso7)
// ─────────────────────────────────────────────
function renderBouwsel(canvas, hmap, opties) {
    opties = opties || {};
    var CEL     = opties.blokSize || 24;
    var patroon = (opties.kleuren && opties.kleuren.patroon)
                  ? opties.kleuren.patroon
                  : KLEURPATRONEN[(_patroonIdx - 1 + KLEURPATRONEN.length) % KLEURPATRONEN.length];

    // Oblique projectie-parameters (bewezen in test-iso5/7)
    var DX = CEL * 0.55;  // diepte-stap naar rechts
    var DY = CEL * 0.40;  // diepte-stap omhoog

    var rijen = hmap.length;
    var kols  = hmap[0] ? hmap[0].length : 0;
    var maxH  = 0;
    for (var y = 0; y < rijen; y++)
        for (var x = 0; x < kols; x++)
            if (hmap[y][x] > maxH) maxH = hmap[y][x];
    if (maxH === 0) maxH = 1;

    // Blokcoördinaat → canvas-pixel (voor linksonder-hoek van voorvlak)
    function Q(bx, by, bz) {
        return [
            bx * CEL + by * DX,
           -bz * CEL - by * DY
        ];
    }

    // Bounding box
    var alle = [];
    for (var x = 0; x <= kols; x++)
        for (var y = 0; y <= rijen; y++)
            for (var z = 0; z <= maxH + 1; z++)
                alle.push(Q(x, y, z));

    var mnX = alle[0][0], mxX = alle[0][0];
    var mnY = alle[0][1], mxY = alle[0][1];
    for (var i = 1; i < alle.length; i++) {
        if (alle[i][0] < mnX) mnX = alle[i][0];
        if (alle[i][0] > mxX) mxX = alle[i][0];
        if (alle[i][1] < mnY) mnY = alle[i][1];
        if (alle[i][1] > mxY) mxY = alle[i][1];
    }

    var pad = 8;
    var ox  = -mnX + pad;
    var oy  = -mnY + pad;
    canvas.width  = Math.ceil(mxX - mnX) + pad * 2;
    canvas.height = Math.ceil(mxY - mnY) + pad * 2;

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function P(bx, by, bz, dx, dy, dz) {
        var q = Q(bx + dx, by + dy, bz + dz);
        return [q[0] + ox, q[1] + oy];
    }

    function vierhoek(p0, p1, p2, p3, vul, rand) {
        ctx.fillStyle   = vul;
        ctx.strokeStyle = rand;
        ctx.lineWidth   = 0.9;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    function tekenBlok(bx, by, bz, k) {
        // 1. Rechterzijvlak (x+1 kant)
        vierhoek(
            P(bx,by,bz, 1,0,0), P(bx,by,bz, 1,1,0),
            P(bx,by,bz, 1,1,1), P(bx,by,bz, 1,0,1),
            k.rechts, k.rand);
        // 2. Bovenvlak
        vierhoek(
            P(bx,by,bz, 0,0,1), P(bx,by,bz, 1,0,1),
            P(bx,by,bz, 1,1,1), P(bx,by,bz, 0,1,1),
            k.boven, k.rand);
        // 3. Voorvlak — altijd als laatste (altijd zichtbaar)
        vierhoek(
            P(bx,by,bz, 0,0,0), P(bx,by,bz, 1,0,0),
            P(bx,by,bz, 1,0,1), P(bx,by,bz, 0,0,1),
            k.voor, k.rand);
    }

    // Verzamel alle blokken
    var blokken = [];
    for (var by = 0; by < rijen; by++)
        for (var bx = 0; bx < kols; bx++)
            for (var bz = 0; bz < hmap[by][bx]; bz++)
                blokken.push({ x: bx, y: by, z: bz });

    // Painter's sort: achterste (grote y) eerst, dan laag (kleine z), dan links (kleine x)
    blokken.sort(function(a, b) {
        if (a.y !== b.y) return b.y - a.y;
        if (a.z !== b.z) return a.z - b.z;
        return a.x - b.x;
    });

    blokken.forEach(function(b) {
        tekenBlok(b.x, b.y, b.z, getBlokKleur(b.x, b.y, b.z, patroon, opties.kleuren));
    });
}

// ─────────────────────────────────────────────
// AANZICHTEN — voor, links, rechts
//
// Een aanzicht is een SILHOUET: kijk van 1 kant en
// zie per (kolom, hoogte) of er een blok zichtbaar is.
// Resultaat: 2D raster [hoogte][kolom] van true/false
//
// 'voor'  : kijk langs y-as (van y=0 kant naar achter)
//            kolommen = x (0=links), hoogte = z
// 'rechts' : kijk langs x-as van rechts (x=max naar links)
//            kolommen = y (0=voor), hoogte = z
// 'links'  : kijk langs x-as van links (x=0 naar rechts)
//            kolommen = y (max=voor → links in beeld), hoogte = z
// ─────────────────────────────────────────────
function berekenAanzicht(hmap, richting) {
    var rijen = hmap.length;       // y-as
    var kols  = hmap[0] ? hmap[0].length : 0; // x-as
    var maxH  = 0;
    for (var y = 0; y < rijen; y++)
        for (var x = 0; x < kols; x++)
            if (hmap[y][x] > maxH) maxH = hmap[y][x];
    if (maxH === 0) return [];

    // silhouet[hoogte][kolom] = true als er minstens 1 blok zichtbaar is
    var breedte = (richting === 'voor') ? kols : rijen;
    var silhouet = [];
    for (var z = 0; z < maxH; z++) {
        var rij = [];
        for (var k = 0; k < breedte; k++) {
            var zichtbaar = false;
            if (richting === 'voor') {
                // kolom k = x, kijk over alle y: is er een blok op hoogte z?
                for (var y = 0; y < rijen; y++) {
                    if (hmap[y][k] > z) { zichtbaar = true; break; }
                }
            } else if (richting === 'rechts') {
                // kolom k = y (y=0 is voorste rij = links in dit aanzicht)
                for (var x = 0; x < kols; x++) {
                    if (hmap[k][x] > z) { zichtbaar = true; break; }
                }
            } else if (richting === 'links') {
                // kolom k = y omgekeerd (y=max is voorste rij = links in dit aanzicht)
                var ry = rijen - 1 - k;
                for (var x = 0; x < kols; x++) {
                    if (hmap[ry][x] > z) { zichtbaar = true; break; }
                }
            }
            rij.push(zichtbaar);
        }
        silhouet.push(rij);
    }
    return silhouet; // [z][kolom], z=0 = onderste laag
}

function renderAanzicht(canvas, hmap, richting, opties) {
    opties = opties || {};
    var silhouet = berekenAanzicht(hmap, richting);
    var maxH    = silhouet.length;
    var breedte = silhouet[0] ? silhouet[0].length : 0;
    if (!maxH || !breedte) { canvas.width = 10; canvas.height = 10; return; }

    var cel = opties.cel || 18;
    var pad = 4;
    canvas.width  = breedte * cel + pad * 2;
    canvas.height = maxH    * cel + pad * 2;

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var z = 0; z < maxH; z++) {
        for (var k = 0; k < breedte; k++) {
            var cx = pad + k * cel;
            var cy = pad + (maxH - 1 - z) * cel; // z=0 onderaan
            if (silhouet[z][k]) {
                ctx.fillStyle   = opties.vulkleur || '#e8d870';
                ctx.strokeStyle = opties.rand     || '#5a4e00';
            } else {
                ctx.fillStyle   = '#ffffff';
                ctx.strokeStyle = '#cccccc';
            }
            ctx.lineWidth = 0.8;
            ctx.fillRect(cx, cy, cel, cel);
            ctx.strokeRect(cx, cy, cel, cel);
        }
    }
}

// ─────────────────────────────────────────────
// GRONDPLAN HTML
// ─────────────────────────────────────────────
function berekenGrondplan(hmap) {
    return hmap; // hoogtemap IS het grondplan
}

function renderGrondplanHTML(hmap, opties) {
    opties = opties || {};
    var toonCijfers = opties.toonCijfers !== false;
    var leeg        = opties.leeg || false;

    // y=0 = voorste rij = ONDERSTE rij in grondplan
    // Dus we lopen van y=max naar y=0 (achterste rij bovenaan, voorste rij onderaan)
    var html = '<table class="grondplan-tabel">';
    for (var y = hmap.length - 1; y >= 0; y--) {
        html += '<tr>';
        for (var x = 0; x < hmap[y].length; x++) {
            var h = hmap[y][x];
            if (leeg) {
                html += '<td class="gp-cel gp-invulvak"><div class="gp-invul"></div></td>';
            } else {
                html += '<td class="gp-cel gp-cijfervak">' +
                    (h > 0 && toonCijfers ? '<span class="gp-getal">' + h + '</span>' : '') +
                    '</td>';
            }
        }
        html += '</tr>';
    }
    html += '</table>';
    return html;
}

// ─────────────────────────────────────────────
// BOUWSEL GENERATIE
// ─────────────────────────────────────────────
var NIVEAU_CONFIG = {
    makkelijk: { minBlokken: 2,  maxBlokken: 6,  maxHoogte: 2, sizes: [3] },
    middel:    { minBlokken: 7,  maxBlokken: 12, maxHoogte: 3, sizes: [3, 4] },
    moeilijk:  { minBlokken: 13, maxBlokken: 20, maxHoogte: 4, sizes: [4] },
};

function genereerBouwsel(niveau) {
    var cfg  = NIVEAU_CONFIG[niveau] || NIVEAU_CONFIG.middel;
    var beste = null;
    var besteScore = -1;

    for (var poging = 0; poging < 80; poging++) {
        var size = cfg.sizes[Math.floor(Math.random() * cfg.sizes.length)];
        var maxH = cfg.maxHoogte;

        // Start met lege hoogtemap
        var hmap = [];
        for (var y = 0; y < size; y++) {
            var rij = [];
            for (var x = 0; x < size; x++) rij.push(0);
            hmap.push(rij);
        }

        // Vul via random walk — niet alle cellen hoeven gevuld
        var startY = Math.floor(Math.random() * size);
        var startX = Math.floor(Math.random() * size);
        var gevuld = {};
        gevuld[startY + ',' + startX] = true;
        var cLijst = [[startY, startX]];
        var dirs = [[-1,0],[1,0],[0,-1],[0,1]];

        // Variabel aantal gevulde cellen: 40-90% van grondvlak
        var maxCellen = size * size;
        var minCellen = Math.max(2, Math.floor(maxCellen * 0.4));
        var aantalCellen = minCellen + Math.floor(Math.random() * (maxCellen - minCellen));

        while (cLijst.length < aantalCellen) {
            var basis = cLijst[Math.floor(Math.random() * cLijst.length)];
            var ds = dirs.slice(); shuffle(ds);
            var ok = false;
            for (var d = 0; d < ds.length; d++) {
                var ny = basis[0] + ds[d][0];
                var nx = basis[1] + ds[d][1];
                if (ny >= 0 && ny < size && nx >= 0 && nx < size && !gevuld[ny+','+nx]) {
                    gevuld[ny+','+nx] = true;
                    cLijst.push([ny, nx]);
                    ok = true; break;
                }
            }
            if (!ok) break;
        }

        // Ken GEVARIEERDE hoogtes toe — dwing variatie af
        // Gooi een mix van hoogtes: sommige 1, sommige max, sommige tussenin
        var hoogteOpties = [];
        for (var h = 1; h <= maxH; h++) hoogteOpties.push(h);

        for (var ci = 0; ci < cLijst.length; ci++) {
            var cy = cLijst[ci][0], cx2 = cLijst[ci][1];
            // Gewogen keuze: lagere hoogtes iets vaker maar niet dominant
            var r = Math.random();
            var gekozenH;
            if (maxH === 1) {
                gekozenH = 1;
            } else if (maxH === 2) {
                gekozenH = r < 0.45 ? 1 : 2;
            } else if (maxH === 3) {
                if      (r < 0.30) gekozenH = 1;
                else if (r < 0.60) gekozenH = 2;
                else               gekozenH = 3;
            } else {
                if      (r < 0.25) gekozenH = 1;
                else if (r < 0.50) gekozenH = 2;
                else if (r < 0.75) gekozenH = 3;
                else               gekozenH = 4;
            }
            hmap[cy][cx2] = gekozenH;
        }

        // GARANTIE: achterste rijen nooit lager dan voorste
        hmap = fixeerHoogtemap(hmap);

        var totaal = telBlokken(hmap);
        if (totaal < cfg.minBlokken || totaal > cfg.maxBlokken) continue;

        // Score: beloon variatie in hoogtes
        var uniekHoogtes = {};
        var aantalGevuld = 0;
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                if (hmap[y][x] > 0) {
                    uniekHoogtes[hmap[y][x]] = true;
                    aantalGevuld++;
                }
            }
        }
        var aantalUniek = Object.keys(uniekHoogtes).length;
        // Score = aantal unieke hoogtes * 10 + gevulde cellen
        // Bouwsels met maar 1 unieke hoogte krijgen lage score
        var score = aantalUniek * 10 + aantalGevuld;
        // Bonus als er ook lege cellen zijn (niet overal gevuld)
        if (aantalGevuld < size * size) score += 5;

        if (score > besteScore) {
            beste = hmap;
            besteScore = score;
        }
    }

    return beste || genereerFallbackBouwsel(niveau);
}

// Zorgt dat hmap[y][x] >= hmap[y-1][x] voor alle y > 0
// (achterste rijen altijd minstens even hoog als voorste)
function fixeerHoogtemap(hmap) {
    var rijen = hmap.length, kols = hmap[0].length;
    for (var y = 1; y < rijen; y++)
        for (var x = 0; x < kols; x++)
            if (hmap[y][x] < hmap[y-1][x])
                hmap[y][x] = hmap[y-1][x];
    return hmap;
}

function telBlokken(hmap) {
    var n = 0;
    for (var y = 0; y < hmap.length; y++)
        for (var x = 0; x < hmap[y].length; x++)
            n += hmap[y][x];
    return n;
}

function genereerFallbackBouwsel(niveau) {
    if (niveau === 'makkelijk') {
        return fixeerHoogtemap([[1,1,0],[1,0,0],[0,0,0]]);
    } else if (niveau === 'middel') {
        return fixeerHoogtemap([[1,1,1],[2,1,0],[2,2,1]]);
    } else {
        return fixeerHoogtemap([[2,1,1,0],[2,2,1,1],[3,2,1,0],[3,3,2,1]]);
    }
}

function genereerAndereGrid(referentie, niveau) {
    var refStr    = JSON.stringify(referentie);
    var refTotaal = telBlokken(referentie);
    for (var i = 0; i < 80; i++) {
        var nieuw = genereerBouwsel(niveau);
        if (JSON.stringify(nieuw) !== refStr && Math.abs(telBlokken(nieuw) - refTotaal) <= 6)
            return nieuw;
    }
    return muteerdHmap(referentie);
}

function muteerdHmap(hmap) {
    var kopie = hmap.map(function(r) { return r.slice(); });
    // Verlaag een willekeurige cel met 1 (zodat het bouwsel anders is)
    var kandidaten = [];
    for (var y = 0; y < kopie.length; y++)
        for (var x = 0; x < kopie[y].length; x++)
            if (kopie[y][x] > 0) kandidaten.push([y, x]);
    if (kandidaten.length > 0) {
        var k = kandidaten[Math.floor(Math.random() * kandidaten.length)];
        kopie[k[0]][k[1]] = Math.max(0, kopie[k[0]][k[1]] - 1);
    }
    return fixeerHoogtemap(kopie);
}

function verwijderZwevendeBlokken(h) { return h; } // no-op: hoogtemap heeft nooit zwevende blokken

function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
}

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
window.BlokkenRenderer = {
    renderBouwsel,
    renderAanzicht,
    renderGrondplanHTML,
    berekenGrondplan,
    berekenAanzicht,
    genereerBouwsel,
    genereerAndereGrid,
    fixeerHoogtemap,
    verwijderZwevendeBlokken,
    telBlokken,
    shuffle,
    volgendSchema,
    BLOK_KLEUREN,
    NIVEAU_CONFIG,
};