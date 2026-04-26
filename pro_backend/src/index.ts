/* pro_backend/src/index.ts
   Zisa PRO — Firebase Functions v2 (region: europe-west1)

   Functies:
   - createPaymentKoop / createPayment (alias)       → Mollie €40
   - createPaymentWaitlist                           → Mollie €35 (checkt waitlist)
   - mollieWebhook                                   → verwerkt betaalstatus
   - devSimulatePaid                                 → test-helper; zet licentie + mail met PDF
   - registerDevice / listDevices / unregisterDevice → apparaatlimiet (2)
   - getAccessStatus                                 → controle op licentie + vervaldatum
   - listDevicesHttp / unregisterDeviceHttp          → HTTP wrappers (CORS + Bearer) voor apparaten.html
*/

import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import type { Request, Response } from "express";
import PDFDocument from "pdfkit";

// ------------------------------ Init -----------------------------------------
const REGION = "europe-west1";
initializeApp();

const db   = getFirestore();
const auth = getAuth();

// ------------------------------ Config ---------------------------------------
const FRONTEND_REPO   = "https://isabelrockele.github.io/juf_zisa_spelletjesmaker";
const APP_INDEX_URL   = `${FRONTEND_REPO}/pro/index.html`;
const THANKYOU_URL    = `${FRONTEND_REPO}/pro/bedankt.html`;

const MAIL_COLLECTIONS     = ["post_msft"];
const ORDER_COLLECTIONS    = ["orders", "Orders", "Bestellingen"];
const LICENSE_COLLECTIONS  = ["licenses", "Licenties"];

const ALLOWED_ORIGINS = [
  "https://isabelrockele.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://localhost:3000",
];

// ——— Verkoop/Factuurkop
const SELLER_NAME       = "Juf Zisa (Isabel Rockelé)";
const SELLER_EMAIL      = "zebrapost@jufzisa.be";
const SELLER_ADDR1      = "Maasfortbaan 108";
const SELLER_ADDR2      = "2500 Lier";
// Opm: vul je uiteindelijke BTW-nummer hieronder in (of via secret/ENV)
const SELLER_VAT_NUMBER = process.env.SELLER_VAT_NUMBER || ""; // bv. "BE 0123.456.789"
const SELLER_ENTERPRISE = "Ondernemingsnummer (KBO): 1026.769.348   BTW-nummer: BE1026.769.348";
const SELLER_VAT_EXEMPT = "Onderneming onderworpen aan de vrijstellingsregel voor kleine ondernemingen.";

const PRICE_EUR_KOOP     = "40.00";
const PRICE_EUR_WAITLIST = "35.00";
const PRICE_EUR_MONTH    = "6.00";
const DEVICE_LIMIT       = 2;
const ENTITLEMENT_ID     = "zisa-pro-1y";

// ------- SCHOOL ADMIN: wie mag schoollicenties aanmaken? --------------------
const SCHOOL_ADMIN_EMAILS = new Set<string>([
  "isabel.rockele@gmail.com",
  "jorn.neeus@gmail.com",
]);

// ------- OWNER ACCOUNTS: testaccounts die nooit aflopen ---------------------
const OWNER_EMAILS = new Set<string>([
  "isabel.rockele@gmail.com",
  "jorn.neeus@gmail.com",
]);

const MOLLIE_API_URL = "https://api.mollie.com/v2";
const MOLLIE_API_KEY = (process.env.MOLLIE_LIVE_KEY || process.env.MOLLIE_API_KEY || "");

// ------------------------------ Types ----------------------------------------
type MollieLinks = { checkout?: { href?: string } };
// 'mode' toegevoegd zodat we test/live kunnen onderscheiden
type MolliePayment = { id: string; status?: string; metadata?: any; _links?: MollieLinks; mode?: "test" | "live" };

// === Factuurnummering: types ===
type Series = "live" | "test";
function seriesFromMollieMode(mode?: string): Series {
  return mode === "live" ? "live" : "test";
}

// ------------------------------ Helpers --------------------------------------
function setCors(res: Response, origin?: string) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  // Authorization toegevoegd voor Bearer-token
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function badRequest(res: Response, msg = "Bad Request") {
  res.status(400).json({ error: msg });
}
function forbidden(res: Response, msg = "Forbidden") {
  res.status(403).json({ error: msg });
}

function toLowerEmail(x: string) {
  return (x || "").trim().toLowerCase();
}

async function ensureUser(email: string): Promise<string> {
  const e = toLowerEmail(email);
  try {
    const u = await auth.getUserByEmail(e);
    return u.uid;
  } catch {
    const u = await auth.createUser({ email: e });
    return u.uid;
  }
}

// Orders/Licenses
function newOrderId(): string {
  return db.collection(ORDER_COLLECTIONS[0]).doc().id;
}
async function writeOrderAll(orderId: string, data: any) {
  await Promise.all(
    ORDER_COLLECTIONS.map((col) => db.collection(col).doc(orderId).set(data, { merge: true }))
  );
}
async function setPaymentId(orderId: string, paymentId: string) {
  await writeOrderAll(orderId, { paymentId });
}
async function findOrderByPaymentId(paymentId: string) {
  for (const col of ORDER_COLLECTIONS) {
    const qs = await db.collection(col).where("paymentId", "==", paymentId).limit(1).get();
    if (!qs.empty) return { ref: qs.docs[0].ref, data: qs.docs[0].data() };
  }
  return null;
}

async function writeLicenseAll(licenseCode: string, data: any) {
  await Promise.all(
    LICENSE_COLLECTIONS.map((col) => db.collection(col).doc(licenseCode).set(data, { merge: true }))
  );
}
async function findLicenseByUid(uid: string) {
  for (const col of LICENSE_COLLECTIONS) {
    const qs = await db.collection(col).where("uid", "==", uid).limit(1).get();
    if (!qs.empty) return qs.docs[0].data();
  }
  return null;
}
// Fallback-lookup op e-mail
async function findLicenseByEmail(emailLower: string) {
  const e = (emailLower || "").trim().toLowerCase();
  for (const col of LICENSE_COLLECTIONS) {
    const qs = await db.collection(col).where("email", "==", e).limit(1).get();
    if (!qs.empty) return qs.docs[0].data();
  }
  return null;
}

// ---- Helpers voor licentie-selectie -----------------------------------------
async function fetchLicensesBy(field: "uid" | "email", value: string, limit = 20) {
  const out: any[] = [];
  for (const col of LICENSE_COLLECTIONS) {
    const qs = await db.collection(col).where(field, "==", value).limit(limit).get();
    qs.forEach((d) => out.push(d.data()));
  }
  return out;
}

function pickLatest(list: any[]) {
  let best: any | null = null;
  let bestMs = -Infinity;
  for (const it of list) {
    const t = it?.expiresAt as Timestamp | undefined;
    const ms = t ? t.toMillis() : 0;
    if (ms > bestMs) { best = it; bestMs = ms; }
  }
  return best;
}

function pickLatestValid(list: any[], nowMs: number) {
  let best: any | null = null;
  let bestMs = -Infinity;
  for (const it of list) {
    const t = it?.expiresAt as Timestamp | undefined;
    if (t) {
      const ms = t.toMillis();
      if (ms > nowMs && ms > bestMs) { best = it; bestMs = ms; }
    }
  }
  return best;
}

function makeLicenseCode(): string {
  const s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 16; i++) out += s[Math.floor(Math.random() * s.length)];
  return out.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}
function calcExpiry(): Timestamp {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return Timestamp.fromDate(d);
}
function calcExpiryMonthly(prev?: Timestamp): Timestamp {
  const base = (prev && prev.toMillis() > Date.now()) ? new Date(prev.toMillis()) : new Date();
  base.setMonth(base.getMonth() + 1);
  return Timestamp.fromDate(base);
}


// === Factuurnummering: helper (TEST/LIVE) ===================================
async function assignInvoiceNumber(
  orderRef: FirebaseFirestore.DocumentReference,
  series: Series
): Promise<string> {
  const countersRef = db.doc(`counters/${series}_invoice_seq`);
  return await db.runTransaction(async (tx) => {
    // 1) Idempotentie
    const orderSnap = await tx.get(orderRef);
    const existing = orderSnap.exists ? (orderSnap.get("invoiceNumber") as string | undefined) : undefined;
    if (existing) return existing;

    // 2) Teller lezen/init
    const now  = new Date();
    const year = now.getFullYear();
    const counterSnap = await tx.get(countersRef);
    const data = counterSnap.exists
      ? (counterSnap.data() as { next: number; year: number })
      : { next: 1, year };
    const next = (data.year === year) ? data.next : 1;

    // 3) Nummer opbouwen
    const invoiceNumber = (series === "live")
      ? `${year}-${String(next).padStart(4, "0")}`
      : `TEST-${String(next).padStart(4, "0")}`;

    // 4) Teller + order updaten
    tx.set(countersRef, { next: next + 1, year }, { merge: true });
    tx.set(orderRef, {
      invoiceNumber,
      invoiceSeries: series,
      invoiceYear: year,
      invoiceAssignedAt: now,
    }, { merge: true });

    return invoiceNumber;
  });
}

