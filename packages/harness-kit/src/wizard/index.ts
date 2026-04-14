import { createMachine, assign, createActor } from 'xstate'
import type { WizardContext, WizardEvent } from './types.js'
import { stepProjectInfo } from './steps/project-info.js'
import { stepDetectTooling } from './steps/detect-tooling.js'
import { stepHarnessConfig } from './steps/harness-config.js'
import { stepPreviewApply } from './steps/preview-apply.js'
import { selectTechStack } from './steps/tech-stack-select.js'
import { TECH_OPTIONS } from './tech-options.js'
import { applySymbolFix } from './layout.js'
import { getRecommendedByCategory } from '../registry/index.js'

const initialContext: WizardContext = {
  projectName: '',
  projectPurpose: '',
  projectUsers: '',
  projectConstraints: '',
  selectedTech: [],
  detectedIssues: [],
  installSelected: false,
  gitWorkflow: getRecommendedByCategory('git-workflow').map(b => b.name),
  memory: getRecommendedByCategory('memory').map(b => b.name)[0] ?? 'local-memory',
  workflowPresets: getRecommendedByCategory('workflow-preset').map(b => b.name),
  browserTools: getRecommendedByCategory('browser').map(b => b.name),
  webSearch: getRecommendedByCategory('search').map(b => b.name),
  webScrape: getRecommendedByCategory('scrape').map(b => b.name),
  devIntegrations: getRecommendedByCategory('dev-integration').map(b => b.name),
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

  const actor = createActor(wizardMachine)
  actor.start()

  while (actor.getSnapshot().status !== 'done') {
    const state = actor.getSnapshot().value as string
    const ctx = actor.getSnapshot().context

    try {
      switch (state) {
        case 'projectInfo': {
          const data = await stepProjectInfo()
          actor.send({ type: 'NEXT', data })
          break
        }
        case 'techStackSelect': {
          const selectedTech = await selectTechStack(TECH_OPTIONS)
          actor.send({ type: 'NEXT', data: { selectedTech } })
          break
        }
        case 'detectTooling': {
          const data = await stepDetectTooling(ctx)
          actor.send({ type: 'NEXT', data })
          break
        }
        case 'harnessConfig': {
          const data = await stepHarnessConfig(ctx)
          actor.send({ type: 'NEXT', data })
          break
        }
        case 'preview': {
          await stepPreviewApply(actor.getSnapshot().context)
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
    } catch (err) {
      actor.send({ type: 'ERROR', error: err as Error })
      throw err
    }
  }
}
