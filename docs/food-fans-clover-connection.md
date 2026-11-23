# Food Fans membership / Clover connection

Prepared November 22, 2026, America/New_York.

## Implemented in this branch

`/admin/food-fans-rewards` includes a manager-only Clover receipt verifier for the
selected FFR-001 member. The backend verifies the receipt directly against Clover
and imports it through the existing audited rewards operation. The preview never
writes credits. Import re-fetches the receipt and requires the manager's completed
meal fulfillment confirmation and evidence. A paid order does not prove delivery.

The Clover customer email **and** phone must match the member. This does not create
or merge accounts. Ambiguous matches, missing collection expansions, unmapped items,
fractional quantities, open/unpaid orders, refunds, voids, offline payments and
discounted receipts are held for manual review. No payment or refund is executed.

Only explicitly mapped meal items priced strictly above $15 earn credits; addons
and reward items do not. The existing 25-meal reward cycle, entitlement validity,
redemption lead time, immutable history and refund correction rules remain in the
existing ledger. The connector creates neither promotional subscriptions nor raffle
tickets. The existing manager redemption/refund workflow remains available.

Canonical Clover receipt IDs and deterministic requests prevent repeated imports.
The route also rejects earlier manual entries that use the bare Clover order ID.
Managers must not record an already imported receipt again using an unrelated ID.

## Secure server configuration (not browser/public settings)

- `FFR_CLOVER_ENVIRONMENT`: `sandbox` or `production`, explicitly selected.
- `FFR_CLOVER_MERCHANT_ID`: verified Clover API merchant ID. The live Cambria
  Heights dashboard showed `J8N6XZZ8RYR91`; do not substitute processor MID.
- `FFR_CLOVER_READ_TOKEN`: sensitive server environment variable. Never commit,
  paste in chat, log, expose through `NEXT_PUBLIC_`, or return to the client.
- `FFR_CLOVER_ITEM_KINDS`: JSON object mapping verified Clover inventory item IDs
  to `meal`, `addon` or `reward`. Do not guess classifications from item names.

The approved Clover token is named **Food Fans EPEW Rewards - Read Only**. The
dashboard confirmed Read Customers, Inventory, Merchant, Orders and Payments;
no employee access and no Write permissions. Creating the token does not configure
EPEW, install a webhook, deploy this branch or verify a live receipt.

## Verified configuration update

The user explicitly approved storing the Clover token and merchant configuration in
Vercel project `epew-ai`, production. The hosting metadata confirms
`FFR_CLOVER_READ_TOKEN` is sensitive; `FFR_CLOVER_MERCHANT_ID` and
`FFR_CLOVER_ENVIRONMENT` are present for production. The token was transferred
directly between the signed-in browser pages without displaying its value in chat.
No production redeployment or live receipt verification is claimed.

The live Clover inventory displayed only one cash-discount entry and no meal
products. No menu eligibility mapping was created. The current repository's location
implementation still describes final pricing as incomplete; a final approved
opening-menu price table has not been established for import. Do not import draft
prices or mark unverified items reward-eligible.

## Activation and remaining work

1. Production credentials are saved as verified above. Configure sandbox credentials
   separately; never copy production transactions into test fixtures.
2. Verify actual Clover inventory item IDs and classifications. Empty mapping
   keeps the interface disabled; an unmapped receipt is rejected server-side.
3. Deploy a preview and verify a synthetic sandbox customer, matching membership,
   paid order, completed fulfillment, repeated import and ledger balance.
4. Validate the actual Clover response shapes, including empty expanded
   collections and quantity semantics; incomplete responses intentionally fail closed.
5. Resolve the live App Market billing alert through Clover as separately required.
6. Only after acceptance testing, deploy and validate production configuration.

This branch does **not** implement unattended earning, scheduled reconciliation,
automatic partial-refund allocation, persistent Clover customer/account binding,
customer checkout meal selection, or a Clover free-meal discount. Automated
redemption needs a separate tested integration and suitable scoped write access;
the current read-only token cannot apply a discount. Do not advertise automatic
benefit redemption until that path has been implemented and verified. Free coffee
and other promotional benefits need their approved terms before automation.

## Validation

`node --import tsx --test tests/ffr-clover.test.cjs tests/ffr-clover-route.test.cjs tests/ffr-rewards-route.test.cjs tests/ffr-rewards-db.test.cjs`

14 tests passed with synthetic data only. TypeScript and lint are checked separately.
No live customer credits, charges, refunds or redemptions were created in testing.

Primary API references:
- https://docs.clover.com/dev/reference/ordergetorder
- https://docs.clover.com/dev/reference/paygetorderpayments
- https://docs.clover.com/dev/reference/ordergetorderlineitems
- https://docs.clover.com/dev/docs/webhooks

Platform webhooks use `X-Clover-Auth` and require app registration/subscriptions;
they are not enabled by a merchant token. No unauthenticated webhook endpoint has
been added by this change.
