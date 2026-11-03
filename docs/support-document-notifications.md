# Payment-triggered document notifications — integration pending

The dispatcher and five local synthetic tests are prepared. This branch does not enable live sending or change payment records.

Required integration before activation:

- Load the authoritative payment receipt and refund/dispute state. A checkout redirect or `paid` database label alone does not establish funds availability. Define whether receipt means provider success, available Stripe balance or bank settlement with Finance; preserve the user's requirement that money has arrived.
- Publish a verified, approved document manifest per supporter and transaction. Existing production document access is restricted to one issued transaction; do not announce a generic certificate for other supporters.
- Implement a service-only persistent delivery ledger with a unique transaction/channel/purpose key, atomic claim and recorded provider ID. Preserve accepted/unknown claims for reconciliation; never retry blindly.
- Record confirmed channel permission and opt-outs with source/time. Recheck before dispatch. The telephone field alone is not consent.
- Provide EPEW-scoped SMS and approved WhatsApp utility-template adapters. Do not use ORGDH senders. Record actual provider delivery webhooks separately from acceptance.
- Invoke/reconcile after both payment receipt and document publication; either can arrive first. Retry unavailable channels after configuration without duplicating accepted channels.
- Use the existing authenticated Communications portal URL. Do not include amounts, benefit percentages, credentials or expiring document URLs in notifications.
- Run hosted integration tests, including duplicate webhooks, concurrency, delayed/failed payments, consent withdrawal, refunds/disputes, missing PDFs and ambiguous provider timeouts. Configure the recovery schedule only after these tests.

Rollback: disable dispatch, preserve delivery and financial history, and retain existing portal documents. No production migration or schedule has been applied by this branch.
