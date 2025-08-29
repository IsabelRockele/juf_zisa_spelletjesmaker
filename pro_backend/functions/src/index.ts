import { onRequest, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

// Admin SDK v12 – modulaire imports
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

import fetch from "node-fetch";
import { z } from "zod";
import { randomUUID } from "node:crypto";

// ---------- Init ----------
initializeApp();
const db = getFirestore();

const REGION = "europe-west1";
const MOLLIE_API_KEY = defineSecret("MOLLIE_API_KEY");

// Wijzig dit naar een eigen lange, geheime waarde
const DEV_TOKEN = "c5a4f5e5-1a8b-4f4e-9ad4-3b1b8b2c5d2e";

const DEFAULT_MAX_DEVICES = 2;
const now = () => Timestamp.now();

// Link naar uw app (GitHub Pages)
const APP_URL = "https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/";

// Abonnement: 1 jaar geldig
const SUBSCRIPTION_YEARS = 1;
function oneYearFrom(base?: Timestamp | null) {
  // verlengen vanaf de langste resterende looptijd
  const start = base && base.toMillis() > Date.now() ? new Date(base.toMillis()) : new Date();
  start.setFullYear(start.getFullYear() + SUBSCRIPTION_YEARS);
  return Timestamp.fromDate(start);
}

// ---------- Helpers ----------
async function generateAndStoreLicense(params: { email: string; productId: string; orderId: string }) {
  const { email, productId, orderId } = params;

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
    expiresAt: oneYearFrom(null), // licentie-record: 1 jaar vanaf nu
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

async function updateOrderAfterPaid(
  orderId: string,
  paymentId: string,
  email: string,
  productId: string,
  entitlementExpiresAt?: Timestamp | null
) {
  const orderRef = db.collection("orders").doc(orderId);
  const { licenseId, code } = await generateAndStoreLicense({ email, productId, orderId });

  await orderRef.set(
    {
      status: "paid",
      paymentId,
      licenseId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const exp = entitlementExpiresAt ?? oneYearFrom(null);
  const expDate = exp.toDate().toISOString().slice(0, 10); // YYYY-MM-DD

  const subject = "Jouw licentie voor Zisa Spelletjesmaker PRO";
  const text = `Dag,

Bedankt voor je aankoop! Hier is je licentiecode:

${code}

Product: ${productId}
Order: ${orderId}
Geldig tot: ${expDate}

➡ Open de app: ${APP_URL}

Gebruik deze code om je PRO-functies te activeren. Bewaar deze mail goed.

Vriendelijke groet,
Zebraklas`;

  const html = `<p>Dag,</p>
<p>Bedankt voor je aankoop! Hier is je licentiecode:</p>
<p style="font-size:18px;font-weight:bold;letter-spacing:1px">${code}</p>
<p>Product: <b>${productId}</b><br/>Order: <b>${orderId}</b><br/>Geldig tot: <b>${expDate}</b></p>
<p>
  <a href="${APP_URL}" style="display:inline-block;background:#0d6efd;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600">
    Open Zisa Spelletjesmaker PRO
  </a>
</p>
<p>Gebruik deze code om je PRO-functies te activeren. Bewaar deze mail goed.</p>
<p>Vriendelijke groet,<br/>Zebraklas</p>`;

  await enqueueMail({ to: email, subject, text, html });
  return { licenseId, code };
}

async function getMolliePayment(paymentId: string, apiKey: string) {
  const res = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Mollie GET failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<any>;
}

// Entitlement helpers (zetten/verlengen)
async function upsertEntitlementForUserId(userId: string, orderId: string) {
  const ref = db.collection("entitlements").doc(userId);
  const snap = await ref.get();
  const currentExp = snap.exists ? (snap.get("expiresAt") as Timestamp | null) : null;
  const newExp = oneYearFrom(currentExp ?? null);

  await ref.set(
    {
      pro: true,
      maxDevices: DEFAULT_MAX_DEVICES,
      lastOrderId: orderId,
      expiresAt: newExp,
      setAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return newExp;
}

async function upsertEntitlementForEmail(emailLower: string, orderId: string) {
  const ref = db.collection("entitlements_by_email").doc(emailLower);
  const snap = await ref.get();
  const currentExp = snap.exists ? (snap.get("expiresAt") as Timestamp | null) : null;
  const newExp = oneYearFrom(currentExp ?? null);

  await ref.set(
    {
      pro: true,
      maxDevices: DEFAULT_MAX_DEVICES,
      lastOrderId: orderId,
      expiresAt: newExp,
      setAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return newExp;
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

    const emailKey = email.trim().toLowerCase();
    // entitlement eerst zetten/verlengen → einddatum meenemen in mail
    const newExp = await upsertEntitlementForEmail(emailKey, orderId);

    const fakePaymentId = paymentId || `test_${randomUUID()}`;
    const result = await updateOrderAfterPaid(orderId, fakePaymentId, email, productId, newExp);

    res.status(200).json({ ok: true, ...result, expiresAt: newExp.toMillis() });
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
        let newExp: Timestamp;
        if (userId) {
          newExp = await upsertEntitlementForUserId(userId, orderId);
        } else {
          const emailKey = String(email).trim().toLowerCase();
          newExp = await upsertEntitlementForEmail(emailKey, orderId);
        }

        await updateOrderAfterPaid(orderId, payment.id, email, productId, newExp);
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

  // 1) entitlement op userId?
  const ent = await db.collection("entitlements").doc(ctx.uid).get();

  let pro = ent.exists && ent.get("pro") === true;
  let maxDevices = ent.exists ? (ent.get("maxDevices") ?? DEFAULT_MAX_DEVICES) : DEFAULT_MAX_DEVICES;
  let exp: Timestamp | null = ent.exists ? (ent.get("expiresAt") as Timestamp | null) : null;

  // 2) of tijdelijk entitlement op e-mail (als u e-mail login gebruikt)
  if (!pro && req.auth?.token?.email) {
    const emailKey = String(req.auth.token.email).trim().toLowerCase();
    const byMail = await db.collection("entitlements_by_email").doc(emailKey).get();
    const mailPro = byMail.exists && byMail.get("pro") === true;
    const mailMax = byMail.exists ? (byMail.get("maxDevices") ?? DEFAULT_MAX_DEVICES) : DEFAULT_MAX_DEVICES;
    const mailExp = byMail.exists ? (byMail.get("expiresAt") as Timestamp | null) : null;

    if (mailPro) {
      pro = true;
      maxDevices = mailMax;
      exp = mailExp;
      // Claim naar entitlements/{uid}
      await db.collection("entitlements").doc(ctx.uid).set(
        { pro: true, maxDevices, claimedFromEmail: emailKey, expiresAt: mailExp ?? oneYearFrom(null), setAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  }

  const isExpired = !exp || exp.toMillis() <= Date.now();
  if (!pro || isExpired) {
    return { ok: false, reason: isExpired ? "EXPIRED_SUBSCRIPTION" : "NO_PRO", expiresAt: exp ? exp.toMillis() : null };
  }

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
    if (activeQuery.size >= maxDevices) {
      return { ok: false, reason: "DEVICE_LIMIT", maxDevices };
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

  return { ok: true, maxDevices, expiresAt: exp!.toMillis() };
});

export const issueSessionCode = onCall({ region: REGION }, async (req) => {
  const ctx = req.auth;
  if (!ctx?.uid) throw new Error("UNAUTHENTICATED");
  const { deviceId } = (req.data || {}) as { deviceId?: string };
  if (!deviceId) throw new Error("INVALID_ARGUMENT: deviceId");

  // entitlement check + vervaldatum
  const ent = await db.collection("entitlements").doc(ctx.uid).get();
  const exp = ent.exists ? (ent.get("expiresAt") as Timestamp | null) : null;
  if (!ent.exists || ent.get("pro") !== true || !exp || exp.toMillis() <= Date.now()) {
    return { ok: false, reason: (!exp || exp.toMillis() <= Date.now()) ? "EXPIRED_SUBSCRIPTION" : "NO_PRO" };
  }

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

// Voorbeeld: PRO-actie beveiligen met code-validatie (server-side)
async function validateSessionCode(userId: string, deviceId: string, code: string) {
  const q = await db
    .collection("sessionCodes")
    .where("userId", "==", userId)
    .where("deviceId", "==", deviceId)
    .where("code", "==", code)
    .where("used", "==", false)
    .limit(1)
    .get();

  if (q.empty) return { ok: false, reason: "INVALID_OR_USED" };

  const doc = q.docs[0];
  const data = doc.data();
  const expired = (data.expiresAt as Timestamp).toMillis() < Date.now();
  if (expired) {
    await doc.ref.update({ used: true });
    return { ok: false, reason: "EXPIRED" };
  }

  await doc.ref.update({ used: true }); // eenmalig
  return { ok: true };
}

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

    const check = await validateSessionCode(String(userId), String(deviceId), String(code));
    if (!check.ok) {
      res.status(401).json(check);
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(`ERR: ${e.message || e}`);
  }
});

// Voorbeeld-PRO-endpoint (laat zien hoe u server-side verifieert en dan pas iets doet)
export const proDoSomething = onRequest({ region: REGION, cors: true }, async (req, res) => {
  try {
    if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }
    const { userId, deviceId, code, payload } = req.body || {};
    if (!userId || !deviceId || !code) { res.status(400).send("Missing userId/deviceId/code"); return; }

    const check = await validateSessionCode(String(userId), String(deviceId), String(code));
    if (!check.ok) { res.status(401).json(check); return; }

    await db.collection("pro_actions").add({ userId, deviceId, at: now(), payload: payload ?? null });
    res.status(200).json({ ok: true, message: "PRO-actie uitgevoerd" });
  } catch (e: any) {
    console.error(e);
    res.status(500).send(`ERR: ${e.message || e}`);
  }
});
