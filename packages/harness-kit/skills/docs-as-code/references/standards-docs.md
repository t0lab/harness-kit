# Standard Project Docs

Use this reference to keep project-level documentation complete for both internal agents and external contributors.

---

## Core standard docs

These files should exist in most maintained repos:

- `docs/product-specs/ROADMAP.md` — upcoming releases/features, priorities, dependencies
- `docs/releases/<version>.md` — release scope, gates, rollout, rollback, owner
- `CHANGELOG.md` — shipped user-facing changes
- `docs/evaluations/<date>-<topic>.md` — post-release learnings, incidents, process feedback
- `CONTRIBUTING.md` — contributor workflow and quality expectations
- `SECURITY.md` — vulnerability disclosure policy
- `SUPPORT.md` — support channels and issue triage expectations
- `.github/CODEOWNERS` — ownership map for review routing

If a file is intentionally omitted, record why in `AGENTS.md` to avoid ambiguity.

---

## What each file must answer

- **Roadmap:** What are we building next and why now?
- **Release plan:** What exactly ships in this version, under what gates?
- **Changelog:** What changed for users/operators?
- **Evaluation:** What did we learn and what will change next?
- **Contributing:** How can external developers contribute safely?
- **Security:** How do researchers report vulnerabilities privately?
- **Support:** Where should users ask for help and what response to expect?
- **Codeowners:** Who must review which parts of the codebase?

---

## Freshness triggers

Update these docs when:

- Roadmap priorities change or release scope is re-cut
- A new version is prepared or shipped
- A process/ownership expectation changes
- Security reporting channel or policy changes
- Support routing or triage windows change

Stale governance docs are operational bugs, not "nice-to-have" debt.
