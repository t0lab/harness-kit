import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { detectTooling } from '../../src/wizard/detector.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-detect-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('detectTooling', () => {
  it('detects tsconfig.json', async () => {
    await writeFile(join(dir, 'tsconfig.json'), '{}')
    const result = await detectTooling(dir, ['nextjs'])
    const ts = result.find((r) => r.label === 'tsconfig.json')
    expect(ts?.found).toBe(true)
  })

  it('reports ESLint missing when no eslint config', async () => {
    const result = await detectTooling(dir, ['nextjs'])
    const eslint = result.find((r) => r.label === 'ESLint')
    expect(eslint?.found).toBe(false)
    expect(eslint?.installCmd).toContain('eslint')
  })

  it('detects .eslintrc.json', async () => {
    await writeFile(join(dir, '.eslintrc.json'), '{}')
    const result = await detectTooling(dir, ['nextjs'])
    const eslint = result.find((r) => r.label === 'ESLint')
    expect(eslint?.found).toBe(true)
  })

  it('detects go.mod for Go projects', async () => {
    await writeFile(join(dir, 'go.mod'), 'module example.com/myapp\n\ngo 1.22')
    const result = await detectTooling(dir, ['go'])
    const gomod = result.find((r) => r.label === 'go.mod')
    expect(gomod?.found).toBe(true)
  })

  it('returns empty array when no tech selected', async () => {
    const result = await detectTooling(dir, [])
    expect(result).toHaveLength(0)
  })
})
