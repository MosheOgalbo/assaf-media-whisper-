<?php
define("a328763fe27bba","TRUE");

// Simple test without config.php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

echo json_encode([
    'success' => true,
    'message' => 'Simple test successful',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>

