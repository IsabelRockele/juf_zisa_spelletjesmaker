const helpTexts = {
  algemeen: `
    <p>Welkom in de testversie van de module voor huistaken.</p>
    <p>Je werkt hier alleen met datums. Elke kolom is een registratiemoment waarop huistaken gecontroleerd of afgegeven worden.</p>
  `,
  instellingen: `
    <p>Hier vul je schoolnaam, klasnaam, titel en schoollogo in.</p>
    <p>Het schoollogo komt onderaan in de PDF, gecentreerd in de voettekst.</p>
  `,
  klaslijst: `
    <p>Hier geef je je klaslijst in.</p>
    <p>Je kan leerlingen één per één toevoegen of een volledige lijst plakken.</p>
    <p>Met het pennetje pas je een naam aan. Met het rode kruisje verwijder je een leerling.</p>
  `,
  rapportperiodes: `
    <p>Hier maak je je rapportperiodes aan met naam, startdatum en einddatum.</p>
    <p>Bij bewerken krijg je alles samen in één popupvenster.</p>
  `,
  registratie: `
    <p>Hier werk je alleen met datums.</p>
    <p>Je voegt gewoon een registratiedag toe. Of dat nu één keer per week is of vier keer per week, maakt niet uit.</p>
  `
};

const STATUSSEN = [
  "op tijd",
  "te laat",
  "niet in orde",
  "onvolledig",
  "afwezig"
];

const STATUS_COLORS = {
  "op tijd": [217, 243, 228],
  "te laat": [255, 231, 209],
  "niet in orde": [248, 215, 218],
  "onvolledig": [255, 244, 201],
  "afwezig": [220, 236, 255]
};

const state = {
  currentView: "dashboard",
  previousView: "dashboard",

  schoolName: "",
  className: "",
  pdfTitle: "Opvolging huistaken",
  schoolLogoDataUrl: "",
  extraOpvolgingDrempel: 4,

  reportPeriods: [
    {
      id: createId(),
      name: "Rapportperiode 1",
      start: "2025-09-01",
      end: "2025-12-22"
    }
  ],
  activePeriodId: null,

  leerlingen: [
    { id: createId(), name: "De Smet Natalie" },
    { id: createId(), name: "Janssens Emma" }
  ],

  columns: ["2025-10-10", "2025-10-17", "2025-10-24"],

  entries: {},
  editingPeriodId: null
};

state.activePeriodId = state.reportPeriods[0].id;

// ----------------------
// Helpers
// ----------------------

function createId() {
  return "id-" + Math.random().toString(36).slice(2, 10);
}

function slugStatus(status) {
  return status.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  const [y, m, d] = dateValue.split("-");
  return `${d}/${m}/${y}`;
}

function getActivePeriod() {
  return (
    state.reportPeriods.find((periode) => periode.id === state.activePeriodId) ||
    state.reportPeriods[0] ||
    null
  );
}

function getCellKey(studentId, columnValue) {
  return `${state.activePeriodId}__${studentId}__${columnValue}`;
}

function getCellData(studentId, columnValue) {
  const key = getCellKey(studentId, columnValue);
  return state.entries[key] || { status: "op tijd", comment: "" };
}

function setCellData(studentId, columnValue, data) {
  const key = getCellKey(studentId, columnValue);
  state.entries[key] = data;
}

function sorteerLeerlingen() {
  state.leerlingen.sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensureJsPdf() {
  if (!window.jspdf?.jsPDF) {
    alert("jsPDF is niet geladen.");
    return false;
  }
  return true;
}

function statusDisplayOrder() {
  return ["op tijd", "te laat", "niet in orde", "onvolledig", "afwezig"];
}

// ----------------------
// Navigatie
// ----------------------

function renderHeader() {
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");

  const titles = {
    dashboard: "Dashboard",
    instellingen: "Instellingen",
    klaslijst: "Klaslijst",
    rapportperiodes: "Rapportperiodes",
    registratie: "Registratie"
  };

  const subtitles = {
    dashboard: "Basisstructuur om verder op te bouwen.",
    instellingen: "Hier stel je schoolnaam, klasnaam, titel en logo in.",
    klaslijst: "Hier beheer je je klaslijst.",
    rapportperiodes: "Hier maak je je rapportperiodes aan.",
    registratie: "Hier werk je met datums als registratiemomenten."
  };

  if (pageTitle) pageTitle.textContent = titles[state.currentView] || "Dashboard";
  if (pageSubtitle) pageSubtitle.textContent = subtitles[state.currentView] || "";
}

function switchView(targetView) {
  if (targetView !== state.currentView) {
    state.previousView = state.currentView;
    state.currentView = targetView;
  }

  document.querySelectorAll(".menu-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === targetView);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${targetView}`);
  });

  renderHeader();

  if (targetView === "klaslijst") renderKlaslijst();
  if (targetView === "rapportperiodes") renderRapportperiodes();
  if (targetView === "registratie") renderRegistratie();
}

