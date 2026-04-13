import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'parallel-agents',
  description: 'Subagents for independent tasks',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [] } },
}
