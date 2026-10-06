/* Concrete hulp en verdieping, ook wanneer een zoekprentmodus gekozen is. */
(() => {
const original = TaalGenerator.model;
const supportInstructions = {
  'article-word': 'Zeg bij elk woord de en het. Gebruik het voorbeeld en schrijf het passende lidwoord.',
  'article-text': 'Zoek en omkring de lidwoorden in elk tekstje.',
  'article-change': 'Kies de passende woordgroep uit de twee mogelijkheden en schrijf die over.',
  'article-singular': 'Het woord voor één staat er al als hulp. Schrijf dat woord met de of het.',
  'article-find': 'Omkring de lidwoorden. Bij elke zin staat hoeveel je er moet zoeken.',
  'noun-pictures': 'Kies uit de woordenlijst en schrijf bij elke prent het woord met zijn lidwoord.',
  'noun-sort': 'Gebruik de lidwoorden uit de woordenlijst en de voorbeelden. Schrijf elke woordgroep in de juiste kolom.',
  'capital-find': 'Omkring de hoofdletters. Bij elke zin staat hoeveel je er moet vinden.',
  'capital-fix': 'Schrijf de zin met de juiste hoofdletters. Gebruik de hulpwoorden onder de zin.',
  'capital-choice': 'Lees de tip bij elke zin. Omkring daarna de juiste schrijfwijze.',
  'punct-find': 'Omkring het leesteken aan het einde van elke zin.',
  'punct-fill': 'Lees de tip en schrijf het genoemde leesteken in het vakje.',
  'punct-complete': 'Maak een zin met het gegeven begin en het voorgestelde einde. Let op het leesteken.',
  'punct-write': 'Gebruik het hulpbegin en schrijf een hele zin met het gevraagde leesteken.',
  'tell-recognize': 'Kruis de mededelende zinnen aan: de zinnen die iets vertellen.',
  'tell-complete': 'Maak een mededelende zin met het gegeven begin en het voorgestelde einde.',
  'tell-words': 'Zet de hulpwoorden in de juiste volgorde en schrijf een mededelende zin.',
  'tell-picture': 'Gebruik het gegeven begin en schrijf bij elke prent een mededelende zin.',
  'rhyme-match': 'Verbind de rijmwoorden. Kies telkens uit twee woorden rechts.',
  'rhyme-color': 'Zoek in elk groepje van vier woorden de twee rijmparen. Geef elk paar dezelfde kleur.',
  'rhyme-find': 'Zeg het laatste woord van elke zin hardop. Omkring die twee rijmwoorden.',
  'rhyme-fill': 'Omkring het laatste woord van de eerste zin. Kies uit de hulpwoorden om de tweede zin te laten rijmen.',
  'rhyme-write': 'Schrijf twee rijmzinnen met de gegeven eindwoorden. Gebruik de hulpzinnen om te beginnen.'
};
const challengeAdditions = {
  'article-word': 'Maak daarna drie woorden meervoud en schrijf het lidwoord erbij.',
  'article-text': 'Schrijf daarna zelf twee zinnen: gebruik eerst een en verwijs daarna met de of het.',
  'article-change': 'Schrijf daarna twee zinnen met woordgroepen uit de oefening.',
  'punct-fill': 'Maak daarna van één mededelende zin een vraag.',
  'tell-recognize': 'Maak daarna van elke mededelende zin een vraag en van elke vraag een mededelende zin.',
  'tell-complete': 'Vertel in elke zin ook waar of wanneer het gebeurt.',
  'tell-words': 'Vertel in elke zin ook waar of wanneer het gebeurt.',
  'rhyme-match': 'Bedenk daarna zelf nog een rijmpaar.',
  'rhyme-color': 'Bedenk daarna zelf nog een rijmpaar.',
  'rhyme-find': 'Schrijf bij elk tekstje nog een rijmende zin.',
  'rhyme-fill': 'Schrijf bij elk tekstje nog een rijmende zin.',
  'rhyme-write': 'Laat beide rijmzinnen samen een klein verhaal vertellen.'
};
TaalGenerator.model = function(item, settings, solutions) {
  const result = original(item, settings, solutions);
  if (item.level === 'support') {
    if (supportInstructions[item.type]) result.instruction = supportInstructions[item.type];
    if (item.type === 'scene') result.instruction += ' Gebruik de woordenlijst als hulp.';
  }
  if (item.level === 'challenge') {
    if (challengeAdditions[item.type]) result.instruction += ' ' + challengeAdditions[item.type];
    if (item.type === 'scene' && result.blocks.length) {
      result.instruction += ' Kies ook twee naamwoorden en leg uit of ze een persoon, dier of ding noemen.';
      if (!(item.removed || []).includes('row-101')) result.blocks.push('<div class="question-block" data-question-key="row-101"><p>Kies twee naamwoorden uit je antwoorden. Schrijf bij elk woord: persoon, dier of ding. Leg je keuze uit.</p>' + (solutions ? '<div class="answer">Eigen uitleg passend bij de gekozen woorden.</div>' : Array.from({length:2}, () => '<div class="write-line">' + SpellingSchrijflijnen.htmlCanvas(settings.lineType, settings.lineHeight,640) + '</div>').join('')) + '</div>');
    }
    if (item.type === 'punct-complete') result.instruction += ' Schrijf ook een andere zin met hetzelfde leesteken.';
  }
  return result;
};
})();