function setupMenu() {
  document.querySelectorAll(".menu-btn").forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.view);
    });
  });

  document.getElementById("backBtn")?.addEventListener("click", () => {
    switchView(state.previousView || "dashboard");
  });
}

// ----------------------
// Help modal
// ----------------------

function setupHelpModal() {
  const modal = document.getElementById("helpModal");
  const title = document.getElementById("helpTitle");
  const body = document.getElementById("helpBody");

  document.querySelectorAll("[data-help]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.help;
      if (title) title.textContent = "Uitleg";
      if (body) body.innerHTML = helpTexts[key] || "<p>Er is nog geen uitleg voorzien voor dit onderdeel.</p>";
      if (modal) modal.hidden = false;
    });
  });

  document.querySelectorAll("[data-close-help]").forEach((button) => {
    button.addEventListener("click", () => {
      if (modal) modal.hidden = true;
    });
  });
}

// ----------------------
// Instellingen
// ----------------------

function renderLogoPreview() {
  const img = document.getElementById("logoPreview");
  const placeholder = document.getElementById("logoPreviewPlaceholder");

  if (!img || !placeholder) return;

  if (state.schoolLogoDataUrl) {
    img.src = state.schoolLogoDataUrl;
    img.classList.add("has-logo");
    placeholder.style.display = "none";
  } else {
    img.removeAttribute("src");
    img.classList.remove("has-logo");
    placeholder.style.display = "block";
  }
}

function setupInstellingen() {
  const schoolNameInput = document.getElementById("schoolNameInput");
  const classNameInput = document.getElementById("classNameInput");
  const pdfTitleInput = document.getElementById("pdfTitleInput");
  const registratieTitelInput = document.getElementById("registratieTitelInput");
  const schoolLogoInput = document.getElementById("schoolLogoInput");
  const extraOpvolgingDrempelInput = document.getElementById("extraOpvolgingDrempelInput");

  if (schoolNameInput) {
    schoolNameInput.value = state.schoolName;
    schoolNameInput.addEventListener("input", () => {
      state.schoolName = schoolNameInput.value.trim();
    });
  }

  if (classNameInput) {
    classNameInput.value = state.className;
    classNameInput.addEventListener("input", () => {
      state.className = classNameInput.value.trim();
      if (state.currentView === "registratie") renderRegistratie();
    });
  }

  if (pdfTitleInput) {
    pdfTitleInput.value = state.pdfTitle;
    pdfTitleInput.addEventListener("input", () => {
      state.pdfTitle = pdfTitleInput.value.trim() || "Opvolging huistaken";
      if (registratieTitelInput) registratieTitelInput.value = state.pdfTitle;
    });
  }

  if (registratieTitelInput) {
    registratieTitelInput.value = state.pdfTitle;
    registratieTitelInput.addEventListener("input", () => {
      state.pdfTitle = registratieTitelInput.value.trim() || "Opvolging huistaken";
      if (pdfTitleInput) pdfTitleInput.value = state.pdfTitle;
    });
  }

  if (extraOpvolgingDrempelInput) {
    extraOpvolgingDrempelInput.value = state.extraOpvolgingDrempel;
    extraOpvolgingDrempelInput.addEventListener("input", () => {
      const waarde = parseInt(extraOpvolgingDrempelInput.value, 10);
      state.extraOpvolgingDrempel = !isNaN(waarde) && waarde > 0 ? waarde : 4;
    });
  }

  if (schoolLogoInput) {
    schoolLogoInput.addEventListener("change", () => {
      const file = schoolLogoInput.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        state.schoolLogoDataUrl = reader.result;
        renderLogoPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  renderLogoPreview();
}

// ----------------------
// Klaslijst
// ----------------------

function renderKlaslijst() {
  const lijst = document.getElementById("klaslijst");
  if (!lijst) return;

  sorteerLeerlingen();

  if (state.leerlingen.length === 0) {
    lijst.innerHTML = `<li class="leerling-empty">Nog geen leerlingen toegevoegd.</li>`;
    return;
  }

  lijst.innerHTML = state.leerlingen
    .map(
      (leerling) => `
      <li class="leerling-item">
        <span class="leerling-naam">${escapeHtml(leerling.name)}</span>
        <div class="leerling-acties">
          <button type="button" class="actie-btn actie-bewerk" data-student-id="${leerling.id}" title="Naam aanpassen">✏️</button>
          <button type="button" class="actie-btn actie-verwijder" data-student-id="${leerling.id}" title="Verwijderen">❌</button>
        </div>
      </li>
    `
    )
    .join("");

  lijst.querySelectorAll(".actie-bewerk").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.studentId;
      const leerling = state.leerlingen.find((item) => item.id === id);
      if (!leerling) return;

      const nieuweNaam = prompt("Pas de naam aan:", leerling.name);
      if (!nieuweNaam) return;

      leerling.name = nieuweNaam.trim();
      renderKlaslijst();
      if (state.currentView === "registratie") renderRegistratie();
    });
  });

  lijst.querySelectorAll(".actie-verwijder").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.studentId;
      state.leerlingen = state.leerlingen.filter((item) => item.id !== id);
      renderKlaslijst();
      if (state.currentView === "registratie") renderRegistratie();
    });
  });
}

