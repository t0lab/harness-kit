import type { BundleManifest } from '@/registry/types.js'
export const manifest: BundleManifest = {
  name: 'browser-use',
  description: 'browser-use — CLI-daemon browser automation, natural-language driven',
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
