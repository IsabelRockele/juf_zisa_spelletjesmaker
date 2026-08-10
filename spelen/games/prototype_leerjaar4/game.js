(() => {
  const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
  const backgroundFiles=['assets/rekenkern-vallei.png','assets/level2-tafelrivier.png','assets/level3-draairuines.png','assets/level4-kristalberg.png','assets/level5-rekenkern.png'];
  const backgrounds=backgroundFiles.map(src=>{const image=new Image();image.src=src;return image});
  const lanaBody=new Image();lanaBody.src='assets/lana-full.png';
  const levelNames=['Energiebos','Tafelrivier','Draairuïnes','Kristalberg','De Rekenkern'];
  function q(text,correct,answers,hint){return{text,correct,answers,hint}}
  const QUESTIONS_PER_LEVEL=10;
  const discoverMode=new URLSearchParams(location.search).get('ontdek')==='1'||sessionStorage.getItem('zisa_discover_preview')==='1';
  const LEVEL_TIME=[12,10,8,7,6];
  const game={level:0,round:0,shields:3,energy:0,state:'intro',time:0,scroll:0,nextAt:2.3,jumpT:0,wrong:0,timeLeft:12,lanaX:0,jumpStartX:0,coreX:0,mode:'mixed',question:null,portalT:0,runeAngle:0,crystalTarget:'',crystalIndex:0};
  const tutorials=[
    {title:'Tik de juiste energiekern',text:'Bekijk de oefening en tik het juiste antwoord aan.',demo:'<b>3 × 4 = ?</b><div class="demo-choices"><span>10</span><span class="demo-correct">12</span><span>14</span></div>'},
    {title:'Vang de juiste antwoorddruppel',text:'De antwoorden vallen naar beneden. Tik de juiste druppel vóór hij de grond raakt.',demo:'<b>18 : 3 = ?</b><div class="demo-rain"><span>5</span><span class="demo-correct">6</span><span>7</span></div>'},
    {title:'Volg de draaiende runen',text:'De drie antwoorden draaien rond het rad en worden sneller. Raak de juiste rune.',demo:'<b>7 × 3 = ?</b><div class="demo-wheel"><span>18</span><span class="demo-correct">21</span><span>24</span></div>'},
    {title:'Bouw het antwoord met kristallen',text:'Tik de cijfers één voor één in de juiste volgorde aan.',demo:'<b>8 × 4 = ?</b><div class="demo-slots"><span>3</span><span>2</span></div><div class="demo-crystals"><span>2</span><span>3</span><span>5</span></div>'},
    {title:'Zoek de juiste oefening',text:'Je krijgt een uitkomst. Tik de enige oefening die daarbij hoort.',demo:'<b>UITKOMST: 20</b><div class="demo-choices"><span>3 × 6</span><span class="demo-correct">4 × 5</span><span>6 × 4</span></div>'}
  ];
  function showLevelTutorial(level){
    game.state='tutorial';
    const tutorial=tutorials[level],overlay=document.getElementById('levelTutorial');
    document.getElementById('tutorialBadge').textContent=`LEVEL ${level+1} · ${levelNames[level]}`;
    document.getElementById('tutorialTitle').textContent=tutorial.title;
    document.getElementById('tutorialText').textContent=tutorial.text;
    document.getElementById('tutorialDemo').innerHTML=tutorial.demo+'<i class="demo-finger">☝</i>';
    document.getElementById('tutorialSkip').hidden=level===0;
    document.getElementById('tutorialStart').textContent=`Start level ${level+1} →`;
    overlay.hidden=false;
    updateHud();
  }
  function makeReverseQuestion(){
    const useDivision=game.mode==='divide'||(game.mode==='mixed'&&game.round%2===1);
    const a=2+Math.floor(Math.random()*9),b=2+Math.floor(Math.random()*9);
    const target=useDivision?b:a*b;
    const correct=useDivision?`${a*b} : ${a}`:`${a} × ${b}`;
    const choices=[{text:correct,result:target}];
    while(choices.length<3){
      const divide=game.mode==='divide'||(game.mode==='mixed'&&Math.random()<.5);
      const x=2+Math.floor(Math.random()*9),y=2+Math.floor(Math.random()*9);
      const candidate=divide?{text:`${x*y} : ${x}`,result:y}:{text:`${x} × ${y}`,result:x*y};
      if(candidate.result===target||choices.some(choice=>choice.text===candidate.text))continue;
      choices.push(candidate);
    }
    return{text:`UITKOMST: ${target}`,correct,answers:choices.map(choice=>choice.text),hint:`Zoek de enige oefening met uitkomst ${target}.`,reverse:true};
  }
  function makeQuestion(){
    if(game.level===4)return makeReverseQuestion();
    const a=2+Math.floor(Math.random()*9),b=2+Math.floor(Math.random()*9),product=a*b;
    const divide=game.mode==='divide'||(game.mode==='mixed'&&game.round%2===1);
    const correct=divide?b:product,text=divide?`${product} : ${a}`:`${a} × ${b}`;
    const values=new Set([correct]);
    while(values.size<3){const offset=(1+Math.floor(Math.random()*3))*(Math.random()<.5?-1:1);values.add(Math.max(1,correct+offset))}
    return q(text,correct,[...values],divide?`Welke tafel van ${a} geeft ${product}?`:`Denk aan ${a} groepjes van ${b}.`)
  }
  let last=0,W=innerWidth,H=innerHeight,ground=H*.82;

  function resize(){const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;ground=H*.82;canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0)}
  addEventListener('resize',resize);resize();
  function buildMap(){const map=document.getElementById('levelMap');map.replaceChildren();levelNames.forEach((_,i)=>{const d=document.createElement('span');d.className='level-dot'+(i<game.level?' done':i===game.level?' current':'');d.textContent=i+1;map.append(d)})}
  function updateHud(){document.getElementById('levelName').textContent=`${game.level+1} · ${levelNames[game.level]}`;document.getElementById('scoreIcon').textContent=game.level===1?'💧':game.level===2?'◇':game.level===3?'💎':'⚡';document.getElementById('scoreText').textContent=`${game.energy} / ${QUESTIONS_PER_LEVEL}`;const s=document.getElementById('shields');s.textContent='◆ '.repeat(game.shields).trim()||'geen';s.classList.toggle('danger',game.shields===1);buildMap()}
  function startLevel(){game.round=0;game.energy=0;game.shields=3;game.wrong=0;game.state='running';game.lanaX=Math.max(105,W*.16);game.nextAt=game.time+2.4;document.getElementById('levelComplete').hidden=true;document.getElementById('levelFailed').hidden=true;document.getElementById('challenge').hidden=true;document.getElementById('runnerMessage').hidden=false;document.getElementById('runnerMessage').textContent=game.level===1?'De eerste antwoorddruppels komen eraan…':game.level===2?'Het runenrad begint te draaien…':game.level===3?'De cijferkristallen lichten op…':'Lana loopt naar de volgende tafelkern…';updateHud()}
  function showChallenge(){game.state='question';game.wrong=0;game.timeLeft=LEVEL_TIME[game.level];game.question=makeQuestion();const stepGap=Math.min(145,Math.max(100,W*.056+45));game.coreX=Math.min(W*.76,(game.lanaX||W*.16)+stepGap);const item=game.question;document.getElementById('question').textContent=item.reverse?item.text:item.text+' = ?';const answerBox=document.getElementById('answers');answerBox.replaceChildren();[...item.answers].sort(()=>Math.random()-.5).forEach(value=>{const b=document.createElement('button');b.className='answer-core';b.textContent=value;b.onclick=()=>answer(value,b);answerBox.append(b)});document.getElementById('timeBar').style.transform='scaleX(1)';document.getElementById('feedback').className='';document.getElementById('feedback').textContent=item.reverse?'Tik op de enige oefening met deze uitkomst.':'Tik op het juiste antwoord voordat de energiebalk leeg is.';document.getElementById('runnerMessage').hidden=true;document.getElementById('challenge').hidden=false}
  function setupCrystalChallenge(){
    game.crystalTarget=String(game.question.correct);game.crystalIndex=0;
    const answerBox=document.getElementById('answers'),digits=new Set(game.crystalTarget.split(''));
    while(digits.size<6)digits.add(String(Math.floor(Math.random()*10)));
    const shuffled=[...digits].sort(()=>Math.random()-.5);
    answerBox.innerHTML=`<div class="crystal-slots">${game.crystalTarget.split('').map(()=>'<span></span>').join('')}</div><div class="crystal-bank"></div>`;
    const bank=answerBox.querySelector('.crystal-bank');
    shuffled.forEach(digit=>{const button=document.createElement('button');button.className='digit-crystal';button.textContent=digit;button.onclick=()=>chooseCrystalDigit(digit,button);bank.append(button)});
  }
  function chooseCrystalDigit(digit,button){
    if(game.state!=='question')return;
    if(digit!==game.crystalTarget[game.crystalIndex]){miss('Dat cijfer staat niet op deze plaats.',button);return}
    const slots=document.querySelectorAll('.crystal-slots span');slots[game.crystalIndex].textContent=digit;slots[game.crystalIndex].classList.add('filled');game.crystalIndex++;
    if(game.crystalIndex<game.crystalTarget.length){document.getElementById('feedback').textContent=`Goed! Kies nu cijfer ${game.crystalIndex+1}.`;return}
    document.querySelectorAll('.digit-crystal').forEach(item=>item.disabled=true);document.getElementById('feedback').textContent=`Juist! Het antwoord is ${game.crystalTarget}.`;game.state='feedback';setTimeout(()=>{document.getElementById('challenge').hidden=true;finishJump()},700)
  }
  function miss(reason,button){if(game.state!=='question')return;game.state='feedback';game.shields=Math.max(0,game.shields-1);document.querySelectorAll('.answer-core').forEach(b=>{b.disabled=true;if(b.textContent.trim()===String(game.question.correct))b.classList.add('correct')});if(button)button.classList.add('wrong');updateHud();document.getElementById('feedback').className='hint';document.getElementById('feedback').textContent=`${reason} Het juiste antwoord was ${game.question.correct}.`;setTimeout(()=>{document.getElementById('challenge').hidden=true;if(game.shields===0){game.state='failed';document.getElementById('levelFailed').hidden=false}else{game.state='running';game.nextAt=game.time+1.2}},1200)}
  function answer(value,button){if(game.state!=='question')return;const item=game.question;if(value===item.correct){button.classList.add('correct');document.querySelectorAll('.answer-core').forEach(b=>b.disabled=true);document.getElementById('feedback').className='';if(game.level===1||game.level===2||game.level===4){document.getElementById('challenge').classList.add('answer-found');document.getElementById('feedback').textContent=game.level===1?'Juist! Je ving de goede regendruppel.':game.level===2?'Juist! De goede rune opent de doorgang.':'Juist! Alleen deze oefening heeft de gevraagde uitkomst.';game.state='feedback';setTimeout(()=>{document.getElementById('challenge').hidden=true;finishJump()},650)}else{document.getElementById('feedback').textContent='Juist! Lana wandelt naar de energiekern.';game.state='jump';game.jumpT=0;game.jumpStartX=game.lanaX;setTimeout(()=>{document.getElementById('challenge').hidden=true},420)}}else miss('Dat antwoord is fout.',button)}
  function finishJump(){game.energy++;game.round++;updateHud();if(game.energy>=QUESTIONS_PER_LEVEL){game.state='portal';game.portalT=0;document.getElementById('runnerMessage').hidden=false;document.getElementById('runnerMessage').textContent=game.level===4?'De laatste Rekenkern is hersteld!':'De magische poort naar het volgende gebied opent!'}else{game.state='running';game.nextAt=game.time+1.4;document.getElementById('runnerMessage').hidden=false;document.getElementById('runnerMessage').textContent=game.level===1?`Druppel ${game.energy} van ${QUESTIONS_PER_LEVEL} juist · de volgende komt eraan!`:game.level===2?`Rune ${game.energy} van ${QUESTIONS_PER_LEVEL} gevonden · het rad draait verder!`:game.level===3?`Kristalantwoord ${game.energy} van ${QUESTIONS_PER_LEVEL} gebouwd!`:game.level===4?`Oefening ${game.energy} van ${QUESTIONS_PER_LEVEL} gevonden · zoek de volgende!`:`Kern ${game.energy} van ${QUESTIONS_PER_LEVEL} gevangen · op naar de volgende tafel!`}}
  function showLevelComplete(){document.getElementById('completeTitle').textContent=`${levelNames[game.level]} voltooid!`;document.getElementById('completeText').textContent=game.level===1?'Je klikte tien juiste antwoorddruppels aan.':`Je loste ${QUESTIONS_PER_LEVEL} tafels op en verzamelde ${QUESTIONS_PER_LEVEL} energiekernen.`;const btn=document.getElementById('nextButton');if(discoverMode&&game.level===1){document.getElementById('completeTitle').textContent='De twee Ontdek-werelden zijn voltooid!';document.getElementById('completeText').textContent='Knap gespeeld! In PRO wachten nog drie magische werelden: de Draairuïnes, de Kristalberg en De Rekenkern.';btn.textContent='Bekijk de volledige versie →';btn.dataset.discoverPro='1';document.getElementById('levelComplete').hidden=false}else if(game.level===4){document.getElementById('gameOver').hidden=false}else{delete btn.dataset.discoverPro;btn.textContent=`Naar level ${game.level+2} →`;document.getElementById('levelComplete').hidden=false}}
  function positionRunes(){const buttons=document.querySelectorAll('.rune-mode .answer-core');const radius=innerWidth<=520?88:105;buttons.forEach((button,index)=>{const angle=game.runeAngle+index*Math.PI*2/3;button.style.transform=`rotate(${angle}rad) translateX(${radius}px) rotate(${-angle}rad)`})}
  function update(dt){game.time+=dt;if(game.state==='running'){if(game.time>=game.nextAt)showChallenge()}else if(game.state==='question'){game.timeLeft=Math.max(0,game.timeLeft-dt);const timePart=game.timeLeft/LEVEL_TIME[game.level];document.getElementById('timeBar').style.transform=`scaleX(${timePart})`;if(game.level===2){const runeSpeed=.75+(1-timePart)*2.7;game.runeAngle+=runeSpeed*dt;positionRunes()}if(game.timeLeft<=0)miss('De tijd is op.')}else if(game.state==='jump'){game.jumpT+=dt;const target=game.coreX-45;game.lanaX=Math.min(target,game.lanaX+82*dt);if(game.lanaX>=target)finishJump()}else if(game.state==='portal'){game.portalT+=dt;game.lanaX+=(W*.72-game.lanaX)*Math.min(1,dt*2);if(game.portalT>2.3){if(game.level===4){game.state='done';document.getElementById('gameOver').hidden=false}else{game.level++;showLevelTutorial(game.level)}}}}

  function rr(x,y,w,h,r,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill()}
  function drawLana(){const x=game.lanaX||Math.max(105,W*.16),base=ground;const sourceX=226,sourceY=123,sourceW=556,sourceH=1233,dh=250,dw=dh*sourceW/sourceH;ctx.save();ctx.translate(x,base);ctx.drawImage(lanaBody,sourceX,sourceY,sourceW,sourceH,-dw/2,-dh,dw,dh);ctx.restore()}
  function drawEnergy(){if(game.level!==0)return;if(game.state!=='question'&&game.state!=='jump')return;if(game.state==='jump'&&game.coreX-game.lanaX<52)return;const x=game.coreX||((game.lanaX||W*.2)+145);const y=ground-125+Math.sin(game.time*3)*5;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.shadowColor='#ffe94f';ctx.shadowBlur=35;rr(-22,-22,44,44,8,'#ffcc27');ctx.restore()}
  function drawPortal(){if(game.state!=='portal')return;const x=W*.78,y=ground-125,pulse=1+Math.sin(game.time*5)*.04;ctx.save();ctx.translate(x,y);ctx.scale(pulse,pulse);ctx.shadowColor='#8dfcff';ctx.shadowBlur=45;ctx.strokeStyle='#bafcff';ctx.lineWidth=13;ctx.beginPath();ctx.ellipse(0,0,54,105,0,0,Math.PI*2);ctx.stroke();const glow=ctx.createRadialGradient(0,0,5,0,0,52);glow.addColorStop(0,'#ffffffee');glow.addColorStop(.35,'#71e9ffbb');glow.addColorStop(1,'#6838cf22');ctx.fillStyle=glow;ctx.fill();ctx.restore()}
  function drawGround(){const palettes=[['#82c957','#2e733d','#173f2e'],['#a8d86b','#397c52','#173e43'],['#c89963','#684431','#30251f'],['#eaf8ff','#87b9d4','#315782'],['#287360','#123f46','#071f31']];const colors=palettes[game.level];const g=ctx.createLinearGradient(0,ground-10,0,H);g.addColorStop(0,colors[0]);g.addColorStop(.18,colors[1]);g.addColorStop(1,colors[2]);ctx.fillStyle=g;ctx.fillRect(0,ground-10,W,H-ground+10);ctx.fillStyle=game.level===3?'#ffffff':colors[0];ctx.fillRect(0,ground-10,W,10);ctx.globalAlpha=.22;ctx.fillStyle='#ffffff';for(let x=-80;x<W+100;x+=170){ctx.beginPath();ctx.ellipse(x,ground+35,62,9,0,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
  function draw(){ctx.clearRect(0,0,W,H);const bg=backgrounds[game.level];if(bg&&bg.complete){const scale=Math.max(W/bg.width,H/bg.height);const bw=bg.width*scale,bh=bg.height*scale;ctx.drawImage(bg,(W-bw)/2,(H-bh)/2,bw,bh)}drawGround();drawPortal();drawEnergy();drawLana();if(game.state==='portal'&&game.portalT>1.75){ctx.fillStyle=`rgba(255,255,255,${Math.min(1,(game.portalT-1.75)/.55)})`;ctx.fillRect(0,0,W,H)}}
  function loop(now){const dt=Math.min((now-last)/1000||0,.033);last=now;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);

  const showChallengeBase=showChallenge;
  showChallenge=()=>{showChallengeBase();const challenge=document.getElementById('challenge');const falling=game.level===1,runes=game.level===2,crystals=game.level===3,reverse=game.level===4;challenge.classList.toggle('falling-mode',falling);challenge.classList.toggle('rune-mode',runes);challenge.classList.toggle('crystal-mode',crystals);challenge.classList.toggle('reverse-mode',reverse);challenge.classList.remove('answer-found');document.querySelector('.challenge-label').textContent=falling?'KIES DE JUISTE ANTWOORDDRUPPEL':runes?'RAAK DE JUISTE DRAAIENDE RUNE':crystals?'BOUW HET ANTWOORD MET CIJFERKRISTALLEN':reverse?'WELKE OEFENING HEEFT DEZE UITKOMST?':'KIES DE JUISTE ENERGIEKERN';if(falling){challenge.style.setProperty('--fall-time',`${LEVEL_TIME[game.level]}s`);challenge.style.setProperty('--fall-start',`${Math.ceil(challenge.getBoundingClientRect().bottom-62)}px`);document.getElementById('feedback').textContent='Tik de juiste regendruppel aan vóór hij de grond raakt.'}else if(runes){game.runeAngle=0;positionRunes();document.getElementById('feedback').textContent='Volg het draaiende rad en raak de juiste rune vóór de tijd om is.'}else if(crystals){setupCrystalChallenge();document.getElementById('feedback').textContent='Tik eerst het eerste cijfer van het antwoord.'}else if(reverse){document.getElementById('feedback').textContent='Er is precies één juiste oefening.'}}

  document.getElementById('startButton').onclick=()=>{game.mode=document.querySelector('input[name="mode"]:checked').value;document.getElementById('intro').hidden=true;game.level=0;showLevelTutorial(0)};
  document.getElementById('tutorialStart').onclick=()=>{document.getElementById('levelTutorial').hidden=true;startLevel()};
  document.getElementById('tutorialSkip').onclick=()=>{document.getElementById('levelTutorial').hidden=true;startLevel()};
  document.getElementById('nextButton').onclick=event=>{if(event.currentTarget.dataset.discoverPro==='1'){window.open('https://demo.jufzisa.be/#zg-prijzen','_blank','noopener');return}game.level++;showLevelTutorial(game.level)};
  document.getElementById('againButton').onclick=()=>{document.getElementById('gameOver').hidden=true;game.level=0;showLevelTutorial(0)};
  document.getElementById('retryButton').onclick=startLevel;
  updateHud();
})();