// ------------------------------ PDF Factuur ----------------------------------
async function makeInvoicePdfBase64(params: {
  invoiceNumber: string;
  dateISO: string;
  toEmail: string;
  product: string;
  amountEUR: string;
  paymentId: string;
}): Promise<string> {

  // Logo als base64 — geen extern bestand nodig in Cloud Function
  const LOGO_B64 = "iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAAnvElEQVR42u2ceXhV1bn/v2utvc98cpKT8SQQkpABEuZRKZoEECcUHE7EOtc6tFZbensdemuTPL1tqUNtnVqtlWqV2kTrDEVUiCICgkxJIAyBzHPOPOxhrfX7I+C17b33uRWsPr/H95/znOxz9tn7s9/1zivAV/L/r0iA1NbW0tpa0E///cR78hWhT4nf72e1lZVKg9/PNtWOvf79ZzbVVip/A7KyUpH/v4Ksra1UNtVWKlL+rzdITgL77w5eN39CwW9vXjLniTv8+Z/ipPzmlgtLGhoaLP/1W7X0/6rRJ39PSnlawP9Lnl5Dg5/5/Q2CECL/p898u7q0pjjduYRYLVlZKc6BQMx8pyMBX6oReshtZfE0j+vguKyU57c5p/whtPnVLRlumzXLl/271CnzH7n4lvr4zieeUGfffLPJGJOcc4a6Oknq68VJcI1+P61pbOSn+97I56R+9KGeD24cl+7gqnf8X1fc9VgvADT4/aymsZFLgBBA1l4yb1yxL2WB3em0HhuKLQr0911vg4k0pw26wcFtzo7m7tH0TJZwjUt3wetygNkdOw/GaEe0p+OyvPQU5I7z7c7Kz195zg+eOvSPl1FLgXrU10MAwN3XrEj3WXsXpqd5i3JKZ65dctPPB2pra2n9CdBfOMDaykqlvqnJ/LcLp14+tzSvURgaTIlATlbWWt/44l9M/cZPu07atprGRr7af8Y8B9Het0BYgklh9IWSsi8QYxO8NulUKVEhWVSXODQSl2cVe6WhmcLOpDJCbNjXE+Zci4ucNLtaUlTQXjn9ggZfUd4ia0GeEh8OHDn84hs/W/zEmr0AcMN5MzLn5nvvYSL+dTuzZZeOz0FA4K3z7v3TeairI+QUALLTCbCqoIA2dXSIOeNsd1adUT116vSF+o6dW91mMjqvr7//2uuWndV3+eN/2uOvqKBISbElowP3JxLJEnAOXTdUj0pYnsdGu4JJ6nUo1GmzSJ/TSjIcjAwmOJlfmE6HQgnBTY0MhpNUk4QNBuPiiq9d4F2wYOFCN6F5DsXi85QXV2SkZ1xzuUx7OZAenTAv0/GOmQyfJ7nLdcmyq3mqd5x56Mju0r6DO9+ceM99PQ1+P2tsbZWf5Z7paV26VU0CIFCZWqRarCy3pFRduuBc2TMcNrv7h9IPtbY++8e7/P9e09jIG7dt03zjx70nVBs/Nhpn6S6rtDIGt0JwyYw8CNWCIp+HjMY0MEYRjOrY0x1CwJA0ahJku60wTRPF3mxaNWu+FImkyZMa5939wvxwv+EuLHTKopT1+czcOByN5A+HLMa1F1wqM3zpzJWeRVVmlVpk6HwAyCwf/Mwr8bQCrKuHBAAppAuMAlqETJkxnUzOL1V0zsVwIGzu33fgvobaGy5fUTGhTAQGfuhRhVVwSZr7wqR0XCpcKkMwmECmw4oPDw8hoJvoCGkwhUBzTwAalxiOG4ibBnSYSMSTY6ZIoQphjFGVUkKEis4+mZHinnC0N5B2sCMkambNUq12C9FjUThSHJDUQrRkfDoADLU2yS8FwE/CBW4inkwACoW0MsyfMx/CAHU5bWw4EBY7d+16bnpptseZmbcz3WZVZ+Q4hYdRfHB0GCZjONAfxuBoBD3BBEKaiYhmAAQwwTAcTyIc01GU6sPy0qnwEGD3e++B2hyQlIKHQhCxJKBrJDAyLKZnFcjVV91CS85YDD09H0nqRDgUo7FEHNIUPhCGmkZ8ZhuonO7UAQRQVSUxOhoEqCqFGUdeUSHyc/JwfLCbEEgcbu+23vzDH716oK2dtW96FVNy0miWIGgZiiGmGXCpFBGTA5QgZACMEMSjcQyFY3Dl5qHu8stRNnMWkJ8LEYujc/MHGPx4BzKLJkIbGoBUEyDIgyOh0XtvuAmssBCSEBBCIFUrkpoOJgiSpmkjlELyzx7dnFaAdVWVDGgyJaFHOzraz+S6JgmjgEXF5OJi7DzQCoM5yd0P/0JOmujL+vOjj2A4asLl1IgKiVSXDd0jUYz32gDCoCgMI+EYTN3kEyaV6ecsmCcX2TIdE3PzYRoCGA6BpaWhYHEVgts/xmDPdniXc8BdCC4ykZfNQQYIzL4+UEUBCIHQNdgdTswtnYONre/pUpxaaPi5LGFXinf7yEA3aWs/DupyQgqJnFQ3mDsL//HwrzBvcRXZ8NKrkmoxmeqw4EhQF5IpsKgMoEDcEDAlMBoIoaCoAD+4/z/lr9c+br3xupWOvPRMCGGCxqJgff2QBw/CaG2Dy07gqR6Amq9DcfXBknoEjiobElkHYHT3QkgBSQmkxQooTLjsbpkU5CikQIPfT78cAKuaBACEldTXCKHJDetep5phSmJqME2BO++/T5RWFEKE+jHa20Ncqkq8mVn4+vVX0tgJO0cZhS4o+keCOHf5+Vj99KOoXnaOolKVDgeCGA4FQNO8kHY3pN0JabEApoAR6oHVrQMJDugxQOsHibbCUmaC5adCsTlB7Q4o6ekAB3l/51YSM/i7ANByCl74tMaBTU2QDX4/+37D68Fl80ry9MDgvMM9w2YeUxgvrkDRzDLCI2EQpmL4WDvadu/G8uuvxqyzFoimV9+QjBIyFNahJRO44sZrcd2dq6CCwIjGAc5h96bieEszSFcA7oIiEIcd1OEE87ihJRXEowdgG6+DUAvAAKImobcHENjvRCQSRby3H/u37xAv/vVl1jraFZo0Zd7tLzftjG1u6pD1XwaAANDQ2grUgoZHpn+QZpcrtn+4M2vYnqWfd4OfiVgMTLEANiuSoyNo3bMP13z/O9BNaX787kYZTxosYUhcceNVuPz2b4FHY4AQUFxOUIcDlBJkTy3F8WOH0bNtF8LHuzHc3o7D23eCmUAKKYHR3wkR7QIfCSLRHID2fjoycsrh8LigOO3oHRoUH3UfhDMr/cerHn15o9/vZzWtrV8SLzzmhGUtQFavfTPwwG0rLla94b9cfMMVk6jNJs1wiMQTcThcOfDmjUPZjJlw+nIQbjuqciGg2Kz4/h23Y/45iyAiURApQVUL2vc34+NN7yIRCsHqcCCnZCI81WUY6hpAe3MbKpzpKJgzFVCsiO03Qft0jESjUIQT3uxs6IkIrO5sODwpcuGKC9nUGdMiHwrH81j7AWkoLz+lsozyeTiR+nqInTufUOfMueXQR++/dN/E8pJn3l2zxuw6fFgBU5A1sRgLlyzCBddfDZgSjCkIDAew4oZrMH/FReDBIAghoBYLRoZGcbSlDZNnzYQnzQPT4BgdHkEsmkTZeYvgS8/C+GECSSmgJ2DNz4Zic8M5GkQ0MgyW7QVJ6JCmAYQ54bGY6cnIcBcfPXYDgJ+hqorhFHLhzwUgAMyenSYAIMXlvKx18yakpHvJJUtuhd1uRyKegNWqwl1UCOg6UjwpuPo738KZF14IEY6AUAJCKGCaSPW4cM7KywDGAM4BIWWBQoGkhoSeJId7RjDelQ1oOiQBmMMFEApQidjgKDBzDoQMgZkGpDBBNBNwSkjOfafjPj8XgFJKQgjh999/f5bTrizKmDoF1rQ0ikRCQkioaakEpgmh6yCEwOaw46wrr4SMa4CUAKUnzkNBKSB1HdwwhTB1qTDKqKJACsDucXN7tpeEByI0IzcH3BAAIVCcTkSPH8emj7Yjt3AinKXFgK6DmEkJKag2EpDDo9EXAKDx8cfllw4g0EgB8OmTCmfm5ee5oCU4j0QJs1koTB1mUufUYqNECjIGChCROCilY5VCEAASkgCEMiRGBoVFkdTicCEYCJiUWaKKzeZwpNgtM5edhd2PvsRdIyFm8/kASqD3D+NY52FMOH8q3tqyAeWdx5GTPx5WVRGj4SHWNTqyasFPHvlANvgZqTm1IuvnBDCTAECG1zUVVlVCT1Jms5LBnr6gqcXV7FSb04gTqJ5MSU7UJCmlY6nWyXxQAlRREBvslXaF0yCch7TR2D07d7a27trbEV1YOcdRMTFnntvr+e6Umy6es79ho/SEA8TUdQyHh1B41VKkua3oKNqPaH8Qx7VuvP7aJjkSHsLceZPchBDUtQyS0+A0P48lvEkhpNps273xV6UzJn93pPN4MDQ0fPW8OSveO2vp0tL7HvjuNJ8Dv7aneN1MtUopJYEcs3vyk6uSkIILqggSCiU2p+ZX+quX3jBu01trIgumlqlb97eFAcQA8PDQjp+5M3K+k+g+ingkStPyfKB2JyAAcB3BjqN47Q/P4d3N24RFtdCJGa5jd12woIzc8qT5qSz+y5PKfSJcpMCQ8u31m6+dcfEj226vf+xXEyZXj5ROu3DNh7uPXSJUiw5CpJQSIBJSSkBKECkhBR/zwsMxsmzxdS+sbXzzF8uXnXnpG2+8OvvD5kNtx48f9+/cse3h8vJy3+WZ8x5Z85+/7D50tBfOjAwpNBODhw7j4PtNWPfEU3iy9udo39uMiTkZJBGJQs0elx9Z9p2JAKSsrT0lJfqcAA5JANBCg/Y//fLXWHnrj3rXrf3Ja7Mq8goOHXrPHQgEHp50pv/6/p7+BqS4qJQYs0NEnHRCYzBdDtr02obkt1b9+4NLz57ly89xvuu0uyqklCQtLW3V7Lnzr7vpP+9Tc+ZOW/X+n18b1983RGOxJHm/8c946Kab8NxPV2PLK68gFgwAkEhGwqSivIhf840rWNzgcwBgc1UV/fLZwMaxl/jQsBk6fpxcMHPKNRVlhTP2xQZuys3NHRTC5KkprqUxzflNGMbVjJK/XUMEoIQCkSjmVFYq+TMX2/qOHXv10pqrmgA01QK0v7f351zKJT+44tIDq3/xy+TQMw+SlvXvDC48d2HmjMXnkNGhEXQeaIVpmKCUwpWegWmLFqGiokg6GUdfPDQdwHNVVV/GiQK5SQGAniNbv/foqmvlpWee+RBPxo3tmzbNAZAjpbQ1NDxbvOr6y7/Ng7uFHN0lxOguKUZ3STHysRSjH0sR2C3F6EdSRo9yKbnYs2vHFVkq/eaMorzzP2W5Z+dT3PHxx3uevrhk8pL+1nUvSnlIykSrKeVRmehuksMtr8nAofXSHNouZbxVGl3vGPJQo2zb9MyfT2g7+9Jp4ObNm8fsAzX6VtxyDd58d9UcarXHm95ef+dCL1uUasuZG9IGLN+rLH9MGpqUVBlrGEs55oVPOBRCACMZp6qD4oO3N9www0vOzXbwvXsk+gGWt7zY81PJzWkAef3+Fx8tTMvxrEA0ITubW1g0GMDEWbOQXlIGUAaYBsA5kjonb/zxJYQHBjwAUFdHvnxx4NDQWIfryZ+uHr1zdR3uqrttYX9XFxacddac4T/f5753uWdrZ6dm2gpzwDIygFh8TKkIG8s4CADTBDQNEJoEAZkzf/6kjgwSvHRJ+vQbFnl2tA8ayqHmXpgFc/cUFWbNRGjkAgtjDKpVtu/dg/V/WINxk8uRkZuLtOwcEEVBaGAA+z7eh86uXlQvnClPx71+LgBbHhuLr7a/tT5vXXEuLr3zh4ZImKp70bKM3osvHFlcPOALz0jFtmAatj67hiRGh2HqOiRlsLg9SMnyIaegCL4JBVBT7ARaH6bMX5S1p/K8eEXBYeHKzVaqrcx87hWlreL2hxRPKh8n4hZw3QQRcTJ32YU4uGsnOtsOYbi3D3pCh8k5FEoR4USmeFKQluIOAEBFq598YrS/LACrqoD6JmDqlOkVM4oqgB0HiKQmnKXMXX7Zt92vvfILYZgMItpNQ+1HMZwUMLiEFBISAlxIKBYbvOPGY/KCr2HawrPgyFbtF9/1gG3f1rVRizXsiA1ryerrvm3Ls0Unmjt3SREXUMp8hNqscGZko+bOO/Hyww/j6P5mqBYbrIoCxigioThMXUMsFho+1WLqaQmka2traUVFK6n5VEokpWSEEH5oza/WlpSUXmmMDJuKoigHeprR2rwVA6MxcC5RlGGHJoCBiA4uBMiJxo/CCDgXSCSSMA0D6Xn5qLrqKhTPOwMybiIeCsHSOQA1FIGh6aCKCthV0PwsDMRCIJQie8pU6CND+GjDBuxt2oLRvn5wbqI/FDcLiscrs8+Ye9s5tz30+KbaWqW6vt78QgCenHH5h5MSAiml0vWnJ5rz8n1lxBDi2PEW+u7ml9AxqIEpFOkeG5KmACMEKiVjcR8Aq8qw58gIUpwWFOS6oRuA0BMACBbfcCumVi4E+vogO4dh6kJSSogkBMRKwXyZeO/dDWh643Vc8x/3omDWHIBzmJEogoP9iIfDiPQekdnjC2CbvGya253eLKWkhJDPXM6ipwrvwZvPn/rGT64+78SzILUAPQFDsaQ7HcTOYFBBdu79EMG4RNIAgpEkGKWwMAqLQj+BDhAICaTYKSwKIEwJRjiShJmhJOcbn/oNug60AQ4XpNUC1WMn1G0F8zgAlQGMIrugAFo8jud//nNsfbEBPJmA4nYho6QM+WUTeUXFRJiqY9831r9z4ETVSJyKEtHPumwJIFdfX70gjYc/Mgd61q+rXfkoAFlXWwspJQWQ1L2pbcjNknErEUOhMASA3Ew7Cn0pMAwB+umsA2NPRDc4xmW5keWxAwQQIGg+OBIzCTEoOLa9/iqkywmkp0BaKKRCAUpBXC7AbsP48inIyM2Fput47amn8fSP7sWO119H9/69aPtwi2xrbScdx3qeaqyp4Zvr6tgX4oWrsJnWA8KtsmrFMKxHOkf1LAO3bX+m9mFyXf2hZn+FBYAehPrWuOyMJRYIqVMrqAiCcwopAUblyarVJ0aAEIASCTACSQhCYQ1d+4YhwklPWnkGGCHoO3oIwf4BpOXmQESigGGOFVAdVnAAjlQv5p97Pl77/VNwpWbg2IGDONbcgpAhxXBcV1w2a5dz6PizEiCkvv6U5wU/kwYOtWZJADAJ3aWBQlIVsUgUR1taLqgFaGtjI6SUZP+hzmfD3QNBe3YmLZwxW4/FEmAniqUCEgndABcCVCEAA3QpEE2aCA7EMbhnCPHtffAFk8hNtZlgVIJQaIkkwsEgoCiAzQqS4gbcThBKQSmFiEcxf9nFmHLGmQgNDcLpdEBY7HI4ZgiX3YKM9NRbHjmCcI1/bAF8YeWsBr+fBdLSaDi8e5tV8FkJzYBmdb3/44YPz5YAgdzECKk2d3/48vUz5k5bE+7vN357z90KS4QJUy2A4DJpmqRjIB7U+2MOUGqxc4ksLuEyJQrdVmS5bYApscMKoMQDhUtohokr7/kx8srKIBKJE7bzb6rhIEyBpiXx5tO/R9ObG2XnSJh7U11KZkbaXfe9vve+k4OepyNk+8w2oLG1Vb6xa5ewSHLIZaVXB6NJBGN6/qrlZ7ZM236otb7+GSE3bVJ8Z53/8bWXLGU5pZOr07My+b73NhObhREJQmwqg8Oq0M6Do1SN6LSMMUxy23FeWRZmj/digteB/DQXWu0ECQWgQsDqSsEZF14Ei6JAngh9/kEjpIBqc6C4rISPy/YQt8vFBgcCP/71Wy0/r6yE8sC61tM26vtPA6wF6ObaWoIsZF8yI/O3s/I8y1u6Qr6ekKaWpNulh5hXrFxQUnX35UtfefLIHdrmB59QvLO//s7Vy84ipWfMW+ROyyDNTe+adruVSMqI3UoZnCoVAwl8LduNJeU+pFlVaIYJhRIcNTl2qiZsiopkPI7S+Wei4qwqCC051nj6L9U7cUcKhJRCG+gW8Z7DrLd3WB8cjHy79oXNDzX4wR5Yh9M6J/1PA7zN76dTHn9cVE5Mez3XqVwcjWkTPHZV6Q4mkJ9qI7GkZjoUWqRJM+Nbqw+/VrHEThoaWmh63uRNXyv19UyeO7tqQmmZ/cBH2wmDMIWkxO1SSYIQnJuegmyvA9xmgSXViWRMx1+lAcOughgGpN2JC2+6FXaHA+DiEx80Zs2ZpIoiZCwMvfcIPbxnH3113dYPHv7NC/7HNu5+w+/3s/rG1tM+ZP5PARy7iEZ+70XTbx6XYr19IBjXuSRQGKVhzTRBCLwuOx0KJYVmmjOuvmzp81d+5/lRAGTz5s20eNrCXYNbN7+09LLlDm92VkV8dMhiJJMEEtyeahHdRMKuc9AML+kBw19DAQTdFqiGgYjOccHNt6KwomLM9lEKyhQQVRWEUkmSIRo/dpDue38reWPd+/saXtly932vbLmjM2r0NTT4WX396Z/Q/6fCGL/fzxobG/ldF8w8O82K3ybiGtcMocYkJ1luK9KcFravJ0KSpkSO24poNKl07dhbDqC9orWVEEK4lA2MkJrDf5hz2Td3PHXPr9z5ZauGI/uXk3gk3a0yaG7gTd2E9Xg7dCkhrRRiNAY1K4ev+M5NrHzeXEDTwFxOwDShh4MwQsN0uKMb+3fvC+1uPvL2+qaWNR/2DG8AYFJKcO+9ktbUfD7w/jmAJwvN3LjdSq0kqpnSYWFkIJzAMIBAzCCMjsVFlIBwIRCORANjBerGE3FeDa+traV1dXWEENIM4MaVK5fcK4+HFud61KoMt6VcCDk1IOGUxCJc7gxatGAKqi86n2R40xBoP4RkNIbI0BDC/f0ckVF2sKP/jS2vbfjRE4fjR8aaTARSSlJXVaXUNzWZJ7c4fF7yfw5jTqZudyye/MHgaPyMimy3dNooOzaSwMH+KBgjmJzjQpbTIlRFoaGE3vaeFpuxualDI3/X+WpoaGA1NTX/qBWzF0zMCw8tuXtK+urMnCxP+vg8ZHhTiB4Nw9CSgBQQwoSFMVhtCs/OTGGhqLbuiv309WklBT1rv//vr4u/DWkYgP91g8+/TAPrKisZmprMYl/6jhSVLNjZHTBT7RaMxgx4XSoIJFwWBRJEjsSS8uhQ9CdNe7uTNX4wNI55vhPaB0IIX7RyZXbW5JIrDZCvxZJGMTfNjOOdHZ4a6t63cGKq1eawEU7iEME4UiwWqB47mMJALQxSUUAtjNmYwIZRckHOeO8FYYPjiofu3+gWeGOCzbH5P267rYUQ8snvnspmmtOigbW1oPX1kKtvXjZeHe3d2z8SSe0NaSLFymimy4qEKeC0WaRhGCRpscs5NV8vWXksdqwOUCrq6rgfkCcT9z+uf/6b77R1/pTbnVlOlxOmbmBgJAy9qx2/zIqD2CwQFFCtKiijoIyAKWM9Y6mosNtt4HoSDT0C6zUvVEieluqhnvRUkuZyIMuqyqWlE9rSmO3t7v2tP5tz/mV9p1p1OS2ZyElHUnvR3GUOJF7lJieCUowVNQi4noQpwa/98Q+Zb2LpE668r9366e//4Q9PTPRNLvxpNMV1xc7WQ8hITzWNpE4cKiGDCQ73YCdZ6dQks6mUWm1w+saBqSoENyENDRQcSMbQ0dWDD7gXh63ZkNEwvKkeZGSmQ6WEgxFpI1BS7A6kpKUhm9CjKf2jS3wzzzz+eUD8p1O5k9u5Vi2qWCmMxDPxhK5YVUpTnTb4yspQfcXlmHxWpTi+4WX6ytoXr9s6bTm9asm8xZZ4PLe1s3c+z8l1emwq7+ntpzaXk7gEB3PZoRmAfbQfVxSmwltRAZHQxgbDcWLYiBJEhoax88AxHIQD1vQsmKFRUEWFw50CbnIIKWHoGixWi6SUSoMLMzsz3ZJP1J1TouVfQwX46baJnykXPlnFffrBuzfZkkOVNptLVMyfywonT4LqckMPjsq37ruXIC1LPn84QrKmTMPMC5chNjSEQEzjXreDtR7rRU6KA+NyMhDjEoloAh6XDdmhPiyeXgKn1QZAIm6YGIkkcHQohI4kh+H0gEiJZDAMe4oLVrsDnAuAAPFYDC6HDYwpkAAoIUgaujG1qFBNSxj3TRw/+a5NcpNSTarNLxSg3LRJqauuFlft23h9iU/+HrrgyCxgME2YySS2Pf8k2t7fhPmXXw0dFrHhd48Lx3V3EVJUSm3CJIJQ7NzdglllhbC43aCEYCQYgdOqwmazwJKIwa0SSEIR5RJJokBQBgIJnkgAlMHpdo/ZRQEwRUFP/yBsFEjP8MI0BSgjIAB0LuQEj1vM8I0j7Yfa58+evXDniXiU/0u98N9Qr67mUgIX3bLlhZ9c5K3Lz3aOsxgWEejvofvXv4qRjqOwuDzIK5+KBHNRb3oqtTVvRbvXB49FgS440hw2WN0pY9UTQpCe6sJoIALTFLDbHUiKEz1iQsBNA1SYoBYF9lQPFKaACwEhJCihCMUSGBkJoaIkH+GEAcYInIoCKQUURkl3KEpm5zNaXpL/FGbPngv4xYlqtPxCAAKQdVWVyhtN9fGy4+W/tlmUB9xuK89UBWVEQpgcFUuWIq2sAonWFuiQyNHDCB07grBvPLSRIHwZXhgAqJTgpgZCgLRUJwQn0PQkiDDHtIgQUJXCYrVBVVRwzqGZBhQ6BkhQ4Fh3P6yMQJMEA9E4JnhTIMSJ+UIAkhL6RusBvnz6tOnhdWvvI4SsklIqAMwvCiDqm5q4BEhdput3Q8cH/q2vN5FD8rwiM81Opyw+B7MvugTQDRicwZU+Dk4VKLZIrOseQAY34CkrQCyRgMtiwSTfJHjtHiTNJDpGO1CWWYpMRwaSBgejDPREt45LCQqCY6OdODLaC4VSJDQTI4EgJuRmoXs0BColGCEwuQBj5OS0IXTOWcPu3eYZBRO+193RvIcQ8symTZuU6upTs4en1JVraPCzmppG/ugPrrkpy248ycDNM5dfovhmnwsJJ4QJGEMBmIwidnwHNmz5AL8ZoaicWgxvZgZS7U5cOv1MZMhmwGwB1AIkLQvQExvE28NrMdFthSkMCJKAwnQoUofkqZiZfhPea+tCd2gAQlJ8tP8ACsf7EEnqKMjywm23A2JsyEFhDIAEoQDnQmpSiHKvV7DOrrPPqF6+7X/Miv4VjfWamkbe0NDA/H7/U0Mtr1+ZyXurtXGzzOTBEcXY8megsw04th9G1RXIvvE6JP7yIhjJgdXpQkLTsXJ2FTIif4Qx9ARkZBDcWQb79Lexa6AVzwQewSTihIPpSGMEHgMoUBgULYiDoUmoLFqKbZ0mPursgabp6BwYhkIYRFY6NM7BJMZqioyCUgJpGuCGSRImJwGHXV0wtewPUsp5ACKnYg9PeT7Q39IiCSF4ZbdxbdeQ2Wf1pCvB59dw6/pH4JbtUD0Eysy5CH6wHkeOHDaJytAzOgKHxYN81guz/zcgtATcWg8hlo31XEYH0d0p0dJux9792WjrzIEOL5LEjn5jJvKsC3Bg0MS8/NmYkTMOA4MBZFitmFk8Hm6rA6FIEjHNQJonDRNyfUhzuiBMgaQEnNKgH+zYFXvsvR1lT772wu8pIbKxsZF+IRoIAKS+Xowtg8u6f3p7zVWXZk57YXzV0qyRg1ulT+qEWz2wFpdiuF0Tc67+t2B5ti+jzJcPp8MBPbgHVI8DjiJYK74xVlSWEheWLIJM/gJFWQUI6VG8FPshICQOjyZxoff72NFmw11tYVw8Xkf9nFKUfe82ZHIPkgEDNp+KY8lhOOwOlEgX6EgScBJESx1o2fISxgWa8df2XnHnkaQozkj9WAKoafzsszGnZatXY2OjbJAN7FsX1LVnOLJfO+PWby63BoY9SvNmGM4sgplV8EQ6yDSv0zHTl4vxO36JnMxCGNoAWOQ9UMUAousgNQNwT0Gaw415hdNQkpWP5wJ1oM5OJA0N2fpl8BffgkRsGM37e3BhSQrm5Kdjz5oe/LXuCHY+04OOjcOYVT0eRS1DiP1uN4yt3eD7B0FHkyhathCeAh+fmm63aUMDT7/wwJN3NjQ0sMZTaG+ethFfP/wCAOp/ufpQMKG/brE4CXqDnEgV0e0bYd5/AeJ73kSgdRe0A79FuOk3oLvrwVQrZLwf8Y83QD/wFiABw9QgBPDAwR+jPfk+pFQQGy3AVYU/gIQJlycNC6cXwun1YMubrVj/YDukR8GEq204PjKAZDKJwaZmGCkS/MwMSF0D+bgXxqBAd0cb+fDdNzApNDhn1Sq/3e/3i1NxpqcFIBnboiC3t7efvbW1dVY0FpWmZkIMcYiICTMRBoMKS9EZsE6cAhK0QbU4EIvNgD5qAJoC7nsaSvGdkNyEqljxds867Ar/ETlOL0ZGTHwz72fI8aSDQMG2AyN4tE1ib4hhsL8LfbEgOCEoOSMTd6yrxMSZPrh/cC6U+eNgIVZQlYEmNJCRJEw9Rnu7DghDaNPLnc5qQohsaPgC9wtLKakUAs3d3b+eykVTuap+ON7rvSTW1QNEJJOmHUp8GDRpQGYUAMIAGYlASfXB+vU1iMfcYJY4XNPKoeSXgTEFHaFe/KW3Fj6HDcFwAPPINZieNx3v9r6Kv3Q+CCdT4CRAMpDAuSvPQJGfY29zG3538z68dH8LooEo+JqPgD/uQ2TjPiTCQcikDjMURtr4aciYUCYS0bA0k9pMAGhp+YL+a8eJMTbx3t69qyqSiTviS6pNbHzb4pQij3y4HdSkxEjJgAAHVS3gO9dBeecJqFYraLAPTAV0wwWphyBGD0BKAcPk8oXj98Gi9IIKBVZuwbDlXdS2LMFT7TehK9qGqMYAU4JIDhu149pbK3HDE2UgmTFsWdePLb9sgmP3EPiULDgfuQRKphMkqoNzAylphTh78Y3UlZqD3R/tPQQArScmLb4IDZQAUFRcvHz4gQfNlEgCyrNr5eiS82Xa0CjicQNscbUgeWUiFtWFZf1qGX/reR6IO7n57rNca2sR1JkComjgQ+8IRqjojwfIroE3hdOmSkPGpc1uyFG2X46aR2USmkxXJolQXEiDMzlkQDz8Hy/z+ovfxcG/mmDCDp0Z0sINzrkpbWETsv4doHlQUocFYk8XTIOZIilk7vjJ+kftAx8AQHljo/yiwhgKQAiDb3LcdFNl8x//pE08cIjYIEnA1Lm24kKaddFF1B6LI9nyEWLDnUj5Ri0zu49AiQ3AOrEEPW8PiNBAKnUXKdQwOGymhZ/t+QF7Z28DFMZgmgCjdthUJxQkMW3KWWTD7jjSBoYxY3oxKVtagi2bNsiX1w4Id7pK/LfPo4u+dRbru+050F2HOPJSqDw7hyQ2HOAWd5y5bYuUIZ1hcGDw6T3do72nOuZBTnEJEwC459v3pH73Zz/a4mw/VD7w3FrYDBPOM+fDXbMSH+3rW+20JvYXlBbdSwRcA2HjQ5dddcZ0CLsZzs5FYG4wqUC4s493dPc/1999fEPlggUPj0TjJbFE3E4JJVaLTVcI0wGSVFQeIYxPpILDYWEtxGaNRSKReYGROLzpKZCE9YQjye1ZHssK53CCJtLs4B5n0jMYskXcVjkYMDbueP6JP3/9R/c8KwH+9w2vf7mchHj3bT9LH9TkfREpt4xKuX2Iy4YPth1c8emYs/bmWsenv1s5odLWb8jFW9oGZgATbJ8+9tYrB3J/9+irxb/61Ysljz3WNL72/pey/Dev9gBQ29u7pnd09FWcVICjR3vnJpPJy4f7I0tuvPF3XgDYsad1Sp8Z9+9p75r/4vMbi7rioWvf39Y2/TTpzucD8X869unNLFJKJqWkJ4Yw/8Epnehb/N9tCCX/bWTwv11PbW2tcroIktMMkQGfDO/QsWY6OfmenCieyr/7zsk5PfmpY6T27zYB1tXVyRPn++SBnfi8bGhoYJmZmaSqqkqe7HlIKenmzZvp0NCQbGnxy6oq0KoqiM+jM/eVfCVfyVfylXwlX8lX8pV8JV/JV/Kvlf8H8fpi0O0yM1oAAAAASUVORK5CYII=";

  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true });
  const chunks: Buffer[] = [];

  return await new Promise<string>((resolve, reject) => {
    doc.on("data", (c) => chunks.push(Buffer.from(c)));
    doc.on("end",  () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);

    const W = 595.28;
    const H = 841.89;
    const M = 35;
    const DARK       = "#2a2a2a";
    const GOLD       = "#ffcf56";
    const LIGHT      = "#f5f3f0";
    const GRAY       = "#555555";
    const BORDER     = "#e0d8cc";
    const GREEN      = "#065f46";
    const GREEN_BG   = "#ecfdf5";
    const GREEN_BD   = "#a7f3d0";
    const AMBER_BG   = "#fffbeb";
    const AMBER_BD   = "#fde68a";
    const AMBER_TX   = "#92400e";
    const FOOTER_COL = "#aaaaaa";
    const VAT_COL    = "#999999";

    // ── HEADER ──────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(DARK);

    // Logo
    const logoBuffer = Buffer.from(LOGO_B64, "base64");
    doc.image(logoBuffer, M, 12, { width: 66, height: 66 });

    // Naam + contact
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(13)
       .text("Juf Zisa\'s Spelgenerator PRO", M + 80, 24, { lineBreak: false });
    doc.fillColor("#aaaaaa").font("Helvetica").fontSize(8.5)
       .text("zebrapost@jufzisa.be  ·  jufzisa.be", M + 80, 42, { lineBreak: false });

    // FACTUUR rechts
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(24)
       .text("FACTUUR", W - M - 150, 30, { width: 150, align: "right", lineBreak: false });

    // Gouden lijn
    doc.moveTo(0, 91).lineTo(W, 91).lineWidth(2).strokeColor(GOLD).stroke();

    // ── VAN (links) ──────────────────────────────────────────
    let y = 122;
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9)
       .text("Van", M, y, { lineBreak: false });
    doc.fillColor(DARK).font("Helvetica").fontSize(9)
       .text(SELLER_NAME,    M, y + 14, { lineBreak: false })
       .text(`${SELLER_ADDR1}, ${SELLER_ADDR2}`, M, y + 27, { lineBreak: false })
       .text(SELLER_EMAIL,   M, y + 40, { lineBreak: false });
    doc.fillColor(GRAY).fontSize(9)
       .text(SELLER_ENTERPRISE, M, y + 53, { lineBreak: false });

    // ── FACTUURDETAILS (rechts) ───────────────────────────────
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9)
       .text("Factuurdetails", W - M - 200, y, { width: 200, align: "right", lineBreak: false });
    doc.fillColor(DARK).font("Helvetica").fontSize(9)
       .text(`Nummer: ${params.invoiceNumber}`, W - M - 200, y + 14, { width: 200, align: "right", lineBreak: false })
       .text(`Datum: ${params.dateISO}`,        W - M - 200, y + 27, { width: 200, align: "right", lineBreak: false });
    doc.fillColor(GRAY).fontSize(9)
       .text(`Mollie: ${params.paymentId}`, W - M - 200, y + 40, { width: 200, align: "right", lineBreak: false });

    // ── AAN BLOK ─────────────────────────────────────────────
    const ay = y + 53 + 20;
    const ah = 40;
    doc.roundedRect(M, ay, W - 2 * M, ah, 6).fill(LIGHT);
    doc.roundedRect(M, ay, W - 2 * M, ah, 6).lineWidth(0.5).strokeColor(BORDER).stroke();

    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9)
       .text("Aan", M + 12, ay + 9, { lineBreak: false });
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
       .text(params.toEmail, M + 12, ay + 22, { lineBreak: false });

    // Reeds betaald badge
    const bx = W - M - 110;
    const by = ay + 9;
    doc.roundedRect(bx, by - 4, 100, 16, 4).fill(GREEN_BG);
    doc.roundedRect(bx, by - 4, 100, 16, 4).lineWidth(0.5).strokeColor(GREEN_BD).stroke();
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(8)
       .text("Reeds betaald", bx, by + 1, { width: 100, align: "center", lineBreak: false });

    // ── TABEL ────────────────────────────────────────────────
    const ty = ay + ah + 18;
    const th = 24;
    const rh = 32;

    // Header
    doc.roundedRect(M, ty, W - 2 * M, th, 4).fill(DARK);
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(9)
       .text("Omschrijving", M + 12, ty + 8, { lineBreak: false })
       .text("Bedrag", W - M - 12 - 60, ty + 8, { width: 60, align: "right", lineBreak: false });

    // Rij
    doc.roundedRect(M, ty + th, W - 2 * M, rh, 4).fill(LIGHT);
    doc.roundedRect(M, ty + th, W - 2 * M, rh, 4).lineWidth(0.5).strokeColor(BORDER).stroke();
    doc.fillColor(DARK).font("Helvetica").fontSize(9)
       .text(params.product, M + 12, ty + th + 11, { lineBreak: false });
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9)
       .text(`\u20ac ${params.amountEUR}`, W - M - 12 - 60, ty + th + 11,
             { width: 60, align: "right", lineBreak: false });

    // ── NIET AUTOMATISCH VERLENGD ────────────────────────────
    const nvy = ty + th + rh + 18;
    const nvh = 26;
    doc.roundedRect(M, nvy, W - 2 * M, nvh, 5).fill(AMBER_BG);
    doc.roundedRect(M, nvy, W - 2 * M, nvh, 5).lineWidth(0.5).strokeColor(AMBER_BD).stroke();
    doc.fillColor(AMBER_TX).font("Helvetica").fontSize(8)
       .text("Dit abonnement wordt niet automatisch verlengd.",
             M + 12, nvy + 9, { lineBreak: false });

    // ── BTW VRIJSTELLING ─────────────────────────────────────
    doc.fillColor(VAT_COL).font("Helvetica-Oblique").fontSize(7.5)
       .text(SELLER_VAT_EXEMPT, M, nvy + nvh + 18, { lineBreak: false });

    // ── FOOTER ───────────────────────────────────────────────
    doc.moveTo(M, H - 50).lineTo(W - M, H - 50).lineWidth(0.8).strokeColor(GOLD).stroke();
    doc.fillColor(FOOTER_COL).font("Helvetica").fontSize(7)
       .text(
         `${SELLER_NAME}  ·  ${SELLER_ADDR1}, ${SELLER_ADDR2}  ·  ${SELLER_EMAIL}  ·  jufzisa.be`,
         M, H - 38, { width: W - 2 * M, align: "center", lineBreak: false }
       );

    doc.end();
  });
}


