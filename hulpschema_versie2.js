document.addEventListener('DOMContentLoaded', () => {
    // --- Detecteer op welke pagina we zijn ---
    const isPlusPage = document.getElementById('schema') !== null;
    const isMinPage = document.getElementById('schema-min') !== null;

    // --- Algemene Elementen ---
    const blokjesBtn = document.getElementById('blokjes');
    const schijfjesBtn = document.getElementById('schijfjes');
    const resetBtn = document.getElementById('reset');
    const terugBtn = document.getElementById('terug');
    const toolbarTools = document.querySelectorAll('#toolbar .tool');

    let actiefElement = null;
    let offsetX = 0, offsetY = 0;

    // --- Knop Logica ---
    function disableKnoppen(except) {
        if (except === 'blokjes' && schijfjesBtn) schijfjesBtn.disabled = true;
        else if (except === 'schijfjes' && blokjesBtn) blokjesBtn.disabled = true;
    }
    function enableKnoppen() {
        if (blokjesBtn) blokjesBtn.disabled = false;
        if (schijfjesBtn) schijfjesBtn.disabled = false;
    }
    
    if (blokjesBtn) {
        blokjesBtn.addEventListener('click', () => {
            document.getElementById('kubus').style.display = 'block';
            document.getElementById('staaf').style.display = 'block';
            document.getElementById('schijf-geel').style.display = 'none';
            document.getElementById('schijf-groen').style.display = 'none';
        });
    }
    if (schijfjesBtn) {
        schijfjesBtn.addEventListener('click', () => {
            document.getElementById('kubus').style.display = 'none';
            document.getElementById('staaf').style.display = 'none';
            document.getElementById('schijf-geel').style.display = 'block';
            document.getElementById('schijf-groen').style.display = 'block';
        });
    }
    
    // --- Reset Logica ---
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.querySelectorAll('body > .tool').forEach(el => el.remove());
            document.querySelectorAll('.vak .tool, .cirkel .tool, .light-t .tool').forEach(el => el.remove());
            document.querySelectorAll('.cirkel, .light-t, .wissel-vak').forEach(zone => zone.innerHTML = '');
            toolbarTools.forEach(tool => tool.style.display = 'none');
            enableKnoppen();
            if (isMinPage) {
                document.getElementById('t-count').textContent = '0';
                document.getElementById('e-count').textContent = '0';
                document.getElementById('vuilbak-container').style.display = 'block';
            }
            if (isPlusPage && wisselKnopPlus) wisselKnopPlus.remove();
        });
    }

    // --- Terugknop Logica ---
    if (terugBtn) {
        terugBtn.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            window.location.href = params.get("terug") || "index.html";
        });
    }

    // --- Sleep Logica ---
    function startDragPointer(e) {
        const tool = e.target.closest('.tool');
        if (!tool) return;

        // Belangrijk voor touch: voorkom scroll/zoom tijdens drag
        if (e.cancelable) e.preventDefault();

        const isClone = tool.closest('#toolbar') !== null;
        
        if (isClone) {
            actiefElement = tool.cloneNode(true);
            actiefElement.id = tool.id + '-clone-' + Date.now();
        } else {
            actiefElement = tool;
        }

        const rect = tool.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // Neutraliseer transformatie voor soepel oppakken
        actiefElement.style.transform = 'none';
        actiefElement.style.position = 'absolute';
        actiefElement.style.zIndex = 1000;
        actiefElement.style.left = `${rect.left}px`;
        actiefElement.style.top = `${rect.top}px`;

        // Zorg dat tekst niet geselecteerd wordt tijdens drag
        document.body.style.userSelect = 'none';

        // Pointer capture: alle bewegingen blijven bij ons
        if (actiefElement.setPointerCapture && e.pointerId != null) {
            try { actiefElement.setPointerCapture(e.pointerId); } catch {}
        }
        
        document.body.appendChild(actiefElement);

        // Zet listeners (niet-passive zodat preventDefault blijft werken)
        document.addEventListener('pointermove', dragMove, { passive: false });
        document.addEventListener('pointerup', dragEnd, { once: true, passive: false });
    }

    function dragMove(e) {
        if (!actiefElement) return;
        if (e.cancelable) e.preventDefault(); // blijf scroll/zoom tegenhouden
        actiefElement.style.left = `${e.clientX - offsetX}px`;
        actiefElement.style.top = `${e.clientY - offsetY}px`;
    }

    function dragEnd(e) {
        document.removeEventListener('pointermove', dragMove);

        if (!actiefElement) {
            document.body.style.userSelect = '';
            return;
        }

        // Release pointer capture
        if (actiefElement.releasePointerCapture && e.pointerId != null) {
            try { actiefElement.releasePointerCapture(e.pointerId); } catch {}
        }

        actiefElement.style.visibility = 'hidden';
        const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
        actiefElement.style.visibility = 'visible';

        const targetZone = dropTarget ? dropTarget.closest('.cirkel, .vak, .light-t, .wissel-vak, #vuilbak') : null;

        if (targetZone) {
            if (targetZone.id === 'vuilbak' && isMinPage) {
                handleVuilbakDrop(actiefElement);
            } else {
                targetZone.appendChild(actiefElement);
                actiefElement.style.position = 'absolute';
                if (targetZone.classList.contains('cirkel')) {
                    actiefElement.style.left = '50%';
                    actiefElement.style.top = '50%';
                    actiefElement.style.transform = 'translate(-50%, -50%)';
                } else {
                    const zoneRect = targetZone.getBoundingClientRect();
                    actiefElement.style.left = `${e.clientX - zoneRect.left - offsetX}px`;
                    actiefElement.style.top = `${e.clientY - zoneRect.top - offsetY}px`;
                    actiefElement.style.transform = 'none';
                }
                if (isPlusPage) handlePlusDrop(targetZone);
                if (isMinPage) handleMinDrop(targetZone, actiefElement);
            }
        } else {
            actiefElement.remove();
        }

        actiefElement = null;
        document.body.style.userSelect = ''; // herstel selectie
    }
    
    // Let op: we luisteren op body voor alle pointerdowns
    document.body.addEventListener('pointerdown', startDragPointer, { passive: false });

    // --- PAGINA-SPECIFIEKE LOGICA ---
    let wisselKnopPlus = null;
    function handlePlusDrop(targetZone) {
        if (targetZone.classList.contains('cirkel')) {
            const tool = targetZone.querySelector('.tool');
            if(tool.classList.contains('geel-blok')) disableKnoppen('blokjes');
            if(tool.classList.contains('schijf')) disableKnoppen('schijfjes');
            controleerCirkelsPlus();
        }
    }
    
    function toonWisselKnopPlus(type) {
        const lightVak = document.querySelector('.light-t');
        if (wisselKnopPlus) wisselKnopPlus.remove();
        wisselKnopPlus = document.createElement('button');
        wisselKnopPlus.textContent = 'Wissel om';
        wisselKnopPlus.className = 'wissel-knop';
        wisselKnopPlus.addEventListener('click', () => {
            document.querySelectorAll('#schema .cirkel').forEach(c => c.innerHTML = '');
            let groenTool;
            if (type === 'schijfjes') {
                groenTool = document.getElementById('schijf-groen').cloneNode(true);
            } else {
                groenTool = document.getElementById('staaf').cloneNode(true);
            }
            groenTool.style.position = 'absolute';
            groenTool.style.left = '50%';
            groenTool.style.top = '50%';
            groenTool.style.transform = 'translate(-50%, -50%)';
            groenTool.style.display = 'block';
            if(groenTool.classList.contains('schijf')) groenTool.style.display = 'flex';
            lightVak.innerHTML = '';
            lightVak.appendChild(groenTool);
            if (wisselKnopPlus) wisselKnopPlus.remove();
            wisselKnopPlus = null;
        });
        if(lightVak) lightVak.appendChild(wisselKnopPlus);
    }
    
    function controleerCirkelsPlus() {
        const cirkels = document.querySelectorAll('#schema .cirkel');
        const toolsInCirkels = Array.from(cirkels).map(c => c.querySelector('.tool')).filter(t => t);
        if (toolsInCirkels.length === 10) {
            if (toolsInCirkels.every(t => t.classList.contains('geel-blok'))) {
                toonWisselKnopPlus('blokjes');
            } else if (toolsInCirkels.every(t => t.classList.contains('schijf') && t.classList.contains('geel'))) {
                toonWisselKnopPlus('schijfjes');
            }
        } else {
            if (wisselKnopPlus) wisselKnopPlus.remove();
            wisselKnopPlus = null;
        }
    }

    function handleMinDrop(targetZone, tool) {
        if (targetZone.classList.contains('wissel-vak')) {
            const isGroeneStaaf = tool.classList.contains('staaf-groen');
            const isGroeneSchijf = tool.classList.contains('schijf') && tool.classList.contains('groen');
            if (isGroeneStaaf || isGroeneSchijf) {
                tool.style.left = '50%';
                tool.style.top = '50%';
                tool.style.transform = 'translate(-50%, -50%)';
                toonWisselKnopMin(targetZone, tool);
            }
        } else {
            const wisselvak = document.querySelector('.wissel-vak');
            if(wisselvak) wisselvak.querySelectorAll('.wissel-knop').forEach(k => k.remove());
        }
    }

    function toonWisselKnopMin(wisselVak, tool) {
        wisselVak.querySelectorAll('.wissel-knop').forEach(k => k.remove());
        const knop = document.createElement('button');
        knop.className = 'wissel-knop';
        knop.textContent = 'Wissel om';
        knop.addEventListener('click', () => {
            const legeCirkels = Array.from(document.querySelectorAll('#schema-min .cirkel:empty'));
            if (legeCirkels.length < 10) return;
            const isStaaf = tool.classList.contains('staaf-groen');
            const bron = isStaaf ? document.getElementById('kubus') : document.getElementById('schijf-geel');
            for (let i = 0; i < 10; i++) {
                const nieuweEenheid = bron.cloneNode(true);
                nieuweEenheid.style.display = 'block';
                if (nieuweEenheid.classList.contains('schijf')) nieuweEenheid.style.display = 'flex';
                nieuweEenheid.style.position = 'absolute';
                nieuweEenheid.style.left = '50%';
                nieuweEenheid.style.top = '50%';
                nieuweEenheid.style.transform = 'translate(-50%, -50%)';
                legeCirkels[i].appendChild(nieuweEenheid);
            }
            tool.remove();
            knop.remove();
        });
        wisselVak.appendChild(knop);
    }

    function handleVuilbakDrop(tool) {
        const tCountEl = document.getElementById('t-count');
        const eCountEl = document.getElementById('e-count');
        let t = parseInt(tCountEl.textContent);
        let e = parseInt(eCountEl.textContent);
        const isGroeneStaaf = tool.classList.contains('staaf-groen');
        const isGroeneSchijf = tool.classList.contains('schijf') && tool.classList.contains('groen');
        const isGeleBlok = tool.classList.contains('geel-blok');
        const isGeleSchijf = tool.classList.contains('schijf') && tool.classList.contains('geel');
        if (isGroeneStaaf || isGroeneSchijf) {
            t++;
            tCountEl.textContent = t;
        } else if (isGeleBlok || isGeleSchijf) {
            e++;
            eCountEl.textContent = e;
        }
        tool.remove();
    }
});

