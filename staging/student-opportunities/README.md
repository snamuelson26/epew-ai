# Emanon IES — simplified application staging prototype

This executable demonstration uses synthetic students, role sessions and payments.
It is not a hosted staging deployment or a production backend. Do not import real
student data or expose its loopback server publicly.

## Run

Requires Python 3.12 and dependencies in `requirements.txt`.

```sh
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m unittest -v test_service.py test_http.py test_admissions.py test_integration_adapters.py test_intake.py
.venv/bin/python admissions_demo.py
.venv/bin/python demo.py
```

Open `http://127.0.0.1:8765` on the same computer. The demonstration offers an
approved synthetic profile, its permanent sponsorship code, a QR image and a
one-page PDF linking to that exact profile. The workflow tests exercise private
assistance drafts, approval, consent withdrawal, payment accounting and internship
verification through the service API. There is no interactive application UI yet.

## Implementation

- Existing-identity mapping is unique by organization/source/source ID; fixtures
  do not expose a public account-creation endpoint.
- Private records require an authenticated fixture session and authorized role.
  Public projection requires publication, consent and an approved revision.
- Sponsorship code records cannot be updated/deleted; sequence numbers are not
  reused. Consent withdrawal and suspension remove public projection immediately.
- Donation totals include confirmed contributions only. Synthetic signed events
  enforce account/currency/amount matching, replay checks and allowed transitions.
  Refunded/disputed contributions are excluded. Finance alone allocates confirmed
  funds to the approved assistance cap.
- Hosts require approval before placement. Timesheets reject overlapping student
  intervals. Host and assigned academic supervisors approve separately; only their
  verified hours count toward 240-hour completion, with report and evaluation.
- Changes produce append-only audit entries. Notifications enter an internal
  outbox; no messages are sent.

## Verified dependencies on October 11, 2026

| Dependency | Finding | Remaining work |
| --- | --- | --- |
| Student identity | Existing Emanon WordPress/Tutor installation contains 25 distinct accounts with a Tutor student marker | Verify current enrollment and the institutional school ID source; build authenticated mapping without duplicate accounts |
| Hosted staging | Existing Supabase project exposes only the default main branch | Select an authorized organization and approve any branch cost, or provide an isolated existing staging environment |
| Payment ownership | Connected live Stripe account belongs to Ekero Partners Empower Wealth | Connect and verify Emanon's authorized payment account and test mode; never substitute EPEW's account |

## Explicit limitations and deployment gates

The current staged policy reflects Samuel's October 12 correction: application
fee $100 after email verification. This supersedes the October 11 free-application
and after-acceptance payment timing. No live payment settings have changed.

The simplified flow is APPLY NOW (first/last name and email), account details
(country/date of birth/program), secure institutional password setup, email code
verification, then the applicant portal with the $100 application-fee overview.
Adult applicants rank three distinct careers: Business Administration, Computer
Science, Education, General Studies, Health Science, Law, Language or Skilled
Trades. Regular applicants choose grade 9, 10, 11 or 12. Guardian-consent review
is required before enrolling a minor.

`intake.py` implements details and verification for existing fixture identities.
Codes are cryptographically generated, HMAC-protected, valid for ten minutes,
limited to five verification attempts, with a sixty-second resend cooldown and
an hourly limit. No plaintext code is persisted or logged. No mail provider means
no verification; delivery failure consumes the challenge. The key is process-local;
production needs a stable protected secret and transactional cross-worker limits.

`simple-application-form.json` replaces the old free template. Required privacy
acknowledgment and optional update consent are separate. Institution-owned password
setup remains an adapter gate: no password is accepted or stored by this model.
`simple-application-preview.html` is a clickable screen preview, not connected to
accounts, email or payments. Use invented details and a sample password only.

Email verification permits applicant-portal access, not course enrollment. The
$100 initial obligation is the same charge, not an additional $100 Semester 1 fee.
Payment may occur before academic approval, but actual course enrollment still
requires approved academic review, a covered fee and applicable guardian review.
Assistance, sponsorship and waivers remain available. Prior Semester 2/assessment
rules are not represented as removed by hiding them from the simplified screen.

Bank/card/PayPal controls, processing surcharges and real payment URLs remain
inactive pending ownership/provider/fee verification. No bank numbers are invented,
and the proposed $5 charge is not represented as a verified Stripe processing fee.

The SQLite service is a domain prototype, not Postgres migrations/RLS or real SSO.
Its synthetic HMAC event handler is **not Stripe webhook verification**. It lacks
real provider reconciliation, receipts, partial refunds, general-fund allocation,
secure uploads/sharing links, photo publication, consent document registry, full
role granularity, production notification adapters, correction/resubmission flows
and a complete UI. PDF layout is verified for the short synthetic fixture only;
production text wrapping and localization still need implementation.

## Hosted integration phase

`wordpress_identity.py` resolves identity from an exact configured HTTPS staging
origin's authenticated current-user endpoint. It rejects production origins,
redirects and unauthenticated results, creates no WordPress accounts and grants
no staff roles. Tests use synthetic transports; real staging login remains untested.

`document_scanner.py` provides a ClamAV daemon-client adapter. Admissions uploads
must pass scanning before a readable document record is created. Missing scanner,
infection, timeout or error rejects release and deletes the temporary file.
Subprocess behavior is tested with mocks; a real daemon, current definitions and
clean-file/EICAR tests are still required. Synthetic demos explicitly select a
fixture scanner, which must never be configured for real intake. Production PDF
parsing, resource limits and retention policies remain integration gates.

See `HOSTED_STAGING_RUNBOOK.md`. No hosted installation has been performed.

Before hosted staging: resolve canonical identity and ownership; provision isolated
storage; implement adapters and server-side authorization; add database access,
concurrency, file privacy and integration tests. Verify existing website registration
and login and a real provider test transaction. No live payment collection or real
student publication may be enabled before institutional production authorization.

Rollback: this branch changes no existing application routes or production data.
Remove the standalone staging directory to undo it. A future migration/deployment
must have verified backup/restore, versioned migrations and disabled release flags.
