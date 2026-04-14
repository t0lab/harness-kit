import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'browser-use',
  description: 'browser-use — Playwright browser automation via CLI daemon, natural language + fine-grained control',
  version: '1.0.0', experimental: false, defaultRole: 'browser',
  common: {
    artifacts: [
      { type: 'tool', installCmd: 'pip install browser-use && browser-use setup' },
      { type: 'skill', src: 'https://github.com/browser-use/browser-use --skill browser-use' },
    ],
    requires: ['python3', 'chrome'],
  },
  roles: { browser: { artifacts: [] } },
}
