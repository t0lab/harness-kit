import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DetectedIssue } from '../wizard/types.js'

type DetectionRule = {
  label: string
  files: string[]        // any of these present = found
  pkgDeps?: string[]     // any of these in package.json deps/devDeps = found
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
    files: ['.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts'],
    pkgDeps: ['eslint'],
    tech: ['nextjs', 'react', 'vue', 'express', 'fastify'],
    installCmd: 'pnpm add -D eslint @typescript-eslint/eslint-plugin',
  },
  {
    label: 'Prettier',
    files: ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'],
    pkgDeps: ['prettier'],
    tech: ['nextjs', 'react', 'vue', 'express', 'fastify'],
    installCmd: 'pnpm add -D prettier',
  },
  {
    label: 'pyproject.toml',
    files: ['pyproject.toml'],
    tech: ['fastapi', 'django', 'langchain', 'langgraph'],
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

async function readPkgDeps(cwd: string): Promise<Set<string>> {
  try {
    const raw = await readFile(join(cwd, 'package.json'), 'utf-8')
    const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    return new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})])
  } catch {
    return new Set()
  }
}

export async function detectTooling(cwd: string, selectedTech: string[]): Promise<DetectedIssue[]> {
  if (selectedTech.length === 0) return []

  const pkgDeps = await readPkgDeps(cwd)
  const results: DetectedIssue[] = []
  for (const rule of RULES) {
    if (!rule.tech.some((t) => selectedTech.includes(t))) continue
    const foundFile = (await Promise.all(rule.files.map((f) => fileExists(join(cwd, f))))).some(Boolean)
    const foundDep = rule.pkgDeps?.some((d) => pkgDeps.has(d)) ?? false
    results.push({ label: rule.label, found: foundFile || foundDep, ...(rule.installCmd ? { installCmd: rule.installCmd } : {}) })
  }
  return results
}
