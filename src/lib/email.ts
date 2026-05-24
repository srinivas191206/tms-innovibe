import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  if (process.env.EMAILS_ENABLED !== 'true') {
    console.log(`[EMAIL DISABLED] Skip sending to ${to}: ${subject}`);
    return { success: true, message: 'Emails disabled globally.' };
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'Innovibe Portal <noreply@innovibe.com>';

  // If host or auth is empty, perform standard console-logger fallback
  if (!host || !user || !pass) {
    console.log('\n======================================================');
    console.log('📬  [INNOVIBE EMAIL SIMULATOR]');
    console.log(`    Date:    ${new Date().toLocaleString()}`);
    console.log(`    To:      ${to}`);
    console.log(`    Subject: ${subject}`);
    console.log('------------------------------------------------------');
    console.log(`    Body:\n    ${text}`);
    if (html) {
      console.log('------------------------------------------------------');
      console.log(`    HTML Version: Simulating formatted visual template`);
    }
    console.log('======================================================\n');
    return { success: true, message: 'Email printed to server console.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log(`[EMAIL SUCCESS] Email sent to ${to}. Msg ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error);
    return { success: false, error };
  }
}
