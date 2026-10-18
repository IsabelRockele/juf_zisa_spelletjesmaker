// Woordprenten worden afzonderlijk gegenereerd en ook in de uitleg gebruikt.
(() => {
  const sets = {
    'm4-monster-feest': ['beeft', 'gluurt', 'deinst', 'proest'],
    'm4-pakjesglijbaan': ['luik', 'zeil', 'ruim', 'kapitein'],
    'e4-dansende-pompoen': ['ranken', 'drempel', 'stoet', 'bevel'],
    'e4-sint-rust': ['klepel', 'wielas', 'geruisloos', 'mompelt'],
    'm5-heks-rolschaatsen': ['geknakt', 'glazuur', 'vertraagt', 'uitwijken'],
    'm5-pakjes-drift': ['wal', 'bootshaak', 'steiger', 'dobbert'],
    'e5-verkeerde-deuren': ['serre', 'vensterbank', 'verklaring', 'geritsel'],
    'e5-pakjeslift': ['geleider', 'bestelbon', 'bestemming', 'dwarsligger']
  };
  window.ZISA_STORY_GLOSSARIES['m5-pakjes-drift'].wal = 'Het land langs het water. Wie op de wal staat, staat op het land en niet op een boot.';
  for (const [id, words] of Object.entries(sets)) {
    const glossary = window.ZISA_STORY_GLOSSARIES[id];
    const definition = word => typeof glossary[word] === 'object' ? glossary[word].text : glossary[word];
    const illustrated = words.slice(0, 3);
    for (const word of illustrated) glossary[word] = {text: definition(word), image: `images/woordenschat-seizoenen/${word}.png`};
    window.ZISA_LEVEL_GAMES[id].push(
      {type: 'match', title: 'Woord en prent', q: 'Tik op een prent. Tik daarna op het woord dat erbij hoort.', pairs: illustrated.map((word, i) => [{image: glossary[word].image, alt: `Woordprent ${i + 1}`}, word])},
      {type: 'match', title: 'Wat betekent het?', q: 'Verbind elk woord met de juiste uitleg.', pairs: words.slice(1).map(word => [word, definition(word)])}
    );
  }
})();
