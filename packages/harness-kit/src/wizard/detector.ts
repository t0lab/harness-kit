import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { DetectedIssue } from '../wizard/types.js'

type DetectionRule = {
  label: string
  files: string[]        // any of these present = found
  tech: string[]         // trigger when any of these tech selected
  installCmd?: string
}

const RULES: DetectionRule[] = [
  {
    label: 'tsconfig.json',
    files: ['tsconfig.json'],
    tech: ['nextjs', 'react', 'vue', 'express', 'fastify'],
  },
  {
    label: 'ESLint',
    files: ['.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', 'eslint.config.js', 'eslint.config.mjs'],
    tech: ['nextjs', 'react', 'vue', 'express', 'fastify'],
    installCmd: 'pnpm add -D eslint @typescript-eslint/eslint-plugin',
  },
  {
    label: 'Prettier',
    files: ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'],
    tech: ['nextjs', 'react', 'vue', 'express', 'fastify'],
    installCmd: 'pnpm add -D prettier',
  },
  {
    label: 'pyproject.toml',
    files: ['pyproject.toml'],
    tech: ['fastapi', 'django', 'langchain', 'langgraph', 'llamaindex'],
  },
  {
    label: 'go.mod',
    files: ['go.mod'],
    tech: ['go'],
  },
  {
    label: 'Dockerfile',
    files: ['Dockerfile'],
    tech: ['docker'],
  },
  {
    label: 'GitHub Actions',
    files: ['.github/workflows'],
    tech: ['github-actions'],
  },
]

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function detectTooling(cwd: string, selectedTech: string[]): Promise<DetectedIssue[]> {
  if (selectedTech.length === 0) return []

  const results: DetectedIssue[] = []
  for (const rule of RULES) {
    if (!rule.tech.some((t) => selectedTech.includes(t))) continue
    const found = (await Promise.all(rule.files.map((f) => fileExists(join(cwd, f))))).some(Boolean)
    results.push({ label: rule.label, found, ...(rule.installCmd ? { installCmd: rule.installCmd } : {}) })
  }
  return results
}
