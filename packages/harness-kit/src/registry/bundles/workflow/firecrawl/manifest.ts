import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'firecrawl',
  description: 'Firecrawl CLI — hosted scrape, search, map, crawl, agent, interact, download',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'scrape',
  common: {
    artifacts: [
      { type: 'tool', installCmd: 'npx -y firecrawl-cli@latest init -y --browser' },
      { type: 'skill', src: 'https://github.com/firecrawl/cli --skill firecrawl' },
    ],
    env: [{ key: 'FIRECRAWL_API_KEY', description: 'API key from firecrawl.dev (set automatically by `firecrawl init --browser`)', required: true }],
  },
  roles: {
    scrape: { artifacts: [] },
  },
}
