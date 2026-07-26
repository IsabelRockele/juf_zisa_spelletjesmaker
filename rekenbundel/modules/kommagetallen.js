const Kommagetallen = (() => {
  const fmt = n => `${Math.floor(n/10)},${n%10}`;
  function maak(brug,variant,index){
    let a,b;
    for(let p=0;p<100;p++){
      const ah=1+Math.floor(Math.random()*8),at=1+Math.floor(Math.random()*8);
      a=ah*10+at;
      if(variant==='compenseren'){
        const minimum=Math.max(7,10-at);
        const bt=minimum+Math.floor(Math.random()*(10-minimum));
        const geheel=Math.floor(Math.random()*Math.min(4,10-ah));
        b=geheel*10+bt;
      }else if(brug==='met'){
        const totVol=10-at;
        const bt=totVol+Math.floor(Math.random()*at);
        const geheel=index%2===0?0:1+Math.floor(Math.random()*Math.min(3,9-ah));
        b=geheel*10+bt;
      }else if(variant==='splitsen')b=10*(1+Math.floor(Math.random()*Math.min(3,9-ah)))+1+Math.floor(Math.random()*(9-at));
      else b=index%3===0?10*(1+Math.floor(Math.random()*Math.min(4,9-ah))):1+Math.floor(Math.random()*(9-at));
      if(b>0&&a+b<=100)break;
    }
    const naar=10-a%10,heelDeel=Math.floor(b/10)*10,tiendeDeel=b%10;
    const deel1=(brug==='zonder'||b>=10)?heelDeel:naar,deel2=b-deel1,som=a+b;
    const o={sleutel:`k-${a}-${b}-${variant}-${index}`,a,b,som,antwoord:fmt(som),aTekst:fmt(a),bTekst:b%10===0?String(b/10):fmt(b),variant,brug,naar,rest:Math.max(0,b-naar),deel1,deel2};
    if(variant==='compenseren'){
      const corr=10-b%10;
      o.strategieTerm='b';o.correctie=corr;o.afgerond=b+corr;o.tussensom=som+corr;
    }
    if(variant==='transformeren'){
      const verschuif=10-b%10;
      o.verschuif=verschuif;o.nieuwA=a-verschuif;o.nieuwB=b+verschuif;o.richting='naar-b';
    }
    return o;
  }
  function maakAftrek(brug,variant,index,voorbeeld=false){
    let a,b;
    for(let p=0;p<200;p++){
      const ah=2+Math.floor(Math.random()*8),
        at=variant==='aftrek-brug-transformeren'?(index%2===0?4+Math.floor(Math.random()*3):1+Math.floor(Math.random()*2)):variant==='aftrek-brug-compenseren'?Math.floor(Math.random()*7):brug==='met'?(index%3===0?0:1+Math.floor(Math.random()*8)):Math.floor(Math.random()*10);
      a=ah*10+at;
      if(variant==='aftrek-brug-transformeren'){
        const bt=index%2===0?7+Math.floor(Math.random()*3):4+Math.floor(Math.random()*4);
        const bh=1+Math.floor(Math.random()*Math.max(1,ah-1));
        b=bh*10+bt;
      }else if(variant==='aftrek-brug-compenseren'){
        const bt=7+Math.floor(Math.random()*3);
        const bh=1+Math.floor(Math.random()*Math.max(1,ah-1));
        b=bh*10+bt;
      }else if(variant==='aftrek-brug-aanvullen'){
        const aanvulTienden=Math.min(9,at+1+Math.floor(Math.random()*Math.min(4,9-at)));
        b=a-aanvulTienden;
      }else if(brug==='met'){
        const bh=at===0?0:1+Math.floor(Math.random()*Math.min(3,ah-1));
        const bt=at===0?1+Math.floor(Math.random()*9):at+1+Math.floor(Math.random()*(9-at));
        b=bh*10+bt;
      }else if(variant==='aftrek-aanvullen'){
        const verschil=1+Math.floor(Math.random()*Math.max(1,at||5));
        b=a-verschil;
      }else{
        const bh=index%3===0?1+Math.floor(Math.random()*Math.min(4,ah)):Math.floor(Math.random()*ah);
        const bt=index%3===1?Math.floor(Math.random()*(at+1)):Math.floor(Math.random()*(at+1));
        b=bh*10+bt;
      }
      if(b>0&&b<a&&(brug==='met'?a%10<b%10:(Math.floor(a/10)>=Math.floor(b/10)&&a%10>=b%10)))break;
    }
    const verschil=a-b;
    const aE=Math.floor(a/10),aT=a%10,bE=Math.floor(b/10),bT=b%10;
    const o={sleutel:`ka-${a}-${b}-${variant}-${index}`,a,b,som:verschil,verschil,antwoord:fmt(verschil),
      aTekst:aT===0?String(aE):fmt(a),bTekst:b%10===0?String(b/10):fmt(b),variant,brug,bewerking:'aftrekken',
      aE,aT,bE,bT,voorbeeld};
    if(brug==='met'){
      if(aT===0&&bE===0){
        o.split1=a-10;o.split2=10;o.split1Tekst=String(aE-1);o.split2Tekst='1';
        o.tussen1=10-b;o.stap1=`1 − ${o.bTekst} = ${fmt(o.tussen1)}`;
        o.stap2=`${aE-1} + ${fmt(o.tussen1)} = ${o.antwoord}`;
      }else{
        o.split1=bE*10;o.split2=bT;o.split1Tekst=String(bE);o.split2Tekst=fmt(bT);
        o.tussen1=a-o.split1;o.stap1=`${o.aTekst} − ${bE} = ${fmt(o.tussen1)}`;
        o.stap2=`${fmt(o.tussen1)} − ${fmt(bT)} = ${o.antwoord}`;
      }
    }
    if(variant==='aftrek-brug-compenseren'){
      const corr=10-bT;
      o.correctie=corr;o.afgerond=b+corr;o.tussenverschil=a-o.afgerond;
    }
    if(variant==='aftrek-brug-transformeren'){
      const rondTweede=(10-bT)<aT;
      const corr=rondTweede?10-bT:-aT;
      o.transformCorr=corr;o.nieuwA=a+corr;o.nieuwB=b+corr;o.transformDoel=rondTweede?'tweede':'eerste';
    }
    return o;
  }
  function maakRooster(bewerking,brug,index){
    const aftrek=bewerking==='aftrekken';
    let rijen=[],kolommen=[];
    const getal=(e,t)=>e*10+t;
    if(aftrek){
      if(brug==='zonder'){
        rijen=[getal(6,9),getal(7,8),getal(8,7),getal(9,6)];
        kolommen=[getal(0,1),getal(1,2),getal(2,3),getal(3,4),getal(4,5)];
      }else if(brug==='met'){
        rijen=[getal(6,0),getal(7,1),getal(8,2),getal(9,3)];
        kolommen=[getal(0,6),getal(1,7),getal(2,8),getal(3,9),getal(4,7)];
      }else{
        rijen=[getal(6,0),getal(7,3),getal(8,7),getal(9,2)];
        kolommen=[getal(0,7),getal(1,5),getal(2,8),getal(3,1),getal(4,4)];
      }
    }else{
      if(brug==='zonder'){
        rijen=[getal(1,1),getal(2,2),getal(3,3),getal(4,4)];
        kolommen=[getal(0,1),getal(1,2),getal(2,3),getal(3,4),getal(4,5)];
      }else if(brug==='met'){
        rijen=[getal(1,6),getal(2,7),getal(3,8),getal(4,9)];
        kolommen=[getal(0,6),getal(1,7),getal(2,8),getal(3,9),getal(4,6)];
      }else{
        rijen=[getal(1,1),getal(2,4),getal(3,7),getal(4,8)];
        kolommen=[getal(0,2),getal(1,5),getal(2,7),getal(3,3),getal(4,9)];
      }
    }
    const draai=index%kolommen.length;
    kolommen=kolommen.slice(draai).concat(kolommen.slice(0,draai));
    return {
      sleutel:`kr-${bewerking}-${brug}-${index}`,
      variant:aftrek?'aftrek-rooster':'rooster',rooster:true,bewerking,brug,
      rijen,kolommen,
      antwoorden:rijen.map(r=>kolommen.map(k=>fmt(aftrek?r-k:r+k)))
    };
  }
  function genereer({bewerking='optellen',brug='zonder',variant='kort',aantalOefeningen=6,toonVoorbeeld=false}={}){
    if(variant==='rooster'||variant==='aftrek-rooster'){
      return Array.from({length:aantalOefeningen},(_,i)=>maakRooster(bewerking,brug,i));
    }
    const uit=[],gezien=new Set();
    for(let i=0;i<aantalOefeningen*40&&uit.length<aantalOefeningen;i++){
      const o=bewerking==='aftrekken'?maakAftrek(brug,variant,i,toonVoorbeeld&&uit.length===0):maak(brug,variant,i),k=`${o.a}${bewerking==='aftrekken'?'-':'+'}${o.b}`;
      if(!gezien.has(k)){gezien.add(k);uit.push(o);}
    }
    return uit;
  }
  return {genereer,fmt};
})();
