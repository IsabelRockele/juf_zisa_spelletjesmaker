/** Separate namespaces; legacy records without an environment belong to test only. */
export type ReadingEnvironment = 'test' | 'live';
export function readingCollections(mode:ReadingEnvironment) {
 if(mode!=='test'&&mode!=='live')throw new Error('Invalid reading environment');
 const prefix=mode==='test'?'readingTest':'readingLive';
 return {orders:prefix+'Orders',accounts:prefix+'Accounts',operations:prefix+'Operations',links:prefix+'Links',invoices:prefix+'Invoices',outbox:prefix+'Outbox',invitations:prefix+'Invitations',rateLimits:prefix+'RateLimits',maintenance:prefix+'Maintenance',verification:prefix+'Verification',adminActions:prefix+'AdminActions'};
}
export function assertReadingKey(mode:string,key:string) {
 if(!['test','live'].includes(mode)||!new RegExp('^'+mode+'_[A-Za-z0-9]+$').test(key||''))throw new Error('Reading payments are disabled: key and environment must match');
}