function setupKlaslijst() {
  const input = document.getElementById("leerlingInput");
  const addBtn = document.getElementById("addLeerlingBtn");
  const plakBtn = document.getElementById("plakLijstBtn");

  addBtn?.addEventListener("click", () => {
    const naam = input?.value.trim();
    if (!naam) {
      alert("Typ eerst een naam in.");
      return;
    }

    const bestaatAl = state.leerlingen.some((leerling) => leerling.name.toLowerCase() === naam.toLowerCase());
    if (!bestaatAl) {
      state.leerlingen.push({ id: createId(), name: naam });
    }

    if (input) input.value = "";
    renderKlaslijst();
    if (state.currentView === "registratie") renderRegistratie();
  });

  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addBtn?.click();
    }
  });

  plakBtn?.addEventListener("click", () => {
    const tekst = prompt(
`Plak hier je klaslijst.
Zet elke leerling op een nieuwe regel.

Voorbeeld:
Peeters Jan
Janssens Emma
De Smet Noor`
    );

    if (!tekst) return;

    const namen = tekst
      .split("\n")
      .map((naam) => naam.trim())
      .filter((naam) => naam !== "");

    namen.forEach((naam) => {
      const bestaatAl = state.leerlingen.some((leerling) => leerling.name.toLowerCase() === naam.toLowerCase());
      if (!bestaatAl) {
        state.leerlingen.push({ id: createId(), name: naam });
      }
    });

    renderKlaslijst();
    if (state.currentView === "registratie") renderRegistratie();
  });

  renderKlaslijst();
}

// ----------------------
// Rapportperiodes
// ----------------------

