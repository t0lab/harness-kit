import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'mem0',
  description: 'mem0 — hosted long-term memory via MCP, scoped by user_id',
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
      { type: 'skill', src: 'skills/mem0' },
    ],
    env: [
      { key: 'MEM0_API_KEY', description: 'API key from app.mem0.ai/settings/api-keys', required: true },
    ],
  },
  roles: {
    memory: { artifacts: [] },
    'mcp-tool': { artifacts: [] },
  },
}
