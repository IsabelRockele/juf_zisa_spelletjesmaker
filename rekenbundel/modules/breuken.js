/* Breuken optellen en aftrekken: gelijknamig en ongelijknamig. */
const Breuken = (() => {
  const delers = [2, 3, 4, 5, 6, 8, 9, 10, 12];
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const lcm = (a, b) => a * b / gcd(a, b);
  const kies = a => a[Math.floor(Math.random() * a.length)];

  function maakEen(config) {
    const soort = config.soort || 'gelijknamig';
    const bewerking = config.bewerking === 'gemengd' ? kies(['optellen', 'aftrekken']) : (config.bewerking || 'optellen');
    const op = bewerking === 'aftrekken' ? '-' : '+';
    let n1, n2, d1, d2, doel;
    for (let poging = 0; poging < 80; poging++) {
      d1 = kies(delers);
      if (soort === 'gelijknamig') d2 = d1;
      else {
        d2 = kies(delers.filter(d => d !== d1 && (d % d1 === 0 || d1 % d === 0)));
        if (!d2) continue;
      }
      n1 = 1 + Math.floor(Math.random() * (d1 - 1));
      n2 = 1 + Math.floor(Math.random() * (d2 - 1));
      doel = lcm(d1, d2);
      const g1 = n1 * (doel / d1), g2 = n2 * (doel / d2);
      const resultaat = bewerking === 'optellen' ? g1 + g2 : g1 - g2;
      if (resultaat > 0 && resultaat < doel) break;
    }
    const g1 = n1 * (doel / d1), g2 = n2 * (doel / d2);
    const teller = bewerking === 'optellen' ? g1 + g2 : g1 - g2;
    return {
      sleutel: `${n1}/${d1}${op}${n2}/${d2}`,
      type: soort, bewerking, op, n1, d1, n2, d2, doel,
      factor1: doel / d1, factor2: doel / d2,
      g1, g2, teller, antwoord: `${teller}/${doel}`
    };
  }

  function genereer(config = {}) {
    if (config.soort === 'gemengde-getallen') return genereerGemengde(config);
    const aantal = config.aantalOefeningen || 6;
    const uit = [], gezien = new Set();
    for (let i = 0; i < aantal * 30 && uit.length < aantal; i++) {
      const oef = maakEen(config);
      if (!gezien.has(oef.sleutel)) { gezien.add(oef.sleutel); uit.push(oef); }
    }
    return uit;
  }

  function genereerGemengde(config = {}) {
    const aantal = config.aantalOefeningen || 6, uit = [], gezien = new Set();
    for (let poging=0; poging<aantal*50 && uit.length<aantal; poging++) {
      const bewerking = config.bewerking === 'gemengd' ? kies(['optellen','aftrekken']) : (config.bewerking || 'optellen');
      let d1=kies([2,3,4,5,6,8,10,12]);
      if (bewerking==='aftrekken') {
        const patroon=uit.length%3;
        if(patroon===0&&d1===2)d1=3;
        let w1,w2,n1,n2;
        if(patroon===0){w1=2+Math.floor(Math.random()*3);w2=1+Math.floor(Math.random()*(w1-1));n1=2+Math.floor(Math.random()*Math.max(1,d1-2));n2=1+Math.floor(Math.random()*Math.max(1,n1-1));}
        else {w1=1+Math.floor(Math.random()*4);w2=patroon===2&&w1>1?Math.floor(Math.random()*w1):0;n1=0;n2=1+Math.floor(Math.random()*(d1-1));}
        const totaal=(w1*d1+n1)-(w2*d1+n2); if(totaal<=0)continue;
        const heel=Math.floor(totaal/d1),rest=totaal%d1,sleutel=`${w1}-${n1}/${d1}-aftrekken-${w2}-${n2}/${d1}`;
        if(gezien.has(sleutel))continue;gezien.add(sleutel);
        uit.push({sleutel,type:'gemengde-getallen',vorm:uit.length%2===0?'strook':'taart',bewerking,op:'-',w1,n1,d1,w2,n2,d2:d1,doel:d1,ongelijknamig:false,cn1:n1,cn2:n2,factor1:1,factor2:1,g1:w1*d1+n1,g2:w2*d1+n2,totaal,heel,rest,antwoord:rest?`${heel} ${rest}/${d1}`:String(heel),aftrekVorm:'eerste'});
        continue;
      }
      const noemerKeuze=config.gemengdeNoemers||'gemengd';
      const moetOngelijk=noemerKeuze==='ongelijknamig'||(noemerKeuze==='gemengd'&&uit.length%2===1);
      let d2=moetOngelijk?kies([2,3,4,5,6,8,10,12].filter(d=>d!==d1&&(d%d1===0||d1%d===0))):d1;
      if (!d2) d2=d1;
      // De eerste oefenvormen vertrekken, zoals in de methode, van gewone
      // breuken die samen een gemengd getal kunnen vormen. Daarna volgen ook
      // oefeningen met gemengde termen.
      const gewoneBreuken = uit.length % 2 === 0;
      let w1=gewoneBreuken?0:1+Math.floor(Math.random()*3), w2=gewoneBreuken?0:1+Math.floor(Math.random()*2);
      let n1=1+Math.floor(Math.random()*(d1-1)), n2=1+Math.floor(Math.random()*(d2-1));
      let doel=lcm(d1,d2), a=(w1*d1+n1)*(doel/d1), b=(w2*d2+n2)*(doel/d2);
      if (bewerking==='aftrekken' && a<=b) { [w1,w2]=[w2,w1]; [n1,n2]=[n2,n1]; [d1,d2]=[d2,d1]; doel=lcm(d1,d2); a=(w1*d1+n1)*(doel/d1); b=(w2*d2+n2)*(doel/d2); }
      if (gewoneBreuken && bewerking==='optellen' && a+b<doel) continue;
      const totaal = bewerking==='optellen' ? a+b : a-b;
      if (totaal<=0) continue;
      const heel=Math.floor(totaal/doel), rest=totaal%doel;
      const sleutel=`${w1}-${n1}/${d1}-${bewerking}-${w2}-${n2}/${d2}`;
      if (gezien.has(sleutel)) continue; gezien.add(sleutel);
      uit.push({ sleutel, type:'gemengde-getallen', vorm:uit.length%2===0?'strook':'taart', bewerking, op:bewerking==='aftrekken'?'-':'+', w1,n1,d1,w2,n2,d2,doel, ongelijknamig:d1!==d2,
        cn1:n1*(doel/d1),cn2:n2*(doel/d2),factor1:doel/d1,factor2:doel/d2,
        g1:(w1*d1+n1)*(doel/d1), g2:(w2*d2+n2)*(doel/d2), totaal, heel, rest,
        antwoord: rest ? `${heel} ${rest}/${doel}` : String(heel) });
    }
    return uit;
  }
  return { genereer };
})();
