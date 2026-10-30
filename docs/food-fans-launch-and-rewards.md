# Food Fans launch workspace and Rewards

Prepared October 30, 2026, 01:00 AM America/New_York.

Restaurant unit FFR-001 is the Cambria Heights store. FFR-001 and FFR-002 remain separate support-campaign records linked to that one restaurant. Campaign IDs, qualification and financial records are preserved.

## Launch administration

`/admin/restaurant-operations` provides 15 seeded workstreams: Website, Menu, Recipes, POS, Equipment, Packaging, Staffing, Membership, Ordering, Delivery, QR Codes, Compliance, Marketing, Soft Opening, and Grand Opening.

Each records status, assigned person/role, start/due/completion dates, notes, approval status, blocker, next action, evidence references and private files. Completion time is recorded when a workstream is marked completed; reopening clears the current completion field while preserving the old value in audit history. Dates and approvals are not invented during seeding. Status and evidence changes record the verified administrator and reason. Corrections reference the original entry.

PDF, image, text, CSV, DOCX and XLSX attachments up to 20 MB are stored in a private bucket. Download requests recheck administrator authorization and create a five-minute download link. Files are not publicly listed. The system does not claim malware scanning.

## Free Food Fans Rewards Membership

**Eat • Earn • Participate • Enjoy**

The member record includes member ID, full name, mobile, email, required ZIP code, preferred language, home restaurant, membership date/status, separate SMS/email consents and their evidence, raffle opt-in and verified raffle-eligibility year/evidence. Free enrollment never grants paid ORGDH raffle eligibility. Internal ZIP aggregates support location planning.

Only paid, completed meal lines priced strictly above $15 qualify. Multiple qualifying meals generate multiple credits; reward meals and add-ons do not. Active-member meal credits do not expire. This replaces the earlier 30-day inactivity rule for meal credits. The separate ORGDH additional raffle-ticket inactivity rule is unchanged.

Every 25 credits produces an individual free-meal entitlement and consumes 25 credits. Earned entitlements retain the earlier 72-hour validity rule. Completed redemption records require evidence of an online request, a minimum two-hour lead time, and pickup/delivery within entitlement validity. Premium extras are not marked free by this system. Free-coffee frequency and conditions await finalization.

The immutable ledger records meal_credit, reward_earned, reward_redeemed, adjustment and refund_reversal with member/unit/order, quantity, credit and free-meal deltas, before/after balances, reason, manager, request ID and timestamp. A monotonic ledger sequence makes ordering unambiguous. Balances are derived from ledger movements and individual entitlements, not a single mutable counter.

Duplicate requests and receipts cannot create duplicate credits. Refunds reverse only previously credited meal quantities. If a refund invalidates an unused earned reward, it is revoked with a compensating ledger entry. If the reward was already redeemed, the credit deficit carries forward and future credits repay it; no monetary charge is created. Managers can correct balances with reason and audit history; original transactions remain intact.

## Access and integration boundaries

The existing administrator role acts as authorized manager. No new account access is granted. Public and ordinary authenticated clients have no direct member, ledger, work-file or operation access. Server endpoints verify session identity, verified email, administrator role and request origin. Mutation functions are restricted to the backend role, recheck authorization, serialize changes and preserve idempotency.

The current receipt workflow is a manager-verified manual entry. A member-ID keyboard scan identifies a member but does not prove payment. Automatic POS order/refund capture requires the selected provider and a verified connector. This release records completed online-requested redemptions; it does not implement customer meal selection, ordering, checkout, kitchen dispatch or delivery. No promotional reminder campaign is activated.

The separate optional $25 ORGDH membership, payment routing and annual raffle-ticket issuance are not activated here. The confirmed November 21, 2027, 5 PM New York drawing, TBA venue and orgdhgivesback.org are recorded as program context.

## Validation

Run `node --import tsx --test tests/restaurant-operations-db.test.cjs tests/restaurant-operations-route.test.cjs tests/ffr-rewards-db.test.cjs tests/ffr-rewards-route.test.cjs`.

Tests cover launch fields, authorization and origin checks, required ZIP and explicit consent, forged identities, duplicate requests/receipts, qualifying meal thresholds, multiple meals, canceled/unpaid/reward/add-on exclusions, earning, unused-reward revocation, post-redemption refunds, credit-deficit repayment, redemption lead time, immutable history, private evidence metadata, and public-access denial. All synthetic members, receipts and rewards exist only in an in-memory test database.

Real authenticated browser save/upload/download and real POS/ordering acceptance tests remain separate verification steps.
