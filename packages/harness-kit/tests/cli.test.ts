import { describe, it, expect } from 'vitest'
import { createCli } from '../src/index.js'

describe('harness-kit CLI entry', () => {
  it('createCli returns a Command with parseAsync', () => {
    const cli = createCli()
    expect(typeof cli.parseAsync).toBe('function')
  })

  it('CLI has correct name', () => {
    const cli = createCli()
    expect(cli.name()).toBe('harness-kit')
  })

  it('registers init command', () => {
    const names = createCli().commands.map((c) => c.name())
    expect(names).toContain('init')
  })

  it('registers list command', () => {
    const names = createCli().commands.map((c) => c.name())
    expect(names).toContain('list')
  })

  it('registers add command', () => {
    const names = createCli().commands.map((c) => c.name())
    expect(names).toContain('add')
  })

  it('registers status command', () => {
    const names = createCli().commands.map((c) => c.name())
    expect(names).toContain('status')
  })
})
