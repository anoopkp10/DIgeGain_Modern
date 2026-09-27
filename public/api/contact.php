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

// Recipient email - configure your receiving email here
$to = 'anoopkp10@gmail.com'; 
$subject = "New Inquiry from DIGEGAIN Website: " . strip_tags($name);

$body = "New Lead Received from DIGEGAIN Website:\n\n";
$body .= "Name: " . $name . "\n";
$body .= "Email: " . $email . "\n";
$body .= "Phone / WhatsApp: " . $phone . "\n";
$body .= "Service: " . $service . "\n";
$body .= "Date: " . date('Y-m-d H:i:s') . " UTC\n\n";
$body .= "Requirements / Project Details:\n" . $message . "\n";

$headers = [];
$headers[] = 'From: DIGEGAIN Notifications <no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'digegain.com') . '>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();

$mailSent = @mail($to, $subject, $body, implode("\r\n", $headers));

http_response_code(200);
echo json_encode([
    'ok' => true,
    'message' => 'Thank you! Your project inquiry has been received. Our team will contact you shortly.',
    'mailSent' => $mailSent
]);
