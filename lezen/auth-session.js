// Each same-origin frame uses the default Firebase app, matching existing login persistence.
// No tokens, purchases or access grants are sent through this display-only bridge.
const params = new URLSearchParams(location.search);
const project = params.get('project');
const nonce = params.get('nonce');
const configs = {
  colleagues: {apiKey:'AIzaSyCYkB9CSNahs1UNv9pduNC7TTsj0LNNHSU',authDomain:'zisa-collegas.firebaseapp.com',projectId:'zisa-collegas',appId:'1:1029178227426:web:cb21cf199072c44b30bcbb'},
  pro: {apiKey:'AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw',authDomain:'zisa-spelletjesmaker-pro.firebaseapp.com',projectId:'zisa-spelletjesmaker-pro',appId:'1:828063957776:web:8d8686b478846fe980db95'},
};
if (window.parent !== window && configs[project] && /^[a-zA-Z0-9-]{20,80}$/.test(nonce || '')) {
  const send = payload => window.parent.postMessage({type:'zisa-reading-session',project,nonce,...payload},location.origin);
  try {
    const [{initializeApp},{getAuth,onAuthStateChanged}] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js'),
    ]);
    const auth=getAuth(initializeApp(configs[project]));
    onAuthStateChanged(auth,user=>send({state:user?'signed-in':'signed-out',email:user?.email || ''}),()=>send({state:'unavailable'}));
  } catch { send({state:'unavailable'}); }
}
