<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

// Honeypot check
if (!empty($data['website_trap'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Spam detected']);
    exit;
}

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$service = trim($data['service'] ?? 'General Inquiry');
$message = trim($data['message'] ?? '');

// Validation
if (empty($name) || strlen($name) < 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Name must be at least 2 characters']);
    exit;
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please provide a valid email address']);
    exit;
}

$phoneDigits = preg_replace('/[^0-9]/', '', $phone);
if (strlen($phoneDigits) < 7) {
    http_response_code(400);
    echo json_encode(['error' => 'Please provide a valid Phone / WhatsApp number (minimum 7 digits)']);
    exit;
}

if (empty($message) || strlen($message) < 5) {
    http_response_code(400);
    echo json_encode(['error' => 'Message must be at least 5 characters']);
    exit;
}

$configFile = __DIR__ . '/config.php';
$config = file_exists($configFile) ? require $configFile : [];
if (!is_array($config)) $config = [];
require_once __DIR__ . '/mailer.php';

$host = $_SERVER['HTTP_HOST'] ?? 'digegain.com';
$cleanPhone = preg_replace('/[^0-9]/', '', $phone);
$to = $config['NOTIFY_EMAIL'] ?? 'anoopkp10@gmail.com'; 
$subject = "New Inquiry from DIGEGAIN Website: " . strip_tags($name);

$leadRecord = [
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'service' => $service,
    'source' => 'contact-page',
    'message' => $message,
];

$plain = "New Lead Received from DIGEGAIN Website:\n\n"
       . "Name: $name\n"
       . "Email: $email\n"
       . "Phone / WhatsApp: $phone\n"
       . "Service: $service\n"
       . "Date: " . date('Y-m-d H:i:s') . " UTC\n\n"
       . "Requirements / Project Details:\n$message\n"
       . "WhatsApp: https://wa.me/$cleanPhone\n";

$html = buildAdminLeadEmailHtml($leadRecord, $host, $cleanPhone);
$mailResult = sendDigegainEmail($config, $to, $subject, $html, $plain, $email, $name);

http_response_code(200);
echo json_encode([
    'ok' => true,
    'message' => 'Thank you! Your project inquiry has been received. Our team will contact you shortly.',
    'mailSent' => !empty($mailResult['ok']),
    'transport' => $mailResult['transport'] ?? 'unknown'
]);
