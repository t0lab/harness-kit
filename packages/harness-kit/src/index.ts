import { realpathSync } from 'node:fs'
import { Command } from 'commander'
import { HARNESS_KIT_VERSION } from '@harness-kit/core'
import { registerInitCommand } from '@/commands/init.js'
import { registerListCommand } from '@/commands/list.js'
import { registerAddCommand } from '@/commands/add.js'
import { registerStatusCommand } from '@/commands/status.js'
import { registerActivateCommand } from '@/commands/activate.js'
import { registerBudgetCommand } from '@/commands/budget.js'

export function createCli(): Command {
  const program = new Command()
  program
    .name('harness-kit')
    .description('Scaffold AI agent harness environments')
    .version(HARNESS_KIT_VERSION)

  registerInitCommand(program)
  registerListCommand(program)
  registerAddCommand(program)
  registerStatusCommand(program)
  registerActivateCommand(program)
  registerBudgetCommand(program)

  return program
}

// Only run when executed directly as a binary.
// Resolve symlinks on argv[1] because npx creates .bin/ symlinks pointing to
// the real dist/index.js — without realpathSync the paths never match.
function resolveArgv1(): string | null {
  try {
    return process.argv[1] != null ? realpathSync(process.argv[1]) : null
  } catch {
    return process.argv[1] ?? null
  }
}
const isMain = resolveArgv1() === new URL(import.meta.url).pathname

if (isMain) {
  process.on('unhandledRejection', (reason) => {
    // Ensure we're out of any alt-screen before printing
    process.stdout.write('\x1b[?1049l')
    process.stderr.write(`\nUnhandled error: ${reason instanceof Error ? reason.stack ?? reason.message : String(reason)}\n`)
    process.exit(1)
  })
  createCli().parseAsync().catch((err: unknown) => {
    process.stdout.write('\x1b[?1049l')
    process.stderr.write(`\nError: ${err instanceof Error ? err.message : String(err)}\n`)
    process.exit(1)
  })
}
