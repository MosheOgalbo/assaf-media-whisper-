<?php
// Configuration Template for Advanced Chat Application
// Copy this file to config.php and update with your values

// Database Configuration
define('MYSQL_DEFAULT_DB_HOST', 'localhost');
define('MYSQL_DEFAULT_DB_NAME', 'assafdb');
define('MYSQL_DEFAULT_DB_USERNAME', 'assafuser');
define('MYSQL_DEFAULT_DB_PASSWORD', 'assafpass');

// Brevo API Configuration
define('BREVO_API_KEY', 'your_brevo_api_key_here');
define('BREVO_API_URL', 'https://api.brevo.com/v3/smtp/email');

// Application Settings
define('APP_ENV', 'development'); // development or production
define('APP_DEBUG', true);
define('APP_TIMEZONE', 'Asia/Jerusalem');

// File Upload Settings
define('MAX_FILE_SIZE_MB', 10);
define('MAX_VOICE_SIZE_MB', 5);
define('UPLOAD_PATH', 'uploaded_files/');

// OTP Settings
define('OTP_EXPIRY_MINUTES', 10);
define('OTP_MAX_PER_HOUR', 4);
define('OTP_MAX_PER_DAY', 10);
define('OTP_COOLDOWN_SECONDS', 30);

// Security Settings
define('SESSION_TIMEOUT_HOURS', 24);
define('ENABLE_HONEYPOT', true);
define('ENABLE_RATE_LIMITING', true);

// Email Settings
define('FROM_EMAIL', 'noreply@yourdomain.com');
define('FROM_NAME', 'Chat App');

// File Type Restrictions
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('ALLOWED_AUDIO_TYPES', ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg']);
define('ALLOWED_DOCUMENT_TYPES', ['application/pdf', 'application/msword', 'text/plain']);

// Rate Limiting
define('RATE_LIMIT_WINDOW', 3600); // 1 hour in seconds
define('MAX_REQUESTS_PER_WINDOW', 100);

// Logging
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR
define('LOG_FILE', 'logs/app.log');

// Cache Settings
define('ENABLE_CACHE', false);
define('CACHE_TTL', 300); // 5 minutes

// Development Settings
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Timezone
date_default_timezone_set(APP_TIMEZONE);

// Security Headers
if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    if (APP_ENV === 'production') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}
?>
