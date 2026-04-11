import { describe, it, expect } from 'vitest'
import { filterOptions } from '../../src/wizard/filter.js'
import type { TechOption } from '../../src/wizard/types.js'

const OPTIONS: TechOption[] = [
  { id: 'nextjs', label: 'Next.js', hint: 'fullstack React framework', category: 'Web Frameworks', tags: ['react', 'typescript', 'fullstack'] },
  { id: 'react', label: 'React', hint: 'frontend only', category: 'Web Frameworks', tags: ['react', 'typescript', 'frontend'] },
  { id: 'python-fastapi', label: 'Python + FastAPI', hint: 'async Python API', category: 'Backend', tags: ['python', 'api', 'backend'] },
  { id: 'langchain', label: 'LangChain', hint: 'Python / JavaScript', category: 'AI', tags: ['ai', 'python', 'javascript', 'llm'] },
  { id: 'docker', label: 'Docker', hint: 'containerization', category: 'Platform', tags: ['platform', 'devops'] },
]

describe('filterOptions', () => {
  it('returns all options for empty query', () => {
    expect(filterOptions('', OPTIONS)).toHaveLength(OPTIONS.length)
  })

  it('matches by label (case-insensitive)', () => {
    const result = filterOptions('next', OPTIONS)
    expect(result.map((o) => o.id)).toContain('nextjs')
    expect(result).toHaveLength(1)
  })

  it('matches by tag', () => {
    const result = filterOptions('python', OPTIONS)
    const ids = result.map((o) => o.id)
    expect(ids).toContain('python-fastapi')
    expect(ids).toContain('langchain')
  })

  it('matches by hint', () => {
    const result = filterOptions('fullstack', OPTIONS)
    expect(result.map((o) => o.id)).toContain('nextjs')
  })

  it('returns empty array for no match', () => {
    expect(filterOptions('xxxxxxxx', OPTIONS)).toHaveLength(0)
  })

  it('matches react in both Next.js (tag) and React (label)', () => {
    const result = filterOptions('react', OPTIONS)
    const ids = result.map((o) => o.id)
    expect(ids).toContain('nextjs')
    expect(ids).toContain('react')
  })

  it('trims whitespace from query', () => {
    const result = filterOptions('  docker  ', OPTIONS)
    expect(result.map((o) => o.id)).toContain('docker')
  })
})
