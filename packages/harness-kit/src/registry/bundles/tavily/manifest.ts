import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'tavily',
  description: 'Tavily — agentic search, structured results, free tier',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'search',
  common: {
    artifacts: [
      {
        type: 'mcp',
        command: 'npx',
        args: ['-y', 'tavily-mcp@0.1.4'],
        env: { TAVILY_API_KEY: '${TAVILY_API_KEY}' },
      },
    ],
    env: [{ key: 'TAVILY_API_KEY', description: 'API key from app.tavily.com', required: true }],
  },
  roles: {
    search: { artifacts: [], recommended: true },
  },
}
