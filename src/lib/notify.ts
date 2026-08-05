import nodemailer, { Transporter } from 'nodemailer';
import { Role } from '@/types';

// --- CONFIGURATION ---
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
const appName = process.env.APP_NAME || 'Online Thakshilawa';
const brandUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://onlinethakshilawa.lk';




let cachedTransporter: Transporter | null = null;

// --- BRANDING & STYLES ---
const colors = {
  primaryGradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', // Deep modern blue
  primary: '#2563eb',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  textMain: '#1e293b',
  textMuted: '#64748b',
  bgLight: '#f1f5f9',
  white: '#ffffff',
  border: '#e2e8f0'
};

const emailStyles = `
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${colors.bgLight}; margin: 0; padding: 0; }
  .wrapper { width: 100%; background-color: ${colors.bgLight}; padding: 40px 10px; }
  .container { max-width: 600px; margin: 0 auto; background-color: ${colors.white}; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid ${colors.border}; }
  .header { padding: 32px; text-align: center; background: ${colors.primaryGradient}; color: ${colors.white}; }
  .logo { display: block; height: 44px; width: 107px; border: 0; }
  .logo-plate { display: inline-block; background: ${colors.white}; padding: 14px 22px; border-radius: 14px; text-decoration: none; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; opacity: 0.9; }
  .content { padding: 40px 32px; color: ${colors.textMain}; line-height: 1.7; font-size: 16px; }
  .badge { display: inline-block; padding: 6px 14px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.05em; }
  .badge-success { background-color: #ecfdf5; color: #065f46; }
  .badge-info { background-color: #eff6ff; color: #1e40af; }
  .badge-warning { background-color: #fffbeb; color: #92400e; }
  .btn-wrapper { text-align: center; padding: 24px 0; }
  .btn { background-color: ${colors.primary}; color: ${colors.white} !important; padding: 14px 35px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
  .info-box { background-color: #f8fafc; border-radius: 14px; padding: 20px; margin: 24px 0; border: 1px solid ${colors.border}; }
  .footer { padding: 32px; text-align: center; background-color: #ffffff; border-top: 1px solid ${colors.border}; font-size: 13px; color: ${colors.textMuted}; }
  .footer a { color: ${colors.primary}; text-decoration: none; font-weight: 600; }
  .powered-by { margin-top: 15px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
  /* The Zevarone mark is white on transparent, so it needs a dark plate to be
     visible against the white footer. The anchor is white too, so that clients
     blocking remote images still show the alt text legibly on that plate. */
  .zev-chip { display: inline-block; margin-top: 10px; background: #0f172a; padding: 12px 20px; border-radius: 12px; text-decoration: none; color: #ffffff !important; font-size: 12px; }
  .zev-logo { display: block; width: 152px; height: 18px; border: 0; }
`;

// --- HELPERS ---

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  return (!url || url === '#') ? brandUrl : (url.startsWith('http') ? url : `https://${url}`);
}

function getAbsoluteImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  const baseUrl = getBaseUrl();
  return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

