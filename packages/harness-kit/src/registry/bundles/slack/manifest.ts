import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'slack',
  description: 'Slack — messaging, OAuth',
  version: '1.0.0', experimental: false, defaultRole: 'dev-integration',
  common: {
    artifacts: [{
      type: 'mcp', command: 'npx', args: ['-y', '@modelcontextprotocol/server-slack'],
      env: { SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}', SLACK_TEAM_ID: '${SLACK_TEAM_ID}' },
    }],
    env: [
      { key: 'SLACK_BOT_TOKEN', description: 'Bot token from Slack app settings', required: true },
      { key: 'SLACK_TEAM_ID', description: 'Team/workspace ID', required: true },
    ],
  },
  roles: { 'dev-integration': { artifacts: [] } },
}
