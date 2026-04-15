import type { BundleManifest } from '@/registry/types.js'
export const manifest: BundleManifest = {
  name: 'brave-search',
  description: 'Brave Search — independent index, privacy-focused',
  version: '1.0.0', experimental: false, defaultRole: 'search',
  common: {
    artifacts: [
      { type: 'mcp', command: 'npx', args: ['-y', '@brave/brave-search-mcp-server'], env: { BRAVE_API_KEY: '${BRAVE_API_KEY}' } },
      { type: 'skill', src: 'skills/brave-search' },
    ],
    env: [{ key: 'BRAVE_API_KEY', description: 'API key from brave.com/search/api', required: true }],
  },
  roles: { search: { artifacts: [] } },
}
