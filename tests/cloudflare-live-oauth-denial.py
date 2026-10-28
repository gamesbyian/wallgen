#!/usr/bin/env python3
"""Live, *denial-only* Cloudflare OAuth test. Never authenticates a GitHub user."""
import base64
import hashlib
import http.cookiejar
import html
import json
import re
import subprocess
import tempfile
import os
import urllib.parse

ISSUER = "https://roygbiv-auth.gamesbyian-roygbiv.workers.dev"
RESOURCE = "https://roygbiv-mcp.gamesbyian-roygbiv.workers.dev/mcp"
REDIRECT = "http://127.0.0.1:19232/roygbiv-test"

class CurlSession:
    def __init__(self):
        self.dir = tempfile.TemporaryDirectory()
        self.cookie = os.path.join(self.dir.name, "cookies.txt")
        self.headers = os.path.join(self.dir.name, "headers.txt")
        self.body = os.path.join(self.dir.name, "response.txt")

def request(client, url, *, data=None, headers=None):
    args = [
        "curl", "--silent", "--show-error", "--max-time", "20",
        "--cookie", client.cookie, "--cookie-jar", client.cookie,
        "--dump-header", client.headers, "--output", client.body,
        "--write-out", "%{http_code}"
    ]
    for k, v in (headers or {}).items():
        args.extend(["-H", f"{k}: {v}"])
    if data is not None:
        args.extend(["--request", "POST", "--data-binary", "@-"])
    args.append(url)
    result = subprocess.run(args, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    status = int(result.stdout.decode())
    raw_headers = open(client.headers, encoding="utf-8").read()
    # We don't follow redirects: only the final response block matters.
    import email
    blocks = [block for block in re.split(r"\r?\n\r?\n", raw_headers) if block.strip()]
    hdr = email.message_from_string("\n".join(blocks[-1].splitlines()[1:]))
    body = open(client.body, encoding="utf-8").read()
    return status, hdr, body

def main():
    client = CurlSession()
    registration = {
        "client_name": "ROYGBIV One-Shot Security Proof",
        "redirect_uris": [REDIRECT],
        "token_endpoint_auth_method": "none",
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
    }
    status, _, body = request(
        client, ISSUER + "/oauth/register",
        data=json.dumps(registration).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    assert status in (200, 201), f"Dynamic registration status {status}: {body[:300]}"
    info = json.loads(body)
    client_id = info["client_id"]
    verifier = "roygbiv-live-security-proof-code-verifier-" + "a" * 48
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    params = {
        "client_id": client_id, "redirect_uri": REDIRECT,
        "response_type": "code", "scope": "wallpaper:read",
        "resource": RESOURCE, "code_challenge": challenge,
        "code_challenge_method": "S256",
        "state": "roygbiv-security-proof",
    }
    url = ISSUER + "/authorize?" + urllib.parse.urlencode(params)
    status, _, body = request(client, url)
    assert status == 200, f"Consent status {status}: {body[:300]}"
    assert "ROYGBIV One-Shot Security Proof" in body
    assert "wallpaper:read" in body
    assert "127.0.0.1" in body
    match = re.search(r'<input type="hidden" name="handle" value="([^"]+)"', body)
    assert match is not None, "Consent form did not carry browser-bound handle"
    handle = html.unescape(match.group(1))
    # Explicit consent denial: must send no GitHub login, no authorization code.
    status, headers, body = request(client, ISSUER + "/authorize",
        data=urllib.parse.urlencode({"handle": handle, "decision": "deny"}).encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert status == 302, f"Denial returned {status}: {body[:300]}"
    redirected = urllib.parse.urlsplit(headers["Location"])
    print(f"Consent denial returned redirect host: {redirected.hostname!r}; scheme={redirected.scheme!r}; path={redirected.path!r}")
    assert redirected.hostname == "127.0.0.1"
    q = urllib.parse.parse_qs(redirected.query)
    assert q.get("error") == ["access_denied"], q
    assert q.get("state") == ["roygbiv-security-proof"], q
    assert q.get("iss") == [ISSUER], q
    assert "code" not in q
    print("PASS: DCR, PKCE consent page, browser-bound state, explicit denial, issuer and no code issuance")

    # New authorization transaction: stolen handle must fail without the
    # matching browser-bound cookie. This does not mint any access token.
    status, _, consent_body = request(client, url)
    assert status == 200, f"Second consent GET {status}"
    match = re.search(r'<input type="hidden" name="handle" value="([^"]+)"', consent_body)
    assert match
    new_handle = html.unescape(match.group(1))
    approval_data = urllib.parse.urlencode({
        "handle": new_handle, "decision": "approve", "scope": "wallpaper:read"
    }).encode()
    status, _, _ = request(CurlSession(), ISSUER + "/authorize",
        data=approval_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert status == 400, f"Consent without browser cookie unexpectedly returned {status}"
    status, headers, _ = request(client, ISSUER + "/authorize",
        data=approval_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert status == 302, f"Approved consent returned {status}"
    redirect = urllib.parse.urlsplit(headers["Location"])
    assert redirect.scheme == "https" and redirect.hostname == "github.com"
    assert redirect.path == "/login/oauth/authorize"
    github_params = urllib.parse.parse_qs(redirect.query)
    assert github_params.get("client_id") == ["Ov23liZNOeOxpR5AeDc3"]
    assert github_params.get("redirect_uri") == [ISSUER + "/callback"]
    assert github_params.get("code_challenge_method") == ["S256"]
    assert github_params.get("state")
    # Deliberately do not visit GitHub or sign anyone in.
    print("PASS: forged approval rejected, browser-bound approval redirects to GitHub OAuth with PKCE")

if __name__ == "__main__":
    main()
