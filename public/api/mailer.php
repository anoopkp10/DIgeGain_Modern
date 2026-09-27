<?php
/**
 * PHPMailer Integration Module for DIGEGAIN
 *
 * Provides authenticated SMTP email delivery using official PHPMailer with:
 * - HTML & Plain-text multipart emails
 * - Clean responsive modern styling
 * - Direct WhatsApp and Email action buttons
 * - Fallback resilience to default mail() if SMTP credentials are omitted
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';

/**
 * Send email using PHPMailer SMTP or fallback
 */
function sendDigegainEmail($config, $to, $subject, $htmlBody, $plainBody = '', $replyTo = '', $replyToName = '') {
    $smtpUser   = trim($config['SMTP_USER'] ?? '');
    $smtpPass   = trim($config['SMTP_PASS'] ?? '');
    $smtpHost   = trim($config['SMTP_HOST'] ?? '');
    $smtpPort   = (int)($config['SMTP_PORT'] ?? 465);
    $smtpSecure = strtolower(trim($config['SMTP_SECURE'] ?? 'ssl'));
    
    $fromEmail  = trim($config['FROM_EMAIL'] ?? '');
    if (empty($fromEmail)) {
        $fromEmail = !empty($smtpUser) ? $smtpUser : ('no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'digegain.com'));
    }
    $fromName   = trim($config['FROM_NAME'] ?? '') ?: 'DIGEGAIN Lead System';

    // If SMTP credentials are provided, use PHPMailer with authenticated SMTP
    if (!empty($smtpUser) && !empty($smtpPass) && !empty($smtpHost)) {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = $smtpHost;
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtpUser;
            $mail->Password   = $smtpPass;
            
            if ($smtpSecure === 'tls' || $smtpPort === 587) {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            }
            
            $mail->Port       = $smtpPort;
            $mail->CharSet    = 'UTF-8';
            $mail->Timeout    = 15;

            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($to);

            if (!empty($replyTo)) {
                $mail->addReplyTo($replyTo, $replyToName ?: $replyTo);
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = !empty($plainBody) 
                ? $plainBody 
                : strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>'], "\n", $htmlBody));

            $mail->send();
            return ['ok' => true, 'transport' => 'phpmailer-smtp'];
        } catch (Exception $e) {
            error_log("PHPMailer SMTP Error: " . $mail->ErrorInfo);
            // Fallback to PHP mail if SMTP fails
            $headers = [
                "From: $fromName <$fromEmail>",
                "MIME-Version: 1.0",
                "Content-Type: text/html; charset=UTF-8",
                "X-Mailer: PHP/" . phpversion()
            ];
            if (!empty($replyTo)) {
                $headers[] = "Reply-To: " . ($replyToName ? "$replyToName <$replyTo>" : $replyTo);
            }
            $sent = @mail($to, $subject, $htmlBody, implode("\r\n", $headers));
            return ['ok' => $sent, 'transport' => 'fallback-mail', 'error' => $mail->ErrorInfo];
        }
    }

    // Default mail() fallback when SMTP is not configured yet
    $headers = [
        "From: $fromName <$fromEmail>",
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
        "X-Mailer: PHP/" . phpversion()
    ];
    if (!empty($replyTo)) {
        $headers[] = "Reply-To: " . ($replyToName ? "$replyToName <$replyTo>" : $replyTo);
    }
    $sent = @mail($to, $subject, $htmlBody, implode("\r\n", $headers));
    return ['ok' => $sent, 'transport' => 'php-mail'];
}

/**
 * Generate formatted HTML for Admin Lead Notification
 */
function buildAdminLeadEmailHtml($lead, $host, $cleanPhone) {
    $name = htmlspecialchars($lead['name'] ?? 'Prospective Client');
    $email = htmlspecialchars($lead['email'] ?? '');
    $phone = htmlspecialchars($lead['phone'] ?? '');
    $service = htmlspecialchars($lead['service'] ?? 'General Inquiry');
    $source = htmlspecialchars($lead['source'] ?? 'website');
    $message = nl2br(htmlspecialchars($lead['message'] ?? 'No message specified'));
    $date = date('F j, Y, g:i a T');
    $waLink = !empty($cleanPhone) ? "https://wa.me/" . $cleanPhone : '';

    return <<<HTML
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Lead Captured - DIGEGAIN</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">DIGEGAIN</h1>
      <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 14px; font-weight: 500;">New Project Inquiry & Lead Alert</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <div style="background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; width: 130px; font-weight: 600;">Prospect Name:</td>
            <td style="padding: 8px 0; color: #f8fafc; font-weight: 700; font-size: 15px;">$name</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:$email" style="color: #38bdf8; text-decoration: none; font-weight: 600;">$email</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Phone / WhatsApp:</td>
            <td style="padding: 8px 0; color: #10b981; font-weight: 700; font-size: 15px;">$phone</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Service Interested:</td>
            <td style="padding: 8px 0; color: #cbd5e1; font-weight: 600;"><span style="background-color: #334155; padding: 3px 8px; border-radius: 4px;">$service</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Inquiry Source:</td>
            <td style="padding: 8px 0; color: #94a3b8;">$source</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Received Date:</td>
            <td style="padding: 8px 0; color: #94a3b8;">$date</td>
          </tr>
        </table>
      </div>

      <!-- Message Card -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; color: #e2e8f0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Client Requirements / Scope:</h3>
        <div style="background-color: #0f172a; border-left: 4px solid #38bdf8; padding: 16px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          $message
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="text-align: center; margin-top: 24px;">
        HTML;
    if (!empty($waLink)) {
        $html .= <<<HTML
        <a href="$waLink" target="_blank" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: 700; font-size: 14px; border-radius: 6px; margin: 4px 6px;">Chat on WhatsApp</a>
        HTML;
    }
    $html .= <<<HTML
        <a href="mailto:$email?subject=Re: Your DIGEGAIN Inquiry ($service)" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: 700; font-size: 14px; border-radius: 6px; margin: 4px 6px;">Reply via Email</a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #0f172a; padding: 16px 24px; text-align: center; border-top: 1px solid #334155; font-size: 12px; color: #64748b;">
      Sent automatically by DIGEGAIN Lead System &bull; <a href="https://$host/admin" style="color: #38bdf8; text-decoration: none;">View in Admin CMS</a>
    </div>

  </div>
</body>
</html>
HTML;
    return $html;
}

/**
 * Generate formatted HTML for Client Acknowledgment
 */
function buildClientConfirmationEmailHtml($name, $service, $host, $whatsapp) {
    $safeName = htmlspecialchars($name);
    $safeService = htmlspecialchars($service);
    $waLink = !empty($whatsapp) ? "https://wa.me/" . preg_replace('/[^0-9]/', '', $whatsapp) : '';

    return <<<HTML
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>We Have Received Your Inquiry - DIGEGAIN</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">DIGEGAIN</h1>
      <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 14px; font-weight: 500;">High-Performance Digital Systems</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px; line-height: 1.6; color: #cbd5e1; font-size: 15px;">
      <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Hello $safeName,</h2>
      <p>Thank you for reaching out to DIGEGAIN. We have received your inquiry regarding <strong>$safeService</strong>.</p>
      
      <p>Our senior digital engineering team is reviewing your project details. We will prepare an initial scope and get back to you within <strong>24 business hours</strong>.</p>
      
      <div style="background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 18px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #38bdf8; font-size: 14px; text-transform: uppercase;">Need an immediate technical consultation?</h4>
        <p style="margin: 0; font-size: 14px; color: #94a3b8;">
          You can connect directly with our engineering lead via WhatsApp for quick questions or urgent timelines.
        </p>
        <div style="margin-top: 14px;">
          <a href="$waLink" target="_blank" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: 700; font-size: 13px; border-radius: 6px;">Chat on WhatsApp</a>
        </div>
      </div>

      <p style="margin-bottom: 0;">Best regards,<br><strong style="color: #f8fafc;">The DIGEGAIN Engineering Team</strong><br><a href="https://$host" style="color: #38bdf8; text-decoration: none;">https://$host</a></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0f172a; padding: 16px 24px; text-align: center; border-top: 1px solid #334155; font-size: 12px; color: #64748b;">
      &copy; 2026 DIGEGAIN. All rights reserved.
    </div>

  </div>
</body>
</html>
HTML;
}
