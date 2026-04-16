# Security Policy

## Supported versions

Security fixes are primarily shipped on the latest active release line.
If you report a vulnerability, include the exact version and install method (`npm`, `npx`, source).

## Reporting a vulnerability

Please do not open public issues for undisclosed vulnerabilities.

Report privately via:

- Email: `security@t0lab.dev`

Include:

- Affected version and environment
- Reproduction steps or proof of concept
- Impact assessment (what an attacker can do)
- Suggested mitigation (optional)

You should receive an acknowledgement within 3 business days.

## Disclosure process

1. We acknowledge and triage the report.
2. We validate impact and severity.
3. We prepare and test a fix.
4. We publish a patched release and update `CHANGELOG.md`.
5. We disclose details after users have reasonable upgrade time.

## Safe harbor

We support good-faith security research.
Do not exfiltrate data, degrade service, or access accounts/resources you do not own.

## Scope notes

The project includes scaffolding templates and generated artifacts.
When reporting, specify whether the issue is in:

- CLI runtime (`packages/harness-kit/`)
- Shared package (`packages/core/`)
- Generated template/artifact content
