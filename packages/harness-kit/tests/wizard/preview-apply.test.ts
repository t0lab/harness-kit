import { describe, it, expect } from 'vitest'
import { collectSelectedBundles } from '../../src/wizard/steps/preview-apply.js'
import type { WizardContext } from '../../src/wizard/types.js'

const baseCtx: WizardContext = {
  projectName: 'test',
  projectPurpose: '',
  projectUsers: '',
  projectConstraints: '',
  selectedTech: [],
  detectedIssues: [],
  installSelected: false,
  gitWorkflow: [],
  memory: 'local-memory',
  workflowPresets: [],
  browserTools: [],
  webSearch: [],
  webScrape: [],
}

describe('collectSelectedBundles', () => {
  it('returns bundles from all tool zones with their defaultRole', () => {
    const ctx: WizardContext = {
      ...baseCtx,
      browserTools: ['playwright'],
      webSearch: ['tavily'],
      webScrape: ['firecrawl'],
    }
    const bundles = collectSelectedBundles(ctx)
    expect(bundles).toContainEqual({ name: 'playwright', role: 'browser' })
    expect(bundles).toContainEqual({ name: 'tavily', role: 'search' })
    expect(bundles).toContainEqual({ name: 'firecrawl', role: 'scrape' })
  })

  it('includes memory bundle when not no-memory', () => {
    const ctx: WizardContext = { ...baseCtx, memory: 'mem0' }
    const bundles = collectSelectedBundles(ctx)
    expect(bundles).toContainEqual({ name: 'mem0', role: 'memory' })
  })

  it('includes local-memory (has empty artifacts — harmless)', () => {
    const ctx: WizardContext = { ...baseCtx, memory: 'local-memory' }
    const bundles = collectSelectedBundles(ctx)
    expect(bundles).toContainEqual({ name: 'local-memory', role: 'memory' })
  })

  it('excludes no-memory', () => {
    const ctx: WizardContext = { ...baseCtx, memory: 'no-memory' }
    const bundles = collectSelectedBundles(ctx)
    expect(bundles.map(b => b.name)).not.toContain('no-memory')
  })

  it('silently skips unknown bundle names (not in registry)', () => {
    const ctx: WizardContext = { ...baseCtx, webSearch: ['does-not-exist'] }
    const bundles = collectSelectedBundles(ctx)
    expect(bundles.map(b => b.name)).not.toContain('does-not-exist')
  })
})
