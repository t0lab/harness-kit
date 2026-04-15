import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'docs-as-code',
  description: 'Repo-as-system-of-record — AGENTS.md, exec plans, ADRs, agent-legible docs',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/docs-as-code' },
      { type: 'rule', src: 'rules/docs-as-code.md' },
    ],
  },
  roles: { 'workflow-preset': { artifacts: [], recommended: true } },
}
