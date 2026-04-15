import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm, writeFile, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanArtifacts, computeContextCost } from '../../src/engine/context-cost.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-cost-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function seedFile(relPath: string, content: string): Promise<void> {
  const full = join(dir, relPath)
  await mkdir(join(full, '..'), { recursive: true })
  await writeFile(full, content, 'utf-8')
}

const SKILL_BODY = `---
name: tdd
description: Test-driven development workflow
---

# TDD Skill

Write a failing test first. This body is long and should not count as eager tokens.
`.repeat(5)

describe('scanArtifacts', () => {
  it('returns empty list when no artifact dirs exist', async () => {
    expect(await scanArtifacts(dir)).toEqual([])
  })

  it('picks up rules, agents, hooks, commands, skills, CLAUDE.md, AGENTS.md, .mcp.json', async () => {
    await seedFile('.claude/skills/tdd/SKILL.md', SKILL_BODY)
    await seedFile('.claude/rules/coding.md', 'rules')
    await seedFile('.claude/agents/reviewer.md', 'reviewer')
    await seedFile('.claude/hooks/auto-format.sh', '#!/bin/sh')
    await seedFile('.claude/commands/ship.md', 'ship')
    await seedFile('CLAUDE.md', '# project')
    await seedFile('AGENTS.md', '# agents')
    await seedFile('.mcp.json', '{}')
    const kinds = new Set((await scanArtifacts(dir)).map((f) => f.kind))
    for (const expected of ['skill', 'rule', 'agent', 'hook', 'command', 'claude-md', 'agents-md', 'mcp-config']) {
      expect(kinds.has(expected as never)).toBe(true)
    }
  })

  it('ignores .agents/skills (Claude Code only reads .claude/)', async () => {
    await seedFile('.agents/skills/tdd/SKILL.md', SKILL_BODY)
    const files = await scanArtifacts(dir)
    expect(files).toEqual([])
  })

  it('follows symlinked skill directories under .claude/skills/', async () => {
    // Real layout: `.agents/skills/<name>/` is the source of truth,
    // `.claude/skills/<name>` is a symlink pointing at it.
    await seedFile('.agents/skills/tdd/SKILL.md', SKILL_BODY)
    await mkdir(join(dir, '.claude/skills'), { recursive: true })
    await symlink(
      join('..', '..', '.agents/skills/tdd'),
      join(dir, '.claude/skills/tdd')
    )
    const files = await scanArtifacts(dir)
    const skill = files.find((f) => f.relPath === '.claude/skills/tdd/SKILL.md')
    expect(skill?.kind).toBe('skill')
  })
})

describe('computeContextCost', () => {
  it('returns zero totals for empty project', async () => {
    const report = await computeContextCost(dir)
    expect(report.totalEager).toBe(0)
    expect(report.totalOnDemand).toBe(0)
    expect(report.files).toEqual([])
  })

  it('counts rules as eager (full content)', async () => {
    await seedFile('.claude/rules/coding.md', 'coding rule body content here')
    const report = await computeContextCost(dir)
    const f = report.files[0]
    expect(f.eagerTokens).toBeGreaterThan(0)
    expect(f.onDemandTokens).toBe(0)
  })

  it('counts skill frontmatter as eager, body as on-demand', async () => {
    await seedFile('.claude/skills/tdd/SKILL.md', SKILL_BODY)
    const report = await computeContextCost(dir)
    const f = report.files[0]
    expect(f.kind).toBe('skill')
    expect(f.eagerTokens).toBeGreaterThan(0)
    expect(f.onDemandTokens).toBeGreaterThan(f.eagerTokens)
  })

  it('counts hooks as zero (not loaded into context)', async () => {
    await seedFile('.claude/hooks/auto-format.sh', '#!/bin/sh\necho format\n'.repeat(50))
    const report = await computeContextCost(dir)
    expect(report.files[0].eagerTokens).toBe(0)
    expect(report.files[0].onDemandTokens).toBe(0)
  })

  it('counts settings.json as zero', async () => {
    await seedFile('.claude/settings.json', JSON.stringify({ permissions: { allow: ['Read'] } }))
    const report = await computeContextCost(dir)
    expect(report.files[0].eagerTokens).toBe(0)
  })

  it('splits bucket totals by source (harness-kit vs user)', async () => {
    await seedFile('.claude/rules/from-harness.md', 'harness managed rule')
    await seedFile('.claude/rules/my-own.md', 'user authored rule')
    const report = await computeContextCost(dir, {
      managedPaths: new Set(['.claude/rules/from-harness.md']),
    })
    expect(report.byBucket.harnessKit.eager).toBeGreaterThan(0)
    expect(report.byBucket.user.eager).toBeGreaterThan(0)
  })

  it('defaults source to user when no managedPaths', async () => {
    await seedFile('.claude/rules/coding.md', 'rule')
    const report = await computeContextCost(dir)
    expect(report.files[0].source).toBe('user')
  })

  it('reflects edits — bigger file yields more on-demand tokens', async () => {
    await seedFile('.claude/skills/tdd/SKILL.md', '---\nname: tdd\ndescription: x\n---\nbody')
    const before = await computeContextCost(dir)
    await seedFile('.claude/skills/tdd/SKILL.md', '---\nname: tdd\ndescription: x\n---\n' + 'body '.repeat(500))
    const after = await computeContextCost(dir)
    expect(after.totalOnDemand).toBeGreaterThan(before.totalOnDemand)
    // eager should stay ~stable since frontmatter unchanged
    expect(Math.abs(after.totalEager - before.totalEager)).toBeLessThan(5)
  })
})
