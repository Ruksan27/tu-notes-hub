// src/lib/cacheDb.ts
// Dedicated TiDB Serverless connection for AI Answer Caching
// Uses the secondary TiDB account (ruksankarki80@gmail.com)

import { connect } from '@tidbcloud/serverless'

let _db: ReturnType<typeof connect> | null = null

function getDb() {
  if (!_db) {
    _db = connect({
      url: process.env.CACHE_DATABASE_URL!,
    })
  }
  return _db
}

// Ensure the cache table exists
export async function ensureCacheTable() {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_answers_cache (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_hash VARCHAR(64) NOT NULL UNIQUE,
      question_text TEXT NOT NULL,
      answer TEXT NOT NULL,
      hit_count INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_hash (question_hash)
    )
  `)
}

// Get cached answer by hash
export async function getCachedAnswer(questionHash: string): Promise<string | null> {
  try {
    const db = getDb()
    const rows = await db.execute(
      'SELECT answer FROM ai_answers_cache WHERE question_hash = ?',
      [questionHash]
    ) as any[]

    if (rows && rows.length > 0) {
      // Increment hit count (fire-and-forget)
      db.execute(
        'UPDATE ai_answers_cache SET hit_count = hit_count + 1 WHERE question_hash = ?',
        [questionHash]
      ).catch(() => {})
      return rows[0].answer as string
    }
    return null
  } catch {
    return null
  }
}

// Save answer to cache
export async function saveCachedAnswer(
  questionHash: string,
  questionText: string,
  answer: string
): Promise<void> {
  try {
    const db = getDb()
    await db.execute(
      `INSERT INTO ai_answers_cache (question_hash, question_text, answer)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE answer = VALUES(answer), hit_count = hit_count + 1`,
      [questionHash, questionText, answer]
    )
  } catch (e) {
    console.error('[CacheDB] Failed to save answer:', e)
  }
}

// Simple SHA-256-like hash using crypto
export function hashQuestion(text: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex')
}
