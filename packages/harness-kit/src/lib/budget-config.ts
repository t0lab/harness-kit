export const DEFAULT_CONTEXT_WINDOW = 200_000
export const WARN_THRESHOLD_PERCENT = 40

export type ContextWindowSource = 'flag' | 'env' | 'harness.json' | 'default'

export interface BudgetOptions {
  contextWindow?: number
}

interface HarnessConfigWithWindow {
  contextWindow?: number
}

export function resolveContextWindow(
  options: BudgetOptions,
  harnessJson: HarnessConfigWithWindow = {},
  env: NodeJS.ProcessEnv = process.env
): { value: number; source: ContextWindowSource } {
  if (typeof options.contextWindow === 'number' && options.contextWindow > 0) {
    return { value: options.contextWindow, source: 'flag' }
  }
  const envVal = env.HARNESS_KIT_CONTEXT_WINDOW
  if (envVal) {
    const n = Number(envVal)
    if (Number.isFinite(n) && n > 0) return { value: n, source: 'env' }
  }
  if (typeof harnessJson.contextWindow === 'number' && harnessJson.contextWindow > 0) {
    return { value: harnessJson.contextWindow, source: 'harness.json' }
  }
  return { value: DEFAULT_CONTEXT_WINDOW, source: 'default' }
}
