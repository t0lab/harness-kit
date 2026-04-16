import { access, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import type { HarnessConfig } from '@harness-kit/core'

const HarnessConfigSchema = z.object({
  version: z.string(),
  registry: z.string(),
  techStack: z.array(z.string()),
  bundles: z.array(z.string()).default([]),
  ide: z.array(z.string()).default([]),
  contextWindow: z.number().positive().optional(),
})

export async function harnessExists(cwd: string): Promise<boolean> {
  try {
    await access(join(cwd, 'harness.json'))
    return true
  } catch {
    return false
  }
}

export async function readHarnessConfig(cwd: string): Promise<HarnessConfig> {
  const raw = await readFile(join(cwd, 'harness.json'), 'utf-8')
  const parsed: unknown = JSON.parse(raw)
  const result = HarnessConfigSchema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`harness.json is invalid: ${issues}`)
  }
  const { contextWindow, ...rest } = result.data
  return contextWindow !== undefined ? { ...rest, contextWindow } : rest
}

export async function writeHarnessConfig(cwd: string, config: HarnessConfig): Promise<void> {
  const targetPath = join(cwd, 'harness.json')
  const tempPath = join(cwd, `harness.json.tmp.${process.pid}.${Date.now()}`)
  const payload = JSON.stringify(config, null, 2)
  await writeFile(tempPath, payload, 'utf-8')
  try {
    await rename(tempPath, targetPath)
  } catch (error) {
    await unlink(tempPath).catch(() => undefined)
    throw error
  }
}
