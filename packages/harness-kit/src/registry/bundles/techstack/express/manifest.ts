import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'express',
  description: 'Express — middleware, routing, error handling, request lifecycle',
  version: '1.0.0',
  experimental: true,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'typescript' },
      // TODO: add rule + skill artifacts in follow-up
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
