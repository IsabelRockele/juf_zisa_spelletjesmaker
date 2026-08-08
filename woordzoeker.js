const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Globale variabelen om de huidige puzzelstatus bij te houden
let currentPuzzleState = {};
let solutionVisible = false;
let activeExerciseMode = "";

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

function hexToRgba(hex, alpha) {
  const value = String(hex || "#f5c542").replace("#", "");
  const normalized = value.length === 3 ? value.split("").map(char => char + char).join("") : value;
  const number = Number.parseInt(normalized, 16);
  if (!Number.isFinite(number)) return `rgba(245, 197, 66, ${alpha})`;
  return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
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

function generateMessageWordSearch(words, message, gridSize, directions) {
  const possibleDirections = [];
  if (directions.horizontaal) possibleDirections.push({ dr: 0, dc: 1, name: "horizontaal" });
  if (directions.verticaal) possibleDirections.push({ dr: 1, dc: 0, name: "verticaal" });
  if (directions.diagonaal) {
    possibleDirections.push({ dr: 1, dc: 1, name: "diagonaal" });
    possibleDirections.push({ dr: -1, dc: 1, name: "diagonaal" });
  }
  if (!possibleDirections.length) return null;

  const ordered = words.map((word, index) => ({ word, index })).sort((a, b) => b.word.length - a.word.length);

  for (let attempt = 0; attempt < 7; attempt++) {
    const candidates = ordered.map(item => {
      const options = [];
      possibleDirections.forEach(direction => {
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const endRow = row + direction.dr * (item.word.length - 1);
            const endCol = col + direction.dc * (item.word.length - 1);
            if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) continue;
            const cells = [];
            for (let i = 0; i < item.word.length; i++) {
              const r = row + direction.dr * i;
              const c = col + direction.dc * i;
              cells.push({ row: r, col: c, key: r * gridSize + c });
            }
            options.push({ item, direction, cells, random: Math.random() });
          }
        }
      });
      return options;
    });

    const occupied = new Set();
    const used = new Set();
    const placed = [];
    const usedDirectionNames = new Set();
    let visits = 0;

    const isFree = option => option.cells.every(cell => !occupied.has(cell.key));

    function search() {
      visits++;
      if (visits > 160000) return false;
      if (used.size === ordered.length) return true;

      let options = null;
      let chosenIndex = -1;
      for (let index = 0; index < ordered.length; index++) {
        if (used.has(index)) continue;
        const freeOptions = candidates[index].filter(isFree);
        if (!freeOptions.length) return false;
        if (!options || freeOptions.length < options.length) {
          options = freeOptions;
          chosenIndex = index;
        }
      }

      options.sort((a, b) => {
        const aUsed = usedDirectionNames.has(a.direction.name) ? 1 : 0;
        const bUsed = usedDirectionNames.has(b.direction.name) ? 1 : 0;
        return aUsed - bUsed || a.random - b.random;
      });

      used.add(chosenIndex);
      for (const option of options) {
        option.cells.forEach(cell => occupied.add(cell.key));
        placed.push(option);
        const directionAlreadyUsed = usedDirectionNames.has(option.direction.name);
        usedDirectionNames.add(option.direction.name);
        if (search()) return true;
        placed.pop();
        option.cells.forEach(cell => occupied.delete(cell.key));
        if (!directionAlreadyUsed) usedDirectionNames.delete(option.direction.name);
      }
      used.delete(chosenIndex);
      return false;
    }

    if (!search()) continue;

    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(""));
    const wordLocations = [];
    placed.forEach(option => {
      option.cells.forEach((cell, index) => { grid[cell.row][cell.col] = option.item.word[index]; });
      wordLocations.push({
        word: option.item.word,
        row: option.cells[0].row,
        col: option.cells[0].col,
        dr: option.direction.dr,
        dc: option.direction.dc
      });
    });

    const messageCells = [];
    let messageIndex = 0;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (grid[row][col] !== "") continue;
        grid[row][col] = message[messageIndex++];
        messageCells.push({ row, col });
      }
    }
    if (messageIndex !== message.length) continue;
    return {
      grid,
      successfullyPlacedWords: words,
      unplacedWords: [],
      wordLocations,
      messageCells,
      usedDirections: [...usedDirectionNames]
    };
  }
  return null;
}

