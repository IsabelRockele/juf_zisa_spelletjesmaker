// Alleen vaste spelbestemmingen zijn toegestaan in gedeelde links.
window.ZisaPlayLinks = (() => {
const games = [
  {
    "id": "dagen-week",
    "grade": 1,
    "label": "Dagen van de week – Bibi’s dagenavontuur",
    "path": "bibi-dagen/index.html"
  },
  {
    "id": "splitsmachine-1",
    "grade": 1,
    "label": "Bibi’s Splitsmachine",
    "path": "splitsmachine/index.html?leerjaar=1"
  },
  {
    "id": "bijenkorf",
    "grade": 1,
    "label": "De bijenkorf",
    "path": "splitsen_bibi.html"
  },
  {
    "id": "splitsbingo",
    "grade": 1,
    "label": "Splitsbingo",
    "path": "splits_bingo.html"
  },
  {
    "id": "honingpot",
    "grade": 1,
    "label": "De honingpot – splitsen",
    "path": "honingpot.html"
  },
  {
    "id": "bloemenweide",
    "grade": 1,
    "label": "De bloemenweide – plus en min",
    "path": "bloemenweide_keuze.html"
  },
  {
    "id": "honingpot-vullen",
    "grade": 1,
    "label": "Honingpot vullen",
    "path": "honingpot_vullen_keuze.html"
  },
  {
    "id": "bijenrace",
    "grade": 1,
    "label": "De bijenrace",
    "path": "bijenrace_keuze.html"
  },
  {
    "id": "bibi-winkel",
    "grade": 1,
    "label": "Bibi’s winkeltje",
    "path": "bibi-winkel.html"
  },
  {
    "id": "rekenbrug-1",
    "grade": 1,
    "label": "Bibi’s rekenbrug",
    "path": "rekenbrug-proef/index.html?leerjaar=1"
  },
  {
    "id": "splitsmachine-2",
    "grade": 2,
    "label": "Zisa’s Splitsmachine",
    "path": "splitsmachine/index.html?leerjaar=2"
  },
  {
    "id": "zinnenfabriek",
    "grade": 2,
    "label": "Zisa’s Zinnenfabriek",
    "path": "zinnenfabriek/index.html"
  },
  {
    "id": "spellingdetective",
    "grade": 2,
    "label": "Spellingdetective",
    "path": "spellingeiland/index.html?spel=detective"
  },
  {
    "id": "woordenwerkplaats",
    "grade": 2,
    "label": "De Woordenwerkplaats",
    "path": "spellingeiland/index.html?spel=workshop"
  },
  {
    "id": "tafels-2",
    "grade": 2,
    "label": "Tafels oefenen en spelen",
    "path": "tafel_overzicht.html"
  },
  {
    "id": "zisa-winkel",
    "grade": 2,
    "label": "Zisa’s winkel",
    "path": "zebrawinkel.html"
  },
  {
    "id": "rekenbrug-2",
    "grade": 2,
    "label": "Zisa’s rekenbrug",
    "path": "rekenbrug-proef/index.html?leerjaar=2"
  },
  {
    "id": "tafels-3",
    "grade": 3,
    "label": "Tafels oefenen en spelen",
    "path": "tafel3_overzicht.html"
  },
  {
    "id": "karl-markt",
    "grade": 3,
    "label": "Karls markt",
    "path": "cactusmarkt.html"
  },
  {
    "id": "rekenkern",
    "grade": 4,
    "label": "De Rekenkern",
    "path": "prototype_leerjaar4/index.html"
  },
  {
    "id": "breukenstudio",
    "grade": 4,
    "label": "De Breukenstudio",
    "path": "prototype_breuken4/index.html"
  }
];
function find(id) { return games.find(game => game.id === id); }
function url(base, id) {
  const result = new URL(base, location.href);
  result.searchParams.delete('oefening');
  if (find(id)) result.searchParams.set('oefening', id);
  return result.href;
}
function fill(select, grades) {
  const previous = select.value;
  select.replaceChildren(new Option('Alle spellen van de gekozen leerjaren', ''));
  grades.forEach(grade => {
    const group = document.createElement('optgroup');
    group.label = `Leerjaar ${grade}`;
    games.filter(game => game.grade === grade).forEach(game => group.append(new Option(game.label, game.id)));
    select.append(group);
  });
  select.value = find(previous) && grades.includes(find(previous).grade) ? previous : '';
}
return { games, find, url, fill };
})();
