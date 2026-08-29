// src/lib/cacheDb.ts
// Dedicated TiDB Serverless connection for AI Answer Caching + Comparison Reports + Chat History

import { connect } from '@tidbcloud/serverless'

let _db: ReturnType<typeof connect> | null = null

function getDb() {
  if (!_db) {
    _db = connect({ url: process.env.CACHE_DATABASE_URL! })
  }
  return _db
}

// ─── AI ANSWERS CACHE ──────────────────────────────────────────────

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

export async function getCachedAnswer(questionHash: string): Promise<string | null> {
  try {
    const db = getDb()
    const rows = await db.execute(
      'SELECT answer FROM ai_answers_cache WHERE question_hash = ?',
      [questionHash]
    ) as any[]
    if (rows && rows.length > 0) {
      db.execute('UPDATE ai_answers_cache SET hit_count = hit_count + 1 WHERE question_hash = ?', [questionHash]).catch(() => {})
      return rows[0].answer as string
    }
    return null
  } catch { return null }
}

export async function saveCachedAnswer(questionHash: string, questionText: string, answer: string): Promise<void> {
  try {
    const db = getDb()
    await db.execute(
      `INSERT INTO ai_answers_cache (question_hash, question_text, answer)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE answer = VALUES(answer), hit_count = hit_count + 1`,
      [questionHash, questionText, answer]
    )
  } catch (e) { console.error('[CacheDB] Failed to save answer:', e) }
}

export function hashQuestion(text: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex')
}

// ─── COMPARISON REPORT CACHE ───────────────────────────────────────

export async function ensureComparisonTable() {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_comparison_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cache_key VARCHAR(64) NOT NULL UNIQUE,
      subject_title VARCHAR(255),
      report_json LONGTEXT NOT NULL,
      hit_count INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_key (cache_key)
    )
  `)
}

export function buildComparisonKey(subjectId: string, paperIds: string[]): string {
  const crypto = require('crypto')
  const sorted = [...paperIds].sort().join(',')
  return crypto.createHash('sha256').update(`${subjectId}:${sorted}`).digest('hex').slice(0, 32)
}

export async function getCachedComparison(cacheKey: string): Promise<any | null> {
  try {
    const db = getDb()
    await ensureComparisonTable()
    const rows = await db.execute(
      'SELECT report_json FROM ai_comparison_reports WHERE cache_key = ?',
      [cacheKey]
    ) as any[]
    if (rows && rows.length > 0) {
      db.execute('UPDATE ai_comparison_reports SET hit_count = hit_count + 1 WHERE cache_key = ?', [cacheKey]).catch(() => {})
      return JSON.parse(rows[0].report_json)
    }
    return null
  } catch { return null }
}

export async function saveComparisonReport(cacheKey: string, subjectTitle: string, report: any): Promise<void> {
  try {
    const db = getDb()
    await ensureComparisonTable()
    await db.execute(
      `INSERT INTO ai_comparison_reports (cache_key, subject_title, report_json)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE report_json = VALUES(report_json), hit_count = hit_count + 1`,
      [cacheKey, subjectTitle, JSON.stringify(report)]
    )
  } catch (e) { console.error('[CacheDB] Failed to save comparison report:', e) }
}

// ─── AI CHAT HISTORY ───────────────────────────────────────────────

const CHAT_EXPIRY_DAYS = 15

export async function ensureChatTable() {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_chat_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      session_id VARCHAR(64) NOT NULL,
      role VARCHAR(10) NOT NULL,
      message LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      INDEX idx_user_session (user_id, session_id),
      INDEX idx_expires (expires_at)
    )
  `)
}

export async function saveChatMessage(userId: string, sessionId: string, role: 'user' | 'model', message: string): Promise<void> {
  try {
    const db = getDb()
    await ensureChatTable()
    await db.execute(
      `INSERT INTO ai_chat_history (user_id, session_id, role, message, expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ${CHAT_EXPIRY_DAYS} DAY))`,
      [userId, sessionId, role, message]
    )
    // Auto-cleanup expired chats (fire-and-forget)
    db.execute('DELETE FROM ai_chat_history WHERE expires_at < NOW() LIMIT 100').catch(() => {})
  } catch (e) { console.error('[CacheDB] Failed to save chat:', e) }
}

export async function getChatHistory(userId: string, sessionId: string): Promise<{ role: 'user' | 'model'; message: string; created_at: string }[]> {
  try {
    const db = getDb()
    await ensureChatTable()
    const rows = await db.execute(
      `SELECT role, message, created_at FROM ai_chat_history
       WHERE user_id = ? AND session_id = ? AND expires_at > NOW()
       ORDER BY created_at ASC`,
      [userId, sessionId]
    ) as any[]
    return rows || []
  } catch { return [] }
}

export async function getUserChatSessions(userId: string): Promise<{ session_id: string; last_message: string; created_at: string }[]> {
  try {
    const db = getDb()
    await ensureChatTable()
    const rows = await db.execute(
      `SELECT session_id,
              MAX(created_at) as created_at,
              SUBSTRING(MIN(CASE WHEN role = 'user' THEN message END), 1, 80) as last_message
       FROM ai_chat_history
       WHERE user_id = ? AND expires_at > NOW()
       GROUP BY session_id
       ORDER BY MAX(created_at) DESC
       LIMIT 20`,
      [userId]
    ) as any[]
    return rows || []
  } catch { return [] }
}

export async function deleteChatSession(userId: string, sessionId: string): Promise<void> {
  try {
    const db = getDb()
    await db.execute(
      'DELETE FROM ai_chat_history WHERE user_id = ? AND session_id = ?',
      [userId, sessionId]
    )
  } catch (e) { console.error('[CacheDB] Failed to delete session:', e) }
}
