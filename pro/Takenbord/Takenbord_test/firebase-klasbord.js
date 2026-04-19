// ── FIREBASE KLASBORD INTEGRATIE ─────────────────────────────────────────────

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw",
  authDomain: "zisa-spelletjesmaker-pro.firebaseapp.com",
  projectId: "zisa-spelletjesmaker-pro",
  storageBucket: "zisa-spelletjesmaker-pro.firebasestorage.app",
  messagingSenderId: "828063957776",
  appId: "1:828063957776:web:8d8686b478846fe980db95"
};

(function() {
  // Init Firebase — hergebruik bestaande app als die al bestaat
  var app;
  if (!firebase.apps || !firebase.apps.length) {
    app = firebase.initializeApp(FIREBASE_CONFIG);
  } else {
    app = firebase.apps[0];
  }

  var _auth = firebase.auth(app);
  var _db = firebase.firestore(app);
  var _uid = null;
  var _ready = false;
  var _queue = [];

  _auth.onAuthStateChanged(function(user) {
    if (user) {
      // Ingelogd (e-mail of anoniem)
      _uid = user.uid;
      _ready = true;
      _queue.forEach(function(cb) { cb(_uid); });
      _queue = [];
    } else {
      // Niet ingelogd → anoniem aanmelden zodat Firestore-regels werken
      _auth.signInAnonymously().catch(function(e) {
        console.warn('Anoniem aanmelden mislukt:', e.message);
        // Toch ready melden zodat de app niet hangt
        _uid = null;
        _ready = true;
        _queue.forEach(function(cb) { cb(null); });
        _queue = [];
      });
    }
  });

  window.fbOnReady = function(cb) {
    if (_ready) { cb(_uid); } else { _queue.push(cb); }
  };

  // ── PRIVÉ (leerkracht, per uid) ───────────────────────────────────────────

  window.fbSave = async function(key, data) {
    if (!_uid) return;
    try {
      await _db.collection('klasbord').doc(_uid).collection('data').doc(key).set(data);
    } catch(e) { console.warn('fbSave:', e.message); }
  };

  window.fbLoad = async function(key) {
    if (!_uid) return null;
    try {
      var snap = await _db.collection('klasbord').doc(_uid).collection('data').doc(key).get();
      return snap.exists ? snap.data() : null;
    } catch(e) { console.warn('fbLoad:', e.message); return null; }
  };

  window.fbDelete = async function(key) {
    if (!_uid) return;
    try {
      await _db.collection('klasbord').doc(_uid).collection('data').doc(key).delete();
    } catch(e) { console.warn('fbDelete:', e.message); }
  };

  window.fbLoadMeta = function() { return window.fbLoad('_meta'); };
  window.fbSaveMeta = function(meta) { return window.fbSave('_meta', meta); };

  // ── GEDEELD (leerkracht → iPad, iedereen kan lezen én schrijven) ──────────

  window.fbSaveShared = async function(key, data) {
    try {
      await _db.collection('klasbord_shared').doc(key).set(data);
    } catch(e) { console.warn('fbSaveShared:', e.message); }
  };

  window.fbLoadShared = async function(key) {
    try {
      var snap = await _db.collection('klasbord_shared').doc(key).get();
      return snap.exists ? snap.data() : null;
    } catch(e) { console.warn('fbLoadShared:', e.message); return null; }
  };

  // ── REALTIME LISTENER op gedeeld bord (voor leerkrachtversie) ────────────
  // Geeft een unsubscribe-functie terug. Gebruik: var stop = fbListenShared(key, fn);

  window.fbListenShared = function(key, callback) {
    return _db.collection('klasbord_shared').doc(key).onSnapshot(function(snap) {
      if (snap.exists) { callback(snap.data()); }
    }, function(e) { console.warn('fbListenShared:', e.message); });
  };

})();
