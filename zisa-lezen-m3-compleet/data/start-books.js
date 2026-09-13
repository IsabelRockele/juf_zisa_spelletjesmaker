window.ZISA_BOOKS=window.ZISA_BOOKS||[];
window.ZISA_BOOKS.unshift(
  {id:"start-maan",level:"START",title:"Ik lees: maan",blurb:"Bouw woorden, zoek rijm en lees een klein zinnetje.",cover:"images/zisa-leest.png",startBook:true,pages:[]},
  {id:"start-vis",level:"START",title:"Ik lees: vis",blurb:"Speel met klanken en lees je eerste woorden.",cover:"images/zisa-leest.png",startBook:true,pages:[]}
);
window.ZISA_FLUENCY_BOOKS=window.ZISA_FLUENCY_BOOKS||{};
window.ZISA_FLUENCY_BOOKS["start-maan"]=[
  {icon:"🚂",title:"Maak het woord",q:"Tik op elk stukje. Maak daarna het woord.",chunks:["m","aa","n"],word:"maan"},
  {icon:"👀",title:"Zoek hetzelfde woord",q:"Tik precies hetzelfde woord aan.",focus:"maan",a:["haan","maan","baan"],correct:1,good:"Juist! Dit is maan."},
  {icon:"🎵",title:"Rijmduo",q:"Welk woord rijmt op maan?",focus:"maan",a:["haan","man","min"],correct:0,good:"Juist! maan en haan rijmen."},
  {icon:"🌙",title:"Mijn eerste zinnen",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"ik zie de maan.\nde maan is geel.",tip:"Wijs mee met je vinger."}
];
window.ZISA_FLUENCY_BOOKS["start-vis"]=[
  {icon:"🚂",title:"Maak het woord",q:"Tik op elk stukje. Maak daarna het woord.",chunks:["v","i","s"],word:"vis"},
  {icon:"👀",title:"Zoek hetzelfde woord",q:"Tik precies hetzelfde woord aan.",focus:"vis",a:["vos","vis","mis"],correct:1,good:"Juist! Dit is vis."},
  {icon:"🎵",title:"Rijmduo",q:"Welk woord rijmt op vis?",focus:"vis",a:["mis","vos","mus"],correct:0,good:"Juist! vis en mis rijmen."},
  {icon:"🐟",title:"Mijn eerste zinnen",q:"Luister als je hulp wilt. Lees daarna zelf.",text:"ik zie een vis.\nde vis is in zee.",tip:"Lees rustig tot aan de punt."}
];
