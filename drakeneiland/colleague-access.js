// Uses the same Firebase project and persisted session as the colleague menu.
import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js';
const config={apiKey:'AIzaSyCYkB9CSNahs1UNv9pduNC7TTsj0LNNHSU',authDomain:'zisa-collegas.firebaseapp.com',projectId:'zisa-collegas',storageBucket:'zisa-collegas.firebasestorage.app',messagingSenderId:'1029178227426',appId:'1:1029178227426:web:cb21cf199072c44b30bcbb'};
const app=getApps().length?getApp():initializeApp(config);
onAuthStateChanged(getAuth(app),user=>{
  if(user) globalThis.onAdventureColleagueReady();
  else location.replace(new URL('../login_collega.html',import.meta.url).href);
});
