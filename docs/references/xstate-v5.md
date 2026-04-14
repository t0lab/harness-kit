# XState v5 — tài liệu tham khảo harness-kit

## Pattern chuẩn

Định nghĩa machine với `createMachine`, khai báo types inline, dùng `assign` để cập nhật context:

```ts
import { createMachine, assign, createActor } from 'xstate'
import type { WizardContext, WizardEvent } from './types.js'

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
          actions: assign(({ event }) =>
            (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}
          ),
        },
      },
    },
    done: { type: 'final' },
  },
})
```

Khởi chạy machine và vòng lặp step:

```ts
const actor = createActor(wizardMachine)
actor.start()

while (actor.getSnapshot().status !== 'done') {
  const state = actor.getSnapshot().value as string
  const ctx = actor.getSnapshot().context

  switch (state) {
    case 'projectInfo': {
      const data = await stepProjectInfo()
      actor.send({ type: 'NEXT', data })
      break
    }
    // ...
  }
}
```

Guard trong transition:

```ts
on: {
  NEXT: [
    {
      guard: ({ context, event }) => {
        const tech = (event as Extract<WizardEvent, { type: 'NEXT' }>).data?.selectedTech
        return (tech ?? context.selectedTech).length === 0
      },
      target: 'harnessConfig',
      actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
    },
    { target: 'detectTooling', actions: assign(...) },
  ],
},
```

## Không làm

- **Dùng API v4 (`Machine()`, `interpret()`)** — v5 dùng `createMachine()` và `createActor()`; API cũ không tồn tại trong package này.
- **Side effect trong transition (`actions`)** — actions chỉ cập nhật context qua `assign`; I/O async (prompt, file write) nằm ở ngoài vòng lặp switch.
- **Typegen thủ công** — khai báo types trực tiếp qua `types: {} as { context: ...; events: ... }` trong `createMachine`.
- **Gọi `actor.send()` từ bên trong step function** — step functions trả về data, vòng lặp ngoài gọi `send`; tránh coupling hai chiều.

## Quy ước của project

- Machine export là `const` (`export const wizardMachine`)
- Vòng lặp `while` xử lý step ở `src/wizard/index.ts`, không đặt trong component/hook
- Mỗi state tương ứng một file step: `src/wizard/steps/<state-name>.ts`
- Lỗi từ step throw ra ngoài vòng lặp → `actor.send({ type: 'ERROR', error })`
- `WizardContext` và `WizardEvent` định nghĩa tại `src/wizard/types.ts`
