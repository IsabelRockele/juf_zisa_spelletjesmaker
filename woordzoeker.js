const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Globale variabelen om de huidige puzzelstatus bij te houden
let currentPuzzleState = {};
let solutionVisible = false;

// ===== Helpers =====
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomLetter() {
  return ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
}

/** Verwijder accenten/diacritics, spaties, koppeltekens en niet-letters; zet om naar A-Z */
function sanitizeWord(raw) {
  if (!raw) return "";
  const noDiacritics = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents
  const lettersOnly = noDiacritics
    .toUpperCase()
    .replace(/[^A-Z]/g, ""); // keep A-Z only
  return lettersOnly;
}

// ===== Plaatsen/genereren =====
function placeWord(grid, word, row, col, dr, dc) {
  const L = word.length, N = grid.length;
  for (let i = 0; i < L; i++) {
    const r = row + i * dr, c = col + i * dc;
    if (r < 0 || r >= N || c < 0 || c >= N) return false;
    if (grid[r][c] !== "" && grid[r][c] !== word[i]) return false;
  }
  for (let i = 0; i < L; i++) {
    const r = row + i * dr, c = col + i * dc;
    grid[r][c] = word[i];
  }
  return true;
}

/**
 * Genereer woordzoeker grid.
 * @returns {Object} { grid, successfullyPlacedWords, unplacedWords, wordLocations }
 */
function generateWordSearch(words, gridSize, directions) {
  let grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(""));
  const possibleDirections = [];

  let successfullyPlacedWords = [];
  let unplacedWords = [];
  let wordLocations = [];

  if (directions.horizontaal) possibleDirections.push({ dr: 0, dc: 1 });
  if (directions.verticaal) possibleDirections.push({ dr: 1, dc: 0 });
  if (directions.diagonaal) {
    // Diagonalen altijd linksstartend
    possibleDirections.push({ dr: 1, dc: 1 });   // ↘
    possibleDirections.push({ dr: -1, dc: 1 });  // ↗
  }
  if (possibleDirections.length === 0) possibleDirections.push({ dr: 0, dc: 1 });

  words.sort((a, b) => b.length - a.length);

  for (const word of words) {
    let placed = false;
    const shuffled = [...possibleDirections].sort(() => Math.random() - 0.5);

    for (const dir of shuffled) {
      if (placed) break;
      for (let i = 0; i < 150; i++) {
        const r0 = getRandomInt(0, gridSize - 1);
        const c0 = getRandomInt(0, gridSize - 1);
        const { dr, dc } = dir;

        const temp = JSON.parse(JSON.stringify(grid));
        if (placeWord(temp, word, r0, c0, dr, dc)) {
          grid = temp;
          placed = true;
          successfullyPlacedWords.push(word);
          wordLocations.push({ word, row: r0, col: c0, dr, dc });
          break;
        }
      }
    }
    if (!placed) {
      unplacedWords.push(word);
      console.warn(`Kon woord niet plaatsen: ${word}`);
    }
  }

  // Vul lege vakken
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === "") grid[r][c] = getRandomLetter();
    }
  }

  return { grid, successfullyPlacedWords, unplacedWords, wordLocations };
}

