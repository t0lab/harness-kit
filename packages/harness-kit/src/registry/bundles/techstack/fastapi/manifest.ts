import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'fastapi',
  description: 'FastAPI — project templates, async patterns, DI, Pydantic, middleware, error handling',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'python' },
      { type: 'skill', src: 'https://github.com/wshobson/agents --skill fastapi-templates' },
      { type: 'rule', src: 'rules/fastapi.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