// --------------------------- Mail routing ------------------------------------
// Microsoft-domeinen => via Brevo (collection: post_msft). Alles anders => bestaande route.
const MSF_DOMAINS = new Set<string>([
  "hotmail.com", "hotmail.be", "hotmail.nl",
  "outlook.com", "outlook.be", "outlook.nl",
  "live.com", "live.be", "live.nl",
  "msn.com", "windowslive.com",
]);

function pickMailCollections(toEmail: string): string[] {
  const domain = (toEmail || "").toLowerCase().split("@")[1]?.trim() ?? "";
  return MSF_DOMAINS.has(domain) ? ["post_msft"] : MAIL_COLLECTIONS;
}

// ------------------------------ Mail helper ----------------------------------
async function queueEmail(
  toEmail: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: string; type?: string }>
) {
  const normAtt = (attachments ?? []).map((a) => ({
    filename: a.filename,
    content: a.content,
    encoding: "base64",
    contentType: a.type ?? "application/pdf",
  }));

  const doc = {
    to: [toEmail],
    message: {
      subject,
      html,
      text: "Klik op de knop in deze mail om verder te gaan.",
      attachments: normAtt,
    },
  };

  // NIEUW: routeer op domein
  const cols = pickMailCollections(toEmail);

  await Promise.all(
    cols.map((col) => db.collection(col).add(doc).catch(() => null))
  );
}

function emailHtml(opts: { name: string; passwordLink: string }) {
  const { name, passwordLink } = opts;
  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;padding:10px 16px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">${label}</a>`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#0f172a">
    <p>Beste ${name},</p>
    <p>Hartelijk dank voor uw aankoop van <strong>Zisa PRO</strong>.</p>
    <p>1) Stel eerst uw wachtwoord in:</p>
    <p>${btn(passwordLink, "Wachtwoord instellen")}</p>
    <p style="margin-top:14px">2) Open daarna de PRO-omgeving:</p>
    <p>${btn(APP_INDEX_URL, "Open Zisa PRO")}</p>
    <p style="margin-top:14px">Veel plezier! Bij vragen kunt u antwoorden op deze e-mail.</p>
    <p>Vriendelijke groeten,<br>${SELLER_NAME}</p>
  </div>`;
}

async function generatePasswordLink(email: string): Promise<string> {
  return auth.generatePasswordResetLink(email, { url: APP_INDEX_URL, handleCodeInApp: false });
}

// ------------------------------ Mollie API -----------------------------------
async function mollieCreatePayment(params: {
  amountEUR: string;
  description: string;
  metadata: any;
}): Promise<MolliePayment> {
  if (!MOLLIE_API_KEY) throw new Error("MOLLIE_API_KEY ontbreekt");

  const body = {
    amount: { currency: "EUR", value: params.amountEUR },
    description: params.description,
    redirectUrl: THANKYOU_URL,
    webhookUrl: `https://${REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/mollieWebhook`,
    metadata: params.metadata || {},
  };

  const r = await fetch(`${MOLLIE_API_URL}/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MOLLIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Mollie create failed: ${r.status}`);
  return (await r.json()) as MolliePayment;
}

async function mollieGetPayment(id: string): Promise<MolliePayment> {
  if (!MOLLIE_API_KEY) throw new Error("MOLLIE_API_KEY ontbreekt");
  const r = await fetch(`${MOLLIE_API_URL}/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${MOLLIE_API_KEY}` },
  });
  if (!r.ok) throw new Error(`Mollie get failed: ${r.status}`);
  return (await r.json()) as MolliePayment;
}

// ----------------------- Afhandeling bij 'paid' -------------------------------
async function completeOrderByPayment(payment: MolliePayment) {
  const paymentId = String(payment.id);
  const orderRes = await findOrderByPaymentId(paymentId);
  if (!orderRes) {
    logger.error("Order niet gevonden bij payment", { paymentId });
    return;
  }
  const orderId = orderRes.ref.id;
  const order   = orderRes.data as any;

  if (order.status === "betaald") {
    logger.info("Order reeds betaald", { orderId });
    return;
  }

  const email = String(order.email);
  const uid   = await ensureUser(email);

  const licenseCode = makeLicenseCode();
  const expiresAt   = calcExpiry();

  const licenseDoc = {
    code: licenseCode,
    email,
    uid,
    entitlement: ENTITLEMENT_ID,
    productId: "zisa-pro-jaarlijks",
    deviceLimit: DEVICE_LIMIT,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    orderId,
    status: "active",
  };

  await writeLicenseAll(licenseCode, licenseDoc);
  await writeOrderAll(orderId, { status: "betaald", licenseCode, paidAt: FieldValue.serverTimestamp() });

  // === Factuurnummer: TEST/LIVE bepalen + nummer toekennen (idempotent) ===
  const series: Series = seriesFromMollieMode(payment?.mode);
  const orderRef = orderRes.ref;
  const invoiceNumber = await assignInvoiceNumber(orderRef, series);
  await writeOrderAll(orderId, { invoiceNumber, invoiceSeries: series });

  // Mail + factuur (PDF)
  const passwordLink  = await generatePasswordLink(email);
  const invoiceBase64 = await makeInvoicePdfBase64({
    invoiceNumber,
    dateISO: new Date().toISOString().slice(0, 10),
    toEmail: email,
    product: order.description || "Zisa PRO – jaarlicentie",
    amountEUR: order.amountEUR || PRICE_EUR_KOOP,
    paymentId,
  });

  // === PDF ook bewaren in Storage ==========================================
  const year = new Date().getFullYear();
  const storagePath = series === "live"
    ? `Facturen/live/${year}/${invoiceNumber}.pdf`
    : `Facturen/test/${year}/${invoiceNumber}.pdf`;

  await getStorage().bucket().file(storagePath).save(
    Buffer.from(invoiceBase64, "base64"),
    {
      contentType: "application/pdf",
      resumable: false,
      metadata: { cacheControl: "private, max-age=0" },
    }
  );

  await writeOrderAll(orderId, { invoiceStoragePath: storagePath });

  await queueEmail(
    email,
    "Uw Zisa PRO – toegang & factuur",
    emailHtml({ name: email, passwordLink }),
    [{ filename: `factuur-${invoiceNumber}.pdf`, content: invoiceBase64, type: "application/pdf" }]
  );
}
async function completeMonthlyPayment(
  payment: MolliePayment,
  orderRes: { ref: FirebaseFirestore.DocumentReference, data: any }
) {
  const paymentId = String(payment.id);
  const orderId   = orderRes.ref.id;
  const order     = orderRes.data as any;

  if (order.status === "betaald") { 
    logger.info("Order reeds betaald", { orderId }); 
    return; 
  }

  const email = String(order.email);
  const uid   = await ensureUser(email);

  // Bestaande licentie zoeken en verlengen; anders nieuw aanmaken
  const list   = await fetchLicensesBy("uid", uid, 5);
  const latest = pickLatest(list) || null;

  let licenseCode: string;
  let newExpires: Timestamp;

  if (latest && latest.code) {
    licenseCode = String(latest.code);
    const prev  = latest.expiresAt as Timestamp | undefined;
    newExpires  = calcExpiryMonthly(prev);
    await writeLicenseAll(licenseCode, { expiresAt: newExpires, status: "active", uid, email });
  } else {
    licenseCode = makeLicenseCode();
    newExpires  = calcExpiryMonthly();
    const licenseDoc = {
      code: licenseCode,
      uid, email,
      productId: "zisa-pro-maand",
      deviceLimit: DEVICE_LIMIT,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: newExpires,
      orderId,
      status: "active",
    };
    await writeLicenseAll(licenseCode, licenseDoc);
  }

  // Orderstatus bijwerken
  await writeOrderAll(orderId, { status: "betaald", licenseCode, paidAt: FieldValue.serverTimestamp() });

  // Factuur: nummer toekennen + PDF + mail (zelfde flow als jaar)
  const series: Series = seriesFromMollieMode(payment?.mode);
  const orderRef = orderRes.ref;
  const invoiceNumber = await assignInvoiceNumber(orderRef, series);
  await writeOrderAll(orderId, { invoiceNumber, invoiceSeries: series });

  const passwordLink  = await generatePasswordLink(email);
  const invoiceBase64 = await makeInvoicePdfBase64({
    invoiceNumber,
    dateISO: new Date().toISOString().slice(0, 10),
    toEmail: email,
    product: order.description || "Zisa PRO – maand (prepaid)",
    amountEUR: order.amountEUR || PRICE_EUR_MONTH,
    paymentId,
  });

  // PDF opslaan in Storage
  const year = new Date().getFullYear();
  const storagePath = series === "live"
    ? `Facturen/live/${year}/${invoiceNumber}.pdf`
    : `Facturen/test/${year}/${invoiceNumber}.pdf`;

  await getStorage().bucket().file(storagePath).save(
    Buffer.from(invoiceBase64, "base64"),
    { contentType: "application/pdf", resumable: false, metadata: { cacheControl: "private, max-age=0" } }
  );

  await writeOrderAll(orderId, { invoiceStoragePath: storagePath });

  // Mail met wachtwoordlink + factuur
  await queueEmail(
    email,
    "Uw Zisa PRO – toegang & factuur",
    emailHtml({ name: email, passwordLink }),
    [{ filename: `factuur-${invoiceNumber}.pdf`, content: invoiceBase64, type: "application/pdf" }]
  );
}

// ------------------------------ HTTP Handlers --------------------------------
async function handleCreatePaymentKoop(req: Request, res: Response): Promise<void> {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

  const emailRaw = (req.body as any)?.email ?? "";
  const email    = toLowerEmail(String(emailRaw));
  if (!email) { badRequest(res, "email ontbreekt"); return; }

  const orderId = newOrderId();
  await writeOrderAll(orderId, {
    orderId, email, source: "koop",
    amountEUR: PRICE_EUR_KOOP, description: "Zisa PRO – jaarlicentie",
    status: "open", createdAt: FieldValue.serverTimestamp(),
  });

  const payment: MolliePayment = await mollieCreatePayment({
    amountEUR: PRICE_EUR_KOOP,
    description: "Zisa PRO – jaarlicentie",
    metadata: { source: "koop", orderId },
  });

  await setPaymentId(orderId, payment.id);
  const checkoutUrl = payment._links?.checkout?.href ?? null;
  res.status(200).json({ checkoutUrl, orderId, paymentId: payment.id });
}

