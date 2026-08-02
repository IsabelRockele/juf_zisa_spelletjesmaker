/* ==========================================================
   preview.js
   Toont gegenereerde bladen in het preview-paneel.
   Na rendering: schrijflijn-canvases tekenen.
   ========================================================== */

window.SpellingPreviewSchaal = {
  pasAan: function(preview = document.querySelector("#preview")) {
    if (!preview) return;
    requestAnimationFrame(() => {
      const previewRect = preview.getBoundingClientRect();
      // Het grid kan door browserzoom intern breder zijn dan wat rechts nog
      // werkelijk zichtbaar is. Reken daarom met de viewportgrens, niet alleen
      // met clientWidth van het (mogelijk deels buiten beeld liggende) paneel.
      const zichtbaarTot = Math.min(previewRect.right, window.innerWidth);
      const zichtbareBreedte = Math.max(0, zichtbaarTot - previewRect.left);
      const beschikbareBreedte = Math.max(0, Math.min(preview.clientWidth, zichtbareBreedte) - 16);
      if (!beschikbareBreedte) return;

      const leeg = preview.querySelector(":scope > .preview-leeg");
      if (leeg) {
        const breedte = Math.min(720, beschikbareBreedte);
        leeg.style.width = `${breedte}px`;
        leeg.style.maxWidth = `${breedte}px`;
        leeg.style.marginLeft = `${Math.max(0, (beschikbareBreedte - breedte) / 2)}px`;
        leeg.style.marginRight = "0";
      }

      const wraps = [...preview.querySelectorAll(":scope > .bundel-item-wrap")];
      const doelen = wraps.length ? wraps : [...preview.querySelectorAll(":scope > .werkblad")];

      doelen.forEach(doel => {
        doel.style.zoom = "";
        doel.style.transform = "none";
        doel.style.transformOrigin = "top center";
        doel.style.height = "auto";
        doel.style.width = "";
        doel.style.marginLeft = "";
        doel.style.marginRight = "";

        const blad = doel.matches(".werkblad") ? doel : doel.querySelector(".werkblad");
        if (!blad) return;
        // scrollWidth vangt ook een oefening op die per ongeluk buiten A4 loopt.
        const volleBreedte = Math.max(blad.offsetWidth, blad.scrollWidth, doel.scrollWidth);
        const volleHoogte = doel.scrollHeight;
        // Een preview is bedoeld als pagina-overzicht, niet als weergave op
        // ware grootte. Beperk daarom ook op brede schermen tot 82%.
        // Dit laat ruimte voor browserzoom, scrollbalk en de bedieningsknoppen.
        // De PDF gebruikt deze previewzoom niet en blijft exact A4.
        const schaal = Math.min(0.82, beschikbareBreedte / volleBreedte);

        doel.style.width = `${volleBreedte}px`;
        doel.style.transform = `scale(${schaal})`;
        doel.style.transformOrigin = "top center";
        doel.style.height = `${volleHoogte * schaal}px`;
        doel.style.marginLeft = "auto";
        doel.style.marginRight = "auto";
      });
    });
  }
};

// Bij een smaller venster of een bredere zijbalk opnieuw passend maken.
if (window.ResizeObserver) {
  const previewSchaalObserver = new ResizeObserver(() => {
    window.SpellingPreviewSchaal.pasAan();
  });
  document.addEventListener("DOMContentLoaded", () => {
    const paneel = document.querySelector(".preview-paneel");
    if (paneel) previewSchaalObserver.observe(paneel);
  });
}

window.SpellingPreview = {

  ververs: function() {
    const opties = window.SpellingGenerator.leesOpties();
    const html = window.SpellingGenerator.genereerBundel(opties);
    const preview = document.querySelector("#preview");
    preview.innerHTML = html;

    // Teken alle schrijflijn-canvases (na DOM-insertion zodat layout-breedte bekend is)
    if (window.SpellingSchrijflijnen) {
      // requestAnimationFrame zorgt dat layout berekend is voor we tekenen
      requestAnimationFrame(() => {
        window.SpellingSchrijflijnen.tekenAlle(preview);
        window.SpellingPreviewSchaal?.pasAan(preview);
      });
    } else {
      window.SpellingPreviewSchaal?.pasAan(preview);
    }
  }
};
