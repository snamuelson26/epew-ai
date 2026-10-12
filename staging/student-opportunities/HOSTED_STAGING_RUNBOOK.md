# Emanon IES hosted staging preparation

Checked October 11, 2026, Eastern time. Hosted demonstration remains incomplete.

## Verified infrastructure and identity findings

- Only the production WordPress site is registered in the available connection.
  No cPanel/SSH provisioning connector or isolated WordPress staging is available.
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
- Apply the free form only in staging. Wire authenticated scanned document intake,
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

1. Existing authenticated student submits one free application without charge,
   duplicate account or new course access; duplicate/cross-student requests fail.
2. Clean documents pass actual scanning; anonymous/direct-file/cross-student/
   traversal access fails. EICAR, scanner outage, malformed/oversize PDFs fail.
3. Acknowledgment, activation and recovery emails reach the controlled inbox;
   reused/expired links fail and existing login/registration still work.
4. Ineligible/rejected/incomplete applications cannot create payments/enrollment.
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
