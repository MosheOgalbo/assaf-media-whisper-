import React from 'react';
import './ChatList.css';

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

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  lastMessage?: Message;
  unreadCount: number;
  profilePicture?: string;
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  currentUser: string;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChat,
  onChatSelect,
  currentUser
}) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 48) {
      return 'yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatLastMessage = (message: Message) => {
    switch (message.type) {
      case 'image':
        return '📷 Image';
      case 'voice':
        return '🎤 Voice message';
      case 'file':
        return '📎 File';
      case 'pdf':
        return '📄 PDF';
      default:
        return message.content.length > 30
          ? message.content.substring(0, 30) + '...'
          : message.content;
    }
  };

  const getProfilePicture = (chat: Chat) => {
    if (chat.profilePicture) {
      return chat.profilePicture;
    }

    if (chat.isGroup) {
      return '/images/group-default.png';
    }

    // Generate initials for individual chats
    const initials = chat.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23667eea"/><text x="20" y="25" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">${initials}</text></svg>`;
  };

  return (
    <div className="chat-list">
      {chats.length === 0 ? (
        <div className="no-chats">
          <div className="no-chats-icon">💬</div>
          <h3>No chats yet</h3>
          <p>Start a conversation with your contacts</p>
        </div>
      ) : (
        chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${selectedChat?.id === chat.id ? 'selected' : ''}`}
            onClick={() => onChatSelect(chat)}
          >
            <div className="chat-avatar">
              <img
                src={getProfilePicture(chat)}
                alt={chat.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="avatar-fallback hidden">
                {chat.name
                  .split(' ')
                  .map(word => word.charAt(0))
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)
                }
              </div>
              {chat.isGroup && (
                <div className="group-indicator">
                  <span>👥</span>
                </div>
              )}
            </div>

            <div className="chat-info">
              <div className="chat-header">
                <h4 className="chat-name">{chat.name}</h4>
                {chat.lastMessage && (
                  <span className="chat-time">
                    {formatTime(chat.lastMessage.timestamp)}
                  </span>
                )}
              </div>

              {chat.lastMessage && (
                <div className="chat-preview">
                  <span className="chat-message">
                    {chat.lastMessage.sender === currentUser ? 'You: ' : ''}
                    {formatLastMessage(chat.lastMessage)}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatList;
