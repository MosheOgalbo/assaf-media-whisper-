-- Enhanced Database Schema for Advanced Chat Application

-- OTP Management Table
CREATE TABLE otp_requests (
  id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  otp_code varchar(6) NOT NULL,
  expires_at datetime NOT NULL,
  request_count_hour int(11) DEFAULT 0,
  request_count_day int(11) DEFAULT 0,
  last_request_time datetime DEFAULT CURRENT_TIMESTAMP,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_username (username),
  KEY idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Sessions Table
CREATE TABLE user_sessions (
  id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(255) NOT NULL,
  token varchar(255) NOT NULL,
  expires_at datetime NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_token (token),
  KEY idx_username (username),
  KEY idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Groups Table
CREATE TABLE groups (
  id int(11) NOT NULL AUTO_INCREMENT,
  group_name varchar(255) NOT NULL,
  created_by varchar(255) NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Group Members Table
CREATE TABLE group_members (
  id int(11) NOT NULL AUTO_INCREMENT,
  group_id int(11) NOT NULL,
  username varchar(255) NOT NULL,
  joined_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_group_member (group_id, username),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  KEY idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Group Messages Table
CREATE TABLE group_messages (
  id int(11) NOT NULL AUTO_INCREMENT,
  group_id int(11) NOT NULL,
  sender_username varchar(255) NOT NULL,
  msg_type varchar(50) DEFAULT 'text',
  msg_body longtext,
  file_url varchar(500) DEFAULT NULL,
  file_name varchar(255) DEFAULT NULL,
  file_size int(11) DEFAULT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  KEY idx_group_id (group_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Message Read Status Table
CREATE TABLE message_read_status (
  id int(11) NOT NULL AUTO_INCREMENT,
  message_id int(11) NOT NULL,
  username varchar(255) NOT NULL,
  read_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_message_reader (message_id, username),
  KEY idx_message_id (message_id),
  KEY idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Enhanced Messages Table (adding new columns)
ALTER TABLE messages
ADD COLUMN file_url varchar(500) DEFAULT NULL AFTER msg_body,
ADD COLUMN file_name varchar(255) DEFAULT NULL AFTER file_url,
ADD COLUMN file_size int(11) DEFAULT NULL AFTER file_name,
ADD COLUMN is_deleted tinyint(1) DEFAULT 0 AFTER file_size,
ADD COLUMN deleted_at datetime DEFAULT NULL AFTER is_deleted,
ADD COLUMN is_group_message tinyint(1) DEFAULT 0 AFTER deleted_at,
ADD COLUMN group_id int(11) DEFAULT NULL AFTER is_group_message,
ADD COLUMN message_hash varchar(64) DEFAULT NULL AFTER group_id;

-- Add indexes for better performance
ALTER TABLE messages
ADD INDEX idx_msg_datetime (msg_datetime),
ADD INDEX idx_is_deleted (is_deleted),
ADD INDEX idx_is_group_message (is_group_message),
ADD INDEX idx_group_id (group_id);

-- Settings Table for Application Configuration
CREATE TABLE settings (
  id int(11) NOT NULL AUTO_INCREMENT,
  setting_key varchar(255) NOT NULL,
  setting_value longtext,
  setting_type varchar(50) DEFAULT 'string',
  description text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('otp_expiry_minutes', '10', 'integer', 'OTP expiration time in minutes'),
('otp_max_per_hour', '4', 'integer', 'Maximum OTP requests per hour'),
('otp_max_per_day', '10', 'integer', 'Maximum OTP requests per day'),
('otp_cooldown_seconds', '30', 'integer', 'Cooldown between OTP requests in seconds'),
('message_sound_enabled', 'true', 'boolean', 'Enable sound for new messages'),
('message_sound_file', 'notification.mp3', 'string', 'Default notification sound file'),
('auto_load_messages', 'true', 'boolean', 'Enable automatic loading of older messages'),
('max_file_size_mb', '10', 'integer', 'Maximum file upload size in MB'),
('allowed_file_types', 'jpg,jpeg,png,gif,pdf,mp3,wav,mp4', 'string', 'Allowed file types for upload');

-- User Preferences Table
CREATE TABLE user_preferences (
  id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(255) NOT NULL,
  preference_key varchar(255) NOT NULL,
  preference_value longtext,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_preference (username, preference_key),
  KEY idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default user preferences
INSERT INTO user_preferences (username, preference_key, preference_value) VALUES
('assaf', 'theme', 'light'),
('assaf', 'language', 'he'),
('assaf', 'notifications_enabled', 'true'),
('beng', 'theme', 'light'),
('beng', 'language', 'he'),
('beng', 'notifications_enabled', 'true');

-- Create indexes for better performance
CREATE INDEX idx_contacts_username ON contacts(belongs_to_username);
CREATE INDEX idx_contacts_contact_id ON contacts(contact_id);
CREATE INDEX idx_messages_contact_username ON messages(contact_id, belongs_to_username);
CREATE INDEX idx_messages_datetime_username ON messages(msg_datetime, belongs_to_username);
