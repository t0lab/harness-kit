import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'browser-use',
  description: 'browser-use — Playwright driven by natural language',
  version: '1.0.0', experimental: false, defaultRole: 'browser',
  common: {
    artifacts: [{ type: 'mcp', command: 'uvx', args: ['browser-use-mcp-server'], env: { ANTHROPIC_API_KEY: '${ANTHROPIC_API_KEY}' } }],
    env: [{ key: 'ANTHROPIC_API_KEY', description: 'Anthropic API key', required: true }],
  },
  roles: { browser: { artifacts: [] } },
}
