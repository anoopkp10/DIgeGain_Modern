import { ContactData, LeadData } from './validators.ts';

function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderClientConfirmationEmail(lead: LeadData, contact: ContactData) {
  const safeName = sanitizeHtml(lead.name);
  const safeService = sanitizeHtml(lead.service || 'Web Development');
  const safeMessage = sanitizeHtml(lead.message);
  const waUrl = `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(contact.whatsappMessage || 'Hi DIGEGAIN')}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>We received your enquiry - DIGEGAIN</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060d1a; color: #eaf3ff; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #0b1b2e; border: 1px solid #1e3a5f; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0d233a 0%, #060d1a 100%); padding: 32px 28px; text-align: center; border-bottom: 2px solid #0284C7; }
    .logo-text { font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #0EA5E9; margin: 0; }
    .tagline { color: #94a3b8; font-size: 13px; margin-top: 6px; }
    .body { padding: 32px 28px; }
    h2 { color: #ffffff; font-size: 20px; margin-top: 0; }
    p { line-height: 1.6; color: #cbd5e1; font-size: 15px; }
    .summary-card { background: #071220; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .summary-row { margin-bottom: 10px; font-size: 14px; }
    .summary-label { color: #64748b; font-weight: 600; }
    .summary-value { color: #f1f5f9; }
    .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 12px; }
    .btn-wa { background: #25D366; }
    .footer { padding: 24px; text-align: center; background: #050b14; font-size: 12px; color: #64748b; border-top: 1px solid #172554; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">DIGEGAIN</div>
      <div class="tagline">${sanitizeHtml(contact.tagline)}</div>
    </div>
    <div class="body">
      <h2>Hello ${safeName},</h2>
      <p>Thank you for reaching out to <strong>DIGEGAIN</strong>. We have received your project inquiry and our technical strategy team is reviewing your requirements.</p>
      
      <div class="summary-card">
        <div class="summary-row"><span class="summary-label">Service:</span> <span class="summary-value">${safeService}</span></div>
        ${lead.budget ? `<div class="summary-row"><span class="summary-label">Budget range:</span> <span class="summary-value">${sanitizeHtml(lead.budget)}</span></div>` : ''}
        <div class="summary-row"><span class="summary-label">Your message:</span> <span class="summary-value">${safeMessage}</span></div>
      </div>

      <p><strong>What to expect next:</strong> Our lead engineer will get back to you within 24 hours with a preliminary scope, suggested architecture, and scheduling options.</p>

      <div style="margin-top: 28px;">
        <a href="${waUrl}" class="btn btn-wa">Chat on WhatsApp</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} DIGEGAIN. ${sanitizeHtml(contact.address.city || 'Kochi')}, ${sanitizeHtml(contact.address.country || 'India')}.<br/>
      AI-Powered Digital Growth & Web Systems.
    </div>
  </div>
</body>
</html>
`;

  const text = `
Hello ${lead.name},

Thank you for contacting DIGEGAIN. We have received your inquiry regarding:
Service: ${lead.service}${lead.budget ? `\nBudget: ${lead.budget}` : ''}
Message: ${lead.message}

Our team will review your requirements and respond within 24 hours.
Need immediate assistance?
WhatsApp: ${waUrl}

Best regards,
DIGEGAIN Team
https://digergain.com
`;

  return { html, text };
}

export function renderAdminNotificationEmail(lead: LeadData, contact: ContactData) {
  const safeName = sanitizeHtml(lead.name);
  const safeEmail = sanitizeHtml(lead.email);
  const safePhone = sanitizeHtml(lead.phone || 'None provided');
  const safeService = sanitizeHtml(lead.service || 'General Inquiry');
  const safeBudget = sanitizeHtml(lead.budget || 'Not specified');
  const safeMessage = sanitizeHtml(lead.message);
  const cleanPhoneDigits = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
  const waLeadUrl = cleanPhoneDigits ? `https://wa.me/${cleanPhoneDigits}` : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Lead: ${safeName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f8; color: #1e293b; padding: 24px; }
    .box { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px; }
    .badge { display: inline-block; padding: 4px 10px; background: #0284c7; color: #fff; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    h2 { margin: 12px 0 20px; color: #0f172a; }
    .field { margin-bottom: 12px; font-size: 14px; }
    .label { font-weight: 600; color: #64748b; width: 110px; display: inline-block; }
    .val { color: #0f172a; }
    .msg { background: #f8fafc; border-left: 3px solid #0284c7; padding: 12px; margin: 16px 0; font-size: 14px; line-height: 1.5; }
    .actions { margin-top: 24px; }
    .btn { display: inline-block; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; margin-right: 10px; }
    .btn-mail { background: #0284c7; color: #ffffff; }
    .btn-wa { background: #16a34a; color: #ffffff; }
  </style>
</head>
<body>
  <div class="box">
    <span class="badge">${lead.source}</span>
    <h2>New Lead Received: ${safeName}</h2>
    
    <div class="field"><span class="label">Name:</span> <span class="val">${safeName}</span></div>
    <div class="field"><span class="label">Email:</span> <span class="val"><a href="mailto:${safeEmail}">${safeEmail}</a></span></div>
    <div class="field"><span class="label">Phone:</span> <span class="val">${safePhone}</span></div>
    <div class="field"><span class="label">Service:</span> <span class="val"><strong>${safeService}</strong></span></div>
    ${lead.budget ? `<div class="field"><span class="label">Budget:</span> <span class="val">${safeBudget}</span></div>` : ''}
    <div class="field"><span class="label">Submitted:</span> <span class="val">${new Date(lead.createdAt).toLocaleString()}</span></div>

    <div class="msg">
      <strong>Client Note:</strong><br/>
      ${safeMessage}
    </div>

    <div class="actions">
      <a href="mailto:${safeEmail}?subject=Re:%20DIGEGAIN%20Project%20Enquiry" class="btn btn-mail">Reply via Email</a>
      ${waLeadUrl ? `<a href="${waLeadUrl}" class="btn btn-wa">Open in WhatsApp</a>` : ''}
    </div>
  </div>
</body>
</html>
`;

  const text = `
New Lead from DIGEGAIN Website:
Source: ${lead.source}
Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone || 'None'}
Service: ${lead.service}${lead.budget ? `\nBudget: ${lead.budget}` : ''}
Date: ${new Date(lead.createdAt).toISOString()}

Message:
${lead.message}
`;

  return { html, text };
}
