# NullKey Threat Model

## Overview
This document outlines the threat model for NullKey, detailing security assumptions, prevented threats, and acknowledged but unmitigated threats.

## Security Goals

### Primary Goals
- **Anonymity**: Prevent correlation of user identities with chat content
- **Confidentiality**: Ensure only intended recipients can read messages
- **Integrity**: Prevent message tampering during transit
- **Ephemerality**: Automatically delete data after a set period

## Assumptions

### Trust Boundaries
- **Client Device**: Fully trusted — assumed to be uncompromised
- **Server**: Semi-trusted — may be compromised but must not reveal message content
- **Network**: Untrusted — vulnerable to passive and active attacks

### Adversary Capabilities
- Can observe network traffic
- Can compromise the server
- Can perform traffic analysis
- Has significant computational resources

## Prevented Threats

### Against Server Operators
- **Curious Administrator**: Server cannot access message content due to end-to-end encryption
- **Database Compromise**: No persistent user data or message history stored on the server
- **Metadata Analysis**: Minimal metadata stored on the server

### Against Network Observers
- **Passive Monitoring**: All messages are end-to-end encrypted, preventing content inspection
- **Traffic Correlation**: Limited protection against sophisticated correlation analysis
- **Timing Analysis**: Basic protection through potential message batching

### Against Other Users
- **Malicious Participant**: Cannot impersonate other users due to public key verification
- **Message Tampering**: Integrity protected by authenticated encryption
- **Metadata Disclosure**: Limited to room membership and timing

## Acknowledged Limitations

### Against Client Compromise
- **Device Compromise**: If the client device is compromised, all keys and local data are accessible
- **Malware**: Local malware can capture plaintext before encryption or after decryption
- **Physical Access**: Unauthorized physical access to the device reveals all data

### Against Traffic Analysis
- **ISP-Level Correlation**: Sophisticated adversaries may correlate connections based on timing/patterns
- **Connection Timing**: Metadata about when users connect/disconnect may be observable
- **Volume Analysis**: Message volume patterns may reveal information

### Against Social Engineering
- **Phishing Attacks**: Users may be tricked into revealing room secrets or invite tokens
- **Impersonation**: Adversaries may impersonate trusted contacts outside the platform
- **Coercion**: Users may be forced to disclose information under duress

## Mitigations

### Implemented
- End-to-end encryption with X25519/AES-256-GCM
- Minimal server-side data retention
- Automatic room and message expiration
- Secure client-side key generation and storage
- One-time invite tokens for room joining (room secret never sent to server)
- Public key fingerprint verification via invite link (MITM prevention)

### Not Yet Implemented (Future)
- Advanced traffic obfuscation
- Post-compromise security measures
- Advanced anonymity protocols (e.g., mix networks)

## Risk Assessment

### High Risk
- Client device compromise (mitigation: user education, secure device practices)
- Social engineering attacks (mitigation: user awareness, verification mechanisms)

### Medium Risk
- Traffic correlation by sophisticated adversaries (mitigation: message padding, cover traffic)
- Side-channel attacks on client devices (mitigation: secure implementation practices)

### Low Risk
- Curious server operators (prevented by E2EE)
- Database breaches (prevented by lack of stored data)
- Passive network monitoring (prevented by E2EE)

## Compliance and Ethics

### Transparency
- Clear communication of security limitations to users
- Honest representation of anonymity capabilities
- Disclosure of data handling practices

### Responsible Use
- Explicit disavowal of illegal activity
- Clear terms of service
- User accountability for misuse
