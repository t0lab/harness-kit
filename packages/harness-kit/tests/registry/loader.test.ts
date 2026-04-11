import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadMcpManifests } from '../../src/registry/loader.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = join(tmpdir(), `hk-test-${Date.now()}`)
  await mkdir(join(tmpDir, 'playwright'), { recursive: true })
  await mkdir(join(tmpDir, 'firecrawl'), { recursive: true })
  await writeFile(
    join(tmpDir, 'playwright', 'manifest.json'),
    JSON.stringify({
      name: 'playwright',
      type: 'mcp',
      description: 'Browser automation',
      version: '1.0.0',
      command: 'npx',
      args: ['@playwright/mcp@latest'],
    })
  )
  await writeFile(
    join(tmpDir, 'firecrawl', 'manifest.json'),
    JSON.stringify({
      name: 'firecrawl',
      type: 'mcp',
      description: 'Web scraping',
      version: '1.0.0',
      command: 'npx',
      args: ['-y', 'firecrawl-mcp'],
      env: { FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}' },
    })
  )
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

describe('loadMcpManifests', () => {
  it('loads all manifests from directory', async () => {
    const manifests = await loadMcpManifests(tmpDir)
    expect(manifests).toHaveLength(2)
    expect(manifests.map((m) => m.name).sort()).toEqual(['firecrawl', 'playwright'])
  })

  it('returns manifest fields correctly', async () => {
    const manifests = await loadMcpManifests(tmpDir)
    const pw = manifests.find((m) => m.name === 'playwright')
    expect(pw).toMatchObject({
      name: 'playwright',
      type: 'mcp',
      command: 'npx',
      args: ['@playwright/mcp@latest'],
    })
  })

  it('returns empty array for empty directory', async () => {
    const emptyDir = join(tmpdir(), `hk-empty-${Date.now()}`)
    await mkdir(emptyDir, { recursive: true })
    const manifests = await loadMcpManifests(emptyDir)
    expect(manifests).toHaveLength(0)
    await rm(emptyDir, { recursive: true })
  })

  it('skips directories without manifest.json', async () => {
    await mkdir(join(tmpDir, 'no-manifest'), { recursive: true })
    const manifests = await loadMcpManifests(tmpDir)
    expect(manifests).toHaveLength(2)
  })
})
