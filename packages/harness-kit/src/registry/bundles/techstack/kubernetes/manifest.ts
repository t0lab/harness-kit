import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'kubernetes',
  description: 'Kubernetes — manifests, Helm, resource limits, health probes, RBAC',
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
