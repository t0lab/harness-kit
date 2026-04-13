import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'mem0',
  description: 'mem0 / OpenMemory — local-first, Docker: Qdrant + Postgres',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'memory',
  common: {
    artifacts: [
      {
        type: 'mcp',
        command: 'npx',
        args: ['-y', '@mem0/mcp-server'],
        env: { MEM0_API_KEY: '${MEM0_API_KEY}' },
      },
    ],
    env: [{ key: 'MEM0_API_KEY', description: 'API key from app.mem0.ai', required: true }],
  },
  roles: {
    memory: {
      artifacts: [],
      requires: ['docker'],
    },
    'mcp-tool': {
      artifacts: [],
    },
  },
}
