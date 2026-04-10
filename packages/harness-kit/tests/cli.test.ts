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
})
