import { Command } from 'commander'
import { HARNESS_KIT_VERSION } from '@harness-kit/core'
import { registerInitCommand } from './commands/init.js'
import { registerListCommand } from './commands/list.js'
import { registerAddCommand } from './commands/add.js'
import { registerStatusCommand } from './commands/status.js'
import { registerActivateCommand } from './commands/activate.js'
import { registerBudgetCommand } from './commands/budget.js'

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

// Only run when executed directly as a binary
const isMain =
  process.argv[1] != null &&
  new URL(import.meta.url).pathname === process.argv[1]

if (isMain) {
  createCli().parseAsync()
}
