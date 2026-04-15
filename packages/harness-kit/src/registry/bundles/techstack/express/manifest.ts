import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'express',
  description: 'Express — production server: middleware, routing, auth, error handling, DB integration',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'typescript' },
      { type: 'skill', src: 'https://github.com/aj-geddes/useful-ai-prompts --skill nodejs-express-server' },
      { type: 'rule', src: 'rules/express.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
