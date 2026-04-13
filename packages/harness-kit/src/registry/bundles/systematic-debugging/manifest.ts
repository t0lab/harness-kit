import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'systematic-debugging',
  description: 'Reproduce → isolate → verify → fix',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [] } },
}
