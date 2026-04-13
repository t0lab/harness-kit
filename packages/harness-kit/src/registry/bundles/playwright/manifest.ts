import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'playwright',
  description: 'Playwright — accessibility snapshots, E2E test generation',
  version: '1.0.0', experimental: false, defaultRole: 'browser',
  common: { artifacts: [{ type: 'mcp', command: 'npx', args: ['@playwright/mcp@latest'] }] },
  roles: { browser: { artifacts: [] } },
}
