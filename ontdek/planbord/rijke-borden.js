(function () {
  const PAD = 'assets/icons/';
  const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

  function node(doc, tag, klasse, tekst) {
    const element = doc.createElement(tag);
    if (klasse) element.className = klasse;
    if (tekst != null) element.textContent = tekst;
    return element;
  }

  function icoon(doc, naam, alt = '') {
    const img = node(doc, 'img', 'rijk-icoon');
    img.src = PAD + naam + '.png?schoon=34';
    img.alt = alt;
    return img;
  }

  function bewerkbaar(element, object, sleutel, bewerken, wijzig) {
    if (!bewerken) return element;
    const grootteSleutel=`${sleutel}Grootte`;if(object[grootteSleutel])element.style.fontSize=`${object[grootteSleutel]}px`;
    element.contentEditable = 'true';
    element.spellcheck = true;
    element.title = 'Klik om de tekst te wijzigen';
    element.addEventListener('input', () => {
      object[sleutel] = element.innerText.trim();
      wijzig();
    });
    element.addEventListener('focus',()=>toonTekstgereedschap(element,object,grootteSleutel,wijzig));
    return element;
  }

  function toonTekstgereedschap(element,object,sleutel,wijzig){
    const doc=element.ownerDocument;doc.querySelector('.tekstgereedschap')?.remove();const balk=node(doc,'div','tekstgereedschap');
    const min=node(doc,'button','','A−'),maat=node(doc,'span','',`${Math.round(parseFloat(getComputedStyle(element).fontSize))} px`),plus=node(doc,'button','','A+');
    const pasAan=delta=>{const huidig=object[sleutel]||Math.round(parseFloat(getComputedStyle(element).fontSize));object[sleutel]=Math.max(10,Math.min(100,huidig+delta));element.style.fontSize=`${object[sleutel]}px`;maat.textContent=`${object[sleutel]} px`;wijzig();};
    min.type=plus.type='button';min.onpointerdown=e=>{e.preventDefault();pasAan(-2);};plus.onpointerdown=e=>{e.preventDefault();pasAan(2);};balk.append(min,maat,plus);doc.body.appendChild(balk);
    const rect=element.getBoundingClientRect();balk.style.left=`${Math.max(8,rect.left)}px`;balk.style.top=`${Math.max(8,rect.top-45)}px`;
    setTimeout(()=>doc.addEventListener('pointerdown',function sluit(e){if(!balk.contains(e.target)&&e.target!==element){balk.remove();doc.removeEventListener('pointerdown',sluit);}},true),0);
  }

  function verwijderKnop(doc, actie, bewerken) {
    if (!bewerken) return null;
    const knop = node(doc, 'button', 'rijk-verwijder', '×');
    knop.type = 'button';
    knop.title = 'Verwijderen';
    knop.addEventListener('click', actie);
    return knop;
  }

  function injecteerStijl(doc) {
    if (doc.getElementById('rijke-borden-stijl')) return;
    const stijl = node(doc, 'style');
    stijl.id = 'rijke-borden-stijl';
    stijl.textContent = `
      .rijk-bord { position:absolute; inset:0; overflow:visible; padding:28px 34px; color:#30304c; background:linear-gradient(145deg,#fffef9,#f6f3ff); font-family:Nunito,Segoe UI,sans-serif; }
      .rijk-bord * { box-sizing:border-box; }
      .vrije-laag { position:absolute; inset:0; z-index:50; pointer-events:none; }
      .vrij-element { position:absolute; min-width:80px; min-height:60px; pointer-events:auto; touch-action:none; user-select:none; }
      .vrij-element.geselecteerd { outline:3px solid #6653bd; outline-offset:3px; border-radius:10px; }
      .vrij-element-afbeelding img { width:100%; height:100%; object-fit:contain; pointer-events:none; }
      .vrij-element-tekst { display:flex; align-items:center; padding:12px; border-radius:12px; color:#3d315f; background:rgba(255,255,255,.92); box-shadow:0 5px 16px rgba(45,35,88,.15); font-weight:900; }
      .vrij-element-tekst .vrije-tekst { width:100%; outline:0; user-select:text; touch-action:auto; white-space:pre-wrap; }
      .vrij-werkbalk { position:absolute; z-index:5; left:0; top:-45px; display:none; align-items:center; gap:5px; height:38px; padding:5px; border-radius:10px; color:#fff; background:#514394; box-shadow:0 5px 14px rgba(32,24,72,.3); white-space:nowrap; }
      .geselecteerd > .vrij-werkbalk { display:flex; }
      .vrij-werkbalk button { min-width:28px; height:28px; padding:2px 7px; border:0; border-radius:7px; color:#463889; background:#fff; font-weight:900; cursor:pointer; }
      .vrij-rotatie { display:flex; align-items:center; gap:4px; padding:0 5px; color:#fff; font-size:12px; font-weight:900; }
      .vrij-rotatie input { width:145px; accent-color:#efc648; cursor:ew-resize; }
      .vrij-rotatie-uitvoer { min-width:38px; text-align:right; color:#fff; font-variant-numeric:tabular-nums; }
      .vrij-sleepgreep { padding:4px 7px; cursor:grab; font-weight:900; }
      .vrij-formaatgreep { position:absolute; right:-11px; bottom:-11px; display:none; width:25px; height:25px; border:3px solid #fff; border-radius:50%; background:#6653bd; box-shadow:0 2px 7px rgba(0,0,0,.25); cursor:nwse-resize; }
      .geselecteerd > .vrij-formaatgreep { display:block; }
      .vrij-timer { display:grid; place-items:center; align-content:center; padding:12px; border:2px solid #d7d0f3; border-radius:20px; background:#fff; box-shadow:0 8px 24px rgba(48,38,96,.2); }
      .vrij-timer-display { color:#44368e; font-size:42px; line-height:1; font-weight:900; font-variant-numeric:tabular-nums; }
      .vrij-timer-knoppen { display:flex; gap:6px; margin-top:12px; }
      .vrij-timer-knoppen button { border:0; border-radius:8px; padding:7px 9px; color:#fff; background:#6653bd; font-weight:800; cursor:pointer; }
      .rijk-titel { margin:0 0 20px; text-align:center; font-size:38px; font-weight:900; color:#4f3e9d; }
      .rijk-subtitel { text-align:center; margin:-14px 0 18px; color:#7e7699; font-size:16px; }
      .rijk-bord > .rijk-subtitel { margin:0 0 12px; }
      .rijk-kaart { position:relative; border:2px solid rgba(92,72,178,.15); border-radius:22px; background:rgba(255,255,255,.92); box-shadow:0 7px 18px rgba(58,46,105,.10); }
      .rijk-icoon { width:86px; height:86px; object-fit:contain; flex:0 0 auto; }
      .rijk-verwijder { position:absolute; top:7px; right:7px; width:28px; height:28px; border:0; border-radius:50%; color:#8b3a51; background:#ffe5ec; font-size:19px; cursor:pointer; }
      [contenteditable=true] { outline:2px dashed transparent; border-radius:6px; }
      [contenteditable=true]:hover,[contenteditable=true]:focus { outline-color:#9484dc; background:#fff; }
      .tekstgereedschap { position:fixed; z-index:99999; display:flex; align-items:center; gap:6px; padding:5px 7px; border-radius:10px; color:#fff; background:#514394; box-shadow:0 5px 16px rgba(32,24,72,.3); }
      .tekstgereedschap button { width:34px; height:29px; border:0; border-radius:7px; color:#45378b; background:#fff; font-weight:900; }
      .tekstgereedschap span { min-width:42px; color:#fff!important; font-size:11px!important; font-weight:900; text-align:center; }
      .rijk-toevoegen { border:2px dashed #a89de1; border-radius:14px; padding:9px 14px; color:#5544aa; background:#f3f0ff; font-weight:800; cursor:pointer; }
      .rijk-maak-leeg { position:absolute; z-index:70; right:34px; top:18px; border:0; border-radius:11px; padding:9px 13px; color:#8b3348; background:#ffe6ec; font-weight:900; cursor:pointer; box-shadow:0 4px 12px rgba(70,38,52,.12); }
      body.in-presentatie .rijk-maak-leeg { display:none!important; }
      .ochtend-grid { display:grid; grid-template-columns:220px 1fr; gap:20px; height:590px; padding-right:275px; }
      .datumtegel { display:grid; place-items:center; align-content:center; padding:18px; text-align:center; background:#fff6cd; }
      .datumtegel .dagnummer { font-size:76px; line-height:1; font-weight:900; color:#5544aa; }
      .datumtegel strong { font-size:25px; text-transform:capitalize; }
      .ochtend-routines { padding:16px; display:grid; grid-template-columns:repeat(2,1fr); grid-template-rows:repeat(4,1fr); grid-auto-flow:column; gap:10px 14px; align-content:start; }
      .routine-rij { position:relative; display:grid; grid-template-columns:72px 112px 1fr; align-items:center; gap:9px; min-height:125px; padding:7px 34px 7px 0; border:2px solid #e1dcf5; border-radius:17px; background:#faf9ff; text-align:left; overflow:visible; }
      .routine-rij img { width:108px; height:108px; object-fit:contain; }
      .stapnummer { align-self:stretch; display:grid; place-items:center; padding:7px; border-radius:14px 0 0 14px; color:#fff; background:#806dcc; font-size:15px; line-height:1.05; font-weight:900; text-align:center; text-transform:lowercase; }
      .routine-rij:nth-child(1) .stapnummer { background:#7662c4; }
      .routine-rij:nth-child(2) .stapnummer { background:#3e9b8c; }
      .routine-rij:nth-child(3) .stapnummer { background:#dc9630; }
      .routine-rij:nth-child(4) .stapnummer { background:#c96482; }
      .routine-rij:nth-child(5) .stapnummer { background:#4e8fc5; }
      .routine-rij:nth-child(6) .stapnummer { background:#789f3f; }
      .routine-rij:nth-child(7) .stapnummer { background:#b46cab; }
      .routine-rij:nth-child(8) .stapnummer { background:#cf6f45; }
      .routine-rij strong { display:block; color:#453a72; font-size:17px; }
      .routine-rij span:not(.stapnummer) { display:block; color:#6d6880; font-size:12px; line-height:1.2; }
      .ochtend-routines.zonder-woorden .routine-tekst { display:none; }
      .woordenknop { position:absolute; z-index:4; left:42px; bottom:34px; border:0; border-radius:10px; padding:9px 12px; color:#fff; background:#6653bd; font-weight:900; cursor:pointer; }
      .stappenkiezer { position:absolute; z-index:90; left:270px; bottom:24px; }
      .stappenkiezer summary { list-style:none; padding:10px 14px; border-radius:11px; color:#fff; background:#4f3e9d; font-weight:900; cursor:pointer; box-shadow:0 5px 15px rgba(40,30,90,.25); }
      .stappenkiezer > div { position:absolute; left:0; bottom:48px; display:grid; grid-template-columns:repeat(5,130px); gap:7px; padding:10px; border-radius:16px; background:#fff; box-shadow:0 12px 35px rgba(35,25,80,.3); }
      .stappenkiezer button { min-height:95px; border:1px solid #ddd7f3; border-radius:11px; padding:5px; color:#4d4568; background:#f8f7fd; font-size:11px; font-weight:800; }
      .stappenkiezer img { display:block; width:62px; height:62px; margin:auto; object-fit:contain; }
      .ochtend-zij { display:grid; grid-template-rows:1fr 1fr; gap:18px; }
      .miniweer,.tijdkaart { display:grid; place-items:center; align-content:center; text-align:center; padding:15px; }
      .miniweer img { width:110px; height:110px; object-fit:contain; }
      .tijdkaart .klok { display:grid; place-items:center; width:140px; height:140px; border:12px solid #6653bd; border-radius:50%; font-size:30px; font-weight:900; background:#fff; }
      .welkom-timer { position:absolute; z-index:8; width:250px; min-height:220px; padding:12px; display:grid; place-items:center; align-content:start; border:2px solid #d7d0f3; border-radius:22px; background:#fff; box-shadow:0 10px 28px rgba(48,38,96,.2); }
      .timer-sleepgreep { width:100%; padding:5px 8px; border-radius:10px; color:#fff; background:#6754bd; text-align:center; font-size:13px; font-weight:900; cursor:grab; touch-action:none; }
      .timer-sleepgreep:active { cursor:grabbing; }
      .timer-display { margin:13px 0 9px; color:#44368e; font-size:47px; line-height:1; font-weight:900; font-variant-numeric:tabular-nums; }
      .timer-bediening { display:flex; gap:7px; }
      .timer-bediening button { border:0; border-radius:9px; padding:7px 10px; color:#fff; background:#6a58bd; font-weight:800; cursor:pointer; }
      .timer-bediening button:nth-child(2) { background:#e3a82e; }
      .timer-bediening button:nth-child(3) { background:#88839b; }
      .timer-instelling { margin-top:8px; color:#716b82; font-size:12px; }
      .timer-instelling input { width:58px; padding:4px; border:1px solid #ccc5e8; border-radius:7px; text-align:center; }
      .start-lijst { width:82%; margin:28px auto; display:flex; flex-direction:column; gap:18px; }
      .start-rij { position:relative; display:grid; grid-template-columns:105px 1fr 60px; align-items:center; min-height:125px; padding:12px 45px 12px 18px; border-radius:24px; background:#fff; box-shadow:0 7px 18px rgba(58,46,105,.10); }
      .start-rij img { width:92px; height:92px; object-fit:contain; }
      .start-rij strong { font-size:25px; }
      .start-pijl { display:grid; place-items:center; width:48px; height:48px; border-radius:50%; color:#fff; background:#55ad75; font-size:27px; }
      .dagenrij { display:grid; grid-template-columns:repeat(7,1fr); gap:11px; margin-top:15px; }
      .dagkaart { position:relative; min-height:215px; padding:10px; border:3px solid transparent; border-radius:18px; background:#fff; text-align:center; box-shadow:0 4px 12px rgba(50,42,90,.1); }
      .dagkaart.vandaag { border-color:#f0b92f; background:#fff8d8; transform:translateY(-6px); }
      .dagkaart img { width:100%; height:125px; object-fit:contain; }
      .dagkaart strong { display:block; padding:5px; border-radius:9px; color:#fff; background:#6c5bc2; font-size:18px; text-transform:capitalize; }
      .dag-dropzone { min-height:68px; margin-top:9px; padding:5px; border:2px dashed #c7c0e8; border-radius:12px; color:#9a93b5; background:#f8f7ff; font-size:11px; }
      .dag-dropzone.drag-over { border-color:#705dca; background:#eeeaff; }
      .relatiebak { min-height:104px; display:flex; justify-content:center; align-items:center; gap:14px; margin:24px auto 0; padding:14px; width:94%; border:2px dashed #d6d0ec; border-radius:20px; background:#fbfaff; }
      .relatiekaart { min-width:150px; padding:10px 13px; border:2px solid #433c5d; border-radius:15px; color:#fff; background:linear-gradient(145deg,#625a7c,#443d60); text-align:center; font-weight:900; box-shadow:0 5px 11px rgba(52,44,81,.18); cursor:grab; user-select:none; touch-action:none; }
      .relatiekaart-sleepkopie { position:fixed!important; z-index:99999!important; pointer-events:none!important; opacity:.9; transform:rotate(-2deg) scale(1.04); }
      .relatiekaart:active { cursor:grabbing; }
      .relatiekaart .sprong { display:block; height:27px; margin-bottom:1px; color:#ffe07b; font-size:27px; line-height:1; letter-spacing:-5px; }
      .relatiekaart.vandaag { border-color:#a62233; color:#fff; background:linear-gradient(145deg,#ef5264,#c92f43); }
      .relatiekaart.vandaag .sprong { color:#fff; }
      .relatiekaart.eergisteren { border-color:#19613f; background:linear-gradient(145deg,#347b58,#18543a); }
      .relatiekaart.gisteren { border-color:#70b990; color:#24533b; background:linear-gradient(145deg,#c9f1d8,#9edbb7); }
      .relatiekaart.gisteren .sprong { color:#347553; }
      .relatiekaart.morgen { border-color:#76b8dc; color:#245573; background:linear-gradient(145deg,#d6f0ff,#a9d9f3); }
      .relatiekaart.morgen .sprong { color:#347aa0; }
      .relatiekaart.overmorgen { border-color:#245b9b; background:linear-gradient(145deg,#397cc1,#194f8c); }
      .dag-dropzone .relatiekaart { min-width:0; width:100%; padding:7px 4px; font-size:12px; }
      .dag-dropzone .relatiekaart .sprong { height:20px; font-size:20px; }
      .weer-layout { display:grid; grid-template-columns:1.1fr .9fr; gap:24px; height:590px; }
      .weer-scene { position:relative; overflow:hidden; background:linear-gradient(#cdeeff 0 65%,#a9dd87 65%); }
      .weer-scene:after { content:''; position:absolute; left:-5%; right:-5%; bottom:-80px; height:210px; border-radius:50%; background:#74bc58; }
      .weer-instructie { position:absolute; z-index:1; left:50%; top:42%; transform:translate(-50%,-50%); width:70%; padding:18px; border:3px dashed rgba(55,108,141,.35); border-radius:18px; color:#3d6d89; background:rgba(255,255,255,.5); text-align:center; font-size:20px; font-weight:900; }
      .weer-object { position:absolute; z-index:3; width:135px; height:135px; cursor:grab; touch-action:none; user-select:none; }
      .weer-object.kleding { width:175px; height:245px; }
      .weer-object > img { width:100%; height:100%; object-fit:contain; pointer-events:none; }
      .weer-object.thermometer { width:260px; height:400px; }
      .grote-thermometer { position:relative; display:grid; grid-template-columns:105px 1fr; align-items:center; width:100%; height:100%; padding:16px; border:3px solid #efc9d3; border-radius:24px; background:rgba(255,255,255,.94); box-shadow:0 9px 24px rgba(72,42,78,.18); }
      .thermo-buis { position:relative; width:54px; height:305px; margin:auto; border:5px solid #8b7892; border-radius:28px 28px 18px 18px; background:#fff; cursor:ns-resize; touch-action:none; }
      .thermo-buis:after { content:''; position:absolute; z-index:2; left:50%; bottom:-22px; width:62px; height:62px; transform:translateX(-50%); border:5px solid #8b7892; border-radius:50%; background:#e83f59; }
      .thermo-vulling { position:absolute; z-index:1; left:0; right:0; bottom:0; min-height:5px; border-radius:0; background:#ef4058; pointer-events:none; }
      .thermo-schaal { position:absolute; z-index:3; inset:0 -47px 0 auto; width:43px; color:#685b70; font-size:11px; font-weight:900; pointer-events:none; }
      .thermo-streep { position:absolute; left:0; width:12px; border-top:1px solid #786a80; }
      .thermo-streep.groot { width:20px; border-top-width:2px; }
      .thermo-streep em { position:absolute; left:23px; top:-8px; font-style:normal; }
      .thermo-info { padding-left:13px; color:#9f2942; text-align:center; }
      .thermo-info strong { display:block; font-size:48px; line-height:1; }
      .thermo-info span { display:block; margin-top:9px; font-size:23px; font-weight:900; text-transform:capitalize; }
      .thermo-info small { display:block; margin-top:12px; color:#746b79; font-size:14px; line-height:1.25; }
      .weer-object.geselecteerd { outline:3px solid #6653bd; outline-offset:3px; border-radius:10px; }
      .weer-object-wis { position:absolute; right:-12px; top:-12px; display:none; width:28px; height:28px; border:2px solid #fff; border-radius:50%; color:#fff; background:#c94f68; font-size:18px; font-weight:900; box-shadow:0 2px 7px rgba(0,0,0,.25); }
      .weer-object-formaat { position:absolute; right:-11px; bottom:-11px; display:none; width:25px; height:25px; border:3px solid #fff; border-radius:50%; background:#6653bd; box-shadow:0 2px 7px rgba(0,0,0,.25); cursor:nwse-resize; }
      .weer-object.geselecteerd .weer-object-wis,.weer-object.geselecteerd .weer-object-formaat { display:block; }
      .weer-keuzes { display:block; overflow-y:auto; padding:12px; }
      .weer-categorie { margin-bottom:8px; border:1px solid #ddd8ef; border-radius:13px; background:#fff; }
      .weer-categorie summary { list-style:none; padding:11px 13px; color:#514298; background:#f3f0ff; border-radius:12px; font-size:14px; font-weight:900; cursor:pointer; }
      .weer-categorie summary:after { content:'▾'; float:right; }
      .weer-categorie[open] summary { color:#fff; background:#6754bd; }
      .weer-optie-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; padding:9px; }
      .weer-knop { border:2px solid transparent; border-radius:14px; padding:6px; background:#f5f7ff; cursor:pointer; text-align:center; font-size:11px; }
      .weer-knop.actief { border-color:#efb52c; background:#fff5c8; }
      .weer-knop img { width:62px; height:62px; object-fit:contain; }
      .weer-knop span { display:block; }
      .weer-sleepkopie { position:fixed; z-index:99999; width:95px; height:95px; object-fit:contain; pointer-events:none; opacity:.9; }
      .temperatuurkaart { grid-column:1/-1; display:flex; align-items:center; justify-content:center; gap:12px; margin-top:5px; padding:10px; border-radius:15px; background:#fff3df; }
      .temperatuurkaart img { width:54px; height:54px; object-fit:contain; }
      .temperatuurkaart input { width:82px; border:2px solid #e4a744; border-radius:10px; padding:5px; color:#a2541c; background:#fff; text-align:center; font-size:28px; font-weight:900; }
      .temperatuurkaart strong { font-size:25px; color:#a2541c; }
      .temperatuur-keuzes { grid-column:1/-1; display:flex; flex-wrap:wrap; justify-content:center; gap:5px; }
      .temperatuur-keuzes button { border:1px solid #e8c99a; border-radius:999px; padding:5px 9px; color:#784b27; background:#fffaf2; font-size:11px; font-weight:800; }
      .temperatuur-keuzes button.actief { color:#fff; background:#d77b32; border-color:#bd6422; }
      .weer-leegmaken { grid-column:1/-1; border:0; border-radius:10px; padding:8px; color:#fff; background:#77718f; font-weight:800; cursor:pointer; }
      .maandkop { display:flex; justify-content:center; align-items:center; gap:20px; margin-bottom:10px; }
      .maandkop button { border:0; border-radius:50%; width:40px; height:40px; color:#fff; background:#6653bd; font-size:20px; }
      .maandkop h2 { width:330px; margin:0; text-align:center; font-size:38px; text-transform:capitalize; color:#4f3e9d; }
      .kalender { display:grid; grid-template-columns:repeat(7,1fr); gap:7px; }
      .kalender .weekdag { padding:8px; border-radius:9px; color:#fff; background:#6b59bd; text-align:center; font-weight:900; }
      .kalenderdag { position:relative; min-height:70px; padding:8px; border-radius:12px; background:#fff; box-shadow:inset 0 0 0 1px #ded9ef; font-weight:900; cursor:pointer; }
      .kalenderdag-events { display:flex; flex-wrap:wrap; align-items:flex-start; gap:3px; margin-top:3px; }
      .kalenderdag-events img { width:34px!important; height:34px!important; object-fit:contain; }
      .kalender-verjaardagnaam { flex:1 0 100%; color:#9b3f67; font-size:10px; line-height:1.05; }
      .kalenderdag.leeg { background:transparent; box-shadow:none; cursor:default; }
      .kalenderdag.vandaag { box-shadow:inset 0 0 0 3px #efb82d; background:#fff7d7; }
      .kalenderdag.vrije-dag { color:#8b3544; background:repeating-linear-gradient(135deg,#fff0f2,#fff0f2 10px,#ffe2e7 10px,#ffe2e7 20px); box-shadow:inset 0 0 0 2px #e78b9a; }
      .kalenderdag.vrije-dag:after { content:'VRIJ'; position:absolute; left:8px; bottom:7px; color:#b64055; font-size:13px; font-weight:900; }
      .kalenderdag.weekend-vrij { color:#66506b; background:color-mix(in srgb,var(--weekendkleur,#d9d2ee) 42%,white); box-shadow:inset 0 0 0 2px var(--weekendkleur,#a99bca); }
      .kalenderdag.weekend-vrij:after { content:'VRIJ'; position:absolute; left:8px; bottom:7px; color:#66506b; font-size:12px; font-weight:900; }
      .kalenderdag.halve-dag { background:linear-gradient(to bottom,#fff 0 50%,#e8f1ff 50% 100%); box-shadow:inset 0 0 0 2px #79a7db; }
      .kalenderdag.halve-dag:before { content:'½ DAG'; position:absolute; left:8px; bottom:7px; color:#28649e; font-size:12px; font-weight:900; }
      .kalenderdag img { position:absolute; width:55px; height:55px; object-fit:contain; right:7px; bottom:4px; }
      .kalenderpalet { display:flex; align-items:center; justify-content:center; gap:7px; margin:8px auto 10px; padding:8px; width:max-content; max-width:100%; border:1px solid #ded8f1; border-radius:16px; background:#fff; box-shadow:0 4px 12px rgba(55,44,100,.1); }
      .kalenderpalet > span { margin-right:5px; color:#625b79; font-size:12px; font-weight:900; }
      .kalenderpalet button { min-width:64px; border:2px solid transparent; border-radius:10px; padding:5px 6px; color:#4e4960; background:#f6f4fc; cursor:pointer; font-size:10px; }
      .kalenderpalet button.actief { border-color:#6653bd; background:#ece8ff; }
      .kalenderpalet img { display:block; width:34px; height:34px; margin:auto; object-fit:contain; }
      .kalenderpalet .palet-vrij { color:#a42e45; background:#ffe8ed; font-size:13px; font-weight:900; }
      .kalenderpalet .palet-half { color:#285f94; background:#e7f1ff; font-size:12px; font-weight:900; }
      .weekendkleur { display:flex; align-items:center; gap:5px; padding:4px 7px; border-radius:10px; color:#5d566d; background:#f3f0f8; font-size:10px; font-weight:900; }
      .weekendkleur input { width:30px; height:28px; padding:0; border:0; background:transparent; }
      .kalenderpalet .palet-wis { font-size:20px; }
      .kalender-hulpbalk { display:flex; justify-content:center; align-items:center; gap:10px; margin:7px 0 12px; }
      .kalender-hulpbalk button { border:0; border-radius:10px; padding:8px 12px; color:#fff; background:#6653bd; font-weight:900; cursor:pointer; }
      .kalender-dagkiezer { position:fixed; z-index:99999; inset:0; display:grid; place-items:center; padding:24px; background:rgba(31,25,55,.48); }
      .kalender-dagkiezer-paneel { width:min(920px,96vw); max-height:88vh; overflow:auto; padding:20px; border-radius:24px; background:#fff; box-shadow:0 22px 70px rgba(25,18,57,.4); }
      .kalender-dagkiezer-kop { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-bottom:12px; }
      .kalender-dagkiezer-kop h3 { margin:0; color:#4f3e9d; font-size:25px; text-transform:capitalize; }
      .kalender-dagkiezer-sluit { width:40px; height:40px; border:0; border-radius:50%; color:#fff; background:#6653bd; font-size:23px; cursor:pointer; }
      .kalender-zoeken { width:100%; margin-bottom:13px; padding:12px 15px; border:2px solid #d9d2ef; border-radius:13px; font:inherit; font-size:16px; }
      .kalender-aanwezig { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:2px 0 14px; padding:12px; border-radius:14px; background:#f5f2fc; }
      .kalender-aanwezig > strong { width:100%; color:#443486; }
      .kalender-aanwezig-item { display:flex; align-items:center; gap:7px; padding:6px 7px 6px 10px; border:1px solid #d9d2ef; border-radius:999px; background:#fff; font-weight:800; }
      .kalender-aanwezig-item img { width:34px; height:34px; object-fit:contain; }
      .kalender-aanwezig-item button { display:grid; place-items:center; width:28px; height:28px; padding:0; border:0; border-radius:50%; color:#fff; background:#d4425d; font-size:20px; font-weight:1000; cursor:pointer; }
      .kalender-niets { color:#746d82; }
      .kalender-acties { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
      .kalender-acties button { border:0; border-radius:10px; padding:10px 13px; color:#fff; background:#70679a; font-weight:900; cursor:pointer; }
      .kalender-acties .vrij { background:#bd4761; }.kalender-acties .half { background:#3979ad; }.kalender-acties .wissen { background:#676173; }
      .kalender-activiteiten-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:9px; }
      .kalender-activiteit { min-height:112px; border:2px solid transparent; border-radius:14px; padding:7px; color:#403955; background:#f6f4fc; cursor:pointer; font-size:12px; font-weight:900; }
      .kalender-activiteit:hover { border-color:#6653bd; background:#eeebff; }
      .kalender-activiteit img { display:block; width:70px; height:70px; margin:auto; object-fit:contain; }
      .programma { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; align-items:start; }
      .programma-periode { min-height:500px; padding:12px; border:2px solid #ddd8f1; border-radius:20px; background:#f9f8ff; }
      .programma-periode h3 { margin:0 0 10px; padding:9px; border-radius:12px; color:#fff; background:#6754bd; text-align:center; font-size:22px; }
      .programma-periode.middag h3 { background:#dd9630; }.programma-periode.namiddag h3 { background:#3f9489; }
      .programma-kaart { position:relative; display:grid; grid-template-columns:38px 72px 1fr; align-items:center; min-height:88px; margin:8px 0; padding:7px 34px 7px 8px; text-align:left; }
      .programma-kaart img { width:68px; height:68px; object-fit:contain; }
      .programma-kaart.pauze { border-color:#efb54a; background:#fff5d9; }
      .programma-kaart select { grid-column:1/-1; margin-top:4px; border:1px solid #d5cfee; border-radius:7px; padding:3px; font-size:11px; }
      .programma-kaart strong { display:block; font-size:19px; }
      .programma-kaart span { display:block; color:#6f6980; }
      .programma-kaart.klaar { opacity:.48; filter:grayscale(.7); background:#e7e7eb; }
      .programma-kaart.klaar:after { content:'✓'; position:absolute; right:12px; top:50%; transform:translateY(-50%); color:#31805f; font-size:38px; font-weight:900; }
      .programma-afvinken { width:32px; height:32px; margin-right:7px; border:3px solid #6a58bb; border-radius:9px; color:#fff; background:#fff; font-size:22px; font-weight:900; cursor:pointer; }
      .programma-kaart.klaar .programma-afvinken { background:#4b9b77; border-color:#4b9b77; }
      .programma-bouwbalk { display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:10px; margin:6px 0 13px; }
      .programma-uitleg { width:100%; color:#665d78; text-align:center; font-size:13px; font-weight:800; }
      .programma-bouwbalk button { border:0; border-radius:11px; padding:9px 13px; color:#fff; background:#6653bd; font-weight:900; cursor:pointer; }
      .programma-volgorde { grid-column:1/-1; display:flex; justify-content:center; gap:4px; margin-top:5px; }
      .programma-volgorde button { width:31px; height:27px; border:0; border-radius:7px; color:#fff; background:#8174ba; font-weight:900; cursor:pointer; }
      .programma-linkveld { grid-column:1/-1; display:grid; grid-template-columns:auto 1fr; align-items:center; gap:7px; margin-top:6px; color:#625b79; font-size:11px; font-weight:900; }
      .programma-linkveld input { width:100%; min-width:0; padding:6px 8px; border:1px solid #d6d0ec; border-radius:8px; color:#453a72; background:#fff; }
      .programma-kaart.met-bordboek { cursor:pointer; }
      .programma-linkicoon { position:absolute; right:10px; top:9px; display:grid!important; place-items:center; width:27px; height:27px; border-radius:50%; color:#fff!important; background:#397d70; font-size:14px; box-shadow:0 2px 7px rgba(33,89,77,.25); }
      .programma-kiezer { position:fixed; z-index:99999; inset:0; display:grid; place-items:center; padding:24px; background:rgba(31,25,55,.48); }
      .programma-kiezer-paneel { width:min(850px,95vw); max-height:86vh; overflow:auto; padding:20px; border-radius:24px; background:#fff; box-shadow:0 22px 70px rgba(25,18,57,.4); }
      .programma-kiezer-kop { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
      .programma-kiezer-kop h3 { margin:0; color:#4f3e9d; font-size:25px; }.programma-kiezer-kop button { width:40px; height:40px; border:0; border-radius:50%; color:#fff; background:#6653bd; font-size:23px; }
      .programma-zoeken { width:100%; margin-bottom:13px; padding:12px 15px; border:2px solid #d9d2ef; border-radius:13px; font:inherit; font-size:16px; }
      .programma-keuze-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; }
      .programma-keuze { min-height:125px; border:2px solid transparent; border-radius:15px; padding:8px; color:#403955; background:#f6f4fc; font-weight:900; cursor:pointer; }
      .programma-keuze:hover { border-color:#6653bd; }.programma-keuze img { display:block; width:78px; height:78px; margin:auto; object-fit:contain; }
      .programma-livebediening { grid-column:1/-1; display:flex; align-items:center; justify-content:center; gap:5px; margin-top:5px; }
      .programma-livebediening button,.programma-livebediening select { border:1px solid #d2cbea; border-radius:8px; padding:5px 7px; color:#514394; background:#fff; font-weight:900; cursor:pointer; }
      .routine-kolommen { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
      .routine-blok { padding:20px; }
      .routine-blok h3 { margin:0 0 14px; color:#5544aa; font-size:23px; }
      .routine-blok-kop { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
      .routine-blok-kop img { width:100px; height:100px; object-fit:contain; }
      .routine-blok-kop h3 { margin:0; }
      .routine-blok ul { padding:0; list-style:none; }
      .routine-blok li { display:grid; grid-template-columns:54px 1fr; align-items:center; gap:9px; margin:9px 0; padding:7px; border-radius:12px; background:#f6f4fd; font-size:16px; }
      .routine-blok li img { width:52px; height:52px; object-fit:contain; }
      .routine-kolommen.zonder-woorden .routine-blok li > span:not(.routine-icoonknop) { display:none; }
      .routine-blok li .routine-volgorde { display:flex; gap:4px; }
      .routine-blok li > .rijk-verwijder { position:static; width:31px; height:31px; color:#fff; background:#c94f68; flex:0 0 auto; }
      .routine-volgorde button { width:28px; height:27px; border:0; border-radius:7px; color:#fff; background:#8174ba; font-weight:900; cursor:pointer; }
      .routine-icoonknop { display:grid; place-items:center; width:62px; height:62px; padding:3px; border:2px dashed #b3a8e7; border-radius:12px; background:#fff; cursor:pointer; }
      .routine-icoonknop img { width:52px!important; height:52px!important; }
      .routine-toevoegen { width:100%; margin-top:9px; }
      .routine-blok-wis { margin-left:auto; flex:0 0 auto; }
      body.in-presentatie .routine-icoonknop { border-color:transparent; background:transparent; pointer-events:none; }
      body.in-presentatie .routine-volgorde,body.in-presentatie .routine-blok-wis { display:none!important; }
      body.in-presentatie .rijk-verwijder,body.in-presentatie .rijk-toevoegen,body.in-presentatie .vrij-werkbalk,body.in-presentatie .vrij-formaatgreep { display:none !important; }
      body.in-presentatie .programma-bouwbalk,body.in-presentatie .programma-volgorde { display:none !important; }
      body.in-presentatie .kalenderdag { min-height:86px; }
    `;
    doc.head.appendChild(stijl);
  }

  function titel(doc, root, tekst, subtitel) {
    if (subtitel) root.appendChild(node(doc, 'p', 'rijk-subtitel', subtitel));
  }

  function renderOchtend(doc, root, data, bewerken, wijzig, opnieuw) {
    // Ingevulde routinetekst hoort ook op het grote bord zichtbaar te blijven.
    // Oudere proefborden konden deze tekst onbedoeld enkel in de werkmodus tonen.
    data.toonTekst = true;
    titel(doc, root, 'Welkom in onze klas!', 'Goedemorgen — fijn dat je er bent');
    const nu = new Date();
    const grid = node(doc, 'div', 'ochtend-grid');
    const datum = node(doc, 'section', 'rijk-kaart datumtegel');
    datum.append(node(doc, 'strong', '', DAGEN[nu.getDay()]), node(doc, 'div', 'dagnummer', String(nu.getDate())), node(doc, 'span', '', MAANDEN[nu.getMonth()]));
    const routines = node(doc, 'section', 'rijk-kaart ochtend-routines');
    data.items.forEach((item, index) => {
      const rij = node(doc, 'div', 'routine-rij');
      const tekst = node(doc, 'div', 'routine-tekst');
      tekst.append(bewerkbaar(node(doc, 'strong', '', item.titel), item, 'titel', bewerken, wijzig), bewerkbaar(node(doc, 'span', '', item.tekst), item, 'tekst', bewerken, wijzig));
      rij.append(node(doc,'span','stapnummer',`stap ${index+1}`),icoon(doc, item.icoon), tekst);
      const wis = verwijderKnop(doc, () => { data.items.splice(index, 1); wijzig(); opnieuw(); }, bewerken);
      if (wis) rij.appendChild(wis);
      routines.appendChild(rij);
    });
    if (bewerken) { const plus=node(doc,'button','rijk-toevoegen','+ Routine toevoegen'); plus.onclick=()=>{data.items.push({icoon:'lezen',titel:'Nieuwe routine',tekst:'Klik om aan te passen'});wijzig();opnieuw();}; routines.appendChild(plus); }
    grid.append(datum, routines); root.appendChild(grid);
    if(bewerken){const woorden=node(doc,'button','woordenknop',data.toonTekst?'Woorden verbergen':'Woorden tonen');woorden.type='button';woorden.onclick=()=>{data.toonTekst=!data.toonTekst;wijzig();opnieuw();};root.appendChild(woorden);}
    if(bewerken){const kiezer=node(doc,'details','stappenkiezer');const sam=node(doc,'summary','', '+ Kies een stap');const bak=node(doc,'div');const keuzes=[['brooddoos-broodbak','Brooddoos','Leg je brooddoos in de broodbak'],['drinkbus-vaste-plek','Drinkbus','Zet je drinkbus op de vaste plek'],['snack-fruit-bak','Koek en fruit','Leg je koek en fruit in hun bak'],['agendamap-tafel','Agendamap','Leg je agendamap op tafel'],['brieven-afgeven','Brieven','Geef je brieven af'],['huistaak-afgeven','Huistaak','Geef je huistaak af'],['boekentas-opbergen','Boekentas','Berg je boekentas op'],['stille-dagstarter','Stille dagstarter','Begin stil aan de dagstarter'],['lezen','Lezen in boekje','Lees stil in je boekje']];keuzes.forEach(([icon,titelTekst,uitleg])=>{const knop=node(doc,'button');knop.type='button';knop.append(icoon(doc,icon),node(doc,'span','',titelTekst));knop.onclick=()=>{data.items.push({icoon:icon,titel:titelTekst,tekst:uitleg});wijzig();opnieuw();};bak.appendChild(knop);});kiezer.append(sam,bak);root.appendChild(kiezer);}
  }

  function maakWelkomTimer(doc, root, data, bewerken, wijzig) {
    data.timer = data.timer || { minuten: 10, resterend: 600, actief: false, x: 1285, y: 380 };
    const timer = node(doc, 'section', 'welkom-timer');
    timer.style.left = `${data.timer.x}px`; timer.style.top = `${data.timer.y}px`;
    const greep=node(doc,'div','timer-sleepgreep','⠿ Sleep de timer');
    const display=node(doc,'div','timer-display');
    const knoppen=node(doc,'div','timer-bediening');
    const start=node(doc,'button','','Start'), pauze=node(doc,'button','','Pauze'), reset=node(doc,'button','','Reset');
    knoppen.append(start,pauze,reset); timer.append(greep,display,knoppen);
    if(bewerken){const instelling=node(doc,'label','timer-instelling','Minuten: ');const input=node(doc,'input');input.type='number';input.min='1';input.max='120';input.value=String(data.timer.minuten);input.onchange=()=>{data.timer.minuten=Math.max(1,Number(input.value)||10);data.timer.resterend=data.timer.minuten*60;data.timer.actief=false;wijzig();toon();};instelling.appendChild(input);timer.appendChild(instelling);}
    function toon(){const resterend=data.timer.actief&&data.timer.einde?Math.max(0,Math.ceil((data.timer.einde-Date.now())/1000)):Math.max(0,data.timer.resterend??data.timer.minuten*60);const m=Math.floor(resterend/60),s=resterend%60;display.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;if(resterend===0&&data.timer.actief){data.timer.actief=false;data.timer.resterend=0;wijzig();}}
    start.onclick=()=>{const basis=data.timer.resterend>0?data.timer.resterend:data.timer.minuten*60;data.timer.einde=Date.now()+basis*1000;data.timer.actief=true;wijzig();toon();};
    pauze.onclick=()=>{if(data.timer.actief)data.timer.resterend=Math.max(0,Math.ceil((data.timer.einde-Date.now())/1000));data.timer.actief=false;wijzig();toon();};
    reset.onclick=()=>{data.timer.actief=false;data.timer.resterend=data.timer.minuten*60;delete data.timer.einde;wijzig();toon();};
    const interval=setInterval(()=>{if(!timer.isConnected){clearInterval(interval);return;}toon();},500);toon();
    greep.addEventListener('pointerdown',(event)=>{event.preventDefault();greep.setPointerCapture(event.pointerId);const startX=event.clientX,startY=event.clientY,bx=data.timer.x,by=data.timer.y;const bewegen=(e)=>{const schaal=root.getBoundingClientRect().width/1600;data.timer.x=Math.max(0,Math.min(1350,bx+(e.clientX-startX)/schaal));data.timer.y=Math.max(0,Math.min(500,by+(e.clientY-startY)/schaal));timer.style.left=`${data.timer.x}px`;timer.style.top=`${data.timer.y}px`;};const stoppen=()=>{greep.removeEventListener('pointermove',bewegen);greep.removeEventListener('pointerup',stoppen);wijzig();};greep.addEventListener('pointermove',bewegen);greep.addEventListener('pointerup',stoppen);});
    root.appendChild(timer);
  }

  function renderStart(doc, root, data, bewerken, wijzig, opnieuw) {
    titel(doc, root, 'Start van de dag', 'Dit doen we bij het binnenkomen');
    const lijst = node(doc, 'div', 'start-lijst');
    data.items.forEach((item, index) => {
      const rij=node(doc,'div','start-rij');
      rij.append(icoon(doc,item.icoon), bewerkbaar(node(doc,'strong','',item.tekst),item,'tekst',bewerken,wijzig), node(doc,'span','start-pijl','→'));
      const wis=verwijderKnop(doc,()=>{data.items.splice(index,1);wijzig();opnieuw();},bewerken); if(wis)rij.appendChild(wis); lijst.appendChild(rij);
    });
    if(bewerken){const plus=node(doc,'button','rijk-toevoegen','+ Stap toevoegen');plus.onclick=()=>{data.items.push({icoon:'handschrift',tekst:'Nieuwe stap'});wijzig();opnieuw();};lijst.appendChild(plus);} root.appendChild(lijst);
  }

  function renderDagen(doc, root, data, wijzig, opnieuw) {
    titel(doc, root, 'Wie weet welke dag het vandaag is?', 'Sleep de kaartjes zelf onder de juiste weekdag');
    data.plaatsing = data.plaatsing || {};
    const relaties = [
      { id:'eergisteren', label:'eergisteren', pijl:'↶↶' },
      { id:'gisteren', label:'gisteren', pijl:'↶' },
      { id:'vandaag', label:'vandaag', pijl:'↑' },
      { id:'morgen', label:'morgen', pijl:'↷' },
      { id:'overmorgen', label:'overmorgen', pijl:'↷↷' },
    ];
    function kaartVoor(relatie) {
      const kaart=node(doc,'div',`relatiekaart ${relatie.id}`);
      kaart.dataset.relatie=relatie.id;
      kaart.append(node(doc,'span','sprong',relatie.pijl),node(doc,'span','',relatie.label));
      kaart.addEventListener('pointerdown',(event)=>{
        event.preventDefault(); kaart.setPointerCapture(event.pointerId);
        const beginX=event.clientX,beginY=event.clientY; let kopie=null;
        const bewegen=(e)=>{
          if(!kopie&&Math.hypot(e.clientX-beginX,e.clientY-beginY)>5){kopie=kaart.cloneNode(true);kopie.classList.add('relatiekaart-sleepkopie');kopie.style.width=`${kaart.getBoundingClientRect().width}px`;doc.body.appendChild(kopie);kaart.style.opacity='.25';}
          if(kopie){kopie.style.left=`${e.clientX-kopie.offsetWidth/2}px`;kopie.style.top=`${e.clientY-kopie.offsetHeight/2}px`;doc.querySelectorAll('.dag-dropzone').forEach(z=>z.classList.toggle('drag-over',z===doc.elementFromPoint(e.clientX,e.clientY)?.closest('.dag-dropzone')));}
        };
        const stoppen=(e)=>{
          doc.removeEventListener('pointermove',bewegen);doc.removeEventListener('pointerup',stoppen);doc.removeEventListener('pointercancel',stoppen);
          const doel=doc.elementFromPoint(e.clientX,e.clientY);const zone=doel?.closest('.dag-dropzone');const bakDoel=doel?.closest('.relatiebak');
          if(zone)data.plaatsing[relatie.id]=Number(zone.dataset.dagindex);else if(bakDoel)delete data.plaatsing[relatie.id];
          kopie?.remove();kaart.style.opacity='';doc.querySelectorAll('.dag-dropzone').forEach(z=>z.classList.remove('drag-over'));
          if(zone||bakDoel){wijzig();opnieuw();}
        };
        doc.addEventListener('pointermove',bewegen);doc.addEventListener('pointerup',stoppen);doc.addEventListener('pointercancel',stoppen);
      });
      return kaart;
    }
    function maakDropzone(index) {
      const zone=node(doc,'div','dag-dropzone','sleep hier');
      zone.dataset.dagindex=String(index);
      zone.addEventListener('dragover',(event)=>{event.preventDefault();zone.classList.add('drag-over');});
      zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
      zone.addEventListener('drop',(event)=>{event.preventDefault();const id=event.dataTransfer.getData('text/plain');if(!id)return;data.plaatsing[id]=index;wijzig();opnieuw();});
      const aanwezig=relaties.filter(relatie=>data.plaatsing[relatie.id]===index);
      if(aanwezig.length){zone.textContent='';aanwezig.forEach(relatie=>zone.appendChild(kaartVoor(relatie)));}
      return zone;
    }
    const rij=node(doc,'div','dagenrij');
    const volgorde=['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'];
    volgorde.forEach((dag,index)=>{const kaart=node(doc,'div','dagkaart');kaart.append(icoon(doc,dag),node(doc,'strong','',dag),maakDropzone(index));rij.appendChild(kaart);});
    const bak=node(doc,'div','relatiebak');
    bak.addEventListener('dragover',(event)=>event.preventDefault());
    bak.addEventListener('drop',(event)=>{event.preventDefault();const id=event.dataTransfer.getData('text/plain');if(!id)return;delete data.plaatsing[id];wijzig();opnieuw();});
    relaties.filter(relatie=>data.plaatsing[relatie.id]==null).forEach(relatie=>bak.appendChild(kaartVoor(relatie)));
    if(!bak.children.length)bak.appendChild(node(doc,'span','rijk-subtitel','Sleep een kaartje terug naar hier om opnieuw te beginnen.'));
    root.append(rij,bak);
  }

  function renderWeer(doc, root, data, bewerken, wijzig, opnieuw) {
    titel(doc,root,'Het weer vandaag','Bouw samen het weerbeeld op en vul de temperatuur in');
    data.elementen=data.elementen||[]; if(data.graden==null)data.graden=20;
    const layout=node(doc,'div','weer-layout'); const scene=node(doc,'section','rijk-kaart weer-scene');
    scene.addEventListener('pointerdown',event=>{if(!event.target.closest('.weer-object'))scene.querySelectorAll('.weer-object').forEach(x=>x.classList.remove('geselecteerd'));});
    if(!data.elementen.length)scene.appendChild(node(doc,'div','weer-instructie','Sleep hier zon, wolken, wind of neerslag naartoe'));
    data.elementen.forEach((item,index)=>{const kleding=/^(meisje|jongen)-/.test(item.icoon);item.w=item.w||(kleding?175:135);item.h=item.h||(kleding?245:135);const object=node(doc,'div',`weer-object${kleding?' kleding':''}`);Object.assign(object.style,{left:`${item.x}%`,top:`${item.y}%`,width:`${item.w}px`,height:`${item.h}px`});const img=icoon(doc,item.icoon);object.appendChild(img);const koppelSleep=()=>object.addEventListener('pointerdown',event=>{if(event.target.closest('.weer-object-wis,.weer-object-formaat'))return;event.preventDefault();object.setPointerCapture?.(event.pointerId);const rect=scene.getBoundingClientRect(),sx=event.clientX,sy=event.clientY,bx=item.x,by=item.y;let bewoog=false;const bewegen=e=>{bewoog=true;item.x=Math.max(-item.w/rect.width*20,Math.min(100-item.w/rect.width*80,bx+(e.clientX-sx)/rect.width*100));item.y=Math.max(-item.h/rect.height*15,Math.min(100-item.h/rect.height*82,by+(e.clientY-sy)/rect.height*100));object.style.left=`${item.x}%`;object.style.top=`${item.y}%`;};const stop=()=>{object.removeEventListener('pointermove',bewegen);object.removeEventListener('pointerup',stop);object.removeEventListener('pointercancel',stop);if(bewoog)wijzig();};object.addEventListener('pointermove',bewegen);object.addEventListener('pointerup',stop);object.addEventListener('pointercancel',stop);});if(bewerken){const wis=node(doc,'button','weer-object-wis','×'),formaat=node(doc,'span','weer-object-formaat');wis.type='button';wis.title='Verwijderen';wis.onclick=e=>{e.stopPropagation();data.elementen.splice(index,1);wijzig();opnieuw();};object.append(wis,formaat);object.addEventListener('pointerdown',()=>{scene.querySelectorAll('.weer-object').forEach(x=>x.classList.remove('geselecteerd'));object.classList.add('geselecteerd');},true);formaat.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();const sx=event.clientX,sy=event.clientY,bw=item.w,bh=item.h,verhouding=bw/bh;const bewegen=e=>{const verschil=Math.abs(e.clientX-sx)>Math.abs(e.clientY-sy)?e.clientX-sx:e.clientY-sy;item.w=Math.max(55,bw+verschil);item.h=Math.max(55,item.w/verhouding);object.style.width=`${item.w}px`;object.style.height=`${item.h}px`;};const stop=()=>{doc.removeEventListener('pointermove',bewegen);doc.removeEventListener('pointerup',stop);wijzig();};doc.addEventListener('pointermove',bewegen);doc.addEventListener('pointerup',stop);});}koppelSleep();scene.appendChild(object);});
    function gevoelVoor(graden){if(graden>=35)return'heet';if(graden>=28)return'zeer warm';if(graden>=22)return'warm';if(graden>=16)return'matig';if(graden>=10)return'fris';if(graden>=4)return'koud';if(graden>=0)return'zeer koud';return'vriezen';}
    if(data.toonThermometer){
      data.thermometer=data.thermometer||{x:68,y:18};
      const thermo=node(doc,'div','weer-object thermometer'),kaart=node(doc,'div','grote-thermometer'),buis=node(doc,'div','thermo-buis'),vulling=node(doc,'div','thermo-vulling'),schaal=node(doc,'div','thermo-schaal'),info=node(doc,'div','thermo-info');
      Object.assign(thermo.style,{left:`${data.thermometer.x}%`,top:`${data.thermometer.y}%`});
      for(let g=-10;g<=40;g++){const streep=node(doc,'span',`thermo-streep${g%5===0?' groot':''}`);streep.style.bottom=`${(g+10)/50*100}%`;if(g%10===0)streep.appendChild(node(doc,'em','',`${g}°`));schaal.appendChild(streep);}
      const toonThermo=()=>{vulling.style.height=`${Math.max(0,Math.min(100,(data.graden+10)/50*100))}%`;info.replaceChildren(node(doc,'strong','',`${data.graden}°C`),node(doc,'span','',data.gevoel||gevoelVoor(data.graden)),node(doc,'small','','Sleep de rode vloeistof naar de juiste temperatuur'));};
      buis.append(vulling,schaal);kaart.append(buis,info);thermo.appendChild(kaart);toonThermo();
      buis.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();buis.setPointerCapture(event.pointerId);const stel=e=>{const rect=buis.getBoundingClientRect(),pct=Math.max(0,Math.min(1,(rect.bottom-e.clientY)/rect.height));data.graden=Math.round(-10+pct*50);data.gevoel=gevoelVoor(data.graden);toonThermo();};const stop=()=>{buis.removeEventListener('pointermove',stel);buis.removeEventListener('pointerup',stop);wijzig();};stel(event);buis.addEventListener('pointermove',stel);buis.addEventListener('pointerup',stop);});
      thermo.addEventListener('pointerdown',event=>{if(event.target.closest('.thermo-buis'))return;event.preventDefault();thermo.setPointerCapture(event.pointerId);const rect=scene.getBoundingClientRect(),sx=event.clientX,sy=event.clientY,bx=data.thermometer.x,by=data.thermometer.y;const bewegen=e=>{data.thermometer.x=Math.max(0,Math.min(82,bx+(e.clientX-sx)/rect.width*100));data.thermometer.y=Math.max(0,Math.min(45,by+(e.clientY-sy)/rect.height*100));thermo.style.left=`${data.thermometer.x}%`;thermo.style.top=`${data.thermometer.y}%`;};const stop=()=>{thermo.removeEventListener('pointermove',bewegen);thermo.removeEventListener('pointerup',stop);wijzig();};thermo.addEventListener('pointermove',bewegen);thermo.addEventListener('pointerup',stop);});
      scene.appendChild(thermo);
    }
    const keuzes=node(doc,'section','rijk-kaart weer-keuzes');
    function voegToe(icon,clientX,clientY){const rect=scene.getBoundingClientRect(),kleding=/^(meisje|jongen)-/.test(icon),w=kleding?175:135,h=kleding?245:135;const x=Math.max(0,Math.min(100-w/rect.width*100,(clientX-rect.left-w/2)/rect.width*100));const y=Math.max(0,Math.min(100-h/rect.height*100,(clientY-rect.top-h/2)/rect.height*100));data.elementen.push({icoon:icon,x,y,w,h});wijzig();opnieuw();}
    function maakKnop(icon,label,doel){const knop=node(doc,'button','weer-knop');knop.type='button';knop.title='Tik om in het midden te plaatsen, of sleep meteen naar de juiste plek';knop.append(icoon(doc,icon),node(doc,'span','',label));knop.addEventListener('pointerdown',(event)=>{event.preventDefault();const startX=event.clientX,startY=event.clientY,ghost=icoon(doc,icon);ghost.className='weer-sleepkopie';doc.body.appendChild(ghost);const bewegen=(e)=>{ghost.style.left=`${e.clientX-47}px`;ghost.style.top=`${e.clientY-47}px`;};const stoppen=(e)=>{doc.removeEventListener('pointermove',bewegen);doc.removeEventListener('pointerup',stoppen);doc.removeEventListener('pointercancel',stoppen);ghost.remove();const bovenScene=doc.elementFromPoint(e.clientX,e.clientY)?.closest('.weer-scene');if(bovenScene)voegToe(icon,e.clientX,e.clientY);else if(Math.hypot(e.clientX-startX,e.clientY-startY)<8){const rect=scene.getBoundingClientRect();voegToe(icon,rect.left+rect.width/2,rect.top+rect.height/2);}};bewegen(event);doc.addEventListener('pointermove',bewegen);doc.addEventListener('pointerup',stoppen);doc.addEventListener('pointercancel',stoppen);});doel.appendChild(knop);}
    function categorie(naam,opties,open=false){const detail=node(doc,'details','weer-categorie');detail.open=open;const sam=node(doc,'summary','',naam),grid=node(doc,'div','weer-optie-grid');opties.forEach(([i,l])=>maakKnop(i,l,grid));detail.append(sam,grid);detail.addEventListener('toggle',()=>{if(detail.open)keuzes.querySelectorAll('.weer-categorie').forEach(d=>{if(d!==detail)d.open=false;});});keuzes.appendChild(detail);return grid;}
    categorie('Bewolking',[['zon','zonnig'],['halfbewolkt','half bewolkt'],['bewolkt','bewolkt'],['zwaar-bewolkt','zwaar bewolkt']],true);
    categorie('Wind',[['windstil','windstil'],['beetje-wind','beetje wind'],['veel-wind','veel wind'],['storm','storm']]);
    categorie('Neerslag',[['lichte-regen','lichte regen'],['zware-regen','veel regen'],['hagel','hagel'],['sneeuw','sneeuw'],['onweer','onweer'],['regenboog','regenboog']]);
    const tempGrid=categorie('Temperatuur',[]);const temp=node(doc,'label','temperatuurkaart');temp.append(icoon(doc,data.graden>=18?'warm':'koud'),node(doc,'span','','Temperatuur:'));const input=node(doc,'input');input.type='number';input.min='-10';input.max='40';input.value=String(data.graden);input.onchange=()=>{data.graden=Math.max(-10,Math.min(40,Number(input.value)||0));data.gevoel=gevoelVoor(data.graden);data.toonThermometer=true;wijzig();opnieuw();};temp.append(input,node(doc,'strong','','°C'));tempGrid.appendChild(temp);const tempKeuzes=node(doc,'div','temperatuur-keuzes');[['heet',35],['zeer warm',30],['warm',24],['matig',18],['fris',13],['koud',7],['zeer koud',2],['vriezen',-2]].forEach(([label,graden])=>{const knop=node(doc,'button',data.gevoel===label?'actief':'',label);knop.type='button';knop.onclick=()=>{data.gevoel=label;data.graden=graden;data.toonThermometer=true;wijzig();opnieuw();};tempKeuzes.appendChild(knop);});tempGrid.appendChild(tempKeuzes);
    const kleding=[];['heet','warm','regen','wind','fris','koud','vriezen'].forEach(w=>{kleding.push([`meisje-${w}`,`meisje ${w}`],[`jongen-${w}`,`jongen ${w}`]);});categorie('Kleding',kleding);
    const leeg=node(doc,'button','weer-leegmaken','Maak het weerbeeld leeg');leeg.type='button';leeg.onclick=()=>{data.elementen=[];data.toonThermometer=false;wijzig();opnieuw();};keuzes.appendChild(leeg);
    layout.append(scene,keuzes);root.appendChild(layout);
  }

  function renderKalender(doc, root, data, bewerken, wijzig, opnieuw) {
    const nu=new Date(); if(data.jaar==null){data.jaar=nu.getFullYear();data.maand=nu.getMonth();}
    const kop=node(doc,'div','maandkop'); const terug=node(doc,'button','','‹'), vooruit=node(doc,'button','','›'); const maandTitel=node(doc,'h2','',`${MAANDEN[data.maand]} ${data.jaar}`);kop.append(terug,maandTitel,vooruit);root.appendChild(kop);
    const verander=(delta)=>{data.maand+=delta;if(data.maand<0){data.maand=11;data.jaar--;}if(data.maand>11){data.maand=0;data.jaar++;}wijzig();opnieuw();};terug.onclick=()=>verander(-1);vooruit.onclick=()=>verander(1);
    data.events=data.events||{}; data.halveDagen=data.halveDagen||{}; data.weekendKleur=data.weekendKleur||'#b9add8';
    if(bewerken){
      const palet=node(doc,'div','kalender-hulpbalk');palet.appendChild(node(doc,'span','','Klik op een dag om een activiteit te kiezen.'));
      const alleWoensdagen=node(doc,'button','palet-half','Alle woensdagen');alleWoensdagen.type='button';alleWoensdagen.onclick=()=>{const dagen=new Date(data.jaar,data.maand+1,0).getDate();for(let dag=1;dag<=dagen;dag++){if(new Date(data.jaar,data.maand,dag).getDay()===3){const s=`${data.jaar}-${String(data.maand+1).padStart(2,'0')}-${String(dag).padStart(2,'0')}`;data.halveDagen[s]=true;}}wijzig();opnieuw();};palet.appendChild(alleWoensdagen);
      const kleurLabel=node(doc,'label','weekendkleur','Weekend:');const kleur=node(doc,'input');kleur.type='color';kleur.value=data.weekendKleur;kleur.title='Kies de kleur voor zaterdag en zondag';kleur.oninput=()=>{data.weekendKleur=kleur.value;wijzig();opnieuw();};kleurLabel.appendChild(kleur);palet.appendChild(kleurLabel);
      root.appendChild(palet);
    }
    const activiteiten=[['verjaardag','Verjaardag'],['boom-lente','Start van de lente'],['boom-zomer','Start van de zomer'],['boom-herfst','Start van de herfst'],['boom-winter','Start van de winter'],['uitstap','Uitstap'],['schoolreis','Schoolreis'],['boerderijklassen','Boerderijklassen'],['sportklassen','Sportklassen'],['zeeklassen','Zeeklassen'],['bosklassen','Bosklassen'],['toneel','Naar toneel'],['film','Naar de film'],['zwemmen','Zwemmen'],['turnen','Turnen'],['levensbeschouwing','Levensbeschouwing'],['strapdag','Strapdag'],['decor-sportdag','Sportdag'],['decor-halloween','Halloween'],['soep-school','Soep op school'],['schoolfruit','Fruit van de school'],['moederdag','Moederdag'],['vaderdag','Vaderdag'],['dikke-truiendag','Dikke truiendag'],['ontbijt-school','Ontbijt op school'],['eetfestijn','Eetfestijn'],['schoolfeest','Schoolfeest'],['wieltjesdag','Wieltjesdag'],['schoolmusical','Schoolmusical'],['sinterklaas','Sinterklaas'],['pasen','Pasen']];
    function openDagkiezer(sleutel,datum){
      const laag=node(doc,'div','kalender-dagkiezer'),paneel=node(doc,'section','kalender-dagkiezer-paneel'),kopje=node(doc,'div','kalender-dagkiezer-kop'),sluit=node(doc,'button','kalender-dagkiezer-sluit','×');sluit.type='button';kopje.append(node(doc,'h3','',datum.toLocaleDateString('nl-BE',{weekday:'long',day:'numeric',month:'long'})),sluit);
      const zoek=node(doc,'input','kalender-zoeken');zoek.type='search';zoek.placeholder='Zoek een activiteit, bv. schoolreis of zwemmen…';
      const acties=node(doc,'div','kalender-acties'),grid=node(doc,'div','kalender-activiteiten-grid');
      const klaar=()=>{wijzig();laag.remove();opnieuw();};
      const aanwezig=node(doc,'div','kalender-aanwezig');aanwezig.appendChild(node(doc,'strong','','Staat nu op deze dag:'));
      const voegVerwijderbaarToe=(icoonNaam,label,verwijder)=>{const rij=node(doc,'div','kalender-aanwezig-item');if(icoonNaam)rij.appendChild(icoon(doc,icoonNaam));rij.appendChild(node(doc,'span','',label));const wis=node(doc,'button','','×');wis.type='button';wis.title=`${label} verwijderen`;wis.setAttribute('aria-label',`${label} verwijderen`);wis.onclick=()=>{verwijder();klaar();};rij.appendChild(wis);aanwezig.appendChild(rij);};
      if(data.events[sleutel]==='vrij')voegVerwijderbaarToe(null,'Vrije dag',()=>delete data.events[sleutel]);
      else{const huidig=data.events[sleutel],lijst=Array.isArray(huidig)?huidig:(huidig?[{icon:huidig}]:[]);lijst.forEach((item,index)=>{const label=activiteiten.find(([i])=>i===item.icon)?.[1]||item.icon;voegVerwijderbaarToe(item.icon,item.naam?`${label}: ${item.naam}`:label,()=>{lijst.splice(index,1);if(lijst.length)data.events[sleutel]=lijst;else delete data.events[sleutel];});});}
      if(data.halveDagen[sleutel])voegVerwijderbaarToe(null,'Halve dag',()=>delete data.halveDagen[sleutel]);
      if(aanwezig.children.length===1)aanwezig.appendChild(node(doc,'span','kalender-niets','Nog niets ingevuld.'));
      [['vrij','Vrije dag'],['half','Halve dag'],['wissen','Alles wissen']].forEach(([soort,label])=>{const knop=node(doc,'button',soort,label);knop.type='button';knop.onclick=()=>{if(soort==='vrij')data.events[sleutel]='vrij';if(soort==='half')data.halveDagen[sleutel]=!data.halveDagen[sleutel];if(soort==='wissen'){delete data.events[sleutel];delete data.halveDagen[sleutel];}klaar();};acties.appendChild(knop);});
      activiteiten.forEach(([icon,label])=>{const knop=node(doc,'button','kalender-activiteit');knop.type='button';knop.dataset.zoek=label.toLowerCase();knop.append(icoon(doc,icon),node(doc,'span','',label));knop.onclick=()=>{const huidig=data.events[sleutel];const lijst=Array.isArray(huidig)?huidig:(huidig&&huidig!=='vrij'?[{icon:huidig}]:[]);let naam='';if(icon==='verjaardag'){naam=doc.defaultView.prompt('Wie is er jarig? Typ de naam (mag ook leeg blijven).','')||'';}lijst.push({icon,naam});data.events[sleutel]=lijst;klaar();};grid.appendChild(knop);});
      zoek.oninput=()=>grid.querySelectorAll('.kalender-activiteit').forEach(k=>k.hidden=!k.dataset.zoek.includes(zoek.value.trim().toLowerCase()));sluit.onclick=()=>laag.remove();laag.onclick=e=>{if(e.target===laag)laag.remove();};paneel.append(kopje,aanwezig,zoek,acties,grid);laag.appendChild(paneel);doc.body.appendChild(laag);setTimeout(()=>zoek.focus(),0);
    }
    const kalender=node(doc,'div','kalender');['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'].forEach(d=>kalender.appendChild(node(doc,'div','weekdag',d)));
    const eerste=(new Date(data.jaar,data.maand,1).getDay()+6)%7; const aantal=new Date(data.jaar,data.maand+1,0).getDate(); for(let i=0;i<eerste;i++)kalender.appendChild(node(doc,'div','kalenderdag leeg'));
    for(let dag=1;dag<=aantal;dag++){const datum=new Date(data.jaar,data.maand,dag);const weekend=datum.getDay()===0||datum.getDay()===6;const vandaag=dag===nu.getDate()&&data.maand===nu.getMonth()&&data.jaar===nu.getFullYear();const sleutel=`${data.jaar}-${String(data.maand+1).padStart(2,'0')}-${String(dag).padStart(2,'0')}`;const event=data.events[sleutel];const halveDag=!!data.halveDagen[sleutel];const cel=node(doc,'div','kalenderdag'+(vandaag?' vandaag':'')+(event==='vrij'?' vrije-dag':'')+(weekend?' weekend-vrij':'')+(halveDag?' halve-dag':''),String(dag));if(weekend)cel.style.setProperty('--weekendkleur',data.weekendKleur);if(event&&event!=='vrij'){const lijst=Array.isArray(event)?event:[{icon:event}],bak=node(doc,'div','kalenderdag-events');lijst.forEach(item=>{bak.appendChild(icoon(doc,item.icon));if(item.icon==='verjaardag'&&item.naam)bak.appendChild(node(doc,'span','kalender-verjaardagnaam',item.naam));});cel.appendChild(bak);}if(bewerken)cel.onclick=()=>openDagkiezer(sleutel,datum);kalender.appendChild(cel);} root.appendChild(kalender);
    if(bewerken)root.appendChild(node(doc,'p','rijk-subtitel','Elke maand bewaart zijn eigen afspraken. Klik op een dag om die dag in te vullen of te wijzigen.'));
  }

  function renderProgramma(doc, root, data, bewerken, wijzig, opnieuw) {
    titel(doc,root,'Ons dagprogramma','Klik op een activiteit wanneer ze voorbij is');
    data.items=data.items||[];
    const periodes=[['voormiddag','Voormiddag'],['middag','Middag'],['namiddag','Namiddag']];
    const vakken=[
      ['rekenen','Rekenen'],['taal','Taal'],['lezen','Lezen'],['lezen','Leeskwartier'],['spelling','Spelling'],['handschrift','Handschrift'],
      ['stille-dagstarter','Dagstarter'],['dagelijkse-kost','Dagelijkse kost'],['wereldorientatie','WO'],['geschiedenis','Geschiedenis'],['aardrijkskunde','Aardrijkskunde'],['mens-maatschappij','Mens en maatschappij'],['natuur','Natuur'],['techniek','Techniek'],['media','Media'],['actua','Actua'],
      ['muzische-vorming','Muzische vorming'],['turnen','Turnen'],['zwemmen','Zwemmen'],
      ['levensbeschouwing-nieuw','Levensbeschouwing'],['katholieke-godsdienst','Katholieke godsdienst'],['islamitische-godsdienst','Islamitische godsdienst'],['protestantse-godsdienst','Protestantse godsdienst'],['orthodoxe-godsdienst','Orthodoxe godsdienst'],['anglicaanse-godsdienst','Anglicaanse godsdienst'],['zedenleer','Niet-confessionele zedenleer'],
      ['speeltijd','Speeltijd'],['speeltijd','Middagpauze'],['uitstap','Uitstap'],['hoekenwerk','Hoekenwerk'],['contractwerk','Contractwerk'],['sneller-klaar','Sneller klaar'],['doe-doosjes','Doe-doosjes'],['ipad','iPad'],['laptop','Laptop'],['toets','Toets']
    ];
    data.items.forEach(item=>{if(!item.periode){const uur=Number(String(item.tijd||'0').split(':')[0]);item.periode=uur<12?'voormiddag':uur<13?'middag':'namiddag';}});
    function openKiezer(periode){
      const laag=node(doc,'div','programma-kiezer'),paneel=node(doc,'section','programma-kiezer-paneel'),kop=node(doc,'div','programma-kiezer-kop'),sluit=node(doc,'button','','×'),zoek=node(doc,'input','programma-zoeken'),grid=node(doc,'div','programma-keuze-grid');zoek.type='search';zoek.placeholder='Zoek een vak of activiteit…';
      kop.append(node(doc,'h3','',`Kies voor ${periodes.find(p=>p[0]===periode)?.[1].toLowerCase()}`),sluit);sluit.onclick=()=>laag.remove();
      vakken.forEach(([icon,label])=>{const knop=node(doc,'button','programma-keuze');knop.type='button';knop.dataset.zoek=label.toLowerCase();knop.append(icoon(doc,icon),node(doc,'span','',label));knop.onclick=()=>{data.items.push({icoon:icon,titel:label,tijd:'',periode,klaar:false});wijzig();laag.remove();opnieuw();};grid.appendChild(knop);});
      zoek.oninput=()=>grid.querySelectorAll('.programma-keuze').forEach(knop=>knop.hidden=!knop.dataset.zoek.includes(zoek.value.trim().toLowerCase()));paneel.append(kop,zoek,grid);laag.appendChild(paneel);laag.onclick=e=>{if(e.target===laag)laag.remove();};doc.body.appendChild(laag);setTimeout(()=>zoek.focus(),0);
    }
    if(bewerken){const bouw=node(doc,'div','programma-bouwbalk'),leeg=node(doc,'button','','Dag leegmaken'),reset=node(doc,'button','','Alle vinkjes wissen');leeg.type=reset.type='button';leeg.onclick=()=>{if(doc.defaultView.confirm('Wil je alle activiteiten van deze dag verwijderen?')){data.items=[];wijzig();opnieuw();}};reset.onclick=()=>{data.items.forEach(i=>i.klaar=false);wijzig();opnieuw();};bouw.append(node(doc,'span','programma-uitleg','Gebruik dit voorbeeld of maak de dag leeg. Kies daarna per dagdeel precies de vakken die jij geeft.'),leeg,reset);root.appendChild(bouw);}
    const grid=node(doc,'div','programma');
    periodes.forEach(([id,label])=>{
      const kolom=node(doc,'section',`programma-periode ${id}`);kolom.appendChild(node(doc,'h3','',label));
      data.items.forEach((item,index)=>{if(item.periode!==id)return;const pauze=/speeltijd|pauze/i.test(item.titel);const kaart=node(doc,'section',`rijk-kaart programma-kaart${pauze?' pauze':''}${item.klaar?' klaar':''}`),vink=node(doc,'button','programma-afvinken',item.klaar?'✓':'');vink.type='button';vink.title=item.klaar?'Nog niet voorbij':'Markeer als voorbij';vink.onclick=e=>{e.stopPropagation();item.klaar=!item.klaar;wijzig();opnieuw();};
        const tekst=node(doc,'div');tekst.append(bewerkbaar(node(doc,'strong','',item.titel),item,'titel',bewerken,wijzig),bewerkbaar(node(doc,'span','',item.tijd||(bewerken?'Klik om een uur toe te voegen':'')),item,'tijd',bewerken,wijzig));kaart.append(vink,icoon(doc,item.icoon),tekst);if(!bewerken)kaart.onclick=()=>{item.klaar=!item.klaar;wijzig();opnieuw();};
        const wissel=richting=>{const kandidaten=data.items.map((x,i)=>({x,i})).filter(v=>v.x.periode===item.periode),positie=kandidaten.findIndex(v=>v.i===index),doel=kandidaten[positie+richting];if(!doel)return;[data.items[index],data.items[doel.i]]=[data.items[doel.i],data.items[index]];wijzig();opnieuw();};
        if(bewerken){const kies=node(doc,'select');periodes.forEach(([waarde,naam])=>{const optie=node(doc,'option','',naam);optie.value=waarde;optie.selected=item.periode===waarde;kies.appendChild(optie);});kies.onchange=()=>{item.periode=kies.value;wijzig();opnieuw();};kaart.appendChild(kies);const volg=node(doc,'div','programma-volgorde'),omhoog=node(doc,'button','','↑'),omlaag=node(doc,'button','','↓');omhoog.type=omlaag.type='button';omhoog.title='Eerder';omlaag.title='Later';omhoog.onclick=()=>wissel(-1);omlaag.onclick=()=>wissel(1);volg.append(omhoog,omlaag);kaart.appendChild(volg);}else{const live=node(doc,'div','programma-livebediening'),vroeger=node(doc,'button','','↑ vroeger'),later=node(doc,'button','','↓ later'),naar=node(doc,'select');vroeger.type=later.type='button';periodes.forEach(([waarde,naam])=>{const optie=node(doc,'option','',naam);optie.value=waarde;optie.selected=item.periode===waarde;naar.appendChild(optie);});vroeger.onclick=e=>{e.stopPropagation();wissel(-1);};later.onclick=e=>{e.stopPropagation();wissel(1);};naar.onclick=e=>e.stopPropagation();naar.onchange=()=>{item.periode=naar.value;wijzig();opnieuw();};live.append(vroeger,later,naar);kaart.appendChild(live);}
        if(bewerken){const linkLabel=node(doc,'label','programma-linkveld','Bordboeklink'),link=node(doc,'input');link.type='url';link.placeholder='Plak hier de rechtstreekse Scoodle- of andere leslink';link.value=item.link||'';link.oninput=()=>{item.link=link.value.trim();wijzig();};link.onclick=e=>e.stopPropagation();linkLabel.appendChild(link);kaart.appendChild(linkLabel);}else if(/^https?:\/\//i.test(item.link||'')){kaart.classList.add('met-bordboek');kaart.title='Klik om het bordboek in een nieuw venster te openen';kaart.tabIndex=0;kaart.setAttribute('role','link');kaart.appendChild(node(doc,'span','programma-linkicoon','🔗'));const openBordboek=()=>doc.defaultView.open(item.link,'_blank','noopener');kaart.onclick=e=>{if(e.target.closest('.programma-afvinken'))return;openBordboek();};kaart.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openBordboek();}};}
        const wis=verwijderKnop(doc,()=>{data.items.splice(index,1);wijzig();opnieuw();},bewerken);if(wis)kaart.appendChild(wis);kolom.appendChild(kaart);
      });
      if(bewerken){const plus=node(doc,'button','rijk-toevoegen',`+ Kies activiteit voor ${label.toLowerCase()}`);plus.type='button';plus.onclick=()=>openKiezer(id);kolom.appendChild(plus);}grid.appendChild(kolom);
    });
    root.appendChild(grid);
  }

  function renderRoutines(doc,root,data,bewerken,wijzig,opnieuw){
    titel(doc,root,'Onze klasroutines','Duidelijke afspraken geven rust');
    const keuzes=[
      ['jas-kapstok','Jas aan de kapstok'],['brieven-afgeven','Documenten afgeven'],['stille-dagstarter','Rustig starten'],
      ['werkplek-opruimen','Werkplek opruimen'],['rustig-in-rij','Rustig in de rij'],['stil-binnenkomen','Stil binnenkomen'],
      ['agenda-invullen','Agenda invullen'],['boekentas-maken','Boekentas maken'],['tafel-taakje-opruimen','Tafel en taakje opruimen'],
      ['stoel-onder-tafel','Stoel onder de tafel'],['stoel-op-tafel','Stoel op de tafel'],['bakje-netjes','Bakje netjes leggen'],['bakje-in-kast','Bakje in de kast'],
      ['losse-drinkbus','Drinkbus'],['losse-brooddoos','Brooddoos'],['losse-koekendoos','Koekendoos'],['losse-fruitdoos','Fruitdoos'],['losse-agendamap','Agendamap'],['losse-huistaken','Huistaken'],
      ['lezen','Lezen'],['speeltijd','Speeltijd'],['boekentas-opbergen','Boekentas opbergen']
    ];
    const kiesIcoon=(item,naKeuze)=>{const laag=node(doc,'div','programma-keuzelaag'),venster=node(doc,'section','programma-kiezer'),kop=node(doc,'div','programma-kiezer-kop'),sluit=node(doc,'button','','×'),grid=node(doc,'div','programma-keuzegrid');kop.append(node(doc,'h2','','Kies een passende routine-afbeelding'),sluit);sluit.onclick=()=>laag.remove();keuzes.forEach(([icon,label])=>{const knop=node(doc,'button','programma-keuze');knop.type='button';knop.append(icoon(doc,icon),node(doc,'span','',label));knop.onclick=()=>{item.icoon=icon;if(!item.tekst||item.tekst==='Nieuwe routine')item.tekst=label;wijzig();laag.remove();naKeuze?.();opnieuw();};grid.appendChild(knop);});venster.append(kop,grid);laag.appendChild(venster);doc.body.appendChild(laag);};
    if(data.toonTekst==null)data.toonTekst=true;const kolommen=node(doc,'div',`routine-kolommen${data.toonTekst?'':' zonder-woorden'}`);
    data.blokken.forEach((blok,blokIndex)=>{blok.icoon=blok.icoon||'stille-dagstarter';const kaart=node(doc,'section','rijk-kaart routine-blok'),kop=node(doc,'div','routine-blok-kop');kop.append(icoon(doc,blok.icoon),bewerkbaar(node(doc,'h3','',blok.titel),blok,'titel',bewerken,wijzig));if(bewerken){const wisBlok=verwijderKnop(doc,()=>{data.blokken.splice(blokIndex,1);wijzig();opnieuw();},true);wisBlok.classList.add('routine-blok-wis');kop.appendChild(wisBlok);}kaart.appendChild(kop);const ul=node(doc,'ul');blok.items=blok.items.map((item,index)=>typeof item==='string'?{tekst:item,icoon:index===0?blok.icoon:'handschrift'}:item);blok.items.forEach((item,index)=>{const li=node(doc,'li'),beeldKnop=node(doc,bewerken?'button':'span','routine-icoonknop');if(bewerken){beeldKnop.type='button';beeldKnop.title='Kies een andere afbeelding';beeldKnop.onclick=()=>kiesIcoon(item);}beeldKnop.appendChild(icoon(doc,item.icoon||blok.icoon));li.append(beeldKnop,bewerkbaar(node(doc,'span','',item.tekst),item,'tekst',bewerken,wijzig));if(bewerken){const volg=node(doc,'div','routine-volgorde'),omhoog=node(doc,'button','','↑'),omlaag=node(doc,'button','','↓'),wis=verwijderKnop(doc,()=>{blok.items.splice(index,1);wijzig();opnieuw();},true);omhoog.disabled=index===0;omlaag.disabled=index===blok.items.length-1;omhoog.onclick=()=>{[blok.items[index-1],blok.items[index]]=[blok.items[index],blok.items[index-1]];wijzig();opnieuw();};omlaag.onclick=()=>{[blok.items[index+1],blok.items[index]]=[blok.items[index],blok.items[index+1]];wijzig();opnieuw();};volg.append(omhoog,omlaag);li.append(volg,wis);}ul.appendChild(li);});kaart.appendChild(ul);if(bewerken){const plus=node(doc,'button','rijk-toevoegen routine-toevoegen','+ Kies een routine');plus.type='button';plus.onclick=()=>{const nieuw={tekst:'Nieuwe routine',icoon:'stille-dagstarter'};blok.items.push(nieuw);wijzig();kiesIcoon(nieuw);};kaart.appendChild(plus);}kolommen.appendChild(kaart);});root.appendChild(kolommen);if(bewerken){const woorden=node(doc,'button','rijk-toevoegen',data.toonTekst?'Woorden verbergen':'Woorden tonen'),tas=node(doc,'button','rijk-toevoegen','+ Boekentas samenstellen'),blokPlus=node(doc,'button','rijk-toevoegen','+ Nieuw routineblok');woorden.onclick=()=>{data.toonTekst=!data.toonTekst;wijzig();opnieuw();};tas.onclick=()=>{data.blokken.push({titel:'Wat hoort in mijn boekentas?',icoon:'boekentas-maken',items:[]});wijzig();opnieuw();};blokPlus.onclick=()=>{data.blokken.push({titel:'Nieuw moment',icoon:'stille-dagstarter',items:[]});wijzig();opnieuw();};root.append(woorden,tas,blokPlus);}}

  function nieuwVrijElement(type, extra) {
    const basis={id:`vrij-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,type,x:610,y:245,w:type==='tekst'?380:220,h:type==='tekst'?100:200};
    if(type==='tekst')Object.assign(basis,{tekst:'Typ hier je tekst',lettergrootte:30});
    if(type==='timer')Object.assign(basis,{w:250,h:210,minuten:10,resterend:600,actief:false});
    return Object.assign(basis,extra||{});
  }

  function renderVrijeLaag(doc,root,bord,bewerken,wijzig,opnieuw) {
    const data=bord.rijk; data.vrijeElementen=data.vrijeElementen||[];
    const laag=node(doc,'div','vrije-laag'); root.appendChild(laag);
    let geselecteerd=null;
    const selecteer=(el)=>{laag.querySelectorAll('.vrij-element').forEach(x=>x.classList.remove('geselecteerd'));geselecteerd=el;if(el&&bewerken)el.classList.add('geselecteerd');};
    root.addEventListener('pointerdown',(e)=>{if(e.target===root||e.target===laag)selecteer(null);});
    data.vrijeElementen.forEach((item,index)=>{
      const el=node(doc,'div',`vrij-element vrij-element-${item.type}${item.type==='timer'?' vrij-timer':''}`); el.dataset.id=item.id;
      Object.assign(el.style,{left:`${item.x}px`,top:`${item.y}px`,width:`${item.w}px`,height:`${item.h}px`,transform:`rotate(${item.rotatie||0}deg)`});
      if(item.type==='afbeelding'){const img=node(doc,'img');img.src=item.bron;img.alt=item.naam||'Afbeelding';el.appendChild(img);}
      if(item.type==='tekst'){
        el.style.fontSize=`${item.lettergrootte||30}px`;
        const tekst=node(doc,'div','vrije-tekst',item.tekst||'Typ hier je tekst');
        if(bewerken){tekst.contentEditable='true';tekst.spellcheck=true;tekst.addEventListener('input',()=>{item.tekst=tekst.innerText;wijzig();});tekst.addEventListener('pointerdown',e=>{e.stopPropagation();selecteer(el);});}
        el.appendChild(tekst);
      }
      if(item.type==='timer'){
        const display=node(doc,'div','vrij-timer-display');const knoppen=node(doc,'div','vrij-timer-knoppen');
        const start=node(doc,'button','','Start'),pauze=node(doc,'button','','Pauze'),reset=node(doc,'button','','Reset');knoppen.append(start,pauze,reset);el.append(display,knoppen);
        const toon=()=>{const sec=item.actief&&item.einde?Math.max(0,Math.ceil((item.einde-Date.now())/1000)):Math.max(0,item.resterend??(item.minuten||10)*60);display.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;if(sec===0&&item.actief){item.actief=false;item.resterend=0;wijzig();}};
        start.onclick=e=>{e.stopPropagation();const sec=item.resterend>0?item.resterend:(item.minuten||10)*60;item.einde=Date.now()+sec*1000;item.actief=true;wijzig();toon();};
        pauze.onclick=e=>{e.stopPropagation();if(item.actief)item.resterend=Math.max(0,Math.ceil((item.einde-Date.now())/1000));item.actief=false;wijzig();toon();};
        reset.onclick=e=>{e.stopPropagation();item.actief=false;item.resterend=(item.minuten||10)*60;delete item.einde;wijzig();toon();};
        const interval=setInterval(()=>{if(!el.isConnected){clearInterval(interval);return;}toon();},500);toon();
      }
      if(bewerken){
        const balk=node(doc,'div','vrij-werkbalk');const greep=node(doc,'span','vrij-sleepgreep','⠿ Sleep');balk.appendChild(greep);
        if(item.type==='tekst'){
          const kleiner=node(doc,'button','','A−'),groter=node(doc,'button','','A+');
          kleiner.onclick=e=>{e.stopPropagation();item.lettergrootte=Math.max(12,(item.lettergrootte||30)-2);wijzig();opnieuw();};
          groter.onclick=e=>{e.stopPropagation();item.lettergrootte=Math.min(100,(item.lettergrootte||30)+2);wijzig();opnieuw();};balk.append(kleiner,groter);
        }
        if(item.type==='afbeelding'){
          const rotatie=node(doc,'label','vrij-rotatie','Draai'),schuif=node(doc,'input'),uitvoer=node(doc,'span','vrij-rotatie-uitvoer',`${item.rotatie||0}°`);schuif.type='range';schuif.min='-180';schuif.max='180';schuif.step='1';schuif.value=String(item.rotatie||0);schuif.onpointerdown=e=>{e.stopPropagation();selecteer(el);};schuif.onclick=e=>e.stopPropagation();schuif.oninput=()=>{item.rotatie=Number(schuif.value);uitvoer.textContent=`${item.rotatie}°`;el.style.transform=`rotate(${item.rotatie}deg)`;wijzig();};rotatie.append(schuif,uitvoer);balk.appendChild(rotatie);
        }
        if(item.type==='timer'){
          const min=node(doc,'button','',`${item.minuten||10} min`);min.title='Klik om het aantal minuten te wijzigen';min.onclick=e=>{e.stopPropagation();const waarde=Number(prompt('Hoeveel minuten?',String(item.minuten||10)));if(waarde>0&&waarde<=180){item.minuten=waarde;item.resterend=waarde*60;item.actief=false;wijzig();opnieuw();}};balk.appendChild(min);
        }
        const kopie=node(doc,'button','','⧉'),wis=node(doc,'button','','×');kopie.title='Kopiëren';wis.title='Verwijderen';
        kopie.onclick=e=>{e.stopPropagation();const nieuw=JSON.parse(JSON.stringify(item));nieuw.id=`vrij-${Date.now()}`;nieuw.x+=30;nieuw.y+=30;data.vrijeElementen.push(nieuw);wijzig();opnieuw();};
        wis.onclick=e=>{e.stopPropagation();data.vrijeElementen.splice(index,1);wijzig();opnieuw();};balk.append(kopie,wis);el.appendChild(balk);
        const formaat=node(doc,'span','vrij-formaatgreep');el.appendChild(formaat);
        const sleep=(event,resize)=>{event.preventDefault();event.stopPropagation();selecteer(el);const sx=event.clientX,sy=event.clientY,bx=item.x,by=item.y,bw=item.w,bh=item.h,logischeBreedte=root.offsetWidth||1600,logischeHoogte=root.offsetHeight||730,schaal=root.getBoundingClientRect().width/logischeBreedte;
          const bewegen=e=>{if(resize){if(item.type==='afbeelding'){const verhouding=bw/bh,verschil=Math.abs(e.clientX-sx)>Math.abs(e.clientY-sy)?(e.clientX-sx)/schaal:(e.clientY-sy)/schaal;item.w=Math.max(80,bw+verschil);item.h=Math.max(60,item.w/verhouding);}else{item.w=Math.max(80,bw+(e.clientX-sx)/schaal);item.h=Math.max(60,bh+(e.clientY-sy)/schaal);}}else{item.x=Math.max(-20,Math.min(logischeBreedte-item.w+24,bx+(e.clientX-sx)/schaal));item.y=Math.max(-root.parentElement.offsetTop,Math.min(logischeHoogte-item.h+20,by+(e.clientY-sy)/schaal));}Object.assign(el.style,{left:`${item.x}px`,top:`${item.y}px`,width:`${item.w}px`,height:`${item.h}px`});};
          const stop=()=>{doc.removeEventListener('pointermove',bewegen);doc.removeEventListener('pointerup',stop);wijzig();};doc.addEventListener('pointermove',bewegen);doc.addEventListener('pointerup',stop);};
        greep.addEventListener('pointerdown',e=>sleep(e,false));formaat.addEventListener('pointerdown',e=>sleep(e,true));el.addEventListener('pointerdown',()=>selecteer(el),true);if(item.type==='afbeelding')el.addEventListener('pointerdown',e=>{if(e.target.closest('.vrij-werkbalk,.vrij-formaatgreep'))return;sleep(e,false);});
      }else{
        el.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;event.preventDefault();const sx=event.clientX,sy=event.clientY,bx=item.x,by=item.y,logischeBreedte=root.offsetWidth||1600,logischeHoogte=root.offsetHeight||730,schaal=root.getBoundingClientRect().width/logischeBreedte;const bewegen=e=>{item.x=Math.max(-20,Math.min(logischeBreedte-item.w+24,bx+(e.clientX-sx)/schaal));item.y=Math.max(-root.parentElement.offsetTop,Math.min(logischeHoogte-item.h+20,by+(e.clientY-sy)/schaal));el.style.left=`${item.x}px`;el.style.top=`${item.y}px`;};const stop=()=>{doc.removeEventListener('pointermove',bewegen);doc.removeEventListener('pointerup',stop);wijzig();};doc.addEventListener('pointermove',bewegen);doc.addEventListener('pointerup',stop);});
      }
      laag.appendChild(el);
    });
  }

  window.voegVrijElementToe=function(win,bord,type,extra,wijzig){
    bord.rijk.vrijeElementen=bord.rijk.vrijeElementen||[];bord.rijk.vrijeElementen.push(nieuwVrijElement(type,extra));
    if(wijzig)wijzig();window.renderRijkBord(win,bord,true,wijzig||(()=>{}));
  };

  window.renderRijkBord = function (win, bord, bewerken, wijzig) {
    const doc=win.document, canvas=doc.getElementById('bord-canvas'); if(!canvas||!bord.rijk)return;
    injecteerStijl(doc); canvas.querySelectorAll('.rijk-bord').forEach(el=>el.remove());
    const root=node(doc,'div',`rijk-bord rijk-${bord.rijk.type}`);canvas.appendChild(root);
    const opnieuw=()=>window.renderRijkBord(win,bord,bewerken,wijzig);
    const d=bord.rijk;
    if(d.type==='ochtend')renderOchtend(doc,root,d,bewerken,wijzig,opnieuw);
    else if(d.type==='start')renderStart(doc,root,d,bewerken,wijzig,opnieuw);
    else if(d.type==='dagen')renderDagen(doc,root,d,wijzig,opnieuw);
    else if(d.type==='weer')renderWeer(doc,root,d,bewerken,wijzig,opnieuw);
    else if(d.type==='kalender')renderKalender(doc,root,d,true,wijzig,opnieuw);
    else if(d.type==='programma')renderProgramma(doc,root,d,bewerken,wijzig,opnieuw);
    else if(d.type==='routines')renderRoutines(doc,root,d,bewerken,wijzig,opnieuw);
    if(bewerken){const maakLeeg=node(doc,'button','rijk-maak-leeg','Maak dit bord leeg');maakLeeg.type='button';maakLeeg.title='Verwijder alle voorbeeldinhoud van dit bord';maakLeeg.onclick=()=>{if(!win.confirm('Alle voorbeeldinhoud en losse onderdelen van dit bord verwijderen?'))return;if(d.type==='ochtend'||d.type==='start'||d.type==='programma')d.items=[];else if(d.type==='routines')d.blokken=[];else if(d.type==='dagen')d.plaatsing={};else if(d.type==='weer'){d.elementen=[];d.toonThermometer=false;}else if(d.type==='kalender'){const prefix=`${d.jaar}-${String(d.maand+1).padStart(2,'0')}-`;Object.keys(d.events||{}).filter(k=>k.startsWith(prefix)).forEach(k=>delete d.events[k]);Object.keys(d.halveDagen||{}).filter(k=>k.startsWith(prefix)).forEach(k=>delete d.halveDagen[k]);}d.vrijeElementen=[];wijzig();opnieuw();};root.appendChild(maakLeeg);}
    renderVrijeLaag(doc,root,bord,bewerken,wijzig,opnieuw);
  };
})();
