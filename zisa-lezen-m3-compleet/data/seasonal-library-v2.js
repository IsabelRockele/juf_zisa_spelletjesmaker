// Vervanging van de zes goedgekeurde seizoensverhalen E3 t/m E4.
(() => {
  const stories = window.ZISA_NIEUWE_VERHALEN || [];
  const support = {
    'e3-spook-kat': {
      wrong: [['Hij wil Mies eten geven.','Hij wil de lamp aanzetten.'],['De hand van Noor.','Een spin van Sem.'],['Sem is bang voor de pompoen.','Mies heeft zich verstopt in de lamp.']],
      words: {zolder:'De ruimte boven in een huis, onder het dak.',zweeft:'Blijft in de lucht zonder op de grond te staan.',glimmen:'Een beetje licht geven of terugkaatsen.',plafond:'De bovenkant van een kamer.',spint:'Maakt een zacht brommend geluid, zoals een tevreden kat.',kopje:'Een zacht duwtje met de kop van een kat.'}
    },
    'e3-niezende-zak': {
      wrong: [['Hij hoort Sint roepen.','Hij laat een pakje vallen.'],['Bootpiet trok aan de zak.','De pakjes vielen uit de kist.'],['In zijn mand op het kussen.','Onder de stoel in de zak.']],
      words: {kist:'Een stevige bak met een deksel om spullen in te bewaren.',fluistert:'Praat heel zacht.',bolt:'Wordt rond, doordat er iets van binnen tegen duwt.',knielt:'Gaat op zijn knieën zitten.',rand:'De buitenste kant van iets.',miauwt:'Maakt het geluid van een kat.'}
    },
    'm4-monster-feest': {
      wrong: [['Ze willen hun masker aan papa geven.','Ze weten niet waar de zaal is.'],['Hij zoekt een verloren wafel.','Hij wil de kinderen laten schrikken.'],['Papa zegt dat het monster een pop is.','De meester neemt het monster mee.'],['Als een wolf met een masker.','Als een meester met een wafel.'],['Zijn pet is te groot.','Zijn jas verandert van kleur.'],['Hij wil leren lezen.','Hij wil op de stoel blijven zitten.']],
      words: {deinst:'Doet een stap achteruit van schrik.',stokstijf:'Zo stil als een stok, zonder te bewegen.',beeft:'Trilt, bijvoorbeeld van angst.',gluurt:'Kijkt voorzichtig, zonder helemaal tevoorschijn te komen.',deftig:'Netjes en plechtig.',proest:'Barst in lachen uit.'}
    },
    'm4-pakjesglijbaan': {
      wrong: [['Sint heeft ze in zijn zak gestopt.','Pakjespiet heeft ze aan kinderen gegeven.'],['De dekens zijn nat.','De pakjes zijn te groot voor de zakken.'],['Sint heeft ze zelf in bad gelegd.','Pakjespiet heeft ze door de deur gegooid.'],['Er is nog maar één pakje over.','Sint wil maar één pakje bewaren.']],
      words: {ruim:'De ruimte onder het dek van een schip waar spullen worden bewaard.',dek:'De vloer boven op een schip waar je buiten kunt lopen.',zeil:'Een groot, stevig doek.',geritsel:'Een zacht geluid van iets dat schuift of beweegt.',luik:'Een kleine deur in een vloer of plafond.',kapitein:'De persoon die de leiding heeft op een schip.'}
    },
    'e4-dansende-pompoen': {
      wrong: [['Hij wil soep gaan halen.','Hij is bang voor de gasten.'],['Zijn hand zit vast aan de deur.','Otis trekt hem de andere kant op.'],['Hij verstopt de pompoen onder zijn hoed.','Hij leest een nieuwe spreuk voor.'],['Hij wil dat de soep sneller afkoelt.','Hij wil de ketel aan de gasten geven.']],
      words: {grijns:'Een brede lach.',spreuk:'Woorden waarmee iemand in een verhaal tovert.',ranken:'Lange, dunne stengels van een plant.',stoet:'Een groep mensen die samen achter elkaar door de straat trekt.',roffel:'Een snelle reeks slagen op een trommel.',ritme:'Het patroon van korte en lange klanken in muziek.',drempel:'Het lage randje op de grond onder een deur.',bevel:'Een opdracht die iemand moet uitvoeren.'}
    },
    'e4-sint-rust': {
      wrong: [['Hij is zijn mijter kwijt.','Hij wil zelf thee gaan maken.'],['Ze zetten muziek op in de gang.','Ze brengen alle pakjes naar de keuken.'],['De kinderen komen hun pakjes op de boot halen.','Sint gaat toch met de kar op pad.'],['De kinderen hebben alle pakjes verstopt.','Sint weet niet wie de Pieten zijn.']],
      words: {verkouden:'Ziek met bijvoorbeeld een loopneus en veel niezen.',muisstil:'Heel erg stil.',klepel:'Het stukje binnen in een bel dat tegen de bel slaat.',wielas:'De staaf waar een wiel om draait.',geruisloos:'Zonder geluid te maken.',haard:'De plek in huis waar een vuur kan branden.',geschenken:'Cadeautjes.',mompelt:'Praat zacht en niet erg duidelijk.'}
    }
  };
  const wordPractice={"e3-spook-kat": ["zolder", "spook", "feest", "bank", "lamp", "rug", "staart", "kat", "kopje", "ogen", "zweeft", "glimmen", "zacht", "bang", "lief", "blijven", "schrikken", "lachen", "aaien", "morgen"], "e3-niezende-zak": ["boot", "kant", "zak", "pak", "kist", "deur", "stoel", "tafel", "staart", "oren", "kat", "mand", "kussen", "doos", "rand", "schuift", "stil", "zacht", "niezen", "kinderen"], "m4-monster-feest": ["heks", "monster", "staart", "oren", "zaal", "groene", "wolvenmasker", "deinst", "stokstijf", "beeft", "gluurt", "deftig", "proest", "wafel"], "m4-pakjesglijbaan": ["pakjes", "glijbaan", "ruim", "dek", "zeil", "geritsel", "luik", "dekens", "badkamer", "badschuim", "speelgoed", "voorzichtig", "beneden", "badeend", "kapitein"], "e4-dansende-pompoen": ["pompoen", "grijns", "toverboek", "spreuk", "ranken", "drempel", "trommelaar", "roffel", "stoet", "ritme", "bevel", "stokjes", "slingers", "soepketel", "vleugels"], "e4-sint-rust": ["stoomboot", "zakdoeken", "verkouden", "bezorgd", "muisstil", "elleboog", "klepel", "wielas", "geruisloos", "gesnurk", "geschenken", "haard", "ontbijt", "helpers", "mompelt"]};
  window.ZISA_SPEED_GAMES ||= {};
  for(const story of stories){const vocabulary=new Set(story.pages.join(" ").toLowerCase().match(/[a-zà-ÿ]+/g));window.ZISA_SPEED_GAMES[story.id]={words:wordPractice[story.id].filter(word=>vocabulary.has(word.toLowerCase()))};}
  const replaced = new Set(stories.map(story => story.level));
  window.ZISA_BOOKS = (window.ZISA_BOOKS || []).filter(book => !book.theme || !replaced.has(book.level));
  for (const story of stories) {
    const image = index => `images/seizoenen-v2/${story.id}/${String(index + 1).padStart(2, '0')}.png`;
    const pages = story.pages.map((text, index) => ({text, image: image(index)}));
    story.begrip.forEach((question,index)=>{
      const correct=index%3, a=[...support[story.id].wrong[index]];
      a.splice(correct,0,question.antwoord);
      pages[question.page-1].task={type:'choice',q:question.vraag,a,correct,hint:'Lees nog eens. Wat gebeurt er in het verhaal?'};
    });
    window.ZISA_STORY_GLOSSARIES ||= {};
    window.ZISA_STORY_GLOSSARIES[story.id]=support[story.id].words;
    window.ZISA_LEVEL_GAMES ||= {};
    window.ZISA_LEVEL_GAMES[story.id]=[
      {type:'sequence',title:'Het verhaal in volgorde',q:'Zet de gebeurtenissen in de juiste volgorde.',items:[story.pages[0].split('\n')[0],story.pages[5].split('\n')[0],story.pages[11].split('\n')[0]]},
      {...pages[story.begrip.at(-1).page-1].task,title:'Denk terug aan het verhaal'}
    ];
    window.ZISA_BOOKS.push({
      id: story.id, level: story.level, theme: story.theme.toLowerCase(),
      title: story.title, blurb: story.blurb, cover: image(0),
      missionTitle:'Opdrachten bij het verhaal',
      pages,
      readingAdventure: story.id==='e4-sint-rust'?'boot-stil.html':`extra-leesspel.html#${story.id}`,
      readingAdventureLabel: ({'e4-sint-rust':'Extra: maak de boot stil ›','e3-spook-kat':'Extra: spokenmemory ›','e3-niezende-zak':'Extra: wie zit in de zak? ›','m4-monster-feest':'Extra: wie komt naar het feest? ›','m4-pakjesglijbaan':'Extra: de pakjespost ›','e4-dansende-pompoen':'Extra: pompoenenmemory ›'})[story.id]
    });
  }
})();
