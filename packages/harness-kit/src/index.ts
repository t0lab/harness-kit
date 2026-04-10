import { Command } from 'commander'
import { HARNESS_KIT_VERSION } from '@harness-kit/core'

export function createCli(): Command {
  const program = new Command()
  program
    .name('harness-kit')
    .description('Scaffold AI agent harness environments')
    .version(HARNESS_KIT_VERSION)
  return program
}

// Only run when executed directly as a binary
const isMain =
  process.argv[1] != null &&
  new URL(import.meta.url).pathname === process.argv[1]

if (isMain) {
  createCli().parseAsync()
}
