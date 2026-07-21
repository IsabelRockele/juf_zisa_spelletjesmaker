const Kommagetallen = (() => {
  const fmt = n => `${Math.floor(n/10)},${n%10}`;
  function maak(brug,variant,index){
    let a,b;
    for(let p=0;p<100;p++){
      const ah=1+Math.floor(Math.random()*8),at=1+Math.floor(Math.random()*8);
      a=ah*10+at;
      if(brug==='met'){
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
      const kiesA=(a%10)>=(b%10),term=kiesA?a:b,corr=10-term%10;
      o.strategieTerm=kiesA?'a':'b';o.correctie=corr;o.afgerond=term+corr;o.tussensom=som+corr;
    }
    if(variant==='transformeren'){
      const da=10-a%10,db=10-b%10;
      if(da<=db){o.verschuif=da;o.nieuwA=a+da;o.nieuwB=b-da;o.richting='naar-a';}
      else{o.verschuif=db;o.nieuwA=a-db;o.nieuwB=b+db;o.richting='naar-b';}
    }
    return o;
  }
  function genereer({brug='zonder',variant='kort',aantalOefeningen=6}={}){
    const uit=[],gezien=new Set();
    for(let i=0;i<aantalOefeningen*40&&uit.length<aantalOefeningen;i++){
      const o=maak(brug,variant,i),k=`${o.a}+${o.b}`;
      if(!gezien.has(k)){gezien.add(k);uit.push(o);}
    }
    return uit;
  }
  return {genereer,fmt};
})();