// ===== Tekenen =====
function drawPuzzle() {
  if (!currentPuzzleState.grid) return;

  const { grid, gridSize } = currentPuzzleState;
  const w = canvas.width / gridSize;
  const h = canvas.height / gridSize;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Letters
  ctx.font = `${Math.min(h * 0.6, 30)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      ctx.fillText(grid[r][c], c * w + w / 2, r * h + h / 2);
    }
  }

  // Raster
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * w, 0);
    ctx.lineTo(i * w, canvas.height);
    ctx.stroke();
  }
  for (let j = 0; j <= gridSize; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * h);
    ctx.lineTo(canvas.width, j * h);
    ctx.stroke();
  }

  if (solutionVisible) drawSolution();
}

function drawSolution() {
  const { wordLocations, gridSize } = currentPuzzleState;
  if (!wordLocations || wordLocations.length === 0) return;

  const w = canvas.width / gridSize;
  const h = canvas.height / gridSize;

  ctx.strokeStyle = "rgba(255, 255, 0, 0.7)";
  ctx.lineWidth = h * 0.7;
  ctx.lineCap = "round";

  wordLocations.forEach(loc => {
    const x1 = loc.col * w + w / 2;
    const y1 = loc.row * h + h / 2;
    const x2 = (loc.col + (loc.word.length - 1) * loc.dc) * w + w / 2;
    const y2 = (loc.row + (loc.word.length - 1) * loc.dr) * h + h / 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}

function toggleSolution() {
  if (Object.keys(currentPuzzleState).length === 0) return;
  solutionVisible = !solutionVisible;
  const btn = document.getElementById("toonOplossingBtn");
  btn.textContent = solutionVisible ? "Verberg Oplossing" : "Toon Oplossing";
  drawPuzzle();
}

// ===== UI hulpfuncties (titel & modus) =====
function getSelectedLijstTitel() {
  const sel = document.getElementById("lijstTitelType");
  const type = sel ? sel.value : "default";
  if (type === "custom") {
    const v = (document.getElementById("customLijstTitel")?.value || "").trim();
    return v || "Woorden om te vinden";
  }
  const map = {
    default: "Woorden om te vinden",
    vertaling: "Zoek de vertaling",
    synoniem: "Zoek het synoniem",
    tegenstelling: "Zoek de tegenstelling",
    rijmwoord: "Zoek het rijmwoord",
  };
  return map[type] || "Woorden om te vinden";
}
function updateLijstTitel() {
  const h = document.getElementById("woordenLijstTitel");
  if (h) h.textContent = getSelectedLijstTitel();

  const sel = document.getElementById("lijstTitelType");
  const custom = document.getElementById("customLijstTitel");
  if (sel && custom) {
    custom.style.display = sel.value === "custom" ? "block" : "none";
  }
}
function updateModeUI() {
  const mode = document.getElementById("taalMode").value;
  const singleGrp = document.getElementById("singleInputGroup");
  const pairGrp = document.getElementById("pairInputGroup");
  if (mode === "single") {
    singleGrp.style.display = "";
    pairGrp.style.display = "none";
  } else {
    singleGrp.style.display = "none";
    pairGrp.style.display = "";
  }
}

// ===== Tellers in de UI =====
function updateWordCountMessageSingle(count) {
  const el = document.getElementById("woordAantalMelding");
  const MIN = 6, MAX = 20;
  if (!el) return;
  if (count < MIN) {
    el.textContent = `Je moet nog ${MIN - count} woord(en) toevoegen.`;
    el.style.color = "red";
  } else if (count > MAX) {
    el.textContent = `Te veel woorden: ${count - MAX} woord(en) worden genegeerd.`;
    el.style.color = "orange";
  } else {
    el.textContent = `Aantal woorden: ${count} (OK)`;
    el.style.color = "#004080";
  }
}
function updatePairCountMessage(count) {
  const el = document.getElementById("paarAantalMelding");
  const MIN = 6, MAX = 20;
  if (!el) return;
  if (count < MIN) {
    el.textContent = `Je moet nog ${MIN - count} paar/paren toevoegen.`;
    el.style.color = "red";
  } else if (count > MAX) {
    el.textContent = `Te veel paren: ${count - MAX} worden genegeerd.`;
    el.style.color = "orange";
  } else {
    el.textContent = `Aantal paren: ${count} (OK)`;
    el.style.color = "#004080";
  }
}

// ===== Hoofdfunctie =====
function genereerWoordzoeker() {
  const mode = document.getElementById("taalMode").value;

  let puzzleWords = [];       // gesaneerde woorden die in het raster komen
  let displayPairs = [];      // voor paren: [{puzzleSan, shownRaw}] zodat we na plaatsing kunnen filteren
  let displayListRaw = [];    // wat effectief onderaan getoond wordt (na plaatsingsfilter)
  let meldingContainer = document.getElementById("meldingContainer");
  meldingContainer.innerHTML = "";
  meldingContainer.style.color = "#004080";

  const MIN_WORDS = 6, MAX_WORDS = 20, MAX_WORD_LENGTH = 12, MIN_GRID_SIZE_AUTO = 8;

  if (mode === "single") {
    const woordenInput = document.getElementById("woordenInput").value;
    let woorden = woordenInput
      .split("\n")
      .map(w => sanitizeWord(w.trim()))
      .filter(w => w.length > 0 && /^[A-Z]+$/.test(w));

    updateWordCountMessageSingle(woorden.length);

    if (woorden.length < MIN_WORDS) {
      meldingContainer.style.color = "red";
      meldingContainer.innerHTML = `Voer minimaal ${MIN_WORDS} geldige woorden in.`;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      document.getElementById("woordenLijst").innerHTML = "";
      return;
    }
    if (woorden.length > MAX_WORDS) woorden = woorden.slice(0, MAX_WORDS);

    let truncated = false;
    puzzleWords = woorden.map(w => {
      if (w.length > MAX_WORD_LENGTH) {
        truncated = true;
        return w.substring(0, MAX_WORD_LENGTH);
      }
      return w;
    });
    if (truncated) {
      meldingContainer.style.color = "orange";
      meldingContainer.innerHTML += `Sommige woorden zijn afgekapt tot ${MAX_WORD_LENGTH} letters.<br>`;
    }

  } else {
    // Parenmodus
    const lines = document.getElementById("parenInput").value.split("\n");
    let pairs = lines
      .map(line => line.split(";").map(s => s.trim()))
      .filter(parts => parts.length === 2 && parts[0] && parts[1]);

    updatePairCountMessage(pairs.length);

    if (pairs.length < MIN_WORDS) {
      meldingContainer.style.color = "red";
      meldingContainer.innerHTML = `Voer minimaal ${MIN_WORDS} geldige paren in (links; rechts).`;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      document.getElementById("woordenLijst").innerHTML = "";
      return;
    }
    if (pairs.length > MAX_WORDS) pairs = pairs.slice(0, MAX_WORDS);

    const leftSan = pairs.map(p => sanitizeWord(p[0]));
    const rightSan = pairs.map(p => sanitizeWord(p[1]));
    let truncated = false;

    const modeLeftInPuzzle = (mode === "linksInPuzzel");
    const selectedSan = (modeLeftInPuzzle ? leftSan : rightSan).map(w => {
      if (w.length > MAX_WORD_LENGTH) {
        truncated = true;
        return w.substring(0, MAX_WORD_LENGTH);
      }
      return w;
    });
    puzzleWords = selectedSan;

    if (truncated) {
      meldingContainer.style.color = "orange";
      meldingContainer.innerHTML += `Sommige puzzelwoorden zijn afgekapt tot ${MAX_WORD_LENGTH} letters.<br>`;
    }

    // Bewaar mapping puzzleSanitized -> shownRaw (tegenhanger in leesbare vorm)
    displayPairs = pairs.map((p, idx) => ({
      puzzleSan: modeLeftInPuzzle ? leftSan[idx] : rightSan[idx],
      shownRaw : modeLeftInPuzzle ? p[1] : p[0]    // de “andere” kant tonen
    }));
  }

  // Rastergrootte
  const rasterFormaat = document.getElementById("rasterFormaat").value;
  let gridSize;
  const selectedGridSize = parseInt(rasterFormaat.split("x")[0]);
  if ([6, 8, 10].includes(selectedGridSize)) {
    let maxLen = Math.max(...puzzleWords.map(w => w.length));
    if (maxLen > selectedGridSize) {
      meldingContainer.style.color = "orange";
      meldingContainer.innerHTML += `Let op: Raster van ${selectedGridSize}×${selectedGridSize} is krap voor woorden langer dan ${selectedGridSize} letters.<br>`;
    }
  }
  if (rasterFormaat === "auto") {
    let maxWordLength = Math.max(...puzzleWords.map(w => w.length));
    gridSize = Math.max(maxWordLength + 3, Math.ceil(Math.sqrt(puzzleWords.length) * 3) + 3);
    gridSize = Math.min(gridSize, 25);
    gridSize = Math.max(gridSize, MIN_GRID_SIZE_AUTO);
  } else {
    gridSize = parseInt(rasterFormaat.split("x")[0]);
  }

  // Richtingen
  const allowedDirections = {
    horizontaal: document.querySelector('input[value="horizontaal"]').checked,
    verticaal: document.querySelector('input[value="verticaal"]').checked,
    diagonaal: document.querySelector('input[value="diagonaal"]').checked
  };
  if (!allowedDirections.horizontaal && !allowedDirections.verticaal && !allowedDirections.diagonaal) {
    meldingContainer.style.color = "red";
    meldingContainer.innerHTML += "Selecteer minstens één zoekrichting.";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("woordenLijst").innerHTML = "";
    return;
  }

  // Genereer
  const result = generateWordSearch(puzzleWords, gridSize, allowedDirections);

  currentPuzzleState = {
    grid: result.grid,
    gridSize: gridSize,
    wordLocations: result.wordLocations
  };
  solutionVisible = false;
  document.getElementById("toonOplossingBtn").textContent = "Toon Oplossing";
  drawPuzzle();

  if (result.unplacedWords.length > 0) {
    meldingContainer.style.color = "red";
    // Toon onthoofde puzzelwoorden; bij paren adviseer groter raster
    meldingContainer.innerHTML += `<b>Opgelet:</b> De volgende woorden konden niet geplaatst worden: ${result.unplacedWords.join(", ")}. Probeer een groter raster.`;
  }

  // Woordenlijst onderaan opbouwen
  const woordenLijstDiv = document.getElementById("woordenLijst");
  woordenLijstDiv.innerHTML = "";
  const ul = document.createElement("ul");
  ul.className = "kolommen";

  if (mode === "single") {
    const placedSet = new Set(result.successfullyPlacedWords);
    const list = Array.from(placedSet);
    list.sort();
    list.forEach(w => {
      const li = document.createElement("li");
      li.textContent = w;
      ul.appendChild(li);
    });
  } else {
    const placedSet = new Set(result.successfullyPlacedWords);
    // Neem enkel die paren waarvan de puzzel-kant effectief geplaatst is
    displayListRaw = displayPairs
      .filter(pair => placedSet.has(pair.puzzleSan))
      .map(pair => pair.shownRaw);
    displayListRaw.sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }));
    displayListRaw.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      ul.appendChild(li);
    });
  }

  woordenLijstDiv.appendChild(ul);
  updateLijstTitel();
}

// ===== Events =====
document.addEventListener("DOMContentLoaded", () => {
  // Init
  updateModeUI();
  updateLijstTitel();
  genereerWoordzoeker();

  document.getElementById("genereerBtn").addEventListener("click", genereerWoordzoeker);
  document.getElementById("toonOplossingBtn").addEventListener("click", toggleSolution);

  // Inputs
  document.getElementById("woordenInput").addEventListener("input", genereerWoordzoeker);
  document.getElementById("parenInput").addEventListener("input", genereerWoordzoeker);
  document.getElementById("rasterFormaat").addEventListener("change", genereerWoordzoeker);
  document.querySelectorAll('input[name="richting"]').forEach(cb => cb.addEventListener("change", genereerWoordzoeker));

  // Modus- & titelkeuze
  document.getElementById("taalMode").addEventListener("change", () => {
    updateModeUI();
    genereerWoordzoeker();
  });
  const sel = document.getElementById("lijstTitelType");
  const custom = document.getElementById("customLijstTitel");
  if (sel) sel.addEventListener("change", updateLijstTitel);
  if (custom) custom.addEventListener("input", updateLijstTitel);
});

// ===== Downloads =====
document.getElementById("downloadPngBtn").addEventListener("click", () => {
  const wasVisible = solutionVisible;
  if (wasVisible) toggleSolution();

  const dataURL = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "woordzoeker.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (wasVisible) toggleSolution();
});

document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
  const wasVisible = solutionVisible;
  if (wasVisible) toggleSolution();

  const dataURL = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 64, 128);
  doc.text("Woordzoeker", pageWidth / 2, 20, { align: "center" });

  const imgWidth = canvas.width, imgHeight = canvas.height;
  const ratio = imgWidth / imgHeight;
  let pdfImgWidth = pageWidth * 0.8;
  let pdfImgHeight = pdfImgWidth / ratio;
  if (pdfImgHeight > pageHeight * 0.55) {
    pdfImgHeight = pageHeight * 0.55;
    pdfImgWidth = pdfImgHeight * ratio;
  }
  const xPosImg = (pageWidth - pdfImgWidth) / 2;
  const yPosImg = 30;
  doc.addImage(dataURL, "PNG", xPosImg, yPosImg, pdfImgWidth, pdfImgHeight);

  const woorden = Array.from(document.querySelectorAll("#woordenLijst li")).map(li => li.textContent);
  const listTitleFontSize = 16, wordFontSize = 12, lineHeight = 7, listMarginTop = 10;
  let listStartY = yPosImg + pdfImgHeight + listMarginTop;
  const estimatedListHeight = listTitleFontSize / doc.internal.scaleFactor + (Math.ceil(woorden.length / 3) * lineHeight) + 10;
  if (listStartY + estimatedListHeight > pageHeight) {
    doc.addPage();
    listStartY = 20;
  }

  doc.setFontSize(listTitleFontSize);
  doc.setTextColor(0, 64, 128);
  const lijstTitelTekst = getSelectedLijstTitel();
  doc.text(lijstTitelTekst + ":", 20, listStartY);

  listStartY += listTitleFontSize / 2 + 5;
  doc.setFontSize(wordFontSize);
  doc.setTextColor(0, 0, 0);

  const outerMargin = 20, columnGap = 20, bulletRadius = 2.5, bulletTextGap = 2, columnPadding = 5;
  const totalContentWidth = pageWidth - (2 * outerMargin);
  const singleColumnWidth = (totalContentWidth - (2 * columnGap)) / 3;
  let itemsPerColumn = Math.ceil(woorden.length / 3);
  if (itemsPerColumn === 0) itemsPerColumn = 1;

  for (let i = 0; i < woorden.length; i++) {
    const word = woorden[i];
    const colIndex = Math.floor(i / itemsPerColumn);
    let y = listStartY + (i % itemsPerColumn) * lineHeight;
    let x = outerMargin + colIndex * (singleColumnWidth + columnGap);
    doc.circle(x + bulletRadius + columnPadding, y - lineHeight / 2 + (wordFontSize / doc.internal.scaleFactor / 2), bulletRadius, "D");
    doc.text(word, x + bulletRadius * 2 + bulletTextGap + columnPadding, y);
  }
  doc.save("woordzoeker.pdf");

  if (wasVisible) toggleSolution();
});
