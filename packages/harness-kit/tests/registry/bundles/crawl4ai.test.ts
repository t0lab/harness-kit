import { describe, it, expect } from 'vitest'
import { manifest } from '../../../src/registry/bundles/crawl4ai/manifest.js'

describe('crawl4ai manifest', () => {
  it('has correct name and defaultRole', () => {
    expect(manifest.name).toBe('crawl4ai')
    expect(manifest.defaultRole).toBe('scrape')
  })

  it('has MCP artifact with uvx command', () => {
    const mcp = manifest.common.artifacts.find(a => a.type === 'mcp')
    expect(mcp).toBeDefined()
    if (mcp?.type === 'mcp') {
      expect(mcp.command).toBe('uvx')
      expect(mcp.args).toContain('crawl-mcp')
    }
  })

  it('has skill artifact', () => {
    const skill = manifest.common.artifacts.find(a => a.type === 'skill')
    expect(skill).toBeDefined()
  })

  it('has scrape role', () => {
    expect(manifest.roles['scrape']).toBeDefined()
  })

  it('requires python3', () => {
    expect(manifest.common.requires).toContain('python3')
  })
})
