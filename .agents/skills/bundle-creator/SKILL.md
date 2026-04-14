---
name: bundle-creator
description: Create a complete harness-kit bundle from scratch — manifest, artifacts, README, and test. Invoke when adding a new bundle to the registry, extending an existing bundle with new artifact types, or when the user says "add a bundle for X", "create a bundle", "I want to package X as a bundle". Always use this skill for any bundle contribution to harness-kit — it ensures nothing gets missed (manifest, registry registration, artifacts, test).
---

# Bundle Creator

A bundle is a unit of capability installable into an AI agent harness. Each bundle lives as a `manifest.ts` in the registry, optional artifact files (skills, rules, hooks), a README, and a test.

This skill guides you through creating one end-to-end.

---

## Phase 1: Intent & Scope

Before writing anything, answer these questions. Ask the user if unclear.

1. **What does this bundle add?** One sentence. Not "it installs X" — "it enables the agent to do Y."
2. **What category does it belong to?** See `references/bundle-schema.md` → Categories.
3. **Is it experimental?** Set `experimental: true` if the upstream package is unstable, alpha, or has breaking-change risk.
4. **Who is the target user?** (Affects defaultRole and recommended flag)

---

## Phase 2: Research & Distillation

This is the most important phase. Don't just find the install command — understand the tool deeply enough to extract what matters for an AI agent workflow.

### Where to look

**Official sources first:**
- Official docs / README of the tool or MCP server
- GitHub repo — read the full README, check Issues for common problems, look at `package.json` for the exact package name and version
- npm / PyPI page — find the exact `npx` / `uvx` / `pip` invocation

