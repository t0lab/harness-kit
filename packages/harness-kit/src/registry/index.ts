import type { Artifact, BundleManifest, BundleCategory } from '@/registry/types.js'
import { validateRegistry } from '@/registry/validate.js'

import { manifest as tavilyM }       from '@/registry/bundles/workflow/tavily/manifest.js'
import { manifest as mem0M }         from '@/registry/bundles/workflow/mem0/manifest.js'
import { manifest as playwrightM }   from '@/registry/bundles/workflow/playwright/manifest.js'
import { manifest as browserUseM }   from '@/registry/bundles/workflow/browser-use/manifest.js'
import { manifest as agentBrowserM } from '@/registry/bundles/workflow/agent-browser/manifest.js'
import { manifest as braveSearchM }  from '@/registry/bundles/workflow/brave-search/manifest.js'
import { manifest as firecrawlM }    from '@/registry/bundles/workflow/firecrawl/manifest.js'
import { manifest as crawl4aiM }     from '@/registry/bundles/workflow/crawl4ai/manifest.js'
import { manifest as mempalaceM }    from '@/registry/bundles/workflow/mempalace/manifest.js'
import { manifest as claudeMemM }    from '@/registry/bundles/workflow/claude-mem/manifest.js'
import { manifest as docsAsCodeM }   from '@/registry/bundles/workflow/docs-as-code/manifest.js'
import { manifest as conventionalCommitsM } from '@/registry/bundles/workflow/conventional-commits/manifest.js'
import { manifest as branchStrategyM }       from '@/registry/bundles/workflow/branch-strategy/manifest.js'
import { manifest as preCommitHooksM }        from '@/registry/bundles/workflow/pre-commit-hooks/manifest.js'
import { manifest as commitSigningM }         from '@/registry/bundles/workflow/commit-signing/manifest.js'
import { manifest as specDrivenM }            from '@/registry/bundles/workflow/spec-driven/manifest.js'
import { manifest as tddM }                   from '@/registry/bundles/workflow/tdd/manifest.js'
import { manifest as planningFirstM }         from '@/registry/bundles/workflow/planning-first/manifest.js'
import { manifest as qualityGatesM }          from '@/registry/bundles/workflow/quality-gates/manifest.js'
import { manifest as parallelAgentsM }        from '@/registry/bundles/workflow/parallel-agents/manifest.js'
import { manifest as systematicDebuggingM }   from '@/registry/bundles/workflow/systematic-debugging/manifest.js'
import { manifest as codeReviewGatesM }       from '@/registry/bundles/workflow/code-review-gates/manifest.js'
import { manifest as securityReviewM }        from '@/registry/bundles/workflow/security-review/manifest.js'
import { manifest as contextDisciplineM }     from '@/registry/bundles/workflow/context-discipline/manifest.js'
import { manifest as localMemoryM }           from '@/registry/bundles/workflow/local-memory/manifest.js'
import { manifest as noMemoryM }              from '@/registry/bundles/workflow/no-memory/manifest.js'

import { manifest as stackTypescriptM } from '@/registry/bundles/stack/typescript/manifest.js'
import { manifest as stackPythonM }     from '@/registry/bundles/stack/python/manifest.js'
import { manifest as stackGoM }         from '@/registry/bundles/stack/go/manifest.js'
import { manifest as stackRustM }       from '@/registry/bundles/stack/rust/manifest.js'
import { manifest as stackJavaM }       from '@/registry/bundles/stack/java/manifest.js'

import { manifest as nextjsM }        from '@/registry/bundles/techstack/nextjs/manifest.js'
import { manifest as reactM }         from '@/registry/bundles/techstack/react/manifest.js'
import { manifest as vueM }           from '@/registry/bundles/techstack/vue/manifest.js'
import { manifest as expressM }       from '@/registry/bundles/techstack/express/manifest.js'
import { manifest as fastifyM }       from '@/registry/bundles/techstack/fastify/manifest.js'
import { manifest as fastapiM }       from '@/registry/bundles/techstack/fastapi/manifest.js'
import { manifest as djangoM }        from '@/registry/bundles/techstack/django/manifest.js'
import { manifest as springM }        from '@/registry/bundles/techstack/spring/manifest.js'
import { manifest as postgresqlM }    from '@/registry/bundles/techstack/postgresql/manifest.js'
import { manifest as redisM }         from '@/registry/bundles/techstack/redis/manifest.js'
import { manifest as supabaseM }      from '@/registry/bundles/techstack/supabase/manifest.js'
import { manifest as githubActionsM } from '@/registry/bundles/techstack/github-actions/manifest.js'
import { manifest as langchainM }     from '@/registry/bundles/techstack/langchain/manifest.js'
import { manifest as langgraphM }     from '@/registry/bundles/techstack/langgraph/manifest.js'

const ALL_BUNDLES: BundleManifest[] = [
  tavilyM, mem0M, playwrightM, browserUseM, agentBrowserM,
  braveSearchM, firecrawlM, crawl4aiM,
  mempalaceM, claudeMemM, docsAsCodeM,
  conventionalCommitsM, branchStrategyM, preCommitHooksM, commitSigningM,
  specDrivenM, tddM, planningFirstM, qualityGatesM, parallelAgentsM,
  systematicDebuggingM, codeReviewGatesM, securityReviewM, contextDisciplineM,
  localMemoryM, noMemoryM,
  stackTypescriptM, stackPythonM, stackGoM, stackRustM, stackJavaM,
  nextjsM, reactM, vueM,
  expressM, fastifyM, fastapiM, djangoM, springM,
  postgresqlM, redisM, supabaseM,
  githubActionsM,
  langchainM, langgraphM,
]

validateRegistry(ALL_BUNDLES)

export function getAllBundles(): BundleManifest[] {
  return ALL_BUNDLES
}

// Expand any type:'stack' artifacts into the referenced stack bundle's artifacts.
// Dedupes by (type, src/ref). Depth is always 1 because stack bundles cannot
// contain type:'stack' artifacts (enforced by validateRegistry).
export function resolveStackArtifacts(bundle: BundleManifest): Artifact[] {
  const seen = new Set<string>()
  const out: Artifact[] = []
  const push = (a: Artifact): void => {
    const key = a.type === 'stack' ? `stack:${a.ref}` : `${a.type}:${'src' in a ? a.src : JSON.stringify(a)}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(a)
  }

  const all: Artifact[] = [
    ...bundle.common.artifacts,
    ...Object.values(bundle.roles).flatMap((r) => r?.artifacts ?? []),
  ]

  for (const a of all) {
    if (a.type !== 'stack') {
      push(a)
      continue
    }
    const target = ALL_BUNDLES.find((b) => b.name === a.ref)
    if (!target) continue
    for (const inner of target.common.artifacts) push(inner)
    for (const role of Object.values(target.roles)) {
      for (const inner of role?.artifacts ?? []) push(inner)
    }
  }
  return out
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
