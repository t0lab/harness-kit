import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'local-memory',
  description: 'File-based memory — personal local, team committed to repo, zero deps',
  version: '1.0.0', experimental: false, defaultRole: 'memory',
  common: {
    artifacts: [
      { type: 'rule', src: 'rules/memory.md' },
      { type: 'skill', src: 'skills/memory' },
      { type: 'skill', src: 'skills/memory-merge' },
      { type: 'hook', src: 'hooks/memory-stop-reminder.sh', hookType: 'Stop' },
      { type: 'git-hook', src: 'git-hooks/pre-commit/memory-conflict-check.sh', hookName: 'pre-commit' },
    ],
  },
  roles: { memory: { artifacts: [], recommended: true } },
}
