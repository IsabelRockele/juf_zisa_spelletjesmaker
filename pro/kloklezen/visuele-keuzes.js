/* Visuele keuzes bedienen dezelfde instellingen als de werkbladgenerator. */
document.addEventListener('DOMContentLoaded', () => {
  const el = id => document.getElementById(id);
  const wijzig = node => node.dispatchEvent(new Event('change', {bubbles:true}));
  const kaarten = [];
  function kaart(container, naam, teken, gekozen, actie, extraKlasse = '') {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'voorbeeld-keuze ' + extraKlasse;
    button.setAttribute('aria-label', naam);
    const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = extraKlasse ? 100 : 180;
    canvas.setAttribute('aria-hidden', 'true'); teken(canvas.getContext('2d'));
    const label = document.createElement('span'); label.textContent = naam;
    const vink = document.createElement('b'); vink.className = 'voorbeeld-vink'; vink.textContent = '✓'; vink.setAttribute('aria-hidden', 'true');
    button.append(canvas, label, vink); container.append(button);
    button.addEventListener('click', () => { actie(); sync(); });
    kaarten.push({button, gekozen});
    return button;
  }
  function sync() {
    kaarten.forEach(({button, gekozen}) => {
      const actief = gekozen(); button.classList.toggle('gekozen', actief); button.setAttribute('aria-pressed', String(actief));
    });
  }
  function bereidVoor(id) {
    const blok = el(id), titel = blok.querySelector('.kaart-titel');
    const verborgen = document.createElement('div'); verborgen.hidden = true;
    [...blok.children].filter(child => child !== titel).forEach(child => verborgen.append(child));
    blok.append(verborgen);
    const grid = document.createElement('div'); grid.className = 'voorbeeld-keuzes'; blok.append(grid);
    return grid;
  }
  const hulpmiddelen = bereidVoor('kaart-hulpmiddelen');
  const klok = opties => ctx => {
    if (opties.gekleurd) HulpKlok.tekenKlok(ctx, 100, 89, 66, {uur:7,minuut:30}, true);
    else KlokLezen.tekenEnkeleKlok(ctx, 100, 89, 72, {uur:7,minuut:30}, {voorOverHulpType:'geen', ...opties});
  };
  const normaleHulp = () => {
    if (el('gekleurdeHulpklok').checked) { el('gekleurdeHulpklok').checked = false; wijzig(el('gekleurdeHulpklok')); }
  };
  kaart(hulpmiddelen, 'Gewone klok', klok({}), () => !el('gekleurdeHulpklok').checked && el('voorOverHulp').value === 'geen' && !['hulpminuten','hulp24uur','hulpAnaloog'].some(id => el(id).checked), () => {
    normaleHulp();
    ['hulpminuten','hulp24uur','hulpAnaloog'].forEach(id => { el(id).checked = false; wijzig(el(id)); });
    el('voorOverHulp').value = 'geen'; wijzig(el('voorOverHulp'));
  });
  kaart(hulpmiddelen, 'Gekleurde klok', klok({gekleurd:true}), () => el('gekleurdeHulpklok').checked, () => {
    el('gekleurdeHulpklok').checked = !el('gekleurdeHulpklok').checked; wijzig(el('gekleurdeHulpklok'));
  });
  for (const [id, naam, opties] of [['hulpminuten','Minuten erbij',{toonHulpminuten:true}], ['hulp24uur','24-uursgetallen',{toon24Uur:true}]]) {
    kaart(hulpmiddelen, naam, klok(opties), () => !el('gekleurdeHulpklok').checked && el(id).checked, () => {
      const aan = el('gekleurdeHulpklok').checked || !el(id).checked;
      normaleHulp(); el(id).checked = aan; wijzig(el(id));
    });
  }
  for (const [waarde, naam] of [['hulp1','Voor en over'], ['hulp2','Voor, half en over']]) {
    kaart(hulpmiddelen, naam, klok({voorOverHulpType:waarde}), () => !el('gekleurdeHulpklok').checked && el('voorOverHulp').value === waarde, () => {
      const aan = el('gekleurdeHulpklok').checked || el('voorOverHulp').value !== waarde;
      normaleHulp(); el('voorOverHulp').value = aan ? waarde : 'geen'; wijzig(el('voorOverHulp'));
    });
  }
  const zinHulp = kaart(hulpmiddelen, 'Hulp bij de zin', ctx => {
    ctx.font = '20px Arial'; ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.fillText('Het is half ___', 100, 56);
  }, () => !el('gekleurdeHulpklok').checked && el('hulpAnaloog').checked, () => {
    const aan = el('gekleurdeHulpklok').checked || !el('hulpAnaloog').checked;
    normaleHulp(); el('hulpAnaloog').checked = aan; wijzig(el('hulpAnaloog'));
  }, 'voorbeeld-zin');
  const uitleg = document.createElement('p'); uitleg.className = 'voorbeeld-uitleg'; uitleg.textContent = 'Klik op een kaartje om te kiezen. Minuten, 24-uursgetallen en voor/over-hulp kun je combineren. De gekleurde klok is een aparte klokstijl.'; hulpmiddelen.after(uitleg);

  const invullen = bereidVoor('kaart-invulmethode'); invullen.classList.add('voorbeeld-invullen');
  const wekker = (ctx, y) => {
    ctx.fillStyle = '#eef0f2'; ctx.strokeStyle = '#b8c4cd'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(33,y,134,36,5); ctx.fill(); ctx.stroke();
    ctx.font = '22px Arial'; ctx.fillStyle = '#425663'; ctx.textAlign = 'center'; ctx.fillText('__ : __',100,y+25);
  };
  for (const [waarde, naam] of [['digitaal','Digitale wekker'],['analoog','Schrijven in een zin'],['beide','Zin én wekker']]) {
    kaart(invullen, naam, ctx => {
      if (waarde !== 'digitaal') { ctx.fillStyle = '#333'; ctx.font = '18px Arial'; ctx.textAlign = 'center'; ctx.fillText('Het is __________',100,waarde === 'beide' ? 29 : 55); }
      if (waarde !== 'analoog') wekker(ctx,waarde === 'beide' ? 48 : 30);
    }, () => document.querySelector('input[name="invulmethode"]:checked').value === waarde, () => {
      const radio = document.querySelector(`input[name="invulmethode"][value="${waarde}"]`); radio.checked = true; wijzig(radio);
    }, 'voorbeeld-invul');
  }
  const updateZin = () => {
    zinHulp.hidden = document.querySelector('input[name="invulmethode"]:checked').value === 'digitaal';
    sync();
  };
  document.querySelectorAll('#kaart-hulpmiddelen input, #kaart-hulpmiddelen select, input[name="invulmethode"]').forEach(node => node.addEventListener('change', updateZin));
  const werkwijzen=el('verbWerkwijzeKeuzes');
  for(const [waarde,naam] of [['lijnen','Verbind met lijnen'],['kleuren','Kleur wat bij elkaar hoort']]) {
    kaart(werkwijzen,naam,ctx=>{
      ctx.font='17px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=1.5;
      const analoog=(x,y,uur,minuut)=>{
        ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle='#536d83';
        ctx.beginPath();ctx.arc(x,y,28,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.font='9px Arial';ctx.fillStyle='#243d56';
        ctx.fillText('12',x,y-20);ctx.fillText('3',x+21,y);ctx.fillText('6',x,y+21);ctx.fillText('9',x-21,y);
        for(const [hoek,lengte] of [[(uur+minuut/60)*Math.PI/6-Math.PI/2,13],[minuut*Math.PI/30-Math.PI/2,18]]) {
          ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(hoek)*lengte,y+Math.sin(hoek)*lengte);ctx.stroke();
        }
        ctx.restore();
      };
      const digitaal=(x,y,tekst)=>{ctx.fillStyle='#edf3f8';ctx.strokeStyle='#aebfcd';ctx.fillRect(x-30,y-16,60,32);ctx.strokeRect(x-30,y-16,60,32);ctx.fillStyle='#243d56';ctx.fillText(tekst,x,y);};
      if(waarde==='kleuren') {
        for(const [x,y,kleur] of [[8,8,'#ffe49f'],[104,8,'#c5e7b7'],[8,94,'#c5e7b7'],[104,94,'#ffe49f']]) {
          ctx.fillStyle=kleur;ctx.strokeStyle='#aebfcd';ctx.fillRect(x,y,88,76);ctx.strokeRect(x,y,88,76);
        }
        analoog(52,46,7,0);analoog(52,132,9,30);
        ctx.fillStyle='#243d56';ctx.fillText('09:30',148,46);ctx.fillText('07:00',148,132);
      } else {
        analoog(38,46,7,0);analoog(38,132,9,30);
        digitaal(161,46,'09:30');digitaal(161,132,'07:00');
        ctx.strokeStyle='#427dae';ctx.beginPath();ctx.moveTo(71,46);ctx.lineTo(127,132);ctx.moveTo(71,132);ctx.lineTo(127,46);ctx.stroke();
      }
    },()=>el('verbWerkwijze').value===waarde,()=>{el('verbWerkwijze').value=waarde;wijzig(el('verbWerkwijze'));});
  }
  el('verbWerkwijze').addEventListener('change',sync);
  const indelingen = el('verbIndelingKeuzes');
  for (const [waarde, naam] of [['bovenonder','Boven en onder'],['linksrechts','Links en rechts']]) {
    kaart(indelingen, naam, ctx => {
      ctx.strokeStyle='#71879b'; ctx.fillStyle='#293c50'; ctx.lineWidth=2;
      const klokje=(x,y)=>{ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-11);ctx.lineTo(x,y);ctx.lineTo(x+8,y+4);ctx.stroke();};
      ctx.font='13px Arial';ctx.textAlign='center';
      if(waarde==='bovenonder') {
        [40,100,160].forEach(x=>klokje(x,45));
        ctx.fillText('07:00',40,135);ctx.fillText('02:30',100,135);ctx.fillText('09:00',160,135);
        for(const [x,x2] of [[40,160],[100,40],[160,100]]) {ctx.beginPath();ctx.moveTo(x,68);ctx.lineTo(x2,114);ctx.stroke();}
      } else {
        [35,90,145].forEach(y=>klokje(35,y));
        ctx.fillText('07:00',160,40);ctx.fillText('02:30',160,95);ctx.fillText('09:00',160,150);
        for(const [y,y2] of [[35,145],[90,35],[145,90]]){ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(130,y2);ctx.stroke();}
      }
    },()=>el('verbIndeling').value===waarde,()=>{el('verbIndeling').value=waarde;wijzig(el('verbIndeling'));});
  }
  el('verbIndeling').addEventListener('change',sync);
  const verbindStijlen = el('verbStijlKeuzes');
  for (const [gekleurd, naam] of [[false, 'Zonder kleurhulp'], [true, 'Rode uren, blauwe minuten']]) {
    kaart(verbindStijlen, naam, klok(gekleurd ? {gekleurd:true} : {}), () => el('verbGekleurdeHulpklok').checked === gekleurd, () => {
      el('verbGekleurdeHulpklok').checked = gekleurd; wijzig(el('verbGekleurdeHulpklok'));
    });
  }
  el('verbGekleurdeHulpklok').addEventListener('change', sync);
  updateZin();
});
