# Docs-as-Code Principles for Agent Harnesses

Research-backed principles for writing documentation that AI coding agents can navigate effectively. Sources include OpenAI harness engineering, GitHub Copilot analysis of 2,500+ repos, HumanLayer, Letta context repositories, and the Codified Context Infrastructure paper (arxiv 2602.20478).

---

## 1. The repository is the only knowledge base

If a decision isn't in the repo, it doesn't exist for the agent. Slack messages, Google Docs, and institutional memory are invisible. Every decision, constraint, and convention must be committed.

Consequence: when an agent makes a mistake, the fix is a documentation update, not a correction in conversation. The correction must be written to a file before it can prevent the same mistake next session.

---

## 2. AGENTS.md / CLAUDE.md is a map, not an encyclopedia

Target 60–150 lines. Never exceed 300. These files are loaded into every session — every token spent here is a token unavailable for the actual task. Context window degradation begins well before the limit.

Every line in a hot-loaded file should correspond to a specific past agent mistake it prevents. Aspirational or speculative content has no place here.

---

## 3. Three loading tiers — design explicitly for each

| Tier | Cost | Design for |
|------|------|-----------|
| Hot (always loaded) | High — every session | Universal rules, navigation map, hard prohibitions |
| Warm (task-loaded) | Medium — per feature/layer | Active exec plans, layer-specific conventions, ARCHITECTURE.md |
| Cold (on-demand) | Low — explicit read | Library references, historical decision records, full API surface |

Most docs belong in cold tier. The mistake is writing cold-tier content in hot-tier files.

---

## 4. Write for the failure case first

Structure docs around what will go wrong, not what should go right. Symptom → cause → fix tables are more useful for agents than positive examples, because agents encounter failure mid-task. The best reference doc is one that resolves the agent's current confusion without requiring a full read.

---

## 5. Concrete beats abstract

One real code snippet from the actual codebase outweighs three paragraphs of description. Executable commands over tool names (`pnpm test --filter harness-kit` not "run the test suite"). File paths and function names from `grep`, not from memory.

---

## 6. Diátaxis applied to agent docs

Diátaxis divides docs into four types. Three are useful for agents; one is wasted:

| Type | For agents? | Where in this project |
|------|------------|----------------------|
| **Reference** | Yes — lookup while working | `docs/references/` |
| **Explanation** | Yes — protects decisions from reversal | `docs/design-docs/` |
| **How-to** | Yes — step-by-step task guides | `docs/exec-plans/active/` |
| **Tutorial** | No — agents don't learn across sessions | (omit) |

Explanation docs (the "why") are disproportionately valuable: they prevent agents from reversing correct decisions that appear sub-optimal without the full context.

---

## 7. Nearest-file principle for monorepos

Agents read the nearest AGENTS.md in the directory tree — the closest one takes precedence. Use package-level AGENTS.md files for local conventions without polluting the root context:

```
AGENTS.md                  ← global: build commands, project map, universal rules
packages/core/AGENTS.md    ← local: types only, no side effects, no logic
packages/harness-kit/AGENTS.md  ← local: CLI conventions, commander patterns
```

---

## 8. Documentation is a feedback loop, not a snapshot

Every agent mistake should produce a documentation update that prevents that class of mistake. The anti-pattern is correcting the agent in conversation — that correction vanishes at session end. Documentation is the only durable memory.

CI can validate doc freshness: check that referenced file paths exist, that documented commands run successfully, that architecture docs haven't diverged from actual module structure.

---

Sources:
- OpenAI Harness Engineering — https://openai.com/index/harness-engineering/
- The Emerging Harness Engineering Playbook — https://www.ignorance.ai/p/the-emerging-harness-engineering
- GitHub Blog: How to write a great agents.md — https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/
- Writing a good CLAUDE.md — https://www.humanlayer.dev/blog/writing-a-good-claude-md
- Letta: Context Repositories — https://www.letta.com/blog/context-repositories
- Codified Context Infrastructure — https://arxiv.org/html/2602.20478v1
- AGENTS.md open format — https://agents.md/
- Diátaxis Framework — https://diataxis.fr/
