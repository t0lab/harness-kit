import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'markitdown',
  description: 'PDF/Word/HTML/audio → markdown (Python local)',
  version: '1.0.0', experimental: false, defaultRole: 'doc-conversion',
  common: { artifacts: [{ type: 'tool', installCmd: 'pip install markitdown' }] },
  roles: { 'doc-conversion': { artifacts: [], requires: ['python'] } },
}
