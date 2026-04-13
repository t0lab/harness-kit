import * as p from '@clack/prompts'
import chalk from 'chalk'
import { Listr } from 'listr2'
import { writeScaffoldFile } from '../../engine/scaffolder.js'
import { renderTemplate } from '../../engine/template-renderer.js'
import { getBundle } from '../../registry/index.js'
import type { Artifact, BundleCategory } from '../../registry/types.js'
import type { WizardContext } from '../types.js'
import type { ScaffoldFile } from '../../engine/scaffolder.js'

interface McpConfig {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
}

export function collectSelectedBundles(ctx: WizardContext): Array<{ name: string; role: string }> {
  const names = [
    ...ctx.browserTools,
    ...ctx.webSearch,
    ...ctx.webScrape,
    ...ctx.libraryDocs,
    ...ctx.docConversion,
    ...ctx.codeExecution,
    ...ctx.devIntegrations,
    ...ctx.cloudInfra,
    ...ctx.observability,
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
  const roleArtifacts = bundle.roles[role as BundleCategory]?.artifacts ?? []
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
      ...(bundle.roles[role as BundleCategory]?.requires ?? []),
    ]
    return requires.length > 0 ? [`${name} — needs ${requires.join(' + ')}`] : []
  })
}

function buildModules(ctx: WizardContext): string[] {
  return [
    ...(ctx.gitWorkflow.includes('conventional-commits') ? ['rules/git-conventional'] : []),
    ...(ctx.selectedTech.some((t) => ['nextjs', 'react', 'vue', 'sveltekit', 'vanilla-ts'].includes(t)) ? ['rules/typescript'] : []),
    ...(ctx.workflowPresets.includes('tdd') ? ['skills/tdd-workflow'] : []),
    ...(ctx.workflowPresets.includes('spec-driven') ? ['skills/brainstorming'] : []),
    ...(ctx.gitWorkflow.includes('pre-commit-hooks') ? ['hooks/pre-commit'] : []),
    ...(ctx.workflowPresets.includes('quality-gates') ? ['hooks/quality-gate'] : []),
  ]
}

export async function stepPreviewApply(ctx: WizardContext): Promise<void> {
  const cwd = process.cwd()
  const selectedBundles = collectSelectedBundles(ctx)
  const mcpConfigs = buildMcpConfigs(selectedBundles)
  const depWarnings = buildDependencyWarnings(selectedBundles)
  const hasDocs = ctx.workflowPresets.includes('docs-as-code')

  const noteLines = [
    '── Core ──────────────────────────────────────────────',
    '  ✦ CLAUDE.md  (template)',
    '  ✦ AGENTS.md',
    '  ✦ harness.json',
    '  ✦ llms.txt',
    '── Claude config ─────────────────────────────────────',
    '  ✦ .claude/settings.json',
    `── MCP config (${mcpConfigs.length}) ──────────────────────────────────────`,
    `  ✦ .mcp.json  (${mcpConfigs.map((m) => m.name).join(', ') || 'none'})`,
    ...(hasDocs ? [
      '── Docs ──────────────────────────────────────────────',
      '  ✦ docs/DESIGN.md',
    ] : []),
    ...(depWarnings.length > 0 ? [
      '── Cần cài thêm ──────────────────────────────────────',
      ...depWarnings.map((w) => `  ⚠ ${w}`),
    ] : []),
  ]

  p.note(noteLines.join('\n'), 'Sẽ scaffold:')

  const confirm = await p.confirm({ message: 'Apply?', initialValue: true })
  if (p.isCancel(confirm) || !confirm) { p.cancel('Cancelled'); process.exit(0) }

  const modules = buildModules(ctx)
  const templateCtx = {
    ...ctx,
    mcp: mcpConfigs.map((m) => m.name),
    mcpConfigs,
    modules,
    aiGenerationEnabled: false,
  }

  const files: ScaffoldFile[] = []

  const tasks = new Listr([
    {
      title: 'Rendering templates...',
      task: async () => {
        files.push(
          { relativePath: 'CLAUDE.md',              content: await renderTemplate('CLAUDE.md.hbs', templateCtx) },
          { relativePath: 'AGENTS.md',              content: await renderTemplate('AGENTS.md.hbs', templateCtx) },
          { relativePath: 'harness.json',           content: await renderTemplate('harness.json.hbs', templateCtx) },
          { relativePath: 'llms.txt',               content: await renderTemplate('llms.txt.hbs', templateCtx) },
          { relativePath: '.claude/settings.json',  content: await renderTemplate('settings.json.hbs', templateCtx) },
        )
        if (mcpConfigs.length > 0) {
          files.push({ relativePath: '.mcp.json', content: await renderTemplate('mcp.json.hbs', templateCtx) })
        }
        if (hasDocs) {
          files.push({ relativePath: 'docs/DESIGN.md', content: `# ${ctx.projectName} — Design\n\n${ctx.projectPurpose}\n` })
        }
      },
    },
    {
      title: 'Writing files...',
      task: async () => {
        for (const file of files) {
          await writeScaffoldFile(cwd, file, 'overwrite')
        }
      },
    },
  ])

  await tasks.run()

  p.outro(`harness-kit initialized.\nRun: ${chalk.blue('harness-kit status')} to see your harness.`)
}
