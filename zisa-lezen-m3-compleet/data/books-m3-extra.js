// Twee oorspronkelijke M3-verhalen. Elke bladzijde heeft een eigen illustratie.
(()=>{
  const loes="images/m3-loes-doos/";
  const rik="images/m3-rik-kar/";
  const picture=(dir,n)=>`${dir}${String(n).padStart(2,"0")}.webp`;
  window.ZISA_BOOKS=window.ZISA_BOOKS||[];
  window.ZISA_BOOKS.push(
    {
      id:"m3-loes-doos",level:"M3",title:"Loes en de doos",
      blurb:"De doos van Loes gaat heen en weer. Wat zit erin?",
      cover:picture(loes,1),pages:[
        {text:"Loes ziet een doos.\nDe doos staat op de mat.\nWat zit er in?",image:picture(loes,1)},
        {text:"Tik, tik, tik!\nDe doos gaat heen en weer.\nLoes hoort iets.",image:picture(loes,2)},
        {text:"Dan klinkt: miauw!\nLoes ziet een poot.\nDie komt uit de doos.",image:picture(loes,3),task:{type:"choice",q:"Wat komt uit de doos?",a:["een staart","een poot","een oor"],correct:1,hint:"Kijk naar de doos en lees de tweede zin."}},
        {text:"Loes roept: 'Pap, kom!'\nPap hoort het ook.\nWat zit daar?",image:`${loes}04-v2.webp`},
        {text:"Pap tilt de klep op.\nLoes ziet een oog.\nEn nog een oog!",image:picture(loes,5),task:{type:"choice",q:"Wat ziet Loes in de doos?",a:["een bal","een oog","een pet"],correct:1,hint:"Lees de tweede zin nog eens."}},
        {text:"Het is Mo, de kat!\nMo zit bij een bol wol.\nLoes is blij.",image:picture(loes,6),task:{type:"choice",q:"Wie zit in de doos?",a:["Pap","Loes","Mo"],correct:2,hint:"Lees de eerste zin nog eens."}},
        {text:"Mo gaat uit de doos.\nDe bol rolt weg.\nLoes pakt de bol.",image:picture(loes,7)},
        {text:"Loes legt de bol in de doos.\n'Mo, kijk!'\nMo komt naar haar toe.",image:picture(loes,8)},
        {text:"Mo gaat in de doos.\nHij tikt op de bol.\nTok, tok!",image:picture(loes,9),task:{type:"choice",q:"Wat doet Mo met de bol?",a:["Hij tikt erop.","Hij eet hem op.","Hij stopt hem weg."],correct:0,hint:"Lees de tweede zin nog eens."}},
        {text:"Loes zit bij de doos.\nMo spint zacht.\nDit is nu zijn huis.",image:picture(loes,10)}
      ],endTask:{type:"choice",q:"Wie zat al die tijd in de doos?",a:["een hond","Mo de kat","Pap"],correct:1,hint:"Denk aan het oog en de poot in de doos."}
    },
    {
      id:"m3-rik-kar",level:"M3",title:"Rik en de kar",
      blurb:"Een wiel rolt weg. Hoe komt Riks kar weer thuis?",
      cover:picture(rik,1),pages:[
        {text:"Rik heeft een kar.\nDe kar is rood.\nEr ligt een peer in.",image:picture(rik,1)},
        {text:"Hij gaat naar mam.\nDe kar rolt op het pad.\nRik trekt de kar.",image:picture(rik,2)},
        {text:"Bam! De kar rolt op een steen.\nEen peer valt op het pad.\nO nee!",image:picture(rik,3),task:{type:"choice",q:"Wat valt uit de kar?",a:["een wiel","een peer","een steen"],correct:1,hint:"Lees de tweede zin nog eens."}},
        {text:"Rik pakt de peer.\nHij ziet een wiel.\nHet wiel zit los.",image:picture(rik,4)},
        {text:"Het wiel rolt weg!\nRik rent naar het wiel.\nDe peer is in zijn hand.",image:picture(rik,5)},
        {text:"Boef staat bij het hek.\nDe hond stopt het wiel.\nRik is blij.",image:picture(rik,6),task:{type:"choice",q:"Wie stopt het wiel?",a:["Rik","Pa","Boef"],correct:2,hint:"Lees de eerste twee zinnen nog eens."}},
        {text:"Rik legt de peer in de kar.\nHij pakt het wiel.\n'Pa, kom eens!'",image:picture(rik,7)},
        {text:"Pa komt met een pin.\nHij zet het wiel vast.\nRik pakt de kar.",image:picture(rik,8),task:{type:"choice",q:"Wie zet het wiel vast?",a:["Pa","Boef","Mam"],correct:0,hint:"Lees de tweede zin nog eens."}},
        {text:"De kar rolt weer goed.\nRik trekt hem naar huis.\nBoef loopt mee.",image:picture(rik,9)},
        {text:"Mam ziet Rik en de kar.\n'Wat fijn, Rik!'\nRik en Boef zijn blij.",image:picture(rik,10)}
      ],endTask:{type:"choice",q:"Wat kwam eerst?",a:["Pa zet het wiel vast.","Boef stopt het wiel.","Een peer valt uit de kar."],correct:2,hint:"Denk aan het begin van het verhaal."}
    }
  );
  window.ZISA_LEVEL_GAMES={...(window.ZISA_LEVEL_GAMES||{}),
    "m3-loes-doos":[
      {type:"choice",icon:"🧠",title:"Wat weet je nog?",q:"Waarom kijkt Loes in de doos?",a:["Ze zoekt haar jas.","De doos is nat.","Ze hoort iets in de doos."],correct:2,hint:"Denk aan tik, tik en miauw."},
      {type:"sentence",icon:"🧩",title:"Bouw de zin",q:"Zet de zin in de goede volgorde.",image:picture(loes,6),imageAlt:"Mo zit in de doos",parts:[{text:"Mo",role:"wie"},{text:"zit",role:"doet"},{text:"in de doos",role:"waar"}]},
      {type:"choice",icon:"💡",title:"Woordenschat",q:"Mo spint zacht. Wat doet hij?",image:picture(loes,10),imageAlt:"Mo ligt fijn in de doos",a:["Hij rent heel snel.","Hij maakt een zacht geluid.","Hij blaast de doos weg."],correct:1,hint:"Mo ligt fijn in de doos."},
      {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij doos?",word:"doos",correct:"de"},
      {type:"choice",icon:"📖",title:"Lees en kies",context:"De doos staat op de mat.",q:"Waar staat de doos?",a:["op de mat","op het pad","in de boom"],correct:0,hint:"Lees de zin nog eens. Waar staat de doos?"},
      {type:"sequence",icon:"⏳",title:"Eerst en dan",q:"Zet de zinnen in de goede volgorde.",items:["De doos gaat heen en weer.","Loes ziet een poot.","Mo gaat uit de doos.","Mo speelt met de bol."],hint:"Denk aan het begin en het eind."},
      {type:"sentence",icon:"🧩",title:"Nog een zin",q:"Bouw de zin over Loes.",image:picture(loes,8),imageAlt:"Loes legt de bol in de doos",parts:[{text:"Loes",role:"wie"},{text:"legt",role:"doet"},{text:"de bol",role:"wat"},{text:"in de doos",role:"waar"}]},
      {type:"choice",icon:"💡",title:"Lees goed",q:"Wat ligt bij Mo in de doos?",a:["een bol wol","een pet","een peer"],correct:0,hint:"Kijk naar de prent waar je Mo goed ziet."},
      {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij huis?",word:"huis",correct:"het"},
      {type:"choice",icon:"❓",title:"Lees met een vraag",q:"Welk leesteken hoort bij: Wat zit er in",a:["!","?","."],correct:1,hint:"Het is een vraag."}
    ],
    "m3-rik-kar":[
      {type:"choice",icon:"🧠",title:"Wat weet je nog?",q:"Waarom kan de kar niet meer rollen?",a:["Rik is moe.","Het wiel is los.","Het pad is nat."],correct:1,hint:"Denk aan het wiel dat wegrolt."},
      {type:"sentence",icon:"🧩",title:"Bouw de zin",q:"Zet de zin in de goede volgorde.",image:picture(rik,6),imageAlt:"Boef stopt het wiel",parts:[{text:"Boef",role:"wie"},{text:"stopt",role:"doet"},{text:"het wiel",role:"wat"}]},
      {type:"choice",icon:"💡",title:"Woordenschat",q:"Het wiel zit los. Wat is los?",image:picture(rik,5),imageAlt:"Een wiel rolt van de kar weg",a:["Het zit niet meer vast.","Het is erg zwaar.","Het is nat van de regen."],correct:0,hint:"Het wiel rolt van de kar weg."},
      {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij wiel?",word:"wiel",correct:"het"},
      {type:"choice",icon:"📖",title:"Lees en kies",context:"Rik trekt de kar.",q:"Wat trekt Rik?",a:["de peer","de kar","het wiel"],correct:1,hint:"Lees de zin nog eens. Wat trekt Rik?"},
      {type:"sequence",icon:"⏳",title:"Eerst en dan",q:"Zet de zinnen in de goede volgorde.",items:["Een peer valt uit de kar.","Het wiel rolt weg.","Boef stopt het wiel.","Pa zet het wiel vast."],hint:"Wat gebeurde eerst op het pad?"},
      {type:"sentence",icon:"🧩",title:"Nog een zin",q:"Bouw de zin over Pa.",image:picture(rik,8),imageAlt:"Pa pakt een pin",parts:[{text:"Pa",role:"wie"},{text:"pakt",role:"doet"},{text:"een pin",role:"wat"}]},
      {type:"choice",icon:"💡",title:"Lees goed",q:"Wat ligt er in Riks kar?",a:["een bol","een pet","een peer"],correct:2,hint:"Lees de eerste bladzij nog eens."},
      {type:"article",icon:"🏷️",title:"De of het?",q:"Welk lidwoord hoort bij kar?",word:"kar",correct:"de"},
      {type:"choice",icon:"❓",title:"Lees met een uitroep",q:"Welk leesteken hoort bij: Het wiel rolt weg",a:["!","?","."],correct:0,hint:"Rik roept: O nee!"}
    ]
  };
  window.ZISA_SPEED_GAMES={...(window.ZISA_SPEED_GAMES||{}),
    "m3-loes-doos":{words:["Loes","doos","mat","tik","hoort","poot","pap","klep","oog","Mo","kat","bol","wol","blij","gaat","rolt","pakt","legt","spint","huis","kijkt","zacht","in","uit"]},
    "m3-rik-kar":{words:["Rik","kar","rood","peer","pad","steen","gaat","hand","wiel","los","rolt","rent","Boef","hond","hek","pa","pin","vast","mam","huis","goed","blij"]}
  };
  window.ZISA_FLUENCY_BOOKS=window.ZISA_FLUENCY_BOOKS||{};
  window.ZISA_FLUENCY_BOOKS["m3-loes-doos"]=[
    {title:"Kijk naar elk teken",q:"Tik precies hetzelfde woord aan.",focus:"doos",a:["boos","doos","roos"],correct:1,good:"Juist! Dit is doos."},
    {title:"Zoek het rijmwoord",q:"Welk woord rijmt op doos?",focus:"doos",a:["poot","kat","roos"],correct:2,good:"Juist! doos en roos rijmen."},
    {title:"Zoek het woord",q:"Welk woord maakt de zin goed? Mo zit in de ...",focus:"Mo zit in de ...",a:["doos","kar","boom"],correct:0,good:"Juist! Mo zit in de doos."},
    {title:"Lees heel goed",q:"Wat zit er in de doos?",focus:"in de doos",a:["een hond","een kat","een vis"],correct:1,good:"Juist! Mo is een kat."},
    {title:"Korte klanken",q:"Klik in elk woord met een korte klank op die klank. Laat het woord met een lange klank staan.",shortVowels:[{word:"kat",index:1},{word:"doos",index:null},{word:"tik",index:1},{word:"bol",index:1}],good:"Goed gedaan! Je liet het woord met de lange klank staan."},
    {title:"Kies het leesteken",q:"Welk leesteken hoort achter deze vraag?",focus:"wat zit er in de doos",punctuation:true,a:["?","!","."],correct:0,good:"Juist! Dit is een vraag."}
  ];
  window.ZISA_FLUENCY_BOOKS["m3-rik-kar"]=[
    {title:"Kijk naar elk teken",q:"Tik precies hetzelfde woord aan.",focus:"wiel",a:["wil","veel","wiel"],correct:2,good:"Juist! Dit is wiel."},
    {title:"Zoek het rijmwoord",q:"Welk woord rijmt op peer?",focus:"peer",a:["weer","paar","per"],correct:0,good:"Juist! peer en weer rijmen."},
    {title:"Zoek het woord",q:"Welk woord maakt de zin goed? Pa zet het ... vast.",focus:"Pa zet het ... vast.",a:["hek","wiel","pad"],correct:1,good:"Juist! Pa zet het wiel vast."},
    {title:"Lees heel goed",q:"Wie stopt het wiel?",focus:"het wiel",a:["mam","Pa","Boef"],correct:2,good:"Juist! Boef stopt het wiel."},
    {title:"Korte klanken",q:"Klik in elk woord met een korte klank op die klank. Laat het woord met een lange klank staan.",shortVowels:[{word:"kar",index:1},{word:"peer",index:null},{word:"hek",index:1},{word:"pin",index:1}],good:"Goed gedaan! Je liet het woord met de lange klank staan."},
    {title:"Kies het leesteken",q:"Welk leesteken hoort bij de uitroep?",focus:"het wiel rolt weg",punctuation:true,a:["?","!","."],correct:1,good:"Juist! Rik roept dit hard."}
  ];
})();
