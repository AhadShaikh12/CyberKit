import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { UAParser } from 'ua-parser-js';
import * as db from '../services/dbService.js';
import * as emailService from '../services/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_cyberkit_jwt_key_987654321';
const BCRYPT_SALT_ROUNDS = 10;

// Helper to log audit actions
async function logAudit(userId, action, details, ipAddress) {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [userId, action, details, ipAddress]
    );
  } catch (err) {
    console.error('[AUDIT LOG FAILED]', err.message);
  }
}

// User Registration
export async function register(req, res, next) {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    
    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, two_factor_enabled',
      [username, passwordHash]
    );
    
    const newUser = result.rows[0];
    
    await logAudit(newUser.id, 'USER_REGISTERED', `User registered: ${username}`, ip);

    res.status(201).json({
      message: 'Registration successful. Please log in.',
      user: {
        id: newUser.id,
        username: newUser.username,
        two_factor_enabled: newUser.two_factor_enabled
      }
    });
  } catch (err) {
    if (err.code === '23505' || err.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    next(err);
  }
}

// User Login
export async function login(req, res, next) {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = userRes.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      // Log failed login audit
      await logAudit(user.id, 'LOGIN_FAILED', 'Failed login attempt: incorrect password', ip);
      
      // Simulate Email Alert for multiple failures (Optional mock logic)
      // For demo, we trigger email alert on every failed attempt in console
      await emailService.sendSecurityAlert(
        'admin@cyberkit.local', 
        'Failed Login Attempt', 
        {
          action: 'FAILED_LOGIN',
          ipAddress: ip,
          message: `A login attempt failed for user ${username} due to an incorrect password.`
        }
      );

      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if Two-Factor Authentication is enabled
    if (user.two_factor_enabled) {
      // Issue a short-lived temp token just for 2FA validation
      const tempToken = jwt.sign({ id: user.id, temp: true }, JWT_SECRET, { expiresIn: '5m' });
      return res.status(200).json({
        twoFactorRequired: true,
        tempToken,
        message: 'Two-factor authentication code required'
      });
    }

    // Regular login flow (2FA not enabled)
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    // Parse user agent
    const parser = new UAParser(userAgent);
    const parsedUA = parser.getResult();
    const deviceInfo = `${parsedUA.browser.name || 'Unknown Browser'} on ${parsedUA.os.name || 'Unknown OS'}`;

    // Calculate expiry (24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save session
    await db.query(
      'INSERT INTO sessions (user_id, token, ip_address, user_agent, device_info, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, token, ip, userAgent, deviceInfo, expiresAt]
    );

    await logAudit(user.id, 'USER_LOGIN', `Successful login. Device: ${deviceInfo}`, ip);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        two_factor_enabled: user.two_factor_enabled
      }
    });
  } catch (err) {
    next(err);
  }
}

// Complete login with 2FA
export async function verifyLogin2FA(req, res, next) {
  const { tempToken, code } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';

  if (!tempToken || !code) {
    return res.status(400).json({ error: 'Temporary token and OTP code are required' });
  }

  try {
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (!decoded.temp) {
      return res.status(400).json({ error: 'Invalid temporary token' });
    }

    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1 // 1-step window (30s tolerance)
    });

    if (!verified) {
      await logAudit(user.id, '2FA_VERIFICATION_FAILED', 'Failed 2FA OTP submission during login', ip);
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    // Generate full access token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    const parser = new UAParser(userAgent);
    const parsedUA = parser.getResult();
    const deviceInfo = `${parsedUA.browser.name || 'Unknown Browser'} on ${parsedUA.os.name || 'Unknown OS'}`;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await db.query(
      'INSERT INTO sessions (user_id, token, ip_address, user_agent, device_info, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, token, ip, userAgent, deviceInfo, expiresAt]
    );

    await logAudit(user.id, 'USER_LOGIN_2FA', `Successful login via 2FA. Device: ${deviceInfo}`, ip);

    res.status(200).json({
      message: '2FA authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        two_factor_enabled: user.two_factor_enabled
      }
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Temporary login token expired. Please re-enter username/password.' });
    }
    next(err);
  }
}

// Set up 2FA (Generates secret and QR code)
export async function setup2FA(req, res, next) {
  const userId = req.user.id;

  try {
    const userRes = await db.query('SELECT username, two_factor_enabled FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA is already enabled on this account' });
    }

    // Generate Speakeasy Secret
    const secret = speakeasy.generateSecret({
      name: `CyberKit:${user.username}`
    });

    // Save secret to database (keep two_factor_enabled false until verified)
    await db.query('UPDATE users SET two_factor_secret = $1, two_factor_enabled = false WHERE id = $2', [
      secret.base32,
      userId
    ]);

    // Generate QR code data URI
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    await logAudit(userId, '2FA_SETUP_INITIALIZED', 'User initialized 2FA setup flow', req.ip || '127.0.0.1');

    res.status(200).json({
      message: '2FA Secret generated. Verify using QR code or manual key.',
      qrCode: qrCodeDataUrl,
      secret: secret.base32
    });
  } catch (err) {
    next(err);
  }
}

// Verify and enable 2FA
export async function enable2FA(req, res, next) {
  const userId = req.user.id;
  const { code } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!code) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  try {
    const userRes = await db.query('SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    if (!user.two_factor_secret) {
      return res.status(400).json({ error: '2FA setup was not initialized. Call 2fa/setup first.' });
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA
    await db.query('UPDATE users SET two_factor_enabled = true WHERE id = $1', [userId]);
    
    await logAudit(userId, '2FA_ENABLED', '2FA successfully activated on account', ip);

    res.status(200).json({
      message: 'Two-Factor Authentication has been successfully enabled'
    });
  } catch (err) {
    next(err);
  }
}

// Disable 2FA
export async function disable2FA(req, res, next) {
  const userId = req.user.id;
  const { code } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!code) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  try {
    const userRes = await db.query('SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (!user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Clear 2FA
    await db.query('UPDATE users SET two_factor_secret = null, two_factor_enabled = false WHERE id = $1', [userId]);
    
    await logAudit(userId, '2FA_DISABLED', '2FA deactivated on account', ip);

    res.status(200).json({
      message: 'Two-Factor Authentication has been successfully disabled'
    });
  } catch (err) {
    next(err);
  }
}

// Fetch active sessions
export async function getSessions(req, res, next) {
  const userId = req.user.id;

  try {
    const sessionRes = await db.query('SELECT id, ip_address, device_info, created_at FROM sessions WHERE user_id = $1', [userId]);
    
    // Mark current session
    const sessions = sessionRes.rows.map(s => ({
      ...s,
      isCurrent: s.id === req.sessionInfo.id
    }));

    res.status(200).json(sessions);
  } catch (err) {
    next(err);
  }
}

// Logout
export async function logout(req, res, next) {
  const token = req.token;
  const userId = req.user.id;
  const ip = req.ip || '127.0.0.1';

  try {
    await db.query('DELETE FROM sessions WHERE token = $1', [token]);
    await logAudit(userId, 'USER_LOGOUT', 'User successfully logged out', ip);
    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    next(err);
  }
}
