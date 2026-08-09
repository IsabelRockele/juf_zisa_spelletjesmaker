const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp, getApps, getApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

if (!getApps().length) initializeApp();
const db = getFirestore();
const collegaApp = getApps().some((app) => app.name === 'zisa-collegas-auth')
  ? getApp('zisa-collegas-auth')
  : initializeApp({ projectId: 'zisa-collegas' }, 'zisa-collegas-auth');

const PRO_DAGLIMIET = 10;
const COLLEGA_DAGLIMIET = 20;
const LICENTIE_COLLECTIES = ['licenses', 'Licenties'];
const OWNER_EMAILS = new Set(['isabel.rockele@gmail.com', 'jorn.neeus@gmail.com']);

// Productiesleutels worden beheerd door Firebase Secret Manager.
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

function vandaagBrussel() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

async function verifieerGebruiker(req) {
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const fout = new Error('Meld je opnieuw aan bij de Spelgenerator.');
    fout.status = 401;
    throw fout;
  }

  let token;
  let accountType;
  try {
    token = await getAuth().verifyIdToken(match[1]);
    accountType = 'pro';
  } catch {
    try {
      token = await getAuth(collegaApp).verifyIdToken(match[1]);
      accountType = 'collega';
    } catch {
      const fout = new Error('Je aanmelding is verlopen. Meld je opnieuw aan.');
      fout.status = 401;
      throw fout;
    }
  }

  const email = String(token.email || '').toLowerCase();
  if (accountType === 'collega') {
    return {
      uid: token.uid,
      email,
      accountType,
      accountKey: `collega_${token.uid}`,
      limiet: COLLEGA_DAGLIMIET
    };
  }

  if (OWNER_EMAILS.has(email)) {
    return {
      uid: token.uid,
      email,
      accountType,
      accountKey: `pro_${token.uid}`,
      limiet: PRO_DAGLIMIET
    };
  }

  let nieuwste = null;
  for (const collectie of LICENTIE_COLLECTIES) {
    for (const [veld, waarde] of [['uid', token.uid], ['email', email]]) {
      if (!waarde) continue;
      const qs = await db.collection(collectie)
        .where(veld, '==', waarde)
        .orderBy('expiresAt', 'desc')
        .limit(1)
        .get();
      if (!qs.empty) {
        const kandidaat = qs.docs[0].data();
        const kandidaatMs = kandidaat.expiresAt?.toMillis?.() || 0;
        const nieuwsteMs = nieuwste?.expiresAt?.toMillis?.() || 0;
        if (!nieuwste || kandidaatMs > nieuwsteMs) nieuwste = kandidaat;
      }
    }
  }

  const status = String(nieuwste?.status || '').toLowerCase();
  const actief = status === 'active' || status === 'actief';
  const vervaltOp = nieuwste?.expiresAt?.toMillis?.() || 0;
  if (!nieuwste || !actief || (vervaltOp && vervaltOp < Date.now())) {
    const fout = new Error('Voor vraagstukken is een actief Pro-abonnement nodig.');
    fout.status = 403;
    throw fout;
  }
  return {
    uid: token.uid,
    email,
    accountType,
    accountKey: `pro_${token.uid}`,
    limiet: PRO_DAGLIMIET
  };
}

function tellerRef(accountKey) {
  return db.collection('ai_vraagstukken_daglimieten').doc(`${accountKey}_${vandaagBrussel()}`);
}

async function leesResterend(gebruiker) {
  const snap = await tellerRef(gebruiker.accountKey).get();
  const gebruikt = Number(snap.data()?.gebruikt || 0);
  return Math.max(0, gebruiker.limiet - gebruikt);
}

async function reserveerVraagstuk(gebruiker) {
  return db.runTransaction(async (tx) => {
    const ref = tellerRef(gebruiker.accountKey);
    const snap = await tx.get(ref);
    const gebruikt = Number(snap.data()?.gebruikt || 0);
    if (gebruikt >= gebruiker.limiet) {
      const fout = new Error(`Je hebt je dagelijkse limiet van ${gebruiker.limiet} vraagstukken bereikt. Morgen kan je opnieuw.`);
      fout.status = 429;
      throw fout;
    }
    const nieuwAantal = gebruikt + 1;
    tx.set(ref, {
      uid: gebruiker.uid,
      accountType: gebruiker.accountType,
      datum: vandaagBrussel(),
      limiet: gebruiker.limiet,
      gebruikt: nieuwAantal,
      bijgewerktOp: FieldValue.serverTimestamp()
    }, { merge: true });
    return gebruiker.limiet - nieuwAantal;
  });
}

