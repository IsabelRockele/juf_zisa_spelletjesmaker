window.ZISA_BOOKS=window.ZISA_BOOKS||[];
window.ZISA_BOOKS.unshift(
  {id:"start-zoemen",level:"START",title:"Zoemend lezen",blurb:"Lees klanken na elkaar en plak ze samen tot een woord.",coverIcon:"🚂",coverTone:"blue",startBook:true,pages:[]},
  {id:"start-rijmen",level:"START",title:"Rijmen maar!",blurb:"Luister goed en zoek woorden met hetzelfde einde.",coverIcon:"🎵",coverTone:"pink",startBook:true,pages:[]},
  {id:"start-leestekens",level:"START",title:"Punt, vraag of uitroep?",blurb:"Kies het leesteken dat bij de korte zin hoort.",coverIcon:"✏️",coverTone:"yellow",startBook:true,pages:[]},
  {id:"start-zinnen",level:"START",title:"Mijn eerste zinnen",blurb:"Lees een klein verhaal met korte zinnen en veel MKM-woorden.",coverIcon:"🐱",coverTone:"green",startBook:true,pages:[]}
);

window.ZISA_FLUENCY_BOOKS=window.ZISA_FLUENCY_BOOKS||{};
const zoomOpdracht="Tik op Start met zoemen. Lees elke klank zoemend zolang je ze ziet. Lees daarna het hele woord.";

window.ZISA_FLUENCY_BOOKS["start-zoemen"]=[
  {icon:"🌙",title:"Zoem en plak",q:zoomOpdracht,chunks:["m","aa","n"],word:"maan"},
  {icon:"🐟",title:"Zoem en plak",q:zoomOpdracht,chunks:["v","i","s"],word:"vis"},
  {icon:"🐱",title:"Zoem en plak",q:zoomOpdracht,chunks:["k","a","t"],word:"kat"},
  {icon:"🚌",title:"Zoem en plak",q:zoomOpdracht,chunks:["b","u","s"],word:"bus"},
  {icon:"🖊️",title:"Zoem en plak",q:zoomOpdracht,chunks:["p","e","n"],word:"pen"},
  {icon:"🌹",title:"Zoem en plak",q:zoomOpdracht,chunks:["r","oo","s"],word:"roos"},
  {icon:"🐱",title:"Lees en kies",q:"Lees de woorden. Welk woord hoort bij de prent?",a:["kat","kam","kan"],correct:0,good:"Juist! Bij de prent hoort kat."},
  {icon:"🌹",title:"Lees en kies",q:"Lees de woorden. Welk woord hoort bij de prent?",a:["room","roos","rook"],correct:1,good:"Juist! Bij de prent hoort roos."}
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
  {icon:"👦",title:"Sam en de kat",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"sam is bij mam.",tip:"Lees rustig tot aan de punt."},
  {icon:"🐱",title:"Sam en de kat",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"er is een kat.",tip:"Wijs elk woord aan."},
  {icon:"🧶",title:"Sam en de kat",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"de kat zit op de mat.",tip:"Lees woord voor woord."},
  {icon:"⚽",title:"Sam en de kat",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"sam pakt een bal.",tip:"Stop kort bij de punt."},
  {icon:"⚽",title:"Sam en de kat",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"de bal rolt naar de kat.",tip:"Lees de hele zin rustig."},
  {icon:"🐾",title:"Sam en de kat",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"de kat tikt de bal.",tip:"Wijs elk woord aan."},
  {icon:"😄",title:"Sam en de kat",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"sam en mam zien de kat.",tip:"Stop kort bij de punt."},
  {icon:"🐱",title:"Sam en de kat",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"wat een dolle kat!",tip:"Lees dit als een vrolijke uitroep."}
];
