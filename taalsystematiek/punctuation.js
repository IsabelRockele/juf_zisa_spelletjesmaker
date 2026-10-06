/* Uitbreidbaar met nieuwe tekens. Alleen . ? ! zijn nu beschikbaar. */
(() => {
const signs={
'.':{name:'punt',action:'vertellen',kind:'vertelzin',purpose:'Je vertelt rustig iets.',stem:'Ik zie'},
'?':{name:'vraagteken',action:'vragen',kind:'vraag',purpose:'Je stelt een vraag.',stem:'Waar is'},
'!':{name:'uitroepteken',action:'roepen',kind:'uitroep',purpose:'Je roept luid of met veel gevoel.',stem:'Pas op voor'}
};
const data=[
['De poes ligt op de mat','.','De poes ligt'],['Mijn broer leest een boek','.','Mijn broer leest'],['We eten straks soep','.','We eten straks'],['In de tuin staat een boom','.','In de tuin staat'],['Oma bakt een taart','.','Oma bakt'],['Ik fiets naar school','.','Ik fiets naar'],
['Waar ligt mijn jas','?','Waar ligt'],['Mag ik buiten spelen','?','Mag ik'],['Wie klopt er op de deur','?','Wie klopt'],['Hoe heet jouw hond','?','Hoe heet'],['Wanneer komt oma','?','Wanneer komt'],['Heb jij een rode pen','?','Heb jij'],
['Pas op voor die fiets','!','Pas op voor','Je waarschuwt luid.'],['We hebben gewonnen','!','We hebben','Je juicht luid.'],['Blijf van het vuur af','!','Blijf van','Je waarschuwt luid.'],['Wat een mooie verrassing','!','Wat een','Je roept blij en verrast.'],['Stop met duwen','!','Stop met','Je roept luid dat iets moet stoppen.'],['Help mij','!','Help','Je roept dringend om hulp.']
].map(([text,sign,stem,purpose])=>({text,sign,stem,purpose:purpose||signs[sign].purpose}));
function model(item,s,solutions){
 const G=TaalGenerator,esc=G.esc,r=G.rng(item.seed),support=item.level==='support',hard=item.level==='challenge',removed=new Set(item.removed||[]),blocks=[];
 const pools=Object.fromEntries(Object.keys(signs).map(sign=>[sign,G.shuffle(data.filter(x=>x.sign===sign),r)]));
 const deck=[];for(let i=0;i<6;i++)for(const sign of G.shuffle(Object.keys(signs),r))deck.push(pools[sign][i]);
 const chosen=deck.slice(0,item.count).map((q,i)=>({...q,key:'row-'+i})).filter(q=>!removed.has(q.key));
 const lines=(n=2)=>Array.from({length:n},()=>'<div class="write-line">'+SpellingSchrijflijnen.htmlCanvas(s.lineType,s.lineHeight,640)+'</div>').join('');
 const answer=(text,n=2)=>solutions?'<div class="answer">'+text+'</div>':lines(n);
 const block=(html,key)=>blocks.push('<div class="question-block"'+(key?' data-question-key="'+key+'"':'')+'>'+html+'</div>');
 let instruction='',hint='Een punt sluit een gewone vertelzin af. Een vraagteken hoort bij een vraag. Een uitroepteken gebruik je als je iets roept of met veel gevoel zegt.',example=support?'Ik lees een boek. · Lees jij ook? · Pas op!':'';
 if(item.type==='punct-find'){
  instruction='Omkring het leesteken aan het einde van elke zin.'+(hard?' Schrijf ernaast: vertellen, vragen of roepen.':'');
  chosen.forEach(q=>block('<div class="punct-find-row"><p>'+esc(q.text)+(solutions?'<b class="marked">'+q.sign+'</b>':q.sign)+'</p>'+(hard?'<div class="punct-reason">'+answer(esc(signs[q.sign].action),1)+'</div>':'')+'</div>',q.key));
 }
 if(item.type==='punct-fill'){
  instruction='Schrijf . ? of ! in het vakje. Let op wat de spreker wil doen.';
  for(let i=0;i<chosen.length;i+=2)block('<div class="punct-pair">'+chosen.slice(i,i+2).map(q=>'<div class="punct-item" data-question-key="'+q.key+'"><small class="support-note">'+esc(q.purpose)+'</small><p>'+esc(q.text)+' <span class="punct-box'+(solutions?' answer-mark':'')+'">'+(solutions?q.sign:'')+'</span></p></div>').join('')+'</div>');
  if(hard&&!removed.has('row-100'))block('<p>Maak van één vertelzin hierboven een vraag. Schrijf de hele vraag op.</p>'+answer('Eigen vraag die bij een vertelzin past. Controleer hoofdletter en vraagteken.'),'row-100');
 }
 if(item.type==='punct-complete'){
  instruction='Maak de zin af. Begin met de gegeven woorden. Het leesteken staat al klaar.';
  chosen.forEach(q=>block('<p>Begin met: <b>'+esc(q.stem)+'</b></p><div class="sentence-with-mark"><div>'+answer('Bijvoorbeeld: '+esc(q.text))+'</div><span class="punct-box given-mark">'+q.sign+'</span></div>'+(hard?'<small class="support-note">Kies een ander einde dan in een voorbeeldzin.</small>':''),q.key));
 }
 if(item.type==='punct-write'){
  const subjects=G.shuffle(['een dier','de school','een spel','de tuin','een vriend','een feest'],r);
  instruction='Schrijf bij elke opdracht een hele zin. Gebruik het gevraagde leesteken.'+(hard?' Laat je zinnen samen een kort verhaal vormen.':'');
  chosen.forEach((q,i)=>{const subject=hard?subjects[0]:subjects[i%subjects.length];block('<p>Schrijf een '+signs[q.sign].kind+' over '+esc(subject)+'. Gebruik <b class="punct-cue">'+q.sign+'</b></p>'+(support?'<p class="support-note">Je kunt beginnen met: '+esc(signs[q.sign].stem)+'</p>':'')+answer('Eigen '+signs[q.sign].kind+' over '+esc(subject)+'. Controleer de hoofdletter en '+esc(signs[q.sign].name)+'.'),q.key)});
 }
 return{instruction,hint,example,blocks};
}
window.TaalPunctuation={model,data,signs};
})();
