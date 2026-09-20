/* Gemeenschappelijke weergave voor hulpklokken, invulzinnen en kleurparen. */
const HulpKlok = (() => {
  const ROOD = '#f51f35', BLAUW = '#00afe0', ANTWOORD = '#087eae';
  const kleuren = ['#ffe29a', '#c5e8b7', '#dcc9ef', '#ffc7a6', '#bde5ed', '#f5c4db'];
  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const uur12 = uur => ((uur % 12) + 12) % 12 || 12;
  const nabij = t => t.soort === 'bijna' || t.soort === 'netover';
  const gebruikt = inst => inst.gekleurdeHulpklok || inst.invulmethode === 'beide' || inst.tijden.some(nabij) || inst.oplossingen;

  function klok(ctx, x, y, r, t, gekleurd) {
    ctx.save();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const uren = uur12(t.uur) + t.minuut / 60;
    if (gekleurd) {
      const boog = (radius, deel, kleur) => {
        if (deel <= 0) return;
        ctx.beginPath(); ctx.strokeStyle = kleur; ctx.lineWidth = 6;
        ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + deel * Math.PI * 2);
        ctx.stroke();
      };
      // Om 12 uur is de urenboog volledig rond; daarna begint hij opnieuw.
      boog(r + 5, (uren > 12 ? uren - 12 : uren) / 12, ROOD);
      boog(r + 13, t.minuut / 60, BLAUW);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '13px Arial';
    for (let i = 0; i < 60; i++) {
      const a = i * Math.PI / 30 - Math.PI / 2;
      ctx.strokeStyle = '#555'; ctx.lineWidth = i % 5 === 0 ? 1.2 : .5;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a) * (r - (i % 5 === 0 ? 5 : 2)), y + Math.sin(a) * (r - (i % 5 === 0 ? 5 : 2))); ctx.stroke();
      if (i % 5 === 0) {
        ctx.fillStyle = '#333'; ctx.fillText(i === 0 ? '12' : String(i / 5), x + Math.cos(a) * (r - 13), y + Math.sin(a) * (r - 13));
      }
    }
    const wijzer = (a, lengte, kleur) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.strokeStyle = kleur; ctx.fillStyle = kleur; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lengte - 8, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lengte, 0); ctx.lineTo(lengte - 11, -4); ctx.lineTo(lengte - 11, 4); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    wijzer((uren / 6 - .5) * Math.PI, r * .51, gekleurd ? ROOD : '#333');
    wijzer((t.minuut / 30 - .5) * Math.PI, r * .69, gekleurd ? BLAUW : '#333');
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function zin(t) {
    if (t.soort === 'bijna') return `${uur12(t.uur + 1)} uur`;
    if (t.soort === 'netover' || t.minuut === 0) return `${uur12(t.uur)} uur`;
    if (t.minuut === 30) return `half ${uur12(t.uur + 1)}`;
    if (t.minuut === 15) return `kwart over ${uur12(t.uur)}`;
    if (t.minuut === 45) return `kwart voor ${uur12(t.uur + 1)}`;
    return t.minuut < 30 ? `${t.minuut} over ${uur12(t.uur)}` : `${60 - t.minuut} voor ${uur12(t.uur + 1)}`;
  }

  function wekker(ctx, x, y, t, ingevuld, gekleurd, oplossing, uur = uur12(t.uur)) {
    ctx.fillStyle = '#f0f1f3'; ctx.strokeStyle = '#babec4'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x - 59, y, 118, 36, 5); ctx.fill(); ctx.stroke();
    ctx.font = '22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333'; ctx.fillText(':', x, y + 18);
    ctx.fillStyle = oplossing ? ANTWOORD : gekleurd ? ROOD : '#333';
    ctx.fillText(ingevuld ? String(uur).padStart(2, '0') : '__', x - 28, y + 18);
    ctx.fillStyle = oplossing ? ANTWOORD : gekleurd ? BLAUW : '#333';
    ctx.fillText(ingevuld ? String(t.minuut).padStart(2, '0') : '__', x + 28, y + 18);
  }

  function teken(canvas, inst) {
    const extraRuimte = !inst.gekleurdeHulpklok && inst.voorOverHulpType && inst.voorOverHulpType !== 'geen' ? (inst.toon24Uur ? 64 : 32) : !inst.gekleurdeHulpklok && inst.toon24Uur ? 16 : 0;
    const cols = 3, w = 220, h = (inst.tijdnotatie === '24uur' ? (inst.invulmethode === 'beide' ? 360 : 310) : 285) + extraRuimte + (inst.invulmethode === 'beide' ? 12 : 0);
    canvas.width = cols * w; canvas.height = Math.ceil(inst.tijden.length / cols) * h;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    inst.tijden.forEach((t, i) => {
      const x = (i % cols) * w, y = Math.floor(i / cols) * h;
      ctx.strokeStyle = '#cad8e0'; ctx.lineWidth = 1; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      if (inst.gekleurdeHulpklok) klok(ctx, x + w / 2, y + 94, 66, t, true);
      else KlokLezen.tekenEnkeleKlok(ctx, x + w / 2, y + 94 + extraRuimte / 2, 73, t, inst);
      ctx.save(); ctx.translate(0, extraRuimte);
      const isNabij = nabij(t), beide = inst.invulmethode === 'beide';
      if (isNabij || beide || inst.invulmethode === 'analoog') {
        ctx.font = '17px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#222';
        const zinHulp = inst.toonHulpAnaloog && !inst.gekleurdeHulpklok && !isNabij;
        const begin = zinHulp && t.minuut === 30 ? 'Het is half' : zinHulp && [15,45].includes(t.minuut) ? 'Het is kwart' : 'Het is';
        ctx.fillText(t.soort === 'bijna' ? 'Het is bijna' : t.soort === 'netover' ? 'Het is net over' : begin, x + w / 2, y + 193);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x + 23, y + 240); ctx.lineTo(x + w - 23, y + 240); ctx.stroke();
        if (inst.oplossingen) { ctx.fillStyle = ANTWOORD; ctx.fillText(zinHulp ? zin(t).replace(begin === 'Het is half' ? /^half / : begin === 'Het is kwart' ? /^kwart / : /^$/, '') : zin(t), x + w / 2, y + 227); }
        else if (zinHulp && t.minuut === 0) ctx.fillText('___ uur', x + w / 2, y + 227);
        else if (zinHulp && [15,45].includes(t.minuut)) ctx.fillText('voor / over ___', x + w / 2, y + 227);
      }
      if (!isNabij && inst.invulmethode !== 'analoog') {
        const top = beide ? (inst.tijdnotatie === '24uur' ? 262 : 251) : 195;
        wekker(ctx, x + w / 2, y + top, t, inst.oplossingen, false, inst.oplossingen, inst.tijdnotatie === '24uur' ? uur12(t.uur) % 12 : uur12(t.uur));
        if (inst.tijdnotatie === '24uur') {
          ctx.font = '11px Arial'; ctx.fillStyle = '#333';
          ctx.fillText('ochtend / voormiddag', x + w / 2, y + top - 8);
          ctx.fillText('namiddag / avond', x + w / 2, y + top + 49);
          wekker(ctx, x + w / 2, y + top + 58, t, inst.oplossingen, false, inst.oplossingen, uur12(t.uur) % 12 + 12);
        }
      }
      ctx.restore();
    });
  }

  function kleurInstellingen() {
    const moeilijkheden = [...document.querySelectorAll('input[name="verbMoeilijkheid"]:checked')].map(el => el.value);
    if (!moeilijkheden.length) { document.getElementById('meldingVerbinden').textContent = 'Kies minstens één moeilijkheidsgraad!'; return null; }
    document.getElementById('meldingVerbinden').textContent = '';
    const minuten = moeilijkheden.includes('5minuten') ? Array.from({length:12}, (_, i) => i * 5) : [...new Set(moeilijkheden.flatMap(m => m === 'uur' ? [0] : m === 'halfuur' ? [30] : [15,45]))];
    const aantal = Number(document.getElementById('kleurAantalParen').value);
    const tijden = verdeelTijden(minuten, aantal);
    const kaarten = shuffle(tijden.flatMap((t, paar) => [{...t, paar, analoog:true}, {...t, paar, analoog:false}]));
    return {type:'kleurparen', kaarten, gekleurdeHulpklok:document.getElementById('verbGekleurdeHulpklok').checked};
  }

  // Verdeel over de gekozen minuutstanden, zodat uur + halfuur altijd een mix is.
  function verdeelTijden(minuten, aantal) {
    const standen = shuffle([...minuten]);
    const pools = standen.map(minuut => shuffle(Array.from({length:12}, (_, i) => ({uur:i + 1, minuut}))));
    return shuffle(Array.from({length:aantal}, (_, i) => pools[i % pools.length][Math.floor(i / pools.length) % 12]));
  }

  function tekenKleuren(canvas, inst) {
    const w = 180, h = 180;
    canvas.width = 4 * w; canvas.height = Math.ceil(inst.kaarten.length / 4) * h;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    inst.kaarten.forEach((t, i) => {
      const x = i % 4 * w, y = Math.floor(i / 4) * h;
      ctx.fillStyle = inst.oplossingen ? kleuren[t.paar] : '#fff'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#9eb8c8'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
      if (t.analoog) klok(ctx, x + w / 2, y + h / 2, 61, t, inst.gekleurdeHulpklok);
      else wekker(ctx, x + w / 2, y + h / 2 - 18, t, true, inst.gekleurdeHulpklok, false);
    });
  }

  function preview(container, inst) {
    container.replaceChildren();
    const canvas = document.createElement('canvas'); canvas.style.cssText = 'width:100%;height:auto;display:block';
    tekenKleuren(canvas, inst); container.appendChild(canvas);
  }

  function pdf(doc, inst, canvas, y, margin, volgendePagina) {
    const isKleur = inst.type === 'kleurparen', bron = isKleur ? inst.kaarten : inst.tijden;
    const stap = isKleur ? bron.length : 3;
    const pageW = doc.internal.pageSize.getWidth();
    const breedte = (pageW - margin * 2) * (isKleur ? .85 : 1);
    const links = (pageW - breedte) / 2;
    for (let i = 0; i < bron.length; i += stap) {
      const rij = {...inst, [isKleur ? 'kaarten' : 'tijden']:bron.slice(i, i + stap)};
      (isKleur ? tekenKleuren : teken)(canvas, rij);
      const hoogte = breedte * canvas.height / canvas.width;
      if (y + hoogte > doc.internal.pageSize.getHeight() - margin - 5) y = volgendePagina();
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', links, y, breedte, hoogte);
      y += hoogte;
    }
    return y;
  }
  return {tekenKlok:klok, gebruikt, teken, kleurInstellingen, preview, pdf, zin, verdeelTijden};
})();
