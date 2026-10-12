import tempfile
import unittest
from pathlib import Path
from admissions import Admissions
from document_scanner import SyntheticFixtureScanner
from intake import Intake
from service import Service, Denied, Invalid


class IntakeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.s = Service(Path(self.tmp.name) / 'db.sqlite')
        self.student = self.s.fixture('student', 'student')
        self.other = self.s.fixture('other', 'student')
        self.director = self.s.fixture('director', 'director')
        self.finance = self.s.fixture('finance', 'finance')
        self.now = 1791784800.0
        self.a = Admissions(self.s, Path(self.tmp.name) / 'private', lambda: self.now, scanner=SyntheticFixtureScanner())
        self.messages = []
        self.i = Intake(self.a, lambda email, code, identifier: self.messages.append(code))
        self.i.apply(self.student, 'Synthetic', 'Student', 'student@example.invalid', True)

    def tearDown(self):
        self.s.db.close()
        self.tmp.cleanup()

    def verified(self):
        request = self.i.send_code(self.student)
        return self.i.verify(self.student, request['challenge'], self.messages[-1])

    def adult(self):
        return self.i.details(self.student, 'Haiti', '1990-01-01', 'adult', ['Computer Science', 'Education', 'General Studies'])

    def test_adult_three_ranked_choices(self):
        self.assertFalse(self.adult()['guardian_review_required'])
        for choices in (['Computer Science'], ['Law', 'Law', 'Education'], ['Law', 'Education', 'Unknown']):
            with self.assertRaises(Invalid):
                self.i.details(self.student, 'Haiti', '1990-01-01', 'adult', choices)
        with self.assertRaises(Invalid):
            self.i.details(self.student, 'Haiti', '2010-01-01', 'adult', ['Law', 'Education', 'General Studies'])

    def test_regular_grade_and_guardian_requirement(self):
        self.assertTrue(self.i.details(self.student, 'Haiti', '2010-01-01', 'regular', grade=10)['guardian_review_required'])
        for grade in (8, 13, '10'):
            with self.assertRaises(Invalid):
                self.i.details(self.student, 'Haiti', '2010-01-01', 'regular', grade=grade)
        with self.assertRaises(Invalid):
            self.i.details(self.student, 'Haiti', '2010-01-01', 'regular', ['Law', 'Education', 'General Studies'], 10)

    def test_code_single_use_portal_not_course_access(self):
        request = self.i.send_code(self.student)
        code = self.messages[-1]
        with self.assertRaises(Denied):
            self.i.verify(self.other, request['challenge'], code)
        result = self.i.verify(self.student, request['challenge'], code)
        self.assertTrue(result['portal_access'])
        self.assertFalse(result['course_enrollment'])
        with self.assertRaises(Denied):
            self.i.verify(self.student, request['challenge'], code)
        self.assertEqual(self.i.portal(self.student)['fee_label'], 'Application fee')

    def test_code_expiry_attempt_limit_and_resend(self):
        request = self.i.send_code(self.student)
        with self.assertRaises(Invalid):
            self.i.send_code(self.student)
        for _ in range(5):
            with self.assertRaises(Denied):
                self.i.verify(self.student, request['challenge'], 'wrong')
        with self.assertRaises(Denied):
            self.i.verify(self.student, request['challenge'], self.messages[-1])
        self.now += 61
        request = self.i.send_code(self.student)
        code = self.messages[-1]
        self.now += 601
        with self.assertRaises(Denied):
            self.i.verify(self.student, request['challenge'], code)

    def test_unverified_cannot_pay_or_open_portal(self):
        self.adult()
        with self.assertRaises(Denied):
            self.i.portal(self.student)
        app = self.a.submit(self.student, cohort='demo', program='Computer Science', dob='1990-01-01', background='Pending records', country='Haiti', assistance='none', consent_version='demo', consent=True)
        with self.assertRaises(Invalid):
            self.a.open_semester(self.director, app, 1)
        self.verified()
        obligation = self.a.open_semester(self.director, app, 1)
        request = self.a.request_payment(self.finance, obligation)
        self.assertEqual(request['amount_minor'], 10000)
        with self.assertRaises(Invalid):
            self.a.activate(self.director, obligation)

    def test_delivery_failure_consumes_challenge_and_never_verifies(self):
        self.i.mailer = None
        with self.assertRaises(Invalid):
            self.i.send_code(self.student)
        def failing_mailer(*args):
            raise RuntimeError('provider error')
        self.i.mailer = failing_mailer
        with self.assertRaises(Invalid):
            self.i.send_code(self.student)
        row = self.s.db.execute('SELECT consumed,digest FROM email_challenges').fetchone()
        self.assertEqual(row['consumed'], 1)
        self.assertEqual(len(row['digest']), 64)
        self.assertFalse(self.a.email_verified('student'))

    def test_regular_review_record_and_guardian_gate(self):
        self.i.details(self.student, 'Haiti', '2010-01-01', 'regular', grade=10)
        self.verified()
        app = self.i.submit_for_review(self.student, 'demo', 'full')
        for kind in ('identity', 'academic'):
            self.a.upload(self.student, app, kind, b'%PDF-1.4 synthetic')
        self.a.review(self.director, app, accepted=True, age_verified=True, academics_verified=True, documents_verified=True, program_verified=True, evidence='Synthetic review')
        obligation = self.a.open_semester(self.director, app, 1)
        self.a.award(self.finance, obligation, 'waiver', 10000, 'Synthetic waiver')
        with self.assertRaises(Invalid):
            self.a.activate(self.director, obligation)
        with self.assertRaises(Denied):
            self.i.record_guardian_review(self.student, 'student', 'self consent')
        self.i.record_guardian_review(self.director, 'student', 'Synthetic verified guardian consent record')
        self.a.activate(self.director, obligation)


if __name__ == '__main__':
    unittest.main()
