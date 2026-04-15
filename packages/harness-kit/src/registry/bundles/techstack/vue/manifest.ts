import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'vue',
  description: 'Vue 3 — Composition API with <script setup>, Pinia, Router, SSR, Vite patterns',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'stack', ref: 'typescript' },
      { type: 'skill', src: 'https://github.com/hyf0/vue-skills --skill vue-best-practices' },
      { type: 'rule', src: 'rules/vue.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
