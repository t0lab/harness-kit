# Memory

Long-term memory splits across two locations by type:

| Type | Where | Contents |
|------|-------|----------|
| `user` | `~/.claude/projects/<hash>/memory/user/` (local) | Who the user is, expertise, working style |
| `feedback` | `~/.claude/projects/<hash>/memory/feedback/` (local) | Corrections and confirmations |
| `project` | `.claude/memory/project/` (committed) | Decisions, in-flight work, incidents |
| `reference` | `.claude/memory/reference/` (committed) | External pointers (Linear, Grafana, Slack) |

Personal memory stays local; team memory in the repo. Before writing, reading, or resolving conflicts in memory files, read `.agents/skills/memory/` (or `memory-merge/` for conflicts).
