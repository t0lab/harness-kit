import * as p from '@clack/prompts'
import chalk from 'chalk'
import { execa } from 'execa'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { Listr } from 'listr2'
import { writeScaffoldFile } from '../../engine/scaffolder.js'
import { renderTemplate } from '../../engine/template-renderer.js'
import { getBundle } from '../../registry/index.js'
import { getRoleData } from '../../utils/bundle-utils.js'
import { executeAdd } from '../../commands/add.js'
import type { Artifact } from '../../registry/types.js'
import type { WizardContext } from '../types.js'
import type { ScaffoldFile } from '../../engine/scaffolder.js'

async function fileExists(path: string): Promise<boolean> {
  try { await access(path); return true } catch { return false }
}

interface McpConfig {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
}

export function allSelectedBundleNames(ctx: WizardContext): string[] {
  return [
    ...ctx.selectedTech,
    ...ctx.gitWorkflow,
    ...ctx.workflowPresets,
    ...ctx.browserTools,
    ...ctx.webSearch,
    ...ctx.webScrape,
    ...(ctx.memory !== 'no-memory' ? [ctx.memory] : []),
  ]
}

export async function installAllSelectedBundles(cwd: string, ctx: WizardContext): Promise<void> {
  for (const name of allSelectedBundleNames(ctx)) {
    try {
      getBundle(name)
    } catch {
      p.log.warn(`Skipping "${name}" — no bundle registered for this selection.`)
      continue
    }
    await executeAdd(cwd, name, { yes: true, silent: true })
  }
}

export function collectSelectedBundles(ctx: WizardContext): Array<{ name: string; role: string }> {
  const names = [
    ...ctx.browserTools,
    ...ctx.webSearch,
    ...ctx.webScrape,
    ...(ctx.memory !== 'no-memory' ? [ctx.memory] : []),
  ]
  return names
    .filter((name) => {
      try { getBundle(name); return true } catch { return false }
    })
    .map((name) => ({ name, role: getBundle(name).defaultRole }))
}

function resolveArtifacts(name: string, role: string): Artifact[] {
  const bundle = getBundle(name)
  const roleArtifacts = getRoleData(bundle, role)?.artifacts ?? []
  return [...bundle.common.artifacts, ...roleArtifacts]
}

function buildMcpConfigs(selected: Array<{ name: string; role: string }>): McpConfig[] {
  return selected.flatMap(({ name, role }) =>
    resolveArtifacts(name, role)
      .filter((a): a is Extract<Artifact, { type: 'mcp' }> => a.type === 'mcp')
      .map((a) => {
        const config: McpConfig = { name, command: a.command, args: a.args }
        if (a.env) config.env = a.env
        return config
      })
  )
}

function buildDependencyWarnings(selected: Array<{ name: string; role: string }>): string[] {
  return selected.flatMap(({ name, role }) => {
    const bundle = getBundle(name)
    const requires = [
      ...(bundle.common.requires ?? []),
      ...(getRoleData(bundle, role)?.requires ?? []),
    ]
    return requires.length > 0 ? [`${name} — needs ${requires.join(' + ')}`] : []
  })
}


