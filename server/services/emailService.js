import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;
let emailConfigured = false;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS && 
    !process.env.EMAIL_USER.includes('your_email')) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    emailConfigured = true;
    console.log('[EMAIL] Nodemailer transporter created successfully.');
  } catch (err) {
    console.warn('[EMAIL] Failed to create nodemailer transporter. Error:', err.message);
  }
} else {
  console.log('[EMAIL] Email credentials not fully configured in .env. Operating in simulator console mode.');
}

export async function sendSecurityAlert(toEmail, subject, alertDetails) {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 20px; border-radius: 8px; border: 1px solid #30363d;">
      <h2 style="color: #ff5555; border-bottom: 2px solid #ff5555; padding-bottom: 10px;">🛡️ CyberKit Security Notification</h2>
      <p style="font-size: 16px;">We detected a high-priority security event on your CyberKit account.</p>
      <div style="background-color: #161b22; padding: 15px; border-radius: 6px; border: 1px solid #21262d; margin: 20px 0;">
        <h3 style="color: #58a6ff; margin-top: 0;">Event Details:</h3>
        <p><strong>Action:</strong> ${alertDetails.action}</p>
        <p><strong>IP Address:</strong> ${alertDetails.ipAddress}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Details:</strong> ${alertDetails.message}</p>
      </div>
      <p style="font-size: 12px; color: #8b949e;">If this was you, you can safely ignore this email. Otherwise, please log in and change your password immediately.</p>
    </div>
  `;

  if (emailConfigured && transporter) {
    try {
      await transporter.sendMail({
        from: `"CyberKit Security" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `[CyberKit Alert] ${subject}`,
        html: emailHtml
      });
      console.log(`[EMAIL ALERT SENT] Security email sent to ${toEmail}`);
      return true;
    } catch (err) {
      console.error('[EMAIL ERROR] Failed to send email alert:', err.message);
    }
  }

  // Fallback console log for simulation
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════
║ 🛡️  [EMAIL ALERT SIMULATION]
╠══════════════════════════════════════════════════════════════════════════════
║ To: ${toEmail}
║ Subject: [CyberKit Alert] ${subject}
║ Action: ${alertDetails.action}
║ IP Address: ${alertDetails.ipAddress}
║ Message: ${alertDetails.message}
╚══════════════════════════════════════════════════════════════════════════════
  `);
  return false;
}