async function geefReservatieTerug(gebruiker) {
  await db.runTransaction(async (tx) => {
    const ref = tellerRef(gebruiker.accountKey);
    const snap = await tx.get(ref);
    const gebruikt = Number(snap.data()?.gebruikt || 0);
    if (gebruikt > 0) tx.update(ref, { gebruikt: gebruikt - 1, bijgewerktOp: FieldValue.serverTimestamp() });
  });
}

/*
 * Collega-accounts worden uitgegeven in het afzonderlijke Firebase-project
 * zisa-collegas. Alleen een geldig token uit dat project krijgt de collegalimiet.
 * Pro-tokens worden hieronder bovendien nog tegen de actieve licentie gecontroleerd.
 */
exports.genereerVraagstuk = onRequest({
  region: 'europe-west1',
  cors: [
    'https://tools.jufzisa.be',
    'https://isabelrockele.github.io',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:5501'
  ],
  secrets: [ANTHROPIC_API_KEY]
}, async (req, res) => {

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  let gebruiker;
  try {
    gebruiker = await verifieerGebruiker(req);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
    return;
  }

  if (req.body?.action === 'status') {
    const remaining = await leesResterend(gebruiker);
    res.json({ remaining, limit: gebruiker.limiet, accountType: gebruiker.accountType });
    return;
  }

  const prompt = req.body?.prompt;
  if (!prompt) {
    res.status(400).json({ error: 'Geen prompt meegegeven' });
    return;
  }

  let remaining;
  try {
    remaining = await reserveerVraagstuk(gebruiker);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
    return;
  }

  const apiKey = ANTHROPIC_API_KEY.value();
  if (!apiKey) {
    await geefReservatieTerug(gebruiker).catch(() => {});
    res.status(500).json({ error: 'API sleutel niet geconfigureerd' });
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      await geefReservatieTerug(gebruiker);
      res.status(500).json({ error: data.error.message });
      return;
    }

    res.json({ tekst: data.content[0].text.trim(), remaining, limit: gebruiker.limiet });

  } catch (e) {
    await geefReservatieTerug(gebruiker).catch(() => {});
    res.status(500).json({ error: e.message });
  }
});
// =================================================================
// rapportFeedback — Cloud Function voor AI-suggesties bij rapporten
// (V2-syntax + DEBUG-modus die fouten in de response zet)
// =================================================================
//
// PLAATS: onderaan vraagstukken/index.js, NA de bestaande genereerVraagstuk
// VERVANG het vorige rapportFeedback-blok dat je vorige keer hebt geplakt.
//
// Deploy met:   firebase deploy --only functions:vraagstukken

const TOEGESTANE_ORIGINS_RAPPORT = [
  'https://isabelrockele.github.io',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501'
];

