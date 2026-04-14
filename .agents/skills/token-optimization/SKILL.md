---
name: token-optimization
description: Provider-agnostic audit to reduce LLM token usage — prompts, system prompts, agent history, RAG, tool schemas. Trigger on "reduce tokens", "cut LLM cost", "prompt too long", "context too big", "context rot", "optimize prompt", or when the user shares a verbose prompt / costly agent trace asking how to make it cheaper or faster. DO NOT trigger on Anthropic SDK implementation work (`cache_control` placement, cache-hit debugging, batch/files/memory APIs) — defer to `claude-api`.
---

# Token Optimization

Reduce token usage without quality loss. Most unoptimized LLM apps carry substantial waste — often in a system prompt, repeated tool schemas, or uncompacted history — and the common levers are well understood. Use this skill to audit a prompt, system prompt, or agent pipeline and propose concrete reductions with estimated savings.

## How to use this skill

1. **Identify the surface** — is this a single prompt, a system prompt that repeats every call, an agent loop with growing history, or a RAG pipeline? The biggest wins live in whichever surface *repeats the most*.
2. **Apply the checklist below** in order of impact (highest first). Stop when further reductions would hurt quality.
3. **Report with numbers** — token count before/after, estimated % reduction, and *why* the change is safe. Vague advice ("make it shorter") is not useful; concrete diffs with a rationale are.
4. **Preserve behavior** — never silently drop instructions that carry real constraints (safety, format, hard requirements). If unsure, flag the change for the user to approve.

## Mental model

Three things drive cost:

- **Repetition** — a system prompt at 10k daily requests is paid 10k times. Trim here first.
- **Output length** — output tokens typically cost **3–6× more** than input tokens (varies by provider and model tier; smaller models are closer to 3–4×, flagship closer to 5–6×). Constrain output before fretting over input.
- **Staleness** — conversation history, tool schemas, retrieved docs accumulate. Compact before the window fills.

Ranking: **system prompt > output constraints > history/context > few-shots > wording**.

## Prompt-level tactics

### 1. Cut ceremony and filler

Remove politeness padding, hedges, and restatement. LLMs don't need "could you please" — imperative verbs work.

**Example 1:**
- Before (18 tok): `Could you please provide me with a comprehensive overview of my scheduled appointments for today?`
- After (8 tok): `What's on my calendar today?`
- Savings: ~55%

**Example 2:**
- Before (25 tok): `I would like you to carefully analyze the following customer feedback and provide a detailed summary of the main themes.`
- After (7 tok): `Summarize main themes in this feedback:`
- Savings: ~72%

### 2. Constrain output explicitly

Output dominates cost and latency. Always pair a prompt-level length hint with a hard `max_tokens` cap.

- Prompt: `Answer in ≤50 words.` / `Return a JSON object matching this schema: …`
- API: `max_tokens=100`

Structured output (JSON, enum, function-call) typically costs **10–20 tokens** versus **50–100 tokens** for the equivalent natural-language answer, and is easier to parse.

### 3. Replace examples with sharper instructions

Few-shot examples are expensive; a single clear rule often replaces three examples. When examples are necessary, pick the *minimum set that covers the edge cases* — redundant examples waste 5–10% of tokens without improving quality.

### 4. Prefer extraction over generation

"List the three risks from the document" is cheaper than "Write a report about the risks in the document." Extraction outputs are shorter and more deterministic.

### 5. Use terse delimiters and formats

- `###` headers, `|` for fields, minimal markdown
- JSON keys should be short but readable (`id`, `msg`, not `x1`, `x2`)
- Drop XML tag verbosity when markdown sections suffice

## System-prompt tactics (highest leverage)

System prompts repeat on every call — this is where a 300-token cut becomes **millions of tokens saved per day**.

- **De-duplicate instructions.** Same rule said three different ways → say it once.
- **Kill dead rules.** Instructions for features you removed, edge cases you don't hit, personas nobody set — delete.
- **Move rare context out.** If a rule applies to 5% of requests, route those requests through a specialized prompt instead of carrying the rule for the other 95%.
- **Trust the model.** Modern models don't need "You are a helpful assistant" or "Think step by step" repeated — remove filler that doesn't change behavior when A/B tested.

Rule of thumb: if you can't state in one sentence **what breaks** when you remove a line, it's probably safe to remove.

## Agent / multi-turn tactics

### 6. Offload state to the environment

Don't carry a 500-line file in chat history — carry the **file path** and re-read on demand. Don't store tool output verbatim if a summary + pointer suffices. Chat history should be *reasoning*, not *artifacts*.

### 7. Compact before you summarize

Two strategies, in order:

- **Compaction (reversible)** — strip information that already exists elsewhere (tool outputs the agent can re-fetch, redundant acknowledgments, stale planning steps).
- **Summarization (lossy)** — when compaction isn't enough, replace old turns with a running summary. Keep the last N turns *raw* to preserve the model's rhythm. Typical trigger: context ≥ 50–70% of window or a token threshold like 100–128k.

Typical results: **40–70% reduction** on a mature agent session; **up to ~95%** in the pathological case where history is dominated by re-fetchable tool output. The big wins come from dropping artifacts, not from clever summaries.

### 8. Keep tool schemas stable and small

- Target **~20 atomic tools**, not 80 specialized ones — fewer schemas = smaller prefix + better cache hits.
- Don't swap tool definitions mid-session; that invalidates prefix caches and confuses the model.
- Trim tool descriptions: one sentence per tool + parameter doc is enough. Long examples belong in a doc the agent can fetch.

### 9. Isolate sub-agents

