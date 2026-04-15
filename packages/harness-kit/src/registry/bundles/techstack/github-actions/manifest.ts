import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'github-actions',
  description: 'GitHub Actions — workflow syntax, matrix, secrets, caching, OIDC, reusable workflows',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'skill', src: 'https://github.com/xixu-me/skills --skill github-actions-docs' },
      { type: 'rule', src: 'rules/github-actions.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
