/* Tienramen en zelf tekenen: dezelfde voorstelling in de keuze, preview en PDF. */
const Tot20Hulp = (() => {
  const soorten = {
    'tienramen-kleur': ['Twee tienramen in kleur', 'Beide getallen zichtbaar. Schrijf de splitsbenen.'],
    'tienraam-start': ['Eén tienraam', 'Alleen het eerste getal zichtbaar. Schrijf de splitsbenen.'],
    'zelf-splitsbenen': ['Zelf splitsbenen tekenen', 'Zonder tienraam. Teken en vul de splitsbenen zelf in.'],
    'aftrek-tienramen-kringen': ['Tienramen met wegneemkringen', 'Neem eerst weg tot 10, daarna de rest. Schrijf de splitsbenen.'],
    'aftrek-tienramen': ['Tienramen zonder markeringen', 'Bekijk het startgetal. Teken en vul de splitsbenen zelf in.'],
    'aftrek-zelf-splitsbenen': ['Zelf splitsbenen tekenen', 'Zonder tienramen. Teken en vul de splitsbenen zelf in.'],
  };
  const soort = blok => (blok.hulpmiddelen || []).find(h => soorten[h]);
  const maten = blok => [280, soort(blok)?.endsWith('zelf-splitsbenen') ? 92 : 145];
  const actief = blok => ['optellen','aftrekken'].includes(blok.bewerking) && Number(blok.niveau) === 20 && !!soort(blok);
  function svg(blok, oef, opgelost = false) {
    const [a, b] = oef.vraag.match(/\d+/g).map(Number);
    const type = soort(blok);
    const min = blok.bewerking === 'aftrekken';
    const antwoord = min ? a-b : a+b;
    const deel1 = min ? a-10 : 10-a;
    const kleur = '#006eaf';
    let inhoud = '';
    function raam(x, aantal, start) {
      for (let kol = 0; kol < 5; kol++) for (let rij = 0; rij < 2; rij++) {
        const i = kol * 2 + rij;
        const cx = x + kol * 24, cy = (min ? 22 : 12) + rij * 24;
        inhoud += `<rect x="${cx}" y="${cy}" width="24" height="24" fill="white" stroke="#777" stroke-width=".7"/>`;
        if (i < aantal) inhoud += `<circle cx="${cx+12}" cy="${cy+12}" r="7.5" fill="${min || type === 'tienraam-start' ? '#222' : start+i < a ? '#00557e' : '#c72d24'}"/>`;
      }
    }
    if (type === 'tienramen-kleur') { raam(14, 10, 0); raam(146, a+b-10, 10); }
    if (type === 'tienraam-start') raam(80, a, 0);
    if (min && type !== 'aftrek-zelf-splitsbenen') {
      raam(14, 10, 0); raam(146, a-10, 10);
      if (type === 'aftrek-tienramen-kringen') {
        // Volg de buitenrand van de weg te nemen vakjes, ook bij oneven aantallen.
        function kring(x, van, tot) {
          const edges = new Map();
          const punt = p => p.join(',');
          for (let i=van; i<tot; i++) {
            const cx=x+Math.floor(i/2)*24, cy=22+(i%2)*24;
            const p=[[cx,cy],[cx+24,cy],[cx+24,cy+24],[cx,cy+24]];
            p.forEach((v,j) => { const w=p[(j+1)%4], rev=punt(w)+'|'+punt(v), key=punt(v)+'|'+punt(w); if(edges.has(rev)) edges.delete(rev); else edges.set(key,[v,w]); });
          }
          const boundary=[...edges.values()], points=[boundary[0][0]];
          let current=points[0];
          while(boundary.length) {
            const idx=boundary.findIndex(e=>punt(e[0])===punt(current));
            if(idx<0) break;
            current=boundary.splice(idx,1)[0][1]; points.push(current);
          }
          const right=Math.max(...points.map(p=>p[0])), top=Math.min(...points.map(p=>p[1]));
          const ring=points.slice(0,-1);
          const corners=ring.filter((p,i)=>{
            const prev=ring[(i+ring.length-1)%ring.length], next=ring[(i+1)%ring.length];
            return (p[0]-prev[0])*(next[1]-p[1]) !== (p[1]-prev[1])*(next[0]-p[0]);
          });
          const near=(p,q)=>{const d=Math.hypot(q[0]-p[0],q[1]-p[1]);return [p[0]+(q[0]-p[0])*5/d,p[1]+(q[1]-p[1])*5/d].join(' ');};
          const rounded=corners.map((p,i)=>`${i ? 'L' : 'M'} ${near(p,corners[(i+corners.length-1)%corners.length])} Q ${p.join(' ')} ${near(p,corners[(i+1)%corners.length])}`).join(' ');
          inhoud += `<path d="${rounded} Z" fill="none" stroke="#d52b20" stroke-width="1.5"/>`;
          // Een kring die alleen onderaan ligt krijgt ook onderaan een pijl.
          const startY=top>22 ? 70 : top, eindY=top>22 ? 83 : top-13;
          inhoud += `<path d="M ${right-10} ${startY} Q ${right-9} ${eindY} ${right+19} ${eindY} m -6 -5 l 6 5 l -6 5" fill="none" stroke="#d52b20" stroke-width="1.3"/>`;
        }
        kring(146,0,a-10);
        kring(14,10-(b-deel1),10);
      }
    }
    const sy = type.endsWith('zelf-splitsbenen') ? 36 : min ? 110 : 94;
    const tweedeX = 122;
    // Geef elke term een eigen middelpunt, zodat letterbreedte en schaal
    // nooit de uitlijning van het splitsbeen kunnen veranderen.
    inhoud += `<text y="${sy}" text-anchor="middle" font-family="Arial" font-size="20" fill="#222"><tspan x="${min ? 80 : 86}">${a}</tspan><tspan x="104">${min ? '−' : '+'}</tspan><tspan x="${tweedeX}">${b}</tspan><tspan x="144">=</tspan></text>`;
    inhoud += opgelost ? `<text x="164" y="${sy}" font-family="Arial" font-size="20" fill="${kleur}">${antwoord}</text>` : `<line x1="163" y1="${sy+3}" x2="226" y2="${sy+3}" stroke="#aaa"/>`;
    if (opgelost) {
      inhoud += `<path d="M ${tweedeX} ${sy+10} L ${tweedeX-17} ${sy+29} M ${tweedeX} ${sy+10} L ${tweedeX+17} ${sy+29}" fill="none" stroke="${kleur}" stroke-width="1.4"/>`;
      inhoud += `<text x="${tweedeX-17}" y="${sy+49}" text-anchor="middle" font-family="Arial" font-size="19" fill="${kleur}">${deel1}</text><text x="${tweedeX+17}" y="${sy+49}" text-anchor="middle" font-family="Arial" font-size="19" fill="${kleur}">${b-deel1}</text>`;
    }
    const [breedte,hoogte] = maten(blok);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${breedte} ${hoogte}" width="${breedte}" height="${hoogte}" role="img" aria-label="${a} ${min ? 'min' : 'plus'} ${b}, ${soorten[type][0]}"><g transform="translate(21 3) scale(.85)">${inhoud}</g></svg>`;
  }
  async function png(blok, oef, opgelost) {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg(blok, oef, opgelost)], {type:'image/svg+xml'}));
    try {
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
      const [breedte,hoogte] = maten(blok);
      const canvas = document.createElement('canvas'); canvas.width = breedte*4; canvas.height = hoogte*4;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height);
      return canvas.toDataURL('image/png');
    } finally { URL.revokeObjectURL(url); }
  }
  let context = {};
  const cache = new Map();
  const waarde = (naam, fallback) => document.querySelector(`[name="${naam}"]:checked`)?.value || fallback;
  function voorbeeld(details) {
    if (!details.open) return;
    const key = details.dataset.hulp;
    const {bewerking, niveau, brug} = context;
    const config = {
      bewerking, niveau, brug, hulpmiddelen: [key], aantalOefeningen: 2,
      splitspositie: waarde('splitspositie', 'aftrekker'),
      aanvullenVariant: waarde('aanvullen-variant', 'zonder-schema'),
      compenserenVariant: waarde('compenseren-variant', 'met-tekens'),
      transformerenVariant: waarde('transformeren-variant', 'schema'),
      schrijflijnenAantal: bewerking === 'aftrekken' && niveau === 20 ? 3 : Number(waarde('schrijflijnen-aantal', '2')),
      metVoorbeeld: !!soorten[key] && document.getElementById('tot20-voorbeeld').checked,
    };
    if (key === 'schrijflijnen') config.metVoorbeeld = !!document.getElementById('cb-schrijflijnen-voorbeeld')?.checked;
    if (key === 'compenseren') config.metVoorbeeld = !!document.getElementById('cb-metvoorbeeld')?.checked;
    if (key === 'transformeren') config.metVoorbeeld = !!document.getElementById('cb-trans-voorbeeld')?.checked;
    const types = Generator.getTypes(bewerking, niveau, brug, [key]);
    const gekozen = [...document.querySelectorAll('[name="types"]:checked')].map(el => el.value);
    config.oefeningstypes = [gekozen.find(t => types.includes(t) && t !== 'Gemengd') || types.find(t => t !== 'Gemengd') || types[0] || 'Gemengd'];
    const sleutel = JSON.stringify(config);
    let blok = cache.get(sleutel);
    if (!blok) { blok = Generator.maakBlok(config); if (blok) cache.set(sleutel, blok); }
    const host = details.querySelector('.hulp-voorbeeld-inhoud');
    host.replaceChildren();
    if (!blok) { host.textContent = 'Kies eerst een oefentype.'; return; }
    const beschrijving = document.createElement('p');
    beschrijving.textContent = soorten[key]?.[1] || 'Zo verschijnt deze oefening op het werkblad.';
    host.append(beschrijving);
    const oefening = Preview.maakHulpmiddelVoorbeeld(blok);
    host.append(oefening);
    requestAnimationFrame(() => {
      // Teken op werkbladbreedte en pas het gehele voorbeeld aan de zijbalk aan.
      const breedte = ['aanvullen','compenseren','transformeren'].includes(key) ? 360 : 280;
      oefening.style.width = breedte + 'px';
      oefening.style.zoom = Math.min(1, host.clientWidth / breedte);
      Preview.positioneerBlok(oefening);
    });
  }
  function voegVoorbeeldToe(chip) {
    if (chip.parentElement.classList.contains('hulp-keuzerij')) return;
    const rij = document.createElement('div'); rij.className = 'hulp-keuzerij';
    chip.before(rij); rij.append(chip);
    const details = document.createElement('details');
    details.className = 'hulp-voorbeeld'; details.dataset.hulp = chip.querySelector('input').value;
    details.innerHTML = '<summary>Voorbeeld</summary><div class="hulp-voorbeeld-inhoud"></div>';
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      document.querySelectorAll('.hulp-voorbeeld[open]').forEach(el => { if (el !== details) el.open = false; });
      voorbeeld(details);
    });
    rij.append(details);
  }
  function update(bewerking, niveau, brug) {
    context = {bewerking, niveau, brug};
    const toon = ['optellen','aftrekken'].includes(bewerking) && niveau === 20 && brug === 'met';
    let rij = document.getElementById('tot20-hulp-keuze');
    if (!rij) {
      rij = document.createElement('div'); rij.id = 'tot20-hulp-keuze'; rij.className = 'form-rij';
      rij.innerHTML = `<label>Zelf splitsbenen schrijven</label><div class="tot20-keuzes">${Object.entries(soorten).map(([key,[titel]]) => `<label class="vink-chip" onclick="App.toggleHulpmiddel(this,'${key}')"><span class="vink-box"></span><input type="checkbox" name="hulpmiddelen" value="${key}" style="display:none"><span>${titel}</span></label>`).join('')}</div><label class="hulp-eerste-voorbeeld"><input type="checkbox" id="tot20-voorbeeld" checked> Eerste oefening uitwerken</label>`;
      document.getElementById('cg-hulpmiddelen').parentElement.after(rij);
      const kaart = document.getElementById('kaart-hulpmiddelen');
      kaart.addEventListener('change', () => requestAnimationFrame(() => kaart.querySelectorAll('.hulp-voorbeeld[open]').forEach(voorbeeld)));
    }
    rij.style.display = toon ? '' : 'none';
    if (!toon) rij.querySelectorAll('[name="hulpmiddelen"]').forEach(cb => { cb.checked = false; cb.closest('label').classList.remove('geselecteerd'); cb.closest('label').querySelector('.vink-box').textContent = ''; });
    document.querySelectorAll('#cg-hulpmiddelen > .vink-chip, .tot20-keuzes > .vink-chip').forEach(voegVoorbeeldToe);
    rij.querySelectorAll('[name="hulpmiddelen"]').forEach(cb => {
      const passend = cb.value.startsWith('aftrek-') === (bewerking === 'aftrekken');
      cb.closest('.hulp-keuzerij').style.display = passend ? '' : 'none';
      if (!passend) { cb.checked=false; cb.closest('label').classList.remove('geselecteerd'); cb.closest('label').querySelector('.vink-box').textContent=''; }
    });
    document.querySelectorAll('.hulp-voorbeeld[open]').forEach(el => { el.open = false; });
  }
  return {soorten, soort, actief, maten, svg, png, update};
})();
