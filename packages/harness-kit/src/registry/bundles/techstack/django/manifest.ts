import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'django',
  description: 'Django — patterns, DRF, ORM, security, TDD with pytest-django, pre-release verification',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'python' },
      { type: 'skill', src: 'https://github.com/affaan-m/everything-claude-code --skill django-patterns' },
      { type: 'skill', src: 'https://github.com/affaan-m/everything-claude-code --skill django-security' },
      { type: 'skill', src: 'https://github.com/affaan-m/everything-claude-code --skill django-tdd' },
      { type: 'skill', src: 'https://github.com/affaan-m/everything-claude-code --skill django-verification' },
      { type: 'rule', src: 'rules/django.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
