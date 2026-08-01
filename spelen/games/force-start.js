// Detecteer standalone modus EN of we lokaal werken
const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
const isLocal = location.protocol === 'file:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost';

// Alleen redirect als we NIET lokaal zijn
if (isStandalone && !isLocal) {
  // Wacht tot alles is geladen én localStorage en sessionStorage werken
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (!sessionStorage.getItem('zisa_session_started')) {
        sessionStorage.setItem('zisa_session_started', 'true');

        // Alleen redirect als je NIET op de startpagina zit
        if (!window.location.pathname.endsWith("start.html")) {
          console.log("⬅️ Terug naar start.html gestuurd door force-start.js");
          window.location.href = "start.html";
        }
      }
    }, 100); // korte vertraging van 100ms
  });
}


