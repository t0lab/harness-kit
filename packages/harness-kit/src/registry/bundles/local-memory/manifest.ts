import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'local-memory',
  description: 'File-based memory in .claude/memory/ — no dependencies',
  version: '1.0.0', experimental: false, defaultRole: 'memory',
  common: { artifacts: [] },
  roles: { memory: { artifacts: [], recommended: true } },
}
