import { getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const LIMIT = 15;
const LABELS = { woorden: "Woordenbingo", getallen: "Getallenbingo", tafels: "Tafelbingo", rekenen: "Rekenbingo" };
const app = getApps().length ? getApp() : null;
const auth = app ? getAuth(app) : null;
const functions = app ? getFunctions(app, "europe-west1") : null;
const call = name => httpsCallable(functions, name);

let games = [];
let loaded = false;
let loading = false;
let activeFilter = "alles";

const openButton = document.getElementById("open-bingo-library");
const saveButton = document.getElementById("save-bingo-library");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function dateText(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" });
}

function updateCount(count = games.length) {
  if (openButton) openButton.textContent = `📚 Mijn bingospellen — ${count}/${LIMIT}`;
}

function errorText(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").replace(/^Firebase:\s*/i, "").replace(/\s*\([^)]*\)\.?$/, "");
  if (code.includes("resource-exhausted") || message.includes("BINGO_LIBRARY_FULL")) {
    return "Je bibliotheek is vol (15/15). Exporteer eventueel eerst een oud spel als JSON en verwijder dat spel daarna, of bewaar je huidige spel alleen als JSON.";
  }
  if (code.includes("unauthenticated")) return "Je bent niet meer aangemeld. Meld je opnieuw aan en probeer opnieuw.";
  if (code.includes("permission-denied")) return "Voor deze bibliotheek is een actief PRO-abonnement nodig.";
  if (code.includes("internal") || /^internal$/i.test(message)) {
    return "Het bingospel kon nu niet worden bewaard. Probeer het nog één keer. Blijft dit gebeuren, exporteer het spel dan voorlopig als JSON zodat je niets verliest.";
  }
  return message || "Dat lukte niet. Probeer het straks opnieuw.";
}

function notify(message) {
  window.alert(message);
}

function currentGame() {
  try { return JSON.parse(localStorage.getItem("bingoGameState") || "null"); } catch { return null; }
}

function gameType(data) {
  if (data?.isOefenSpel) return /^tafel/i.test(String(data.levelNaam || "")) ? "tafels" : "rekenen";
  return data?.isGetallenSpel ? "getallen" : "woorden";
}

function hasExactCards(data) {
  return Boolean(Array.isArray(data?.bingokaarten) && data.bingokaarten.length && data?.kaartConfiguratie);
}

function uniqueName(base) {
  const clean = String(base || "Bingospel").trim() || "Bingospel";
  const names = new Set(games.map(game => String(game.name).toLocaleLowerCase("nl")));
  if (!names.has(clean.toLocaleLowerCase("nl"))) return clean;
  let number = 2;
  while (names.has(`${clean} (${number})`.toLocaleLowerCase("nl"))) number++;
  return `${clean} (${number})`;
}

function downloadJson(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${String(name || "bingospel").replace(/[^a-z0-9\- _]/gi, "").trim().replace(/\s+/g, "-") || "bingospel"}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function askName(title, initialValue) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "bingo-name-overlay";
    overlay.innerHTML = `<div class="bingo-name-box" role="dialog" aria-modal="true">
      <h3>${escapeHtml(title)}</h3>
      <p>Geef een herkenbare naam, bijvoorbeeld <em>Woordenbingo herfst 3A</em>.</p>
      <input maxlength="90" value="${escapeHtml(initialValue)}" aria-label="Naam bingospel">
      <div class="bingo-name-actions"><button type="button" class="annuleren">Annuleren</button><button type="button" class="opslaan">Opslaan</button></div>
    </div>`;
    const input = overlay.querySelector("input");
    const close = value => { overlay.remove(); resolve(value); };
    overlay.querySelector(".annuleren").addEventListener("click", () => close(null));
    overlay.querySelector(".opslaan").addEventListener("click", () => close(input.value.trim() || null));
    overlay.addEventListener("click", event => { if (event.target === overlay) close(null); });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") close(input.value.trim() || null);
      if (event.key === "Escape") close(null);
    });
    document.body.appendChild(overlay);
    input.focus(); input.select();
  });
}

function overlayElement() {
  let overlay = document.getElementById("bingo-library-overlay");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.id = "bingo-library-overlay";
  overlay.className = "bingo-library-overlay verborgen";
  overlay.innerHTML = `<section class="bingo-library-panel" role="dialog" aria-modal="true" aria-labelledby="bingo-library-title">
    <div class="bingo-library-top"><div><h2 id="bingo-library-title">📚 Mijn bingospellen</h2><div class="bingo-library-count">0 van maximaal ${LIMIT} bewaard</div></div><button class="bingo-library-close" type="button" aria-label="Sluiten">×</button></div>
    <div class="bingo-library-tools"><input class="bingo-library-search" type="search" placeholder="Zoek op naam…"><button class="bingo-library-filter actief" data-filter="alles">Alles</button>${Object.entries(LABELS).map(([key,label]) => `<button class="bingo-library-filter" data-filter="${key}">${label}</button>`).join("")}</div>
    <div class="bingo-library-content"></div>
  </section>`;
  document.body.appendChild(overlay);
  overlay.querySelector(".bingo-library-close").addEventListener("click", () => overlay.classList.add("verborgen"));
  overlay.addEventListener("click", event => { if (event.target === overlay) overlay.classList.add("verborgen"); });
  overlay.querySelector(".bingo-library-search").addEventListener("input", render);
  overlay.querySelectorAll(".bingo-library-filter").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    overlay.querySelectorAll(".bingo-library-filter").forEach(item => item.classList.toggle("actief", item === button));
    render();
  }));
  overlay.querySelector(".bingo-library-content").addEventListener("click", handleAction);
  return overlay;
}

