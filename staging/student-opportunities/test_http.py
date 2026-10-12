"""Exercise the real loopback HTTP process with synthetic fixtures only."""
import subprocess
import sys
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from pypdf import PdfReader
from io import BytesIO


class HTTPTests(unittest.TestCase):
    def test_profile_documents_and_unknown_profile(self):
        process = subprocess.Popen(
            [sys.executable, "demo.py"], cwd=Path(__file__).parent,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        )
        try:
            self.assertIn("Synthetic local demo", process.stdout.readline())
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            origin = "http://127.0.0.1:8765"
            for path in ("/", "/apply", "/support-student/IES-S-000001", "/demo-qr.svg"):
                with opener.open(origin + path, timeout=5) as response:
                    self.assertEqual(response.status, 200)
                    self.assertEqual(response.headers["Cache-Control"], "no-store")
                    self.assertTrue(response.read())
                    if path == '/apply':
                        self.assertIn("form-action 'none'", response.headers['Content-Security-Policy'])
                        self.assertNotIn('unsafe-inline', response.headers['Content-Security-Policy'])
            with opener.open(origin + "/demo-letter.pdf", timeout=5) as response:
                pdf = PdfReader(BytesIO(response.read()))
                self.assertEqual(len(pdf.pages), 1)
                links = [a.get_object()["/A"]["/URI"] for a in pdf.pages[0]["/Annots"]]
                self.assertEqual(links, [origin + "/support-student/IES-S-000001"])
            with self.assertRaises(urllib.error.HTTPError) as error:
                opener.open(origin + "/support-student/IES-S-999999", timeout=5)
            self.assertEqual(error.exception.code, 404)
        finally:
            process.terminate()
            process.communicate(timeout=5)


if __name__ == "__main__":
    unittest.main()
