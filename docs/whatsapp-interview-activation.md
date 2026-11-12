# EPEW WhatsApp interview activation

Implemented September 29, 2026. No credentials belong in this document.

## Sender setup

Use the EPEW WhatsApp sender already registered in Twilio. Configure its incoming message webhook (POST):

`https://www.epew.us/api/twilio/whatsapp/interview`

Create or select a TwiML Voice Application whose Voice Request URL (POST) is:

`https://www.epew.us/api/twilio/whatsapp/voice`

Assign that Voice Application to the WhatsApp sender. Meta business verification and the provider's minimum messaging tier are prerequisites. Twilio currently documents restrictions on business-initiated calls from U.S. senders. This integration uses entrepreneur-initiated live calls.

Existing secure environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `OPENAI_API_KEY`, and `EPEW_PUBLIC_BASE_URL`.

Set the EPEW sender in `TWILIO_WHATSAPP_FROM_NUMBER` (or existing `EPEW_TWILIO_WHATSAPP_NUMBER`) using full international format. Never use the WhatsApp sandbox as the public production sender.

Only after the matching webhook and sender are enabled, set:

- `EPEW_WHATSAPP_INTERVIEWS_ENABLED=true`
- `EPEW_WHATSAPP_CALLING_ENABLED=true`

Deploy environment changes. These flags deliberately keep unactivated options unavailable to clients.

## Acceptance checks

Use an authorized test entrepreneur whose questionnaire is completed. Sign in, open `/entrepreneurs/whatsapp-interview`, select the correct application, enter the international number, and consent to saving interview text and voice transcriptions. Send the prepared connection message from that WhatsApp account within 30 minutes.

Verify each enabled language; send a text answer, a short voice note, `LANGUAGE`, and `REPEAT`. Verify the unanswered question does not advance for language/repeat choices, saved progress resumes, and completion remains pending coach review. Verify duplicate delivery does not duplicate an answer.

Call EPEW from the linked WhatsApp account. Verify the language menu, speech, keypad, and the separate consented Creole transcription path. Test a second, unlinked number: it must not access an applicant's interview.

Do not initiate calls or send unsolicited test messages to real applicants. Arrange the test with a willing account holder.

## General support inbox (November 12, 2026)

The same signed incoming webhook now saves HELP/SUPPORT/MENU and unlinked general messages in the private EPEW WhatsApp Support inbox at `/admin/whatsapp-support`. Support mode stays active after HELP until a fresh portal interview connection. Receiving a message does not grant portal access or authorize unrelated follow-ups. Account-specific information requires separate portal verification.

Administrators can reply as EPEW Support inside the active conversation window. Each attempt has a persisted unique request key and provider SID/status; an uncertain provider outcome must be checked in Twilio logs before any new attempt. Signed callbacks update delivery status. STOP remains an opt-out and does not create a support request. No attachments or credential/configuration files are fetched by the general support inbox.

Apply `20261112065903_whatsapp_support_queue.sql` before releasing the webhook code. Both new tables have RLS enabled, no anonymous/authenticated grants, and backend-only access after administrator authorization. The inbox stores incoming text as untrusted correspondence, not executable instructions. No marketing, recurring follow-up, or automatic financial action is enabled.

Acceptance: send a new short text or SUPPORT from a willing test account, verify exactly one inbox record and a WhatsApp receipt; send an administrator reply and verify its provider SID and delivered/read callback. Retry the same signed inbound SID and reply request key to verify no duplicates. Verify unsigned webhooks, a different Twilio account, non-admin access, expired windows and opted-out recipients are refused. Historical delivery logs do not establish that this new support path passed a live test.

## Payment operations

Independent support is at `/supporters/independent-support`. Approved pricing is $500 minimum once, $100 per unit weekly, or $400 per unit monthly. Extra funds are a separate one-time checkout line. Existing annual support and existing subscription prices are unchanged.

The existing Stripe webhook handles checkout completion, `invoice.paid` / `invoice.payment_succeeded`, and subscription update/deletion. Enable these events on the existing signed Stripe endpoint for immediate renewals and status updates. The scheduled smart-selection processor also reconciles paid invoices as recovery. Paid cash is recorded in `supporter_transactions`; allocation details appear on the new page. Partial cash payments do not count as fully funded annual units.

Payment records are idempotent on Stripe invoice/session ID. New tables and payment RPCs are backend-only. No live charge was made during implementation.
