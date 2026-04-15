import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import chalk from 'chalk'
import { execa } from 'execa'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { Listr } from 'listr2'
import { WizardShell } from '@/wizard/components/ui/WizardShell.js'
import { runInk } from '@/wizard/lib/run-ink.js'
import { writeScaffoldFile } from '@/engine/scaffolder.js'
import { renderTemplate } from '@/engine/template-renderer.js'
import { getBundle } from '@/registry/index.js'
import { getRoleData } from '@/utils/bundle-utils.js'
import { executeAdd } from '@/commands/add.js'
import type { Artifact } from '@/registry/types.js'
import type { WizardContext } from '@/wizard/types.js'
import type { BudgetState } from '@/wizard/store/budget-state.js'
import type { ScaffoldFile } from '@/engine/scaffolder.js'
import type { SummaryItem } from '@/wizard/components/ui/Summary.js'

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

interface PreviewData {
  allBundles: string[]
  mcpConfigs: McpConfig[]
  depWarnings: string[]
  hasDocs: boolean
  toolsToInstall: WizardContext['toolsToInstall']
  files: ScaffoldFile[]
  conflicts: string[]
}

async function buildPreview(ctx: WizardContext, cwd: string): Promise<PreviewData> {
  const selectedBundles = collectSelectedBundles(ctx)
  const mcpConfigs = buildMcpConfigs(selectedBundles)
  const depWarnings = buildDependencyWarnings(selectedBundles)
  const hasDocs = ctx.workflowPresets.includes('docs-as-code')
  const allBundles = allSelectedBundleNames(ctx)
  const toolsToInstall = ctx.toolsToInstall ?? []

  const templateCtx = {
    ...ctx,
    mcp: mcpConfigs.map((m) => m.name),
    mcpConfigs,
    bundles: selectedBundles.map((b) => b.name),
  }
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

  const conflicts: string[] = []
  for (const file of files) {
    if (await fileExists(join(cwd, file.relativePath))) conflicts.push(file.relativePath)
  }

  return { allBundles, mcpConfigs, depWarnings, hasDocs, toolsToInstall, files, conflicts }
}

interface PreviewDecision {
  confirmed: boolean
  conflictResolutions: Map<string, 'overwrite' | 'skip'>
}

interface PreviewProps {
  preview: PreviewData
  budget: BudgetState
  onDone: (d: PreviewDecision) => void
  onCancel: () => void
}

