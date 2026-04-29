// backend/src/services/email.js
//
// Thin wrapper around nodemailer. Falls back to console-logging emails when
// SMTP credentials are not configured, so the project remains runnable in
// development without external services.

const nodemailer = require('nodemailer');

let cachedTransporter = null;
let transporterMode = null; // 'smtp' | 'console'

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: { user, pass },
    });
    transporterMode = 'smtp';
  } else {
    // No-op transporter that logs payload to stdout
    cachedTransporter = {
      sendMail: async (opts) => {
        console.log('\n──────── [EMAIL — console fallback] ────────');
        console.log('To:      ', opts.to);
        console.log('Subject: ', opts.subject);
        console.log('--------');
        console.log(opts.text || opts.html);
        console.log('────────────────────────────────────────────\n');
        return { messageId: 'console-fallback' };
      },
    };
    transporterMode = 'console';
  }
  return cachedTransporter;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || 'GEU Alumni Connect <no-reply@geu-alumni.local>';
  try {
    await transporter.sendMail({ from, to, subject, text, html });
    return { ok: true, mode: transporterMode };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { ok: false, error: err.message };
  }
}

// ─── Email templates ────────────────────────────────────────────────────────

function approvalEmail({ fullName, username, password, loginUrl }) {
  const subject = 'GEU Alumni Connect — Your account has been approved 🎉';
  const text = [
    `Hi ${fullName},`,
    '',
    'Welcome to GEU Alumni Connect! Your registration has been verified and approved.',
    '',
    'Your login credentials:',
    `  • Username: ${username}`,
    `  • Temporary password: ${password}`,
    '',
    `Sign in here: ${loginUrl}`,
    '',
    'For security, please change your password immediately after your first login',
    'using the "Change Password" option in your profile menu — an OTP will be sent',
    'to this email to confirm the change.',
    '',
    '— GEU Alumni Connect',
  ].join('\n');
  return { subject, text };
}

function rejectionEmail({ fullName, reason }) {
  const subject = 'GEU Alumni Connect — Registration update';
  const text = [
    `Hi ${fullName},`,
    '',
    'Thank you for your interest in joining GEU Alumni Connect.',
    'After reviewing the documents you submitted, we are unable to verify',
    'your alumni status at this time.',
    '',
    reason ? `Reviewer note: ${reason}` : '',
    '',
    'If you believe this is an error, please reply to this email with',
    'additional supporting documents (e.g. degree certificate, ID card).',
    '',
    '— GEU Alumni Connect',
  ].filter(Boolean).join('\n');
  return { subject, text };
}

function otpEmail({ fullName, code, purpose }) {
  const purposeLabel = purpose === 'change_password' ? 'change your password'
    : purpose === 'reset_password' ? 'reset your password'
    : 'confirm your action';
  const subject = `GEU Alumni Connect — Your verification code: ${code}`;
  const text = [
    `Hi ${fullName || 'there'},`,
    '',
    `Use the code below to ${purposeLabel}. It is valid for 10 minutes.`,
    '',
    `   ${code}`,
    '',
    'If you did not request this, you can safely ignore this email — no changes',
    'will be made to your account.',
    '',
    '— GEU Alumni Connect',
  ].join('\n');
  return { subject, text };
}

module.exports = {
  sendMail,
  approvalEmail,
  rejectionEmail,
  otpEmail,
};
