/* ==========================================================
   preview.js
   Toont gegenereerde bladen in het preview-paneel.
   Na rendering: schrijflijn-canvases tekenen.
   ========================================================== */

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
      });
    }
  }
};
