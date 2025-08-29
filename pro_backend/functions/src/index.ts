// functions/src/index.ts

import { onRequest, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

// Admin SDK v12 – modulaire imports
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import fetch from "node-fetch";
import { z } from "zod";
import { randomUUID } from "node:crypto";

initializeApp();
const db = getFirestore();

const REGION = "europe-west1";
const MOLLIE_API_KEY = defineSecret("MOLLIE_API_KEY");

// ====== Pas deze 2 URLs aan indien nodig ======
const APP_URL = "https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/";
const SUPPORT_EMAIL = "zebraklas@jufzisa.be";

// ====== Instellingen ======
const DEV_TOKEN = "c5a4f5e5-1a8b-4f4e-9ad4-3b1b8b2c5d2e";
const DEFAULT_MAX_DEVICES = 2;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const now = () => Timestamp.now();

// ---------- Helpers ----------
async function generateAndStoreLicense(params: { email: string; productId: string; orderId: string; expiresAt?: Timestamp }) {
  const { email, productId, orderId, expiresAt } = params;

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chunk = (n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  const code = `ZISA-${chunk(4)}-${chunk(4)}-${chunk(4)}`;

  const { ulid } = await import("ulid");
  const licenseId = ulid();

  await db.collection("licenses").doc(licenseId).set({
    code,
    productId,
    orderId,
    email,
    status: "active",
    issuedAt: FieldValue.serverTimestamp(),
    expiresAt: expiresAt ?? null,
  });

  return { licenseId, code };
}

async function enqueueMail(params: { to: string; subject: string; text: string; html?: string }) {
  const payload: any = {
    to: params.to,
    message: { subject: params.subject, text: params.text },
  };
  if (params.html) payload.message.html = params.html;
  await db.collection("mail").add(payload);
}

/**
 * Zorg dat de gebruiker in Auth bestaat en geef een password-reset link terug.
 * Dit laat de klant zélf een wachtwoord instellen (geen magic link).
 */
async function ensureAuthUserAndInvite(email: string, displayName?: string): Promise<string> {
  const auth = getAuth();
  try {
    await auth.getUserByEmail(email);
  } catch (e: any) {
    // Niet gevonden -> aanmaken
    await auth.createUser({
      email,
      emailVerified: false,
      displayName: displayName || email.split("@")[0],
      disabled: false,
    });
  }
  // Genereer reset link (kan ook gebruikt worden als “stel je wachtwoord in”)
  const link = await auth.generatePasswordResetLink(email, {
    url: APP_URL, // na instellen wachtwoord hierheen terug
    handleCodeInApp: false,
  });
  return link;
}

/**
 * Zet of verlengt entitlement (1 jaar) op userId of (tijdelijk) op e-mail.
 */
async function upsertEntitlement(params: {
  userId?: string | null;
  email?: string;
  orderId: string;
  maxDevices?: number;
  fromEmail?: string | null;
  extendMs?: number; // default 1 jaar
}) {
  const extend = params.extendMs ?? ONE_YEAR_MS;
  const newExpires = Timestamp.fromMillis(Date.now() + extend);

  if (params.userId) {
    await db.collection("entitlements").doc(params.userId).set(
      {
        pro: true,
        maxDevices: params.maxDevices ?? DEFAULT_MAX_DEVICES,
        lastOrderId: params.orderId,
        setAt: FieldValue.serverTimestamp(),
        expiresAt: newExpires,
        claimedFromEmail: params.fromEmail ?? null,
      },
      { merge: true }
    );
  }

  if (params.email) {
    const emailKey = params.email.trim().toLowerCase();
    await db.collection("entitlements_by_email").doc(emailKey).set(
      {
        pro: true,
        maxDevices: params.maxDevices ?? DEFAULT_MAX_DEVICES,
        lastOrderId: params.orderId,
        setAt: FieldValue.serverTimestamp(),
        expiresAt: newExpires,
      },
      { merge: true }
    );
  }

  return newExpires;
}

/**
 * Controleer entitlement voor userId of e-mail, en geef {pro,maxDevices,expiresAt} of reden terug.
 */
async function readEntitlementFor(uid: string, email?: string) {
  // 1) userId
  const entDoc = await db.collection("entitlements").doc(uid).get();
  if (entDoc.exists) {
    const d = entDoc.data()!;
    const expiresAt = d.expiresAt as Timestamp | null | undefined;
    if (expiresAt && expiresAt.toMillis() < Date.now()) {
      return { ok: false as const, reason: "EXPIRED_SUBSCRIPTION", expiresAt: expiresAt.toMillis() };
    }
    if (d.pro === true) {
      return { ok: true as const, pro: true, maxDevices: d.maxDevices ?? DEFAULT_MAX_DEVICES, expiresAt: expiresAt?.toMillis() ?? null };
    }
  }

  // 2) tijdelijk via e-mail (kan geclaimd worden door registerDevice)
  if (email) {
    const emailKey = email.trim().toLowerCase();
    const byMail = await db.collection("entitlements_by_email").doc(emailKey).get();
    if (byMail.exists) {
      const d = byMail.data()!;
      const expiresAt = d.expiresAt as Timestamp | null | undefined;
      if (expiresAt && expiresAt.toMillis() < Date.now()) {
        return { ok: false as const, reason: "EXPIRED_SUBSCRIPTION", expiresAt: expiresAt.toMillis() };
      }
      if (d.pro === true) {
        return { ok: true as const, pro: true, maxDevices: d.maxDevices ?? DEFAULT_MAX_DEVICES, expiresAt: expiresAt?.toMillis() ?? null };
      }
    }
  }

  return { ok: false as const, reason: "NO_PRO", expiresAt: null };
}

async function getMolliePayment(paymentId: string, apiKey: string) {
  const res = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Mollie GET failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<any>;
}

/**
 * Stuurt de aankoopmail met wachtwoord-instellink + licentiecode + app-link.
 */
async function sendPurchaseMail(params: {
  email: string;
  productId: string;
  orderId: string;
  licenseCode: string;
  resetLink: string;
  expiresAt: Timestamp;
}) {
  const { email, productId, orderId, licenseCode, resetLink, expiresAt } = params;
  const subject = "Jouw Zisa PRO staat klaar – stel je wachtwoord in";
  const expiresFmt = new Date(expiresAt.toMillis()).toLocaleDateString("nl-BE");

  const text = `Dag,

Bedankt voor je aankoop! Je PRO-abonnement is actief t.e.m. ${expiresFmt}.
Stel nu je wachtwoord in en start meteen:

Wachtwoord instellen: ${resetLink}

Referentie-licentiecode: ${licenseCode}
Product: ${productId}
Order: ${orderId}

Start de app: ${APP_URL}
Vragen? Mail ons via ${SUPPORT_EMAIL}

Vriendelijke groet,
Zebraklas
`;

  const html = `
  <p>Dag,</p>
  <p>Bedankt voor je aankoop! Je PRO-abonnement is actief t.e.m. <b>${expiresFmt}</b>.</p>
  <p><a href="${resetLink}" style="display:inline-block;padding:10px 14px;background:#f5b300;color:#000;border-radius:8px;text-decoration:none;font-weight:600">Wachtwoord instellen</a></p>
  <p style="margin-top:14px">Referentie-licentiecode: <b>${licenseCode}</b><br/>
  Product: <b>${productId}</b><br/>
  Order: <b>${orderId}</b></p>
  <p><a href="${APP_URL}">Start de app</a></p>
  <p>Vragen? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
  <p>Vriendelijke groet,<br/>Zebraklas</p>
  `;

  await enqueueMail({ to: email, subject, text, html });
}

/**
 * Voltooi order: licentie genereren, entitlement zetten/verlengen (1 jaar),
 * Auth-gebruiker uitnodigen, aankoopmail sturen.
 */
async function completeOrder({
  orderId,
  paymentId,
  email,
  productId,
  userId,
}: {
  orderId: string;
  paymentId: string;
  email: string;
  productId: string;
  userId?: string | null;
}) {
  const orderRef = db.collection("orders").doc(orderId);

  // 1) Bereken vervaldatum
  const expiresAt = Timestamp.fromMillis(Date.now() + ONE_YEAR_MS);

  // 2) Licentie
  const { licenseId, code } = await generateAndStoreLicense({ email, productId, orderId, expiresAt });

  // 3) Order updaten
  await orderRef.set(
    {
      status: "paid",
      paymentId,
      licenseId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 4) Entitlement (userId of e-mail)
  const entExpires = await upsertEntitlement({
    userId: userId ?? null,
    email,
    orderId,
    maxDevices: DEFAULT_MAX_DEVICES,
    fromEmail: userId ? email : null,
  });

  // 5) Auth-gebruiker + reset link
  const resetLink = await ensureAuthUserAndInvite(email);

  // 6) Mail
  await sendPurchaseMail({
    email,
    productId,
    orderId,
    licenseCode: code,
    resetLink,
    expiresAt: entExpires,
  });

  return { licenseId, code, expiresAt: entExpires.toMillis() };
}

// ---------- DEV: simulate paid ----------
const SimPayload = z.object({
  orderId: z.string(),
  email: z.string().email(),
  productId: z.string(),
  paymentId: z.string().optional(),
});

export const devSimulatePaid = onRequest({ region: REGION, cors: true }, async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const token =
      (req.query["token"] as string) ||
      (req.headers["x-dev-token"] as string) ||
      "";
    if (token !== DEV_TOKEN) {
      res.status(401).send("Unauthorized");
      return;
    }

    const parsed = SimPayload.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(parsed.error.flatten());
      return;
    }
    const { orderId, email, productId, paymentId } = parsed.data;

    // Order aanmaken indien niet bestaat
    const orderRef = db.collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) {
      await orderRef.set({
        status: "open",
        email,
        productId,
        amount: 3500,
        currency: "EUR",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const fakePaymentId = paymentId || `test_${randomUUID()}`;
    const result = await completeOrder({
      orderId,
      paymentId: fakePaymentId,
      email,
      productId,
    });

    res.status(200).json({ ok: true, ...result });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(`ERR: ${e.message || e}`);
  }
});

// ---------- Mollie webhook ----------
export const mollieWebhook = onRequest(
  { region: REGION, secrets: [MOLLIE_API_KEY], cors: true },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const paymentId = (req.body?.id as string) || (req.body?.paymentId as string) || (req.query["id"] as string);
      if (!paymentId) {
        res.status(400).send("Missing payment id");
        return;
      }

      const payment = await getMolliePayment(paymentId, MOLLIE_API_KEY.value());

      // metadata bij aanmaken betaling meesturen:
      // { orderId, email, productId, userId? }
      const orderId = payment?.metadata?.orderId || payment?.orderId || payment?.metadata?.order_id;
      const email = payment?.metadata?.email || payment?.metadata?.customerEmail;
      const userId = payment?.metadata?.userId || null;
      const productId = payment?.metadata?.productId || payment?.description || "unknown";

      if (!orderId || !email) throw new Error("Missing orderId or email in payment.metadata");

      if (payment.status === "paid") {
        await completeOrder({ orderId, paymentId: payment.id, email, productId, userId });
      } else {
        await db.collection("orders").doc(orderId).set(
          { status: payment.status, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      }

      res.status(200).send("OK");
    } catch (e: any) {
      console.error(e);
      res.status(500).send(`ERR: ${e.message || e}`);
    }
  }
);

// ---------- Anti-delen laag ----------
// /entitlements/{userId} -> { pro: true, maxDevices, expiresAt }
// /entitlements_by_email/{emailLower}
// /devices/{userId}_{deviceId} -> { userId, deviceId, createdAt, lastSeenAt, active }
// /sessionCodes/{autoId} -> { userId, deviceId, code, issuedAt, expiresAt, used }

export const registerDevice = onCall({ region: REGION }, async (req) => {
  const ctx = req.auth;
  if (!ctx?.uid) throw new Error("UNAUTHENTICATED");
  const { deviceId } = (req.data || {}) as { deviceId?: string };
  if (!deviceId || typeof deviceId !== "string" || deviceId.length < 8) {
    throw new Error("INVALID_ARGUMENT: deviceId");
  }

  // entitlement (ook vervaldatum checken)
  const userEmail = (req.auth?.token?.email as string | undefined) ?? undefined;
  const ent = await readEntitlementFor(ctx.uid, userEmail);
  if (!ent.ok) return { ok: false, reason: ent.reason, expiresAt: ent.expiresAt ?? null };

  // apparaten tellen
  const activeQuery = await db
    .collection("devices")
    .where("userId", "==", ctx.uid)
    .where("active", "==", true)
    .get();

  const id = `${ctx.uid}_${deviceId}`;
  const deviceRef = db.collection("devices").doc(id);
  const current = await deviceRef.get();

  if (!current.exists) {
    if (activeQuery.size >= (ent.maxDevices ?? DEFAULT_MAX_DEVICES)) {
      return { ok: false, reason: "DEVICE_LIMIT", maxDevices: ent.maxDevices ?? DEFAULT_MAX_DEVICES };
    }
    await deviceRef.set({
      userId: ctx.uid,
      deviceId,
      createdAt: now(),
      lastSeenAt: now(),
      active: true,
    });
  } else {
    await deviceRef.set({ lastSeenAt: now(), active: true }, { merge: true });
  }

  // Claim entitlement_by_email → entitlements/{uid} (eenmalig)
  if (userEmail) {
    const emailKey = userEmail.trim().toLowerCase();
    const byMail = await db.collection("entitlements_by_email").doc(emailKey).get();
    if (byMail.exists) {
      const data = byMail.data()!;
      await db.collection("entitlements").doc(ctx.uid).set(
        {
          pro: true,
          maxDevices: data.maxDevices ?? DEFAULT_MAX_DEVICES,
          setAt: FieldValue.serverTimestamp(),
          claimedFromEmail: emailKey,
          expiresAt: data.expiresAt ?? null,
        },
        { merge: true }
      );
    }
  }

  return { ok: true, maxDevices: ent.maxDevices ?? DEFAULT_MAX_DEVICES, expiresAt: ent.expiresAt ?? null };
});

export const issueSessionCode = onCall({ region: REGION }, async (req) => {
  const ctx = req.auth;
  if (!ctx?.uid) throw new Error("UNAUTHENTICATED");
  const { deviceId } = (req.data || {}) as { deviceId?: string };
  if (!deviceId) throw new Error("INVALID_ARGUMENT: deviceId");

  // entitlement check + verval
  const userEmail = (req.auth?.token?.email as string | undefined) ?? undefined;
  const ent = await readEntitlementFor(ctx.uid, userEmail);
  if (!ent.ok) return { ok: false, reason: ent.reason, expiresAt: ent.expiresAt ?? null };

  // device check
  const deviceDoc = await db.collection("devices").doc(`${ctx.uid}_${deviceId}`).get();
  if (!deviceDoc.exists || deviceDoc.get("active") !== true) {
    return { ok: false, reason: "DEVICE_NOT_REGISTERED" };
  }

  // invalideer oude ongebruikte codes
  const old = await db
    .collection("sessionCodes")
    .where("userId", "==", ctx.uid)
    .where("deviceId", "==", deviceId)
    .where("used", "==", false)
    .get();
  const batch = db.batch();
  old.forEach((d) => batch.update(d.ref, { used: true }));
  await batch.commit();

  // nieuwe code
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = (n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  const code = `${rand(4)}-${rand(4)}-${rand(4)}`;

  const expiresAt = Timestamp.fromMillis(Date.now() + 15 * 60 * 1000); // 15 min

  const docRef = await db.collection("sessionCodes").add({
    userId: ctx.uid,
    deviceId,
    code,
    issuedAt: now(),
    expiresAt,
    used: false,
  });

  return { ok: true, code, expiresAt: expiresAt.toMillis(), id: docRef.id };
});

// Server-side voorbeeldactie
export const verifySessionCode = onRequest({ region: REGION, cors: true }, async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const { userId, deviceId, code } = req.body || {};
    if (!userId || !deviceId || !code) {
      res.status(400).send("Missing userId/deviceId/code");
      return;
    }

    // check entitlement + vervaldatum
    const ent = await readEntitlementFor(userId);
    if (!ent.ok) {
      res.status(401).json({ ok: false, reason: ent.reason, expiresAt: ent.expiresAt ?? null });
      return;
    }

    const q = await db
      .collection("sessionCodes")
      .where("userId", "==", userId)
      .where("deviceId", "==", deviceId)
      .where("code", "==", code)
      .where("used", "==", false)
      .limit(1)
      .get();

    if (q.empty) {
      res.status(401).json({ ok: false, reason: "INVALID_OR_USED" });
      return;
    }
    const doc = q.docs[0];
    const data = doc.data();
    const expired = (data.expiresAt as Timestamp).toMillis() < Date.now();
    if (expired) {
      await doc.ref.update({ used: true });
      res.status(401).json({ ok: false, reason: "EXPIRED" });
      return;
    }

    await doc.ref.update({ used: true });
    res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(`ERR: ${e.message || e}`);
  }
});

// Klein demo-endpoint dat verifySessionCode intern gebruikt
export const proDoSomething = onRequest({ region: REGION, cors: true }, async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const { userId, deviceId, code } = req.body || {};

    // roep lokale verify-logica direct aan i.p.v. HTTP
    const ent = await readEntitlementFor(userId);
    if (!ent.ok) {
      res.status(401).json({ ok: false, reason: ent.reason, expiresAt: ent.expiresAt ?? null });
      return;
    }
    const q = await db
      .collection("sessionCodes")
      .where("userId", "==", userId)
      .where("deviceId", "==", deviceId)
      .where("code", "==", code)
      .where("used", "==", false)
      .limit(1)
      .get();
    if (q.empty) {
      res.status(401).json({ ok: false, reason: "INVALID_OR_USED" });
      return;
    }
    const doc = q.docs[0];
    const data = doc.data();
    if ((data.expiresAt as Timestamp).toMillis() < Date.now()) {
      await doc.ref.update({ used: true });
      res.status(401).json({ ok: false, reason: "EXPIRED" });
      return;
    }
    await doc.ref.update({ used: true });

    // hier je PRO-actie
    res.status(200).json({ ok: true, message: "PRO-actie uitgevoerd" });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(`ERR: ${e.message || e}`);
  }
});