/* ===============================
   SCHRIJFVLAK / CANVAS TEKENTOOL
   =============================== */

document.addEventListener("DOMContentLoaded", () => {
    let lijnen = [];   
let huidigeLijn = null;

function afstandPuntTotSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A*C + B*D;
    const len = C*C + D*D;
    let t = dot / len;
    t = Math.max(0, Math.min(1, t));

    const xx = x1 + t*C;
    const yy = y1 + t*D;

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx*dx + dy*dy);
}


    const openBtn = document.getElementById("schrijfvlak-open");
    const container = document.getElementById("schrijfvlak-container");
    const closeBtn = document.getElementById("close-schrijfvlak");
    const canvas = document.getElementById("schrijf-canvas");

    const penBtn = document.getElementById("pen-tool");
    const colorBtn = document.getElementById("color-tool");
    const eraserBtn = document.getElementById("eraser-tool");
    const clearBtn = document.getElementById("clear-tool");

    const palette = document.getElementById("color-palette");

    if (!canvas) return; // veiligheid

    const ctx = canvas.getContext("2d");

    let tekenen = false;
    let huidigeKleur = "#000000";
    let lijndikte = 3;

    function canvasGrootteInstellen() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }


    /* === Schrijfvlak openen/sluiten === */
    openBtn?.addEventListener("click", () => {
    document.body.classList.add("schrijfvlak-open");

    // BELANGRIJK: canvas pas schalen ALS het zichtbaar is
    setTimeout(() => {
        canvasGrootteInstellen();
    }, 50);
});

    closeBtn?.addEventListener("click", () => {
        document.body.classList.remove("schrijfvlak-open");
    });

    /* === Pen = tekenen === */
    

    /* === Kleurenset openen === */
    colorBtn?.addEventListener("click", () => {
        palette.style.display = palette.style.display === "none" ? "flex" : "none";
    });

    /* === Kleur kiezen === */
    document.querySelectorAll(".kleurbol").forEach(bol => {
        bol.addEventListener("click", () => {
            huidigeKleur = bol.dataset.kleur;
        });
    });

    /* === Gommen === */
    let gommodus = false;

