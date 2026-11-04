/* Gedeelde tekeningen voor scherm en PDF: TE +/- TE zonder brug. */
const Tot100Hulp = (() => {
  const modes = ['vakje', 'mab', 'sprongen', 'sprongen-leeg', 'lijnen'];
  function actief(blok) {
    if(blok.tot100Hulp==='invullijn') return ['optellen','aftrekken'].includes(blok.bewerking);
    if(blok.tot100Hulp?.includes('duizend-splits')) return true;
    if(blok.tot100Hulp==='cirkelrekenen') return true;
    if(blok.tot100Hulp?.includes('tiental'))return true;
    if (Number(blok.niveau) === 100 && blok.brug === 'met' && ['optellen','aftrekken'].includes(blok.bewerking) && blok.tot100Hulp?.includes('brug')) return true;
    return Number(blok.niveau) === 100 && blok.brug === 'zonder' &&
      ['optellen', 'aftrekken'].includes(blok.bewerking) &&
      modes.slice(1).includes(blok.tot100Hulp);
  }
  function gegevens(oef, blok = {}) {
    if(blok.tot100Hulp==='invullijn') return {a:'',b:'',op:''};
    const m = oef.vraag.match(/^(\d+)\s*([+−-])\s*(\d+)/);
    if (!m) return null;
    const a = Number(m[1]), b = Number(m[3]), min = m[2] !== '+';
    if(blok.tot100Hulp?.includes('duizend-splits')) return {a,b,min,op:min?'−':'+'};
    if(blok.tot100Hulp==='cirkelrekenen') return {a,b,min,op:min?'−':'+'};
    if(blok.tot100Hulp?.includes('tiental'))return {a,b,op:'+',tiental:true};
    if (blok.tot100Hulp?.includes('brug')) {if(a<11 || b<1 || (min ? a<b || a%10>=b%10 : a+b>100 || a%10+b%10<=10))return null;const t=Math.floor(b/10)*10,e=b%10;return {a,b,t,e,tussen:a+(min?-t:t),uit:a+(min?-b:b),min,op:min?'−':'+',brug:true};}
    if (a < 11 || b < 11 || a >= 100 || b >= 100 || ! (a % 10) || !(b % 10)) return null;
    if (min ? a < b || a % 10 < b % 10 : a + b > 100 || a % 10 + b % 10 > 10) return null;
    const t = Math.floor(b / 10) * 10, e = b % 10, tussen = a + (min ? -t : t);
    return { a, b, min, t, e, tussen, uit: tussen + (min ? -e : e), op: min ? '−' : '+' };
  }
  function maten(mode) { if(mode==='invullijn') return [360,55]; if(mode.includes('duizend-splits')) return [mode.startsWith('sprongen')?740:360,155]; if(mode==='cirkelrekenen') return [520,112]; if(mode.startsWith('tiental-')) return [360,80]; if(mode.includes('brug')) return [mode.startsWith('sprongen')?740:360,mode.includes('splits')?240:180]; return mode.startsWith('sprongen') ? [740, 180] : [360, mode === 'mab' ? 350 : 140]; }
  function svg(blok, oef, oplossing = false) {
    const d = gegevens(oef, blok);
    if (!d) return '';
    const mode = blok.tot100Hulp, [w, h] = maten(mode), blauw = '#006bb6';
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${d.a} ${d.op} ${d.b}"><rect width="${w}" height="${h}" fill="white"/>`;
    const line = (x,y,X,Y,c='#b9bfc5') => { s += `<path d="M${x} ${y} L${X} ${Y}" fill="none" stroke="${c}" stroke-width="1"/>`; };
    const text = (x,y,v,c='#222',anchor='start',size=17) => { s += `<text x="${x}" y="${y}" fill="${c}" font-family="Arial, sans-serif" font-size="${size}" text-anchor="${anchor}">${v}</text>`; };
    const rect = (x,y,W,H,fill,stroke='#777',rx=0) => { s += `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="0.8"/>`; };
    if(mode==='invullijn'){
      const veilig = waarde => String(waarde).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
      const som = oef.vraag.trim().replace(/\s*=$/,'')+' =';
      const x = 18+som.length*9;
      text(12,34,veilig(som),'#222','start',20);
      line(x,39,x+62,39,'#555');
      if(oplossing)text(x+3,34,veilig(oef.antwoord ?? ''),blauw,'start',20);
      return s+'</svg>';
    }
    if(mode.includes('duizend-splits')){
      if(oef.uitgewerktVoorbeeld) rect(2,2,w-4,h-4,'#e9f4ff','#3479b0',9);
      else if(mode.startsWith('sprongen')) rect(2,2,w-4,h-4,'none','#c9ced5',9);
      const rang=d.b<10?10:100, eenheden=d.b<10?0:d.a%10;
      const rest=(d.a-eenheden)%rang;
      const eerste=d.min?rest:rang-rest;
      const tweede=d.b-eerste, richting=d.min?-1:1;
      const midden=d.a+richting*eerste, uit=d.a+richting*d.b;
      text(12,46,d.a+' '+d.op+' '+d.b+' =');
      line(119,52,345,52);
      if(oplossing)text(122,46,uit,blauw);
      if(oplossing || !mode.endsWith('-zelf')) {
        line(66,55,43,79);line(66,55,89,79);
        line(25,104,60,104);line(72,104,107,104);
      }
      if(oplossing){text(43,100,eerste,blauw,'middle');text(89,100,tweede,blauw,'middle');}
      if(mode.startsWith('sprongen')){
        line(382,112,724,112,'#222');
        if(oplossing){
          const xs=d.min?[699,552,405]:[405,552,699];
          const boog=(x,X,top,sprong,stippel)=>{
            const cx=(x+X)/2,cy=(112+top)/2,staart=cx-6*richting;
            s+='<path d="M'+x+' 112 Q'+cx+' '+top+' '+X+' 112" fill="none" stroke="'+blauw+'"'+(stippel?' stroke-dasharray="5 4"':'')+'/>';
            line(staart,cy-5,cx,cy,blauw);line(cx,cy,staart,cy+5,blauw);
            text(cx,cy-9,d.op+' '+sprong,blauw,'middle');
          };
          boog(xs[0],xs[2],-47,d.b,false);
          if(eerste && tweede){boog(xs[0],xs[1],55,eerste,true);boog(xs[1],xs[2],55,tweede,true);}
          xs.forEach((x,i)=>{if(i===1 && (!eerste || !tweede))return;line(x,109,x,115,blauw);text(x,136,[d.a,midden,uit][i],blauw,'middle');});
        }
      }
      return s+'</svg>';
    }
    if(mode==='cirkelrekenen'){
      const grootste=Math.max(d.a,d.b);
      const rangen=grootste===1000?[1000,100,10,1]:Number(blok.niveau)===1000?[100,10,1]:grootste===100?[100,10,1]:[10,1];
      const som = d.a+' '+d.op+' '+d.b+' =';
      const lettergrootte = blok.cirkelPdfLettergrootte || 24;
      const somBreedte = ((String(d.a).length + String(d.b).length)*0.56 + 2)*lettergrootte;
      const start = 8 + somBreedte + 5 + 37;
      text(8,67,som,'#222','start',lettergrootte);
      rangen.forEach((rang,i)=>{
        const x=start+i*80;
        const deel=n=>Math.floor(n/rang)%10*rang;
        const waarde=deel(d.a)+(d.min?-1:1)*deel(d.b);
        const letters = {1000:'D',100:'H',10:'T',1:'E'};
        const kleuren = {1000:'#e6d9f6',100:'#c7e2ff',10:'#c9edc8',1:'#fff19e'};
        const letterkleuren = {1000:'#674092',100:'#175da2',10:'#277335',1:'#946900'};
        if(blok.cirkelLetters) text(x,24,letters[rang],blok.cirkelKleuren ? letterkleuren[rang] : '#222','middle',18);
        const kleur = blok.cirkelKleuren ? kleuren[rang] : 'none';
        s+='<ellipse cx="'+x+'" cy="60" rx="37" ry="28.5" fill="'+kleur+'" stroke="#222"/>';
        if(oef.hulpfiche) {
          const a = deel(d.a), b = deel(d.b);
          const berekening = d.min ? a+' − '+b : a+' + '+b;
          text(x,d.min && i > 0 ? 99 : 107,berekening+(d.min && i > 0 ? ' = '+Math.abs(waarde) : ''),'#222','middle',14);
          if(d.min && i > 0) text(x,111,waarde < 0 ? 'tekort, dus −' : 'over, dus +','#222','middle',12);
        }
        if(oplossing)text(x,67,waarde<0?'−'+Math.abs(waarde):i>0?'+'+waarde:waarde,blauw,'middle',lettergrootte);
      });
      const x=start+(rangen.length-1)*80+43;
      text(x,67,'=','#222','start',lettergrootte);line(x+22,74,x+75,74);
      if(oplossing)text(x+22,67,d.a+(d.min?-d.b:d.b),blauw,'start',lettergrootte);
      return s+'</svg>';
    }
    if(d.tiental){
      const lo=Math.floor(d.a/10)*10,hi=lo+10;
      if(mode.startsWith('tiental-')){
        const min=mode==='tiental-min'||(mode==='tiental-mix'&&oef.tientalMin),op=min?'−':'+';
        text(18,42,d.a+' '+op);line(75,48,140,48);text(150,42,'= '+(min?lo:hi));
        if(oplossing)text(95,42,min?d.a-lo:hi-d.a,blauw);return s+'</svg>';
      }
      text(20,65,d.a+' −');text(20,115,d.a+' +');line(72,70,135,70);line(72,120,135,120);text(145,65,'= '+lo);text(145,115,'= '+hi);
      if(oplossing){text(90,65,d.a-lo,blauw);text(90,115,hi-d.a,blauw);}
      const bovenElkaar=!!blok.keuzeVoorbeeld;
      if(bovenElkaar)s+='<g transform="translate(-280 120)">';
      line(310,125,710,125,'#222');const x=330+(d.a-lo)/10*350;
      [[330,lo],[x,d.a],[680,hi]].forEach(([X,n])=>{text(X,150,n,'#222','middle');if(n===d.a){s+='<path d="M'+(X-6)+' 119 L'+(X+6)+' 131 M'+(X+6)+' 119 L'+(X-6)+' 131" stroke="'+blauw+'" stroke-width="1.5"/>';}else{s+='<circle cx="'+X+'" cy="125" r="3"/>';}});
      [[x,330,'−',d.a-lo,'#c33'],[x,680,'+',hi-d.a,'#287d32']].forEach(([X,Y,op,n,c])=>{const cx=(X+Y)/2;s+='<path d="M'+X+' 125 Q'+cx+' 20 '+Y+' 125" fill="none" stroke="'+c+'"/>';const dir=Y>X?1:-1;s+='<path d="M'+(cx-dir*5)+' 67 L'+cx+' 72 L'+(cx-dir*5)+' 77" fill="none" stroke="'+c+'"/>';text(cx,55,op+(oplossing?' '+n:''),c,'middle');line(cx-17,60,cx+17,60);});if(bovenElkaar){s+='</g>';s=s.replace('viewBox="0 0 740 180"','viewBox="0 0 460 300"').replace('width="740" height="180"','width="460" height="300"');}
      return s+'</svg>';
    }
    if(d.brug) {
      const splits=mode.includes('splits'),as=mode.startsWith('sprongen'),aan=d.min?d.a%10:10-d.a%10;
      const first=d.b<10?'('+d.a+' '+d.op+' '+aan+') '+d.op+' '+(d.b-aan):'('+d.a+' '+d.op+' '+d.t+') '+d.op+' '+d.e;
      const mid=d.b<10?(d.a+(d.min?-aan:aan))+' '+d.op+' '+(d.b-aan):d.tussen+' '+d.op+' '+d.e;
      const ys=[35,85,splits?190:140];text(10,35,d.a+' '+d.op+' '+d.b);
      ys.forEach((y,i)=>{text(88,y,'=');line(108,y+6,345,y+6);if(oplossing)text(110,y,[first,mid,d.uit][i],blauw);});
      if(splits && oplossing && d.b>=10){const x=110+mid.length*8-5,n=d.min?d.tussen%10:10-d.tussen%10;line(x,94,x-12,110,blauw);line(x,94,x+12,110,blauw);text(x-12,132,n,blauw,'middle');text(x+12,132,d.e-n,blauw,'middle');}
      if(as){line(385,145,720,145,'#222');text(d.min?700:405,168,d.a,'#222','middle');s+='<circle cx="'+(d.min?700:405)+'" cy="145" r="3" fill="#222"/>';
        if(oplossing){
          const groen='#287d32', y=145;
          // De top van een kwadratische boog ligt halverwege de controlehoogte.
          const boog=(x,X,top,label,stippel=false)=>{
            const cx=(x+X)/2,cy=(y+top)/2;
            s+='<path d="M'+x+' '+y+' Q'+cx+' '+top+' '+X+' '+y+'" fill="none" stroke="'+groen+'" stroke-width="1.5"'+(stippel?' stroke-dasharray="4 3"':'')+'/>';
            s+='<path d="M'+(cx-(d.min?-6:6))+' '+(cy-6)+' L'+cx+' '+cy+' L'+(cx-(d.min?-6:6))+' '+(cy+6)+'" fill="none" stroke="'+groen+'" stroke-width="1.5"/>';
            text(cx,cy-12,d.op+' '+label,groen,'middle');
          };
          boog(d.min?700:405,d.min?405:700,-55,d.b);
          let ns,xs;
          if(d.b<10){ns=[d.a,d.a+(d.min?-aan:aan),d.uit];xs=[405,550,700];}
          else {
            ns=[d.a,d.tussen,d.tussen+(d.min?-d.tussen%10:10-d.tussen%10),d.uit];xs=[405,510,605,700];
            boog(d.min?595:510,d.min?405:700,35,d.e,true);
          }
          if(d.min)xs=xs.map(x=>1105-x);
          for(let i=1;i<ns.length;i++)boog(xs[i-1],xs[i],ns.length===4&&i>1?95:65,Math.abs(ns[i]-ns[i-1]),true);
          xs.forEach((x,i)=>{
            s+='<circle cx="'+x+'" cy="145" r="3" fill="'+groen+'"/>';
            if(i)text(x,168,ns[i],groen,'middle');
          });
        }
      }return s+'</svg>';
    }
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
  function fiche(blok) {
    const niveau = Number(blok.niveau);
    const zonder = blok.brug === 'zonder';
    const plus = zonder ? {20:'13 + 4',100:'35 + 24',1000:'234 + 352'} : {20:'8 + 7',100:'35 + 27',1000:'234 + 357'};
    const min = zonder ? {20:'16 − 4',100:'54 − 32',1000:'432 − 121'} : {20:'13 − 8',100:'54 − 38',1000:'432 − 147'};
    return {vraag:(blok.bewerking === 'aftrekken' ? min : plus)[niveau],hulpfiche:true};
  }
  return { fiche, actief, gegevens, maten, svg, png };
})();
