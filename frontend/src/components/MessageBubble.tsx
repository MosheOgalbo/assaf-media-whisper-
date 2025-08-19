import React, { useState } from 'react';
import './MessageBubble.css';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'voice' | 'file' | 'pdf';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readBy: string[];
  readAt: Date[];
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showReadStatus: boolean;
  onShowReadStatus: () => void;
  onHideReadStatus: () => void;
  onDelete: () => void;
  onMarkAsRead: () => void;
  isSingleEmoji: boolean;
  formatTime: (date: Date) => string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showReadStatus,
  onShowReadStatus,
  onHideReadStatus,
  onDelete,
  onMarkAsRead,
  isSingleEmoji,
  formatTime
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete();
  };

  const handleMarkAsRead = () => {
    setShowMenu(false);
    onMarkAsRead();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="message-image">
            <img src={message.fileUrl} alt={message.fileName || 'Image'} />
            {message.fileName && (
              <div className="file-info">
                <span className="file-name">{message.fileName}</span>
                {message.fileSize && (
                  <span className="file-size">{formatFileSize(message.fileSize)}</span>
                )}
              </div>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="message-voice">
            <div className="voice-player">
              <button className="play-button">▶️</button>
              <div className="voice-waveform">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="wave-bar"
                    style={{ height: `${Math.random() * 30 + 10}px` }}
                  />
                ))}
              </div>
            </div>
            <div className="file-info">
              <span className="file-name">Voice message</span>
              {message.fileSize && (
                <span className="file-size">{formatFileSize(message.fileSize)}</span>
              )}
            </div>
          </div>
        );

      case 'file':
      case 'pdf':
        return (
          <div className="message-file">
            <div className="file-icon">
              {message.type === 'pdf' ? '📄' : '📎'}
            </div>
            <div className="file-info">
              <span className="file-name">{message.fileName || 'File'}</span>
              {message.fileSize && (
                <span className="file-size">{formatFileSize(message.fileSize)}</span>
              )}
            </div>
            <button className="download-button" title="Download">
              ⬇️
            </button>
          </div>
        );

      default:
        return (
          <div className={`message-text ${isSingleEmoji ? 'single-emoji' : ''}`}>
            {message.content}
          </div>
        );
    }
  };

  const renderReadStatus = () => {
    if (!message.isRead || message.readBy.length === 0) return null;

    return (
      <div className="read-status">
        <span className="read-indicator">✓✓</span>
        <span className="read-time">
          {formatTime(message.readAt[0])}
        </span>
        {message.readBy.length > 1 && (
          <span className="read-count">
            Read by {message.readBy.length} people
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={`message-bubble ${isOwn ? 'own' : 'other'} ${isSingleEmoji ? 'emoji-message' : ''}`}
      onContextMenu={handleContextMenu}
      onClick={!isOwn ? onMarkAsRead : undefined}
    >
      {!isOwn && (
        <div className="message-sender">
          {message.sender}
        </div>
      )}

      <div className="message-content">
        {renderMessageContent()}
      </div>

      <div className="message-footer">
        <span className="message-time">
          {formatTime(message.timestamp)}
        </span>

        {isOwn && (
          <div className="message-actions">
            <button
              className="action-button"
              onClick={() => setShowMenu(!showMenu)}
              title="More options"
            >
              ⋯
            </button>

            {showMenu && (
              <div className="message-menu">
                <button onClick={handleDelete} className="menu-item delete">
                  🗑️ Delete
                </button>
                <button onClick={handleMarkAsRead} className="menu-item">
                  ✓ Mark as read
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="menu-item"
                >
                  ✕ Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showReadStatus && (
        <div className="read-status-detail">
          <h4>Read by:</h4>
          {message.readBy.map((reader, index) => (
            <div key={index} className="reader-info">
              <span className="reader-name">{reader}</span>
              <span className="read-time">
                {formatTime(message.readAt[index])}
              </span>
            </div>
          ))}
        </div>
      )}

      {renderReadStatus()}
    </div>
  );
};

export default MessageBubble;
