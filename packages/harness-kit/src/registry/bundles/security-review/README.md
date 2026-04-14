# security-review

Dedicated security review for risky diffs. The agent stops treating security as one checkbox inside generic code review and runs a focused pass on attacker-controlled inputs, trust boundaries, and exploit paths.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Skill | `.agents/skills/security-review/` | Focused security review protocol for auth, access control, secrets, injection, risky shell/file/network flows, and agent config |
| Rule | `.claude/rules/security-review.md` | Always-loaded pointer - routes Claude to the skill before approving or calling risky changes safe |

## How it works

The rule stays active in every session and triggers on the kinds of changes that are easy to under-review: auth flows, permission checks, secrets handling, shell execution, file and network boundaries, and Claude automation config like hooks or MCP servers.

The skill then runs a dedicated security pass:

- define the asset, trust boundary, and attacker-controlled input
- choose the relevant categories instead of doing a generic checklist dump
- trace input to sinks like SQL, shell, filesystem, HTML, internal HTTP, logs, and agent permissions
- distinguish missing enforcement from comments that merely claim enforcement
- report findings by exploitability and boundary impact

This bundle is intentionally narrower than a full code review and more concrete than "be security-conscious". It is the review layer for security-sensitive changes. If you want runtime verification too, pair it with `quality-gates` and project-specific tests.

## Pairs well with

- `code-review-gates` - general review catches correctness and design issues; security-review goes deeper on exploit paths and trust boundaries
- `quality-gates` - security findings still need fresh verification before the agent can claim a risky fix is safe
- `pre-commit-hooks` - secret and conflict checks block obvious mistakes at commit time while this bundle handles higher-order review judgment
- `systematic-debugging` - once the root cause of a vulnerability is isolated, security-review checks whether the fix actually closes the exploit path
