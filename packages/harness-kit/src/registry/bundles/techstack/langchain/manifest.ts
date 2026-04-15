import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'langchain',
  description: 'LangChain — create_agent, tools, middleware, human-in-the-loop, error handling',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'skill', src: 'https://github.com/langchain-ai/langchain-skills --skill langchain-fundamentals' },
      { type: 'rule', src: 'rules/langchain.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
