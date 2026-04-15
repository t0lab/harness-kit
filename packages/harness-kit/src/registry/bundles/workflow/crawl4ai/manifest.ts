import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'crawl4ai',
  description: 'Crawl4AI — open-source web scraping with JS rendering, LLM extraction, deep crawl, YouTube and PDF processing',
  version: '1.0.0', experimental: false, defaultRole: 'scrape',
  common: {
    artifacts: [
      { type: 'mcp', command: 'uvx', args: ['--from', 'git+https://github.com/walksoda/crawl-mcp', 'crawl-mcp'] },
      { type: 'skill', src: 'skills/crawl4ai' },
    ],
    requires: ['python3'],
  },
  roles: { scrape: { artifacts: [] } },
}
