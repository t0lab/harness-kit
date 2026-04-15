import * as p from '@clack/prompts'
import { detectTooling } from '../detector.js'
import type { WizardContext } from '../types.js'

export async function stepDetectTooling(ctx: WizardContext): Promise<Partial<WizardContext>> {
  p.log.step(`Tech stack: ${ctx.selectedTech.join(', ')}`)

  const spinner = p.spinner()
  spinner.start('Scanning your project...')
  const issues = await detectTooling(process.cwd(), ctx.selectedTech)
  spinner.stop('Scan complete')

  for (const issue of issues) {
    if (issue.found) p.log.success(issue.label)
    else p.log.warn(`${issue.label} not configured`)
  }

  const installable = issues.filter((i) => !i.found && i.installCmd)
  if (installable.length === 0) return { detectedIssues: issues, toolsToInstall: [] }

  const toInstall = await p.multiselect({
    message: 'Install missing tools? (will run after wizard completes)',
    options: installable.map((i) => ({ label: i.label, value: i.label, ...(i.installCmd ? { hint: i.installCmd } : {}) })),
    required: false,
  })
  if (p.isCancel(toInstall)) { p.cancel('Cancelled'); process.exit(0) }

  const selected = toInstall as string[]
  const toolsToInstall = installable.filter((i) => selected.includes(i.label))
  return { detectedIssues: issues, toolsToInstall }
}
