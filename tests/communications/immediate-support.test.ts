import assert from 'node:assert/strict';
import test from 'node:test';
import { processDueMessages } from '../../lib/communications/processSupporterOutreach';
import { POST } from '../../app/api/entrepreneurs/supporters/send/route';
import { NextRequest } from 'next/server';

type Row = Record<string, any>;
function fixture() {
  const messages: Row[] = ['request-1','request-2'].map((id, i) => ({ id, contact_id: `contact-${i}`, entrepreneur_user_id: 'owner', business_code: 'FFR-001', message_type: 'introduction', subject: 'Support request', body: 'Hello <friend>', delivery_status: 'queued', scheduled_for: '2026-01-01T00:00:00Z' }));
  const contacts: Row[] = messages.map(m => ({ id: m.contact_id, entrepreneur_user_id: 'owner', business_code: 'FFR-001', prospect_name: 'Test recipient', email: 'test@example.invalid', preferred_language: 'ht', opted_out_at: null, weekly_follow_up_enabled: false }));
  class Query {
    predicates: ((r: Row) => boolean)[] = []; values?: Row;
    constructor(public rows: Row[]) {}
    select() { return this; }
    eq(k: string, v: unknown) { this.predicates.push(r => r[k] === v); return this; }
    lte(k: string, v: unknown) { this.predicates.push(r => r[k] <= (v as string)); return this; }
    order() { return this; }
    limit() { return this; }
    update(v: Row) { this.values = v; return this; }
    run(single = false) {
      const rows = this.rows.filter(r => this.predicates.every(p => p(r)));
      if (this.values) rows.forEach(r => Object.assign(r, this.values));
      return { data: single ? rows[0] ? {...rows[0]} : null : rows.map(r => ({...r})), error: null };
    }
    maybeSingle() { return Promise.resolve(this.run(true)); }
    then(resolve: (value: unknown) => unknown) { return Promise.resolve(this.run()).then(resolve); }
  }
  const client = { from: (table: string) => new Query(table.endsWith('messages') ? messages : contacts) } as unknown as Parameters<typeof processDueMessages>[1];
  const sends: Row[] = [];
  const sendEmail = async (input: Row) => { sends.push(input); return { ok: true, duplicate: false, deliveryId: 'delivery', status: 'sent', providerMessageId: 'provider-id' }; };
  return { messages, contacts, client, sends, sendEmail };
}

test('submitted request sends immediately, preserves language and records provider status', async () => {
  const f = fixture();
  const result = await processDueMessages({messageId: 'request-1', entrepreneurUserId: 'owner'}, f.client, f.sendEmail);
  assert.equal(result.sent, 1);
  assert.equal(f.messages[0].delivery_status, 'sent');
  assert.equal(f.messages[0].provider_email_id, 'provider-id');
  assert.equal(f.sends[0].metadata.preferredLanguage, 'ht');
  assert.match(f.sends[0].html, /&lt;friend&gt;/);
  assert.equal(f.messages[1].delivery_status, 'queued');
});

test('concurrent immediate and recovery workers send the same request only once', async () => {
  const f = fixture();
  await Promise.all([1,2].map(() => processDueMessages({messageId: 'request-1'}, f.client, f.sendEmail)));
  assert.equal(f.sends.length, 1);
  await processDueMessages({messageId: 'request-1'}, f.client, f.sendEmail);
  assert.equal(f.sends.length, 1);
});

test('wrong owner and opted-out recipients are not sent requests', async () => {
  const f = fixture();
  await processDueMessages({messageId: 'request-1', entrepreneurUserId: 'other'}, f.client, f.sendEmail);
  f.contacts[0].opted_out_at = new Date().toISOString();
  await processDueMessages({messageId: 'request-1', entrepreneurUserId: 'owner'}, f.client, f.sendEmail);
  assert.equal(f.sends.length, 0);
});

test('provider failure leaves a retryable queue, retry uses the same idempotency key', async () => {
  const f = fixture();
  const original = console.error; console.error = () => {};
  try {
    await processDueMessages({messageId: 'request-1'}, f.client, async input => { f.sends.push(input); throw new Error('provider unavailable'); });
  } finally { console.error = original; }
  assert.equal(f.messages[0].delivery_status, 'queued');
  await processDueMessages({messageId: 'request-1'}, f.client, f.sendEmail);
  assert.equal(f.messages[0].delivery_status, 'sent');
  assert.equal(f.sends[0].idempotencyKey, f.sends[1].idempotencyKey);
});

test('future scheduled follow-ups remain scheduled', async () => {
  const f = fixture(); f.messages[0].scheduled_for = '2099-01-01T00:00:00Z';
  await processDueMessages({messageId:'request-1'}, f.client, f.sendEmail);
  assert.equal(f.sends.length, 0);
});

test('dispatch endpoint refuses unauthenticated calls', async () => {
  const response = await POST(new NextRequest('http://localhost/api/entrepreneurs/supporters/send', {method:'POST'}));
  assert.equal(response.status, 401);
});
