import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'redis',
  description: 'Redis — data structures, Query Engine, RedisVL vector search, LangCache, performance',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'skill', src: 'https://github.com/redis/agent-skills --skill redis-development' },
      { type: 'rule', src: 'rules/redis.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
