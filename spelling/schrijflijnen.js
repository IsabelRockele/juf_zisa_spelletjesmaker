/* ==========================================================
   schrijflijnen.js
   Tekent de 5 schrijflijntypes uit Juf Zisa's schrijfgenerator
   op een canvas. Aanroepen via:

     SpellingSchrijflijnen.tekenCanvas(canvas, type, hoogte)

   Types:
   - "type1": klassiek hulp (top/bottom stippellijn, base vol)
   - "type2": standaard (alle 4 vol dun, lichtblauwe x-zone)
   - "type3": kleurgecodeerd (rood/groen/blauwe stippel) — voor jonge schrijvers
   - "type4": grijs-blauw (zachte tweekleur)
   - "type5": intens kleur (rood boven, groen onder, lichtblauwe zone)

   Hoogte: het verticale interval tussen lijnen (in pixels).
   - "klein": 7px tussen lijnen → totale hoogte 31px
   - "middel": 9px → totale hoogte 37px
   - "groot": 12px → totale hoogte 46px
   ========================================================== */

window.SpellingSchrijflijnen = {

  /* Geef hoogte (px tussen lijnen) voor elke voorinstelling */
  hoogteInPx: function(naam) {
    if (naam === "klein")  return 14;
    if (naam === "middel") return 20;
    if (naam === "groot")  return 28;  // verborgen optie maar API blijft werken
    return 20; // default middel
  },

  /* Bereken totale canvas-hoogte = top-marge + 3*regelafstand + bottom-marge */
  totaleHoogte: function(hoogte) {
    const L = this.hoogteInPx(hoogte);
    return 5 + L * 3 + 5;  // 5px boven en onder voor wat lucht
  },

  /* Teken op een canvas-element. */
  tekenCanvas: function(canvas, type, hoogte) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const L = this.hoogteInPx(hoogte);
    const top = 5;

    // 4 lijnposities, gelijk verdeeld
    const offs = [
      { dy: top,         kind: "top"    },
      { dy: top + L,     kind: "mid1"   },
      { dy: top + L * 2, kind: "base"   },
      { dy: top + L * 3, kind: "bottom" }
    ];

    // Wis canvas
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);

    const mid1Y = offs[1].dy;
    const baseY = offs[2].dy;

    // TYPE 6: één enkele zwarte lijn, gecentreerd binnen canvas.
    // Werkt zowel voor mini-previews (h=32) als grote canvases.
    if (type === "type6") {
      // Centrum van canvas voor lijn
      const lijnY = h / 2;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, lijnY);
      ctx.lineTo(w, lijnY);
      ctx.stroke();
      return;
    }

    // TYPE 7: twee parallelle lijnen, gecentreerd binnen canvas.
    if (type === "type7") {
      // Bepaal x-hoogte op basis van ingestelde hoogte L, maar zorg dat lijnen
      // binnen de canvas vallen.
      const xHoogte = Math.min(L, h * 0.5);
      const middenY = h / 2;
      const topY = middenY - xHoogte / 2;
      const basisY = middenY + xHoogte / 2;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(w, topY);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, basisY);
      ctx.lineTo(w, basisY);
      ctx.stroke();
      return;
    }

    // Inkleuring middenzone (x-hoogte) per type
    if (type === "type1") {
      ctx.fillStyle = "rgba(255,252,240,.5)";
      ctx.fillRect(0, mid1Y, w, baseY - mid1Y);
    } else if (type === "type2" || type === "type3") {
      ctx.fillStyle = "rgba(220,235,248,.45)";
      ctx.fillRect(0, mid1Y, w, baseY - mid1Y);
    } else if (type === "type5") {
      ctx.fillStyle = "rgba(190,225,235,.65)";
      ctx.fillRect(0, mid1Y, w, baseY - mid1Y);
    }

    // Teken de 4 lijnen
    offs.forEach(l => {
      let stroke = "#000";
      let width = 1;
      let dash = [];

      if (type === "type1") {
        stroke = "#000";
        width = (l.kind === "base") ? 1.5 : 1;
        dash = (l.kind === "top" || l.kind === "bottom") ? [6, 5] : [];
      }
      else if (type === "type2") {
        stroke = "#000";
        width = (l.kind === "base") ? 1.5 : 1;
        dash = [];
      }
      else if (type === "type3") {
        if (l.kind === "top" || l.kind === "bottom") {
          stroke = "#d9534f"; width = 1.5; dash = [];
        } else if (l.kind === "base") {
          stroke = "#4a9b6f"; width = 1.8; dash = [];
        } else {
          stroke = "#9fc2e8"; width = 1; dash = [6, 5];
        }
      }
      else if (type === "type4") {
        if (l.kind === "top" || l.kind === "bottom") {
          stroke = "#b7b7b7"; width = 1.4; dash = [];
        } else {
          stroke = "#9fc2e8";
          width = (l.kind === "base") ? 1.5 : 1;
          dash = [];
        }
      }
      else if (type === "type5") {
        if (l.kind === "top" || l.kind === "mid1") {
          stroke = "#d9534f"; width = 1.5; dash = [];
        } else {
          stroke = "#2f9a44"; width = 1.6; dash = [];
        }
      }

      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(0, l.dy);
      ctx.lineTo(w, l.dy);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  },

  /* Maak een schrijflijn-canvas-element met data-attributen die de browser
     na rendering nog kan terugvinden. Wordt gebruikt door OV01-module.

     Output is een <canvas>-element binnen een wrapper, klaar om in HTML
     te zetten. De daadwerkelijke teken-actie gebeurt na DOM-insertion via
     SpellingSchrijflijnen.tekenAlle() (idealiter aangeroepen na render). */
  htmlCanvas: function(type, hoogte, breedte) {
    const totaleH = this.totaleHoogte(hoogte);
    breedte = breedte || 200;
    return `<canvas class="schrijflijn-canvas"
                width="${breedte}"
                height="${totaleH}"
                data-type="${type}"
                data-hoogte="${hoogte}"
                style="width:100%; height:${totaleH}px; display:block;"></canvas>`;
  },

  /* Roep aan na DOM-insertion: vindt alle .schrijflijn-canvas elementen
     en tekent erin. Dynamisch breedte aanpassen op basis van DOM. */
  tekenAlle: function(parent) {
    const root = parent || document;
    const canvases = root.querySelectorAll("canvas.schrijflijn-canvas");
    canvases.forEach(canvas => {
      // Pas canvas.width aan aan de werkelijke layout-breedte
      const rect = canvas.getBoundingClientRect();
      const realW = Math.round(rect.width) || canvas.width;
      if (realW > 0 && realW !== canvas.width) {
        canvas.width = realW;
      }
      const type = canvas.dataset.type || "type3";
      const hoogte = canvas.dataset.hoogte || "middel";
      this.tekenCanvas(canvas, type, hoogte);
    });
  },

  /* Teken de mini-voorbeelden bij de lijntype-keuze-knoppen.
     Deze canvases zitten in de sidebar (data-preview-type attribuut). */
  tekenLijntypePreviews: function() {
    const previews = document.querySelectorAll("canvas.lijntype-preview[data-preview-type]");
    previews.forEach(canvas => {
      const type = canvas.dataset.previewType;
      // Mini-preview: gebruik kleine hoogte voor compacte weergave
      this.tekenCanvas(canvas, type, "klein");
    });
  }
};
