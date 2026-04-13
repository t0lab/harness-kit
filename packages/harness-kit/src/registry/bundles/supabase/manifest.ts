import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'supabase',
  description: 'Supabase — Postgres + auth + storage',
  version: '1.0.0', experimental: false, defaultRole: 'cloud-infra',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@supabase/mcp-server-supabase@latest'], env: { SUPABASE_ACCESS_TOKEN: '${SUPABASE_ACCESS_TOKEN}' } }],
    env: [{ key: 'SUPABASE_ACCESS_TOKEN', description: 'Access token from supabase.com/dashboard/account/tokens', required: true }],
  },
  roles: { 'cloud-infra': { artifacts: [] } },
}