export async function stepPreviewApply(ctx: WizardContext): Promise<void> {
  const cwd = process.cwd()
  const selectedBundles = collectSelectedBundles(ctx)
  const mcpConfigs = buildMcpConfigs(selectedBundles)
  const depWarnings = buildDependencyWarnings(selectedBundles)
  const hasDocs = ctx.workflowPresets.includes('docs-as-code')

  const allBundles = allSelectedBundleNames(ctx)
  const toolsToInstall = ctx.toolsToInstall ?? []

  const noteLines = [
    '── Scaffold files ────────────────────────────────────',
    '  ✦ CLAUDE.md, AGENTS.md, harness.json, llms.txt',
    '  ✦ .claude/settings.json',
    ...(mcpConfigs.length > 0 ? ['  ✦ .mcp.json'] : []),
    ...(hasDocs ? ['  ✦ docs/DESIGN.md'] : []),
    `── Bundles (${allBundles.length}) ──────────────────────────────────`,
    `  ✦ ${allBundles.join(', ') || 'none'}`,
    ...(mcpConfigs.length > 0 ? [
      `── MCP servers (${mcpConfigs.length}) ───────────────────────────────`,
      `  ✦ ${mcpConfigs.map((m) => m.name).join(', ')}`,
    ] : []),
    ...(toolsToInstall.length > 0 ? [
      '── Tools to install ──────────────────────────────────',
      ...toolsToInstall.map((t) => `  ✦ ${t.label}  (${t.installCmd})`),
    ] : []),
    ...(depWarnings.length > 0 ? [
      '── Needs on system ───────────────────────────────────',
      ...depWarnings.map((w) => `  ⚠ ${w}`),
    ] : []),
  ]

  p.note(noteLines.join('\n'), 'Sẽ scaffold:')

  const confirm = await p.confirm({ message: 'Apply?', initialValue: true })
  if (p.isCancel(confirm) || !confirm) { p.cancel('Cancelled'); process.exit(0) }

  const templateCtx = {
    ...ctx,
    mcp: mcpConfigs.map((m) => m.name),
    mcpConfigs,
    bundles: selectedBundles.map((b) => b.name),
  }

  const spinner = p.spinner()
  spinner.start('Rendering templates...')

  const files: ScaffoldFile[] = [
    { relativePath: 'CLAUDE.md',             content: await renderTemplate('CLAUDE.md.hbs', templateCtx) },
    { relativePath: 'AGENTS.md',             content: await renderTemplate('AGENTS.md.hbs', templateCtx) },
    { relativePath: 'harness.json',          content: await renderTemplate('harness.json.hbs', templateCtx) },
    { relativePath: 'llms.txt',              content: await renderTemplate('llms.txt.hbs', templateCtx) },
    { relativePath: '.claude/settings.json', content: await renderTemplate('settings.json.hbs', templateCtx) },
  ]
  if (mcpConfigs.length > 0) {
    files.push({ relativePath: '.mcp.json', content: await renderTemplate('mcp.json.hbs', templateCtx) })
  }
  if (hasDocs) {
    files.push({ relativePath: 'docs/DESIGN.md', content: `# ${ctx.projectName} — Design\n\n${ctx.projectPurpose}\n` })
  }

  spinner.stop('Templates rendered')

  const conflictMap = new Map<string, 'overwrite' | 'skip'>()
  for (const file of files) {
    if (await fileExists(join(cwd, file.relativePath))) {
      const choice = await p.confirm({ message: `${file.relativePath} already exists. Overwrite?`, initialValue: true })
      if (p.isCancel(choice)) { p.cancel('Cancelled'); process.exit(0) }
      conflictMap.set(file.relativePath, choice ? 'overwrite' : 'skip')
    }
  }

  await new Listr([{
    title: 'Writing files...',
    task: async () => {
      for (const file of files) {
        await writeScaffoldFile(cwd, file, conflictMap.get(file.relativePath) ?? 'overwrite')
      }
    },
  }]).run()

  if (allBundles.length > 0) {
    const installSpinner = p.spinner()
    installSpinner.start('Installing bundles...')
    await installAllSelectedBundles(cwd, ctx)
    installSpinner.stop(`Installed bundles: ${allBundles.join(', ')}`)
  }

  if (toolsToInstall.length > 0) {
    const toolSpinner = p.spinner()
    toolSpinner.start('Installing tools...')
    const installed: string[] = []
    for (const tool of toolsToInstall) {
      if (!tool.installCmd) continue
      try {
        await execa(tool.installCmd, { shell: true, cwd })
        installed.push(tool.label)
      } catch (err) {
        p.log.warn(`Failed to install ${tool.label}: ${(err as Error).message}`)
      }
    }
    toolSpinner.stop(installed.length > 0 ? `Installed tools: ${installed.join(', ')}` : 'No tools installed')
  }

  p.outro(`harness-kit initialized.\nRun: ${chalk.blue('harness-kit status')} to see your harness.`)
}
