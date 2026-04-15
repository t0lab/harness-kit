import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'supabase',
  description: 'Supabase — Database, Auth, RLS, Edge Functions, Realtime, Storage, SSR client libs',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'skill', src: 'https://github.com/supabase/agent-skills --skill supabase' },
      { type: 'rule', src: 'rules/supabase.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