async function handleCreatePaymentWaitlist(req: Request, res: Response): Promise<void> {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

  const emailRaw = (req.body as any)?.email ?? "";
  const email    = toLowerEmail(String(emailRaw));
  if (!email) { badRequest(res, "email ontbreekt"); return; }

  // Waitlist-check
  const w = await db.collection("waitlist").doc(email).get();
  if (!w.exists) { forbidden(res, "Geen wachtlijsttoegang gevonden"); return; }
  const el = w.data()?.eligibleUntil as Timestamp | undefined;
  if (el && el.toMillis() <= Date.now()) { forbidden(res, "Wachtlijst-link verlopen"); return; }

  const orderId = newOrderId();
  await writeOrderAll(orderId, {
    orderId, email, source: "wachtlijst",
    amountEUR: PRICE_EUR_WAITLIST, description: "Zisa PRO – jaarlicentie (wachtlijst)",
    status: "open", createdAt: FieldValue.serverTimestamp(),
  });

  const payment: MolliePayment = await mollieCreatePayment({
    amountEUR: PRICE_EUR_WAITLIST,
    description: "Zisa PRO – jaarlicentie (wachtlijst)",
    metadata: { source: "wachtlijst", orderId },
  });

  await setPaymentId(orderId, payment.id);
  const checkoutUrl = payment._links?.checkout?.href ?? null;
  res.status(200).json({ checkoutUrl, orderId, paymentId: payment.id });
}

async function handleCreateMonthlyPurchase(req: Request, res: Response): Promise<void> {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST")     { res.status(405).send("Method Not Allowed"); return; }

  const emailRaw = (req.body as any)?.email ?? "";
  const email    = toLowerEmail(String(emailRaw));
  if (!email) { badRequest(res, "email ontbreekt"); return; }

  // Order vastleggen (bron = monthly)
  const orderId = newOrderId();
  await writeOrderAll(orderId, {
    orderId, email, source: "monthly",
    amountEUR: PRICE_EUR_MONTH, description: "Zisa PRO – maand (prepaid)",
    status: "open", createdAt: FieldValue.serverTimestamp(),
  });

  // Mollie betaling aanmaken (géén mandaat; gewoon éénmalig €6)
  const payment: MolliePayment = await mollieCreatePayment({
    amountEUR: PRICE_EUR_MONTH,
    description: "Zisa PRO – maand (prepaid)",
    metadata: { source: "monthly", orderId },
  });

  await setPaymentId(orderId, payment.id);
  const checkoutUrl = payment._links?.checkout?.href ?? null;
  res.status(200).json({ checkoutUrl, orderId, paymentId: payment.id });
}


// ------------------------------ Exports (HTTP) -------------------------------
export const createPaymentKoop     =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreatePaymentKoop);

export const createPayment         =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreatePaymentKoop); // alias

export const createPaymentWaitlist =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreatePaymentWaitlist);

export const createMonthlyFirstPayment =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreateMonthlyPurchase);

export const createMonthlyPurchase =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreateMonthlyPurchase);

// Beschouw 'paid' en 'authorized' als betaald
function isPaidStatus(status?: string) {
  const s = (status || "").toLowerCase();
  return s === "paid" || s === "authorized";
}

export const mollieWebhook = onRequest(
  { region: REGION, secrets: ["MOLLIE_LIVE_KEY"] },
  async (req: Request, res: Response): Promise<void> => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.status(405).send("Method Not Allowed");
      return;
    }

    const id = (req.body as any)?.id || (req.query as any)?.id;
    const paymentId = String(id || "").trim();
    if (!paymentId) {
      res.status(400).send("Missing id");
      return;
    }

    try {
      const payment: MolliePayment = await mollieGetPayment(paymentId);

      // --- Maand (prepaid): eigen afhandeling --------------------------------
      const orderRes = await findOrderByPaymentId(paymentId);
      if (orderRes) {
        const order = orderRes.data as any;
        if (order.source === "monthly" && isPaidStatus(payment.status)) {
          await completeMonthlyPayment(payment, orderRes);
          res.status(200).send("OK");
          return; // => voorkom dat de jaar-logica hieronder nog loopt
        }
      }

      // --- Jaar / wachtlijst --------------------------------------------------
      logger.info("Webhook ontvangen", { paymentId, status: payment.status });

      if (isPaidStatus(payment.status)) {
        await completeOrderByPayment(payment);
        logger.info("Order afgehandeld als 'betaald'", { paymentId });
      } else {
        logger.info("Webhook met niet-betaalde status, geen actie", {
          paymentId,
          status: payment.status,
        });
      }

      // Bij een succesvol afgehandelde webhook altijd 200 teruggeven
      res.status(200).send("OK");
    } catch (e: any) {
      logger.error("Webhook error", { paymentId, error: e?.message || String(e) });
      res.status(500).send("ERROR");
    }
  }
);

export const importWaitlist = onRequest(
  { region: REGION },
  async (req: Request, res: Response): Promise<void> => {
    // CORS & method
    setCors(res, req.headers.origin as string | undefined);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST")     { res.status(405).send("Method Not Allowed"); return; }

    // eenvoudige bescherming met sleutel (mag hardcoded of via secret/ENV)
    const IMPORT_KEY = process.env.IMPORT_KEY || "zet-hier-een-sterke-eenmalige-sleutel";
    const key = String((req.query as any).key || (req.headers as any)["x-admin-key"] || "");
    if (key !== IMPORT_KEY) { res.status(403).send("forbidden"); return; }

    // input
    const emailsRaw = (req.body as any)?.emails ?? [];
    const emails: string[] = (Array.isArray(emailsRaw) ? emailsRaw : [])
      .map((e: any) => toLowerEmail(String(e)))
      .filter(Boolean);

    const eligibleDays = Number((req.body as any)?.eligibleDays ?? 7);
    const until = Timestamp.fromMillis(Date.now() + eligibleDays * 24 * 60 * 60 * 1000);

    // batch write
    let batch = db.batch(); let n = 0;
    for (const email of emails) {
      const ref = db.collection("waitlist").doc(email);
      batch.set(ref, {
        eligibleUntil: until,
        addedAt: FieldValue.serverTimestamp(),
        source: "csv-import",
      }, { merge: true });
      n++;
      if (n % 400 === 0) { await batch.commit(); batch = db.batch(); }
    }
    if (n % 400 !== 0) await batch.commit();

    res.status(200).json({ ok: true, count: n, eligibleUntil: until.toDate().toISOString() });
  }
);
// ------------------------------ Test-helper ----------------------------------
// ------------------------------ Test-helper ----------------------------------
// ------------------------------ Test-helper ----------------------------------
export const devSimulatePaid = onRequest({ region: REGION }, async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as any;
    const b = (req.body as any) || {};

    const rawEmail = (q.email ?? b.email ?? "").toString().trim();
    const email = toLowerEmail(rawEmail);
    if (!email) { badRequest(res, "email ontbreekt"); return; }

    // Bron bepalen (robuust: accepteert 'monthly', 'maandelijks' of monthly=1/true)
    const sRaw = (q.source ?? b.source ?? q.bron ?? b.bron ?? "").toString().trim().toLowerCase();
    const monthlyFlag = (q.monthly ?? b.monthly ?? "").toString().trim().toLowerCase();
    const isMonthly   = sRaw === "monthly" || sRaw === "maandelijks" || monthlyFlag === "1" || monthlyFlag === "true";
    const isWaitlist  = sRaw === "wachtlijst" || sRaw === "waitlist";

    const source = isMonthly ? "monthly" : (isWaitlist ? "wachtlijst" : "koop");

    const orderId   = newOrderId();
    const paymentId = "SIM-" + Date.now();

    // Bedrag + omschrijving volgens bron
    let amountEUR   = PRICE_EUR_KOOP;
    let description = "Zisa PRO – jaarlicentie";
    if (source === "wachtlijst") {
      amountEUR   = PRICE_EUR_WAITLIST;
      description = "Zisa PRO – jaarlicentie (wachtlijst)";
    }
    if (source === "monthly") {
      amountEUR   = PRICE_EUR_MONTH;          // "6.00"
      description = "Zisa PRO – maand (prepaid)";
    }

    // Order registreren
    await writeOrderAll(orderId, {
      orderId, email, source,
      amountEUR, description,
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
      paymentId,
    });

    // 'Betaald' simuleren in TEST-modus (dus testfactuur + opslag in /Facturen/test/)
    const fakePayment: MolliePayment = { id: paymentId, status: "paid", mode: "test" as const };

    if (source === "monthly") {
      const orderRes = await findOrderByPaymentId(paymentId);
      if (!orderRes) { badRequest(res, "order niet gevonden"); return; }
      await completeMonthlyPayment(fakePayment, orderRes);   // ==> maandflow: +1 maand, factuur, mail
    } else {
      await completeOrderByPayment(fakePayment);             // ==> jaar/wachtlijst: bestaande flow
    }

    res.status(200).json({ ok: true, orderId, paymentId, source, amountEUR });
  } catch (e: any) {
    logger.error("devSimulatePaid error", { error: e?.message || String(e) });
    res.status(500).send("devSimulatePaid error");
  }
});


// ------------------------------ Callables (App Check) ------------------------
export const registerDevice = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid      = req.auth.uid;
  const deviceId = String((req.data as any)?.deviceId || "").trim();
  if (!deviceId) throw new HttpsError("invalid-argument", "deviceId ontbreekt");

  const tokenEmail = String((req.auth.token as any)?.email || "").toLowerCase();
  const isOwner = tokenEmail && OWNER_EMAILS.has(tokenEmail);

  const col = db.collection("users").doc(uid).collection("devices");

  // Idempotent: bestaat dit deviceId al?
  const exists = await col.where("deviceId", "==", deviceId).limit(1).get();
  if (!exists.empty) return { ok: true };

  // ★ Owner-accounts: geen limiet
  if (!isOwner) {
    const countSnap = await col.count().get();
    const n = Number(countSnap.data().count || 0);
    if (n >= DEVICE_LIMIT) {
      throw new HttpsError("resource-exhausted", "DEVICE_LIMIT");
    }
  }

  await col.add({
    deviceId,
    createdAt: FieldValue.serverTimestamp(),
    userAgent: (req.rawRequest?.headers?.["user-agent"] as string) || "",
    email: tokenEmail || null,
  });
  return { ok: true };
});

export const listDevices = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid = req.auth.uid;
  const qs  = await db.collection("users").doc(uid).collection("devices").orderBy("createdAt", "asc").get();
  const items = qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  return { devices: items, limit: DEVICE_LIMIT };
});

export const unregisterDevice = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid         = req.auth.uid;
  const deviceDocId = String((req.data as any)?.deviceDocId || "").trim();
  if (!deviceDocId) throw new HttpsError("invalid-argument", "deviceDocId ontbreekt");
  await db.collection("users").doc(uid).collection("devices").doc(deviceDocId).delete();
  return { ok: true };
});

// Altijd de meest recente licentie kiezen (eerst op uid, anders op e-mail)
export const getAccessStatus = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist.");

  const uid = req.auth.uid;
  const tokenEmail = (req.auth.token as any)?.email
    ? String((req.auth.token as any).email).toLowerCase()
    : "";

  const nowMs = Date.now();

  // ★ OWNER-CHECK: Isabel en Jorn hebben altijd toegang (testaccounts)
  if (tokenEmail && OWNER_EMAILS.has(tokenEmail)) {
    logger.info("[getAccessStatus] Owner account — onbeperkte toegang", {
      uid,
      email: tokenEmail,
    });
    return {
      allowed: true,
      reason: "owner",
      expiresAt: null,
      entitlement: ENTITLEMENT_ID,
      deviceLimit: 99,
    };
  }

  // helper: haal per collectie de nieuwste licentie op (orderBy expiresAt desc)
  const newestBy = async (field: "uid" | "email", value: string) => {
    let best: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    for (const col of LICENSE_COLLECTIONS) {
      const qs = await db
        .collection(col)
        .where(field, "==", value)
        .orderBy("expiresAt", "desc")
        .limit(1)
        .get();

      if (!qs.empty) {
        const d = qs.docs[0];
        if (!best) best = d;
        else {
          const a = (best.data() as any)?.expiresAt;
          const b = (d.data() as any)?.expiresAt;
          const ams = a?.toMillis?.() ?? 0;
          const bms = b?.toMillis?.() ?? 0;
          if (bms > ams) best = d;
        }
      }
    }
    return best;
  };

  // 1) Probeer op uid
  let doc = await newestBy("uid", uid);

  // 2) Zoniet, val terug op e-mail
  if (!doc && tokenEmail) {
    doc = await newestBy("email", tokenEmail);
  }

  // 3) Geen licentie gevonden
  if (!doc) {
    logger.info("[getAccessStatus] Geen licentie", { uid, email: tokenEmail });
    return { allowed: false, reason: "no_license" };
  }

  // 4) Controleer status en vervaldatum
  const lic = doc.data() as any;
  const expMs = lic.expiresAt?.toMillis?.() ?? 0;
  const expIso =
    lic.expiresAt?.toDate?.() ? lic.expiresAt.toDate().toISOString() : null;

  logger.info("[getAccessStatus] Gekozen licentie", {
    uid,
    email: tokenEmail,
    id: doc.id,
    path: doc.ref.path,
    status: lic.status,
    expiresAtMs: expMs,
    entitlement: lic.entitlement,
    deviceLimit: lic.deviceLimit,
  });

  const isActive =
  String(lic.status || "").toLowerCase() === "actief" ||
  String(lic.status || "").toLowerCase() === "active";

if (!isActive) {
  return { allowed: false, reason: "inactive", expiresAt: expIso };
}

  if (expMs && expMs < nowMs) {
    return { allowed: false, reason: "expired", expiresAt: expIso };
  }

  return {
    allowed: true,
    reason: "ok",
    expiresAt: expIso,
    entitlement: lic.entitlement || ENTITLEMENT_ID,
    deviceLimit: lic.deviceLimit ?? DEVICE_LIMIT,
  };
});


// --------------------------- HTTP wrappers (CORS) -----------------------------
export const listDevicesHttp = onRequest({ region: REGION }, async (req: Request, res: Response) => {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  try {
    const authHeader = String(req.headers.authorization || "");
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!idToken) { forbidden(res, "Missing Bearer token"); return; }

    const decoded = await auth.verifyIdToken(idToken, true);
    const uid = decoded.uid;

    const qs = await db.collection("users").doc(uid).collection("devices")
      .orderBy("createdAt", "asc").get();
    const items = qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    res.status(200).json({ devices: items, limit: DEVICE_LIMIT });
  } catch (e: any) {
    logger.error("listDevicesHttp error", { error: e?.message || String(e) });
    res.status(500).json({ error: "internal" });
  }
});

export const unregisterDeviceHttp = onRequest({ region: REGION }, async (req: Request, res: Response) => {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  try {
    const authHeader = String(req.headers.authorization || "");
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!idToken) { forbidden(res, "Missing Bearer token"); return; }

    const decoded = await auth.verifyIdToken(idToken, true);
    const uid = decoded.uid;

    const deviceDocId = String((req.body as any)?.deviceDocId || "").trim();
    if (!deviceDocId) { badRequest(res, "deviceDocId ontbreekt"); return; }

    await db.collection("users").doc(uid).collection("devices").doc(deviceDocId).delete();
    res.status(200).json({ ok: true });
  } catch (e: any) {
    logger.error("unregisterDeviceHttp error", { error: e?.message || String(e) });
    res.status(500).json({ error: "internal" });
  }
});
// ===== KidLinks (QR die vervalt met licentie) =================================

// Korte, niet-raadbare code (zonder i, l, 0, 1)
function mkCode(len = 9) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

/**
 * Maakt een kind-link (QR) aan voor de ingelogde leerkracht.
 * target: "kid-start" | "plus100" | "min100" | "plus1000" | "min1000"
 * range:  "100" | "1000"
 */
export const createKidLink = onCall({ region: REGION, cors: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist.");
  const uid = req.auth.uid;
  const { target = "kid-start", range = "100" } = (req.data || {}) as {
    target?: string; range?: "100" | "1000";
  };

  // ——— Pak jouw nieuwste geldige licentie (je helpers bestaan al)
  const nowMs = Timestamp.now().toMillis();
  const list = await fetchLicensesBy("uid", uid);
  const lic  = pickLatestValid(list, nowMs);
  if (!lic) throw new HttpsError("failed-precondition", "Geen (geldige) licentie gevonden.");

  const expiresAt = lic.expiresAt as Timestamp;
  if (!expiresAt || expiresAt.toMillis() <= nowMs) {
    throw new HttpsError("failed-precondition", "Licentie is verlopen.");
  }

  // ——— Maak code en bewaar
  const code = mkCode(9);
  await db.collection("kidLinks").doc(code).set({
    uid,
    licenseId: lic.licenseId || lic.id || null,   // optioneel; afhankelijk van je model
    target,                                       // bv. 'kid-start'
    range,                                        // '100' | '1000'
    expiresAt,
    createdAt: Timestamp.now(),
    disabled: false,
  });

  const proj   = process.env.GCLOUD_PROJECT!;
  const region = REGION;
  const url    = `https://${region}-${proj}.cloudfunctions.net/proLink/${code}`;

  return { url, code, expiresAt: expiresAt.toDate().toISOString() };
});

/**
 * Publieke redirect: valideert code + geldigheid en stuurt door naar PRO.
 * Bij verlopen link: toont nette melding met link naar je site.
 */
export const proLink = onRequest({ region: REGION }, async (req, res) => {
  try {
    const code = (req.path || req.url).split("/").pop()!.trim();
    if (!code) { res.status(400).send("Code ontbreekt."); return; }

    const ref = db.collection("kidLinks").doc(code);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).send("Link niet gevonden."); return; }

    const data = doc.data()!;
    if (data.disabled) { res.status(410).send("Link is ingetrokken."); return; }

    const expMs = (data.expiresAt as Timestamp).toMillis();
    if (Date.now() >= expMs) {
      res.status(410).send(`
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <div style="font-family:system-ui;max-width:640px;margin:40px auto;line-height:1.5">
          <h2>Licentie verlopen</h2>
          <p>Deze QR is niet meer geldig omdat de licentie vervallen is.</p>
          <p><a href="${FRONTEND_REPO}" style="font-weight:700">Koop of verleng je licentie</a></p>
        </div>`);
      return;
    }

    // Bepaal je PRO-basis aan de hand van FRONTEND_REPO
    // LIVE:
    const base = `${FRONTEND_REPO}/pro/`;
    // STAGING (tijdelijk testen)? Zet FRONTEND_REPO even naar je staging-repo,
    // of dupliceer deze function met een andere base.

    const t = encodeURIComponent(Date.now().toString(36)); // mini-nonce tegen caching
    let dest = "";
    switch (data.target) {
      case "plus100":  dest = `${base}plus100.html?kid=1&range=100&t=${t}`;   break;
      case "min100":   dest = `${base}min100.html?kid=1&range=100&t=${t}`;    break;
      case "plus1000": dest = `${base}plus1000.html?kid=1&range=1000&t=${t}`; break;
      case "min1000":  dest = `${base}min1000.html?kid=1&range=1000&t=${t}`;  break;
      default:         dest = `${base}hulpschema-kid.html?kid=1&range=${data.range || "100"}&t=${t}`;
    }

    res.setHeader("Cache-Control", "no-store, private, max-age=0");
    res.redirect(302, dest);
  } catch (e: any) {
    logger.error("proLink error", { error: e?.message || String(e) });
    res.status(500).send("Interne fout.");
  }
});

