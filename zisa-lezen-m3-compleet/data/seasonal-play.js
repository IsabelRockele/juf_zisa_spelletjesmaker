// Twee samenhangende doe-spellen vervangen de losse eindvragen.
(() => {
  for(const book of window.ZISA_BOOKS.filter(b=>b.theme)){
    const source=window.ZISA_SEASONAL_SOURCE.find(b=>b.id===book.id);
    const matching=source.games.find(g=>g.type==='match');
    const n=book.pages.length;
    const indices=book.id==='start-sint-in-de-zak'?[1,4,6]:book.id==='m3-sint-rode-lint'?[0,5,8,11]:book.id==='m3-halloween-witte-lap'?[0,3,8,11]:book.level==='START'?[0,4,6]:[0,Math.floor(n/3),Math.floor(n*2/3),n-1];
    const placing={...matching,type:'story-board',title:matching.title,
      q:'Zet elk kaartje op de juiste plek. Tik op een kaartje en daarna op een plek, of sleep het erheen. Controleer pas als je bord klaar is.',
      instruction:matching.q,
      tokens:matching.pairs.map(p=>p[0]),targets:matching.pairs.map(p=>p[1]),
      image:undefined,success:'Je hebt het bord hersteld! Alles staat zoals in het verhaal.'};
    if(book.id==='e3-sint-verkeerde-schoen')Object.assign(placing,{
      title:'Help Piet bezorgen',instruction:'Breng elk pakje naar de juiste schoen. Denk aan wat Mila ontdekte.',
      tokens:['groen pakje met een ster','rood pakje met een maan','pakje met een zon'],
      targets:['rode schoen van Mila','blauwe schoen van Tuur','gele schoen van Noor'],
      symbols:['★','☾','☀'],colors:['#56a97a','#dc5663','#dfb43d'],targetColors:['#dc5663','#558dc7','#dfb43d'],
      success:'Alle pakjes zijn bezorgd! De tekens hielpen je; alleen op kleur letten zou fout gaan.'});
    if(book.id==='m3-sint-rode-lint')placing.instruction='Wie doet wat in het verhaal van Loes en Mo?';
    if(book.id==='e3-halloween-lichtjespad')Object.assign(placing,{title:'Maak het lichtjespad',instruction:'Hang de drie lichtjes op hun plek langs het pad.',symbols:['1','2','3'],success:'Het lichtjespad is klaar: van het hek via de struik naar de schuur!'});
    const comic={type:'story-comic',title:book.theme==='sint'?'Het pakjesverhaal door elkaar':'De verdwenen verhaalstrook',
      q:'De prenten liggen door elkaar. Bouw het verhaal van links naar rechts. Tik of sleep een prent naar een leeg vak. Tik op een geplaatste prent om die terug te leggen.',
      frames:indices.map(i=>({image:book.pages[i].image,text:book.pages[i].text,page:i})),reviewStart:0,reviewPage:n-1,
      hint:'Denk aan het begin, wat daarna gebeurt en hoe het verhaal afloopt.'};
    if(book.id==='start-sint-in-de-zak'){Object.assign(placing,{title:'zoek het',q:'zoek het.',instruction:'zoek het.',success:'raak!'});Object.assign(comic,{title:'het pak',q:'wat ziet noor?',hint:'het pak voor noor.'});}
    window.ZISA_LEVEL_GAMES[book.id]=[placing,comic];
  }
})();
