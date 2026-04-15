import type { Artifact, BundleManifest } from '@/registry/types.js'

function collectArtifacts(bundle: BundleManifest): Artifact[] {
  const out: Artifact[] = [...bundle.common.artifacts]
  for (const role of Object.values(bundle.roles)) {
    if (role?.artifacts) out.push(...role.artifacts)
  }
  return out
}

function isStackBundle(bundle: BundleManifest): boolean {
  return 'stack' in bundle.roles
}

export function validateRegistry(bundles: BundleManifest[]): void {
  const byName = new Map(bundles.map((b) => [b.name, b]))

  for (const bundle of bundles) {
    const stackBundle = isStackBundle(bundle)
    const artifacts = collectArtifacts(bundle)

    for (const a of artifacts) {
      if (a.type !== 'stack') continue

      if (stackBundle) {
        throw new Error(
          `Bundle "${bundle.name}" is category 'stack' but contains a type:'stack' artifact (cycle prevention). Stack bundles may not inherit other stacks.`,
        )
      }

      const target = byName.get(a.ref)
      if (!target) {
        throw new Error(`Bundle "${bundle.name}" has unknown stack ref: "${a.ref}"`)
      }
      if (!isStackBundle(target)) {
        throw new Error(
          `Bundle "${bundle.name}" references "${a.ref}" as stack, but "${a.ref}" is not category 'stack'.`,
        )
      }
    }
  }
}
