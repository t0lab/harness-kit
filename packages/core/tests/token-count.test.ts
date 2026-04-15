import { describe, it, expect } from 'vitest'
import { countTokens } from '../src/token-count.js'

describe('countTokens', () => {
  it('returns 0 tokens for empty string', () => {
    const result = countTokens('')
    expect(result.tokens).toBe(0)
  })

  it('returns positive token count for non-empty text', () => {
    const result = countTokens('The quick brown fox jumps over the lazy dog')
    expect(result.tokens).toBeGreaterThan(0)
    expect(result.tokens).toBeLessThan(20)
  })

  it('reports method as tiktoken or heuristic', () => {
    const result = countTokens('hello world')
    expect(['tiktoken', 'heuristic']).toContain(result.method)
  })

  it('is roughly linear — longer text yields more tokens', () => {
    const short = countTokens('hello')
    const long = countTokens('hello '.repeat(100))
    expect(long.tokens).toBeGreaterThan(short.tokens * 10)
  })

  it('handles multiline markdown content', () => {
    const text = '# Title\n\nSome **bold** text and a [link](url).\n\n- item 1\n- item 2\n'
    const result = countTokens(text)
    expect(result.tokens).toBeGreaterThan(10)
  })
})
