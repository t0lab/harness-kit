import { runWizard } from '../wizard/index.js'
import type { Command } from 'commander'

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize harness in current project')
    .action(async () => {
      await runWizard()
    })
}
