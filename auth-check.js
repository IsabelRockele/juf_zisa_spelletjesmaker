// auth-check.js
// Dit script controleert of een collega is ingelogd op de gratis Spelgenerator.
// Als niet ingelogd → automatisch doorsturen naar login_collega.html
// Als wel ingelogd → app blijft beschikbaar + uitlog- en wachtwoord-wijzigen knoppen in sidebar

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

// Firebase configuratie voor zisa-collegas
const firebaseConfig = {
  apiKey: "AIzaSyCYkB9CSNahs1UNv9pduNC7TTsj0LNNHSU",
  authDomain: "zisa-collegas.firebaseapp.com",
  projectId: "zisa-collegas",
  storageBucket: "zisa-collegas.firebasestorage.app",
  messagingSenderId: "1029178227426",
  appId: "1:1029178227426:web:cb21cf199072c44b30bcbb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence);

// Verberg pagina-inhoud tot login-check klaar is (voorkomt flits van content)
document.documentElement.style.visibility = 'hidden';

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Niet ingelogd → naar login
    window.location.replace("login_collega.html");
  } else {
    // Wel ingelogd → toon pagina + voeg knoppen toe aan sidebar
    currentUser = user;
    document.documentElement.style.visibility = 'visible';
    addSidebarButtons();
  }
});

function addSidebarButtons() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertButtons);
  } else {
    insertButtons();
  }
}

function insertButtons() {
  const sidebarHelp = document.querySelector('.sidebar-help');
  if (!sidebarHelp) return;

  // Container voor de twee knoppen
  const accountContainer = document.createElement('div');
  accountContainer.style.marginTop = '8px';
  accountContainer.style.width = '100%';
  accountContainer.style.display = 'flex';
  accountContainer.style.flexDirection = 'column';
  accountContainer.style.gap = '6px';

  // Wachtwoord wijzigen knop (met geel accent)
  const changePassBtn = createSidebarButton('🔑 Wachtwoord wijzigen', () => {
    openChangePasswordModal();
  }, true);

  // Uitlogknop
  const logoutBtn = createSidebarButton('🚪 Uitloggen', async () => {
    if (confirm('Wil je echt uitloggen?')) {
      try {
        await signOut(auth);
        window.location.replace("login_collega.html");
      } catch (error) {
        alert('Er ging iets mis bij het uitloggen. Probeer opnieuw.');
      }
    }
  });

  accountContainer.appendChild(changePassBtn);
  accountContainer.appendChild(logoutBtn);
  sidebarHelp.appendChild(accountContainer);

  // Modal alvast in DOM zetten (verborgen)
  insertChangePasswordModal();
}

function createSidebarButton(label, onClick, accent = false) {
  const btn = document.createElement('button');
  btn.innerHTML = label;

  // Basis-stijl
  const baseColor = accent ? '#ffcf56' : '#ddd';
  const baseBorder = accent ? '#7a6020' : '#555';
  const baseBg = accent ? 'rgba(255, 207, 86, 0.08)' : '#383838';
  const hoverBg = accent ? 'rgba(255, 207, 86, 0.18)' : '#484848';
  const hoverColor = accent ? '#ffcf56' : '#fff';

  btn.style.cssText = `
    width: 100%;
    background: ${baseBg};
    color: ${baseColor};
    border: 1px solid ${baseBorder};
    border-radius: 10px;
    padding: 9px 10px;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  `;
  btn.addEventListener('mouseenter', () => {
    btn.style.background = hoverBg;
    btn.style.color = hoverColor;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = baseBg;
    btn.style.color = baseColor;
  });
  btn.addEventListener('click', onClick);
  return btn;
}

// === Wachtwoord wijzigen modal ===

