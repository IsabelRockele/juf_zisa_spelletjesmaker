// No secrets. The explicit test link only reaches the test backend; its UID allowlist enforces access.
export const readingConfig = Object.freeze({
  enabled:new URLSearchParams(location.search).get('test')==='1',
  api:'https://europe-west1-zisa-spelletjesmaker-pro.cloudfunctions.net/readingApi',
  firebase:{apiKey:'AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw',authDomain:'zisa-spelletjesmaker-pro.firebaseapp.com',projectId:'zisa-spelletjesmaker-pro',appId:'1:828063957776:web:8d8686b478846fe980db95'},
});
