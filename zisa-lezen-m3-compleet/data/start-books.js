window.ZISA_BOOKS=window.ZISA_BOOKS||[];
window.ZISA_BOOKS.unshift(
  {id:"start-maan",level:"START",title:"Ik lees: maan",blurb:"Bouw woorden, zoek rijm en kies het goede leesteken.",cover:"images/zisa-leest.png",startBook:true,pages:[]},
  {id:"start-vis",level:"START",title:"Ik lees: vis",blurb:"Speel met klanken, rijmwoorden en leestekens.",cover:"images/zisa-leest.png",startBook:true,pages:[]}
);
window.ZISA_FLUENCY_BOOKS=window.ZISA_FLUENCY_BOOKS||{};
window.ZISA_FLUENCY_BOOKS["start-maan"]=[
  {icon:"🚂",title:"Maak het woord",q:"Tik op elk stukje. Maak daarna het woord.",chunks:["m","aa","n"],word:"maan"},
  {icon:"👀",title:"Zoek hetzelfde woord",q:"Tik precies hetzelfde woord aan.",focus:"maan",a:["haan","maan","baan"],correct:1,good:"Juist! Dit is maan."},
  {icon:"🎵",title:"Zoek het rijmwoord",q:"Welk woord rijmt op maan?",focus:"maan",a:["man","haan","min"],correct:1,good:"Juist! maan en haan rijmen."},
  {icon:"🎵",title:"Zoek het rijmwoord",q:"Welk woord rijmt op baan?",focus:"baan",a:["ban","ben","maan"],correct:2,good:"Juist! baan en maan rijmen."},
  {icon:"🎵",title:"Welk rijmduo?",q:"Bij welk duo klinkt het einde hetzelfde?",a:["maan – haan","maan – man","maan – min"],correct:0,good:"Juist! maan en haan klinken achteraan hetzelfde."},
  {icon:"✏️",title:"Kies het leesteken",q:"Welk leesteken hoort achter deze zin?",focus:"ik zie de maan",punctuation:true,a:["?",".","!"],correct:1,good:"Juist! Dit is een gewone zin. Er hoort een punt achter."},
  {icon:"❓",title:"Kies het leesteken",q:"Welk leesteken hoort achter deze zin?",focus:"is dat de maan",punctuation:true,a:[".","!","?"],correct:2,good:"Juist! Dit is een vraag. Er hoort een vraagteken achter."}
];
window.ZISA_FLUENCY_BOOKS["start-vis"]=[
  {icon:"🚂",title:"Maak het woord",q:"Tik op elk stukje. Maak daarna het woord.",chunks:["v","i","s"],word:"vis"},
  {icon:"👀",title:"Zoek hetzelfde woord",q:"Tik precies hetzelfde woord aan.",focus:"vis",a:["vos","vis","mis"],correct:1,good:"Juist! Dit is vis."},
  {icon:"🎵",title:"Zoek het rijmwoord",q:"Welk woord rijmt op vis?",focus:"vis",a:["vos","mus","mis"],correct:2,good:"Juist! vis en mis rijmen."},
  {icon:"🎵",title:"Zoek het rijmwoord",q:"Welk woord rijmt op mis?",focus:"mis",a:["mus","is","mes"],correct:1,good:"Juist! mis en is rijmen."},
  {icon:"🎵",title:"Welk rijmduo?",q:"Bij welk duo klinkt het einde hetzelfde?",a:["vis – vos","vis – mis","vis – mus"],correct:1,good:"Juist! vis en mis klinken achteraan hetzelfde."},
  {icon:"✏️",title:"Kies het leesteken",q:"Welk leesteken hoort achter deze zin?",focus:"de vis zwemt",punctuation:true,a:["!",".","?"],correct:1,good:"Juist! Dit is een gewone zin. Er hoort een punt achter."},
  {icon:"❓",title:"Kies het leesteken",q:"Welk leesteken hoort achter deze zin?",focus:"waar is de vis",punctuation:true,a:["?",".","!"],correct:0,good:"Juist! Dit is een vraag. Er hoort een vraagteken achter."}
];
