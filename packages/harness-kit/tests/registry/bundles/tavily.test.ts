import { describe, it, expect } from 'vitest'
import { manifest } from '../../../src/registry/bundles/tavily/manifest.js'

describe('tavily manifest', () => {
  it('has correct name and defaultRole', () => {
    expect(manifest.name).toBe('tavily')
    expect(manifest.defaultRole).toBe('search')
  })

  it('has MCP artifact in common', () => {
    const mcp = manifest.common.artifacts.find(a => a.type === 'mcp')
    expect(mcp).toBeDefined()
    if (mcp?.type === 'mcp') {
      expect(mcp.command).toBe('npx')
      expect(mcp.args).toContain('tavily-mcp@0.1.4')
    }
  })

  it('has search role', () => {
    expect(manifest.roles['search']).toBeDefined()
  })

  it('has TAVILY_API_KEY env var', () => {
    const envKey = manifest.common.env?.find(e => e.key === 'TAVILY_API_KEY')
    expect(envKey).toBeDefined()
    expect(envKey?.required).toBe(true)
  })
})
