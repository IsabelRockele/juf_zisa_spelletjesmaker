const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/colleague-access.js','utf8')
  .replace(/^import .*;\r?\n/gm,'')
  .replaceAll('import.meta.url',JSON.stringify('https://tools.jufzisa.be/drakeneiland/colleague-access.js?v=15'));
// Both the login page and game must use Firebase's default persistence lookup.
for(const signedIn of [true,false]) {
  const app={},calls=[];
  let ready=0,redirect=null;
  vm.runInNewContext(source,{
    URL,getApps:()=>[],getApp:()=>app,
    initializeApp(config){assert.equal(config.projectId,'zisa-collegas');return app;},
    getAuth(actual){assert.equal(actual,app);calls.push('default');return {user:signedIn?{uid:'existing-menu-user'}:null};},
    onAuthStateChanged(auth,callback){assert.deepEqual(calls,['default']);callback(auth.user);},
    onAdventureColleagueReady(){ready++;},
    location:{replace(url){redirect=url;}}
  });
  assert.equal(ready,signedIn?1:0);
  assert.equal(redirect,signedIn?null:'https://tools.jufzisa.be/login_collega.html');
}
// Keep the actual menu/login persistence contract aligned with the game.
for(const name of ['auth-check.js','login_collega.html']) {
 const text=fs.readFileSync(__dirname+'/../'+name,'utf8');
 assert.match(text,/getAuth\(app\)/);
 assert.doesNotMatch(text,/setPersistence\(auth,/);
 assert.ok(text.includes('AIzaSyCYkB9CSNahs1UNv9pduNC7TTsj0LNNHSU'));
}
console.log('Gratis sessieherkenning: dezelfde opslagselectie als login en menu; bestaande login opent spel, ontbrekende login gaat naar het inlogscherm.');
