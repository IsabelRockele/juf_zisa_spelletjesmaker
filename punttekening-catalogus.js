(function(){
  const host=document.getElementById('puntCatalogus');if(!host)return;
  const ontdek=location.pathname.replace(/\\/g,'/').includes('/ontdek/'),vrij=new Set(['school','dieren','zee']);
  const themes=[
    ['school','School',[['rugzak','Rugzak'],['potlood','Potlood']]],['dieren','Dieren',[['olifant','Olifant'],['schildpad','Schildpad']]],
    ['boerderij','Boerderij',[['tractor','Tractor'],['kip','Kip']]],['zee','Zee',[['vis','Vis'],['zeilboot','Zeilboot']]],
    ['ruimte','Ruimte',[['raket','Raket'],['planeet','Planeet']]],['sprookjes','Sprookjes',[['kasteel','Kasteel'],['draak','Draak']]],
    ['seizoenen','Seizoenen',[['paraplu','Paraplu'],['sneeuwman','Sneeuwman']]],['feesten','Feesten',[['kerstboom','Kerstboom'],['paasei','Paasei']]],
    ['vervoer','Vervoer',[['auto','Auto'],['luchtballon','Luchtballon']]],['natuur','Natuur',[['bloem','Bloem'],['boom','Boom']]]
  ];
  host.innerHTML='<div class="catalogus-kop"><strong>Of kies uit de catalogus</strong><small></small></div><div class="catalogus-themas" role="tablist"></div><div class="catalogus-beelden"></div>';
  const tabs=host.querySelector('.catalogus-themas'),grid=host.querySelector('.catalogus-beelden');
  host.querySelector('small').textContent=ontdek?'Drie thema’s kun je gratis ontdekken. De andere horen bij PRO.':'Kies een thema en daarna een afbeelding.';
  function show(theme){const [id,label,items]=theme,locked=ontdek&&!vrij.has(id);tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.theme===id));grid.innerHTML='';items.forEach(([slug,name])=>{const b=document.createElement('button');b.type='button';b.className='catalogus-kaart'+(locked?' locked':'');b.innerHTML=`<span class="catalogus-thumb"><img src="/punttekeningen/catalogus/${slug}.png" alt="${name}"></span><span>${name}</span>${locked?'<b>🔒 PRO</b>':''}`;b.addEventListener('click',()=>{if(locked){document.getElementById('status').textContent=`Het thema ${label} is beschikbaar in PRO. In Ontdek kun je School, Dieren en Zee gebruiken.`;return}window.dispatchEvent(new CustomEvent('zisa:catalog-image',{detail:{src:`/punttekeningen/catalogus/${slug}.png`,name:slug,label:name}}))});grid.appendChild(b)})}
  themes.forEach(theme=>{const b=document.createElement('button');b.type='button';b.dataset.theme=theme[0];b.innerHTML=`${theme[1]}${ontdek&&!vrij.has(theme[0])?' <span>PRO</span>':''}`;b.addEventListener('click',()=>show(theme));tabs.appendChild(b)});show(themes[0]);
})();
