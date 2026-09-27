<?php
/**
 * DIGEGAIN Hostinger Shared Hosting Configuration
 *
 * Fill in your Gemini API key and credentials below.
 * On Hostinger Shared Hosting, this file provides backend services
 * for the AI Chat Assistant and Admin CMS.
 */

return [
    // Google Gemini API Key for AI Chatbot Assistant
    // Get your free key at: https://aistudio.google.com/app/apikey
    'GEMINI_API_KEY' => getenv('GEMINI_API_KEY') ?: '',

    // Admin Dashboard Credentials (access at /admin)
    'ADMIN_USERNAME' => getenv('ADMIN_USERNAME') ?: 'admin',
    'ADMIN_PASSWORD' => getenv('ADMIN_PASSWORD') ?: 'Digegain@2026!',

    // Secret for signing admin session tokens (min 32 random characters)
    'SESSION_SECRET' => getenv('SESSION_SECRET') ?: 'digegain-super-secure-jwt-key-2026-production-token-hostinger',

    // Email address where project inquiries and lead notifications will be sent
    'NOTIFY_EMAIL' => getenv('NOTIFY_EMAIL') ?: 'anoopkp10@gmail.com',

    // Site URL
    'SITE_URL' => getenv('SITE_URL') ?: 'https://' . ($_SERVER['HTTP_HOST'] ?? 'digegain.com'),
];