function renderRapportperiodes() {
  const container = document.getElementById("periodesLijst");
  const registratiePeriodeSelect = document.getElementById("registratiePeriodeSelect");

  if (!container) return;

  if (state.reportPeriods.length === 0) {
    container.innerHTML = `<div class="leerling-empty">Nog geen rapportperiodes toegevoegd.</div>`;
    if (registratiePeriodeSelect) registratiePeriodeSelect.innerHTML = "";
    return;
  }

  container.innerHTML = state.reportPeriods
    .map(
      (periode) => `
      <div class="period-item">
        <div>
          <strong>${escapeHtml(periode.name)}</strong>
          <div class="period-meta">${periode.start ? formatDate(periode.start) : "Geen startdatum"} — ${periode.end ? formatDate(periode.end) : "Geen einddatum"}</div>
        </div>
        <div>${periode.start ? formatDate(periode.start) : "-"}</div>
        <div>${periode.end ? formatDate(periode.end) : "-"}</div>
        <div class="leerling-acties">
          <button type="button" class="actie-btn actie-bewerk" data-period-id="${periode.id}" title="Bewerken">✏️</button>
          <button type="button" class="actie-btn actie-verwijder" data-period-id="${periode.id}" title="Verwijderen">❌</button>
        </div>
      </div>
    `
    )
    .join("");

  if (registratiePeriodeSelect) {
    registratiePeriodeSelect.innerHTML = state.reportPeriods
      .map(
        (periode) => `
        <option value="${periode.id}" ${periode.id === state.activePeriodId ? "selected" : ""}>
          ${escapeHtml(periode.name)}
        </option>
      `
      )
      .join("");
  }

  container.querySelectorAll(".actie-bewerk").forEach((button) => {
    button.addEventListener("click", () => {
      openPeriodeEditModal(button.dataset.periodId);
    });
  });

  container.querySelectorAll(".actie-verwijder").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.periodId;

      if (state.reportPeriods.length === 1) {
        alert("Je moet minstens één rapportperiode behouden.");
        return;
      }

      state.reportPeriods = state.reportPeriods.filter((item) => item.id !== id);

      if (state.activePeriodId === id) {
        state.activePeriodId = state.reportPeriods[0]?.id || "";
      }

      renderRapportperiodes();
      if (state.currentView === "registratie") renderRegistratie();
    });
  });

  if (registratiePeriodeSelect) {
    registratiePeriodeSelect.onchange = () => {
      state.activePeriodId = registratiePeriodeSelect.value;
      renderRegistratie();
    };
  }
}

function setupRapportperiodes() {
  const naamInput = document.getElementById("periodeNaamInput");
  const startInput = document.getElementById("periodeStartInput");
  const eindeInput = document.getElementById("periodeEindeInput");
  const addBtn = document.getElementById("addPeriodeBtn");

  addBtn?.addEventListener("click", () => {
    const naam = naamInput?.value.trim();
    const start = startInput?.value || "";
    const einde = eindeInput?.value || "";

    if (!naam) {
      alert("Geef eerst een naam voor de rapportperiode.");
      return;
    }

    state.reportPeriods.push({
      id: createId(),
      name: naam,
      start,
      end
    });

    state.activePeriodId = state.reportPeriods[state.reportPeriods.length - 1].id;

    if (naamInput) naamInput.value = "";
    if (startInput) startInput.value = "";
    if (eindeInput) eindeInput.value = "";

    renderRapportperiodes();
    renderRegistratie();
  });

  renderRapportperiodes();
}

function setupPeriodeEditModal() {
  const modal = document.getElementById("periodeEditModal");
  const closeButtons = document.querySelectorAll("[data-close-periode-edit]");
  const saveBtn = document.getElementById("savePeriodeEditBtn");

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (modal) modal.hidden = true;
      state.editingPeriodId = null;
    });
  });

  saveBtn?.addEventListener("click", () => {
    const naamInput = document.getElementById("editPeriodeNaamInput");
    const startInput = document.getElementById("editPeriodeStartInput");
    const eindeInput = document.getElementById("editPeriodeEindeInput");

    const periode = state.reportPeriods.find((item) => item.id === state.editingPeriodId);
    if (!periode) return;

    periode.name = naamInput?.value.trim() || periode.name;
    periode.start = startInput?.value || "";
    periode.end = eindeInput?.value || "";

    if (modal) modal.hidden = true;
    state.editingPeriodId = null;

    renderRapportperiodes();
    renderRegistratie();
  });
}

function openPeriodeEditModal(periodId) {
  const modal = document.getElementById("periodeEditModal");
  const naamInput = document.getElementById("editPeriodeNaamInput");
  const startInput = document.getElementById("editPeriodeStartInput");
  const eindeInput = document.getElementById("editPeriodeEindeInput");

  const periode = state.reportPeriods.find((item) => item.id === periodId);
  if (!periode || !modal) return;

  state.editingPeriodId = periodId;

  if (naamInput) naamInput.value = periode.name || "";
  if (startInput) startInput.value = periode.start || "";
  if (eindeInput) eindeInput.value = periode.end || "";

  modal.hidden = false;
}

