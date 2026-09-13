window.ZISA_BOOKS=window.ZISA_BOOKS||[];
window.ZISA_BOOKS.unshift(
  {id:"start-zoemen",level:"START",title:"Zoemend lezen",blurb:"Lees klanken na elkaar en plak ze samen tot een woord.",coverImage:"images/start/trein.webp",coverTone:"blue",startBook:true,pages:[]},
  {id:"start-rijmen",level:"START",title:"Rijmen maar!",blurb:"Luister goed en zoek woorden met hetzelfde einde.",coverImage:"images/start/rijmen.webp",coverTone:"pink",startBook:true,pages:[]},
  {id:"start-leestekens",level:"START",title:"Punt, vraag of uitroep?",blurb:"Kies het leesteken dat bij de korte zin hoort.",coverImage:"images/start/leestekens.webp",coverTone:"yellow",startBook:true,pages:[]},
  {id:"start-zinnen",level:"START",title:"Mijn eerste zinnen",blurb:"Lees een klein verhaal met korte zinnen en veel MKM-woorden.",coverImage:"images/start/sam-kat.webp",coverTone:"green",startBook:true,pages:[]}
);

window.ZISA_FLUENCY_BOOKS=window.ZISA_FLUENCY_BOOKS||{};
const zoomOpdracht="Tik op Start met zoemen. Lees elke klank zoemend zolang je ze ziet. Lees daarna het hele woord.";

window.ZISA_FLUENCY_BOOKS["start-zoemen"]=[
  {iconImage:"images/start/maan.webp",title:"Zoem en plak",q:zoomOpdracht,chunks:["m","aa","n"],word:"maan"},
  {iconImage:"images/start/vis.webp",title:"Zoem en plak",q:zoomOpdracht,chunks:["v","i","s"],word:"vis"},
  {iconImage:"images/start/kat.webp",title:"Zoem en plak",q:zoomOpdracht,chunks:["k","a","t"],word:"kat"},
  {iconImage:"images/start/bus.webp",title:"Zoem en plak",q:zoomOpdracht,chunks:["b","u","s"],word:"bus"},
  {iconImage:"images/start/pen-balpen.webp",title:"Zoem en plak",q:zoomOpdracht,chunks:["p","e","n"],word:"pen"},
  {iconImage:"images/start/roos.webp",title:"Zoem en plak",q:zoomOpdracht,chunks:["r","oo","s"],word:"roos"},
  {iconImage:"images/start/kat.webp",title:"Lees en kies",q:"Lees de woorden. Welk woord hoort bij de prent?",a:["kat","kam","kan"],correct:0,good:"Juist! Bij de prent hoort kat."},
  {iconImage:"images/start/roos.webp",title:"Lees en kies",q:"Lees de woorden. Welk woord hoort bij de prent?",a:["room","roos","rook"],correct:1,good:"Juist! Bij de prent hoort roos."}
];

window.ZISA_FLUENCY_BOOKS["start-rijmen"]=[
  {icon:"🌙",title:"Zoek het rijmwoord",q:"Welk woord rijmt op maan?",focus:"maan",a:["man","haan","min"],correct:1,good:"Juist! maan en haan rijmen."},
  {icon:"🐱",title:"Zoek het rijmwoord",q:"Welk woord rijmt op kat?",focus:"kat",a:["mat","kit","kam"],correct:0,good:"Juist! kat en mat rijmen."},
  {icon:"🐟",title:"Zoek het rijmwoord",q:"Welk woord rijmt op vis?",focus:"vis",a:["vos","mus","mis"],correct:2,good:"Juist! vis en mis rijmen."},
  {icon:"🌹",title:"Zoek het rijmwoord",q:"Welk woord rijmt op roos?",focus:"roos",a:["doos","ros","reis"],correct:0,good:"Juist! roos en doos rijmen."},
  {icon:"🖊️",title:"Zoek het rijmwoord",q:"Welk woord rijmt op pen?",focus:"pen",a:["pan","hen","pin"],correct:1,good:"Juist! pen en hen rijmen."},
  {icon:"🚌",title:"Zoek het rijmwoord",q:"Welk woord rijmt op mus?",focus:"mus",a:["mes","mis","bus"],correct:2,good:"Juist! mus en bus rijmen."},
  {icon:"🎵",title:"Welk rijmduo?",q:"Bij welk duo klinkt het einde hetzelfde?",a:["maan – haan","maan – man","maan – min"],correct:0,good:"Juist! maan en haan klinken achteraan hetzelfde."},
  {icon:"🎵",title:"Welk rijmduo?",q:"Bij welk duo klinkt het einde hetzelfde?",a:["kat – kit","kat – mat","kat – kam"],correct:1,good:"Juist! kat en mat klinken achteraan hetzelfde."}
];

