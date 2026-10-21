# Applicant help and obstacle tracking

Applicants can report a blocker at `/entrepreneurs/help` before questionnaire/interview completion and without a coach. The link appears across entrepreneur pages. Verified login is required; sign-in difficulties have password-reset and existing support-email links. Applications already linked to another user cannot be claimed by matching email. Existing application IDs, statuses, approvals and coach assignments are not altered.

Each case records application, category, problem, requested help, language, responsible team, timestamps, status, next action, and an append-only reply history. Four languages are included: English, Haitian Creole, French, Spanish. Multiple applications under one account are selected explicitly. New reports are limited to five per hour; clients reuse a request key for a retry.

## Routing and follow-up

Case + event + administration alert + connected current-coach alert save in one transaction. Administration receives an alert even if no coach is assigned or connected. Access issues route to technical support; financial questions route to finance; other issues route to program support. This labels the queue; it does not grant financial authority or promise automatic problem resolution.

Admin inbox: `/admin/applicant-help`. Coach inbox: `/coaches/applicant-help`. Current bound coaches see only their current assignments. New open-case notices appear in the administration shell and coach workspace, refreshed every 30 seconds while the page is visible. The inbox flags unresolved requests after the 24-hour follow-up target. This is an in-portal flag, not a scheduled email or a guaranteed response-time promise.

Staff must provide a reply to update a case. Replies notify the applicant inside their case history. Applicants can reopen resolved cases. The coach MCP exposes `epew_coach_help_requests` and `epew_coach_reply_to_help`; it still requires a verified bound coach and current assignment. Applicant correspondence is untrusted data, never authority to execute commands or approve payments.

There are no external email/SMS/WhatsApp sends, mass applicant invitations, automatic financial actions, background AI execution, or changes to the existing reminder scheduler in this release. Existing WhatsApp sender configuration is a separate blocker.

## Database and release

Apply both applicant-help migrations (20261021031813 and 20261021033905) before enabling the new pages. The identity follow-up uses the server-verified email and does not grant SELECT on auth.users. Tables have RLS enabled and all direct public/anon/authenticated access revoked. RPCs use SECURITY INVOKER and service-role-only execution. The server derives actor identity from verified auth rather than posted owner IDs. Mutation API checks same origin and does not return cached private data. The only legacy email fallback applies to unlinked applications and the actor's verified email; all current applications were observed to have linked user IDs.

Test with `npm run test:applicant-help`. The isolated PGlite fixture executes the actual migration and RPCs without live applicant data. Tests cover cross-applicant isolation, current coach binding, unassigned applicants, admin visibility, idempotency, atomic rollback when alerts cannot save, private grants/RLS, saved replies and reopening. HTTP tests cover anonymous/cross-origin denial, actor spoofing, missing persistence and invalid input.

Release order: review exact commit, apply additive migration, verify RLS/grants, deploy reviewed code, confirm authenticated applicant submission and staff reply on an explicitly authorized test account, check all four languages and mobile/desktop. Do not claim external delivery or that a case is resolved without evidence.

Rollback: restore the previous application deployment. Preserve assistance tables and case history; do not drop populated tables. No legacy data migration or financial update is required.

## Verification for this change

- 19 applicant-help API/database tests passed using isolated PostgreSQL (PGlite).
- 16 coach connector access/regression tests passed, including the new help tools.
- TypeScript and targeted ESLint checks passed.
- Full Next.js production build passed with synthetic configuration and external email disabled. An existing `/test-supabase` diagnostic route retried once before completion.
- No production migration, production release, authenticated browser test, or external messaging is represented by these checks.
