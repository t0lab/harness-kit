import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'langgraph',
  description: 'LangGraph — StateGraph, state schemas, nodes, edges, Command, Send, streaming',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'skill', src: 'https://github.com/langchain-ai/langchain-skills --skill langgraph-fundamentals' },
      { type: 'rule', src: 'rules/langgraph.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
