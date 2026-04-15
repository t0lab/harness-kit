import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'fastapi',
  description: 'FastAPI — dependency injection, Pydantic models, async routes, OpenAPI',
  version: '1.0.0',
  experimental: true,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'python' },
      // TODO: add rule + skill artifacts in follow-up
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
