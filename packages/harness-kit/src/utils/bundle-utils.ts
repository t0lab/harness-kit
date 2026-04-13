import type { BundleManifest, BundleCategory } from '@harness-kit/core'

/**
 * Access role data from a bundle manifest by role string.
 * The cast is safe: bundle.roles keys are always BundleCategory values,
 * enforced at manifest definition time in the registry.
 */
export function getRoleData(bundle: BundleManifest, role: string) {
  return bundle.roles[role as BundleCategory]
}
