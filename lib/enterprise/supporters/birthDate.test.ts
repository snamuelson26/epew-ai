import { test } from 'node:test';
import assert from 'node:assert/strict';
import { birthDateFromParts, splitBirthDate } from './birthDate';
const today = new Date(2026, 9, 31);
test('separate day/month/year keeps ISO storage and round-trips existing profiles', () => {
  assert.equal(birthDateFromParts({ day: '9', month: '2', year: '1985' }, today), '1985-02-09');
  assert.deepEqual(splitBirthDate('1985-02-09'), { day: '9', month: '2', year: '1985' });
  assert.equal(birthDateFromParts(splitBirthDate('2000-02-29'), today), '2000-02-29');
});
test('reject incomplete, impossible and future birthdays without rolling into another month', () => {
  for (const parts of [{day:'29',month:'2',year:'1900'},{day:'31',month:'4',year:'2000'},{day:'1',month:'13',year:'2000'},{day:'1',month:'1',year:'0000'},{day:'1',month:'1',year:'2027'},{day:'',month:'2',year:'1985'},{day:'2',month:'2',year:'85'}]) assert.equal(birthDateFromParts(parts, today), '');
  assert.equal(birthDateFromParts({day:'29',month:'2',year:'2000'},today),'2000-02-29');
  assert.equal(birthDateFromParts({day:'31',month:'10',year:'2026'},today),'2026-10-31');
  assert.equal(birthDateFromParts({day:'1',month:'11',year:'2026'},today),'');
});
