import hashlib
import hmac
import json
import tempfile
import unittest
from pathlib import Path
from admissions import Admissions, POLICY
from service import Service, Denied, Invalid
from document_scanner import SyntheticFixtureScanner


class AdmissionsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.s = Service(Path(self.tmp.name) / 'test.sqlite')
        self.student = self.s.fixture('student', 'student')
        self.other = self.s.fixture('other', 'student')
        self.reviewer = self.s.fixture('reviewer', 'reviewer')
        self.finance = self.s.fixture('finance', 'finance')
        self.director = self.s.fixture('director', 'director')
        self.now = 1791705600.0
        self.a = Admissions(self.s, Path(self.tmp.name) / 'private', lambda: self.now, scanner=SyntheticFixtureScanner())
        self.payload = dict(cohort='2027-first', program='Computer Technology', dob='1995-01-01', background='Grade 10', country='Haiti', assistance='partial', consent_version='APPLICATION-PRIVACY-2026-10-11', consent=True)
        self.app = self.a.submit(self.student, **self.payload)

    def tearDown(self):
        self.s.db.close()
        self.tmp.cleanup()

    def accepted(self):
        self.a.upload(self.student, self.app, 'identity', b'%PDF-1.4 synthetic identity')
        self.a.upload(self.student, self.app, 'academic', b'%PDF-1.4 synthetic academic')
        self.a.review(self.reviewer, self.app, accepted=True, age_verified=True, academics_verified=True, documents_verified=True, program_verified=True, evidence='Synthetic academic review')
        return self.a.open_semester(self.director, self.app, 1)

    def event(self, request, state='confirmed', event_id='event-1', **overrides):
        event = dict(id=event_id, request=request['id'], account='EMANON-SYNTHETIC-TEST', currency='usd', amount=request['amount_minor'], state=state)
        event.update(overrides)
        body = json.dumps(event).encode()
        self.a.provider_event(body, hmac.new(self.s.webhook_secret, body, hashlib.sha256).hexdigest())

    def test_policy_preserves_fees(self):
        self.assertEqual(POLICY['application'], 0)
        self.assertEqual(POLICY['semester_1'], 10000)
        self.assertEqual(POLICY['semester_2'], 10000)
        self.assertEqual(POLICY['tuition'], 0)
        self.assertEqual(POLICY['exam_per_course_per_semester'], 2500)
        self.assertEqual(POLICY['graduation_when_applicable'], 10000)

    def test_staging_form_has_no_initial_payment_or_auto_enrollment(self):
        template = json.loads((Path(__file__).parent / 'free-application-form.json').read_text())
        form = template['form']
        self.assertTrue(template['stage_only'])
        self.assertFalse(template['production_authorized'])
        self.assertEqual(form['payments'], {})
        self.assertFalse(any(field['type'].startswith(('payment-', 'stripe-')) for field in form['fields'].values()))
        self.assertEqual(form['settings']['submit_text'], 'Submit Free Application')
        self.assertEqual(form['fields']['15']['media_library'], '0')
        self.assertEqual(form['fields']['40']['required'], '1')
        self.assertEqual(form['settings']['registration_enable'], '0')

    def test_complete_demonstration(self):
        from admissions_demo import run
        result = run()
        self.assertFalse(result['live_payments'])
        self.assertEqual(result['steps'][0]['charge_usd'], 0)
        self.assertEqual(result['steps'][3]['enrollment_activation'], 'blocked')
        self.assertEqual(result['steps'][-1]['enrollment_decision'], 'active')

    def test_free_submission_no_charge_no_duplicate_identity(self):
        self.assertEqual(self.s.db.execute('SELECT COUNT(*) FROM payment_requests').fetchone()[0], 0)
        self.assertEqual(self.s.db.execute('SELECT COUNT(*) FROM identities').fetchone()[0], 5)
        self.assertEqual(self.a.private(self.student, self.app)['state'], 'Submitted')
        self.assertTrue(self.s.db.execute('SELECT COUNT(*) FROM outbox').fetchone()[0])

    def test_duplicate_application_same_student_cohort_rejected(self):
        with self.assertRaises(Exception):
            self.a.submit(self.student, **self.payload)

    def test_consent_and_adult_age_required(self):
        for change in ({'consent': False}, {'dob': '2015-01-01'}, {'dob': 'invalid'}):
            with self.assertRaises(Invalid):
                self.a.submit(self.student, **(self.payload | change))

    def test_international_address_and_assistance(self):
        self.assertEqual(self.a.private(self.student, self.app)['country'], 'Haiti')
        self.assertEqual(self.a.private(self.student, self.app)['assistance'], 'partial')

    def test_private_documents_and_unauthorized_access(self):
        identifier = self.a.upload(self.student, self.app, 'identity', b'%PDF-1.4 synthetic')
        self.assertEqual(self.a.document(self.reviewer, identifier), b'%PDF-1.4 synthetic')
        with self.assertRaises(Denied):
            self.a.document(self.other, identifier)
        with self.assertRaises(Denied):
            self.a.private('invalid', self.app)
        self.assertEqual(self.a.vault.stat().st_mode & 0o777, 0o700)
        for file in self.a.vault.iterdir():
            self.assertEqual(file.stat().st_mode & 0o777, 0o600)
        with self.assertRaises(Invalid):
            self.a.upload(self.student, self.app, 'identity', b'<script>bad</script>')

    def test_no_payment_or_enrollment_before_review(self):
        with self.assertRaises(Invalid):
            self.a.open_semester(self.director, self.app, 1)
        with self.assertRaises(Denied):
            self.a.review(self.student, self.app, accepted=True, age_verified=True, academics_verified=True, documents_verified=True, program_verified=True, evidence='self approval')

    def test_review_requires_documents_and_all_checks(self):
        with self.assertRaises(Invalid):
            self.a.review(self.reviewer, self.app, accepted=True, age_verified=True, academics_verified=True, documents_verified=True, program_verified=True, evidence='missing documents')
        self.a.upload(self.student, self.app, 'identity', b'%PDF-1.4 synthetic')
        self.a.upload(self.student, self.app, 'academic', b'%PDF-1.4 synthetic')
        with self.assertRaises(Invalid):
            self.a.review(self.reviewer, self.app, accepted=True, age_verified=True, academics_verified=False, documents_verified=True, program_verified=True, evidence='failed academics')

    def test_pending_payment_cannot_activate_or_issue_receipt(self):
        obligation = self.accepted()
        request = self.a.request_payment(self.finance, obligation)
        self.assertEqual(self.a.payment_request(self.student, request['token'])['amount_minor'], 10000)
        with self.assertRaises(Invalid):
            self.a.activate(self.director, obligation)
        with self.assertRaises(Invalid):
            self.a.receipt(self.student, request['id'])

    def test_payment_link_bound_to_student_expiring_hash_only(self):
        obligation = self.accepted()
        request = self.a.request_payment(self.finance, obligation, ttl=60)
        with self.assertRaises(Denied):
            self.a.payment_request(self.other, request['token'])
        self.assertNotIn(request['token'], str(self.a.get('payment_requests', request['id'])))
        self.now += 61
        with self.assertRaises(Denied):
            self.a.payment_request(self.student, request['token'])

    def test_paid_enrollment_receipt_and_event_replay(self):
        obligation = self.accepted()
        request = self.a.request_payment(self.finance, obligation)
        self.event(request)
        self.event(request)
        self.a.activate(self.director, obligation)
        self.assertEqual(self.a.balance(obligation), 0)
        self.assertEqual(self.a.receipt(self.student, request['id'])['amount'], 10000)
        self.assertEqual(self.s.db.execute('SELECT COUNT(*) FROM admission_receipts').fetchone()[0], 1)
        self.assertEqual(self.s.db.execute('SELECT state FROM enrollment_decisions').fetchone()[0], 'active')

    def test_full_assistance_sponsorship_and_waiver(self):
        obligation = self.accepted()
        self.a.award(self.finance, obligation, 'waiver', 4000, 'Authorized waiver')
        self.a.award(self.finance, obligation, 'sponsorship', 3000, 'Verified synthetic funding')
        self.a.award(self.finance, obligation, 'assistance', 3000, 'Approved synthetic assistance')
        self.a.activate(self.director, obligation)
        with self.assertRaises(Invalid):
            self.a.request_payment(self.finance, obligation)

    def test_partial_assistance_reduces_payment_and_cancels_stale_request(self):
        obligation = self.accepted()
        stale = self.a.request_payment(self.finance, obligation)
        self.a.award(self.finance, obligation, 'assistance', 6000, 'Approved award')
        with self.assertRaises(Denied):
            self.a.payment_request(self.student, stale['token'])
        request = self.a.request_payment(self.finance, obligation)
        self.assertEqual(request['amount_minor'], 4000)
        self.event(request)
        self.a.activate(self.director, obligation)

    def test_financial_and_enrollment_authority_separated(self):
        obligation = self.accepted()
        with self.assertRaises(Denied):
            self.a.award(self.student, obligation, 'waiver', 10000, 'self waiver')
        with self.assertRaises(Denied):
            self.a.request_payment(self.director, obligation)
        self.a.award(self.finance, obligation, 'waiver', 10000, 'Approved waiver')
        with self.assertRaises(Denied):
            self.a.activate(self.finance, obligation)

    def test_wrong_account_amount_currency_and_signature(self):
        obligation = self.accepted()
        request = self.a.request_payment(self.finance, obligation)
        for change in ({'account': 'EPEW'}, {'amount': 1}, {'currency': 'eur'}):
            with self.assertRaises(Invalid):
                self.event(request, **change)
        with self.assertRaises(Denied):
            self.a.provider_event(b'{}', 'forged')

    def test_refund_places_enrollment_on_hold(self):
        obligation = self.accepted()
        request = self.a.request_payment(self.finance, obligation)
        self.event(request)
        self.a.activate(self.director, obligation)
        self.event(request, 'refunded', 'event-refund')
        self.assertEqual(self.a.balance(obligation), 10000)
        self.assertEqual(self.s.db.execute('SELECT state FROM enrollment_decisions').fetchone()[0], 'financial_hold')
        self.assertEqual(self.a.receipt(self.student, request['id'])['current_payment_state'], 'refunded')

    def test_semester_two_is_separate_not_automatically_charged(self):
        first = self.accepted()
        with self.assertRaises(Invalid):
            self.a.open_semester(self.director, self.app, 2)
        self.a.award(self.finance, first, 'waiver', 10000, 'Semester 1 waiver')
        self.a.activate(self.director, first)
        second = self.a.open_semester(self.director, self.app, 2)
        self.assertEqual(self.a.balance(second), 10000)
        self.assertEqual(self.s.db.execute('SELECT COUNT(*) FROM payment_requests').fetchone()[0], 0)
        with self.assertRaises(Invalid):
            self.a.activate(self.director, second)


if __name__ == '__main__':
    unittest.main(verbosity=2)
