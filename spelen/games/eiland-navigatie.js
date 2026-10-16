/* Navigation shared by the island games, independent of network access checks. */
(() => {
 const root=new URL('./',document.currentScript.src),here=new URL(location.href),q=here.searchParams;
 const read=k=>{try{return sessionStorage.getItem(k)}catch{return null}},write=(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}};
 const discover=q.get('ontdek')==='1'||(read('zisa_discover_preview')==='1'&&!q.has('code')&&read('zisa_teacher_preview')!=='1'&&read('zisa_colleague_play')!=='1');
 const discoverHome=new URL('../../ontdek/zisa-spelen.html',root).href;
 const mapGrade=/\/(?:eilanden-leerjaar([12])|start_leerjaar(1))\.html$/.exec(here.pathname),isMap=!!mapGrade;
 const families=[
  ...['splits_spelletjes.html','splitsen_bibi.html','splits_bijenkorf.html','splits_bingo.html','honingpot.html'].map(path=>({island:'splitsen',grade:1,path,entry:path==='splits_bijenkorf.html'?'splitsen_bibi.html':path})),
  ...['spelletjes_hoofdrekenen1.html','bloemenweide_keuze.html','bloemenweide_spel.html','honingpot_vullen_keuze.html','honingpot_vullen_spel.html','bijenrace_keuze.html','bijenrace_spel.html','bibi-winkel.html'].map(path=>({island:'rekenen',grade:1,path,entry:path.replace('_spel.html','_keuze.html')})),
  {island:'rekenen',grade:1,path:'bibi-dagen/',entry:'bibi-dagen/index.html'},
  {island:'rekenen',path:'rekenbrug-proef/',entry:'rekenbrug-proef/index.html'},
  {island:'spelling',grade:2,path:'spellingeiland/',entry:'spellingeiland/index.html'},
  {island:'spelling',grade:2,path:'zinnenfabriek/',entry:'zinnenfabriek/index.html'},
  {island:'rekenen',path:'splitsmachine/',entry:'splitsmachine/index.html?leerjaar=2'},
  ...['tafel_overzicht.html','tafel_spelletjes.html','tafel_oefenen.html','tafels.html','memory.html','vierop1rij.html','level1.html','level2.html','level3.html'].map(path=>({island:'rekenen',path,entry:path.startsWith('level')?'tafel_oefenen.html':path})),
  {island:'rekenen',path:'zebrawinkel.html',entry:'zebrawinkel.html'},
  {island:'rekenen',path:'../../wolkentrein/',entry:'../../wolkentrein/?leerjaar=2'},
  {island:'puzzelen',path:'../../pentomino_studio_volledige_tool.html',entry:'../../pentomino_studio_volledige_tool.html?play=1'}
 ];
 const family=families.find(f=>f.path.endsWith('/')?here.pathname.startsWith(new URL(f.path,root).pathname):here.pathname===new URL(f.path,root).pathname);
 if(!isMap&&!family)return;
 const local=['localhost','127.0.0.1'].includes(location.hostname);
 const explicit=q.get('eiland');let context;try{context=JSON.parse(read('zisa_island_context')||'null')}catch{}
 const grade=Number(mapGrade?.[1]||mapGrade?.[2]||family?.grade||q.get('leerjaar')||document.body?.dataset.grade||read('zisa_play_grade')||2);
 if(![1,2].includes(grade))return;
 const mapURL=new URL(grade===1?'start_leerjaar1.html':'eilanden-leerjaar2.html',root);
 const dedicated=family?.path==='spellingeiland/'||family?.path==='zinnenfabriek/';
 if(family?.path.includes('pentomino')&&q.get('play')!=='1')return;
 const island=grade===1&&family?.path==='splitsmachine/'?'splitsen':family?.island;write('zisa_play_grade',String(grade));write('zisa_island_context',JSON.stringify({grade,island:island||null}));
 if(!isMap){here.searchParams.set('eiland',island);here.searchParams.set('leerjaar',grade);history.replaceState(history.state,'',here);}
 const names=grade===1?{splitsen:'de splitskorf',rekenen:'het rekenhuis',puzzelen:'de puzzelweide',spelling:'het letterhuis'}:{spelling:'Spellingeiland',rekenen:'Rekeneiland',puzzelen:'Puzzeleiland'};
 function gradeURL(){const u=new URL('../index.html',root);if(local)u.searchParams.set('preview','1');if(q.get('code'))u.searchParams.set('code',q.get('code'));return u.href;}
 function hasOtherGrade(){try{const grades=JSON.parse(read('zisa_play_grades')||'null');return !Array.isArray(grades)||grades.some(g=>Number(g)!==grade)}catch{return true}}
 function decorate(url,id){url.searchParams.set('eiland',id);url.searchParams.set('leerjaar',grade);if(discover)url.searchParams.set('ontdek','1');return url;}
 function ready(){
  document.documentElement.classList.add('zisa-island-navigation');
  const css=document.createElement('style');
  css.textContent=`.zisa-island-navigation #zisaNavButton,.zisa-island-navigation #zisaNavPanel,.zisa-island-navigation .zisa-old-exit{display:none!important}#island-navigation{position:static;display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin:12px 0;padding:0;flex-shrink:0;grid-column:1/-1}#island-navigation button{position:static!important;min-height:44px;padding:10px 16px;border:2px solid #d7bd75;border-radius:12px;background:#fff8e7;color:#174e48;font:700 16px Arial;cursor:pointer;touch-action:manipulation}#island-navigation [hidden]{display:none!important}.zisa-island-navigation .pijl-links-boven,.zisa-island-navigation .spel-links:has(#island-navigation){position:static!important;inset:auto!important}.zisa-island-navigation #island-navigation[hidden]{display:none!important}`;
  document.head.append(css);
  const nav=document.createElement('nav');nav.id='island-navigation';nav.setAttribute('aria-label','Teruggaan');
  const back=document.createElement('button');back.type='button';back.textContent='← Terug';
  const other=document.createElement('button');other.type='button';other.textContent='🏝️ Ander eiland';nav.append(back,other);
  const previous={
    'tafel_spelletjes.html':'tafel_overzicht.html',
    'tafel_oefenen.html':'tafel_overzicht.html',
    'tafels.html':'tafel_spelletjes.html',
    'memory.html':'tafel_spelletjes.html','vierop1rij.html':'tafel_spelletjes.html',
    'level1.html':'tafel_oefenen.html','level2.html':'tafel_oefenen.html','level3.html':'tafel_oefenen.html',
    'bloemenweide_keuze.html':mapURL.href+'#sommen',
    'honingpot_vullen_keuze.html':mapURL.href+'#sommen',
    'bijenrace_keuze.html':mapURL.href+'#sommen'
  };
  const file=here.pathname.split('/').pop();
  const settingsSelector='#settingsPanel,#menuPanel,#keuzeScherm,#keuzescherm,#settings,#setup,.setup-shell';
  const exitSelector='.topbar .back,.choice-head .previous,.btn-terug,#backLink,#menuLink,#otherGames,#changeGame,#otherButton,#changeButton,#finishChangeButton,#backButton,#back,#choose,#menu,#setup-back,#world-stop,#stop,[data-island-menu]';
  function visible(el){
    if(!el)return false;
    // Our duplicate marker affects only the control, not its screen's visibility.
    for(let node=el;node&&node!==document.body;node=node.parentElement){
      if(node.hidden||node.classList.contains('hidden')||node.style.display==='none')return false;
      if(node!==el&&getComputedStyle(node).display==='none')return false;
    }
    return true;
  }
  let nativeBack=null,playing=false;
  function sync(){
    const settings=[...document.querySelectorAll(settingsSelector)].find(visible);
    const world=document.body.dataset.view==='world'?document.querySelector('#adventure-root'):null;
    const game=world||[...document.querySelectorAll('#gamePanel,#finishPanel,#spelScherm,#game,#finish')].find(visible);
    const exits=[...document.querySelectorAll(exitSelector)].filter(el=>el.matches('a,button')&&!nav.contains(el));
    nativeBack=exits.find(el=>visible(el)&&!el.closest(settingsSelector)&&(
      ['changeButton','finishChangeButton','otherButton','backButton','back','choose','menu','knopKiezen','world-stop','stop'].includes(el.id)||
      el.closest('#spelScherm,#gamePanel,#finishPanel,#game,#finish,#knoppen-links')||
      /_keuze\.html/.test(el.getAttribute('href')||'')
    ));
    playing=!isMap&&!settings&&!!(game||nativeBack||/_spel\.html$/.test(file));
    exits.forEach(el=>{if(!el.classList.contains('zisa-old-exit'))el.classList.add('zisa-old-exit')});
    const hideOther=playing||isMap||discover;if(other.hidden!==hideOther)other.hidden=hideOther;
    const label=isMap&&!location.hash?'← Ander leerjaar':'← Terug';if(back.textContent!==label)back.textContent=label;
    const hideNav=isMap&&!location.hash&&!discover&&!hasOtherGrade();if(nav.hidden!==hideNav)nav.hidden=hideNav;
    const setupBack=document.querySelector('#setup-back');
    const anchor=playing&&nativeBack?nativeBack:settings&&setupBack?setupBack:null;
    const host=anchor?.parentElement||settings||document.querySelector('main,.container')||document.body;
    if(anchor){if(nav.parentElement!==host||nav.nextElementSibling!==anchor)host.insertBefore(nav,anchor)}
    else if(nav.parentElement!==host)host.prepend(nav);
  }
  back.onclick=()=>{
    window.speechSynthesis?.cancel();
    if(playing&&['world-stop','stop'].includes(nativeBack?.id)){window.dispatchEvent(new Event('zisa:game-settings'));return;}
    if(playing&&nativeBack){nativeBack.click();return;}
    const destination=discover?discoverHome:isMap?(location.hash?mapURL.href:gradeURL()):playing?decorate(new URL(family.entry,root),island).href:new URL(previous[file]||mapURL.href+'#'+island,root).href;
    location.assign(destination);
  };
  other.onclick=()=>{window.speechSynthesis?.cancel();location.assign(mapURL.href)};
  function updateLinks(){
    document.querySelectorAll('a[href]').forEach(a=>{
      if(a.classList.contains('zisa-old-exit'))return;
      let u;try{u=new URL(a.href)}catch{return}if(u.origin!==location.origin)return;
      const f=families.find(f=>f.path.endsWith('/')?u.pathname.startsWith(new URL(f.path,root).pathname):u.pathname===new URL(f.path,root).pathname);
      if(f){const next=decorate(u,grade===1&&f.path==='splitsmachine/'?'splitsen':f.island).href;if(a.href!==next)a.href=next;}
    });sync();
  }
  updateLinks();addEventListener('hashchange',updateLinks);addEventListener('zisa:access-updated',sync);
  new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class','open']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