// ──────────────────────────────────────────────────────────────────────────
// HELPER: HTML-template voor herinneringsmail in warme Zisa-stijl
// ──────────────────────────────────────────────────────────────────────────
function reminderEmailHtml(opts: {
  dagenResterend: number;
  vervalDatumStr: string;
  verlengUrl: string;
}) {
  const { dagenResterend, vervalDatumStr, verlengUrl } = opts;

  // Tekst aangepast op urgentie
  const titel = dagenResterend === 1
    ? "Even een seintje — je abonnement loopt morgen af!"
    : `Even een seintje — je abonnement loopt over ${dagenResterend} dagen af`;

  const intro = dagenResterend === 1
    ? `Je PRO-abonnement op de Spelletjesmaker loopt <strong>morgen (${vervalDatumStr})</strong> af. Wil je zonder onderbreking verder kunnen werken? Verleng dan vandaag nog je abonnement.`
    : `Je PRO-abonnement op de Spelletjesmaker loopt af op <strong>${vervalDatumStr}</strong>. Dat is over ${dagenResterend} dagen. Verleng nu zodat je zonder onderbreking verder kan werken.`;

  return `
  <div style="font-family:'Comic Sans MS','Trebuchet MS',Arial,sans-serif;font-size:16px;line-height:1.6;color:#2f2a22;max-width:560px;margin:0 auto;padding:24px;background:#fffaf2;border-radius:14px;border:1px solid #ead8b8">

    <div style="text-align:center;margin-bottom:20px">
      <span style="font-size:48px">🦓</span>
    </div>

    <h2 style="color:#442700;margin:0 0 16px;font-size:1.3rem;text-align:center">${titel}</h2>

    <p>Hallo!</p>

    <p>${intro}</p>

    <p>Je gegevens en instellingen blijven gewoon bewaard wanneer je verlengt — je kan meteen verder waar je gebleven was.</p>

    <p style="text-align:center;margin:28px 0">
      <a href="${verlengUrl}"
         style="display:inline-block;padding:12px 24px;background:#ffcf56;color:#442700;text-decoration:none;border-radius:12px;font-weight:700;font-size:1rem;border:2px solid #442700">
        Verleng mijn abonnement
      </a>
    </p>

    <p style="font-size:0.9rem;color:#746a5b;margin-top:24px">
      Je kan kiezen tussen een maandabonnement (€6/maand) of een jaarabonnement (€40/jaar — voordeligst).
    </p>

    <hr style="border:none;border-top:1px dashed #ead8b8;margin:24px 0">

    <p style="font-size:0.85rem;color:#746a5b">
      Vragen? Antwoord gerust op deze mail of stuur een berichtje naar
      <a href="mailto:zebrapost@jufzisa.be" style="color:#6f4300">zebrapost@jufzisa.be</a>.
    </p>

    <p style="font-size:0.85rem;color:#746a5b;margin-top:16px">
      Lieve groetjes,<br>
      Juf Zisa 🦓
    </p>

  </div>`;
}


// ──────────────────────────────────────────────────────────────────────────
// SCHEDULED FUNCTION: dagelijkse check op aflopende abonnementen
// ──────────────────────────────────────────────────────────────────────────
//
// Draait elke dag om 08:00 's ochtends (Brussel-tijd).
// Stuurt mails bij:
//   - 7 dagen voor afloop  (warning)
//   - 1 dag voor afloop    (urgent)
//
// Markeert verzonden mails in het licentiedocument zodat een klant nooit
// twee keer dezelfde reminder krijgt.
//
// Velden die in elke licentie worden bijgehouden:
//   - reminder7Days_forExpiresAt:  ISO-string van de expiresAt waarvoor
//                                   de 7-dagen mail is verstuurd
//   - reminder1Day_forExpiresAt:   idem voor de 1-dag mail
//
// Door de expiresAt op te slaan WAARVOOR de mail is verstuurd, herkennen
// we automatisch dat een verlenging een nieuwe cyclus is (want de
// expiresAt verandert bij elke verlenging) en wordt er opnieuw gemaild
// in de volgende cyclus. Geen reset nodig in mollieWebhook.
// ──────────────────────────────────────────────────────────────────────────

export const checkExpiringLicenses = onSchedule(
  {
    schedule: "0 8 * * *",               // elke dag om 08:00
    timeZone: "Europe/Brussels",
    region: REGION,
    retryCount: 2,                        // bij crash: 2x opnieuw proberen
  },
  async (event) => {
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Vensters: een licentie krijgt een mail als zijn expiresAt valt binnen
    // het venster [target - 12u, target + 12u]. Zo vangen we ook licenties
    // die op een andere tijd op de dag aflopen.
    const window7Start  = now + (7 * ONE_DAY_MS) - (12 * 60 * 60 * 1000);
    const window7End    = now + (7 * ONE_DAY_MS) + (12 * 60 * 60 * 1000);
    const window1Start  = now + (1 * ONE_DAY_MS) - (12 * 60 * 60 * 1000);
    const window1End    = now + (1 * ONE_DAY_MS) + (12 * 60 * 60 * 1000);

    let totaal7 = 0;
    let totaal1 = 0;
    let fouten = 0;

    // Helper om de huidige expiresAt als unieke "cyclus-key" op te slaan
    const expiresKey = (lic: any): string => {
      const d = lic.expiresAt?.toDate?.() ?? new Date(lic.expiresAt);
      return d.toISOString();
    };

    // Doorloop alle licentie-collecties (licenses + Licenties)
    for (const col of LICENSE_COLLECTIONS) {
      // ── 7-DAGEN venster ──
      try {
        const qs7 = await db
          .collection(col)
          .where("expiresAt", ">=", new Date(window7Start))
          .where("expiresAt", "<=", new Date(window7End))
          .get();

        for (const doc of qs7.docs) {
          const lic = doc.data() as any;
          const huidigeKey = expiresKey(lic);

          // Skip als al verstuurd VOOR DEZE expiresAt-cyclus
          if (lic.reminder7Days_forExpiresAt === huidigeKey) continue;

          // Skip als status niet actief
          const isActive = String(lic.status || "").toLowerCase() === "actief"
                        || String(lic.status || "").toLowerCase() === "active";
          if (!isActive) continue;

          // Skip als geen email
          const email = (lic.email || "").toString().trim().toLowerCase();
          if (!email) continue;

          try {
            const eindDatum = lic.expiresAt?.toDate?.() ?? new Date(lic.expiresAt);
            const datumStr = eindDatum.toLocaleDateString("nl-BE", {
              year: "numeric", month: "long", day: "numeric"
            });
            const verlengUrl = `${FRONTEND_REPO}/pro/verlopen.html?reason=expiring_soon&until=${encodeURIComponent(eindDatum.toISOString())}`;

            await queueEmail(
              email,
              "Even een seintje — je Zisa PRO loopt over een week af",
              reminderEmailHtml({
                dagenResterend: 7,
                vervalDatumStr: datumStr,
                verlengUrl,
              })
            );

            // Markeer voor deze cyclus (niet opnieuw mailen tot expiresAt wijzigt)
            await doc.ref.update({
              reminder7Days_forExpiresAt: huidigeKey,
              reminder7Days_sentAt: FieldValue.serverTimestamp(),
            });

            totaal7++;
            logger.info("[reminder-7d] verzonden", { email, licId: doc.id });
          } catch (e) {
            fouten++;
            logger.error("[reminder-7d] fout bij verzenden", { licId: doc.id, error: String(e) });
          }
        }
      } catch (e) {
        logger.error(`[reminder-7d] query-fout in collectie '${col}'`, { error: String(e) });
      }

      // ── 1-DAG venster ──
      try {
        const qs1 = await db
          .collection(col)
          .where("expiresAt", ">=", new Date(window1Start))
          .where("expiresAt", "<=", new Date(window1End))
          .get();

        for (const doc of qs1.docs) {
          const lic = doc.data() as any;
          const huidigeKey = expiresKey(lic);

          // Skip als al verstuurd VOOR DEZE expiresAt-cyclus
          if (lic.reminder1Day_forExpiresAt === huidigeKey) continue;

          const isActive = String(lic.status || "").toLowerCase() === "actief"
                        || String(lic.status || "").toLowerCase() === "active";
          if (!isActive) continue;

          const email = (lic.email || "").toString().trim().toLowerCase();
          if (!email) continue;

          try {
            const eindDatum = lic.expiresAt?.toDate?.() ?? new Date(lic.expiresAt);
            const datumStr = eindDatum.toLocaleDateString("nl-BE", {
              year: "numeric", month: "long", day: "numeric"
            });
            const verlengUrl = `${FRONTEND_REPO}/pro/verlopen.html?reason=expiring_soon&until=${encodeURIComponent(eindDatum.toISOString())}`;

            await queueEmail(
              email,
              "⚠️ Je Zisa PRO loopt morgen af",
              reminderEmailHtml({
                dagenResterend: 1,
                vervalDatumStr: datumStr,
                verlengUrl,
              })
            );

            await doc.ref.update({
              reminder1Day_forExpiresAt: huidigeKey,
              reminder1Day_sentAt: FieldValue.serverTimestamp(),
            });

            totaal1++;
            logger.info("[reminder-1d] verzonden", { email, licId: doc.id });
          } catch (e) {
            fouten++;
            logger.error("[reminder-1d] fout bij verzenden", { licId: doc.id, error: String(e) });
          }
        }
      } catch (e) {
        logger.error(`[reminder-1d] query-fout in collectie '${col}'`, { error: String(e) });
      }
    }

    // ─── SCHOOL HERINNERINGEN (FASE 2 verleng-systeem) ───────────────────
    // Stuurt naar schoolContact: 30 dagen + 7 dagen vooraf
    // Eén mail per school per cyclus (niet per leerkracht!)

    const window30Start = now + (30 * ONE_DAY_MS) - (12 * 60 * 60 * 1000);
    const window30End   = now + (30 * ONE_DAY_MS) + (12 * 60 * 60 * 1000);

    let school30Sent = 0;
    let school7Sent = 0;

    // Helper: vind alle scholen waarvan een licentie binnen het venster valt
    const findSchoolsExpiring = async (windowStart: number, windowEnd: number): Promise<Set<string>> => {
      const schools = new Set<string>();
      for (const col of LICENSE_COLLECTIONS) {
        try {
          const qs = await db
            .collection(col)
            .where("source", "==", "school")
            .where("expiresAt", ">=", new Date(windowStart))
            .where("expiresAt", "<=", new Date(windowEnd))
            .get();
          for (const doc of qs.docs) {
            const lic = doc.data() as any;
            const isActive = String(lic.status || "").toLowerCase() === "active"
                          || String(lic.status || "").toLowerCase() === "actief";
            if (!isActive) continue;
            if (lic.schoolName) schools.add(String(lic.schoolName).trim());
          }
        } catch (e) {
          logger.error(`[school-reminder] query in '${col}'`, { error: String(e) });
        }
      }
      return schools;
    };

    // 30-dagen schoolherinnering
    try {
      const schools30 = await findSchoolsExpiring(window30Start, window30End);
      for (const schoolName of schools30) {
        try {
          // Haal token op
          const tokenSnap = await db.collection(RENEWAL_TOKEN_COLLECTION)
            .where("schoolName", "==", schoolName)
            .limit(1)
            .get();
          if (tokenSnap.empty) {
            logger.warn("[school-reminder-30] Geen token voor school", { schoolName });
            continue;
          }
          const tokenData = tokenSnap.docs[0].data() as any;

          // Check of al verstuurd voor deze cyclus (jaar-maand)
          const cycleKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
          if (tokenData.reminder30_lastCycle === cycleKey) continue;

          const contact = String(tokenData.schoolContact || "").toLowerCase();
          if (!contact) {
            logger.warn("[school-reminder-30] Geen contactpersoon", { schoolName });
            continue;
          }

          // Haal teachers op voor mail-info
          const teachers = await getActiveTeachersOfSchool(schoolName);
          const verlengUrl = `${RENEWAL_PAGE_BASE_URL}?token=${encodeURIComponent(tokenData.token)}`;

          await queueEmail(
            contact,
            `🦓 Verleng uw Spelgenerator PRO — ${schoolName}`,
            `<p>Beste,</p>
             <p>Het Spelgenerator PRO abonnement voor <strong>${schoolName}</strong> loopt af over <strong>±30 dagen</strong>.</p>
             <p>U heeft momenteel <strong>${teachers.length}</strong> actieve licentie${teachers.length === 1 ? '' : 's'}.</p>
             <p style="margin-top:18px"><a href="${verlengUrl}" style="display:inline-block;padding:12px 22px;background:#6B4E9B;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Verleng nu</a></p>
             <p style="font-size:14px;color:#5E5E5E;margin-top:18px">
               Op de verleng-pagina kunt u:<br>
               • Bestaande licenties verlengen<br>
               • Nieuwe leerkrachten toevoegen (pro rata berekend)<br>
               • De contactpersoon wijzigen
             </p>
             <p style="font-size:13px;color:#888;margin-top:18px">
               Tijdig verlengen voorkomt onderbrekingen. We sturen ook nog een herinnering 7 dagen vooraf.
             </p>
             <p>Met vriendelijke groet,<br>juf Zisa 🦓<br>${SELLER_EMAIL}</p>`
          );

          await tokenSnap.docs[0].ref.update({
            reminder30_lastCycle: cycleKey,
            reminder30_lastSentAt: FieldValue.serverTimestamp(),
          });
          school30Sent++;
        } catch (e) {
          logger.error("[school-reminder-30] mail mislukt", { schoolName, error: String(e) });
          fouten++;
        }
      }
    } catch (e) {
      logger.error("[school-reminder-30] algemene fout", { error: String(e) });
    }

    // 7-dagen schoolherinnering (gebruikt zelfde venster als individueel)
    try {
      const schools7 = await findSchoolsExpiring(window7Start, window7End);
      for (const schoolName of schools7) {
        try {
          const tokenSnap = await db.collection(RENEWAL_TOKEN_COLLECTION)
            .where("schoolName", "==", schoolName)
            .limit(1)
            .get();
          if (tokenSnap.empty) continue;
          const tokenData = tokenSnap.docs[0].data() as any;

          const cycleKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
          if (tokenData.reminder7_lastCycle === cycleKey) continue;

          const contact = String(tokenData.schoolContact || "").toLowerCase();
          if (!contact) continue;

          const teachers = await getActiveTeachersOfSchool(schoolName);
          const verlengUrl = `${RENEWAL_PAGE_BASE_URL}?token=${encodeURIComponent(tokenData.token)}`;

          await queueEmail(
            contact,
            `⏰ Laatste week — verleng Spelgenerator PRO voor ${schoolName}`,
            `<p>Beste,</p>
             <p>Het Spelgenerator PRO abonnement voor <strong>${schoolName}</strong> loopt af over <strong>±7 dagen</strong>.</p>
             <p>Indien u nog niet hebt verlengd, doe dat dan deze week.</p>
             <p>U heeft momenteel <strong>${teachers.length}</strong> actieve licentie${teachers.length === 1 ? '' : 's'}.</p>
             <p style="margin-top:18px"><a href="${verlengUrl}" style="display:inline-block;padding:12px 22px;background:#6B4E9B;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Verleng nu</a></p>
             <p style="font-size:14px;color:#5E5E5E;margin-top:18px">
               Zonder verlenging worden de accounts inactief op de vervaldatum. Er volgen geen verdere herinneringen.
             </p>
             <p>Met vriendelijke groet,<br>juf Zisa 🦓<br>${SELLER_EMAIL}</p>`
          );

          await tokenSnap.docs[0].ref.update({
            reminder7_lastCycle: cycleKey,
            reminder7_lastSentAt: FieldValue.serverTimestamp(),
          });
          school7Sent++;
        } catch (e) {
          logger.error("[school-reminder-7] mail mislukt", { schoolName, error: String(e) });
          fouten++;
        }
      }
    } catch (e) {
      logger.error("[school-reminder-7] algemene fout", { error: String(e) });
    }

    logger.info("[checkExpiringLicenses] klaar", {
      verzonden_7dagen: totaal7,
      verzonden_1dag: totaal1,
      school_30dagen: school30Sent,
      school_7dagen: school7Sent,
      fouten,
    });
  }
);

// ============================================================================
// SCHOOL-LICENTIES — Admin functie
// Maakt voor één leerkracht in één klap aan:
//  - Firebase Auth user (of hergebruik bestaande)
//  - Licentiedocument in beide LICENSE_COLLECTIONS
//  - Bestelling-document in ORDER_COLLECTIONS met source: "school"
//  - Stuurt welkomstmail met wachtwoord-reset-link
//
// Gebruikt SCHOOL_ADMIN_EMAILS bovenaan dit bestand voor toegangscontrole.
// ============================================================================

// ------- E-mail template specifiek voor school-leerkrachten ------------------
function emailHtmlSchool(opts: {
  email: string;
  passwordLink: string;
  schoolName: string;
}) {
  const { email, passwordLink, schoolName } = opts;
  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;padding:12px 20px;background:#6B4E9B;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-family:Arial,Helvetica,sans-serif">${label}</a>`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#0f172a;max-width:560px">
    <p>Dag,</p>
    <p>Welkom bij <strong>Zisa PRO</strong>! 🦓</p>
    <p>Jouw school <strong>${schoolName}</strong> heeft voor jou een jaarabonnement op de Spelgenerator PRO aangevraagd. Je account is klaar om in gebruik te nemen.</p>
    <p style="margin-top:18px"><strong>Stap 1 — Stel je wachtwoord in:</strong></p>
    <p>${btn(passwordLink, "Mijn wachtwoord instellen")}</p>
    <p style="margin-top:18px"><strong>Stap 2 — Open Zisa PRO:</strong></p>
    <p>${btn(APP_INDEX_URL, "Open Zisa PRO")}</p>
    <p style="margin-top:18px;font-size:14px;color:#5E5E5E">
      Je logt in met dit e-mailadres: <code>${email}</code><br>
      Het abonnement loopt 12 maanden vanaf vandaag.<br>
      Tip: bewaar deze mail voor later — als je je wachtwoord ooit kwijt bent, kan je via de inlogpagina een nieuw wachtwoord aanvragen.
    </p>
    <p style="margin-top:20px">Veel plezier met de tools!</p>
    <p>Warme groeten,<br>juf Zisa 🦓<br>${SELLER_EMAIL}</p>
  </div>`;
}

// ------- Helper: schoollicentie-code (afwijkend patroon zodat herkenbaar) ----
function makeSchoolLicenseCode(): string {
  // Format: SCHL-YYYY-XXXX-XXXX (jaartal + 8 willekeurige tekens)
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // zonder verwarrende I/O/0/1
  const pick = (n: number) => Array.from({ length: n }, () =>
    chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SCHL-${year}-${pick(4)}-${pick(4)}`;
}

// ----------------------------------------------------------------------------
// PRO RATA HELPERS — voor toevoegen leerkrachten aan bestaande school
// ----------------------------------------------------------------------------

/**
 * Bereken pro rata prijs op basis van resterende dagen.
 * Regels:
 *  - Pro rata: (resterende dagen / 365) * jaartarief
 *  - Afgerond naar boven op hele euro's
 *  - Minimum €6 (zoals maandabonnement)
 */
function berekenProRataPrijs(resterendeDagen: number, jaartarief: number = 40): number {
  const exact = (resterendeDagen / 365) * jaartarief;
  const naarBoven = Math.ceil(exact);
  return Math.max(6, naarBoven);
}

