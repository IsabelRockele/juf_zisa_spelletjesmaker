/* ══════════════════════════════════════════════════════════════
   modules/cijferen.js
   Elk oefening-object heeft:
     sleutel, g1, g2, operator ('+','−','×','÷'), result,
     showH, H1,T1,E1, H2,T2,E2
   ══════════════════════════════════════════════════════════════ */

const Cijferen = (() => {

  function _rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function _heeftBrug(g1, g2, opType, bereik) {
    const e1 = g1 % 10, e2 = g2 % 10;
    const t1 = Math.floor(g1 / 10) % 10, t2 = Math.floor(g2 / 10) % 10;
    if (opType === 'optellen') {
      if (e1 + e2 >= 10) return true;
      if (bereik >= 1000 && t1 + t2 >= 10) return true;
      return false;
    } else {
      if (e1 < e2) return true;
      if (bereik >= 1000 && t1 < t2) return true;
      return false;
    }
  }

  function _splitsHTE(g, includeH) {
    const s = g.toString().padStart(includeH ? 3 : 2, ' ');
    if (includeH) return { H: s[0].trim(), T: s[1].trim(), E: s[2].trim() };
    return { H: '', T: s[0].trim(), E: s[1].trim() };
  }

  function _genPlusMin(bewerking, bereik, brug, aantalOefeningen) {
    const oefeningen = [], gebruikt = new Set();
    let pogingen = 0;
    while (oefeningen.length < aantalOefeningen && pogingen < 3000) {
      pogingen++;
      const opType = bewerking === 'gemengd'
        ? (Math.random() < 0.5 ? 'optellen' : 'aftrekken')
        : bewerking;
      const wantBrug = brug === 'met' ? true : brug === 'zonder' ? false : (Math.random() < 0.5);
      let g1 = bereik <= 100 ? _rnd(10, 99) : _rnd(100, 999);
      let g2 = bereik <= 100 ? _rnd(1, 49)  : _rnd(10, 499);
      if (opType === 'aftrekken') {
        if (g1 < g2) [g1, g2] = [g2, g1];
        if (g1 === g2) g1++;
      }
      const result = opType === 'optellen' ? g1 + g2 : g1 - g2;
      if (result < 0) continue;
      if (bereik <= 100 && (g1 > 99 || result > 100)) continue;
      if (bereik >= 1000 && opType === 'optellen' && result > 999) continue;
      if (brug !== 'beide' && _heeftBrug(g1, g2, opType, bereik) !== wantBrug) continue;
      const sleutel = `${g1}${opType}${g2}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      const operator = opType === 'optellen' ? '+' : '\u2212';
      const showH = bereik >= 1000 || g1 >= 100 || g2 >= 100 || result >= 100;
      const hte1 = _splitsHTE(g1, showH), hte2 = _splitsHTE(g2, showH);
      oefeningen.push({ sleutel, g1, g2, operator, result, showH,
        H1: hte1.H, T1: hte1.T, E1: hte1.E,
        H2: hte2.H, T2: hte2.T, E2: hte2.E });
    }
    return oefeningen;
  }

  /* Brug-analyse voor vermenigvuldigen:
     - Brug over E: (tafel × eenheden) >= 10  → onthoud naar tientallen
     - Brug over T: (tafel × tientallen + onthoud_E) >= 100 → onthoud naar honderdtallen
  */
  function _vermBrugType(groot, tafel) {
    const eenheden  = groot % 10;
    const tientallen = Math.floor(groot / 10) % 10;
    const prodE     = tafel * eenheden;
    const onthoudE  = Math.floor(prodE / 10);
    const prodT     = tafel * tientallen + onthoudE;
    const brugE     = prodE >= 10;
    const brugT     = prodT >= 10;
    return { brugE, brugT };
  }

  function _genVermenigvuldigen(vermType, vermBrug, aantalOefeningen) {
    const oefeningen = [], gebruikt = new Set();
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < 5000) {
      pogingen++;

      // Kies tafel (1-9, geen 10 want dat is triviaal)
      const tafel = _rnd(2, 9);

      // Kies groot getal op basis van vermType
      let groot;
      const type = vermType === 'beide'
        ? (Math.random() < 0.5 ? 'TxE' : 'TExE')
        : vermType;

      if (type === 'TxE') {
        // Tientallen × eenheden: groot is een tiental (10,20,...,90)
        groot = _rnd(1, 9) * 10;
      } else {
        // TE × E: groot is 11-99, niet-tiental
        groot = _rnd(1, 9) * 10 + _rnd(1, 9);
      }

      const result = tafel * groot;
      if (result > 999) continue;

      // Controleer brug
      const { brugE, brugT } = _vermBrugType(groot, tafel);

      // Filter op gewenst brugtype
      if (vermBrug === 'zonder' && (brugE || brugT)) continue;
      if (vermBrug === 'E'      && (!brugE || brugT)) continue;
      if (vermBrug === 'T'      && (brugE || !brugT)) continue;
      if (vermBrug === 'ET'     && (!brugE || !brugT)) continue;
      if (vermBrug === 'met'    && !brugE && !brugT) continue;

      const sleutel = `${groot}x${tafel}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);

      // Schema: groot getal bovenaan, tafel onderaan
      // showH als resultaat >= 100
      const showH = result >= 100;
      const hte1 = _splitsHTE(groot, showH);
      const hte2 = _splitsHTE(tafel, showH);

      // Vraag: groot × tafel = ?  (groot altijd links, tafel rechts)
      oefeningen.push({
        sleutel, g1: groot, g2: tafel,
        operator: '\u00d7',
        result, showH,
        H1: hte1.H, T1: hte1.T, E1: hte1.E,
        H2: hte2.H, T2: hte2.T, E2: hte2.E,
      });
    }
    return oefeningen;
  }

  /* ── Staartdeling TE ÷ E ─────────────────────────────────── */
  function _genDelen(delers, metRest, aantalOefeningen) {
    const oefeningen = [], gebruikt = new Set();
    let pogingen = 0;
    while (oefeningen.length < aantalOefeningen && pogingen < 5000) {
      pogingen++;
      const deler = delers[Math.floor(Math.random() * delers.length)];
      // Genereer een geldig tweecijerig deeltal
      const deeltal = _rnd(10, 99);
      if (deeltal < deler) continue;
      const T = Math.floor(deeltal / 10);
      const E = deeltal % 10;
      // T moet deelbaar zijn door deler (of met rest als metRest)
      if (!metRest && T < deler) continue;  // quotT zou 0 zijn
      const quotT  = Math.floor(T / deler);
      if (quotT === 0) continue;
      const restT  = T % deler;
      const nieuwE = restT * 10 + E;
      const quotE  = Math.floor(nieuwE / deler);
      const restE  = nieuwE % deler;
      if (!metRest && restE !== 0) continue;
      if (quotE === 0 && restE === 0) continue; // triviaal
      const quotiënt = quotT * 10 + quotE;
      if (quotiënt < 10) continue; // uitkomst moet TE zijn
      const sleutel = `${deeltal}:${deler}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        g1: deeltal, g2: deler,
        operator: '\u00f7',
        result: quotiënt,
        // Staartdeling stap-data
        deeltal, deler,
        T, E,
        quotT, restT,
        nieuwE, quotE, restE,
        quotiënt,
        aftrekT: quotT * deler,      // wat je aftrekt in eerste stap
        aftrekE: quotE * deler,      // wat je aftrekt in tweede stap
        showH: false,
        // Dummy HTE velden (niet gebruikt voor deelschema)
        H1:'', T1: String(T), E1: String(E),
        H2:'', T2:'',         E2: String(deler),
      });
    }
    return oefeningen;
  }

  /* ── Kommagetallen E,t ────────────────────────────────────── */
  function _genKomma(kommaType, kommaBrug, aantalOefeningen) {
    // g1 en g2 zijn tienden (integers): bijv. 45 = 4,5
    // brug = of de optelling/aftrekking de komma overschrijdt (tienden ≥ 10)
    const oefeningen = [], gebruikt = new Set();
    let pogingen = 0;
    while (oefeningen.length < aantalOefeningen && pogingen < 5000) {
      pogingen++;
      // Genereer twee getallen in tienden: 11-99 (= 1,1 t/m 9,9)
      const a = _rnd(11, 89);  // eerste getal in tienden
      const b = _rnd(11, 89);  // tweede getal in tienden

      const isPlus = kommaType === 'Et_plus_Et' ||
                     (kommaType === 'Et_gemengd' && Math.random() < 0.5);
      const isMinus = !isPlus;

      let g1t, g2t, rest;
      if (isPlus) {
        g1t = a; g2t = b;
        rest = g1t + g2t;
        if (rest > 199) continue;  // max 19,9
      } else {
        g1t = Math.max(a, b); g2t = Math.min(a, b);
        rest = g1t - g2t;
        if (rest < 0) continue;
      }

      // Brugcheck: brug = tienden-deel overschrijdt 10
      const g1E = Math.floor(g1t / 10), g1t_ = g1t % 10;
      const g2E = Math.floor(g2t / 10), g2t_ = g2t % 10;
      let heeftBrug;
      if (isPlus) {
        heeftBrug = (g1t_ + g2t_) >= 10;
      } else {
        heeftBrug = g1t_ < g2t_;
      }

      if (kommaBrug === 'met'    && !heeftBrug) continue;
      if (kommaBrug === 'zonder' &&  heeftBrug) continue;

      const op = isPlus ? '+' : '\u2212';
      const sleutel = g1t + op + g2t;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);

      const restE = Math.floor(rest / 10);
      const restt = rest % 10;

      oefeningen.push({
        sleutel,
        isKomma: true,
        operator: op,
        // Waarden in tienden (integer)
        g1t, g2t, rest,
        // Componenten
        g1E, g1t_, g2E, g2t_,
        restE, restt,
        heeftBrug,
        // Display strings (met komma)
        g1Str:   g1E + ',' + g1t_,
        g2Str:   g2E + ',' + g2t_,
        restStr: restE + ',' + restt,
        // Dummy velden voor compatibiliteit
        g1: g1t, g2: g2t, result: rest,
        showH: false,
        H1:'', T1: String(g1E), E1: String(g1t_),
        H2:'', T2: String(g2E), E2: String(g2t_),
      });
    }
    return oefeningen;
  }

  function genereer({ bewerking, bereik, brug, aantalOefeningen, tafels,
                      vermType, vermBrug, deelType, metRest,
                      kommaType, kommaBrug }) {
    bereik = bereik || 100;
    aantalOefeningen = aantalOefeningen || 12;
    const actieveTafels = (tafels && tafels.length) ? tafels : [2, 3, 4, 5];
    if (bewerking === 'vermenigvuldigen')
      return _genVermenigvuldigen(
        vermType  || 'TxE',
        vermBrug  || 'zonder',
        aantalOefeningen
      );
    if (bewerking === 'komma')
      return _genKomma(kommaType || 'Et_plus_Et', kommaBrug || 'beide', aantalOefeningen);
    if (bewerking === 'delen')
      return _genDelen(actieveTafels, metRest || false, aantalOefeningen);
    return _genPlusMin(bewerking, bereik, brug || 'beide', aantalOefeningen);
  }

  return { genereer };
})();
