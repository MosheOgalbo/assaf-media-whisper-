<?php
// includes/db.php
// Wrapper קטן שמשתמש במודול DB הקיים בפרויקט
// שימוש: require_once __DIR__ . '/includes/db.php'; $mysqli = db_get_conn();

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../modules/mysql.php';

if (!function_exists('get_mysqli_connection')) {
    error_log("db wrapper: get_mysqli_connection not found in modules/mysql.php");

}

function db_get_conn() {
    // get_mysqli_connection() אמורה להחזיר אובייקט mysqli לפי modules/mysql.php שלך
    return get_mysqli_connection();
}
