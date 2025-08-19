<?php
define("a328763fe27bba","TRUE");

// Database connection test
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

try {
    require_once("config.php");

    // Test database connection
    $testQuery = "SELECT 1 as test";
    $result = mysql_fetch_array($testQuery, []);

    if (!empty($result)) {
        echo json_encode([
            'success' => true,
            'message' => 'Database connection successful',
            'result' => $result
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Database query failed'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database test failed: ' . $e->getMessage()
    ]);
}
?>

