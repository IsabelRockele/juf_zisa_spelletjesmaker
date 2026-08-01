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
    custom.hidden = sel.value !== "custom";
  }
}
function getSelectedExerciseMode() {
  if (document.getElementById("taalMode").value === "single") return "single";
  return document.querySelector('input[name="pairPuzzleSide"]:checked')?.value || "linksInPuzzel";
}

function updateModeExplanation() {
  const selectedMode = getSelectedExerciseMode();
  const explanation = document.getElementById("modeExplanation");
  if (!explanation) return;
  if (selectedMode === "single") {
    explanation.innerHTML = "<b>Gewone woordzoeker:</b> de woorden die je invoert, worden in het rooster verstopt én staan onderaan in de zoeklijst.";
  } else if (selectedMode === "linksInPuzzel") {
    explanation.innerHTML = "<b>Voorbeeld:</b> woord <strong>maison</strong> + vertaling <strong>huis</strong>.<br><strong>MAISON</strong> wordt verstopt in het rooster. <strong>huis</strong> staat onderaan als hint.";
  } else {
    explanation.innerHTML = "<b>Voorbeeld:</b> woord <strong>maison</strong> + vertaling <strong>huis</strong>.<br><strong>HUIS</strong> wordt verstopt in het rooster. <strong>maison</strong> staat onderaan als hint.";
  }
}

function readPairInputs() {
  return [...document.querySelectorAll(".pair-row")].map(row => {
    const left = row.querySelector(".pair-word-input").value.trim();
    const right = row.querySelector(".pair-hint-input").value.trim();
    return [left, right];
  }).filter(([left, right]) => left && right);
}

function addPairRow() {
  const container = document.getElementById("pairRowsContainer");
  if (!container || container.children.length >= 20) return;
  const examples = [
    ["bv. maison", "bv. huis"], ["bv. bonjour", "bv. goedendag"],
    ["bv. école", "bv. school"], ["Typ een woord", "Typ de bijbehorende hint"],
    ["Typ een woord", "Typ de bijbehorende hint"], ["Typ een woord", "Typ de bijbehorende hint"]
  ];
  const index = container.children.length;
  const [wordExample, hintExample] = examples[index] || ["Typ een woord", "Typ de bijbehorende hint"];
  const row = document.createElement("div");
  row.className = "pair-row";
  row.innerHTML = `<span class="pair-number">${index + 1}</span><input class="pair-word-input" type="text" maxlength="30" placeholder="${wordExample}" aria-label="Woord ${index + 1}"><input class="pair-hint-input" type="text" maxlength="55" placeholder="${hintExample}" aria-label="Omschrijving of vertaling ${index + 1}">${index >= 6 ? '<button type="button" class="remove-pair-row" aria-label="Verwijder dit woordpaar">×</button>' : '<span class="pair-row-spacer"></span>'}`;
  container.appendChild(row);
  document.getElementById("addPairRowBtn").disabled = container.children.length >= 20;
}

function updateModeUI() {
  const mode = document.getElementById("taalMode").value;
  const singleGrp = document.getElementById("singleInputGroup");
  const pairGrp = document.getElementById("pairInputGroup");
  if (mode === "single") {
    singleGrp.hidden = false;
    pairGrp.hidden = true;
  } else {
    singleGrp.hidden = true;
    pairGrp.hidden = false;
  }
  updateModeExplanation();
}

