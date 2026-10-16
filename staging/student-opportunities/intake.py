"""Simplified staging intake for existing synthetic identities.

Does not create WordPress accounts, accept passwords or send external messages.
The institutional auth adapter must handle real password setup and account reuse.
"""
import hashlib
import hmac
import re
import secrets
from datetime import date
from service import Denied, Invalid

CAREERS = ('Business Administration', 'Computer Science', 'Education',
           'General Studies', 'Health Science', 'Law', 'Language', 'Skilled Trades')


class Intake:
    def __init__(self, admissions, mailer=None):
        self.a = admissions
        self.s = admissions.s
        self.db = admissions.db
        self.mailer = mailer
        self.secret = secrets.token_bytes(32)
        self.db.executescript('''
        CREATE TABLE IF NOT EXISTS intake_contacts(
          owner TEXT PRIMARY KEY REFERENCES identities(id), first_name TEXT NOT NULL,
          last_name TEXT NOT NULL, email TEXT NOT NULL COLLATE NOCASE UNIQUE,
          privacy_version TEXT NOT NULL, school_updates INTEGER NOT NULL,
          consent_at TEXT NOT NULL, verified_at TEXT);
        CREATE TABLE IF NOT EXISTS intake_details(
          owner TEXT PRIMARY KEY REFERENCES intake_contacts(owner), country TEXT NOT NULL,
          dob TEXT NOT NULL, pathway TEXT NOT NULL CHECK(pathway IN ('adult','regular')),
          careers TEXT, grade INTEGER, guardian_status TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS email_challenges(
          id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES intake_contacts(owner),
          digest TEXT NOT NULL, created REAL NOT NULL, expires REAL NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0, consumed INTEGER NOT NULL DEFAULT 0);
        ''')

    def apply(self, token, first_name, last_name, email, privacy, updates=False):
        actor = self.a.actor(token, {'student'})
        if privacy is not True or type(updates) is not bool:
            raise Invalid('Privacy acknowledgment required')
        if not all(isinstance(v, str) and 0 < len(v.strip()) <= 100 for v in (first_name, last_name)):
            raise Invalid('First and last name required')
        if not isinstance(email, str) or len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
            raise Invalid('Valid email required')
        with self.db:
            self.db.execute('INSERT INTO intake_contacts VALUES(?,?,?,?,?,?,?,NULL)',
                            (actor['id'], first_name.strip(), last_name.strip(), email.lower(), 'PRIVACY-2026-10-12', int(updates), self.a.s_now()))
            self.s.log(actor['id'], 'simple_application_started:privacy:PRIVACY-2026-10-12', actor['id'])
        return {'next': 'create-account-details', 'application_fee_minor': 10000}

    def details(self, token, country, dob, pathway, careers=(), grade=None):
        import json
        actor = self.a.actor(token, {'student'})
        contact = self.db.execute('SELECT owner FROM intake_contacts WHERE owner=?', (actor['id'],)).fetchone()
        if not contact or not isinstance(country, str) or not country.strip():
            raise Invalid('Applicant and residence required')
        try:
            birth = date.fromisoformat(dob)
        except (ValueError, TypeError):
            raise Invalid('Valid date of birth required') from None
        today = date.fromtimestamp(self.a.clock())
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        if not 0 <= age <= 120:
            raise Invalid('Invalid date of birth')
        if pathway == 'adult':
            if age < 18 or not isinstance(careers, (tuple, list)) or len(careers) != 3 or len(set(careers)) != 3 or any(c not in CAREERS for c in careers) or grade is not None:
                raise Invalid('Adult pathway requires age 18+ and three distinct ranked careers')
        elif pathway == 'regular':
            if type(grade) is not int or grade not in (9, 10, 11, 12) or careers:
                raise Invalid('Regular pathway requires a grade from 9 to 12')
        else:
            raise Invalid('Unknown program')
        with self.db:
            self.db.execute('INSERT INTO intake_details VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET country=excluded.country,dob=excluded.dob,pathway=excluded.pathway,careers=excluded.careers,grade=excluded.grade,guardian_status=excluded.guardian_status',
                            (actor['id'], country.strip(), dob, pathway, json.dumps(careers), grade, 'required_before_enrollment' if age < 18 else 'not_required'))
            self.s.log(actor['id'], 'account_details_saved:' + pathway, actor['id'])
        return {'next': 'institutional-password-setup', 'guardian_review_required': age < 18}

    def send_code(self, token):
        actor = self.a.actor(token, {'student'})
        contact = self.db.execute('SELECT email,verified_at FROM intake_contacts WHERE owner=?', (actor['id'],)).fetchone()
        if not contact or contact['verified_at']:
            raise Invalid('Unverified applicant required')
        if self.mailer is None:
            raise Invalid('Verification delivery is not connected')
        now = self.a.clock()
        rows = self.db.execute('SELECT created FROM email_challenges WHERE owner=? AND created>? ORDER BY created DESC', (actor['id'], now - 3600)).fetchall()
        if len(rows) >= 5 or (rows and now - rows[0]['created'] < 60):
            raise Invalid('Please wait before requesting another code')
        identifier = secrets.token_urlsafe(24)
        code = f'{secrets.randbelow(1000000):06d}'
        digest = hmac.new(self.secret, (identifier + ':' + code).encode(), hashlib.sha256).hexdigest()
        with self.db:
            self.db.execute('UPDATE email_challenges SET consumed=1 WHERE owner=?', (actor['id'],))
            self.db.execute('INSERT INTO email_challenges(id,owner,digest,created,expires) VALUES(?,?,?,?,?)', (identifier, actor['id'], digest, now, now + 600))
            self.s.log(actor['id'], 'email_verification_requested', identifier)
        try:
            self.mailer(contact['email'], code, identifier)
        except Exception:
            with self.db:
                self.db.execute('UPDATE email_challenges SET consumed=1 WHERE id=?', (identifier,))
            raise Invalid('Verification delivery failed') from None
        return {'challenge': identifier, 'expires_in_seconds': 600}

    def verify(self, token, identifier, code):
        actor = self.a.actor(token, {'student'})
        row = self.db.execute('SELECT * FROM email_challenges WHERE id=?', (identifier,)).fetchone()
        if not row or row['owner'] != actor['id'] or row['consumed'] or row['attempts'] >= 5 or row['expires'] <= self.a.clock():
            raise Denied('Invalid or expired verification code')
        if not isinstance(code, str) or not re.fullmatch(r'\d{6}', code):
            valid = False
        else:
            digest = hmac.new(self.secret, (identifier + ':' + code).encode(), hashlib.sha256).hexdigest()
            valid = hmac.compare_digest(digest, row['digest'])
        with self.db:
            self.db.execute('UPDATE email_challenges SET attempts=attempts+1 WHERE id=?', (identifier,))
            if valid:
                self.db.execute('UPDATE email_challenges SET consumed=1 WHERE id=?', (identifier,))
                self.db.execute('UPDATE intake_contacts SET verified_at=? WHERE owner=?', (self.a.s_now(), actor['id']))
                self.s.log(actor['id'], 'email_verified_portal_available', actor['id'])
        if not valid:
            raise Denied('Invalid or expired verification code')
        return {'portal_access': True, 'course_enrollment': False, 'application_fee_minor': 10000}

    def portal(self, token):
        actor = self.a.actor(token, {'student'})
        if not self.a.email_verified(actor['id']):
            raise Denied('Email verification required')
        return {'welcome': "Great news! You're taking the next step, and Emanon Institute is excited to have you on board. Let's get started!",
                'fee_label': 'Application fee', 'fee_minor': 10000,
                'processing_fee_minor': None, 'payment_provider_ready': False,
                'course_enrollment': False, 'financial_assistance_available': True}

    def submit_for_review(self, token, cohort, assistance='none'):
        import json
        actor = self.a.actor(token, {'student'})
        if not self.a.email_verified(actor['id']):
            raise Denied('Email verification required')
        detail = self.db.execute('SELECT * FROM intake_details WHERE owner=?', (actor['id'],)).fetchone()
        if not detail:
            raise Invalid('Account details required')
        program = json.loads(detail['careers'])[0] if detail['pathway'] == 'adult' else 'Regular High School — Grade ' + str(detail['grade'])
        return self.a.submit(token, cohort=cohort, program=program, dob=detail['dob'], background='Academic documents requested during review', country=detail['country'], assistance=assistance, consent_version='PRIVACY-2026-10-12', consent=True, pathway=detail['pathway'])

    def record_guardian_review(self, token, student_owner, evidence):
        actor = self.a.actor(token, {'director'})
        row = self.db.execute('SELECT guardian_status FROM intake_details WHERE owner=?', (student_owner,)).fetchone()
        if not row or row['guardian_status'] != 'required_before_enrollment' or not isinstance(evidence, str) or not evidence.strip():
            raise Invalid('Verified guardian consent evidence required')
        with self.db:
            self.db.execute("UPDATE intake_details SET guardian_status='approved' WHERE owner=?", (student_owner,))
            self.s.log(actor['id'], 'guardian_consent_review_approved:' + evidence, student_owner)
