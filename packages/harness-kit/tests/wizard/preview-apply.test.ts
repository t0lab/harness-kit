import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { collectSelectedBundles, installAllSelectedBundles, allSelectedBundleNames } from '../../src/wizard/steps/preview-apply.js'
import type { WizardContext } from '../../src/wizard/types.js'

const baseCtx: WizardContext = {
  projectName: 'test',
  projectPurpose: '',
  projectUsers: '',
  projectConstraints: '',
  selectedTech: [],
  detectedIssues: [],
  toolsToInstall: [],
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

describe('installAllSelectedBundles', () => {
  let dir: string

  beforeEach(async () => {
    dir = join(tmpdir(), `hk-wizard-tech-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'harness.json'), JSON.stringify({
      version: '1.0.0', registry: 'bundled', techStack: ['nextjs'], bundles: [],
    }))
  })

  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('installs all selected bundle artifacts and records them in harness.json', async () => {
    const ctx: WizardContext = {
      ...baseCtx,
      selectedTech: ['nextjs'],
      workflowPresets: ['tdd'],
    }
    await installAllSelectedBundles(dir, ctx)

    const config = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(config.bundles).toContain('nextjs')
    expect(config.bundles).toContain('tdd')
    // Stack expansion: typescript rules installed
    expect(existsSync(join(dir, '.claude/rules/stack-typescript/coding-style.md'))).toBe(true)
    // nextjs rule installed
    expect(existsSync(join(dir, '.claude/rules/nextjs.md'))).toBe(true)
    // tdd rule installed
    expect(existsSync(join(dir, '.claude/rules/tdd.md'))).toBe(true)
  }, 20000)

  it('allSelectedBundleNames collects from all ctx fields', () => {
    const ctx: WizardContext = {
      ...baseCtx,
      selectedTech: ['nextjs'],
      gitWorkflow: ['conventional-commits'],
      workflowPresets: ['tdd'],
      browserTools: ['playwright'],
      webSearch: ['tavily'],
      memory: 'local-memory',
    }
    const names = allSelectedBundleNames(ctx)
    expect(names).toContain('nextjs')
    expect(names).toContain('conventional-commits')
    expect(names).toContain('tdd')
    expect(names).toContain('playwright')
    expect(names).toContain('tavily')
    expect(names).toContain('local-memory')
  })

  it('silently skips unknown bundle names', async () => {
    const ctx: WizardContext = { ...baseCtx, selectedTech: ['unknown-framework'] }
    await expect(installAllSelectedBundles(dir, ctx)).resolves.not.toThrow()
  })
})
