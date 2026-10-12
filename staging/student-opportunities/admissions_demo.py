"""Run an entirely synthetic free-application-to-enrollment demonstration."""
import hashlib
import hmac
import json
import tempfile
from pathlib import Path
from admissions import Admissions, POLICY
from service import Service, Invalid
from document_scanner import SyntheticFixtureScanner


def run():
    with tempfile.TemporaryDirectory(prefix='emanon-admissions-demo-') as folder:
        service = Service(Path(folder) / 'demo.sqlite')
        try:
            student = service.fixture('synthetic-student', 'student')
            reviewer = service.fixture('synthetic-reviewer', 'reviewer')
            finance = service.fixture('synthetic-finance', 'finance')
            director = service.fixture('synthetic-director', 'director')
            admissions = Admissions(service, Path(folder) / 'private', scanner=SyntheticFixtureScanner())
            app = admissions.submit(student, cohort='DEMO', program='Computer Technology', dob='1995-01-01', background='Synthetic academic background', country='Haiti', assistance='partial', consent_version='APPLICATION-PRIVACY-2026-10-11', consent=True)
            steps = [{'step': 'Application submitted', 'charge_usd': 0, 'state': admissions.private(student, app)['state']}]
            for kind in ('identity', 'academic'):
                admissions.upload(student, app, kind, ('%PDF-1.4 SYNTHETIC ' + kind).encode())
            admissions.review(reviewer, app, accepted=True, age_verified=True, academics_verified=True, documents_verified=True, program_verified=True, evidence='Synthetic review evidence')
            steps.append({'step': 'Academic review completed', 'state': admissions.private(student, app)['state']})
            semester = admissions.open_semester(director, app, 1)
            admissions.award(finance, semester, 'assistance', 6000, 'Approved synthetic $60 award')
            request = admissions.request_payment(finance, semester)
            steps.append({'step': 'Semester 1 fee and assistance', 'fee_usd': 100, 'approved_assistance_usd': 60, 'remaining_payment_usd': request['amount_minor'] / 100})
            try:
                admissions.activate(director, semester)
            except Invalid:
                steps.append({'step': 'Pending payment', 'enrollment_activation': 'blocked'})
            event = json.dumps(dict(id='synthetic-event', request=request['id'], account='EMANON-SYNTHETIC-TEST', currency='usd', amount=request['amount_minor'], state='confirmed')).encode()
            admissions.provider_event(event, hmac.new(service.webhook_secret, event, hashlib.sha256).hexdigest())
            admissions.activate(director, semester)
            steps.append({'step': 'Synthetic payment confirmed', 'receipt_usd': admissions.receipt(student, request['id'])['amount'] / 100, 'enrollment_decision': 'active'})
            second = admissions.open_semester(director, app, 2)
            steps.append({'step': 'Semester 2 separately opened', 'fee_usd': admissions.balance(second) / 100, 'automatic_charge': False})
            admissions.award(finance, second, 'waiver', 10000, 'Authorized synthetic Semester 2 waiver')
            admissions.activate(director, second)
            steps.append({'step': 'Semester 2 waiver approved', 'remaining_payment_usd': admissions.balance(second) / 100, 'enrollment_decision': 'active'})
            return {'demonstration_only': True, 'live_payments': False, 'policy': POLICY, 'steps': steps}
        finally:
            service.db.close()


if __name__ == '__main__':
    print(json.dumps(run(), indent=2))
