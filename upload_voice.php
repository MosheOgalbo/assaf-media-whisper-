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

// Check if audio file was uploaded
if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No audio file uploaded or upload error']);
    exit();
}

$audioFile = $_FILES['audio'];
$username = $_POST['username'] ?? '';
$contact_id = $_POST['contact_id'] ?? '';

if (empty($username) || empty($contact_id)) {
    echo json_encode(['success' => false, 'message' => 'Username and contact_id are required']);
    exit();
}

// Validate file size (5MB max for audio)
$maxSize = 5 * 1024 * 1024; // 5MB
if ($audioFile['size'] > $maxSize) {
    echo json_encode(['success' => false, 'message' => 'Audio file size exceeds 5MB limit']);
    exit();
}

// Validate audio file type
$allowedAudioTypes = [
    'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/mp4', 'audio/webm'
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $audioFile['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedAudioTypes)) {
    echo json_encode(['success' => false, 'message' => 'Audio file type not allowed']);
    exit();
}

// Create upload directory if it doesn't exist
$uploadDir = 'uploaded_files/voice/' . date('Y/m/');
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename for audio
$extension = 'wav'; // Default to wav for voice messages
$filename = 'voice_' . uniqid() . '_' . time() . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move uploaded audio file
if (move_uploaded_file($audioFile['tmp_name'], $filepath)) {
    // Save voice message info to database
    $query = "INSERT INTO messages (belongs_to_username, contact_id, msg_type, msg_body, file_url, file_name, file_size, is_from_me, msg_datetime) VALUES (?, ?, 'voice', ?, ?, ?, ?, 1, NOW())";

    try {
        $result = mysql_query($query, [
            $username,
            $contact_id,
            'Voice message',
            $filepath,
            'Voice message',
            $audioFile['size']
        ]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Voice message uploaded successfully',
                'file_url' => $filepath,
                'file_name' => 'Voice message',
                'file_size' => $audioFile['size'],
                'file_type' => 'voice'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save voice message info to database']);
        }
    } catch (Exception $e) {
        error_log("Database error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to move uploaded audio file']);
}
?>
