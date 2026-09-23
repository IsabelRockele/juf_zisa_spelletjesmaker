/**
 * KOPPELPUNT VOOR CODEX — verbind hier de BESTAANDE server-authenticatie.
 * Voeg GEEN nieuwe login, wachtwoord, account of sessiecookie toe.
 * Verifieer de bestaande sessie server-side via de hostapp (bijvoorbeeld
 * Firebase Admin verifySessionCookie, Supabase getUser of Auth.js auth).
 * Gebruik een stabiele user-id. Bepaal canReceiveClasswork op de server aan
 * de hand van bestaande rol/rechten/abonnement. Neem nooit userId of rechten
 * over uit querystrings, localStorage of ongeverifieerde headers/tokens.
 *
 * null is bewust fail-closed zolang het doelproject nog niet is gekoppeld.
 * Dit is een integratiepakket; het doelproject is hier niet beschikbaar.
 */
export type HostSession={userId:string;displayName:string;canReceiveClasswork:boolean};
export async function readHostSession():Promise<HostSession|null>{
 return null; // CODEX: replace with the existing verified host session.
}
