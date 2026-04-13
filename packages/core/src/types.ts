export type BundleCategory =
  | 'git-workflow'
  | 'workflow-preset'
  | 'memory'
  | 'browser'
  | 'search'
  | 'scrape'
  | 'library-docs'
  | 'doc-conversion'
  | 'code-execution'
  | 'dev-integration'
  | 'cloud-infra'
  | 'observability'
  | 'mcp-tool'

export type ClaudeHookType = 'PreToolUse' | 'PostToolUse' | 'Stop' | 'Notification'
export type GitHookName = 'pre-commit' | 'commit-msg' | 'pre-push'

export type Artifact =
  | { type: 'mcp';      command: string; args: string[]; env?: Record<string, string> }
  | { type: 'skill';    src: string; dest: string }
  | { type: 'tool';     installCmd: string }
  | { type: 'plugin';   installSource: string }
  | { type: 'hook';     src: string; dest: string; hookType: ClaudeHookType; matcher?: string }
  | { type: 'git-hook'; src: string; hookName: GitHookName }
  | { type: 'rule';     src: string; dest: string }
  | { type: 'agent';    src: string; dest: string }
  | { type: 'command';  src: string; dest: string }
  | { type: 'file';     src: string; dest: string }

export interface EnvVar {
  key: string
  description: string
  required: boolean
  default?: string
}

export interface BundleManifest {
  name: string
  description: string
  version: string
  experimental: boolean
  defaultRole: string
  common: {
    artifacts: Artifact[]
    env?: EnvVar[]
    requires?: string[]
  }
  roles: Partial<Record<BundleCategory, {
    artifacts: Artifact[]
    env?: EnvVar[]
    requires?: string[]
    recommended?: boolean
  }>>
}

export interface HarnessConfig {
  version: string
  registry: string
  techStack: string[]
  bundles: string[]
}
