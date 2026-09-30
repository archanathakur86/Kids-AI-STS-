const Database = require("better-sqlite3")
const db = new Database(process.env.DB_PATH || "whyso.db")
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT 'owl',
  pitch REAL DEFAULT 1.5,
  speed REAL DEFAULT 1.1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  seed TEXT,
  character TEXT DEFAULT 'owl',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`)

// Safe migrations if needed
try { db.exec("ALTER TABLE chats ADD COLUMN user_id INTEGER") } catch(e) {}
try { db.exec("ALTER TABLE chats ADD COLUMN character TEXT DEFAULT 'owl'") } catch(e) {}
try { db.exec("ALTER TABLE messages ADD COLUMN user_id INTEGER") } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT 'owl'") } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN pitch REAL DEFAULT 1.5") } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN speed REAL DEFAULT 1.1") } catch(e) {}

module.exports = db