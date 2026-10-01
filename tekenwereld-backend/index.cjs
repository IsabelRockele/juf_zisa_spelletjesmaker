const {onRequest}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore}=require('firebase-admin/firestore');
const {getStorage}=require('firebase-admin/storage');
const {createHandler}=require('./handler.cjs');
const app=initializeApp();
const {createAccess}=require('./access.cjs');
// Each Admin Auth verifier checks its project's signed issuer and audience.
const colleagueApp=initializeApp({projectId:'zisa-collegas'},'colleagues');
exports.tekenwereldApi=onRequest({region:'europe-west1',memory:'256MiB',timeoutSeconds:60,maxInstances:3,concurrency:20},createHandler({
  db:getFirestore(app),bucket:getStorage(app).bucket(),
  getAccess:createAccess(getFirestore(app)),
  verifyToken:async token=>{
    try{return await getAuth(colleagueApp).verifyIdToken(token);}
    catch{return await getAuth(app).verifyIdToken(token);}
  }
}));
