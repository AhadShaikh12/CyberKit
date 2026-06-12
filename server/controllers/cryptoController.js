import * as db from '../services/dbService.js';

export async function auditCryptoOperation(req, res, next) {
  const userId = req.user.id;
  const { operationType, algorithm, inputLength } = req.body;
  const ip = req.ip || '127.0.0.1';

  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [
        userId,
        'CRYPTO_OPERATION',
        `Cryptographic operation executed: ${operationType} using ${algorithm || 'unknown algorithm'}. Input size: ${inputLength || 0} chars`,
        ip
      ]
    );

    res.status(200).json({ status: 'success', message: 'Audit log successfully recorded' });
  } catch (err) {
    next(err);
  }
}
