import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'playwright',
  description: 'Playwright CLI — drive a real browser by accessibility-tree refs (snapshot → click eN → re-snapshot), plus skill distilled from OpenAI + Microsoft playwright skills',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'browser',
  common: {
    artifacts: [
      { type: 'tool', installCmd: 'npm install -g @playwright/cli@latest && playwright-cli install-browser chromium' },
      { type: 'skill', src: 'skills/playwright' },
    ],
    requires: ['node'],
  },
  roles: {
    browser: { artifacts: [], recommended: true },
  },
}
