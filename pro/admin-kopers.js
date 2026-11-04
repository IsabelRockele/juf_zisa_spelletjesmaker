export function setupBuyers(loadBuyers) {
  const element = id => document.getElementById("kopers" + id);
  const panel = element("");
  const search = element("-zoek");
  const filter = element("-filter");
  const active = element("-geldig");
  const order = element("-sortering");
  const refresh = element("-vernieuw");
  const copy = element("-kopieer");
  const status = element("-status");
  const rows = element("-rijen");
  const year = element("-jaar");
  const month = element("-maand");
  const formatDate = date => date ? new Date(date).toLocaleDateString("nl-BE") : "—";
  let buyers = [];
  let visible = [];

  function render() {
    const query = search.value.trim().toLowerCase();
    const now = Date.now();
    for (const [button, field, plan] of [[year, "yearEnd", "jaar"], [month, "monthEnd", "maand"]]) {
      const count = buyers.filter(buyer => buyer[field] > now).length;
      button.textContent = count === 1 ? `1 geldig ${plan}abonnement` : `${count} geldige ${plan}abonnementen`;
    }
    visible = buyers.filter(buyer => (!filter.value || buyer.labels.has(filter.value)) &&
      matchesPlan(buyer, active.value, now) &&
      `${buyer.name} ${buyer.email}`.toLowerCase().includes(query));
    const direction = order.value === "oldest" ? 1 : -1;
    const expiry = buyer => {
      if (active.value === "yearEnd" || active.value === "monthEnd") return buyer[active.value];
      if (filter.value === "reading") return buyer.readingEnd;
      return buyer.proEnd || buyer.readingEnd;
    };
    visible.sort((a, b) => {
      const aEnd = expiry(a);
      const bEnd = expiry(b);
      if (!aEnd || !bEnd) return Number(!aEnd) - Number(!bEnd);
      return direction * (aEnd - bEnd);
    });
    rows.replaceChildren();
    for (const buyer of visible) {
      const row = rows.insertRow();
      const contact = row.insertCell();
      const link = document.createElement("a");
      link.href = "mailto:" + encodeURIComponent(buyer.email);
      link.textContent = buyer.email;
      if (buyer.name) contact.append(buyer.name, document.createElement("br"));
      contact.append(link);
      row.insertCell().textContent = buyer.summary;
      row.insertCell().textContent = formatDate(buyer.proEnd);
      row.insertCell().textContent = formatDate(buyer.readingEnd);
      const history = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = `${buyer.purchases.length} aankopen`;
      const list = document.createElement("ul");
      for (const purchase of [...buyer.purchases].reverse()) {
        const item = document.createElement("li");
        item.textContent = [formatDate(purchase.date), purchase.product, purchase.number].filter(Boolean).join(" · ");
        list.append(item);
      }
      history.append(summary, list);
      row.insertCell().append(history);
    }
    copy.disabled = !visible.length;
    status.textContent = `${visible.length} van ${buyers.length} kopers`;
  }

  async function refreshBuyers() {
    if (refresh.disabled) return;
    refresh.disabled = search.disabled = filter.disabled = active.disabled = copy.disabled = year.disabled = month.disabled = true;
    status.textContent = "Kopers ophalen…";
    try {
      const { data } = await loadBuyers();
      buyers = data.buyers.map(describeBuyer).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "nl-BE"));
      render();
      year.disabled = month.disabled = false;
    } catch {
      buyers = [];
      render();
      status.textContent = "Het kopersoverzicht kon niet worden geladen. Controleer je beheerderstoegang of probeer opnieuw.";
    } finally {
      refresh.disabled = search.disabled = filter.disabled = active.disabled = false;
    }
  }

  const schools = document.getElementById("schoolabonnementen");
  const showBuyers = document.getElementById("toon-kopers");
  const showSchools = document.getElementById("toon-scholen");
  function showSection(buyersSelected) {
    panel.hidden = !buyersSelected;
    schools.hidden = buyersSelected;
    showBuyers.classList.toggle("active", buyersSelected);
    showSchools.classList.toggle("active", !buyersSelected);
    showBuyers.setAttribute("aria-pressed", String(buyersSelected));
    showSchools.setAttribute("aria-pressed", String(!buyersSelected));
    if (buyersSelected) refreshBuyers();
  }
  showBuyers.addEventListener("click", () => {
    history.replaceState(null, "", "#kopers");
    showSection(true);
  });
  showSchools.addEventListener("click", () => {
    history.replaceState(null, "", "#schoolabonnementen");
    showSection(false);
  });
  refresh.addEventListener("click", refreshBuyers);
  search.addEventListener("input", render);
  filter.addEventListener("change", () => {
    if (filter.value === "reading") active.value = "";
    render();
  });
  active.addEventListener("change", render);
  order.addEventListener("change", render);
  for (const [button, field] of [[year, "yearEnd"], [month, "monthEnd"]]) {
    button.addEventListener("click", () => {
      active.value = field;
      filter.value = search.value = "";
      render();
    });
  }
  copy.addEventListener("click", async () => {
    render();
    if (!visible.length) return;
    try {
      await navigator.clipboard.writeText(visible.map(buyer => buyer.email).join(", "));
      status.textContent = "E-mailadressen gekopieerd. Plak ze in het BCC-veld.";
    } catch {
      status.textContent = "Kopiëren is niet gelukt. Probeer opnieuw.";
    }
  });
  showSection(location.hash !== "#schoolabonnementen");
}

function matchesPlan(buyer, selection, now) {
  if (!selection) return true;
  if (selection === "yearEnd" || selection === "monthEnd") return buyer[selection] > now;
  const product = selection === "expiredYear" ? "Jaar" : "Maand";
  return buyer.proEnd <= now && buyer.purchases.some(purchase => purchase.product === product);
}

function describeBuyer(buyer) {
  buyer.purchases.sort((a, b) => a.date - b.date);
  const pro = buyer.purchases.filter(purchase => purchase.product !== "Zisa Lezen");
  const months = pro.filter(purchase => purchase.product === "Maand").length;
  const labels = new Set();
  const summary = [];
  if (buyer.purchases.length === 1) {
    labels.add("new");
    summary.push("Nieuwe koper");
  }
  if (pro.length) summary.push("Laatste Pro-aankoop: " + pro.at(-1).product);
  if (pro.some((purchase, index) => purchase.product === "Jaar" && pro[index - 1]?.product === "Jaar")) {
    labels.add("renewal");
    summary.push("Jaar verlengd");
  }
  if (months > 1) {
    labels.add("repeat");
    summary.push(`${months}× maand gekocht`);
  }
  if (pro.some((purchase, index) => purchase.product === "Jaar" && pro[index - 1]?.product === "Maand" &&
    pro[index - 1].date > 0 && pro[index - 1].date < purchase.date)) {
    labels.add("upgrade");
    summary.push("Van maand naar jaar");
  }
  if (buyer.purchases.length > pro.length) {
    labels.add("reading");
    summary.push("Zisa Lezen");
  }
  return { ...buyer, labels, summary: summary.join(" · ") };
}
