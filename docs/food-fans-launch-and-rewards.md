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

## Network records, member view and expansion reporting — October 30, 2026

Sections 7–14 are implemented in `/admin/food-fans-network` and `/food-fans/member`.
The separate paid annual levels are MEMBER ($25, one restaurant), ELITE ($100,
one verified state) and AMBASSADOR ($500, USA and beyond). Free meal rewards remain
free. No payment collection or renewal is enabled. Managers record external payment
verification; no eligibility follows automatically from a payment reference alone.

ORGDH confirmations and independent drawing records never create meal credits.
Purchases never generate raffle tickets. Confirmed entries require opt-in,
eligibility, verified membership term, approved ORGDH rules and a reference ID.
Ticket counts come only from ORGDH. Each drawing expires its own current entries
at its drawing timestamp. Historical entries and all revisions are retained.
ELITE scope is checked against verified restaurant state; AMBASSADOR spans units.
The member dashboard totals current externally confirmed counts while retaining a
per-drawing breakdown. Expired membership labels revert to FREE REWARDS; existing
raffle entries still expire at their applicable drawing, not a new purchase date.
No cross-drawing reassignment, ticket issue, drawing execution or prize payout is implemented.
The previously announced FFR-001 November 21, 2027, 5 PM New York drawing is stored
as a draft with rules unapproved and venue TBA. It cannot accept confirmed entries
until ORGDH rules approval is recorded.

Member access is restricted to a manager-verified mapping of member ID to an
existing confirmed EPEW account. The member API derives the account ID from the
verified server session; caller member IDs or email addresses cannot select an
account. It returns only that member's profile, balances, recent qualifying
orders and raffle statuses. No members were created or linked for live testing.

Admin totals aggregate the complete register, using Monday/week and calendar-month
boundaries in New York. ZIP and language segmentation and the expansion report
paginate in pages of 100. Repeat order rate is repeat ordering members divided by
members with an order. Order counts use existing paid/completed verified receipt
records; refunded qualifying quantities reduce meal totals. The order integration
register separately captures channel, external POS/marketplace references, reward
use, timestamp, status and optional member; metadata does not manufacture credits
or inflate verified-order analytics. Automated POS/webhook ingestion and nonmember
order analytics remain pending a verified provider.

Nearest restaurants, currently served ZIPs and expansion flags require source
verification. No geocoder, radius or activity threshold is invented; unknowns remain
pending. No second physical restaurant is created: FFR-002 remains a campaign ID
for Cambria Heights. Future actual units need their own verified master record.

Opening-menu records and separate recipe standards include the requested fields;
no actual menu, ingredients, cooking temperatures, allergen clearance, prices or
approvals are invented. Recipe approval requires approver/date evidence. Pricing
and costing fields are excluded. Website records track PR, branch, commit, review,
staging, mobile/desktop/language QA, Samuel approval and production evidence.
All writes use an administrator-only, same-origin route, optimistic revision
checks, request idempotency, and an append-only before/after revision log. Network
records, histories and report views are unavailable through public/authenticated
Data API roles; service access is kept server-side.

## Translation, QR and sign records — October 30, 2026

The network register now supports one translation record per page, string key and
BCP-47-style language code. English, Haitian Creole, French and Spanish appear in
the readiness matrix; every additional language is retained in its dynamic
language map without a database redesign. Reviewed/approved states require
references. Editing a translation clears its prior review and approval. This
tracks readiness; it does not claim that the public Food Fans website has been
translated. The initial inventory covers 17 supplied sign strings, with the
English source and the other three language slots awaiting review/translation.

QR records keep restaurant unit and support campaign separate. Both original
signs decode to the supplied order candidate and FFR-002 support URL. Browser
verification established the support page identifies Food Fans, Cambria Heights.
The ordering page showed FOOD FANS / NEWYORK CITY, closed and no food; it did not
establish Cambria Heights fulfillment mapping for restaurant ID 1. The ordering
QR remains held. No payment or test order was submitted. Changing a QR destination
or version resets test/approval and holds printing.

The two supplied PNG originals are privately attached to FFR-001 Marketing,
with SHA-256 and original content-approval evidence retained in the sign records.
Both are 1106 × 2048 pixels with no DPI metadata; 47 × 87 inches is the requested
physical format, not a claim of print resolution. Printer proof remains needed.
Side A's original TOUT JOU is superseded by Samuel's ALL DAYS correction. The
corrected image draft is stored separately: its support code decodes but its
order code did not decode. It is explicitly held, not a production master.
No original is overwritten. Final print release requires approved artwork,
verified QR destinations and printer proof. Artwork version changes clear print
approval. Sign records link to administrator-only attachment downloads.

Free coffee 6 AM–9 AM and free house drink 10 AM–12 PM / 5 PM–8 PM are recorded
as supplied sign copy. They do not silently introduce new reward eligibility or
redemption rules. Broader language QA, printer proof, QR repair and ordering
fulfillment verification are still pending.
