/****************************************************
 * REKENEN – WERKBLAD MODULE
 ****************************************************/

function rRnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rDigits(n) {
    return String(n).split('').reverse().map(d => parseInt(d));
}

function checkBrug(g1, g2, op, brugKeuze) {
    if (brugKeuze === "beide") return true;

    const d1 = rDigits(g1);
    const d2 = rDigits(g2);

    let brug = false;

    for (let i = 0; i < Math.max(d1.length, d2.length); i++) {
        const a = d1[i] || 0;
        const b = d2[i] || 0;

        if (op === "+") { if (a + b > 9) brug = true; }
        else { if (a < b) brug = true; }
    }

    return (brugKeuze === "met" && brug) ||
           (brugKeuze === "zonder" && !brug);
}

function kiesSomtype(cfg) {
    const t = cfg.somTypes || ["E+E"];
    return t[Math.floor(Math.random() * t.length)];
}

function genereerRekensom(cfg) {
    const op = cfg.rekenType === "aftrekken" ? "-" : "+";
    const somType = kiesSomtype(cfg);
    const max = cfg.rekenMaxGetal || 100;

    let g1 = 0, g2 = 0;
    let tries = 0;

    while (true) {
        tries++;
        if (tries > 300) break;

        switch (somType) {
            case "E+E":
                g1 = rRnd(1, 9); g2 = rRnd(1, 9); break;
            case "T+E":
                g1 = rRnd(10, 99); g2 = rRnd(1, 9); break;
            case "TE+TE":
                g1 = rRnd(10, 99); g2 = rRnd(10, 99); break;
            case "HT+HT":
                g1 = rRnd(100, 999); g2 = rRnd(100, 999); break;
            default:
                g1 = rRnd(1, max); g2 = rRnd(1, max);
        }

        if (op === "-" && g1 < g2) continue;
        if (!checkBrug(g1, g2, op, cfg.rekenBrug)) continue;

        return {
            type: "rekenen",
            operator: op,
            getal1: g1,
            getal2: g2,
            compenseer: cfg.rekenStijl === "compensatie"
        };
    }

    return {
        type: "rekenen",
        operator: op,
        getal1: 8,
        getal2: 3,
        compenseer: cfg.rekenStijl === "compensatie"
    };
}

function renderRekenenSegment(cfg, container) {
    container.innerHTML = "";

    const titel = document.createElement("h2");
    titel.textContent = cfg.rekenTitel || "Rekenen";
    container.appendChild(titel);

    const lijst = document.createElement("div");
    lijst.className = "rekenen-lijst";
    container.appendChild(lijst);

    cfg._oefeningen.forEach(oef => {
        const blok = document.createElement("div");
        blok.className = "rekenen-oef";

        blok.innerHTML = `
            <div class="som-regel">${oef.getal1}</div>
            <div class="som-regel">${oef.operator} ${oef.getal2}</div>
            <div class="som-lijn"></div>
        `;

        if (oef.compenseer) {
            const comp = document.createElement("div");
            comp.className = "compenseer-vak";
            comp.textContent = (oef.operator === "+" ? "+ ___" : "- ___");
            blok.appendChild(comp);
        }

        lijst.appendChild(blok);
    });
}

function drawRekenenPDF(doc, cfg, oefeningen, startY) {
    let y = startY;

    doc.setFontSize(14);
    doc.text(cfg.rekenTitel || "Rekenen", 20, y);
    y += 10;

    doc.setFontSize(16);

    oefeningen.forEach(oef => {
        doc.text(`${oef.getal1}`, 20, y);
        y += 6;
        doc.text(`${oef.operator} ${oef.getal2}`, 20, y);
        y += 3;
        doc.line(20, y, 60, y);
        y += 10;

        if (oef.compenseer) {
            doc.text((oef.operator === "+" ? "+ ___" : "- ___"), 80, y - 5);
        }
    });

    return y;
}

window.RekenenModule = {
    genereerRekensom,
    renderRekenenSegment,
    drawRekenenPDF
};
