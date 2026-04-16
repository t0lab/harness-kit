# Coding Workflow (Docs-Coupled)

This workflow keeps implementation and documentation synchronized so agents can resume work without guesswork.

---

## 1) Before coding

Confirm intent and constraints are documented:

- Multi-step work: create/update `docs/exec-plans/active/<initiative>.md`
- Non-trivial decision: write ADR in `docs/design-docs/<topic>.md`
- Release-affecting scope: validate against `docs/product-specs/ROADMAP.md` and `docs/releases/<version>.md` (if present)

Do not start implementation if required context only exists in chat.

---

## 2) During coding

Keep execution docs current:

- Check off completed tasks in active exec plan
- Add decision reversals and tradeoffs to Decisions log
- Track deferred work in `docs/exec-plans/tech-debt-tracker.md`

If scope drifts, update plan first, then continue coding.

---

## 3) Before merge

Perform docs handoff checks:

- `CHANGELOG.md` updated for user-facing behavior changes
- Relevant references/architecture docs updated for refactors
- Governance docs updated if process or ownership changed:
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `SUPPORT.md`
  - `.github/CODEOWNERS`

No "follow-up docs PR" unless explicitly planned and tracked.

---

## 4) After release / completion

- Move plan from `docs/exec-plans/active/` to `docs/exec-plans/completed/`
- Add outcome notes if delivered scope differs from original plan
- Write evaluation in `docs/evaluations/<date>-<topic>.md` for meaningful releases/incidents
- Feed new priorities back into roadmap/release docs

This closes the loop: plan -> code -> release -> learning -> next plan.
