document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const meldingContainer = document.getElementById("meldingContainer");

    const wekkerImg = new Image();
    wekkerImg.src = 'klok_afbeeldingen/wekker.png';
    wekkerImg.onload = () => {
        genereerWerkblad();
    };
    wekkerImg.onerror = () => {
        meldingContainer.textContent = "Fout: kon 'wekker.png' niet laden. Zorg ervoor dat het bestand in de map 'klok_afbeeldingen' staat.";
    }

    function genereerWerkblad() {
        const numClocks = parseInt(document.getElementById("numClocks").value);
        const toonHulpminuten = document.getElementById("hulpminuten").checked;
        const toon24Uur = document.getElementById("hulp24uur").checked;
        const moeilijkheden = Array.from(document.querySelectorAll('input[name="moeilijkheid"]:checked')).map(cb => cb.value);
        const tijdnotatie = document.querySelector('input[name="tijdnotatie"]:checked').value;

        meldingContainer.textContent = "";
        if (moeilijkheden.length === 0) {
            meldingContainer.textContent = "Kies minstens één moeilijkheidsgraad!";
            return;
        }

        // AANGEPAST: Layout is nu altijd 4 kolommen en de afmetingen zijn vergroot
        const numCols = 4;
        const singleClockWidth = 150; // Was 120
        const padding = 90;
        const wekkerDisplayWidth = 120; // Was 100
        
        const spacingBetween = toon24Uur ? 45 : 20; // Iets meer verticale ruimte
        const wekkerRatio = wekkerImg.width / wekkerImg.height;
        const wekkerDisplayHeight = wekkerDisplayWidth / wekkerRatio;
        let singleClockTotalHeight;
        if (tijdnotatie === '24uur') {
            const labelHeight = 15;
            const spacingBetweenWekkers = 5;
            const wekkerBlokHoogte = (labelHeight + wekkerDisplayHeight) * 2 + spacingBetweenWekkers;
            singleClockTotalHeight = singleClockWidth + spacingBetween + wekkerBlokHoogte;
        } else {
            singleClockTotalHeight = singleClockWidth + spacingBetween + wekkerDisplayHeight;
        }
        
        const numRows = Math.ceil(numClocks / numCols);
        canvas.width = (singleClockWidth * numCols) + (padding * (numCols + 1));
        canvas.height = (singleClockTotalHeight * numRows) + (padding * (numRows + 1));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < numClocks; i++) {
            const row = Math.floor(i / numCols);
            const col = i % numCols;

            const x = padding + col * (singleClockWidth + padding);
            const y = padding + row * (singleClockTotalHeight + padding);
            
            ctx.strokeStyle = '#dddddd';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 15, y - 15, singleClockWidth + 30, singleClockTotalHeight + 30);

            const tijd = genereerTijd(moeilijkheden);
            tekenKlokSessie(x, y, singleClockWidth, tijd.uur, tijd.minuut, toonHulpminuten, toon24Uur, tijdnotatie, spacingBetween, wekkerDisplayWidth);
        }
    }

    function genereerTijd(moeilijkheden) {
        let uur = Math.floor(Math.random() * 12) + 1;
        let minuutPool = new Set();
        if (moeilijkheden.includes('uur')) minuutPool.add(0);
        if (moeilijkheden.includes('halfuur')) minuutPool.add(30);
        if (moeilijkheden.includes('kwartier')) {
            minuutPool.add(15);
            minuutPool.add(45);
        }
        if (moeilijkheden.includes('5minuten')) {
            for (let m = 0; m < 60; m += 5) minuutPool.add(m);
        }
        if (moeilijkheden.includes('minuut')) {
            for (let m = 0; m < 60; m++) minuutPool.add(m);
        }
        const minutenArray = Array.from(minuutPool);
        let minuut = minutenArray[Math.floor(Math.random() * minutenArray.length)];
        return { uur, minuut };
    }

    function tekenKlokSessie(x, y, width, uur, minuut, toonHulpminuten, toon24Uur, tijdnotatie, spacingBetween, wekkerDisplayWidth) {
        const radius = width / 2;
        const centerX = x + radius;
        const centerY = y + radius;
        tekenKlokBasis(centerX, centerY, radius, toonHulpminuten, toon24Uur);
        tekenWijzers(centerX, centerY, radius, uur, minuut);
        
        const wekkerRatio = wekkerImg.width / wekkerImg.height;
        const wekkerDisplayHeight = wekkerDisplayWidth / wekkerRatio;
        const wekkerX = centerX - (wekkerDisplayWidth / 2);

        if (tijdnotatie === '24uur') {
            const labelHeight = 15;
            const spacingBetweenWekkers = 5;
            const y1_label = y + width + spacingBetween;
            const y1_wekker = y1_label + labelHeight - 5;
            ctx.font = `italic ${labelHeight - 3}px Arial`;
            ctx.fillStyle = '#555';
            ctx.textAlign = 'center';
            ctx.fillText("ochtend/voormiddag", centerX, y1_label);
            ctx.drawImage(wekkerImg, wekkerX, y1_wekker, wekkerDisplayWidth, wekkerDisplayHeight);
            
            const y2_label = y1_wekker + wekkerDisplayHeight + spacingBetweenWekkers + labelHeight;
            const y2_wekker = y2_label + labelHeight - 5;
            ctx.fillText("namiddag/avond", centerX, y2_label);
            ctx.drawImage(wekkerImg, wekkerX, y2_wekker, wekkerDisplayWidth, wekkerDisplayHeight);
        } else {
            const wekkerY = y + width + spacingBetween;
            ctx.drawImage(wekkerImg, wekkerX, wekkerY, wekkerDisplayWidth, wekkerDisplayHeight);
        }
    }

    function tekenKlokBasis(centerX, centerY, radius, toonHulpminuten, toon24Uur) {
        const klokRadius = radius * 0.9;
        
        if (toon24Uur) {
            ctx.font = `bold ${radius * 0.15}px Arial`;
            ctx.fillStyle = "red";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (let uur = 1; uur <= 12; uur++) {
                const label = uur + 12;
                const hoek = (uur - 3) * (Math.PI / 6);
                const buitenRadius = radius * 1.15;
                const x = centerX + buitenRadius * Math.cos(hoek);
                const y = centerY + buitenRadius * Math.sin(hoek);
                ctx.fillText(label.toString(), x, y);
            }
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#A9D8E8";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, centerY, klokRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.font = `bold ${klokRadius * 0.15}px Arial`;
        ctx.fillStyle = "#448866";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let uur = 1; uur <= 12; uur++) {
            const hoek = (uur - 3) * (Math.PI / 6);
            const x = centerX + klokRadius * 0.75 * Math.cos(hoek);
            const y = centerY + klokRadius * 0.75 * Math.sin(hoek);
            ctx.fillText(uur.toString(), x, y);
        }

        for (let i = 0; i < 60; i++) {
            const hoek = i * (Math.PI / 30);
            const buiten = klokRadius;
            const binnen = i % 5 === 0 ? klokRadius * 0.92 : klokRadius * 0.95;
            ctx.beginPath();
            ctx.moveTo(centerX + buiten * Math.cos(hoek), centerY + buiten * Math.sin(hoek));
            ctx.lineTo(centerX + binnen * Math.cos(hoek), centerY + binnen * Math.sin(hoek));
            ctx.strokeStyle = "#444";
            ctx.lineWidth = i % 5 === 0 ? 1.5 : 1;
            ctx.stroke();
        }

        if (toonHulpminuten) {
            ctx.font = `${klokRadius * 0.1}px Arial`;
            ctx.fillStyle = "#448866";
            for (let i = 1; i <= 12; i++) {
                const minuten = (i * 5) % 60;
                const label = minuten === 0 ? "00" : minuten.toString();
                const hoek = (i - 3) * (Math.PI / 6);
                const x = centerX + klokRadius * 0.55 * Math.cos(hoek);
                const y = centerY + klokRadius * 0.55 * Math.sin(hoek);
                ctx.fillText(label, x, y);
            }
        }
    }

    function tekenWijzers(centerX, centerY, radius, uur, minuut) {
        const klokRadius = radius * 0.9;
        const uurPos = (uur % 12 + minuut / 60);
        const uurHoek = (uurPos - 3) * (Math.PI / 6);
        tekenWijzer(centerX, centerY, uurHoek, klokRadius * 0.45, 4, "#333");
        const minuutHoek = (minuut - 15) * (Math.PI / 30);
        tekenWijzer(centerX, centerY, minuutHoek, klokRadius * 0.7, 4, "#333");
    }

    function tekenWijzer(cx, cy, hoek, lengte, dikte, kleur) {
        ctx.beginPath();
        ctx.lineWidth = dikte;
        ctx.lineCap = "round";
        ctx.strokeStyle = kleur;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + lengte * Math.cos(hoek), cy + lengte * Math.sin(hoek));
        ctx.stroke();
    }

    document.getElementById("genereerBtn").addEventListener("click", genereerWerkblad);
    document.getElementById("numClocks").addEventListener("change", genereerWerkblad);
    document.getElementById("hulpminuten").addEventListener("change", genereerWerkblad);
    document.getElementById("hulp24uur").addEventListener("change", genereerWerkblad);
    document.querySelectorAll('input[name="tijdnotatie"]').forEach(radio => {
        radio.addEventListener("change", genereerWerkblad);
    });

    const moeilijkheidCheckboxes = document.querySelectorAll('input[name="moeilijkheid"]');
    moeilijkheidCheckboxes.forEach(cb => cb.addEventListener('change', genereerWerkblad));
    
    const selecteerAllesCheckbox = document.getElementById('selecteerAlles');
    selecteerAllesCheckbox.addEventListener('change', () => {
        moeilijkheidCheckboxes.forEach(checkbox => {
            checkbox.checked = selecteerAllesCheckbox.checked;
        });
        genereerWerkblad();
    });

    document.getElementById("downloadPngBtn").addEventListener("click", () => {
        const dataURL = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = "kloklezen_werkblad.png";
        a.click();
    });

    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        const dataURL = canvas.toDataURL("image/png");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - 2 * margin;
        const usableHeight = pageHeight - 2 * margin;
        const ratio = canvas.width / canvas.height;
        let pdfImgWidth = usableWidth;
        let pdfImgHeight = pdfImgWidth / ratio;
        if (pdfImgHeight > usableHeight) {
            pdfImgHeight = usableHeight;
            pdfImgWidth = pdfImgHeight * ratio;
        }
        const xPos = (pageWidth - pdfImgWidth) / 2;
        const yPos = margin;
        doc.text("Kloklezen Oefening", pageWidth / 2, margin, { align: 'center' });
        doc.addImage(dataURL, 'PNG', xPos, yPos + 5, pdfImgWidth, pdfImgHeight);
        doc.save("kloklezen_werkblad.pdf");
    });
});