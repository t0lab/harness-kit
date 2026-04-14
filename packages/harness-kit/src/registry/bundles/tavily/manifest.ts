import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'tavily',
  description: 'Tavily MCP - agent-oriented web search plus extract/map/crawl workflow for current, domain-scoped research',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'search',
  common: {
    artifacts: [
      {
        type: 'mcp',
        command: 'npx',
        args: ['-y', 'tavily-mcp@latest'],
        env: { TAVILY_API_KEY: '${TAVILY_API_KEY}' },
      },
      { type: 'skill', src: 'skills/tavily' },
    ],
    env: [{ key: 'TAVILY_API_KEY', description: 'API key from app.tavily.com', required: true }],
  },
  roles: {
    search: { artifacts: [], recommended: true },
  },
}
