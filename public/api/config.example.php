<?php
/**
 * DIGEGAIN Hostinger Shared Hosting Configuration
 *
 * Fill in your credentials below:
 * - Google Gemini API Key (for AI Chatbot)
 * - Admin credentials (for /admin CMS)
 * - SMTP Mailer credentials (for PHPMailer inquiry alerts & client confirmations)
 */

return [
    // -------------------------------------------------------------
    // 1. Google Gemini API Key for AI Chatbot Assistant
    // Get your free key at: https://aistudio.google.com/app/apikey
    // -------------------------------------------------------------
    'GEMINI_API_KEY' => getenv('GEMINI_API_KEY') ?: '',

    // -------------------------------------------------------------
    // 2. Admin Dashboard Credentials (access at /admin)
    // -------------------------------------------------------------
    'ADMIN_USERNAME' => getenv('ADMIN_USERNAME') ?: 'admin',
    'ADMIN_PASSWORD' => getenv('ADMIN_PASSWORD') ?: 'Digegain@2026!',
    'SESSION_SECRET' => getenv('SESSION_SECRET') ?: 'digegain-super-secure-jwt-key-2026-production-token-hostinger',

    // -------------------------------------------------------------
    // 3. Lead Recipient Email Address
    // Where project inquiries and lead alerts are sent
    // -------------------------------------------------------------
    'NOTIFY_EMAIL' => getenv('NOTIFY_EMAIL') ?: 'anoopkp10@gmail.com',

    // -------------------------------------------------------------
    // 4. PHPMailer SMTP Settings (Hostinger Titan, Gmail, or Custom SMTP)
    // If SMTP_HOST is left empty, the system falls back to default mail()
    // Hostinger default: smtp.hostinger.com | Port 465 (ssl) or 587 (tls)
    // -------------------------------------------------------------
    'SMTP_HOST'    => getenv('SMTP_HOST') ?: 'smtp.hostinger.com',
    'SMTP_PORT'    => getenv('SMTP_PORT') ? (int)getenv('SMTP_PORT') : 465,
    'SMTP_USER'    => getenv('SMTP_USER') ?: '', // e.g. 'contact@digegain.com'
    'SMTP_PASS'    => getenv('SMTP_PASS') ?: '', // Your email password
    'SMTP_SECURE'  => getenv('SMTP_SECURE') ?: 'ssl', // 'ssl' (port 465) or 'tls' (port 587)
    'FROM_EMAIL'   => getenv('FROM_EMAIL') ?: '', // e.g. 'contact@digegain.com' (must match or alias SMTP_USER)
    'FROM_NAME'    => getenv('FROM_NAME') ?: 'DIGEGAIN Lead System',

    // Site URL
    'SITE_URL' => getenv('SITE_URL') ?: 'https://' . ($_SERVER['HTTP_HOST'] ?? 'digegain.com'),
];
