import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  harnessExists,
  readHarnessConfig,
  writeHarnessConfig,
} from '../../src/config/harness-reader.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-reader-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

const BASE_CONFIG = {
  version: '1.0.0',
  registry: 'bundled',
  techStack: [],
  bundles: [],
}

describe('harnessExists', () => {
  it('returns false when harness.json absent', async () => {
    expect(await harnessExists(dir)).toBe(false)
  })

  it('returns true when harness.json present', async () => {
    await writeFile(join(dir, 'harness.json'), JSON.stringify(BASE_CONFIG))
    expect(await harnessExists(dir)).toBe(true)
  })
})

describe('readHarnessConfig', () => {
  it('reads and parses valid harness.json', async () => {
    await writeFile(join(dir, 'harness.json'), JSON.stringify(BASE_CONFIG))
    const config = await readHarnessConfig(dir)
    expect(config.version).toBe('1.0.0')
    expect(config.bundles).toEqual([])
  })

  it('normalizes missing bundles field to []', async () => {
    const legacy = { ...BASE_CONFIG, bundles: undefined }
    await writeFile(join(dir, 'harness.json'), JSON.stringify(legacy))
    const config = await readHarnessConfig(dir)
    expect(config.bundles).toEqual([])
  })

  it('throws when harness.json is missing', async () => {
    await expect(readHarnessConfig(dir)).rejects.toThrow()
  })
})

describe('writeHarnessConfig', () => {
  it('writes config and can be read back', async () => {
    await writeHarnessConfig(dir, BASE_CONFIG)
    const config = await readHarnessConfig(dir)
    expect(config).toEqual(BASE_CONFIG)
  })

  it('pretty-prints JSON (2-space indent)', async () => {
    await writeHarnessConfig(dir, BASE_CONFIG)
    const raw = await readFile(join(dir, 'harness.json'), 'utf-8')
    expect(raw).toContain('  "version"')
  })
})
