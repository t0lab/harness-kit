import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'terraform',
  description: 'Terraform — HCL patterns, state management, modules, provider conventions',
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
