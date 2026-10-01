import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
const app = getApps().length ? getApp() : initializeApp({apiKey:'AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw',authDomain:'zisa-spelletjesmaker-pro.firebaseapp.com',projectId:'zisa-spelletjesmaker-pro',storageBucket:'zisa-spelletjesmaker-pro.appspot.com',messagingSenderId:'828063957776',appId:'1:828063957776:web:8d8686b478846fe980db95'});
const auth = getAuth(app), fns = getFunctions(app, 'europe-west1');
export async function teacher() {
  await auth.authStateReady();
  if (!auth.currentUser) throw Object.assign(new Error('Log eerst in met je Pro-account. Kom daarna terug en klik op Opnieuw controleren.'), {code:'music/login'});
  return (await httpsCallable(fns, 'previewPlayClass')({})).data;
}
export async function student(code) {
  let deviceId;
  try {
    deviceId = localStorage.getItem('zisa_play_device_id');
    if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem('zisa_play_device_id', deviceId); }
  } catch { throw new Error('Sta opslag voor deze website toe op de iPad en probeer opnieuw.'); }
  return (await httpsCallable(fns, 'joinPlayClass')({code, deviceId})).data;
}
export async function classLink() {
  const { initializeAppCheck, ReCaptchaV3Provider } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js');
  initializeAppCheck(app, {provider:new ReCaptchaV3Provider('6Lf5e7krAAAAAA1xV5_tz_Xickk-m6BRIMd_BzTO'),isTokenAutoRefreshEnabled:true});
  return (await httpsCallable(fns, 'getPlayClass')({})).data;
}