function updateWorksheetText() {
  const title = (document.getElementById("werkbladTitel")?.value || "").trim() || "Woordzoeker";
  const instruction = (document.getElementById("opdrachtzin")?.value || "").trim() || "Zoek alle woorden in het letterrooster.";
  document.getElementById("previewTitel").textContent = title;
  document.getElementById("previewOpdracht").textContent = instruction;
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
  const mode = getSelectedExerciseMode();

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
    let pairs = readPairInputs();

    updatePairCountMessage(pairs.length);

    if (pairs.length < MIN_WORDS) {
      meldingContainer.style.color = "red";
      meldingContainer.innerHTML = `Vul minimaal ${MIN_WORDS} volledige rijen in: links een woord en rechts de bijbehorende omschrijving of vertaling.`;
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
    wordLocations: result.wordLocations,
    title: (document.getElementById("werkbladTitel").value || "Woordzoeker").trim() || "Woordzoeker",
    instruction: (document.getElementById("opdrachtzin").value || "Zoek alle woorden in het letterrooster.").trim() || "Zoek alle woorden in het letterrooster."
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
  updateWorksheetText();
  document.getElementById("worksheet-preview").classList.remove("preview-empty");
}

// ===== Events =====
document.addEventListener("DOMContentLoaded", () => {
  for (let index = 0; index < 6; index++) addPairRow();
  updateModeUI();
  updateLijstTitel();
  updateWorksheetText();

  document.getElementById("genereerBtn").addEventListener("click", genereerWoordzoeker);
  document.getElementById("toonOplossingBtn").addEventListener("click", toggleSolution);

  document.getElementById("woordenInput").addEventListener("input", event => {
    const count = event.target.value.split("\n").map(value => sanitizeWord(value.trim())).filter(Boolean).length;
    updateWordCountMessageSingle(count);
  });
  document.getElementById("pairRowsContainer").addEventListener("input", () => updatePairCountMessage(readPairInputs().length));
  document.getElementById("pairRowsContainer").addEventListener("click", event => {
    const removeButton = event.target.closest(".remove-pair-row");
    if (!removeButton) return;
    removeButton.closest(".pair-row").remove();
    [...document.querySelectorAll(".pair-row")].forEach((row, index) => {
      row.querySelector(".pair-number").textContent = index + 1;
    });
    document.getElementById("addPairRowBtn").disabled = false;
    updatePairCountMessage(readPairInputs().length);
  });
  document.getElementById("addPairRowBtn").addEventListener("click", addPairRow);
  document.getElementById("werkbladTitel").addEventListener("input", updateWorksheetText);
  document.getElementById("opdrachtzin").addEventListener("input", updateWorksheetText);

  document.getElementById("taalMode").addEventListener("change", () => {
    updateModeUI();
  });
  document.querySelectorAll('input[name="pairPuzzleSide"]').forEach(radio => {
    radio.addEventListener("change", updateModeExplanation);
  });
  const sel = document.getElementById("lijstTitelType");
  const custom = document.getElementById("customLijstTitel");
  if (sel) sel.addEventListener("change", updateLijstTitel);
  if (custom) custom.addEventListener("input", updateLijstTitel);
});

// ===== Downloads =====
function hasPuzzle() {
  if (currentPuzzleState.grid) return true;
  const message = document.getElementById("meldingContainer");
  message.style.color = "#9b2c2c";
  message.textContent = "Maak eerst een woordzoeker voordat je een bestand downloadt.";
  return false;
}

document.getElementById("downloadPngBtn").addEventListener("click", () => {
  if (!hasPuzzle()) return;
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

function createWorksheetPdf(withSolution) {
  if (!hasPuzzle()) return;
  const wasVisible = solutionVisible;
  if (solutionVisible !== withSolution) toggleSolution();
  const dataURL = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = (document.getElementById("werkbladTitel")?.value || "").trim() || "Woordzoeker";
  const instruction = (document.getElementById("opdrachtzin")?.value || "").trim() || "Zoek alle woorden in het letterrooster.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(25, 42, 55);
  doc.text("Naam:", 16, 15);
  doc.line(29, 15.5, 88, 15.5);
  doc.text("Datum:", 121, 15);
  doc.line(136, 15.5, 194, 15.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 79, 128);
  doc.text(withSolution ? `${title} — oplossing` : title, pageWidth / 2, 27, { align: "center" });
  doc.setDrawColor(119, 174, 216);
  doc.setFillColor(242, 248, 253);
  doc.roundedRect(16, 33, 178, 12, 2, 2, "FD");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(38, 76, 104);
  const instructionLines = doc.splitTextToSize(instruction, 168);
  doc.text(instructionLines, 21, 40.5);

  const pdfImgWidth = 132;
  const pdfImgHeight = 132;
  const xPosImg = (pageWidth - pdfImgWidth) / 2;
  const yPosImg = 50;
  doc.addImage(dataURL, "PNG", xPosImg, yPosImg, pdfImgWidth, pdfImgHeight);

  const woorden = Array.from(document.querySelectorAll("#woordenLijst li")).map(li => li.textContent);
  const listStartY = 198;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 79, 128);
  doc.text(`${getSelectedLijstTitel()}:`, 18, listStartY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.setTextColor(0, 0, 0);
  const itemsPerColumn = Math.max(1, Math.ceil(woorden.length / 3));
  const columnWidth = 58;
  for (let i = 0; i < woorden.length; i++) {
    const colIndex = Math.floor(i / itemsPerColumn);
    const rowIndex = i % itemsPerColumn;
    const x = 18 + colIndex * columnWidth;
    const y = listStartY + 10 + rowIndex * 8;
    doc.circle(x + 2, y - 1.2, 1.8, "S");
    doc.text(woorden[i], x + 7, y);
  }
  doc.save(withSolution ? "woordzoeker-oplossing.pdf" : "woordzoeker-werkblad.pdf");
  if (solutionVisible !== wasVisible) toggleSolution();
}

document.getElementById("downloadPdfBtn").addEventListener("click", () => createWorksheetPdf(false));
document.getElementById("downloadSolutionPdfBtn").addEventListener("click", () => createWorksheetPdf(true));
