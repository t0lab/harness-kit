import * as p from '@clack/prompts'
import type { WizardContext } from '../types.js'

export async function stepHarnessConfig(ctx: WizardContext): Promise<Partial<WizardContext>> {
  if (ctx.selectedTech.length > 0) {
    p.log.step(`Tech stack: ${ctx.selectedTech.join(', ')}`)
  }

  const gitWorkflow = await p.multiselect({
    message: 'Git workflow:',
    initialValues: ['conventional-commits', 'branch-strategy', 'pre-commit-hooks'],
    options: [
      { value: 'conventional-commits', label: 'Conventional Commits', hint: 'commit format + semantic versioning' },
      { value: 'branch-strategy', label: 'Branch strategy', hint: 'feature/fix/chore naming, PR < 400 lines' },
      { value: 'pre-commit-hooks', label: 'Pre-commit hooks', hint: 'lint + typecheck + test before commit' },
      { value: 'commit-signing', label: 'Commit signing', hint: 'GPG / SSH' },
    ],
    required: false,
  })
  if (p.isCancel(gitWorkflow)) { p.cancel('Cancelled'); process.exit(0) }

  const memory = await p.select({
    message: 'Long-term memory:',
    options: [
      { value: 'file-based', label: 'File-based', hint: '.claude/memory/ — local, zero dependency' },
      { value: 'mem0', label: 'Mem0 MCP', hint: 'cloud, 90% token reduction (needs API key)' },
      { value: 'obsidian', label: 'Obsidian MCP', hint: 'sync with Obsidian vault' },
      { value: 'none', label: 'None' },
    ],
  })
  if (p.isCancel(memory)) { p.cancel('Cancelled'); process.exit(0) }

  const docsAsCode = await p.confirm({
    message: 'Docs as code? (AGENTS.md, spec template, ADR structure, llms.txt)',
    initialValue: true,
  })
  if (p.isCancel(docsAsCode)) { p.cancel('Cancelled'); process.exit(0) }

  const workflowPresets = await p.multiselect({
    message: 'Workflow presets:',
    initialValues: ['spec-driven', 'tdd', 'planning-first', 'quality-gates'],
    options: [
      { value: 'spec-driven', label: 'Spec-driven', hint: 'brainstorm → spec → plan → implement' },
      { value: 'tdd', label: 'TDD', hint: 'failing test before implementation' },
      { value: 'planning-first', label: 'Planning-first', hint: 'draft plan → review → implement' },
      { value: 'quality-gates', label: 'Quality gates', hint: 'tests pass before done (Stop hook)' },
      { value: 'parallel-agents', label: 'Parallel agents', hint: 'subagents for independent tasks' },
      { value: 'systematic-debugging', label: 'Systematic debugging', hint: 'reproduce → isolate → verify → fix' },
      { value: 'code-review-gates', label: 'Code review gates', hint: 'review before commit/merge' },
      { value: 'security-review', label: 'Security review', hint: 'validate bash, block dangerous ops' },
      { value: 'context-discipline', label: 'Context discipline', hint: 'fresh session rules, task decomp guide' },
    ],
    required: false,
  })
  if (p.isCancel(workflowPresets)) { p.cancel('Cancelled'); process.exit(0) }

  const browserTools = await p.multiselect({
    message: 'Browser automation:',
    initialValues: ['playwright'],
    options: [
      { value: 'playwright', label: 'Playwright MCP', hint: 'accessibility snapshots, E2E test gen' },
      { value: 'agent-browser', label: 'agent-browser', hint: 'Vercel Labs, Chrome DevTools Protocol' },
      { value: 'stagehand', label: 'Stagehand', hint: 'AI-native, natural language commands' },
    ],
    required: false,
  })
  if (p.isCancel(browserTools)) { p.cancel('Cancelled'); process.exit(0) }

  const webSearch = await p.multiselect({
    message: 'Web search:',
    initialValues: ['tavily'],
    options: [
      { value: 'tavily', label: 'Tavily MCP', hint: 'real-time search + extract, free tier' },
      { value: 'exa', label: 'Exa MCP', hint: 'semantic search, code/GitHub optimized' },
      { value: 'brave-search', label: 'Brave Search MCP', hint: 'privacy-focused' },
    ],
    required: false,
  })
  if (p.isCancel(webSearch)) { p.cancel('Cancelled'); process.exit(0) }

  const webCrawl = await p.multiselect({
    message: 'Web crawl & scrape:',
    initialValues: ['firecrawl'],
    options: [
      { value: 'firecrawl', label: 'Firecrawl MCP', hint: 'HTML→markdown, JS-enabled' },
      { value: 'crawl4ai', label: 'Crawl4AI MCP', hint: 'open-source, self-hosted Docker' },
      { value: 'spider', label: 'Spider.cloud MCP', hint: 'Rust, anti-bot, full-site' },
      { value: 'apify', label: 'Apify MCP', hint: '1000+ pre-built actors' },
      { value: 'bright-data', label: 'Bright Data MCP', hint: 'residential proxies, anti-bot' },
    ],
    required: false,
  })
  if (p.isCancel(webCrawl)) { p.cancel('Cancelled'); process.exit(0) }

  const libraryDocs = await p.multiselect({
    message: 'Library docs: (Enter to skip)',
    options: [
      { value: 'context7', label: 'Context7 MCP', hint: 'version-specific docs for any package' },
    ],
    required: false,
  })
  if (p.isCancel(libraryDocs)) { p.cancel('Cancelled'); process.exit(0) }

  const docConversion = await p.multiselect({
    message: 'Document conversion: (Enter to skip)',
    options: [
      { value: 'markitdown', label: 'MarkItDown', hint: 'PDF/Word/HTML/audio → markdown (Python, local)' },
    ],
    required: false,
  })
  if (p.isCancel(docConversion)) { p.cancel('Cancelled'); process.exit(0) }

  const otherMcp = await p.multiselect({
    message: 'Other MCP integrations: (Enter to skip)',
    options: [
      { value: 'github', label: 'GitHub MCP' },
      { value: 'supabase', label: 'Supabase MCP' },
      { value: 'vercel', label: 'Vercel MCP' },
    ],
    required: false,
  })
  if (p.isCancel(otherMcp)) { p.cancel('Cancelled'); process.exit(0) }

  return {
    gitWorkflow: gitWorkflow as string[],
    memory: memory as WizardContext['memory'],
    docsAsCode: Boolean(docsAsCode),
    workflowPresets: workflowPresets as string[],
    browserTools: browserTools as string[],
    webSearch: webSearch as string[],
    webCrawl: webCrawl as string[],
    libraryDocs: libraryDocs as string[],
    docConversion: docConversion as string[],
    otherMcp: otherMcp as string[],
  }
}
