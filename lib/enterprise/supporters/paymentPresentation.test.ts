import test from "node:test";
import assert from "node:assert/strict";
import { checkoutState, benefitSchedule } from "./paymentPresentation";
test("completed checkout is not proof of payment, including delayed bank settlement",()=>{
 assert.equal(checkoutState({payment_status:"unpaid",status:"complete"}),"processing");
 assert.equal(checkoutState({payment_status:"unpaid",status:"open"}),"unfinished");
 assert.equal(checkoutState({payment_status:"unpaid",status:"expired"}),"expired");
 assert.equal(checkoutState({payment_status:"paid",status:"complete"}),"paid");
 assert.equal(checkoutState({payment_status:"no_payment_required",status:"complete"}),"processing");
});
test("8% monthly projections round to the exact annual total and update elapsed periods",()=>{
 const s=benefitSchedule(5200,8,"2026-10-01T23:00:00Z",12,new Date("2026-12-02T00:00:00Z"))!;
 assert.equal(s.projectedTotal,416);assert.equal(s.projectedCombined,5616);
 assert.equal(Math.round(s.rows.reduce((n,r)=>n+r.projectedAmount,0)*100),41600);
 assert.equal(s.rows.filter(r=>r.elapsed).length,2);
 assert.equal(s.rows[11].projectedCumulative,416);
 assert.equal(s.estimatedMaturityDate,"2027-10-01T23:00:00.000Z");
});
test("6% uses only the actual contribution amount; calendar month ends clamp safely",()=>{
 const s=benefitSchedule(100,6,"2024-01-31T00:00:00Z")!;
 assert.equal(s.projectedTotal,6);assert.equal(s.rows[0].date,"2024-02-29T00:00:00.000Z");
 assert.equal(s.rows[1].date,"2024-03-31T00:00:00.000Z");
 assert.equal(benefitSchedule(5200,9,"2026-01-01"),null);
 assert.equal(benefitSchedule(5200,8,"invalid"),null);
});
