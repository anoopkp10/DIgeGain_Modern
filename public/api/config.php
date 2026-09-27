<?php
/**
 * DIGEGAIN Hostinger Shared Hosting Configuration
 *
 * Fill in your Gemini API key and credentials below.
 */

return [
    'GEMINI_API_KEY' => getenv('GEMINI_API_KEY') ?: '',
    'ADMIN_USERNAME' => getenv('ADMIN_USERNAME') ?: 'admin',
    'ADMIN_PASSWORD' => getenv('ADMIN_PASSWORD') ?: 'Digegain@2026!',
    'SESSION_SECRET' => getenv('SESSION_SECRET') ?: 'digegain-super-secure-jwt-key-2026-production-token-hostinger',
    'NOTIFY_EMAIL' => getenv('NOTIFY_EMAIL') ?: 'anoopkp10@gmail.com',
    'SITE_URL' => getenv('SITE_URL') ?: 'https://' . ($_SERVER['HTTP_HOST'] ?? 'digegain.com'),
];
