<?php
// Demo OTP Authentication - No database required
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple file-based storage for demo
$otp_file = 'demo_otp.json';
$sessions_file = 'demo_sessions.json';

// Helper functions
function load_data($file) {
    if (file_exists($file)) {
        return json_decode(file_get_contents($file), true) ?: [];
    }
    return [];
}

function save_data($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

// Handle requests
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'request_otp':
        $username = $_POST['username'] ?? '';

        if (empty($username)) {
            echo json_encode(['success' => false, 'message' => 'Username is required']);
            exit;
        }

        // Generate OTP
        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires_at = time() + (10 * 60); // 10 minutes

        // Save OTP
        $otp_data = load_data($otp_file);
        $otp_data[$username] = [
            'otp' => $otp,
            'expires_at' => $expires_at,
            'created_at' => time()
        ];
        save_data($otp_file, $otp_data);

        echo json_encode([
            'success' => true,
            'message' => 'OTP generated (demo mode)',
            'otp' => $otp  // Show OTP for demo purposes
        ]);
        break;

    case 'verify_otp':
        $username = $_POST['username'] ?? '';
        $otp = $_POST['otp'] ?? '';

        if (empty($username) || empty($otp)) {
            echo json_encode(['success' => false, 'message' => 'Username and OTP are required']);
            exit;
        }

        // Load OTP data
        $otp_data = load_data($otp_file);

        if (!isset($otp_data[$username])) {
            echo json_encode(['success' => false, 'message' => 'No OTP found for user']);
            exit;
        }

        $user_otp = $otp_data[$username];

        // Check if expired
        if (time() > $user_otp['expires_at']) {
            echo json_encode(['success' => false, 'message' => 'OTP has expired']);
            exit;
        }

        // Check if OTP matches
        if ($user_otp['otp'] !== $otp) {
            echo json_encode(['success' => false, 'message' => 'Invalid OTP']);
            exit;
        }

        // Generate session token
        $token = bin2hex(random_bytes(32));
        $expires_at = time() + (24 * 60 * 60); // 24 hours

        // Save session
        $sessions = load_data($sessions_file);
        $sessions[$token] = [
            'username' => $username,
            'expires_at' => $expires_at,
            'created_at' => time()
        ];
        save_data($sessions_file, $sessions);

        // Clean up OTP
        unset($otp_data[$username]);
        save_data($otp_file, $otp_data);

        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token
        ]);
        break;

    case 'validate_token':
        $token = $_POST['token'] ?? $_GET['token'] ?? '';

        if (empty($token)) {
            echo json_encode(['success' => false, 'message' => 'Token is required']);
            exit;
        }

        $sessions = load_data($sessions_file);

        if (isset($sessions[$token]) && time() < $sessions[$token]['expires_at']) {
            echo json_encode(['valid' => true, 'username' => $sessions[$token]['username']]);
        } else {
            echo json_encode(['valid' => false]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
?>

