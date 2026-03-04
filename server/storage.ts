import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { Startup } from './generator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = join(__dirname, 'data')
const DATA_FILE = join(DATA_DIR, 'startups.json')

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readStartups(): Startup[] {
  ensureDataDir()
  if (!existsSync(DATA_FILE)) return []
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as Startup[]
  } catch {
    return []
  }
}

export function writeStartups(startups: Startup[]): void {
  ensureDataDir()
  writeFileSync(DATA_FILE, JSON.stringify(startups, null, 2), 'utf-8')
}
