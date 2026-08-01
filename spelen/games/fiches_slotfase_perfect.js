
function toonFicheBijSpeler(speler) {
    const zone = document.querySelector(`#speler${speler}Zone .fiche-cirkel`);
    zone.innerHTML = "";

    const fiche = document.createElement("div");
    fiche.classList.add("kleur-fiche");
    fiche.style.width = "60px";
    fiche.style.height = "60px";
    fiche.style.borderRadius = "50%";
    fiche.style.backgroundColor = speler === 1 ? "yellow" : "red";
    fiche.dataset.kleur = speler === 1 ? "yellow" : "red";
    zone.appendChild(fiche);
}

function resetFiches() {
    document.querySelectorAll(".fiche-cirkel").forEach(cirkel => {
        cirkel.innerHTML = "";
    });
}

// Plaats fiche in kolom
document.querySelectorAll(".kolom-knop").forEach((knop, index) => {
    knop.addEventListener("click", () => {
        const fiche = document.querySelector(`#speler${actieveSpeler}Zone .fiche-cirkel div`);
        if (!fiche) return;

        const kleur = fiche.dataset.kleur;
        const kolom = index;
        const cellen = document.querySelectorAll("#bordContainer .vakje");

        // vind de laagste vrije cel in deze kolom
        for (let rij = 5; rij >= 0; rij--) {
            const celIndex = rij * 7 + kolom;
            const cel = cellen[celIndex];
            if (!cel.hasChildNodes()) {
                const nieuweFiche = fiche.cloneNode(true);
                cel.innerHTML = ""; // leeg eerst het vakje voor de zekerheid
                nieuweFiche.style.position = "absolute";
                nieuweFiche.style.top = "50%";
                nieuweFiche.style.left = "50%";
                nieuweFiche.style.transform = "translate(-50%, -50%)";
                cel.appendChild(nieuweFiche);
                document.querySelector(`#speler${actieveSpeler}Zone .fiche-cirkel`).innerHTML = "";
                controleerWinst(rij, kolom, kleur);
                break;
            }
        }
    });
});

function controleerWinst(rij, kolom, kleur) {
    const getCel = (r, k) => {
        if (r < 0 || r > 5 || k < 0 || k > 6) return null;
        return document.querySelectorAll("#bordContainer .vakje")[r * 7 + k];
    };

    const richtingen = [
        { dr: 0, dk: 1 },   // horizontaal →
        { dr: 1, dk: 0 },   // verticaal ↓
        { dr: 1, dk: 1 },   // diagonaal ↘
        { dr: 1, dk: -1 }   // diagonaal ↙
    ];

    for (let { dr, dk } of richtingen) {
        let ketting = [{ r: rij, k: kolom }];

        // vooruit tellen
        for (let i = 1; i < 4; i++) {
            const cel = getCel(rij + dr * i, kolom + dk * i);
            if (cel && cel.firstChild && cel.firstChild.dataset.kleur === kleur) {
                ketting.push({ r: rij + dr * i, k: kolom + dk * i });
            } else break;
        }

        // achteruit tellen
        for (let i = 1; i < 4; i++) {
            const cel = getCel(rij - dr * i, kolom - dk * i);
            if (cel && cel.firstChild && cel.firstChild.dataset.kleur === kleur) {
                ketting.unshift({ r: rij - dr * i, k: kolom - dk * i });
            } else break;
        }

        if (ketting.length >= 4) {
            setTimeout(() => { toonWinnendeSlotfase(kleur); }, 2000);
            ketting.forEach(({ r, k }) => {
                const cel = getCel(r, k);
                if (cel) {
                    cel.style.animation = "flitsen 0.4s infinite alternate";
                }
            });
            break;
        }
    }
}


function toonWinnendeSlotfase(kleur) {
    console.log('toonWinnendeSlotfase aangeroepen met kleur:', kleur);
    document.querySelector(".spel-inhoud").style.display = "none";

    const zisa = document.createElement("img");
    zisa.src = "tafels_afbeeldingen/zisa_wint.png";
    zisa.style.position = "fixed";
    zisa.style.top = "50%";
    zisa.style.left = "50%";
    zisa.style.transform = "translate(-50%, -50%)";
    zisa.style.zIndex = "1001";
    zisa.style.height = "350px";
    zisa.id = "zisaWin";
    document.body.appendChild(zisa);

    for (let i = 0; i < 30; i++) {
        const fiche = document.createElement("div");
        fiche.className = "vallende-fiche";
        fiche.style.backgroundColor = kleur;
        fiche.style.left = Math.random() * 100 + "vw";
        fiche.style.animationDuration = (4 + Math.random() * 3) + "s";
        fiche.style.transform = `rotate(${Math.random() * 360}deg)`;
        fiche.style.opacity = 0.8 + Math.random() * 0.2;
        document.body.appendChild(fiche);
    }
}