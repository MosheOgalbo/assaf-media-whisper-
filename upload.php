<?php
define("a328763fe27bba","TRUE");

require_once("config.php");

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check if file was uploaded
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error']);
    exit();
}

$file = $_FILES['file'];
$username = $_POST['username'] ?? '';
$contact_id = $_POST['contact_id'] ?? '';

if (empty($username) || empty($contact_id)) {
    echo json_encode(['success' => false, 'message' => 'Username and contact_id are required']);
    exit();
}

// Validate file size (10MB max)
$maxSize = 10 * 1024 * 1024; // 10MB
if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'message' => 'File size exceeds 10MB limit']);
    exit();
}

// Validate file type
$allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'video/mp4', 'video/webm', 'video/ogg',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'File type not allowed']);
    exit();
}

// Create upload directory if it doesn't exist
$uploadDir = 'uploaded_files/' . date('Y/m/');
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid() . '_' . time() . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Determine file type for database
    $fileType = 'file';
    if (strpos($mimeType, 'image/') === 0) {
        $fileType = 'image';
    } elseif (strpos($mimeType, 'audio/') === 0) {
        $fileType = 'voice';
    } elseif ($mimeType === 'application/pdf') {
        $fileType = 'pdf';
    }

    // Save file info to database
    $query = "INSERT INTO messages (belongs_to_username, contact_id, msg_type, msg_body, file_url, file_name, file_size, is_from_me, msg_datetime) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())";

    try {
        $result = mysql_query($query, [
            $username,
            $contact_id,
            $fileType,
            $file['name'],
            $filepath,
            $file['name'],
            $file['size']
        ]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'File uploaded successfully',
                'file_url' => $filepath,
                'file_name' => $file['name'],
                'file_size' => $file['size'],
                'file_type' => $fileType
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save file info to database']);
        }
    } catch (Exception $e) {
        error_log("Database error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file']);
}
?>
