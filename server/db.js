// server/db.js
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "friendchat.db"));

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    avatar      TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS friend_requests (
    id          TEXT PRIMARY KEY,
    sender_id   TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | rejected
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id)   REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    UNIQUE(sender_id, receiver_id)
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id         TEXT PRIMARY KEY,
    user_id_a  TEXT NOT NULL,
    user_id_b  TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id_a) REFERENCES users(id),
    FOREIGN KEY (user_id_b) REFERENCES users(id),
    UNIQUE(user_id_a, user_id_b)
  );
`);

// ── Helper queries ────────────────────────────────────────────────────────────

const queries = {
  // Users
  createUser: db.prepare(`
    INSERT INTO users (id, username, email, password, avatar)
    VALUES (@id, @username, @email, @password, @avatar)
  `),
  getUserById: db.prepare(`SELECT id, username, email, avatar, created_at FROM users WHERE id = ?`),
  getUserByEmail: db.prepare(`SELECT * FROM users WHERE email = ?`),
  getUserByUsername: db.prepare(`SELECT * FROM users WHERE username = ?`),
  getAllUsers: db.prepare(`SELECT id, username, email, avatar, created_at FROM users WHERE id != ?`),

  // Friend Requests
  createFriendRequest: db.prepare(`
    INSERT INTO friend_requests (id, sender_id, receiver_id)
    VALUES (@id, @sender_id, @receiver_id)
  `),
  getFriendRequest: db.prepare(`
    SELECT fr.*, 
           s.username as sender_username, s.avatar as sender_avatar,
           r.username as receiver_username, r.avatar as receiver_avatar
    FROM friend_requests fr
    JOIN users s ON fr.sender_id = s.id
    JOIN users r ON fr.receiver_id = r.id
    WHERE fr.id = ?
  `),
  getExistingRequest: db.prepare(`
    SELECT * FROM friend_requests
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
  `),
  getPendingRequestsForUser: db.prepare(`
    SELECT fr.*, 
           s.username as sender_username, s.avatar as sender_avatar
    FROM friend_requests fr
    JOIN users s ON fr.sender_id = s.id
    WHERE fr.receiver_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `),
  getSentRequests: db.prepare(`
    SELECT fr.*, r.username as receiver_username, r.avatar as receiver_avatar
    FROM friend_requests fr
    JOIN users r ON fr.receiver_id = r.id
    WHERE fr.sender_id = ? AND fr.status = 'pending'
  `),
  updateRequestStatus: db.prepare(`
    UPDATE friend_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `),

  // Friendships
  createFriendship: db.prepare(`
    INSERT OR IGNORE INTO friendships (id, user_id_a, user_id_b)
    VALUES (@id, @user_id_a, @user_id_b)
  `),
  areFriends: db.prepare(`
    SELECT 1 FROM friendships
    WHERE (user_id_a = ? AND user_id_b = ?)
       OR (user_id_a = ? AND user_id_b = ?)
  `),
  getFriendsOfUser: db.prepare(`
    SELECT u.id, u.username, u.avatar, u.email, f.created_at as friends_since
    FROM friendships f
    JOIN users u ON (
      CASE WHEN f.user_id_a = ? THEN f.user_id_b ELSE f.user_id_a END = u.id
    )
    WHERE f.user_id_a = ? OR f.user_id_b = ?
    ORDER BY u.username
  `),
};

module.exports = { db, queries };
