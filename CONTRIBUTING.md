# Contributing to NullKey

Thank you for your interest in contributing to NullKey! This document outlines the guidelines for contributing to this privacy-focused anonymous chat application.

## Security-First Philosophy

NullKey prioritizes user privacy and security above all else. When contributing:

- Never add features that compromise user anonymity
- Follow the threat model outlined in `docs/threat-model.md`
- Ensure no plaintext data is stored on the server
- Maintain minimal metadata exposure
- Follow the cryptographic design in `docs/crypto-design.md`

## Rules

- No feature requests that weaken privacy
- No telemetry, tracking, or analytics
- No user identification features
- No persistent account systems
- No plaintext data storage on server
- Follow the MVP specification in `mvp.md`

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/NullKey.git`
3. Navigate to project directory: `cd NullKey`
4. Install dependencies:
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`

## Code Style

- Follow the existing code style in the project
- Use consistent formatting and meaningful variable names
- Maintain the separation between client-side crypto and server-side relay
- Document any security-relevant decisions

## Testing

Make sure to test your changes thoroughly before submitting a pull request. Pay special attention to:
- End-to-end encryption functionality
- Message delivery and receipt
- Room creation and joining
- Security boundaries between server and client

## Pull Requests

- One feature per PR
- Clear explanation required
- Security impact must be documented
- Follow the architecture described in `docs/architecture.md`
- Reference the relevant sections of the MVP specification if applicable
- Ensure no plaintext data is exposed to the server

## MVP Scope

This project currently implements the MVP features defined in `mvp.md`. Please ensure your contributions align with the current scope and do not add features outside of the defined MVP requirements unless explicitly discussed in an issue first.

By contributing, you agree your code is licensed under AGPL‑3.0.