import type { BundleManifest, BundleCategory } from './types.js'

import { manifest as tavilyM }       from './bundles/tavily/manifest.js'
import { manifest as mem0M }         from './bundles/mem0/manifest.js'
import { manifest as playwrightM }   from './bundles/playwright/manifest.js'
import { manifest as browserUseM }   from './bundles/browser-use/manifest.js'
import { manifest as agentBrowserM } from './bundles/agent-browser/manifest.js'
import { manifest as braveSearchM }  from './bundles/brave-search/manifest.js'
import { manifest as firecrawlM }    from './bundles/firecrawl/manifest.js'
import { manifest as crawl4aiM }     from './bundles/crawl4ai/manifest.js'
import { manifest as mempalaceM }    from './bundles/mempalace/manifest.js'
import { manifest as claudeMemM }    from './bundles/claude-mem/manifest.js'
import { manifest as docsAsCodeM }   from './bundles/docs-as-code/manifest.js'
import { manifest as conventionalCommitsM } from './bundles/conventional-commits/manifest.js'
import { manifest as branchStrategyM }       from './bundles/branch-strategy/manifest.js'
import { manifest as preCommitHooksM }        from './bundles/pre-commit-hooks/manifest.js'
import { manifest as commitSigningM }         from './bundles/commit-signing/manifest.js'
import { manifest as specDrivenM }            from './bundles/spec-driven/manifest.js'
import { manifest as tddM }                   from './bundles/tdd/manifest.js'
import { manifest as planningFirstM }         from './bundles/planning-first/manifest.js'
import { manifest as qualityGatesM }          from './bundles/quality-gates/manifest.js'
import { manifest as parallelAgentsM }        from './bundles/parallel-agents/manifest.js'
import { manifest as systematicDebuggingM }   from './bundles/systematic-debugging/manifest.js'
import { manifest as codeReviewGatesM }       from './bundles/code-review-gates/manifest.js'
import { manifest as securityReviewM }        from './bundles/security-review/manifest.js'
import { manifest as contextDisciplineM }     from './bundles/context-discipline/manifest.js'
import { manifest as localMemoryM }           from './bundles/local-memory/manifest.js'
import { manifest as noMemoryM }              from './bundles/no-memory/manifest.js'

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
