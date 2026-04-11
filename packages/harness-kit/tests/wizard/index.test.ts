import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { wizardMachine } from '../../src/wizard/index.js'

describe('wizardMachine', () => {
  it('starts in projectInfo state', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    expect(actor.getSnapshot().value).toBe('projectInfo')
    actor.stop()
  })

  it('transitions projectInfo → techStackSelect on NEXT', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: { projectName: 'my-app', projectPurpose: 'test' } })
    expect(actor.getSnapshot().value).toBe('techStackSelect')
    actor.stop()
  })

  it('transitions techStackSelect → detectTooling when tech selected', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: {} })
    actor.send({ type: 'NEXT', data: { selectedTech: ['nextjs'] } })
    expect(actor.getSnapshot().value).toBe('detectTooling')
    actor.stop()
  })

  it('transitions techStackSelect → harnessConfig when no tech selected', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: {} })
    actor.send({ type: 'NEXT', data: { selectedTech: [] } })
    expect(actor.getSnapshot().value).toBe('harnessConfig')
    actor.stop()
  })

  it('BACK from preview returns to harnessConfig', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: {} })
    actor.send({ type: 'NEXT', data: { selectedTech: [] } })
    actor.send({ type: 'NEXT', data: {} })
    expect(actor.getSnapshot().value).toBe('preview')
    actor.send({ type: 'BACK' })
    expect(actor.getSnapshot().value).toBe('harnessConfig')
    actor.stop()
  })

  it('accumulates context across transitions', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: { projectName: 'shop', projectPurpose: 'ecommerce' } })
    actor.send({ type: 'NEXT', data: { selectedTech: [] } })
    const ctx = actor.getSnapshot().context
    expect(ctx.projectName).toBe('shop')
    expect(ctx.projectPurpose).toBe('ecommerce')
    actor.stop()
  })
})
