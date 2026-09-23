/* Oefenvormen voor graad 1, binnen de gewone doel- en woordenroute. */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const scenes = {
    tuin: { naam: 'In de tuin', src: 'afbeeldingen/taferelen/tuin.png', vragen: [
      ['Waar staat de kip?', 'De kip staat op het hok.'],
      ['Waar zit de mus?', 'De mus zit in de boom.'],
      ['Waar zit de kat?', 'De kat zit voor de deur.']] },
    park: { naam: 'Bij de bank', src: 'afbeeldingen/taferelen/park.png', vragen: [
      ['Waar zit de kat?', 'De kat zit op de bank.'],
      ['Waar zit de mus?', 'De mus zit in de boom.'],
      ['Waar is de kip?', 'De kip staat voor het hek.']] },
    huis: { naam: 'Bij het huis', src: 'afbeeldingen/taferelen/huis.png', vragen: [
      ['Waar zit de kat?', 'De kat zit in de doos.'],
      ['Waar zit de mus?', 'De mus zit op het hek.'],
      ['Waar is de kip?', 'De kip staat voor de deur.']] }
  };
  const choices = [
    [['a / aa','De m...n staat aan de hemel.','maan'],['o / oo','Ik trek een s...k aan.','sok'],['u / uu','Het v...r is heet.','vuur'],['e / ee','Ik was mij met z...p.','zeep']],
    [['a / aa','De k...t zit op de mat.','kat'],['o / oo','De b...t vaart op zee.','boot'],['e / ee','De b...r slaapt in zijn hol.','beer'],['u / uu','De b...s stopt bij de school.','bus']],
    [['a / aa','De h...n kraait vroeg.','haan'],['o / oo','De v...s loopt in het bos.','vos'],['e / ee','Ik draag een p...t op mijn hoofd.','pet'],['u / uu','De m...r is van steen.','muur']]
  ];
  const wordChoices = [
    [['man / maan','De ... staat bij het hek.','man'],['bot / boot','De ... vaart op zee.','boot'],['kop / koop','Ik ... een brood.','koop'],['bom / boom','In het bos staat een hoge ... .','boom']],
    [['ram / raam','Ik kijk door het ... .','raam'],['bos / boos','De vos woont in het ... .','bos'],['tak / taak','De vogel zit op een ... .','tak'],['pot / poot','De hond geeft een ... .','poot']],
    [['mat / maat','De kat ligt op de ... .','mat'],['rok / rook','Uit de schoorsteen komt ... .','rook'],['man / maan','De ... schijnt in de nacht.','maan'],['bot / boot','De hond bijt op een ... .','bot']]
  ];
  const klank = tekst => (tekst.match(/aa|ee|oo|uu|oe|eu|ui|ie|[aeiou]/) || [''])[0];
  const soort = tekst => klank(tekst).length === 1 ? 0 : /^(aa|ee|oo|uu)$/.test(klank(tekst)) ? 1 : 2;
  const labels = ['korte klank', 'lange klank', 'tweetekenklank'];
  const klankGroepen = new Set(['korte-klanken','lange-klanken','tweeklanken']);
  const eigenInhoud = new Set(['tafereel','zelfzin','volgorde','leestekens','dialoog']);
  const niveaus={code:'verdieping',verbinden:'basis',buitenbeentje:'kern'};
  function doelWoorden(pool) {
    const gezien=new Set();
    return (pool||[]).filter(w=>w?.tekst && /^[a-z]+$/.test(w.tekst) && !gezien.has(w.tekst) && gezien.add(w.tekst));
  }
  function verbindingen(pool) {
    // Alleen eenlettergrepige woorden met een duidelijke beginmedeklinker(groep).
    const gezien=new Set();
    return doelWoorden(pool).map(w=>({w,m:w.tekst.match(/^([^aeiouy]+)((?:aai|ooi|oei|eeuw|ieuw|aa|ee|oo|uu|oe|eu|ui|ie|ei|ij|ou|au|[aeiou])[^aeiouy]*)$/)}))
      .filter(x=>x.m && !gezien.has(x.m[1]) && gezien.add(x.m[1]))
      .map(x=>({woord:x.w.tekst,begin:x.m[1],eind:x.m[2]}));
  }
  function afwijkendeRijen(pool,max=6) {
    const woorden=klankPool(pool),gebruikSoort=new Set(woorden.map(w=>soort(w.tekst))).size>1;
    const sleutel=w=>gebruikSoort?soort(w.tekst):klank(w.tekst);
    const groepen=[...new Set(woorden.map(sleutel))].map(k=>woorden.filter(w=>sleutel(w)===k));
    const rijen=[];
    for(let ronde=0;ronde<max;ronde++) {
      const mogelijk=groepen.filter(g=>g.length>=4 && woorden.some(w=>sleutel(w)!==sleutel(g[0])));
      if(!mogelijk.length) break;
      const groep=mogelijk[ronde%mogelijk.length],andere=woorden.filter(w=>sleutel(w)!==sleutel(groep[0]));
      const rij=Array.from({length:4},(_,i)=>groep[(ronde*4+i)%groep.length].tekst);
      const antwoord=andere[ronde%andere.length].tekst;
      rij.splice((ronde*2+1)%5,0,antwoord);
      if(rijen.some(r=>r.woorden.join('|')===rij.join('|'))) break;
      rijen.push({woorden:rij,antwoord});
    }
    return rijen;
  }
  const zinKlanken = {
    'kort-lang': 'Enkel korte en lange klanken',
    'kort-lang-twee': 'Korte, lange en tweetekenklanken',
    'aai-ooi-oei': 'aai, ooi en oei'
  };
  const zinGroep = waarde => Object.hasOwn(zinKlanken,waarde) ? waarde : 'kort-lang-twee';
  const prentPad = (groep,woord) => `afbeeldingen/graad1/${groep}/${woord}.png`;
  const zinPrenten = {
    'kort-lang': [
      ['mkm-a','kat','De kat zit op de mat.'],['lk-aa','maan','De maan is rond.'],['mkm-a','bal','De bal is rond.'],
      ['lk-oo','boom','De boom is hoog.'],['mkm-i','vis','De vis zwemt.'],['mkm-e','pen','Ik heb een pen.']],
    'kort-lang-twee': [
      ['tw-oe','boek','Ik lees een boek.'],['tw-ui','huis','Ik woon in een huis.'],['tw-eu','neus','Dit is mijn neus.'],
      ['tw-oe','voet','Dit is mijn voet.'],['tw-oe','koek','Ik eet een koek.'],['tw-ie','mier','Ik zie een mier.']],
    'aai-ooi-oei': [
      ['tw-aai','haai','De haai zwemt in de zee.'],['tw-ooi','hooi','Daar ligt hooi.'],['tw-oei','boei','De boei is rood en wit.'],
      ['tw-aai','kraai','De kraai is zwart.'],['tw-ooi','gooi','Ik gooi de bal.'],['tw-oei','roei','Ik roei in een boot.']]
  };
  function prentKeuzes(groep) {
    if(zinGroep(groep)==='aai-ooi-oei') return {
      dingen: {naam:'Haai, hooi en boei',src:prentPad('tw-aai','haai'),lossePrenten:true,
        vragen:[['Wat zwemt in de zee?','De haai zwemt in de zee.',prentPad('tw-aai','haai')],['Wat ligt hier?','Hier ligt hooi.',prentPad('tw-ooi','hooi')],['Wat is rood en wit?','De boei is rood en wit.',prentPad('tw-oei','boei')]]},
      doen: {naam:'Zwaaien, gooien en roeien',src:prentPad('tw-aai','zwaai'),lossePrenten:true,
        vragen:[['Wat doe je?','Ik zwaai.',prentPad('tw-aai','zwaai')],['Wat doe je met de bal?','Ik gooi de bal.',prentPad('tw-ooi','gooi')],['Wat doe je in de boot?','Ik roei in een boot.',prentPad('tw-oei','roei')]]}
    };
    const opties=JSON.parse(JSON.stringify(scenes));
    if(groep==='kort-lang') {
      // Dezelfde duidelijke prenten, zonder eu in deur of ui in huis.
      opties.tuin.vragen[2]=['Waar zit de kat?','De kat zit op de mat.'];
      opties.huis.vragen[2]=['Waar staat de kip?','De kip staat voor de trap.'];
    }
    return opties;
  }
  function zinOpdracht(groep) {
    if(groep==='aai-ooi-oei') return 'Gebruik in elke zin een woord met aai, ooi of oei.';
    if(groep==='kort-lang') return 'Gebruik alleen woorden met korte en lange klanken.';
    return 'Je mag woorden met korte, lange en tweetekenklanken gebruiken.';
  }
  const forms = [
    ['klankmix','Klanken oefenen: gecombineerd werkblad','Klank opschrijven, ontbrekende klank invullen en waar mogelijk het afwijkende woord zoeken',8],
    ['sorteren','Klanken in kolommen sorteren','Schrijf je gekozen woorden bij de korte, lange of tweetekenklank',9],
    ['buitenbeentje','Welk woord past niet in de rij?','Zoek de afwijkende klanksoort of klank en schrijf dat woord op',6],
    ['code','Lettercode ontcijferen','Verdieping: zet de getallen om in letters en ontdek de gekozen woorden',8],
    ['verbinden','Woorddelen verbinden','Basis: verbind het begin en het einde van de gekozen woorden',4],
    ['klinkers','Klinker of tweetekenklank opschrijven','Haal de klank uit je gekozen woorden',8],
    ['symbolen','Een teken vervangen door een klank','Vul de ontbrekende klank aan met hulp van je woorden',8],
    ['klankzin','De juiste klank in een zin','Kies de korte of lange klank en schrijf het hele woord',6],
    ['woordzin','Het passende woord kiezen','Vergelijk twee woorden en kies het woord dat past in de zin',6],
    ['invulzin','Zinnen aanvullen met een woordbank','Gebruik je gekozen woorden in korte zinnen',6],
    ['prenten','Lidwoord en woord bij een prent','Schrijf de of het en het gekozen woord bij de prent',6],
    ['bedek','Kijk, bedek, schrijf en kijk na','Oefen je gekozen woorden in drie schrijfrondes',6],
    ['tafereel','Hele zinnen schrijven bij een prent','Kies de klanken en de prent. Leerlingen beantwoorden de vragen met een zin',3],
    ['zelfzin','Kies een prent en schrijf een zin','Leerlingen kiezen uit elke rij een prent en schrijven zelf een zin',2],
    ['volgorde','Woorden in de juiste volgorde','Orden de woorden en schrijf een volledige zin',4],
    ['leestekens','Punt, vraagteken en uitroepteken','Kies het juiste teken op het einde van de zin',6],
    ['dialoog','Soorten zinnen en een korte dialoog','Herken de zinsoort en vul de eindtekens in een gesprekje in',6]
  ].map(([id,naam,uitleg,max])=>({id,naam,uitleg,max}));
  function klankPool(pool) {
    const gezien = new Set();
    const data = window.SpellingWoordenbibliotheek?.graad1 || {};
    return pool.filter(w => {
      if (!w?.tekst || gezien.has(w.tekst)) return false;
      if (!klankGroepen.has(data[w.categorie]?.groep)) return false;
      if (!/^[^aeiouy]*(aa|ee|oo|uu|ie|oe|eu|ui|[aeiou])[^aeiouy]*$/.test(w.tekst)) return false;
      const verwachteSoort=['korte-klanken','lange-klanken','tweeklanken'].indexOf(data[w.categorie]?.groep);
      if(soort(w.tekst)!==verwachteSoort) return false;
      gezien.add(w.tekst); return true;
    });
  }
  function zinVoor(w) {
    return window.SpellingZinnen?.graad1?.[w.tekst]?.find(s =>
      s.toLowerCase().split(/[^a-z]+/).includes(w.tekst));
  }
  function keuzeRijen(id, pool) {
    const set = new Set(pool.map(w=>w.tekst));
    const gekozenKlanken = new Set(pool.map(w=>klank(w.tekst)));
    const gezien = new Set();
    return (id === 'klankzin' ? choices : wordChoices).flat().filter(r => {
      if (!set.has(r[2]) || gezien.has(r[2])) return false;
      // Ook de afleider moet binnen de werkelijk gekozen klanken vallen.
      const alternatieven=r[0].split(' / ');
      if(!alternatieven.every(keuze=>gekozenKlanken.has(id==='klankzin'?keuze:klank(keuze)))) return false;
      gezien.add(r[2]); return true;
    });
  }
  function pastBijDoelen(id, graad, ids, geselecteerdeWoorden) {
    if(id==='code' || id==='verbinden') {
      const data=window.SpellingWoordenbibliotheek?.['graad'+graad] || {};
      const pool=ids.flatMap(cat=>(data[cat]?.woorden||[]).filter(w=>!['zinnen-klankzuiver','leestekens'].includes(data[cat]?.groep)).map(w=>({...w,categorie:cat})));
      if(id==='code') return doelWoorden(pool).length>0;
      const rijen=verbindingen(pool);
      return rijen.length>=3 && new Set(rijen.map(r=>r.eind)).size>=2;
    }
    if (graad !== 1) return false;
    if (id === 'tafereel' || id === 'zelfzin') return ids.includes('zinnen-prent-g1');
    if (id === 'volgorde') return ids.includes('zinnen-volgorde-g1');
    if (id === 'leestekens' || id === 'dialoog') return ids.includes('leestekens-eind-g1');
    const data = window.SpellingWoordenbibliotheek?.graad1 || {};
    const pool = klankPool(Array.isArray(geselecteerdeWoorden)
      ? geselecteerdeWoorden.filter(w=>ids.includes(w.categorie))
      : ids.flatMap(cat => (data[cat]?.woorden || []).map(w=>({...w,categorie:cat}))));
    if (id === 'sorteren') {
      const gekozenSoorten=new Set(ids.map(cat=>data[cat]?.groep).filter(g=>klankGroepen.has(g)));
      if(gekozenSoorten.size<2) return false;
      const actief=Array.isArray(geselecteerdeWoorden)
        ? klankPool(geselecteerdeWoorden.filter(w=>ids.includes(w.categorie))) : pool;
      return new Set(actief.map(w=>soort(w.tekst))).size>1;
    }
    if (id === 'buitenbeentje') return afwijkendeRijen(pool,1).length>0;
    if (id === 'klankzin' || id === 'woordzin') return keuzeRijen(id,pool).length > 0;
    if (id === 'invulzin') return pool.some(zinVoor);
    if (id === 'prenten') return pool.some(w=>w.afbeelding && w.lidwoord);
    return pool.length > 0;
  }
  function maakBlok(id, pool, opties = {}) {
    const def = forms.find(f=>f.id===id);
    if (!def) throw new Error('Onbekende oefenvorm');
    const n = Math.max(id==='verbinden'?3:1,Math.min(def.max,Number(opties.aantalWoorden)||def.max));
    const alle = klankPool(pool || []);
    const b = {...def, woorden:alle.slice(0,n)};
    if(id==='klankmix') {
      // Wissel de gekozen klanken af, ook als de woordenlijst per doel is gegroepeerd.
      const groepen=[...new Set(alle.map(w=>klank(w.tekst)))].map(k=>alle.filter(w=>klank(w.tekst)===k));
      const gemengd=[];
      for(let i=0;gemengd.length<alle.length;i++) for(const g of groepen) if(g[i]) gemengd.push(g[i]);
      b.woorden=gemengd.slice(0,n);
      b.blokken=[maakBlok('klinkers',b.woorden,{aantalWoorden:4}),maakBlok('symbolen',b.woorden.slice(4).length?b.woorden.slice(4):b.woorden,{aantalWoorden:4})];
      if(afwijkendeRijen(alle,1).length) b.blokken.push(maakBlok('buitenbeentje',alle,{aantalWoorden:2}));
    }
    if(id==='code') b.woorden=doelWoorden(pool).slice(0,n);
    if(id==='verbinden') {
      const kandidaten=verbindingen(pool),eerste=kandidaten[0];
      const tweede=kandidaten.find(r=>r.eind!==eerste?.eind);
      b.delen=[eerste,tweede,...kandidaten.filter(r=>r!==eerste && r!==tweede)].filter(Boolean).slice(0,n);
      if(b.delen.length<3 || new Set(b.delen.map(r=>r.eind)).size<2) throw new Error('Kies minstens drie passende woorden met verschillende begin- en eindstukken.');
      b.woorden=b.delen.map(r=>({tekst:r.woord}));
    }
    if(id==='buitenbeentje') {
      b.rijen=afwijkendeRijen(pool,n);
      if(!b.rijen.length) throw new Error('Kies minstens vier woorden met dezelfde klank(soort) en één met een andere klank(soort).');
    }
    if (id === 'sorteren') {
      // Neem beurtelings uit elke soort, zodat een ruime selectie niet
      // toevallig uitsluitend korte klanken op het werkblad oplevert.
      const groepen = labels.map((_,i)=>alle.filter(w=>soort(w.tekst)===i));
      b.woorden=[];
      for(let i=0;b.woorden.length<n && groepen.some(g=>i<g.length);i++) {
        for(const g of groepen) if(g[i] && b.woorden.length<n) b.woorden.push(g[i]);
      }
      b.soorten=[...new Set(b.woorden.map(w=>soort(w.tekst)))].sort();
      if (b.soorten.length<2) throw new Error('Kies voor sorteren woorden uit minstens twee klanksoorten.');
    }
    if (id === 'prenten') b.woorden=alle.filter(w=>w.afbeelding && w.lidwoord).slice(0,n);
    if (['tafereel','zelfzin','volgorde'].includes(id)) b.klankgroep=zinGroep(opties.klankgroep);
    if (id === 'tafereel') {
      const prenten=prentKeuzes(b.klankgroep);
      Object.assign(b,JSON.parse(JSON.stringify(prenten[opties.prent] || Object.values(prenten)[0])));
    }
    if (id === 'zelfzin') b.prenten=zinPrenten[b.klankgroep].map(([groep,woord,antwoord])=>({src:prentPad(groep,woord),antwoord}));
    if (id === 'klankzin' || id === 'woordzin') {
      b.rijen=keuzeRijen(id,alle).slice(0,n);
      if (!b.rijen.length) throw new Error('Kies bij Woorden ook woorden waarvoor een passende keuzezin bestaat, zoals kat, maan, boot of bus.');
    }
    if (id === 'invulzin') {
      b.woorden=alle.filter(zinVoor).slice(0,n);
      b.rijen=b.woorden.map(w=>[zinVoor(w).replace(new RegExp('\\b'+w.tekst+'\\b','i'),'........'),w.tekst]);
      b.bank=b.woorden.map(w=>w.tekst).reverse();
    }
    if (id === 'symbolen') {
      b.rijen=b.woorden.map(w=>[w.tekst.replace(klank(w.tekst),['●','━','▲'][soort(w.tekst)]),w.tekst]);
      b.bank=b.woorden.map(w=>w.tekst).reverse();
    }
    if (!eigenInhoud.has(id) && !b.woorden.length) throw new Error('Deze oefening heeft geen passende woorden in jouw selectie. Kies woorden bij de korte, lange of tweetekenklanken.');
    if (id === 'leestekens') b.vragen = [
      ['Waar is mijn boek','?'],['Mijn jas hangt aan de kapstok','.'],['Pas op voor die bal','!'],
      ['Kom je morgen spelen','?'],['Ik eet graag soep','.'],['Hoera, we winnen','!']];
    if (id === 'volgorde') b.vragen = [
      ['jij / een / Wil / koek?','Wil jij een koek?'],['zit / de / De / op / kat / mat.','De kat zit op de mat.'],
      ['het / Waar / boek? / is','Waar is het boek?'],['boom. / mus / in / De / zit / de','De mus zit in de boom.']];
    if (id === 'volgorde' && b.klankgroep==='kort-lang') b.vragen=[
      ['zit / de / De / op / kat / mat.','De kat zit op de mat.'],['boom. / mus / in / De / zit / de','De mus zit in de boom.'],
      ['bank. / op / De / zit / man / de','De man zit op de bank.'],['het / kip / De / op / staat / hok.','De kip staat op het hok.']];
    if (id === 'volgorde' && b.klankgroep==='aai-ooi-oei') b.vragen=[
      ['zee. / haai / De / in / zwemt / de','De haai zwemt in de zee.'],['ligt / Daar / hooi.','Daar ligt hooi.'],
      ['een / roei / boot. / Ik / in','Ik roei in een boot.'],['de / Ik / bal. / gooi','Ik gooi de bal.']];
    return b;
  }
  function afbeelding(w) { return window.SpellingAfbHelper.html(w,{grootte:90,graad:1}); }
  function lijn(antwoord,opl,cfg,breedte=400) {
    const sl=window.SpellingSchrijflijnen;
    const h=sl ? sl.hoogteInPx(cfg.lijnhoogte) : 20;
    // Antwoord op dezelfde basislijn als de bestaande schrijflijn-canvas.
    return `<div class="to-lijn">${sl ? sl.htmlCanvas(cfg.lijntype,cfg.lijnhoogte,breedte) : '<div class="to-lijn-fallback"></div>'}${opl?`<span style="top:${5+h*2-22}px">${esc(antwoord)}</span>`:''}</div>`;
  }
  function vragen(rijen,opl,cfg) {
    return rijen.map(([q,a])=>`<div class="to-vraag"><div>${esc(q)}</div>${lijn(a,opl,cfg)}</div>`).join('');
  }
  const bank = woorden => `<div class="to-bank">${woorden.map(esc).join(' · ')}</div>`;
  const opdrachten = {
    klankmix:[],
    sorteren:['Lees de woorden.','Schrijf elk woord in de juiste kolom.'],
    buitenbeentje:['Lees de woorden in elke rij.','Schrijf het woord op dat niet in de rij past.','Kijk het woord nog eens goed na.'],
    code:['Kijk naar de lettercode.','Schrijf bij elk getal de juiste letter.','Kijk het woord nog eens goed na.'],
    verbinden:['Lees de woorddelen.','Verbind de delen die samen een woord vormen.','Schrijf de gevonden woorden op.'],
    klinkers:['Lees het woord.','Schrijf alleen de klinker of de tweetekenklank.'],
    symbolen:['Kijk naar het teken. Kies een woord uit het kader.','Schrijf het woord op.','Kijk het woord nog eens goed na.'],
    klankzin:['Lees de zin.','Kies de juiste klank.','Schrijf het woord op.'],
    woordzin:['Lees de zin.','Kies het juiste woord.','Schrijf het op de streep.'],
    invulzin:['Lees de zin.','Kies een woord uit het kader.','Schrijf het op de streep.'],
    prenten:['Kijk naar de prent.','Schrijf de of het en het woord op.','Kijk het woord nog eens goed na.'],
    bedek:['Lees het woord goed en dek dan af.','Schrijf het woord op. Dek ook de vorige pogingen af.','Kijk de woorden goed na.'],
    tafereel:['Lees de vraag.','Schrijf het antwoord in een zin.'],
    zelfzin:['Kies uit elke rij een prent.','Schrijf een zin.'],
    leestekens:['Lees elke zin.','Vul een punt, vraagteken of uitroepteken in: . ? !'],
    dialoog:['Schrijf het juiste leesteken bij elke zinsoort.','Lees het gesprekje. Vul de leestekens in.'],
    volgorde:['Zet de woorden in de juiste volgorde.','Schrijf de zin op.']
  };
  function inhoud(b,opl,cfg) {
    const ws=b.woorden;
    switch(b.id) {
      case 'klankmix': return b.blokken.map((blok,i)=>{
        const tekst=blok.id==='klinkers'?(blok.woorden.some(w=>soort(w.tekst)===2)?'Lees het woord. Schrijf alleen de klinker of de tweetekenklank.':'Lees het woord. Schrijf alleen de klinker.')
          :blok.id==='symbolen'?'Kies een woord uit het kader. Schrijf het woord op.'
          :'Lees de woorden. Schrijf het woord op dat niet in de rij past.';
        return `<section class="to-mix-blok"><div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht ${i+1}:</div><div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${tekst}</span></div></div>${inhoud(blok,opl,cfg)}</section>`;
      }).join('');
      case 'sorteren': return bank(ws.map(w=>w.tekst))+`<div class="to-kolommen" style="grid-template-columns:repeat(${b.soorten.length},1fr)">${b.soorten.map(i=>`<section><strong>${labels[i]}</strong>${ws.filter(w=>soort(w.tekst)===i).map(w=>lijn(w.tekst,opl,cfg)).join('')}</section>`).join('')}</div>`;
      case 'klinkers': return `<div class="to-tweekolommen to-klanklijnen">${ws.map(w=>`<div><span>${esc(w.tekst)}:</span>${lijn(klank(w.tekst),opl,cfg,76)}</div>`).join('')}</div>`;
      case 'buitenbeentje': return b.rijen.map(r=>`<div class="to-afwijkend"><div>${r.woorden.map(w=>`<span>${esc(w)}</span>`).join('')}</div>${lijn(r.antwoord,opl,cfg,145)}</div>`).join('');
      case 'code': return `<table class="to-code"><tr>${Array.from('abcdefghijklmnopqrstuvwxyz',c=>`<td>${c}</td>`).join('')}</tr><tr>${Array.from({length:26},(_,i)=>`<td>${i+1}</td>`).join('')}</tr></table><div class="to-tweekolommen to-codewoorden">${ws.map(w=>`<div><span>${Array.from(w.tekst,c=>c.charCodeAt(0)-96).join(' – ')}</span>${lijn(w.tekst,opl,cfg)}</div>`).join('')}</div>`;
      case 'verbinden': {
        const rechts=[...new Set(b.delen.map(r=>r.eind))].reverse();
        return `<div class="to-verbind"><div>${b.delen.map(r=>`<p>${esc(r.begin)} <b>●</b></p>`).join('')}</div><div>${rechts.map(r=>`<p><b>●</b> ${esc(r)}</p>`).join('')}</div></div>
          <small>Je mag een einde meer dan één keer gebruiken.</small>
          <div class="to-verbind-woorden">${b.delen.map(r=>lijn(r.woord,opl,cfg)).join('')}</div>
          ${opl?'<small>Voorbeeldwoorden. Andere juiste woorden met deze woorddelen mogen ook.</small>':''}
          <div class="to-verbind-extra"><div class="ov01-stappen"><div class="ov01-stappen-label">Extra opdracht:</div><div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kies één woord. Gebruik het in een zin.</span></div></div>
          ${lijn('',false,cfg)}${lijn('',false,cfg)}${opl?'<small>Eigen antwoord: de zin bevat een gevonden woord.</small>':''}</div>`;
      }
      case 'symbolen': return `<p>${[...new Set(ws.map(w=>soort(w.tekst)))].sort().map(i=>`${['●','━','▲'][i]} ${labels[i]}`).join(' &nbsp; ')}</p>${bank(b.bank)}<div class="to-tweekolommen">${b.rijen.map(([q,a])=>`<div>${esc(q)}${lijn(a,opl,cfg)}</div>`).join('')}</div>${opl?'<small>Een ander passend woord uit het kader is ook goed.</small>':''}`;
      case 'klankzin': case 'woordzin': return vragen(b.rijen.map(([k,z,a])=>[`${k} — ${z}`,a]),opl,cfg);
      case 'invulzin': return bank(b.bank)+vragen(b.rijen,opl,cfg);
      case 'prenten': return `<div class="to-prenten">${ws.map(w=>`<div>${afbeelding(w)}${lijn(`${w.lidwoord} ${w.tekst}`,opl,cfg)}</div>`).join('')}</div>`;
      case 'tafereel': return (b.lossePrenten ? b.vragen.map(([q,a,src],i)=>`<div class="to-prentvraag"><img src="${esc(src)}" alt="Prent ${i+1}"><div>${vragen([[q,a]],opl,cfg)}</div></div>`).join('') : `<img class="to-tafereel" src="${esc(b.src)}" alt="${esc(b.naam)}">${vragen(b.vragen,opl,cfg)}`)+(opl?'<small>Voorbeeldantwoorden; een andere juiste zin mag ook.</small>':'');
      case 'zelfzin': return [0,3].map(start=>`<div class="to-zinrij"><div class="to-zinprenten">${b.prenten.slice(start,start+3).map((p,i)=>`<img src="${esc(p.src)}" alt="Keuze ${i+1}">`).join('')}</div>${lijn(b.prenten[start].antwoord,opl,cfg)}${lijn('',false,cfg)}</div>`).join('')+(opl?'<small>Voorbeeldzin bij de eerste prent van elke rij. Een andere juiste zin bij een gekozen prent mag ook.</small>':'');
      case 'leestekens': return b.vragen.map(([q,a])=>`<div class="to-tekenzin">${esc(q)} <span class="to-tekenvak">${opl?esc(a):''}</span></div>`).join('');
      case 'dialoog': return [['Een zin die iets vertelt','.'],['Een zin die iets vraagt','?'],['Een zin die iets roept','!']].map(([q,a])=>`<div class="to-tekenzin">${q} <span class="to-tekenvak">${opl?a:''}</span></div>`).join('')+'<p>Vul de eindtekens in.</p>'+[['Mila: Dag Noor','!'],['Noor: Ga je mee naar het park','?'],['Mila: Ja, dat is leuk','!']].map(([q,a])=>`<div class="to-tekenzin">${q} <span class="to-tekenvak">${opl?a:''}</span></div>`).join('')+(opl?'<small>Bij “Dag Noor” en “Ja, dat is leuk” kan ook een punt.</small>':'');
      case 'volgorde': return vragen(b.vragen,opl,cfg);
      case 'bedek': return `<table class="to-bedek"><thead><tr><th>Woord</th><th>Ronde 1</th><th>Ronde 2</th><th>Ronde 3</th></tr></thead><tbody>${ws.map(w=>`<tr><th>${esc(w.tekst)}</th>${[1,2,3].map(()=>`<td>${lijn(w.tekst,opl,cfg)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      default: throw new Error('Onbekend oefenblok');
    }
  }
  function render(id,opties,opl) {
    const o=opties['g1-'+id] || {};
    const cfg={lijntype:o.lijntype || 'type3',lijnhoogte:o.lijnhoogte || 'middel'};
    const b=maakBlok(id,window._weekdictee_gekozenWoorden || [],o);
    const heeftTwee=b.woorden.some(w=>soort(w.tekst)===2);
    const title=id==='klinkers'&&!heeftTwee?'Klinker opschrijven':forms.find(f=>f.id===id).naam;
    const stappen=id==='klinkers'&&!heeftTwee?['Lees het woord.','Schrijf alleen de klinker.']:opdrachten[id];
    return `<div class="werkblad to-blad lijnhoogte-${esc(cfg.lijnhoogte)}" data-oefenvorm="${id}" ${niveaus[id]?`data-niveau="${niveaus[id]}"`:''}>
      <div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div>
      <h2 class="ov01-titel">${esc(title)}${opl?'<span class="oplossingen-badge">OPLOSSINGEN</span>':''}</h2></div>
      ${id==='klankmix'?'':`<div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht:</div>${[...stappen,...(b.klankgroep?[zinOpdracht(b.klankgroep)]:[])].map(t=>`<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${esc(t)}</span></div>`).join('')}</div>`}
      <div class="to-inhoud">${inhoud(b,opl,cfg)}</div><div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
  }
  function instellingen(id,state) {
    const def=forms.find(f=>f.id===id);
    if(id==='klankmix') return '<p class="zb-oef-info">Eén werkblad met korte opdrachten bij je gekozen woorden. Het afwijkende woord komt erbij als er voldoende woorden met verschillende klanken of klanksoorten gekozen zijn.</p>';
    if(['tafereel','zelfzin','volgorde'].includes(id)) {
      const groep=zinGroep(state.klankgroep),prenten=prentKeuzes(groep);
      const gekozen=prenten[state.prent] ? state.prent : Object.keys(prenten)[0];
      const keuze=`<div class="zb-oef-rij"><label for="klanken-g1-${id}">Welke klanken?</label><select id="klanken-g1-${id}" class="zb-zin-klankgroep" data-oef="g1-${id}">${Object.entries(zinKlanken).map(([key,label])=>`<option value="${key}" ${key===groep?'selected':''}>${label}</option>`).join('')}</select></div>`;
      if(id==='tafereel') return keuze+`<fieldset class="to-scene-keuze"><legend>Kies de prent of prentenreeks</legend><div class="to-scene-kaarten">${Object.entries(prenten).map(([key,s])=>`<label><input type="radio" class="zb-prent-keuze" name="g1-prent" data-oef="g1-tafereel" value="${key}" ${gekozen===key?'checked':''}><img src="${s.src}" alt="${s.naam}"><span>${s.naam}</span></label>`).join('')}</div><p>De vragen en de opdracht passen bij de gekozen klanken.</p></fieldset>`;
      return keuze+`<p class="zb-oef-info">${id==='zelfzin'?'Twee rijen met telkens drie prenten. De leerling kiest uit elke rij één prent.':'De zinnen passen bij de gekozen klanken.'}</p>`;
    }
    if(eigenInhoud.has(id)) return '<p class="zb-oef-info">Deze oefening gebruikt vaste, eenvoudige zinnen bij het gekozen doel.</p>';
    return `<div class="zb-oef-rij"><label for="aantal-g1-${id}">Aantal ${id==='buitenbeentje'?'rijen':'woorden'}:</label><input id="aantal-g1-${id}" type="number" class="zb-oef-aantal" data-oef="g1-${id}" min="${id==='verbinden'?3:id==='sorteren'?2:1}" max="${def.max}" value="${state.aantal || def.max}"></div><p class="zb-oef-info">Gebruikt passende woorden uit jouw selectie bij stap 2 (maximaal ${def.max}${id==='buitenbeentje'?' rijen':''}).</p>`;
  }
  window.SpellingModules=window.SpellingModules || {};
  for(const f of forms) window.SpellingModules['g1-'+f.id]={
    naam:f.naam,...(!['code','verbinden'].includes(f.id)?{graad:1}:{}),gebruiktEigenOefeninhoud:eigenInhoud.has(f.id)||f.id==='buitenbeentje',
    genereerBlad(opties,opl){return render(f.id,opties,opl);}
  };
  // Oude modules blijven beschikbaar voor reeds opgeslagen bundels.
  const definities=forms.filter(f=>!['klinkers','symbolen','buitenbeentje','prenten','bedek'].includes(f.id)).map(f=>({id:'g1-'+f.id,label:f.naam,korteUitleg:f.uitleg,
    niveaus:niveaus[f.id]?[niveaus[f.id]]:[],...(!['code','verbinden'].includes(f.id)?{graad:1}:{}),defaultAantal:f.max,thema:f.id,
    ...(['tafereel','zelfzin','volgorde'].includes(f.id)?{enkelVoor:['zinnen-klankzuiver']}:{})}));
  window.SpellingThemaOefeningen={maakBlok,forms,scenes,zinKlanken,prentKeuzes,definities,pastBijDoelen,instellingen};
})();
