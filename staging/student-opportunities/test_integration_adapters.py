import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from document_scanner import ClamAVScanner, ScanRejected, SyntheticFixtureScanner
from wordpress_identity import WordPressIdentity, NoRedirects
from service import Denied, Invalid, Service
from admissions import Admissions


class AdapterTests(unittest.TestCase):
    def test_identity_resolved_from_wordpress_me_not_email(self):
        seen = []
        def transport(url, headers):
            seen.append((url, headers))
            return {'id': 42, 'email': 'ignored@example.invalid', 'roles': ['administrator']}
        adapter = WordPressIdentity('https://staging.example.invalid', 'synthetic-staging-instance', transport)
        identity = adapter.resolve('synthetic-cookie', 'synthetic-nonce')
        self.assertEqual(identity['source_id'], '42')
        self.assertNotIn('roles', identity)
        self.assertNotIn('email', identity)
        self.assertTrue(seen[0][0].endswith('/wp-json/wp/v2/users/me?_fields=id'))

    def test_identity_rejects_unknown_session_and_production_origin(self):
        for origin in ('http://example.invalid', 'https://emanoninstitute.org', 'https://user:pass@example.invalid', 'https://example.invalid/path'):
            with self.assertRaises(ValueError):
                WordPressIdentity(origin, 'staging')
        adapter = WordPressIdentity('https://staging.example.invalid', 'staging', lambda url, headers: {'id': 0})
        for cookie, nonce in [('', 'nonce'), ('cookie', ''), ('cookie\r\ninject', 'nonce'), ('cookie', 'nonce')]:
            with self.assertRaises(Denied):
                adapter.resolve(cookie, nonce)

    def test_identity_redirect_denied(self):
        with self.assertRaises(Denied):
            NoRedirects().redirect_request(None, None, 302, '', {}, 'https://other.example.invalid')

    def test_scanner_clean_result(self):
        with patch('document_scanner.subprocess.run', return_value=subprocess.CompletedProcess([], 0)) as runner:
            ClamAVScanner().scan(Path('/private/generated-file'))
            self.assertFalse(runner.call_args.kwargs.get('shell', False))
            self.assertEqual(runner.call_args.kwargs['timeout'], 30)

    def test_scanner_infected_error_missing_and_timeout_reject(self):
        for code in (1, 2, -9):
            with patch('document_scanner.subprocess.run', return_value=subprocess.CompletedProcess([], code)):
                with self.assertRaises(ScanRejected):
                    ClamAVScanner().scan(Path('/private/file'))
        for error in (FileNotFoundError(), subprocess.TimeoutExpired('clamdscan', 30)):
            with patch('document_scanner.subprocess.run', side_effect=error):
                with self.assertRaises(ScanRejected):
                    ClamAVScanner().scan(Path('/private/file'))

    def test_upload_unavailable_scanner_releases_nothing(self):
        with tempfile.TemporaryDirectory() as folder:
            service = Service(Path(folder) / 'db.sqlite')
            try:
                student = service.fixture('synthetic-student', 'student')
                admissions = Admissions(service, Path(folder) / 'private')
                app = admissions.submit(student, cohort='demo', program='demo', dob='1990-01-01', background='demo', country='Haiti', assistance='full', consent_version='demo', consent=True)
                with self.assertRaises(Invalid):
                    admissions.upload(student, app, 'identity', b'%PDF-1.4 synthetic')
                self.assertEqual(service.db.execute('SELECT COUNT(*) FROM admission_documents').fetchone()[0], 0)
                self.assertEqual(list(admissions.vault.iterdir()), [])
            finally:
                service.db.close()

    def test_synthetic_scanner_cannot_accept_real_documents(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'fixture'
            path.write_bytes(b'%PDF-1.4 ordinary document')
            with self.assertRaises(ScanRejected):
                SyntheticFixtureScanner().scan(path)
            path.write_bytes(b'%PDF-1.4 synthetic EICAR')
            with self.assertRaises(ScanRejected):
                SyntheticFixtureScanner().scan(path)


if __name__ == '__main__':
    unittest.main()
