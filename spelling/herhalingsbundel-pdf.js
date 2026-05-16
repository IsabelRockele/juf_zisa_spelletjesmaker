/* ==========================================================
   herhalingsbundel-pdf.js
   
   Vector-PDF engine voor herhalingsbundels.
   Werkt direct met jsPDF — geen html2canvas, geen html2pdf.
   
   Resultaat: echte vector-PDF met:
     - Selecteerbare tekst (Arial)
     - Scherp bij elke zoom
     - Klein bestand
     - 100% gecontroleerde page-breaks
   
   Architectuur:
     - Helpers: lage-niveau teken-functies (kader, lijn, tekst, emoji)
     - State: bijhouden waar we zijn (pagina, cursor-Y)
     - OV-renderers: één per oefenvorm, gebruikt helpers
     - download(): hoofdfunctie, loop door items en delegeer aan OV-renderer
   
   Status: FUNDERING. Helpers werken, OV-renderers zijn stubs die 
   placeholders tekenen. Per OV invullen in volgende sessies.
   ========================================================== */

window.SpellingHerhalingsbundelPDF = (function() {

  /* ==========================================================
     CONSTANTEN
     A4 portrait: 210mm × 297mm
     Marges: 12mm top, 18mm bottom, 15mm links/rechts
     Werkbaar: 180mm × 267mm
     ========================================================== */
  
  const PAGINA_BREEDTE_MM = 210;
  const PAGINA_HOOGTE_MM = 297;
  const MARGE_TOP_MM = 12;
  const MARGE_BOTTOM_MM = 18;
  const MARGE_LR_MM = 15;
  const WERKBARE_BREEDTE_MM = PAGINA_BREEDTE_MM - 2 * MARGE_LR_MM;  // 180mm
  const WERKBARE_HOOGTE_MM = PAGINA_HOOGTE_MM - MARGE_TOP_MM - MARGE_BOTTOM_MM;  // 267mm
  
  // Y-grenzen voor content
  const CONTENT_Y_START = MARGE_TOP_MM;          // 12mm
  const CONTENT_Y_END = PAGINA_HOOGTE_MM - MARGE_BOTTOM_MM;  // 279mm
  
  // Lettertypes/groottes (Arial = standaard PDF-font "helvetica")
  // jsPDF heeft geen echte Arial; helvetica is visueel identiek en altijd beschikbaar
  const FONT_FAMILIE = "helvetica";   // = Arial in PDF-context
  const FONT_GROOTTE_TITEL = 24;      // grote bundel-titel
  const FONT_GROOTTE_INHOUD = 15;     // opdrachten, woorden, naam/datum
  const FONT_GROOTTE_VOETTEKST = 8;   // www.jufzisa.be en paginanummer
  
  // Kleuren (RGB)
  const KLEUR_TEKST = [33, 33, 33];           // donkergrijs/zwart
  const KLEUR_TITEL = [33, 78, 145];          // donkerblauw zoals Juf Zisa stijl
  const KLEUR_LIJN_GRIJS = [200, 200, 200];   // grijs voor lijntjes
  const KLEUR_GEEL_VUL = [254, 247, 217];     // lichtgeel achtergrond
  const KLEUR_GEEL_RAND = [240, 200, 80];     // gele rand
  const KLEUR_GROEN_VUL = [232, 247, 232];    // lichtgroen achtergrond
  const KLEUR_GROEN_RAND = [86, 156, 86];     // groene rand
  const KLEUR_LIJN_ROOD = [217, 83, 79];      // schrijflijn rood
  const KLEUR_LIJN_GROEN = [74, 155, 111];    // schrijflijn groen
  const KLEUR_LIJN_BLAUW = [159, 194, 232];   // schrijflijn blauw
  const KLEUR_VOET = [136, 136, 136];         // voettekst-grijs
  
  /* ==========================================================
     PAGE-FLOW STATE
     Beheert positie op de pagina, automatisch nieuwe pagina openen.
     ========================================================== */
  
  function maakState(pdf, totaalPaginas) {
    return {
      pdf: pdf,
      cursorY: CONTENT_Y_START,
      huidigePagina: 1,
      totaalPaginas: totaalPaginas,  // wordt later bijgewerkt
      contentX: MARGE_LR_MM,
      contentBreedte: WERKBARE_BREEDTE_MM
    };
  }
  
  /* Vraag aan state of er nog `benodigdeMM` ruimte is op huidige pagina.
     Zo niet: nieuwe pagina openen en cursor resetten. */
  function reserveerRuimte(state, benodigdeMM) {
    if (state.cursorY + benodigdeMM > CONTENT_Y_END) {
      nieuwePagina(state);
    }
  }
  
  function nieuwePagina(state) {
    state.pdf.addPage();
    state.huidigePagina++;
    state.cursorY = CONTENT_Y_START;
  }
  
  /* ==========================================================
     LAGE-NIVEAU TEKEN-HELPERS
     ========================================================== */
  
  /* Teken tekst met opgegeven font/grootte/kleur.
     opties: { size, kleur, vet, gecentreerd, maxBreedte } */
  function tekenTekst(pdf, x, y, tekst, opties = {}) {
    const size = opties.size || FONT_GROOTTE_INHOUD;
    const kleur = opties.kleur || KLEUR_TEKST;
    const vet = opties.vet || false;
    
    pdf.setFont(FONT_FAMILIE, vet ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(kleur[0], kleur[1], kleur[2]);
    
    const alignOpties = {};
    if (opties.gecentreerd) alignOpties.align = "center";
    
    if (opties.maxBreedte) {
      // Tekst wrappen indien te lang
      const regels = pdf.splitTextToSize(tekst, opties.maxBreedte);
      pdf.text(regels, x, y, alignOpties);
      // Teruggeven hoeveel regels het werden, zodat caller hoogte kan berekenen
      return regels.length;
    } else {
      pdf.text(tekst, x, y, alignOpties);
      return 1;
    }
  }
  
  /* Bereken hoogte van tekst (in mm) voor een gegeven font-size en aantal regels */
  function tekstHoogte(size, regels = 1) {
    // PDF point → mm: 1pt = 0.3528mm
    // Regelhoogte ≈ 1.2 × font-size in points
    const ptToMm = 0.3528;
    return regels * size * 1.2 * ptToMm;
  }
  
  /* Teken een rechthoek met gevulde achtergrond + border.
     stijl: 'vul' (alleen achtergrond), 'rand' (alleen border), 'beide' */
  function tekenKader(pdf, x, y, breedte, hoogte, opties = {}) {
    const vulKleur = opties.vulKleur;
    const randKleur = opties.randKleur;
    const randDikte = opties.randDikte || 0.5;
    const rondeHoeken = opties.rondeHoeken || 0;
    
    if (vulKleur) {
      pdf.setFillColor(vulKleur[0], vulKleur[1], vulKleur[2]);
    }
    if (randKleur) {
      pdf.setDrawColor(randKleur[0], randKleur[1], randKleur[2]);
      pdf.setLineWidth(randDikte);
    }
    
    let modus;
    if (vulKleur && randKleur) modus = "FD";  // fill + draw
    else if (vulKleur) modus = "F";            // fill only
    else if (randKleur) modus = "D";           // draw only
    else return;
    
    if (rondeHoeken > 0) {
      pdf.roundedRect(x, y, breedte, hoogte, rondeHoeken, rondeHoeken, modus);
    } else {
      pdf.rect(x, y, breedte, hoogte, modus);
    }
  }
  
  /* Teken een horizontale lijn. */
  function tekenLijn(pdf, x1, y, x2, opties = {}) {
    const kleur = opties.kleur || KLEUR_TEKST;
    const dikte = opties.dikte || 0.5;
    const streepjes = opties.streepjes || null;  // bv [2, 1] voor stippellijn
    
    pdf.setDrawColor(kleur[0], kleur[1], kleur[2]);
    pdf.setLineWidth(dikte);
    
    if (streepjes && pdf.setLineDashPattern) {
      pdf.setLineDashPattern(streepjes, 0);
      pdf.line(x1, y, x2, y);
      pdf.setLineDashPattern([], 0);  // reset
    } else {
      pdf.line(x1, y, x2, y);
    }
  }
  
  /* Teken een checkbox (vierkant blok). */
  function tekenCheckbox(pdf, x, y, grootte = 4) {
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(0.4);
    pdf.rect(x, y, grootte, grootte, "D");
  }
  
  /* ==========================================================
     HOOGNIVEAU TEKEN-HELPERS — bouwen op lage-niveau
     ========================================================== */
  
  /* Teken een gele opdracht-kader met meerdere stappen (elke met checkbox).
     Geeft de totale hoogte terug die de kader inneemt. */
  function tekenGeleKader(pdf, x, y, breedte, stappen, opties) {
    // opties: { label: string, aantalSterren: number }
    const label = opties && opties.label;
    const aantalSterren = (opties && opties.aantalSterren) || 0;
    
    const PADDING_VERT = 4;        // mm
    const PADDING_HOR = 5;         // mm
    const REGEL_HOOGTE = 6.5;      // mm per stap
    const CHECKBOX_GROOTTE = 4;    // mm
    const LABEL_HOOGTE = (label || aantalSterren > 0) ? 7 : 0;  // extra ruimte voor label-rij
    const STER_HOOGTE = 5;         // mm — ster-grootte
    
    const hoogte = 2 * PADDING_VERT + LABEL_HOOGTE + stappen.length * REGEL_HOOGTE;
    
    // Teken kader
    tekenKader(pdf, x, y, breedte, hoogte, {
      vulKleur: KLEUR_GEEL_VUL,
      randKleur: KLEUR_GEEL_RAND,
      randDikte: 0.7,
      rondeHoeken: 2
    });
    
    let cy = y + PADDING_VERT + 4;
    
    // Optioneel label + sterren
    if (label || aantalSterren > 0) {
      let lx = x + PADDING_HOR;
      if (label) {
        tekenTekst(pdf, lx, cy, label, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST,
          vet: true
        });
        // Tekst-breedte schatten via splitTextToSize
        pdf.setFont(FONT_FAMILIE, "bold");
        pdf.setFontSize(FONT_GROOTTE_INHOUD);
        const lblBreedte = pdf.getTextWidth(label);
        lx += lblBreedte + 3;
      }
      if (aantalSterren > 0) {
        // Sterren iets boven baseline plaatsen om visueel uit te lijnen met tekst
        tekenSterren(pdf, lx, cy - STER_HOOGTE + 1, STER_HOOGTE, aantalSterren);
      }
      cy += LABEL_HOOGTE;
    }
    
    // Teken elke stap
    for (const stap of stappen) {
      tekenCheckbox(pdf, x + PADDING_HOR, cy - 3, CHECKBOX_GROOTTE);
      tekenTekst(pdf, x + PADDING_HOR + CHECKBOX_GROOTTE + 3, cy, stap, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
      cy += REGEL_HOOGTE;
    }
    
    return hoogte;
  }
  
  /* Teken een groene uitbreidings-kader. Inhoud is een array van tekst-regels. */
  function tekenGroeneKader(pdf, x, y, breedte, regels) {
    const PADDING_VERT = 4;
    const PADDING_HOR = 5;
    const REGEL_HOOGTE = 6.5;
    
    const hoogte = 2 * PADDING_VERT + regels.length * REGEL_HOOGTE;
    
    tekenKader(pdf, x, y, breedte, hoogte, {
      vulKleur: KLEUR_GROEN_VUL,
      randKleur: KLEUR_GROEN_RAND,
      randDikte: 0.7,
      rondeHoeken: 2
    });
    
    let regelY = y + PADDING_VERT + 4;
    for (const regel of regels) {
      tekenTekst(pdf, x + PADDING_HOR, regelY, regel, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
      regelY += REGEL_HOOGTE;
    }
    
    return hoogte;
  }
  
  /* Teken een schrijflijn (één instance van de 4-lijnen-structuur).
     Vertaalt SpellingSchrijflijnen-types naar vector-lijnen.
     
     Hoogte van een schrijflijn (totaal):
       - klein: 4.0mm tussen lijnen → totaal 12mm
       - middel: 5.5mm tussen lijnen → totaal 16.5mm
       - groot: 7.5mm tussen lijnen → totaal 22.5mm */
  function tekenSchrijflijn(pdf, x, y, breedte, type, hoogteNaam) {
    let L;  // lijn-interval in mm
    if (hoogteNaam === "klein") L = 4.0;
    else if (hoogteNaam === "groot") L = 7.5;
    else L = 5.5;  // middel (default)
    
    // 4 lijn-Y posities
    const lijnen = [
      { y: y,         kind: "top" },
      { y: y + L,     kind: "mid1" },
      { y: y + 2 * L, kind: "base" },
      { y: y + 3 * L, kind: "bottom" }
    ];
    
    // Vul x-zone (tussen mid1 en base) bij sommige types
    const mid1Y = lijnen[1].y;
    const baseY = lijnen[2].y;
    
    // Type 6: één enkele zwarte lijn (gecentreerd)
    if (type === "type6") {
      const lijnY = y + 1.5 * L;  // midden
      tekenLijn(pdf, x, lijnY, x + breedte, { kleur: [0, 0, 0], dikte: 0.5 });
      return 3 * L;
    }
    
    // Type 7: twee parallelle lijnen
    if (type === "type7") {
      const middenY = y + 1.5 * L;
      const xHoogte = Math.min(L, 1.5 * L);
      tekenLijn(pdf, x, middenY - xHoogte / 2, x + breedte, { kleur: [0, 0, 0], dikte: 0.4 });
      tekenLijn(pdf, x, middenY + xHoogte / 2, x + breedte, { kleur: [0, 0, 0], dikte: 0.5 });
      return 3 * L;
    }
    
    // Achtergrond x-zone voor types met vulling
    if (type === "type1") {
      tekenKader(pdf, x, mid1Y, breedte, baseY - mid1Y, {
        vulKleur: [255, 252, 240]
      });
    } else if (type === "type2" || type === "type3") {
      tekenKader(pdf, x, mid1Y, breedte, baseY - mid1Y, {
        vulKleur: [232, 240, 250]
      });
    } else if (type === "type5") {
      tekenKader(pdf, x, mid1Y, breedte, baseY - mid1Y, {
        vulKleur: [210, 232, 240]
      });
    }
    
    // Teken de 4 lijnen volgens type
    for (const lijn of lijnen) {
      let kleur, dikte, streepjes;
      
      if (type === "type1") {
        kleur = [0, 0, 0];
        dikte = lijn.kind === "base" ? 0.5 : 0.3;
        streepjes = (lijn.kind === "top" || lijn.kind === "bottom") ? [1.5, 1] : null;
      }
      else if (type === "type2") {
        kleur = [0, 0, 0];
        dikte = lijn.kind === "base" ? 0.5 : 0.3;
        streepjes = null;
      }
      else if (type === "type3") {
        if (lijn.kind === "top" || lijn.kind === "bottom") {
          kleur = KLEUR_LIJN_ROOD; dikte = 0.5; streepjes = null;
        } else if (lijn.kind === "base") {
          kleur = KLEUR_LIJN_GROEN; dikte = 0.6; streepjes = null;
        } else {
          kleur = KLEUR_LIJN_BLAUW; dikte = 0.3; streepjes = [1.5, 1];
        }
      }
      else if (type === "type4") {
        if (lijn.kind === "top" || lijn.kind === "bottom") {
          kleur = [183, 183, 183]; dikte = 0.4; streepjes = null;
        } else {
          kleur = KLEUR_LIJN_BLAUW;
          dikte = lijn.kind === "base" ? 0.5 : 0.3;
          streepjes = null;
        }
      }
      else if (type === "type5") {
        if (lijn.kind === "top" || lijn.kind === "mid1") {
          kleur = KLEUR_LIJN_ROOD; dikte = 0.5; streepjes = null;
        } else {
          kleur = [47, 154, 68]; dikte = 0.55; streepjes = null;
        }
      }
      else {
        kleur = [0, 0, 0]; dikte = 0.3; streepjes = null;
      }
      
      tekenLijn(pdf, x, lijn.y, x + breedte, { kleur, dikte, streepjes });
    }
    
    return 3 * L;  // totale gebruikte hoogte
  }
  
  /* Teken een emoji als bitmap (jsPDF kan geen Unicode-emoji's renderen 
     met standaard fonts). We tekenen de emoji op een tijdelijke canvas, 
     converteren naar PNG, en bedden in via pdf.addImage().
     
     Cache: dezelfde emoji wordt maar één keer naar PNG omgezet. */
  const _emojiCache = {};
  
  function tekenEmoji(pdf, x, y, grootteMM, emoji) {
    if (!emoji) return;
    
    // Cache-key: emoji + grootte
    const cacheKey = emoji + ":" + Math.round(grootteMM * 10);
    
    let dataURL = _emojiCache[cacheKey];
    if (!dataURL) {
      // Render emoji op een tijdelijke canvas op hoge resolutie.
      // We maken canvas iets groter dan nodig en tekenen emoji in midden,
      // zodat eventuele descenders/ascenders niet afgesneden worden.
      const dpi = 3;  // 3x voor scherpte
      const pxGrootte = Math.round(grootteMM * 3.78 * dpi);  // mm → px op 96dpi × dpi
      // Maak canvas iets groter (20% padding) zodat emoji's met ascenders/descenders 
      // (zoals 🍎 of 📷) niet afgesneden worden
      const canvasGrootte = Math.round(pxGrootte * 1.2);
      const canvas = document.createElement("canvas");
      canvas.width = canvasGrootte;
      canvas.height = canvasGrootte;
      const ctx = canvas.getContext("2d");
      
      // KRITIEK: fillStyle moet een echte kleur zijn, niet "transparent".
      // Voor emoji's gebruiken we zwart als basis-kleur (emoji-fonts negeren 
      // dit en gebruiken hun eigen kleuren).
      ctx.fillStyle = "#000000";
      
      // Font-grootte: 80% van canvas zodat er ruimte is rond de emoji
      const fontPx = Math.round(canvasGrootte * 0.8);
      // Belangrijk: emoji-fonts EERST in de stack, daarna fallbacks
      ctx.font = `${fontPx}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", "EmojiOne Color", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      
      // Teken emoji in midden van canvas
      try {
        ctx.fillText(emoji, canvasGrootte / 2, canvasGrootte / 2);
      } catch (e) {
        console.warn("Emoji render fout:", emoji, e);
      }
      
      dataURL = canvas.toDataURL("image/png");
      _emojiCache[cacheKey] = dataURL;
    }
    
    // Plaats afbeelding op de PDF — let op: canvas is 20% groter dan de 
    // gewenste mm-grootte, dus we plaatsen het op grootteMM*1.2 en schuiven 
    // wat naar boven/links zodat de emoji zelf op de juiste positie staat
    const beeldGrootteMM = grootteMM * 1.2;
    const offset = (beeldGrootteMM - grootteMM) / 2;
    pdf.addImage(dataURL, "PNG", x - offset, y - offset, beeldGrootteMM, beeldGrootteMM);
  }
  
  /* Teken N gele sterretjes (⭐) naast elkaar via emoji-bitmap.
     Returnt totale breedte in mm. */
  function tekenSterren(pdf, x, y, hoogteMM, aantal) {
    const spacing = hoogteMM * 0.1;
    let curX = x;
    for (let i = 0; i < aantal; i++) {
      tekenEmoji(pdf, curX, y, hoogteMM, "⭐");
      curX += hoogteMM + spacing;
    }
    return curX - x - spacing;  // breedte exclusief laatste spacing
  }
  
  /* Bereken aantal sterren voor een niveau */
  function sterrenVoorNiveau(niveau) {
    if (niveau === "basis") return 1;
    if (niveau === "kern") return 2;
    if (niveau === "verdieping") return 3;
    if (niveau === "uitbreiding") return 4;
    return 0;
  }
  
  /* ==========================================================
     PNG-AFBEELDINGEN
     
     Voor woorden met `afbeelding: true` proberen we de echte PNG te 
     laden uit afbeeldingen/graad{N}/{categorie}/{woord}.png
     
     Cache: woord → dataURL (of null bij 404).
     Pre-load: laadAfbeeldingen() laadt parallel alle PNG's vóór render.
     ========================================================== */
  
  const _afbeeldingCache = {};  // pad → dataURL of null (404)
  const _afbeeldingAfm = {};    // pad → { w, h } afmetingen van de getrimde PNG
  
  function afbeeldingPad(woord) {
    if (!woord || !woord.tekst || !woord.categorie) return null;
    // Ondersteun zowel "graad" als "leerjaar" naamgeving
    const graadNr = woord.graad || woord.leerjaar || 1;
    return `afbeeldingen/graad${graadNr}/${woord.categorie}/${woord.tekst}.png`;
  }
  
  /* Laad één PNG via fetch + canvas → dataURL.
     Returnt Promise die resolved met dataURL (of null bij fout). */
  function _laadPNG(pad) {
    // Alleen positieve resultaten in cache; mislukkingen niet 
    // (zodat bij vorige misluking — bv. door verouderde code — een 
    // nieuwe poging gewoon werkt).
    if (_afbeeldingCache[pad]) {
      return Promise.resolve(_afbeeldingCache[pad]);
    }
    
    console.log("[PDF] → Probeer te laden:", pad);
    
    return new Promise((resolve) => {
      const img = new Image();
      // GEEN crossOrigin: lokale bestanden krijgen anders CORS-fouten 
      // bij sommige browsers/servers, met als gevolg dat canvas "tainted" 
      // wordt en toDataURL faalt.
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          
          // Auto-trim: detecteer bounding box van non-witte / non-transparente pixels
          const getrimd = _trimAfbeelding(canvas);
          const dataURL = getrimd.toDataURL("image/png");
          _afbeeldingCache[pad] = dataURL;
          _afbeeldingAfm[pad] = { w: getrimd.width, h: getrimd.height };
          console.log("[PDF] ✓ PNG geladen:", pad, 
            `(${img.naturalWidth}×${img.naturalHeight} → ${getrimd.width}×${getrimd.height})`);
          resolve(dataURL);
        } catch (e) {
          console.log("[PDF] ✗ Canvas-fout bij PNG:", pad, e.message);
          resolve(null);
        }
      };
      img.onerror = (e) => {
        console.log("[PDF] ✗ PNG niet gevonden:", pad);
        resolve(null);
      };
      img.src = pad;
    });
  }
  
  /* Trim witte/transparante randen van een canvas.
     Returnt een nieuwe canvas met alleen de non-witte bounding box, 
     MET behoud van de werkelijke aspect ratio (geen square padding).
     De PDF-renderer past 'contain' toe binnen de cel. */
  function _trimAfbeelding(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      return canvas;
    }
    const data = imageData.data;
    
    const WIT_DREMPEL = 245;
    const ALPHA_DREMPEL = 20;
    
    let minX = w, minY = h, maxX = -1, maxY = -1;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a > ALPHA_DREMPEL && (r < WIT_DREMPEL || g < WIT_DREMPEL || b < WIT_DREMPEL)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    if (maxX < 0) return canvas;
    
    // Kleine padding (2%) zodat content niet pal tegen de rand zit
    const padding = Math.round(Math.max(w, h) * 0.02);
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w - 1, maxX + padding);
    maxY = Math.min(h - 1, maxY + padding);
    
    const contentW = maxX - minX + 1;
    const contentH = maxY - minY + 1;
    
    // Output behoudt echte aspect ratio (geen square padding).
    // Een breed hek wordt dus breed-en-laag, een vierkante bal blijft vierkant.
    // De PDF-renderer past 'contain' toe om de afbeelding binnen de cel te passen.
    const out = document.createElement("canvas");
    out.width = contentW;
    out.height = contentH;
    const outCtx = out.getContext("2d");
    
    // Witte achtergrond voor afbeeldingen met transparantie
    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, contentW, contentH);
    
    // Plak de getrimde content op origin (0,0)
    outCtx.drawImage(canvas, minX, minY, contentW, contentH, 0, 0, contentW, contentH);
    
    return out;
  }
  
  /* Pre-load alle PNG's voor een lijst woorden.
     Returnt Promise die resolved als alle laadpogingen klaar zijn.
     
     Probeert voor élk woord met categorie een PNG te laden — geen vlag nodig.
     404's zijn OK: die worden door tekenAfbeelding opgevangen met emoji-fallback. */
  async function laadAfbeeldingen(woorden) {
    const paden = [];
    const gezien = new Set();  // dedupe
    for (const w of woorden) {
      const pad = afbeeldingPad(w);
      if (pad && !gezien.has(pad) && !_afbeeldingCache[pad]) {
        paden.push(pad);
        gezien.add(pad);
      }
    }
    console.log("[PDF] laadAfbeeldingen: ga", paden.length, "unieke PNG's proberen...");
    await Promise.all(paden.map(p => _laadPNG(p)));
  }
  
  /* Teken een afbeelding voor een woord.
     Probeert eerst PNG (via afbeeldingPad), valt terug op emoji bij niet-beschikbaar.
     
     Vereist dat de PNG al via laadAfbeeldingen() voorgeladen is. */
  function tekenAfbeelding(pdf, x, y, grootteMM, woord, opties) {
    if (!woord) return;
    
    // grootteMM is hier de HOOGTE (vaste hoogte voor visuele consistentie).
    // De breedte volgt de aspect ratio van de afbeelding.
    // opties.maxBreedte (mm) = horizontale ruimte waarin gecentreerd wordt.
    //   Als de afbeelding breder wordt dan maxBreedte, wordt zij wel teruggeschaald.
    const maxBreedte = (opties && opties.maxBreedte) ? opties.maxBreedte : grootteMM * 2;
    
    // Probeer PNG (op basis van categorie + tekst, geen vlag nodig)
    const pad = afbeeldingPad(woord);
    const heeftPNG = pad && _afbeeldingCache[pad];
    
    console.log(`[PDF] tekenAfbeelding voor '${woord.tekst}': pad=${pad}, PNG in cache=${!!heeftPNG}`);
    
    if (heeftPNG) {
      try {
        const dataURL = _afbeeldingCache[pad];
        const dims = _afbeeldingAfm[pad];
        
        // Bereken breedte op basis van vaste hoogte + aspect ratio
        let plaatsH = grootteMM;
        let plaatsW = grootteMM;  // default (square) als geen dims bekend
        
        if (dims && dims.w > 0 && dims.h > 0) {
          const ratio = dims.w / dims.h;
          plaatsW = plaatsH * ratio;
          
          // Als breedte de maxBreedte overschrijdt: schaal beide terug
          if (plaatsW > maxBreedte) {
            const schaal = maxBreedte / plaatsW;
            plaatsW = maxBreedte;
            plaatsH = plaatsH * schaal;
          }
        }
        
        // Horizontaal centreren binnen maxBreedte; verticaal centreren binnen grootteMM-zone
        const offsetX = (maxBreedte - plaatsW) / 2;
        const offsetY = (grootteMM - plaatsH) / 2;
        
        pdf.addImage(dataURL, "PNG", x + offsetX, y + offsetY, plaatsW, plaatsH);
        console.log(`[PDF]   → PNG geplaatst voor '${woord.tekst}' (${plaatsW.toFixed(1)}×${plaatsH.toFixed(1)}mm)`);
        return;
      } catch (e) {
        console.warn(`[PDF]   → addImage faalde voor '${woord.tekst}':`, e.message);
      }
    }
    
    // Fallback: emoji (gebruik vaste vierkante grootte voor emoji's, gecentreerd)
    let emojiChar = woord.emoji;
    if (!emojiChar && window.SpellingAfbeeldingen?.emojiVoor) {
      emojiChar = window.SpellingAfbeeldingen.emojiVoor(woord.tekst);
    }
    if (!emojiChar) emojiChar = "🖼️";
    console.log(`[PDF]   → Emoji-fallback voor '${woord.tekst}': ${emojiChar}`);
    // Centreer emoji binnen maxBreedte zone
    const emojiOffsetX = (maxBreedte - grootteMM) / 2;
    tekenEmoji(pdf, x + emojiOffsetX, y, grootteMM, emojiChar);
  }
  
  /* Teken een "woordkader" met losse letters in vakjes (zoals OV01-basis cellen).
     letters: array van strings.
     Geeft totale breedte terug. */
  function tekenLetterVakjes(pdf, x, y, letters, letterGrootteMM = 7) {
    const spacing = 1;  // mm tussen vakjes
    let curX = x;
    for (const letter of letters) {
      tekenKader(pdf, curX, y, letterGrootteMM, letterGrootteMM, {
        randKleur: [120, 120, 120],
        randDikte: 0.4,
        rondeHoeken: 0.8
      });
      // Letter gecentreerd in vakje
      tekenTekst(pdf, curX + letterGrootteMM / 2, y + letterGrootteMM / 2 + 1.5, letter, {
        size: FONT_GROOTTE_INHOUD,
        gecentreerd: true,
        kleur: KLEUR_TEKST
      });
      curX += letterGrootteMM + spacing;
    }
    return curX - x;
  }
  
  /* ==========================================================
     DOC-HEADER (Naam/Datum/Titel)
     Wordt op pagina 1 getekend.
     ========================================================== */
  
  function tekenDocHeader(state, titel) {
    const pdf = state.pdf;
    const x = state.contentX;
    let y = state.cursorY + 4;
    
    // Naam: ___ Datum: ___
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    pdf.setTextColor(KLEUR_TEKST[0], KLEUR_TEKST[1], KLEUR_TEKST[2]);
    
    tekenTekst(pdf, x, y, "Naam:", { size: FONT_GROOTTE_INHOUD });
    // Naam-lijn
    tekenLijn(pdf, x + 15, y + 0.5, x + 110, { kleur: KLEUR_TEKST, dikte: 0.4 });
    
    tekenTekst(pdf, x + 120, y, "Datum:", { size: FONT_GROOTTE_INHOUD });
    tekenLijn(pdf, x + 138, y + 0.5, x + state.contentBreedte, { kleur: KLEUR_TEKST, dikte: 0.4 });
    
    y += 14;
    
    // Bundel-titel — gecentreerd, dichter bij de blauwe onderlijn
    const midX = x + state.contentBreedte / 2;
    tekenTekst(pdf, midX, y, titel, {
      size: FONT_GROOTTE_TITEL,
      kleur: KLEUR_TITEL,
      vet: true,
      gecentreerd: true
    });
    
    y += 4;  // kleine spacing tussen titel en onderlijn
    
    // Onderlijn
    tekenLijn(pdf, x, y, x + state.contentBreedte, { kleur: KLEUR_TITEL, dikte: 0.6 });
    
    y += 6;
    state.cursorY = y;
  }
  
  /* ==========================================================
     VOETTEKST (alleen aan einde, na alle content)
     Wordt op ELKE pagina geplaatst via een tweede loop na content-render.
     ========================================================== */
  
  function tekenVoettekstOpAllePaginas(pdf) {
    const totaal = pdf.internal.getNumberOfPages();
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_VOETTEKST);
    pdf.setTextColor(KLEUR_VOET[0], KLEUR_VOET[1], KLEUR_VOET[2]);
    
    for (let p = 1; p <= totaal; p++) {
      pdf.setPage(p);
      const ph = pdf.internal.pageSize.getHeight();
      const pw = pdf.internal.pageSize.getWidth();
      pdf.text("www.jufzisa.be - Juf Zisa's spellinggenerator", MARGE_LR_MM, ph - 8);
      pdf.text(`${p} / ${totaal}`, pw - MARGE_LR_MM, ph - 8, { align: "right" });
    }
  }
  
  /* ==========================================================
     OV-RENDERERS
     Eén functie per oefenvorm. Krijgt state en item-data, 
     tekent de inhoud, schuift cursor op, opent nieuwe pagina indien nodig.
     
     Status nu: stubs die alleen een placeholder tonen + opdracht-kader 
     proberen te halen uit de gewone preview-DOM. Per OV invullen later.
     ========================================================== */
  
  /* Hulpfunctie: haal opdracht-stappen uit een gerenderde item-DOM */
  function _haalOpdrachtStappen(itemEl, ovId) {
    // Selectors per OV (allemaal "*-stappen-label" voor de stappen)
    const opdrachtBlok = itemEl.querySelector(
      `.${ovId}-stappen, .${ovId}-instructies`
    );
    if (!opdrachtBlok) return [];
    
    // De stappen zijn de tekst-elementen NA het verwijderde stappen-label
    // Bij OV01: .ov01-stap-rij > span (zonder vakje)
    // Bij andere OV's: similar pattern
    const stappen = [];
    
    // OV01 stijl: stap-rijen
    opdrachtBlok.querySelectorAll(".ov01-stap-rij span:last-child, .ov01-stap-rij span:not(.ov01-vakje)").forEach(el => {
      const tekst = el.textContent.trim();
      if (tekst) stappen.push(tekst);
    });
    
    // Generiek fallback: alle <p> of <li> binnen het opdracht-blok
    if (stappen.length === 0) {
      opdrachtBlok.querySelectorAll("p, li, .stap").forEach(el => {
        const tekst = el.textContent.trim();
        if (tekst) stappen.push(tekst);
      });
    }
    
    return stappen;
  }
  
  /* ==========================================================
     OV01 RENDERER — Plaatje → woord schrijven
     
     Layout per cel: emoji bovenaan, daaronder ofwel 3 keuze-vakjes 
     (basis-niveau) ofwel leeg, daaronder schrijflijn(en).
     3 cellen per rij.
     ========================================================== */
  
  function tekenOV01(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov01");
      return;
    }
    
    // --- 1. Opdracht-kader bovenaan ---
    const stappen = _haalOpdrachtStappen(itemEl, "ov01");
    const opdrachtStappen = stappen.length > 0 ? stappen : ["Bekijk de prent.", "Schrijf het woord op.", "Kijk het woord nog eens na."];
    
    // Hoogte: padding × 2 + label-rij (7mm) + stappen × 6.5mm
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 6.5;
    
    // --- 2. Verzamel cel-data uit de DOM ---
    // Bouw een lookup-table van item.actieveWoorden zodat we per cel het 
    // volledige woord-object kunnen vinden (met categorie + afbeelding-vlag)
    const woordPool = [
      ...(item.actieveWoorden || []),
      ...(item.extraWoorden || [])
    ];
    const woordLookup = new Map();
    woordPool.forEach(w => {
      if (w && w.tekst) woordLookup.set(w.tekst, w);
    });
    
    const cellen = [];
    itemEl.querySelectorAll(".ov01-cel").forEach(celEl => {
      const woordTekst = celEl.getAttribute("data-woord") || "";
      const woordObj = woordLookup.get(woordTekst);  // volledig woord-object met categorie + afbeelding
      
      const data = {
        woord: woordTekst,
        woordObj: woordObj || null,  // volledig object (kan null zijn)
        emoji: "",
        keuzeOpties: [],
        juistWoord: woordTekst,
        aantalLijnen: 1
      };
      
      // Emoji uit .ov01-cel-plaatje
      const plaatjeEl = celEl.querySelector(".ov01-cel-plaatje");
      if (plaatjeEl) data.emoji = plaatjeEl.textContent.trim();
      
      // Keuze-opties (basis-niveau)
      const keuzeHokjes = celEl.querySelectorAll(".ov01-keuze-hokje");
      keuzeHokjes.forEach(hokje => {
        data.keuzeOpties.push({
          tekst: hokje.textContent.trim(),
          juist: hokje.classList.contains("juist")
        });
      });
      
      // Aantal schrijflijnen (aantal .ov01-canvas-wrap)
      data.aantalLijnen = celEl.querySelectorAll(".ov01-canvas-wrap").length || 1;
      
      cellen.push(data);
    });
    
    if (cellen.length === 0) {
      // Geen data gevonden → fallback naar stub
      _tekenStubOV(state, item, "ov01");
      return;
    }
    
    // --- 3. Lijntype en lijnhoogte ophalen uit het werkblad ---
    const werkbladEl = itemEl.querySelector(".werkblad.ov01-blad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "middel";
    const niveau = werkbladEl?.getAttribute("data-niveau") || "basis";
    
    // --- 4. Bereken cel-afmetingen ---
    const CELLEN_PER_RIJ = 3;
    const CEL_SPACING = 4;  // mm tussen cellen horizontaal
    const RIJ_SPACING = 4;  // mm tussen rijen verticaal
    
    const celBreedte = (state.contentBreedte - (CELLEN_PER_RIJ - 1) * CEL_SPACING) / CELLEN_PER_RIJ;
    
    // Bereken cel-hoogte op basis van inhoud:
    //   - emoji ruimte: ~14mm
    //   - keuze-vakjes (alleen basis): ~9mm
    //   - schrijflijnen: 3 × L per lijn (L = 4mm klein, 5.5mm middel, 7.5mm groot)
    //   - padding: 5mm boven en onder
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    
    const PADDING_CEL = 4;
    const EMOJI_RUIMTE = 23;  // 20mm afbeelding + 3mm spacing
    const KEUZE_RUIMTE = niveau === "basis" ? 11 : 0;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    const aantalLijnenInCel = cellen[0]?.aantalLijnen || 1;
    const LIJNEN_RUIMTE = aantalLijnenInCel * SCHRIJFLIJN_HOOGTE + (aantalLijnenInCel - 1) * 2;
    
    const celHoogte = 2 * PADDING_CEL + EMOJI_RUIMTE + KEUZE_RUIMTE + LIJNEN_RUIMTE + 2;
    
    // --- 5. Page-flow: reserveer ruimte voor opdracht + eerste rij ---
    const eersteRijHoogte = celHoogte + RIJ_SPACING;
    reserveerRuimte(state, opdrachtHoogte + 4 + eersteRijHoogte);
    
    // --- 6. Teken opdracht-kader ---
    tekenGeleKader(pdf, state.contentX, state.cursorY, state.contentBreedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // --- 7. Teken cellen, rij per rij ---
    for (let i = 0; i < cellen.length; i += CELLEN_PER_RIJ) {
      const rij = cellen.slice(i, i + CELLEN_PER_RIJ);
      
      // Reserveer ruimte voor deze rij (behalve de eerste rij — die is al gereserveerd)
      if (i > 0) reserveerRuimte(state, celHoogte + RIJ_SPACING);
      
      const rijY = state.cursorY;
      
      rij.forEach((cel, idx) => {
        const celX = state.contentX + idx * (celBreedte + CEL_SPACING);
        _tekenOV01Cel(pdf, celX, rijY, celBreedte, celHoogte, cel, {
          niveau,
          lijntype,
          lijnhoogte,
          metOplossingen: item.metAntwoorden === true
        });
      });
      
      state.cursorY += celHoogte + RIJ_SPACING;
    }
    
    // --- 8. Verdieping/uitbreiding: extra opdracht onderaan ---
    if (niveau === "verdieping") {
      _tekenOV01ZinOpdracht(state, lijntype, lijnhoogte, item.metAntwoorden === true);
    } else if (niveau === "uitbreiding") {
      _tekenOV01UitbreidingOpdracht(state, lijntype, lijnhoogte, item.metAntwoorden === true);
    }
    
    // Spacing onder de oefening
    state.cursorY += 6;
  }
  
  /* Teken één OV01 cel: kader + emoji + keuze (basis) + schrijflijnen */
  function _tekenOV01Cel(pdf, x, y, breedte, hoogte, cel, opties) {
    const { niveau, lijntype, lijnhoogte, metOplossingen } = opties;
    
    // Cel-kader (lichte grijze rand met ronde hoeken)
    tekenKader(pdf, x, y, breedte, hoogte, {
      randKleur: [200, 200, 200],
      randDikte: 0.4,
      rondeHoeken: 2
    });
    
    let cy = y + 4;  // cursor binnen cel
    
    // Afbeelding: vaste hoogte (20mm), breedte volgt aspect ratio.
    // Brede afbeeldingen krijgen max bijna de hele celbreedte (met kleine marge).
    const afbHoogte = 20;
    const afbMaxBreedte = breedte - 4;  // 2mm padding aan elke kant
    const afbX = x + 2;  // start na de 2mm padding (centrering gebeurt in tekenAfbeelding)
    
    if (cel.woordObj && cel.woordObj.categorie) {
      const woordVoorTeken = { ...cel.woordObj, emoji: cel.emoji };
      tekenAfbeelding(pdf, afbX, cy, afbHoogte, woordVoorTeken, { maxBreedte: afbMaxBreedte });
    } else if (cel.emoji) {
      console.log(`[PDF] cel zonder woordObj: woord='${cel.woord}', emoji='${cel.emoji}'`);
      // Emoji blijft vierkant, gecentreerd in cel
      const emojiX = x + (breedte - afbHoogte) / 2;
      tekenEmoji(pdf, emojiX, cy, afbHoogte, cel.emoji);
    }
    cy += afbHoogte + 3;
    
    // Bij basis-niveau: 3 keuze-vakjes met woordopties
    if (niveau === "basis" && cel.keuzeOpties.length > 0) {
      const aantalOpties = cel.keuzeOpties.length;
      const vakjeMarge = 1.5;
      const beschBreedte = breedte - 4;  // 2mm padding aan elke kant
      const vakjeBreedte = (beschBreedte - (aantalOpties - 1) * vakjeMarge) / aantalOpties;
      const vakjeHoogte = 8;  // groter zodat 14pt tekst comfortabel past
      
      cel.keuzeOpties.forEach((opt, idx) => {
        const vx = x + 2 + idx * (vakjeBreedte + vakjeMarge);
        // Achtergrond: bij oplossingen + juist → groene tint
        const vulKleur = (metOplossingen && opt.juist) ? [220, 240, 220] : null;
        tekenKader(pdf, vx, cy, vakjeBreedte, vakjeHoogte, {
          vulKleur: vulKleur,
          randKleur: [120, 120, 120],
          randDikte: 0.4,
          rondeHoeken: 1
        });
        // Tekst gecentreerd in vakje, groter (14pt) voor leesbaarheid 1e/2e leerjaar
        tekenTekst(pdf, vx + vakjeBreedte / 2, cy + vakjeHoogte / 2 + 1.8, opt.tekst, {
          size: 14,
          gecentreerd: true,
          kleur: KLEUR_TEKST
        });
      });
      cy += vakjeHoogte + 3;
    } else {
      // Geen keuze-vakjes → kleine spacing
      cy += 1;
    }
    
    // Schrijflijnen
    const aantalLijnen = cel.aantalLijnen || 1;
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    
    for (let i = 0; i < aantalLijnen; i++) {
      // Bij oplossingen: woord op de EERSTE lijn
      if (metOplossingen && i === 0 && cel.juistWoord) {
        // Teken het woord op base-line (lijn 3 van 4) = y + 2L
        tekenTekst(pdf, x + 3, cy + 2 * L - 0.5, cel.juistWoord, {
          size: 13,
          kleur: KLEUR_TEKST
        });
      }
      tekenSchrijflijn(pdf, x + 2, cy, breedte - 4, lijntype, lijnhoogte);
      cy += 3 * L + 2;
    }
  }
  
  /* OV01 zin-opdracht onderaan (verdieping-niveau) */
  function _tekenOV01ZinOpdracht(state, lijntype, lijnhoogte, metOplossingen) {
    const pdf = state.pdf;
    
    // Hoogte berekenen
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    const schrijflijnHoogte = 3 * L;
    const totaalHoogte = 4 + 6.5 + 4 + 6.5 + 3 + schrijflijnHoogte + (metOplossingen ? 7 : 0) + 4;
    
    reserveerRuimte(state, totaalHoogte + 4);
    state.cursorY += 4;
    
    const x = state.contentX;
    const y = state.cursorY;
    const breedte = state.contentBreedte;
    
    // Groene kader
    tekenKader(pdf, x, y, breedte, totaalHoogte, {
      vulKleur: KLEUR_GROEN_VUL,
      randKleur: KLEUR_GROEN_RAND,
      randDikte: 0.7,
      rondeHoeken: 2
    });
    
    let cy = y + 7;
    // Label
    tekenTekst(pdf, x + 5, cy, "Opdracht 2 (zin):", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true
    });
    cy += 7;
    // Vraag
    tekenTekst(pdf, x + 5, cy, "Kies 1 woord van de vorige oefening en maak een goede zin met dit woord.", {
      size: 13,
      kleur: KLEUR_TEKST,
      maxBreedte: breedte - 10
    });
    cy += 8;
    // Schrijflijn
    tekenSchrijflijn(pdf, x + 5, cy, breedte - 10, lijntype, lijnhoogte);
    cy += schrijflijnHoogte + 2;
    // Oplossingen-richtlijn (alleen bij metOplossingen)
    if (metOplossingen) {
      tekenTekst(pdf, x + 5, cy + 3, "Verwacht: een correcte zin met hoofdletter, leesteken op het einde, en een woord uit de oefening.", {
        size: 10,
        kleur: [100, 100, 100],
        maxBreedte: breedte - 10
      });
    }
    
    state.cursorY = y + totaalHoogte;
  }
  
  /* OV01 uitbreiding-opdracht (uitbreiding-niveau): meervoud + verkleinwoord */
  function _tekenOV01UitbreidingOpdracht(state, lijntype, lijnhoogte, metOplossingen) {
    const pdf = state.pdf;
    
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    const schrijflijnHoogte = 3 * L;
    
    // 3 kolommen met label + schrijflijn
    const kolomLabelHoogte = 6;
    const blokHoogte = 4 + 6.5 + 4 + 6.5 + 3 + kolomLabelHoogte + schrijflijnHoogte + (metOplossingen ? 8 : 0) + 4;
    
    reserveerRuimte(state, blokHoogte + 4);
    state.cursorY += 4;
    
    const x = state.contentX;
    const y = state.cursorY;
    const breedte = state.contentBreedte;
    
    // Groene kader
    tekenKader(pdf, x, y, breedte, blokHoogte, {
      vulKleur: KLEUR_GROEN_VUL,
      randKleur: KLEUR_GROEN_RAND,
      randDikte: 0.7,
      rondeHoeken: 2
    });
    
    let cy = y + 7;
    // Titel "Extra opdracht (uitbreiden):"
    tekenTekst(pdf, x + 5, cy, "Extra opdracht (uitbreiden):", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true
    });
    cy += 7;
    tekenTekst(pdf, x + 5, cy, "Kies 1 woord en schrijf het meervoud (veel) en het verkleinwoord erbij.", {
      size: 13,
      kleur: KLEUR_TEKST,
      maxBreedte: breedte - 10
    });
    cy += 8;
    
    // 3 kolommen
    const labels = ["Het woord:", "Het meervoud (veel):", "Het verkleinwoord:"];
    const kolomSpacing = 3;
    const kolomBreedte = (breedte - 10 - 2 * kolomSpacing) / 3;
    
    labels.forEach((lbl, i) => {
      const kx = x + 5 + i * (kolomBreedte + kolomSpacing);
      tekenTekst(pdf, kx, cy, lbl, { size: 11, kleur: KLEUR_TEKST });
      tekenSchrijflijn(pdf, kx, cy + kolomLabelHoogte, kolomBreedte, lijntype, lijnhoogte);
    });
    
    cy += kolomLabelHoogte + schrijflijnHoogte + 4;
    
    if (metOplossingen) {
      tekenTekst(pdf, x + 5, cy, "Verwacht: kind kiest een woord uit de oefening en schrijft correct meervoud + verkleinwoord. Bv. boom → bomen → boompje.", {
        size: 10,
        kleur: [100, 100, 100],
        maxBreedte: breedte - 10
      });
    }
    
    state.cursorY = y + blokHoogte;
  }
  
  /* ==========================================================
     OV02 RENDERER — Woord 3x overschrijven
     
     Layout per rij:
     [plaatje?] [woord] [lijn 1] [lijn 2] [lijn 3]
     
     - Plaatje optioneel (toggle)
     - Vast 3 schrijflijnen per woord
     - Geen niveau-keuze (geen sterren)
     ========================================================== */
  
  function tekenOV02(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov02");
      return;
    }
    
    // --- 1. Opdracht-kader bovenaan ---
    const stappen = _haalOpdrachtStappen(itemEl, "ov02");
    const opdrachtStappen = stappen.length > 0 ? stappen : 
      ["Lees het woord.", "Schrijf het woord 3 keer op de lijntjes.", "Kijk goed na: zijn alle 3 dezelfde?"];
    
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 6.5;
    
    // --- 2. Verzamel woord-rijen uit de DOM ---
    const woordPool = [
      ...(item.actieveWoorden || []),
      ...(item.extraWoorden || [])
    ];
    const woordLookup = new Map();
    woordPool.forEach(w => {
      if (w && w.tekst) woordLookup.set(w.tekst, w);
    });
    
    const rijen = [];
    itemEl.querySelectorAll(".ov02-rij").forEach(rijEl => {
      const woordTekst = rijEl.getAttribute("data-woord") || "";
      const woordObj = woordLookup.get(woordTekst);
      
      // Toon-tekst (met lidwoord)
      const woordTekstEl = rijEl.querySelector(".ov02-woord");
      const tonen = woordTekstEl ? woordTekstEl.textContent.trim() : woordTekst;
      
      // Antwoord-tekst aanwezig? (bij oplossingen)
      const antwoordEl = rijEl.querySelector(".ov02-lijn-antwoord");
      const antwoord = antwoordEl ? antwoordEl.textContent.trim() : null;
      
      rijen.push({
        woord: woordTekst,
        woordObj: woordObj || null,
        tonen: tonen,
        antwoord: antwoord
      });
    });
    
    if (rijen.length === 0) {
      _tekenStubOV(state, item, "ov02");
      return;
    }
    
    // --- 3. Settings ophalen uit werkblad ---
    const werkbladEl = itemEl.querySelector(".werkblad.ov02-blad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "middel";
    
    // Plaatje wel/niet (check of er een .ov02-plaatje element in de DOM zit)
    const metPlaatje = !!itemEl.querySelector(".ov02-plaatje");
    
    // --- 4. Bereken rij-afmetingen ---
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    const RIJ_HOOGTE = SCHRIJFLIJN_HOOGTE + 4;
    const RIJ_SPACING = 3;
    
    const PLAATJE_BREEDTE = metPlaatje ? 12 : 0;
    const PLAATJE_SPACING = metPlaatje ? 3 : 0;
    const WOORD_BREEDTE = 24;  // korter — woorden zijn meestal 4-7 letters
    const WOORD_SPACING = 2;
    const LIJN_SPACING = 3;
    // Extra linker-marge: ruimte voor 4-gaats perforator zodat gaten niet 
    // door de woord-letters of schrijflijntjes gaan
    const PERFORATIE_MARGE = 8;  // mm extra inspringen vanaf MARGE_LR_MM
    const beschBreedte = state.contentBreedte - PERFORATIE_MARGE - PLAATJE_BREEDTE - PLAATJE_SPACING - WOORD_BREEDTE - WOORD_SPACING;
    const LIJN_BREEDTE = (beschBreedte - 2 * LIJN_SPACING) / 3;
    
    // --- 5. Page-flow: reserveer ruimte voor opdracht + eerste rij ---
    reserveerRuimte(state, opdrachtHoogte + 4 + RIJ_HOOGTE);
    
    // --- 6. Teken opdracht-kader ---
    tekenGeleKader(pdf, state.contentX, state.cursorY, state.contentBreedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(item.niveau)
    });
    state.cursorY += opdrachtHoogte + 4;
    
    // --- 7. Teken alle woord-rijen ---
    for (let i = 0; i < rijen.length; i++) {
      const rij = rijen[i];
      
      if (i > 0) reserveerRuimte(state, RIJ_HOOGTE + RIJ_SPACING);
      
      const rijY = state.cursorY;
      // Begin elke rij na de perforatie-marge zodat de woorden niet 
      // helemaal aan de linkerrand staan (anders zouden perforator-gaten 
      // door de letters gaan)
      let curX = state.contentX + PERFORATIE_MARGE;
      
      // Plaatje (indien aan)
      if (metPlaatje && rij.woordObj && rij.woordObj.categorie) {
        const plaatjeHoogte = RIJ_HOOGTE - 4;
        const plaatjeY = rijY + (RIJ_HOOGTE - plaatjeHoogte) / 2;
        tekenAfbeelding(pdf, curX, plaatjeY, plaatjeHoogte, rij.woordObj, {
          maxBreedte: PLAATJE_BREEDTE
        });
      }
      curX += PLAATJE_BREEDTE + PLAATJE_SPACING;
      
      // Woord-tekst (links uitgelijnd, verticaal gecentreerd)
      const tekstY = rijY + RIJ_HOOGTE / 2 + 1.5;
      tekenTekst(pdf, curX, tekstY, rij.tonen, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST,
        vet: true
      });
      curX += WOORD_BREEDTE + WOORD_SPACING;
      
      // 3 schrijflijntjes
      const lijnTopY = rijY + (RIJ_HOOGTE - SCHRIJFLIJN_HOOGTE) / 2;
      for (let j = 0; j < 3; j++) {
        const lijnX = curX + j * (LIJN_BREEDTE + LIJN_SPACING);
        
        // Bij oplossingen: woord op baseline
        if (rij.antwoord) {
          tekenTekst(pdf, lijnX + 2, lijnTopY + 2 * L - 0.5, rij.antwoord, {
            size: 13,
            kleur: KLEUR_TEKST
          });
        }
        tekenSchrijflijn(pdf, lijnX, lijnTopY, LIJN_BREEDTE, lijntype, lijnhoogte);
      }
      
      state.cursorY += RIJ_HOOGTE + RIJ_SPACING;
    }
    
    // Spacing onder de oefening
    state.cursorY += 6;
  }
  
  /* Stub-renderer: tekent gele opdracht-kader + placeholder-tekst.
     Per OV later vervangen door echte rendering. */
  function _tekenStubOV(state, item, ovId) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Stappen ophalen uit live preview-DOM (het item bestaat al in de DOM)
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    let stappen = ["Opdracht-tekst kon niet geladen worden."];
    if (itemEl) {
      const opdrachtStappen = _haalOpdrachtStappen(itemEl, ovId);
      if (opdrachtStappen.length > 0) stappen = opdrachtStappen;
    }
    
    // Reserveer ruimte voor gele kader (met label-rij)
    const kaderHoogte = 2 * 4 + 7 + stappen.length * 6.5;
    reserveerRuimte(state, kaderHoogte + 8);
    
    // Teken de gele kader met label "Opdracht" + sterren volgens niveau
    tekenGeleKader(pdf, x, state.cursorY, breedte, stappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(item.niveau)
    });
    state.cursorY += kaderHoogte + 4;
    
    // Placeholder voor de oefen-inhoud
    reserveerRuimte(state, 50);
    tekenKader(pdf, x, state.cursorY, breedte, 50, {
      randKleur: KLEUR_LIJN_GRIJS,
      randDikte: 0.3,
      rondeHoeken: 1
    });
    tekenTekst(pdf, x + breedte / 2, state.cursorY + 25, 
      `[ ${ovId.toUpperCase()} oefen-inhoud nog niet geïmplementeerd ]`, {
      size: 11, kleur: [150, 150, 150], gecentreerd: true
    });
    state.cursorY += 50 + 8;
  }
  
  const ovRenderers = {
    ov01: function(state, item) { tekenOV01(state, item); },
    ov02: function(state, item) { tekenOV02(state, item); },
    ov03: function(state, item) { _tekenStubOV(state, item, "ov03"); },
    ov04: function(state, item) { _tekenStubOV(state, item, "ov04"); },
    ov05: function(state, item) { _tekenStubOV(state, item, "ov05"); },
    ov06: function(state, item) { _tekenStubOV(state, item, "ov06"); },
    ov07: function(state, item) { _tekenStubOV(state, item, "ov07"); },
    ov08: function(state, item) { _tekenStubOV(state, item, "ov08"); },
    ov09: function(state, item) { _tekenStubOV(state, item, "ov09"); },
    ov10: function(state, item) { _tekenStubOV(state, item, "ov10"); },
    weekdictee: function(state, item) { _tekenStubOV(state, item, "weekdictee"); }
  };
  
  /* ==========================================================
     HOOFDFUNCTIE: download(opties)
     opties = {
       items: array van item-data,
       titel: string,
       metOplossingen: boolean,
       bestandsnaam: string (optioneel)
     }
     ========================================================== */
  
  async function download(opties) {
    // Check jsPDF beschikbaar
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("jsPDF-bibliotheek niet gevonden. Controleer of het script geladen is in index.html.");
      return;
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    });
    
    // === Pre-load alle PNG-afbeeldingen ===
    // Verzamel alle woorden met een categorie uit alle items.
    // We proberen voor élk woord een PNG te laden — als hij niet bestaat 
    // wordt dat 404 en valt het terug op emoji. Geen vlag nodig.
    const allewoorden = [];
    (opties.items || []).forEach(item => {
      const pool = [
        ...(item.actieveWoorden || []),
        ...(item.extraWoorden || []),
        ...(item.gekozenWoordenSnapshot || [])
      ];
      for (const w of pool) {
        if (w && w.tekst && w.categorie) {
          // Voeg graad toe vanuit item indien nog niet aanwezig
          if (!w.graad && !w.leerjaar && item.graad) w.graad = item.graad;
          allewoorden.push(w);
        }
      }
    });
    
    // DEBUG: laat zien wat we proberen te laden
    console.log("[PDF] Woorden met categorie (PNG-poging):", allewoorden.length);
    if (allewoorden.length > 0) {
      console.log("[PDF] Voorbeeld eerste woord:", allewoorden[0]);
      console.log("[PDF] Verwacht pad voor eerste woord:", afbeeldingPad(allewoorden[0]));
      await laadAfbeeldingen(allewoorden);
      // Log resultaten
      let geladen = 0, mislukt = 0;
      for (const w of allewoorden) {
        const pad = afbeeldingPad(w);
        if (_afbeeldingCache[pad]) geladen++;
        else mislukt++;
      }
      console.log(`[PDF] PNG's geladen: ${geladen} / niet beschikbaar (emoji-fallback): ${mislukt}`);
    } else {
      console.log("[PDF] Geen woorden met categorie gevonden. Worden er woorden gemist?");
      const eersteItem = (opties.items || [])[0];
      if (eersteItem) {
        const pool = eersteItem.actieveWoorden || eersteItem.gekozenWoordenSnapshot || [];
        if (pool.length > 0) {
          console.log("[PDF] Eerste woord-object:", JSON.stringify(pool[0], null, 2));
        }
      }
    }
    
    // State initialiseren
    const state = maakState(pdf);
    
    // Doc-header op pagina 1
    tekenDocHeader(state, opties.titel || "Mijn herhalingsbundel");
    
    // Items renderen
    const items = opties.items || [];
    for (const item of items) {
      const ovId = item.ovId || "onbekend";
      const renderer = ovRenderers[ovId];
      if (renderer) {
        renderer(state, item);
      } else {
        // Onbekende OV → stub
        _tekenStubOV(state, item, ovId);
      }
    }
    
    // Voettekst op alle pagina's
    tekenVoettekstOpAllePaginas(pdf);
    
    // Opslaan
    const bestand = opties.bestandsnaam || "herhalingsbundel.pdf";
    pdf.save(bestand);
  }
  
  /* Public API */
  return {
    download: download,
    // Test-functie: probeert één specifieke PNG te laden en logt resultaat.
    // Aanroep in browser console: window.SpellingHerhalingsbundelPDF.testPNG("bal", "mkm-a")
    testPNG: async function(woord, categorie, graad) {
      const pad = `afbeeldingen/graad${graad || 1}/${categorie}/${woord}.png`;
      console.log("=== PNG TEST ===");
      console.log("Pad:", pad);
      const result = await _laadPNG(pad);
      console.log("Resultaat:", result ? "✓ GELADEN (" + result.length + " chars)" : "✗ NIET GELADEN");
      return result;
    },
    // Helpers exposeer voor toekomstige uitbreidingen
    helpers: {
      tekenTekst,
      tekenKader,
      tekenLijn,
      tekenCheckbox,
      tekenGeleKader,
      tekenGroeneKader,
      tekenSchrijflijn,
      tekenEmoji,
      tekenLetterVakjes,
      reserveerRuimte,
      nieuwePagina,
      tekstHoogte
    },
    // Constanten
    constants: {
      PAGINA_BREEDTE_MM, PAGINA_HOOGTE_MM,
      MARGE_TOP_MM, MARGE_BOTTOM_MM, MARGE_LR_MM,
      WERKBARE_BREEDTE_MM, WERKBARE_HOOGTE_MM,
      FONT_FAMILIE, FONT_GROOTTE_INHOUD, FONT_GROOTTE_TITEL, FONT_GROOTTE_VOETTEKST,
      KLEUR_TEKST, KLEUR_TITEL
    }
  };

})();