eraserBtn?.addEventListener("click", () => {
    gommodus = true;
});

penBtn?.addEventListener("click", () => {
    gommodus = false;
});


    /* === Alles wissen === */
   clearBtn?.addEventListener("click", () => {
    lijnen = [];  // <<< BELANGRIJK! Alle opgeslagen lijnen wissen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});


    /* === Tekenen met muis === */
    function startTekenen(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    if (gommodus) {
        verwijderLijnBijKlik(x, y);
        return;
    }

    tekenen = true;
    huidigeLijn = {
        punten: [{x, y}],
        kleur: huidigeKleur,
        dikte: lijndikte
    };
    lijnen.push(huidigeLijn);
}

function tekenenBeweging(e) {
    if (!tekenen || gommodus) return;
    const x = e.offsetX;
    const y = e.offsetY;
    huidigeLijn.punten.push({x, y});
    tekenAllesOpnieuw();
}

function eindeTekenen() {
    tekenen = false;
    huidigeLijn = null;
}
function verwijderLijnBijKlik(x, y) {
    let besteIndex = -1;
    let besteAfstand = Infinity;
    const drempel = 15;

    lijnen.forEach((lijn, index) => {
        for (let i = 1; i < lijn.punten.length; i++) {
            const p1 = lijn.punten[i-1];
            const p2 = lijn.punten[i];
            const afstand = afstandPuntTotSegment(x, y, p1.x, p1.y, p2.x, p2.y);

            if (afstand < besteAfstand) {
                besteAfstand = afstand;
                besteIndex = index;
            }
        }
    });

    if (besteIndex !== -1 && besteAfstand < drempel) {
        lijnen.splice(besteIndex, 1);
        tekenAllesOpnieuw();
    }
}
function tekenAllesOpnieuw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lijnen.forEach(lijn => {
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.strokeStyle = lijn.kleur;
        ctx.lineWidth = lijn.dikte;

        const pts = lijn.punten;
        ctx.moveTo(pts[0].x, pts[0].y);

        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }

        ctx.stroke();
    });
}


    canvas.addEventListener("mousedown", startTekenen);
    canvas.addEventListener("mouseup", eindeTekenen);
    canvas.addEventListener("mouseleave", eindeTekenen);
    canvas.addEventListener("mousemove", tekenenBeweging);

    /* === Tekenen met touch (smartboard) === */
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        startTekenen({ offsetX: t.clientX - rect.left, offsetY: t.clientY - rect.top });
    });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        tekenenBeweging({ offsetX: t.clientX - rect.left, offsetY: t.clientY - rect.top });
    });

    canvas.addEventListener("touchend", eindeTekenen);

});
