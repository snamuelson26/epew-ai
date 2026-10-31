import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foodFansCheckout, repeatContribution } from './contributionNavigation';
test('old Food Fans plan links use the authorized campaign checkout, keeping the two IDs distinct', () => {
  assert.equal(foodFansCheckout('FFR-001'), '/support/FFR-001/checkout');
  assert.equal(foodFansCheckout('FFR-002'), '/support/FFR-002/checkout');
  assert.equal(foodFansCheckout('OTHER-001'), null);
});
test('additional Food Fans funds explicitly use flexible FFR-002; unsafe or absent identities never create checkout links', () => {
  assert.deepEqual(repeatContribution('FFR-001'), {href:'/support/FFR-002/checkout?frequency=one-time',foodFans:true});
  assert.deepEqual(repeatContribution('FFR-002'), {href:'/support/FFR-002/checkout?frequency=one-time',foodFans:true});
  assert.deepEqual(repeatContribution('ABC-123'), {href:'/support/ABC-123/checkout',foodFans:false});
  for (const id of [null,undefined,'','//evil.invalid','../../admin','x?amount=0']) assert.equal(repeatContribution(id),null);
});