/**
 * Bepaal "school context" voor een nieuwe leerkracht-toevoeging.
 * Output:
 *   - exists: of er al actieve leerkrachten zijn voor deze school
 *   - latestExpiresAt: laatste vervaldatum onder actieve leerkrachten
 *   - daysRemaining: aantal dagen tot die vervaldatum
 *   - synchronized: of we synchroniseren met bestaande vervaldatum
 *   - suggestedExpiry: voorgestelde vervaldatum voor nieuwe leerkracht
 *   - suggestedPrice: voorgestelde prijs (in euro's)
 *   - mode: "new_school" | "sync_prorata" | "sync_plus_year"
 */
async function getSchoolContext(schoolName: string): Promise<{
  exists: boolean;
  latestExpiresAt: Date | null;
  daysRemaining: number;
  synchronized: boolean;
  suggestedExpiry: Timestamp;
  suggestedPrice: number;
  mode: "new_school" | "sync_prorata" | "sync_plus_year";
  activeTeacherCount: number;
}> {
  // Zoek alle actieve licenties voor deze school
  const trimmedName = schoolName.trim();
  let latestMs = 0;
  let activeCount = 0;

  for (const col of LICENSE_COLLECTIONS) {
    try {
      const qs = await db
        .collection(col)
        .where("schoolName", "==", trimmedName)
        .where("source", "==", "school")
        .get();
      for (const doc of qs.docs) {
        const lic = doc.data() as any;
        const status = String(lic.status || "").toLowerCase();
        if (status !== "active" && status !== "actief") continue;
        const expMs = lic.expiresAt?.toMillis?.() ?? 0;
        if (expMs > Date.now()) {
          activeCount++;
          if (expMs > latestMs) latestMs = expMs;
        }
      }
    } catch {}
  }

  if (latestMs === 0) {
    // Nieuwe school — gewoon volledig jaar vanaf vandaag
    return {
      exists: false,
      latestExpiresAt: null,
      daysRemaining: 365,
      synchronized: false,
      suggestedExpiry: calcExpiry(),
      suggestedPrice: 40,
      mode: "new_school",
      activeTeacherCount: 0,
    };
  }

  const nowMs = Date.now();
  const daysRemaining = Math.ceil((latestMs - nowMs) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 90) {
    // < 3 maanden: volledig jaar PLUS resterende dagen erbovenop
    const proRata = berekenProRataPrijs(daysRemaining);
    const totalPrice = 40 + proRata;
    // Vervaldatum: bestaande + 1 jaar
    const newExpiry = new Date(latestMs);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    return {
      exists: true,
      latestExpiresAt: new Date(latestMs),
      daysRemaining,
      synchronized: true,
      suggestedExpiry: Timestamp.fromDate(newExpiry),
      suggestedPrice: totalPrice,
      mode: "sync_plus_year",
      activeTeacherCount: activeCount,
    };
  } else {
    // ≥ 3 maanden: pro rata tot bestaande vervaldatum
    const proRataPrice = berekenProRataPrijs(daysRemaining);
    return {
      exists: true,
      latestExpiresAt: new Date(latestMs),
      daysRemaining,
      synchronized: true,
      suggestedExpiry: Timestamp.fromMillis(latestMs),
      suggestedPrice: proRataPrice,
      mode: "sync_prorata",
      activeTeacherCount: activeCount,
    };
  }
}

// ------- De hoofdfunctie -----------------------------------------------------
/**
 * adminGrantSchoolLicense — maakt voor één leerkracht in één klap aan:
 *  - Firebase Auth user (of hergebruik bestaande)
 *  - Licentiedocument in beide LICENSE_COLLECTIONS
 *  - Bestelling-document in ORDER_COLLECTIONS met source: "school"
 *  - Stuurt welkomstmail met wachtwoord-reset-link
 *
 * Input (data):
 *  - email           (verplicht) — mailadres leerkracht
 *  - schoolName      (verplicht) — naam van de school (komt op factuur/bestelling)
 *  - invoiceNumber   (optioneel) — Dexxter-factuurnummer voor in de Bestelling
 *  - notes           (optioneel) — vrij notitieveld
 *
 * Output:
 *  - { ok: true, licenseCode, uid, expiresAt, alreadyExisted }
 *  - bij fout: HttpsError
 */
export const adminGrantSchoolLicense = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    // 1) AUTH: alleen jij mag dit aanroepen
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      logger.warn("[adminGrantSchoolLicense] Ongeoorloofde poging", {
        callerEmail,
        uid: req.auth.uid,
      });
      throw new HttpsError("permission-denied", "Je hebt geen toegang tot deze functie.");
    }

    // 2) INPUT VALIDATIE
    const data = req.data || {};
    const emailRaw = String(data.email || "").trim();
    const schoolName = String(data.schoolName || "").trim();
    const schoolContactRaw = String(data.schoolContact || "").trim();
    const invoiceNumber = String(data.invoiceNumber || "").trim();
    const notes = String(data.notes || "").trim();

    if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      throw new HttpsError("invalid-argument", "Ongeldig e-mailadres.");
    }
    if (!schoolName) {
      throw new HttpsError("invalid-argument", "Schoolnaam is verplicht.");
    }
    // schoolContact is optioneel voor backwards-compatibility, maar als ingevuld moet het geldig zijn
    if (schoolContactRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolContactRaw)) {
      throw new HttpsError("invalid-argument", "Ongeldig contactpersoon e-mailadres.");
    }
    const schoolContact = schoolContactRaw ? toLowerEmail(schoolContactRaw) : "";

    const email = toLowerEmail(emailRaw);

    // 3) IDEMPOTENT CHECK: bestaat er al een actieve licentie voor dit mailadres?
    const existing = await findLicenseByEmail(email);
    if (existing) {
      const lic = existing as any;
      const expMs = lic.expiresAt?.toMillis?.() ?? 0;
      const stillActive =
        (String(lic.status || "").toLowerCase() === "active" ||
         String(lic.status || "").toLowerCase() === "actief") &&
        expMs > Date.now();

      if (stillActive) {
        logger.info("[adminGrantSchoolLicense] Bestaande actieve licentie gevonden, overgeslagen", {
          email,
          licenseCode: lic.code,
        });
        return {
          ok: true,
          alreadyExisted: true,
          licenseCode: lic.code,
          uid: lic.uid,
          expiresAt: lic.expiresAt?.toDate?.()?.toISOString?.() || null,
          message: "Deze leerkracht heeft al een actieve licentie. Geen nieuwe aangemaakt.",
        };
      }
    }

    // 4) AUTH USER: hergebruik bestaande of maak nieuwe
    const uid = await ensureUser(email);

    // 4.5) ★ Bepaal schoolcontext (bestaande school of nieuw?)
    //      → bepaalt vervaldatum + prijs (pro rata of volledig jaar)
    //      → kan worden overschreven met data.forceFullYear = true
    const forceFullYear = !!data.forceFullYear;
    const schoolCtx = await getSchoolContext(schoolName);

    // Bepaal effectieve vervaldatum + prijs voor DEZE leerkracht
    let licenseExpiresAt: Timestamp;
    let licensePrice: number;
    let licenseMode: string;

    if (!schoolCtx.exists || forceFullYear) {
      // Nieuwe school OF expliciet volledig jaar gevraagd
      licenseExpiresAt = calcExpiry();
      licensePrice = 40;
      licenseMode = forceFullYear ? "force_full_year" : "new_school";
    } else {
      // Bestaande school: gebruik suggestie van schoolCtx
      licenseExpiresAt = schoolCtx.suggestedExpiry;
      licensePrice = schoolCtx.suggestedPrice;
      licenseMode = schoolCtx.mode;
    }

    // 5) LICENTIE GENEREREN
    const licenseCode = makeSchoolLicenseCode();
    const expiresAt = licenseExpiresAt;
    const orderId = `school-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const licenseDoc = {
      code: licenseCode,
      email,
      uid,
      entitlement: ENTITLEMENT_ID,
      productId: "zisa-pro-jaarlijks",
      deviceLimit: DEVICE_LIMIT,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      orderId,
      status: "active",
      source: "school",            // handig om te onderscheiden van koop
      schoolName,                  // voor latere rapportage
      schoolContact: schoolContact || null,  // contact voor verleng-herinneringen
      pricingMode: licenseMode,    // "new_school", "sync_prorata", "sync_plus_year", "force_full_year"
    };

    await writeLicenseAll(licenseCode, licenseDoc);

    // 6) BESTELLING REGISTREREN
    const orderDoc = {
      amountEUR: licensePrice.toFixed(2),  // bv. "40.00", "27.00", "47.00"
      createdAt: FieldValue.serverTimestamp(),
      paidAt: FieldValue.serverTimestamp(),
      description: `Zisa PRO - jaarlicentie (school: ${schoolName})${licenseMode === "sync_prorata" ? " - pro rata" : licenseMode === "sync_plus_year" ? " - volledig jaar + pro rata" : ""}`,
      email,
      uid,
      licenseCode,
      source: "school",
      status: "betaald",
      schoolName,
      schoolContact: schoolContact || null,  // contact voor verleng-herinneringen
      invoiceNumber: invoiceNumber || null,
      invoiceSeries: "live",
      notes: notes || null,
      grantedBy: callerEmail,           // wie heeft dit aangemaakt
      pricingMode: licenseMode,
    };
    await writeOrderAll(orderId, orderDoc);

    // 6.5) ★ Zorg voor renewal-token voor deze school (FASE 2 verleng-systeem)
    try {
      await ensureSchoolToken(schoolName, schoolContact);
    } catch (e) {
      logger.warn("[adminGrantSchoolLicense] Token aanmaken mislukt", { error: String(e) });
      // Niet fataal — orderverwerking is al gedaan
    }

    // 7) WACHTWOORD-RESET MAIL VERSTUREN
    let mailSent = false;
    try {
      const passwordLink = await generatePasswordLink(email);
      await queueEmail(
        email,
        "Je Zisa PRO account staat klaar 🦓",
        emailHtmlSchool({ email, passwordLink, schoolName }),
      );
      mailSent = true;
    } catch (e: any) {
      logger.error("[adminGrantSchoolLicense] Mail verzenden mislukt", {
        email,
        error: e?.message || String(e),
      });
      // We gooien hier GEEN error: licentie staat al goed.
      // De admin krijgt te zien dat de mail mislukte en kan handmatig resetten.
    }

    logger.info("[adminGrantSchoolLicense] Succesvol", {
      email,
      uid,
      licenseCode,
      schoolName,
      invoiceNumber,
      mailSent,
      callerEmail,
    });

    return {
      ok: true,
      alreadyExisted: false,
      licenseCode,
      uid,
      expiresAt: expiresAt.toDate().toISOString(),
      mailSent,
      pricingMode: licenseMode,
      pricingPrice: licensePrice,
      message: mailSent
        ? `Account aangemaakt (€${licensePrice}, ${licenseMode}) en welkomstmail verzonden.`
        : `Account aangemaakt (€${licensePrice}), maar welkomstmail kon niet verzonden worden. Stuur de wachtwoord-reset handmatig.`,
    };
  }
);

// ============================================================================
// EINDE SCHOOL-LICENTIES
// ============================================================================

// ============================================================================
// SCHOOL-CONTEXT — voor admin om vooraf prijs/vervaldatum te tonen
// ============================================================================

/**
 * Haalt schoolcontext op voor de admin-pagina.
 * Wordt aangeroepen wanneer de admin een schoolnaam invult, om te tonen
 * of er al actieve leerkrachten zijn en welke prijs voorgesteld wordt.
 *
 * Input:
 *  - schoolName (verplicht)
 * Output:
 *  - exists, latestExpiresAt, daysRemaining, suggestedPrice, mode, activeTeacherCount
 */
export const adminGetSchoolContext = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError("permission-denied", "Geen toegang tot deze functie.");
    }

    const data = req.data || {};
    const schoolName = String(data.schoolName || "").trim();
    if (!schoolName) {
      throw new HttpsError("invalid-argument", "Schoolnaam is verplicht.");
    }

    const ctx = await getSchoolContext(schoolName);

    return {
      ok: true,
      schoolName,
      exists: ctx.exists,
      latestExpiresAt: ctx.latestExpiresAt?.toISOString() || null,
      daysRemaining: ctx.daysRemaining,
      suggestedPrice: ctx.suggestedPrice,
      mode: ctx.mode,
      activeTeacherCount: ctx.activeTeacherCount,
    };
  }
);

// ============================================================================
// SCHOOL-OVERZICHT — Drie admin functies
// Voeg dit blok toe aan het einde van pro_backend/src/index.ts
// (NA de bestaande adminGrantSchoolLicense functie)
//
// Gebruikt SCHOOL_ADMIN_EMAILS (al gedefinieerd bovenaan index.ts).
// ============================================================================

// ----------------------------------------------------------------------------
// 1) adminListSchoolOrders — Haal alle schoolbestellingen op, gegroepeerd per school
// ----------------------------------------------------------------------------
/**
 * Returns alle schoolbestellingen, met per leerkracht ook de huidige licentie-status.
 * Output:
 *   {
 *     schools: [
 *       {
 *         schoolName: "BS Atheneum Aalst",
 *         invoiceNumber: "2026-0010",
 *         notes: "...",
 *         firstOrderDate: "2026-04-26T...",
 *         teachers: [
 *           {
 *             email: "...",
 *             licenseCode: "SCHL-...",
 *             createdAt: "...",
 *             expiresAt: "...",
 *             status: "active" | "expiring_soon" | "expired",
 *             daysUntilExpiry: 365,
 *             uid: "..."
 *           }
 *         ]
 *       }
 *     ]
 *   }
 */
export const adminListSchoolOrders = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    // 1) AUTH CHECK
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      logger.warn("[adminListSchoolOrders] Ongeoorloofde poging", { callerEmail });
      throw new HttpsError("permission-denied", "Geen toegang tot deze functie.");
    }

    const data = req.data || {};
    const includeArchived = !!data.includeArchived;

    // 2) Haal alle bestellingen op met source: "school"
    //    We zoeken in alle ORDER_COLLECTIONS, maar in praktijk is "Bestellingen" de hoofdcollectie
    const allOrders: any[] = [];
    for (const col of ORDER_COLLECTIONS) {
      try {
        const qs = await db
          .collection(col)
          .where("source", "==", "school")
          .get();
        for (const doc of qs.docs) {
          const data = doc.data() as any;
          allOrders.push({ ...data, _docId: doc.id, _collection: col });
        }
      } catch (e) {
        logger.warn(`[adminListSchoolOrders] Fout bij ophalen ${col}`, { error: String(e) });
      }
    }

    // 3) Dedupliceer op licenseCode (kan in meerdere collecties staan)
    const seenCodes = new Set<string>();
    const uniqueOrders = allOrders.filter((o) => {
      const code = String(o.licenseCode || "").trim();
      if (!code || seenCodes.has(code)) return false;
      seenCodes.add(code);
      return true;
    });

    // 4) Voor elke bestelling: haal de huidige licentie-status op
    const nowMs = Date.now();
    const teachersWithStatus = await Promise.all(
      uniqueOrders.map(async (order) => {
        const code = String(order.licenseCode || "").trim();
        let licenseDoc: any = null;

        // Zoek in beide LICENSE_COLLECTIONS
        for (const col of LICENSE_COLLECTIONS) {
          try {
            const qs = await db.collection(col).where("code", "==", code).limit(1).get();
            if (!qs.empty) {
              licenseDoc = qs.docs[0].data();
              break;
            }
          } catch {}
        }

        // Bereken status
        const expMs = licenseDoc?.expiresAt?.toMillis?.() ?? 0;
        const daysUntilExpiry = expMs > 0 ? Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24)) : null;
        let teacherStatus: "active" | "expiring_soon" | "expired" | "archived" | "unknown" = "unknown";
        if (licenseDoc) {
          const statusLower = String(licenseDoc.status || "").toLowerCase();
          if (statusLower === "archived" || licenseDoc.archived === true) {
            teacherStatus = "archived";
          } else {
            const isActive = statusLower === "active" || statusLower === "actief";
            if (!isActive || (expMs > 0 && expMs < nowMs)) {
              teacherStatus = "expired";
            } else if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
              teacherStatus = "expiring_soon";
            } else {
              teacherStatus = "active";
            }
          }
        }

        return {
          email: String(order.email || ""),
          licenseCode: code,
          createdAt: order.createdAt?.toDate?.()?.toISOString?.() || null,
          expiresAt: licenseDoc?.expiresAt?.toDate?.()?.toISOString?.() || null,
          status: teacherStatus,
          daysUntilExpiry,
          uid: licenseDoc?.uid || order.uid || null,
          schoolName: String(order.schoolName || "(onbekend)"),
          schoolContact: String(order.schoolContact || licenseDoc?.schoolContact || ""),
          invoiceNumber: String(order.invoiceNumber || ""),
          notes: String(order.notes || ""),
          orderDate: order.createdAt?.toDate?.()?.toISOString?.() || null,
        };
      })
    );

    // 5) Groepeer per schoolnaam
    const schoolMap = new Map<string, any>();
    for (const t of teachersWithStatus) {
      // ★ Filter gearchiveerde tenzij expliciet gevraagd
      if (!includeArchived && t.status === "archived") continue;

      const name = t.schoolName || "(onbekend)";
      if (!schoolMap.has(name)) {
        schoolMap.set(name, {
          schoolName: name,
          schoolContact: t.schoolContact || "",
          invoiceNumber: t.invoiceNumber,
          notes: t.notes,
          firstOrderDate: t.orderDate,
          teachers: [],
        });
      }
      const s = schoolMap.get(name);
      // Update schoolContact als deze leerkracht er een heeft maar de school nog niet
      if (!s.schoolContact && t.schoolContact) {
        s.schoolContact = t.schoolContact;
      }
      // Hou de oudste invoicedate als eerste activatiedatum
      if (t.orderDate && (!s.firstOrderDate || t.orderDate < s.firstOrderDate)) {
        s.firstOrderDate = t.orderDate;
      }
      // Voeg leerkracht-info toe (zonder dubbele schoolvelden)
      s.teachers.push({
        email: t.email,
        licenseCode: t.licenseCode,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        status: t.status,
        daysUntilExpiry: t.daysUntilExpiry,
        uid: t.uid,
      });
    }

    // 6) Sorteer scholen op meest recent eerst, en leerkrachten op email
    const schools = Array.from(schoolMap.values()).sort((a, b) => {
      const aT = a.firstOrderDate || "";
      const bT = b.firstOrderDate || "";
      return bT.localeCompare(aT);
    });
    for (const s of schools) {
      s.teachers.sort((a: any, b: any) => a.email.localeCompare(b.email));
    }

    logger.info("[adminListSchoolOrders] Resultaat", {
      callerEmail,
      schoolCount: schools.length,
      teacherCount: teachersWithStatus.length,
    });

    return { ok: true, schools };
  }
);

// ----------------------------------------------------------------------------
// 2) adminResendPasswordReset — Stuur wachtwoord-reset mail opnieuw
// ----------------------------------------------------------------------------
/**
 * Genereert nieuwe password-reset link en stuurt opnieuw welkomstmail.
 * Input:
 *   - email (verplicht)
 *   - schoolName (optioneel, voor in de mail)
 */
export const adminResendPasswordReset = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError("permission-denied", "Geen toegang tot deze functie.");
    }

    const data = req.data || {};
    const emailRaw = String(data.email || "").trim();
    const schoolName = String(data.schoolName || "").trim() || "je school";

    if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      throw new HttpsError("invalid-argument", "Ongeldig e-mailadres.");
    }

    const email = toLowerEmail(emailRaw);

    // Genereer en verstuur
    try {
      const passwordLink = await generatePasswordLink(email);
      await queueEmail(
        email,
        "Je Zisa PRO wachtwoord opnieuw instellen 🦓",
        emailHtmlSchool({ email, passwordLink, schoolName }),
      );
      logger.info("[adminResendPasswordReset] Succesvol", { email, callerEmail });
      return {
        ok: true,
        message: `Welkomstmail opnieuw verzonden naar ${email}.`,
      };
    } catch (e: any) {
      logger.error("[adminResendPasswordReset] Fout", { email, error: e?.message || String(e) });
      throw new HttpsError("internal", `Mail verzenden mislukt: ${e?.message || "onbekende fout"}`);
    }
  }
);

// ----------------------------------------------------------------------------
// 3) adminExtendLicense — Verleng een licentie met 1 jaar (of opgegeven aantal dagen)
// ----------------------------------------------------------------------------
/**
 * Verlengt een licentie. Standaard met 1 jaar (365 dagen).
 * Input:
 *   - licenseCode (verplicht)
 *   - extendDays (optioneel, default 365)
 *   - newInvoiceNumber (optioneel, voor administratie)
 */
export const adminExtendLicense = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError("permission-denied", "Geen toegang tot deze functie.");
    }

    const data = req.data || {};
    const licenseCode = String(data.licenseCode || "").trim();
    const extendDays = Number.isFinite(data.extendDays) ? Number(data.extendDays) : 365;
    const newInvoiceNumber = String(data.newInvoiceNumber || "").trim();

    if (!licenseCode) {
      throw new HttpsError("invalid-argument", "Licentiecode is verplicht.");
    }
    if (extendDays < 1 || extendDays > 1825) {
      throw new HttpsError("invalid-argument", "Verlengperiode moet tussen 1 en 1825 dagen liggen.");
    }

    // Zoek de bestaande licentie in beide collecties
    let foundDoc: { ref: FirebaseFirestore.DocumentReference; data: any; col: string } | null = null;
    for (const col of LICENSE_COLLECTIONS) {
      try {
        const qs = await db.collection(col).where("code", "==", licenseCode).limit(1).get();
        if (!qs.empty) {
          foundDoc = { ref: qs.docs[0].ref, data: qs.docs[0].data(), col };
          break;
        }
      } catch {}
    }
    if (!foundDoc) {
      throw new HttpsError("not-found", `Licentie ${licenseCode} niet gevonden.`);
    }

    // Bereken nieuwe vervaldatum: start vanaf huidige expiresAt OF vandaag (welke later)
    const nowMs = Date.now();
    const currentExpMs = foundDoc.data.expiresAt?.toMillis?.() ?? 0;
    const startMs = Math.max(nowMs, currentExpMs);
    const newExpMs = startMs + extendDays * 24 * 60 * 60 * 1000;
    const newExpiresAt = Timestamp.fromMillis(newExpMs);

    // Update in BEIDE collecties
    let updatedCount = 0;
    for (const col of LICENSE_COLLECTIONS) {
      try {
        const qs = await db.collection(col).where("code", "==", licenseCode).limit(1).get();
        if (!qs.empty) {
          await qs.docs[0].ref.update({
            expiresAt: newExpiresAt,
            status: "active",  // herzet status voor het geval die op "expired" stond
            lastExtendedAt: FieldValue.serverTimestamp(),
            lastExtendedBy: callerEmail,
          });
          updatedCount++;
        }
      } catch (e) {
        logger.warn(`[adminExtendLicense] Update mislukt in ${col}`, { error: String(e) });
      }
    }

    // Voeg ook een nieuwe Bestelling toe als verlengingsbewijs
    const orderId = `school-extend-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const orderDoc = {
      amountEUR: PRICE_EUR_KOOP,
      createdAt: FieldValue.serverTimestamp(),
      paidAt: FieldValue.serverTimestamp(),
      description: `Zisa PRO - jaarverlenging (${foundDoc.data.schoolName || "school"})`,
      email: foundDoc.data.email,
      uid: foundDoc.data.uid,
      licenseCode,
      source: "school",
      status: "betaald",
      schoolName: foundDoc.data.schoolName || "",
      invoiceNumber: newInvoiceNumber || null,
      invoiceSeries: "live",
      isExtension: true,
      extendDays,
      grantedBy: callerEmail,
    };
    try {
      await writeOrderAll(orderId, orderDoc);
    } catch (e) {
      logger.warn("[adminExtendLicense] Order doc niet aangemaakt", { error: String(e) });
    }

    logger.info("[adminExtendLicense] Succesvol", {
      licenseCode,
      newExpiresAt: newExpiresAt.toDate().toISOString(),
      extendDays,
      callerEmail,
      updatedCount,
    });

    return {
      ok: true,
      licenseCode,
      newExpiresAt: newExpiresAt.toDate().toISOString(),
      extendDays,
      message: `Licentie verlengd tot ${newExpiresAt.toDate().toLocaleDateString("nl-BE")}.`,
    };
  }
);

