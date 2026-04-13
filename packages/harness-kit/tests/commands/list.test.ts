import { describe, it, expect } from 'vitest'
import {
  groupBundlesByDefaultRole,
  filterByInstalled,
} from '../../src/commands/list.js'
import type { BundleManifest } from '@harness-kit/core'

function makeBundle(name: string, defaultRole: string, experimental = false): BundleManifest {
  return {
    name,
    description: `${name} description`,
    version: '1.0.0',
    experimental,
    defaultRole,
    common: { artifacts: [] },
    roles: {},
  }
}

const BUNDLES = [
  makeBundle('tavily', 'search'),
  makeBundle('exa', 'search'),
  makeBundle('tdd', 'workflow-preset'),
]

describe('groupBundlesByDefaultRole', () => {
  it('groups bundles by defaultRole', () => {
    const groups = groupBundlesByDefaultRole(BUNDLES)
    expect(groups.get('search')?.map((b) => b.name)).toEqual(
      expect.arrayContaining(['tavily', 'exa'])
    )
    expect(groups.get('workflow-preset')?.map((b) => b.name)).toContain('tdd')
  })

  it('each bundle appears exactly once', () => {
    const groups = groupBundlesByDefaultRole(BUNDLES)
    const total = [...groups.values()].flat().length
    expect(total).toBe(BUNDLES.length)
  })

  it('returns empty map for empty input', () => {
    expect(groupBundlesByDefaultRole([])).toEqual(new Map())
  })

  it('multi-role bundle appears only in its defaultRole group', () => {
    const bundle = makeBundle('mem0', 'memory')
    const groups = groupBundlesByDefaultRole([bundle])
    expect(groups.size).toBe(1)
    expect(groups.has('memory')).toBe(true)
  })
})

describe('filterByInstalled', () => {
  it('returns only bundles whose names are in the installed set', () => {
    const installed = new Set(['tavily'])
    const result = filterByInstalled(BUNDLES, installed)
    expect(result.map((b) => b.name)).toEqual(['tavily'])
  })

  it('returns empty array when installed set is empty', () => {
    expect(filterByInstalled(BUNDLES, new Set())).toHaveLength(0)
  })

  it('returns all bundles when all are installed', () => {
    const installed = new Set(BUNDLES.map((b) => b.name))
    expect(filterByInstalled(BUNDLES, installed)).toHaveLength(BUNDLES.length)
  })
})
