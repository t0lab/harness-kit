import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { computeBudget, resolveContextWindow, DEFAULT_CONTEXT_WINDOW } from '../../src/commands/budget.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-budget-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function seed(relPath: string, content: string): Promise<void> {
  const full = join(dir, relPath)
  await mkdir(join(full, '..'), { recursive: true })
  await writeFile(full, content, 'utf-8')
}

describe('computeBudget', () => {
  it('throws when harness.json missing', async () => {
    await expect(computeBudget(dir)).rejects.toThrow(/harness\.json/)
  })

  it('returns zero totals for empty project with harness.json', async () => {
    await seed('harness.json', JSON.stringify({
      version: '1', registry: 'default', techStack: [], bundles: [],
    }))
    const report = await computeBudget(dir)
    expect(report.totals.eager).toBe(0)
    expect(report.totals.total).toBe(0)
    expect(report.byBundle).toEqual([])
  })

  it('computes eager tokens from rules, classifies as user when no bundle match', async () => {
    await seed('harness.json', JSON.stringify({
      version: '1', registry: 'default', techStack: [], bundles: [],
    }))
    await seed('.claude/rules/my-own.md', 'user rule body content here')
    const report = await computeBudget(dir)
    expect(report.totals.eager).toBeGreaterThan(0)
    expect(report.userAuthored.files.length).toBe(1)
    expect(report.userAuthored.files[0].relPath).toBe('.claude/rules/my-own.md')
    expect(report.byBundle).toEqual([])
  })

  it('computes percent of context window (default window, flagged as estimate)', async () => {
    await seed('harness.json', JSON.stringify({
      version: '1', registry: 'default', techStack: [], bundles: [],
    }))
    await seed('CLAUDE.md', '# project instructions\n'.repeat(50))
    const report = await computeBudget(dir)
    expect(report.totals.percentOfWindow).toBeGreaterThan(0)
    expect(report.totals.percentOfWindow).toBeLessThan(100)
    expect(report.totals.contextWindow).toBe(DEFAULT_CONTEXT_WINDOW)
    expect(report.totals.contextWindowSource).toBe('default')
  })

  it('respects explicit context window from options', async () => {
    await seed('harness.json', JSON.stringify({
      version: '1', registry: 'default', techStack: [], bundles: [],
    }))
    await seed('CLAUDE.md', '# project\n')
    const report = await computeBudget(dir, { contextWindow: 50_000 })
    expect(report.totals.contextWindow).toBe(50_000)
    expect(report.totals.contextWindowSource).toBe('flag')
  })

  it('respects contextWindow in harness.json', async () => {
    await seed('harness.json', JSON.stringify({
      version: '1', registry: 'default', techStack: [], bundles: [],
      contextWindow: 100_000,
    }))
    const report = await computeBudget(dir)
    expect(report.totals.contextWindow).toBe(100_000)
    expect(report.totals.contextWindowSource).toBe('harness.json')
  })

  it('flags warn when eager exceeds 40% threshold', async () => {
    await seed('harness.json', JSON.stringify({
      version: '1', registry: 'default', techStack: [], bundles: [],
    }))
    const report = await computeBudget(dir)
    expect(report.totals.degraded).toBe(false)
    expect(report.warnThresholdPercent).toBe(40)
  })
})

describe('resolveContextWindow', () => {
  it('prefers flag over env over harness.json over default', () => {
    const env = { HARNESS_KIT_CONTEXT_WINDOW: '75000' } as Record<string, string | undefined>
    expect(resolveContextWindow({ contextWindow: 50_000 }, { contextWindow: 60_000 }, env).source).toBe('flag')
    expect(resolveContextWindow({}, { contextWindow: 60_000 }, env).source).toBe('env')
    expect(resolveContextWindow({}, { contextWindow: 60_000 }, {}).source).toBe('harness.json')
    expect(resolveContextWindow({}, {}, {}).source).toBe('default')
    expect(resolveContextWindow({}, {}, {}).value).toBe(DEFAULT_CONTEXT_WINDOW)
  })

  it('ignores non-positive or non-numeric values', () => {
    expect(resolveContextWindow({ contextWindow: 0 }, {}, {}).source).toBe('default')
    expect(resolveContextWindow({}, {}, { HARNESS_KIT_CONTEXT_WINDOW: 'abc' } as Record<string, string | undefined>).source).toBe('default')
  })
})
