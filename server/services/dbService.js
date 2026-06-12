import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool = null;
let isMock = false;

// Mock database storage
const mockDb = {
  users: [],
  sessions: [],
  audit_logs: [],
  user_id_seq: 1,
  session_id_seq: 1,
  log_id_seq: 1
};

// Initialize DB connection
try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Short timeout so we fall back quickly if Postgres is not running
      connectionTimeoutMillis: 2000 
    });
  } else {
    isMock = true;
    console.warn('[DATABASE] No DATABASE_URL provided. Operating in MOCK mode.');
  }
} catch (err) {
  isMock = true;
  console.warn('[DATABASE] Error initializing PG Pool. Operating in MOCK mode:', err.message);
}

// Check database connection and initialize schemas
export async function initializeDatabase() {
  if (isMock) {
    console.log('[DATABASE] Running in in-memory MOCK database mode.');
    return;
  }

  try {
    const client = await pool.connect();
    console.log('[DATABASE] Successfully connected to PostgreSQL.');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        two_factor_secret VARCHAR(255),
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(512) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent VARCHAR(512),
        device_info VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    console.log('[DATABASE] All database tables verified/created successfully.');
  } catch (err) {
    isMock = true;
    console.warn('[DATABASE] Failed to connect to PostgreSQL database. Falling back to MOCK mode. Error:', err.message);
  }
}

// Generic query dispatcher
export async function query(text, params = []) {
  if (!isMock && pool) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.error('[DATABASE] PG Query Error:', err.message, '\nQuery:', text);
      throw err;
    }
  }

  // Handle Mock implementation
  return executeMockQuery(text, params);
}

// Simple Mock SQL Interpreter for key queries
function executeMockQuery(text, params) {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
  
  // 1. SELECT * FROM users WHERE username = $1
  if (normalized.includes('select * from users where username =')) {
    const username = params[0];
    const user = mockDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    return { rows: user ? [user] : [] };
  }

  // 2. INSERT INTO users (username, password_hash)
  if (normalized.includes('insert into users') && normalized.includes('returning *')) {
    const [username, password_hash] = params;
    
    // Check constraint
    if (mockDb.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      const err = new Error('duplicate key value violates unique constraint "users_username_key"');
      err.code = '23505';
      throw err;
    }

    const newUser = {
      id: mockDb.user_id_seq++,
      username,
      password_hash,
      two_factor_secret: null,
      two_factor_enabled: false,
      created_at: new Date()
    };
    mockDb.users.push(newUser);
    return { rows: [newUser] };
  }

  // 3. UPDATE users SET two_factor_secret = $1, two_factor_enabled = $2 WHERE id = $3
  if (normalized.includes('update users set') && normalized.includes('where id =')) {
    const [secret, enabled, id] = params;
    const user = mockDb.users.find(u => u.id === parseInt(id));
    if (user) {
      user.two_factor_secret = secret;
      user.two_factor_enabled = enabled;
      return { rows: [user] };
    }
    return { rows: [] };
  }

  // 4. INSERT INTO sessions
  if (normalized.includes('insert into sessions') && normalized.includes('returning *')) {
    const [user_id, token, ip_address, user_agent, device_info, expires_at] = params;
    const newSession = {
      id: mockDb.session_id_seq++,
      user_id: parseInt(user_id),
      token,
      ip_address,
      user_agent,
      device_info,
      created_at: new Date(),
      expires_at: new Date(expires_at)
    };
    mockDb.sessions.push(newSession);
    return { rows: [newSession] };
  }

  // 5. SELECT * FROM sessions WHERE token = $1
  if (normalized.includes('select * from sessions where token =')) {
    const token = params[0];
    const session = mockDb.sessions.find(s => s.token === token);
    return { rows: session ? [session] : [] };
  }

  // 6. DELETE FROM sessions WHERE token = $1
  if (normalized.includes('delete from sessions where token =')) {
    const token = params[0];
    const initialLen = mockDb.sessions.length;
    mockDb.sessions = mockDb.sessions.filter(s => s.token !== token);
    return { rowCount: initialLen - mockDb.sessions.length };
  }

  // 7. SELECT * FROM sessions WHERE user_id = $1
  if (normalized.includes('select * from sessions where user_id =')) {
    const userId = parseInt(params[0]);
    const sessions = mockDb.sessions.filter(s => s.user_id === userId);
    return { rows: sessions };
  }

  // 8. INSERT INTO audit_logs (user_id, action, details, ip_address)
  if (normalized.includes('insert into audit_logs')) {
    const [user_id, action, details, ip_address] = params;
    const newLog = {
      id: mockDb.log_id_seq++,
      user_id: user_id ? parseInt(user_id) : null,
      action,
      details,
      ip_address,
      created_at: new Date()
    };
    mockDb.audit_logs.push(newLog);
    return { rows: [newLog] };
  }

  // 9. SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2
  if (normalized.includes('select * from audit_logs')) {
    let logs = [...mockDb.audit_logs];
    
    if (normalized.includes('where user_id =')) {
      const userId = parseInt(params[0]);
      logs = logs.filter(l => l.user_id === userId);
    }
    
    // Sort descending
    logs.sort((a, b) => b.created_at - a.created_at);
    
    // Apply limit
    if (normalized.includes('limit')) {
      // Find limit from params
      const limitVal = params[params.length - 1];
      if (typeof limitVal === 'number') {
        logs = logs.slice(0, limitVal);
      }
    }
    return { rows: logs };
  }

  console.warn(`[DATABASE MOCK] Unhandled query pattern: "${text}" with params:`, params);
  return { rows: [] };
}
