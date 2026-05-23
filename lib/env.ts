import { z } from 'zod'

const DEFAULT_APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1'

const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development')

const optionalEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
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
  const parsed = optionalEnvSchema.parse(process.env)
  cachedEnv = parsed
  return parsed
}

export function getAppwriteEndpoint(): string {
  const rawEndpoint = getEnv().NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || DEFAULT_APPWRITE_ENDPOINT

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
