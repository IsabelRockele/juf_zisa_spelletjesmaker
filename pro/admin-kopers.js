export function setupBuyers(loadBuyers) {
  const element = id => document.getElementById("kopers" + id);
  const panel = element("");
  const search = element("-zoek");
  const filter = element("-filter");
  const active = element("-geldig");
  const refresh = element("-vernieuw");
  const copy = element("-kopieer");
  const status = element("-status");
  const rows = element("-rijen");
  const formatDate = date => date ? new Date(date).toLocaleDateString("nl-BE") : "—";
  let buyers = [];
  let visible = [];

  function render() {
    const query = search.value.trim().toLowerCase();
    const now = Date.now();
    visible = buyers.filter(buyer => (!filter.value || buyer.labels.has(filter.value)) &&
      (!active.value || buyer[active.value] > now) &&
      `${buyer.name} ${buyer.email}`.toLowerCase().includes(query));
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
    refresh.disabled = search.disabled = filter.disabled = active.disabled = copy.disabled = true;
    status.textContent = "Kopers ophalen…";
    try {
      const { data } = await loadBuyers();
      buyers = data.buyers.map(describeBuyer).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "nl-BE"));
      render();
    } catch {
      buyers = [];
      render();
      status.textContent = "Het kopersoverzicht kon niet worden geladen. Controleer je beheerderstoegang of probeer opnieuw.";
    } finally {
      refresh.disabled = search.disabled = filter.disabled = active.disabled = false;
    }
  }

  panel.addEventListener("toggle", () => { if (panel.open) refreshBuyers(); });
  refresh.addEventListener("click", refreshBuyers);
  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  active.addEventListener("change", render);
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
  if (panel.open) refreshBuyers();
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
    if (!pro.length) labels.add("reading-only");
    summary.push(pro.length ? "Zisa Lezen apart" : "Alleen Zisa Lezen");
  }
  return { ...buyer, labels, summary: summary.join(" · ") };
}