function render() {
  const overlay = overlayElement();
  const content = overlay.querySelector(".bingo-library-content");
  const search = overlay.querySelector(".bingo-library-search").value.trim().toLocaleLowerCase("nl");
  overlay.querySelector(".bingo-library-count").textContent = `${games.length} van maximaal ${LIMIT} bewaard`;
  updateCount();
  const visible = games.filter(game => (activeFilter === "alles" || game.type === activeFilter) && (!search || String(game.name).toLocaleLowerCase("nl").includes(search)));
  if (!visible.length) {
    content.innerHTML = `<div class="bingo-library-empty"><h3>${games.length ? "Geen spellen gevonden" : "Je bibliotheek is nog leeg"}</h3><p>${games.length ? "Pas je zoekopdracht of filter aan." : "Maak eerst bingokaarten en kies daarna ‘Bewaar in mijn bibliotheek’."}</p></div>`;
    return;
  }
  content.innerHTML = Object.entries(LABELS).map(([type,label]) => {
    const items = visible.filter(game => game.type === type);
    if (!items.length) return "";
    return `<section class="bingo-library-group"><h3>${label} (${items.length})</h3><div class="bingo-library-grid">${items.map(game => `<article class="bingo-library-card" data-id="${escapeHtml(game.id)}"><h4>${escapeHtml(game.name)}</h4><div class="bingo-library-meta">${escapeHtml(game.levelName || label)}<br>${game.cardCount || "?"} kaarten · ${game.cardSize ? `${game.cardSize} × ${game.cardSize}` : "formaat bewaard"}${game.updatedAt ? ` · ${dateText(game.updatedAt)}` : ""}</div><div class="bingo-library-actions"><button class="primair" data-action="play">▶ Open en speel</button><button data-action="cards">📄 Dezelfde kaarten</button><button data-action="copy">⧉ Kopieer</button><button data-action="export">⇩ JSON</button><button data-action="rename">✏ Naam</button><button class="gevaar" data-action="delete">🗑 Verwijder</button></div></article>`).join("")}</div></section>`;
  }).join("");
}

async function loadList(force = false) {
  if (!functions || (!force && loaded) || loading) return;
  loading = true;
  try {
    const response = await call("listBingoGames")({});
    games = Array.isArray(response.data?.games) ? response.data.games : [];
    loaded = true;
    render();
  } catch (error) {
    console.error("Bingo library list:", error);
    updateCount("…");
    const content = document.querySelector(".bingo-library-content");
    if (content) content.innerHTML = `<div class="bingo-library-empty"><h3>Bibliotheek kon niet laden</h3><p>${escapeHtml(errorText(error))}</p></div>`;
  } finally { loading = false; }
}

async function fetchGame(id) {
  const response = await call("getBingoGame")({ gameId: id });
  return response.data;
}

async function handleAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.closest(".bingo-library-card")?.dataset.id;
  const game = games.find(item => item.id === id);
  if (!game) return;
  button.disabled = true;
  try {
    if (button.dataset.action === "delete") {
      if (!confirm(`‘${game.name}’ verwijderen uit je bibliotheek? Exporteer het eerst als JSON als je het later nog wilt bewaren.`)) return;
      await call("deleteBingoGame")({ gameId: id });
      games = games.filter(item => item.id !== id); render(); return;
    }
    if (button.dataset.action === "rename") {
      const name = await askName("Naam wijzigen", game.name);
      if (!name) return;
      await call("renameBingoGame")({ gameId: id, name });
      game.name = name; render(); return;
    }
    const full = await fetchGame(id);
    if (button.dataset.action === "export") { downloadJson(full.gameData, full.name); return; }
    if (button.dataset.action === "copy") {
      const name = await askName("Kopie van het bingospel bewaren", uniqueName(`${game.name} kopie`));
      if (!name) return;
      await call("saveBingoGame")({ name, type: game.type, gameData: full.gameData });
      await loadList(true); return;
    }
    localStorage.setItem("bingoGameState", JSON.stringify(full.gameData));
    if (button.dataset.action === "play") location.href = "spel.html";
    if (button.dataset.action === "cards") {
      sessionStorage.setItem("bingoAutoRestore", "1");
      sessionStorage.setItem("bingoAutoAction", "cards");
      location.reload();
    }
  } catch (error) { console.error("Bingo library action:", error); notify(errorText(error)); }
  finally { button.disabled = false; }
}

async function saveCurrent() {
  const data = currentGame();
  if (!data) return notify("Kies eerst welk soort bingo je wilt maken.");
  if (!hasExactCards(data)) return notify("Maak eerst de bingokaarten. Ze openen in een apart venster. Sluit dat venster daarna en kies hier opnieuw ‘Bewaar in mijn bibliotheek’. Zo bewaren we exact dezelfde kaarten voor je leerlingen.");
  if (!loaded) await loadList(true);
  if (games.length >= LIMIT) return notify("Je bibliotheek is vol (15/15). Exporteer eventueel eerst een oud spel als JSON en verwijder dat spel daarna, of bewaar je huidige spel alleen als JSON.");
  const proposal = uniqueName(data.levelNaam || LABELS[gameType(data)]);
  const name = await askName("Bingospel bewaren", proposal);
  if (!name) return;
  saveButton.disabled = true;
  try {
    await call("saveBingoGame")({ name, type: gameType(data), gameData: data });
    await loadList(true);
    notify(`‘${name}’ is veilig bewaard in je bibliotheek.`);
  } catch (error) { console.error("Bingo library save:", error); notify(errorText(error)); }
  finally { saveButton.disabled = false; }
}

openButton?.addEventListener("click", async () => {
  overlayElement().classList.remove("verborgen");
  render();
  await loadList();
});
saveButton?.addEventListener("click", saveCurrent);
updateCount("…");

if (auth) onAuthStateChanged(auth, user => { if (user) loadList(); });
