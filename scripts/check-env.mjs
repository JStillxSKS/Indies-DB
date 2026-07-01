import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env')

if (!existsSync(envPath)) {
  console.log('No .env file — app runs in demo mode.')
  console.log('Copy .env.example to .env and add Supabase credentials.')
  process.exit(0)
}

const env = readFileSync(envPath, 'utf8')
const hasUrl = /^VITE_SUPABASE_URL=.+$/m.test(env) && !env.includes('your-project')
const hasKey = /^VITE_SUPABASE_ANON_KEY=.+$/m.test(env) && !env.includes('your-anon-key')

if (hasUrl && hasKey) {
  console.log('Supabase .env looks configured.')
} else {
  console.log('.env exists but Supabase values look like placeholders.')
  console.log('Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}