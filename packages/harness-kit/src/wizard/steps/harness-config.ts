import * as p from '@clack/prompts'
import { getBundlesByCategory, getRecommendedByCategory } from '../../registry/index.js'
import type { WizardContext } from '../types.js'

function bundleOptions(category: Parameters<typeof getBundlesByCategory>[0]) {
  return getBundlesByCategory(category)
    .sort((a, b) => {
      const aRec = a.roles[category]?.recommended ? 1 : 0
      const bRec = b.roles[category]?.recommended ? 1 : 0
      if (bRec !== aRec) return bRec - aRec
      return a.name.localeCompare(b.name)
    })
    .map((b) => ({ value: b.name, label: b.name, hint: b.description }))
}

export async function stepHarnessConfig(ctx: WizardContext): Promise<Partial<WizardContext>> {
  if (ctx.selectedTech.length > 0) {
    p.log.step(`Tech stack: ${ctx.selectedTech.join(', ')}`)
  }

  // ── 1. Git workflow (from registry) ──────────────────────────────────────
  const gitWorkflow = await p.multiselect({
    message: 'Git workflow:',
    initialValues: getRecommendedByCategory('git-workflow').map(b => b.name),
    options: bundleOptions('git-workflow'),
    required: false,
  })
  if (p.isCancel(gitWorkflow)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 2. Long-term memory (from registry) ──────────────────────────────────
  const memory = await p.select({
    message: 'Long-term memory:',
    options: bundleOptions('memory'),
  })
  if (p.isCancel(memory)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 3. Workflow presets (from registry) ───────────────────────────────────
  const workflowPresets = await p.multiselect({
    message: 'Workflow presets:',
    initialValues: getRecommendedByCategory('workflow-preset').map(b => b.name),
    options: bundleOptions('workflow-preset'),
    required: false,
  })
  if (p.isCancel(workflowPresets)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 4. Browser automation (from registry) ────────────────────────────────
  const browserTools = await p.multiselect({
    message: 'Browser automation:',
    initialValues: getRecommendedByCategory('browser').map(b => b.name),
    options: bundleOptions('browser'),
    required: false,
  })
  if (p.isCancel(browserTools)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 5. Web search (from registry) ────────────────────────────────────────
  const webSearch = await p.multiselect({
    message: 'Web search:',
    initialValues: getRecommendedByCategory('search').map(b => b.name),
    options: bundleOptions('search'),
    required: false,
  })
  if (p.isCancel(webSearch)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 6. Web scrape (from registry) ────────────────────────────────────────
  const webScrape = await p.multiselect({
    message: 'Web scrape:',
    initialValues: getRecommendedByCategory('scrape').map(b => b.name),
    options: bundleOptions('scrape'),
    required: false,
  })
  if (p.isCancel(webScrape)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 7. Library docs (from registry) ──────────────────────────────────────
  const libraryDocs = await p.multiselect({
    message: 'Library docs:',
    initialValues: getRecommendedByCategory('library-docs').map(b => b.name),
    options: bundleOptions('library-docs'),
    required: false,
  })
  if (p.isCancel(libraryDocs)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 8. Document conversion (from registry) ───────────────────────────────
  const docConversion = await p.multiselect({
    message: 'Document conversion:',
    options: bundleOptions('doc-conversion'),
    required: false,
  })
  if (p.isCancel(docConversion)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 9. Code execution sandbox (from registry) ────────────────────────────
  const codeExecution = await p.multiselect({
    message: 'Code execution sandbox:',
    options: bundleOptions('code-execution'),
    required: false,
  })
  if (p.isCancel(codeExecution)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 10. Dev integrations (from registry) ─────────────────────────────────
  const devIntegrations = await p.multiselect({
    message: 'Dev integrations:',
    initialValues: getRecommendedByCategory('dev-integration').map(b => b.name),
    options: bundleOptions('dev-integration'),
    required: false,
  })
  if (p.isCancel(devIntegrations)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 11. Cloud & infra (from registry) ────────────────────────────────────
  const cloudInfra = await p.multiselect({
    message: 'Cloud & infra:',
    options: bundleOptions('cloud-infra'),
    required: false,
  })
  if (p.isCancel(cloudInfra)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 12. Observability (from registry — skip if no bundles registered) ─────
  let observability: string[] = []
  const observabilityOptions = bundleOptions('observability')
  if (observabilityOptions.length > 0) {
    const result = await p.multiselect({
      message: 'Observability:',
      options: observabilityOptions,
      required: false,
    })
    if (p.isCancel(result)) { p.cancel('Cancelled'); process.exit(0) }
    observability = result as string[]
  }

  return {
    gitWorkflow: gitWorkflow as string[],
    memory: memory as string,
    workflowPresets: workflowPresets as string[],
    browserTools: browserTools as string[],
    webSearch: webSearch as string[],
    webScrape: webScrape as string[],
    libraryDocs: libraryDocs as string[],
    docConversion: docConversion as string[],
    codeExecution: codeExecution as string[],
    devIntegrations: devIntegrations as string[],
    cloudInfra: cloudInfra as string[],
    observability,
  }
}
