import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as db from '../services/dbService.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_cyberkit_jwt_key_987654321';

export async function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, token missing' });
  }

  try {
    // 1. Verify token signature
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Verify token is active in sessions table (prevent reuse of logged out sessions)
    const sessionRes = await db.query('SELECT * FROM sessions WHERE token = $1', [token]);
    if (sessionRes.rows.length === 0) {
      return res.status(401).json({ error: 'Session expired or invalidated. Please login again.' });
    }

    const session = sessionRes.rows[0];

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await db.query('DELETE FROM sessions WHERE token = $1', [token]);
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    // 3. Fetch user info
    const userRes = await db.query('SELECT id, username, two_factor_enabled FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User associated with this token no longer exists.' });
    }

    // Attach to request
    req.user = userRes.rows[0];
    req.token = token;
    req.sessionInfo = session;
    
    next();
  } catch (err) {
    console.error('[AUTH MIDDLEWARE] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
}
