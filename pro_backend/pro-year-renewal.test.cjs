const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the real payment handler with local substitutes for external services.
const source = fs.readFileSync(`${__dirname}/src/index.ts`, 'utf8');
const sections = [
  source.slice(source.indexOf('function pickLatest('), source.indexOf('function pickLatestValid(')),
  source.slice(source.indexOf('function calcExpiry('), source.indexOf('function calcExpiryMonthly(')),
  source.slice(source.indexOf('async function completeOrderByPayment('), source.indexOf('async function completeMonthlyPayment(')),
].join('\n');
const now = Date.parse('2026-11-13T12:00:00Z');
class FixedDate extends Date {
  constructor(value) { super(value === undefined ? now : value); }
  static now() { return now; }
}
const stamp = iso => ({ toMillis: () => Date.parse(iso) });

for (const scenario of [
  { name: 'new buyer', licenses: [], expected: '2027-11-13T12:00:00.000Z', code: 'NEW' },
  { name: 'expired buyer', licenses: [{ code: 'OLD', expiresAt: stamp('2026-10-01') }], expected: '2027-11-13T12:00:00.000Z', code: 'OLD' },
  { name: 'early renewal preserves remaining months', licenses: [{ code: 'ACTIVE', expiresAt: stamp('2027-02-15T12:00:00Z'), createdAt: 'original' }], expected: '2028-02-15T12:00:00.000Z', code: 'ACTIVE' },
  { name: 'uses latest expiry across multiple licenses', licenses: [{ code: 'OLD', expiresAt: stamp('2026-12-01') }, { code: 'LATEST', expiresAt: stamp('2027-03-01T12:00:00Z') }], expected: '2028-03-01T12:00:00.000Z', code: 'LATEST' },
]) {
  test(scenario.name, async () => {
    let saved;
    const stop = new Error('stop before invoice services');
    const context = vm.createContext({
      Date: FixedDate,
      Timestamp: { fromDate: d => d },
      findOrderByPaymentId: async () => ({ ref: { id: 'order' }, data: { email: 'buyer@example.test' } }),
      ensureUser: async () => 'buyer',
      fetchLicensesBy: async (field, value) => { assert.equal(field, 'uid'); assert.equal(value, 'buyer'); return scenario.licenses; },
      makeLicenseCode: () => 'NEW',
      ENTITLEMENT_ID: 'zisa-pro-1y', DEVICE_LIMIT: 2,
      FieldValue: { serverTimestamp: () => 'now' },
      writeLicenseAll: async (code, data) => { saved = { code, data }; },
      writeOrderAll: async () => {},
      seriesFromMollieMode: () => { throw stop; },
    });
    vm.runInContext(ts.transpileModule(sections, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, context);
    await assert.rejects(context.completeOrderByPayment({ id: 'payment' }), error => error === stop);
    assert.equal(saved.code, scenario.code);
    assert.equal(saved.data.expiresAt.toISOString(), scenario.expected);
    assert.equal(saved.data.status, 'active');
    assert.equal(saved.data.productId, 'zisa-pro-jaarlijks');
    if (scenario.licenses[0]?.createdAt) assert.equal(saved.data.createdAt, 'original');
  });
}
