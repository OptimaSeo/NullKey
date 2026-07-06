# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in NullKey, please report it privately.

**Do not** open a public GitHub issue. Instead, send an email to:

**nullkey@optimaseo.id**

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

## Scope

The following are in scope:
- Cryptographic weaknesses in the encryption scheme (X25519 / AES-256-GCM / HKDF usage)
- Side-channel or timing attacks on the WebCrypto implementation
- Server-side vulnerabilities that could leak plaintext or keys
- Authentication or authorisation bypass in room access
- Replay or injection attacks

The following are out of scope:
- Compromised client devices (malware, keyloggers)
- Social engineering attacks
- Screen capture or physical device access
- ISP-level traffic correlation

## Disclosure Policy

- We will notify you once the vulnerability is confirmed.
- A fix will be developed and tested privately.
- Once the fix is released, we will publish an advisory with credit to the reporter (unless anonymity is requested).
- We ask for a 90-day disclosure window from the date of the first response.
