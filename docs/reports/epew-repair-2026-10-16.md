# EPEW repair verification — October 16, 2026

## Agreement persistence
Production `public.epew_agreement_acceptances` was absent. Applied the existing create-table migration, enabled RLS, revoked direct anon/authenticated access and granted server service-role access. Verified server insert/read in a rolled-back synthetic transaction. Verified RLS enabled, anon SELECT false, authenticated INSERT false, service-role INSERT true, and zero synthetic rows remaining.

API now fails closed with 503/accepted:false for missing storage. Browser requires accepted:true and a persisted acceptance ID before proceeding. Six isolated route tests pass. Real authenticated browser acceptance remains untested.

## Supporter resend
Production has a unique partial index allowing only one introduction per contact. The previous resend endpoint inserted another introduction, causing a duplicate-key error. The new service-only RPC locks the owned contact and queues an exact copy of the original as a supporter follow-up. Repeated requests reuse queued/sending messages and recently submitted messages. Opted-out, paused, disabled-follow-up, missing-contact and wrong-owner requests are blocked. Original introductions and their unique index are preserved.

Applied additive RPC migration in production; it does not send messages. Seven rolled-back database checks passed: missing-original rejection, queue creation, repeat-click reuse, one-original preservation, owner isolation, opt-out and pause. Four isolated route tests passed. Concurrent transaction behavior uses a row lock; a separate multi-connection concurrency test and authenticated UI test remain unperformed.

## Reminder/channel inspection
Existing production scheduler is active every minute. Invoked its existing trigger once: HTTP 200, timed_out:false, queued/sent/failed/skipped all zero; messaging accepted/blocked/failed all zero. There were no reminder records to deliver. This verifies endpoint operation, not live delivery or due-stage timing under load.

SMS and WhatsApp configuration flags are ready. English/French/Spanish WhatsApp templates are recorded approved. Haitian Creole setup failed with provider code 92004, "Invalid language code: ht". No language was silently substituted and no test messages were sent.

## Financial boundaries
27 support intents remain payment_pending, one allocated, one cancelled. Latest two pending intents ($5,200 and $10,400) have no linked supporter_transactions and no paid_at. Available Stripe connector exposes only EMANON INSTITUTE in test mode; EPEW live reconciliation is unavailable. No financial statuses or totals were changed.

## Application 29
Assigned to Sophia Bennett; assignment acknowledgment pending, first-contact completion null, first-interview status pending. A September 30 status outreach email has recorded provider status delivered. No epew_coach_meetings record for application 29. Do not confuse email delivery with coach contact completion. No completion or acknowledgment was fabricated.

## Verification limits
TypeScript check passed before final push. Ten isolated route tests passed. Local production build uses synthetic placeholders, never production secrets. Existing page lint finding: react-hooks/set-state-in-effect in initial return-path effect. No real supporter credentials or browser sessions were used. Follow-up delivery, paid-intent reconciliation and Haitian Creole WhatsApp provider approval require additional authorized live integration evidence.