function insertChangePasswordModal() {
  const modal = document.createElement('div');
  modal.id = 'changePassModal';
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.55);
    z-index: 9999;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Comic Sans MS', cursive, sans-serif;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 16px; max-width: 420px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.3); overflow: hidden;">
      <div style="background: #2a2a2a; color: white; padding: 20px 24px;">
        <h2 style="font-size: 1.2rem; margin: 0; color: #ffcf56;">🔑 Wachtwoord wijzigen</h2>
      </div>

      <div style="padding: 22px 24px;">
        <div id="changePassMessage" style="display: none; padding: 11px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 0.85rem; line-height: 1.5;"></div>

        <p style="font-size: 0.85rem; color: #555; margin-bottom: 14px;">
          Ingelogd als: <strong id="changePassEmail">...</strong>
        </p>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 0.8rem; font-weight: bold; color: #2a2a2a; margin-bottom: 5px;">Huidig wachtwoord</label>
          <input type="password" id="currentPass" style="width: 100%; padding: 10px 12px; border: 2px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 0.95rem;" autocomplete="current-password" placeholder="••••••••">
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 0.8rem; font-weight: bold; color: #2a2a2a; margin-bottom: 5px;">Nieuw wachtwoord</label>
          <input type="password" id="newPass" style="width: 100%; padding: 10px 12px; border: 2px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 0.95rem;" autocomplete="new-password" placeholder="minstens 6 tekens">
        </div>

        <div style="margin-bottom: 18px;">
          <label style="display: block; font-size: 0.8rem; font-weight: bold; color: #2a2a2a; margin-bottom: 5px;">Bevestig nieuw wachtwoord</label>
          <input type="password" id="confirmPass" style="width: 100%; padding: 10px 12px; border: 2px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 0.95rem;" autocomplete="new-password" placeholder="herhaal nieuw wachtwoord">
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="cancelPassBtn" style="flex: 1; background: transparent; color: #666; border: 1px solid #ccc; border-radius: 10px; padding: 11px; font-family: inherit; font-size: 0.9rem; font-weight: bold; cursor: pointer;">Annuleren</button>
          <button id="savePassBtn" style="flex: 1; background: #ffcf56; color: #5a4a1a; border: none; border-radius: 10px; padding: 11px; font-family: inherit; font-size: 0.9rem; font-weight: bold; cursor: pointer;">Opslaan</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event listeners
  document.getElementById('cancelPassBtn').addEventListener('click', closeChangePasswordModal);
  document.getElementById('savePassBtn').addEventListener('click', saveNewPassword);

  // Sluit bij klik buiten modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeChangePasswordModal();
  });

  // Enter-toets in laatste veld → opslaan
  document.getElementById('confirmPass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveNewPassword();
  });
}

function openChangePasswordModal() {
  const modal = document.getElementById('changePassModal');
  if (!modal) return;
  document.getElementById('changePassEmail').textContent = currentUser?.email || '';
  document.getElementById('currentPass').value = '';
  document.getElementById('newPass').value = '';
  document.getElementById('confirmPass').value = '';
  hideChangePassMessage();
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('currentPass').focus(), 100);
}

function closeChangePasswordModal() {
  const modal = document.getElementById('changePassModal');
  if (modal) modal.style.display = 'none';
}

function showChangePassMessage(text, type) {
  const box = document.getElementById('changePassMessage');
  box.innerHTML = text;
  box.style.display = 'block';
  if (type === 'error') {
    box.style.background = '#fde8e8';
    box.style.color = '#8b2424';
    box.style.borderLeft = '4px solid #c0392b';
  } else if (type === 'success') {
    box.style.background = '#e8f7e8';
    box.style.color = '#2d5a2d';
    box.style.borderLeft = '4px solid #27ae60';
  } else {
    box.style.background = '#fff4e0';
    box.style.color = '#6b4a10';
    box.style.borderLeft = '4px solid #f39c12';
  }
}

function hideChangePassMessage() {
  const box = document.getElementById('changePassMessage');
  if (box) box.style.display = 'none';
}

async function saveNewPassword() {
  hideChangePassMessage();

  const currentPass = document.getElementById('currentPass').value;
  const newPass = document.getElementById('newPass').value;
  const confirmPass = document.getElementById('confirmPass').value;
  const saveBtn = document.getElementById('savePassBtn');

  // Validaties
  if (!currentPass || !newPass || !confirmPass) {
    showChangePassMessage('❗ Vul alle drie de velden in.', 'warning');
    return;
  }
  if (newPass.length < 6) {
    showChangePassMessage('❗ Nieuw wachtwoord moet minstens 6 tekens lang zijn.', 'warning');
    return;
  }
  if (newPass !== confirmPass) {
    showChangePassMessage('❗ De nieuwe wachtwoorden komen niet overeen.', 'warning');
    return;
  }
  if (newPass === currentPass) {
    showChangePassMessage('❗ Nieuw wachtwoord moet verschillen van het huidige.', 'warning');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Bezig...';

  try {
    // Eerst opnieuw authenticeren met huidig wachtwoord
    const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
    await reauthenticateWithCredential(currentUser, credential);

    // Daarna nieuw wachtwoord instellen
    await updatePassword(currentUser, newPass);

    showChangePassMessage('✅ Wachtwoord succesvol gewijzigd!', 'success');
    setTimeout(closeChangePasswordModal, 1800);
  } catch (error) {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Opslaan';

    const code = error.code || '';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      showChangePassMessage('❌ Huidig wachtwoord is onjuist.', 'error');
    } else if (code === 'auth/weak-password') {
      showChangePassMessage('❌ Nieuw wachtwoord is te zwak. Kies iets sterkers.', 'error');
    } else if (code === 'auth/too-many-requests') {
      showChangePassMessage('⏰ Te veel pogingen. Probeer later opnieuw.', 'warning');
    } else if (code === 'auth/network-request-failed') {
      showChangePassMessage('🌐 Geen internetverbinding.', 'warning');
    } else {
      showChangePassMessage('❌ Er ging iets mis. Probeer opnieuw.', 'error');
    }
  }
}