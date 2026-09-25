import nodemailer from 'nodemailer';
import { renderClientConfirmationEmail, renderAdminNotificationEmail } from './email-templates.ts';
import { ContactData, LeadData } from './validators.ts';

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });
}

export async function verifySmtp(): Promise<{ ok: boolean; message: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { ok: false, message: 'SMTP credentials not configured in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS).' };
  }
  try {
    await transporter.verify();
    return { ok: true, message: 'SMTP connection verified successfully.' };
  } catch (error: any) {
    return { ok: false, message: error.message || 'SMTP verification failed.' };
  }
}

export async function sendClientConfirmation(lead: LeadData, contact: ContactData): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[Mailer] SMTP not configured. Simulating client confirmation send to:', lead.email);
    return { success: true };
  }

  try {
    const { html, text } = renderClientConfirmationEmail(lead, contact);
    const from = process.env.MAIL_FROM || `"DIGEGAIN" <${process.env.SMTP_USER}>`;

    await transporter.sendMail({
      from,
      to: lead.email,
      subject: 'We received your enquiry, DIGEGAIN',
      html,
      text,
    });
    return { success: true };
  } catch (err: any) {
    console.error('[Mailer] Client confirmation failed:', err);
    return { success: false, error: err.message || 'Failed to send client confirmation' };
  }
}

export async function sendAdminNotification(lead: LeadData, contact: ContactData, notifyEmail: string): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  const recipient = notifyEmail || process.env.ADMIN_NOTIFY_EMAIL || 'anoopkp10@gmail.com';

  if (!transporter) {
    console.log('[Mailer] SMTP not configured. Simulating admin notification send to:', recipient);
    return { success: true };
  }

  try {
    const { html, text } = renderAdminNotificationEmail(lead, contact);
    const from = process.env.MAIL_FROM || `"DIGEGAIN Notifications" <${process.env.SMTP_USER}>`;

    await transporter.sendMail({
      from,
      to: recipient,
      replyTo: lead.email,
      subject: `New lead: ${lead.name} – ${lead.service || 'Web System'}`,
      html,
      text,
    });
    return { success: true };
  } catch (err: any) {
    console.error('[Mailer] Admin notification failed:', err);
    return { success: false, error: err.message || 'Failed to send admin notification' };
  }
}
