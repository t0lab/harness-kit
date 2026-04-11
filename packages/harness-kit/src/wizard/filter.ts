import type { TechOption } from './types.js'

export function filterOptions(query: string, options: TechOption[]): TechOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter((opt) => {
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.hint.toLowerCase().includes(q) ||
      opt.tags.some((tag) => tag.toLowerCase().includes(q))
    )
  })
}
