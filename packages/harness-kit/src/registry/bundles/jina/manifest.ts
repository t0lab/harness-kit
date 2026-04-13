import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'jina',
  description: 'Jina Reader — no config needed, free, single-page scraping',
  version: '1.0.0', experimental: false, defaultRole: 'scrape',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@jina-ai/mcp-server-jina'], env: { JINA_API_KEY: '${JINA_API_KEY}' } }],
    env: [{ key: 'JINA_API_KEY', description: 'API key from jina.ai (optional, free tier)', required: false }],
  },
  roles: { scrape: { artifacts: [] } },
}
