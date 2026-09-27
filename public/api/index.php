<?php
/**
 * DIGEGAIN - PHP API Backend for Hostinger Shared Hosting
 *
 * Provides complete API endpoints for:
 * - /api/chat (Google Gemini AI Conversational Assistant)
 * - /api/appdata (Public website configuration & portfolio)
 * - /api/contact-form (Mandatory phone validation, persistence, & email notifications)
 * - /api/auth/* (Admin login, logout, session verification)
 * - /api/admin/* (Leads management, portfolio CMS, image uploads, AI settings)
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

// Load Configuration
$configFile = __DIR__ . '/config.php';
$config = file_exists($configFile) ? require $configFile : [];
if (!is_array($config)) $config = [];

$geminiApiKey = $config['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY') ?: '';
$adminUser    = $config['ADMIN_USERNAME'] ?? getenv('ADMIN_USERNAME') ?: 'admin';
$adminPass    = $config['ADMIN_PASSWORD'] ?? getenv('ADMIN_PASSWORD') ?: 'Digegain@2026!';
$sessionSecret= $config['SESSION_SECRET'] ?? getenv('SESSION_SECRET') ?: 'digegain-super-secure-jwt-key-2026-production-token-hostinger';
$notifyEmail  = $config['NOTIFY_EMAIL'] ?? getenv('NOTIFY_EMAIL') ?: 'anoopkp10@gmail.com';
$cookieName   = 'digegain_admin_session';

// Locate data directory (supports root, dist, and public structures)
$possibleDataDirs = [
    __DIR__ . '/../../data',
    __DIR__ . '/../data',
    __DIR__ . '/data',
    dirname(__DIR__) . '/data'
];
$dataDir = null;
foreach ($possibleDataDirs as $dir) {
    if (is_dir($dir) && is_writable($dir)) {
        $dataDir = realpath($dir);
        break;
    }
}
if (!$dataDir) {
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0755, true);
    }
}

$dataPath = $dataDir . '/appdata.json';
$dataExamplePath = $dataDir . '/appdata.example.json';

// Initialize data if not yet present
function getAppData($dataPath, $dataExamplePath) {
    if (file_exists($dataPath)) {
        $json = @file_get_contents($dataPath);
        $data = @json_decode($json, true);
        if (is_array($data) && isset($data['contact'])) return $data;
    }
    if (file_exists($dataExamplePath)) {
        $json = @file_get_contents($dataExamplePath);
        $data = @json_decode($json, true);
        if (is_array($data)) {
            @file_put_contents($dataPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            return $data;
        }
    }
    // Minimal fallback
    $fallback = [
        'contact' => ['companyName' => 'DIGEGAIN', 'email' => 'anoopkp10@gmail.com', 'whatsappNumber' => '919847012345'],
        'portfolio' => [],
        'leads' => [],
        'assistant' => ['enabled' => true, 'name' => 'DIGEGAIN Strategy Agent', 'greeting' => 'Hi! How can we help?', 'extraKnowledge' => []],
        'settings' => ['notifyEmail' => 'anoopkp10@gmail.com', 'siteUrl' => '']
    ];
    @file_put_contents($dataPath, json_encode($fallback, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    return $fallback;
}

function saveAppData($dataPath, $data) {
    return @file_put_contents($dataPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

// Token creation & verification (HMAC-SHA256)
function createToken($username, $secret) {
    $payload = json_encode(['sub' => $username, 'role' => 'admin', 'exp' => time() + (7 * 86400)]);
    $base = base64_encode($payload);
    $sig = hash_hmac('sha256', $base, $secret);
    return $base . '.' . $sig;
}

function verifyToken($token, $secret) {
    if (!$token || strpos($token, '.') === false) return false;
    list($base, $sig) = explode('.', $token, 2);
    $expected = hash_hmac('sha256', $base, $secret);
    if (!hash_equals($expected, $sig)) return false;
    $payload = @json_decode(base64_decode($base), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) return false;
    return $payload['sub'] ?? 'admin';
}

function checkAdminAuth($cookieName, $sessionSecret) {
    $token = $_COOKIE[$cookieName] ?? '';
    if (!$token) {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (preg_match('/Bearer\s+(\S+)/i', $auth, $matches)) {
            $token = $matches[1];
        }
    }
    return verifyToken($token, $sessionSecret);
}

// Resolve route path
$uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$route = $_GET['route'] ?? '';
if (empty($route)) {
    // Strip leading /api/ or /public_html/api/
    if (preg_match('#(?:^|/)api/(.*)$#i', $uriPath, $m)) {
        $route = $m[1];
    }
}
$route = trim($route, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Handle CORS Preflight
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(200);
    exit;
}

// Helper for JSON responses
function jsonResponse($data, $status = 200) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// -------------------------------------------------------------
// 1. PUBLIC APP DATA: GET /api/appdata
// -------------------------------------------------------------
if ($route === 'appdata' && $method === 'GET') {
    $appData = getAppData($dataPath, $dataExamplePath);
    $publicData = [
        'contact' => $appData['contact'] ?? [],
        'portfolio' => $appData['portfolio'] ?? [],
        'assistant' => [
            'enabled' => $appData['assistant']['enabled'] ?? true,
            'name' => $appData['assistant']['name'] ?? 'DIGEGAIN Strategy Agent',
            'greeting' => $appData['assistant']['greeting'] ?? 'Hi! How can we help?',
            'suggestedQuestions' => $appData['assistant']['suggestedQuestions'] ?? [],
            'extraKnowledge' => array_values(array_filter($appData['assistant']['extraKnowledge'] ?? [], function($k) {
                return !empty($k['public']);
            })),
            'leadCaptureEnabled' => $appData['assistant']['leadCaptureEnabled'] ?? true,
        ],
        'settings' => [
            'siteUrl' => $appData['settings']['siteUrl'] ?? ('https://' . ($_SERVER['HTTP_HOST'] ?? 'digegain.com')),
        ]
    ];
    jsonResponse($publicData);
}

// -------------------------------------------------------------
// 2. CONTACT FORM: POST /api/contact-form
// -------------------------------------------------------------
if (($route === 'contact-form' || $route === 'contact') && $method === 'POST') {
    $raw = file_get_contents('php://input');
    $body = @json_decode($raw, true) ?: [];

    // Honeypot spam check
    if (!empty($body['website_trap'])) {
        jsonResponse(['error' => 'Spam detected'], 400);
    }

    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $phone = trim($body['phone'] ?? '');
    $service = trim($body['service'] ?? 'General Inquiry');
    $message = trim($body['message'] ?? '');
    $source = ($body['source'] === 'ai-assistant') ? 'ai-assistant' : 'contact-form';

    if (strlen($name) < 2) {
        jsonResponse(['error' => 'Name must be at least 2 characters'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Please provide a valid email address'], 400);
    }

    $phoneDigits = preg_replace('/[^0-9]/', '', $phone);
    if ($source !== 'ai-assistant' && strlen($phoneDigits) < 7) {
        jsonResponse(['error' => 'Please provide a valid Phone / WhatsApp number (minimum 7 digits).'], 400);
    }

    $appData = getAppData($dataPath, $dataExamplePath);
    if (!isset($appData['leads']) || !is_array($appData['leads'])) {
        $appData['leads'] = [];
    }

    $leadId = 'lead-' . time() . '-' . substr(bin2hex(random_bytes(3)), 0, 4);
    $leadRecord = [
        'id' => $leadId,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'service' => $service,
        'message' => $message,
        'source' => $source,
        'status' => 'new',
        'createdAt' => date('c'),
        'emailStatus' => [
            'clientConfirmation' => 'sent',
            'adminNotification' => 'sent',
            'error' => ''
        ]
    ];
    array_unshift($appData['leads'], $leadRecord);
    saveAppData($dataPath, $appData);

    // Send Admin Notification Email via Hostinger PHP mail
    $adminTo = $notifyEmail ?: ($appData['contact']['email'] ?? 'anoopkp10@gmail.com');
    $adminSub = "New Inquiry from DIGEGAIN: " . strip_tags($name) . " (" . strip_tags($service) . ")";
    $adminMsg = "New Lead Captured from DIGEGAIN Website:\n\n"
              . "Name: $name\n"
              . "Email: $email\n"
              . "Phone / WhatsApp: $phone\n"
              . "Service: $service\n"
              . "Source: $source\n"
              . "Date: " . date('Y-m-d H:i:s T') . "\n\n"
              . "Client Requirements / Message:\n$message\n\n"
              . "WhatsApp direct link: https://wa.me/" . preg_replace('/[^0-9]/', '', $phone) . "\n";

    $host = $_SERVER['HTTP_HOST'] ?? 'digegain.com';
    $headers = [
        "From: DIGEGAIN Lead System <no-reply@$host>",
        "Reply-To: $email",
        "X-Mailer: PHP/" . phpversion()
    ];
    @mail($adminTo, $adminSub, $adminMsg, implode("\r\n", $headers));

    // Send confirmation to client
    $clientSub = "We have received your project inquiry - DIGEGAIN";
    $clientMsg = "Hello $name,\n\n"
               . "Thank you for contacting DIGEGAIN. We have received your inquiry for $service.\n"
               . "Our technical team is reviewing your requirements and will reach out within 24 hours.\n\n"
               . "Need immediate assistance?\n"
               . "WhatsApp: https://wa.me/" . ($appData['contact']['whatsappNumber'] ?? '919847012345') . "\n\n"
               . "Best regards,\nDIGEGAIN Team\nhttps://$host\n";
    @mail($email, $clientSub, $clientMsg, implode("\r\n", ["From: DIGEGAIN <no-reply@$host>", "X-Mailer: PHP/" . phpversion()]));

    jsonResponse([
        'ok' => true,
        'success' => true,
        'message' => 'Thank you! Your project inquiry has been received. Our team will contact you within 24 hours.',
        'leadId' => $leadId
    ]);
}

// -------------------------------------------------------------
// 3. AI CHAT ASSISTANT: POST /api/chat (Streams SSE chunks)
// -------------------------------------------------------------
if ($route === 'chat' && $method === 'POST') {
    $raw = file_get_contents('php://input');
    $body = @json_decode($raw, true) ?: [];
    $messages = $body['messages'] ?? [];

    header('Content-Type: text/event-stream; charset=utf-8');
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');
    header('X-Accel-Buffering: no');
    header('Access-Control-Allow-Origin: *');

    $appData = getAppData($dataPath, $dataExamplePath);
    $companyName = $appData['contact']['companyName'] ?? 'DIGEGAIN';
    $contactEmail = $appData['contact']['email'] ?? 'anoopkp10@gmail.com';
    $whatsapp = $appData['contact']['whatsappNumber'] ?? '919847012345';

    // System prompt with company grounding
    $systemInstruction = "You are the senior digital systems consultant for $companyName, a high-performance web development and automation agency. "
                       . "You help visitors choose the right solutions (Booking Systems, Order Management, Portfolios, Dashboards, AI Chatbots, SEO/GEO Growth). "
                       . "Keep your answers technical, concise, transparent, and direct. Emphasize WhatsApp (+{$whatsapp}) or the contact page for inquiries.";

    $lastUserMsg = '';
    $formattedContents = [];
    foreach ($messages as $m) {
        $role = ($m['role'] === 'assistant' || $m['role'] === 'model') ? 'model' : 'user';
        $content = trim($m['content'] ?? '');
        if ($content !== '') {
            $formattedContents[] = [
                'role' => $role,
                'parts' => [['text' => $content]]
            ];
            if ($role === 'user') $lastUserMsg = $content;
        }
    }

    if (!empty($geminiApiKey)) {
        // Direct call to Google Gemini 2.5 Flash API via cURL
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . urlencode($geminiApiKey);
        $payload = [
            'systemInstruction' => [
                'parts' => [['text' => $systemInstruction]]
            ],
            'contents' => $formattedContents,
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 800
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);

        $result = curl_exec($ch);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if (!$curlErr && !empty($result)) {
            $json = @json_decode($result, true);
            $replyText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
            if (!empty($replyText)) {
                // Stream chunks to ChatWidget in {"text": "..."} SSE format
                $words = preg_split('/(\s+)/u', $replyText, -1, PREG_SPLIT_DELIM_CAPTURE);
                foreach ($words as $word) {
                    if ($word === '') continue;
                    echo "data: " . json_encode(['text' => $word]) . "\n\n";
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                    usleep(15000); // 15ms typing stream
                }
                echo "data: [DONE]\n\n";
                flush();
                exit;
            }
        }
    }

    // Fallback if Gemini API key is missing or call failed
    $fallbackReply = "Welcome to **$companyName**! We specialize in custom web architectures, real-time appointment booking engines, B2B/B2C order systems, and AI workflows. \n\n"
                   . "For preliminary scopes and consultations, feel free to submit our contact form or chat directly with our engineers on **WhatsApp (+{$whatsapp})**.";

    $words = explode(' ', $fallbackReply);
    foreach ($words as $w) {
        echo "data: " . json_encode(['text' => $w . ' ']) . "\n\n";
        if (ob_get_level() > 0) ob_flush();
        flush();
        usleep(30000);
    }
    echo "data: [DONE]\n\n";
    flush();
    exit;
}

// -------------------------------------------------------------
// 4. ADMIN AUTHENTICATION: /api/auth/*
// -------------------------------------------------------------
if ($route === 'auth/login' && $method === 'POST') {
    $raw = file_get_contents('php://input');
    $body = @json_decode($raw, true) ?: [];
    $u = trim($body['username'] ?? '');
    $p = trim($body['password'] ?? '');

    if ($u === $adminUser && $p === $adminPass) {
        $token = createToken($u, $sessionSecret);
        // Set cookie
        setcookie($cookieName, $token, [
            'expires' => time() + (7 * 86400),
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        ]);
        jsonResponse(['ok' => true, 'user' => $u, 'token' => $token]);
    } else {
        jsonResponse(['error' => 'Invalid admin username or password'], 401);
    }
}

if ($route === 'auth/logout' && $method === 'POST') {
    setcookie($cookieName, '', time() - 3600, '/');
    jsonResponse(['ok' => true]);
}

if ($route === 'auth/me' && $method === 'GET') {
    $user = checkAdminAuth($cookieName, $sessionSecret);
    jsonResponse([
        'authenticated' => ($user !== false),
        'user' => $user ?: null
    ]);
}

// -------------------------------------------------------------
// 5. PROTECTED ADMIN CMS ROUTES: /api/admin/*
// -------------------------------------------------------------
$adminRoutesPrefixes = ['admin/', 'admin'];
$isAdminRoute = (strpos($route, 'admin') === 0);

if ($isAdminRoute) {
    $user = checkAdminAuth($cookieName, $sessionSecret);
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized admin session. Please log in.'], 401);
    }

    $subRoute = preg_replace('#^admin/?#', '', $route);
    $appData = getAppData($dataPath, $dataExamplePath);

    // GET /api/admin/leads
    if ($subRoute === 'leads' && $method === 'GET') {
        jsonResponse($appData['leads'] ?? []);
    }

    // PUT/PATCH /api/admin/leads/{id}
    if (preg_match('#^leads/([^/]+)$#', $subRoute, $matches) && in_array($method, ['PUT', 'PATCH'])) {
        $leadId = $matches[1];
        $raw = file_get_contents('php://input');
        $body = @json_decode($raw, true) ?: [];

        $found = false;
        foreach ($appData['leads'] as &$l) {
            if ($l['id'] === $leadId) {
                if (isset($body['status'])) $l['status'] = $body['status'];
                if (isset($body['notes'])) $l['notes'] = $body['notes'];
                $found = true;
                break;
            }
        }
        if ($found) {
            saveAppData($dataPath, $appData);
            jsonResponse(['ok' => true, 'message' => 'Lead updated']);
        }
        jsonResponse(['error' => 'Lead not found'], 404);
    }

    // DELETE /api/admin/leads/{id}
    if (preg_match('#^leads/([^/]+)$#', $subRoute, $matches) && $method === 'DELETE') {
        $leadId = $matches[1];
        $appData['leads'] = array_values(array_filter($appData['leads'], function($l) use ($leadId) {
            return $l['id'] !== $leadId;
        }));
        saveAppData($dataPath, $appData);
        jsonResponse(['ok' => true, 'message' => 'Lead deleted']);
    }

    // PUT /api/admin/contact
    if ($subRoute === 'contact' && $method === 'PUT') {
        $raw = file_get_contents('php://input');
        $body = @json_decode($raw, true) ?: [];
        $appData['contact'] = array_merge($appData['contact'] ?? [], $body);
        saveAppData($dataPath, $appData);
        jsonResponse(['success' => true, 'contact' => $appData['contact']]);
    }

    // POST /api/admin/portfolio (Create)
    if ($subRoute === 'portfolio' && $method === 'POST') {
        $raw = file_get_contents('php://input');
        $item = @json_decode($raw, true) ?: [];
        if (empty($item['id'])) {
            $item['id'] = 'port-' . time() . '-' . substr(bin2hex(random_bytes(2)), 0, 4);
        }
        $item['createdAt'] = date('c');
        $item['updatedAt'] = date('c');
        $appData['portfolio'][] = $item;
        saveAppData($dataPath, $appData);
        jsonResponse(['success' => true, 'item' => $item]);
    }

    // PUT /api/admin/portfolio/{id} (Update)
    if (preg_match('#^portfolio/([^/]+)$#', $subRoute, $matches) && $method === 'PUT') {
        $portId = $matches[1];
        $raw = file_get_contents('php://input');
        $update = @json_decode($raw, true) ?: [];

        $found = false;
        foreach ($appData['portfolio'] as &$p) {
            if ($p['id'] === $portId) {
                $p = array_merge($p, $update, ['updatedAt' => date('c')]);
                $found = true;
                break;
            }
        }
        if ($found) {
            saveAppData($dataPath, $appData);
            jsonResponse(['success' => true, 'message' => 'Portfolio item updated']);
        }
        jsonResponse(['error' => 'Portfolio item not found'], 404);
    }

    // DELETE /api/admin/portfolio/{id} (Delete)
    if (preg_match('#^portfolio/([^/]+)$#', $subRoute, $matches) && $method === 'DELETE') {
        $portId = $matches[1];
        $appData['portfolio'] = array_values(array_filter($appData['portfolio'], function($p) use ($portId) {
            return $p['id'] !== $portId;
        }));
        saveAppData($dataPath, $appData);
        jsonResponse(['success' => true, 'message' => 'Portfolio item removed']);
    }

    // POST /api/admin/upload (Image Uploads)
    if ($subRoute === 'upload' && $method === 'POST') {
        if (!isset($_FILES['file'])) {
            jsonResponse(['error' => 'No file uploaded'], 400);
        }
        $file = $_FILES['file'];
        $uploadBaseDir = dirname(__DIR__) . '/uploads/portfolio/images';
        if (!is_dir($uploadBaseDir)) {
            @mkdir($uploadBaseDir, 0755, true);
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])) {
            jsonResponse(['error' => 'Invalid image format. Supported: WEBP, PNG, JPG, SVG'], 400);
        }

        $safeName = 'img-' . time() . '-' . substr(bin2hex(random_bytes(3)), 0, 6) . '.' . $ext;
        $dest = $uploadBaseDir . '/' . $safeName;

        if (move_uploaded_file($file['tmp_name'], $dest)) {
            jsonResponse([
                'success' => true,
                'path' => '/uploads/portfolio/images/' . $safeName,
                'name' => $safeName
            ]);
        } else {
            jsonResponse(['error' => 'Failed to save uploaded file on server'], 500);
        }
    }

    // GET /api/admin/assistant
    if ($subRoute === 'assistant' && $method === 'GET') {
        jsonResponse($appData['assistant'] ?? []);
    }

    // PUT /api/admin/assistant
    if ($subRoute === 'assistant' && $method === 'PUT') {
        $raw = file_get_contents('php://input');
        $body = @json_decode($raw, true) ?: [];
        $appData['assistant'] = array_merge($appData['assistant'] ?? [], $body);
        saveAppData($dataPath, $appData);
        jsonResponse(['success' => true, 'assistant' => $appData['assistant']]);
    }

    // GET /api/admin/settings
    if ($subRoute === 'settings' && $method === 'GET') {
        jsonResponse($appData['settings'] ?? []);
    }

    // PUT /api/admin/settings
    if ($subRoute === 'settings' && $method === 'PUT') {
        $raw = file_get_contents('php://input');
        $body = @json_decode($raw, true) ?: [];
        $appData['settings'] = array_merge($appData['settings'] ?? [], $body);
        saveAppData($dataPath, $appData);
        jsonResponse(['success' => true, 'settings' => $appData['settings']]);
    }

    // POST /api/admin/test-email
    if ($subRoute === 'test-email' && $method === 'POST') {
        $testTo = $notifyEmail ?: 'anoopkp10@gmail.com';
        $host = $_SERVER['HTTP_HOST'] ?? 'digegain.com';
        $headers = "From: DIGEGAIN Test <no-reply@$host>\r\nReply-To: $testTo\r\nX-Mailer: PHP/" . phpversion();
        $sent = @mail($testTo, "DIGEGAIN Hostinger Test Email", "Hostinger PHP mail is working successfully!", $headers);
        jsonResponse(['success' => $sent, 'sentTo' => $testTo]);
    }
}

// Fallback for unknown /api/* endpoints
jsonResponse(['error' => 'Endpoint not found: ' . $route], 404);
