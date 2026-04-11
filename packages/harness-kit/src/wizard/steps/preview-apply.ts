import * as p from '@clack/prompts'
import chalk from 'chalk'
import { Listr } from 'listr2'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeScaffoldFile } from '../../engine/scaffolder.js'
import { renderTemplate } from '../../engine/template-renderer.js'
import { loadMcpManifests } from '../../registry/loader.js'
import type { WizardContext } from '../types.js'
import type { ScaffoldFile } from '../../engine/scaffolder.js'

const REGISTRY_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../registry')

function buildMcpList(ctx: WizardContext): string[] {
  return [...ctx.browserTools, ...ctx.webSearch, ...ctx.webCrawl, ...ctx.libraryDocs, ...ctx.otherMcp]
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
  const allMcp = buildMcpList(ctx)

  p.note(
    [
      '── Core ──────────────────────────────────────────────',
      '  ✦ CLAUDE.md  (template)',
      '  ✦ AGENTS.md',
      '  ✦ harness.json',
      '  ✦ llms.txt',
      '── Claude config ─────────────────────────────────────',
      '  ✦ .claude/settings.json',
      `── MCP config (${allMcp.length}) ──────────────────────────────────────`,
      `  ✦ .mcp.json  (${allMcp.join(', ') || 'none'})`,
      ...(ctx.docsAsCode ? [
        '── Docs ──────────────────────────────────────────────',
        '  ✦ docs/DESIGN.md',
      ] : []),
    ].join('\n'),
    'Will scaffold:'
  )

  const confirm = await p.confirm({ message: 'Apply?', initialValue: true })
  if (p.isCancel(confirm) || !confirm) { p.cancel('Aborted'); process.exit(0) }

  const mcpManifests = await loadMcpManifests(join(REGISTRY_DIR, 'mcp'))
  const selectedManifests = mcpManifests.filter((m) => allMcp.includes(m.name))
  const modules = buildModules(ctx)
  const templateCtx = {
    ...ctx,
    mcp: allMcp,
    mcpConfigs: selectedManifests,
    modules,
    aiGenerationEnabled: false,
  }

  const files: ScaffoldFile[] = []

  const tasks = new Listr([
    {
      title: 'Rendering templates...',
      task: async () => {
        files.push(
          { relativePath: 'CLAUDE.md', content: await renderTemplate('CLAUDE.md.hbs', templateCtx) },
          { relativePath: 'AGENTS.md', content: await renderTemplate('AGENTS.md.hbs', templateCtx) },
          { relativePath: 'harness.json', content: await renderTemplate('harness.json.hbs', templateCtx) },
          { relativePath: 'llms.txt', content: await renderTemplate('llms.txt.hbs', templateCtx) },
          { relativePath: '.claude/settings.json', content: await renderTemplate('settings.json.hbs', templateCtx) },
        )
        if (allMcp.length > 0) {
          files.push({ relativePath: '.mcp.json', content: await renderTemplate('mcp.json.hbs', templateCtx) })
        }
        if (ctx.docsAsCode) {
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
