import type { BundleManifest } from '../../../types.js'
export const manifest: BundleManifest = {
  name: 'code-review-gates',
  description: 'Self-review + PR review + review-response protocol — 7-point self-check, Ship/Show/Ask, and READ→UNDERSTAND→VERIFY→EVALUATE→RESPOND→IMPLEMENT when addressing feedback (no performative agreement)',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/code-review' },
      { type: 'rule', src: 'rules/git-workflow.md' },
      { type: 'agent', src: 'agents/code-reviewer.md' },
    ],
  },
  roles: { 'workflow-preset': { artifacts: [], recommended: true } },
}
