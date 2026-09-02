import fs from 'fs'
import path from 'path'
import { defineConfig } from 'prisma/config'

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return

  const contents = fs.readFileSync(filePath, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))
loadEnvFile(path.join(process.cwd(), '.env'))

if (process.env.DATABASE_URL) {
  const normalizedDatabaseUrl = process.env.DATABASE_URL.trim().replace(/^['"]|['"]$/g, '')
  process.env.DATABASE_URL = normalizedDatabaseUrl
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
})