exports.rapportFeedback = onRequest({
  region: 'europe-west1',
  cors: TOEGESTANE_ORIGINS_RAPPORT,
  secrets: [ANTHROPIC_API_KEY]
}, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Debug-info verzamelen — wordt terug gestuurd bij fout
  const debug = {
    stap: 'start',
    apiKeyAanwezig: false,
    apiKeyLengte: 0
  };

  try {
    debug.stap = 'body-lezen';
    const body = req.body || {};
    const kindNaam = (body.kindNaam || 'het kind').toString().slice(0, 50);
    const categorie = body.categorie || 'watGaatGoed';
    const periode = (body.periode || '').toString().slice(0, 80);
    const periodeNummer = body.periodeNummer || null;
    const toetsdata = body.toetsdata || {};
    const foutWoorden = Array.isArray(body.foutWoorden) ? body.foutWoorden.slice(0, 8) : [];
    const puntenboekOpmerkingen = Array.isArray(body.puntenboekOpmerkingen)
      ? body.puntenboekOpmerkingen.slice(0, 6) : [];
    const spreektoetsDetail = body.spreektoetsDetail || null;
    const reedsGekozen = Array.isArray(body.reedsGekozen) ? body.reedsGekozen.slice(0, 8) : [];

    debug.stap = 'apikey-check';
    const apiKey = ANTHROPIC_API_KEY.value();
    debug.apiKeyAanwezig = !!apiKey;
    debug.apiKeyLengte = apiKey ? apiKey.length : 0;

    if (!apiKey) {
      console.error('rapportFeedback: ANTHROPIC_KEY niet gezet');
      res.status(500).json({ error: 'API sleutel niet geconfigureerd', debug });
      return;
    }

    debug.stap = 'prompt-bouwen';
    const prompt = bouwRapportPrompt({
      kindNaam, categorie, periode, periodeNummer,
      toetsdata, foutWoorden,
      puntenboekOpmerkingen, spreektoetsDetail, reedsGekozen
    });
    debug.promptLengte = prompt.length;

    debug.stap = 'api-call';
    const httpsLib = require('https');
    const apiBody = JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(apiBody)
      }
    };

    // Promise wrapper rond de https-call zodat we async/await kunnen gebruiken
    const apiResponse = await new Promise((resolve, reject) => {
      const apiRequest = httpsLib.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          resolve({ statusCode: response.statusCode, body: data });
        });
      });
      apiRequest.on('error', reject);
      apiRequest.write(apiBody);
      apiRequest.end();
    });

    debug.stap = 'api-response-parsen';
    debug.apiStatus = apiResponse.statusCode;

    let parsed;
    try {
      parsed = JSON.parse(apiResponse.body);
    } catch (e) {
      console.error('rapportFeedback: ongeldige JSON van Anthropic', apiResponse.body.slice(0, 500));
      res.status(500).json({ error: 'Ongeldige API respons', debug, ruwResponse: apiResponse.body.slice(0, 200) });
      return;
    }

    if (parsed.error) {
      console.error('rapportFeedback: Anthropic error', parsed.error);
      res.status(500).json({ error: parsed.error.message || 'Anthropic API fout', debug, anthropic: parsed.error });
      return;
    }

    debug.stap = 'zinnen-parsen';
    const tekst = (parsed.content && parsed.content[0] && parsed.content[0].text) || '';
    const zinnen = parseRapportZinnen(tekst);

    res.json({ zinnen });
  } catch (e) {
    console.error('rapportFeedback faalde:', e);
    res.status(500).json({
      error: e.message || 'onbekende fout',
      stack: (e.stack || '').slice(0, 500),
      debug
    });
  }
});

