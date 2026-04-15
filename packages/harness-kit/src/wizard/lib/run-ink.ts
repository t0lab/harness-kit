import { type ReactElement } from 'react'
import { render } from 'ink'

/**
 * Render an Ink element until the step resolves. Assumes caller (runWizard)
 * already entered alt-screen — we only clear the canvas between steps.
 */
export async function runInk<T>(
  build: (resolve: (value: T) => void, reject: (err: Error) => void) => ReactElement,
): Promise<T> {
  process.stdout.write('\x1b[2J\x1b[H')

  let done = false
  let settle!: { resolve: (v: T) => void; reject: (e: Error) => void }
  const promise = new Promise<T>((resolve, reject) => {
    settle = { resolve, reject }
  })

  const element = build(
    (v) => {
      if (done) return
      done = true
      settle.resolve(v)
    },
    (e) => {
      if (done) return
      done = true
      settle.reject(e)
    },
  )

  const app = render(element, { exitOnCtrlC: false })
  try {
    const value = await promise
    app.unmount()
    await app.waitUntilExit()
    return value
  } catch (err) {
    app.unmount()
    throw err
  }
}
