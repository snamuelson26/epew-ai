# Emanon prototype test results

Date: October 11, 2026. Scope: isolated SQLite domain service and loopback HTTP
demonstration; all identities and contributions are synthetic.

Command: `python -m unittest -v test_service.py test_http.py test_admissions.py test_integration_adapters.py`

Result: **48 tests passed** (22 original checks, 19 admissions-policy checks and
7 integration-adapter checks).
The HTTP test launches the actual demo in a separate
process and shuts it down after verification.

| Area | Verified result |
| --- | --- |
| Identity mapping | Duplicate source identity rejected; unauthenticated and cross-student private access denied |
| Consent and review | Draft not public; student cannot approve; approval requires consent; approved public output uses an explicit field list |
| Withdrawal and suspension | Both remove public profile access while retaining its sponsorship code |
| Code and audit integrity | Updates/deletes to code records rejected; audit updates rejected |
| Documents | QR asset generated; PDF contains the exact profile URL; HTTP-served PDF has one page and the expected clickable link |
| Contribution totals | Pending contributions excluded; confirmed synthetic events included; refunds/disputes excluded |
| Payment controls | Invalid signature, account and amount rejected; identical event replay does not double count |
| Financial allocation | Only Finance allocates confirmed funds; available contribution amount and approved assistance cap enforced |
| Internship hosts | A submitted but unapproved host cannot receive a placement |
| Timesheets | Duplicate/overlapping submissions and student self-approval rejected; host verification required before assigned academic approval |
| Completion | Insufficient hours rejected; 240 doubly verified hours plus report/evaluation accepted |
| HTTP demonstration | Landing page, synthetic profile, PDF and SVG return 200; unknown profile returns 404; responses use no-store |

The generated one-page synthetic PDF was rendered and visually inspected. No
independent camera/decoder test of the QR image was performed.

## Not yet tested or implemented

These results are not evidence of a production-ready system. Existing WordPress
registration/login integration, canonical student enrollment mapping, real OAuth,
Postgres/RLS, concurrent submissions, actual provider webhooks/reconciliation,
partial refunds, general-fund allocation, receipts, private document uploads,
sharing-link revocation, email delivery, full role matrix and backup/restore remain
unverified. No live contribution was initiated. No student information was
published and no production database schema was changed.

## Next hosted staging acceptance gates

1. Confirm the institutional student record authority and reuse its existing login.
2. Provision an approved isolated staging environment without production fixtures.
3. Verify Emanon's own payment account and test-mode ownership.
4. Implement and test authentication, database policies, storage, payment and
   notification adapters, then the complete application and supervisor UI.
5. Run all twelve assignment scenarios, including existing login regression,
   provider reconciliation and revoked-profile/document access.
6. Submit the hosted demonstration, test evidence and rollback plan for review.

Production authorization has not been requested.

## Integration adapter checks

Seven additional local tests passed: WordPress current-user identity mapping,
production-origin/invalid-session rejection, credential redirect rejection,
ClamAV clean status, infection/error/missing-executable/timeout rejection, no
document release when scanning is unavailable, and synthetic-fixture restrictions.
Transport and scanner subprocess tests use mocks. No actual WordPress staging
student, real malware scanner, live email, payment sandbox or Tutor enrollment
write has been tested. These tests do not satisfy hosted staging acceptance.

## October 11 approved fee-policy implementation

Additional passing checks cover:

- Free application submission without payment requests or duplicate accounts.
- Preserved fee schedule, international residence and assistance selections.
- Adult eligibility, required privacy acknowledgment and duplicate cohort intake.
- Authorized private document reads; rejected cross-student reads and invalid types.
- Academic review requires all eligibility checks and required documents.
- Conditional acceptance before fee requests; no student self-approval.
- Full assistance, sponsorship and waiver combinations; partial assistance reduces
  the balance and cancels stale pending payment requests.
- Applicant-bound expiring payment tokens stored only as hashes.
- Pending payments cannot create receipts or activate enrollment.
- Synthetic account/currency/amount/signature matching, confirmed receipts and replay
  handling; refunds place enrollment on financial hold.
- Financial approval authority remains separate from enrollment activation authority.
- Separate Semester 2 charge, without automatic billing or copied Semester 1 waiver.
- Staging form has no initial payment controls or enabled automatic account creation.
- Executable demonstration covers free application → review → partial assistance →
  confirmed synthetic payment → enrollment decision → separate Semester 2 waiver.

The production form's payment settings were **not changed**. The WPForms-configured
Stripe account ID differs from the only Stripe account exposed in this session;
that difference does not establish Emanon ownership. Real provider test mode,
hosted staging, authentic student-account integration, private WordPress uploads,
live activation emails/password recovery and LMS enrollment remain acceptance gates.
