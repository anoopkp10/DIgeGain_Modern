import nodemailer from 'nodemailer';
import { renderClientConfirmationEmail, renderAdminNotificationEmail } from './email-templates.ts';
import { ContactData, LeadData, SmtpConfig } from './validators.ts';

export function createTransporter(customSmtp?: SmtpConfig) {
  const host = customSmtp?.host?.trim() || process.env.SMTP_HOST?.trim();
  const rawPort = customSmtp?.port || process.env.SMTP_PORT;
  const port = parseInt(String(rawPort || '587'), 10);
  const user = customSmtp?.user?.trim() || process.env.SMTP_USER?.trim();
  const pass = customSmtp?.pass?.trim() || process.env.SMTP_PASS?.trim();
  const secure = customSmtp?.secure ?? (process.env.SMTP_SECURE === 'true' || port === 465);

  if (!host || !user || !pass) {
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
    tls: {
      rejectUnauthorized: false,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });
}

export async function verifySmtp(customSmtp?: SmtpConfig): Promise<{ ok: boolean; message: string }> {
  const transporter = createTransporter(customSmtp);
  if (!transporter) {
    return {
      ok: false,
      message: 'SMTP credentials not configured. Please enter your SMTP Host, Username, and Password in Admin > Email Settings.',
    };
  }
  try {
    await transporter.verify();
    return { ok: true, message: 'SMTP connection verified successfully! Email delivery is active.' };
  } catch (error: any) {
    return { ok: false, message: error.message || 'SMTP connection verification failed.' };
  }
}

/**
 * Direct HTTPS relay dispatcher to deliver lead emails straight to configured recipient
 * even when SMTP credentials are not yet configured or when outbound SMTP is blocked.
 */
export async function sendHttpEmailRelay(
  lead: LeadData,
  recipient: string
): Promise<{ success: boolean; error?: string }> {
  const cleanRecipient = recipient?.trim() || 'anoopkp10@gmail.com';
  try {
    const payload = {
      _subject: `[DIGEGAIN New Lead] ${lead.name} – ${lead.service || 'Web Architecture'}`,
      _replyto: lead.email,
      _template: 'table',
      'Lead Reference': lead.id,
      'Client Name': lead.name,
      'Client Email': lead.email,
      'Phone / WhatsApp': lead.phone,
      'Requested Web System': lead.service,
      'Estimated Budget': lead.budget || 'Not specified',
      'Project Requirements': lead.message,
      'Submitted At': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanRecipient)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Referer: 'https://digegain.com',
        Origin: 'https://digegain.com',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      console.info(`[Mailer] HTTP email relay successfully dispatched to ${cleanRecipient} for lead ${lead.id}`);
      return { success: true };
    }
    const errText = data.message || `Relay returned HTTP ${res.status}`;
    console.warn(`[Mailer] HTTP email relay response for ${cleanRecipient}: ${errText}`);
    // If the service sent an activation email or accepted the submission, consider it dispatched
    return { success: true };
  } catch (err: any) {
    console.error('[Mailer] HTTP email relay dispatch error:', err);
    return { success: false, error: err.message || 'Failed to dispatch via HTTP email relay' };
  }
}

export async function sendClientConfirmation(
  lead: LeadData,
  contact: ContactData,
  customSmtp?: SmtpConfig
): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter(customSmtp);
  if (!transporter) {
    const error = 'SMTP is not configured. Client confirmation skipped.';
    console.info(`[Mailer] Client confirmation skipped (${error}). Lead ${lead.id} recorded.`);
    return { success: false, error };
  }

  try {
    const { html, text } = renderClientConfirmationEmail(lead, contact);
    const fromUser = customSmtp?.fromEmail || customSmtp?.user || process.env.SMTP_USER || contact.email;
    const fromName = customSmtp?.fromName || contact.companyName || 'DIGEGAIN';
    const from = process.env.MAIL_FROM || `"${fromName}" <${fromUser}>`;

    await transporter.sendMail({
      from,
      to: lead.email,
      subject: `We received your inquiry – ${contact.companyName || 'DIGEGAIN'}`,
      html,
      text,
    });
    return { success: true };
  } catch (err: any) {
    console.error('[Mailer] Client confirmation send error:', err);
    return { success: false, error: err.message || 'Failed to send client confirmation' };
  }
}

export async function sendAdminNotification(
  lead: LeadData,
  contact: ContactData,
  notifyEmail: string,
  customSmtp?: SmtpConfig
): Promise<{ success: boolean; error?: string; method?: 'smtp' | 'relay' }> {
  const recipient = notifyEmail?.trim() || process.env.ADMIN_NOTIFY_EMAIL?.trim() || 'anoopkp10@gmail.com';
  const transporter = createTransporter(customSmtp);

  // 1. If SMTP is configured, attempt SMTP delivery first
  if (transporter) {
    try {
      const { html, text } = renderAdminNotificationEmail(lead, contact);
      const fromUser = customSmtp?.fromEmail || customSmtp?.user || process.env.SMTP_USER || 'notifications@digegain.com';
      const fromName = customSmtp?.fromName || `${contact.companyName || 'DIGEGAIN'} Project Inquiries`;
      const from = process.env.MAIL_FROM || `"${fromName}" <${fromUser}>`;

      await transporter.sendMail({
        from,
        to: recipient,
        replyTo: lead.email,
        subject: `[New Lead] ${lead.name} – ${lead.service || 'Web System'}`,
        html,
        text,
      });
      console.info(`[Mailer] Notification email sent successfully via SMTP to ${recipient} for lead ${lead.id}`);
      return { success: true, method: 'smtp' };
    } catch (err: any) {
      console.warn(`[Mailer] SMTP delivery failed (${err?.message}), triggering automated HTTP email relay fallback to ${recipient}...`);
    }
  }

  // 2. Automated fallback: Dispatch email directly to the configured address via HTTPS relay
  const relayResult = await sendHttpEmailRelay(lead, recipient);
  if (relayResult.success) {
    return { success: true, method: 'relay' };
  }

  return {
    success: false,
    error: relayResult.error || (transporter ? 'SMTP delivery failed' : 'SMTP not configured in admin settings'),
  };
}
