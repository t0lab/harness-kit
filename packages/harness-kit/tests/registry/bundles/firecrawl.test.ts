import { describe, it, expect } from 'vitest'
import { manifest } from '../../../src/registry/bundles/workflow/firecrawl/manifest.js'

describe('firecrawl manifest', () => {
  it('installs the firecrawl CLI globally via firecrawl-cli init', () => {
    const tool = manifest.common.artifacts.find(a => a.type === 'tool')
    expect(tool).toBeDefined()
    if (tool?.type === 'tool') {
      expect(tool.installCmd).toContain('firecrawl-cli')
      expect(tool.installCmd).toContain('init')
    }
  })

  it('adds the firecrawl skill from the official repo', () => {
    const skill = manifest.common.artifacts.find(a => a.type === 'skill')
    expect(skill).toBeDefined()
    if (skill?.type === 'skill') {
      expect(skill.src).toContain('github.com/firecrawl/cli')
      expect(skill.src).toContain('--skill firecrawl')
    }
  })

  it('requires a FIRECRAWL_API_KEY env var', () => {
    const envKey = manifest.common.env?.find(e => e.key === 'FIRECRAWL_API_KEY')
    expect(envKey).toBeDefined()
    expect(envKey?.required).toBe(true)
  })

  it('is registered under the scrape role', () => {
    expect(manifest.roles['scrape']).toBeDefined()
  })
})