// ===== Tekenen =====
function drawPuzzle() {
  if (!currentPuzzleState.grid) return;

  const { grid, gridSize } = currentPuzzleState;
  const w = canvas.width / gridSize;
  const h = canvas.height / gridSize;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (solutionVisible && currentPuzzleState.mode === "message") {
    ctx.fillStyle = "rgba(103, 80, 164, 0.22)";
    (currentPuzzleState.messageCells || []).forEach(cell => {
      ctx.fillRect(cell.col * w, cell.row * h, w, h);
    });
  }

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
  updateMessageAnswerPreview();
}

function drawSolution() {
  const { wordLocations, gridSize } = currentPuzzleState;
  if (!wordLocations || wordLocations.length === 0) return;

  const w = canvas.width / gridSize;
  const h = canvas.height / gridSize;

  ctx.strokeStyle = hexToRgba(currentPuzzleState.solutionColor, 0.68);
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

function updateMessageAnswerPreview() {
  const area = document.getElementById("messageAnswerArea");
  const boxes = document.getElementById("messageLetterBoxes");
  if (!area || !boxes) return;
  if (currentPuzzleState.mode !== "message") {
    area.hidden = true;
    boxes.innerHTML = "";
    return;
  }
  area.hidden = false;
  boxes.innerHTML = "";
  const words = (currentPuzzleState.secretMessageDisplay || "")
    .split(/\s+/)
    .map(sanitizeWord)
    .filter(Boolean);
  words.forEach(word => {
    const wordGroup = document.createElement("span");
    wordGroup.className = "message-letter-word";
    [...word].forEach(letter => {
      const box = document.createElement("span");
      box.className = "message-letter-box";
      box.textContent = solutionVisible ? letter : "";
      wordGroup.appendChild(box);
    });
    boxes.appendChild(wordGroup);
  });
  const writingLine = area.querySelector(".message-writing-line i");
  if (writingLine) writingLine.textContent = solutionVisible ? currentPuzzleState.secretMessageDisplay : "";
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
  const selected = document.getElementById("taalMode").value;
  if (!selected) return "";
  if (selected === "single" || selected === "message") return selected;
  return document.querySelector('input[name="pairPuzzleSide"]:checked')?.value || "linksInPuzzel";
}

function updateModeExplanation() {
  const selectedMode = getSelectedExerciseMode();
  const explanation = document.getElementById("modeExplanation");
  if (!explanation) return;
  if (!selectedMode) {
    explanation.hidden = true;
    explanation.innerHTML = "";
    return;
  }
  explanation.hidden = false;
  if (selectedMode === "single") {
    explanation.innerHTML = "<b>Gewone woordzoeker:</b> de woorden die je invoert, worden in het rooster verstopt én staan onderaan in de zoeklijst.";
  } else if (selectedMode === "message") {
    explanation.innerHTML = "<b>Geheime boodschap:</b> na het wegstrepen van alle zoekwoorden vormen de overgebleven letters samen een woord of korte zin. De woordlengtes moeten exact bij het gekozen rooster passen.";
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

function resetPreviewForModeChange(nextMode) {
  currentPuzzleState = {};
  solutionVisible = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const list = document.getElementById("woordenLijst");
  if (list) list.innerHTML = "";
  const answerArea = document.getElementById("messageAnswerArea");
  if (answerArea) answerArea.hidden = true;
  const answerBoxes = document.getElementById("messageLetterBoxes");
  if (answerBoxes) answerBoxes.innerHTML = "";
  const preview = document.getElementById("worksheet-preview");
  if (preview) preview.classList.add("preview-empty");
  const emptyText = document.querySelector(".empty-message span");
  if (emptyText) {
    const texts = {
      single: "Vul minstens 6 woorden in en klik op ‘Maak mijn woordzoeker’.",
      pairs: "Vul minstens 6 volledige woordparen in en maak daarna het rooster.",
      message: "Vul zoekwoorden en een geheime boodschap in. Het programma helpt je om het aantal letters passend te maken."
    };
    emptyText.textContent = texts[nextMode] || "Kies links eerst wat je wilt maken.";
  }
  const solutionButton = document.getElementById("toonOplossingBtn");
  if (solutionButton) solutionButton.textContent = "Toon Oplossing";
  const message = document.getElementById("meldingContainer");
  if (message) message.innerHTML = "";
}

function updateModeUI() {
  const mode = document.getElementById("taalMode").value;
  if (activeExerciseMode && mode !== activeExerciseMode) resetPreviewForModeChange(mode);
  activeExerciseMode = mode;
  const singleGrp = document.getElementById("singleInputGroup");
  const pairGrp = document.getElementById("pairInputGroup");
  const messageGrp = document.getElementById("messageInputGroup");
  const instruction = document.getElementById("opdrachtzin");
  const ordinaryInstruction = "Zoek alle woorden in het letterrooster.";
  const messageInstruction = "Zoek alle woorden. Lees daarna de overgebleven letters per rij en noteer de boodschap.";
  if (instruction && mode === "message" && instruction.value === ordinaryInstruction) instruction.value = messageInstruction;
  if (instruction && mode && mode !== "message" && instruction.value === messageInstruction) instruction.value = ordinaryInstruction;
  if (instruction && mode) updateWorksheetText();
  if (!mode) {
    singleGrp.hidden = true;
    pairGrp.hidden = true;
    messageGrp.hidden = true;
  } else if (mode === "single") {
    singleGrp.hidden = false;
    pairGrp.hidden = true;
    messageGrp.hidden = true;
  } else if (mode === "message") {
    singleGrp.hidden = true;
    pairGrp.hidden = true;
    messageGrp.hidden = false;
  } else {
    singleGrp.hidden = true;
    pairGrp.hidden = false;
    messageGrp.hidden = true;
  }
  document.querySelectorAll(".puzzle-mode-tab").forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".workflow-dependent").forEach(element => {
    element.hidden = !mode;
  });
  const answerArea = document.getElementById("messageAnswerArea");
  if (answerArea && mode !== "message") answerArea.hidden = true;
  updateModeExplanation();
  if (mode === "message") updateMessageWordsVisibility();
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
  let secretMessage = "";
  let secretMessageDisplay = "";
  let meldingContainer = document.getElementById("meldingContainer");
  meldingContainer.innerHTML = "";
  meldingContainer.style.color = "#004080";

  const MIN_WORDS = 6, MAX_WORDS = 20, MAX_WORD_LENGTH = 12, MIN_GRID_SIZE_AUTO = 8;

  if (mode === "single" || mode === "message") {
    const woordenInput = document.getElementById(mode === "message" ? "messageWordsInput" : "woordenInput").value;
    let woorden = woordenInput
      .split("\n")
      .map(w => sanitizeWord(w.trim()))
      .filter(w => w.length > 0 && /^[A-Z]+$/.test(w));

    if (mode === "message") updateMessageWordCount(woorden.length);
    else updateWordCountMessageSingle(woorden.length);

    if (woorden.length < MIN_WORDS) {
      meldingContainer.style.color = "red";
      meldingContainer.innerHTML = `Voer minimaal ${MIN_WORDS} geldige woorden in. Voeg nog ${MIN_WORDS - woorden.length} woord(en) toe.`;
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

    if (mode === "message") {
      secretMessageDisplay = (document.getElementById("geheimeBoodschap").value || "").trim().replace(/\s+/g, " ").toUpperCase();
      secretMessage = sanitizeWord(secretMessageDisplay);
      if (!secretMessage) {
        meldingContainer.style.color = "red";
        meldingContainer.innerHTML = "Vul eerst een geheime boodschap in.";
        return;
      }
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
  if (mode !== "message" && [6, 8, 10].includes(selectedGridSize)) {
    let maxLen = Math.max(...puzzleWords.map(w => w.length));
    if (maxLen > selectedGridSize) {
      meldingContainer.style.color = "orange";
      meldingContainer.innerHTML += `Let op: Raster van ${selectedGridSize}×${selectedGridSize} is krap voor woorden langer dan ${selectedGridSize} letters.<br>`;
    }
  }
  if (mode === "message") {
    const wordLetterCount = puzzleWords.reduce((sum, word) => sum + word.length, 0);
    const neededCells = wordLetterCount + secretMessage.length;
    if (rasterFormaat === "auto") {
      const exactSize = Math.sqrt(neededCells);
      if (!Number.isInteger(exactSize) || exactSize < 6 || exactSize > 25) {
        const lower = Math.max(6, Math.floor(exactSize));
        const upper = Math.min(25, Math.max(6, Math.ceil(exactSize)));
        const lowerDiff = wordLetterCount - (lower * lower - secretMessage.length);
        const upperDiff = wordLetterCount - (upper * upper - secretMessage.length);
        const describeDifference = (size, difference) => difference < 0
          ? `Voor ${size}×${size} heb je ${Math.abs(difference)} woordletters te weinig: voeg woorden toe of maak woorden langer.`
          : `Voor ${size}×${size} heb je ${Math.abs(difference)} woordletters te veel: verwijder een woord of maak woorden korter.`;
        const advice = lower === upper
          ? describeDifference(lower, lowerDiff)
          : `${describeDifference(lower, lowerDiff)} ${describeDifference(upper, upperDiff)}`;
        document.getElementById("boodschapPasMelding").textContent = advice;
        document.getElementById("boodschapPasMelding").style.color = "#a65400";
        meldingContainer.style.color = "#a65400";
        meldingContainer.innerHTML = `De huidige woorden en boodschap vullen geen vierkant rooster exact. ${advice} Pas enkele woordlengtes aan.`;
        return;
      }
      gridSize = exactSize;
    } else {
      gridSize = selectedGridSize;
    }
    const targetWordLetters = gridSize * gridSize - secretMessage.length;
    const difference = wordLetterCount - targetWordLetters;
    const fitMessage = document.getElementById("boodschapPasMelding");
    if (difference !== 0) {
      fitMessage.textContent = difference < 0
        ? `${Math.abs(difference)} woordletters te weinig. Voeg woorden toe of maak woorden langer.`
        : `${Math.abs(difference)} woordletters te veel. Verwijder een woord of maak woorden korter.`;
      fitMessage.style.color = difference < 0 ? "#a65400" : "#b3261e";
      meldingContainer.style.color = difference < 0 ? "#a65400" : "#b3261e";
      meldingContainer.innerHTML = difference < 0
        ? `Je hebt <b>${Math.abs(difference)} woordletters te weinig</b>. Voeg één of meer woorden toe of vervang woorden door langere woorden.`
        : `Je hebt <b>${Math.abs(difference)} woordletters te veel</b>. Verwijder een woord of vervang woorden door kortere woorden.`;
      return;
    }
    fitMessage.textContent = `Exact passend: ${wordLetterCount} woordletters en ${secretMessage.length} boodschapletters vullen ${gridSize * gridSize} vakjes.`;
    fitMessage.style.color = "#24865b";
  } else if (rasterFormaat === "auto") {
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
  const result = mode === "message"
    ? generateMessageWordSearch(puzzleWords, secretMessage, gridSize, allowedDirections)
    : generateWordSearch(puzzleWords, gridSize, allowedDirections);

  if (!result) {
    meldingContainer.style.color = "#a65400";
    meldingContainer.innerHTML = "Het aantal letters past exact, maar er werd nog geen geldige plaatsing gevonden. Probeer opnieuw, pas één woord aan of kies andere toegestane richtingen.";
    return;
  }

  currentPuzzleState = {
    grid: result.grid,
    gridSize: gridSize,
    wordLocations: result.wordLocations,
    mode,
    messageCells: result.messageCells || [],
    secretMessage,
    secretMessageDisplay,
    solutionColor: document.getElementById("solutionColor").value,
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
  if (mode === "message" && result.usedDirections) {
    const allowed = Object.entries(allowedDirections).filter(([, enabled]) => enabled).map(([name]) => name);
    const unused = allowed.filter(name => !result.usedDirections.includes(name));
    meldingContainer.style.color = "#24865b";
    meldingContainer.innerHTML = `<b>Gelukt.</b> Gebruikte richtingen: ${result.usedDirections.join(", ")}.`;
    if (unused.length) meldingContainer.innerHTML += ` De toegestane richting ${unused.join(", ")} was voor deze geldige plaatsing niet nodig.`;
  }

  // Woordenlijst onderaan opbouwen
  const woordenLijstDiv = document.getElementById("woordenLijst");
  woordenLijstDiv.innerHTML = "";
  const ul = document.createElement("ul");
  ul.className = "kolommen";

  if (mode === "single" || mode === "message") {
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

function updateMessageWordCount(count) {
  const el = document.getElementById("messageWoordAantalMelding");
  if (!el) return;
  if (count < 6) {
    el.textContent = `Voeg nog ${6 - count} woord(en) toe. Je hebt er minimaal 6 nodig.`;
    el.style.color = "red";
  } else if (count > 20) {
    el.textContent = `Verwijder ${count - 20} woord(en). Er worden maximaal 20 woorden gebruikt.`;
    el.style.color = "orange";
  } else {
    el.textContent = `Aantal woorden: ${count} (OK)`;
    el.style.color = "#004080";
  }
}

function updateMessageWordsVisibility() {
  const group = document.getElementById("messageWordsGroup");
  if (!group) return;
  const hasMessage = sanitizeWord(document.getElementById("geheimeBoodschap").value).length > 0;
  group.hidden = !hasMessage;
  if (!hasMessage) return;
  const count = document.getElementById("messageWordsInput").value
    .split("\n")
    .map(value => sanitizeWord(value.trim()))
    .filter(Boolean).length;
  updateMessageWordCount(count);
  updateMessageFitPreview();
}

function updateMessageFitPreview() {
  const feedback = document.getElementById("boodschapPasMelding");
  if (!feedback || document.getElementById("taalMode").value !== "message") return;
  const words = document.getElementById("messageWordsInput").value
    .split("\n")
    .map(value => sanitizeWord(value).slice(0, 12))
    .filter(Boolean)
    .slice(0, 20);
  const message = sanitizeWord(document.getElementById("geheimeBoodschap").value);
  if (!words.length || !message.length) {
    feedback.textContent = "Vul woorden en een boodschap in om de passendheid te berekenen.";
    feedback.style.color = "#667b8c";
    return;
  }
  const wordLetters = words.reduce((sum, word) => sum + word.length, 0);
  const raster = document.getElementById("rasterFormaat").value;
  if (raster === "auto") {
    const size = Math.sqrt(wordLetters + message.length);
    if (Number.isInteger(size) && size >= 6 && size <= 25) {
      feedback.textContent = `Exact passend in een raster van ${size}×${size}.`;
      feedback.style.color = "#24865b";
    } else {
      const near = Math.max(6, Math.min(25, Math.round(size)));
      const difference = wordLetters - (near * near - message.length);
      feedback.textContent = difference < 0
        ? `Je hebt ${Math.abs(difference)} woordletters te weinig voor ${near}×${near}. Voeg woorden toe of maak woorden langer.`
        : `Je hebt ${Math.abs(difference)} woordletters te veel voor ${near}×${near}. Verwijder een woord of maak woorden korter.`;
      feedback.style.color = "#a65400";
    }
    return;
  }
  const size = Number.parseInt(raster, 10);
  const difference = wordLetters - (size * size - message.length);
  feedback.textContent = difference === 0
    ? `Exact passend: ${wordLetters} woordletters en ${message.length} boodschapletters.`
    : difference < 0
      ? `Je hebt ${Math.abs(difference)} woordletters te weinig. Voeg woorden toe of maak woorden langer.`
      : `Je hebt ${Math.abs(difference)} woordletters te veel. Verwijder een woord of maak woorden korter.`;
  feedback.style.color = difference === 0 ? "#24865b" : difference < 0 ? "#a65400" : "#b3261e";
}

// ===== Events =====
document.addEventListener("DOMContentLoaded", () => {
  for (let index = 0; index < 6; index++) addPairRow();
  updateModeUI();
  updateLijstTitel();
  updateWorksheetText();

  document.getElementById("genereerBtn").addEventListener("click", genereerWoordzoeker);
  document.getElementById("toonOplossingBtn").addEventListener("click", toggleSolution);
  document.getElementById("solutionColor").addEventListener("input", event => {
    if (!currentPuzzleState.grid) return;
    currentPuzzleState.solutionColor = event.target.value;
    if (solutionVisible) drawPuzzle();
  });

  document.getElementById("woordenInput").addEventListener("input", event => {
    const count = event.target.value.split("\n").map(value => sanitizeWord(value.trim())).filter(Boolean).length;
    updateWordCountMessageSingle(count);
    updateMessageFitPreview();
  });
  document.getElementById("messageWordsInput").addEventListener("input", event => {
    const count = event.target.value.split("\n").map(value => sanitizeWord(value.trim())).filter(Boolean).length;
    updateMessageWordCount(count);
    updateMessageFitPreview();
  });
  document.getElementById("geheimeBoodschap").addEventListener("input", updateMessageWordsVisibility);
  document.getElementById("rasterFormaat").addEventListener("change", updateMessageFitPreview);
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
  document.querySelectorAll(".puzzle-mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.getElementById("taalMode").value = tab.dataset.mode;
      updateModeUI();
    });
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
  const isMessageMode = currentPuzzleState.mode === "message";

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

  const pdfImgWidth = isMessageMode ? 120 : 132;
  const pdfImgHeight = isMessageMode ? 120 : 132;
  const xPosImg = (pageWidth - pdfImgWidth) / 2;
  const yPosImg = 50;
  doc.addImage(dataURL, "PNG", xPosImg, yPosImg, pdfImgWidth, pdfImgHeight);

  const woorden = Array.from(document.querySelectorAll("#woordenLijst li")).map(li => li.textContent);
  const listStartY = isMessageMode ? 184 : 198;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 79, 128);
  doc.text(`${getSelectedLijstTitel()}:`, 18, listStartY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.setTextColor(0, 0, 0);
  const itemsPerColumn = Math.max(1, Math.ceil(woorden.length / 3));
  const columnWidth = 58;
  const listRowHeight = isMessageMode ? 7 : 8;
  for (let i = 0; i < woorden.length; i++) {
    const colIndex = Math.floor(i / itemsPerColumn);
    const rowIndex = i % itemsPerColumn;
    const x = 18 + colIndex * columnWidth;
    const y = listStartY + 10 + rowIndex * listRowHeight;
    doc.circle(x + 2, y - 1.2, 1.8, "S");
    doc.text(woorden[i], x + 7, y);
  }

  if (isMessageMode) {
    const messageWords = (currentPuzzleState.secretMessageDisplay || "")
      .split(/\s+/)
      .map(sanitizeWord)
      .filter(Boolean);
    const boxSize = 7;
    const boxGap = 1;
    const wordGap = 4.5;
    const minX = 20;
    const maxX = 190;
    const boxRows = [];
    let row = [];
    let cursorX = minX;
    messageWords.forEach(word => {
      const wordWidth = word.length * boxSize + Math.max(0, word.length - 1) * boxGap;
      if (row.length && cursorX + wordWidth > maxX) {
        boxRows.push(row);
        row = [];
        cursorX = minX;
      }
      const letters = [...word].map(letter => {
        const item = { letter, x: cursorX };
        cursorX += boxSize + boxGap;
        return item;
      });
      row.push(...letters);
      cursorX += wordGap;
    });
    if (row.length) boxRows.push(row);

    const lastListY = listStartY + 10 + (itemsPerColumn - 1) * listRowHeight;
    const answerTop = Math.max(lastListY + 8, 229);
    const panelHeight = 27 + boxRows.length * 9;
    doc.setDrawColor(119, 174, 216);
    doc.setFillColor(242, 248, 253);
    doc.roundedRect(16, answerTop, 178, panelHeight, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 79, 128);
    doc.text("Overgebleven boodschap:", 20, answerTop + 7);

    boxRows.forEach((boxRow, rowIndex) => {
      const y = answerTop + 10 + rowIndex * 9;
      boxRow.forEach(item => {
        doc.setDrawColor(66, 91, 110);
        doc.setFillColor(255, 255, 255);
        doc.rect(item.x, y, boxSize, boxSize, "FD");
        if (withSolution) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(103, 80, 164);
          doc.text(item.letter, item.x + boxSize / 2, y + 5.2, { align: "center" });
        }
      });
    });

    const writingY = answerTop + 18 + boxRows.length * 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(38, 76, 104);
    doc.text("Schrijf de boodschap:", 20, writingY);
    doc.setDrawColor(38, 76, 104);
    doc.line(56, writingY + 0.8, 188, writingY + 0.8);
    if (withSolution) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(103, 80, 164);
      doc.text(currentPuzzleState.secretMessageDisplay, 58, writingY - 1);
    }
  }

  const prefix = isMessageMode ? "woordzoeker-geheime-boodschap" : "woordzoeker";
  doc.save(withSolution ? `${prefix}-oplossing.pdf` : `${prefix}-werkblad.pdf`);
  if (solutionVisible !== wasVisible) toggleSolution();
}

document.getElementById("downloadPdfBtn").addEventListener("click", () => createWorksheetPdf(false));
document.getElementById("downloadSolutionPdfBtn").addEventListener("click", () => createWorksheetPdf(true));
