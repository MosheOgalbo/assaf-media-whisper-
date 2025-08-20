<?php

// אפשר להריץ ישירות את הקובץ ע"י הגדרת הקבוע שהמחסומים בודקים:
if (!defined('a328763fe27bba')) {
    define('a328763fe27bba', true);
}

// טען את אתחול האפליקציה (שם גם מוגדרות כותרות CORS/טיים-זון)
require_once __DIR__ . '/../app_init.php';

// כעת אפשר לכלול DB ושאר תלויות
require_once __DIR__ . '/../includes/db.php';

// הגדרת כותרות
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: http://localhost:3001');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// קריאת הנתונים מהבקשה
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

// בדיקה אם הנתונים הגיעו כראוי
if (!$input) {
    error_log("Failed to decode JSON: " . $raw);
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'invalid json data']);
    exit;
}

$username = isset($input['username']) ? trim($input['username']) : '';
$otp = isset($input['otp']) ? trim($input['otp']) : '';

// לוג לבדיקה
error_log("Received verify request - Username: $username, OTP: $otp");

if (!$username || !$otp) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'missing parameters']);
    exit;
}

$mysqli = db_get_conn();
if (!$mysqli) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'db error']);
    exit;
}

// הבאת המשתמש
$sql = "SELECT id, username, otp_hash, otp_expires_at FROM users WHERE username = ? LIMIT 1";
if (!$stmt = $mysqli->prepare($sql)) {
    error_log("prepare failed: ".$mysqli->error);
    echo json_encode(['success'=>false,'message'=>'internal']);
    exit;
}
$stmt->bind_param('s', $username);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    error_log("User not found: $username");
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'invalid credentials']);
    exit;
}

// בדיקת תוקף
if (empty($user['otp_hash']) || empty($user['otp_expires_at'])) {
    error_log("OTP not set for user: $username");
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'OTP not set']);
    exit;
}

$expires_at = new DateTime($user['otp_expires_at'], new DateTimeZone('UTC'));
$now = new DateTime('now', new DateTimeZone('UTC'));

if ($expires_at < $now) {
    error_log("OTP expired for user: $username");
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'OTP expired']);
    exit;
}

// אימות ה־OTP
if (!password_verify($otp, $user['otp_hash'])) {
    error_log("Invalid OTP for user: $username");
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'invalid otp']);
    exit;
}

// יצירת טוקן ארוך
$token = bin2hex(random_bytes(32));
$token_expires = (new DateTime('now', new DateTimeZone('UTC')))->modify('+7 days')->format('Y-m-d H:i:s');

// עדכון טוקן ב־DB וניקוי ה־OTP
$updateSql = "UPDATE users SET token = ?, token_expires_at = ?, otp_hash = NULL, otp_expires_at = NULL WHERE id = ?";
if (!$uStmt = $mysqli->prepare($updateSql)) {
    error_log("token update prepare failed: ".$mysqli->error);
    echo json_encode(['success'=>false,'message'=>'internal error']);
    exit;
}
$uStmt->bind_param('ssi', $token, $token_expires, $user['id']);
$ok = $uStmt->execute();
$uStmt->close();

if (!$ok) {
    error_log("failed store token for user {$user['id']}: ".$mysqli->error);
    echo json_encode(['success'=>false,'message'=>'internal error']);
    exit;
}

// לוג הצלחה
error_log("Successfully verified OTP for user: $username");

// החזר טוקן ללקוח
echo json_encode([
    'success' => true,
    'token' => $token,
    'username' => $username,
    'expires_at' => $token_expires
]);
exit;
