<?php
define("a328763fe27bba","TRUE");

// Minimal test to debug JSON issues
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

try {
    // Test 1: Basic JSON output
    echo json_encode(['test' => 'basic', 'status' => 'ok']);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>

