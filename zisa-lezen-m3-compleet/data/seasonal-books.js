// Oorspronkelijke seizoensverhalen. Pagina's, antwoorden en beeldprompts blijven samen.
// De niveaus volgen de lokale didactische leidraad; dit is geen officiële AVI-meting.
(() => {
  const titles = {halloween:'De Halloween-speurtocht',sint:'De pakjesmissie'};
  // Echte, sterk gelijkende woorden: vergelijken vraagt aandacht voor elke letter.
  // Het middelste woord is het voorbeeld; de antwoordvolgorde wordt later geschud.
  const preciseWords = {
    lap: ['lat','lap','lak'],
    zak: ['zat','zak','pak'],
    Loes: ['boot','poot','pook'],
    lichtje: ['nichtje','lichtje','lichtjes'],
    schoen: ['schoon','schoen','schoep'],
    koperen: ['koppen','koperen','kopen'],
    pakjes: ['zakjes','pakjes','pakje'],
    versieren: ['vieren','versieren','versperren'],
    verrassing: ['verrassend','verrassing','verassing'],
    Halloweenwandeling: ['opgave','opname','inname'],
    repetitie: ['petitie','repetitie','repetities'],
    hoofdprijs: ['wielspin','wielspoor','wildspoor'],
    bezorglijst: ['bezorgdienst','bezorglijst','bezorgtijd'],
    fotografeert: ['fotografeer','fotografeert','fotografeerde'],
    gesproken: ['gesprongen','gesproken','gebroken'],
    nachtarchief: ['legenden','legende','legendes'],
    geschenkenronde: ['aankomt','aankomst','afkomst']
  };
  const add = (book) => {
    if(book.level==='M3')book.games.forEach(g=>{if(g.type==='sequence')g.q='Zet de zinnen op hun plek.';});
    const picture = i => book.pageImages?.[i] || `images/seizoenen/${book.id}/${String(i+1).padStart(2,'0')}.webp`;
    const pages=book.texts.map((text,i)=>({text,image:picture(i)}));
    book.questions.forEach(([n,q,a,correct,hint])=>{pages[n-1].task={type:'choice',q,a,correct,hint};});
    const games=book.games.map(g=>({...g,icon:g.icon||(book.theme==='halloween'?'🎃':'🎁')}));
    window.ZISA_BOOKS.push({id:book.id,level:book.level,title:book.title,blurb:book.blurb,theme:book.theme,missionTitle:titles[book.theme],cover:picture(0),pages,endTask:games.find(g=>g.type==='choice')});
    window.ZISA_LEVEL_GAMES[book.id]=games;
    const storyWords=book.texts.join(' ').toLocaleLowerCase('nl-BE');
    window.ZISA_SPEED_GAMES[book.id]={words:book.words.filter(word=>storyWords.includes(word.toLocaleLowerCase('nl-BE')))};
    window.ZISA_STORY_GLOSSARIES[book.id]=book.glossary||{};
    const precise = preciseWords[book.words[0]];
    window.ZISA_FLUENCY_BOOKS[book.id]=book.fluency||[
      {title:'Lees precies',q:'Tik precies hetzelfde woord aan.',focus:precise[1],a:precise.slice(),correct:1,good:'Goed gelezen! Je keek naar het hele woord.'},
      {title:'Lees met gevoel',q:'Lees hardop. Laat horen wat er gebeurt.',text:book.texts[book.texts.length-1],tip:'Pauzeer bij een punt. Laat een vraag als een vraag klinken.'},
      {title:'Een zin uit het verhaal',q:book.questions[0][1],focus:book.texts[book.questions[0][0]-1],a:book.questions[0][2],correct:book.questions[0][3],good:'Juist! Je las de zin nauwkeurig.'},
      {title:'Lees nog eens',q:'Lees rustig en duidelijk.',text:book.texts[0],tip:'Lees woorden die bij elkaar horen samen. Je hoeft niet te racen.'}
    ];
    // Ook gebruikt bij de controle en voor de bijbehorende illustratieopdrachten.
    window.ZISA_SEASONAL_SOURCE.push(book);
  };
  const C=(title,q,a,correct,reviewPage,hint,context)=>({type:'choice',title,q,a,correct,reviewPage:reviewPage-1,hint,...(context?{context}:{})});
  const O=(items)=>({type:'sequence',title:'Herstel het spoor',q:'Zet de stappen van het verhaal goed.',items,hint:'Lees van het begin tot het einde. Wat gebeurt eerst?'});
  const M=(title,q,pairs,reviewPage)=>({type:'match',title,q,pairs,reviewStart:0,reviewPage:reviewPage-1,hint:'Zoek in het verhaal welke twee kaartjes bij elkaar horen.'});
  const S=(parts)=>({type:'sentence',title:'Maak het bericht',q:'Zet de delen van de zin goed.',parts:parts.map(([text,role])=>({text,role}))});
  window.ZISA_BOOKS=window.ZISA_BOOKS||[];
  ['ZISA_LEVEL_GAMES','ZISA_SPEED_GAMES','ZISA_STORY_GLOSSARIES','ZISA_FLUENCY_BOOKS'].forEach(k=>window[k]=window[k]||{});
  window.ZISA_SEASONAL_SOURCE=[];
  window.ZISA_ADD_SEASONAL=add;
  window.ZISA_SEASONAL_HELPERS={C,O,M,S};

  add({id:'start-halloween-boe',level:'START',theme:'halloween',title:'de lap',blurb:'Sam ziet een lap. Wie is daar?',
    cast:'Sam is a small boy with short brown hair and a green sweater. Noor is a small girl with black bobbed hair and an orange sweater. White cloth ghost costume. Friendly indoor Halloween party with paper bats and pumpkins, no frightening imagery.',
    texts:['sam is bij mam.\nwaar is noor?','sam ziet een lap.\nde lap is wit.','de lap gaat heen en weer.\nwat raar!','sam ziet de lap.\nwie is dat?','een teen!\nsam ziet een teen.','de lap gaat weg.\nhet is noor!','sam ziet noor.\nnoor ziet sam.','nu doet sam raar.\nmam ziet het ook.'],
    scenes:['Sam and mother at friendly Halloween party','Sam looking at white cloth held up','White sheet ghost moving gently','Sam watching sheet ghost curiously','Close-up single human toe peeking under white cloth','Noor pulls cloth off her head','Sam and Noor laughing together, cloth on floor','Sam playfully says boo to smiling mother'],
    questions:[[3,'wat gaat heen en weer?',['de lap','de pen','de bal'],0,'lees de zin met lap.'],[6,'wie is het?',['mam','noor','sam'],1,'lees de zin met is.']],
    words:['lap','sam','wit','mam','teen','noor','waar','raar','heen','weer','weg','ziet'],
    games:[C('zoek het','wat ziet sam bij de lap?',['een teen','een bal','een pen'],0,5,'lees wat sam ziet.'),M('zoek het','wie is het?',[['sam','ziet een teen'],['noor','zit bij de lap']],6),O(['de lap gaat heen en weer.','sam ziet een teen.','sam ziet noor.'])]
  });
  add({id:'start-sint-in-de-zak',level:'START',theme:'sint',title:'het pak',blurb:'Piet: voor Noor!',
    cast:'Noor has a black bob and yellow sweater. Dad has curly brown hair and a blue sweater. Roetpiet has natural skin with a few soot streaks, purple and gold costume. A red gift with gold ribbon contains one red and blue ball. Cosy Belgian home.',
    pageImages:['01','02','03','04','05','06','07','08'].map(n=>'images/seizoenen/start-sint-bal-v2/'+n+'.png'),
    texts:['noor ziet pap.\npap ziet noor.','piet!\nnoor ziet piet.','piet zet zijn zak neer.','noor ziet zijn zak.','piet: voor noor!\nnoor ziet het pak.','noor ziet haar doos.','noor ziet het:\nhaar bal!','haar bal gaat naar pap.\nrol maar, pap!'],
    scenes:['Noor waits beside dad at their door','Roetpiet arrives with a sack','Piet sets the sack down','Noor looks at the sack','Piet hands Noor a wrapped gift','Noor unwraps the gift revealing a box','Noor discovers her ball','Noor rolls her ball to dad'],
    questions:[[5,'het pak: voor ...?',['noor','pap','piet'],0,'lees het.'],[7,'wat ziet noor?',['bal','pen','zak'],0,'lees het.']],
    words:['zak','pak','noor','pap','piet','zet','zijn','neer','ziet','haar','doos','bal','gaat','naar','rol','maar'],
    fluency:[
      {title:'lees',q:'zoek het.',focus:'pak',a:['bak','pak','zak'],correct:1,good:'raak!'},
      {title:'lees',q:'lees maar.',text:'haar bal gaat naar pap.\nrol maar, pap!',tip:'lees het.'},
      {title:'het pak',q:'het pak: voor ...?',focus:'piet: voor noor!',a:['noor','pap','piet'],correct:0,good:'raak!'},
      {title:'lees',q:'lees het weer.',text:'noor ziet pap.\npap ziet noor.',tip:'lees maar.'}
    ],
    games:[M('zoek het','zoek het.',[['piet','zet zijn zak neer'],['noor','ziet haar bal']],7)]
  });
  add({id:'m3-halloween-witte-lap',level:'M3',theme:'halloween',title:'De lap',blurb:'Een lap in de tuin doet heel raar. Is het een spook?',
    cast:'Pim is a six-year-old boy with curly dark hair, blue sweater. Saar is a six-year-old girl with red ponytail and yellow sweater. Orange tabby cat Mo. A white sheet hangs on a low clothesline in garden at dusk during Halloween, with a round ball underneath. Mum has green cardigan. Paper pumpkin decorations.',
    texts:['Het is feest bij Pim.\nSaar is er ook.\nEr is een lap in de tuin.\nDe lap is wit.','De lap gaat op en neer.\nPim is stil.\nIs dat een spook?','Dan hoort Pim: tik, tik!\nSaar is bij Pim.\nWat is dat?','Mam doet de lamp aan.\nPim ziet de lap.','De lap gaat heen en weer.\nEr is iets bij de lap.\nWat is dat?','Het is Mo!\nMo is de kat van Pim.\nMo is niet weg.','Mo tikt met zijn poot.\nEr is een bal bij de lap.\nTik, tik, doet de bal.','Saar tilt de lap op.\nMo ziet Saar.\nZijn poot is bij de bal.','Mo tikt op de bal.\nPim pakt hem op.\nNu is het stil.','Pim zet de bal neer.\nMo rent naar de bal.\nPim ziet Mo.','De lap gaat weer op en neer.\nPim is blij.\nHet is maar een lap!','Saar is ook blij.\nMo wil de bal.\nWat een leuk feest!'],
    scenes:['Pim and Saar in the garden with white sheet','Sheet moving; Pim stays still','Children hear tapping','Mum switches lamp on','Something under moving sheet','Mo the cat under the sheet','Cat taps ball','Saar lifts sheet','Pim picks up ball','Pim puts ball down','Pim understands the moving sheet','Children and cat enjoy party'],
    questions:[[4,'Wat doet mam aan?',['de kraan','de lamp','de bel'],1,'Lees de zin met mam.'],[6,'Wie is er bij de lap?',['Mo','Saar','mam'],0,'Lees de zin met Mo.'],[9,'Hoe is het weer stil?',['Mam doet de deur toe.','Mo is weg.','Pim pakt de bal op.'],2,'Wat doet Pim met de bal?']],
    words:['lap','Pim','Saar','kat','Mo','bal','poot','tuin','lamp','stil','wit','feest','neer','blij','spook'],
    games:[C('Wie is Mo?','Wie is Mo?',['een kat','een mus','een vis'],0,6,'Lees de zin met Mo.'),M('Wie doet wat?','Zet elk kaartje op zijn plek.',[['mam','doet de lamp aan'],['Mo','tikt op de bal'],['Pim','pakt de bal op']],9),O(['Mam doet de lamp aan.','Pim ziet Mo.','Pim pakt de bal op.','Pim zet de bal neer.'])]
  });
  add({id:'m3-sint-rode-lint',level:'M3',theme:'sint',title:'De schoen van Mo',blurb:'Een pak voor Loes. Maar wie zit in haar schoen?',
    cast:'Loes has a brown bob and purple pyjamas. Mo is a tiny orange kitten. A red shoe on a beige mat. Piet has natural skin with a few soot streaks and purple helper clothes. One wrapped yellow gift with a purple ribbon.',
    pageImages:Array.from({length:12},(_,i)=>`images/seizoenen/m3-sint-schoen-van-mo-v2/${String(i+1).padStart(2,'0')}.png`),
    texts:[
      'Loes zet haar schoen op de mat.\nHaar kat zit bij haar.\nHij heet Mo.\nMo ziet de schoen.',
      'De schoen is leeg.\nHier mag Sint een pak in doen.\nKom je, Sint?',
      'Loes is moe.\nDag, Mo!\nDe kat is nog op.',
      'Mo ziet de schoen.\nMo tikt met zijn poot.\nDe schoen gaat heen en weer.',
      'Mo gaat in de schoen.\nDat past net!\nWat is het fijn.',
      'Mo doet een dut in de schoen.\nMo is heel moe.\nEr kan geen pak meer bij.',
      'Piet is er.\nHij heeft een pak voor Loes.\nWaar is haar schoen?',
      'Piet ziet de schoen.\nMaar Mo is er ook!\nWaar moet het pak nu?',
      'Piet zet het pak bij de schoen.\nMo doet nog een dut.\nDag, Mo!',
      'Loes is al op.\nZe gaat naar de mat.\nHé, een pak!',
      'Loes pakt het pak.\nHet pak is voor haar.\nWat is Loes blij!',
      'Loes zet het pak op de mat.\nDe schoen is voor Mo!\nDank je, Sint en Piet!'
    ],
    scenes:['Loes puts shoe on mat','Empty shoe ready for Sint','Loes says goodnight','Mo taps the shoe','Mo climbs into shoe','Mo naps in shoe','Piet arrives with gift','Piet sees kitten in shoe','Piet puts gift beside shoe','Loes sees gift in morning','Loes holds her gift','Loes puts gift down and strokes Mo'],
    questions:[[2,'Wat mag er in de schoen?',['een pak','een pen','een sok'],0,'Lees de zin met Sint.'],[6,'Waar doet Mo een dut?',['op de mat','in de schoen','bij Loes'],1,'Lees de zin met dut.'],[9,'Waar zet Piet het pak?',['in de schoen','op de stoel','bij de schoen'],2,'Lees de zin met Piet.']],
    words:['Loes','schoen','mat','pak','Sint','leeg','kat','Mo','moe','Piet','dut','ziet','poot','heel','fijn','blij'],
    games:[C('Een pak voor Loes','Voor wie is het pak?',['voor Mo','voor Loes','voor Piet'],1,7,'Lees de zin met pak.'),M('Wie doet wat?','Zet elk kaartje op zijn plek.',[['Loes','zet de schoen op de mat'],['Mo','doet een dut in de schoen'],['Piet','zet het pak bij de schoen']],9),O(['Loes zet haar schoen op de mat.','Mo gaat in de schoen.','Piet zet het pak bij de schoen.','Loes ziet het pak.'])]
  });
})();