window.ZISA_FLUENCY_BOOKS["start-leestekens"]=[
  {icon:"🐟",title:"Punt, vraag of uitroep?",q:"Welk leesteken hoort achter deze zin?",focus:"ik zie een vis",punctuation:true,a:["?",".","!"],correct:1,good:"Juist! Dit is een gewone zin. Er hoort een punt achter."},
  {icon:"🐱",title:"Punt, vraag of uitroep?",q:"Welk leesteken hoort achter deze zin?",focus:"is dat een kat",punctuation:true,a:[".","!","?"],correct:2,good:"Juist! Dit is een vraag. Er hoort een vraagteken achter."},
  {icon:"⚠️",title:"Punt, vraag of uitroep?",q:"Welk leesteken hoort achter deze zin?",focus:"pas op",punctuation:true,a:["!","?","."],correct:0,good:"Juist! Dit roep je. Er hoort een uitroepteken achter."},
  {icon:"🐦",title:"Punt, vraag of uitroep?",q:"Welk leesteken hoort achter deze zin?",focus:"de mus is nat",punctuation:true,a:["!",".","?"],correct:1,good:"Juist! Dit is een gewone zin. Er hoort een punt achter."},
  {icon:"👦",title:"Punt, vraag of uitroep?",q:"Welk leesteken hoort achter deze zin?",focus:"waar is sam",punctuation:true,a:["?",".","!"],correct:0,good:"Juist! Dit is een vraag. Er hoort een vraagteken achter."},
  {icon:"🏃",title:"Punt, vraag of uitroep?",q:"Welk leesteken hoort achter deze zin?",focus:"kom snel",punctuation:true,a:[".","?","!"],correct:2,good:"Juist! Dit roep je. Er hoort een uitroepteken achter."}
];

window.ZISA_FLUENCY_BOOKS["start-zinnen"]=[
  {iconImage:"images/start/sam.webp",title:"Sam en de kat",q:"Lees de zin. Welke prent past bij de zin?",text:"sam is bij mam.",pictures:[{src:"images/start/a01.webp",alt:"Sam staat bij mama"},{src:"images/start/a02.webp",alt:"Sam staat bij een meester"},{src:"images/start/a03.webp",alt:"Sam staat alleen"}],correct:0,good:"Juist! Sam staat bij mam."},
  {iconImage:"images/start/kat.webp",title:"Sam en de kat",q:"Lees de zin. Welke prent past bij de zin?",text:"er is een kat.",pictures:[{src:"images/start/a04.webp",alt:"Een kat in de kamer"},{src:"images/start/a05.webp",alt:"Een hond in de kamer"},{src:"images/start/a06.webp",alt:"Een konijn in de kamer"}],correct:0,good:"Juist! Op deze prent staat een kat."},
  {iconImage:"images/start/kat.webp",title:"Sam en de kat",q:"Lees de zin. Welke prent past bij de zin?",text:"de kat zit op de mat.",pictures:[{src:"images/start/a07.webp",alt:"De kat zit op de mat"},{src:"images/start/a08.webp",alt:"De kat zit naast de mat"},{src:"images/start/a09.webp",alt:"De kat zit onder de tafel"}],correct:0,good:"Juist! De kat zit op de mat."},
  {iconImage:"images/start/bal.webp",title:"Sam en de kat",q:"Lees de zin. Welke prent past bij de zin?",text:"sam pakt een bal.",pictures:[{src:"images/start/a10.webp",alt:"Sam pakt een bal"},{src:"images/start/a11.webp",alt:"Sam pakt een boek"},{src:"images/start/a12.webp",alt:"Sam schopt tegen een bal"}],correct:0,good:"Juist! Sam pakt een bal."},
  {iconImage:"images/start/bal.webp",title:"Sam en de kat",q:"Lees de zin. Welke prent past bij de zin?",text:"de bal rolt naar de kat.",pictures:[{src:"images/start/b01.webp",alt:"De bal rolt naar de kat"},{src:"images/start/b02.webp",alt:"De bal rolt weg van de kat"},{src:"images/start/b03.webp",alt:"De bal ligt bij Sam"}],correct:0,good:"Juist! De bal rolt naar de kat."},
  {iconImage:"images/start/kat-bal.webp",title:"Sam en de kat",q:"Lees de zin. Welke prent past bij de zin?",text:"de kat tikt de bal.",pictures:[{src:"images/start/b04.webp",alt:"De kat tikt de bal"},{src:"images/start/b05.webp",alt:"De kat slaapt bij de bal"},{src:"images/start/b06.webp",alt:"De kat kijkt in een boek"}],correct:0,good:"Juist! De kat tikt de bal."},
  {iconImage:"images/start/sam-kat.webp",title:"Sam en de kat",q:"Lees de zin. Welke prent past bij de zin?",text:"sam en mam zien de kat.",pictures:[{src:"images/start/b07.webp",alt:"Sam en mam zien de kat"},{src:"images/start/b08.webp",alt:"Sam en mam zien een hond"},{src:"images/start/b09.webp",alt:"Sam ziet de kat zonder mam"}],correct:0,good:"Juist! Sam en mam zien de kat."},
  {iconImage:"images/start/kat-bal.webp",title:"Sam en de kat",q:"Lees de zin. Welke prent past bij de zin?",text:"wat een dolle kat!",pictures:[{src:"images/start/b10.webp",alt:"De kat springt speels naar de bal"},{src:"images/start/b11.webp",alt:"De kat slaapt"},{src:"images/start/b12.webp",alt:"De kat is boos"}],correct:0,good:"Juist! Dit is een dolle, speelse kat."}
];
