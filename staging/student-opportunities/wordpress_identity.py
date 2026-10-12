"""Staging-only WordPress current-user adapter; never creates WP accounts."""
import json
import ssl
import urllib.error
import urllib.parse
import urllib.request
from service import Denied


class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise Denied('Identity endpoint redirected; credentials were not forwarded')


class WordPressIdentity:
    def __init__(self, staging_origin, issuer_id, transport=None):
        origin = urllib.parse.urlsplit(staging_origin)
        if origin.scheme != 'https' or not origin.hostname or origin.username or origin.password or origin.query or origin.fragment or origin.path not in ('', '/'):
            raise ValueError('An exact HTTPS staging origin is required')
        # This adapter is intentionally unavailable for known production origins.
        if origin.hostname.lower() in {'emanoninstitute.org', 'www.emanoninstitute.org', 'epew.us', 'www.epew.us'}:
            raise ValueError('Production identity origin is prohibited in this staging adapter')
        if not issuer_id or not isinstance(issuer_id, str):
            raise ValueError('Stable staging WordPress issuer ID is required')
        self.origin = staging_origin.rstrip('/')
        self.issuer = issuer_id
        self.transport = transport or self._fetch

    def _fetch(self, url, headers):
        opener = urllib.request.build_opener(NoRedirects(), urllib.request.HTTPSHandler(context=ssl.create_default_context()))
        try:
            with opener.open(urllib.request.Request(url, headers=headers), timeout=10) as response:
                if response.status != 200 or response.headers.get_content_type() != 'application/json':
                    raise Denied('WordPress authentication failed')
                data = response.read(65537)
                if len(data) > 65536:
                    raise Denied('Unexpected identity response size')
                return json.loads(data)
        except (urllib.error.URLError, json.JSONDecodeError):
            raise Denied('WordPress authentication unavailable') from None

    def resolve(self, cookie, rest_nonce):
        # Values come from the applicant's authenticated server request; never log,
        # persist or request these values in chat. No shared admin app password.
        if not all(isinstance(value, str) and value and len(value) <= 16384 and '\n' not in value and '\r' not in value for value in (cookie, rest_nonce)):
            raise Denied('Authenticated WordPress session required')
        data = self.transport(self.origin + '/wp-json/wp/v2/users/me?_fields=id', {'Cookie': cookie, 'X-WP-Nonce': rest_nonce, 'Accept': 'application/json'})
        identifier = data.get('id') if isinstance(data, dict) else None
        if type(identifier) is not int or identifier <= 0:
            raise Denied('No authenticated WordPress identity')
        # This tuple maps uniquely to an application reference, never grants staff
        # roles, and never uses a client-supplied user ID/email as identity proof.
        return {'organization': 'EMANON', 'source': 'wordpress', 'issuer': self.issuer, 'source_id': str(identifier)}
