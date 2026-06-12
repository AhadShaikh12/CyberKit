import * as db from '../services/dbService.js';

export async function getAuditLogs(req, res, next) {
  const userId = req.user.id;
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;

  try {
    const logsRes = await db.query(
      'SELECT id, action, details, ip_address, created_at FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );

    res.status(200).json(logsRes.rows);
  } catch (err) {
    next(err);
  }
}

export async function clearAuditLogs(req, res, next) {
  const userId = req.user.id;
  const ip = req.ip || '127.0.0.1';

  try {
    // Clear logs for this user, but insert a final "LOGS_CLEARED" log
    await db.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
    
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [userId, 'LOGS_CLEARED', 'Security audit log history cleared by user', ip]
    );

    res.status(200).json({ message: 'Audit logs cleared successfully' });
  } catch (err) {
    next(err);
  }
}
