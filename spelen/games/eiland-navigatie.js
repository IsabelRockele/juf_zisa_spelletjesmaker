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
  const css=document.createElement('style');css.textContent=`.zisa-island-navigation #zisaNavButton,.zisa-island-navigation #zisaNavPanel{display:none!important}#island-menu-button{position:fixed;right:12px;top:86px;z-index:2147483002;border:2px solid #d7bd75;border-radius:15px;background:#fff8e7;color:#174e48;padding:10px 15px;min-height:46px;font:700 16px Arial;touch-action:manipulation;box-shadow:0 3px 12px #173e4533}#island-menu{padding:22px;border:3px solid #dfc281;border-radius:24px;background:#fffaf0;color:#244c51;width:min(390px,calc(100vw - 32px));max-height:90dvh;font:17px Arial;box-sizing:border-box;z-index:2147483003}#island-menu::backdrop{background:#153c5277}#island-menu h2{margin:0 0 16px;font-size:25px}#island-menu a,#island-menu button{box-sizing:border-box;display:block;text-decoration:none;text-align:center;width:100%;padding:13px 8px;margin:9px 0 0;min-height:46px;border:0;border-radius:12px;background:#e0eee5;color:#17564d;font:700 16px Arial;touch-action:manipulation}#island-menu .nav-choice{display:grid;grid-template-columns:minmax(0,1fr)52px;gap:8px;margin-top:9px}#island-menu .nav-choice>a,#island-menu .nav-choice>button{margin:0;min-height:52px}#island-menu .nav-choice .nav-speak{background:#fff0c3;border:2px solid #d7bd75;padding:8px}#island-menu .nav-speak img{display:block;margin:auto;object-fit:contain}#island-menu .continue{background:#176f59;color:white}#island-menu [hidden]{display:none!important}@media(max-width:600px){#island-menu-button{right:8px;font-size:15px;padding:8px 12px}}.zisa-island-navigation .topbar .back,.zisa-island-navigation .choice-head .previous,.zisa-island-navigation .btn-terug,.zisa-island-navigation #backLink,.zisa-island-navigation #menuLink,.zisa-island-navigation #otherGames,.zisa-island-navigation #changeGame,.zisa-island-navigation #otherButton{display:none!important}[data-island-menu]{border:2px solid #d7bd75!important;border-radius:15px!important;background:#fff8e7!important;color:#174e48!important;padding:10px 15px!important;min-height:46px!important;font:700 16px Arial!important;cursor:pointer}`;
  document.head.append(css);const button=document.createElement('button');button.id='island-menu-button';button.type='button';button.textContent='← Terug';button.setAttribute('aria-haspopup','dialog');
  const dialog=document.createElement('dialog');dialog.id='island-menu';dialog.setAttribute('aria-labelledby','island-menu-title');dialog.innerHTML='<h2 id="island-menu-title">Waar wil je naartoe?</h2>';
  function link(label,url,id){const a=document.createElement('a');a.textContent=label;a.href=url;if(id)a.id=id;dialog.append(a);return a;}
  if(family){const entry=new URL(family.entry,root);if(family.path==='spellingeiland/'&&['detective','workshop'].includes(q.get('spel')))entry.searchParams.set('spel',q.get('spel'));link('Keuzes van dit spel',decorate(entry,island).href,'island-game-choices');if(!discover)link((grade===1?'Spellen bij ':'Spellen op ')+names[island],mapURL.href+'#'+island,'island-siblings');}
  link(discover?'← Terug naar de Ontdek-spellen':grade===1?'Bibi’s wereld':'Alle eilanden',discover?discoverHome:mapURL.href,'island-all');const grades=link('Ander leerjaar',gradeURL(),'island-grades');grades.hidden=discover||!hasOtherGrade();
  const close=document.createElement('button');close.className='continue';close.textContent='Verder spelen';dialog.append(close);document.body.append(button,dialog);
  const speaker=new URL('spellingeiland/assets/luidspreker.png',root).href;
  for(const choice of [...dialog.querySelectorAll('a,button')]){const row=document.createElement('div');row.className='nav-choice';row.hidden=choice.hidden;choice.before(row);row.append(choice);const listen=document.createElement('button');listen.type='button';listen.className='nav-speak';listen.setAttribute('aria-label','Luister: '+choice.textContent);listen.innerHTML='<img src="'+speaker+'" alt="" width="28" height="28">';listen.onclick=()=>{if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(choice.textContent);voice.lang='nl-BE';voice.rate=.82;speechSynthesis.speak(voice);};row.append(listen);}
  function updateGradeChoice(){grades.hidden=discover||!hasOtherGrade();grades.parentElement.hidden=grades.hidden;}
  button.onclick=()=>{if(dialog.open)return;window.dispatchEvent(new CustomEvent('zisa:navigation-open'));window.dispatchEvent(new Event('blur'));if('speechSynthesis'in window)speechSynthesis.cancel();dialog.showModal();};close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{window.dispatchEvent(new CustomEvent('zisa:navigation-close'));button.focus();});
  dialog.addEventListener('keydown',e=>e.stopPropagation());
  document.addEventListener('keydown',e=>{if(dialog.open&&e.key!=='Escape'&&e.key!=='Tab'&&!dialog.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}},true);
  window.addEventListener('zisa:access-updated',()=>{updateGradeChoice();refreshMapBack();});
  function refreshMapBack(){if(!isMap)return;const back=document.querySelector('.topbar .back');if(back&&!location.hash){back.textContent=hasOtherGrade()?'Ander leerjaar':'Spelmenu';back.href=hasOtherGrade()?gradeURL():new URL('start_leerjaar'+grade+'.html',root).href;}}
  function updateLinks(){document.querySelectorAll('a[href]').forEach(a=>{if(dialog.contains(a))return;let u;try{u=new URL(a.href)}catch{return}if(u.origin!==location.origin)return;const f=families.find(f=>f.path.endsWith('/')?u.pathname.startsWith(new URL(f.path,root).pathname):u.pathname===new URL(f.path,root).pathname);if(f)a.href=decorate(u,grade===1&&f.path==='splitsmachine/'?'splitsen':f.island).href;else if(family&&u.pathname===new URL('start_leerjaar'+grade+'.html',root).pathname)a.href=mapURL.href+'#'+island;});refreshMapBack();}
  updateLinks();addEventListener('hashchange',updateLinks);
  // Logos and legacy exit controls use the same route picker, never a different exit.
  document.addEventListener('click',e=>{const exit=e.target.closest('[data-island-menu],.topbar a.brand,#brand');if(exit){e.preventDefault();e.stopImmediatePropagation();button.click();}},true);

  const observer=new MutationObserver(()=>document.querySelectorAll('dialog[open]:not(#island-menu)').forEach(d=>{if(d.querySelector('[data-island-menu]'))return;const b=document.createElement('button');b.type='button';b.dataset.islandMenu='1';b.textContent='← Terug';b.onclick=()=>button.click();d.append(b);}));observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
