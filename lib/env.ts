import { z } from 'zod'

const DEFAULT_APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1'

const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development')

const optionalEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  APPWRITE_ENDPOINT: z.string().url().optional(),
  APPWRITE_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().url().optional(),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  APPWRITE_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
})

export type AppEnv = z.infer<typeof optionalEnvSchema>

let cachedEnv: AppEnv | null = null

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv
  const parsed = optionalEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    NEXT_PUBLIC_APPWRITE_DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  })
  parsed.NEXT_PUBLIC_APPWRITE_ENDPOINT = normalizeAppwriteEndpoint(parsed.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  cachedEnv = parsed
  return parsed
}

export function getAppwriteEndpoint(): string {
  const rawEndpoint = process.env.APPWRITE_ENDPOINT || getEnv().NEXT_PUBLIC_APPWRITE_ENDPOINT || DEFAULT_APPWRITE_ENDPOINT

  try {
    const url = new URL(rawEndpoint)
    if (url.hostname === 'cloud.appwrite.io') {
      url.hostname = 'fra.cloud.appwrite.io'
    }
    return url.toString()
  } catch {
    return DEFAULT_APPWRITE_ENDPOINT
  }
}

export function getAppwriteServerConfig(): { endpoint: string; projectId: string; apiKey: string } {
  const env = getEnv()
  const endpoint = normalizeAppwriteEndpoint(process.env.APPWRITE_ENDPOINT || env.NEXT_PUBLIC_APPWRITE_ENDPOINT || DEFAULT_APPWRITE_ENDPOINT) || DEFAULT_APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID || env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''
  const apiKey = process.env.APPWRITE_API_KEY || env.APPWRITE_API_KEY || ''

  return { endpoint, projectId, apiKey }
}

export function requireEnv(keys: Array<'NEXT_PUBLIC_APPWRITE_ENDPOINT' | 'NEXT_PUBLIC_APPWRITE_PROJECT_ID' | 'NEXT_PUBLIC_APPWRITE_DATABASE_ID'>): void {
  const env = getEnv()
  const missing = keys.filter((k) => !env[k])
  if (missing.length > 0) {
    throw new Error(`Invalid environment configuration: ${missing.join(', ')} required`)
  }
}

export function requireServerSecret(name: 'APPWRITE_API_KEY' | 'OPENROUTER_API_KEY'): string {
  const env = getEnv()
  const value = env[name]
  if (!value) {
    throw new Error(`Missing required server secret: ${name}`)
  }
  return value
}

export function normalizeAppwriteEndpoint(endpoint?: string): string | undefined {
  if (!endpoint) return endpoint
  if (endpoint.includes('cloud.appwrite.io')) return endpoint.replace('cloud.appwrite.io', 'fra.cloud.appwrite.io')
  return endpoint
}
