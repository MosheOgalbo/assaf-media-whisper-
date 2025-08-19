<?php
// otp/create.php
header('Content-Type: application/json');

// עבור dev/local: להוסיף כותרות CORS לפי צורך
header('Access-Control-Allow-Origin: http://localhost:3000');
 header('Access-Control-Allow-Headers: Content-Type');
 if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once __DIR__ . '/../includes/db.php';

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
$username = isset($input['username']) ? trim($input['username']) : '';

if (!$username) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'missing username']);
    exit;
}

$mysqli = db_get_conn();
if (!$mysqli) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'db connection error']);
    exit;
}

// א. חפש משתמש לפי username
$sql = "SELECT id, otp_last_request_at, otp_hourly_count, otp_daily_count FROM users WHERE username = ? LIMIT 1";
if (!$stmt = $mysqli->prepare($sql)) {
    error_log("prepare failed: ".$mysqli->error);
    echo json_encode(['success'=>false,'message'=>'internal error']); exit;
}
$stmt->bind_param('s', $username);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    // אל נחשוף אם המשתמש קיים — נחזיר תשובה ניטרלית
    echo json_encode(['success'=>true,'message'=>'אם המשתמש קיים, נשלח OTP.']);
    exit;
}

$user_id = (int)$user['id'];
$now = new DateTime('now', new DateTimeZone('UTC'));

// בדיקת 30 שניות בין בקשות
if (!empty($user['otp_last_request_at'])) {
    $last = new DateTime($user['otp_last_request_at'], new DateTimeZone('UTC'));
    if (($now->getTimestamp() - $last->getTimestamp()) < 30) {
        http_response_code(429);
        echo json_encode(['success'=>false,'message'=>'נא להמתין 30 שניות לפני בקשה נוספת']);
        exit;
    }
}

// אפס את ספירות שעה/יום אם עבר זמן מה
$hourStart = (clone $now)->setTime((int)$now->format('H'), 0, 0);
$dayStart  = (clone $now)->setTime(0,0,0);

$hourly = (int)$user['otp_hourly_count'];
$daily  = (int)$user['otp_daily_count'];

if (empty($user['otp_last_request_at']) || new DateTime($user['otp_last_request_at']) < $hourStart) {
    $hourly = 0;
}
if (empty($user['otp_last_request_at']) || new DateTime($user['otp_last_request_at']) < $dayStart) {
    $daily = 0;
}
if ($hourly >= 4) { http_response_code(429); echo json_encode(['success'=>false,'message'=>'מגיעים למגבלת בקשות לשעה']);
    exit; }
if ($daily >= 10)  {
    http_response_code(429); echo json_encode(['success'=>false,'message'=>'מגיעים למגבלת בקשות ליום']);
    exit;
}

// יצירת OTP 6 ספרות
$otp = random_int(100000, 999999);
$otp_hash = password_hash((string)$otp, PASSWORD_DEFAULT);
$expires_at = $now->modify('+10 minutes')->format('Y-m-d H:i:s');

// עדכון DB
$updateSql = "UPDATE users SET otp_hash = ?, otp_expires_at = ?, otp_last_request_at = ?, otp_request_count = otp_request_count + 1, otp_hourly_count = ?, otp_daily_count = ? WHERE id = ?";
if (!$uStmt = $mysqli->prepare($updateSql)) {
    error_log("update prepare failed: ".$mysqli->error);
    echo json_encode(['success'=>false,'message'=>'internal error']);
    exit;
}
$last_request = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
$hourly++; $daily++;
$uStmt->bind_param('ssssii', $otp_hash, $expires_at, $last_request, $hourly, $daily, $user_id);
$ok = $uStmt->execute();
$uStmt->close();

if (!$ok) {
    error_log("failed update otp for user {$user_id}: ".$mysqli->error);
    echo json_encode(['success'=>false,'message'=>'internal error']); exit;
}

// TODO: כאן לשלוח את ה־OTP דרך המייל/סמס (Brevo)
//
// דוגמה: בצד הייצור תקרא ל־Brevo API ותשלח את הקוד. לא להחזיר את ה־OTP בתשובה!
// בשביל בדיקות מקומיות בלבד אפשר להחזיר את ה־OTP בתשובה (לא בטוח לייצור):
// echo json_encode(['success'=>true,'message'=>'OTP נשלח', 'debug_otp' => $otp]);

echo json_encode(['success'=>true,'message'=>'OTP נשלח במידה והמשתמש קיים.']);
exit;
