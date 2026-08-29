const nodemailer = require('nodemailer');

const emailUser = process.env.GMAIL_SEND || 'lehoangtho25122004@gmail.com';
const emailPass = (process.env.GMAIL_SMTP || '').replace(/["']/g, '').trim();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

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
async function sendOtpEmail(toEmail, code, type = 'register', recipientName = 'Bạn') {
  const isRegister = type === 'register';
  const subject = isRegister
    ? '【CareerDNA】Mã xác thực đăng ký tài khoản mới'
    : '【CareerDNA】Mã xác thực đặt lại mật khẩu của bạn';

  const title = isRegister ? 'Xác thực tài khoản CareerDNA' : 'Đặt lại mật khẩu CareerDNA';
  const desc = isRegister
    ? 'Cảm ơn bạn đã đăng ký tài khoản trên hệ thống CareerDNA. Vui lòng nhập mã OTP dưới đây để hoàn tất bước xác thực email:'
    : 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhập mã OTP dưới đây để tiến hành đổi mật khẩu mới:';

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }
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
          <div class="greeting">Xin chào ${recipientName},</div>
          <div class="desc">${desc}</div>
          <div class="otp-box">
            <div class="otp-label">MÃ XÁC THỰC (OTP)</div>
            <div class="otp-code">${code}</div>
          </div>
          <div class="warning">
            ⏳ Mã xác thực này có hiệu lực trong vòng <strong>10 phút</strong>.<br>
            🔒 Không chia sẻ mã này với bất kỳ ai để bảo vệ an toàn cho tài khoản của bạn.
          </div>
        </div>
        <div class="footer">
          Đây là email tự động từ hệ thống CareerDNA · Vui lòng không trả lời email này.
        </div>
      </div>
    </body>
    </html>
  `;

  return await transporter.sendMail({
    from: `"CareerDNA System" <${emailUser}>`,
    to: toEmail,
    subject: subject,
    html: html
  });
}

module.exports = {
  generateOTP,
  sendOtpEmail
};
