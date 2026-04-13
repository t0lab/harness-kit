import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'firecrawl',
  description: 'Firecrawl — HTML→markdown, JS-enabled scraping',
  version: '1.0.0', experimental: false, defaultRole: 'scrape',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', 'firecrawl-mcp'], env: { FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}' } }],
    env: [{ key: 'FIRECRAWL_API_KEY', description: 'API key from firecrawl.dev', required: true }],
  },
  roles: { scrape: { artifacts: [], recommended: true } },
}
