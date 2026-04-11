import type { TechOption } from './types.js'

export const TECH_OPTIONS: TechOption[] = [
  // ── Web Frameworks ──────────────────────────────────────────
  { id: 'nextjs', label: 'Next.js', hint: 'fullstack React framework', category: 'Web Frameworks', tags: ['react', 'typescript', 'fullstack', 'vercel'] },
  { id: 'nuxt', label: 'Nuxt', hint: 'fullstack Vue framework', category: 'Web Frameworks', tags: ['vue', 'typescript', 'fullstack'] },
  { id: 'sveltekit', label: 'SvelteKit', hint: 'fullstack Svelte framework', category: 'Web Frameworks', tags: ['svelte', 'typescript', 'fullstack'] },
  { id: 'react', label: 'React', hint: 'frontend only', category: 'Web Frameworks', tags: ['react', 'typescript', 'frontend'] },
  { id: 'vue', label: 'Vue', hint: 'frontend only', category: 'Web Frameworks', tags: ['vue', 'typescript', 'frontend'] },
  { id: 'angular', label: 'Angular', hint: 'frontend only', category: 'Web Frameworks', tags: ['angular', 'typescript', 'frontend'] },
  { id: 'vanilla-ts', label: 'Vanilla TypeScript', hint: 'no framework', category: 'Web Frameworks', tags: ['typescript', 'frontend'] },

  // ── Backend ──────────────────────────────────────────────────
  { id: 'node-express', label: 'Node.js + Express', hint: 'minimal Node.js API', category: 'Backend', tags: ['node', 'javascript', 'typescript', 'api', 'backend'] },
  { id: 'node-fastify', label: 'Node.js + Fastify', hint: 'fast Node.js API', category: 'Backend', tags: ['node', 'javascript', 'typescript', 'api', 'backend'] },
  { id: 'python-fastapi', label: 'Python + FastAPI', hint: 'async Python API', category: 'Backend', tags: ['python', 'api', 'backend', 'async'] },
  { id: 'python-django', label: 'Python + Django', hint: 'batteries-included Python', category: 'Backend', tags: ['python', 'api', 'backend'] },
  { id: 'go', label: 'Go', hint: 'compiled, fast', category: 'Backend', tags: ['go', 'golang', 'backend', 'api'] },
  { id: 'rust', label: 'Rust', hint: 'systems, WASM', category: 'Backend', tags: ['rust', 'backend', 'wasm'] },
  { id: 'java-spring', label: 'Java + Spring', hint: 'enterprise Java', category: 'Backend', tags: ['java', 'spring', 'backend', 'enterprise'] },

  // ── Database ──────────────────────────────────────────────────
  { id: 'postgresql', label: 'PostgreSQL', hint: 'relational database', category: 'Database', tags: ['database', 'sql', 'relational', 'postgres'] },
  { id: 'mysql', label: 'MySQL', hint: 'relational database', category: 'Database', tags: ['database', 'sql', 'relational'] },
  { id: 'mongodb', label: 'MongoDB', hint: 'document database', category: 'Database', tags: ['database', 'nosql', 'document', 'mongo'] },
  { id: 'sqlite', label: 'SQLite', hint: 'embedded database', category: 'Database', tags: ['database', 'sql', 'embedded'] },
  { id: 'redis', label: 'Redis', hint: 'in-memory cache / pub-sub', category: 'Database', tags: ['database', 'cache', 'redis', 'nosql'] },
  { id: 'dynamodb', label: 'DynamoDB', hint: 'AWS managed NoSQL', category: 'Database', tags: ['database', 'nosql', 'aws', 'dynamo'] },
  { id: 'supabase', label: 'Supabase', hint: 'PostgreSQL + auth + storage', category: 'Database', tags: ['database', 'postgres', 'auth', 'storage', 'supabase'] },

  // ── Platform ──────────────────────────────────────────────────
  { id: 'docker', label: 'Docker', hint: 'containerization', category: 'Platform', tags: ['docker', 'container', 'devops', 'platform'] },
  { id: 'github-actions', label: 'GitHub Actions', hint: 'CI/CD', category: 'Platform', tags: ['ci', 'cd', 'github', 'devops', 'platform'] },
  { id: 'terraform', label: 'Terraform', hint: 'infrastructure as code', category: 'Platform', tags: ['terraform', 'iac', 'devops', 'platform'] },
  { id: 'kubernetes', label: 'Kubernetes', hint: 'container orchestration', category: 'Platform', tags: ['kubernetes', 'k8s', 'container', 'devops', 'platform'] },
  { id: 'aws-cdk', label: 'AWS CDK', hint: 'AWS infrastructure as code', category: 'Platform', tags: ['aws', 'cdk', 'iac', 'platform', 'devops'] },

  // ── AI ────────────────────────────────────────────────────────
  { id: 'langchain', label: 'LangChain', hint: 'Python / JavaScript', category: 'AI', tags: ['ai', 'llm', 'python', 'javascript', 'langchain'] },
  { id: 'langgraph', label: 'LangGraph', hint: 'graph-based agent workflows', category: 'AI', tags: ['ai', 'agents', 'graph', 'python', 'langgraph'] },
  { id: 'anthropic-sdk', label: 'Anthropic SDK', hint: 'direct Claude API', category: 'AI', tags: ['ai', 'claude', 'anthropic', 'llm', 'api'] },
  { id: 'openai-sdk', label: 'OpenAI SDK', hint: 'direct OpenAI API', category: 'AI', tags: ['ai', 'openai', 'gpt', 'llm', 'api'] },
  { id: 'vercel-ai-sdk', label: 'Vercel AI SDK', hint: 'edge-optimized AI', category: 'AI', tags: ['ai', 'vercel', 'llm', 'streaming', 'edge'] },
  { id: 'crewai', label: 'CrewAI', hint: 'multi-agent framework', category: 'AI', tags: ['ai', 'agents', 'crew', 'python', 'multi-agent'] },
  { id: 'llamaindex', label: 'LlamaIndex', hint: 'RAG / data pipelines', category: 'AI', tags: ['ai', 'rag', 'llm', 'python', 'data'] },
]
