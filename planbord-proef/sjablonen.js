(function () {
  function bord(naam, icoon, omschrijving, thema, rijk) {
    return {
      id: `${rijk.type}-${Math.random().toString(36).slice(2, 8)}`,
      naam, icoon, omschrijving, rijk,
      data: { versie: 4, header: { tekst: naam, thema, tekstkleur: '#3d315f', jarige: '' }, canvas: { breedte: 1600, hoogte: 730 }, elementen: [] },
    };
  }

  window.maakProefSjablonen = function () {
    const nu = new Date();
    return {
      versie: 2,
      borden: [
        bord('Welkomstbord', '👋', 'Binnenkomen met stappen en sleeptimer', 'zon', {
          type: 'ochtend', toonTekst: false, starttijd: '08:30',
          vrijeElementen: [],
          items: [
            { icoon: 'brooddoos-broodbak', titel: 'Brooddoos', tekst: 'Leg je brooddoos in de broodbak' },
            { icoon: 'drinkbus-vaste-plek', titel: 'Drinkbus', tekst: 'Zet je drinkbus op de vaste plek' },
            { icoon: 'snack-fruit-bak', titel: 'Koek en fruit', tekst: 'Leg je koekendoos en fruitdoos in hun bak' },
            { icoon: 'agendamap-tafel', titel: 'Agendamap', tekst: 'Leg je agendamap op je tafel' },
            { icoon: 'brieven-afgeven', titel: 'Brieven', tekst: 'Geef je brieven af' },
            { icoon: 'huistaak-afgeven', titel: 'Huistaak', tekst: 'Geef je huistaak af' },
            { icoon: 'boekentas-opbergen', titel: 'Boekentas', tekst: 'Zet je boekentas op de afgesproken plek' },
            { icoon: 'stille-dagstarter', titel: 'Dagstarter', tekst: 'Begin stil aan de dagstarter' },
          ],
        }),
        bord('Start van de dag', '🌅', 'Drie vaste stappen', 'blauw', {
          type: 'start', items: [
            { icoon: 'uitstap', tekst: 'Hang je jas en boekentas netjes weg' },
            { icoon: 'handschrift', tekst: 'Geef je agenda, brieven en huistaak af' },
            { icoon: 'lezen', tekst: 'Leg je materiaal klaar en begin aan de dagstarter' },
          ],
        }),
        bord('Welke dag is het?', '📅', 'Weekdagen en kalenderhuisje', 'paars', { type: 'dagen' }),
        bord('Het weer', '🌦️', 'Interactieve weerkalender', 'blauw', { type: 'weer', elementen: [], graden: 20 }),
        bord('Maandkalender', '🗓️', 'Echte kalender met symbolen', 'groen', {
          type: 'kalender', maand: nu.getMonth(), jaar: nu.getFullYear(),
          events: {}, geselecteerd: 'verjaardag',
        }),
        bord('Dagprogramma', '🧭', 'Kant-en-klare dagindeling', 'oranje', {
          type: 'programma', items: [
            { icoon: 'taal', titel: 'Taal', tijd: '08:45' },
            { icoon: 'rekenen', titel: 'Rekenen', tijd: '09:35' },
            { icoon: 'speeltijd', titel: 'Speeltijd', tijd: '10:25' },
            { icoon: 'lezen', titel: 'Lezen', tijd: '10:45' },
            { icoon: 'handschrift', titel: 'Handschrift', tijd: '11:25' },
            { icoon: 'speeltijd', titel: 'Middagpauze', tijd: '12:00' },
            { icoon: 'wereldorientatie', titel: 'WO', tijd: '13:15' },
            { icoon: 'muzische-vorming', titel: 'Muzische vorming', tijd: '14:05' },
            { icoon: 'speeltijd', titel: 'Speeltijd', tijd: '14:55' },
            { icoon: 'uitstap', titel: 'Opruimen en naar huis', tijd: '15:20' },
          ],
        }),
        bord('Klasroutines', '🎒', 'Afspraken doorheen de dag', 'teal', {
          type: 'routines', blokken: [
            { titel: 'Bij het binnenkomen', icoon: 'jas-kapstok', items: [{tekst:'Hang je jas aan de kapstok',icoon:'jas-kapstok'},{tekst:'Geef documenten af',icoon:'brieven-afgeven'},{tekst:'Start rustig met je dagtaak',icoon:'stille-dagstarter'}] },
            { titel: 'Voor en na de speeltijd', icoon: 'speeltijd', items: [{tekst:'Ruim je werkplek op',icoon:'werkplek-opruimen'},{tekst:'Ga rustig in de rij',icoon:'rustig-in-rij'},{tekst:'Kom stil binnen en ga zitten',icoon:'stil-binnenkomen'}] },
            { titel: 'Einde van de dag', icoon: 'agenda-invullen', items: [{tekst:'Schrijf je agenda in',icoon:'agenda-invullen'},{tekst:'Maak je boekentas',icoon:'boekentas-maken'},{tekst:'Ruim je tafel en taakje op',icoon:'tafel-taakje-opruimen'}] },
          ],
        }),
      ],
    };
  };
})();