// ============================================================================
// EINDE SCHOOL-OVERZICHT FUNCTIES
// ============================================================================


// ============================================================================
// SCHOOL-OVERZICHT — Archiveren / herstellen / definitief verwijderen
// ============================================================================

// ----------------------------------------------------------------------------
// 4) adminArchiveTeacher — Archiveer een leerkracht (account werkt niet meer)
// ----------------------------------------------------------------------------
/**
 * Zet status op "archived". Account werkt niet meer maar data blijft bewaard.
 * Input: licenseCode (verplicht)
 */
export const adminArchiveTeacher = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError("permission-denied", "Geen toegang tot deze functie.");
    }

    const data = req.data || {};
    const licenseCode = String(data.licenseCode || "").trim();
    if (!licenseCode) {
      throw new HttpsError("invalid-argument", "Licentiecode is verplicht.");
    }

    let updatedCount = 0;
    let teacherEmail = "";
    let schoolName = "";

    // Update licenties in beide collecties
    for (const col of LICENSE_COLLECTIONS) {
      try {
        const qs = await db.collection(col).where("code", "==", licenseCode).limit(1).get();
        if (!qs.empty) {
          const docData = qs.docs[0].data() as any;
          teacherEmail = teacherEmail || String(docData.email || "");
          schoolName = schoolName || String(docData.schoolName || "");
          await qs.docs[0].ref.update({
            status: "archived",
            archived: true,
            archivedAt: FieldValue.serverTimestamp(),
            archivedBy: callerEmail,
            previousStatus: docData.status || null,
          });
          updatedCount++;
        }
      } catch (e) {
        logger.warn(`[adminArchiveTeacher] Update mislukt in ${col}`, { error: String(e) });
      }
    }

    if (updatedCount === 0) {
      throw new HttpsError("not-found", `Licentie ${licenseCode} niet gevonden.`);
    }

    logger.info("[adminArchiveTeacher] Succesvol", {
      licenseCode, teacherEmail, schoolName, callerEmail, updatedCount,
    });

    return {
      ok: true,
      licenseCode,
      message: `Leerkracht ${teacherEmail || licenseCode} gearchiveerd.`,
    };
  }
);

// ----------------------------------------------------------------------------
// 5) adminUnarchiveTeacher — Herstel een gearchiveerde leerkracht
// ----------------------------------------------------------------------------
/**
 * Maakt een gearchiveerde leerkracht weer actief.
 * Als de licentie al verlopen was: blijft verlopen — gebruik adminExtendLicense daarna.
 * Input: licenseCode (verplicht)
 */
export const adminUnarchiveTeacher = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError("permission-denied", "Geen toegang tot deze functie.");
    }

    const data = req.data || {};
    const licenseCode = String(data.licenseCode || "").trim();
    if (!licenseCode) {
      throw new HttpsError("invalid-argument", "Licentiecode is verplicht.");
    }

    let updatedCount = 0;

    for (const col of LICENSE_COLLECTIONS) {
      try {
        const qs = await db.collection(col).where("code", "==", licenseCode).limit(1).get();
        if (!qs.empty) {
          await qs.docs[0].ref.update({
            status: "active",
            archived: false,
            archivedAt: FieldValue.delete(),
            archivedBy: FieldValue.delete(),
            unarchivedAt: FieldValue.serverTimestamp(),
            unarchivedBy: callerEmail,
          });
          updatedCount++;
        }
      } catch (e) {
        logger.warn(`[adminUnarchiveTeacher] Update mislukt in ${col}`, { error: String(e) });
      }
    }

    if (updatedCount === 0) {
      throw new HttpsError("not-found", `Licentie ${licenseCode} niet gevonden.`);
    }

    logger.info("[adminUnarchiveTeacher] Succesvol", { licenseCode, callerEmail, updatedCount });

    return {
      ok: true,
      licenseCode,
      message: `Leerkracht hersteld. Let op: indien de vervaldatum verlopen is, gebruik 'Verleng' om opnieuw toegang te geven.`,
    };
  }
);

// ----------------------------------------------------------------------------
// 6) adminDeleteTeacher — DEFINITIEF verwijderen (Auth + alle Firestore docs)
// ----------------------------------------------------------------------------
/**
 * Verwijdert ALLES van een leerkracht definitief:
 *  - Firebase Auth user
 *  - Licentie in beide LICENSE_COLLECTIONS
 *  - Bestelling-documenten in alle ORDER_COLLECTIONS
 *  - Apparaat-documenten in users/{uid}/devices
 * NIET ongedaan te maken!
 *
 * Input:
 *   - licenseCode (verplicht) — om de licentie te identificeren
 *   - confirmEmail (verplicht) — moet matchen met email van de licentie (extra veiligheid)
 */
export const adminDeleteTeacher = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError("permission-denied", "Geen toegang tot deze functie.");
    }

    const data = req.data || {};
    const licenseCode = String(data.licenseCode || "").trim();
    const confirmEmail = String(data.confirmEmail || "").trim().toLowerCase();
    if (!licenseCode) {
      throw new HttpsError("invalid-argument", "Licentiecode is verplicht.");
    }
    if (!confirmEmail) {
      throw new HttpsError("invalid-argument", "Bevestigings-e-mail is verplicht.");
    }

    // Zoek de licentie en haal email + uid op
    let foundLicense: any = null;
    for (const col of LICENSE_COLLECTIONS) {
      try {
        const qs = await db.collection(col).where("code", "==", licenseCode).limit(1).get();
        if (!qs.empty) {
          foundLicense = qs.docs[0].data();
          break;
        }
      } catch {}
    }
    if (!foundLicense) {
      throw new HttpsError("not-found", `Licentie ${licenseCode} niet gevonden.`);
    }

    const licenseEmail = String(foundLicense.email || "").toLowerCase();
    const uid = String(foundLicense.uid || "");

    // Veiligheidscheck: confirmEmail moet matchen
    if (licenseEmail !== confirmEmail) {
      logger.warn("[adminDeleteTeacher] Email mismatch", { licenseCode, licenseEmail, confirmEmail });
      throw new HttpsError(
        "failed-precondition",
        `Bevestigings-e-mail komt niet overeen met de licentie (${licenseEmail}).`
      );
    }

    let deletedCounts = {
      licenses: 0,
      orders: 0,
      devices: 0,
      authUser: false,
    };

    // 1) Verwijder licenties
    for (const col of LICENSE_COLLECTIONS) {
      try {
        const qs = await db.collection(col).where("code", "==", licenseCode).get();
        for (const doc of qs.docs) {
          await doc.ref.delete();
          deletedCounts.licenses++;
        }
      } catch (e) {
        logger.warn(`[adminDeleteTeacher] Licentie delete mislukt ${col}`, { error: String(e) });
      }
    }

    // 2) Verwijder bestellingen (alle docs met deze licenseCode of email)
    for (const col of ORDER_COLLECTIONS) {
      try {
        const qs = await db.collection(col).where("licenseCode", "==", licenseCode).get();
        for (const doc of qs.docs) {
          await doc.ref.delete();
          deletedCounts.orders++;
        }
      } catch (e) {
        logger.warn(`[adminDeleteTeacher] Order delete mislukt ${col}`, { error: String(e) });
      }
    }

    // 3) Verwijder apparaat-documenten
    if (uid) {
      try {
        const devSnap = await db.collection("users").doc(uid).collection("devices").get();
        for (const doc of devSnap.docs) {
          await doc.ref.delete();
          deletedCounts.devices++;
        }
      } catch (e) {
        logger.warn(`[adminDeleteTeacher] Devices delete mislukt`, { error: String(e) });
      }
    }

    // 4) Verwijder Auth user (als er andere leerkrachten dit uid niet meer gebruiken)
    if (uid) {
      try {
        await auth.deleteUser(uid);
        deletedCounts.authUser = true;
      } catch (e: any) {
        // Als user niet bestaat: niet erg
        if (e?.code !== "auth/user-not-found") {
          logger.warn(`[adminDeleteTeacher] Auth delete mislukt`, { error: String(e) });
        }
      }
    }

    logger.info("[adminDeleteTeacher] Succesvol", {
      licenseCode, licenseEmail, uid, callerEmail, deletedCounts,
    });

    return {
      ok: true,
      licenseCode,
      message: `Leerkracht ${licenseEmail} definitief verwijderd. Alle data weg.`,
      deletedCounts,
    };
  }
);

// ============================================================================
// EINDE ARCHIVEREN/VERWIJDEREN
// ============================================================================


// ============================================================================
// SCHOOL VERLENG-SYSTEEM (FASE 2)
// ============================================================================
//
// Werking:
// - Bij eerste schoolbestelling wordt een uniek RENEWAL_TOKEN gegenereerd
//   (per school, niet per leerkracht). Dit token wordt opgeslagen in de
//   collectie "schoolTokens".
// - 30 en 7 dagen vóór vervaldatum stuurt checkExpiringLicenses een mail
//   naar schoolContact met een verleng-link: scholen/verleng.html?token=XXX
// - School opent de pagina, ziet hun gegevens, kan verlengen + leerkrachten
//   toevoegen + contactpersoon wijzigen.
// - Bij submit komt er een document in collectie "verleng_aanvragen".
// - Isabel ziet deze in admin en activeert na betaling.
//
// PUBLIEKE functies (App Check, GEEN auth nodig — werken via token):
//   - getRenewalInfo({ token }) — haalt school-info op
//   - submitRenewalRequest({ token, ... }) — dient aanvraag in
//   - updateSchoolContact({ token, newContact }) — wijzigt contactpersoon
//
// ADMIN functies (App Check + auth + SCHOOL_ADMIN_EMAILS):
//   - adminListRenewalRequests() — lijst openstaande aanvragen
//   - adminProcessRenewalRequest({ requestId, invoiceNumber }) — activeer
//   - adminRejectRenewalRequest({ requestId, reason }) — weiger
//
// ============================================================================

const RENEWAL_TOKEN_COLLECTION = "schoolTokens";
const RENEWAL_REQUESTS_COLLECTION = "verleng_aanvragen";
const RENEWAL_PAGE_BASE_URL = "https://isabelrockele.github.io/scholen/verleng.html";

