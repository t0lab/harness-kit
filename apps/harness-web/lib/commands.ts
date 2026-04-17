export const CLI_PACKAGE = '@harness-kit/cli'
export const CLI_VERSION_TAG = 'beta'
export const CLI_RUNNER = `npx ${CLI_PACKAGE}@${CLI_VERSION_TAG}`
export const CLI_INIT_COMMAND = `${CLI_RUNNER} init`

export function cliCommandVariants(args: string): Array<{ label: string; command: string }> {
  const pkg = `${CLI_PACKAGE}@${CLI_VERSION_TAG}`
  return [
    { label: 'npx',      command: `npx ${pkg} ${args}`.trim() },
    { label: 'pnpm dlx', command: `pnpm dlx ${pkg} ${args}`.trim() },
    { label: 'yarn dlx', command: `yarn dlx ${pkg} ${args}`.trim() },
  ]
}

export function cliCommand(args: string) {
  return `${CLI_RUNNER} ${args}`.trim()
}

export function bundleInstallCommand(slug: string) {
  return cliCommand(`add ${slug}`)
}

export function bundleInstallVariants(slug: string) {
  return cliCommandVariants(`add ${slug}`)
}
