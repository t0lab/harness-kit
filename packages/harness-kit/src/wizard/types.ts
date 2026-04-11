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
  installSelected: boolean
  gitWorkflow: string[]
  memory: 'file-based' | 'mem0' | 'obsidian' | 'none'
  docsAsCode: boolean
  workflowPresets: string[]
  browserTools: string[]
  webSearch: string[]
  webCrawl: string[]
  libraryDocs: string[]
  docConversion: string[]
  otherMcp: string[]
  aiGenerationEnabled: boolean
}

export type WizardEvent =
  | { type: 'ENTER' }
  | { type: 'NEXT'; data: Partial<WizardContext> }
  | { type: 'BACK' }
  | { type: 'CONFIRM' }
  | { type: 'SKIP_DETECT' }
  | { type: 'DONE' }
  | { type: 'ERROR'; error: Error }
