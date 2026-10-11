# Emanon Student Opportunities — isolated local prototype

This executable demonstration uses synthetic students, role sessions and payments.
It is not a hosted staging deployment or a production backend. Do not import real
student data or expose its loopback server publicly.

## Run

Requires Python 3.12 and dependencies in `requirements.txt`.

```sh
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m unittest -v test_service.py test_http.py test_admissions.py
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

The approved October 11 fee workflow is implemented in `admissions.py`, exercised
by `test_admissions.py` and demonstrated end to end by `admissions_demo.py`.
It preserves both $100 semester fees, free applications and tuition, $25 exam
fees per course per semester and $100 graduation when applicable. Free submission
creates no charge or new identity. Conditional acceptance requires documented
eligibility checks and identity/academic documents. Finance approves assistance,
sponsorship or waivers; payment requests reflect only the remaining amount.
Opaque requests are applicant-bound, expire and store only token hashes. Confirmed
synthetic events produce demonstration receipts; pending payment cannot activate
enrollment. Refunds/disputes place the enrollment decision on financial hold.
Semester 2 requires a separate obligation and never charges automatically.

`free-application-form.json` is a **staging configuration**, derived from the live
form but not applied to WordPress. Initial payment fields are removed and full/
partial assistance and privacy acknowledgment added. International address
configuration replaces the US-only scheme. Account creation, notifications and
providers are disabled pending adapter tests. Media-library upload is disabled;
this alone does not make WPForms upload URLs private, so it must not be launched
without the authenticated storage adapter. The local model stores synthetic PDF
documents outside public routes with restricted permissions and checked reads.

The registration template retains the adult pathway; a regular high-school/minor
application needs its own eligibility and guardian workflow. Real course
enrollment is not changed: `activate` records the authorized staging decision;
the LMS adapter remains to be built and tested. Actual payment request URLs,
provider receipts and mail are not connected. Synthetic PDF signature checks are
not malware scans. Secure production document intake requires file scanning,
access policies and validated storage/backup retention.

The SQLite service is a domain prototype, not Postgres migrations/RLS or real SSO.
Its synthetic HMAC event handler is **not Stripe webhook verification**. It lacks
real provider reconciliation, receipts, partial refunds, general-fund allocation,
secure uploads/sharing links, photo publication, consent document registry, full
role granularity, production notification adapters, correction/resubmission flows
and a complete UI. PDF layout is verified for the short synthetic fixture only;
production text wrapping and localization still need implementation.

Before hosted staging: resolve canonical identity and ownership; provision isolated
storage; implement adapters and server-side authorization; add database access,
concurrency, file privacy and integration tests. Verify existing website registration
and login and a real provider test transaction. No live payment collection or real
student publication may be enabled before institutional production authorization.

Rollback: this branch changes no existing application routes or production data.
Remove the standalone staging directory to undo it. A future migration/deployment
must have verified backup/restore, versioned migrations and disabled release flags.