**Community distillation — extract the best patterns:**
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers) — comprehensive MCP index
- [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) — curated Claude Code extensions and workflows
- [Superpowers skills](https://github.com/obra/superpowers/tree/main/skills) — battle-tested skill implementations, great for distilling protocol patterns
- [skills.sh](https://skills.sh) — skill registry, sort by downloads to find what the community actually uses
- Search GitHub for `SKILL.md site:github.com <tool-name>` to find existing skill implementations
- Look at how other harness-kit bundles implement similar tools (read existing manifests in `src/registry/bundles/`)

### What to extract

For **MCP bundles**: exact `command`, `args[]`, required env vars (key names, where to get the value), optional config flags, any `requires` (docker, chrome, etc.)

For **workflow bundles**: the protocol steps that make the workflow work, the trigger conditions, what goes in a skill vs. what goes in a rule

For **skill content**: what are the best practices, what do experienced users of this tool do that beginners miss, what are the most common mistakes — distill this into the SKILL.md

The goal is not to summarize the docs. The goal is to extract the parts an AI agent needs to use this tool correctly and avoid the common failure modes.

---

## Phase 3: Audit Existing Bundles

Before designing, check for overlap.

Read `packages/harness-kit/src/registry/index.ts` to see all existing bundles. For each potentially overlapping bundle, read its manifest to understand what it does.

Ask yourself:
- Does any existing bundle already provide this capability?
- Can this be added as an artifact to an existing bundle instead?
- Which existing bundles pair well with this one? (Note these for the README)

Only proceed with a new bundle if it provides distinct value not covered by existing ones.

---

## Phase 4: Design the Manifest

### Choose the right category and defaultRole

The `defaultRole` must be one of the 7 `BundleCategory` values. A bundle can appear in multiple roles via `roles`:

| Category | When to use |
|----------|-------------|
| `workflow-preset` | Behavioral rules or protocols (TDD, code review, planning) |
| `git-workflow` | Git-specific tools or conventions |
| `memory` | Persistent memory or knowledge storage |
| `browser` | Browser automation or web interaction |
| `search` | Web search or information retrieval |
| `scrape` | Web scraping or content extraction |
| `mcp-tool` | General-purpose MCP server that doesn't fit other categories |

### Decide which artifact types are needed

See `references/artifact-types.md` for the decision guide and full type reference.

Quick heuristic:
- **MCP server exists?** → `mcp` artifact (command + args + env)
- **Complex multi-step protocol agent should follow?** → `skill` artifact
- **Simple always-loaded directive (1 paragraph)?** → `rule` artifact  
- **CLI tool to install globally?** → `tool` artifact
- **Pre-commit / commit-msg / pre-push enforcement?** → `git-hook` artifact
- **Claude should auto-run before/after a tool call?** → `hook` artifact

Most bundles are one of:
- `mcp` only (tool connects via MCP, no workflow guidance needed)
- `skill` + `rule` (workflow bundle: skill for the protocol, rule to always-load the pointer)
- `mcp` + `skill` (MCP tool with complex usage patterns worth capturing)

### Map env vars and requires

If the bundle needs API keys or config:
```ts
env: [
  { key: 'TAVILY_API_KEY', description: 'API key from app.tavily.com', required: true },
]
```

If the bundle requires system software:
```ts
requires: ['docker', 'chrome']  // string labels — informational, not enforced
```

---

## Phase 5: Write Artifact Files

Only write files for artifact types that exist in the manifest. Don't create files for hypothetical future artifacts.

### skill artifact → `packages/harness-kit/skills/<name>/SKILL.md`

The SKILL.md for bundle artifacts follows the same format as all skills:

```
---
name: <bundle-name>
description: <when to invoke — be specific and slightly pushy>
---
```

Content should be: the protocol the agent follows, organized as actionable sections. Read `packages/harness-kit/skills/code-review/SKILL.md` as the quality bar to aim for.

Keep it lean — every line costs context window for users who install it.

### rule artifact → `packages/harness-kit/rules/<name>.md`

Rules are always-loaded into Claude's context. They should be short (1-5 lines) and serve as a pointer to the skill, not a replacement for it:

```md
# Tool Name

Always consult `.agents/skills/<name>/` before [doing X].
[One-line constraint if any.]
```

Read `packages/harness-kit/rules/context-discipline.md` as reference.

### hook artifact → `packages/harness-kit/hooks/<name>.(ts|sh)`

Hooks run automatically on Claude tool calls. They must be fast and non-blocking. If slow, they degrade the agent loop.

### git-hook artifact → `packages/harness-kit/git-hooks/<hookName>/<name>.(ts|sh)`

Git hooks run in the developer's terminal. They block the git operation if they exit non-zero.

---

## Phase 6: Write the Manifest

Create `packages/harness-kit/src/registry/bundles/<name>/manifest.ts`:

```ts
import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: '<name>',
  description: '<one-line description of what it provides>',
  version: '1.0.0',
  experimental: false,
  defaultRole: '<category>',
  common: {
    artifacts: [
      // artifacts that apply to ALL roles
    ],
    env: [...],      // omit if none
    requires: [...], // omit if none
  },
  roles: {
    '<category>': {
      artifacts: [], // role-specific artifacts (usually empty if all are in common)
      recommended: true, // only for the most important role
    },
  },
}
```

Conventions to follow:
- `description` is shown in `harness-kit list` — make it scannable, not marketing copy
- `version` always starts at `'1.0.0'`
- Put artifacts in `common` unless they genuinely differ by role
- Only set `recommended: true` on bundles that should be default-suggested in the wizard

Read 2-3 existing manifests before writing to match the style exactly.

---

## Phase 7: Register in the Registry

Open `packages/harness-kit/src/registry/index.ts` and add:

1. An import at the top (follow existing alphabetical grouping by category):
```ts
import { manifest as myBundleM } from './bundles/my-bundle/manifest.js'
```

2. Add to `ALL_BUNDLES` array (keep the logical grouping — same-category bundles together).

---

## Phase 8: Write the README

Create `packages/harness-kit/src/registry/bundles/<name>/README.md`.

**Audience:** End users who just ran `harness-kit add <name>` and are reading this to understand what they got. Write for them, not for contributors. Assume they know their tool (git, Tavily, etc.) but don't assume they know harness-kit internals.

The README answers three questions the user has right after installing:
1. **What did this just put in my project?** (artifact table)
2. **How does it change what my agent can do?** (how it works)
3. **Do I need to do anything to activate it?** (setup, if any)

Standard structure:

```md
# <bundle-name>

<One sentence: what the agent can now do that it couldn't before.>

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|----------------------|---------|
| <Type> | `<installed path>` | <what it does — from the user's perspective, not the technical type> |

## How it works

<The problem this bundle solves — why does the user care?>
<How the artifacts work together in practice — what does the agent actually do differently?>
<What the user experience looks like — no explicit invocation needed? Triggered by certain phrases?>

## Setup

<Only include if there's something the user must do after installing:
- Env vars to set (where to get the value, not just the key name)
- External accounts to create
- System tools to install
Skip this section entirely if installation is self-contained.>

## Pairs well with

- `<bundle-name>` — <one sentence why, from the user's workflow perspective>
```

**Tone checks:**
- "What it installs" describes purpose from the user's perspective, not the artifact type name alone — "Skill: protocol the agent follows when searching" beats "Skill: skill artifact"
- "How it works" explains behavior the user will observe, not implementation details
- If setup is needed, explain where to get the credentials/config — don't just say `set TAVILY_API_KEY`

Read `packages/harness-kit/src/registry/bundles/context-discipline/README.md` and `code-review-gates/README.md` as quality references.

---

## Phase 9: Write the Test

Create `packages/harness-kit/tests/registry/bundles/<name>.test.ts`.

**What not to test:** Don't assert manifest field values (`manifest.name === 'x'`, `manifest.defaultRole === 'y'`). Those just duplicate what you typed — they catch nothing. The TypeScript compiler already enforces the shape.

**What to test instead — behavior:**

### MCP bundles: test that `executeAdd()` installs correctly

The real question is: does adding this bundle actually write the right entry to `.mcp.json`?

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../../src/commands/add.js'

let dir: string
beforeEach(async () => {
  dir = join(tmpdir(), `hk-<name>-${Date.now()}`)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'harness.json'), JSON.stringify({
    version: '1.0.0', registry: 'bundled', techStack: [], bundles: [],
  }))
})
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

