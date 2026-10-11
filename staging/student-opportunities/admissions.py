"""Executable fee-policy staging model. Synthetic identities/payments only.

No production adapters, external mail, public uploads or live checkout endpoints.
Amounts are integer USD cents. Reuses Service identities and authorization.
"""
import hashlib
import hmac
import json
import secrets
import time
from datetime import date
from pathlib import Path
from service import Denied, Invalid

POLICY = {
    "version": "IES-FEES-2026-10-11",
    "application": 0,
    "semester_1": 10000,
    "semester_2": 10000,
    "tuition": 0,
    "exam_per_course_per_semester": 2500,
    "graduation_when_applicable": 10000,
}


class Admissions:
    def __init__(self, service, vault, clock=time.time):
        self.s = service
        self.db = service.db
        self.clock = clock
        self.vault = Path(vault)
        self.vault.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.vault.chmod(0o700)
        self.db.executescript('''
        CREATE TABLE IF NOT EXISTS applications(
          id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES identities(id),
          cohort TEXT NOT NULL, program TEXT NOT NULL, dob TEXT NOT NULL,
          background TEXT NOT NULL, country TEXT NOT NULL,
          assistance TEXT NOT NULL CHECK(assistance IN ('none','partial','full')),
          consent_version TEXT NOT NULL, consent_at TEXT NOT NULL,
          state TEXT NOT NULL CHECK(state IN ('Submitted','Under Review','Conditional Acceptance','Rejected')),
          reviewer TEXT, reviewed_at TEXT, review_evidence TEXT,
          UNIQUE(owner,cohort));
        CREATE TABLE IF NOT EXISTS admission_documents(
          id TEXT PRIMARY KEY, application TEXT NOT NULL REFERENCES applications(id),
          kind TEXT NOT NULL, digest TEXT NOT NULL, storage_key TEXT NOT NULL UNIQUE,
          UNIQUE(application,kind,digest));
        CREATE TABLE IF NOT EXISTS semester_obligations(
          id TEXT PRIMARY KEY, application TEXT NOT NULL REFERENCES applications(id),
          semester INTEGER NOT NULL CHECK(semester IN (1,2)),
          fee INTEGER NOT NULL CHECK(fee=10000), opened_by TEXT NOT NULL,
          policy_version TEXT NOT NULL, UNIQUE(application,semester));
        CREATE TABLE IF NOT EXISTS admission_awards(
          id TEXT PRIMARY KEY, obligation TEXT NOT NULL REFERENCES semester_obligations(id),
          kind TEXT NOT NULL CHECK(kind IN ('assistance','sponsorship','waiver')),
          amount INTEGER NOT NULL CHECK(amount>0), evidence TEXT NOT NULL,
          approver TEXT NOT NULL, at TEXT NOT NULL,
          state TEXT NOT NULL CHECK(state IN ('approved','revoked')));
        CREATE TABLE IF NOT EXISTS payment_requests(
          id TEXT PRIMARY KEY, obligation TEXT NOT NULL REFERENCES semester_obligations(id),
          amount INTEGER NOT NULL CHECK(amount>0), token_hash TEXT NOT NULL UNIQUE,
          expires REAL NOT NULL, state TEXT NOT NULL CHECK(state IN ('pending','confirmed','refunded','disputed','cancelled')),
          created_by TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS admission_payment_events(
          id TEXT PRIMARY KEY, digest TEXT NOT NULL, request TEXT NOT NULL REFERENCES payment_requests(id));
        CREATE TABLE IF NOT EXISTS admission_receipts(
          id TEXT PRIMARY KEY, request TEXT NOT NULL UNIQUE REFERENCES payment_requests(id),
          amount INTEGER NOT NULL, currency TEXT NOT NULL, confirmed_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS enrollment_decisions(
          obligation TEXT PRIMARY KEY REFERENCES semester_obligations(id),
          state TEXT NOT NULL CHECK(state IN ('active','financial_hold')),
          approver TEXT NOT NULL, at TEXT NOT NULL);
        ''')

    def actor(self, token, roles=None):
        return self.s.actor(token, roles)

    def get(self, table, identifier):
        if table not in {'applications', 'semester_obligations', 'payment_requests', 'admission_awards', 'admission_documents'}:
            raise Invalid('Unknown record type')
        row = self.db.execute('SELECT * FROM ' + table + ' WHERE id=?', (identifier,)).fetchone()
        if not row:
            raise Invalid('Unknown record')
        return dict(row)

    def private(self, token, identifier):
        actor = self.actor(token)
        application = self.get('applications', identifier)
        if actor['id'] != application['owner'] and actor['role'] not in {'reviewer', 'director', 'finance'}:
            raise Denied('Private application')
        return application

    def submit(self, token, *, cohort, program, dob, background, country, assistance, consent_version, consent):
        actor = self.actor(token, {'student'})
        if consent is not True or not consent_version:
            raise Invalid('Application privacy consent required')
        if assistance not in {'none', 'partial', 'full'}:
            raise Invalid('Invalid assistance selection')
        if not all(isinstance(v, str) and 0 < len(v.strip()) <= 2000 for v in [cohort, program, background, country]):
            raise Invalid('Incomplete application')
        try:
            birth = date.fromisoformat(dob)
        except (TypeError, ValueError):
            raise Invalid('Invalid date of birth')
        today = date.fromtimestamp(self.clock())
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        if age < 18 or age > 120:
            raise Invalid('This staging application covers the adult IES pathway only')
        identifier = secrets.token_urlsafe(18)
        with self.db:
            self.db.execute('INSERT INTO applications VALUES(?,?,?,?,?,?,?,?,?,?,?,NULL,NULL,NULL)',
                            (identifier, actor['id'], cohort, program, dob, background, country,
                             assistance, consent_version, self.s_now(), 'Submitted'))
            self.s.log(actor['id'], 'free_application_submitted:' + POLICY['version'], identifier)
            self.s.notify(actor['id'], 'Application received — no payment required', identifier)
        # Intentionally creates neither a payment request nor a new identity.
        return identifier

    def s_now(self):
        from datetime import datetime, timezone
        return datetime.fromtimestamp(self.clock(), timezone.utc).isoformat()

    def upload(self, token, application_id, kind, data):
        application = self.private(token, application_id)
        actor = self.actor(token, {'student'})
        if actor['id'] != application['owner'] or application['state'] not in {'Submitted', 'Under Review'}:
            raise Denied('Upload not permitted')
        if kind not in {'identity', 'academic'} or not isinstance(data, bytes) or not data or len(data) > 5 * 1024 * 1024:
            raise Invalid('Invalid document')
        # This synthetic fixture accepts PDFs only; malware scanning is an adapter gate.
        if not data.startswith(b'%PDF-'):
            raise Invalid('PDF document required')
        digest = hashlib.sha256(data).hexdigest()
        identifier = secrets.token_urlsafe(18)
        key = secrets.token_hex(32)
        path = self.vault / key
        try:
            with path.open('xb') as file:
                file.write(data)
            path.chmod(0o600)
            with self.db:
                self.db.execute('INSERT INTO admission_documents VALUES(?,?,?,?,?)',
                                (identifier, application_id, kind, digest, key))
                self.s.log(actor['id'], 'private_document_uploaded:' + kind, identifier)
        except Exception:
            path.unlink(missing_ok=True)
            raise
        return identifier

    def document(self, token, identifier):
        document = self.get('admission_documents', identifier)
        self.private(token, document['application'])
        # No public URL or media attachment; authorization is checked on every read.
        return (self.vault / document['storage_key']).read_bytes()

    def review(self, token, application_id, *, accepted, age_verified, academics_verified, documents_verified, program_verified, evidence):
        actor = self.actor(token, {'reviewer', 'director'})
        application = self.get('applications', application_id)
        if application['state'] not in {'Submitted', 'Under Review'}:
            raise Invalid('Application already decided')
        if type(accepted) is not bool or not evidence:
            raise Invalid('Review evidence required')
        if accepted:
            if not all(v is True for v in [age_verified, academics_verified, documents_verified, program_verified]):
                raise Invalid('All academic eligibility checks required')
            kinds = {r[0] for r in self.db.execute('SELECT kind FROM admission_documents WHERE application=?', (application_id,))}
            if not {'identity', 'academic'} <= kinds:
                raise Invalid('Required documents missing')
        state = 'Conditional Acceptance' if accepted else 'Rejected'
        with self.db:
            self.db.execute('UPDATE applications SET state=?,reviewer=?,reviewed_at=?,review_evidence=? WHERE id=?',
                            (state, actor['id'], self.s_now(), evidence, application_id))
            self.s.log(actor['id'], 'academic_review:' + state, application_id)
            self.s.notify(application['owner'], state, application_id)

    def open_semester(self, token, application_id, semester):
        actor = self.actor(token, {'director'})
        application = self.get('applications', application_id)
        if application['state'] != 'Conditional Acceptance' or type(semester) is not int or semester not in (1, 2):
            raise Invalid('Conditional acceptance and valid semester required')
        if semester == 2:
            row = self.db.execute('SELECT o.id,e.state FROM semester_obligations o LEFT JOIN enrollment_decisions e ON e.obligation=o.id WHERE o.application=? AND o.semester=1', (application_id,)).fetchone()
            if not row or row['state'] != 'active':
                raise Invalid('Semester 1 enrollment must be active first')
        identifier = secrets.token_urlsafe(18)
        with self.db:
            self.db.execute('INSERT INTO semester_obligations VALUES(?,?,?,?,?,?)',
                            (identifier, application_id, semester, 10000, actor['id'], POLICY['version']))
            self.s.log(actor['id'], 'registration_fee_due:semester:' + str(semester), identifier)
        return identifier

    def balance(self, obligation_id):
        obligation = self.get('semester_obligations', obligation_id)
        aid = self.db.execute("SELECT COALESCE(SUM(amount),0) FROM admission_awards WHERE obligation=? AND state='approved'", (obligation_id,)).fetchone()[0]
        paid = self.db.execute("SELECT COALESCE(SUM(amount),0) FROM payment_requests WHERE obligation=? AND state='confirmed'", (obligation_id,)).fetchone()[0]
        return max(0, obligation['fee'] - aid - paid)

    def award(self, token, obligation_id, kind, amount, evidence):
        actor = self.actor(token, {'finance'})
        self.get('semester_obligations', obligation_id)
        if kind not in {'assistance', 'sponsorship', 'waiver'} or type(amount) is not int or amount <= 0 or amount > self.balance(obligation_id) or not evidence:
            raise Invalid('Invalid or unfunded award')
        identifier = secrets.token_urlsafe(18)
        with self.db:
            # Pending requests become stale when the amount due changes.
            self.db.execute("UPDATE payment_requests SET state='cancelled' WHERE obligation=? AND state='pending'", (obligation_id,))
            self.db.execute('INSERT INTO admission_awards VALUES(?,?,?,?,?,?,?,?)',
                            (identifier, obligation_id, kind, amount, evidence, actor['id'], self.s_now(), 'approved'))
            self.s.log(actor['id'], 'approved_financial_award:' + kind, identifier)
        return identifier

    def request_payment(self, token, obligation_id, ttl=86400):
        actor = self.actor(token, {'finance'})
        obligation = self.get('semester_obligations', obligation_id)
        if self.get('applications', obligation['application'])['state'] != 'Conditional Acceptance':
            raise Invalid('Not conditionally accepted')
        amount = self.balance(obligation_id)
        if amount <= 0 or type(ttl) is not int or not 60 <= ttl <= 7 * 86400:
            raise Invalid('No payable balance or invalid expiry')
        identifier = secrets.token_urlsafe(18)
        secret = secrets.token_urlsafe(32)
        with self.db:
            self.db.execute("UPDATE payment_requests SET state='cancelled' WHERE obligation=? AND state='pending'", (obligation_id,))
            self.db.execute('INSERT INTO payment_requests VALUES(?,?,?,?,?,?,?)',
                            (identifier, obligation_id, amount, hashlib.sha256(secret.encode()).hexdigest(), self.clock() + ttl, 'pending', actor['id']))
            self.s.log(actor['id'], 'synthetic_payment_request_created', identifier)
        # The secret is returned once and never persisted in plain text.
        return {'id': identifier, 'token': secret, 'amount_minor': amount, 'mode': 'synthetic-test'}

    def payment_request(self, token, secret):
        actor = self.actor(token)
        if not isinstance(secret, str):
            raise Denied('Invalid payment request')
        row = self.db.execute('SELECT * FROM payment_requests WHERE token_hash=?', (hashlib.sha256(secret.encode()).hexdigest(),)).fetchone()
        if not row or row['expires'] <= self.clock() or row['state'] != 'pending':
            raise Denied('Expired or unavailable payment request')
        obligation = self.get('semester_obligations', row['obligation'])
        application = self.private(token, obligation['application'])
        if actor['id'] != application['owner']:
            raise Denied('Payment request belongs to another applicant')
        return {'id': row['id'], 'amount_minor': row['amount'], 'semester': obligation['semester'], 'mode': 'synthetic-test'}

    def provider_event(self, body, signature):
        # Staging-only contract. Never wire this method to a production webhook.
        expected = hmac.new(self.s.webhook_secret, body, hashlib.sha256).hexdigest()
        if not isinstance(signature, str) or not hmac.compare_digest(expected, signature):
            raise Denied('Invalid synthetic provider signature')
        event = json.loads(body)
        request = self.get('payment_requests', event['request'])
        if event['account'] != 'EMANON-SYNTHETIC-TEST' or event['currency'] != 'usd' or type(event['amount']) is not int or event['amount'] != request['amount']:
            raise Invalid('Payment ownership, currency or amount mismatch')
        digest = hashlib.sha256(body).hexdigest()
        previous = self.db.execute('SELECT digest FROM admission_payment_events WHERE id=?', (event['id'],)).fetchone()
        if previous:
            if previous[0] != digest:
                raise Invalid('Changed event replay')
            return
        allowed = {'pending': {'confirmed'}, 'confirmed': {'refunded', 'disputed'}, 'refunded': set(), 'disputed': set(), 'cancelled': set()}
        if event['state'] not in allowed[request['state']]:
            raise Invalid('Invalid payment transition')
        if event['state'] == 'confirmed' and request['amount'] > self.balance(request['obligation']):
            raise Invalid('Payment exceeds current balance')
        with self.db:
            self.db.execute('INSERT INTO admission_payment_events VALUES(?,?,?)', (event['id'], digest, request['id']))
            self.db.execute('UPDATE payment_requests SET state=? WHERE id=?', (event['state'], request['id']))
            if event['state'] == 'confirmed':
                self.db.execute('INSERT INTO admission_receipts VALUES(?,?,?,?,?)', ('IES-R-' + secrets.token_hex(12), request['id'], request['amount'], 'usd', self.s_now()))
            else:
                self.db.execute("UPDATE enrollment_decisions SET state='financial_hold' WHERE obligation=?", (request['obligation'],))
            self.s.log('synthetic-provider', 'registration_payment:' + event['state'], request['id'])
            self.s.notify('finance', 'registration_payment:' + event['state'], event['id'])

    def activate(self, token, obligation_id):
        actor = self.actor(token, {'director'})
        obligation = self.get('semester_obligations', obligation_id)
        if self.get('applications', obligation['application'])['state'] != 'Conditional Acceptance' or self.balance(obligation_id) != 0:
            raise Invalid('Verified payment, approved sponsorship or waiver must cover the fee')
        with self.db:
            self.db.execute("INSERT INTO enrollment_decisions VALUES(?,'active',?,?) ON CONFLICT(obligation) DO UPDATE SET state='active',approver=excluded.approver,at=excluded.at", (obligation_id, actor['id'], self.s_now()))
            self.s.log(actor['id'], 'enrollment_activation_authorized', obligation_id)
            self.s.notify(self.get('applications', obligation['application'])['owner'], 'Enrollment activation authorized', obligation_id)

    def receipt(self, token, request_id):
        request = self.get('payment_requests', request_id)
        obligation = self.get('semester_obligations', request['obligation'])
        self.private(token, obligation['application'])
        row = self.db.execute('SELECT * FROM admission_receipts WHERE request=?', (request_id,)).fetchone()
        if not row:
            raise Invalid('No confirmed payment receipt')
        result = dict(row)
        result['current_payment_state'] = request['state']
        result['demonstration_only'] = True
        return result
