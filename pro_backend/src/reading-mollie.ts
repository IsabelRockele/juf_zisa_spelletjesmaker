/** Test-only HTTP adapter. No key fallback to the existing live Pro payment configuration. */
import { createHash } from 'crypto';
export function readingMollie(config: { mode: string; apiKey: string }, transport: typeof fetch = fetch) {
  if (config.mode !== 'test' || !/^test_[A-Za-z0-9]+$/.test(config.apiKey || '')) throw new Error('Reading payments are disabled');
  const id = (value: string, prefix: string) => {
    if (!new RegExp(`^${prefix}_[A-Za-z0-9]+$`).test(value)) throw new Error('Invalid Mollie ID');
    return value;
  };
  async function request(method: string, path: string, body?: unknown, operationId?: string): Promise<any> {
    if (method === 'POST' && !operationId) throw new Error('Durable operation ID required');
    const response = await transport(`https://api.mollie.com/v2${path}`, {
      method, headers: {
        Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json',
        ...(operationId ? { 'Idempotency-Key': createHash('sha256').update(`reading-test:${operationId}`).digest('hex') } : {}),
      }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Mollie request failed (${response.status}); retry the same operation`);
    if (response.status === 204) return null;
    return response.json();
  }
  return {
    getProfile: () => request('GET','/profiles/me'),
    createCustomer: (email: string, operationId: string) => request('POST', '/customers', { email }, operationId),
    createPayment: (payload: unknown, operationId: string) => request('POST', '/payments', payload, operationId),
    getPayment: async (paymentId: string) => {
      const result = await request('GET', `/payments/${id(paymentId, 'tr')}`);
      if (result?.id !== paymentId || result?.mode !== 'test') throw new Error('Unexpected payment mode or ID');
      return result;
    },
    getMandate: (customer: string, mandate: string) => request('GET', `/customers/${id(customer, 'cst')}/mandates/${id(mandate, 'mdt')}`),
    listSubscriptionPayments: (customer:string, subscription:string) => request('GET', `/customers/${id(customer,'cst')}/subscriptions/${id(subscription,'sub')}/payments?limit=250`),
    createSubscription: (customer: string, payload: unknown, operationId: string) => request('POST', `/customers/${id(customer, 'cst')}/subscriptions`, payload, operationId),
    cancelSubscription: async (customer: string, subscription: string) => {
      const path = `/customers/${id(customer, 'cst')}/subscriptions/${id(subscription, 'sub')}`;
      const current = await request('GET', path);
      if (current.id !== subscription) throw new Error('Unexpected subscription');
      if (current.status !== 'canceled') await request('DELETE', path);
      const confirmed = await request('GET', path);
      if (confirmed.id !== subscription || confirmed.status !== 'canceled') throw new Error('Cancellation not confirmed');
      return confirmed;
    },
  };
}
