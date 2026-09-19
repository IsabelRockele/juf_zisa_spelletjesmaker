/* Gedeelde tekeningen voor scherm en PDF: TE +/- TE zonder brug. */
const Tot100Hulp = (() => {
  const modes = ['vakje', 'mab', 'sprongen', 'sprongen-leeg', 'lijnen'];
  function actief(blok) {
    return Number(blok.niveau) === 100 && blok.brug === 'zonder' &&
      ['optellen', 'aftrekken'].includes(blok.bewerking) &&
      modes.slice(1).includes(blok.tot100Hulp);
  }
  function gegevens(oef) {
    const m = oef.vraag.match(/^(\d+)\s*([+−-])\s*(\d+)/);
    if (!m) return null;
    const a = Number(m[1]), b = Number(m[3]), min = m[2] !== '+';
    if (a < 11 || b < 11 || a >= 100 || b >= 100 || ! (a % 10) || !(b % 10)) return null;
    if (min ? a < b || a % 10 < b % 10 : a + b > 100 || a % 10 + b % 10 > 10) return null;
    const t = Math.floor(b / 10) * 10, e = b % 10, tussen = a + (min ? -t : t);
    return { a, b, min, t, e, tussen, uit: tussen + (min ? -e : e), op: min ? '−' : '+' };
  }
  function maten(mode) { return mode.startsWith('sprongen') ? [740, 180] : [360, mode === 'mab' ? 350 : 140]; }
  function svg(blok, oef, oplossing = false) {
    const d = gegevens(oef);
    if (!d) return '';
    const mode = blok.tot100Hulp, [w, h] = maten(mode), blauw = '#006bb6';
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${d.a} ${d.op} ${d.b}"><rect width="${w}" height="${h}" fill="white"/>`;
    const line = (x,y,X,Y,c='#b9bfc5') => { s += `<path d="M${x} ${y} L${X} ${Y}" fill="none" stroke="${c}" stroke-width="1"/>`; };
    const text = (x,y,v,c='#222',anchor='start',size=17) => { s += `<text x="${x}" y="${y}" fill="${c}" font-family="Arial, sans-serif" font-size="${size}" text-anchor="${anchor}">${v}</text>`; };
    const rect = (x,y,W,H,fill,stroke='#777',rx=0) => { s += `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="0.8"/>`; };
    if (mode === 'mab') {
      rect(12,8,160,25,'#50b848'); rect(172,8,160,25,'#ffda00');
      text(92,27,'T','#111','middle'); text(252,27,'E','#111','middle');
      const rowH = d.min ? 167 : 88;
      const row = (n,y,removeT=0,removeE=0) => {
        rect(12,y,160,rowH,'white'); rect(172,y,160,rowH,'white');
        const tens = Math.floor(n / 10), ones = n % 10;
        for(let i=0;i<tens;i++) {
          const x = 19 + i*15;
          for(let j=0;j<10;j++) rect(x,y+10+j*6,10,6,'#59b743','#39852d');
          line(x+3,y+10,x+3,y+70,'#b7dc70');
        }
        const step = d.min ? 15 : 9;
        // Losse eenheden: ook bij negen blokjes blijft er witruimte tussen.
        for(let i=0;i<ones;i++) { rect(184,y+8+i*step,9,6,'#ffdb3d','#b49b26'); line(185,y+9+i*step,191,y+9+i*step,'#fff4a4'); }
        // Omcirkel het weg te nemen materiaal, zonder het antwoord prijs te geven.
        if(removeT) { rect(17+(tens-removeT)*15,y+7,removeT*15-1,66,'none','#ef4848',5); text(25+tens*15,y+88,'↘','#ef4848','middle',24); }
        if(removeE) { rect(181,y+5+(ones-removeE)*step,15,(removeE-1)*step+13,'none','#ef4848',5); text(211,y+15+(ones-removeE)*step,'↘','#ef4848','middle',24); }
      };
      row(d.a,33,d.min ? d.t/10 : 0,d.min ? d.e : 0);
      if(!d.min) row(d.b,121);
    }
    const sprongen = mode.startsWith('sprongen');
    if (sprongen) {
      const filled = mode === 'sprongen' || oplossing;
      const start = d.min ? 310 : 35, mid = d.min ? 90 : 255, end = d.min ? 35 : 310;
      line(15,125,335,125,'#222');
      const arc = (from,to,top,label,dashed=false) => {
        s += `<path d="M${from} 125 Q${(from+to)/2} ${top} ${to} 125" fill="none" stroke="${blauw}" stroke-width="1.5" ${dashed?'stroke-dasharray="4 3"':''}/>`;
        const cx=(from+to)/2, cy=(125+top)/2, dir=to>from?1:-1;
        s += `<path d="M${cx-dir*5} ${cy-5} L${cx} ${cy} L${cx-dir*5} ${cy+5}" fill="none" stroke="${blauw}" stroke-width="1.5"/>`;
        if(filled) text(cx,cy-12,label,blauw,'middle');
        else line(cx-18,cy-10,cx+18,cy-10);
      };
      arc(start,end,-55,`${d.op} ${d.b}`); arc(start,mid,25,`${d.op} ${d.t}`,true); arc(mid,end,65,`${d.op} ${d.e}`,true);
      [start,mid,end].forEach(x=> { s += `<circle cx="${x}" cy="125" r="3" fill="${blauw}"/>`; });
      text(start,148,d.a,'#222','middle');
      if(filled) { text(mid,148,d.tussen,blauw,'middle'); text(end,148,d.uit,blauw,'middle'); }
      else { line(mid-17,150,mid+17,150); line(end-17,150,end+17,150); }
    }
    const x = sprongen ? 380 : 12, y = mode === 'mab' ? 246 : sprongen ? 55 : 32;
    const vraag = `${d.a} ${d.op} ${d.b}`, eerste = `(${d.a} ${d.op} ${d.t}) ${d.op} ${d.e}`;
    const schrijfSom = mode === 'sprongen';
    const left = x + (schrijfSom ? 0 : 100), right = w-16;
    // Alle gelijkheidstekens hebben dezelfde vaste x-positie.
    if(!schrijfSom || oplossing) {
      const kleur = schrijfSom ? blauw : '#222';
      text(x+74,y,vraag,kleur,'end');
      text(x+82,y,'=',kleur);
    }
    line(left,y+5,right,y+5);
    if(oplossing) text(x+103,y,eerste,blauw);
    for(let i=1;i<=2;i++) {
      if (!sprongen || oplossing) text(x+82,y+i*39,'=',sprongen ? blauw : '#222');
      const lijnStart = mode === 'sprongen-leeg' ? x+82 : sprongen ? x : x+100;
      line(lijnStart,y+i*39+5,right,y+i*39+5);
      if(oplossing) text(x+103,y+i*39,i===1 ? `${d.tussen} ${d.op} ${d.e}` : d.uit,blauw);
    }
    return s + '</svg>';
  }
  async function png(blok,oef,oplossing) {
    const source = svg(blok,oef,oplossing), [w,h] = maten(blok.tot100Hulp);
    const url = URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}));
    try {
      const img = new Image(); img.src = url; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width=w*3; canvas.height=h*3;
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      return canvas.toDataURL('image/png');
    } finally { URL.revokeObjectURL(url); }
  }
  return { actief, gegevens, maten, svg, png };
})();
