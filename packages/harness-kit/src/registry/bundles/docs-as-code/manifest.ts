import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'docs-as-code',
  description: 'AGENTS.md, spec template, ADR structure, llms.txt',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [], recommended: true } },
}
