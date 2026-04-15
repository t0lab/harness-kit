import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'spring',
  description: 'Spring Boot — project structure, DI, JPA, REST, validation, security, testing',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'java' },
      { type: 'skill', src: 'https://github.com/github/awesome-copilot --skill java-springboot' },
      { type: 'rule', src: 'rules/spring.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
