# Advanced Chat Application

A modern, feature-rich chat application built with React, TypeScript, and PHP, featuring OTP authentication, file sharing, voice messages, group chats, and more.

## 🚀 Features

### Core Features
- **OTP Authentication**: Secure login via email OTP using Brevo API
- **Real-time Chat**: Instant messaging with real-time updates
- **File Sharing**: Support for images, PDFs, documents, and more
- **Voice Messages**: Record and send voice messages with waveform visualization
- **Group Chats**: Create groups and chat with multiple members
- **Emoji Support**: Rich emoji picker with search functionality
- **Message Status**: Read receipts and delivery status
- **Message Deletion**: Delete messages for both sender and receiver

### Advanced Features
- **Drag & Drop**: Desktop file upload with drag and drop support
- **Mobile Camera**: Direct camera access for mobile image uploads
- **Lazy Loading**: Automatic loading of older messages on scroll
- **Sound Notifications**: Audio alerts for new messages
- **Responsive Design**: Mobile-first responsive design
- **Dark Mode**: Automatic dark mode support
- **Accessibility**: Full keyboard navigation and screen reader support

### Security Features
- **Honeypot Protection**: Bot detection and prevention
- **Rate Limiting**: OTP request throttling (4/hour, 10/day)
- **Token Authentication**: Secure session management
- **File Validation**: Type and size validation for uploads

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **CSS3** with modern animations and responsive design
- **Web APIs** for file handling and media recording

### Backend
- **PHP 8+** with custom framework
- **MySQL** database
- **Brevo API** for email delivery
- **Custom OTP system** with rate limiting

## 📋 Prerequisites

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Node.js 16+ and npm
- Brevo API account and key
- Web server (Apache/Nginx)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd assaf-media-whisper
```

### 2. Backend Setup

#### Database Setup
```bash
# Import the database schema
mysql -u your_username -p your_database < mysql_enhancements.sql
```

#### Configuration
1. Copy `config.php` and update database credentials
2. Update `otp_auth.php` with your Brevo API key:
```php
define('BREVO_API_KEY', 'YOUR_ACTUAL_BREVO_API_KEY');
```

#### File Permissions
```bash
# Create upload directories
mkdir -p uploaded_files/voice
chmod 755 uploaded_files
chmod 755 uploaded_files/voice
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Web Server Configuration
Ensure your web server points to the project root and has PHP support enabled.

## 🔧 Configuration

### Environment Variables
- `MYSQL_DEFAULT_DB_HOST`: Database host
- `MYSQL_DEFAULT_DB_NAME`: Database name
- `MYSQL_DEFAULT_DB_USERNAME`: Database username
- `MYSQL_DEFAULT_DB_PASSWORD`: Database password
- `BREVO_API_KEY`: Brevo API key for email delivery

### Database Settings
The application uses a `settings` table for configuration:
- OTP expiry time
- Rate limiting settings
- File upload limits
- Sound preferences

## 📱 Usage

### Authentication
1. Enter username and email
2. Receive OTP via email
3. Enter 6-digit OTP to login
4. Session token is automatically managed

### Chat Features
- **Send Messages**: Type and press Enter or click send button
- **File Upload**: Drag & drop files or click attachment button
- **Voice Recording**: Click microphone button and speak
- **Emoji**: Click emoji button to open picker
- **Groups**: Click "New Group" to create group chats

### Mobile Features
- Touch-optimized interface
- Camera access for image uploads
- Responsive design for all screen sizes

## 🎨 Customization

### Themes
The application supports automatic dark mode detection and can be extended with custom themes.

### Sounds
Notification sounds can be customized via the database settings table.

### File Types
Supported file types can be modified in the upload handlers.

## 🔒 Security Considerations

- OTP requests are rate-limited
- File uploads are validated for type and size
- SQL injection protection via prepared statements
- XSS protection through proper output encoding
- CSRF protection via token validation

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
Manual testing recommended for PHP endpoints.

## 🚀 Deployment

### Production Build
```bash
cd frontend
npm run build
```

### Server Requirements
- PHP 8.0+
- MySQL 5.7+
- HTTPS enabled
- Proper file permissions

## 📊 Performance

- Lazy loading for messages
- Optimized database queries with indexes
- Efficient file handling
- Responsive animations with reduced motion support

## 🌟 Bonus Features

- Animated splash screen
- Voice recording animations
- Message arrival animations
- Customizable notification sounds
- Amusing error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

## 🔄 Updates

The application is designed to be easily updatable:
- Database migrations are handled automatically
- Frontend components are modular
- Backend APIs are versioned

---

**Note**: This is a comprehensive chat application designed for production use. Ensure proper security measures are in place before deploying to production environments.
