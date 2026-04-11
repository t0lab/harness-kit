import { writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'

export interface ScaffoldFile {
  relativePath: string
  content: string
}

export type ConflictStrategy = 'overwrite' | 'skip'

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function writeScaffoldFile(
  cwd: string,
  file: ScaffoldFile,
  conflict: ConflictStrategy
): Promise<void> {
  const fullPath = join(cwd, file.relativePath)
  if (conflict === 'skip' && (await fileExists(fullPath))) return
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, file.content, 'utf-8')
}