Sub-agents should receive *only* the slice of context they need, return a structured result, and exit. Don't broadcast the whole conversation to every sub-agent — that's the multi-agent version of carrying chat history.

## App-level tactics

### 10. Prompt caching (strategy & placement)

Most major providers support some form of prompt caching (automatic prefix caching, or explicit opt-in). This skill focuses on *structural* design — the implementation syntax (e.g. Anthropic `cache_control`) belongs with the `claude-api` skill or the equivalent provider docs.

Structure prompts as **[stable cached prefix] + [dynamic suffix]**:

- Cache reads are dramatically cheaper than fresh input (commonly 10–25% of input price, provider-dependent).
- Cache writes cost a small premium (provider-specific multipliers apply). Rule of thumb: caching pays off after **2–3 reuses** of the same prefix within its TTL.
- Order matters: put the most stable content *first* (system prompt → tool schemas → retrieved docs → history → user turn). Even a one-token edit to the prefix invalidates the cache for everything after it.
- Monitor cache-creation vs cache-read token counts in responses to verify hit rate. A cache that rarely hits is costing more than no cache at all.

### 11. Semantic caching

For queries where many users ask the same thing with different wording ("weather today?" vs "how's the weather?"), store embedding → response. Reported savings of **30–70%** depending on query-repetition rate (some case studies hit ~73%), plus sub-second latency on hits. Use a vector store (Redis, pgvector) with a similarity threshold tuned so you don't return stale/wrong answers.

### 12. Model cascading

Route by difficulty: cheap model tries first, escalate to flagship only when confidence is low or the task is flagged complex. Budget models are commonly **15–50× cheaper** than flagship models (as of major-provider 2025 pricing — verify current ratios, which shift with each model release). A rough template:

- Classification, extraction, simple rewrites → Haiku / small model
- Multi-step reasoning, code generation, nuanced writing → Sonnet / Opus / flagship
- Cascade: small model returns `needs_escalation: true` on ambiguous inputs → flagship retries

### 13. RAG hygiene

RAG pipelines routinely pass **4–8 long documents** when a snippet would do. Audit:

- Chunk by **meaning** (section, paragraph), not fixed char counts.
- Retrieve top-K by semantic score, then **rerank** and cut to what fits a token budget.
- Include only the *relevant span* plus minimal surrounding context, not the whole doc.
- Consider tools like LLMLingua for aggressive prompt compression on long retrieved contexts.

### 14. Batch when possible

Repeated similar calls? Either batch into one prompt (`BatchPrompt`: process N items with shared instructions) or use provider batch APIs (commonly ~50% off on major providers). Only works when latency is flexible.

## Audit workflow

When a user asks for a token review, follow this order:

1. **Measure baseline.** Count tokens for system prompt, a typical user turn, tool schemas, and expected output. (If you can't, estimate: 1 token ≈ 4 chars of English ≈ 0.75 words.)
2. **Find the biggest chunk that repeats.** That's the first target.
3. **Propose changes with diffs**, grouped by tactic #, each with estimated savings.
4. **Flag risk.** For each change, say what quality signal to watch and how to verify (A/B comparison, small eval set, spot-check).
5. **Quantify the bottom line.** Expected % reduction at current volume, dollar impact if the user shared pricing.

## Report template

```
## Token audit: <surface>

**Baseline**
- System prompt: X tok
- Avg user turn: Y tok
- Tool schemas: Z tok
- Avg output: W tok
- Per-request total: ~N tok

**Recommendations** (ordered by impact)

1. [Tactic #] <Change> — est. −A tok (−B%)
   Before: …
   After:  …
   Risk:   <what to watch> | Verify: <how>

2. …

**Estimated impact**: −P% per request. At V requests/day → ~M tokens/day saved.
**Not changed**: <things I left alone and why>
```

## What not to do

- **Don't over-compress to the point of ambiguity.** Saving 20 tokens isn't worth a 5% quality regression.
- **Don't change stable prefixes casually** when prompt caching is in play — a one-word edit invalidates the whole cache.
- **Don't delete safety or policy instructions** without explicit user sign-off, even if they look redundant.
- **Don't optimize low-volume prompts first** — 1000 tokens saved on a prompt called once/week is rounding error; 10 tokens saved on a system prompt called 10k times/day is real money.
- **Don't confuse activity with impact.** Shortening the user-facing chat box is mostly cosmetic; the win is in what the model *sees*, not what the user types.

## Quick reference: tactic → typical savings

| Tactic                                | Typical savings        | Best when                       |
|---------------------------------------|------------------------|---------------------------------|
| Prompt caching (stable prefix)        | 70–90% on cached reads | High-volume, stable system prompt |
| Semantic caching                      | 30–70% (up to ~73%)    | High query repetition           |
| Model cascading                       | 10–50× cost ratio      | Mixed-difficulty workloads      |
| System-prompt trimming                | 20–60%                 | Prompts never audited before    |
| Context compaction/summarization      | 40–70% (up to ~95%)    | Long agent sessions             |
| Structured output (JSON/function)     | 60–80% on outputs      | Classification, extraction      |
| Output `max_tokens` + length hint     | 20–40%                 | Open-ended generation           |
| Few-shot trimming                     | 5–15%                  | Example-heavy prompts           |
| Filler/politeness removal             | 20–70% on that prompt  | Verbose user prompts            |

Numbers are representative ranges from published practitioner reports (IBM, Anthropic, Redis, Portkey, Elementor, JetBrains, Microsoft Agent Framework, and others) — your mileage depends on workload shape. Always verify with a real A/B on your own traffic.
