# Setup Guide - Fixing JSON Parsing Issues

## Problem
The error "Unexpected token 'y', 'you can't '... is not valid JSON" indicates that PHP is outputting error messages before the JSON response, causing the frontend to fail parsing the response.

## Root Causes Identified
1. **Missing Database Constant**: `MYSQL_DEFAULT_SERVERNAME` was not defined in config.php
2. **Error Display Enabled**: `display_errors` was set to 1, causing PHP errors to be output
3. **Database Tables Missing**: Required tables for OTP authentication don't exist yet

## Solutions Applied

### 1. Fixed Missing Database Constants
Added the missing constant in `config.php`:
```php
define('MYSQL_DEFAULT_SERVERNAME', 'db');
```

### 2. Disabled Error Display
Changed `INI_SET_DISPLAY_ERRORS` from 1 to 0 in `config.php`

### 3. Added Error Handling in OTP Auth
Added proper error handling and table existence checks in `otp_auth.php`

## Testing Steps

### Step 1: Test Basic PHP
Visit `/test_simple.php` - should return valid JSON

### Step 2: Test Database Connection
Visit `/test_db.php` - should return database connection status

### Step 3: Test Database Setup
Visit `/setup_database.php` - shows which tables are missing

### Step 4: Test OTP Auth
Visit `/test_otp.php` - tests OTP authentication setup

## Required Database Setup

Before using OTP authentication, run the database setup:

1. **Execute SQL Script**:
   ```bash
   mysql -u your_user -p your_database < mysql_enhancements.sql
   ```

2. **Verify Tables Exist**:
   - `otp_requests`
   - `user_sessions`
   - `groups`
   - `group_members`
   - `group_messages`
   - `message_read_status`
   - `settings`
   - `user_preferences`

3. **Check Messages Table**:
   Ensure the `messages` table has the new columns:
   - `file_url`, `file_name`, `file_size`
   - `is_deleted`, `deleted_at`
   - `is_group_message`, `group_id`, `message_hash`

## Configuration

1. **Update Brevo API Key**:
   Edit `otp_auth.php` and replace `YOUR_BREVO_API_KEY_HERE` with your actual API key

2. **Database Credentials**:
   Update database connection details in `config.php` if needed

## Troubleshooting

### If JSON parsing still fails:
1. Check browser developer tools for the actual response
2. Check server error logs
3. Test with `/test_simple.php` first
4. Ensure no whitespace before `<?php` tags
5. Verify all required files exist and are readable

### If database connection fails:
1. Check database credentials in `config.php`
2. Ensure MySQL service is running
3. Verify database exists and user has permissions
4. Check firewall settings if using remote database

## Next Steps
After fixing the JSON parsing issue:
1. Test OTP authentication flow
2. Set up frontend React application
3. Test file uploads and voice messages
4. Verify group chat functionality

