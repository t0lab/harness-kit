import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'anthropic-sdk',
  description: 'Anthropic SDK — prompt caching, tool use, extended thinking, batch, files API',
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
