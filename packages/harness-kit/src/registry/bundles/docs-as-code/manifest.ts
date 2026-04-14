import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'docs-as-code',
  description: 'Repository-as-system-of-record — AGENTS.md discipline, exec plans, ADRs, and agent-legible docs structure',
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
