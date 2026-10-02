/** Shared Pro authentication, with separate server-controlled reading entitlements. */
export async function createReadingAuth(config) {
  if (config?.enabled !== true || config.firebase?.projectId !== 'zisa-spelletjesmaker-pro') {
    throw new Error('De leesaanmelding is nog niet geactiveerd.');
  }
  const appSdk = await import('https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js');
  const sdk = await import('https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js');
  const name = '[DEFAULT]'; // Reuse the existing Pro login on this origin.
  const existing = appSdk.getApps().find(app => app.name === name);
  if (existing && existing.options.projectId !== config.firebase.projectId) throw new Error('Verkeerde leesomgeving');
  const auth = sdk.getAuth(existing || appSdk.initializeApp(config.firebase, name));
  auth.languageCode = 'nl';
  await sdk.setPersistence(auth, sdk.browserLocalPersistence);
  async function sendVerification(user){
    const response=await fetch(`${config.api}/verify-email`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${await sdk.getIdToken(user,true)}`},body:'{}',cache:'no-store'});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||'De bevestigingsmail kon niet worden aangevraagd. Probeer opnieuw.');
    return result;
  }
  return {
    observe: callback => sdk.onAuthStateChanged(auth, callback),
    signInGoogle: (email='') => {
      const provider=new sdk.GoogleAuthProvider();
      provider.setCustomParameters({prompt:'select_account',...(email.trim()?{login_hint:email.trim()}: {})});
      return sdk.signInWithPopup(auth,provider);
    },
    signIn: (email, password) => sdk.signInWithEmailAndPassword(auth, email.trim(), password),
    register: async (email, password) => {
      const result = await sdk.createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendVerification(result.user);
      return result.user;
    },
    resendVerification: async () => {
      if (!auth.currentUser) throw new Error('Meld je eerst aan');
      return sendVerification(auth.currentUser);
    },
    resetPassword: email => sdk.sendPasswordResetEmail(auth, email.trim()),
    signOut: () => sdk.signOut(auth),
    token: async () => {
      if (!auth.currentUser) throw new Error('Meld je eerst aan');
      await sdk.reload(auth.currentUser);
      if (!auth.currentUser.emailVerified) throw new Error('Bevestig eerst je e-mailadres');
      return sdk.getIdToken(auth.currentUser, true);
    },
  };
}
