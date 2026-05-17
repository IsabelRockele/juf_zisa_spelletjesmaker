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
    const cursief = opties.cursief || false;
    
    // jsPDF font-styles: "normal", "bold", "italic", "bolditalic"
    let style = "normal";
    if (vet && cursief) style = "bolditalic";
    else if (vet) style = "bold";
    else if (cursief) style = "italic";
    
    pdf.setFont(FONT_FAMILIE, style);
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
  
  /* Teken een vector-pijl (omdat Unicode-pijltjes in helvetica niet werken).
     - eenkant: enkele pijl naar rechts (→)
     - tweekant: dubbele pijl (↔)
     
     Centreert horizontaal én verticaal binnen het opgegeven blok 
     [x, y, breedte, hoogte]. */
  function tekenPijl(pdf, x, y, breedte, hoogte, opties = {}) {
    const richting = opties.richting || "rechts";  // "rechts" of "tweekant"
    const kleur = opties.kleur || KLEUR_TEKST;
    const dikte = opties.dikte || 0.5;
    const kopGrootte = opties.kopGrootte || 1.8;  // mm — lengte van pijl-kop
    
    const midY = y + hoogte / 2;
    const pijlLengte = Math.min(breedte - 2, 7);  // mm — totale lengte van de pijl
    const startX = x + (breedte - pijlLengte) / 2;
    const eindX = startX + pijlLengte;
    
    pdf.setDrawColor(kleur[0], kleur[1], kleur[2]);
    pdf.setLineWidth(dikte);
    
    // Hoofdlijn
    pdf.line(startX, midY, eindX, midY);
    
    // Rechter pijl-kop
    pdf.line(eindX, midY, eindX - kopGrootte, midY - kopGrootte * 0.7);
    pdf.line(eindX, midY, eindX - kopGrootte, midY + kopGrootte * 0.7);
    
    // Linker pijl-kop (alleen bij tweekant)
    if (richting === "tweekant") {
      pdf.line(startX, midY, startX + kopGrootte, midY - kopGrootte * 0.7);
      pdf.line(startX, midY, startX + kopGrootte, midY + kopGrootte * 0.7);
    }
  }
  
  /* ==========================================================
     HOOGNIVEAU TEKEN-HELPERS — bouwen op lage-niveau
     ========================================================== */
  
  /* Teken een gele opdracht-kader met meerdere stappen (elke met checkbox).
     Geeft de totale hoogte terug die de kader inneemt. */
  function tekenGeleKader(pdf, x, y, breedte, stappen, opties) {
    // opties: { 
    //   label: string, 
    //   aantalSterren: number,
    //   legendeKolommen: [{titel, kleur, symbool}]  // optioneel, getoond NAAST eerste stap (rechts)
    // }
    const label = opties && opties.label;
    const aantalSterren = (opties && opties.aantalSterren) || 0;
    const legendeKolommen = (opties && opties.legendeKolommen) || null;
    
    const PADDING_VERT = 4;        // mm
    const PADDING_HOR = 5;         // mm
    const REGEL_HOOGTE = 7.5;      // mm per stap (was 6.5 — iets meer adem tussen regels)
    const CHECKBOX_GROOTTE = 4;    // mm
    const LABEL_HOOGTE = (label || aantalSterren > 0) ? 7 : 0;
    const STER_HOOGTE = 5;
    
    // Geen extra rij meer voor legende — die staat naast eerste stap
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
        pdf.setFont(FONT_FAMILIE, "bold");
        pdf.setFontSize(FONT_GROOTTE_INHOUD);
        const lblBreedte = pdf.getTextWidth(label);
        lx += lblBreedte + 3;
      }
      if (aantalSterren > 0) {
        tekenSterren(pdf, lx, cy - STER_HOOGTE + 1, STER_HOOGTE, aantalSterren);
      }
      cy += LABEL_HOOGTE;
    }
    
    // Teken elke stap; legende NAAST eerste stap (rechts)
    for (let i = 0; i < stappen.length; i++) {
      const stap = stappen[i];
      // Checkbox verticaal centreren op de tekst-x-midden.
      // Voor 15pt font is x-midden ongeveer cy - 1.5mm.
      const checkboxY = cy - 1.5 - CHECKBOX_GROOTTE / 2;
      tekenCheckbox(pdf, x + PADDING_HOR, checkboxY, CHECKBOX_GROOTTE);
      tekenTekst(pdf, x + PADDING_HOR + CHECKBOX_GROOTTE + 3, cy, stap, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
      
      // Legende rechts NAAST eerste stap (op dezelfde Y)
      if (i === 0 && legendeKolommen && legendeKolommen.length > 0) {
        // Bereken waar tekst eindigt zodat we ruimte hebben rechts ervan
        pdf.setFont(FONT_FAMILIE, "normal");
        pdf.setFontSize(FONT_GROOTTE_INHOUD);
        const tekstEinde = x + PADDING_HOR + CHECKBOX_GROOTTE + 3 + pdf.getTextWidth(stap);
        
        // Compacte legende rechts; bereken benodigde breedte
        pdf.setFont(FONT_FAMILIE, "bold");
        const blokGrootte = 5;
        const blokTekstSpacing = 1.5;
        const tussenItems = 4;
        // Gebruik korte titel als beschikbaar, anders gewone titel
        const titelVoor = (kol) => kol.korteTitel || kol.titel;
        let totaalLegBreedte = 0;
        for (const kol of legendeKolommen) {
          totaalLegBreedte += blokGrootte + blokTekstSpacing + pdf.getTextWidth(titelVoor(kol)) + tussenItems;
        }
        totaalLegBreedte -= tussenItems;
        
        // Plaats legende rechts uitgelijnd
        let legX = x + breedte - PADDING_HOR - totaalLegBreedte;
        // Maar minstens 6mm afstand van de tekst houden
        if (legX < tekstEinde + 6) legX = tekstEinde + 6;
        
        for (const kol of legendeKolommen) {
          const blokY = cy - blokGrootte / 2 - 1.5;
          
          // Gekleurd blokje
          tekenKader(pdf, legX, blokY, blokGrootte, blokGrootte, {
            vulKleur: kol.kleur,
            randKleur: kol.kleur,
            rondeHoeken: 0.8
          });
          // Symbool wit in blokje als bitmap
          const sym = kol.symbool && kol.symbool.trim();
          if (sym && _BEKENDE_SYMBOLEN.has(sym)) {
            const symH = blokGrootte * 0.65;
            tekenSymboolBitmap(pdf, legX + blokGrootte * 0.18, blokY + blokGrootte / 2, symH, sym, [255, 255, 255]);
          }
          // Titel naast blokje (kort, gekleurd, vet)
          const t = titelVoor(kol);
          tekenTekst(pdf, legX + blokGrootte + blokTekstSpacing, cy, t, {
            size: FONT_GROOTTE_INHOUD,
            kleur: kol.kleur,
            vet: true
          });
          legX += blokGrootte + blokTekstSpacing + pdf.getTextWidth(t) + tussenItems;
        }
      }
      
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
  /* Teken een schrijflijn met WITTE achtergrond eronder (gebruikt in 
     gekleurde kaders zoals groene "Extra opdracht").
     Effect: de zones boven de toplijn en onder de bodemlijn blijven WIT 
     ipv de groene kader-kleur door te schijnen. De lichtblauwe x-zone 
     blijft gewoon lichtblauw. */
  function tekenSchrijflijnMetWitteAchtergrond(pdf, x, y, breedte, type, hoogteNaam) {
    let L = 5.5;
    if (hoogteNaam === "klein") L = 4.0;
    else if (hoogteNaam === "groot") L = 7.5;
    const totaalHoogte = 3 * L;
    
    // Wit kader van de volle schrijflijn-hoogte (zonder rand)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, breedte, totaalHoogte, "F");
    
    // Dan de echte schrijflijn eroverheen (die heeft zelf zijn 
    // eigen achtergrond voor de x-zone als hij erop staat)
    return tekenSchrijflijn(pdf, x, y, breedte, type, hoogteNaam);
  }
  
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
  
  /* Teken een unicode-symbool (●▬★▲◆) in een gegeven kleur als bitmap.
     Gebruikt voor klank-symbolen in OV04 — helvetica heeft deze glyphs 
     niet, maar systeem-fonts wel.
     
     Verschil met tekenEmoji: hier gebruiken we gewone fonts (geen 
     emoji-fonts) en respecteren we een gegeven kleur. */
  const _symboolCache = {};
  
  function tekenSymboolBitmap(pdf, x, y, hoogteMM, symbool, kleurRGB) {
    if (!symbool) return 0;
    
    const kleur = kleurRGB || [0, 0, 0];
    const kleurStr = `rgb(${kleur[0]},${kleur[1]},${kleur[2]})`;
    const cacheKey = symbool + ":" + Math.round(hoogteMM * 10) + ":" + kleurStr;
    
    let dataURL = _symboolCache[cacheKey];
    
    if (!dataURL) {
      const dpi = 3;
      const pxGrootte = Math.round(hoogteMM * 3.78 * dpi);
      // Vierkant canvas — symbool wordt automatisch centraal getekend
      const canvasGrootte = Math.round(pxGrootte * 1.2);
      const canvas = document.createElement("canvas");
      canvas.width = canvasGrootte;
      canvas.height = canvasGrootte;
      const ctx = canvas.getContext("2d");
      
      ctx.fillStyle = kleurStr;
      const fontPx = Math.round(canvasGrootte * 0.85);
      ctx.font = `bold ${fontPx}px "Arial Unicode MS", "DejaVu Sans", "Segoe UI Symbol", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      
      try {
        ctx.fillText(symbool, canvasGrootte / 2, canvasGrootte / 2);
      } catch (e) {
        console.warn("Symbool render fout:", symbool, e);
      }
      
      dataURL = canvas.toDataURL("image/png");
      _symboolCache[cacheKey] = dataURL;
    }
    
    // Vierkant beeld (canvas was 20% groter dan gewenste hoogte) 
    // → schaal naar hoogte * 1.2 ; centreer rond gegeven y
    const beeldGrootte = hoogteMM * 1.2;
    pdf.addImage(dataURL, "PNG", x - beeldGrootte * 0.1, y - beeldGrootte / 2, beeldGrootte, beeldGrootte);
    
    return hoogteMM;  // werkelijke ingenomen breedte (gelijk aan hoogte, exclusief canvas-padding)
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
    // Optioneel afbeelding_bestand veld voor Windows-gereserveerde namen
    // (nul, con, aux, prn, ...) of andere uitzonderingen.
    // Valt terug op {tekst}.png als afbeelding_bestand niet gezet is.
    const bestandsnaam = woord.afbeelding_bestand || `${woord.tekst}.png`;
    return `afbeeldingen/graad${graadNr}/${woord.categorie}/${bestandsnaam}`;
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
  
  function tekenDocHeader(state, titel, opties = {}) {
    const pdf = state.pdf;
    const x = state.contentX;
    let y = state.cursorY + 4;
    const gecentreerd = opties.titelGecentreerd !== false;  // default true
    
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
    
    // Bundel-titel — gecentreerd of links uitgelijnd
    if (gecentreerd) {
      const midX = x + state.contentBreedte / 2;
      tekenTekst(pdf, midX, y, titel, {
        size: FONT_GROOTTE_TITEL,
        kleur: KLEUR_TITEL,
        vet: true,
        gecentreerd: true
      });
    } else {
      tekenTekst(pdf, x, y, titel, {
        size: FONT_GROOTTE_TITEL,
        kleur: KLEUR_TITEL,
        vet: true
      });
    }
    
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
    // Selectors per OV (allemaal "*-stappen-label" voor de stappen).
    // Sommige OV's (zoals OV04) hergebruiken de OV01-klasse voor styling,
    // dus we proberen ook .ov01-stappen als fallback.
    const opdrachtBlok = itemEl.querySelector(
      `.${ovId}-stappen, .${ovId}-instructies, .ov01-stappen`
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
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
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
      // Schrijflijn EERST tekenen (de x-zone-vulling zou anders het antwoord bedekken)
      tekenSchrijflijn(pdf, x + 2, cy, breedte - 4, lijntype, lijnhoogte);
      // Bij oplossingen: woord op de EERSTE lijn, daaroverheen
      if (metOplossingen && i === 0 && cel.juistWoord) {
        // Teken het woord op base-line (lijn 3 van 4) = y + 2L
        tekenTekst(pdf, x + 3, cy + 2 * L - 0.5, cel.juistWoord, {
          size: 13,
          kleur: KLEUR_TEKST
        });
      }
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
    // Schrijflijn (witte achtergrond want in groene kader)
    tekenSchrijflijnMetWitteAchtergrond(pdf, x + 5, cy, breedte - 10, lijntype, lijnhoogte);
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
      tekenSchrijflijnMetWitteAchtergrond(pdf, kx, cy + kolomLabelHoogte, kolomBreedte, lijntype, lijnhoogte);
    });
    
    cy += kolomLabelHoogte + schrijflijnHoogte + 4;
    
    if (metOplossingen) {
      tekenTekst(pdf, x + 5, cy, "Verwacht: kind kiest een woord uit de oefening en schrijft correct meervoud + verkleinwoord. Bv. boom -> bomen -> boompje.", {
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
    
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
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
        
        // Schrijflijn EERST (de x-zone-vulling zou anders het antwoord bedekken)
        tekenSchrijflijn(pdf, lijnX, lijnTopY, LIJN_BREEDTE, lijntype, lijnhoogte);
        // Bij oplossingen: woord op baseline daaroverheen
        if (rij.antwoord) {
          tekenTekst(pdf, lijnX + 2, lijnTopY + 2 * L - 0.5, rij.antwoord, {
            size: 13,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      state.cursorY += RIJ_HOOGTE + RIJ_SPACING;
    }
    
    // Spacing onder de oefening
    state.cursorY += 6;
  }
  
  /* ==========================================================
     OV03 RENDERER — Letters door elkaar
     
     Per cel (2 cellen per rij):
     - Plaatje (alleen basis-niveau)
     - Letters in hokjes (geschudde volgorde)
     - Schrijflijn onder
     
     Niveau-specifiek:
     - basis: plaatje + hokjes + lijn
     - kern: geen plaatje + hokjes (eerste-letter-blauw) + lijn
     - verdieping: geen plaatje + hokjes + lijn (met lidwoord bij oplossingen)
     - uitbreiding: idem + extra groene kader met 2 lijntjes
     ========================================================== */
  
  function tekenOV03(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov03");
      return;
    }
    
    // --- 1. Opdracht-kader bovenaan ---
    const stappen = _haalOpdrachtStappen(itemEl, "ov03");
    const opdrachtStappen = stappen.length > 0 ? stappen : 
      ["Bekijk de letters.", "Schrijf het woord juist op de lijn."];
    
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
    // --- 2. Verzamel cel-data uit de DOM ---
    const woordPool = [
      ...(item.actieveWoorden || []),
      ...(item.extraWoorden || [])
    ];
    const woordLookup = new Map();
    woordPool.forEach(w => {
      if (w && w.tekst) woordLookup.set(w.tekst, w);
    });
    
    const cellen = [];
    itemEl.querySelectorAll(".ov03-cel").forEach(celEl => {
      const woordTekst = celEl.getAttribute("data-woord") || "";
      const woordObj = woordLookup.get(woordTekst);
      
      // Letters geschudt uit hokjes
      const hokjeEls = celEl.querySelectorAll(".ov03-hokje");
      const hokjes = [];
      hokjeEls.forEach(h => {
        hokjes.push({
          letter: h.textContent.trim(),
          blauw: h.classList.contains("ov03-hokje-blauw")
        });
      });
      
      // Antwoord (bij oplossingen): tekst uit .ov03-lijn-antwoord
      const antwoordEl = celEl.querySelector(".ov03-lijn-antwoord");
      const antwoord = antwoordEl ? antwoordEl.textContent.trim() : null;
      
      cellen.push({
        woord: woordTekst,
        woordObj: woordObj || null,
        hokjes: hokjes,
        antwoord: antwoord
      });
    });
    
    if (cellen.length === 0) {
      _tekenStubOV(state, item, "ov03");
      return;
    }
    
    // --- 3. Settings ophalen ---
    const werkbladEl = itemEl.querySelector(".werkblad.ov03-blad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "middel";
    const niveau = werkbladEl?.getAttribute("data-niveau") || "basis";
    
    const metPlaatje = (niveau === "basis");
    
    // --- 4. Bereken cel-afmetingen ---
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    
    const CELLEN_PER_RIJ = 2;
    const CEL_SPACING = 5;
    const RIJ_SPACING = 3;
    const PADDING_CEL = 4;
    
    const celBreedte = (state.contentBreedte - (CELLEN_PER_RIJ - 1) * CEL_SPACING) / CELLEN_PER_RIJ;
    
    const PLAATJE_HOOGTE = metPlaatje ? 16 : 0;
    const PLAATJE_SPACING = metPlaatje ? 3 : 0;
    const HOKJE_GROOTTE = 8;       // 8mm × 8mm hokje
    const HOKJE_SPACING = 1.5;     // mm tussen hokjes
    const HOKJES_SPACING_ONDER = 4;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    const celHoogte = 2 * PADDING_CEL 
                    + PLAATJE_HOOGTE + PLAATJE_SPACING 
                    + HOKJE_GROOTTE + HOKJES_SPACING_ONDER 
                    + SCHRIJFLIJN_HOOGTE + 2;
    
    // --- 5. Page-flow: reserveer ruimte voor opdracht + eerste rij ---
    reserveerRuimte(state, opdrachtHoogte + 4 + celHoogte);
    
    // --- 6. Teken opdracht-kader ---
    tekenGeleKader(pdf, state.contentX, state.cursorY, state.contentBreedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 4;
    
    // --- 7. Teken cellen, rij per rij ---
    for (let i = 0; i < cellen.length; i += CELLEN_PER_RIJ) {
      const rijCellen = cellen.slice(i, i + CELLEN_PER_RIJ);
      
      if (i > 0) reserveerRuimte(state, celHoogte + RIJ_SPACING);
      
      const rijY = state.cursorY;
      
      for (let idx = 0; idx < rijCellen.length; idx++) {
        const cel = rijCellen[idx];
        const celX = state.contentX + idx * (celBreedte + CEL_SPACING);
        _tekenOV03Cel(state, cel, celX, rijY, celBreedte, celHoogte, {
          niveau, metPlaatje,
          PADDING_CEL, PLAATJE_HOOGTE, PLAATJE_SPACING,
          HOKJE_GROOTTE, HOKJE_SPACING, HOKJES_SPACING_ONDER,
          SCHRIJFLIJN_HOOGTE, lijntype, lijnhoogte, L
        });
      }
      
      state.cursorY += celHoogte + RIJ_SPACING;
    }
    
    // --- 8. Uitbreidings-blok onder de cellen (alleen bij uitbreiding) ---
    if (niveau === "uitbreiding") {
      state.cursorY += 4;
      _tekenOV03UitbreidingOpdracht(state, lijntype, lijnhoogte, !!cellen[0]?.antwoord);
    }
    
    state.cursorY += 6;
  }
  
  function _tekenOV03Cel(state, cel, x, y, breedte, hoogte, cfg) {
    const pdf = state.pdf;
    
    // Cel-kader (licht grijs)
    tekenKader(pdf, x, y, breedte, hoogte, {
      randKleur: KLEUR_LIJN_GRIJS,
      randDikte: 0.3,
      rondeHoeken: 2
    });
    
    let cy = y + cfg.PADDING_CEL;
    
    // Plaatje (alleen basis)
    if (cfg.metPlaatje && cel.woordObj && cel.woordObj.categorie) {
      const plaatjeMaxBreedte = breedte - 2 * cfg.PADDING_CEL;
      const plaatjeX = x + cfg.PADDING_CEL;
      tekenAfbeelding(pdf, plaatjeX, cy, cfg.PLAATJE_HOOGTE, cel.woordObj, {
        maxBreedte: plaatjeMaxBreedte
      });
      cy += cfg.PLAATJE_HOOGTE + cfg.PLAATJE_SPACING;
    }
    
    // Letters in hokjes (gecentreerd horizontaal)
    const aantalHokjes = cel.hokjes.length;
    const totaleHokjesBreedte = aantalHokjes * cfg.HOKJE_GROOTTE + (aantalHokjes - 1) * cfg.HOKJE_SPACING;
    const hokjesStartX = x + (breedte - totaleHokjesBreedte) / 2;
    
    for (let i = 0; i < cel.hokjes.length; i++) {
      const hokje = cel.hokjes[i];
      const hokjeX = hokjesStartX + i * (cfg.HOKJE_GROOTTE + cfg.HOKJE_SPACING);
      
      // Hokje-kader
      tekenKader(pdf, hokjeX, cy, cfg.HOKJE_GROOTTE, cfg.HOKJE_GROOTTE, {
        randKleur: hokje.blauw ? [33, 150, 243] : KLEUR_TEKST,
        randDikte: hokje.blauw ? 0.7 : 0.4,
        rondeHoeken: 1
      });
      
      // Letter binnen het hokje (gecentreerd)
      tekenTekst(pdf, hokjeX + cfg.HOKJE_GROOTTE / 2, cy + cfg.HOKJE_GROOTTE / 2 + 2, hokje.letter, {
        size: 14,
        kleur: hokje.blauw ? [33, 150, 243] : KLEUR_TEKST,
        vet: true,
        gecentreerd: true
      });
    }
    cy += cfg.HOKJE_GROOTTE + cfg.HOKJES_SPACING_ONDER;
    
    // Schrijflijn onder
    const lijnX = x + cfg.PADDING_CEL;
    const lijnBreedte = breedte - 2 * cfg.PADDING_CEL;
    
    // Schrijflijn EERST (de x-zone-vulling zou anders het antwoord bedekken)
    tekenSchrijflijn(pdf, lijnX, cy, lijnBreedte, cfg.lijntype, cfg.lijnhoogte);
    // Bij oplossingen: antwoord op de baseline daaroverheen.
    // Eerste letter wordt in blauw getekend als pedagogische start-cue.
    if (cel.antwoord && cel.antwoord.length > 0) {
      const KLEUR_BLAUW = [33, 150, 243];
      const baselineY = cy + 2 * cfg.L - 0.5;
      const eersteLetter = cel.antwoord.charAt(0);
      const rest = cel.antwoord.slice(1);
      
      pdf.setFont(FONT_FAMILIE, "normal");
      pdf.setFontSize(13);
      
      // Eerste letter blauw
      tekenTekst(pdf, lijnX + 2, baselineY, eersteLetter, {
        size: 13,
        kleur: KLEUR_BLAUW
      });
      
      // Rest van het woord in zwart, direct ernaast
      if (rest) {
        const eersteBreedte = pdf.getTextWidth(eersteLetter);
        tekenTekst(pdf, lijnX + 2 + eersteBreedte, baselineY, rest, {
          size: 13,
          kleur: KLEUR_TEKST
        });
      }
    }
  }
  
  /* OV03 uitbreidings-opdracht: groene kader met 2 schrijflijntjes */
  function _tekenOV03UitbreidingOpdracht(state, lijntype, lijnhoogte, metOplossingen) {
    const pdf = state.pdf;
    
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    const schrijflijnHoogte = 3 * L;
    
    const titelHoogte = 7;
    const vraagHoogte = 8;
    // 2 schrijflijntjes NAAST elkaar (een woord is kort, geen reden voor 
    // 2 volle paginabrede lijnen onder elkaar)
    // Bottom-padding 8mm zodat de rode onderlijn van de schrijflijn 
    // niet tegen de groene kader-rand aan komt
    const blokHoogte = 4 + titelHoogte + vraagHoogte + schrijflijnHoogte + (metOplossingen ? 8 : 0) + 8;
    
    reserveerRuimte(state, blokHoogte + 4);
    
    const x = state.contentX;
    const y = state.cursorY;
    const breedte = state.contentBreedte;
    
    tekenKader(pdf, x, y, breedte, blokHoogte, {
      vulKleur: KLEUR_GROEN_VUL,
      randKleur: KLEUR_GROEN_RAND,
      randDikte: 0.7,
      rondeHoeken: 2
    });
    
    let cy = y + 7;
    tekenTekst(pdf, x + 5, cy, "Extra opdracht (uitbreiden):", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true
    });
    cy += titelHoogte;
    tekenTekst(pdf, x + 5, cy, "Bedenk zelf nog 2 woorden en schrijf het lidwoord (de of het) erbij.", {
      size: 13,
      kleur: KLEUR_TEKST,
      maxBreedte: breedte - 10
    });
    cy += vraagHoogte;
    
    // 2 schrijflijntjes naast elkaar (elk halve breedte met 5mm spacing tussen)
    const LIJN_SPACING_TUSSEN = 5;
    const lijnBreedte = (breedte - 10 - LIJN_SPACING_TUSSEN) / 2;
    tekenSchrijflijnMetWitteAchtergrond(pdf, x + 5, cy, lijnBreedte, lijntype, lijnhoogte);
    tekenSchrijflijnMetWitteAchtergrond(pdf, x + 5 + lijnBreedte + LIJN_SPACING_TUSSEN, cy, lijnBreedte, lijntype, lijnhoogte);
    cy += schrijflijnHoogte + 2;
    
    if (metOplossingen) {
      tekenTekst(pdf, x + 5, cy + 3, "Verwacht: 2 eigen woorden van dezelfde soort, met lidwoord (de/het) ervoor.", {
        size: 10,
        kleur: [100, 100, 100],
        maxBreedte: breedte - 10
      });
    }
    
    state.cursorY = y + blokHoogte;
  }
  
  /* ==========================================================
     OV04 RENDERER — Categoriseren op klank
     
     Structuur (bovenaan tot onderaan):
     1. Gele opdracht-kader (met sterren)
     2. Legende-strook met kleurblokjes per kolom
     3. Woordenlijst met klank-hints (niet bij uitbreiding)
     4. Sorteer-kolommen (2-3 verticaal met gekleurde header + lijnen)
     5. Bij uitbreiding: 3 zin-schrijflijnen in groene kader
     ========================================================== */
  
  function tekenOV04(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov04");
      return;
    }
    
    // OV04 is een groot werkblad — start op een nieuwe pagina als er al 
    // andere oefeningen op de huidige pagina staan. Het eerste item van de 
    // bundel begint gewoon na de doc-header.
    if (state.itemIndex > 0) {
      nieuwePagina(state);
    }
    
    // --- 1. Opdracht-kader ---
    const stappen = _haalOpdrachtStappen(itemEl, "ov04");
    const opdrachtStappen = stappen.length > 0 ? stappen :
      ["Bekijk de woorden.", "Schrijf elk woord in de juiste kolom."];
    
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
    // --- 2. Settings + niveau ---
    const werkbladEl = itemEl.querySelector(".werkblad.ov04-blad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "klein";
    const niveau = werkbladEl?.getAttribute("data-niveau") || "basis";
    
    // --- 3. Verzamel kolom-info uit legende ---
    // De .ov04-legende-item bevat per kolom: kleur + titel
    const kolommen = [];
    itemEl.querySelectorAll(".ov04-legende-item").forEach(legEl => {
      const kleurEl = legEl.querySelector(".ov04-legende-kleur");
      const titelEl = legEl.querySelector(".ov04-legende-tekst");
      if (!kleurEl || !titelEl) return;
      
      const kleurStr = kleurEl.style.background || kleurEl.style.backgroundColor || "#888";
      const symbool = _veiligSymbool(kleurEl.textContent.trim());
      const titel = titelEl.textContent.trim();
      
      kolommen.push({
        titel: titel,
        korteTitel: _korteTitel(titel),  // verkorte versie voor compacte legende-rij
        kleur: _parseKleur(kleurStr),
        symbool: symbool
      });
    });
    
    if (kolommen.length === 0) {
      _tekenStubOV(state, item, "ov04");
      return;
    }
    
    // --- 4. Verzamel woordenlijst (niet bij uitbreiding) ---
    const woordenVoorLijst = [];
    itemEl.querySelectorAll(".ov04-woorden-lijst .ov04-woord").forEach(wEl => {
      // Per woord: array van { tekst, kleur, isStreepjes }
      const stukjes = [];
      wEl.childNodes.forEach(node => {
        if (node.nodeType === 3) {
          // text node
          if (node.textContent) stukjes.push({ tekst: node.textContent, kleur: null });
        } else if (node.nodeType === 1) {
          // element
          if (node.classList.contains("ov04-symbool")) {
            // Vervang unicode symbolen door veilige tekens (helvetica heeft 
            // geen ●▬★ glyphs). De kleur duidt de klank-soort al aan.
            const ruweSymbool = node.textContent;
            const veiligSymbool = _veiligSymbool(ruweSymbool);
            stukjes.push({
              tekst: veiligSymbool,
              kleur: _parseKleur(node.style.color || "#000")
            });
          } else if (node.classList.contains("ov04-streepjes")) {
            stukjes.push({
              tekst: node.textContent,
              kleur: null,
              isStreepjes: true
            });
          } else {
            stukjes.push({ tekst: node.textContent, kleur: null });
          }
        }
      });
      woordenVoorLijst.push(stukjes);
    });
    
    // Titel boven de woordenlijst (uit DOM)
    const woordenTitel = itemEl.querySelector(".ov04-woorden-titel")?.textContent.trim() || "";
    
    // Detecteer of er IETS in de woorden staat dat een legende-symbool 
    // rechtvaardigt (gekleurd symbool, of streepjes). Zo niet (woorden zijn 
    // gewoon voluit) → symbool in legende-blokje weghalen, want overbodig.
    const heeftHints = woordenVoorLijst.some(stukjes => 
      stukjes.some(s => s.kleur || s.isStreepjes)
    );
    if (!heeftHints) {
      kolommen.forEach(k => k.symbool = "");
    }
    
    // --- 5. Aantal lijntjes per kolom ---
    let aantalLijnenPerKolom;
    if (niveau === "verdieping") aantalLijnenPerKolom = 6;
    else if (niveau === "uitbreiding") aantalLijnenPerKolom = 5;
    else aantalLijnenPerKolom = Math.ceil((woordenVoorLijst.length / kolommen.length) + 1);
    
    // --- 6. Bereken hoogte van alles ---
    let L = 4.0;  // klein default
    if (lijnhoogte === "middel") L = 5.5;
    else if (lijnhoogte === "groot") L = 7.5;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    // Legende tonen bij alle niveaus behalve uitbreiding (waar er geen 
    // woordenlijst is). Legende komt nu NAAST de eerste stap in de gele 
    // kader, dus geen extra hoogte nodig.
    const toonLegende = niveau !== "uitbreiding";
    
    const opdrachtHoogteMetLegende = opdrachtHoogte;
    
    const WOORDENTITEL_HOOGTE = woordenTitel ? 7 : 0;
    const WOORDENLIJST_RIJ_HOOGTE = 11;
    const woordRijen = woordenVoorLijst.length > 0 ? Math.ceil(woordenVoorLijst.length / 5) : 0;
    const WOORDENLIJST_HOOGTE = woordRijen * WOORDENLIJST_RIJ_HOOGTE;
    const WOORDENLIJST_SPACING = woordenVoorLijst.length > 0 ? 4 : 0;
    
    const KOLOM_HEADER_HOOGTE = 8;
    const KOLOM_LIJN_SPACING = 2;
    const KOLOM_INHOUD_HOOGTE = aantalLijnenPerKolom * (SCHRIJFLIJN_HOOGTE + KOLOM_LIJN_SPACING);
    const KOLOMMEN_HOOGTE = KOLOM_HEADER_HOOGTE + 3 + KOLOM_INHOUD_HOOGTE + 4;
    
    // --- 7. Page-flow ---
    const minHoogte = opdrachtHoogteMetLegende + 4 
                    + WOORDENTITEL_HOOGTE + WOORDENLIJST_HOOGTE + WOORDENLIJST_SPACING
                    + Math.min(KOLOMMEN_HOOGTE, 40);
    reserveerRuimte(state, minHoogte);
    
    // --- 8. Teken opdracht-kader (met legende-rij geïntegreerd) ---
    tekenGeleKader(pdf, state.contentX, state.cursorY, state.contentBreedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau),
      legendeKolommen: toonLegende ? kolommen : null
    });
    state.cursorY += opdrachtHoogteMetLegende + 4;
    
    // --- 9. Teken woordenlijst (indien aanwezig) ---
    if (woordenVoorLijst.length > 0) {
      if (woordenTitel) {
        tekenTekst(pdf, state.contentX, state.cursorY + 4, woordenTitel, {
          size: 15,
          kleur: KLEUR_TEKST,
          vet: true,
          maxBreedte: state.contentBreedte
        });
        state.cursorY += WOORDENTITEL_HOOGTE;
      }
      _tekenOV04Woordenlijst(state, woordenVoorLijst);
      state.cursorY += WOORDENLIJST_SPACING;
    }
    
    // --- 10. Teken sorteer-kolommen ---
    _tekenOV04Kolommen(state, kolommen, aantalLijnenPerKolom, lijntype, lijnhoogte, L, niveau, woordenVoorLijst, itemEl);
    
    // --- 11. Bij uitbreiding: 3 zin-schrijflijnen in groene kader ---
    if (niveau === "uitbreiding") {
      state.cursorY += 4;
      _tekenOV04Zinnen(state, lijntype, lijnhoogte, L);
    }
    
    state.cursorY += 6;
  }
  
  /* Geef originele symbool terug (voor renderen via bitmap).
     Filtert alleen ongeldige (mogelijke control-chars) eruit. */
  function _veiligSymbool(symbool) {
    if (!symbool) return "";
    return symbool.trim();
  }
  
  /* Verkort lange titel-strings voor compacte legende.
     "Korte klank" → "Kort", "Lange klank" → "Lang", "Andere klank" → "Ander".
     Titels van 1-3 tekens (zoals "ei", "ij", "au", "ou") blijven gewoon zoals ze zijn. */
  function _korteTitel(titel) {
    if (!titel) return "";
    const map = {
      "Korte klank": "Kort",
      "Lange klank": "Lang",
      "Andere klank": "Ander"
    };
    if (map[titel]) return map[titel];
    // Algemene regel: als titel eindigt op " klank", knip dat eraf
    return titel.replace(/\s+klank$/i, "");
  }
  
  /* Lijst van bekende klank-symbolen — deze worden via bitmap-rendering 
     getekend ipv als tekst (helvetica heeft deze glyphs niet). */
  const _BEKENDE_SYMBOLEN = new Set(["●", "▬", "★", "■", "▲", "▼", "◆", "♦", "♥", "○"]);
  
  /* Parse CSS-kleurstring "#abc123" of "rgb(r,g,b)" naar [r,g,b] */
  function _parseKleur(str) {
    if (!str) return [0, 0, 0];
    str = str.trim();
    if (str.startsWith("#")) {
      let hex = str.slice(1);
      if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return [r, g, b];
    }
    const m = str.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    return [100, 100, 100];
  }
  
  function _tekenOV04Legende(state, kolommen, hoogte) {
    const pdf = state.pdf;
    const x = state.contentX;
    const y = state.cursorY;
    const breedte = state.contentBreedte;
    
    // Verdeel breedte gelijkmatig over de kolommen
    const itemBreedte = (breedte - (kolommen.length - 1) * 4) / kolommen.length;
    
    for (let i = 0; i < kolommen.length; i++) {
      const kol = kolommen[i];
      const itemX = x + i * (itemBreedte + 4);
      
      // Gekleurd blokje links (5×5mm met evt. symbool)
      const blokGrootte = 6;
      const blokY = y + (hoogte - blokGrootte) / 2;
      tekenKader(pdf, itemX, blokY, blokGrootte, blokGrootte, {
        vulKleur: kol.kleur,
        randKleur: kol.kleur,
        rondeHoeken: 1
      });
      // Symbool in het blokje als bitmap (wit op gekleurde achtergrond)
      const sym = kol.symbool && kol.symbool.trim();
      if (sym && _BEKENDE_SYMBOLEN.has(sym)) {
        const symH = blokGrootte * 0.7;
        const symW = symH * 0.7;
        const symX = itemX + (blokGrootte - symW) / 2;
        const symY = blokY + blokGrootte / 2;
        tekenSymboolBitmap(pdf, symX, symY, symH, sym, [255, 255, 255]);
      }
      
      // Titel rechts ernaast (vet)
      tekenTekst(pdf, itemX + blokGrootte + 3, y + hoogte / 2 + 1.5, kol.titel, {
        size: 15,
        kleur: kol.kleur,
        vet: true
      });
    }
    
    state.cursorY += hoogte;
  }
  
  function _tekenOV04Woordenlijst(state, woorden) {
    const pdf = state.pdf;
    const x = state.contentX;
    const y = state.cursorY;
    const breedte = state.contentBreedte;
    
    // Layout: woorden naast elkaar, wrap naar nieuwe regel als nodig.
    // Elk woord krijgt een lichtgrijs "pil"-achtergrond zodat het visueel scheidbaar is.
    const WOORD_PADDING_HOR = 4;
    const WOORD_PADDING_VERT = 2;
    const WOORD_SPACING = 4;
    const REGEL_HOOGTE = 11;
    const FONT = 15;
    
    let curX = x;
    let curY = y + 5;
    
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT);
    
    // Symbool-rendering: vierkante bitmap, hoogte ≈ x-hoogte van letter
    const SYMBOOL_HOOGTE = 5.0;
    const SYMBOOL_AR = 1.0;
    const SYMBOOL_BREEDTE = SYMBOOL_HOOGTE * SYMBOOL_AR;
    const SYMBOOL_PAD = 1.0;
    
    // Helper: bereken breedte van één stukje (in mm)
    const stukBreedte = (s) => {
      const isSym = s.kleur && _BEKENDE_SYMBOLEN.has(s.tekst.trim());
      if (isSym) {
        return SYMBOOL_BREEDTE + 2 * SYMBOOL_PAD;
      }
      return pdf.getTextWidth(s.tekst);
    };
    
    for (const stukjes of woorden) {
      // Bereken totale breedte van dit woord
      let woordBreedte = 0;
      for (const s of stukjes) {
        woordBreedte += stukBreedte(s);
      }
      const totaleBreedte = woordBreedte + 2 * WOORD_PADDING_HOR;
      
      // Wrap naar volgende regel?
      if (curX + totaleBreedte > x + breedte) {
        curX = x;
        curY += REGEL_HOOGTE;
      }
      
      // Lichtgrijs pil-kader
      tekenKader(pdf, curX, curY - REGEL_HOOGTE / 2 + 1, totaleBreedte, REGEL_HOOGTE - 2, {
        vulKleur: [245, 245, 248],
        randKleur: [220, 220, 225],
        randDikte: 0.3,
        rondeHoeken: 1.5
      });
      
      // Teken stukjes naast elkaar
      let stukX = curX + WOORD_PADDING_HOR;
      const stukY = curY + 1.5;
      // Verticaal midden voor bitmap-symbolen: midden van x-hoogte van letter.
      // Voor font 15pt zit x-midden ongeveer op baseline - 1.4mm.
      const stukYCenter = stukY - 1.4;
      
      for (const s of stukjes) {
        const isSym = s.kleur && _BEKENDE_SYMBOLEN.has(s.tekst.trim());
        if (isSym) {
          // Bitmap-symbool (gekleurd)
          const symX = stukX + SYMBOOL_PAD;
          tekenSymboolBitmap(pdf, symX, stukYCenter, SYMBOOL_HOOGTE, s.tekst.trim(), s.kleur);
          stukX += SYMBOOL_BREEDTE + 2 * SYMBOOL_PAD;
        } else {
          // Gewone tekst
          tekenTekst(pdf, stukX, stukY, s.tekst, {
            size: FONT,
            kleur: s.kleur || KLEUR_TEKST,
            vet: !!s.kleur
          });
          stukX += pdf.getTextWidth(s.tekst);
        }
      }
      
      curX += totaleBreedte + WOORD_SPACING;
    }
    
    state.cursorY = curY + 4;
  }
  
  function _tekenOV04Kolommen(state, kolommen, aantalLijnen, lijntype, lijnhoogte, L, niveau, woordenVoorLijst, itemEl) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    const KOLOM_SPACING = 4;
    const kolomBreedte = (breedte - (kolommen.length - 1) * KOLOM_SPACING) / kolommen.length;
    const KOLOM_HEADER_H = 8;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    const LIJN_SPACING = 2;
    const KOLOM_INHOUD_H = aantalLijnen * (SCHRIJFLIJN_HOOGTE + LIJN_SPACING);
    // header (incl. extra 2mm) + spacing + inhoud + bottom-padding (5mm 
    // zodat onderste schrijflijn niet tegen kader-rand aan komt)
    const KOLOM_TOTAAL_H = (KOLOM_HEADER_H + 2) + 3 + KOLOM_INHOUD_H + 5;
    
    // Reserveer ruimte voor alle kolommen
    reserveerRuimte(state, KOLOM_TOTAAL_H);
    
    const startY = state.cursorY;
    
    // Bij oplossingen: woorden per kolom verzamelen uit de DOM
    let woordenPerKolom = null;
    if (woordenVoorLijst.length > 0) {
      woordenPerKolom = [];
      itemEl.querySelectorAll(".ov04-kolom").forEach(kolEl => {
        const antwoorden = [];
        kolEl.querySelectorAll(".ov04-lijn-antwoord").forEach(a => {
          antwoorden.push(a.textContent.trim());
        });
        woordenPerKolom.push(antwoorden);
      });
    }
    
    for (let i = 0; i < kolommen.length; i++) {
      const kol = kolommen[i];
      const kx = x + i * (kolomBreedte + KOLOM_SPACING);
      
      // Volledig kolom-kader (grijze rand rond inhoud + header) zodat de 
      // kolommen visueel goed van elkaar gescheiden zijn
      tekenKader(pdf, kx, startY, kolomBreedte, KOLOM_TOTAAL_H, {
        randKleur: kol.kleur,
        randDikte: 0.6,
        rondeHoeken: 2
      });
      
      // Header (gekleurde balk met titel) — boven in de kolom
      tekenKader(pdf, kx, startY, kolomBreedte, KOLOM_HEADER_H + 2, {
        vulKleur: kol.kleur,
        randKleur: kol.kleur,
        rondeHoeken: 2
      });
      tekenTekst(pdf, kx + kolomBreedte / 2, startY + (KOLOM_HEADER_H + 2) / 2 + 2, kol.titel, {
        size: 15,
        kleur: [255, 255, 255],
        vet: true,
        gecentreerd: true
      });
      
      // Schrijflijnen onder de header
      let lijnY = startY + KOLOM_HEADER_H + 2 + 3;
      const lijnX = kx + 2;
      const lijnBreedte = kolomBreedte - 4;
      
      for (let j = 0; j < aantalLijnen; j++) {
        // Schrijflijn EERST (de x-zone-vulling zou anders het antwoord bedekken)
        tekenSchrijflijn(pdf, lijnX, lijnY, lijnBreedte, lijntype, lijnhoogte);
        // Antwoord bij oplossingen, daaroverheen
        if (woordenPerKolom && woordenPerKolom[i] && woordenPerKolom[i][j]) {
          tekenTekst(pdf, lijnX + 2, lijnY + 2 * L - 0.5, woordenPerKolom[i][j], {
            size: 15,
            kleur: KLEUR_TEKST
          });
        }
        lijnY += SCHRIJFLIJN_HOOGTE + LIJN_SPACING;
      }
    }
    
    state.cursorY = startY + KOLOM_TOTAAL_H;
  }
  
  function _tekenOV04Zinnen(state, lijntype, lijnhoogte, L) {
    const pdf = state.pdf;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    const titelHoogte = 7;
    const lijnSpacing = 2;
    const aantalLijnen = 3;
    const blokHoogte = 4 + titelHoogte + aantalLijnen * SCHRIJFLIJN_HOOGTE + (aantalLijnen - 1) * lijnSpacing + 8;
    
    reserveerRuimte(state, blokHoogte + 4);
    
    const x = state.contentX;
    const y = state.cursorY;
    const breedte = state.contentBreedte;
    
    tekenKader(pdf, x, y, breedte, blokHoogte, {
      vulKleur: KLEUR_GROEN_VUL,
      randKleur: KLEUR_GROEN_RAND,
      randDikte: 0.7,
      rondeHoeken: 2
    });
    
    let cy = y + 7;
    tekenTekst(pdf, x + 5, cy, "Maak 3 zinnen, elk met een woord uit een andere kolom:", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true
    });
    cy += titelHoogte;
    
    for (let i = 0; i < aantalLijnen; i++) {
      tekenSchrijflijnMetWitteAchtergrond(pdf, x + 5, cy, breedte - 10, lijntype, lijnhoogte);
      cy += SCHRIJFLIJN_HOOGTE + lijnSpacing;
    }
    
    state.cursorY = y + blokHoogte;
  }
  
  /* ==========================================================
     OV05 — KLANK KIEZEN (hele-woord keuze)
     
     Layout (zoals preview): grid van KAARTEN.
     Per kaart, van boven naar beneden:
       1. Plaatje (camera-emoji of PNG)              — als metPlaatje
       2. Rij keuze-hokjes (2 of 3 hele woorden)     — basis & kern
       3. Schrijflijn (evt. met prefix-hint links)    — alle niveaus
     
     Aantal kaarten per rij:
       basis/kern:    3 per rij (compacte hokjes)
       verdieping:    3 per rij (geen hokjes → meer breedte voor lijn)
       uitbreiding:   2 per rij (langere lijnen) + zin-blok onderaan
     
     Bij oplossingen: juiste keuze krijgt groene rand+vet, antwoord
     verschijnt op de schrijflijn.
     ========================================================== */
  
  function tekenOV05(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov05");
      return;
    }
    
    // --- 1. Settings + niveau ---
    const werkbladEl = itemEl.querySelector(".werkblad.ov05-blad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "middel";
    const niveau = werkbladEl?.getAttribute("data-niveau") || item.niveau || "basis";
    const metOplossingen = item.metAntwoorden === true;
    
    let L = 4.0;
    if (lijnhoogte === "middel") L = 5.5;
    else if (lijnhoogte === "groot") L = 7.5;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    // --- 2. Opdracht-stappen ---
    const stappen = _haalOpdrachtStappen(itemEl, "ov05");
    const opdrachtStappen = stappen.length > 0 ? stappen :
      ["Kies het juiste woord.", "Schrijf het op de lijn."];
    
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
    // --- 3. Bouw lookup-tabel van woord-tekst → woord-object ---
    // We hebben dit nodig om tekenAfbeelding aan te kunnen roepen
    // (die wil een woord-object met categorie, niet alleen een string).
    const woordLookup = new Map();
    const allePools = [
      ...(item.actieveWoorden || []),
      ...(item.extraWoorden || []),
      ...(item.gekozenWoordenSnapshot || [])
    ];
    for (const w of allePools) {
      if (w && w.tekst && !woordLookup.has(w.tekst)) {
        // graad meegeven indien nog niet aanwezig
        if (!w.graad && !w.leerjaar && item.graad) w.graad = item.graad;
        woordLookup.set(w.tekst, w);
      }
    }
    
    // --- 4. Verzamel kaart-data uit DOM ---
    const kaarten = [];
    itemEl.querySelectorAll(".ov05-rij").forEach(rijEl => {
      const woordAttr = rijEl.getAttribute("data-woord") || "";
      const woordObj = woordLookup.get(woordAttr) || { tekst: woordAttr };
      const plaatjeEl = rijEl.querySelector(".ov05-plaatje");
      const metPlaatje = !!plaatjeEl;  // expliciete plaatje-cel = wel plaatje
      
      // Keuze-hokjes (basis/kern)
      const keuzes = [];
      rijEl.querySelectorAll(".ov05-keuze-hokje").forEach(hEl => {
        keuzes.push({
          tekst: hEl.textContent.trim(),
          isJuist: hEl.classList.contains("ov05-keuze-juist")
        });
      });
      
      // Prefix + antwoord (werkwoorden met prefix als hint)
      const prefixEl = rijEl.querySelector(".ov05-lijn-prefix");
      const antwoordEl = rijEl.querySelector(".ov05-lijn-antwoord");
      const prefix = prefixEl ? prefixEl.textContent.trim() : "";
      const antwoord = antwoordEl ? antwoordEl.textContent.trim() : woordAttr;
      
      kaarten.push({ 
        woord: woordAttr, 
        woordObj, 
        metPlaatje, 
        keuzes, 
        prefix, 
        antwoord 
      });
    });
    
    if (kaarten.length === 0) {
      _tekenStubOV(state, item, "ov05");
      return;
    }
    
    // --- 5. Layout-parameters ---
    // Altijd 3 kaarten per rij — alle niveaus tonen een plaatje als 
    // referentie zodat het kind weet welk woord moet komen.
    const KAARTEN_PER_RIJ = 3;
    const KAART_SPACING = 4;     // mm tussen kaarten horizontaal
    const RIJ_SPACING = 4;       // mm tussen rij-en kaarten verticaal
    
    const kaartBreedte = (state.contentBreedte - (KAARTEN_PER_RIJ - 1) * KAART_SPACING) / KAARTEN_PER_RIJ;
    
    // Bereken kaart-hoogte op basis van wat erin moet
    const PAD_KAART = 4;         // mm padding binnen kaart
    const PLAATJE_HOOGTE = 12;   // mm — camera-emoji of PNG
    const PLAATJE_SPACING_ONDER = 2.5;
    const HOKJES_HOOGTE = 7.5;   // mm
    const HOKJES_SPACING_ONDER = 3;
    const PREFIX_HOOGTE = 5;     // mm voor prefix-label boven schrijflijn
    
    // Plaatje voor ALLE niveaus tonen — kind moet weten welk woord erbij hoort.
    // Bij kern volgen we wat de DOM zegt (instelling in zijbalk); bij de 
    // andere niveaus geldt: als de kaart een plaatje-cel heeft, tekenen we hem.
    const heeftPlaatje = kaarten.some(k => k.metPlaatje);
    const heeftHokjes = (niveau === "basis" || niveau === "kern");
    const heeftPrefix = kaarten.some(k => k.prefix);
    
    let kaartHoogte = 2 * PAD_KAART;
    if (heeftPlaatje) kaartHoogte += PLAATJE_HOOGTE + PLAATJE_SPACING_ONDER;
    if (heeftHokjes) kaartHoogte += HOKJES_HOOGTE + HOKJES_SPACING_ONDER;
    if (heeftPrefix) kaartHoogte += PREFIX_HOOGTE;
    kaartHoogte += SCHRIJFLIJN_HOOGTE;
    
    // --- 6. Reserveer ruimte voor opdracht + min. 1 rij kaarten + (evt.) zin-blok ---
    const ZIN_BLOK_HOOGTE = niveau === "uitbreiding" 
      ? (4 + 7 + 6 + 2 + SCHRIJFLIJN_HOOGTE + (metOplossingen ? 8 : 0) + 6) 
      : 0;
    
    const minHoogte = opdrachtHoogte + 4 
                    + kaartHoogte + RIJ_SPACING
                    + (ZIN_BLOK_HOOGTE > 0 ? ZIN_BLOK_HOOGTE + 6 : 0);
    reserveerRuimte(state, minHoogte);
    
    // --- 7. Teken opdracht-kader ---
    tekenGeleKader(pdf, state.contentX, state.cursorY, state.contentBreedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 4;
    
    // --- 8. Teken kaarten in rijen ---
    for (let i = 0; i < kaarten.length; i += KAARTEN_PER_RIJ) {
      const rijKaarten = kaarten.slice(i, i + KAARTEN_PER_RIJ);
      
      if (i > 0) reserveerRuimte(state, kaartHoogte + RIJ_SPACING);
      
      const rijY = state.cursorY;
      
      for (let idx = 0; idx < rijKaarten.length; idx++) {
        const kaart = rijKaarten[idx];
        const kaartX = state.contentX + idx * (kaartBreedte + KAART_SPACING);
        
        _tekenOV05Kaart(state, kaart, kaartX, rijY, kaartBreedte, kaartHoogte, {
          niveau, metOplossingen, lijntype, lijnhoogte, L,
          PAD_KAART, PLAATJE_HOOGTE, PLAATJE_SPACING_ONDER,
          HOKJES_HOOGTE, HOKJES_SPACING_ONDER, PREFIX_HOOGTE,
          SCHRIJFLIJN_HOOGTE,
          heeftPlaatje, heeftHokjes, heeftPrefix
        });
      }
      
      state.cursorY += kaartHoogte + RIJ_SPACING;
    }
    
    // --- 9. Bij uitbreiding: zin-blok in groene kader ---
    if (niveau === "uitbreiding") {
      state.cursorY += 2;
      _tekenOV05ZinBlok(state, lijntype, lijnhoogte, L, metOplossingen);
    }
    
    state.cursorY += 6;
  }
  
  /* Teken één kaart voor OV05.
     Layout binnen kaart (van boven naar beneden):
       - Plaatje (gecentreerd)                        — als heeftPlaatje
       - Rij keuze-hokjes (gecentreerd)               — als heeftHokjes
       - Prefix-label (links)                         — als heeftPrefix + deze kaart heeft prefix
       - Schrijflijn (vol-breed binnen kaart)
  */
  function _tekenOV05Kaart(state, kaart, x, y, breedte, hoogte, cfg) {
    const pdf = state.pdf;
    
    // Kaart-kader (licht grijs zoals OV03-cellen)
    tekenKader(pdf, x, y, breedte, hoogte, {
      randKleur: KLEUR_LIJN_GRIJS,
      randDikte: 0.3,
      rondeHoeken: 2
    });
    
    let cy = y + cfg.PAD_KAART;
    const innerX = x + cfg.PAD_KAART;
    const innerBreedte = breedte - 2 * cfg.PAD_KAART;
    
    // --- 1. Plaatje (gecentreerd) ---
    if (cfg.heeftPlaatje && kaart.metPlaatje && kaart.woordObj && kaart.woordObj.categorie) {
      tekenAfbeelding(pdf, innerX, cy, cfg.PLAATJE_HOOGTE, kaart.woordObj, {
        maxBreedte: innerBreedte
      });
      cy += cfg.PLAATJE_HOOGTE + cfg.PLAATJE_SPACING_ONDER;
    } else if (cfg.heeftPlaatje) {
      // Reserveer toch de hoogte zodat schrijflijnen op één lijn liggen 
      // met andere kaarten in dezelfde rij (visueel rustiger)
      cy += cfg.PLAATJE_HOOGTE + cfg.PLAATJE_SPACING_ONDER;
    }
    
    // --- 2. Keuze-hokjes (gecentreerd) ---
    if (cfg.heeftHokjes && kaart.keuzes && kaart.keuzes.length > 0) {
      const HOKJE_FONT_SIZE = 11;   // klein genoeg zodat 3 hokjes met 5-letter 
                                    // woorden (preis/pries/prijs) ook nog passen
      const HOKJE_PAD = 1.8;        // mm horizontale padding binnen hokje
      const HOKJE_SPACING = 1.5;    // mm tussen hokjes
      
      pdf.setFont(FONT_FAMILIE, "normal");
      pdf.setFontSize(HOKJE_FONT_SIZE);
      
      // Bereken totale breedte van alle hokjes om te kunnen centreren
      const hokjeBreedtes = kaart.keuzes.map(k => 
        pdf.getTextWidth(k.tekst) + 2 * HOKJE_PAD
      );
      const totaleHokjesBreedte = hokjeBreedtes.reduce((s, w) => s + w, 0) 
                                + (kaart.keuzes.length - 1) * HOKJE_SPACING;
      
      // Centreren binnen de kaart
      let hokjeX = innerX + Math.max(0, (innerBreedte - totaleHokjesBreedte) / 2);
      
      for (let k = 0; k < kaart.keuzes.length; k++) {
        const keuze = kaart.keuzes[k];
        const hokjeBreedte = hokjeBreedtes[k];
        const isJuistGetoond = cfg.metOplossingen && keuze.isJuist;
        
        // Hokje-kader (groene vulling+rand bij juiste keuze in oplossingen)
        tekenKader(pdf, hokjeX, cy, hokjeBreedte, cfg.HOKJES_HOOGTE, {
          vulKleur: isJuistGetoond ? [230, 245, 230] : null,
          randKleur: isJuistGetoond ? [47, 154, 68] : KLEUR_TEKST,
          randDikte: isJuistGetoond ? 1.0 : 0.4,
          rondeHoeken: 1.5
        });
        
        // Tekst in hokje (gecentreerd)
        tekenTekst(pdf, hokjeX + hokjeBreedte / 2, cy + cfg.HOKJES_HOOGTE / 2 + 1.3, keuze.tekst, {
          size: HOKJE_FONT_SIZE,
          kleur: KLEUR_TEKST,
          vet: isJuistGetoond,
          gecentreerd: true
        });
        
        hokjeX += hokjeBreedte + HOKJE_SPACING;
      }
      
      cy += cfg.HOKJES_HOOGTE + cfg.HOKJES_SPACING_ONDER;
    }
    
    // --- 3. Prefix-label (links, boven de lijn) ---
    if (cfg.heeftPrefix && kaart.prefix) {
      tekenTekst(pdf, innerX, cy + 3, kaart.prefix, {
        size: 11,
        kleur: KLEUR_TEKST,
        vet: false
      });
    }
    if (cfg.heeftPrefix) {
      cy += cfg.PREFIX_HOOGTE;
    }
    
    // --- 4. Schrijflijn + antwoord ---
    // BELANGRIJK: schrijflijn EERST tekenen (die heeft een lichtblauwe x-zone-vulling
    // die anders het antwoord zou bedekken), dan het antwoord eroverheen.
    tekenSchrijflijn(pdf, innerX, cy, innerBreedte, cfg.lijntype, cfg.lijnhoogte);
    
    if (cfg.metOplossingen && kaart.antwoord) {
      const antwoordTekst = kaart.prefix 
        ? kaart.antwoord.replace(new RegExp("^" + kaart.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\s*"), "") 
        : kaart.antwoord;
      tekenTekst(pdf, innerX + 2, cy + 2 * cfg.L - 0.5, antwoordTekst, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
    }
  }
  
  /* Teken zin-blok onderaan voor uitbreiding-niveau */
  function _tekenOV05ZinBlok(state, lijntype, lijnhoogte, L, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    // Layout binnen het blok, van boven naar beneden:
    //   PADDING_TOP (4) → titel (titelHoogte) → vraag (vraagHoogte) 
    //   → spacing (2) → schrijflijn (SCHRIJFLIJN_HOOGTE) 
    //   → [richtlijn (8) bij oplossingen] → PADDING_BOTTOM (6)
    const PADDING_TOP = 4;
    const PADDING_BOTTOM = 6;
    const titelHoogte = 7;
    const vraagHoogte = 6;
    const SPACING_VRAAG_LIJN = 2;
    const RICHTLIJN_HOOGTE = metOplossingen ? 8 : 0;
    
    const blokHoogte = PADDING_TOP + titelHoogte + vraagHoogte + SPACING_VRAAG_LIJN 
                     + SCHRIJFLIJN_HOOGTE + RICHTLIJN_HOOGTE + PADDING_BOTTOM;
    
    // BELANGRIJK: y pas NA reserveerRuimte vastleggen, want die kan
    // state.cursorY verplaatsen naar bovenkant van een nieuwe pagina.
    reserveerRuimte(state, blokHoogte);
    const y = state.cursorY;
    
    // Groene kader
    tekenKader(pdf, x, y, breedte, blokHoogte, {
      vulKleur: KLEUR_GROEN_VUL,
      randKleur: KLEUR_GROEN_RAND,
      randDikte: 0.7,
      rondeHoeken: 2
    });
    
    let cy = y + PADDING_TOP + 4;  // +4 om titel-baseline op redelijke positie te krijgen
    
    // Titel met sterren
    tekenTekst(pdf, x + 5, cy, "Extra opdracht", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true
    });
    pdf.setFont(FONT_FAMILIE, "bold");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    const lblBreedte = pdf.getTextWidth("Extra opdracht");
    tekenSterren(pdf, x + 5 + lblBreedte + 3, cy - 4, 5, 4);
    cy += titelHoogte;
    
    // Vraag
    tekenTekst(pdf, x + 5, cy, "Kies 1 woord van hierboven en maak er een goede zin mee.", {
      size: 13,
      kleur: KLEUR_TEKST,
      maxBreedte: breedte - 10
    });
    cy += vraagHoogte + SPACING_VRAAG_LIJN;
    
    // Schrijflijn (witte achtergrond want groene kader)
    tekenSchrijflijnMetWitteAchtergrond(pdf, x + 5, cy, breedte - 10, lijntype, lijnhoogte);
    cy += SCHRIJFLIJN_HOOGTE;
    
    // Oplossingen-richtlijn
    if (metOplossingen) {
      tekenTekst(pdf, x + 5, cy + 4, "Verwacht: een correcte zin met hoofdletter, leesteken op het einde, en een woord uit de oefening.", {
        size: 10,
        kleur: [120, 120, 120],
        maxBreedte: breedte - 10
      });
    }
    
    state.cursorY = y + blokHoogte;
  }
  
  /* ==========================================================
     OV06 — ZINNEN INVULLEN
     
     4 niveaus met sterk verschillende layouts:
       ⭐ basis:       per zin een blok met links de 2 woord-keuzes 
                       (in pillen), rechts de zin gewrapt rond een 
                       schrijflijn over volle breedte.
       ⭐⭐ kern:       woordbank bovenaan (oranje gestreepte kader),
                       daaronder zinnen met inline schrijflijn op 
                       de plek van het ontbrekende woord.
       ⭐⭐⭐ verdieping: identiek aan kern (alleen meer woorden in bank).
       ⭐⭐⭐⭐ uitbreiding: per woord een rij "woord:  [schrijflijn]"
                       waarop het kind een eigen zin schrijft.
     ========================================================== */
  
  function tekenOV06(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov06");
      return;
    }
    
    // --- 1. Lijntype, lijnhoogte, niveau ---
    const werkbladEl = itemEl.querySelector(".werkblad.ov06-blad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "middel";
    const niveau = werkbladEl?.getAttribute("data-niveau") || item.niveau || "basis";
    const metOplossingen = item.metAntwoorden === true;
    
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    // --- 2. Opdracht-stappen ---
    const stappen = _haalOpdrachtStappen(itemEl, "ov06");
    const opdrachtStappen = stappen.length > 0 ? stappen :
      ["Lees de zin.", "Vul het juiste woord in."];
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
    // --- 3. Verzamel rijen uit DOM ---
    // basis: .ov06-zin-rij-basis (heeft .ov06-keuze-rij + .ov06-zin-tekst)
    // kern/verdieping: .ov06-zin-rij (alleen .ov06-zin-tekst met inline streep)
    // uitbreiding: .ov06-uitbreiding-rij
    
    if (niveau === "uitbreiding") {
      _tekenOV06Uitbreiding(state, itemEl, {
        opdrachtStappen, opdrachtHoogte, niveau, lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE
      });
      return;
    }
    
    // kern + verdieping: woordbank bovenaan
    let bankWoorden = [];
    itemEl.querySelectorAll(".ov06-bank-woord").forEach(el => {
      bankWoorden.push(el.textContent.trim());
    });
    
    // Zinnen verzamelen
    const zinnen = [];
    itemEl.querySelectorAll(".ov06-zin-rij").forEach(rijEl => {
      const isBasis = rijEl.classList.contains("ov06-zin-rij-basis");
      const zinTekstEl = rijEl.querySelector(".ov06-zin-tekst");
      if (!zinTekstEl) return;
      
      // Splitsen rond de streep/antwoord
      const streepEl = zinTekstEl.querySelector(".ov06-streep-inline, .ov06-antwoord-inline");
      let voor = "";
      let na = "";
      let antwoord = "";
      
      if (streepEl) {
        // Tekst vóór de streep + tekst na de streep
        // We loopen door alle child nodes
        let foundStreep = false;
        zinTekstEl.childNodes.forEach(node => {
          if (node === streepEl) {
            foundStreep = true;
            if (metOplossingen) antwoord = streepEl.textContent.trim();
            return;
          }
          const txt = node.textContent || "";
          if (!foundStreep) voor += txt;
          else na += txt;
        });
      } else {
        voor = zinTekstEl.textContent.trim();
      }
      
      // Bij oplossingen kan het antwoord ook in de span zelf staan
      if (metOplossingen && !antwoord && streepEl) {
        antwoord = streepEl.textContent.trim();
      }
      
      // Keuzes (alleen basis)
      const keuzes = [];
      if (isBasis) {
        rijEl.querySelectorAll(".ov06-keuze-woord").forEach(kEl => {
          keuzes.push({
            tekst: kEl.textContent.trim(),
            isJuist: kEl.classList.contains("ov06-keuze-juist")
          });
        });
      }
      
      // Nummer
      const nrEl = rijEl.querySelector(".ov06-nr");
      const nr = nrEl ? nrEl.textContent.trim() : (zinnen.length + 1) + ".";
      
      zinnen.push({ nr, voor: voor.trim(), na: na.trim(), antwoord, keuzes, isBasis });
    });
    
    if (zinnen.length === 0) {
      _tekenStubOV(state, item, "ov06");
      return;
    }
    
    // --- 4. Bereken hoogtes ---
    const bankHoogte = (niveau === "kern" || niveau === "verdieping") && bankWoorden.length > 0
      ? _berekenWoordbankHoogte(pdf, state.contentBreedte, bankWoorden)
      : 0;
    
    // Reserveer voor opdracht + bank + eerste zin
    const eersteZinHoogte = niveau === "basis" 
      ? (SCHRIJFLIJN_HOOGTE + 14) 
      : (SCHRIJFLIJN_HOOGTE + 4);
    reserveerRuimte(state, opdrachtHoogte + 4 + bankHoogte + 4 + eersteZinHoogte);
    
    // --- 5. Teken opdracht-kader ---
    tekenGeleKader(pdf, state.contentX, state.cursorY, state.contentBreedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 4;
    
    // --- 6. Teken woordbank (kern/verdieping) ---
    if (bankHoogte > 0) {
      _tekenOV06Woordbank(state, bankWoorden);
      state.cursorY += 4;
    }
    
    // --- 7. Teken zinnen ---
    for (const zin of zinnen) {
      if (niveau === "basis") {
        _tekenOV06ZinBasis(state, zin, lijntype, lijnhoogte, L, metOplossingen);
      } else {
        _tekenOV06ZinKern(state, zin, lijntype, lijnhoogte, L, metOplossingen);
      }
    }
    
    state.cursorY += 4;
  }
  
  /* Bereken hoogte van de woordbank op basis van wrapping. */
  function _berekenWoordbankHoogte(pdf, breedte, woorden) {
    const PAD = 5;
    const TITEL_HOOGTE = 7;
    const WOORD_HOOGTE = 8;
    const WOORD_SPACING = 3;
    const RIJ_SPACING = 3;
    
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(13);
    
    const beschikbaar = breedte - 2 * PAD;
    let curX = 0;
    let rijen = 1;
    
    for (const w of woorden) {
      const wBreedte = pdf.getTextWidth(w) + 2 * 4;  // 4mm padding per kant
      if (curX > 0 && curX + wBreedte > beschikbaar) {
        rijen++;
        curX = 0;
      }
      curX += wBreedte + WOORD_SPACING;
    }
    
    return 2 * PAD + TITEL_HOOGTE + rijen * WOORD_HOOGTE + (rijen - 1) * RIJ_SPACING + 2;
  }
  
  /* Teken woordbank: oranje gestreepte kader met witte woord-pillen. */
  function _tekenOV06Woordbank(state, woorden) {
    const pdf = state.pdf;
    const x = state.contentX;
    const y = state.cursorY;
    const breedte = state.contentBreedte;
    
    const PAD = 5;
    const TITEL_HOOGTE = 7;
    const WOORD_HOOGTE = 8;
    const WOORD_PAD_X = 4;
    const WOORD_SPACING = 3;
    const RIJ_SPACING = 3;
    
    const KLEUR_ORANJE = [217, 119, 6];
    const KLEUR_BANK_BG = [255, 251, 240];
    
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(13);
    
    // Bereken hoogte (zelfde logica als _bereken)
    const beschikbaar = breedte - 2 * PAD;
    const breedtes = woorden.map(w => pdf.getTextWidth(w) + 2 * WOORD_PAD_X);
    
    // Layout: welke rij hoort elk woord bij?
    const indelingen = [];
    let curRij = 0, curX = 0;
    for (let i = 0; i < woorden.length; i++) {
      if (curX > 0 && curX + breedtes[i] > beschikbaar) {
        curRij++;
        curX = 0;
      }
      indelingen.push({ rij: curRij, xOffset: curX });
      curX += breedtes[i] + WOORD_SPACING;
    }
    const aantalRijen = curRij + 1;
    
    const bankHoogte = 2 * PAD + TITEL_HOOGTE + aantalRijen * WOORD_HOOGTE 
                     + (aantalRijen - 1) * RIJ_SPACING + 2;
    
    // Achtergrond + gestreepte rand
    tekenKader(pdf, x, y, breedte, bankHoogte, {
      vulKleur: KLEUR_BANK_BG,
      randKleur: null,
      rondeHoeken: 2
    });
    // Gestreepte rand simuleren met dashed stroke
    pdf.setDrawColor(KLEUR_ORANJE[0], KLEUR_ORANJE[1], KLEUR_ORANJE[2]);
    pdf.setLineWidth(0.7);
    pdf.setLineDashPattern([2, 1.5], 0);
    pdf.roundedRect(x, y, breedte, bankHoogte, 2, 2, "S");
    pdf.setLineDashPattern([], 0);  // reset
    
    // Titel
    tekenTekst(pdf, x + PAD, y + PAD + 4.5, "Woordbank:", {
      size: 13,
      kleur: KLEUR_TEKST,
      vet: true
    });
    
    // Woord-pillen
    let woordY = y + PAD + TITEL_HOOGTE;
    for (let i = 0; i < woorden.length; i++) {
      const ind = indelingen[i];
      const woordX = x + PAD + ind.xOffset;
      const wRijY = woordY + ind.rij * (WOORD_HOOGTE + RIJ_SPACING);
      
      // Witte pil met grijze rand
      tekenKader(pdf, woordX, wRijY, breedtes[i], WOORD_HOOGTE, {
        vulKleur: [255, 255, 255],
        randKleur: KLEUR_TEKST,
        randDikte: 0.3,
        rondeHoeken: 1.5
      });
      
      tekenTekst(pdf, woordX + breedtes[i] / 2, wRijY + WOORD_HOOGTE / 2 + 1.5, woorden[i], {
        size: 13,
        kleur: KLEUR_TEKST,
        gecentreerd: true
      });
    }
    
    state.cursorY = y + bankHoogte;
  }
  
  /* Teken één zin op basis-niveau:
     [nr.] [keuze1] / [keuze2]   voor-tekst [schrijflijn] na-tekst
     
     Layout: links 30% voor nummer + keuzes, rechts 70% voor zin.
     De zin loopt inline met de schrijflijn: voor-tekst staat náást
     de lijn, na-tekst eveneens. Past na-tekst niet meer? Dan komt
     hij op een nieuwe regel onder de lijn, met een paar mm spacing
     zodat hij niet tegen de rode onderlijn plakt.
  */
  function _tekenOV06ZinBasis(state, zin, lijntype, lijnhoogte, L, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    const LINKER_KOLOM = 55;  // mm voor nr + keuzes
    const SPACING_KOLOMMEN = 6;
    const rechtsX = x + LINKER_KOLOM + SPACING_KOLOMMEN;
    const rechtsBreedte = breedte - LINKER_KOLOM - SPACING_KOLOMMEN;
    
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    
    const voorTekst = zin.voor || "";
    const naTekst = zin.na || "";
    
    // Bereken benodigde plaats op één regel: 
    //   voor-tekst + spacing + schrijflijn (min. 50mm) + spacing + na-tekst
    const voorBreedte = voorTekst ? pdf.getTextWidth(voorTekst) : 0;
    const naBreedte = naTekst ? pdf.getTextWidth(naTekst) : 0;
    const MIN_LIJN_BREEDTE = 50;
    const SPACING_TEKST_LIJN = 3;
    
    const benodigdVoorEenRegel = voorBreedte + (voorTekst ? SPACING_TEKST_LIJN : 0)
                               + MIN_LIJN_BREEDTE 
                               + (naTekst ? SPACING_TEKST_LIJN + naBreedte : 0);
    
    const naPastAchterLijn = (benodigdVoorEenRegel <= rechtsBreedte);
    
    // Hoogte: schrijflijn-rij + evt. extra regel voor na-tekst
    const VERTICAAL_PAD = 3;
    const EXTRA_REGEL_HOOGTE = 7;  // 7mm voor na-tekst onder de lijn, met ademruimte
    
    let blokHoogte = SCHRIJFLIJN_HOOGTE + 2 * VERTICAAL_PAD;
    if (!naPastAchterLijn && naTekst) blokHoogte += EXTRA_REGEL_HOOGTE;
    
    reserveerRuimte(state, blokHoogte + 4);
    const yStart = state.cursorY;
    
    // --- Linker kolom: nummer + keuzes (verticaal gecentreerd op de schrijflijn-rij) ---
    const lijnY = yStart + VERTICAAL_PAD;
    const tekstBaseline = lijnY + 2 * L - 0.5;
    
    tekenTekst(pdf, x, tekstBaseline, zin.nr, {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true
    });
    
    if (zin.keuzes && zin.keuzes.length > 0) {
      const KEUZE_HOOGTE = 8;
      const KEUZE_PAD = 3;
      const KEUZE_MIDDEN_Y = lijnY + SCHRIJFLIJN_HOOGTE / 2;
      let kx = x + 10;  // na het nummer
      
      for (let i = 0; i < zin.keuzes.length; i++) {
        const keuze = zin.keuzes[i];
        const tekstBreedte = pdf.getTextWidth(keuze.tekst);
        const pilBreedte = tekstBreedte + 2 * KEUZE_PAD;
        const isJuistGetoond = metOplossingen && keuze.isJuist;
        
        const pilY = KEUZE_MIDDEN_Y - KEUZE_HOOGTE / 2;
        tekenKader(pdf, kx, pilY, pilBreedte, KEUZE_HOOGTE, {
          vulKleur: isJuistGetoond ? [230, 245, 230] : null,
          randKleur: isJuistGetoond ? [47, 154, 68] : KLEUR_TEKST,
          randDikte: isJuistGetoond ? 1.0 : 0.4,
          rondeHoeken: 4   // ovale pil-stijl
        });
        
        tekenTekst(pdf, kx + pilBreedte / 2, KEUZE_MIDDEN_Y + 1.5, keuze.tekst, {
          size: 13,
          kleur: KLEUR_TEKST,
          vet: isJuistGetoond,
          gecentreerd: true
        });
        
        kx += pilBreedte;
        
        // " / " separator
        if (i < zin.keuzes.length - 1) {
          tekenTekst(pdf, kx + 2, KEUZE_MIDDEN_Y + 1.5, "/", {
            size: 13,
            kleur: KLEUR_TEKST
          });
          kx += 6;
        }
      }
    }
    
    // --- Rechter kolom: zin met inline schrijflijn ---
    let curX = rechtsX;
    
    // Voor-tekst (bv. "De")
    if (voorTekst) {
      tekenTekst(pdf, curX, tekstBaseline, voorTekst, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
      curX += voorBreedte + SPACING_TEKST_LIJN;
    }
    
    // Schrijflijn — past na-tekst nog achter, dan korter; anders rest-breedte
    let lijnBreedte;
    if (naPastAchterLijn && naTekst) {
      // Lijn neemt ruimte tussen voor-tekst en na-tekst
      lijnBreedte = (rechtsX + rechtsBreedte) - curX - SPACING_TEKST_LIJN - naBreedte;
    } else {
      // Lijn pakt alle resterende breedte; na-tekst komt eronder (of bestaat niet)
      lijnBreedte = (rechtsX + rechtsBreedte) - curX;
    }
    
    tekenSchrijflijn(pdf, curX, lijnY, lijnBreedte, lijntype, lijnhoogte);
    
    if (metOplossingen && zin.antwoord) {
      tekenTekst(pdf, curX + 2, tekstBaseline, zin.antwoord, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
    }
    
    curX += lijnBreedte;
    
    // Na-tekst
    if (naTekst) {
      if (naPastAchterLijn) {
        // Inline na de lijn
        tekenTekst(pdf, curX + SPACING_TEKST_LIJN, tekstBaseline, naTekst, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST
        });
      } else {
        // Onder de lijn, met ademruimte vanaf rode onderlijn
        const onderY = lijnY + SCHRIJFLIJN_HOOGTE + 5;  // 5mm spacing
        tekenTekst(pdf, rechtsX, onderY, naTekst, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST
        });
      }
    }
    
    state.cursorY = yStart + blokHoogte + 4;
  }
  
  /* Teken één zin op kern/verdieping-niveau:
     [nr.]  Tekst vóór [schrijflijn] tekst na.
     
     Eén regel met inline schrijflijn. De lijn vult de beschikbare 
     horizontale ruimte tussen voor-tekst en na-tekst.
  */
  function _tekenOV06ZinKern(state, zin, lijntype, lijnhoogte, L, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    const VERTICAAL_PAD = 3;
    const blokHoogte = SCHRIJFLIJN_HOOGTE + 2 * VERTICAAL_PAD;
    
    reserveerRuimte(state, blokHoogte + 4);
    const yStart = state.cursorY;
    
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    
    // Y-positie van baseline (tekst onder)
    const lijnY = yStart + VERTICAAL_PAD;
    const tekstBaseline = lijnY + 2 * L - 0.5;
    
    // Vaste schrijflijn-breedte: genoeg voor één woord van ~6-7 letters,
    // niet "een hele zin breed" zoals voorheen. Zo blijft de zin
    // visueel een zin (woord-zin-woord) en niet "tekst-streep-tekst".
    const LIJN_BREEDTE = 60;  // mm — genoeg voor één invul-woord
    const SPACING_TEKST_LIJN = 3;
    
    // Nr links
    let curX = x;
    tekenTekst(pdf, curX, tekstBaseline, zin.nr, {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true
    });
    curX += 8;
    
    // Voor-tekst
    const voorTekst = zin.voor || "";
    if (voorTekst) {
      tekenTekst(pdf, curX, tekstBaseline, voorTekst, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
      curX += pdf.getTextWidth(voorTekst) + SPACING_TEKST_LIJN;
    }
    
    // Schrijflijn (vaste compacte breedte)
    tekenSchrijflijn(pdf, curX, lijnY, LIJN_BREEDTE, lijntype, lijnhoogte);
    
    if (metOplossingen && zin.antwoord) {
      tekenTekst(pdf, curX + 2, tekstBaseline, zin.antwoord, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
    }
    curX += LIJN_BREEDTE + SPACING_TEKST_LIJN;
    
    // Na-tekst
    const naTekst = zin.na || "";
    if (naTekst) {
      // Check of na-tekst nog past op deze regel
      const naBreedte = pdf.getTextWidth(naTekst);
      const beschikbaar = (x + breedte) - curX;
      
      if (naBreedte <= beschikbaar) {
        // Inline
        tekenTekst(pdf, curX, tekstBaseline, naTekst, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST
        });
      } else {
        // Past niet meer → onder de lijn, met ademruimte
        const onderY = lijnY + SCHRIJFLIJN_HOOGTE + 5;
        // Begin uitgelijnd met voor-tekst (na het nummer)
        tekenTekst(pdf, x + 8, onderY, naTekst, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST
        });
        // Pas blokhoogte aan zodat volgende zin er niet bovenop komt
        state.cursorY = yStart + blokHoogte + 7 + 4;
        return;
      }
    }
    
    state.cursorY = yStart + blokHoogte + 4;
  }
  
  /* Teken uitbreiding-niveau: per woord een rij "woord:  [schrijflijn]". */
  function _tekenOV06Uitbreiding(state, itemEl, cfg) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    const { opdrachtStappen, opdrachtHoogte, niveau, lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE } = cfg;
    const metOplossingen = false;  // uitbreiding heeft geen vast antwoord
    
    // Verzamel woorden
    const woorden = [];
    itemEl.querySelectorAll(".ov06-uitbreiding-rij").forEach(rijEl => {
      const woordEl = rijEl.querySelector(".ov06-uitbreiding-woord");
      if (woordEl) {
        // ".ov06-uitbreiding-woord" bevat "woord:" — strip de dubbelpunt
        let w = woordEl.textContent.trim();
        w = w.replace(/:$/, "");
        woorden.push(w);
      }
    });
    
    if (woorden.length === 0) {
      _tekenStubOV(state, { id: itemEl?.getAttribute("data-item-id") }, "ov06");
      return;
    }
    
    // Reserveer ruimte
    const RIJ_SPACING = 6;
    const rijHoogte = SCHRIJFLIJN_HOOGTE + 3;
    reserveerRuimte(state, opdrachtHoogte + 4 + rijHoogte + RIJ_SPACING);
    
    // Teken opdracht
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // Teken rijen
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    
    // Bepaal breedste woord voor uitlijning
    let maxWoordBreedte = 0;
    for (const w of woorden) {
      const wb = pdf.getTextWidth(w + ":");
      if (wb > maxWoordBreedte) maxWoordBreedte = wb;
    }
    const labelKolom = maxWoordBreedte + 6;
    
    for (const woord of woorden) {
      reserveerRuimte(state, rijHoogte + RIJ_SPACING);
      const yRij = state.cursorY;
      
      // Tekst-baseline ligt op ~2*L vanaf top van schrijflijn
      const tekstBaseline = yRij + 2 * L - 0.5;
      
      tekenTekst(pdf, x, tekstBaseline, woord + ":", {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST,
        vet: true
      });
      
      tekenSchrijflijn(pdf, x + labelKolom, yRij, breedte - labelKolom, lijntype, lijnhoogte);
      
      state.cursorY = yRij + rijHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 2;
  }
  
  /* ==========================================================
     OV07 — VERKLEINWOORDEN
     
     4 niveaus met verschillende layouts:
       ⭐ basis:       2-koloms grid van cellen. Per cel:
                        grondwoord boven, 3 keuze-pillen (-je/-tje/-pje),
                        schrijflijn voor het volledige verkleinwoord.
       ⭐⭐ kern:       2-koloms rij-lijst. Per rij:
                        grondwoord → schrijflijn (compact)
       ⭐⭐⭐ verdieping: 1-koloms rij-lijst met kop "woord ↔ verkleinwoord".
                        Per rij: woord-pil ↔ schrijflijn  OF  schrijflijn ↔ verkleinwoord-pil
       ⭐⭐⭐⭐ uitbreiding: gele verhaal-kader met titel + zinnen 
                          (zelfstandige nw onderstreept), daaronder 7 lege schrijflijnen.
     ========================================================== */
  
  function tekenOV07(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov07");
      return;
    }
    
    // --- 1. Lijntype, lijnhoogte, niveau ---
    const werkbladEl = itemEl.querySelector(".werkblad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "middel";
    const niveau = werkbladEl?.getAttribute("data-niveau") || item.niveau || "basis";
    const metOplossingen = item.metAntwoorden === true;
    
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    // --- 2. Opdracht-stappen ---
    const stappen = _haalOpdrachtStappen(itemEl, "ov07");
    const opdrachtStappen = stappen.length > 0 ? stappen :
      ["Lees het grondwoord.", "Maak er een verkleinwoord van."];
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
    // --- 3. Routing per niveau ---
    if (niveau === "uitbreiding") {
      _tekenOV07Uitbreiding(state, itemEl, opdrachtStappen, opdrachtHoogte, lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau);
      return;
    }
    
    // basis / kern / verdieping — eerst opdracht-kader
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    if (niveau === "basis") {
      _tekenOV07Basis(state, itemEl, opdrachtStappen, opdrachtHoogte, lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "kern") {
      _tekenOV07Kern(state, itemEl, opdrachtStappen, opdrachtHoogte, lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "verdieping") {
      _tekenOV07Verdieping(state, itemEl, opdrachtStappen, opdrachtHoogte, lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    }
  }
  
  /* ⭐ BASIS: 2-koloms grid van cellen.
     Per cel: grondwoord (midden) — 3 keuze-pillen — schrijflijn.
     Juiste pil krijgt groene rand+vet bij oplossingen.
     Antwoord (volledig verkleinwoord) op de schrijflijn-baseline. */
  function _tekenOV07Basis(state, itemEl, opdrachtStappen, opdrachtHoogte, 
                            lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel cellen
    const cellen = [];
    itemEl.querySelectorAll(".ov07-cel-basis").forEach(celEl => {
      const grondEl = celEl.querySelector(".ov07-grondwoord");
      const keuzes = [];
      celEl.querySelectorAll(".ov07-uitgang-keuze").forEach(kEl => {
        keuzes.push({
          tekst: kEl.textContent.trim(),  // "-je", "-tje", "-pje"
          isJuist: kEl.classList.contains("ov07-uitgang-juist")
        });
      });
      const antwoordEl = celEl.querySelector(".ov07-lijn-antwoord");
      cellen.push({
        grondwoord: grondEl ? grondEl.textContent.trim() : "",
        keuzes,
        antwoord: antwoordEl ? antwoordEl.textContent.trim() : ""
      });
    });
    
    if (cellen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov07");
      return;
    }
    
    // Layout-parameters
    const KOLOMMEN = 2;
    const KOL_SPACING = 6;
    const RIJ_SPACING = 5;
    
    const celBreedte = (breedte - (KOLOMMEN - 1) * KOL_SPACING) / KOLOMMEN;
    
    // Cel-hoogte berekenen
    const PAD = 2;
    const GRONDWOORD_HOOGTE = 7;
    const SPACING_GROND_KEUZES = 2;
    const KEUZE_HOOGTE = 7;
    const SPACING_KEUZES_LIJN = 4;
    
    const celHoogte = PAD + GRONDWOORD_HOOGTE + SPACING_GROND_KEUZES 
                    + KEUZE_HOOGTE + SPACING_KEUZES_LIJN + SCHRIJFLIJN_HOOGTE + PAD;
    
    // Reserveer voor opdracht + eerste rij
    reserveerRuimte(state, opdrachtHoogte + 4 + celHoogte + RIJ_SPACING);
    
    // Opdracht-kader
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // Cellen rij per rij
    for (let i = 0; i < cellen.length; i += KOLOMMEN) {
      const rij = cellen.slice(i, i + KOLOMMEN);
      
      if (i > 0) reserveerRuimte(state, celHoogte + RIJ_SPACING);
      
      const rijY = state.cursorY;
      
      for (let j = 0; j < rij.length; j++) {
        const cel = rij[j];
        const celX = x + j * (celBreedte + KOL_SPACING);
        _tekenOV07BasisCel(pdf, cel, celX, rijY, celBreedte, {
          PAD, GRONDWOORD_HOOGTE, SPACING_GROND_KEUZES,
          KEUZE_HOOGTE, SPACING_KEUZES_LIJN,
          SCHRIJFLIJN_HOOGTE, L, lijntype, lijnhoogte, metOplossingen
        });
      }
      
      state.cursorY += celHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 4;
  }
  
  function _tekenOV07BasisCel(pdf, cel, x, y, breedte, cfg) {
    let cy = y + cfg.PAD;
    
    // Grondwoord gecentreerd, vet
    tekenTekst(pdf, x + breedte / 2, cy + 5, cel.grondwoord, {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true,
      gecentreerd: true
    });
    cy += cfg.GRONDWOORD_HOOGTE + cfg.SPACING_GROND_KEUZES;
    
    // Keuze-pillen (gecentreerd, 3 stuks)
    if (cel.keuzes.length > 0) {
      pdf.setFont(FONT_FAMILIE, "normal");
      pdf.setFontSize(13);
      
      const KEUZE_PAD = 3;
      const KEUZE_SPACING = 3;
      const pilBreedtes = cel.keuzes.map(k => pdf.getTextWidth(k.tekst) + 2 * KEUZE_PAD);
      const totBreedte = pilBreedtes.reduce((s, w) => s + w, 0) 
                       + (cel.keuzes.length - 1) * KEUZE_SPACING;
      let kx = x + (breedte - totBreedte) / 2;
      
      for (let i = 0; i < cel.keuzes.length; i++) {
        const k = cel.keuzes[i];
        const pb = pilBreedtes[i];
        const isJuistGetoond = cfg.metOplossingen && k.isJuist;
        
        tekenKader(pdf, kx, cy, pb, cfg.KEUZE_HOOGTE, {
          vulKleur: isJuistGetoond ? [230, 245, 230] : null,
          randKleur: isJuistGetoond ? [47, 154, 68] : KLEUR_TEKST,
          randDikte: isJuistGetoond ? 0.9 : 0.4,
          rondeHoeken: 4  // ovale pil
        });
        
        tekenTekst(pdf, kx + pb / 2, cy + cfg.KEUZE_HOOGTE / 2 + 1.3, k.tekst, {
          size: 13,
          kleur: KLEUR_TEKST,
          vet: isJuistGetoond,
          gecentreerd: true
        });
        
        kx += pb + KEUZE_SPACING;
      }
    }
    cy += cfg.KEUZE_HOOGTE + cfg.SPACING_KEUZES_LIJN;
    
    // Schrijflijn over volle cel-breedte (-2mm padding)
    const lijnX = x + 2;
    const lijnBreedte = breedte - 4;
    tekenSchrijflijn(pdf, lijnX, cy, lijnBreedte, cfg.lijntype, cfg.lijnhoogte);
    
    if (cfg.metOplossingen && cel.antwoord) {
      tekenTekst(pdf, lijnX + 2, cy + 2 * cfg.L - 0.5, cel.antwoord, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
    }
  }
  
  /* ⭐⭐ KERN: 2-koloms rij-lijst.
     Per rij: grondwoord (links) → schrijflijn (rechts, ~60mm). */
  function _tekenOV07Kern(state, itemEl, opdrachtStappen, opdrachtHoogte,
                          lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel rijen
    const rijen = [];
    itemEl.querySelectorAll(".ov07-rij-kern").forEach(rijEl => {
      const grondEl = rijEl.querySelector(".ov07-grondwoord");
      const antwoordEl = rijEl.querySelector(".ov07-lijn-antwoord");
      rijen.push({
        grondwoord: grondEl ? grondEl.textContent.trim() : "",
        antwoord: antwoordEl ? antwoordEl.textContent.trim() : ""
      });
    });
    
    if (rijen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov07");
      return;
    }
    
    // Layout: 2 kolommen, elk met (grondwoord + pijl + schrijflijn)
    const KOLOMMEN = 2;
    const KOL_SPACING = 8;
    const RIJ_SPACING = 5;
    
    const kolBreedte = (breedte - (KOLOMMEN - 1) * KOL_SPACING) / KOLOMMEN;
    
    // Binnen één kolom: grondwoord + pijl ~30mm, schrijflijn pakt de rest
    const GRONDWOORD_BREEDTE = 22;
    const PIJL_BREEDTE = 8;
    const lijnBreedte = kolBreedte - GRONDWOORD_BREEDTE - PIJL_BREEDTE;
    
    const rijHoogte = SCHRIJFLIJN_HOOGTE + 4;
    
    reserveerRuimte(state, opdrachtHoogte + 4 + rijHoogte + RIJ_SPACING);
    
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    
    for (let i = 0; i < rijen.length; i += KOLOMMEN) {
      const rijGroep = rijen.slice(i, i + KOLOMMEN);
      
      if (i > 0) reserveerRuimte(state, rijHoogte + RIJ_SPACING);
      
      const rijY = state.cursorY;
      const lijnTopY = rijY + 2;
      const tekstBaseline = lijnTopY + 2 * L - 0.5;
      
      for (let j = 0; j < rijGroep.length; j++) {
        const r = rijGroep[j];
        const kolX = x + j * (kolBreedte + KOL_SPACING);
        
        // Grondwoord (vet)
        tekenTekst(pdf, kolX, tekstBaseline, r.grondwoord, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST,
          vet: true
        });
        
        // Pijl (echte vector-pijl, want unicode-pijl wordt corrupt in helvetica)
        tekenPijl(pdf, kolX + GRONDWOORD_BREEDTE, lijnTopY, PIJL_BREEDTE, SCHRIJFLIJN_HOOGTE, {
          richting: "rechts",
          kleur: KLEUR_TEKST,
          dikte: 0.5
        });
        
        // Schrijflijn
        const lijnX = kolX + GRONDWOORD_BREEDTE + PIJL_BREEDTE;
        tekenSchrijflijn(pdf, lijnX, lijnTopY, lijnBreedte, lijntype, lijnhoogte);
        
        if (metOplossingen && r.antwoord) {
          tekenTekst(pdf, lijnX + 2, tekstBaseline, r.antwoord, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      state.cursorY += rijHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 4;
  }
  
  /* ⭐⭐⭐ VERDIEPING: kop "woord ↔ verkleinwoord", dan rijen.
     Per rij: links woord-pil OF schrijflijn, midden ↔, rechts het andere. */
  function _tekenOV07Verdieping(state, itemEl, opdrachtStappen, opdrachtHoogte,
                                lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel rijen
    const rijen = [];
    itemEl.querySelectorAll(".ov07-rij-verdieping").forEach(rijEl => {
      const richting = rijEl.getAttribute("data-richting") || "vul-verklein";
      const woordCol = rijEl.querySelector(".ov07-kol-woord");
      const verkleinCol = rijEl.querySelector(".ov07-kol-verklein");
      
      const dataWoord = rijEl.getAttribute("data-woord") || "";
      
      // Wat is gegeven, wat moet ingevuld worden?
      let gegevenLinks = "", gegevenRechts = "";
      let antwoordLinks = "", antwoordRechts = "";
      
      if (richting === "vul-verklein") {
        // links = woord gegeven, rechts = schrijflijn
        gegevenLinks = woordCol ? woordCol.textContent.trim() : dataWoord;
        const antwEl = verkleinCol?.querySelector(".ov07-lijn-antwoord");
        antwoordRechts = antwEl ? antwEl.textContent.trim() : "";
      } else {
        // links = schrijflijn, rechts = verkleinwoord gegeven
        const antwEl = woordCol?.querySelector(".ov07-lijn-antwoord");
        antwoordLinks = antwEl ? antwEl.textContent.trim() : "";
        gegevenRechts = verkleinCol ? verkleinCol.textContent.trim() : "";
      }
      
      rijen.push({ richting, gegevenLinks, gegevenRechts, antwoordLinks, antwoordRechts });
    });
    
    if (rijen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov07");
      return;
    }
    
    // Layout: kop + rijen
    const KOP_HOOGTE = 9;
    const KOL_SPACING = 6;
    const PIJL_BREEDTE = 8;
    const RIJ_SPACING = 5;
    
    const kolBreedte = (breedte - 2 * KOL_SPACING - PIJL_BREEDTE) / 2;
    const rijHoogte = SCHRIJFLIJN_HOOGTE + 4;
    
    reserveerRuimte(state, opdrachtHoogte + 4 + KOP_HOOGTE + 4 + rijHoogte + RIJ_SPACING);
    
    // Opdracht-kader
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // Kolom-kop "woord ↔ verkleinwoord"
    const kopY = state.cursorY;
    const KLEUR_BLAUW_TITEL = [33, 78, 145];
    
    tekenTekst(pdf, x + kolBreedte / 2, kopY + 5, "woord", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_BLAUW_TITEL,
      vet: true,
      gecentreerd: true
    });
    tekenTekst(pdf, x + 2 * kolBreedte + KOL_SPACING + PIJL_BREEDTE + KOL_SPACING - kolBreedte / 2 - KOL_SPACING, kopY + 5, "verkleinwoord", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_BLAUW_TITEL,
      vet: true,
      gecentreerd: true
    });
    // Streep onder kop
    tekenLijn(pdf, x, kopY + 8, x + breedte, { kleur: KLEUR_BLAUW_TITEL, dikte: 0.5 });
    state.cursorY += KOP_HOOGTE + 3;
    
    // Rijen
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    
    for (const r of rijen) {
      reserveerRuimte(state, rijHoogte + RIJ_SPACING);
      const rijY = state.cursorY;
      const lijnTopY = rijY + 2;
      const tekstBaseline = lijnTopY + 2 * L - 0.5;
      
      const linksX = x;
      const pijlX = x + kolBreedte + KOL_SPACING;
      const rechtsX = pijlX + PIJL_BREEDTE + KOL_SPACING;
      
      // LINKS
      if (r.gegevenLinks) {
        // Lichtgrijze pil met woord erin
        _tekenOV07GegevenPil(pdf, linksX, rijY, kolBreedte, rijHoogte, r.gegevenLinks);
      } else {
        // Schrijflijn
        tekenSchrijflijn(pdf, linksX, lijnTopY, kolBreedte, lijntype, lijnhoogte);
        if (metOplossingen && r.antwoordLinks) {
          tekenTekst(pdf, linksX + 2, tekstBaseline, r.antwoordLinks, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      // PIJL (echte vector-pijl, dubbel)
      tekenPijl(pdf, pijlX, rijY, PIJL_BREEDTE, rijHoogte, {
        richting: "tweekant",
        kleur: KLEUR_TEKST,
        dikte: 0.5
      });
      
      // RECHTS
      if (r.gegevenRechts) {
        _tekenOV07GegevenPil(pdf, rechtsX, rijY, kolBreedte, rijHoogte, r.gegevenRechts);
      } else {
        tekenSchrijflijn(pdf, rechtsX, lijnTopY, kolBreedte, lijntype, lijnhoogte);
        if (metOplossingen && r.antwoordRechts) {
          tekenTekst(pdf, rechtsX + 2, tekstBaseline, r.antwoordRechts, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      state.cursorY += rijHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 4;
  }
  
  /* Helper: lichtgrijze pil met gecentreerd woord (voor verdieping). */
  function _tekenOV07GegevenPil(pdf, x, y, breedte, hoogte, woord) {
    tekenKader(pdf, x, y, breedte, hoogte, {
      vulKleur: [245, 245, 247],
      randKleur: [200, 200, 210],
      randDikte: 0.3,
      rondeHoeken: 3
    });
    tekenTekst(pdf, x + breedte / 2, y + hoogte / 2 + 1.8, woord, {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true,
      gecentreerd: true
    });
  }
  
  /* ⭐⭐⭐⭐ UITBREIDING: gele verhaal-kader + lege schrijflijnen.
     Bij oplossingen: in plaats van lege lijnen, het verhaal nogmaals met
     verkleinwoorden waar de gemarkeerde substantieven stonden. */
  function _tekenOV07Uitbreiding(state, itemEl, opdrachtStappen, opdrachtHoogte,
                                  lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    const metOplossingen = itemEl.querySelector(".ov07-verhaal-zinnen-oplossing") !== null;
    
    // Verzamel verhaal-data
    const titelEl = itemEl.querySelector(".ov07-verhaal-titel");
    const titel = titelEl ? titelEl.textContent.trim() : "";
    
    // Original-zinnen verzamelen (met markers voor verkleinwoorden)
    const zinnen = [];
    const origineelEl = itemEl.querySelector(".ov07-verhaal-origineel");
    if (origineelEl) {
      origineelEl.querySelectorAll(".ov07-verhaal-zin").forEach(zinEl => {
        // Split de zin in tekst-stukjes en gemarkeerde substantieven
        const stukjes = [];
        zinEl.childNodes.forEach(node => {
          if (node.nodeType === 3) {
            // Text node
            stukjes.push({ tekst: node.textContent, gemarkeerd: false });
          } else if (node.classList && node.classList.contains("ov07-zn-marker")) {
            stukjes.push({ tekst: node.textContent.trim(), gemarkeerd: true });
          } else {
            stukjes.push({ tekst: node.textContent || "", gemarkeerd: false });
          }
        });
        zinnen.push(stukjes);
      });
    }
    
    // Oplossingen-zinnen verzamelen (verklein-versie)
    const oplZinnen = [];
    if (metOplossingen) {
      const oplEl = itemEl.querySelector(".ov07-verhaal-zinnen-oplossing");
      if (oplEl) {
        oplEl.querySelectorAll(".ov07-verhaal-zin").forEach(zinEl => {
          const stukjes = [];
          zinEl.childNodes.forEach(node => {
            if (node.nodeType === 3) {
              stukjes.push({ tekst: node.textContent, gemarkeerd: false });
            } else if (node.classList && node.classList.contains("ov07-zn-marker")) {
              stukjes.push({ tekst: node.textContent.trim(), gemarkeerd: true });
            } else {
              stukjes.push({ tekst: node.textContent || "", gemarkeerd: false });
            }
          });
          oplZinnen.push(stukjes);
        });
      }
    }
    
    // Layout
    const VERHAAL_PAD = 6;
    const TITEL_HOOGTE = 8;
    const ZIN_HOOGTE = 7;
    const verhaalHoogte = VERHAAL_PAD + TITEL_HOOGTE + zinnen.length * ZIN_HOOGTE + VERHAAL_PAD;
    
    // Reserveer voor opdracht + verhaal-kader + (bij metOplossingen: oplossing-tekst; anders: 7 lijnen)
    const AANTAL_LIJNEN = 7;
    const lijnenHoogte = AANTAL_LIJNEN * SCHRIJFLIJN_HOOGTE + (AANTAL_LIJNEN - 1) * 2;
    const oplZinnenHoogte = metOplossingen ? (oplZinnen.length * ZIN_HOOGTE + 8) : 0;
    
    const totaalNodig = opdrachtHoogte + 4 + verhaalHoogte + 6 
                      + (metOplossingen ? oplZinnenHoogte : lijnenHoogte) + 8;
    
    // OV07 uitbreiding moet als één blok op één pagina: het verhaal en de
    // invul-lijnen horen logisch bij elkaar en kan je niet splitsen.
    reserveerRuimte(state, totaalNodig);
    
    // Opdracht-kader
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // Verhaal-kader (geel/crème, zoals opdracht maar zonder checkboxes)
    const KLEUR_VERHAAL_VUL = [255, 248, 220];
    const KLEUR_VERHAAL_RAND = [212, 175, 55];
    const KLEUR_BRUIN_TITEL = [180, 120, 30];
    
    const verhY = state.cursorY;
    tekenKader(pdf, x, verhY, breedte, verhaalHoogte, {
      vulKleur: KLEUR_VERHAAL_VUL,
      randKleur: KLEUR_VERHAAL_RAND,
      randDikte: 0.6,
      rondeHoeken: 2
    });
    
    // Titel
    let cy = verhY + VERHAAL_PAD + 4;
    tekenTekst(pdf, x + VERHAAL_PAD, cy, titel, {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_BRUIN_TITEL,
      vet: true
    });
    cy += TITEL_HOOGTE;
    
    // Zinnen
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    
    for (const zin of zinnen) {
      _tekenOV07VerhaalZin(pdf, x + VERHAAL_PAD, cy + 4, breedte - 2 * VERHAAL_PAD, zin, KLEUR_BRUIN_TITEL);
      cy += ZIN_HOOGTE;
    }
    
    state.cursorY = verhY + verhaalHoogte + 6;
    
    // Invul-deel
    if (metOplossingen && oplZinnen.length > 0) {
      // Toon de verklein-versies van de zinnen
      reserveerRuimte(state, oplZinnenHoogte);
      pdf.setFont(FONT_FAMILIE, "normal");
      pdf.setFontSize(FONT_GROOTTE_INHOUD);
      
      for (const zin of oplZinnen) {
        _tekenOV07VerhaalZin(pdf, x + 2, state.cursorY + 4, breedte - 4, zin, [33, 100, 33]);  // groen voor antwoord
        state.cursorY += ZIN_HOOGTE;
      }
      state.cursorY += 4;
    } else {
      // 7 lege schrijflijnen
      for (let i = 0; i < AANTAL_LIJNEN; i++) {
        reserveerRuimte(state, SCHRIJFLIJN_HOOGTE + 2);
        tekenSchrijflijn(pdf, x, state.cursorY, breedte, lijntype, lijnhoogte);
        state.cursorY += SCHRIJFLIJN_HOOGTE + 2;
      }
    }
    
    state.cursorY += 4;
  }
  
  /* Helper: teken één verhaal-zin met gemarkeerde substantieven onderstreept. */
  function _tekenOV07VerhaalZin(pdf, x, baselineY, maxBreedte, stukjes, accentKleur) {
    let curX = x;
    
    for (const stukje of stukjes) {
      const tekst = stukje.tekst;
      if (!tekst) continue;
      
      // Belangrijk: meet breedte met JUIST font (vet of normaal), 
      // anders plakt het volgende woord tegen het gemarkeerde aan.
      pdf.setFont(FONT_FAMILIE, stukje.gemarkeerd ? "bold" : "normal");
      pdf.setFontSize(FONT_GROOTTE_INHOUD);
      const w = pdf.getTextWidth(tekst);
      
      if (stukje.gemarkeerd) {
        // Vet, accent-kleur, onderstreept (stippellijn onder)
        tekenTekst(pdf, curX, baselineY, tekst, {
          size: FONT_GROOTTE_INHOUD,
          kleur: accentKleur,
          vet: true
        });
        // Stippellijn onder
        tekenLijn(pdf, curX, baselineY + 1.5, curX + w, {
          kleur: accentKleur,
          dikte: 0.4,
          streepjes: [0.8, 0.8]
        });
      } else {
        tekenTekst(pdf, curX, baselineY, tekst, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST
        });
      }
      
      curX += w;
    }
  }
  
  /* ==========================================================
     OV08 — MEERVOUDEN
     
     4 niveaus:
       ⭐ basis:       2-koloms grid van cellen. Per cel:
                        grondwoord + 2 keuze-pillen (-en/-s) + schrijflijn.
                        Layout identiek aan OV07-basis → hergebruik.
       ⭐⭐ kern:       2-koloms rij-lijst, 4 elementen per rij:
                        "1 grondwoord  →  telwoord  [schrijflijn]"
                        Telwoord ("veel", "drie", "sommige"...) als blauwe cursieve hint.
       ⭐⭐⭐ verdieping: identiek aan OV07-verdieping (kop "enkelvoud ↔ meervoud" +
                        afwisselend pil/schrijflijn). DOM-classes zijn 
                        compatibel → hergebruik.
       ⭐⭐⭐⭐ uitbreiding: zin-lijst met "(grondwoord) [schrijflijn]" inline,
                          daaronder apart blok "Schrijf zelf 3 zinnen" + 3 lijnen.
     ========================================================== */
  
  function tekenOV08(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov08");
      return;
    }
    
    // --- 1. Lijntype, lijnhoogte, niveau ---
    const werkbladEl = itemEl.querySelector(".werkblad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "middel";
    const niveau = werkbladEl?.getAttribute("data-niveau") || item.niveau || "basis";
    const metOplossingen = item.metAntwoorden === true;
    
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    // --- 2. Opdracht-stappen ---
    const stappen = _haalOpdrachtStappen(itemEl, "ov08");
    const opdrachtStappen = stappen.length > 0 ? stappen :
      ["Lees het grondwoord.", "Schrijf het meervoud."];
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
    // --- 3. Routing per niveau ---
    if (niveau === "basis") {
      // OV08-basis = OV07-basis qua DOM-structuur (zelfde classes)
      // maar de keuzes zijn "-en"/"-s" ipv "-je/-tje/-pje" — werkt automatisch
      // omdat we de keuze-pillen uit de DOM lezen.
      _tekenOV07Basis(state, itemEl, opdrachtStappen, opdrachtHoogte, 
                      lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "kern") {
      _tekenOV08Kern(state, itemEl, opdrachtStappen, opdrachtHoogte,
                     lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "verdieping") {
      // OV08-verdieping = OV07-verdieping qua DOM. Wel andere kop-labels.
      _tekenOV08Verdieping(state, itemEl, opdrachtStappen, opdrachtHoogte,
                           lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "uitbreiding") {
      _tekenOV08Uitbreiding(state, itemEl, opdrachtStappen, opdrachtHoogte,
                            lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    }
  }
  
  /* ⭐⭐ KERN: 2-koloms rij-lijst. Per rij:
     "1 grondwoord  →  telwoord  [schrijflijn]" */
  function _tekenOV08Kern(state, itemEl, opdrachtStappen, opdrachtHoogte,
                          lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel rijen
    const rijen = [];
    itemEl.querySelectorAll(".ov08-rij-kern, .ov07-rij-kern").forEach(rijEl => {
      const grondEl = rijEl.querySelector(".ov08-grondwoord, .ov07-grondwoord");
      const telwoordEl = rijEl.querySelector(".ov08-telwoord, .ov07-telwoord");
      const antwoordEl = rijEl.querySelector(".ov08-lijn-antwoord, .ov07-lijn-antwoord");
      rijen.push({
        grondwoord: grondEl ? grondEl.textContent.trim() : "",
        telwoord: telwoordEl ? telwoordEl.textContent.trim() : "",
        antwoord: antwoordEl ? antwoordEl.textContent.trim() : ""
      });
    });
    
    if (rijen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov08");
      return;
    }
    
    // Layout: 2 kolommen, elk met (1 woord + pijl + telwoord + schrijflijn).
    // Schrijflijn-positie binnen elke kolom is DYNAMISCH: hij start vlak na 
    // het telwoord. Zo krijgt zelfs "sommige" genoeg ruimte zonder dat we 
    // alle telwoorden de breedte van het langste woord moeten geven.
    const KOLOMMEN = 2;
    const KOL_SPACING = 4;
    const RIJ_SPACING = 5;
    
    const kolBreedte = (breedte - (KOLOMMEN - 1) * KOL_SPACING) / KOLOMMEN;
    
    const GRONDWOORD_BREEDTE = 18;  // genoeg voor "schoen", "dokter", "ladder" 
                                    // ("1 " is weggehaald, daarom korter)
    const PIJL_BREEDTE = 6;
    const SPACING_PIJL_TELWOORD = 1;
    const SPACING_TELWOORD_LIJN = 2;
    const HINT_FONT = 13;
    
    const rijHoogte = SCHRIJFLIJN_HOOGTE + 4;
    
    reserveerRuimte(state, opdrachtHoogte + 4 + rijHoogte + RIJ_SPACING);
    
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    const KLEUR_TELWOORD = [33, 78, 145];  // donkerblauw
    
    for (let i = 0; i < rijen.length; i += KOLOMMEN) {
      const rijGroep = rijen.slice(i, i + KOLOMMEN);
      
      if (i > 0) reserveerRuimte(state, rijHoogte + RIJ_SPACING);
      
      const rijY = state.cursorY;
      const lijnTopY = rijY + 2;
      const tekstBaseline = lijnTopY + 2 * L - 0.5;
      
      for (let j = 0; j < rijGroep.length; j++) {
        const r = rijGroep[j];
        const kolX = x + j * (kolBreedte + KOL_SPACING);
        
        // "1 grondwoord" (vet, iets kleiner)
        tekenTekst(pdf, kolX, tekstBaseline, r.grondwoord, {
          size: HINT_FONT,
          kleur: KLEUR_TEKST,
          vet: true
        });
        
        // Pijl (vlak na grondwoord-kolom)
        const pijlX = kolX + GRONDWOORD_BREEDTE;
        tekenPijl(pdf, pijlX, lijnTopY, PIJL_BREEDTE, SCHRIJFLIJN_HOOGTE, {
          richting: "rechts",
          kleur: KLEUR_TEKST,
          dikte: 0.5
        });
        
        // Telwoord (cursief blauw, hint, iets kleiner) — dynamische breedte!
        const telwoordX = pijlX + PIJL_BREEDTE + SPACING_PIJL_TELWOORD;
        let telwoordBreedte = 0;
        if (r.telwoord) {
          // Meet de werkelijke breedte van het telwoord
          pdf.setFont(FONT_FAMILIE, "italic");
          pdf.setFontSize(HINT_FONT);
          telwoordBreedte = pdf.getTextWidth(r.telwoord);
          
          tekenTekst(pdf, telwoordX, tekstBaseline, r.telwoord, {
            size: HINT_FONT,
            kleur: KLEUR_TELWOORD,
            cursief: true
          });
        }
        
        // Schrijflijn start daar waar telwoord eindigt + kleine spacing.
        // Lijn-einde valt op kolom-rand zodat alle lijn-EINDES wel netjes uitlijnen.
        const lijnX = telwoordX + telwoordBreedte + SPACING_TELWOORD_LIJN;
        const lijnEindX = kolX + kolBreedte;
        const lijnBreedte = lijnEindX - lijnX;
        
        tekenSchrijflijn(pdf, lijnX, lijnTopY, lijnBreedte, lijntype, lijnhoogte);
        
        if (metOplossingen && r.antwoord) {
          tekenTekst(pdf, lijnX + 2, tekstBaseline, r.antwoord, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      state.cursorY += rijHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 4;
  }
  
  /* ⭐⭐⭐ VERDIEPING — zelfde layout als OV07-verdieping maar met kop 
     "enkelvoud ↔ meervoud" ipv "woord ↔ verkleinwoord". */
  function _tekenOV08Verdieping(state, itemEl, opdrachtStappen, opdrachtHoogte,
                                 lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Hergebruik OV07-DOM-leeslogica (zelfde classes)
    const rijen = [];
    itemEl.querySelectorAll(".ov07-rij-verdieping, .ov08-rij-verdieping").forEach(rijEl => {
      const richting = rijEl.getAttribute("data-richting") || "vul-meervoud";
      const woordCol = rijEl.querySelector(".ov07-kol-woord, .ov08-kol-woord, .ov08-kol-enkelvoud");
      const meervoudCol = rijEl.querySelector(".ov07-kol-verklein, .ov08-kol-meervoud, .ov08-kol-verklein");
      
      const dataWoord = rijEl.getAttribute("data-woord") || "";
      
      let gegevenLinks = "", gegevenRechts = "";
      let antwoordLinks = "", antwoordRechts = "";
      
      // Welke kant heeft een schrijflijn (= ov07-lijn-antwoord span aanwezig)?
      const linksHeeftLijn = woordCol?.querySelector(".ov07-lijn-antwoord, .ov08-lijn-antwoord");
      const rechtsHeeftLijn = meervoudCol?.querySelector(".ov07-lijn-antwoord, .ov08-lijn-antwoord");
      
      // Bij oplossingen: er staat altijd een lijn-antwoord-span; we kijken naar 
      // welke kolom géén tekst-only inhoud heeft.
      if (richting === "vul-meervoud" || richting === "vul-verklein") {
        // links = enkelvoud gegeven, rechts = schrijflijn
        gegevenLinks = woordCol ? woordCol.textContent.trim() : dataWoord;
        const antwEl = meervoudCol?.querySelector(".ov07-lijn-antwoord, .ov08-lijn-antwoord");
        antwoordRechts = antwEl ? antwEl.textContent.trim() : "";
      } else {
        // links = schrijflijn, rechts = meervoud gegeven
        const antwEl = woordCol?.querySelector(".ov07-lijn-antwoord, .ov08-lijn-antwoord");
        antwoordLinks = antwEl ? antwEl.textContent.trim() : "";
        gegevenRechts = meervoudCol ? meervoudCol.textContent.trim() : "";
      }
      
      rijen.push({ richting, gegevenLinks, gegevenRechts, antwoordLinks, antwoordRechts });
    });
    
    if (rijen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov08");
      return;
    }
    
    // Identiek aan OV07-verdieping qua layout
    const KOP_HOOGTE = 9;
    const KOL_SPACING = 6;
    const PIJL_BREEDTE = 10;
    const RIJ_SPACING = 5;
    
    const kolBreedte = (breedte - 2 * KOL_SPACING - PIJL_BREEDTE) / 2;
    const rijHoogte = SCHRIJFLIJN_HOOGTE + 4;
    
    reserveerRuimte(state, opdrachtHoogte + 4 + KOP_HOOGTE + 4 + rijHoogte + RIJ_SPACING);
    
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // Kolom-kop "enkelvoud ↔ meervoud"
    const kopY = state.cursorY;
    const KLEUR_BLAUW_TITEL = [33, 78, 145];
    
    // Linker kop op kolBreedte/2 vanaf x
    tekenTekst(pdf, x + kolBreedte / 2, kopY + 5, "enkelvoud", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_BLAUW_TITEL,
      vet: true,
      gecentreerd: true
    });
    // Rechter kop op (kolBreedte + KOL_SPACING + PIJL_BREEDTE + KOL_SPACING + kolBreedte/2) vanaf x
    const rechtsKopX = x + kolBreedte + KOL_SPACING + PIJL_BREEDTE + KOL_SPACING + kolBreedte / 2;
    tekenTekst(pdf, rechtsKopX, kopY + 5, "meervoud", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_BLAUW_TITEL,
      vet: true,
      gecentreerd: true
    });
    tekenLijn(pdf, x, kopY + 8, x + breedte, { kleur: KLEUR_BLAUW_TITEL, dikte: 0.5 });
    state.cursorY += KOP_HOOGTE + 3;
    
    // Rijen
    for (const r of rijen) {
      reserveerRuimte(state, rijHoogte + RIJ_SPACING);
      const rijY = state.cursorY;
      const lijnTopY = rijY + 2;
      const tekstBaseline = lijnTopY + 2 * L - 0.5;
      
      const linksX = x;
      const pijlX = x + kolBreedte + KOL_SPACING;
      const rechtsX = pijlX + PIJL_BREEDTE + KOL_SPACING;
      
      // LINKS
      if (r.gegevenLinks) {
        _tekenOV07GegevenPil(pdf, linksX, rijY, kolBreedte, rijHoogte, r.gegevenLinks);
      } else {
        tekenSchrijflijn(pdf, linksX, lijnTopY, kolBreedte, lijntype, lijnhoogte);
        if (metOplossingen && r.antwoordLinks) {
          tekenTekst(pdf, linksX + 2, tekstBaseline, r.antwoordLinks, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      // PIJL (vector, tweekant)
      tekenPijl(pdf, pijlX, rijY, PIJL_BREEDTE, rijHoogte, {
        richting: "tweekant",
        kleur: KLEUR_TEKST,
        dikte: 0.5
      });
      
      // RECHTS
      if (r.gegevenRechts) {
        _tekenOV07GegevenPil(pdf, rechtsX, rijY, kolBreedte, rijHoogte, r.gegevenRechts);
      } else {
        tekenSchrijflijn(pdf, rechtsX, lijnTopY, kolBreedte, lijntype, lijnhoogte);
        if (metOplossingen && r.antwoordRechts) {
          tekenTekst(pdf, rechtsX + 2, tekstBaseline, r.antwoordRechts, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      state.cursorY += rijHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 4;
  }
  
  /* ⭐⭐⭐⭐ UITBREIDING: 
     Deel 1: 5 genummerde invul-zinnen met "(grondwoord) [schrijflijn]" inline.
     Deel 2: "Schrijf zelf 3 zinnen..." + 3 lege schrijflijnen. */
  function _tekenOV08Uitbreiding(state, itemEl, opdrachtStappen, opdrachtHoogte,
                                  lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel invul-zinnen
    const zinnen = [];
    itemEl.querySelectorAll(".ov08-invul-zin").forEach(zinEl => {
      // Een zin bestaat uit tekst-stukjes en één .ov08-invul-lijn span 
      // die de schrijflijn vervangt. De grondwoord-marker "(woord)" staat 
      // er als gewone tekst vóór.
      const stukjes = [];
      let antwoord = "";
      
      zinEl.childNodes.forEach(node => {
        if (node.nodeType === 3) {
          // Text node
          stukjes.push({ tekst: node.textContent, isLijn: false });
        } else if (node.classList && node.classList.contains("ov08-invul-lijn")) {
          // Hier komt de schrijflijn
          const antwEl = node.querySelector(".ov08-invul-antwoord");
          if (antwEl) antwoord = antwEl.textContent.trim();
          stukjes.push({ tekst: "", isLijn: true, antwoord });
        } else {
          // Andere elementen (eventuele <strong>) als tekst inlezen
          stukjes.push({ tekst: node.textContent || "", isLijn: false });
        }
      });
      
      zinnen.push(stukjes);
    });
    
    if (zinnen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov08");
      return;
    }
    
    // Verzamel eigen-blok info
    const eigenTitelEl = itemEl.querySelector(".ov08-eigen-titel");
    const eigenTitel = eigenTitelEl ? eigenTitelEl.textContent.trim() 
                                    : "Schrijf nu zelf 3 zinnen waarin woorden in het meervoud staan.";
    const aantalEigenLijnen = itemEl.querySelectorAll(".ov08-eigen-lijn").length || 3;
    
    // Layout-parameters
    const ZIN_RIJ_HOOGTE = SCHRIJFLIJN_HOOGTE + 5;  // zin + lijn + padding
    const ZIN_SPACING = 3;
    const NR_BREEDTE = 8;
    const INLINE_LIJN_BREEDTE = 60;  // mm — schrijflijn binnen zin
    
    const SCHEIDER_HOOGTE = 6;  // ruimte tussen invul-deel en eigen-deel
    const EIGEN_TITEL_HOOGTE = 9;
    const eigenLijnenHoogte = aantalEigenLijnen * SCHRIJFLIJN_HOOGTE + (aantalEigenLijnen - 1) * 2;
    
    // OV08 uitbreiding MAG splitsen — elke invul-zin is een eigen mini-eenheid,
    // en het eigen-blok mag ook op een nieuwe pagina starten. We reserveren 
    // alleen opdracht + eerste zin samen (zoals de andere OV's).
    reserveerRuimte(state, opdrachtHoogte + 4 + ZIN_RIJ_HOOGTE + ZIN_SPACING);
    
    // Opdracht-kader
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // === Deel 1: invul-zinnen ===
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    
    for (let i = 0; i < zinnen.length; i++) {
      // Reserveer ruimte voor deze zin (page-break tussen zinnen mag)
      if (i > 0) reserveerRuimte(state, ZIN_RIJ_HOOGTE + ZIN_SPACING);
      
      const stukjes = zinnen[i];
      const yRij = state.cursorY;
      const lijnTopY = yRij + 2;
      const tekstBaseline = lijnTopY + 2 * L - 0.5;
      
      // Nummer
      tekenTekst(pdf, x, tekstBaseline, (i + 1) + ".", {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST,
        vet: true
      });
      
      let curX = x + NR_BREEDTE;
      
      // Render de zin-stukjes
      for (const stukje of stukjes) {
        if (stukje.isLijn) {
          // Schrijflijn EERST (x-zone-vulling zou anders antwoord bedekken)
          tekenSchrijflijn(pdf, curX, lijnTopY, INLINE_LIJN_BREEDTE, lijntype, lijnhoogte);
          if (metOplossingen && stukje.antwoord) {
            tekenTekst(pdf, curX + 2, tekstBaseline, stukje.antwoord, {
              size: FONT_GROOTTE_INHOUD,
              kleur: KLEUR_TEKST
            });
          }
          curX += INLINE_LIJN_BREEDTE;
        } else if (stukje.tekst && stukje.tekst.trim()) {
          // Compacte tekst — geen extra spaties trimmen want originele 
          // spaties horen bij de zin
          tekenTekst(pdf, curX, tekstBaseline, stukje.tekst, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
          curX += pdf.getTextWidth(stukje.tekst);
        }
      }
      
      state.cursorY += ZIN_RIJ_HOOGTE + ZIN_SPACING;
    }
    
    state.cursorY += SCHEIDER_HOOGTE;
    
    // === Deel 2: eigen zinnen ===
    // Reserveer titel + eerste lijn samen zodat de titel niet alleen onderaan 
    // een pagina komt (wees-titel). De rest van de lijnen mag wel splitsen.
    reserveerRuimte(state, EIGEN_TITEL_HOOGTE + SCHRIJFLIJN_HOOGTE + 2);
    
    tekenTekst(pdf, x, state.cursorY + 5, eigenTitel, {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true
    });
    state.cursorY += EIGEN_TITEL_HOOGTE;
    
    // Lege schrijflijnen — mogen splitsen tussen lijnen
    for (let i = 0; i < aantalEigenLijnen; i++) {
      if (i > 0) reserveerRuimte(state, SCHRIJFLIJN_HOOGTE + 2);
      tekenSchrijflijn(pdf, x, state.cursorY, breedte, lijntype, lijnhoogte);
      state.cursorY += SCHRIJFLIJN_HOOGTE + 2;
    }
    
    state.cursorY += 4;
  }
  
  /* ==========================================================
     OV09 — KLINKERDIEF (verdubbelen / verenkelen / schrijf wat je hoort)
     
     4 niveaus:
       ⭐ basis:       2-koloms grid van cellen. Per cel: plaatje boven,
                        2 keuzes met radio-bolletjes, schrijflijn onder.
       ⭐⭐ kern:       3-koloms grid van compactere cellen. Per cel:
                        plaatje + schrijflijn (geen keuzes).
       ⭐⭐⭐ verdieping: 3×3 plaatjes-grid + 3 gekleurde sorteerkolommen.
       ⭐⭐⭐⭐ uitbreiding: genummerde zinnen met fout-woord + correctie-lijn.
                          In oplossingen: fout-woord doorgestreept + onderstreept.
     ========================================================== */
  
  function tekenOV09(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov09");
      return;
    }
    
    const werkbladEl = itemEl.querySelector(".werkblad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "middel";
    const niveau = werkbladEl?.getAttribute("data-niveau") || item.niveau || "basis";
    const metOplossingen = item.metAntwoorden === true;
    
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    const stappen = _haalOpdrachtStappen(itemEl, "ov09");
    const opdrachtStappen = stappen.length > 0 ? stappen :
      ["Bekijk het woord.", "Schrijf het juist op de lijn."];
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
    // Bouw woord-lookup voor PNG's
    const woordPool = [
      ...(item.actieveWoorden || []),
      ...(item.extraWoorden || []),
      ...(item.gekozenWoordenSnapshot || [])
    ];
    const woordLookup = new Map();
    for (const w of woordPool) {
      if (w && w.tekst && !woordLookup.has(w.tekst)) {
        if (!w.graad && !w.leerjaar && item.graad) w.graad = item.graad;
        woordLookup.set(w.tekst, w);
      }
    }
    
    if (niveau === "basis") {
      _tekenOV09Basis(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                      lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "kern") {
      _tekenOV09Kern(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                     lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "verdieping") {
      _tekenOV09Verdieping(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                           lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "uitbreiding") {
      _tekenOV09Uitbreiding(state, itemEl, opdrachtStappen, opdrachtHoogte,
                            lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    }
  }
  
  /* ⭐ BASIS: 2-koloms grid. Per cel: plaatje, 2 keuzes met ○ bolletjes,
     schrijflijn onder. */
  function _tekenOV09Basis(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                            lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel cellen
    const cellen = [];
    itemEl.querySelectorAll(".ov09-basis-cel").forEach(celEl => {
      const woordAttr = celEl.getAttribute("data-woord") || "";
      const woordObj = woordLookup.get(woordAttr) || { tekst: woordAttr };
      
      const keuzes = [];
      celEl.querySelectorAll(".ov09-basis-keuze").forEach(kEl => {
        // Tekst is alles ná het bolletje. .ov09-bolletje is een leeg span ervóór.
        const bolEl = kEl.querySelector(".ov09-bolletje");
        let tekst = kEl.textContent.trim();
        // Verwijder ev. extra whitespace
        tekst = tekst.replace(/\s+/g, " ");
        // Detecteer juiste keuze: meestal class als "ov09-basis-keuze-juist" of metAntwoorden 
        const isJuist = kEl.className.indexOf("juist") !== -1;
        keuzes.push({ tekst, isJuist });
      });
      
      const antwoordEl = celEl.querySelector(".ov09-lijn-antwoord");
      const antwoord = antwoordEl ? antwoordEl.textContent.trim() : woordAttr;
      
      cellen.push({ woord: woordAttr, woordObj, keuzes, antwoord });
    });
    
    if (cellen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov09");
      return;
    }
    
    // Layout: 2 kolommen, plaatje + keuzes-rij + schrijflijn
    const KOLOMMEN = 2;
    const KOL_SPACING = 6;
    const RIJ_SPACING = 5;
    
    const celBreedte = (breedte - (KOLOMMEN - 1) * KOL_SPACING) / KOLOMMEN;
    
    const PAD = 4;
    const PLAATJE_HOOGTE = 16;
    const SPACING_PLAATJE_KEUZES = 3;
    const KEUZE_HOOGTE = 7;
    const SPACING_KEUZES_LIJN = 4;
    
    const celHoogte = PAD + PLAATJE_HOOGTE + SPACING_PLAATJE_KEUZES 
                    + KEUZE_HOOGTE + SPACING_KEUZES_LIJN + SCHRIJFLIJN_HOOGTE + PAD;
    
    reserveerRuimte(state, opdrachtHoogte + 4 + celHoogte + RIJ_SPACING);
    
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    for (let i = 0; i < cellen.length; i += KOLOMMEN) {
      const rijCellen = cellen.slice(i, i + KOLOMMEN);
      
      if (i > 0) reserveerRuimte(state, celHoogte + RIJ_SPACING);
      
      const rijY = state.cursorY;
      
      for (let j = 0; j < rijCellen.length; j++) {
        const cel = rijCellen[j];
        const celX = x + j * (celBreedte + KOL_SPACING);
        
        _tekenOV09BasisCel(pdf, cel, celX, rijY, celBreedte, {
          PAD, PLAATJE_HOOGTE, SPACING_PLAATJE_KEUZES,
          KEUZE_HOOGTE, SPACING_KEUZES_LIJN, SCHRIJFLIJN_HOOGTE,
          L, lijntype, lijnhoogte, metOplossingen
        });
      }
      
      state.cursorY += celHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 4;
  }
  
  function _tekenOV09BasisCel(pdf, cel, x, y, breedte, cfg) {
    // Cel-kader (zoals OV05)
    tekenKader(pdf, x, y, breedte, 
      cfg.PAD * 2 + cfg.PLAATJE_HOOGTE + cfg.SPACING_PLAATJE_KEUZES 
      + cfg.KEUZE_HOOGTE + cfg.SPACING_KEUZES_LIJN + cfg.SCHRIJFLIJN_HOOGTE, {
      randKleur: KLEUR_LIJN_GRIJS,
      randDikte: 0.3,
      rondeHoeken: 2
    });
    
    let cy = y + cfg.PAD;
    const innerX = x + cfg.PAD;
    const innerBreedte = breedte - 2 * cfg.PAD;
    
    // Plaatje gecentreerd
    if (cel.woordObj && cel.woordObj.categorie) {
      tekenAfbeelding(pdf, innerX, cy, cfg.PLAATJE_HOOGTE, cel.woordObj, {
        maxBreedte: innerBreedte
      });
    }
    cy += cfg.PLAATJE_HOOGTE + cfg.SPACING_PLAATJE_KEUZES;
    
    // Keuzes-rij: 2 radio-bolletjes + tekst
    if (cel.keuzes && cel.keuzes.length > 0) {
      pdf.setFont(FONT_FAMILIE, "normal");
      pdf.setFontSize(13);
      
      // Bereken totale breedte: per keuze (bolletje 3mm + 1.5mm spacing + tekst)
      const BOLLETJE_R = 1.5;  // mm, radius
      const SPACING_BOL_TEKST = 1.8;
      const SPACING_TUSSEN_KEUZES = 8;
      
      const keuzeBreedtes = cel.keuzes.map(k => {
        return 2 * BOLLETJE_R + SPACING_BOL_TEKST + pdf.getTextWidth(k.tekst);
      });
      const totBreedte = keuzeBreedtes.reduce((s, w) => s + w, 0) 
                       + (cel.keuzes.length - 1) * SPACING_TUSSEN_KEUZES;
      let kx = innerX + (innerBreedte - totBreedte) / 2;
      const keuzeMidY = cy + cfg.KEUZE_HOOGTE / 2;
      
      for (let i = 0; i < cel.keuzes.length; i++) {
        const k = cel.keuzes[i];
        const isJuistGetoond = cfg.metOplossingen && k.isJuist;
        
        // Bolletje (cirkel)
        pdf.setDrawColor(KLEUR_TEKST[0], KLEUR_TEKST[1], KLEUR_TEKST[2]);
        pdf.setLineWidth(0.4);
        if (isJuistGetoond) {
          // Gevuld groen bolletje voor juist antwoord
          pdf.setFillColor(47, 154, 68);
          pdf.circle(kx + BOLLETJE_R, keuzeMidY, BOLLETJE_R, "FD");
        } else {
          pdf.circle(kx + BOLLETJE_R, keuzeMidY, BOLLETJE_R, "S");
        }
        
        // Tekst na bolletje
        tekenTekst(pdf, kx + 2 * BOLLETJE_R + SPACING_BOL_TEKST, keuzeMidY + 1.5, k.tekst, {
          size: 13,
          kleur: KLEUR_TEKST,
          vet: isJuistGetoond
        });
        
        kx += keuzeBreedtes[i] + SPACING_TUSSEN_KEUZES;
      }
    }
    cy += cfg.KEUZE_HOOGTE + cfg.SPACING_KEUZES_LIJN;
    
    // Schrijflijn (lijn EERST, antwoord daaroverheen)
    const lijnX = innerX;
    tekenSchrijflijn(pdf, lijnX, cy, innerBreedte, cfg.lijntype, cfg.lijnhoogte);
    
    if (cfg.metOplossingen && cel.antwoord) {
      tekenTekst(pdf, lijnX + 2, cy + 2 * cfg.L - 0.5, cel.antwoord, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST
      });
    }
  }
  
  /* ⭐⭐ KERN: 3-koloms grid van cellen. Per cel: plaatje + schrijflijn. */
  function _tekenOV09Kern(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                           lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel cellen
    const cellen = [];
    itemEl.querySelectorAll(".ov09-kern-cel").forEach(celEl => {
      const woordAttr = celEl.getAttribute("data-woord") || "";
      const woordObj = woordLookup.get(woordAttr) || { tekst: woordAttr };
      const antwoordEl = celEl.querySelector(".ov09-lijn-antwoord");
      const antwoord = antwoordEl ? antwoordEl.textContent.trim() : woordAttr;
      cellen.push({ woord: woordAttr, woordObj, antwoord });
    });
    
    if (cellen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov09");
      return;
    }
    
    // Layout: 3 kolommen
    const KOLOMMEN = 3;
    const KOL_SPACING = 4;
    const RIJ_SPACING = 5;
    
    const celBreedte = (breedte - (KOLOMMEN - 1) * KOL_SPACING) / KOLOMMEN;
    
    const PAD = 4;
    const PLAATJE_HOOGTE = 14;
    const SPACING_PLAATJE_LIJN = 3;
    
    const celHoogte = PAD + PLAATJE_HOOGTE + SPACING_PLAATJE_LIJN + SCHRIJFLIJN_HOOGTE + PAD;
    
    reserveerRuimte(state, opdrachtHoogte + 4 + celHoogte + RIJ_SPACING);
    
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    for (let i = 0; i < cellen.length; i += KOLOMMEN) {
      const rijCellen = cellen.slice(i, i + KOLOMMEN);
      
      if (i > 0) reserveerRuimte(state, celHoogte + RIJ_SPACING);
      
      const rijY = state.cursorY;
      
      for (let j = 0; j < rijCellen.length; j++) {
        const cel = rijCellen[j];
        const celX = x + j * (celBreedte + KOL_SPACING);
        
        tekenKader(pdf, celX, rijY, celBreedte, celHoogte, {
          randKleur: KLEUR_LIJN_GRIJS,
          randDikte: 0.3,
          rondeHoeken: 2
        });
        
        const innerX = celX + PAD;
        const innerBreedte = celBreedte - 2 * PAD;
        let cy = rijY + PAD;
        
        // Plaatje
        if (cel.woordObj && cel.woordObj.categorie) {
          tekenAfbeelding(pdf, innerX, cy, PLAATJE_HOOGTE, cel.woordObj, {
            maxBreedte: innerBreedte
          });
        }
        cy += PLAATJE_HOOGTE + SPACING_PLAATJE_LIJN;
        
        // Schrijflijn EERST, antwoord daaroverheen
        tekenSchrijflijn(pdf, innerX, cy, innerBreedte, lijntype, lijnhoogte);
        if (metOplossingen && cel.antwoord) {
          tekenTekst(pdf, innerX + 2, cy + 2 * L - 0.5, cel.antwoord, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      state.cursorY += celHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 4;
  }
  
  /* ⭐⭐⭐ VERDIEPING: 3×3 plaatjes-grid + 3 gekleurde sorteerkolommen onder. */
  function _tekenOV09Verdieping(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                                 lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Plaatjes verzamelen
    const plaatjes = [];
    itemEl.querySelectorAll(".ov09-verdieping-cel").forEach(celEl => {
      const woordAttr = celEl.getAttribute("data-woord") || "";
      const woordObj = woordLookup.get(woordAttr) || { tekst: woordAttr };
      plaatjes.push({ woord: woordAttr, woordObj });
    });
    
    // Kolommen verzamelen (3 stuks)
    const kolommen = [];
    itemEl.querySelectorAll(".ov09-verdieping-kolom").forEach(kolEl => {
      const kop = kolEl.querySelector(".ov09-verdieping-kolom-kop");
      const kopTekst = kop ? kop.textContent.trim() : "";
      // Achtergrondkleur uit inline style
      const stijl = kop?.getAttribute("style") || "";
      const kleurMatch = stijl.match(/background:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/);
      const kleurHex = kleurMatch ? kleurMatch[1] : "#888888";
      const kleurRGB = _hexNaarRGB(kleurHex);
      
      const lijnen = [];
      kolEl.querySelectorAll(".ov09-verdieping-kolom-lijn").forEach(lijnEl => {
        const antwEl = lijnEl.querySelector(".ov09-lijn-antwoord");
        lijnen.push({ antwoord: antwEl ? antwEl.textContent.trim() : "" });
      });
      
      kolommen.push({ kopTekst, kleur: kleurRGB, lijnen });
    });
    
    if (plaatjes.length === 0 || kolommen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov09");
      return;
    }
    
    // === Layout ===
    // Bovenste blok: 3x3 plaatjes-grid in een licht-grijs gestreepte kader
    const AFB_KOLOMMEN = 3;
    const AFB_RIJEN = Math.ceil(plaatjes.length / AFB_KOLOMMEN);
    const AFB_SPACING = 4;
    const AFB_BLOK_PAD = 5;
    const AFB_BREEDTE = (breedte - 2 * AFB_BLOK_PAD - (AFB_KOLOMMEN - 1) * AFB_SPACING) / AFB_KOLOMMEN;
    const AFB_HOOGTE = 22;
    
    const afbBlokHoogte = 2 * AFB_BLOK_PAD + AFB_RIJEN * AFB_HOOGTE + (AFB_RIJEN - 1) * AFB_SPACING;
    
    // Onderste blok: 3 kolommen met header + schrijflijnen
    const KOL_KOP_H = 9;
    const KOL_SPACING = 6;
    const kolBreedte = (breedte - (kolommen.length - 1) * KOL_SPACING) / kolommen.length;
    const maxLijnen = Math.max(...kolommen.map(k => k.lijnen.length));
    const KOL_LIJN_SPACING = 2;
    const kolInhoudH = maxLijnen * SCHRIJFLIJN_HOOGTE + (maxLijnen - 1) * KOL_LIJN_SPACING;
    const KOL_PAD = 4;
    const kolBlokHoogte = KOL_KOP_H + 2 * KOL_PAD + kolInhoudH;
    
    // Reserveer voor opdracht + plaatjes-blok + kolommen
    const totaalNodig = opdrachtHoogte + 4 + afbBlokHoogte + 6 + kolBlokHoogte + 6;
    reserveerRuimte(state, totaalNodig);
    
    // Opdracht
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // === Plaatjes-blok ===
    const afbBlokY = state.cursorY;
    tekenKader(pdf, x, afbBlokY, breedte, afbBlokHoogte, {
      vulKleur: [250, 250, 252],
      randKleur: KLEUR_LIJN_GRIJS,
      randDikte: 0.4,
      rondeHoeken: 2
    });
    
    for (let i = 0; i < plaatjes.length; i++) {
      const r = Math.floor(i / AFB_KOLOMMEN);
      const c = i % AFB_KOLOMMEN;
      const px = x + AFB_BLOK_PAD + c * (AFB_BREEDTE + AFB_SPACING);
      const py = afbBlokY + AFB_BLOK_PAD + r * (AFB_HOOGTE + AFB_SPACING);
      
      // Plaatje-kader (licht wit)
      tekenKader(pdf, px, py, AFB_BREEDTE, AFB_HOOGTE, {
        vulKleur: [255, 255, 255],
        randKleur: KLEUR_LIJN_GRIJS,
        randDikte: 0.3,
        rondeHoeken: 1.5
      });
      
      // Plaatje gecentreerd
      if (plaatjes[i].woordObj && plaatjes[i].woordObj.categorie) {
        const plH = AFB_HOOGTE - 4;
        tekenAfbeelding(pdf, px + 2, py + 2, plH, plaatjes[i].woordObj, {
          maxBreedte: AFB_BREEDTE - 4
        });
      }
    }
    
    state.cursorY += afbBlokHoogte + 6;
    
    // === Sorteerkolommen ===
    const kolY = state.cursorY;
    for (let i = 0; i < kolommen.length; i++) {
      const kol = kolommen[i];
      const kolX = x + i * (kolBreedte + KOL_SPACING);
      
      // Header (gekleurde balk)
      tekenKader(pdf, kolX, kolY, kolBreedte, KOL_KOP_H + 2, {
        vulKleur: kol.kleur,
        randKleur: kol.kleur,
        rondeHoeken: 2
      });
      // Kolom-rand
      tekenKader(pdf, kolX, kolY, kolBreedte, kolBlokHoogte, {
        randKleur: kol.kleur,
        randDikte: 0.6,
        rondeHoeken: 2
      });
      
      // Header-tekst (wit, vet)
      // Strip emoji uit kopTekst — die zou corrupt renderen in jsPDF.
      const kopZonderEmoji = kol.kopTekst.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
      tekenTekst(pdf, kolX + kolBreedte / 2, kolY + (KOL_KOP_H + 2) / 2 + 2, kopZonderEmoji, {
        size: 13,
        kleur: [255, 255, 255],
        vet: true,
        gecentreerd: true
      });
      
      // Schrijflijnen onder de header
      let lijnY = kolY + KOL_KOP_H + 2 + KOL_PAD;
      const lijnInnerX = kolX + 2;
      const lijnInnerBreedte = kolBreedte - 4;
      
      for (let j = 0; j < maxLijnen; j++) {
        // Schrijflijn EERST
        tekenSchrijflijn(pdf, lijnInnerX, lijnY, lijnInnerBreedte, lijntype, lijnhoogte);
        // Antwoord (kan leeg zijn)
        const antw = kol.lijnen[j]?.antwoord;
        if (metOplossingen && antw) {
          tekenTekst(pdf, lijnInnerX + 2, lijnY + 2 * L - 0.5, antw, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
        lijnY += SCHRIJFLIJN_HOOGTE + KOL_LIJN_SPACING;
      }
    }
    
    state.cursorY = kolY + kolBlokHoogte + 6;
  }
  
  /* Helper: hex-kleur naar [r, g, b] array */
  function _hexNaarRGB(hex) {
    let h = hex.replace("#", "");
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return [r, g, b];
  }
  
  /* ⭐⭐⭐⭐ UITBREIDING: genummerde zinnen met fout-woord + correctie-lijn.
     In oplossingen: fout-woord doorgestreept + onderstreept zodat het opvalt. */
  function _tekenOV09Uitbreiding(state, itemEl, opdrachtStappen, opdrachtHoogte,
                                  lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel rijen
    const rijen = [];
    itemEl.querySelectorAll(".ov09-uitbreiding-rij").forEach(rijEl => {
      const nrEl = rijEl.querySelector(".ov09-uitbreiding-nr");
      const zinEl = rijEl.querySelector(".ov09-uitbreiding-zin");
      const antwoordEl = rijEl.querySelector(".ov09-lijn-antwoord");
      
      const nr = nrEl ? nrEl.textContent.trim() : "";
      
      // Zin parsen: tekst-stukjes + één gemarkeerde "fout"-span
      const stukjes = [];
      if (zinEl) {
        zinEl.childNodes.forEach(node => {
          if (node.nodeType === 3) {
            stukjes.push({ tekst: node.textContent, isFout: false });
          } else if (node.classList && node.classList.contains("ov09-uitbreiding-fout")) {
            stukjes.push({ tekst: node.textContent.trim(), isFout: true });
          } else {
            stukjes.push({ tekst: node.textContent || "", isFout: false });
          }
        });
        // Als geen .ov09-uitbreiding-fout span aanwezig was (niet-oplossingen-modus),
        // is de zin gewoon platte tekst — vul stukjes met die tekst
        if (stukjes.length === 0 || !stukjes.some(s => s.isFout)) {
          stukjes.length = 0;
          stukjes.push({ tekst: zinEl.textContent.trim(), isFout: false });
        }
      }
      
      const antwoord = antwoordEl ? antwoordEl.textContent.trim() : "";
      
      rijen.push({ nr, stukjes, antwoord });
    });
    
    if (rijen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov09");
      return;
    }
    
    // Layout
    const NR_BREEDTE = 8;
    const SPACING_ZIN_LIJN = 3;  // verticaal tussen zin en correctie-lijn
    const PIJL_BREEDTE = 8;
    const LIJN_INSPRING = 10;  // pijl-positie + tekst inspringt
    
    const ZIN_REGEL_HOOGTE = 7;
    const SPACING_TUSSEN_LIJNEN_RIJHOOGTE = 2;
    // 2 schrijflijnen onder de zin
    const rijHoogte = ZIN_REGEL_HOOGTE + SPACING_ZIN_LIJN 
                    + 2 * SCHRIJFLIJN_HOOGTE + SPACING_TUSSEN_LIJNEN_RIJHOOGTE + 3;
    const RIJ_SPACING = 6;
    
    reserveerRuimte(state, opdrachtHoogte + 4 + rijHoogte + RIJ_SPACING);
    
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    pdf.setFont(FONT_FAMILIE, "normal");
    pdf.setFontSize(FONT_GROOTTE_INHOUD);
    
    const KLEUR_FOUT = [200, 30, 30];  // rood voor doorgestreept fout-woord
    
    for (let i = 0; i < rijen.length; i++) {
      if (i > 0) reserveerRuimte(state, rijHoogte + RIJ_SPACING);
      
      const r = rijen[i];
      const yStart = state.cursorY;
      
      // Zin-regel
      const zinY = yStart + 5;  // baseline van de zin-tekst
      
      // Nr
      tekenTekst(pdf, x, zinY, r.nr, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST,
        vet: true
      });
      
      // Render zin-stukjes met evt. doorstreepte fout
      let curX = x + NR_BREEDTE;
      for (const stukje of r.stukjes) {
        if (!stukje.tekst) continue;
        
        // Meet breedte met JUIST font (vet voor fout-woord), anders plakt 
        // het volgende woord ertegen.
        const fout = stukje.isFout && metOplossingen;
        pdf.setFont(FONT_FAMILIE, fout ? "bold" : "normal");
        pdf.setFontSize(FONT_GROOTTE_INHOUD);
        const w = pdf.getTextWidth(stukje.tekst);
        
        if (fout) {
          // Fout-woord: rood, vet, doorgestreept + onderstreept (extra opvallend)
          tekenTekst(pdf, curX, zinY, stukje.tekst, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_FOUT,
            vet: true
          });
          // Doorstreep-lijn door het midden
          tekenLijn(pdf, curX, zinY - 1.5, curX + w, {
            kleur: KLEUR_FOUT,
            dikte: 0.7
          });
          // Onderstreep — extra accentueren
          tekenLijn(pdf, curX, zinY + 1, curX + w, {
            kleur: KLEUR_FOUT,
            dikte: 0.5
          });
        } else {
          tekenTekst(pdf, curX, zinY, stukje.tekst, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
        
        curX += w;
      }
      
      // 2 schrijflijnen onder de zin, op volle paginabreedte.
      // Kind streept fout door en schrijft de hele juiste zin over.
      const lijn1Y = yStart + ZIN_REGEL_HOOGTE + SPACING_ZIN_LIJN;
      const SPACING_TUSSEN_LIJNEN = 2;
      const lijn2Y = lijn1Y + SCHRIJFLIJN_HOOGTE + SPACING_TUSSEN_LIJNEN;
      
      // Schrijflijn 1
      tekenSchrijflijn(pdf, x, lijn1Y, breedte, lijntype, lijnhoogte);
      // Bij oplossingen: hele juiste zin op de eerste lijn
      if (metOplossingen && r.antwoord) {
        tekenTekst(pdf, x + 2, lijn1Y + 2 * L - 0.5, r.antwoord, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST
        });
      }
      
      // Schrijflijn 2 (altijd leeg — overflow voor lange zinnen)
      tekenSchrijflijn(pdf, x, lijn2Y, breedte, lijntype, lijnhoogte);
      
      state.cursorY = yStart + rijHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 2;
  }
  
  /* ==========================================================
     OV10 — SAMENSTELLINGEN
     
     4 niveaus, heel divers:
       ⭐ basis:       Woordzoeker — afbeeldingen-grid + letter-rooster + 
                        2-koloms noteer-lijnen
       ⭐⭐ kern:       Plaatje + plaatje = samenstelling op één lijn
       ⭐⭐⭐ verdieping: 2 verbind-mini-oefeningen naast elkaar 
                        (kolommen woorden met bolletjes + noteer-lijnen)
       ⭐⭐⭐⭐ uitbreiding: beschrijving + schrijflijn per rij
     ========================================================== */
  
  function tekenOV10(state, item) {
    const pdf = state.pdf;
    const itemEl = document.querySelector(`.hb-item[data-item-id="${item.id}"]`);
    if (!itemEl) {
      _tekenStubOV(state, item, "ov10");
      return;
    }
    
    const werkbladEl = itemEl.querySelector(".werkblad");
    const lijntype = werkbladEl?.getAttribute("data-lijntype") || "type3";
    const lijnhoogte = werkbladEl?.getAttribute("data-lijnhoogte") || "middel";
    const niveau = werkbladEl?.getAttribute("data-niveau") || item.niveau || "basis";
    const metOplossingen = item.metAntwoorden === true;
    
    let L = 5.5;
    if (lijnhoogte === "klein") L = 4.0;
    else if (lijnhoogte === "groot") L = 7.5;
    const SCHRIJFLIJN_HOOGTE = 3 * L;
    
    const stappen = _haalOpdrachtStappen(itemEl, "ov10");
    const opdrachtStappen = stappen.length > 0 ? stappen :
      ["Lees de opdracht.", "Werk de samenstelling uit."];
    const opdrachtHoogte = 2 * 4 + 7 + opdrachtStappen.length * 7.5;
    
    // Woord-lookup voor PNG's
    const woordPool = [
      ...(item.actieveWoorden || []),
      ...(item.extraWoorden || []),
      ...(item.gekozenWoordenSnapshot || [])
    ];
    const woordLookup = new Map();
    for (const w of woordPool) {
      if (w && w.tekst && !woordLookup.has(w.tekst)) {
        if (!w.graad && !w.leerjaar && item.graad) w.graad = item.graad;
        woordLookup.set(w.tekst, w);
      }
    }
    
    if (niveau === "basis") {
      _tekenOV10Basis(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                      lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "kern") {
      _tekenOV10Kern(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                     lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "verdieping") {
      _tekenOV10Verdieping(state, itemEl, opdrachtStappen, opdrachtHoogte,
                           lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    } else if (niveau === "uitbreiding") {
      _tekenOV10Uitbreiding(state, itemEl, opdrachtStappen, opdrachtHoogte,
                            lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen);
    }
  }
  
  /* ⭐ BASIS: Woordzoeker = afbeeldingen-grid + letter-rooster + noteer-lijnen */
  function _tekenOV10Basis(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                            lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel afbeeldingen — combineer info uit de cel zelf met de woord-lookup
    const afbeeldingen = [];
    itemEl.querySelectorAll(".ov10-basis-afb-cel").forEach(celEl => {
      const imgEl = celEl.querySelector("img");
      const emojiEl = celEl.querySelector(".ov10-afb-emoji-combo");
      
      // Woord-naam achterhalen
      let woordTekst = "";
      if (imgEl) {
        woordTekst = imgEl.getAttribute("alt") || "";
      }
      
      // Probeer eerst woord-object uit de lookup (heeft delen, delenEmoji, etc.)
      let woordObj = woordTekst ? woordLookup.get(woordTekst) : null;
      
      // Emoji-combo uit DOM lezen als fallback (als woordObj niets oplevert,
      // of er gewoon een emoji-span staat).
      let emojiCombo = "";
      if (emojiEl) {
        emojiCombo = emojiEl.textContent.trim();
      }
      
      // Zorg dat woordObj de samenstellingen-categorie heeft als die ontbreekt;
      // dat is nodig opdat afbeeldingPad() een PNG-URL kan bouwen.
      if (woordObj && !woordObj.categorie) {
        woordObj = Object.assign({}, woordObj, { categorie: "samenstellingen" });
      } else if (!woordObj && woordTekst) {
        woordObj = { tekst: woordTekst, categorie: "samenstellingen" };
      }
      
      afbeeldingen.push({ woordObj, emojiCombo });
    });
    
    // Verzamel rooster (letter per cel)
    const rooster = [];
    itemEl.querySelectorAll(".ov10-basis-rij").forEach(rijEl => {
      const rij = [];
      rijEl.querySelectorAll(".ov10-hokje").forEach(hokEl => {
        rij.push({
          letter: hokEl.textContent.trim(),
          isTreffer: hokEl.classList.contains("ov10-hokje-treffer")
        });
      });
      rooster.push(rij);
    });
    
    // Verzamel noteer-rijen
    const noteerRijen = [];
    itemEl.querySelectorAll(".ov10-basis-noteer-rij").forEach(rijEl => {
      const nrEl = rijEl.querySelector(".ov10-noteer-nr");
      const antwoordEl = rijEl.querySelector(".ov10-lijn-antwoord");
      noteerRijen.push({
        nr: nrEl ? nrEl.textContent.trim() : "",
        antwoord: antwoordEl ? antwoordEl.textContent.trim() : ""
      });
    });
    
    if (afbeeldingen.length === 0 && rooster.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov10");
      return;
    }
    
    // === Layout ===
    // Sectie 1: Afbeeldingen-grid (4 kolommen × 2 rijen = max 8)
    const AFB_KOLOMMEN = 4;
    const AFB_SPACING = 3;
    const AFB_BREEDTE_CEL = (breedte - (AFB_KOLOMMEN - 1) * AFB_SPACING) / AFB_KOLOMMEN;
    const AFB_HOOGTE_CEL = 18;
    const afbRijen = Math.ceil(afbeeldingen.length / AFB_KOLOMMEN);
    const afbSectieHoogte = afbRijen * AFB_HOOGTE_CEL + (afbRijen - 1) * AFB_SPACING;
    
    // Sectie 2: Letter-rooster (12 kolommen × N rijen)
    const ROOSTER_KOLOMMEN = 12;
    const HOK_SPACING = 0.8;
    const ROOSTER_BREEDTE_TOTAAL = Math.min(breedte, 130);  // niet hele paginabreedte
    const hokGrootte = (ROOSTER_BREEDTE_TOTAAL - (ROOSTER_KOLOMMEN - 1) * HOK_SPACING) / ROOSTER_KOLOMMEN;
    const roosterRijen = rooster.length;
    const roosterHoogte = roosterRijen * hokGrootte + (roosterRijen - 1) * HOK_SPACING;
    
    // Sectie 3: Noteer-label + 2-koloms lijnen (4 rijen × 2 kolommen)
    const NOTEER_LABEL_HOOGTE = 8;
    const NOTEER_KOLOMMEN = 2;
    const NOTEER_KOL_SPACING = 6;
    const NOTEER_NR_BREEDTE = 8;
    const noteerRijenPerKol = Math.ceil(noteerRijen.length / NOTEER_KOLOMMEN);
    const noteerRijHoogte = SCHRIJFLIJN_HOOGTE + 3;
    const noteerSectieHoogte = NOTEER_LABEL_HOOGTE + noteerRijenPerKol * (noteerRijHoogte + 3);
    
    // Spacing tussen secties
    const SPACING_SECTIE = 5;
    
    // === Reserveer ===
    // Strategie: opdracht + woordzoeker (afbeeldingen + rooster) blijven samen.
    // De noteer-lijnen mogen op een volgende pagina; ze zijn losse rijen.
    const woordzoekerHoogte = opdrachtHoogte + 4 + afbSectieHoogte + SPACING_SECTIE + roosterHoogte;
    reserveerRuimte(state, woordzoekerHoogte + 4);
    
    // === Opdracht ===
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // === Sectie 1: Afbeeldingen ===
    for (let i = 0; i < afbeeldingen.length; i++) {
      const r = Math.floor(i / AFB_KOLOMMEN);
      const c = i % AFB_KOLOMMEN;
      const cx = x + c * (AFB_BREEDTE_CEL + AFB_SPACING);
      const cy = state.cursorY + r * (AFB_HOOGTE_CEL + AFB_SPACING);
      
      // Cel-kader
      tekenKader(pdf, cx, cy, AFB_BREEDTE_CEL, AFB_HOOGTE_CEL, {
        randKleur: KLEUR_LIJN_GRIJS,
        randDikte: 0.3,
        rondeHoeken: 2
      });
      
      // Plaatje: probeer eerst echte PNG via tekenAfbeelding, anders
      // teken we de 2 emoji's uit delenEmoji naast elkaar.
      const afb = afbeeldingen[i];
      const pad = afb.woordObj ? afbeeldingPad(afb.woordObj) : null;
      const heeftPNG = pad && _afbeeldingCache[pad];
      
      if (heeftPNG && afb.woordObj) {
        tekenAfbeelding(pdf, cx + 2, cy + 2, AFB_HOOGTE_CEL - 4, afb.woordObj, {
          maxBreedte: AFB_BREEDTE_CEL - 4
        });
      } else if (afb.emojiCombo) {
        // Split emoji-combo in losse emoji's en teken ze naast elkaar.
        // Gebruik Array.from() omdat emoji's vaak multi-byte zijn.
        const emojis = Array.from(afb.emojiCombo).filter(c => c.trim());
        const emojiGrootte = Math.min(AFB_HOOGTE_CEL - 4, 12);
        const totBreedte = emojis.length * emojiGrootte + (emojis.length - 1) * 1;
        const startX = cx + (AFB_BREEDTE_CEL - totBreedte) / 2;
        const startY = cy + (AFB_HOOGTE_CEL - emojiGrootte) / 2;
        for (let k = 0; k < emojis.length; k++) {
          tekenEmoji(pdf, startX + k * (emojiGrootte + 1), startY, emojiGrootte, emojis[k]);
        }
      } else if (afb.woordObj?.tekst) {
        // Allerlaatste fallback: tekst
        tekenTekst(pdf, cx + AFB_BREEDTE_CEL / 2, cy + AFB_HOOGTE_CEL / 2 + 2, afb.woordObj.tekst, {
          size: 11,
          kleur: KLEUR_TEKST,
          gecentreerd: true
        });
      }
    }
    state.cursorY += afbSectieHoogte + SPACING_SECTIE;
    
    // === Sectie 2: Letter-rooster (gecentreerd) ===
    const roosterStartX = x + (breedte - ROOSTER_BREEDTE_TOTAAL) / 2;
    for (let r = 0; r < rooster.length; r++) {
      const rij = rooster[r];
      const rijY = state.cursorY + r * (hokGrootte + HOK_SPACING);
      
      for (let c = 0; c < rij.length; c++) {
        const hok = rij[c];
        const hokX = roosterStartX + c * (hokGrootte + HOK_SPACING);
        
        // Hokje-kader
        const isTreffer = hok.isTreffer && metOplossingen;
        tekenKader(pdf, hokX, rijY, hokGrootte, hokGrootte, {
          vulKleur: isTreffer ? [255, 235, 100] : null,  // gele highlight bij oplossingen
          randKleur: KLEUR_LIJN_GRIJS,
          randDikte: 0.3,
          rondeHoeken: 0.8
        });
        
        // Letter gecentreerd
        const letterFont = hokGrootte > 7 ? 11 : 9;  // schaal-aanpassing
        tekenTekst(pdf, hokX + hokGrootte / 2, rijY + hokGrootte / 2 + letterFont * 0.13, hok.letter, {
          size: letterFont,
          kleur: KLEUR_TEKST,
          vet: isTreffer,
          gecentreerd: true
        });
      }
    }
    state.cursorY += roosterHoogte + SPACING_SECTIE;
    
    // === Sectie 3: Noteer-lijnen ===
    // Label + minstens 1 noteer-rij samen op één pagina (geen wees-titel).
    const noteerRijHoogte_lokaal = SCHRIJFLIJN_HOOGTE + 3;
    reserveerRuimte(state, NOTEER_LABEL_HOOGTE + noteerRijHoogte_lokaal + 3);
    
    tekenTekst(pdf, x, state.cursorY + 5, "Schrijf de woorden die je vond:", {
      size: FONT_GROOTTE_INHOUD,
      kleur: KLEUR_TEKST,
      vet: true
    });
    state.cursorY += NOTEER_LABEL_HOOGTE;
    
    // Noteer-lijnen mogen op een volgende pagina starten als de woordzoeker 
    // niet alles meer toelaat — we reserveren per "rij" (= rij van 2 kolommen).
    const noteerKolBreedte = (breedte - (NOTEER_KOLOMMEN - 1) * NOTEER_KOL_SPACING) / NOTEER_KOLOMMEN;
    
    for (let rIdx = 0; rIdx < noteerRijenPerKol; rIdx++) {
      // Reserveer ruimte voor één rij (= 2 cellen naast elkaar)
      if (rIdx > 0) reserveerRuimte(state, noteerRijHoogte + 3);
      const rijY = state.cursorY;
      
      for (let kol = 0; kol < NOTEER_KOLOMMEN; kol++) {
        const i = rIdx * NOTEER_KOLOMMEN + kol;
        if (i >= noteerRijen.length) break;
        
        const rX = x + kol * (noteerKolBreedte + NOTEER_KOL_SPACING);
        const lijnTopY = rijY;
        const tekstBaseline = lijnTopY + 2 * L - 0.5;
        
        // Nummer
        tekenTekst(pdf, rX, tekstBaseline, noteerRijen[i].nr, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST,
          vet: true
        });
        
        // Schrijflijn
        const lijnX = rX + NOTEER_NR_BREEDTE;
        const lijnBreedte = noteerKolBreedte - NOTEER_NR_BREEDTE;
        tekenSchrijflijn(pdf, lijnX, lijnTopY, lijnBreedte, lijntype, lijnhoogte);
        
        if (metOplossingen && noteerRijen[i].antwoord) {
          tekenTekst(pdf, lijnX + 2, tekstBaseline, noteerRijen[i].antwoord, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      state.cursorY = rijY + noteerRijHoogte + 3;
    }
    
    state.cursorY += 4;
  }
  
  /* ⭐⭐ KERN: Plaatje + plaatje = samenstelling */
  function _tekenOV10Kern(state, itemEl, woordLookup, opdrachtStappen, opdrachtHoogte,
                           lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel rijen — elke rij heeft data-woord + plaatjes
    const rijen = [];
    itemEl.querySelectorAll(".ov10-kern-rij").forEach(rijEl => {
      const woordTekst = rijEl.getAttribute("data-woord") || "";
      const woordObj = woordLookup.get(woordTekst);
      const antwoordEl = rijEl.querySelector(".ov10-lijn-antwoord");
      
      // Probeer de delen uit het woord-object te halen
      const delen = woordObj?.delen || ["", ""];
      
      // Emoji's per deel direct uit DOM lezen (fallback voor als delenEmoji 
      // niet in woordObj zit)
      const deelEmojiEls = rijEl.querySelectorAll(".ov10-deel-emoji");
      const deelEmojis = [];
      deelEmojiEls.forEach(el => deelEmojis.push(el.textContent.trim()));
      
      rijen.push({
        woord: woordTekst,
        woordObj,
        delen,
        deelEmojis,
        antwoord: antwoordEl ? antwoordEl.textContent.trim() : ""
      });
    });
    
    if (rijen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov10");
      return;
    }
    
    // Layout: per rij plaatje + plus + plaatje + is + schrijflijn
    const PLAATJE_GROOTTE = 14;
    const PLUS_BREEDTE = 6;
    const IS_BREEDTE = 6;
    const PLAATJES_BREEDTE = 2 * PLAATJE_GROOTTE + PLUS_BREEDTE + IS_BREEDTE + 8;
    const SPACING_PLAATJES_LIJN = 4;
    const lijnBreedte = breedte - PLAATJES_BREEDTE - SPACING_PLAATJES_LIJN;
    
    const rijHoogte = Math.max(PLAATJE_GROOTTE, SCHRIJFLIJN_HOOGTE) + 4;
    const RIJ_SPACING = 5;
    
    reserveerRuimte(state, opdrachtHoogte + 4 + rijHoogte + RIJ_SPACING);
    
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    for (let i = 0; i < rijen.length; i++) {
      if (i > 0) reserveerRuimte(state, rijHoogte + RIJ_SPACING);
      
      const r = rijen[i];
      const rijY = state.cursorY;
      const midY = rijY + rijHoogte / 2;
      const lijnTopY = midY - SCHRIJFLIJN_HOOGTE / 2;
      const tekstBaseline = lijnTopY + 2 * L - 0.5;
      
      // Plaatje 1
      const plaatje1X = x;
      _tekenOV10DeelPlaatje(pdf, plaatje1X, rijY + (rijHoogte - PLAATJE_GROOTTE) / 2, 
                            PLAATJE_GROOTTE, r.woordObj, 0, r.deelEmojis[0]);
      
      // Plus
      const plusX = plaatje1X + PLAATJE_GROOTTE + 1;
      tekenTekst(pdf, plusX + PLUS_BREEDTE / 2, midY + 1.5, "+", {
        size: 14,
        kleur: KLEUR_TEKST,
        vet: true,
        gecentreerd: true
      });
      
      // Plaatje 2
      const plaatje2X = plusX + PLUS_BREEDTE + 1;
      _tekenOV10DeelPlaatje(pdf, plaatje2X, rijY + (rijHoogte - PLAATJE_GROOTTE) / 2,
                            PLAATJE_GROOTTE, r.woordObj, 1, r.deelEmojis[1]);
      
      // Is-teken
      const isX = plaatje2X + PLAATJE_GROOTTE + 1;
      tekenTekst(pdf, isX + IS_BREEDTE / 2, midY + 1.5, "=", {
        size: 14,
        kleur: KLEUR_TEKST,
        vet: true,
        gecentreerd: true
      });
      
      // Schrijflijn
      const lijnX = x + PLAATJES_BREEDTE + SPACING_PLAATJES_LIJN;
      tekenSchrijflijn(pdf, lijnX, lijnTopY, lijnBreedte, lijntype, lijnhoogte);
      
      if (metOplossingen && r.antwoord) {
        tekenTekst(pdf, lijnX + 2, tekstBaseline, r.antwoord, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST
        });
      }
      
      state.cursorY += rijHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 4;
  }
  
  /* Helper: teken één deel-plaatje voor OV10 kern.
     - Probeert eerst de emoji als die in de DOM stond
     - Daarna eventuele toekomstige deel-PNG (nog niet ondersteund)
     - Als laatste fallback: tekst-blokje met deel-tekst */
  function _tekenOV10DeelPlaatje(pdf, x, y, grootte, woordObj, deelIdx, emoji) {
    if (!woordObj && !emoji) {
      // Lege placeholder
      tekenKader(pdf, x, y, grootte, grootte, {
        randKleur: KLEUR_LIJN_GRIJS,
        randDikte: 0.3,
        rondeHoeken: 1.5
      });
      return;
    }
    
    // Cel-kader rond elk plaatje (zoals in preview)
    tekenKader(pdf, x, y, grootte, grootte, {
      randKleur: KLEUR_LIJN_GRIJS,
      randDikte: 0.3,
      rondeHoeken: 1.5,
      vulKleur: [248, 249, 252]
    });
    
    // Probeer emoji eerst (afkomstig uit DOM)
    if (emoji) {
      // Single emoji gecentreerd in het kader
      const emojiGrootte = grootte - 2;
      tekenEmoji(pdf, x + (grootte - emojiGrootte) / 2, y + (grootte - emojiGrootte) / 2,
                 emojiGrootte, emoji);
      return;
    }
    
    // Als geen emoji: probeer woordObj.delenEmoji
    if (woordObj && woordObj.delenEmoji && woordObj.delenEmoji[deelIdx]) {
      const e = woordObj.delenEmoji[deelIdx];
      const emojiGrootte = grootte - 2;
      tekenEmoji(pdf, x + (grootte - emojiGrootte) / 2, y + (grootte - emojiGrootte) / 2,
                 emojiGrootte, e);
      return;
    }
    
    // Allerlaatste fallback: tekst-blokje
    const deelTekst = woordObj?.delen?.[deelIdx] || "";
    if (deelTekst) {
      const fontSize = deelTekst.length > 5 ? 8 : 10;
      tekenTekst(pdf, x + grootte / 2, y + grootte / 2 + fontSize * 0.15, deelTekst, {
        size: fontSize,
        kleur: KLEUR_TEKST,
        gecentreerd: true
      });
    }
  }
  
  /* ⭐⭐⭐ VERDIEPING: 2 verbind-mini-oefeningen naast elkaar.
     Elke mini: linkerwoorden + bolletjes + spacing + bolletjes + rechterwoorden,
     daaronder genummerde schrijflijnen. */
  function _tekenOV10Verdieping(state, itemEl, opdrachtStappen, opdrachtHoogte,
                                 lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel mini-oefeningen
    const mini = [];
    itemEl.querySelectorAll(".ov10-vb-mini").forEach(miniEl => {
      const linksWoorden = [];
      miniEl.querySelectorAll(".ov10-vb-links .ov10-vb-item").forEach(itEl => {
        const span = itEl.querySelector("span:not(.ov10-vb-punt)");
        linksWoorden.push(span ? span.textContent.trim() : "");
      });
      
      const rechtsWoorden = [];
      miniEl.querySelectorAll(".ov10-vb-rechts .ov10-vb-item").forEach(itEl => {
        const span = itEl.querySelector("span:not(.ov10-vb-punt)");
        rechtsWoorden.push(span ? span.textContent.trim() : "");
      });
      
      // Paren uit data-paren: "deel1a=deel1b,deel2a=deel2b,..."
      const parenStr = miniEl.getAttribute("data-paren") || "";
      const paren = [];
      if (parenStr) {
        parenStr.split(",").forEach(p => {
          const [a, b] = p.split("=");
          if (a && b) paren.push({ links: a.trim(), rechts: b.trim() });
        });
      }
      
      // Noteer-rijen
      const noteer = [];
      miniEl.querySelectorAll(".ov10-basis-noteer-rij").forEach(rijEl => {
        const nrEl = rijEl.querySelector(".ov10-noteer-nr");
        const antwEl = rijEl.querySelector(".ov10-lijn-antwoord");
        noteer.push({
          nr: nrEl ? nrEl.textContent.trim() : "",
          antwoord: antwEl ? antwEl.textContent.trim() : ""
        });
      });
      
      mini.push({ linksWoorden, rechtsWoorden, paren, noteer });
    });
    
    if (mini.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov10");
      return;
    }
    
    // === Layout ===
    // 2 mini-oefeningen naast elkaar, elk in eigen kolom (~ helft van breedte)
    const MINI_SPACING = 6;
    const miniBreedte = (breedte - MINI_SPACING) / 2;
    
    // Binnen elke mini:
    // - Verbind-deel: 2 kolommen met woorden, midden ruimte voor lijnen
    // - Daaronder: noteer-lijnen
    const VB_ITEM_HOOGTE = 7;
    const VB_ITEM_SPACING = 2;
    
    const maxItems = Math.max(...mini.map(m => Math.max(m.linksWoorden.length, m.rechtsWoorden.length)));
    const vbHoogte = maxItems * VB_ITEM_HOOGTE + (maxItems - 1) * VB_ITEM_SPACING + 8;
    
    const maxNoteer = Math.max(...mini.map(m => m.noteer.length));
    const noteerRijHoogte = SCHRIJFLIJN_HOOGTE + 3;
    
    const SPACING_VB_NOTEER = 4;
    
    // Reserveer alleen opdracht + verbind-puzzel samen. De schrijflijnen daaronder
    // mogen op een nieuwe pagina starten als nodig.
    reserveerRuimte(state, opdrachtHoogte + 4 + vbHoogte + 6);
    
    // === Opdracht ===
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    // === Verbind-puzzels (beide mini's naast elkaar) ===
    const puzzelY = state.cursorY;
    
    for (let m = 0; m < mini.length; m++) {
      const miniData = mini[m];
      const miniX = x + m * (miniBreedte + MINI_SPACING);
      
      _tekenOV10MiniVerbindPuzzel(pdf, miniData, miniX, puzzelY, miniBreedte, vbHoogte, {
        VB_ITEM_HOOGTE, VB_ITEM_SPACING, metOplossingen
      });
    }
    
    state.cursorY = puzzelY + vbHoogte + SPACING_VB_NOTEER;
    
    // === Noteer-lijnen — per rij splitsbaar ===
    // We tekenen rij voor rij; rij i bevat noteer[i] uit mini 1 én noteer[i] uit mini 2 
    // (als die bestaan).
    for (let i = 0; i < maxNoteer; i++) {
      reserveerRuimte(state, noteerRijHoogte + 2);
      const rijY = state.cursorY;
      
      for (let m = 0; m < mini.length; m++) {
        const noteerItem = mini[m].noteer[i];
        if (!noteerItem) continue;
        
        const miniX = x + m * (miniBreedte + MINI_SPACING);
        const NR_BREEDTE = 8;
        const lijnTopY = rijY;
        const tekstBaseline = lijnTopY + 2 * L - 0.5;
        const lijnX = miniX + NR_BREEDTE;
        const lijnBreedte = miniBreedte - NR_BREEDTE;
        
        // Nummer
        tekenTekst(pdf, miniX, tekstBaseline, noteerItem.nr, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST,
          vet: true
        });
        // Schrijflijn
        tekenSchrijflijn(pdf, lijnX, lijnTopY, lijnBreedte, lijntype, lijnhoogte);
        // Antwoord
        if (metOplossingen && noteerItem.antwoord) {
          tekenTekst(pdf, lijnX + 2, tekstBaseline, noteerItem.antwoord, {
            size: FONT_GROOTTE_INHOUD,
            kleur: KLEUR_TEKST
          });
        }
      }
      
      state.cursorY = rijY + noteerRijHoogte + 2;
    }
    
    state.cursorY += 4;
  }
  
  /* Helper: teken één mini-verbind-puzzel (zonder noteer-lijnen).
     Tekent links/rechts woord-pillen + bolletjes, en bij oplossingen
     verbindlijnen tussen bolletjes van bij elkaar horende delen. */
  function _tekenOV10MiniVerbindPuzzel(pdf, miniData, x, y, breedte, vbHoogte, cfg) {
    // Lichtgrijs kader rond hele mini-vb-puzzel
    tekenKader(pdf, x, y, breedte, vbHoogte, {
      vulKleur: [245, 245, 250],
      randKleur: KLEUR_LIJN_GRIJS,
      randDikte: 0.3,
      rondeHoeken: 3
    });
    
    const KOL_WOORD_BREEDTE = 25;
    const PAD = 4;
    
    const linksX = x + PAD;
    const rechtsX = x + breedte - PAD - KOL_WOORD_BREEDTE;
    
    // Verzamel posities van linker en rechter bolletjes per item-index
    // (in DOM-volgorde, die overeenkomt met linksWoorden[] / rechtsWoorden[]).
    const linksBolletjes = [];  // [{ deel, x, y }, ...]
    const rechtsBolletjes = [];
    
    const aantalItems = Math.max(miniData.linksWoorden.length, miniData.rechtsWoorden.length);
    
    for (let i = 0; i < aantalItems; i++) {
      const itemY = y + PAD + i * (cfg.VB_ITEM_HOOGTE + cfg.VB_ITEM_SPACING);
      const midY = itemY + cfg.VB_ITEM_HOOGTE / 2 + 1.5;
      
      // Linker woord
      if (i < miniData.linksWoorden.length) {
        const woord = miniData.linksWoorden[i];
        tekenKader(pdf, linksX, itemY, KOL_WOORD_BREEDTE - 4, cfg.VB_ITEM_HOOGTE, {
          vulKleur: [255, 255, 255],
          randKleur: KLEUR_LIJN_GRIJS,
          randDikte: 0.3,
          rondeHoeken: 3
        });
        tekenTekst(pdf, linksX + (KOL_WOORD_BREEDTE - 4) / 2, midY, woord, {
          size: 11,
          kleur: KLEUR_TEKST,
          gecentreerd: true,
          vet: true
        });
        
        // Bolletje rechts van linker woord
        const bolX = linksX + KOL_WOORD_BREEDTE - 1.5;
        const bolY = midY - 1.2;
        pdf.setDrawColor(KLEUR_TEKST[0], KLEUR_TEKST[1], KLEUR_TEKST[2]);
        pdf.setFillColor(KLEUR_TEKST[0], KLEUR_TEKST[1], KLEUR_TEKST[2]);
        pdf.circle(bolX, bolY, 0.8, "FD");
        
        linksBolletjes.push({ deel: woord, x: bolX, y: bolY });
      }
      
      // Rechter woord
      if (i < miniData.rechtsWoorden.length) {
        const woord = miniData.rechtsWoorden[i];
        const bolX = rechtsX + 1.5;
        const bolY = midY - 1.2;
        pdf.setDrawColor(KLEUR_TEKST[0], KLEUR_TEKST[1], KLEUR_TEKST[2]);
        pdf.setFillColor(KLEUR_TEKST[0], KLEUR_TEKST[1], KLEUR_TEKST[2]);
        pdf.circle(bolX, bolY, 0.8, "FD");
        
        rechtsBolletjes.push({ deel: woord, x: bolX, y: bolY });
        
        tekenKader(pdf, rechtsX + 4, itemY, KOL_WOORD_BREEDTE - 4, cfg.VB_ITEM_HOOGTE, {
          vulKleur: [255, 255, 255],
          randKleur: KLEUR_LIJN_GRIJS,
          randDikte: 0.3,
          rondeHoeken: 3
        });
        tekenTekst(pdf, rechtsX + 4 + (KOL_WOORD_BREEDTE - 4) / 2, midY, woord, {
          size: 11,
          kleur: KLEUR_TEKST,
          gecentreerd: true,
          vet: true
        });
      }
    }
    
    // Bij oplossingen: verbindlijnen tekenen tussen bij elkaar horende delen.
    if (cfg.metOplossingen && miniData.paren && miniData.paren.length > 0) {
      const KLEUR_VERBIND = [33, 150, 243];  // blauw
      pdf.setDrawColor(KLEUR_VERBIND[0], KLEUR_VERBIND[1], KLEUR_VERBIND[2]);
      pdf.setLineWidth(0.6);
      
      for (const paar of miniData.paren) {
        const links = linksBolletjes.find(b => b.deel === paar.links);
        const rechts = rechtsBolletjes.find(b => b.deel === paar.rechts);
        if (links && rechts) {
          pdf.line(links.x, links.y, rechts.x, rechts.y);
        }
      }
    }
  }
  
  /* ⭐⭐⭐⭐ UITBREIDING: Beschrijving + schrijflijn per rij */
  function _tekenOV10Uitbreiding(state, itemEl, opdrachtStappen, opdrachtHoogte,
                                  lijntype, lijnhoogte, L, SCHRIJFLIJN_HOOGTE, niveau, metOplossingen) {
    const pdf = state.pdf;
    const x = state.contentX;
    const breedte = state.contentBreedte;
    
    // Verzamel rijen
    const rijen = [];
    itemEl.querySelectorAll(".ov10-ub-rij").forEach(rijEl => {
      const nrEl = rijEl.querySelector(".ov10-noteer-nr");
      const beschrijvingEl = rijEl.querySelector(".ov10-ub-beschrijving");
      const antwoordEl = rijEl.querySelector(".ov10-lijn-antwoord");
      rijen.push({
        nr: nrEl ? nrEl.textContent.trim() : "",
        beschrijving: beschrijvingEl ? beschrijvingEl.textContent.trim() : "",
        antwoord: antwoordEl ? antwoordEl.textContent.trim() : ""
      });
    });
    
    if (rijen.length === 0) {
      _tekenStubOV(state, { id: itemEl.getAttribute("data-item-id") }, "ov10");
      return;
    }
    
    // Layout
    const NR_BREEDTE = 8;
    const BESCHR_HOOGTE = 7;
    const SPACING_BESCHR_LIJN = 3;
    const rijHoogte = BESCHR_HOOGTE + SPACING_BESCHR_LIJN + SCHRIJFLIJN_HOOGTE + 4;
    const RIJ_SPACING = 5;
    
    reserveerRuimte(state, opdrachtHoogte + 4 + rijHoogte + RIJ_SPACING);
    
    tekenGeleKader(pdf, x, state.cursorY, breedte, opdrachtStappen, {
      label: "Opdracht",
      aantalSterren: sterrenVoorNiveau(niveau)
    });
    state.cursorY += opdrachtHoogte + 6;
    
    for (let i = 0; i < rijen.length; i++) {
      if (i > 0) reserveerRuimte(state, rijHoogte + RIJ_SPACING);
      
      const r = rijen[i];
      const yStart = state.cursorY;
      const beschrY = yStart + 5;
      
      // Nummer
      tekenTekst(pdf, x, beschrY, r.nr, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST,
        vet: true
      });
      
      // Beschrijving (cursief)
      tekenTekst(pdf, x + NR_BREEDTE, beschrY, r.beschrijving, {
        size: FONT_GROOTTE_INHOUD,
        kleur: KLEUR_TEKST,
        cursief: true
      });
      
      // Schrijflijn (volle breedte, met inspring voor nr)
      const lijnTopY = yStart + BESCHR_HOOGTE + SPACING_BESCHR_LIJN;
      const tekstBaseline = lijnTopY + 2 * L - 0.5;
      const lijnX = x + NR_BREEDTE;
      const lijnBreedte = breedte - NR_BREEDTE;
      
      tekenSchrijflijn(pdf, lijnX, lijnTopY, lijnBreedte, lijntype, lijnhoogte);
      
      if (metOplossingen && r.antwoord) {
        tekenTekst(pdf, lijnX + 2, tekstBaseline, r.antwoord, {
          size: FONT_GROOTTE_INHOUD,
          kleur: KLEUR_TEKST
        });
      }
      
      state.cursorY = yStart + rijHoogte + RIJ_SPACING;
    }
    
    state.cursorY += 2;
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
    const kaderHoogte = 2 * 4 + 7 + stappen.length * 7.5;
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
    ov03: function(state, item) { tekenOV03(state, item); },
    ov04: function(state, item) { tekenOV04(state, item); },
    ov05: function(state, item) { tekenOV05(state, item); },
    ov06: function(state, item) { tekenOV06(state, item); },
    ov07: function(state, item) { tekenOV07(state, item); },
    ov08: function(state, item) { tekenOV08(state, item); },
    ov09: function(state, item) { tekenOV09(state, item); },
    ov10: function(state, item) { tekenOV10(state, item); },
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
    tekenDocHeader(state, opties.titel || "Mijn herhalingsbundel", {
      titelGecentreerd: opties.titelGecentreerd !== false  // default true
    });
    
    // Items renderen
    const items = opties.items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      state.itemIndex = i;
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