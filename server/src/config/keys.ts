import {config} from 'dotenv'

// Load .env file in local development
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  config()
}

interface EnvSpec {
  key: string
  required?: boolean
}

const ENV_VARS: EnvSpec [] = [
      { key: 'MONGO_URI', required: true },
  { key: 'NODE_ENV', required: true },
  { key: 'LOG_LEVEL', required: true },
  { key: 'DATABASE_NAME', required: true },
  { key: 'CLIENT_URL', required: true },
  { key: 'SESSION_SECRET', required: true },
  { key: 'SESSION_MAX_AGE', required: true },
]

interface Env {
      readonly MONGO_URI: string
  readonly NODE_ENV: string
  readonly LOG_LEVEL: string
  readonly DATABASE_NAME: string
  readonly CLIENT_URL: string
    readonly SESSION_SECRET: string
  readonly SESSION_MAX_AGE: string
}

const env = process.env as unknown as Env

// Check required environment variables
const requiredKeys = ENV_VARS.filter(({ required }) => required)

const missingKeys = requiredKeys.filter(({ key }) => !env[key as keyof Env])

if (missingKeys.length > 0) {
  throw new Error(
    `Missing required env key(s): ${missingKeys
      .map(({ key }) => key)
      .join(', ')}`
  )
}

export {env}
