<?php
define("a328763fe27bba","TRUE");

// Test endpoint to debug OTP issues
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Test database connection
    require_once("config.php");

    // Check if required tables exist
    $tables = ['otp_requests', 'user_sessions', 'groups', 'group_members', 'group_messages', 'message_read_status'];
    $missingTables = [];

    foreach ($tables as $table) {
        $checkQuery = "SHOW TABLES LIKE '$table'";
        $result = mysql_fetch_array($checkQuery, []);
        if (empty($result)) {
            $missingTables[] = $table;
        }
    }

    if (!empty($missingTables)) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing database tables',
            'missing_tables' => $missingTables,
            'note' => 'Please run mysql_enhancements.sql first'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'All required tables exist',
            'database_status' => 'OK'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>

