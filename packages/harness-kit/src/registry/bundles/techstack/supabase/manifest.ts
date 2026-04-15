import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'supabase',
  description: 'Supabase — RLS policies, edge functions, auth, realtime, storage',
  version: '1.0.0',
  experimental: true,
  defaultRole: 'techstack',
  common: {
    artifacts: [

      // TODO: add rule + skill artifacts in follow-up
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
