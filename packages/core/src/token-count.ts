import { getEncoding, type Tiktoken } from 'js-tiktoken'

export interface TokenCount {
  tokens: number
  method: 'tiktoken' | 'heuristic'
}

let cachedEncoder: Tiktoken | null = null
let encoderFailed = false

function getEncoder(): Tiktoken | null {
  if (cachedEncoder) return cachedEncoder
  if (encoderFailed) return null
  try {
    cachedEncoder = getEncoding('cl100k_base')
    return cachedEncoder
  } catch {
    encoderFailed = true
    return null
  }
}

export function countTokens(text: string): TokenCount {
  if (text.length === 0) return { tokens: 0, method: 'tiktoken' }
  const encoder = getEncoder()
  if (encoder) {
    return { tokens: encoder.encode(text).length, method: 'tiktoken' }
  }
  return { tokens: Math.ceil(text.length / 4), method: 'heuristic' }
}
