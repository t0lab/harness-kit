import * as p from '@clack/prompts'
import type { WizardContext } from '../types.js'

export async function stepProjectInfo(): Promise<Partial<WizardContext>> {
  p.intro('harness-kit init')

  const projectName = await p.text({
    message: 'Project name:',
    placeholder: 'my-app',
    validate: (v) => (!v || v.trim().length === 0 ? 'Required' : undefined),
  })
  if (p.isCancel(projectName)) { p.cancel('Cancelled'); process.exit(0) }

  const projectPurpose = await p.text({
    message: 'What does this project do?',
    placeholder: 'An e-commerce platform for independent fashion brands',
    validate: (v) => (!v || v.trim().length === 0 ? 'Required' : undefined),
  })
  if (p.isCancel(projectPurpose)) { p.cancel('Cancelled'); process.exit(0) }

  const projectUsers = await p.text({
    message: 'Who are the users / stakeholders? (optional)',
    placeholder: 'Brand owners and their customers',
  })
  if (p.isCancel(projectUsers)) { p.cancel('Cancelled'); process.exit(0) }

  const projectConstraints = await p.text({
    message: 'Key technical goals or constraints? (optional)',
    placeholder: 'Must be mobile-first. PCI-DSS compliant checkout.',
  })
  if (p.isCancel(projectConstraints)) { p.cancel('Cancelled'); process.exit(0) }

  return {
    projectName: String(projectName),
    projectPurpose: String(projectPurpose),
    projectUsers: projectUsers ? String(projectUsers) : '',
    projectConstraints: projectConstraints ? String(projectConstraints) : '',
  }
}
