export const CLI_PACKAGE = '@harness-kit/cli'
export const CLI_VERSION_TAG = 'beta'
export const CLI_INIT_COMMAND = `npx ${CLI_PACKAGE}@${CLI_VERSION_TAG} init`

export function bundleInstallCommand(slug: string) {
  return `harness-kit add ${slug}`;
}
