import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'crawl4ai',
  description: 'Crawl4AI — open source web scraping, self-hosted Docker',
  version: '1.0.0', experimental: false, defaultRole: 'scrape',
  common: { artifacts: [{ type: 'mcp', command: 'uvx', args: ['crawl4ai-mcp'] }] },
  roles: { scrape: { artifacts: [], requires: ['docker'] } },
}