// ----------------------------------------------------------------------------
// Helper: genereer of haal token op voor een school
// ----------------------------------------------------------------------------
function generateRenewalToken(): string {
  // 32-char random string (URL-safe)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/**
 * Krijg of maak een token voor een school. Token is uniek per schoolName.
 */
async function ensureSchoolToken(schoolName: string, schoolContact: string): Promise<string> {
  const trimmed = schoolName.trim();
  // Zoek bestaand token
  const existing = await db
    .collection(RENEWAL_TOKEN_COLLECTION)
    .where("schoolName", "==", trimmed)
    .limit(1)
    .get();

  if (!existing.empty) {
    const data = existing.docs[0].data();
    // Update contactpersoon als die anders is
    if (schoolContact && schoolContact !== data.schoolContact) {
      await existing.docs[0].ref.update({
        schoolContact: schoolContact.toLowerCase(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return String(data.token || "");
  }

  // Maak nieuw token
  const token = generateRenewalToken();
  await db.collection(RENEWAL_TOKEN_COLLECTION).add({
    schoolName: trimmed,
    schoolContact: schoolContact ? schoolContact.toLowerCase() : "",
    token,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return token;
}

/**
 * Zoek school op basis van token (voor publieke functies).
 */
async function findSchoolByToken(token: string): Promise<{
  schoolName: string;
  schoolContact: string;
  tokenDocRef: FirebaseFirestore.DocumentReference;
} | null> {
  if (!token || token.length < 16) return null;
  const qs = await db
    .collection(RENEWAL_TOKEN_COLLECTION)
    .where("token", "==", token)
    .limit(1)
    .get();
  if (qs.empty) return null;
  const data = qs.docs[0].data();
  return {
    schoolName: String(data.schoolName || ""),
    schoolContact: String(data.schoolContact || ""),
    tokenDocRef: qs.docs[0].ref,
  };
}

/**
 * Haal alle actieve leerkrachten van een school op (voor renewal pagina).
 */
async function getActiveTeachersOfSchool(schoolName: string): Promise<Array<{
  email: string;
  licenseCode: string;
  expiresAt: Date | null;
  daysUntilExpiry: number | null;
}>> {
  const trimmed = schoolName.trim();
  const seenCodes = new Set<string>();
  const teachers: any[] = [];
  const nowMs = Date.now();

  for (const col of LICENSE_COLLECTIONS) {
    try {
      const qs = await db
        .collection(col)
        .where("schoolName", "==", trimmed)
        .where("source", "==", "school")
        .get();
      for (const doc of qs.docs) {
        const lic = doc.data() as any;
        const code = String(lic.code || "");
        if (!code || seenCodes.has(code)) continue;
        const status = String(lic.status || "").toLowerCase();
        if (status !== "active" && status !== "actief") continue;
        const expMs = lic.expiresAt?.toMillis?.() ?? 0;
        if (expMs <= 0) continue;
        seenCodes.add(code);
        teachers.push({
          email: String(lic.email || ""),
          licenseCode: code,
          expiresAt: new Date(expMs),
          daysUntilExpiry: Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24)),
        });
      }
    } catch {}
  }
  // Sorteer op email
  teachers.sort((a, b) => a.email.localeCompare(b.email));
  return teachers;
}

// ----------------------------------------------------------------------------
// PUBLIEK: getRenewalInfo
// ----------------------------------------------------------------------------
/**
 * Geeft school-info terug op basis van token.
 * Geen auth nodig — beveiliging via token.
 */
export const getRenewalInfo = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    const data = req.data || {};
    const token = String(data.token || "").trim();

    const found = await findSchoolByToken(token);
    if (!found) {
      throw new HttpsError("not-found", "Ongeldige of verlopen verleng-link.");
    }

    const teachers = await getActiveTeachersOfSchool(found.schoolName);

    // Bepaal gemeenschappelijke vervaldatum (laatste = referentie)
    let latestExpiresMs = 0;
    for (const t of teachers) {
      const ms = t.expiresAt?.getTime() ?? 0;
      if (ms > latestExpiresMs) latestExpiresMs = ms;
    }
    const daysUntilExpiry = latestExpiresMs > 0
      ? Math.ceil((latestExpiresMs - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      ok: true,
      schoolName: found.schoolName,
      schoolContact: found.schoolContact,
      teachers: teachers.map(t => ({
        email: t.email,
        licenseCode: t.licenseCode,
        expiresAt: t.expiresAt?.toISOString() || null,
        daysUntilExpiry: t.daysUntilExpiry,
      })),
      commonExpiresAt: latestExpiresMs > 0 ? new Date(latestExpiresMs).toISOString() : null,
      daysUntilExpiry,
      pricePerYear: 40,
    };
  }
);

// ----------------------------------------------------------------------------
// PUBLIEK: updateSchoolContact (B3 — met notificatie)
// ----------------------------------------------------------------------------
/**
 * Wijzig contactpersoon van een school.
 * - Wijziging gebeurt direct
 * - Info-mail naar OUDE adres (waarschuwing)
 * - Info-mail naar Isabel (notificatie)
 */
export const updateSchoolContact = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    const data = req.data || {};
    const token = String(data.token || "").trim();
    const newContactRaw = String(data.newContact || "").trim();

    if (!newContactRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContactRaw)) {
      throw new HttpsError("invalid-argument", "Ongeldig e-mailadres.");
    }
    const newContact = newContactRaw.toLowerCase();

    const found = await findSchoolByToken(token);
    if (!found) {
      throw new HttpsError("not-found", "Ongeldige verleng-link.");
    }

    const oldContact = found.schoolContact;
    if (oldContact === newContact) {
      return { ok: true, message: "Contactpersoon ongewijzigd.", changed: false };
    }

    // Update token-document
    await found.tokenDocRef.update({
      schoolContact: newContact,
      previousContact: oldContact || null,
      updatedAt: FieldValue.serverTimestamp(),
      contactChangeAt: FieldValue.serverTimestamp(),
    });

    // Update ook alle licenties + bestellingen voor deze school
    for (const col of LICENSE_COLLECTIONS) {
      try {
        const qs = await db.collection(col)
          .where("schoolName", "==", found.schoolName)
          .where("source", "==", "school")
          .get();
        for (const doc of qs.docs) {
          await doc.ref.update({ schoolContact: newContact });
        }
      } catch {}
    }
    for (const col of ORDER_COLLECTIONS) {
      try {
        const qs = await db.collection(col)
          .where("schoolName", "==", found.schoolName)
          .where("source", "==", "school")
          .get();
        for (const doc of qs.docs) {
          await doc.ref.update({ schoolContact: newContact });
        }
      } catch {}
    }

    // Mail naar OUDE adres (informeren)
    if (oldContact) {
      try {
        await queueEmail(
          oldContact,
          `Contactpersoon gewijzigd voor ${found.schoolName}`,
          `<p>Beste,</p>
           <p>De contactpersoon voor de Spelgenerator PRO licenties van <strong>${found.schoolName}</strong> is zonet gewijzigd van <code>${oldContact}</code> naar <code>${newContact}</code>.</p>
           <p>Als u deze wijziging niet zelf heeft aangevraagd, neem dan zo snel mogelijk contact op via <a href="mailto:${SELLER_EMAIL}">${SELLER_EMAIL}</a>.</p>
           <p>Met vriendelijke groet,<br>juf Zisa 🦓</p>`
        );
      } catch (e) {
        logger.warn("[updateSchoolContact] Mail naar oude contact mislukt", { error: String(e) });
      }
    }

    // Mail naar Isabel (admin notificatie)
    try {
      await queueEmail(
        SELLER_EMAIL,
        `🔔 Contactpersoon gewijzigd: ${found.schoolName}`,
        `<p>Hallo,</p>
         <p>De contactpersoon voor <strong>${found.schoolName}</strong> is gewijzigd:</p>
         <ul>
           <li>Oud: <code>${oldContact || "(geen)"}</code></li>
           <li>Nieuw: <code>${newContact}</code></li>
         </ul>
         <p>De wijziging is door de school zelf gedaan via de verleng-pagina.</p>
         <p>Indien verdacht, neem contact op met de school.</p>`
      );
    } catch (e) {
      logger.warn("[updateSchoolContact] Mail naar Isabel mislukt", { error: String(e) });
    }

    logger.info("[updateSchoolContact] Wijziging", {
      schoolName: found.schoolName,
      oldContact,
      newContact,
    });

    return {
      ok: true,
      changed: true,
      message: "Contactpersoon gewijzigd. Een bevestigingsmail werd naar het oude adres gestuurd.",
    };
  }
);

// ----------------------------------------------------------------------------
// PUBLIEK: submitRenewalRequest
// ----------------------------------------------------------------------------
/**
 * School dient een verleng-aanvraag in.
 * Komt in collectie verleng_aanvragen, status: "in_afwachting"
 *
 * Input:
 *  - token (verplicht)
 *  - renewExisting: array van licenseCode-strings (welke leerkrachten verlengen)
 *  - newTeachers: array van email-strings (nieuwe leerkrachten toevoegen)
 *  - notes: optionele opmerking van school
 */
export const submitRenewalRequest = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    const data = req.data || {};
    const token = String(data.token || "").trim();
    const renewExisting = Array.isArray(data.renewExisting) ? data.renewExisting : [];
    const newTeachersRaw = Array.isArray(data.newTeachers) ? data.newTeachers : [];
    const notes = String(data.notes || "").trim();

    const found = await findSchoolByToken(token);
    if (!found) {
      throw new HttpsError("not-found", "Ongeldige verleng-link.");
    }

    // Valideer + normaliseer
    const renewCodes: string[] = renewExisting
      .map((c: any) => String(c || "").trim())
      .filter((c: string) => c.length > 0);

    const newEmails: string[] = newTeachersRaw
      .map((e: any) => String(e || "").trim().toLowerCase())
      .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (renewCodes.length === 0 && newEmails.length === 0) {
      throw new HttpsError("invalid-argument", "Selecteer minstens één leerkracht om te verlengen of voeg een nieuwe toe.");
    }

    // Bereken bedrag
    const renewalPrice = renewCodes.length * 40;
    const newPrice = newEmails.length * 40;
    const totalPrice = renewalPrice + newPrice;

    // Bewaar aanvraag
    const requestId = `renewal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.collection(RENEWAL_REQUESTS_COLLECTION).doc(requestId).set({
      requestId,
      schoolName: found.schoolName,
      schoolContact: found.schoolContact,
      renewLicenseCodes: renewCodes,
      newTeacherEmails: newEmails,
      notes: notes || null,
      totalPrice,
      pricePerYear: 40,
      status: "in_afwachting",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Mail naar Isabel
    try {
      const teachersHtml = renewCodes.length > 0
        ? `<p><strong>Verlengen (${renewCodes.length}):</strong></p><ul>${renewCodes.map(c => `<li><code>${c}</code></li>`).join("")}</ul>`
        : "";
      const newHtml = newEmails.length > 0
        ? `<p><strong>Nieuwe leerkrachten (${newEmails.length}):</strong></p><ul>${newEmails.map(e => `<li>${e}</li>`).join("")}</ul>`
        : "";
      await queueEmail(
        SELLER_EMAIL,
        `🦓 Verleng-aanvraag: ${found.schoolName}`,
        `<p>Hallo,</p>
         <p>Een nieuwe verleng-aanvraag van <strong>${found.schoolName}</strong>:</p>
         ${teachersHtml}
         ${newHtml}
         <p><strong>Totaal: €${totalPrice}</strong></p>
         <p>Contactpersoon: <code>${found.schoolContact || "(onbekend)"}</code></p>
         ${notes ? `<p>Opmerking school: ${notes}</p>` : ""}
         <p>Open de admin-pagina om dit te verwerken.</p>`
      );
    } catch (e) {
      logger.warn("[submitRenewalRequest] Mail naar Isabel mislukt", { error: String(e) });
    }

    // Bevestigingsmail naar school
    if (found.schoolContact) {
      try {
        await queueEmail(
          found.schoolContact,
          `Verleng-aanvraag ontvangen — ${found.schoolName}`,
          `<p>Beste,</p>
           <p>We hebben uw verleng-aanvraag voor <strong>${found.schoolName}</strong> goed ontvangen.</p>
           <p>Samenvatting:</p>
           <ul>
             <li>Verlengen: ${renewCodes.length} leerkracht(en)</li>
             <li>Nieuwe leerkrachten: ${newEmails.length}</li>
             <li>Totaalbedrag: <strong>€${totalPrice}</strong></li>
           </ul>
           <p>U ontvangt binnenkort de factuur via Peppol of e-mail.</p>
           <p>Pas na ontvangst van de betaling worden de accounts geactiveerd.</p>
           <p>Met vriendelijke groet,<br>juf Zisa 🦓<br>${SELLER_EMAIL}</p>`
        );
      } catch (e) {
        logger.warn("[submitRenewalRequest] Bevestiging naar school mislukt", { error: String(e) });
      }
    }

    logger.info("[submitRenewalRequest] Aanvraag", {
      schoolName: found.schoolName,
      renewCount: renewCodes.length,
      newCount: newEmails.length,
      totalPrice,
    });

    return {
      ok: true,
      requestId,
      totalPrice,
      message: "Verleng-aanvraag ontvangen! U krijgt binnenkort de factuur per mail.",
    };
  }
);

// ----------------------------------------------------------------------------
// ADMIN: adminListRenewalRequests
// ----------------------------------------------------------------------------
export const adminListRenewalRequests = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError("permission-denied", "Geen toegang.");
    }

    const data = req.data || {};
    const includeProcessed = !!data.includeProcessed;

    const qs = await db.collection(RENEWAL_REQUESTS_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const requests = qs.docs
      .map(d => {
        const data = d.data() as any;
        return {
          requestId: d.id,
          schoolName: String(data.schoolName || ""),
          schoolContact: String(data.schoolContact || ""),
          renewLicenseCodes: data.renewLicenseCodes || [],
          newTeacherEmails: data.newTeacherEmails || [],
          notes: data.notes || null,
          totalPrice: Number(data.totalPrice || 0),
          status: String(data.status || "in_afwachting"),
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
          processedAt: data.processedAt?.toDate?.()?.toISOString?.() || null,
          invoiceNumber: data.invoiceNumber || null,
        };
      })
      .filter(r => includeProcessed || r.status === "in_afwachting");

    return { ok: true, requests };
  }
);

// ----------------------------------------------------------------------------
// ADMIN: adminProcessRenewalRequest
// ----------------------------------------------------------------------------
/**
 * Verwerk een verleng-aanvraag: verlengt bestaande licenties + maakt nieuwe accounts aan.
 * Pas uitvoeren NA ontvangst betaling!
 *
 * Input:
 *  - requestId
 *  - invoiceNumber (optioneel)
 */
export const adminProcessRenewalRequest = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError("permission-denied", "Geen toegang.");
    }

    const data = req.data || {};
    const requestId = String(data.requestId || "").trim();
    const invoiceNumber = String(data.invoiceNumber || "").trim();

    if (!requestId) {
      throw new HttpsError("invalid-argument", "requestId is verplicht.");
    }

    const docRef = db.collection(RENEWAL_REQUESTS_COLLECTION).doc(requestId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new HttpsError("not-found", "Aanvraag niet gevonden.");
    }
    const reqData = docSnap.data() as any;
    if (reqData.status === "verwerkt") {
      throw new HttpsError("already-exists", "Deze aanvraag is al verwerkt.");
    }

    const schoolName = String(reqData.schoolName || "");
    const schoolContact = String(reqData.schoolContact || "");
    const renewCodes: string[] = reqData.renewLicenseCodes || [];
    const newEmails: string[] = reqData.newTeacherEmails || [];

    const results = { renewed: 0, newCreated: 0, errors: [] as string[] };

    // 1) Verleng bestaande licenties met 1 jaar
    for (const code of renewCodes) {
      try {
        let foundDoc: { ref: FirebaseFirestore.DocumentReference; data: any } | null = null;
        for (const col of LICENSE_COLLECTIONS) {
          const qs = await db.collection(col).where("code", "==", code).limit(1).get();
          if (!qs.empty) {
            foundDoc = { ref: qs.docs[0].ref, data: qs.docs[0].data() };
            break;
          }
        }
        if (!foundDoc) {
          results.errors.push(`Licentie ${code} niet gevonden`);
          continue;
        }
        const currentExpMs = foundDoc.data.expiresAt?.toMillis?.() ?? 0;
        const startMs = Math.max(Date.now(), currentExpMs);
        const newExpMs = startMs + 365 * 24 * 60 * 60 * 1000;
        const newExpiresAt = Timestamp.fromMillis(newExpMs);

        // Update in beide collecties
        for (const col of LICENSE_COLLECTIONS) {
          const qs = await db.collection(col).where("code", "==", code).limit(1).get();
          if (!qs.empty) {
            await qs.docs[0].ref.update({
              expiresAt: newExpiresAt,
              status: "active",
              lastExtendedAt: FieldValue.serverTimestamp(),
              lastExtendedBy: callerEmail,
            });
          }
        }

        // Order doc
        const orderId = `school-renew-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await writeOrderAll(orderId, {
          amountEUR: "40.00",
          createdAt: FieldValue.serverTimestamp(),
          paidAt: FieldValue.serverTimestamp(),
          description: `Zisa PRO - jaarverlenging (${schoolName})`,
          email: foundDoc.data.email,
          uid: foundDoc.data.uid,
          licenseCode: code,
          source: "school",
          status: "betaald",
          schoolName,
          schoolContact: schoolContact || null,
          invoiceNumber: invoiceNumber || null,
          invoiceSeries: "live",
          isExtension: true,
          renewalRequestId: requestId,
          grantedBy: callerEmail,
        });

        results.renewed++;
      } catch (e: any) {
        results.errors.push(`${code}: ${e?.message || e}`);
      }
    }

    // 2) Maak nieuwe accounts aan voor nieuwe leerkrachten
    for (const newEmail of newEmails) {
      try {
        // Check of er al een actieve licentie is
        const existing = await findLicenseByEmail(newEmail);
        if (existing) {
          const lic = existing as any;
          const expMs = lic.expiresAt?.toMillis?.() ?? 0;
          const stillActive = String(lic.status || "").toLowerCase() === "active" && expMs > Date.now();
          if (stillActive) {
            results.errors.push(`${newEmail}: heeft al actieve licentie, overgeslagen`);
            continue;
          }
        }

        const uid = await ensureUser(newEmail);
        const ctx = await getSchoolContext(schoolName);

        let licenseExpiresAt: Timestamp;
        let licensePrice: number;
        let licenseMode: string;

        if (!ctx.exists) {
          licenseExpiresAt = calcExpiry();
          licensePrice = 40;
          licenseMode = "new_school";
        } else {
          licenseExpiresAt = ctx.suggestedExpiry;
          licensePrice = ctx.suggestedPrice;
          licenseMode = ctx.mode;
        }

        const licenseCode = makeSchoolLicenseCode();
        const orderId = `school-new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const licenseDoc = {
          code: licenseCode,
          email: newEmail,
          uid,
          entitlement: ENTITLEMENT_ID,
          productId: "zisa-pro-jaarlijks",
          deviceLimit: DEVICE_LIMIT,
          createdAt: FieldValue.serverTimestamp(),
          expiresAt: licenseExpiresAt,
          orderId,
          status: "active",
          source: "school",
          schoolName,
          schoolContact: schoolContact || null,
          pricingMode: licenseMode,
        };
        await writeLicenseAll(licenseCode, licenseDoc);

        await writeOrderAll(orderId, {
          amountEUR: licensePrice.toFixed(2),
          createdAt: FieldValue.serverTimestamp(),
          paidAt: FieldValue.serverTimestamp(),
          description: `Zisa PRO - jaarlicentie (school: ${schoolName}) - via verleng-aanvraag`,
          email: newEmail,
          uid,
          licenseCode,
          source: "school",
          status: "betaald",
          schoolName,
          schoolContact: schoolContact || null,
          invoiceNumber: invoiceNumber || null,
          invoiceSeries: "live",
          renewalRequestId: requestId,
          pricingMode: licenseMode,
          grantedBy: callerEmail,
        });

        // Welkomstmail
        try {
          const passwordLink = await generatePasswordLink(newEmail);
          await queueEmail(
            newEmail,
            "Je Zisa PRO account staat klaar 🦓",
            emailHtmlSchool({ email: newEmail, passwordLink, schoolName })
          );
        } catch (e) {
          logger.warn("[adminProcessRenewalRequest] Welkomstmail mislukt", { newEmail, error: String(e) });
        }

        results.newCreated++;
      } catch (e: any) {
        results.errors.push(`${newEmail}: ${e?.message || e}`);
      }
    }

    // 3) Markeer aanvraag als verwerkt
    await docRef.update({
      status: "verwerkt",
      processedAt: FieldValue.serverTimestamp(),
      processedBy: callerEmail,
      invoiceNumber: invoiceNumber || null,
      results,
    });

    // 4) Notificatie aan school
    if (schoolContact) {
      try {
        await queueEmail(
          schoolContact,
          `✅ Verlenging verwerkt — ${schoolName}`,
          `<p>Beste,</p>
           <p>De verlenging voor <strong>${schoolName}</strong> is succesvol verwerkt.</p>
           <ul>
             <li>${results.renewed} bestaande licentie(s) verlengd</li>
             <li>${results.newCreated} nieuwe leerkracht(en) aangemaakt</li>
           </ul>
           <p>Nieuwe leerkrachten ontvangen apart een welkomstmail.</p>
           <p>Met vriendelijke groet,<br>juf Zisa 🦓</p>`
        );
      } catch (e) {
        logger.warn("[adminProcessRenewalRequest] Mail naar school mislukt", { error: String(e) });
      }
    }

    logger.info("[adminProcessRenewalRequest] Verwerkt", {
      requestId, schoolName, results, callerEmail,
    });

    return {
      ok: true,
      requestId,
      results,
      message: `${results.renewed} verlengd, ${results.newCreated} nieuwe accounts aangemaakt.`,
    };
  }
);

// ----------------------------------------------------------------------------
// ADMIN: adminRejectRenewalRequest
// ----------------------------------------------------------------------------
export const adminRejectRenewalRequest = onCall(
  { region: REGION, enforceAppCheck: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login vereist.");
    }
    const callerEmail = String((req.auth.token as any)?.email || "").toLowerCase();
    if (!SCHOOL_ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError("permission-denied", "Geen toegang.");
    }

    const data = req.data || {};
    const requestId = String(data.requestId || "").trim();
    const reason = String(data.reason || "").trim();

    if (!requestId) {
      throw new HttpsError("invalid-argument", "requestId is verplicht.");
    }

    const docRef = db.collection(RENEWAL_REQUESTS_COLLECTION).doc(requestId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new HttpsError("not-found", "Aanvraag niet gevonden.");
    }

    await docRef.update({
      status: "geweigerd",
      rejectedAt: FieldValue.serverTimestamp(),
      rejectedBy: callerEmail,
      rejectionReason: reason || null,
    });

    logger.info("[adminRejectRenewalRequest] Geweigerd", { requestId, reason, callerEmail });

    return { ok: true, message: "Aanvraag geweigerd." };
  }
);

// ============================================================================
// EINDE VERLENG-SYSTEEM
// ============================================================================
