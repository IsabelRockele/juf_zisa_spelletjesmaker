if (new URLSearchParams(location.search).get('mode') === 'ontdek') {
  document.title = 'Rad van Fortuin — Ontdek';
  document.body.classList.add('rad-ontdek');
  const menu = document.getElementById('radMenuLink');
  menu.href = 'ontdek/app.html';
  menu.textContent = '← Keuzemenu alle tools';
  document.querySelector('.brand').innerHTML = 'Rad van Fortuin <span>— Ontdek</span>';

  const status = document.createElement('strong');
  status.className = 'rad-ontdek-status';
  status.textContent = 'Eigen lijst onbeperkt · elke andere soort 1×';
  const account = document.createElement('button');
  account.type = 'button';
  account.className = 'rad-ontdek-account';
  account.textContent = 'Gratis account / aanmelden';
  document.getElementById('radTopbar').append(status, account);

  const info = document.createElement('section');
  info.className = 'rad-ontdek-info';
  info.innerHTML = '<div><h2>Een eigen lijst is onbeperkt gratis</h2><p>Typ of importeer zo vaak je wilt een namen- of keuzelijst en gebruik het rad volledig. Daarnaast mag je <strong>elke onderwijssoort één keer</strong> echt testen: afbeeldingen, tafels, rekensommen, executieve functies, beweging, taal, technisch lezen en Mix & Match. Een geactiveerd proefrad mag je tijdens dat spel onbeperkt blijven draaien.</p></div><div class="rad-ontdek-pro"><strong>PRO</strong><span>Alle onderwijsraden onbeperkt opnieuw genereren, gebruiken en bewaren.</span></div>';
  document.querySelector('.container').before(info);

  const [{ getApp, getApps }, { getFunctions, httpsCallable }, { startOntdekAuth }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js'),
    import('./ontdek-auth.js'),
  ]);

  let user = null;
  let trial = null;
  let pro = false;
  let wheelId = crypto.randomUUID ? crypto.randomUUID() : `rad-${Date.now()}`;
  let authorizedId = '';
  let currentKind = 'eigen-lijst';
  const kinds = {
    'Eigen afbeeldingen': 'afbeeldingen',
    'Tafeloefeningen': 'tafels',
    'Rekensommen': 'rekensommen',
    'Executieve functies': 'executieve-functies',
    'Bewegingsopdrachten': 'beweging',
    'Taalopdrachten': 'taal',
    'Technisch lezen': 'technisch-lezen',
    'Gemengd rad': 'mix',
  };

  function updateStatus() {
    if (pro) status.textContent = 'PRO actief · onbeperkt';
    else if (!user || !trial) status.textContent = 'Eigen lijst onbeperkt · elke andere soort 1×';
    else {
      const tested = Object.values(kinds).filter(kind => Number(trial.byTool?.[`rad-${kind}`] || 0) > 0).length;
      status.textContent = `Eigen lijst onbeperkt · ${tested}/8 andere soorten getest`;
    }
    account.textContent = user ? 'Account actief' : 'Gratis account / aanmelden';
    account.classList.toggle('is-signed-in', Boolean(user));
  }

  function newWheel() {
    wheelId = crypto.randomUUID ? crypto.randomUUID() : `rad-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    authorizedId = '';
  }

  startOntdekAuth({ onState: state => { user = state.user; trial = state.trial; pro = Boolean(state.pro); updateStatus(); } });
  account.addEventListener('click', () => { if (!user) window.openOntdekAuth?.('registreren'); });

  async function authorize() {
    if (currentKind === 'eigen-lijst' || pro || authorizedId === wheelId) return true;
    if (!user) { window.openOntdekAuth?.('registreren'); return false; }
    try {
      const reserve = httpsCallable(getFunctions(getApps().length ? getApp() : undefined, 'europe-west1'), 'reserveDiscoverDownload');
      const response = (await reserve({ toolId: `rad-${currentKind}`, pages: 1, reservationKey: wheelId })).data;
      trial = response;
      pro = Boolean(response.pro);
      authorizedId = wheelId;
      updateStatus();
      return true;
    } catch (error) {
      const raw = String(error?.message || error?.details || '');
      if (raw.includes('TOOL_LIMIT')) alert('Je hebt deze soort onderwijsrad al gratis getest. Je kunt een eigen tekst- of namenlijst onbeperkt blijven gebruiken. Met PRO kun je van elke soort onbeperkt nieuwe raden maken.');
      else if (raw.includes('TOTAL_LIMIT')) alert('Je vijftien gratis Ontdek-beurten zijn opgebruikt. Je kunt het Rad wel blijven verkennen.');
      else alert('Het gratis gebruik kon niet worden gecontroleerd. Probeer het straks opnieuw.');
      return false;
    }
  }

  function protect(button) {
    button?.addEventListener('click', async event => {
      if (button.dataset.ontdekAllowed === 'yes') { delete button.dataset.ontdekAllowed; return; }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!await authorize()) return;
      button.dataset.ontdekAllowed = 'yes';
      button.click();
    }, true);
  }

  document.addEventListener('DOMContentLoaded', () => {
    protect(document.getElementById('spinBtn'));
    protect(document.getElementById('downloadListBtn'));
    protect(document.getElementById('exportListBtn'));
    document.getElementById('newOptionsBtn')?.addEventListener('click', () => { currentKind = 'eigen-lijst'; newWheel(); });
    window.addEventListener('rad:configured', event => {
      currentKind = kinds[event.detail?.source] || 'eigen-lijst';
      newWheel();
    });
  });
  updateStatus();
}
