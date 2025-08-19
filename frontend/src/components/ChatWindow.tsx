import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import MessageBubble from './MessageBubble';
import './ChatWindow.css';

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

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  currentUser: string;
  onSendMessage: (content: string, type?: Message['type'], fileData?: any) => void;
  onFileUpload: (file: File) => void;
  onVoiceRecording: (audioBlob: Blob) => void;
  onEmojiSelect: (emoji: string) => void;
  onScrollToTop: () => void;
  onDeleteMessage: (messageId: number) => void;
  onMarkAsRead: (messageId: number) => void;
  hasMoreMessages: boolean;
  loading: boolean;
  newMessage: string;
  setNewMessage: (message: string) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

export interface ChatWindowRef {
  scrollToBottom: () => void;
}

const ChatWindow = forwardRef<ChatWindowRef, ChatWindowProps>(({
  chat,
  messages,
  currentUser,
  onSendMessage,
  onFileUpload,
  onVoiceRecording,
  onEmojiSelect,
  onScrollToTop,
  onDeleteMessage,
  onMarkAsRead,
  hasMoreMessages,
  loading,
  newMessage,
  setNewMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  isRecording,
  setIsRecording
}, ref) => {
  const [isTyping, setIsTyping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showReadStatus, setShowReadStatus] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }));

  // Auto-resize textarea
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = `${messageInputRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // Handle scroll to top for lazy loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0 && hasMoreMessages && !loading) {
      onScrollToTop();
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileUpload(file);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle message send
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Check if message is single emoji
  const isSingleEmoji = (content: string) => {
    const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u;
    return emojiRegex.test(content.trim()) && content.trim().length <= 2;
  };

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{chat.name}</h3>
          {chat.isGroup && <span className="group-indicator">👥 Group</span>}
          {isTyping && <span className="typing-indicator">typing...</span>}
        </div>
        <div className="chat-header-actions">
          <button
            className="btn-header"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            📎
          </button>
          <button
            className="btn-header"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji"
          >
            😊
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        className={`messages-container ${dragActive ? 'drag-active' : ''}`}
        onScroll={handleScroll}
        ref={scrollContainerRef}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {loading && hasMoreMessages && (
          <div className="loading-messages">
            <div className="loading-spinner"></div>
            <span>Loading older messages...</span>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender === currentUser}
            showReadStatus={showReadStatus === message.id}
            onShowReadStatus={() => setShowReadStatus(message.id)}
            onHideReadStatus={() => setShowReadStatus(null)}
            onDelete={() => onDeleteMessage(message.id)}
            onMarkAsRead={() => onMarkAsRead(message.id)}
            isSingleEmoji={isSingleEmoji(message.content)}
            formatTime={formatTime}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Drag and Drop Overlay */}
      {dragActive && (
        <div className="drag-overlay">
          <div className="drag-content">
            <div className="drag-icon">📁</div>
            <p>Drop file here to send</p>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="message-input-container">
        <div className="message-input-wrapper">
          <textarea
            ref={messageInputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="message-input"
            rows={1}
            maxLength={1000}
          />

          <div className="input-actions">
            <button
              className={`btn-voice ${isRecording ? 'recording' : ''}`}
              onClick={() => setIsRecording(!isRecording)}
              title={isRecording ? 'Stop recording' : 'Record voice message'}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>

            <button
              className="btn-send"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
      />
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
