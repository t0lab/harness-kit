export interface TechOption {
  id: string
  label: string
  hint: string
  category: string
  tags: string[]
}

export interface DetectedIssue {
  label: string
  found: boolean
  installCmd?: string
}

export interface WizardContext {
  projectName: string
  projectPurpose: string
  projectUsers: string
  projectConstraints: string
  selectedTech: string[]
  detectedIssues: DetectedIssue[]
  toolsToInstall: DetectedIssue[]
  gitWorkflow: string[]
  memory: string              // bundle name (e.g. 'local-memory'); '' = none selected
  workflowPresets: string[]   // 'docs-as-code' replaces old docsAsCode boolean
  browserTools: string[]
  webSearch: string[]
  webScrape: string[]
}

export type WizardEvent =
  | { type: 'ENTER' }
  | { type: 'NEXT'; data: Partial<WizardContext> }
  | { type: 'BACK' }
  | { type: 'CONFIRM' }
  | { type: 'SKIP_DETECT' }
  | { type: 'DONE' }
  | { type: 'ERROR'; error: Error }
