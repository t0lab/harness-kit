export const CLI_PACKAGE = '@harness-kit/cli'
export const CLI_VERSION_TAG = 'beta'
export const CLI_RUNNER = `npx ${CLI_PACKAGE}@${CLI_VERSION_TAG}`
export const CLI_INIT_COMMAND = `${CLI_RUNNER} init`

export function cliCommand(args: string) {
  return `${CLI_RUNNER} ${args}`.trim()
}

export function bundleInstallCommand(slug: string) {
  return cliCommand(`add ${slug}`);
}
