<?php
// Simple OTP Authentication - Standalone version
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple database connection using MySQLi
$host = 'localhost';  // Changed from 'db' to 'localhost'
$dbname = 'assafdb';
$username = 'assafuser';
$password = 'assafpass';

$connection = new mysqli($host, $username, $password, $dbname);

if ($connection->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $connection->connect_error]);
    exit();
}

$connection->set_charset('utf8mb4');

// Check if required tables exist
function checkTables($connection) {
    $requiredTables = ['otp_requests', 'user_sessions'];
    $missingTables = [];

    foreach ($requiredTables as $table) {
        $result = $connection->query("SHOW TABLES LIKE '$table'");
        if ($result->num_rows == 0) {
            $missingTables[] = $table;
        }
    }

    return $missingTables;
}

// Create missing tables
function createMissingTables($connection, $missingTables) {
    $tableQueries = [
        'otp_requests' => "
            CREATE TABLE otp_requests (
                id int(11) NOT NULL AUTO_INCREMENT,
                username varchar(255) NOT NULL,
                email varchar(255) NOT NULL,
                otp_code varchar(6) NOT NULL,
                expires_at datetime NOT NULL,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_username (username),
                KEY idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ",
        'user_sessions' => "
            CREATE TABLE user_sessions (
                id int(11) NOT NULL AUTO_INCREMENT,
                username varchar(255) NOT NULL,
                token varchar(255) NOT NULL,
                expires_at datetime NOT NULL,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_token (token),
                KEY idx_username (username),
                KEY idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        "
    ];

    foreach ($missingTables as $table) {
        if (isset($tableQueries[$table])) {
            if ($connection->query($tableQueries[$table])) {
                error_log("Created table: $table");
            } else {
                error_log("Failed to create table $table: " . $connection->error);
            }
        }
    }
}

$missingTables = checkTables($connection);
if (!empty($missingTables)) {
    // Try to create missing tables automatically
    createMissingTables($connection, $missingTables);

    // Check again after creation
    $missingTables = checkTables($connection);
    if (!empty($missingTables)) {
        echo json_encode([
            'success' => false,
            'message' => 'Database setup incomplete. Missing tables: ' . implode(', ', $missingTables),
            'note' => 'Please run mysql_enhancements.sql first'
        ]);
        exit();
    }
}

// Handle requests
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'request_otp':
        $username = $_POST['username'] ?? '';
        $email = $_POST['email'] ?? $username . '@demo.com'; // Default email if not provided

        if (empty($username)) {
            echo json_encode(['success' => false, 'message' => 'Username is required']);
            exit;
        }

        try {
            // Check rate limiting
            $stmt = $connection->prepare("SELECT COUNT(*) FROM otp_requests WHERE username = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();
            $hourlyCount = $result->fetch_row()[0];
            $stmt->close();

            if ($hourlyCount >= 4) {
                echo json_encode(['success' => false, 'message' => 'Maximum 4 OTP requests per hour reached']);
                exit;
            }

            // Generate OTP
            $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

            // Save OTP request
            $stmt = $connection->prepare("INSERT INTO otp_requests (username, email, otp_code, expires_at) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $username, $email, $otp, $expiresAt);
            $stmt->execute();
            $stmt->close();

            // For now, just return success (you'll need to implement Brevo API)
            echo json_encode([
                'success' => true,
                'message' => 'OTP sent successfully (demo mode)',
                'otp' => $otp // Remove this in production!
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        break;

    case 'verify_otp':
        $username = $_POST['username'] ?? '';
        $otp = $_POST['otp'] ?? '';

        if (empty($username) || empty($otp)) {
            echo json_encode(['success' => false, 'message' => 'Username and OTP are required']);
            exit;
        }

        try {
            // Get the latest OTP request
            $stmt = $connection->prepare("SELECT * FROM otp_requests WHERE username = ? ORDER BY created_at DESC LIMIT 1");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();
            $otpRequest = $result->fetch_assoc();
            $stmt->close();

            if (!$otpRequest) {
                echo json_encode(['success' => false, 'message' => 'No OTP request found']);
                exit;
            }

            // Check if OTP is expired
            if (strtotime($otpRequest['expires_at']) < time()) {
                echo json_encode(['success' => false, 'message' => 'OTP has expired']);
                exit;
            }

            // Check if OTP matches
            if ($otpRequest['otp_code'] !== $otp) {
                echo json_encode(['success' => false, 'message' => 'Invalid OTP']);
                exit;
            }

            // Generate session token
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));

            // Save session
            $stmt = $connection->prepare("DELETE FROM user_sessions WHERE username = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $stmt->close();

            $stmt = $connection->prepare("INSERT INTO user_sessions (username, token, expires_at) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $username, $token, $expiresAt);
            $stmt->execute();
            $stmt->close();

            // Clean up OTP request
            $stmt = $connection->prepare("DELETE FROM otp_requests WHERE id = ?");
            $stmt->bind_param("i", $otpRequest['id']);
            $stmt->execute();
            $stmt->close();

            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'token' => $token,
                'expires_at' => $expiresAt
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        break;

    case 'validate_token':
        $token = $_POST['token'] ?? $_GET['token'] ?? '';

        if (empty($token)) {
            echo json_encode(['success' => false, 'message' => 'Token is required']);
            exit;
        }

        try {
            $stmt = $connection->prepare("SELECT * FROM user_sessions WHERE token = ? AND expires_at > NOW()");
            $stmt->bind_param("s", $token);
            $stmt->execute();
            $result = $stmt->get_result();
            $session = $result->fetch_assoc();
            $stmt->close();

            if ($session) {
                echo json_encode(['valid' => true, 'username' => $session['username']]);
            } else {
                echo json_encode(['valid' => false]);
            }

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
?>
