# systematic-debugging

Root-cause-first debugging for agent sessions. The agent stops thrashing on quick fixes and works through reproduction, evidence, isolation, hypothesis, and only then a targeted fix.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Skill | `.agents/skills/systematic-debugging/` | Debugging protocol for reproducing failures, tracing boundaries, testing one hypothesis at a time, and fixing the source instead of the symptom |
| Rule | `.claude/rules/systematic-debugging.md` | Always-loaded pointer - Claude must investigate before patching bugs, flaky tests, build failures, or integration issues |

## How it works

This bundle addresses a common failure mode in AI-assisted coding: when something breaks, the agent starts editing code before it has proved what is actually wrong. That produces stacked fixes, misleading green runs, and bugs that come back under a different symptom.

The skill imposes a debugging sequence:

- reproduce the issue and capture concrete evidence
- isolate the first boundary where the system is demonstrably wrong
- compare the failing path with a known-good path or reference pattern
- form one explicit hypothesis and test it minimally
- capture a durable repro before landing the real fix
- stop and question the architecture if repeated fixes keep failing

This is a debugging workflow, not a general planning tool and not a completion gate. It helps the agent understand what is broken before changing code. Pair it with `quality-gates` when you want the final fix claim backed by fresh verification.

## Pairs well with

- `quality-gates` - systematic-debugging finds the root cause; quality-gates verifies the final fix before the agent claims success
- `tdd` - TDD writes failing tests before new implementation; systematic-debugging creates a failing repro before a bug fix
- `security-review` - once a vulnerability is isolated, security-review checks whether the fix actually closes the exploit path
- `planning-first` - use planning-first for feature work; use systematic-debugging when the main task is understanding a failure rather than designing new behavior
