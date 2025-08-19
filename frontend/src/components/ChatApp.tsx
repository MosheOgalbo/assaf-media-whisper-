import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import GroupCreation from './GroupCreation';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import FileUpload from './FileUpload';
import './ChatApp.css';

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

interface User {
  username: string;
  token: string;
}

const ChatApp: React.FC<{ user: User }> = ({ user }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showGroupCreation, setShowGroupCreation] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load chats on component mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Play notification sound for new messages
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }
  }, []);

  const loadChats = async () => {
    try {
      const response = await fetch('/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${user.token}`
        },
        body: new URLSearchParams({
          data: 'get_chats',
          username: user.username
        })
      });

      if (response.ok) {
        const data = await response.json();
        const formattedChats: Chat[] = data.map((chat: any) => ({
          id: chat.contact_id,
          name: chat.contact_name,
          isGroup: false,
          lastMessage: {
            id: 0,
            sender: chat.contact_id,
            content: chat.msg_body,
            timestamp: new Date(chat.msg_datetime),
            type: chat.msg_type as any,
            isRead: false,
            readBy: [],
            readAt: []
          },
          unreadCount: 0,
          profilePicture: chat.profile_picture_url
        }));
        setChats(formattedChats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async (chatId: string, limit: number = 20, offset: number = 0) => {
    try {
      setLoading(true);
      const response = await fetch('/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${user.token}`
        },
        body: new URLSearchParams({
          data: 'get_msgs',
          username: user.username,
          contact_id: chatId,
          limit: limit.toString(),
          offset: offset.toString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg.row_id,
          sender: msg.is_from_me ? user.username : chatId,
          content: msg.msg_body,
          timestamp: new Date(msg.msg_datetime),
          type: msg.msg_type as any,
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          fileSize: msg.file_size,
          isRead: msg.is_read || false,
          readBy: msg.read_by ? msg.read_by.split(',') : [],
          readAt: msg.read_at ? msg.read_at.split(',').map((date: string) => new Date(date)) : []
        }));

        if (offset === 0) {
          setMessages(formattedMessages);
        } else {
          setMessages(prev => [...formattedMessages, ...prev]);
        }

        setHasMoreMessages(data.length === limit);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, type: Message['type'] = 'text', fileData?: any) => {
    if (!selectedChat || (!content.trim() && type === 'text')) return;

    try {
      const messageData: any = {
        data: 'send_msg',
        username: user.username,
        contact_id: selectedChat.id,
        msg_type: type,
        msg_body: content
      };

      if (fileData) {
        messageData.file_url = fileData.url;
        messageData.file_name = fileData.name;
        messageData.file_size = fileData.size;
      }

      const response = await fetch('/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${user.token}`
        },
        body: new URLSearchParams(messageData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newMessage: Message = {
            id: data.message_id,
            sender: user.username,
            content,
            timestamp: new Date(),
            type,
            fileUrl: fileData?.url,
            fileName: fileData?.name,
            fileSize: fileData?.size,
            isRead: false,
            readBy: [],
            readAt: []
          };

          setMessages(prev => [...prev, newMessage]);
          setNewMessage('');

          // Play notification sound
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedChat) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', user.username);
      formData.append('contact_id', selectedChat.id);

      const response = await fetch('/upload.php', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const fileType = file.type.startsWith('image/') ? 'image' :
                          file.type.startsWith('audio/') ? 'voice' :
                          file.type === 'application/pdf' ? 'pdf' : 'file';

          await sendMessage(file.name, fileType, {
            url: data.file_url,
            name: file.name,
            size: file.size
          });
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob) => {
    if (!selectedChat) return;

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.wav');
      formData.append('username', user.username);
      formData.append('contact_id', selectedChat.id);

      const response = await fetch('/upload_voice.php', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await sendMessage('Voice message', 'voice', {
            url: data.file_url,
            name: 'Voice message',
            size: audioBlob.size
          });
        }
      }
    } catch (error) {
      console.error('Error uploading voice message:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleScrollToTop = useCallback(() => {
    if (selectedChat && hasMoreMessages && !loading) {
      const currentLength = messages.length;
      loadMessages(selectedChat.id, 20, currentLength);
    }
  }, [selectedChat, hasMoreMessages, loading, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createGroup = async (groupName: string, members: string[]) => {
    try {
      const response = await fetch('/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${user.token}`
        },
        body: new URLSearchParams({
          data: 'create_group',
          username: user.username,
          group_name: groupName,
          members: JSON.stringify([user.username, ...members])
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newGroup: Chat = {
            id: `group_${data.group_id}`,
            name: groupName,
            isGroup: true,
            unreadCount: 0
          };

          setChats(prev => [newGroup, ...prev]);
          setShowGroupCreation(false);
        }
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const deleteMessage = async (messageId: number) => {
    try {
      const response = await fetch('/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${user.token}`
        },
        body: new URLSearchParams({
          data: 'delete_msg',
          username: user.username,
          message_id: messageId.toString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(prev => prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: 'This message was deleted', type: 'text' as any }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const markMessageAsRead = async (messageId: number) => {
    try {
      await fetch('/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${user.token}`
        },
        body: new URLSearchParams({
          data: 'mark_read',
          username: user.username,
          message_id: messageId.toString()
        })
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return (
    <div className="chat-app">
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Chats</h2>
          <button
            className="btn-create-group"
            onClick={() => setShowGroupCreation(true)}
          >
            + New Group
          </button>
        </div>

        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onChatSelect={setSelectedChat}
          currentUser={user.username}
        />
      </div>

      <div className="chat-main">
        {selectedChat ? (
          <ChatWindow
            ref={chatWindowRef}
            chat={selectedChat}
            messages={messages}
            currentUser={user.username}
            onSendMessage={sendMessage}
            onFileUpload={handleFileUpload}
            onVoiceRecording={handleVoiceRecording}
            onEmojiSelect={handleEmojiSelect}
            onScrollToTop={handleScrollToTop}
            onDeleteMessage={deleteMessage}
            onMarkAsRead={markMessageAsRead}
            hasMoreMessages={hasMoreMessages}
            loading={loading}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />
        ) : (
          <div className="no-chat-selected">
            <h3>Select a chat to start messaging</h3>
            <p>Choose from your contacts or create a new group</p>
          </div>
        )}
      </div>

      {showGroupCreation && (
        <GroupCreation
          onClose={() => setShowGroupCreation(false)}
          onCreateGroup={createGroup}
          currentUser={user.username}
        />
      )}

      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default ChatApp;
