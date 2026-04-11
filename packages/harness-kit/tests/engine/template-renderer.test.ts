import { describe, it, expect } from 'vitest'
import { renderTemplate } from '../../src/engine/template-renderer.js'

const ctx = {
  projectName: 'my-app',
  projectPurpose: 'An e-commerce platform',
  projectUsers: 'Brand owners and shoppers',
  projectConstraints: 'Mobile-first. PCI-DSS.',
  selectedTech: ['nextjs', 'postgresql'],
  gitWorkflow: ['conventional-commits'],
  memory: 'file-based',
  docsAsCode: true,
  workflowPresets: ['tdd', 'spec-driven'],
  mcp: ['playwright', 'firecrawl'],
}

describe('renderTemplate', () => {
  it('renders CLAUDE.md.hbs with project name', async () => {
    const out = await renderTemplate('CLAUDE.md.hbs', ctx)
    expect(out).toContain('my-app')
    expect(out).toContain('An e-commerce platform')
  })

  it('renders harness.json.hbs with valid JSON', async () => {
    const out = await renderTemplate('harness.json.hbs', { ...ctx, modules: [], aiGenerationEnabled: false, mcpConfigs: [] })
    expect(() => JSON.parse(out)).not.toThrow()
    const parsed = JSON.parse(out)
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.techStack).toContain('nextjs')
  })

  it('throws for unknown template', async () => {
    await expect(renderTemplate('nonexistent.hbs', ctx)).rejects.toThrow()
  })
})
