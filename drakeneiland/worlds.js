/* The artwork and progress rules belong to each adventure, independently of maths. */
(function(root) {
  const worlds = {
    tug: {title:'Touwtrekken',tag:'Twee teams · één touw',art:'werelden/tug-left.png',character:'werelden/tug-left.png',unit:'goed antwoord',plural:'goede antwoorden',complete:'touwtrekken gewonnen',mission:'Reken, trek en win de krachtmeting!',story:'Op het sportfeest staan twee teams klaar aan hetzelfde touw. Jullie goede antwoorden geven de spelers trekkracht. Wie voorstaat, trekt het touw naar zijn kant.',action:'Elk goed antwoord telt één keer. Het verschil in goede antwoorden bepaalt hoe ver het touw naar links of rechts schuift.',ending:'Het eerste team dat het ingestelde doel haalt, geeft de beslissende ruk en trekt het andere team over de middenlijn!',names:['Oranje trekkers','Blauwe trekkers','Team 3','Team 4']},
    dragon: { title:'Drakeneiland', tag:'Het geheim van de lichtkristallen', art:'vargos.png', character:'ridder.png', unit:'kristal', plural:'kristallen', complete:'draak verslagen', mission:'Bevrijd de lichtkristallen!', story:'Vargos heeft de lichtkristallen gestolen. Alleen jullie rekenspreuken kunnen zijn schild breken.', action:'Je ridder schiet een spreuk. Het schild barst en een kristal vliegt naar je team.', ending:'De draak geeft zich over met een witte vlag. Je ridder viert feest!', names:['Vuurridders','Waterridders','Bosridders','Sterrenridders'] },
    space: { title:'Ruimteredding', tag:'Een raket naar huis', art:'werelden/space.png', character:'werelden/astronaut.png', unit:'bouwpunt', plural:'bouwpunten', complete:'raket gelanceerd', mission:'Bouw je raket en vlieg naar huis!', story:'De astronauten zitten op een kleine maan. De onderdelen van hun raketten liggen klaar, maar jullie rekenkracht is nodig om ze in elkaar te zetten.', action:'Elk goed antwoord bouwt een stukje van de raket: eerst de motor en de vinnen, dan de cabine en de neuskegel.', ending:'De astronaut stapt in. De motor ontbrandt en de raket stijgt op!', names:['Kometen','Sterrenreizigers','Maanverkenners','Planeetpiloten'], stages:['De motor wordt gebouwd','De vinnen krijgen vorm','De cabine wordt gemonteerd','Het raam en de neus zijn bijna klaar','Klaar voor de lancering!'] },
    ocean: { title:'Schatduikers', tag:'De parels van de lagune', art:'werelden/ocean.png', character:'werelden/diver.png', unit:'parel', plural:'parels', complete:'schatkist gevuld', mission:'Duik naar parels en vul je schatkist!', story:'In de heldere lagune liggen kostbare parels verstopt. De duikers zoeken ze voor het zeefeest. Help jouw duiker om de schatkist te vullen.', action:'Bij een goed antwoord zwemt de duiker naar een parel. Die zweeft naar de kist en blijft daar liggen.', ending:'De volle schatkist schittert. De duiker maakt een vrolijke ereronde!', names:['Zeepaardjes','Koraalduikers','Parelvissers','Golfreizigers'], stages:['De eerste parels zijn gevonden','De parels rollen in de kist','De schatkist vult zich','Nog een paar parels!','De schat is compleet!'] },
    animals: { title:'Dierenredders', tag:'Iedereen veilig thuis', art:'werelden/animals.png', character:'werelden/ranger.png', unit:'dier', plural:'dieren', complete:'dieren veilig thuis', mission:'Breng de verdwaalde dieren naar de opvang!', story:'Na een wilde wind zijn konijnen, vosjes en egeltjes de weg kwijt. Gelukkig staat de dierenopvang klaar. Jullie helpen ze veilig thuis te komen.', action:'Elk goed antwoord helpt een dier naar de opvang. Je ziet het aanlopen en bij de andere dieren gaan staan.', ending:'Alle dieren zijn veilig. Ze lopen met hun verzorger in een feestelijke parade!', names:['Bosvrienden','Dierenvrienden','Pootjesploeg','Natuurhelpers'], stages:['Het eerste dier komt thuis','Steeds meer dieren zijn veilig','De opvang wordt gezellig vol','De laatste dieren komen eraan','Iedereen veilig thuis!'] },
    cake: { title:'De gekke taartenbakkerij', tag:'Een taart voor het grote feest', art:'werelden/cake.png', character:'werelden/baker.png', unit:'bakpunt', plural:'bakpunten', complete:'feesttaart klaar', mission:'Bak en versier jullie feesttaart!', story:'Het feest begint pas als de prachtige taarten klaarstaan. Help de bakkers met een taart vol lagen, glazuur, vruchten en een kaarsje.', action:'Goede antwoorden bouwen de taart van onder naar boven. De bakker roert, de lagen groeien en de versiering verschijnt.', ending:'Het kaarsje gaat aan. De bakker presenteert de taart onder een regen van confetti!', names:['Suikersterren','Roomkloppers','Sprinkelbakkers','Taarttovenaars'], stages:['Het bord en de bodem staan klaar','De onderste taartlaag groeit','Daar komt de tweede laag','Glazuur, fruit en de bovenste laag','Steek het kaarsje aan!'] },
    castle: { title:'Het betoverde kasteel', tag:'Een poort naar het feest', art:'werelden/castle.png', character:'ridder.png', unit:'bouwpunt', plural:'bouwpunten', complete:'kasteel geopend', mission:'Bouw de brug en open het kasteel!', story:'Een betovering heeft het kasteel laten verdwijnen. Elke goede som brengt een stukje terug. Bouw de brug en de torens, zodat de ridders weer naar binnen kunnen.', action:'Eerst verschijnt de brug, daarna de muren en ten slotte de torens. Je ridder komt met elke goede som dichterbij.', ending:'De poort zwaait open. De ridder loopt naar binnen en de vlaggen wapperen!', names:['Brugbouwers','Torenwachters','Poorthelden','Kasteelridders'], stages:['De brug verschijnt','De kasteelmuren komen terug','De poort krijgt vorm','De torens rijzen omhoog','Welkom in het kasteel!'] }
  };
  const animals=['werelden/rabbit.png','werelden/fox.png','werelden/hedgehog.png'];
  function get(id) { return worlds[id] || worlds.dragon; }
  function progress(score,target) { return Math.max(0,Math.min(1,score/target)); }
  function create(team, config) {
    const w=get(config.world), actor=document.createElement('div'); actor.className=`knight world-player world-${config.world}`; actor.style.setProperty('--team',['#df784f','#4b9dc5','#65aa79','#a48ad6'][team.number]);
    const character=config.world==='castle' ? ['ridder.png','ridder-water.png','ridder-bos.png','ridder-ster.png'][team.number] : w.character;
    actor.innerHTML=`<div class="knight-name"></div><div class="world-stage"><img class="world-character" src="${character}" alt="${config.world==='space'?'Astronaut':config.world==='ocean'?'Duiker':config.world==='animals'?'Dierenverzorger':config.world==='cake'?'Bakker':'Ridder'}"><div class="goal-stage"><img class="goal-ghost" src="${w.art}" alt=""><img class="goal-art" src="${w.art}" alt="${w.title}"><div class="goal-collection"></div><div class="rocket-fire"></div><div class="candle-flame"></div><div class="castle-gate"><span></span><span></span></div><div class="castle-flag"></div></div><div class="world-action" role="status"></div><div class="world-particles" aria-hidden="true"></div></div><div class="place-label" hidden></div><div class="world-score"></div><div class="world-progress"><div></div></div><div class="world-stage-label"></div>`;
    actor.querySelector('.knight-name').textContent=team.name;
    team.worldCharacter=character; team.visualCount=0;
    return actor;
  }
  function update(team, state) {
    const w=get(state.config.world), shared=state.config.coop;
    const score=shared?state.teams.reduce((a,t)=>a+t.score,0):team.score;
    const target=state.config.target*(shared?state.config.count:1), p=progress(score,target);
    team.actor.style.setProperty('--progress',p);
    team.actor.querySelector('.world-score').textContent=shared ? `Samen ${score} / ${target} ${w.plural}` : `${score} / ${target} ${w.plural}`;
    team.panel.querySelector('.points').textContent=`${team.score} ${team.score===1?w.unit:w.plural}`;
    team.actor.querySelector('.world-progress div').style.width=`${p*100}%`;
    team.actor.querySelector('.world-stage-label').textContent=w.stages[Math.min(4,Math.floor(p*4))];
    const art=team.actor.querySelector('.goal-art');
    art.style.clipPath=['space','cake','castle'].includes(state.config.world)?`inset(${(1-p)*100}% 0 0 0)`:'none';
    const collection=team.actor.querySelector('.goal-collection');
    if (['ocean','animals'].includes(state.config.world)) {
      // Each team keeps its own collected animals/pearls, also in a shared mission.
      const count=team.score;
      collection.style.setProperty('--collection-rows',Math.max(2,Math.ceil(count/6)));
      while(team.visualCount<count) {
        const n=team.visualCount, item=document.createElement(state.config.world==='animals'?'img':'span');
        item.className=state.config.world==='animals'?'rescued-animal':'collected-pearl';
        if(state.config.world==='animals') { item.src=animals[n%animals.length]; item.alt=['Konijn','Vos','Egel'][n%animals.length]; }
        else {
          // Ten pearls per layer: two rows of five, then stack upwards.
          const layer=Math.floor(n/10), row=Math.floor(n%10/5), column=n%5;
          item.style.left=`${24+column*11+row*8}%`;
          item.style.bottom=`${43+column*1.3-row*5+layer*4}%`;
          item.style.zIndex=String(10+layer*2+row);
          item.dataset.layer=layer;
        }
        item.style.setProperty('--n',n); collection.append(item); team.visualCount++;
      }
    }
  }
  function hit(team, state, points) {
    const w=get(state.config.world);
    team.actor.classList.remove('world-hit'); void team.actor.offsetWidth; team.actor.classList.add('world-hit');
    team.actor.querySelector('.world-action').textContent=`+${points} ${points===1?w.unit:w.plural}!`;
    const particle=document.createElement(state.config.world==='animals'?'img':'span'); particle.className=`reward-flight reward-${state.config.world}`;
    if(state.config.world==='animals') { particle.src=animals[(team.score-1)%3]; particle.alt=''; }
    particle.addEventListener('animationend',()=>particle.remove());team.actor.querySelector('.world-particles').append(particle);
  }
  function celebrate(team,state) {
    const w=get(state.config.world); team.actor.classList.add('world-won');
    team.panel.classList.add('team-finished');
    team.actor.querySelector('.world-stage-label').textContent=w.complete;
    const scene=document.createElement('div');scene.className=`world-finish world-${state.config.world}`;
    scene.innerHTML=`<img class="finish-character" src="${team.worldCharacter}" alt="Feestvierend team"><img class="finish-goal" src="${w.art}" alt="${w.complete}"><strong>${w.complete}!</strong>`;
    team.panel.querySelector('.answers').replaceChildren(scene);
    for(let n=0;n<12;n++) {const confetti=document.createElement('span');confetti.className='world-confetti';confetti.style.setProperty('--n',n);team.actor.querySelector('.world-particles').append(confetti);}
  }
  root.AdventureWorlds={worlds,get,progress,create,update,hit,celebrate};
})(globalThis);
