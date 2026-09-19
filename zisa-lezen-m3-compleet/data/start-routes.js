// Eigen AVI Start-opdrachten. De labels en lettervolgorde volgen Veilig leren lezen;
// de teksten en opdrachten hieronder zijn nieuw geschreven voor Zisa Lezen.
(()=>{
  const routes=[
    {method:"kim",stage:"Kern start",letters:"i k m s",title:"ik, kim en mik",cover:"images/start/sam.webp",pages:[
      {title:"Maak het woord",q:"Luister naar het woord. Welke letter ontbreekt?",audioPrompt:"mik",focus:"mi_",a:["s","k","m"],correct:1},
      {title:"Luister en lees",q:"Luister. Welk woord hoor je?",audioPrompt:"ik",a:["kim","ik","mik"],correct:1},
      {title:"Lees de zin",q:"Wie mist Kim?",text:"ik mis kim.",a:["kim","mik","ik"],correct:2}
    ]},
    {method:"kim",stage:"Kern 1",letters:"i k m s p aa r e v",title:"aap en vis",cover:"images/start/vis.webp",pages:[
      {title:"Kijk en lees",q:"Welk woord past bij de prent?",imagePrompt:"🐟",a:["vis","mis","is"],correct:0},
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"ik mis aap.",pictures:[{icon:"🐟",alt:"Een vis"},{icon:"🐒",alt:"Een aap"},{icon:"🐔",alt:"Een kip"}],correct:1},
      {title:"Kijk en lees",q:"Welk woord past bij de prent?",imagePrompt:"🐔",a:["vis","aap","kip"],correct:2}
    ]},
    {method:"kim",stage:"Kern 2",letters:"i k m s p aa r e v n t ee b oo",title:"boot en boom",cover:"images/start/trein.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"ik neem een boot.",pictures:[{icon:"⛵",alt:"Een boot"},{icon:"🌳",alt:"Een boom"},{icon:"🐟",alt:"Een vis"}],correct:0},
      {title:"Kijk en lees",q:"Welk woord past bij de prent?",imagePrompt:"🌳",a:["boot","boom","been"],correct:1},
      {title:"Lees de zin",q:"Wat neem ik?",text:"ik neem een boot.",a:["een boom","een been","een boot"],correct:2}
    ]},
    {method:"kim",stage:"Kern 3",letters:"i k m s p aa r e v n t ee b oo d oe z ij h",title:"doos en boot",cover:"images/start/trein.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"de boot is er.",pictures:[{icon:"⛵",alt:"Een boot"},{icon:"🌳",alt:"Een boom"},{icon:"📦",alt:"Een doos"}],correct:0},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"📦",a:["de boot is er.","de doos is er.","de boom is er."],correct:1},
      {title:"Lees de zin",q:"Waar zit ik?",text:"ik zit in de boot.",a:["in de doos","in de boom","in de boot"],correct:2}
    ]},
    {method:"kim",stage:"Kern 4",letters:"i k m s p aa r e v n t ee b oo d oe z ij h w o a u j",title:"kat in de bus",cover:"images/start/kat.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"de kat is er.",pictures:[{icon:"🐈",alt:"Een kat"},{icon:"🐟",alt:"Een vis"},{icon:"🚌",alt:"Een bus"}],correct:0},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"🐈",a:["de vis is er.","de bus is er.","de kat is er."],correct:2},
      {title:"Lees de zin",q:"Wie zit in de bus?",text:"de kat zit in de bus.",a:["de vis","de kat","de aap"],correct:1}
    ]},
    {method:"kim",stage:"Kern 5",letters:"i k m s p aa r e v n t ee b oo d oe z ij h w o a u j eu ie l ou uu",title:"poes en stoel",cover:"images/start/kat.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"de stoel is er.",pictures:[{icon:"🪑",alt:"Een stoel"},{icon:"🚌",alt:"Een bus"},{icon:"🐟",alt:"Een vis"}],correct:0},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"🪑",a:["de bus is er.","de stoel is er.","de vis is er."],correct:1},
      {title:"Lees de zin",q:"Waar zit de poes?",text:"de poes zit op de stoel.",a:["in de bus","op de boot","op de stoel"],correct:2}
    ]},
    {method:"kim",stage:"Kern 6",letters:"i k m s p aa r e v n t ee b oo d oe z ij h w o a u j eu ie l ou uu g au ui f ei",title:"muis en huis",cover:"images/start/kat.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"de muis is er.",pictures:[{icon:"🐭",alt:"Een muis"},{icon:"🐈",alt:"Een kat"},{icon:"🚌",alt:"Een bus"}],correct:0},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"🐭",a:["de kat is er.","de bus is er.","de muis is er."],correct:2},
      {title:"Lees de zin",q:"Waar is de muis?",text:"de muis is in het huis.",a:["in de bus","in het huis","in de tuin"],correct:1}
    ]},
    {method:"kim",stage:"Kern 7",letters:"alle letters uit kern 0–6; nu ook woorden met meer medeklinkers",title:"spoor in het bos",cover:"images/start/trein.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"ik zie een spoor.",pictures:[{icon:"🐾",alt:"Een dierenspoor"},{icon:"⛵",alt:"Een boot"},{icon:"🐈",alt:"Een kat"}],correct:0},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"🐾",a:["ik zie een boot.","ik zie een spoor.","ik zie een kat."],correct:1},
      {title:"Lees de zin",q:"Wat zie ik in het bos?",text:"ik zie een spoor in het bos.",a:["een boot","een kat","een spoor"],correct:2}
    ]},
    {method:"zoem",stage:"Anker start",letters:"i k m s aa",title:"ik en kaas",cover:"images/start/sam.webp",pages:[
      {title:"Zoem de klanken",q:"Zoem en lees het woord.",chunks:["k","aa","s"],word:"kaas"},
      {title:"Kijk en lees",q:"Welk woord past bij de prent?",imagePrompt:"🧀",a:["maas","kaas","kaak"],correct:1},
      {title:"Lees de zin",q:"Wat mis ik?",text:"ik mis kaas.",a:["kim","mik","kaas"],correct:2}
    ]},
    {method:"zoem",stage:"Anker 1",letters:"i k m s aa r e v p n ee b oo",title:"vis en boom",cover:"images/start/vis.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"ik neem een vis.",pictures:[{icon:"🐟",alt:"Een vis"},{icon:"🐒",alt:"Een aap"},{icon:"🌳",alt:"Een boom"}],correct:0},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"🐟",a:["ik neem een boom.","ik neem een vis.","ik neem een aap."],correct:1},
      {title:"Lees de zin",q:"Wat neem ik?",text:"ik neem een vis.",a:["een aap","een boom","een vis"],correct:2}
    ]},
    {method:"zoem",stage:"Anker 2",letters:"i k m s aa r e v p n ee b oo t z oe d h ij u a",title:"bus en zak",cover:"images/start/bus.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"de bus is er.",pictures:[{icon:"⛵",alt:"Een boot"},{icon:"🚌",alt:"Een bus"},{icon:"🐄",alt:"Een koe"}],correct:1},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"🚌",a:["de bus is er.","de boot is er.","de koe is er."],correct:0},
      {title:"Lees de zin",q:"Wat is er?",text:"de bus is er.",a:["de boot","de koe","de bus"],correct:2}
    ]},
    {method:"zoem",stage:"Anker 3",letters:"i k m s aa r e v p n ee b oo t z oe d h ij u a j eu o w ie uu l ui",title:"muis in huis",cover:"images/start/kat.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"de muis is er.",pictures:[{icon:"🐈",alt:"Een kat"},{icon:"🚌",alt:"Een bus"},{icon:"🐭",alt:"Een muis"}],correct:2},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"🐭",a:["de muis is er.","de kat is er.","de bus is er."],correct:0},
      {title:"Lees de zin",q:"Waar zit de muis?",text:"de muis zit in het huis.",a:["in de bus","in het huis","in de doos"],correct:1}
    ]},
    {method:"zoem",stage:"Anker 4",letters:"i k m s aa r e v p n ee b oo t z oe d h ij u a j eu o w ie uu l ui ou g ei f au ng ch",title:"geit in de wei",cover:"images/start/maan.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"de geit is er.",pictures:[{icon:"🐐",alt:"Een geit"},{icon:"🐄",alt:"Een koe"},{icon:"🚌",alt:"Een bus"}],correct:0},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"🐐",a:["de koe is er.","de geit is er.","de bus is er."],correct:1},
      {title:"Lees de zin",q:"Waar is de geit?",text:"de geit is in de wei.",a:["in de bus","in het huis","in de wei"],correct:2}
    ]},
    {method:"zoem",stage:"Anker 5",letters:"alle letters uit anker 0–4; nu ook sch en medeklinkergroepen",title:"spin in het web",cover:"images/start/kat.webp",pages:[
      {title:"Lees en kijk",q:"Welke prent past bij de zin?",text:"de spin is er.",pictures:[{icon:"🕷️",alt:"Een spin"},{icon:"🐭",alt:"Een muis"},{icon:"🐐",alt:"Een geit"}],correct:0},
      {title:"Kijk en lees",q:"Welke zin past bij de prent?",imagePrompt:"🕷️",a:["de muis is er.","de spin is er.","de geit is er."],correct:1},
      {title:"Lees de zin",q:"Waar zit de spin?",text:"de spin zit in het web.",a:["in de bus","in de wei","in het web"],correct:2}
    ]}
  ];
  const oldWordSets={
    "kim|Kern 1":{words:[["vis","🐟"],["kip","🐔"],["aap","🐒"]],gap:"vi_",letter:"s",others:["p","m"]},
    "kim|Kern 2":{words:[["boom","🌳"],["boot","⛵"],["beer","🐻"]],gap:"boo_",letter:"m",others:["t","s"]},
    "kim|Kern 3":{words:[["doos","📦"],["koe","🐄"],["boot","⛵"]],gap:"doo_",letter:"s",others:["m","t"]},
    "kim|Kern 4":{words:[["kat","🐈"],["bus","🚌"],["zak","🎒"]],gap:"ka_",letter:"t",others:["s","m"]},
    "kim|Kern 5":{words:[["poes","🐈"],["stoel","🪑"],["uil","🦉"]],gap:"poe_",letter:"s",others:["l","t"]},
    "kim|Kern 6":{words:[["muis","🐭"],["huis","🏠"],["geit","🐐"]],gap:"mui_",letter:"s",others:["t","k"]},
    "kim|Kern 7":{words:[["spin","🕷️"],["spoor","🐾"],["schip","🚢"]],gap:"spi_",letter:"n",others:["m","s"]},
    "zoem|Anker 1":{words:[["vis","🐟"],["kip","🐔"],["aap","🐒"]],gap:"vi_",letter:"s",others:["p","m"]},
    "zoem|Anker 2":{words:[["bus","🚌"],["koe","🐄"],["zak","🎒"]],gap:"bu_",letter:"s",others:["t","m"]},
    "zoem|Anker 3":{words:[["muis","🐭"],["huis","🏠"],["vos","🦊"]],gap:"mui_",letter:"s",others:["t","k"]},
    "zoem|Anker 4":{words:[["geit","🐐"],["fiets","🚲"],["hout","🪵"]],gap:"gei_",letter:"t",others:["s","m"]},
    "zoem|Anker 5":{words:[["spin","🕷️"],["schip","🚢"],["trein","🚆"]],gap:"spi_",letter:"n",others:["m","s"]}
  };
  const oldFirstSteps={
    kim:[
      {title:"Luister en lees",q:"Luister. Welk woord hoor je?",audioPrompt:"mis",a:["mik","mis","kim"],correct:1},
      {title:"Maak het woord",q:"Luister. Welke letter ontbreekt?",audioPrompt:"kim",focus:"ki_",a:["s","k","m"],correct:2},
      {title:"Luister en lees",q:"Luister. Welk woord hoor je?",audioPrompt:"mik",a:["mik","kim","mis"],correct:0},
      {title:"Maak het woord",q:"Luister. Welke letter ontbreekt?",audioPrompt:"mis",focus:"mi_",a:["s","m","k"],correct:0},
      {title:"Lees de zin",q:"Wie mis ik?",text:"ik mis kim.",a:["mik","ik","kim"],correct:2}
    ],
    zoem:[
      {title:"Luister en lees",q:"Luister. Welk woord hoor je?",audioPrompt:"kaas",a:["maas","kaas","kaak"],correct:1},
      {title:"Maak het woord",q:"Luister. Welke letter ontbreekt?",audioPrompt:"kaas",focus:"kaa_",a:["m","s","k"],correct:1},
      {title:"Kijk en lees",q:"Welk woord past bij de prent?",imagePrompt:"🧀",a:["kaak","maas","kaas"],correct:2},
      {title:"Luister en lees",q:"Luister. Welk woord hoor je?",audioPrompt:"mik",a:["mik","mis","kim"],correct:0},
      {title:"Lees de zin",q:"Wat mis ik?",text:"ik mis kaas.",a:["mik","kaas","kim"],correct:1}
    ]
  };
  const asset=word=>`images/start-eigen/${word}.png`;
  const pictureWords={"🐟":"vis","🐒":"aap","🐔":"kip","⛵":"boot","🌳":"boom","🐻":"beer","📦":"doos","🐄":"koe","🐈":"kat","🚌":"bus","🎒":"zak","🪑":"stoel","🦉":"uil","🐭":"muis","🏠":"huis","🐐":"geit","🐾":"spoor","🧀":"kaas","🦊":"vos","🚲":"fiets","🪵":"hout","🕷️":"spin","🚢":"schip","🚆":"trein"};
  const coverWords={
    "kim|Kern start":"kinderen","kim|Kern 1":"aap","kim|Kern 2":"boot","kim|Kern 3":"doos",
    "kim|Kern 4":"kat","kim|Kern 5":"stoel","kim|Kern 6":"muis","kim|Kern 7":"spoor",
    "zoem|Anker start":"kaas","zoem|Anker 1":"vis","zoem|Anker 2":"bus",
    "zoem|Anker 3":"huis","zoem|Anker 4":"geit","zoem|Anker 5":"spin"
  };
  // Per kern/anker een eigen, brede woordenschat. Een prent wordt per reeks
  // hoogstens een keer als vraag getoond; latere vragen oefenen andere woorden.
  const vocabulary={
    "kim|Kern 1":{pictures:["vis","kip","aap","kaas"],extra:["mis","sip","raas","paar"],gaps:[["vis","vi_","s"],["kip","ki_","p"]]},
    "kim|Kern 2":{pictures:["boom","boot","beer","raam","pen","roos"],extra:["been","maan","een","neem","bek","beet"],gaps:[["boom","boo_","m"],["pen","pe_","n"]]},
    "kim|Kern 3":{pictures:["doos","koe","zee","ijs","doek","boot"],extra:["haar","de","zij","hij","doen","hoed"],gaps:[["doos","doo_","s"],["doek","doe_","k"]]},
    "kim|Kern 4":{pictures:["kat","bus","zak","vos","jas","doos"],extra:["wat","was","jam","kop","pot","tak"],gaps:[["bus","bu_","s"],["kat","ka_","t"]]},
    "kim|Kern 5":{pictures:["stoel","riem","vuur","kat","boot","doek"],extra:["poes","wiel","leuk","neus","deur","toen"],gaps:[["stoel","stoe_","l"],["riem","rie_","m"]]},
    "kim|Kern 6":{pictures:["muis","huis","geit","fiets","uil","jas"],extra:["tuin","goud","geur","feit","fout","mijn"],gaps:[["muis","mui_","s"],["geit","gei_","t"]]},
    "kim|Kern 7":{pictures:["spin","spoor","schip","trein","fiets","zak"],extra:["schaar","plank","bank","stift","web","rugzak"],gaps:[["spin","spi_","n"],["schip","schi_","p"]]},
    "zoem|Anker 1":{pictures:["raam","pen","roos","vis","kip","beer","boom","aap"],extra:["mes","been","een","maan","reep","bek","neem","paar"],gaps:[["raam","raa_","m"],["pen","pe_","n"]]},
    "zoem|Anker 2":{pictures:["boot","zee","koe","doos","ijs","bus","zak","doek"],extra:["hek","haas","mus","boer","poes","dak","bak","zoon"],gaps:[["doos","doo_","s"],["boot","boo_","t"]]},
    "zoem|Anker 3":{pictures:["jas","neus","vos","riem","vuur","muis","huis","uil"],extra:["wip","lijm","wiel","leuk","buur","ruit","stoel","vuil"],gaps:[["neus","neu_","s"],["muis","mui_","s"]]},
    "zoem|Anker 4":{pictures:["hout","geit","fiets","saus","roos"],extra:["gaas","juf","lang","lach","goud","touw","wei","geur","fout"],gaps:[["geit","gei_","t"],["hout","hou_","t"]]},
    "zoem|Anker 5":{pictures:["schaar","schip","trein","fiets","spin","zak","stoel","muis"],extra:["kast","bank","bril","plank","stift","rugzak","web","staart"],gaps:[["schip","schi_","p"],["trein","trei_","n"]]}
  };
  const choose=(words,correct,offset)=>{
    const others=words.filter(word=>word!==correct);
    return [correct,others[offset%others.length],others[(offset+Math.max(1,Math.floor(others.length/2)))%others.length]];
  };
  routes.forEach(route=>{
    const key=`${route.method}|${route.stage}`;
    if(key==="kim|Kern start"){
      route.pages=[
        {title:"Zoem en lees",q:"Lees dit woord.",chunks:["i","k"],word:"ik"},
        {title:"Luister en lees",q:"Welk woord hoor je?",audioPrompt:"kim",a:["mik","mis","kim"],correct:2},
        {title:"Maak het woord",q:"Luister. Welke letter ontbreekt?",audioPrompt:"mik",focus:"mi_",a:["s","k","m"],correct:1},
        {title:"Lees de zin",q:"Wie mis ik?",text:"ik mis kim.",a:["mik","ik","kim"],correct:2},
        {title:"Luister en lees",q:"Welk woord hoor je?",audioPrompt:"sis",a:["sis","mis","sik"],correct:0},
        {title:"Maak het woord",q:"Luister. Welke letter ontbreekt?",audioPrompt:"kim",focus:"ki_",a:["m","s","k"],correct:0},
        {title:"Zoem en lees",q:"Lees dit woord.",chunks:["m","i","s"],word:"mis"},
        {title:"Luister en lees",q:"Welk woord hoor je?",audioPrompt:"mik",a:["kim","mik","ik"],correct:1},
        {title:"Lees de zin",q:"Wie mis ik?",text:"kim mis ik.",a:["kim","mik","ik"],correct:0}
      ];
      return;
    }
    if(key==="zoem|Anker start"){
      route.pages=[
        {title:"Zoem en lees",q:"Lees dit woord.",chunks:["k","aa","s"],word:"kaas"},
        {title:"Luister en lees",q:"Welk woord hoor je?",audioPrompt:"ik",a:["mik","ik","kim"],correct:1},
        {title:"Kijk en lees",q:"Welk woord past bij de prent?",imageSrc:asset("kaas"),imageAlt:"Kaas",a:["kaak","maas","kaas"],correct:2},
        {title:"Maak het woord",q:"Luister. Welke letter ontbreekt?",audioPrompt:"maak",focus:"maa_",a:["s","m","k"],correct:2},
        {title:"Luister en lees",q:"Welk woord hoor je?",audioPrompt:"sis",a:["mis","sis","mik"],correct:1},
        {title:"Lees de zin",q:"Wat mis ik?",text:"ik mis kim.",a:["ik","kim","kaas"],correct:1},
        {title:"Zoem en lees",q:"Lees dit woord.",chunks:["m","aa","s"],word:"maas"},
        {title:"Luister en lees",q:"Welk woord hoor je?",audioPrompt:"kaak",a:["kaas","kaak","maak"],correct:1},
        {title:"Maak het woord",q:"Luister. Welke letter ontbreekt?",audioPrompt:"mis",focus:"mi_",a:["k","s","m"],correct:1},
        {title:"Luister en lees",q:"Welk woord hoor je?",audioPrompt:"mik",a:["mik","kim","mis"],correct:0},
        {title:"Lees de zin",q:"Wat mis ik?",text:"ik mis kaas.",a:["kim","kaas","mik"],correct:1}
      ];
      return;
    }
    const set=vocabulary[key];
    if(!set)return;
    const words=set.pictures;
    route.pages=[];
    words.forEach((word,index)=>{
      const options=choose(words,word,index);
      route.pages.push({title:"Kijk en lees",q:"Welk woord past bij de prent?",imageSrc:asset(word),imageAlt:word,a:options,correct:0});
      if(index%2===1){
        const pictured=choose(words,word,index+2);
        route.pages.push({title:"Lees en kijk",q:"Welke prent past bij het woord?",text:word,pictures:pictured.map(name=>({src:asset(name),alt:name})),correct:0});
      }
    });
    set.extra.forEach((word,index)=>{
      const pool=[word,...set.extra.filter(other=>other!==word)].slice(0,3);
      route.pages.push({title:"Luister en lees",q:"Welk woord hoor je?",audioPrompt:word,a:pool,correct:0});
    });
    set.gaps.forEach(([word,focus,letter],index)=>{
      const learnedLetters=route.letters.startsWith("alle")?"i k m s p r e v n t b d z h w o a u j l g f":route.letters;
      const alternatives=learnedLetters.split(" ").filter(item=>item.length===1&&item!==letter);
      route.pages.push({title:"Maak het woord",q:"Luister. Welke letter ontbreekt?",audioPrompt:word,focus,a:[letter,alternatives[index*2],alternatives[index*2+1]],correct:0});
    });
  });
  routes.forEach(route=>route.pages.forEach(page=>{
    if(page.imagePrompt){page.imageAlt=pictureWords[page.imagePrompt];page.imageSrc=asset(page.imageAlt);delete page.imagePrompt}
    if(page.pictures)page.pictures=page.pictures.map(picture=>picture.src?picture:({src:asset(pictureWords[picture.icon]),alt:picture.alt}));
  }));
  window.ZISA_FLUENCY_BOOKS=window.ZISA_FLUENCY_BOOKS||{};
  window.ZISA_BOOKS=window.ZISA_BOOKS||[];
  routes.forEach((route,index)=>{
    const id=`start-${route.method}-${route.stage.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`;
    window.ZISA_BOOKS.push({id,level:"START",method:route.method,stage:route.stage,letters:route.letters,title:route.title,blurb:`${route.stage} · letters: ${route.letters}`,coverImage:asset(coverWords[`${route.method}|${route.stage}`]),coverTone:["blue","pink","yellow","green"][index%4],startBook:true});
    window.ZISA_FLUENCY_BOOKS[id]=route.pages;
  });
})();
