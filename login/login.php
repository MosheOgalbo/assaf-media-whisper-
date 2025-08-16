<?php
header('Content-Type: application/json');

define("a328763fe27bba", true);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../app_init.php';

class TokenChecker {
    private $mysqli;
    private $username;

    public function __construct($mysqli, $username) {
        $this->mysqli = $mysqli;
        $this->username = trim($username);
    }

    public function check() {
        if (empty($this->username)) {
            $this->sendJsonResponse(403, 'Username required.');
        }

        if (!$this->mysqli) {
            $this->sendJsonResponse(500, 'Database connection failed.');
        }

        try {
            $stmt = $this->mysqli->prepare("
                SELECT token, token_valid_until
                FROM users
                WHERE username = ?
                LIMIT 1
            ");

            if ($stmt === false) {
                $this->sendJsonResponse(500, 'Database prepare failed: ' . $this->mysqli->error);
            }

            $stmt->bind_param("s", $this->username);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
        } catch (Throwable $e) {
            error_log("Error fetching token: " . $e->getMessage());
            $this->sendJsonResponse(500, 'Internal server error.');
        }

        if ($row && $row['token'] && $row['token_valid_until']) {
            $validUntil = strtotime($row['token_valid_until']);
            if (time() < $validUntil) {
                $this->sendJsonResponse(200, 'Valid token.', ['token' => $row['token']]);
            } else {
                $this->sendJsonResponse(401, 'Token expired.');
            }
        } else {
            $this->sendJsonResponse(401, 'No valid token found.');
        }
    }

    private function sendJsonResponse(int $status, string $message, array $extra = []) {
        echo json_encode(array_merge([
            'status' => $status,
            'message' => $message
        ], $extra));
        exit;
    }
}

$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? '';

$mysqli = mysql_connect();
$checker = new TokenChecker($mysqli, $username);
$checker->check();
