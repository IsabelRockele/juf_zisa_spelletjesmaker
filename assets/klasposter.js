const themes = {
  lezen: {
    title: 'Zisa Lezen',
    subtitle: 'Kies een boek en lees mee!',
  },
  spelen: {
    title: 'Zisa Spelen',
    subtitle: 'Kies een spel en oefen mee!',
  },
};

const mascots = [
  ['Bibi', 'bibi_leerjaar1.png'],
  ['Zisa', 'zisa_leerjaar2.png'],
  ['Karl', 'karl_leerjaar3.png'],
  ['Lana', 'lana_leerjaar4.png'],
];

export async function printClassPoster(url, theme, grades = []) {
  if (!url) return;
  const { title, subtitle } = themes[theme];
  const qr = window.qrcode(0, 'M');
  qr.addData(url);
  qr.make();

  const poster = document.createElement('article');
  poster.className = `klasposter klasposter--${theme}`;
  poster.innerHTML = `
    <div class="klasposter-brand">Juf Zisa <span>·</span> Voor onze klas</div>
    <div class="klasposter-mascots"></div>
    <h1>${title}</h1>
    <p class="klasposter-subtitle">${subtitle}</p>
    <div class="klasposter-code" role="img" aria-label="QR-code voor ${title}">
      ${qr.createSvgTag({ cellSize: 1, margin: 4, scalable: true })}
    </div>
    <p class="klasposter-instruction">Scan met je camera</p>
    <p class="klasposter-caption">Tik op de link die verschijnt.</p>`;

  const row = poster.querySelector('.klasposter-mascots');
  if (theme === 'lezen') {
    row.innerHTML = `<img src="https://zisa-leesprenten.pages.dev/images/zisa-leest.webp" alt="Zisa leest een boek">`;
  } else {
    row.innerHTML = mascots.map(([name, file], index) => {
      const grade = index + 1;
      if (!grades.includes(grade)) return '';
      return `<figure><img src="${new URL("../spelen/games/start_afbeeldingen/" + file, import.meta.url).href}" alt="${name}">
        <figcaption>Leerjaar ${grade}</figcaption></figure>`;
    }).join('');
  }
  await Promise.allSettled([...row.querySelectorAll('img')].map(img => img.decode()));

  document.body.append(poster);
  document.body.classList.add('klasposter-print');
  window.addEventListener('afterprint', () => {
    poster.remove();
    document.body.classList.remove('klasposter-print');
  }, { once: true });
  window.print();
}
