<?php
// otp/verify.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
require_once __DIR__ . '/../includes/db.php';

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
$username = isset($input['username']) ? trim($input['username']) : '';
$otp = isset($input['otp']) ? trim($input['otp']) : '';

if (!$username || !$otp) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'missing parameters']);
    exit;
}

$mysqli = db_get_conn();
if (!$mysqli) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'db error']); exit; }

// הבאת המשתמש
$sql = "SELECT id, otp_hash, otp_expires_at FROM users WHERE username = ? LIMIT 1";
if (!$stmt = $mysqli->prepare($sql)) { error_log("prepare failed: ".$mysqli->error); echo json_encode(['success'=>false,'message'=>'internal']); exit; }
$stmt->bind_param('s', $username);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'invalid credentials']);
    exit;
}

// בדיקת תוקף
if (empty($user['otp_hash']) || empty($user['otp_expires_at']) || new DateTime($user['otp_expires_at']) < new DateTime()) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'OTP expired or not set']);
    exit;
}

// אימות ה־OTP
if (!password_verify($otp, $user['otp_hash'])) {
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
    echo json_encode(['success'=>false,'message'=>'internal error']); exit;
}
$uStmt->bind_param('ssi', $token, $token_expires, $user['id']);
$ok = $uStmt->execute();
$uStmt->close();

if (!$ok) {
    error_log("failed store token for user {$user['id']}: ".$mysqli->error);
    echo json_encode(['success'=>false,'message'=>'internal error']); exit;
}

// החזר טוקן ללקוח
echo json_encode(['success'=>true,'token'=>$token,'expires_at'=>$token_expires]);
exit;
