import { describe, it, expect } from 'vitest'
import type { BundleManifest } from '../../src/registry/types.js'
import { validateRegistry } from '../../src/registry/validate.js'

function mkBundle(overrides: Partial<BundleManifest> & Pick<BundleManifest, 'name' | 'roles'>): BundleManifest {
  return {
    description: 'test',
    version: '1.0.0',
    experimental: false,
    defaultRole: Object.keys(overrides.roles)[0] ?? 'stack',
    common: { artifacts: [] },
    ...overrides,
  } as BundleManifest
}

describe('validateRegistry', () => {
  it('passes when no stack refs exist', () => {
    const bundles = [
      mkBundle({ name: 'typescript', roles: { stack: { artifacts: [{ type: 'rule', src: 'rules/ts.md' }] } } }),
    ]
    expect(() => validateRegistry(bundles)).not.toThrow()
  })

  it('throws when a stack bundle contains a type:stack artifact (cycle prevention)', () => {
    const bundles = [
      mkBundle({ name: 'typescript', roles: { stack: { artifacts: [] } } }),
      mkBundle({
        name: 'python',
        roles: { stack: { artifacts: [{ type: 'stack', ref: 'typescript' }] } },
      }),
    ]
    expect(() => validateRegistry(bundles)).toThrow(/cycle prevention/)
  })

  it('throws when stack ref points to an unknown bundle', () => {
    const bundles = [
      mkBundle({
        name: 'nextjs',
        roles: { techstack: { artifacts: [{ type: 'stack', ref: 'ghost' }] } },
      }),
    ]
    expect(() => validateRegistry(bundles)).toThrow(/unknown stack ref/)
  })

  it('throws when stack ref targets a non-stack bundle', () => {
    const bundles = [
      mkBundle({ name: 'docker', roles: { techstack: { artifacts: [] } } }),
      mkBundle({
        name: 'nextjs',
        roles: { techstack: { artifacts: [{ type: 'stack', ref: 'docker' }] } },
      }),
    ]
    expect(() => validateRegistry(bundles)).toThrow(/not category 'stack'/)
  })

  it('passes for a valid techstack referencing a real stack', () => {
    const bundles = [
      mkBundle({ name: 'typescript', roles: { stack: { artifacts: [{ type: 'rule', src: 'rules/ts.md' }] } } }),
      mkBundle({
        name: 'nextjs',
        roles: {
          techstack: {
            artifacts: [
              { type: 'stack', ref: 'typescript' },
              { type: 'rule', src: 'rules/nextjs.md' },
            ],
          },
        },
      }),
    ]
    expect(() => validateRegistry(bundles)).not.toThrow()
  })
})
