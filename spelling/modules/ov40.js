/* OV40–OV43 — hoorwoorden oefenen in graad 2. */
(function () {
  "use strict";
  const GRAAD = 2;
  const LABEL = {
    "ng-g2":"ng", "nk-g2":"nk", "sch-woorden-g2":"sch", "schr-woorden-g2":"schr",
    "clusters-g2":"medeklinkercluster", "aai-g2":"aai", "ooi-g2":"ooi", "oei-g2":"oei",
    "eeuw-g2":"eeuw", "ieuw-g2":"ieuw", "uw-g2":"uw", "ch-g2":"ch", "cht-g2":"cht",
    "gt-g2":"gt", "doffe-klank-g2":"doffe klank"
  };
  const ZINNEN = {
    ring:"Noor draagt een ___ om haar vinger.", slang:"In het gras kruipt een lange ___.", long:"Met elke ___ haal je adem.", wang:"Er rolt een traan over haar ___.", sprong:"De kikker maakt een hoge ___.", jongen:"De ___ speelt met een bal.",
    bank:"Opa zit op een houten ___.", plank:"Papa legt de doos op een ___.", klank:"Ik hoor een vreemde ___.", pink:"Aan mijn hand zit een kleine ___.", vink:"Op de tak zit een kleine ___.", drank:"Na het sporten krijgt Amir een koele ___.",
    school:"Elke ochtend gaan de kinderen naar ___.", schoen:"Mijn veter zit los aan mijn ___.", schip:"Het grote ___ vaart naar de haven.", schaar:"Noor knipt het papier met een ___.", schaap:"In de wei loopt een wit ___.", schat:"De piraat zoekt een verborgen ___.",
    schroef:"Papa draait de ___ stevig vast.", schrijven:"Wij ___ een verhaal in ons schrift.", schrik:"Noor gilt van de ___.", schreeuwen:"De kinderen mogen niet ___ in de gang.", schram:"Na de val heeft Amir een ___ op zijn knie.", schrobben:"Wij ___ de vuile vloer met een borstel.", schrappen:"Je mag het foute woord ___.", schrijver:"De ___ bedenkt een spannend boek.",
    masker:"De dokter draagt een ___ voor zijn mond.", kasteel:"De koning woont in een groot ___.", onder:"De bal rolt ___ de kast.", vinger:"Noor wijst met haar ___.", honger:"Na de wandeling heb ik grote ___.", lantaarn:"Bij de voordeur brandt een ___.",
    haai:"In de zee zwemt een grote ___.", kraai:"Op het dak zit een zwarte ___.", draai:"Maak een halve ___ naar links.", lawaai:"De machines maken veel ___.", zwaai:"Bij het afscheid maak ik met mijn hand een ___.", saai:"Zonder spelletjes wordt de rit erg ___.",
    kooi:"De vogel zit in een ruime ___.", hooi:"Het paard eet droog ___.", mooi:"Noor maakt een ___ schilderij.", gooi:"Ik ___ de bal naar Amir.", strooi:"Ik ___ kaas over de pasta.", vlooi:"De hond krabt door een kleine ___.",
    boei:"De zwemmer houdt zich vast aan een ___.", groei:"De plant toont veel ___.", bloei:"In de lente staat de tuin in ___.", stoei:"Ik ___ met mijn broer op het tapijt.", knoei:"Niet ___ met de verf.", roei:"Ik ___ met de boot naar de kant.",
    leeuw:"In de dierentuin brult een ___.", sneeuw:"In de winter valt er witte ___.", eeuw:"Honderd jaar vormen samen een ___.", spreeuw:"Een ___ zit op de schoorsteen.", meeuw:"Boven het strand vliegt een ___.", geeuw:"Na een lange dag ontsnapt mij een ___.",
    kieuw:"Een vis ademt met een ___.", nieuw:"Amir draagt een ___ paar schoenen.", opnieuw:"Lees de moeilijke zin nog eens ___.", nieuws:"De reporter vertelt het laatste ___.", vernieuwen:"We gaan de oude speelplaats ___.", nieuwtje:"Noor vertelt een leuk ___.",
    ruw:"De steen voelt hard en ___ aan.", schuw:"Het jonge hertje is erg ___.", duw:"Met een flinke ___ gaat de deur open.", duwen:"Je mag niet ___ in de rij.", sluw:"De vos bedenkt een ___ plan.", stuwen:"De sterke wind kan het water vooruit ___.",
    ach:"___ wat jammer dat je niet kunt komen.", lach:"Op de foto zie ik haar brede ___.", pech:"Door de lekke band hebben we ___.", zich:"De kat wast ___ met haar tong.", toch:"Kom je morgen ___ naar het feest.", glimlach:"De juf begroet ons met een warme ___.", kuch:"Met een korte ___ maakt opa zijn keel vrij.",
    acht:"In de doos liggen ___ potloden.", nacht:"De maan schijnt in de donkere ___.", licht:"Doe het ___ aan in de gang.", "hij lacht":"Om de grap ___ hij heel luid.", "hij vecht":"Op de speelplaats ___ hij met niemand.", recht:"Trek met de lat een ___ lijn.",
    "hij zegt":"In de klas ___ hij het juiste antwoord.", "hij vraagt":"Aan de juf ___ hij extra uitleg.", "hij legt":"Op tafel ___ hij zijn boek.", "hij jaagt":"In het bos ___ hij nooit op dieren.", "hij vliegt":"Naar Spanje ___ hij met het vliegtuig.", "hij veegt":"Na het eten ___ hij de vloer.",
    tafel:"Het bord staat op de ___.", appel:"Noor eet een rode ___.", vogel:"In de boom zingt een ___.", engel:"Boven in de kerstboom hangt een ___.", wortel:"Het konijn knabbelt aan een ___.", lepel:"Ik eet de soep met een ___.", winkel:"Mama koopt brood in de ___.", kabel:"De stekker zit aan een lange ___.", sleutel:"Met de ___ open ik de deur.", nagel:"Papa slaat een ___ in de plank.", dokter:"De ___ onderzoekt mijn zere keel.", vlinder:"Een kleurige ___ vliegt boven de bloemen.", vader:"Mijn ___ leest de krant.", moeder:"Mijn ___ maakt lekkere soep.", water:"Na het sporten drink ik ___.", boter:"Noor smeert ___ op haar boterham.", letter:"Elk woord bestaat uit minstens één ___.", meester:"De ___ geeft uitleg aan de klas.", bakker:"De ___ bakt verse broden.", havik:"Een ___ zweeft hoog boven het veld."
  };

  function categorieen() {
    const ids = window.SpellingZijbalk?.getAangevinkteCategorieIds?.() || [];
    const data = window.SpellingWoordenbibliotheek?.graad2 || {};
    return ids.filter(id => data[id]?.hoofdgroep === "hoorwoord" && LABEL[id]);
  }
  function woorden(ids = categorieen()) {
    const data = window.SpellingWoordenbibliotheek?.graad2 || {};
    const gekozen = window._weekdictee_gekozenWoorden || [];
    const handmatig = gekozen.filter(w => ids.includes(w.categorie));
    const bron = handmatig.length ? handmatig : ids.flatMap(id => (data[id]?.woorden || []).map(w => ({...w,categorie:id})));
    return bron.map(w => ({...w, categorie:w.categorie || ids.find(id => (data[id]?.woorden || []).some(x => x.tekst === w.tekst))}));
  }
  function focusVoor(w) {
    const id=w.categorie, t=w.tekst.toLowerCase();
    const vast={"ng-g2":"ng","nk-g2":"nk","sch-woorden-g2":"sch","schr-woorden-g2":"schr","aai-g2":"aai","ooi-g2":"ooi","oei-g2":"oei","eeuw-g2":"eeuw","ieuw-g2":"ieuw","uw-g2":"uw","ch-g2":"ch","cht-g2":"cht","gt-g2":"gt"}[id];
    if(vast) return vast;
    if(id==="clusters-g2") return (t.match(/[bcdfghjklmnpqrstvwxyz]{2,}/g)||[]).sort((a,b)=>b.length-a.length)[0]||"";
    const einde=(t.match(/(el|er|en|ik|em|um|es|is|et)$/)||[])[1];
    return einde||"e";
  }
  function markeer(w) { const f=focusVoor(w), i=w.tekst.toLowerCase().lastIndexOf(f); return i<0?w.tekst:`${w.tekst.slice(0,i)}<span class="ov40-focus">${w.tekst.slice(i,i+f.length)}</span>${w.tekst.slice(i+f.length)}`; }
  function soortenTekst(ids=categorieen()){return ids.map(id=>LABEL[id]).join(", ").replace(/, ([^,]*)$/, " of $1");}
  function lijn(cfg) { const c=window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype,cfg.lijnhoogte,650)||'<div class="ov07-fallback-lijn"></div>'; return `<div class="ov40-lijn">${c}</div>`; }
  function pagina(titel,stappen,inhoud,cfg,opl,ster="") { return `<div class="werkblad ov40-blad lijnhoogte-${cfg.lijnhoogte}"><div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div><h2 class="ov01-titel">${titel}${ster?` <span class="ov01-niveau-badge">${ster}</span>`:""}${opl?'<span class="oplossingen-badge">OPLOSSINGEN</span>':""}</h2></div><div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht:</div>${stappen.map(s=>`<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${s}</span></div>`).join("")}</div>${inhoud}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`; }
  function kies(lijst,aantal,sleutel,opl){if(!lijst.length)return[];const s=window.__zisaHoorVariatie||(window.__zisaHoorVariatie={volgende:{},laatste:{}}),key=`${sleutel}|${lijst.map(w=>w.categorie).join("|")}|${aantal}`;if(!opl){const start=s.volgende[key]||0;s.laatste[key]=start;s.volgende[key]=(start+Math.max(2,Math.floor(aantal/2)))%lijst.length;}const start=s.laatste[key]||0;return Array.from({length:Math.min(aantal,lijst.length)},(_,i)=>lijst[(start+i)%lijst.length]);}
  function kiesGemengd(ids,aantal,sleutel,opl){const perCat=ids.map(id=>kies(woorden([id]),Math.ceil(aantal/ids.length)+1,`${sleutel}-${id}`,opl)),uit=[];for(let ronde=0;uit.length<aantal;ronde++){let toegevoegd=false;for(const lijst of perCat){if(lijst[ronde]&&uit.length<aantal){uit.push(lijst[ronde]);toegevoegd=true;}}if(!toegevoegd)break;}return uit;}

  function sorteren(cfg,opl){
    const ids=categorieen(), groepen=[];
    for(let i=0;i<ids.length;i+=3)groepen.push(ids.slice(i,i+3));
    return groepen.map((deel,p)=>{
      const ws=deel.flatMap(id=>kies(woorden([id]),2,`ov40-${p}-${id}`,opl));
      const extra=kiesGemengd(deel,4,`ov40-extra-${p}`,opl);
      const bank=`<div class="ov40-bank">${ws.map(w=>opl?markeer(w):w.tekst).join(" · ")}</div>`;
      const kolommen=`<div class="ov40-kolommen" style="--kol:${deel.length}">${deel.map(id=>`<div><h3>${LABEL[id]}</h3>${opl?ws.filter(w=>w.categorie===id).map(w=>`<p>${markeer(w)}</p>`).join(""):Array.from({length:3},()=>lijn(cfg)).join("")}</div>`).join("")}</div>`;
      const hussel=`<div class="ov40-extra"><p><strong>Extra:</strong> Zet de woordstukjes in de juiste volgorde en schrijf het woord op.</p><div class="ov40-extra-rooster">${extra.map((w,i)=>{const juist=w.tekst.replace(/^hij\s+/i,"");const delen=opl?[juist]:husselDelen(juist);return `<div class="ov40-extra-woord"><b>${i+1}.</b><span class="ov40-extra-delen">${delen.map(d=>`<i>${d}</i>`).join("")}</span>${opl?`<span class="ov40-extra-oplossing">${markeer({...w,tekst:juist})}</span>`:lijn(cfg)}</div>`;}).join("")}</div></div>`;
      return pagina(`Kleur en sorteer de hoorwoorden${groepen.length>1?` — deel ${p+1}`:""}`,[`Je oefent woorden met ${soortenTekst(deel)}.`,"Kleur zelf in elk woord het moeilijke woordstuk.","Schrijf elk woord in de juiste kolom."],bank+kolommen+hussel,cfg,opl);
    }).join("");
  }
  function kiezen(cfg,opl){const ids=categorieen(),ws=kiesGemengd(ids,6,"ov41",opl),keuzes=ids.map(id=>LABEL[id]);const inhoud=`<div class="ov41-kaarten">${ws.map((w,i)=>{const f=focusVoor(w),pos=w.tekst.toLowerCase().lastIndexOf(f),leeg=pos<0?w.tekst:`${w.tekst.slice(0,pos)}___${w.tekst.slice(pos+f.length)}`;return `<div class="ov41-kaart"><b>${i+1}. ${leeg}</b><div class="ov41-keuzes">${keuzes.map(k=>`<i class="${opl&&k===LABEL[w.categorie]?"juist":""}">${k}</i>`).join("")}</div>${opl?`<div class="ov40-oplossing">${markeer(w)}</div>`:lijn(cfg)}</div>`;}).join("")}</div>`;return pagina("Kies het ontbrekende woordstuk",[`Je oefent woorden met ${soortenTekst(ids)}.`,"Kleur het passende woordstuk.","Schrijf daarna het volledige woord."],inhoud,cfg,opl);}
  function husselDelen(tekst){const schoon=tekst.replace(/^hij\s+/i,""),delen=schoon.length<=7?[...schoon]:schoon.match(/.{1,2}/g);if(delen.length<3)return delen.reverse();const volgorde=[];for(let i=1;i<delen.length;i+=2)volgorde.push(delen[i]);for(let i=0;i<delen.length;i+=2)volgorde.push(delen[i]);return volgorde;}
  function foutHoorwoord(w){const goed=w.tekst.replace(/^hij\s+/i,"");const f=focusVoor({...w,tekst:goed});const vervanging={ng:"nk",nk:"ng",sch:"sg",schr:"sr",aai:"ai",ooi:"oi",oei:"oi",eeuw:"ew",ieuw:"iw",uw:"u",ch:"g",cht:"gt",gt:"cht"}[f];if(vervanging&&goed.toLowerCase().includes(f))return goed.replace(new RegExp(f,"i"),vervanging);if(w.categorie==="clusters-g2"){const m=goed.match(/[bcdfghjklmnpqrstvwxyz]{2,}/i);if(m)return goed.replace(m[0],m[0].slice(1));}if(w.categorie==="doffe-klank-g2")return goed.replace(/e(?=[^aeiou]*$)/i,"")||goed+"e";return goed.slice(0,-1);}
  function zoekDeFout(cfg,opl){const ids=categorieen(),ws=kiesGemengd(ids,6,"ov42",opl);const inhoud=`<div class="ov42-foutzinnen">${ws.map((w,i)=>{const goed=w.tekst.replace(/^hij\s+/i,"");const fout=foutHoorwoord(w);const basiszin=ZINNEN[w.tekst]||`Ik schrijf het woord ___ in mijn schrift.`;const foutInZin=opl?basiszin.replace("___",`<span class="ov42-foutwoord">${fout}</span>`):basiszin.replace("___",fout);return `<div class="ov42-foutkaart"><div class="ov42-foutzin"><b>${i+1}.</b><span>${foutInZin}</span></div>${opl?`<div class="ov40-oplossing">${markeer({...w,tekst:goed})}</div>`:lijn(cfg)}</div>`;}).join("")}</div>`;return pagina("Zoek de fout",[`Je oefent woorden met ${soortenTekst(ids)}.`,"In elke zin staat één hoorwoord fout. Onderstreep het foute woord.","Schrijf alleen het woord correct op de schrijflijn."],inhoud,cfg,opl);}
  function zinnen(cfg,opl,niveau){const ids=categorieen(),alle=woorden().filter(w=>ZINNEN[w.tekst]),ws=kiesGemengd(ids,6,`ov43-${niveau}`,opl).filter(w=>ZINNEN[w.tekst]),invul=w=>w.tekst.replace(/^hij\s+/i,""),toon=w=>markeer({...w,tekst:invul(w)}),bank=`<div class="ov40-bank">${ws.map(w=>opl?toon(w):invul(w)).join(" · ")}</div>`,ster={basis:"⭐",kern:"⭐⭐",verdieping:"⭐⭐⭐"}[niveau];if(niveau==="verdieping"){const maakZelf=(deel,start)=>`<div class="ov43-zelf-zinnen">${deel.map((w,i)=>`<div><b>${start+i+1}. ${opl?toon(w):invul(w)}</b>${opl?`<p>Eigen goede zin mogelijk.</p>`:`${lijn(cfg)}${lijn(cfg)}`}</div>`).join("")}</div>`,stappen=[`Je oefent woorden met ${soortenTekst(ids)}.`,"Maak met elk woord zelf een duidelijke zin.","Denk aan hoofdletter en leesteken."];return pagina("Maak zelf zinnen met hoorwoorden — deel 1",stappen,maakZelf(ws.slice(0,3),0),cfg,opl,ster)+pagina("Maak zelf zinnen met hoorwoorden — deel 2",stappen,maakZelf(ws.slice(3),3),cfg,opl,ster);}const inhoud=`<div class="ov43-zinnen">${ws.map((w,i)=>{const zin=ZINNEN[w.tekst],woord=invul(w),hint=niveau==="kern"?` <small>(${woord[0]}…)</small>`:"";return `<div class="ov43-zin ov43-zin-kort"><b>${i+1}.</b><span>${opl?zin.replace("___",`<strong>${toon(w)}</strong>`):zin}${opl?"":hint}</span>${opl?"":`<div class="ov43-korte-lijn">${lijn(cfg)}</div>`}</div>`;}).join("")}</div>`;const stappen=niveau==="basis"?[`Je oefent woorden met ${soortenTekst(ids)}.`,"Kies het passende woord uit de woordbank.","Schrijf alleen het ontbrekende woord op de korte lijn."]:[`Je oefent woorden met ${soortenTekst(ids)}.`,"Gebruik de eerste letter als hulp.","Schrijf alleen het ontbrekende woord op de korte lijn."];return pagina("Gebruik hoorwoorden in zinnen",stappen,(niveau==="basis"?bank:"")+inhoud,cfg,opl,ster);}
  function roosterData(ws){
    const woorden=ws.map(w=>w.tekst.replace(/^hij\s+/i,"").replace(/\s/g,"").toLowerCase()),
      n=Math.max(12,...woorden.map(w=>w.length)),
      grid=Array.from({length:n},()=>Array(n).fill("")),
      gebruikt=new Set(),
      dirs=[[1,0],[0,1],[1,1]];
    woorden.forEach((woord,wi)=>{
      let gezet=false;
      const richtingen=[...dirs.slice(wi%dirs.length),...dirs.slice(0,wi%dirs.length)];
      for(const [dx,dy] of richtingen){
        for(let y=0;y<n&&!gezet;y++)for(let x=0;x<n&&!gezet;x++){
          const x2=x+dx*(woord.length-1),y2=y+dy*(woord.length-1);
          if(x2>=n||y2>=n)continue;
          let ok=true;
          for(let k=0;k<woord.length;k++){
            const c=grid[y+dy*k][x+dx*k];
            if(c&&c!==woord[k]){ok=false;break;}
          }
          if(!ok)continue;
          for(let k=0;k<woord.length;k++){
            const xx=x+dx*k,yy=y+dy*k;
            grid[yy][xx]=woord[k];
            gebruikt.add(`${xx}-${yy}`);
          }
          gezet=true;
        }
        if(gezet)break;
      }
    });
    const letters="abcdefghijklmnopqrstuvwxyz";
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(!grid[y][x])grid[y][x]=letters[(x*7+y*11+x*y)%letters.length];
    return{grid,gebruikt};
  }
  function woordrooster(cfg,opl){const ids=categorieen(),ws=kiesGemengd(ids,6,"ov44",opl),r=roosterData(ws),richtingen=`<div class="ov44-richtingen"><span><b>→</b> links naar rechts</span><span><b>↓</b> boven naar beneden</span><span><b>↘</b> schuin naar rechtsonder</span></div>`,rooster=`<div class="ov44-rooster" style="--rooster-maat:${r.grid.length}">${r.grid.flatMap((rij,y)=>rij.map((letter,x)=>`<span class="${opl&&r.gebruikt.has(`${x}-${y}`)?"gevonden":""}">${letter}</span>`)).join("")}</div>`,antwoorden=`<div class="ov44-antwoorden">${ws.map((w,i)=>`<div><b>${i+1}.</b>${opl?`<span>${markeer({...w,tekst:w.tekst.replace(/^hij\s+/i,"")})}</span>`:lijn(cfg)}</div>`).join("")}</div>`;return pagina("Zoek de verborgen hoorwoorden",[`Zoek 6 woorden met ${soortenTekst(ids)} in het rooster.`,"Gebruik de drie pijlen onder de opdracht. Woorden staan nooit achterstevoren.","Schrijf elk gevonden woord op een schrijflijn."],richtingen+rooster+antwoorden,cfg,opl);}
  function module(id,naam,niveaus,fn,max=6){return{naam,graad:2,oefenvormenPerNiveau:niveaus,_maxPerNiveau:Object.fromEntries(niveaus.map(n=>[n,max])),renderInstellingen(){return"";},genereerBlad(opties,opl){const o=opties?.[id]||opties||{},cfg={lijntype:o.lijntype||"type3",lijnhoogte:o.lijnhoogte||"middel"},niveau=o.niveaus?.[0]||o.niveau||niveaus[0];return fn(cfg,opl,niveau);}};}
  window.SpellingModules=window.SpellingModules||{};
  window.SpellingModules.ov40=module("ov40","Hoorwoorden kleuren en sorteren",["basis"],sorteren);
  window.SpellingModules.ov41=module("ov41","Ontbrekend woordstuk kiezen",["basis"],kiezen);
  window.SpellingModules.ov42=module("ov42","Zoek de fout",["basis"],zoekDeFout);
  window.SpellingModules.ov43=module("ov43","Hoorwoorden in zinnen",["basis","kern","verdieping"],zinnen);
  window.SpellingModules.ov44=module("ov44","Hoorwoorden zoeken in een woordrooster",["basis"],woordrooster);
})();