function PreviewScreen({ preview, budget, onDone, onCancel }: PreviewProps) {
  type Phase = 'review' | 'conflict' | 'apply-confirm'
  const [phase, setPhase] = useState<Phase>('review')
  const [conflictIdx, setConflictIdx] = useState(0)
  const [resolutions, setResolutions] = useState<Map<string, 'overwrite' | 'skip'>>(new Map())

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) { onCancel(); return }

    if (phase === 'review') {
      if (key.return || input === 'y' || input === 'Y') {
        if (preview.conflicts.length > 0) setPhase('conflict')
        else onDone({ confirmed: true, conflictResolutions: resolutions })
      } else if (input === 'n' || input === 'N') {
        onCancel()
      }
      return
    }

    if (phase === 'conflict') {
      const file = preview.conflicts[conflictIdx]!
      const decide = (choice: 'overwrite' | 'skip') => {
        const next = new Map(resolutions)
        next.set(file, choice)
        setResolutions(next)
        if (conflictIdx + 1 < preview.conflicts.length) {
          setConflictIdx(conflictIdx + 1)
        } else {
          onDone({ confirmed: true, conflictResolutions: next })
        }
      }
      if (input === 'y' || input === 'Y' || key.return) decide('overwrite')
      else if (input === 'n' || input === 'N') decide('skip')
      return
    }
  })

  const summaryItems: SummaryItem[] = [
    { label: 'Project info', status: 'done' },
    { label: 'Tech stack', status: 'done' },
    { label: 'Detect tooling', status: 'done' },
    { label: 'Harness config', status: 'done' },
    { label: 'Preview', status: 'active' },
  ]

  if (phase === 'conflict') {
    const file = preview.conflicts[conflictIdx]!
    return (
      <WizardShell stepCurrent={5} stepTotal={5} stepTitle="Resolve conflict" summaryItems={summaryItems} budget={budget}>
        <Box flexDirection="column">
          <Text color="yellow">
            {file} already exists. Overwrite?
          </Text>
          <Box marginTop={1}>
            <Text dimColor>y = overwrite · n = skip · Enter = overwrite</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>{conflictIdx + 1} / {preview.conflicts.length}</Text>
          </Box>
        </Box>
      </WizardShell>
    )
  }

  return (
    <WizardShell stepCurrent={5} stepTotal={5} stepTitle="Preview" summaryItems={summaryItems} budget={budget}>
      <Box flexDirection="column">
        <Text bold>Will scaffold:</Text>
        <Box marginTop={1} flexDirection="column">
          <Text dimColor wrap="truncate-end">── Scaffold files</Text>
          {preview.files.map((f) => (
            <Text key={f.relativePath} wrap="truncate-end">  ✦ {f.relativePath}</Text>
          ))}
          <Text dimColor wrap="truncate-end">── Bundles ({preview.allBundles.length})</Text>
          <Text wrap="truncate-end">  ✦ {preview.allBundles.join(', ') || 'none'}</Text>
          {preview.mcpConfigs.length > 0 ? (
            <Text dimColor wrap="truncate-end">── MCP servers ({preview.mcpConfigs.length})</Text>
          ) : null}
          {preview.mcpConfigs.length > 0 ? (
            <Text wrap="truncate-end">  ✦ {preview.mcpConfigs.map((m) => m.name).join(', ')}</Text>
          ) : null}
          {(preview.toolsToInstall ?? []).length > 0 ? (
            <Text dimColor wrap="truncate-end">── Tools to install</Text>
          ) : null}
          {(preview.toolsToInstall ?? []).map((t: NonNullable<WizardContext["toolsToInstall"]>[number]) => (
            <Text key={t.label} wrap="truncate-end">  ✦ {t.label} <Text dimColor>({t.installCmd})</Text></Text>
          ))}
          {preview.depWarnings.length > 0 ? (
            <Text dimColor wrap="truncate-end">── Needs on system</Text>
          ) : null}
          {preview.depWarnings.map((w) => (
            <Text key={w} color="yellow" wrap="truncate-end">  ⚠ {w}</Text>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text>Apply? </Text>
          <Text dimColor>y / Enter = yes · n = no</Text>
        </Box>
      </Box>
    </WizardShell>
  )
}

export async function stepPreviewApply(ctx: WizardContext, budget: BudgetState): Promise<void> {
  const cwd = process.cwd()
  const preview = await buildPreview(ctx, cwd)

  const decision = await runInk<PreviewDecision>((resolve: (v: PreviewDecision) => void, reject: (e: Error) => void) =>
    <PreviewScreen
      preview={preview}
      budget={budget}
      onDone={resolve}
      onCancel={() => reject(new Error('Cancelled'))}
    />
  )

  if (!decision.confirmed) return

  // Exit alt-screen for listr2 + install output.
  process.stdout.write('\x1b[?1049l')

  await new Listr([{
    title: 'Writing files...',
    task: async () => {
      for (const file of preview.files) {
        await writeScaffoldFile(cwd, file, decision.conflictResolutions.get(file.relativePath) ?? 'overwrite')
      }
    },
  }]).run()

  if (preview.allBundles.length > 0) {
    console.log(`Installing bundles: ${preview.allBundles.join(', ')}…`)
    await installAllSelectedBundles(cwd, ctx)
    console.log(`Installed bundles: ${preview.allBundles.join(', ')}`)
  }

  const toolsToInstall = preview.toolsToInstall ?? []
  if (toolsToInstall.length > 0) {
    const installed: string[] = []
    for (const tool of toolsToInstall) {
      if (!tool.installCmd) continue
      try {
        await execa(tool.installCmd, { shell: true, cwd })
        installed.push(tool.label)
      } catch (err) {
        console.warn(`Failed to install ${tool.label}: ${(err as Error).message}`)
      }
    }
    if (installed.length > 0) console.log(`Installed tools: ${installed.join(', ')}`)
  }

  console.log(`\nharness-kit initialized.\nRun: ${chalk.blue('harness-kit status')} to see your harness.`)
}
