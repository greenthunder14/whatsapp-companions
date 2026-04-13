/**
 * ============================================================
 *  PERSISTENT MEMORY MANAGER (SQLite)
 *  Conversations survive server restarts.
 *  Database file saved to: data/companions.db
 * ============================================================
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Make sure data folder exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new Database(path.join(dataDir, "companions.db"));

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_id    TEXT NOT NULL,
    user_phone  TEXT NOT NULL,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    phone_id    TEXT NOT NULL,
    user_phone  TEXT NOT NULL,
    nickname    TEXT,
    notes       TEXT,
    last_seen   DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (phone_id, user_phone)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_lookup
    ON messages (phone_id, user_phone);
`);

const MAX_HISTORY = 30;

// ── Message history ────────────────────────────────────────

function getHistory(phoneNumberId, userPhone) {
  const rows = db.prepare(`
    SELECT role, content FROM messages
    WHERE phone_id = ? AND user_phone = ?
    ORDER BY id DESC LIMIT ?
  `).all(phoneNumberId, userPhone, MAX_HISTORY);

  return rows.reverse();
}

function addMessage(phoneNumberId, userPhone, role, content) {
  db.prepare(`
    INSERT INTO messages (phone_id, user_phone, role, content)
    VALUES (?, ?, ?, ?)
  `).run(phoneNumberId, userPhone, role, content);

  // Update last seen
  db.prepare(`
    INSERT INTO user_profiles (phone_id, user_phone, last_seen)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT (phone_id, user_phone)
    DO UPDATE SET last_seen = CURRENT_TIMESTAMP
  `).run(phoneNumberId, userPhone);
}

function clearHistory(phoneNumberId, userPhone) {
  db.prepare(`
    DELETE FROM messages WHERE phone_id = ? AND user_phone = ?
  `).run(phoneNumberId, userPhone);
}

// ── User profiles ──────────────────────────────────────────

function getProfile(phoneNumberId, userPhone) {
  return db.prepare(`
    SELECT * FROM user_profiles WHERE phone_id = ? AND user_phone = ?
  `).get(phoneNumberId, userPhone) || {};
}

function updateNickname(phoneNumberId, userPhone, nickname) {
  db.prepare(`
    INSERT INTO user_profiles (phone_id, user_phone, nickname)
    VALUES (?, ?, ?)
    ON CONFLICT (phone_id, user_phone)
    DO UPDATE SET nickname = ?
  `).run(phoneNumberId, userPhone, nickname, nickname);
}

// ── Dashboard stats ────────────────────────────────────────

function getAllStats() {
  return db.prepare(`
    SELECT
      phone_id,
      user_phone,
      COUNT(*) as message_count,
      MAX(created_at) as last_message
    FROM messages
    GROUP BY phone_id, user_phone
    ORDER BY last_message DESC
  `).all();
}

function getTotalMessages() {
  return db.prepare(`SELECT COUNT(*) as count FROM messages`).get().count;
}

function getTotalUsers() {
  return db.prepare(`SELECT COUNT(*) as count FROM user_profiles`).get().count;
}

function getRecentActivity(limit = 10) {
  return db.prepare(`
    SELECT phone_id, user_phone, role, content, created_at
    FROM messages
    ORDER BY id DESC LIMIT ?
  `).all(limit);
}

module.exports = {
  getHistory, addMessage, clearHistory,
  getProfile, updateNickname,
  getAllStats, getTotalMessages, getTotalUsers, getRecentActivity
};
