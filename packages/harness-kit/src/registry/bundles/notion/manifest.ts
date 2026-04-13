import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'notion',
  description: 'Notion — docs + database',
  version: '1.0.0', experimental: false, defaultRole: 'dev-integration',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@notionhq/notion-mcp-server'], env: { NOTION_API_KEY: '${NOTION_API_KEY}' } }],
    env: [{ key: 'NOTION_API_KEY', description: 'Integration token from notion.so/my-integrations', required: true }],
  },
  roles: { 'dev-integration': { artifacts: [] } },
}
