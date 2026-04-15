import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'langgraph',
  description: 'LangGraph — StateGraph, nodes, conditional edges, checkpointers, human-in-the-loop',
  version: '1.0.0',
  experimental: true,
  defaultRole: 'techstack',
  common: {
    artifacts: [

      // TODO: add rule + skill artifacts in follow-up
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
