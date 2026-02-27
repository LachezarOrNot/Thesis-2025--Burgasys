import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../types';
import { databaseService } from '../services/database';
import { 
  Send, 
  Video,
  Phone,
  Smile,
  Image as ImageIcon,
  X,
  Check,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import { doc, setDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTranslation } from 'react-i18next';
import VideoCall from './VideoCall';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface ChatRoomProps {
  eventId: string;
  eventStatus: string;
}

interface ActiveCall {
  eventId: string;
  startedBy: string;
  startedByName: string;
  startedAt: number;
  participants: string[];
}

type ChatTheme = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red';

const ChatRoom: React.FC<ChatRoomProps> = ({ eventId, eventStatus }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [showCallNotification, setShowCallNotification] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [selectedTheme, setSelectedTheme] = useState<ChatTheme>(() => {
    const saved = localStorage.getItem('chatTheme');
    return (saved as ChatTheme) || 'blue';
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isChatActive = eventStatus === 'published';

  const themes = {
    blue: {
      primary: 'bg-blue-500',
      hover: 'hover:bg-blue-600',
      light: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500 to-blue-600'
    },
    purple: {
      primary: 'bg-purple-500',
      hover: 'hover:bg-purple-600',
      light: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-500 to-purple-600'
    },
    green: {
      primary: 'bg-green-500',
      hover: 'hover:bg-green-600',
      light: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      gradient: 'from-green-500 to-green-600'
    },
    orange: {
      primary: 'bg-orange-500',
      hover: 'hover:bg-orange-600',
      light: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      gradient: 'from-orange-500 to-orange-600'
    },
    pink: {
      primary: 'bg-pink-500',
      hover: 'hover:bg-pink-600',
      light: 'bg-pink-50 dark:bg-pink-900/20',
      text: 'text-pink-600 dark:text-pink-400',
      gradient: 'from-pink-500 to-pink-600'
    },
    red: {
      primary: 'bg-red-500',
      hover: 'hover:bg-red-600',
      light: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      gradient: 'from-red-500 to-red-600'
    }
  };

  const currentTheme = themes[selectedTheme];

  const changeTheme = (theme: ChatTheme) => {
    setSelectedTheme(theme);
    localStorage.setItem('chatTheme', theme);
  };

  useEffect(() => {
    if (!eventId) return;

    const callRef = doc(db, 'activeCalls', eventId);
    const unsubscribe = onSnapshot(callRef, (snapshot) => {
      if (snapshot.exists()) {
        const callData = snapshot.data() as ActiveCall;
        setActiveCall(callData);
        
        if (!showVideoCall && callData.startedBy !== user?.uid) {
          setShowCallNotification(true);
        }
      } else {
        setActiveCall(null);
        setShowCallNotification(false);
      }
    });

    return () => unsubscribe();
  }, [eventId, showVideoCall, user?.uid]);

  useEffect(() => {
    if (!eventId || !isChatActive) return;

    const unsubscribe = databaseService.subscribeToChatMessages(eventId, (chatMessages) => {
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [eventId, isChatActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !isChatActive || loading) return;

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
    } finally {
      setLoading(false);
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

  const handleFlagMessage = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'chatMessages', messageId);
      await updateDoc(messageRef, { flagged: true });
      alert('Message flagged for review');
    } catch (error) {
      console.error('Error flagging message:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    try {
      setUploadingImage(true);
      const file = files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        await databaseService.sendChatMessage({
          senderUid: user.uid,
          senderName: user.displayName || 'Anonymous',
          role: user.role,
          content: '',
          image: base64String,
          eventId: eventId
        });
        
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startCall = async () => {
    try {
      const callRef = doc(db, 'activeCalls', eventId);
      await setDoc(callRef, {
        eventId,
        startedBy: user?.uid ?? `anon-${Date.now()}`,
        startedByName: user?.displayName || 'Guest',
        startedAt: Date.now(),
        participants: user?.uid ? [user.uid] : []
      });

      setShowVideoCall(true);
      setShowCallNotification(false);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const joinCall = () => {
    setShowVideoCall(true);
    setShowCallNotification(false);
  };

  const endCall = useCallback(async () => {
    setShowVideoCall(false);

    if (activeCall && user && activeCall.startedBy === user.uid) {
      try {
        const callRef = doc(db, 'activeCalls', eventId);
        await deleteDoc(callRef);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
  }, [eventId, activeCall, user?.uid]);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwnMessage = (message: ChatMessage) => message.senderUid === user?.uid;

  const handleAddEmoji = (emoji: any) => {
    if (!emoji) return;
    const symbol = emoji.native || emoji.colons || '';
    if (!symbol) return;
    setNewMessage(prev => `${prev}${symbol}`);
    setShowEmojiPicker(false);
  };

  if (!isChatActive) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-xl">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Chat Not Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chat will be available when the event is published
          </p>
        </div>
      </div>
    );
  }

  if (showVideoCall) {
    return (
      <VideoCall 
        eventId={eventId}
        onClose={endCall}
        userName={user?.displayName || 'Guest'}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${currentTheme.gradient} rounded-full flex items-center justify-center`}>
            <span className="text-white font-semibold text-sm">
              {user?.displayName?.charAt(0) || 'E'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Event Chat
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {messages.length} messages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="relative group">
            <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
              <div className={`w-5 h-5 rounded-full ${currentTheme.primary}`}></div>
            </button>
            <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 hidden group-hover:block z-10">
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => changeTheme(key as ChatTheme)}
                    className={`w-8 h-8 rounded-full ${theme.primary} ${
                      selectedTheme === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    title={key}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={activeCall ? joinCall : startCall}
            className={`p-2.5 ${currentTheme.primary} ${currentTheme.hover} rounded-full transition-all active:scale-95`}
            title={activeCall ? "Join ongoing call" : "Start video call"}
          >
            <Video className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Call Notification */}
      {showCallNotification && activeCall && (
        <div className={`bg-gradient-to-r ${currentTheme.gradient} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {activeCall.startedByName} started a call
              </p>
              <p className="text-white/80 text-xs">Tap to join</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={joinCall}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium"
            >
              <Phone className="w-4 h-4 inline mr-1" />
              Join
            </button>
            <button
              onClick={() => setShowCallNotification(false)}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className={`w-16 h-16 ${currentTheme.light} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Send className={`w-8 h-8 ${currentTheme.text}`} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No messages yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Be the first to say hello!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] md:max-w-md ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                {!isOwnMessage(message) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3">
                    {message.senderName}
                  </p>
                )}
                
                {editingMessageId === message.id ? (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(message.id)}
                        className={`px-3 py-1 text-xs text-white ${currentTheme.primary} ${currentTheme.hover} rounded`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`group relative rounded-2xl px-4 py-2.5 ${
                      isOwnMessage(message)
                        ? `${currentTheme.primary} text-white rounded-br-sm`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                    }`}>
                      {message.image ? (
                        <img
                          src={message.image}
                          alt="Shared image"
                          className="rounded-lg max-w-full h-auto cursor-pointer"
                          onClick={() => window.open(message.image, '_blank')}
                        />
                      ) : (
                        <p className="text-sm break-words">{message.content}</p>
                      )}
                      
                      {/* Message actions */}
                      <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {isOwnMessage(message) && !message.image && (
                          <>
                            <button
                              onClick={() => handleEditMessage(message)}
                              className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                              title="Edit"
                            >
                              <Edit className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => setDeletingMessageId(message.id)}
                              className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </button>
                          </>
                        )}
                        {!isOwnMessage(message) && (
                          <button
                            onClick={() => handleFlagMessage(message.id)}
                            className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="Flag"
                          >
                            <Flag className="w-3 h-3 text-orange-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-1 px-3">
                      <span className={`text-xs ${isOwnMessage(message) ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatTime(message.timestamp)}
                      </span>
                      {message.edited && (
                        <span className="text-xs text-gray-400 italic">edited</span>
                      )}
                      {isOwnMessage(message) && (
                        <Check className={`w-3 h-3 ${currentTheme.text}`} />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all disabled:opacity-50"
          >
            {uploadingImage ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              disabled={loading}
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500 text-sm"
            />
            {newMessage.trim() && (
              <button
                type="submit"
                disabled={loading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 ${currentTheme.text} hover:opacity-80 font-semibold text-sm disabled:opacity-50`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send'
                )}
              </button>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(prev => !prev)}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
            >
              <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-40">
                <Picker
                  data={data}
                  onEmojiSelect={handleAddEmoji}
                  theme="auto"
                  previewPosition="none"
                  emojiButtonSize={30}
                  emojiSize={18}
                />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMessageId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Message?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This message will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingMessageId(null)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(deletingMessageId)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;