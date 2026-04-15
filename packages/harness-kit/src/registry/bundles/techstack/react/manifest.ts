import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'react',
  description: 'React — performance rules from Vercel: waterfalls, bundle size, re-renders, hydration',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'typescript' },
      { type: 'skill', src: 'https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices' },
      { type: 'rule', src: 'rules/react.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
