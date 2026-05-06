/* ==========================================================
   preview.js
   Toont gegenereerde bladen in het preview-paneel.
   ========================================================== */

window.SpellingPreview = {

  ververs: function() {
    const opties = window.SpellingGenerator.leesOpties();
    const html = window.SpellingGenerator.genereerBundel(opties);
    document.querySelector("#preview").innerHTML = html;
  }
};
