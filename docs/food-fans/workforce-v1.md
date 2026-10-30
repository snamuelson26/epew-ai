# Food Fans Workforce V1 — implementation and operating guide

Generated October 30, 2026, 10:48 AM America/New_York.

The separate workforce project is available to existing verified EPEW administrators at `/admin/food-fans-workforce`. It covers applicants, roles, employees, availability, per-restaurant training plans, individual training completion, certification records, shifts, time entries, attendance, performance, private document references, manager notes and approved payroll exports. Existing membership records remain separate.

## Initial training plan

FFR-001 has nine planned topics for November 9, 2026. Samuel Nelson is trainer except POS, assigned to Guy. Time, venue, roster and trainer identity details remain pending. No employee, completed training, passed assessment or certification is invented. Creating a genuine employee automatically creates the current non-cancelled training checklist. Changes to the plan do not silently rewrite existing employee records; revise them with a reason.

## Manager workflow

1. Create role records; enter genuine applicants as available.
2. Create employee with a stable employee ID and role ID under the correct restaurant. Applicant reference is optional. Do not record SSNs, bank details, tax forms or immigration documents here.
3. Review availability, schedule, training and certifications. Record actual completion dates and assessment evidence after training. Record certification reference if issued; training completion does not automatically issue a certificate.
4. Time entries support manager-assisted clock in/out and corrections. The “now” controls fill an exact offset timestamp; Save records it. Open entries cannot overlap other time for the employee. Close and review entries before approving. No employee self-service login is enabled in V1.
5. Prepare payroll lines for an exact date period, reference all approved time entries, and classify regular and overtime hours with review evidence. The total must match approved source time. The provider calculates actual pay, deductions and taxes; EPEW does not infer legal overtime classifications.
6. Enter each employee's provider ID. Create the approved CSV export with the provider name. Only unexported approved lines enter the immutable snapshot. Source time is rechecked and locked after export. Download the snapshot and import into the chosen provider; no money is sent. Provider mapping/import acceptance remains to be tested once the provider is selected.
7. For post-export corrections, retain the exported audit record and follow the provider's adjustment process. EPEW V1 does not delete/rewrite exported payroll.

## Documents and security

Use the existing private restaurant launch-workspace file upload, then enter that attachment UUID in the employee document record. Attachment restaurant must match the employee record's restaurant. Files remain accessible only through existing administrator authorization; no public links are generated.

All writes require same-origin requests, verified administrator identity, change reasons, optimistic version checks and retry IDs. Each mutation stores a permanent before/after revision. Anonymous and ordinary authenticated clients cannot query workforce tables or payroll exports. V1 does not grant new manager/employee access or build payroll tax filing.

## Validation

PGlite exercises training seeding, per-employee checklists, unearned completion rejection, cross-restaurant isolation, approved time matching, overlap rejection, duplicate payroll prevention, export replay protection, immutable export/source time and anonymous/ordinary-user denial. API tests verify authorization, CSRF origin protection, server-derived actor and CSV formula escaping. TypeScript and focused lint checks pass. Production verification is recorded separately in the EPEW operational history.
