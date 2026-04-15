import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'github-actions',
  description: 'GitHub Actions — workflow syntax, matrix, secrets, caching, reusable workflows',
  version: '1.0.0',
  experimental: true,
  defaultRole: 'techstack',
  common: {
    artifacts: [

      // TODO: add rule + skill artifacts in follow-up
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
