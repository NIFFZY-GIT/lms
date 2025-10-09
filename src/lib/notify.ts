import nodemailer, { Transporter } from 'nodemailer';
import { Role } from '@/types';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
const appName = process.env.APP_NAME || 'LMS';

let cachedTransporter: Transporter | null = null;

function assertSmtpConfig() {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.');
  }
}

function getTransporter(): Transporter {
  assertSmtpConfig();
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }
  return cachedTransporter;
}

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

const roleLabels: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.INSTRUCTOR]: 'Instructor',
  [Role.STUDENT]: 'Student',
};

const emailStyles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 32px; }
  .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12); }
  .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; padding: 28px; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { padding: 28px; color: #1f2937; line-height: 1.6; }
  .content p { margin: 0 0 16px; }
  .btn { display: inline-block; padding: 12px 20px; border-radius: 999px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff !important; text-decoration: none; font-weight: 600; }
  .footer { padding: 20px 28px; font-size: 12px; color: #6b7280; background: #f9fafb; text-align: center; }
`;

function wrapHtmlContent(title: string, content: string) {
  return `
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${content}
            <p style="margin-top: 32px; font-size: 14px; color: #4b5563;">Cheers,<br><strong>${appName} Team</strong></p>
          </div>
          <div class="footer">
            You received this email because your account is registered with ${appName}.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail({ to, subject, html, text }: EmailPayload) {
  const transporter = getTransporter();
  await transporter.sendMail({ from: smtpFrom, to, subject, html, text });
}

export async function sendResetEmail(to: string, code: string) {
  const subject = `${appName} password reset code`;
  const text = `Your ${appName} password reset code is ${code}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
      <h2>${appName} password reset</h2>
      <p>Use the following verification code to reset your password:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:3px">${code}</p>
      <p>This code expires in 10 minutes. If you did not request this, you can ignore this message.</p>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
}

export async function sendRoleChangeEmail(to: string, name: string, oldRole: Role, newRole: Role) {
  const subject = `${appName} role update: ${roleLabels[newRole]}`;
  const text = `Hi ${name}, your role has been updated from ${roleLabels[oldRole]} to ${roleLabels[newRole]} in ${appName}. You now have access to the features available for ${roleLabels[newRole]}s.`;
  const html = wrapHtmlContent('Your role has been updated', `
    <p>Hi ${name},</p>
    <p>Your account role has been updated from <strong>${roleLabels[oldRole]}</strong> to <strong>${roleLabels[newRole]}</strong>.</p>
    <p>You now have access to the tools and dashboards available to ${roleLabels[newRole]}s. If this was unexpected, please contact support.</p>
  `);
  await sendEmail({ to, subject, text, html });
}

export async function sendPaymentApprovedEmail(to: string, name: string, courseTitle: string, referenceNumber: string) {
  const subject = `${appName}: Enrollment confirmed for ${courseTitle}`;
  const text = `Hi ${name}, your payment has been approved and you are now enrolled in ${courseTitle}. Reference number: ${referenceNumber}.`;
  const html = wrapHtmlContent('Your enrollment is confirmed', `
    <p>Hi ${name},</p>
    <p>Great news! Your payment has been approved and your enrollment in <strong>${courseTitle}</strong> is now active.</p>
    <p><strong>Reference number:</strong> ${referenceNumber}</p>
    <p>You can now access all course materials and begin learning right away.</p>
  <a class="btn" href="${(process.env.NEXT_PUBLIC_APP_URL ?? '#')}">Go to dashboard</a>
  `);
  await sendEmail({ to, subject, text, html });
}

export async function sendReceiptUploadedEmailToAdmins(adminEmails: string[], payload: { studentName: string; studentEmail: string; courseTitle: string; }) {
  if (!adminEmails.length) return;
  const subject = `${appName}: New receipt uploaded by ${payload.studentName}`;
  const text = `${payload.studentName} (${payload.studentEmail}) uploaded a payment receipt for ${payload.courseTitle}. Please review and approve it.`;
  const html = wrapHtmlContent('New payment receipt awaiting review', `
    <p>Hello team,</p>
    <p><strong>${payload.studentName}</strong> (<a href="mailto:${payload.studentEmail}">${payload.studentEmail}</a>) uploaded a new payment receipt for the course <strong>${payload.courseTitle}</strong>.</p>
    <p>Please review and process the payment approval at your earliest convenience.</p>
  <a class="btn" href="${(process.env.NEXT_PUBLIC_APP_URL ?? '#') + '/dashboard/admin/payments'}">Review payments</a>
  `);
  await sendEmail({ to: adminEmails, subject, text, html });
}
