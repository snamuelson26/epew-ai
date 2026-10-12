"""Private-upload scanner adapter. Missing scanner/errors reject release."""
import subprocess


class ScanRejected(Exception):
    pass


class UnavailableScanner:
    def scan(self, path):
        raise ScanRejected('Document scanner is unavailable; release denied')


class ClamAVScanner:
    """Requires a host-installed scanner and current signatures.

    Use on isolated staging first. No shell, user-selected executable or public
    file URLs. `path` must be a server-generated quarantine path.
    """
    def scan(self, path):
        try:
            result = subprocess.run(
                ['clamdscan', '--no-summary', '--fdpass', str(path)],
                stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL, timeout=30, check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            raise ScanRejected('Scanner failed; release denied') from None
        if result.returncode != 0:
            raise ScanRejected('Document not cleared by scanner')


class SyntheticFixtureScanner:
    """Only for explicit synthetic demos/tests. NEVER configure for real intake."""
    def scan(self, path):
        data = path.read_bytes()
        if b'synthetic' not in data.lower() or b'EICAR' in data:
            raise ScanRejected('Not an allowed synthetic fixture')
