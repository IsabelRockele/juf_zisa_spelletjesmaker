/** Reading uses the existing Pro Auth project; product rights stay in separate records. */
import { randomBytes, createHash } from 'crypto';
import { ReadingIdentity, readingOwnerKey } from './reading-plan';

type Claims = { uid: string; aud: string; iss: string; email_verified?: boolean; firebase?: { sign_in_provider?: string } };
export type TokenVerifier = { verifyIdToken(token: string, checkRevoked: boolean): Promise<Claims> };

/** Never register paying readers in the colleagues project: its generator trusts any login. */
export function readingAuthenticator(projectId: string, verifier: TokenVerifier) {
  if (projectId !== 'zisa-spelletjesmaker-pro') {
    throw new Error('Use the existing Pro Firebase project, never the colleagues project');
  }
  return async (authorization: string): Promise<ReadingIdentity> => {
    if (!/^Bearer [^\s]+$/.test(authorization || '')) throw new Error('Aanmelden vereist');
    const token = await verifier.verifyIdToken(authorization.slice(7), true);
    if (token.aud !== projectId || token.iss !== `https://securetoken.google.com/${projectId}` || !token.uid
      || token.email_verified !== true || token.firebase?.sign_in_provider === 'anonymous') {
      throw new Error('Bevestig je e-mailadres en meld je aan bij Zisa Lezen');
    }
    return { project: 'zisa-spelletjesmaker-pro', uid: token.uid };
  };
}

export type ReadingLink = { hash: string; ownerKey: string; scope: 'reading'; version: number; expiresAt: number | null };
export function createReadingLink(owner: ReadingIdentity, version: number, expiresAt: number | null, now: number) {
  // A class QR has no session deadline. The current entitlement and version remain mandatory.
  if (!Number.isSafeInteger(version) || version < 1 || !Number.isFinite(now) || (expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= now))) throw new Error('Invalid reading link');
  const token = randomBytes(32).toString('base64url');
  return { token, record: { hash: hashReadingToken(token), ownerKey: readingOwnerKey(owner), scope: 'reading' as const, version, expiresAt } };
}
export function hashReadingToken(token: string): string {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token || '')) throw new Error('Ongeldige leeslink');
  return createHash('sha256').update(token).digest('hex');
}
/** Call after reading the current owner entitlement and link version from server storage. */
export function canUseReadingLink(record: ReadingLink | null, current: {
  token: string; ownerKey: string; version: number; hasReadingAccess: boolean; now: number; scope: string;
}): boolean {
  if (!record || current.scope !== 'reading' || record.scope !== 'reading' || !current.hasReadingAccess
    || record.ownerKey !== current.ownerKey || record.version !== current.version
    || (record.expiresAt !== null && (!Number.isFinite(record.expiresAt) || record.expiresAt <= current.now))
    || !Number.isFinite(current.now)) return false;
  try { return record.hash === hashReadingToken(current.token); } catch { return false; }
}
