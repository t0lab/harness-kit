import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function readPackageJson(path: string): PackageJson | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    return isObject(parsed) ? (parsed as PackageJson) : null
  } catch {
    return null
  }
}

function readText(path: string): string {
  try {
    return readFileSync(path, 'utf8').toLowerCase()
  } catch {
    return ''
  }
}

function hasDep(pkg: PackageJson | null, name: string): boolean {
  if (!pkg) return false
  return !!(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? pkg.peerDependencies?.[name])
}

function exists(cwd: string, ...parts: string[]): boolean {
  return existsSync(join(cwd, ...parts))
}

// Detect tech stack from project files in cwd. Returns matched TECH_OPTIONS ids.
export function detectTechStack(cwd: string): string[] {
  const pkg = readPackageJson(join(cwd, 'package.json'))
  const reqs = readText(join(cwd, 'requirements.txt'))
  const pyproject = readText(join(cwd, 'pyproject.toml'))
  const py = reqs + pyproject

  const detected: string[] = []

  // ── Web Frameworks ──────────────────────────────────────────────────────────
  if (hasDep(pkg, 'next'))                detected.push('nextjs')
  else if (hasDep(pkg, 'react'))          detected.push('react')
  else if (hasDep(pkg, 'vue'))            detected.push('vue')

  // ── Backend ─────────────────────────────────────────────────────────────────
  if (hasDep(pkg, 'express'))             detected.push('express')
  if (hasDep(pkg, 'fastify'))             detected.push('fastify')
  if (py.includes('fastapi'))             detected.push('fastapi')
  if (py.includes('django'))              detected.push('django')
  if (exists(cwd, 'go.mod'))             detected.push('go')
  if (exists(cwd, 'Cargo.toml'))         detected.push('rust')
  if (exists(cwd, 'pom.xml') || exists(cwd, 'build.gradle')) detected.push('spring')

  // ── Database ─────────────────────────────────────────────────────────────────
  if (hasDep(pkg, 'pg') || hasDep(pkg, '@prisma/client') || hasDep(pkg, 'postgres'))
    detected.push('postgresql')
  if (hasDep(pkg, 'redis') || hasDep(pkg, 'ioredis'))
    detected.push('redis')
  if (hasDep(pkg, '@supabase/supabase-js'))
    detected.push('supabase')

  // ── Platform ─────────────────────────────────────────────────────────────────
  if (exists(cwd, 'Dockerfile') || exists(cwd, 'docker-compose.yml') || exists(cwd, 'docker-compose.yaml'))
    detected.push('docker')
  if (exists(cwd, '.github', 'workflows'))
    detected.push('github-actions')
  if (exists(cwd, 'main.tf') || exists(cwd, 'terraform'))
    detected.push('terraform')
  if (exists(cwd, 'k8s') || exists(cwd, 'kubernetes') || exists(cwd, 'helm'))
    detected.push('kubernetes')

  // ── AI ───────────────────────────────────────────────────────────────────────
  if (hasDep(pkg, 'langchain') || hasDep(pkg, '@langchain/core') || py.includes('langchain'))
    detected.push('langchain')
  if (hasDep(pkg, '@langchain/langgraph') || py.includes('langgraph'))
    detected.push('langgraph')
  if (py.includes('llama-index') || py.includes('llama_index') || py.includes('llamaindex'))
    detected.push('llamaindex')
  if (hasDep(pkg, '@anthropic-ai/sdk') || py.includes('anthropic'))
    detected.push('anthropic-sdk')

  return detected
}
