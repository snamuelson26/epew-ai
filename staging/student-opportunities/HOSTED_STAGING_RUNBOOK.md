# Authenticated staging checkpoint — October 12, 2026

The staging connection was approved and an authenticated read succeeded at
https://staging.emanoninstitute.org. WordPress 7.1.3/PHP 8.3.35, WPVibe 1.20.3
and Tutor LMS 4.1.1 are verified. Tutor's initial installation response redirected
to its setup wizard; a fresh plugin read verified active installation, with no
repeat installation. Loginizer remains active.

Verified settings: blog_public=0 (updated and read back), DISABLE_WP_CRON=true,
one fresh administrator in staging, table prefix wphl_. No synthetic student
account, WPForms Pro/add-ons, actual registration, email delivery, payment-provider
connection or Tutor enrollment test has been completed. Separate database names
and unauthorized Directory Privacy behavior are not independently verified.
A public research fetch could not access staging; that alone is not proof of
access protection. No real student records or live payment configuration were
introduced in this phase.

The WordPress connector reached its rolling daily limit during the next read.
Two banked resets are available but the tool requires the user's instruction
before consuming one. Resume via an authorized reset or when capacity returns.

# Current policy revision — October 12

Samuel confirmed a $100 application fee after email verification, replacing the
October 11 free-application timing. Keep this revision in staging only. The prior
staging subdomain and fresh WordPress installation have been reported created by
Samuel, but authenticated connectivity/DNS/HTTPS are not yet independently verified.
The last reported DNS setup was BasicDNS A record staging → 198.54.115.153.

# Emanon IES hosted staging preparation

Checked October 11, 2026, Eastern time. Hosted demonstration remains incomplete.

## Verified infrastructure and identity findings

- Production and fresh staging WordPress are now connected. No cPanel/SSH
  provisioning connector is available. Hosted workflow integration remains pending.
- Tutor LMS 4.1.1 and WPForms/User Registration are active; Tutor Pro, WooCommerce
  and Form Locker are inactive. Configured Form Locker age settings therefore do
  not establish an active age gate.
- Installed Tutor `Student.php` and `Ajax.php` confirm WordPress user IDs,
  `wp_signon`, current-user context and authentication cookies underpin existing
  Tutor login. There are 25 distinct WordPress accounts with a student marker.
  This does not verify eligibility or canonical institutional academic records.
- Tutor signup/login can trigger `tutor_do_enroll_after_login_if_attempt`.
  Direct-course, guest, login, registration, admin and payment-plugin paths must
  be checked for admissions-gate bypasses while preserving existing enrollments.
- Inspected `RestAPI.php` provides read-oriented course/content routes. It does
  not establish a working enrollment-write API. Verify a supported on-site Tutor
  enrollment adapter/version before writing; never insert enrollment rows by SQL.
- Only EPEW's live Stripe account is exposed here. A different account identifier
  configured in WordPress does not establish Emanon ownership or settlement rights.
- PR #10 is draft, open and unmerged. Production remains unauthorized.

## Host preparation required

1. Provide an isolated HTTPS WordPress/Tutor staging installation and connect it
   privately through WPVibe. `staging.emanoninstitute.org` is a proposed address,
   not a verified existing site. Use a separate database, storage and credentials.
2. Prefer clean installation with matching plugin versions and synthetic accounts/
   courses. If cloning, sanitize real students/documents/payment data, remove live
   credentials and sessions, and block mail, cron and payments before exposure.
3. Protect staging access and exclude search indexing. Provide backend runtime,
   private storage outside public uploads, malware scanner and backup/restore access.
   Never paste credentials into chat.
4. Configure ClamAV daemon/current definitions, bounded uploads, quarantine,
   scanning, document access policies and institutional retention requirements.
5. Configure authorized staging email and an Emanon-owned controlled test inbox.
   Verify delivery with provider evidence; `wp_mail` success alone is insufficient.
6. President/authorized financial officer verifies merchant owner, account ID,
   currency, settlement arrangement and permitted fees/sponsorship use. Connect
   Emanon's sandbox/test mode privately. No EPEW live collection.

## Integration work after access

- Bind application references to the authenticated WordPress issuer/user-ID tuple;
  reconcile the institutional academic ID separately. Never derive staff authority
  from student-provided roles or create a duplicate WordPress account.
- Apply the simplified application only in staging. Wire authenticated scanned document intake,
  explicit privacy acknowledgment, international addresses, applicant status,
  staff review and duplicate handling. Keep marketing consent separate.
- Record academic review before conditional acceptance. Finance verifies funding
  and approves assistance, sponsorship/waivers separately for each semester.
- Create actual test-provider payment requests for only the outstanding balance;
  verify ownership, signatures, amount/currency, state and idempotency. Reconcile
  delayed/out-of-order events, partial refunds, disputes and receipts.
- Gate the actual Tutor enrollment write by academic/financial approval, using
  approved program/course mappings. Handle multi-course failures and retries;
  do not report enrollment success without verified Tutor state and lesson access.
- Verify native activation/recovery flows and delivered notifications. Implement
  the complete applicant and reviewer interfaces; fixture sessions are not real SSO.

## Hosted acceptance and rollback evidence

Record environment URL, synthetic account, timestamps, relevant event/request IDs,
actual database/LMS state and observed pass/fail for every test:

1. Existing authenticated student starts one application without automatic charge,
   duplicate account or new course access; duplicate/cross-student requests fail.
2. Clean documents pass actual scanning; anonymous/direct-file/cross-student/
   traversal access fails. EICAR, scanner outage, malformed/oversize PDFs fail.
3. Acknowledgment, activation and recovery emails reach the controlled inbox;
   reused/expired links fail and existing login/registration still work.
4. Unverified/rejected applicants cannot create payment requests. A verified applicant
   may pay the $100 application fee before review; course enrollment requires
   academic approval and covered fee.
5. Provider test cases cover success, failure, pending, cancel, replay, wrong account,
   delayed/out-of-order events, partial/full refund and disputes; receipts reconcile.
6. Full assistance, verified sponsorship, waiver and partial assistance plus payment
   grant only authorized actual courses. Direct Tutor entry points cannot bypass.
7. Semester 2 has its own $100 obligation and approval; no automatic billing or
   copied waiver. Existing unrelated enrollments remain unchanged.
8. Restore a staging backup, roll back integration, preserve financial/audit evidence
   and recover queued events. Document exact host-specific rollback steps.

No production routes, settings, enrollment or student publication changed in this
phase. Local rollback removes/reverts staging code. Hosted rollback remains to be
implemented and tested after provisioning. October 14 remains conditional.
