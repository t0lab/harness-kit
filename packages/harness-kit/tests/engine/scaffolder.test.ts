import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeScaffoldFile } from '../../src/engine/scaffolder.js'
import type { ScaffoldFile } from '../../src/engine/scaffolder.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-scaffold-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('writeScaffoldFile', () => {
  it('writes new file', async () => {
    const file: ScaffoldFile = { relativePath: 'CLAUDE.md', content: '# Hello' }
    await writeScaffoldFile(dir, file, 'overwrite')
    expect(await readFile(join(dir, 'CLAUDE.md'), 'utf-8')).toBe('# Hello')
  })

  it('creates nested directories', async () => {
    const file: ScaffoldFile = { relativePath: '.claude/rules/typescript.md', content: '# TS Rules' }
    await writeScaffoldFile(dir, file, 'overwrite')
    expect(await readFile(join(dir, '.claude/rules/typescript.md'), 'utf-8')).toBe('# TS Rules')
  })

  it('overwrites existing file when conflict=overwrite', async () => {
    await writeFile(join(dir, 'CLAUDE.md'), 'old content')
    const file: ScaffoldFile = { relativePath: 'CLAUDE.md', content: 'new content' }
    await writeScaffoldFile(dir, file, 'overwrite')
    expect(await readFile(join(dir, 'CLAUDE.md'), 'utf-8')).toBe('new content')
  })

  it('skips existing file when conflict=skip', async () => {
    await writeFile(join(dir, 'CLAUDE.md'), 'original')
    const file: ScaffoldFile = { relativePath: 'CLAUDE.md', content: 'new content' }
    await writeScaffoldFile(dir, file, 'skip')
    expect(await readFile(join(dir, 'CLAUDE.md'), 'utf-8')).toBe('original')
  })
})
