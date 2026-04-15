# Artifact Types Reference

Full reference for all 11 artifact types in `BundleManifest`. Source of truth: `packages/core/src/types.ts`.

---

## Decision Guide

```
Is there an MCP server?
  Yes → mcp
  No ↓

Is it a CLI tool to install globally?
  Yes → tool
  No ↓

Is there a plugin for an IDE/app?
  Yes → plugin
  No ↓

Should Claude follow a multi-step protocol?
  Yes, complex (> 1 page of instructions) → skill
  Yes, simple (1 paragraph, always active) → rule
  No ↓

Should something run automatically on git operations?
  Yes → git-hook
  No ↓

Should something run automatically on Claude tool calls?
  Yes → hook
  No ↓

Is it a custom Claude slash command?
  Yes → command
  No ↓

Is it an agent definition file?
  Yes → agent
  No ↓

Is it a generic file to copy into the project?
  Yes → file
  No ↓

Is this a techstack bundle that should inherit a language base's rules + skills?
  Yes → stack (ref to a 'stack'-category bundle name)
```

---

## Type Definitions

### `mcp`
```ts
{ type: 'mcp'; command: string; args: string[]; env?: Record<string, string> }
```
Writes an entry to `.mcp.json` (`mcpServers`). The `env` object uses `${ENV_VAR_NAME}` interpolation syntax.

**Example:**
```ts
{
  type: 'mcp',
  command: 'npx',
  args: ['-y', 'tavily-mcp@0.1.4'],
  env: { TAVILY_API_KEY: '${TAVILY_API_KEY}' },
}
```

**Notes:**
- Use `npx -y` for npm packages (auto-installs, no confirmation)
- Use `uvx` for Python packages via uv
- Pin version (`@0.1.4`) when the upstream package is unstable or you've verified a specific version works
- Omit version pin for mature, stable packages

---

### `skill`
```ts
{ type: 'skill'; src: string }
```
Copies a skill directory into `.agents/skills/<name>/`. The `src` is a path relative to `packages/harness-kit/` OR a remote `https://github.com/...` URL.

**Example:**
```ts
{ type: 'skill', src: 'skills/code-review' }
```

**When to use:**
- Multi-step protocol that the agent follows explicitly
- Content too complex for a rule (> 1 paragraph)
- When you want the agent to invoke it on demand (via `/skill-name`)

**Skill file location:** `packages/harness-kit/skills/<name>/SKILL.md`

---

### `rule`
```ts
{ type: 'rule'; src: string }
```
Copies a markdown file into `.claude/rules/`. Rules are always loaded into Claude's context — they run passively on every session without explicit invocation.

**Example:**
```ts
{ type: 'rule', src: 'rules/git-workflow.md' }
```

**When to use:**
- Short always-active directive (a pointer, a constraint, a default behavior)
- Typically a 1-3 line pointer to a skill: "Before committing, consult `.agents/skills/code-review/`"
- NOT for long protocols — that's what skills are for

**Rule file location:** `packages/harness-kit/rules/<name>.md`

---

### `tool`
```ts
{ type: 'tool'; installCmd: string }
```
Records a CLI installation command. Currently returns as a warning for the user to run manually (not auto-installed by the engine).

**Example:**
```ts
{ type: 'tool', installCmd: 'npm install -g agent-browser && agent-browser install' }
```

---

### `plugin`
```ts
{ type: 'plugin'; installSource: string }
```
Records a plugin installation source (VS Code extension, JetBrains plugin, etc.).

**Example:**
```ts
{ type: 'plugin', installSource: 'vscode:extension/publisher.extension-name' }
```

---

### `hook`
```ts
{ type: 'hook'; src: string; hookType: ClaudeHookType; matcher?: string }
```
Copies a hook script and registers it in Claude's settings. Runs automatically on Claude tool use events.

**`hookType` values:** `'PreToolUse' | 'PostToolUse' | 'Stop' | 'Notification'`

**`matcher`:** Optional tool name pattern to filter when the hook fires (e.g., `'Bash'`)

**Example:**
```ts
{ type: 'hook', src: 'hooks/security-check.ts', hookType: 'PreToolUse', matcher: 'Bash' }
```

**When to use:** When the agent should automatically check/log/gate something on every tool call without being asked.

---

### `git-hook`
```ts
{ type: 'git-hook'; src: string; hookName: GitHookName }
```
Copies a script into `.husky/` or `.git/hooks/` and registers it.

**`hookName` values:** `'pre-commit' | 'commit-msg' | 'pre-push'`

**Example:**
```ts
{ type: 'git-hook', src: 'git-hooks/pre-commit/lint-staged.sh', hookName: 'pre-commit' }
```

---

### `agent`
```ts
{ type: 'agent'; src: string }
```
Copies an agent definition file (e.g., a sub-agent specification).

---

### `command`
```ts
{ type: 'command'; src: string }
```
Copies a custom Claude slash command definition.

---

### `file`
```ts
{ type: 'file'; src: string }
```
Generic file copy — for config files, templates, or any other file the bundle needs to place in the project.

---

### `stack`
```ts
{ type: 'stack'; ref: string }
```
Inherits all artifacts from a `stack`-category bundle by reference. The `ref` must be the `name` of a bundle whose `roles` include `'stack'`.

**Example:**
```ts
{ type: 'stack', ref: 'typescript' }
```

**When to use:**
- In a `techstack`-category bundle that builds on a language base (e.g. `nextjs` → `typescript`, `fastapi` → `python`)
- Never use in a `stack`-category bundle itself — the validator will throw (cycle prevention)

**Resolver behavior:** `resolveStackArtifacts(bundle)` expands the ref into the target stack's artifacts, deduped by path. Depth is always 1.

**Infra/AI bundles that are language-agnostic** (docker, terraform, langchain) should NOT add a `stack` ref — the user's other tech selections provide the language context.

---

## Combining Artifact Types

Most bundles use a small combination:

| Pattern | Artifact types | Example bundle |
|---------|---------------|----------------|
| Pure MCP tool | `mcp` | `tavily`, `mem0` |
| Workflow preset | `skill` + `rule` | `code-review-gates`, `context-discipline` |
| MCP + guidance | `mcp` + `skill` | — |
| Git enforcement | `git-hook` (+ optional `rule`) | `pre-commit-hooks` |
| Auto-gate | `hook` (+ optional `rule`) | — |
| Language base (`stack`) | `rule` × 4 + `skill` | `typescript`, `python`, `go` |
| Framework bundle (`techstack`) | `stack` ref + `rule` + `skill` | `nextjs`, `fastapi`, `spring` |
| Infra/AI bundle (`techstack`, no stack ref) | `rule` + `skill` | `docker`, `langchain`, `terraform` |

Keep the artifact list minimal — every artifact installed increases the user's context window footprint.
