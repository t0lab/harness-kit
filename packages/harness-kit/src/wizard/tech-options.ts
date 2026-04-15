import type { TechOption } from './types.js'

export const TECH_OPTIONS: TechOption[] = [
  // ── Web Frameworks ──────────────────────────────────────────
  { id: 'nextjs', label: 'Next.js', hint: 'fullstack React framework', category: 'Web Frameworks', tags: ['react', 'typescript', 'fullstack', 'vercel'] },
  { id: 'react', label: 'React', hint: 'frontend only', category: 'Web Frameworks', tags: ['react', 'typescript', 'frontend'] },
  { id: 'vue', label: 'Vue', hint: 'frontend only', category: 'Web Frameworks', tags: ['vue', 'typescript', 'frontend'] },

  // ── Backend ──────────────────────────────────────────────────
  { id: 'express', label: 'Express', hint: 'minimal Node.js API', category: 'Backend', tags: ['node', 'javascript', 'typescript', 'api', 'backend'] },
  { id: 'fastify', label: 'Fastify', hint: 'fast Node.js API', category: 'Backend', tags: ['node', 'javascript', 'typescript', 'api', 'backend'] },
  { id: 'fastapi', label: 'FastAPI', hint: 'async Python API', category: 'Backend', tags: ['python', 'api', 'backend', 'async'] },
  { id: 'django', label: 'Django', hint: 'batteries-included Python', category: 'Backend', tags: ['python', 'api', 'backend'] },
  { id: 'go', label: 'Go', hint: 'compiled, fast', category: 'Backend', tags: ['go', 'golang', 'backend', 'api'] },
  { id: 'rust', label: 'Rust', hint: 'systems, WASM', category: 'Backend', tags: ['rust', 'backend', 'wasm'] },
  { id: 'spring', label: 'Spring', hint: 'enterprise Java', category: 'Backend', tags: ['java', 'spring', 'backend', 'enterprise'] },

  // ── Database ──────────────────────────────────────────────────
  { id: 'postgresql', label: 'PostgreSQL', hint: 'relational database', category: 'Database', tags: ['database', 'sql', 'relational', 'postgres'] },
  { id: 'redis', label: 'Redis', hint: 'in-memory cache / pub-sub', category: 'Database', tags: ['database', 'cache', 'redis', 'nosql'] },
  { id: 'supabase', label: 'Supabase', hint: 'PostgreSQL + auth + storage', category: 'Database', tags: ['database', 'postgres', 'auth', 'storage', 'supabase'] },

  // ── Platform ──────────────────────────────────────────────────
  { id: 'docker', label: 'Docker', hint: 'containerization', category: 'Platform', tags: ['docker', 'container', 'devops', 'platform'] },
  { id: 'github-actions', label: 'GitHub Actions', hint: 'CI/CD', category: 'Platform', tags: ['ci', 'cd', 'github', 'devops', 'platform'] },
  { id: 'terraform', label: 'Terraform', hint: 'infrastructure as code', category: 'Platform', tags: ['terraform', 'iac', 'devops', 'platform'] },
  { id: 'kubernetes', label: 'Kubernetes', hint: 'container orchestration', category: 'Platform', tags: ['kubernetes', 'k8s', 'container', 'devops', 'platform'] },

  // ── AI ────────────────────────────────────────────────────────
  { id: 'langchain', label: 'LangChain', hint: 'Python / JavaScript', category: 'AI', tags: ['ai', 'llm', 'python', 'javascript', 'langchain'] },
  { id: 'langgraph', label: 'LangGraph', hint: 'graph-based agent workflows', category: 'AI', tags: ['ai', 'agents', 'graph', 'python', 'langgraph'] },
  { id: 'llamaindex', label: 'LlamaIndex', hint: 'RAG / data pipelines', category: 'AI', tags: ['ai', 'rag', 'llm', 'python', 'data'] },
  { id: 'anthropic-sdk', label: 'Anthropic SDK', hint: 'direct Claude API', category: 'AI', tags: ['ai', 'claude', 'anthropic', 'llm', 'api'] },
]
