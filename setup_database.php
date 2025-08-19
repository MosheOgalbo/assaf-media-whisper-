<?php
define("a328763fe27bba","TRUE");

// Database setup script
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once("config.php");

    // Check current database status
    $status = [];

    // Check if required tables exist
    $requiredTables = [
        'otp_requests',
        'user_sessions',
        'groups',
        'group_members',
        'group_messages',
        'message_read_status',
        'settings',
        'user_preferences'
    ];

    foreach ($requiredTables as $table) {
        $checkQuery = "SHOW TABLES LIKE '$table'";
        $result = mysql_fetch_array($checkQuery, []);
        $status[$table] = !empty($result);
    }

    // Check if messages table has required columns
    $messagesColumns = [
        'file_url',
        'file_name',
        'file_size',
        'is_deleted',
        'deleted_at',
        'is_group_message',
        'group_id',
        'message_hash'
    ];

    $columnsQuery = "SHOW COLUMNS FROM messages";
    $columnsResult = mysql_fetch_array($columnsQuery, []);
    $existingColumns = [];

    if ($columnsResult) {
        foreach ($columnsResult as $column) {
            $existingColumns[] = $column['Field'];
        }
    }

    $missingColumns = array_diff($messagesColumns, $existingColumns);

    echo json_encode([
        'success' => true,
        'database_status' => $status,
        'messages_table' => [
            'exists' => in_array('messages', array_keys($status)),
            'missing_columns' => $missingColumns,
            'existing_columns' => $existingColumns
        ],
        'setup_required' => !empty(array_filter($status, function($exists) { return !$exists; })) || !empty($missingColumns),
        'next_steps' => [
            'If tables are missing: Run mysql_enhancements.sql',
            'If columns are missing: Run ALTER TABLE statements from mysql_enhancements.sql',
            'Check database connection and permissions'
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Setup check failed: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>

