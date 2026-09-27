<?php
/**
 * DIGEGAIN Hostinger Shared Hosting Configuration
 */

return [
    'GEMINI_API_KEY' => getenv('GEMINI_API_KEY') ?: '',
    'ADMIN_USERNAME' => getenv('ADMIN_USERNAME') ?: 'admin',
    'ADMIN_PASSWORD' => getenv('ADMIN_PASSWORD') ?: 'Digegain@2026!',
    'SESSION_SECRET' => getenv('SESSION_SECRET') ?: 'digegain-super-secure-jwt-key-2026-production-token-hostinger',
    'NOTIFY_EMAIL'   => getenv('NOTIFY_EMAIL') ?: 'anoopkp10@gmail.com',

    // PHPMailer SMTP Settings (Hostinger Titan, Google Workspace, etc.)
    'SMTP_HOST'      => getenv('SMTP_HOST') ?: 'smtp.hostinger.com',
    'SMTP_PORT'      => getenv('SMTP_PORT') ? (int)getenv('SMTP_PORT') : 465,
    'SMTP_USER'      => getenv('SMTP_USER') ?: '',
    'SMTP_PASS'      => getenv('SMTP_PASS') ?: '',
    'SMTP_SECURE'    => getenv('SMTP_SECURE') ?: 'ssl',
    'FROM_EMAIL'     => getenv('FROM_EMAIL') ?: '',
    'FROM_NAME'      => getenv('FROM_NAME') ?: 'DIGEGAIN Lead System',
    'SITE_URL'       => getenv('SITE_URL') ?: 'https://' . ($_SERVER['HTTP_HOST'] ?? 'digegain.com'),
];
