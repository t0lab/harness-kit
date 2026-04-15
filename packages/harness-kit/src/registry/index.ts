import type { BundleManifest, BundleCategory } from './types.js'

import { manifest as tavilyM }       from './bundles/workflow/tavily/manifest.js'
import { manifest as mem0M }         from './bundles/workflow/mem0/manifest.js'
import { manifest as playwrightM }   from './bundles/workflow/playwright/manifest.js'
import { manifest as browserUseM }   from './bundles/workflow/browser-use/manifest.js'
import { manifest as agentBrowserM } from './bundles/workflow/agent-browser/manifest.js'
import { manifest as braveSearchM }  from './bundles/workflow/brave-search/manifest.js'
import { manifest as firecrawlM }    from './bundles/workflow/firecrawl/manifest.js'
import { manifest as crawl4aiM }     from './bundles/workflow/crawl4ai/manifest.js'
import { manifest as mempalaceM }    from './bundles/workflow/mempalace/manifest.js'
import { manifest as claudeMemM }    from './bundles/workflow/claude-mem/manifest.js'
import { manifest as docsAsCodeM }   from './bundles/workflow/docs-as-code/manifest.js'
import { manifest as conventionalCommitsM } from './bundles/workflow/conventional-commits/manifest.js'
import { manifest as branchStrategyM }       from './bundles/workflow/branch-strategy/manifest.js'
import { manifest as preCommitHooksM }        from './bundles/workflow/pre-commit-hooks/manifest.js'
import { manifest as commitSigningM }         from './bundles/workflow/commit-signing/manifest.js'
import { manifest as specDrivenM }            from './bundles/workflow/spec-driven/manifest.js'
import { manifest as tddM }                   from './bundles/workflow/tdd/manifest.js'
import { manifest as planningFirstM }         from './bundles/workflow/planning-first/manifest.js'
import { manifest as qualityGatesM }          from './bundles/workflow/quality-gates/manifest.js'
import { manifest as parallelAgentsM }        from './bundles/workflow/parallel-agents/manifest.js'
import { manifest as systematicDebuggingM }   from './bundles/workflow/systematic-debugging/manifest.js'
import { manifest as codeReviewGatesM }       from './bundles/workflow/code-review-gates/manifest.js'
import { manifest as securityReviewM }        from './bundles/workflow/security-review/manifest.js'
import { manifest as contextDisciplineM }     from './bundles/workflow/context-discipline/manifest.js'
import { manifest as localMemoryM }           from './bundles/workflow/local-memory/manifest.js'
import { manifest as noMemoryM }              from './bundles/workflow/no-memory/manifest.js'

const ALL_BUNDLES: BundleManifest[] = [
  tavilyM, mem0M, playwrightM, browserUseM, agentBrowserM,
  braveSearchM, firecrawlM, crawl4aiM,
  mempalaceM, claudeMemM, docsAsCodeM,
  conventionalCommitsM, branchStrategyM, preCommitHooksM, commitSigningM,
  specDrivenM, tddM, planningFirstM, qualityGatesM, parallelAgentsM,
  systematicDebuggingM, codeReviewGatesM, securityReviewM, contextDisciplineM,
  localMemoryM, noMemoryM,
]

export function getAllBundles(): BundleManifest[] {
  return ALL_BUNDLES
}

export function getBundlesByCategory(category: BundleCategory): BundleManifest[] {
  return ALL_BUNDLES.filter((b) => category in b.roles)
}

export function getBundle(name: string): BundleManifest {
  const bundle = ALL_BUNDLES.find((b) => b.name === name)
  if (!bundle) throw new Error(`Bundle not found: ${name}`)
  return bundle
}

export function getRecommendedByCategory(category: BundleCategory): BundleManifest[] {
  return getBundlesByCategory(category).filter((b) => b.roles[category]?.recommended)
}
