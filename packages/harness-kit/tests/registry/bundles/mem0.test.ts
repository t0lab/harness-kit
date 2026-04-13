import { describe, it, expect } from 'vitest'
import { manifest } from '../../../src/registry/bundles/mem0/manifest.js'

describe('mem0 manifest', () => {
  it('has defaultRole memory and mcp-tool extra role', () => {
    expect(manifest.defaultRole).toBe('memory')
    expect(manifest.roles['memory']).toBeDefined()
    expect(manifest.roles['mcp-tool']).toBeDefined()
  })

  it('memory role has docker requires', () => {
    expect(manifest.roles['memory']?.requires).toContain('docker')
  })

  it('MCP artifact is in common (shared across roles)', () => {
    const mcp = manifest.common.artifacts.find(a => a.type === 'mcp')
    expect(mcp).toBeDefined()
  })

  it('mcp-tool role has no requires', () => {
    expect(manifest.roles['mcp-tool']?.requires ?? []).toHaveLength(0)
  })
})
