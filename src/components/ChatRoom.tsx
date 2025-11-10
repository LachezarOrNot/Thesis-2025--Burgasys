import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../types';
import { databaseService } from '../services/database';
import { Send, Flag, AlertTriangle, MessageCircle, Edit, Trash2, X, Check, Palette, User, Crown, Shield } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ChatRoomProps {
  eventId: string;
  eventStatus: string;
}

type ChatTheme = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'dark';

const ChatRoom: React.FC<ChatRoomProps> = ({ eventId, eventStatus }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string>('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ChatTheme>('blue');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isChatActive = eventStatus === 'published';

  // Theme configurations
  const themes = {
    blue: {
      primary: 'bg-blue-500',
      secondary: 'bg-blue-600',
      light: 'bg-blue-100',
      text: 'text-blue-500',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600',
      hover: 'hover:bg-blue-600'
    },
    purple: {
      primary: 'bg-purple-500',
      secondary: 'bg-purple-600',
      light: 'bg-purple-100',
      text: 'text-purple-500',
      border: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-600',
      hover: 'hover:bg-purple-600'
    },
    green: {
      primary: 'bg-green-500',
      secondary: 'bg-green-600',
      light: 'bg-green-100',
      text: 'text-green-500',
      border: 'border-green-200',
      gradient: 'from-green-500 to-green-600',
      hover: 'hover:bg-green-600'
    },
    orange: {
      primary: 'bg-orange-500',
      secondary: 'bg-orange-600',
      light: 'bg-orange-100',
      text: 'text-orange-500',
      border: 'border-orange-200',
      gradient: 'from-orange-500 to-orange-600',
      hover: 'hover:bg-orange-600'
    },
    pink: {
      primary: 'bg-pink-500',
      secondary: 'bg-pink-600',
      light: 'bg-pink-100',
      text: 'text-pink-500',
      border: 'border-pink-200',
      gradient: 'from-pink-500 to-pink-600',
      hover: 'hover:bg-pink-600'
    },
    dark: {
      primary: 'bg-gray-700',
      secondary: 'bg-gray-800',
      light: 'bg-gray-600',
      text: 'text-gray-400',
      border: 'border-gray-600',
      gradient: 'from-gray-700 to-gray-800',
      hover: 'hover:bg-gray-600'
    }
  };

  const currentTheme = themes[selectedTheme];

  useEffect(() => {
    if (!eventId || !isChatActive) return;

    setSubscriptionError('');
    try {
      const unsubscribe = databaseService.subscribeToChatMessages(eventId, (chatMessages) => {
        setMessages(chatMessages);
        setSubscriptionError('');
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Failed to setup chat subscription:', error);
      setSubscriptionError('Failed to connect to chat');
    }
  }, [eventId, isChatActive, eventStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !isChatActive) return;

    setLoading(true);
    try {
      await databaseService.sendChatMessage({
        senderUid: user.uid,
        senderName: user.displayName || 'Anonymous',
        role: user.role,
        content: newMessage.trim(),
        eventId: eventId
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagMessage = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'chatMessages', messageId);
      await updateDoc(messageRef, { flagged: true });
      alert('Message flagged for moderator review');
    } catch (error) {
      console.error('Error flagging message:', error);
      alert('Failed to flag message');
    }
  };

  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) {
      alert('Message cannot be empty');
      return;
    }

    try {
      const messageRef = doc(db, 'chatMessages', messageId);
      await updateDoc(messageRef, {
        content: editContent.trim(),
        edited: true,
        editedAt: new Date()
      });
      setEditingMessageId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'chatMessages', messageId));
      setDeletingMessageId(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid time';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'organizer':
        return <Shield className="w-3 h-3 text-blue-500" />;
      default:
        return <User className="w-3 h-3 text-gray-500" />;
    }
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.senderUid === user?.uid;
  };

  if (!isChatActive) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg border border-gray-200 dark:border-gray-700">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          Chat is not available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          The chatroom is only active for published events.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col overflow-hidden">
      {/* Chat Header with Theme Picker */}
      <div className={`${currentTheme.primary} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Event Chat</h3>
              <p className="text-sm opacity-90">
                {messages.length} message{messages.length !== 1 ? 's' : ''} • {user?.displayName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {subscriptionError && (
              <div className="text-xs bg-red-500 px-3 py-1 rounded-full">
                Connection Issue
              </div>
            )}
            
            {/* Theme Picker */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                title="Change theme"
              >
                <Palette className="w-4 h-4" />
              </button>
              
              {showThemePicker && (
                <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-10">
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(themes).map(([themeKey, theme]) => (
                      <button
                        key={themeKey}
                        onClick={() => {
                          setSelectedTheme(themeKey as ChatTheme);
                          setShowThemePicker(false);
                        }}
                        className={`w-8 h-8 rounded-lg ${theme.primary} border-2 ${
                          selectedTheme === themeKey ? 'border-white ring-2 ring-white/50' : 'border-transparent'
                        } transition-all duration-200 hover:scale-110`}
                        title={themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {subscriptionError ? (
          <div className="text-center text-red-500 dark:text-red-400 py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <p className="font-medium mb-2">{subscriptionError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm underline hover:no-underline"
            >
              Retry Connection
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">Be the first to say hello!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  isOwnMessage(message) ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl p-4 shadow-sm ${
                    isOwnMessage(message)
                      ? `${currentTheme.primary} text-white rounded-br-md`
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
                  } ${message.flagged ? 'border-2 border-red-300 dark:border-red-600' : ''} transition-all duration-200 hover:shadow-md`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        isOwnMessage(message) ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {message.senderName}
                      </span>
                      {getRoleIcon(message.role)}
                      {message.flagged && <Flag className="w-3 h-3 text-red-500" />}
                    </div>
                    <span className={`text-xs ${
                      isOwnMessage(message) ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </span>
                  </div>

                  {/* Message Content */}
                  {editingMessageId === message.id ? (
                    <div className="mb-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        maxLength={500}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(message.id)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                  )}

                  {/* Message Footer */}
                  <div className="flex items-center justify-between mt-3">
                    {message.editedAt && (
                      <span className={`text-xs ${
                        isOwnMessage(message) ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        edited
                      </span>
                    )}
                    
                    <div className="flex items-center gap-1 ml-auto">
                      {isOwnMessage(message) && !editingMessageId && (
                        <>
                          <button
                            onClick={() => handleEditMessage(message)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isOwnMessage(message) 
                                ? 'hover:bg-white/20' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title="Edit message"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingMessageId(message.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isOwnMessage(message) 
                                ? 'hover:bg-white/20' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      {!isOwnMessage(message) && user?.role !== 'admin' && (
                        <button
                          onClick={() => handleFlagMessage(message.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Flag inappropriate message"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMessageId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Delete Message
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingMessageId(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(deletingMessageId)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading || !!subscriptionError || !!editingMessageId}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || loading || !!subscriptionError || !!editingMessageId}
              className={`px-6 py-3 ${currentTheme.primary} text-white rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:${currentTheme.hover} font-medium`}
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>
              {editingMessageId ? 'Currently editing a message' : 'Messages are visible to all event participants'}
            </span>
            <span>{500 - newMessage.length} characters left</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;