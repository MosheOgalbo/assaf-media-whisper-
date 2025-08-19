<?php
define("a328763fe27bba","TRUE");

// Disable error display for API endpoints
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// Start output buffering to catch any unexpected output
ob_start();

#region start
try {
    require_once("config.php");
} catch (Exception $e) {
    ob_end_clean();
    header("Content-Type: application/json; charset=utf-8");
    header("Access-Control-Allow-Origin: *");
    echo json_encode(['success' => false, 'message' => 'Config error: ' . $e->getMessage()]);
    exit();
}

// Check if there was any output before headers
$output = ob_get_contents();
if (!empty($output)) {
    ob_end_clean();
    header("Content-Type: application/json; charset=utf-8");
    header("Access-Control-Allow-Origin: *");
    echo json_encode(['success' => false, 'message' => 'Unexpected output detected: ' . substr($output, 0, 100)]);
    exit();
}

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

#endregion start

// Test database connection early
try {
    global $mysql_connection;
    if (!$mysql_connection) {
        throw new Exception("Database connection not available");
    }
} catch (Exception $e) {
    error_log("Database connection test failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Clear any output buffer
ob_end_clean();

// Brevo API Configuration
define('BREVO_API_KEY', 'YOUR_BREVO_API_KEY_HERE'); // Replace with actual API key
define('BREVO_API_URL', 'https://api.brevo.com/v3/smtp/email');

class OTPAuth {
    private $db;

    public function __construct() {
        global $mysql_connection;
        $this->db = $mysql_connection;

        // Test database connection
        if (!$this->db) {
            error_log("OTP Auth: No database connection available");
            throw new Exception("Database connection not available");
        }
    }

    /**
     * Request OTP for user login
     */
    public function requestOTP($username, $email) {
        try {
            // Validate input
            if (empty($username) || empty($email)) {
                return ['success' => false, 'message' => 'Username and email are required'];
            }

            // Check if required tables exist
            if (!$this->checkTablesExist()) {
                return ['success' => false, 'message' => 'Database setup incomplete. Please run mysql_enhancements.sql first.'];
            }

            // Check rate limiting
            $rateLimitCheck = $this->checkRateLimit($username);
            if (!$rateLimitCheck['allowed']) {
                return ['success' => false, 'message' => $rateLimitCheck['message']];
            }

            // Generate OTP
            $otp = $this->generateOTP();
            $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

            // Save OTP request to database
            $this->saveOTPRequest($username, $email, $otp, $expiresAt);

            // Send OTP via Brevo API
            $emailSent = $this->sendOTPEmail($email, $username, $otp);

            if ($emailSent) {
                return ['success' => true, 'message' => 'OTP sent successfully'];
            } else {
                return ['success' => false, 'message' => 'Failed to send OTP email'];
            }

        } catch (Exception $e) {
            error_log("OTP Request Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Internal server error'];
        }
    }

    /**
     * Verify OTP and generate session token
     */
    public function verifyOTP($username, $otp) {
        try {
            // Check if required tables exist
            if (!$this->checkTablesExist()) {
                return ['success' => false, 'message' => 'Database setup incomplete. Please run mysql_enhancements.sql first.'];
            }

            // Get the latest OTP request for the user
            $query = "SELECT * FROM otp_requests WHERE username = ? ORDER BY created_at DESC LIMIT 1";
            $result = mysql_fetch_array($query, [$username]);

            if (!$result || empty($result)) {
                return ['success' => false, 'message' => 'No OTP request found'];
            }

            $otpRequest = $result[0];

            // Check if OTP is expired
            if (strtotime($otpRequest['expires_at']) < time()) {
                return ['success' => false, 'message' => 'OTP has expired'];
            }

            // Check if OTP matches
            if ($otpRequest['otp_code'] !== $otp) {
                return ['success' => false, 'message' => 'Invalid OTP'];
            }

            // Generate session token
            $token = $this->generateSessionToken();
            $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));

            // Save session
            $this->saveUserSession($username, $token, $expiresAt);

            // Clean up OTP request
            $this->cleanupOTPRequest($otpRequest['id']);

            return [
                'success' => true,
                'message' => 'Login successful',
                'token' => $token,
                'expires_at' => $expiresAt
            ];

        } catch (Exception $e) {
            error_log("OTP Verification Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Internal server error'];
        }
    }

    /**
     * Check rate limiting for OTP requests
     */
    private function checkRateLimit($username) {
        // Check if required tables exist
        if (!$this->checkTablesExist()) {
            return ['allowed' => false, 'message' => 'Database setup incomplete'];
        }

        $now = date('Y-m-d H:i:s');
        $oneHourAgo = date('Y-m-d H:i:s', strtotime('-1 hour'));
        $oneDayAgo = date('Y-m-d H:i:s', strtotime('-1 day'));

        // Check hourly limit
        $hourlyQuery = "SELECT COUNT(*) as count FROM otp_requests WHERE username = ? AND created_at > ?";
        $hourlyResult = mysql_fetch_array($hourlyQuery, [$username, $oneHourAgo]);
        $hourlyCount = $hourlyResult[0]['count'] ?? 0;

        if ($hourlyCount >= 4) {
            return ['allowed' => false, 'message' => 'Maximum 4 OTP requests per hour reached'];
        }

        // Check daily limit
        $dailyQuery = "SELECT COUNT(*) as count FROM otp_requests WHERE username = ? AND created_at > ?";
        $dailyResult = mysql_fetch_array($dailyQuery, [$username, $oneDayAgo]);
        $dailyCount = $dailyResult[0]['count'] ?? 0;

        if ($dailyCount >= 10) {
            return ['allowed' => false, 'message' => 'Maximum 10 OTP requests per day reached'];
        }

        // Check cooldown (30 seconds)
        $lastRequestQuery = "SELECT created_at FROM otp_requests WHERE username = ? ORDER BY created_at DESC LIMIT 1";
        $lastRequestResult = mysql_fetch_array($lastRequestQuery, [$username]);

        if ($lastRequestResult && !empty($lastRequestResult)) {
            $lastRequestTime = strtotime($lastRequestResult[0]['created_at']);
            if (time() - $lastRequestTime < 30) {
                return ['allowed' => false, 'message' => 'Please wait 30 seconds before requesting another OTP'];
            }
        }

        return ['allowed' => true];
    }

    /**
     * Generate 6-digit OTP
     */
    private function generateOTP() {
        return str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Generate secure session token
     */
    private function generateSessionToken() {
        return bin2hex(random_bytes(32));
    }

    /**
     * Save OTP request to database
     */
    private function saveOTPRequest($username, $email, $otp, $expiresAt) {
        try {
            $data = [
                'username' => $username,
                'email' => $email,
                'otp_code' => $otp,
                'expires_at' => $expiresAt
            ];

            $result = mysql_insert('otp_requests', $data);

            if (!$result) {
                error_log("Failed to save OTP request: " . json_encode($data));
                throw new Exception("Failed to save OTP request to database");
            }
        } catch (Exception $e) {
            error_log("Database error in saveOTPRequest: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Save user session
     */
    private function saveUserSession($username, $token, $expiresAt) {
        try {
            // Remove old sessions for this user
            $cleanupResult = mysql_delete('user_sessions', ['username' => $username]);

            // Insert new session
            $data = [
                'username' => $username,
                'token' => $token,
                'expires_at' => $expiresAt
            ];

            $insertResult = mysql_insert('user_sessions', $data);

            if (!$insertResult) {
                error_log("Failed to save user session: " . json_encode($data));
                throw new Exception("Failed to save user session to database");
            }
        } catch (Exception $e) {
            error_log("Database error in saveUserSession: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Clean up OTP request after successful verification
     */
    private function cleanupOTPRequest($otpId) {
        try {
            $result = mysql_delete('otp_requests', ['id' => $otpId]);

            if (!$result) {
                error_log("Failed to cleanup OTP request: " . $otpId);
            }
        } catch (Exception $e) {
            error_log("Error cleaning up OTP request: " . $e->getMessage());
        }
    }

    /**
     * Send OTP email via Brevo API
     */
    private function sendOTPEmail($email, $username, $otp) {
        $emailData = [
            'sender' => [
                'name' => 'Chat App',
                'email' => 'noreply@chatapp.com'
            ],
            'to' => [
                [
                    'email' => $email,
                    'name' => $username
                ]
            ],
            'subject' => 'Your Login OTP',
            'htmlContent' => $this->getOTPEmailTemplate($username, $otp)
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, BREVO_API_URL);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'api-key: ' . BREVO_API_KEY
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 201;
    }

    /**
     * Get OTP email template
     */
    private function getOTPEmailTemplate($username, $otp) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Login OTP</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #2c3e50;'>Hello {$username}!</h2>
                <p>You have requested a login OTP for your chat application account.</p>
                <div style='background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;'>
                    <h1 style='color: #e74c3c; font-size: 32px; letter-spacing: 5px; margin: 0;'>{$otp}</h1>
                </div>
                <p><strong>This OTP is valid for 10 minutes.</strong></p>
                <p>If you didn't request this OTP, please ignore this email.</p>
                <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
                <p style='font-size: 12px; color: #999;'>This is an automated message, please do not reply.</p>
            </div>
        </body>
        </html>
        ";
    }

    /**
     * Check if required database tables exist
     */
    private function checkTablesExist() {
        try {
            $requiredTables = ['otp_requests', 'user_sessions'];

            foreach ($requiredTables as $table) {
                $checkQuery = "SHOW TABLES LIKE '$table'";
                $result = mysql_fetch_array($checkQuery, []);
                if (empty($result)) {
                    error_log("Missing required table: $table");
                    return false;
                }
            }

            return true;
        } catch (Exception $e) {
            error_log("Error checking tables: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Validate session token
     */
    public function validateToken($token) {
        try {
            // Check if required tables exist
            if (!$this->checkTablesExist()) {
                return ['valid' => false, 'message' => 'Database setup incomplete'];
            }

            $query = "SELECT * FROM user_sessions WHERE token = ? AND expires_at > NOW()";
            $result = mysql_fetch_array($query, [$token]);

            if ($result && !empty($result)) {
                return ['valid' => true, 'username' => $result[0]['username']];
            }

            return ['valid' => false];

        } catch (Exception $e) {
            error_log("Token Validation Error: " . $e->getMessage());
            return ['valid' => false];
        }
    }
}

// Handle requests
$otpAuth = new OTPAuth();
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'request_otp':
        $username = $_POST['username'] ?? '';
        $email = $_POST['email'] ?? '';

        if (empty($username) || empty($email)) {
            echo json_encode(['success' => false, 'message' => 'Username and email are required']);
            exit;
        }

        $result = $otpAuth->requestOTP($username, $email);
        echo json_encode($result);
        break;

    case 'verify_otp':
        $username = $_POST['username'] ?? '';
        $otp = $_POST['otp'] ?? '';

        if (empty($username) || empty($otp)) {
            echo json_encode(['success' => false, 'message' => 'Username and OTP are required']);
            exit;
        }

        $result = $otpAuth->verifyOTP($username, $otp);
        echo json_encode($result);
        break;

    case 'validate_token':
        $token = $_POST['token'] ?? $_GET['token'] ?? '';

        if (empty($token)) {
            echo json_encode(['success' => false, 'message' => 'Token is required']);
            exit;
        }

        $result = $otpAuth->validateToken($token);
        echo json_encode($result);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
?>