/**
 * Escapes free text before it goes into an email body. Anything typed by a
 * person — a rejection reason, for instance — must go through this, or a stray
 * angle bracket breaks the markup and injected tags reach the recipient.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapHtmlContent(title: string, content: string, badge?: { label: string, type: 'success' | 'info' | 'warning' }) {
  const badgeHtml = badge ? `<div class="badge badge-${badge.type}">${badge.label}</div>` : '';
  // Next serves public/ from the site root, so "public" must not appear in the
  // path. Forward slashes matter too: in a JS string "\l" and "\i" collapse to
  // "l" and "i", which is what silently mangled these URLs.
  const logoUrl = getAbsoluteImageUrl('/logo.png');
  const zevaroneLogoUrl = getAbsoluteImageUrl('/images/zevaronelogo/zevaronelogo.png');
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${emailStyles}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            ${logoUrl
              ? `<a href="${brandUrl}" target="_blank" class="logo-plate" style="display:inline-block;background:#ffffff;padding:14px 22px;border-radius:14px;text-decoration:none;"><img src="${logoUrl}" alt="${appName}" width="107" height="44" class="logo" style="display:block;height:44px;width:107px;border:0;outline:none;" /></a>`
              : `<h1>${appName}</h1>`}
          </div>
          <div class="content">
            ${badgeHtml}
            <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #0f172a; letter-spacing: -0.02em;">${title}</h2>
            ${content}
            <p style="margin-top: 35px; font-size: 14px;">Regards,<br><strong>The ${appName} Team</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <div class="powered-by">Powered by</div>
            ${zevaroneLogoUrl
              ? `<a href="https://zevarone.com" target="_blank" class="zev-chip" style="display:inline-block;margin-top:10px;background:#0f172a;padding:12px 20px;border-radius:12px;text-decoration:none;color:#ffffff;font-size:12px;"><img src="${zevaroneLogoUrl}" alt="Zevarone" width="152" height="18" class="zev-logo" style="display:block;width:152px;height:18px;border:0;outline:none;" /></a>`
              : `<a href="https://zevarone.com" target="_blank" style="font-weight:600;color:${colors.primary};text-decoration:none;">Zevarone</a>`}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// --- SMTP LOGIC ---

function getTransporter(): Transporter {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error('SMTP credentials missing.');
  }
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

export async function sendEmail({ to, subject, html, text }: { to: string | string[]; subject: string; html: string; text?: string }) {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${appName}" <${smtpFrom}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text
    });
    return { success: true };
  } catch (error) {
    console.error('Email Error:', error);
    throw error;
  }
}

// --- TEMPLATES & EXPORTS ---

const roleLabels: Record<Role, string> = {
  [Role.ADMIN]: 'Administrator',
  [Role.INSTRUCTOR]: 'Instructor',
  [Role.STUDENT]: 'Student',
};

export async function sendResetEmail(to: string, code: string) {
  const html = wrapHtmlContent('Reset Your Password', `
    <p>Use the verification code below to reset your password. For security, this code expires in 10 minutes.</p>
    <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 30px; text-align: center; margin: 25px 0;">
      <div style="font-size: 48px; font-weight: 800; color: ${colors.primary}; letter-spacing: 10px; font-family: monospace;">${code}</div>
    </div>
  `, { label: 'Security', type: 'info' });
  await sendEmail({ to, subject: `Reset Code: ${code}`, html });
}

export async function sendAccountCreatedEmail(to: string, payload: { name: string; role: Role }) {
  const baseUrl = getBaseUrl();
  const html = wrapHtmlContent('Welcome to the Platform!', `
    <p>Hi ${payload.name}, your <strong>${roleLabels[payload.role]}</strong> account has been created. We are excited to have you join ${appName}.</p>
    <div class="btn-wrapper"><a href="${baseUrl}/auth/login" class="btn">Sign In to Dashboard</a></div>
  `, { label: 'Welcome', type: 'success' });
  await sendEmail({ to, subject: `Account Created - ${appName}`, html });
}

export async function sendPaymentApprovedEmail(to: string, name: string, courseTitle: string, referenceNumber: string) {
  const baseUrl = getBaseUrl();
  const html = wrapHtmlContent('Payment Approved!', `
    <p>Hi ${name}, your payment was successful. You are now enrolled in <strong>${courseTitle}</strong>.</p>
    <div class="info-box"><strong>Ref:</strong> ${referenceNumber}</div>
    <div class="btn-wrapper"><a href="${baseUrl}/dashboard/student" class="btn">Start Learning Now</a></div>
  `, { label: 'Success', type: 'success' });
  await sendEmail({ to, subject: `Enrollment Confirmed: ${courseTitle}`, html });
}

// --- COURSE & CONTENT EXPORTS (FIXES BUILD ERRORS) ---

export async function sendCoursePublishedEmail(recipients: string[], payload: { courseTitle: string; description: string; courseId: string }) {
  if (!recipients.length) return;
  const baseUrl = getBaseUrl();
  const html = wrapHtmlContent('New Course Published', `
    <p>A new course is now available: <strong>${payload.courseTitle}</strong></p>
    <p style="color: ${colors.textMuted};">${payload.description.slice(0, 160)}...</p>
    <div class="btn-wrapper"><a href="${baseUrl}/courses/${payload.courseId}" class="btn">Explore Course</a></div>
  `, { label: 'New', type: 'success' });
  await sendEmail({ to: recipients, subject: `New Course: ${payload.courseTitle}`, html });
}

export async function sendCourseContentUpdateEmail(recipients: string[], payload: { courseTitle: string; contentType: string; contentTitle: string; courseId: string }) {
  if (!recipients.length) return;
  const baseUrl = getBaseUrl();
  const html = wrapHtmlContent('New Course Material', `
    <p>New <strong>${payload.contentType.toLowerCase()}</strong> added to <strong>${payload.courseTitle}</strong>:</p>
    <div class="info-box"><strong>${payload.contentTitle}</strong></div>
    <div class="btn-wrapper"><a href="${baseUrl}/courses/${payload.courseId}" class="btn">View Content</a></div>
  `, { label: 'Update', type: 'info' });
  await sendEmail({ to: recipients, subject: `Update in ${payload.courseTitle}`, html });
}

export async function sendCourseUpdatedEmail(recipients: string[], payload: { courseTitle: string; highlights: string; courseId: string }) {
  if (!recipients.length) return;
  const baseUrl = getBaseUrl();
  const html = wrapHtmlContent('Course Update', `
    <p>The course <strong>${payload.courseTitle}</strong> has been updated.</p>
    <div class="info-box">${payload.highlights}</div>
    <div class="btn-wrapper"><a href="${baseUrl}/courses/${payload.courseId}" class="btn">Open Dashboard</a></div>
  `, { label: 'Update', type: 'info' });
  await sendEmail({ to: recipients, subject: `Updated: ${payload.courseTitle}`, html });
}

// --- OTHER REQUIRED EXPORTS ---

export async function sendPaymentRejectedEmail(to: string, payload: { name: string; courseTitle: string; reason?: string | null }) {
  const baseUrl = getBaseUrl();
  const html = wrapHtmlContent('Payment Update', `
    <p>Hi ${payload.name}, we could not verify your payment for <strong>${payload.courseTitle}</strong>.</p>
    ${payload.reason ? `<div class="info-box" style="border-left: 4px solid ${colors.error};"><strong>Reason:</strong> ${escapeHtml(payload.reason).replace(/\n/g, '<br/>')}</div>` : ''}
    <div class="btn-wrapper"><a href="${baseUrl}/courses" class="btn">Retry Enrollment</a></div>
  `, { label: 'Action Required', type: 'warning' });
  await sendEmail({ to, subject: `Payment Declined: ${payload.courseTitle}`, html });
}

export async function sendAnnouncementPublishedEmail(recipients: string[], payload: { title: string; summary: string; imageUrl?: string | null; announcementId: string }) {
  if (!recipients.length) return;
  const baseUrl = getBaseUrl();
  const absoluteImageUrl = getAbsoluteImageUrl(payload.imageUrl);
  const html = wrapHtmlContent('New Announcement', `
    <p><strong>${payload.title}</strong></p>
    <p>${payload.summary}</p>
    ${absoluteImageUrl ? `<img src="${absoluteImageUrl}" style="width:100%; border-radius:15px; margin: 20px 0;">` : ''}
    <div class="btn-wrapper"><a href="${baseUrl}/announcements/${payload.announcementId}" class="btn">Read Full Story</a></div>
  `, { label: 'Announcement', type: 'info' });
  await sendEmail({ to: recipients, subject: `Announcement: ${payload.title}`, html });
}

export async function sendAnnouncementUpdatedEmail(recipients: string[], payload: { title: string; summary: string; announcementId: string }) {
  if (!recipients.length) return;
  const baseUrl = getBaseUrl();
  const html = wrapHtmlContent('Announcement Updated', `
    <p>The announcement <strong>${payload.title}</strong> was updated.</p>
    <div class="btn-wrapper"><a href="${baseUrl}/announcements/${payload.announcementId}" class="btn">View Update</a></div>
  `, { label: 'Update', type: 'info' });
  await sendEmail({ to: recipients, subject: `Update: ${payload.title}`, html });
}

export async function sendEnrollmentSubmittedEmail(to: string, payload: { name: string; courseTitle: string; isSubscription?: boolean }) {
  const html = wrapHtmlContent('Request Received', `
    <p>Hi ${payload.name}, we are reviewing your enrollment request for <strong>${payload.courseTitle}</strong>.</p>
  `, { label: 'Pending', type: 'info' });
  await sendEmail({ to, subject: `Processing: ${payload.courseTitle}`, html });
}

export async function sendRoleChangeEmail(to: string, name: string, oldRole: Role, newRole: Role) {
  const html = wrapHtmlContent('Role Updated', `
    <p>Hi ${name}, your role changed from <strong>${roleLabels[oldRole]}</strong> to <strong>${roleLabels[newRole]}</strong>.</p>
  `, { label: 'Update', type: 'info' });
  await sendEmail({ to, subject: `Role Updated`, html });
}

export async function sendReceiptUploadedEmailToAdmins(adminEmails: string[], payload: { studentName: string; studentEmail: string; courseTitle: string; }) {
  if (!adminEmails.length) return;
  const baseUrl = getBaseUrl();
  const html = wrapHtmlContent('New Receipt', `
    <p><strong>${payload.studentName}</strong> uploaded a receipt for <strong>${payload.courseTitle}</strong>.</p>
    <div class="btn-wrapper"><a href="${baseUrl}/dashboard/admin/payments" class="btn">Review Payment</a></div>
  `, { label: 'Admin', type: 'info' });
  await sendEmail({ to: adminEmails, subject: `Receipt: ${payload.studentName}`, html });
}

export async function sendEnrollmentStatusToStaff(staffEmails: string[], payload: { studentName: string; studentEmail: string; courseTitle: string; status: string }) {
  if (!staffEmails.length) return;
  const html = wrapHtmlContent(`Status: ${payload.status}`, `
    <p>Student <strong>${payload.studentName}</strong> enrollment in <strong>${payload.courseTitle}</strong> is now <strong>${payload.status}</strong>.</p>
  `);
  await sendEmail({ to: staffEmails, subject: `Enrollment Update: ${payload.studentName}`, html });
}

export async function sendClassStartingReminderEmail(to: string, payload: { studentName: string; courseTitle: string; classDay: string; classStartTime: string; startsInMinutes: number; courseId: string; scheduleNote?: string | null; }) {
  const baseUrl = getBaseUrl();
  const noteLine = payload.scheduleNote
    ? `<div style="margin-top:10px;"><strong>Class note:</strong> ${escapeHtml(payload.scheduleNote)}</div>`
    : '';
  const html = wrapHtmlContent('Class Starts Soon!', `
    <p>Hi ${payload.studentName}, <strong>${payload.courseTitle}</strong> starts in ${payload.startsInMinutes} minutes.</p>
    <div class="info-box">${payload.classDay} at ${payload.classStartTime}${noteLine}</div>
    <div class="btn-wrapper"><a href="${baseUrl}/dashboard/student/course/${payload.courseId}" class="btn">Join Session</a></div>
  `, { label: 'Reminder', type: 'info' });
  await sendEmail({ to, subject: `Reminder: ${payload.courseTitle}`, html });
}

export async function verifyEmailConnection() {
  try {
    const t = getTransporter();
    await t.verify();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const html = wrapHtmlContent('System Test', `<p>Email delivery is active.</p>`, { label: 'Test', type: 'success' });
    await sendEmail({ to, subject: `Test Email`, html });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}