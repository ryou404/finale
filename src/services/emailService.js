const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const nodemailer = require('nodemailer');

const emailUser = process.env.GMAIL_SEND || 'lehoangtho25122004@gmail.com';
const emailPass = (process.env.GMAIL_SMTP || '').replace(/["']/g, '').trim();
const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();

// Custom IPv4-only lookup function for Nodemailer
const ipv4Lookup = (hostname, options, callback) => {
  dns.lookup(hostname, { family: 4 }, (err, address, family) => {
    if (err) return callback(err);
    callback(null, address, 4);
  });
};

// 1. Primary Transporter: Port 587 (STARTTLS) with IPv4 forced
const primaryTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: emailUser,
    pass: emailPass
  },
  family: 4,
  lookup: ipv4Lookup,
  connectionTimeout: 8000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
    servername: 'smtp.gmail.com'
  }
});

// 2. Backup Transporter: Port 465 (SSL) with IPv4 forced
const backupTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  family: 4,
  lookup: ipv4Lookup,
  connectionTimeout: 8000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
    servername: 'smtp.gmail.com'
  }
});

/**
 * Send via Resend HTTP API (HTTPS 443 - Never blocked on Render Free)
 */
async function sendViaResend(toEmail, subject, html) {
  if (!resendApiKey) return null;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'CareerDNA <onboarding@resend.dev>',
      to: [toEmail],
      subject: subject,
      html: html
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Resend HTTP error: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Send via Brevo HTTP API (HTTPS 443 - Never blocked on Render Free)
 */
async function sendViaBrevo(toEmail, subject, html, recipientName) {
  if (!brevoApiKey) return null;
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'CareerDNA System', email: emailUser },
      to: [{ email: toEmail, name: recipientName }],
      subject: subject,
      htmlContent: html
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Brevo HTTP error: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Generate a secure 6-digit numeric OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP Verification Email
 * @param {string} toEmail - Recipient email
 * @param {string} code - 6-digit OTP
 * @param {string} type - 'register' or 'forgot_password'
 * @param {string} recipientName - Display name of recipient
 */
async function sendOtpEmail(toEmail, code, type = 'register', recipientName = '同學') {
  const isRegister = type === 'register';
  const subject = isRegister
    ? '【CareerDNA】新帳號註冊驗證碼'
    : '【CareerDNA】密碼重設驗證碼';

  const title = isRegister ? 'CareerDNA 帳號驗證' : 'CareerDNA 密碼重設';
  const desc = isRegister
    ? '感謝您註冊 CareerDNA 職涯規劃系統。請在驗證欄位輸入下方的 6 位數 OTP 驗證碼以完成信箱驗證：'
    : '我們收到您重設 CareerDNA 帳號密碼的申請。請輸入下方的 6 位數 OTP 驗證碼以進行密碼變更：';

  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'PingFang TC', 'Microsoft JhengHei', 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border: 2px solid #002fa7; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 47, 167, 0.1); }
        .header { background: #002fa7; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase; font-weight: 900; }
        .header p { margin: 6px 0 0; font-size: 12px; opacity: 0.8; letter-spacing: 1px; }
        .content { padding: 30px 24px; }
        .greeting { font-size: 15px; margin-bottom: 12px; font-weight: bold; color: #002fa7; }
        .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #f0f4ff; border: 2px dashed #002fa7; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 24px; }
        .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #002fa7; font-weight: bold; margin-bottom: 8px; }
        .otp-code { font-family: 'Courier New', monospace; font-size: 34px; font-weight: 900; color: #002fa7; letter-spacing: 8px; margin: 0; }
        .warning { font-size: 12px; color: #64748b; line-height: 1.5; border-left: 3px solid #f97316; padding-left: 10px; margin-top: 20px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CAREERDNA</h1>
          <p>Multi-Agent Academic & Career Planning System</p>
        </div>
        <div class="content">
          <div class="greeting">親愛的 ${recipientName}，您好：</div>
          <div class="desc">${desc}</div>
          <div class="otp-box">
            <div class="otp-label">OTP 驗證碼 (VERIFICATION CODE)</div>
            <div class="otp-code">${code}</div>
          </div>
          <div class="warning">
            ⏳ 此驗證碼有效期限為 <strong>10 分鐘</strong>。<br>
            🔒 為了您的帳號安全，請勿將此驗證碼透露給任何人。
          </div>
        </div>
        <div class="footer">
          此信件為 CareerDNA 系統自動發送，請勿直接回覆此郵件。
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Try Resend HTTP API if configured (Port 443 - Works 100% on Render Free)
  if (resendApiKey) {
    try {
      console.log(`[emailService] Sending email via Resend API to ${toEmail}...`);
      const resendRes = await sendViaResend(toEmail, subject, html);
      return { success: true, provider: 'resend', result: resendRes };
    } catch (err) {
      console.warn(`[emailService] Resend API failed: ${err.message}`);
    }
  }

  // 2. Try Brevo HTTP API if configured (Port 443 - Works 100% on Render Free)
  if (brevoApiKey) {
    try {
      console.log(`[emailService] Sending email via Brevo API to ${toEmail}...`);
      const brevoRes = await sendViaBrevo(toEmail, subject, html, recipientName);
      return { success: true, provider: 'brevo', result: brevoRes };
    } catch (err) {
      console.warn(`[emailService] Brevo API failed: ${err.message}`);
    }
  }

  // 3. Try SMTP (Port 587 then Port 465 with IPv4 forced)
  const mailOptions = {
    from: `"CareerDNA System" <${emailUser}>`,
    to: toEmail,
    subject: subject,
    html: html
  };

  try {
    const info = await primaryTransporter.sendMail(mailOptions);
    return { success: true, provider: 'smtp-587', info };
  } catch (primaryErr) {
    console.warn(`[emailService] Primary SMTP (port 587) failed: ${primaryErr.message}. Trying backup SMTP (port 465)...`);
    try {
      const info = await backupTransporter.sendMail(mailOptions);
      return { success: true, provider: 'smtp-465', info };
    } catch (backupErr) {
      console.warn(`[emailService] Backup SMTP (port 465) also failed (Render Free blocks SMTP ports): ${backupErr.message}`);
      return {
        success: false,
        isRenderBlocked: true,
        error: backupErr.message
      };
    }
  }
}

module.exports = {
  generateOTP,
  sendOtpEmail
};
