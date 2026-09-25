(()=>{
  const params=new URLSearchParams(location.search);
  const host=location.hostname.toLowerCase();
  const local=['localhost','127.0.0.1','::1'].includes(host);
  const mode=params.get('ontdek')==='1'?'discover':params.get('gratis')==='1'?'free':params.get('teacher')==='1'?'teacher':params.get('code')?'pro':'discover';
  window.ZISA_ACCESS_MODE=local&&mode==='discover'&&!params.has('ontdek')?'full':mode;
  const gate=document.createElement('div');gate.id='accessGate';gate.style.cssText='position:fixed;z-index:99999;inset:0;display:grid;place-items:center;background:#eefaff;color:#173f73;font:700 18px Arial;text-align:center;padding:24px';gate.innerHTML='<div><img src="images/zisa-leest.png" alt="" style="width:130px;display:block;margin:auto"><p>De boekenkast wordt geopend…</p></div>';document.body.append(gate);
  const start=()=>{gate.remove();const script=document.createElement('script');script.src='app.js?v=59';document.body.append(script)};
  const fail=message=>{gate.innerHTML=`<div><div style="font-size:54px">🔒</div><h2>Deze leeslink is niet actief</h2><p style="font-weight:400">${message}</p><a href="../ontdek/zisa-spelen.html" style="color:#1768ac">Probeer de voorbeeldboeken</a></div>`};
  if(local||mode==='free'||mode==='discover'){start();return}
  Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js')
  ]).then(async([fa,ff,fau])=>{
    const cfg={apiKey:'AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw',authDomain:'zisa-spelletjesmaker-pro.firebaseapp.com',projectId:'zisa-spelletjesmaker-pro',storageBucket:'zisa-spelletjesmaker-pro.appspot.com',messagingSenderId:'828063957776',appId:'1:828063957776:web:8d8686b478846fe980db95'};
    const firebase=fa.getApps().length?fa.getApp():fa.initializeApp(cfg);const functions=ff.getFunctions(firebase,'europe-west1');
    if(mode==='teacher'){
      const auth=fau.getAuth(firebase);await auth.authStateReady();if(!auth.currentUser){location.replace(`../pro/index.html?r=${encodeURIComponent(location.href)}`);return}
      await ff.httpsCallable(functions,'previewPlayClass')({});
    }else{
      let deviceId=localStorage.getItem('zisa_read_device_id');if(!deviceId){deviceId=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;localStorage.setItem('zisa_read_device_id',deviceId)}
      await ff.httpsCallable(functions,'joinPlayClass')({code:params.get('code'),deviceId});
    }
    start();
  }).catch(error=>fail(String(error?.message||'Het PRO-abonnement van de leerkracht is verlopen of niet actief.').includes('abonnement')?'Het PRO-abonnement van je leerkracht is verlopen of niet actief.':'Vraag je leerkracht om de QR-code na te kijken.'));
})();
