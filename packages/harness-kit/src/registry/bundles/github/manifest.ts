import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'github',
  description: 'GitHub — repos, issues, PRs, code search',
  version: '1.0.0', experimental: false, defaultRole: 'dev-integration',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_PERSONAL_ACCESS_TOKEN}' } }],
    env: [{ key: 'GITHUB_PERSONAL_ACCESS_TOKEN', description: 'GitHub personal access token', required: true }],
  },
  roles: { 'dev-integration': { artifacts: [], recommended: true } },
}
