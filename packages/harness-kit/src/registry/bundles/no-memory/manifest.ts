import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'no-memory',
  description: 'Skip memory setup',
  version: '1.0.0', experimental: false, defaultRole: 'memory',
  common: { artifacts: [] },
  roles: { memory: { artifacts: [] } },
}
