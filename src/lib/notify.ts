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
    const isSecure = smtpPort === 465;
    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: { 
        user: smtpUser, 
        pass: smtpPass 
      },
      // Zoho Mail specific settings
      tls: {
        // Do not fail on invalid certs (useful for self-signed certs in dev)
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        // Minimum TLS version
        minVersion: 'TLSv1.2'
      },
      // Connection timeout (30 seconds)
      connectionTimeout: 30000,
      // Greeting timeout (30 seconds)
      greetingTimeout: 30000,
      // Socket timeout (60 seconds)
      socketTimeout: 60000,
    });
  }
  return cachedTransporter;
}

/**
 * Verify the SMTP connection is working.
 * Call this on server startup or when debugging email issues.
 */
export async function verifyEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    assertSmtpConfig();
    const transporter = getTransporter();
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SMTP connection verification failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get the base URL for the application with proper protocol.
 */
function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url || url === '#') return '#';
  // Ensure URL has protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Default to https for production
  return `https://${url}`;
}

/**
 * Get full URL for images, ensuring they have absolute paths.
 */
function getAbsoluteImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  // If already absolute URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Otherwise, prepend base URL
  const baseUrl = getBaseUrl();
  if (baseUrl === '#') return null;
  // Ensure no double slashes
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${baseUrl}${cleanPath}`;
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

export async function sendEmail({ to, subject, html, text }: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getTransporter();
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    
    const info = await transporter.sendMail({ 
      from: `"${appName}" <${smtpFrom}>`, 
      to: recipients, 
      subject, 
      html, 
      text 
    });
    
    console.log(`Email sent successfully to ${recipients}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown email error';
    console.error(`Failed to send email to ${Array.isArray(to) ? to.join(', ') : to}:`, errorMessage);
    throw error; // Re-throw to let callers handle it
  }
}

export async function sendResetEmail(to: string, code: string) {
  const brandName = 'Online Thakshilawa';
  const brandUrl = 'https://onlinethakshilawa.lk';
  const subject = `${brandName} - Password Reset Code`;
  const text = `Your ${brandName} password reset code is ${code}. It expires in 10 minutes.`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 50%,#1e40af 100%);padding:32px 24px;text-align:center;">
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${brandName}</h1>
                  <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">onlinethakshilawa.lk</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:40px 32px;">
                  <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#1e293b;">Password Reset Request</h2>
                  <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.5;">Use the verification code below to reset your password. This code is valid for 10 minutes.</p>
                  
                  <!-- Code Box -->
                  <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:2px solid #bfdbfe;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;">Your Verification Code</p>
                    <p style="margin:0;font-size:36px;font-weight:700;color:#1d4ed8;letter-spacing:8px;font-family:'Courier New',monospace;">${code}</p>
                  </div>
                  
                  <!-- Warning -->
                  <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 24px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                      <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account is safe.
                    </p>
                  </div>
                  
                  <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                    Need help? Contact us at <a href="mailto:contactus@zevarone.com" style="color:#2563eb;text-decoration:none;font-weight:500;">contactus@zevarone.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
                    © ${new Date().getFullYear()} ${brandName}. All rights reserved.
                  </p>
                  <a href="${brandUrl}" style="font-size:12px;color:#2563eb;text-decoration:none;">onlinethakshilawa.lk</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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
  const baseUrl = getBaseUrl();
  const subject = `${appName}: Enrollment confirmed for ${courseTitle}`;
  const text = `Hi ${name}, your payment has been approved and you are now enrolled in ${courseTitle}. Reference number: ${referenceNumber}.`;
  const html = wrapHtmlContent('Your enrollment is confirmed', `
    <p>Hi ${name},</p>
    <p>Great news! Your payment has been approved and your enrollment in <strong>${courseTitle}</strong> is now active.</p>
    <p><strong>Reference number:</strong> ${referenceNumber}</p>
    <p>You can now access all course materials and begin learning right away.</p>
    <a class="btn" href="${baseUrl}/dashboard/student">Go to dashboard</a>
  `);
  await sendEmail({ to, subject, text, html });
}

export async function sendReceiptUploadedEmailToAdmins(adminEmails: string[], payload: { studentName: string; studentEmail: string; courseTitle: string; }) {
  if (!adminEmails.length) return;
  const baseUrl = getBaseUrl();
  const subject = `${appName}: New receipt uploaded by ${payload.studentName}`;
  const text = `${payload.studentName} (${payload.studentEmail}) uploaded a payment receipt for ${payload.courseTitle}. Please review and approve it.`;
  const html = wrapHtmlContent('New payment receipt awaiting review', `
    <p>Hello team,</p>
    <p><strong>${payload.studentName}</strong> (<a href="mailto:${payload.studentEmail}">${payload.studentEmail}</a>) uploaded a new payment receipt for the course <strong>${payload.courseTitle}</strong>.</p>
    <p>Please review and process the payment approval at your earliest convenience.</p>
    <a class="btn" href="${baseUrl}/dashboard/admin/payments">Review payments</a>
  `);
  await sendEmail({ to: adminEmails, subject, text, html });
}

export async function sendAnnouncementPublishedEmail(recipients: string[], payload: { title: string; summary: string; imageUrl?: string | null; announcementId: string }) {
  if (!recipients.length) return;

  const baseUrl = getBaseUrl();
  const subject = `${appName}: New announcement - ${payload.title}`;
  const text = `A new announcement "${payload.title}" has been posted. Log in to ${appName} to read the full update.`;

  const announcementLink = `${baseUrl}/announcements/${payload.announcementId}`;
  const absoluteImageUrl = getAbsoluteImageUrl(payload.imageUrl);

  const imageMarkup = absoluteImageUrl
    ? `<div style="margin: 24px 0;"><img src="${absoluteImageUrl}" alt="${payload.title}" style="max-width:100%;border-radius:12px" /></div>`
    : '';

  const html = wrapHtmlContent('A new announcement awaits', `
    <p>Hello,</p>
    <p>We have just published a new announcement titled <strong>${payload.title}</strong>.</p>
    <p>${payload.summary}</p>
    ${imageMarkup}
    <a class="btn" href="${announcementLink}">Read the full announcement</a>
  `);

  await sendEmail({ to: recipients, subject, text, html });
}

/**
 * Send a test email to verify the email configuration is working.
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = `${appName} - Email Test`;
    const text = `This is a test email from ${appName}. If you received this, your email configuration is working correctly.`;
    const html = wrapHtmlContent('Email Test Successful', `
      <p>Hello,</p>
      <p>This is a test email from <strong>${appName}</strong>.</p>
      <p>If you received this message, your email configuration is working correctly!</p>
      <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
    `);

    await sendEmail({ to, subject, text, html });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}