function bouwRapportPrompt(ctx) {
  const {
    kindNaam, categorie, periode, periodeNummer,
    toetsdata, foutWoorden,
    puntenboekOpmerkingen, spreektoetsDetail, reedsGekozen
  } = ctx;

  const catLabels = {
    watGaatGoed: 'Wat gaat goed (positieve punten)',
    groeipunten: 'Groeipunten (waar het kind nog op kan oefenen)',
    werkhouding: 'Werkhouding & zelfstandigheid'
  };
  const catLabel = catLabels[categorie] || categorie;

  const lijnen = [];
  lijnen.push('Je bent een tweede-graad-leerkracht in een GO!-basisschool in Vlaanderen.');
  lijnen.push('Je geeft feedback aan een anderstalige nieuwkomer in het Nederlands.');
  lijnen.push('Toon: Vlaamse leerkracht-toon, warm en concreet ("Sara durft...", "Sara mag nog...").');
  lijnen.push('');
  lijnen.push('Leerling: ' + kindNaam);
  if (periode) {
    lijnen.push('Rapportperiode: ' + periode + (periodeNummer ? ' (nummer ' + periodeNummer + ')' : ''));
    if (periodeNummer === 1) lijnen.push('Dit is het eerste rapport van het schooljaar — verwacht beginnersniveau.');
  }
  lijnen.push('');

  if (categorie !== 'werkhouding') {
    lijnen.push('Toets-resultaten in deze periode:');
    ['luisteren', 'lezen', 'schrijven', 'spreken'].forEach(v => {
      const td = toetsdata[v];
      if (td && td.aantal > 0) {
        lijnen.push('- ' + capitalizeR(v) + ': ' + td.pct + '% juist (' + td.juist + '/' + td.totaal + ', ' + td.aantal + ' toets' + (td.aantal === 1 ? '' : 'en') + ')');
      } else {
        lijnen.push('- ' + capitalizeR(v) + ': nog niet getoetst in deze periode');
      }
    });

    if (spreektoetsDetail) {
      lijnen.push('');
      if (spreektoetsDetail.vlot && spreektoetsDetail.vlot.length > 0) {
        lijnen.push('Spreken — vlot uitgesproken: ' + spreektoetsDetail.vlot.join(', '));
      }
      if (spreektoetsDetail.aarzelt && spreektoetsDetail.aarzelt.length > 0) {
        lijnen.push('Spreken — aarzelend: ' + spreektoetsDetail.aarzelt.join(', '));
      }
      if (spreektoetsDetail.niet && spreektoetsDetail.niet.length > 0) {
        lijnen.push('Spreken — nog niet juist: ' + spreektoetsDetail.niet.join(', '));
      }
    }

    if (foutWoorden && foutWoorden.length > 0) {
      lijnen.push('Woorden waar het nog moeilijk gaat: ' + foutWoorden.join(', '));
    }
  }

  if (puntenboekOpmerkingen && puntenboekOpmerkingen.length > 0) {
    lijnen.push('');
    lijnen.push('Eigen observaties van de juf bij toetsen (gekoppeld aan deze categorie):');
    puntenboekOpmerkingen.forEach(o => {
      const bron = o.toets ? ' (uit ' + o.toets + ')' : '';
      lijnen.push('- "' + o.opmerking + '"' + bron);
    });
    lijnen.push('Bouw verder op deze observaties — ze zijn de meest specifieke informatie.');
  }

  if (reedsGekozen && reedsGekozen.length > 0) {
    lijnen.push('');
    lijnen.push('Zinnen die de juf al heeft gekozen voor deze categorie (geef ANDERE suggesties, geen herhaling):');
    reedsGekozen.forEach(z => lijnen.push('- "' + z + '"'));
  }

  if (categorie === 'werkhouding' && (!puntenboekOpmerkingen || puntenboekOpmerkingen.length === 0)) {
    lijnen.push('');
    lijnen.push('Geef 3 algemene voorbeeldzinnen over werkhouding en zelfstandigheid voor een 7-8 jarige nieuwkomer.');
  } else if (categorie === 'groeipunten') {
    lijnen.push('');
    lijnen.push('Schrijf 3 GROEIPUNTEN — dingen waar ' + kindNaam + ' NOG op moet oefenen.');
    lijnen.push('GEEN positieve dingen, GEEN dingen die al goed gaan!');
    lijnen.push('Groeipunten zijn vaardigheden die nog NIET vlot lukken.');
    lijnen.push('Begin met formuleringen zoals: "' + kindNaam + ' mag nog...", "' + kindNaam + ' kan oefenen op...", "' + kindNaam + ' heeft nog moeite met..."');
    lijnen.push('Baseer je vooral op LAGE percentages, woorden die nog moeilijk gaan, en aarzelende/foute spreektoets-woorden.');
  } else if (categorie === 'watGaatGoed') {
    lijnen.push('');
    lijnen.push('Schrijf 3 zinnen over WAT GOED GAAT — positieve, herkenbare punten.');
    lijnen.push('Baseer je vooral op HOGE percentages en vlot uitgesproken woorden.');
    lijnen.push('Begin met formuleringen zoals: "' + kindNaam + ' kan al...", "' + kindNaam + ' durft...", "' + kindNaam + ' begrijpt..."');
  } else {
    lijnen.push('');
    lijnen.push('Schrijf 3 zinnen voor de categorie "' + catLabel + '".');
  }

  lijnen.push('');
  lijnen.push('Eisen per zin:');
  lijnen.push('- Begint met "' + kindNaam + '" of verwijst direct naar ' + kindNaam);
  lijnen.push('- Maximum 14 woorden');
  lijnen.push('- Concreet, niet algemeen');
  if (categorie === 'watGaatGoed') {
    lijnen.push('- Positief en aanmoedigend');
  } else if (categorie === 'groeipunten') {
    lijnen.push('- Constructief — benoem wat NOG niet vlot lukt');
    lijnen.push('- NOOIT iets positiefs schrijven hier — dat hoort in "Wat gaat goed"');
  } else {
    lijnen.push('- Respectvol — werkhouding is gevoelig');
  }

  lijnen.push('');
  lijnen.push('Antwoord ENKEL met de 3 zinnen, één per regel, zonder nummering of bullets.');

  return lijnen.join('\n');
}

function parseRapportZinnen(tekst) {
  return tekst.split('\n')
    .map(r => r.trim())
    .filter(r => r.length > 0)
    .map(r => r.replace(/^(\d+[\.\)]\s*|[-*•]\s*)/, '').trim())
    .filter(r => r.length > 5)
    .slice(0, 3);
}

function capitalizeR(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
