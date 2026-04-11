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
    _uid = user ? user.uid : null;
    _ready = true;
    _queue.forEach(function(cb) { cb(_uid); });
    _queue = [];
  });

  window.fbOnReady = function(cb) {
    if (_ready) { cb(_uid); } else { _queue.push(cb); }
  };

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

})();