// ----------------------
// Kolommen
// ----------------------

function addKolom(value) {
  if (!value) {
    alert("Kies eerst een datum.");
    return;
  }

  if (!state.columns.includes(value)) {
    state.columns.push(value);
    state.columns.sort();
  }

  renderRegistratie();
}

function removeKolom(value) {
  state.columns = state.columns.filter((item) => item !== value);
  renderRegistratie();
}

function setupKolomKnoppen() {
  const dagBtn = document.getElementById("addDagKolomBtn");
  const dagInput = document.getElementById("dagKolomDatumInput");

  dagBtn?.addEventListener("click", () => {
    addKolom(dagInput?.value || "");
  });
}

// ----------------------
// Registratie tabel
// ----------------------

function maakNaamCel(leerling) {
  return `
    <div class="name-cell">
      <div class="name-cell-main">
        <div><strong>${escapeHtml(leerling.name)}</strong></div>
        <div class="pdf-note">${escapeHtml(state.className || "Geen klasnaam ingevuld")}</div>
      </div>
      <div class="name-actions">
        <button type="button" class="ghost-btn leerling-pdf-btn" data-student-id="${leerling.id}">PDF leerling</button>
      </div>
    </div>
  `;
}

function maakKolomHeader(kolom) {
  return `
    <div class="column-top">${formatDate(kolom)}</div>
    <div class="column-sub">Registratiedag</div>
    <div class="name-actions" style="margin-top:8px;">
      <button type="button" class="ghost-btn kolom-verwijder-btn" data-kolom="${kolom}">Verwijderen</button>
    </div>
  `;
}

