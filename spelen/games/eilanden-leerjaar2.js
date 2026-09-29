/* Add an island with a unique id and its games here; the map builds itself. */
window.ZisaEilanden = [
  {id:'spelling',title:'Spellingeiland',map:{left:2,top:7,width:43,height:49},description:'Speur, bouw en speel met letters.',games:[
    {title:'Spellingdetective',description:'Luister, schrijf en vind het verdwenen klasdiertje.',url:'spellingeiland/index.html?spel=detective'},
    {title:'De Woordenwerkplaats',description:'Maak woorden en bouw je eigen wagen.',url:'spellingeiland/index.html?spel=workshop'},
    {title:'Zisa’s Zinnenfabriek',description:'Speel met lidwoorden, woordsoorten en zinnen.',url:'zinnenfabriek/index.html'}
  ]},
  {id:'rekenen',title:'Rekeneiland',map:{left:56,top:7,width:43,height:50},description:'Ontdek getallen en reken mee.',games:[
    {title:'Tafelspellen',description:'Oefen de maal- en deeltafels.',url:'tafel_overzicht.html'},
    {title:'Zisa’s Splitsmachine',description:'Oefen splitsingen tot 10, 20 of 100.',url:'splitsmachine/index.html?leerjaar=2'},
    {title:'Zisa’s winkel',description:'Koop, betaal en geef geld terug.',url:'zebrawinkel.html'},
    {title:'Bo en de Wolkentrein',description:'Reis mee met plus- en minsommen tot 20.',url:'../../wolkentrein/?leerjaar=2'},
    {title:'Zisa’s rekenbrug · tot 20',description:'Herken de brug en oefen plus en min tot 20.',url:'rekenbrug-proef/index.html?leerjaar=2',zone:[39,82,24,12]}
  ]},
  {id:'puzzelen',title:'Puzzeleiland',map:{left:24,top:56,width:53,height:40},description:'Denk, probeer en vind de oplossing.',games:[
    {title:'Pentomino Studio',description:'Leg de twaalf puzzelstukken op hun plaats.',url:'../../pentomino_studio_volledige_tool.html?play=1&back=spelen/games/eilanden-leerjaar2.html%23puzzelen'}
  ]}
];
const sceneZones={spelling:[[2,23,38,49],[65,21,34,51],[35,1,31,36]],rekenen:[[4,1,39,42],[56,1,40,42],[4,43,38,38],[57,43,41,39]],puzzelen:[[26,18,49,65]]};
window.ZisaEilanden.forEach(island=>{island.scene??=island.id==='spelling'?'spellingeiland/assets/spelling-interieur-garage.png':sceneZones[island.id]?`spellingeiland/assets/${island.id}-interieur.png`:'spellingeiland/assets/eilandenwereld.png';island.games.forEach((game,i)=>game.zone??=sceneZones[island.id]?.[i]);});
(() => {
  const main=document.querySelector('#islands');
  const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(){
    const selected=window.ZisaEilanden.find(island=>'#'+island.id===location.hash);
    document.body.classList.toggle('inside-island',!!selected);
    document.body.dataset.island=selected?.id||'';
    document.querySelector('.topbar .back').textContent=selected?'← Alle eilanden':'← Ander leerjaar';
    document.querySelector('.topbar .back').href=selected?'#':'start.html';
    if(!selected){main.innerHTML=`<section class="world-canvas" aria-label="Kies een eiland"><img class="world-art" src="spellingeiland/assets/eilandenwereld.png" alt="Drie eilanden in een blauwe zee: een eiland met boeken en letters, een eiland met een telraam en cijfers en een eiland met puzzels en een doolhof."><div class="world-title"><p>Zisa’s eilanden</p><h1>Waar gaan we<br>op avontuur?</h1><span>Tik op een eiland en vaar mee!</span></div>${window.ZisaEilanden.filter(i=>i.map).map(island=>`<a class="island-link world-spot" style="left:${island.map.left}%;top:${island.map.top}%;width:${island.map.width}%;height:${island.map.height}%" href="#${island.id}" aria-label="${esc(island.title)} · ${island.games.length} spellen">${island.art?`<img class="extra-island-art" src="${esc(island.art)}" alt="">`:''}<span class="island-sign"><strong>${esc(island.title)}</strong><small>Ontdek ${island.games.length} ${island.games.length===1?'spel':'spellen'} <b>→</b></small></span></a>`).join('')}</section>${window.ZisaEilanden.some(i=>!i.map)?`<nav class="more-islands" aria-label="Nog meer eilanden">${window.ZisaEilanden.filter(i=>!i.map).map(i=>`<a href="#${i.id}">${esc(i.title)} →</a>`).join('')}</nav>`:''}`;}
    else{main.innerHTML=`<section class="world-canvas destination-canvas" aria-label="${esc(selected.title)}"><img class="world-art" src="${esc(selected.scene)}" alt="Geïllustreerde speelwereld van ${esc(selected.title)}"><div class="scene-caption"><p>Speel mee met Zisa</p><h1>${esc(selected.title)}</h1></div><div class="zisa-guide"><img src="tafels_afbeeldingen/juf_zisa.png" alt="Zisa wijst je de weg"><span>Kies een spel!</span></div>${selected.games.map((game,i)=>{const z=game.zone||[5+i*30,20,28,50];return `<a class="island-link world-spot game-spot" style="left:${z[0]}%;top:${z[1]}%;width:${z[2]}%;height:${z[3]}%" href="${esc(game.url)}" aria-label="${esc(game.title)}"><span class="island-sign"><strong>${esc(game.title)}</strong><small>Spelen →</small></span></a>`;}).join('')}</section>`;}
  }
  addEventListener('hashchange',render);render();
})();
