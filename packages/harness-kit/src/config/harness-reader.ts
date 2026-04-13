import { access, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import type { HarnessConfig } from '@harness-kit/core'

const HarnessConfigSchema = z.object({
  version: z.string(),
  registry: z.string(),
  techStack: z.array(z.string()),
  bundles: z.array(z.string()).default([]),
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
  return result.data
}

export async function writeHarnessConfig(cwd: string, config: HarnessConfig): Promise<void> {
  await writeFile(join(cwd, 'harness.json'), JSON.stringify(config, null, 2), 'utf-8')
}
