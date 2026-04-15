import { createMachine, assign, createActor } from 'xstate'
import type { WizardContext, WizardEvent } from '@/wizard/types.js'
import { stepProjectInfo, stepDetectTooling, stepHarnessConfig, stepPreviewApply, selectTechStack } from '@/wizard/components/steps'
import { TECH_OPTIONS } from '@/wizard/lib/tech-options'
import { applySymbolFix } from '@/wizard/lib/layout'
import { BudgetState } from '@/wizard/store/budget-state'
import { getRecommendedByCategory } from '@/registry'

const initialContext: WizardContext = {
  projectName: '',
  projectPurpose: '',
  projectUsers: '',
  projectConstraints: '',
  selectedTech: [],
  detectedIssues: [],
  toolsToInstall: [],
  gitWorkflow: getRecommendedByCategory('git-workflow').map(b => b.name),
  memory: getRecommendedByCategory('memory').map(b => b.name)[0] ?? 'local-memory',
  workflowPresets: getRecommendedByCategory('workflow-preset').map(b => b.name),
  browserTools: getRecommendedByCategory('browser').map(b => b.name),
  webSearch: getRecommendedByCategory('search').map(b => b.name),
  webScrape: getRecommendedByCategory('scrape').map(b => b.name),
}

export const wizardMachine = createMachine({
  id: 'wizard',
  initial: 'projectInfo',
  types: {} as { context: WizardContext; events: WizardEvent },
  context: initialContext,
  states: {
    projectInfo: {
      on: {
        NEXT: {
          target: 'techStackSelect',
          actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
        },
      },
    },
    techStackSelect: {
      on: {
        NEXT: [
          {
            guard: ({ context, event }) => {
              const data = (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}
              const tech = data.selectedTech ?? context.selectedTech
              return tech.length === 0
            },
            target: 'harnessConfig',
            actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
          },
          {
            target: 'detectTooling',
            actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
          },
        ],
      },
    },
    detectTooling: {
      on: {
        NEXT: {
          target: 'harnessConfig',
          actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
        },
        SKIP_DETECT: { target: 'harnessConfig' },
      },
    },
    harnessConfig: {
      on: {
        NEXT: {
          target: 'preview',
          actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
        },
      },
    },
    preview: {
      on: {
        CONFIRM: { target: 'apply' },
        BACK: { target: 'harnessConfig' },
      },
    },
    apply: {
      on: {
        DONE: { target: 'done' },
        ERROR: { target: 'done' },
      },
    },
    done: { type: 'final' },
  },
})

export async function runWizard(): Promise<void> {
  applySymbolFix()

  const budget = new BudgetState()
  await budget.initialize()

  // Wrap the entire wizard in the alternate screen buffer so every step shares
  // one canvas with a persistent budget footer.
  process.stdout.write('\x1b[?1049h\x1b[2J\x1b[H')
  const exitAltScreen = () => process.stdout.write('\x1b[?1049l')
  process.once('exit', exitAltScreen)

  const actor = createActor(wizardMachine)
  actor.start()

  try {
    while (actor.getSnapshot().status !== 'done') {
      const state = actor.getSnapshot().value as string
      const ctx = actor.getSnapshot().context

      switch (state) {
        case 'projectInfo': {
          const data = await stepProjectInfo(budget)
          actor.send({ type: 'NEXT', data })
          break
        }
        case 'techStackSelect': {
          const selectedTech = await selectTechStack(TECH_OPTIONS, budget)
          budget.selectedTech = selectedTech
          actor.send({ type: 'NEXT', data: { selectedTech } })
          break
        }
        case 'detectTooling': {
          const data = await stepDetectTooling(ctx, budget)
          actor.send({ type: 'NEXT', data })
          break
        }
        case 'harnessConfig': {
          const data = await stepHarnessConfig(ctx, budget)
          actor.send({ type: 'NEXT', data })
          break
        }
        case 'preview': {
          await stepPreviewApply(actor.getSnapshot().context, budget)
          actor.send({ type: 'CONFIRM' })
          break
        }
        case 'apply': {
          actor.send({ type: 'DONE' })
          break
        }
        default:
          actor.send({ type: 'DONE' })
      }
    }
  } catch (err) {
    actor.send({ type: 'ERROR', error: err as Error })
    if (err instanceof Error && err.message === 'Cancelled') {
      console.log('\nWizard cancelled.')
      return
    }
    throw err
  } finally {
    exitAltScreen()
    process.removeListener('exit', exitAltScreen)
  }
}
