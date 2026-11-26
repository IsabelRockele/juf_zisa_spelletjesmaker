// Eigen leeswoorden volgens gekende grafemen én de onderbouwde woordbouw per fase.
(()=>{
  const split=word=>word.match(/sch|ng|nk|ch|aa|ee|oo|uu|oe|eu|ie|ij|ei|ui|ou|au|[a-z]/g)||[];
  const vowels=new Set('a e i o u aa ee oo uu oe eu ie ij ei ui ou au'.split(' '));
  const words=`kim mik mis sis sik
    kaas kaak maak maas kip vis sip pit pik rik rap ram rem mes map mep kap kam kar kas
    paar raak raam raap raas vaas vaar vaak veer ver peer pees reep meer mees meet
    pen pet pek pan pin pas pak pap pip pop pot put poot pook poos peen
    man maan min men meen mat met maat mot moet moes mus mop
    nek net neem naam naar neer noot neus nis nat nut
    tak tik tas top tip tap tol tor teen toon teek taak tam
    bak bek bok buk bas bes bos bus ben bon boon boom boor boos boot beet been beer baas baal baan
    rat rit rot riet roet roos rook room roep rek rok ruk ruim ruil ruit ruik reus reis rijm rijp
    kat kit kom kus kop kok kik kook koek kool keel keer kies kuil kuip kuis keur keus kaap
    dak dek dik dok doek doos doop door duur duim duik duin duif dief dier daar dan den dun dam dom dal dol deel deeg
    zak zeep zoon zoem zoen zes zat zit zot zag zeg zeil zeef zuur zuil zuig
    haas haar heer heen hees hem ham hek hok hak hik hup hip hap hop hoor heel hiel hier huil huis huur heup hout heet hut
    jas jam jak jet juf jaar jeuk joel juk
    vos vin van ven vol vel val veel veeg vuur vier vies vuil voer voel voet vet vat
    was wis wip web wet wat wit wok wak weg weeg week waak waar weer wees woel wiel wieg wijn wijk woon
    lap lip les las los lus lat lot lam lijm lijn lijf loon loop loot look lees leeg leer leef laan laat loom luik leuk leun leus lief liep
    fop fel fan feit fout fuik
    gas gis gaf gif gom gum gaas gaar gaat geit geef geur guur geul geel goot
    saus sap sop sam som soep soes sok suus sier`.split(/\s+/).filter(Boolean);
  const bank=[...new Set(words)].filter(w=>!w.endsWith('d')&&split(w).length===3&&!vowels.has(split(w)[0])&&vowels.has(split(w)[1])&&!vowels.has(split(w)[2]));
  const distance=(a,b)=>split(a).length!==split(b).length?Infinity:split(a).reduce((n,c,i)=>n+(c!==split(b)[i]),0);
  const kern7='kast berg melk jurk wolk wolf lamp vork dans wesp werk gans golf gesp half zalf kerk surf kurk tent worm warm dorp hark taart steen snoep broek brug slaap trein draak stoel slak klein kraan speen droom stoom stoep bril trek slot druif drop vlag bloem vlees ster klas drup klop knaag turf pols kamp rits schaap schoen scheur school schaar schil schiet schip schat schuur schaak tang ring gong tong bang zing meng hang vang'.split(' ');
  const anker4='lang bang zing gong lach pech zich toch grap klein fiets jouw touw zout lauw pauw rauw'.split(' ');
  const anker5='schaar schip schep schat schop schaap kast fiets kort kerk kaars poets trein bril spin traan kras prik kraan bank plank stank mank klank stift staart kramp trapt droogt klopt rugzak zakdoek voetbal kapstok fietsbel web zand bad rib koud goud krab'.split(' ');
  function shuffled(items,seed){
    const a=[...items];let state=seed+1;
    for(let i=a.length-1;i>0;i--){state=(state*1664525+1013904223)>>>0;const j=state%(i+1);[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }
  const titles={rows:'Woordrijtjes',swap:'Woordjes wisselen',dice:'Dobbel en lees'};
  const instructions={rows:'Lees hardop. Tik op ✓.',swap:'Lees. Wissel. Lees.',dice:'Gooi. Lees. Tik op ✓.'};
  const routes=window.ZISA_BOOKS.filter(b=>b.level==='START'&&b.method&&b.stage);
  const refreshers={};
  window.ZISA_REFRESH_START_PRACTICE=book=>refreshers[book.id]?.();
  const previous={};
  const seenPictureWords={kim:new Set(),zoem:new Set()};
  routes.forEach((book,index)=>{
    const letters=book.letters.startsWith('alle')?[...previous[book.method]]:book.letters.split(' ');
    if(book.method==='kim'&&book.stage==='Kern 7')letters.push('sch','ng');
    if(book.method==='zoem'&&book.stage==='Anker 5')letters.push('sch','nk');
    const newLetters=letters.filter(c=>!(previous[book.method]||[]).includes(c));
    const isNew=word=>book.method==='kim'&&book.stage==='Kern 7'?kern7.includes(word):book.method==='zoem'&&book.stage==='Anker 5'?anker5.includes(word):split(word).some(c=>newLetters.includes(c));
    previous[book.method]=letters;
    const extras=book.method==='kim'&&book.stage==='Kern 7'?kern7:book.method==='zoem'&&['Anker 4','Anker 5'].includes(book.stage)?[...anker4,...(book.stage==='Anker 5'?anker5:[])]:[];
    const available=[...new Set([...bank,...extras])].filter(word=>window.ZISA_START_WORD_ALLOWED(word,book.method,book.stage,letters));
    const focused=available.filter(isNew);
    const pool=focused.length>=4?focused:available;
    book.practiceFocusWords=[...focused];
    book.learnedLetters=[...letters];
    if(pool.length<4)throw Error(`Te weinig woorden voor ${book.stage}`);
    book.startPractice=['rows','swap','dice'].map(kind=>{
      const id=`${book.id}-${kind}`;
      const makePages=round=>Array.from({length:1},()=>{
        // Eén nieuwe mix bij openen; tijdens het spel blijft deze stapel vast.
        const deck=shuffled(pool,100*index+['rows','swap','dice'].indexOf(kind)+round*17);
        if(pool.length>=30)deck.sort((a,b)=>Number(isNew(b))-Number(isNew(a)));
        let order=Array.from({length:Math.max(30,pool.length)},(_,i)=>deck[(round*30+i)%deck.length]);
        const rows=Array.from({length:6},(_,r)=>Array.from({length:5},(_,c)=>order[(r*5+c+(order.length<=5?r:0))%order.length]));
        const linked=order.filter(a=>pool.some(b=>distance(a,b)===1));
        const chain=[linked[round%linked.length]];
        for(let i=1;i<10;i++){
          const candidates=shuffled(pool.filter(w=>distance(chain.at(-1),w)===1),round*31+i);
          chain.push(candidates.find(w=>!chain.includes(w))||candidates.find(w=>w!==chain.at(-2))||candidates[0]);
        }
        return {title:titles[kind],q:instructions[kind],startPractice:kind,rows,chain,letters:[...letters]};
      });
      window.ZISA_FLUENCY_BOOKS[id]=makePages(0);
      if(kind==='rows'||kind==='dice')refreshers[id]=()=>{
        const key='zisa_start_last_'+id;
        let previous=JSON.stringify(window.ZISA_FLUENCY_BOOKS[id][0].rows);
        try{previous=localStorage.getItem(key)||previous}catch{}
        let seed=Math.floor(Math.random()*1000000)+1,pages;
        do{pages=makePages(seed++);}while(JSON.stringify(pages[0].rows)===previous);
        window.ZISA_FLUENCY_BOOKS[id]=pages;
        try{localStorage.setItem(key,JSON.stringify(pages[0].rows))}catch{}
      };
      return {...book,id,title:titles[kind],startPractice:null,practiceParent:book.id,blurb:kind==='dice'?`${book.stage} · één dobbelspel met zes rijtjes.`:book.stage,practiceWordCount:pool.length};
    });
    book.blurb=book.stage;
    // Meer leeswoorden tussen de bestaande prentoefeningen, geen kopie van hetzelfde kleine setje.
    if(!book.stage.toLowerCase().endsWith('start')){
      const old=window.ZISA_FLUENCY_BOOKS[book.id];
      const seen=new Set(old.flatMap(p=>[p.audioPrompt,...(p.a||[])].filter(Boolean)));
      const fresh=shuffled(pool.filter(w=>!seen.has(w)),index+81).sort((a,b)=>Number(isNew(b))-Number(isNew(a))).slice(0,24);
      const pictures=old.filter(p=>{
        if(p.imageSrc){const target=p.a?.[p.correct];if(!focused.includes(target)||seenPictureWords[book.method].has(target))return false;seenPictureWords[book.method].add(target);return true}
        return !!p.pictures;
      });
      const mixed=[...pictures];
      fresh.forEach((word,i)=>{
        const choices=shuffled(pool.filter(w=>w!==word),i+index).slice(0,2);
        if(i%3===0)mixed.push({title:'Luister en kies',q:'Luister. Kies.',audioPrompt:word,a:[word,...choices],correct:0});
        else if(i%3===1)mixed.push({title:'Maak het woord',q:'Luister. Kies.',audioPrompt:word,focus:split(word).map((c,n)=>n===i%3?'_':c).join(''),a:[split(word)[i%3],...letters.filter(c=>c!==split(word)[i%3]).slice(0,2)],correct:0});
        else mixed.push({title:'Bouw het woord',q:'Luister. Bouw.',buildWord:word,audioPrompt:word,parts:split(word),letters:[...letters]});
      });
      // Wissel prenten en andere vormen af, in plaats van grote blokken van hetzelfde type.
      const extras=mixed.splice(pictures.length);const result=[];
      while(mixed.length||extras.length){if(mixed.length)result.push(mixed.shift());result.push(...extras.splice(0,2))}
      window.ZISA_FLUENCY_BOOKS[book.id]=result;
    }
  });
  window.ZISA_START_PRACTICE={split,distance,bank};
})();
