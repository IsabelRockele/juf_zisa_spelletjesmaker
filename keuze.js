// keuze.js

// Zoek de juiste knop op basis van de tekst
const knoppen = document.querySelectorAll('.keuze-knop');

knoppen.forEach(knop => {
  knop.addEventListener('click', () => {
    const tekst = knop.textContent.trim();

    switch (true) {
      case tekst.includes('Doolhof'):
        window.location.href = 'doolhof.html';
        break;
      case tekst.includes('Woordzoeker'):
        window.location.href = 'woordzoeker.html';
        break;
      case tekst.includes('Punttekening'):
        window.location.href = 'punttekening.html';
        break;
      case tekst.includes('Lettercode'):
        window.location.href = 'lettercode.html';
        break;
      case tekst.includes('Geheime boodschap'):
        window.location.href = 'geheimeboodschap.html';
        break;
      case tekst.includes('Kruiswoordpuzzel'):
        window.location.href = 'kruiswoordpuzzel.html';
        break;
      case tekst.includes('Rekenvierkant'):
        window.location.href = 'rekenvierkant.html';
        break;
      case tekst.includes('Rekenweg'):
        window.location.href = 'rekenweg.html';
        break;
      case tekst.includes('Sudoku'):
        window.location.href = 'sudoku.html';
        break;
      case tekst.includes('Zoek de verschillen'):
        window.location.href = 'zoekverschillen.html';
        break;
      case tekst.includes('Werkblad Kloklezen'):
        window.location.href = 'kloklezen.html';
        break;
      case tekst.includes('Werkblad bewerkingen'): // NIEUWE CODE
        window.location.href = 'bewerkingen_keuze.html'; // NIEUWE CODE
        break; // NIEUWE CODE
      default:
        alert('Deze functie is nog niet actief.');
    }
  });
});

