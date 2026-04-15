import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'spring',
  description: 'Spring Boot — dependency injection, JPA, REST controllers, security',
  version: '1.0.0',
  experimental: true,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'java' },
      // TODO: add rule + skill artifacts in follow-up
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
