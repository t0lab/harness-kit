import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'perplexity',
  description: 'Perplexity — synthesized answers, not just links',
  version: '1.0.0', experimental: false, defaultRole: 'search',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@perplexity-ai/mcp-server'], env: { PERPLEXITY_API_KEY: '${PERPLEXITY_API_KEY}' } }],
    env: [{ key: 'PERPLEXITY_API_KEY', description: 'API key from perplexity.ai', required: true }],
  },
  roles: { search: { artifacts: [] } },
}
