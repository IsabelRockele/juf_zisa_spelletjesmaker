let client;
export async function inboxClient(){
 if(!window.ZISA_INLEVER_CONFIG?.enabled)throw Error('De online inleverplek is nog niet geactiveerd. Bewaar je werk voorlopig op dit toestel.');
 if(!client)client=(async()=>{
  const [appLib,fnLib,authLib]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js'),
   import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js')
  ]);
  const config={apiKey:'AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw',authDomain:'zisa-spelletjesmaker-pro.firebaseapp.com',projectId:'zisa-spelletjesmaker-pro',storageBucket:'zisa-spelletjesmaker-pro.appspot.com',messagingSenderId:'828063957776',appId:'1:828063957776:web:8d8686b478846fe980db95'};
  const app=appLib.getApps().length?appLib.getApp():appLib.initializeApp(config),auth=authLib.getAuth(app);await auth.authStateReady();
  const functions=fnLib.getFunctions(app,'europe-west1');
  return {auth,call:async(name,data)=>(await fnLib.httpsCallable(functions,name)(data)).data};
 })();
 try{return await client}catch(e){client=null;throw e}
}