function renderRegistratie() {
  const thead = document.getElementById("registratieThead");
  const tbody = document.getElementById("registratieTbody");
  const periodeSelect = document.getElementById("registratiePeriodeSelect");
  const registratieTitelInput = document.getElementById("registratieTitelInput");

  if (!thead || !tbody) return;

  if (registratieTitelInput) {
    registratieTitelInput.value = state.pdfTitle;
    registratieTitelInput.oninput = () => {
      state.pdfTitle = registratieTitelInput.value.trim() || "Opvolging huistaken";
      const pdfTitleInput = document.getElementById("pdfTitleInput");
      if (pdfTitleInput) pdfTitleInput.value = state.pdfTitle;
    };
  }

  if (periodeSelect) {
    periodeSelect.innerHTML = state.reportPeriods
      .map(
        (periode) => `
        <option value="${periode.id}" ${periode.id === state.activePeriodId ? "selected" : ""}>
          ${escapeHtml(periode.name)}
        </option>
      `
      )
      .join("");

    periodeSelect.onchange = () => {
      state.activePeriodId = periodeSelect.value;
      renderRegistratie();
    };
  }

  thead.innerHTML = `
    <tr>
      <th>Leerling</th>
      ${state.columns.map((kolom) => `<th>${maakKolomHeader(kolom)}</th>`).join("")}
    </tr>
  `;

  sorteerLeerlingen();

  tbody.innerHTML = state.leerlingen
    .map((leerling) => {
      return `
        <tr>
          <td>${maakNaamCel(leerling)}</td>
          ${state.columns
            .map((kolom) => {
              const cell = getCellData(leerling.id, kolom);
              const statusClass = `status-${slugStatus(cell.status)}`;

              return `
                <td>
                  <div class="cell-stack">
                    <select
                      class="status-select ${statusClass}"
                      data-student-id="${leerling.id}"
                      data-kolom="${kolom}"
                    >
                      ${STATUSSEN.map(
                        (status) => `
                        <option value="${status}" ${cell.status === status ? "selected" : ""}>${status}</option>
                      `
                      ).join("")}
                    </select>

                    <textarea
                      data-student-id="${leerling.id}"
                      data-kolom="${kolom}"
                      placeholder="Opmerking..."
                    >${escapeHtml(cell.comment || "")}</textarea>
                  </div>
                </td>
              `;
            })
            .join("")}
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", () => {
      const studentId = select.dataset.studentId;
      const kolom = select.dataset.kolom;
      const bestaand = getCellData(studentId, kolom);

      setCellData(studentId, kolom, {
        ...bestaand,
        status: select.value
      });

      select.className = `status-select status-${slugStatus(select.value)}`;
    });
  });

  tbody.querySelectorAll("textarea").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const studentId = textarea.dataset.studentId;
      const kolom = textarea.dataset.kolom;
      const bestaand = getCellData(studentId, kolom);

      setCellData(studentId, kolom, {
        ...bestaand,
        comment: textarea.value
      });
    });
  });

  tbody.querySelectorAll(".leerling-pdf-btn").forEach((button) => {
    button.addEventListener("click", () => {
      genereerLeerlingPdf(button.dataset.studentId);
    });
  });

  thead.querySelectorAll(".kolom-verwijder-btn").forEach((button) => {
    button.addEventListener("click", () => {
      removeKolom(button.dataset.kolom);
    });
  });
}

// ----------------------
// PDF helpers
// ----------------------

function addPdfTitleBar(doc, title, subtitleLines = []) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(236, 243, 252);
  doc.roundedRect(18, 14, pageWidth - 36, 22, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 46, 88);
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, 28, { align: "center" });

  let y = 40;
  if (subtitleLines.length) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 106, 133);
    doc.setFontSize(11);

    subtitleLines.forEach((line) => {
      if (!line) return;
      doc.text(line, pageWidth / 2, y, { align: "center" });
      y += 6;
    });
  }

  return y;
}

function addInfoCard(doc, x, y, w, h, title) {
  doc.setFillColor(248, 251, 255);
  doc.roundedRect(x, y, w, h, 4, 4, "F");
  doc.setDrawColor(219, 230, 243);
  doc.roundedRect(x, y, w, h, 4, 4);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(32, 49, 77);
  doc.setFontSize(12);
  doc.text(title, x + 6, y + 8);
}

function addFooter(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 14;

  doc.setDrawColor(220, 228, 239);
  doc.line(20, footerY - 6, pageWidth - 20, footerY - 6);

  if (state.schoolLogoDataUrl) {
    try {
      const imgProps = doc.getImageProperties(state.schoolLogoDataUrl);
      const ratio = imgProps.width / imgProps.height;

      let drawW = 22;
      let drawH = drawW / ratio;

      if (drawH > 18) {
        drawH = 18;
        drawW = drawH * ratio;
      }

      const x = (pageWidth - drawW) / 2;
      const y = footerY - 12;

      doc.addImage(state.schoolLogoDataUrl, "PNG", x, y, drawW, drawH);
    } catch (e) {}
  }
}

function maakPieCanvas(counts) {
  const labels = statusDisplayOrder();
  const values = labels.map((label) => counts[label] || 0);
  const totaal = values.reduce((sum, value) => sum + value, 0) || 1;

  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");

  let startAngle = -Math.PI / 2;

  labels.forEach((label) => {
    const value = counts[label] || 0;
    if (value <= 0) return;

    const slice = (value / totaal) * Math.PI * 2;
    const [r, g, b] = STATUS_COLORS[label];

    ctx.beginPath();
    ctx.moveTo(120, 120);
    ctx.arc(120, 120, 82, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fill();

    startAngle += slice;
  });

  ctx.beginPath();
  ctx.arc(120, 120, 34, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  return canvas;
}

function berekenStatusTellingenVoorLeerling(studentId) {
  const counts = {
    "op tijd": 0,
    "te laat": 0,
    "niet in orde": 0,
    "onvolledig": 0,
    "afwezig": 0
  };

  const opmerkingenLijst = [];

  state.columns.forEach((kolom) => {
    const cell = getCellData(studentId, kolom);
    counts[cell.status] = (counts[cell.status] || 0) + 1;

    if (cell.comment && cell.comment.trim()) {
      opmerkingenLijst.push({
        datum: formatDate(kolom),
        status: cell.status,
        comment: cell.comment.trim()
      });
    }
  });

  return { counts, opmerkingenLijst };
}

function berekenStatusTellingenVoorKlas() {
  const counts = {
    "op tijd": 0,
    "te laat": 0,
    "niet in orde": 0,
    "onvolledig": 0,
    "afwezig": 0
  };

  const probleemPerLeerling = [];

  state.leerlingen.forEach((leerling) => {
    const detail = {
      "te laat": 0,
      "niet in orde": 0,
      "onvolledig": 0
    };

    state.columns.forEach((kolom) => {
      const cell = getCellData(leerling.id, kolom);
      counts[cell.status] = (counts[cell.status] || 0) + 1;

      if (detail[cell.status] !== undefined) {
        detail[cell.status] += 1;
      }
    });

    const totaalProblemen =
      detail["te laat"] + detail["niet in orde"] + detail["onvolledig"];

    probleemPerLeerling.push({
      naam: leerling.name,
      totaal: totaalProblemen,
      detail
    });
  });

  probleemPerLeerling.sort((a, b) => b.totaal - a.totaal);

  return {
    counts,
    probleemPerLeerling: probleemPerLeerling.filter(
      (item) => item.totaal >= state.extraOpvolgingDrempel
    )
  };
}

// ----------------------
// PDF's
// ----------------------

function genereerLeerlingPdf(studentId) {
  if (!ensureJsPdf()) return;

  const leerling = state.leerlingen.find((item) => item.id === studentId);
  if (!leerling) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const periode = getActivePeriod();
  const titel = state.pdfTitle || "Opvolging huistaken";
  const { counts, opmerkingenLijst } = berekenStatusTellingenVoorLeerling(studentId);
  const pieCanvas = maakPieCanvas(counts);

  const topY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
    `${leerling.name} — Klas: ${state.className || "-"}`,
    state.schoolName || ""
  ]);

  addInfoCard(doc, 18, topY + 4, 64, 66, "Overzicht");
  doc.addImage(pieCanvas.toDataURL("image/png"), "PNG", 29, topY + 16, 34, 34);

  addInfoCard(doc, 88, topY + 4, 104, 66, "Samenvatting");
  let y = topY + 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(32, 49, 77);

  statusDisplayOrder().forEach((status) => {
    doc.text(`${status}: ${counts[status] || 0} keer`, 96, y);
    y += 10;
  });

  addInfoCard(doc, 18, topY + 78, 174, 142, "Opmerkingen");
  y = topY + 92;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  if (opmerkingenLijst.length === 0) {
    doc.text("Geen opmerkingen genoteerd.", 26, y);
  } else {
    opmerkingenLijst.forEach((item) => {
      const statusTekst = `${item.datum} — ${item.status}`;
      const commentTekst = item.comment;

      if (y > 240) {
        addFooter(doc);
        doc.addPage();
        const vervolgY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
          `${leerling.name} — Klas: ${state.className || "-"}`,
          state.schoolName || ""
        ]);
        addInfoCard(doc, 18, vervolgY + 4, 174, 220, "Opmerkingen");
        y = vervolgY + 18;
      }

      doc.setFont("helvetica", "bold");
      doc.text(statusTekst, 26, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      const regels = doc.splitTextToSize(commentTekst, 154);
      doc.text(regels, 26, y);
      y += regels.length * 5 + 6;
    });
  }

  addFooter(doc);
  doc.save(`${leerling.name.replace(/\s+/g, "_")}_${(periode?.name || "periode").replace(/\s+/g, "_")}.pdf`);
}

function genereerAlleLeerlingenPdf() {
  if (!ensureJsPdf()) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const periode = getActivePeriod();
  const titel = state.pdfTitle || "Opvolging huistaken";

  state.leerlingen.forEach((leerling, index) => {
    if (index !== 0) doc.addPage();

    const { counts, opmerkingenLijst } = berekenStatusTellingenVoorLeerling(leerling.id);
    const pieCanvas = maakPieCanvas(counts);

    const topY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
      `${leerling.name} — Klas: ${state.className || "-"}`,
      state.schoolName || ""
    ]);

    addInfoCard(doc, 18, topY + 4, 64, 66, "Overzicht");
    doc.addImage(pieCanvas.toDataURL("image/png"), "PNG", 29, topY + 16, 34, 34);

    addInfoCard(doc, 88, topY + 4, 104, 66, "Samenvatting");
    let y = topY + 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(32, 49, 77);

    statusDisplayOrder().forEach((status) => {
      doc.text(`${status}: ${counts[status] || 0} keer`, 96, y);
      y += 10;
    });

    addInfoCard(doc, 18, topY + 78, 174, 142, "Opmerkingen");
    y = topY + 92;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    if (opmerkingenLijst.length === 0) {
      doc.text("Geen opmerkingen genoteerd.", 26, y);
    } else {
      opmerkingenLijst.forEach((item) => {
        const statusTekst = `${item.datum} — ${item.status}`;
        const commentTekst = item.comment;

        if (y > 240) {
          addFooter(doc);
          doc.addPage();
          const vervolgY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
            `${leerling.name} — Klas: ${state.className || "-"}`,
            state.schoolName || ""
          ]);
          addInfoCard(doc, 18, vervolgY + 4, 174, 220, "Opmerkingen");
          y = vervolgY + 18;
        }

        doc.setFont("helvetica", "bold");
        doc.text(statusTekst, 26, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        const regels = doc.splitTextToSize(commentTekst, 154);
        doc.text(regels, 26, y);
        y += regels.length * 5 + 6;
      });
    }

    addFooter(doc);
  });

  doc.save(`Alle_leerlingen_${(periode?.name || "periode").replace(/\s+/g, "_")}.pdf`);
}

function genereerKlasoverzichtPdf() {
  if (!ensureJsPdf()) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const periode = getActivePeriod();
  const titel = state.pdfTitle || "Opvolging huistaken";
  const { counts, probleemPerLeerling } = berekenStatusTellingenVoorKlas();
  const pieCanvas = maakPieCanvas(counts);

  const topY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
    `${state.className || "-"}`,
    state.schoolName || ""
  ]);

  addInfoCard(doc, 18, topY + 4, 64, 66, "Klasoverzicht");
  doc.addImage(pieCanvas.toDataURL("image/png"), "PNG", 29, topY + 16, 34, 34);

  addInfoCard(doc, 88, topY + 4, 104, 66, "Samenvatting");
  let y = topY + 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(32, 49, 77);

  statusDisplayOrder().forEach((status) => {
    doc.text(`${status}: ${counts[status] || 0}`, 96, y);
    y += 10;
  });

  addInfoCard(doc, 18, topY + 78, 174, 142, "Leerlingen die extra opvolging vragen");
  y = topY + 92;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  if (probleemPerLeerling.length === 0) {
    doc.text("Geen leerlingen boven de ingestelde drempel.", 26, y);
  } else {
    probleemPerLeerling.slice(0, 8).forEach((item, index) => {
      if (y > 240) {
        addFooter(doc);
        doc.addPage();
        const vervolgY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
          "Vervolg klasoverzicht",
          state.schoolName || ""
        ]);
        addInfoCard(doc, 18, vervolgY + 4, 174, 220, "Leerlingen die extra opvolging vragen");
        y = vervolgY + 18;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${item.naam}`, 26, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.text(`te laat: ${item.detail["te laat"]}`, 34, y);
      y += 5;
      doc.text(`onvolledig: ${item.detail["onvolledig"]}`, 34, y);
      y += 5;
      doc.text(`niet in orde: ${item.detail["niet in orde"]}`, 34, y);
      y += 9;
    });
  }

  addFooter(doc);
  doc.save(`Klasoverzicht_${(periode?.name || "periode").replace(/\s+/g, "_")}.pdf`);
}

function setupPdfKnoppen() {
  document.getElementById("pdfKlasBtn")?.addEventListener("click", () => {
    genereerKlasoverzichtPdf();
  });

  document.getElementById("pdfAlleLeerlingenBtn")?.addEventListener("click", () => {
    genereerAlleLeerlingenPdf();
  });
}

// ----------------------
// Init
// ----------------------

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupHelpModal();
  setupInstellingen();
  setupKlaslijst();
  setupRapportperiodes();
  setupPeriodeEditModal();
  setupKolomKnoppen();
  setupPdfKnoppen();

  switchView("dashboard");
});