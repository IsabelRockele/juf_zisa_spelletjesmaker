/* Toon hetzelfde document als de download, op begrensde A4-pagina's. */
const PdfVoorbeeld = (() => {
  let versie = 0;
  let timer;
  let bibliotheek;
  function stop() { versie++; clearTimeout(timer); }
  async function laden() {
    if (!bibliotheek) {
      bibliotheek = import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs').then(pdfjs => {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
        return pdfjs;
      }).catch(error => { bibliotheek = null; throw error; });
    }
    return bibliotheek;
  }
  function toon(container, maakDocument) {
    stop();
    const huidigeVersie = versie;
    const heeftVoorbeeld = !!container.querySelector('.pdf-voorbeeld-pagina');
    container.setAttribute('aria-busy', 'true');
    if (!heeftVoorbeeld) container.innerHTML = '<p class="pdf-voorbeeld-status" role="status">A4-voorbeeld wordt opgebouwd…</p>';
    timer = setTimeout(async () => {
      let pdf;
      try {
        const pdfjs = await laden();
        if (huidigeVersie !== versie) return;
        const doc = await maakDocument();
        if (!doc || huidigeVersie !== versie) return;
        pdf = await pdfjs.getDocument({data:new Uint8Array(doc.output('arraybuffer')), isEvalSupported:false}).promise;
        if (huidigeVersie !== versie) return;
        // Render buiten beeld; het bestaande blad blijft tijdens het opbouwen staan.
        const nieuwePaginas = document.createDocumentFragment();
        for (let nummer = 1; nummer <= pdf.numPages; nummer++) {
          if (huidigeVersie !== versie) return;
          const pagina = await pdf.getPage(nummer);
          if (huidigeVersie !== versie) return;
          const vel = document.createElement('figure'); vel.className = 'pdf-voorbeeld-pagina';
          const label = document.createElement('figcaption'); label.textContent = `Pagina ${nummer} van ${pdf.numPages} · A4`;
          const canvas = document.createElement('canvas');
          canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `PDF-voorbeeld pagina ${nummer}`);
          const viewport = pagina.getViewport({scale:1.5});
          canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
          const papier = document.createElement('div'); papier.className = 'pdf-voorbeeld-papier';
          papier.append(canvas);
          for (const anker of doc.previewAnkers || []) {
            if (anker.pagina !== nummer) continue;
            const acties = document.createElement('div'); acties.className = 'pdf-opdracht-acties';
            acties.style.top = (anker.y / doc.internal.pageSize.getHeight() * 100) + '%';
            acties.style.height = (anker.hoogte / doc.internal.pageSize.getHeight() * 100) + '%';
            doc.maakBewerking(acties, anker.groepId); papier.append(acties);
          }
          vel.append(label, papier); nieuwePaginas.append(vel);
          await pagina.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
          pagina.cleanup();
        }
        if (huidigeVersie === versie) {
          const scroller = container.closest('#bundelPreview');
          const scrollTop = scroller.scrollTop, scrollLeft = scroller.scrollLeft;
          const actief = document.activeElement;
          const groep = container.contains(actief) ? actief.closest('[data-groep-id]')?.dataset.groepId : null;
          const actie = groep ? actief.getAttribute('aria-label') : null;
          container.replaceChildren(nieuwePaginas);
          scroller.scrollTop = scrollTop; scroller.scrollLeft = scrollLeft;
          if (groep && actie) {
            const vervanger = [...container.querySelectorAll('[data-groep-id] button[aria-label]')].find(b => b.closest('[data-groep-id]').dataset.groepId === groep && b.getAttribute('aria-label') === actie);
            vervanger?.focus({preventScroll:true});
          }
          container.removeAttribute('aria-busy');
          container.dataset.pdfPaginas = String(pdf.numPages);
          container.closest('#bundelPreview').dataset.pdfPaginas = String(pdf.numPages);
        }
      } catch (error) {
        if (huidigeVersie !== versie) return;
        console.error('PDF-voorbeeld kon niet worden opgebouwd:', error);
        container.removeAttribute('aria-busy');
        if (!heeftVoorbeeld) container.replaceChildren();
        container.querySelector('.pdf-voorbeeld-fout')?.remove();
        const fout = document.createElement('div'); fout.className = 'pdf-voorbeeld-fout'; fout.setAttribute('role','alert');
        fout.textContent = 'Het voorbeeld kon niet worden bijgewerkt. Je wijzigingen zijn bewaard. ';
        container.prepend(fout);
        const knop = document.createElement('button'); knop.className = 'toolbar-knop'; knop.textContent = 'Opnieuw proberen';
        knop.addEventListener('click', () => toon(container, maakDocument)); fout.append(knop);
      } finally { if (pdf) await pdf.destroy(); }
    }, 180);
  }
  return {toon, stop};
})();
