const {onRequest}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore}=require('firebase-admin/firestore');
const {getStorage}=require('firebase-admin/storage');
const {createHandler}=require('./handler.cjs');
const app=initializeApp();
// Verify the issuer/audience of the existing FREE colleague accounts, not PRO accounts.
const colleagueApp=initializeApp({projectId:'zisa-collegas'},'colleagues');
exports.tekenwereldApi=onRequest({region:'europe-west1',memory:'256MiB',timeoutSeconds:60,maxInstances:3,concurrency:20},createHandler({
  db:getFirestore(app),bucket:getStorage(app).bucket(),
  verifyToken:token=>getAuth(colleagueApp).verifyIdToken(token)
}));