describe('<name> bundle install', () => {
  it('writes MCP entry to .mcp.json', async () => {
    await executeAdd(dir, '<name>', {})
    const mcp = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(mcp.mcpServers['<name>']).toBeDefined()
    expect(mcp.mcpServers['<name>'].command).toBe('npx')
    // assert args, env keys — whatever matters for this specific bundle
  })

  it('records bundle in harness.json', async () => {
    await executeAdd(dir, '<name>', {})
    const config = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(config.bundles).toContain('<name>')
  })
})
```

### Skill/rule bundles: test that referenced artifact files exist on disk

Manifest references paths like `skills/code-review` — verify those files are actually there. This catches the classic mistake of referencing a file you forgot to write.

```ts
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { manifest } from '../../../src/registry/bundles/<name>/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('<name> bundle artifacts', () => {
  it('skill source file exists', () => {
    const skill = manifest.common.artifacts.find(a => a.type === 'skill')
    if (!skill || skill.type !== 'skill') return
    expect(existsSync(resolve(PACKAGE_ROOT, skill.src, 'SKILL.md'))).toBe(true)
  })

  it('rule source file exists', () => {
    const rule = manifest.common.artifacts.find(a => a.type === 'rule')
    if (!rule || rule.type !== 'rule') return
    expect(existsSync(resolve(PACKAGE_ROOT, rule.src))).toBe(true)
  })
})
```

### Choosing which pattern to use

| Bundle type | Test pattern |
|-------------|-------------|
| Has `mcp` artifact | `executeAdd()` integration test — verify `.mcp.json` content |
| Has `skill` or `rule` artifact | File existence test — verify source paths resolve |
| Has both | Both patterns |
| Pure `tool` artifact | `executeAdd()` — verify `harness.json` records the bundle (tool install is side-effectful, mock or skip) |

Write the failing test first, then write the artifact files and manifest to make it pass.

---

## Phase 10: Verify Build

```bash
pnpm --filter harness-kit build
```

Fix any TypeScript errors before marking the bundle complete. The type system is the first line of defense — if it compiles, the manifest is structurally valid.

Run the test:
```bash
pnpm --filter harness-kit test tests/registry/bundles/<name>.test.ts
```

---

## Checklist

Before calling the bundle done:

- [ ] `manifest.ts` created and follows exact TypeScript patterns of existing manifests
- [ ] Registered in `registry/index.ts` (import + ALL_BUNDLES entry)
- [ ] All artifact files exist (skill SKILL.md, rule .md, hooks, etc.)
- [ ] README.md created with artifact table + pairs well with
- [ ] Test file created and passing
- [ ] Build compiles without errors
- [ ] No overlap with existing bundles (or justified if there is)
