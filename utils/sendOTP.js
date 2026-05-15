import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) console.error('❌ Gmail connection failed:', err.message);
  else console.log('✅ Gmail connected, ready to send');
});

/**
 * Generate a 6-digit OTP code
 */
export const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} code  - The plain OTP code (before hashing)
 * @param {string} name  - Recipient name for personalization
 */
export const sendOTPEmail = async (email, code, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your MessageBoard verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Hello, ${name} 👋</h2>
        <p style="color: #555; margin-bottom: 24px;">
          Use the verification code below to set your password.
          This code expires in <strong>10 minutes</strong>.
        </p>
        <div style="background: #fff; border: 2px solid #e0e0e0; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #2563eb;">
            ${code}
          </span>
        </div>
        <p style="color: #888; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
          Never share this code with anyone.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};