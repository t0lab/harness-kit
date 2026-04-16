import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: {
    // composite requires all files to be listed in the project — which tsup's
    // internal DTS worker doesn't support. Disable composite for DTS-only.
    compilerOptions: { composite: false, incremental: false },
  },
  external: ['react', 'react-dom', 'ink', '@inkjs/ui', 'ink-text-input'],
  clean: true,
  sourcemap: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
