import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'fastify',
  description: 'Fastify — routes, plugins, JSON Schema validation, hooks, Pino logging, security',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'typescript' },
      { type: 'skill', src: 'https://github.com/mcollina/skills --skill fastify-best-practices' },
      { type: 'rule', src: 'rules/fastify.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
