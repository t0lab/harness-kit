import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'nextjs',
  description: 'Next.js — App Router, RSC, server actions, route handlers, image/font optimization',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'typescript' },
      { type: 'skill', src: 'https://github.com/vercel-labs/next-skills --skill next-best-practices' },
      { type: 'rule', src: 'rules/nextjs.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
