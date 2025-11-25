import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../types';
import { databaseService } from '../services/database';
import { 
  Send, 
  Flag, 
  AlertTriangle, 
  MessageCircle, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Palette, 
  User, 
  Crown, 
  Shield, 
  Sparkles,
  Image as ImageIcon,
  Upload,
  Download
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTranslation } from 'react-i18next';

interface ChatRoomProps {
  eventId: string;
  eventStatus: string;
}

type ChatTheme = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'dark';

const ChatRoom: React.FC<ChatRoomProps> = ({ eventId, eventStatus }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string>('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ChatTheme>('blue');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isChatActive = eventStatus === 'published';

  // Enhanced theme configurations with gradients and modern colors
  const themes = {
    blue: {
      primary: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600',
      secondary: 'bg-blue-600',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-indigo-600',
      hover: 'hover:from-blue-600 hover:to-indigo-700',
      glow: 'shadow-blue-500/50',
      accent: 'bg-blue-500'
    },
    purple: {
      primary: 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600',
      secondary: 'bg-purple-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      gradient: 'from-purple-500 to-pink-600',
      hover: 'hover:from-purple-600 hover:to-pink-700',
      glow: 'shadow-purple-500/50',
      accent: 'bg-purple-500'
    },
    green: {
      primary: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600',
      secondary: 'bg-green-600',
      light: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      gradient: 'from-emerald-500 to-teal-600',
      hover: 'hover:from-emerald-600 hover:to-teal-700',
      glow: 'shadow-green-500/50',
      accent: 'bg-emerald-500'
    },
    orange: {
      primary: 'bg-gradient-to-br from-orange-500 via-orange-600 to-red-600',
      secondary: 'bg-orange-600',
      light: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      gradient: 'from-orange-500 to-red-600',
      hover: 'hover:from-orange-600 hover:to-red-700',
      glow: 'shadow-orange-500/50',
      accent: 'bg-orange-500'
    },
    pink: {
      primary: 'bg-gradient-to-br from-pink-500 via-rose-600 to-fuchsia-600',
      secondary: 'bg-pink-600',
      light: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-200',
      gradient: 'from-pink-500 to-fuchsia-600',
      hover: 'hover:from-pink-600 hover:to-fuchsia-700',
      glow: 'shadow-pink-500/50',
      accent: 'bg-pink-500'
    },
    dark: {
      primary: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black',
      secondary: 'bg-gray-800',
      light: 'bg-gray-700',
      text: 'text-gray-400',
      border: 'border-gray-600',
      gradient: 'from-gray-800 to-black',
      hover: 'hover:from-gray-700 hover:to-gray-900',
      glow: 'shadow-gray-900/50',
      accent: 'bg-gray-700'
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
      setSubscriptionError(t('chat.connectionIssue'));
    }
  }, [eventId, isChatActive, eventStatus, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Convert file to Base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Optimize image by reducing quality and size
  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max width 800px)
        const maxWidth = 800;
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw and compress with 80% quality
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      // Optimize image first
      const optimizedBlob = await optimizeImage(file);
      const optimizedFile = new File([optimizedBlob], file.name, { type: 'image/jpeg' });

      // Convert to Base64
      const base64String = await fileToBase64(optimizedFile);
      
      // Send image message
      await handleSendImage(base64String);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendImage = async (base64String: string) => {
    if (!user || !isChatActive) return;

    setLoading(true);
    try {
      await databaseService.sendChatMessage({
        senderUid: user.uid,
        senderName: user.displayName || 'Anonymous',
        role: user.role,
        content: '', // Empty content for image messages
        image: base64String, // Store image as Base64 string
        eventId: eventId
      });
    } catch (error) {
      console.error('Error sending image message:', error);
      alert('Failed to send image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'organizer':
        return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.senderUid === user?.uid;
  };

  const downloadImage = (base64String: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64String;
    link.download = filename || 'chat-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openImageModal = (base64String: string) => {
    setSelectedImage(base64String);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (!isChatActive) {
    return (
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-12 text-center shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 dark:from-yellow-500/10 dark:to-orange-500/10"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl mb-6 shadow-lg shadow-yellow-500/25">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('chat.chatNotAvailable')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            {t('chat.chatNotAvailableDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 h-[650px] flex flex-col overflow-hidden backdrop-blur-xl">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 pointer-events-none"></div>

      {/* Enhanced Chat Header */}
      <div className={`relative ${currentTheme.primary} text-white p-6 shadow-lg`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold text-xl tracking-tight">{t('chat.title')}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>{messages.length} {t(messages.length === 1 ? 'chat.messages' : 'chat.messages_plural')}</span>
                </div>
                <span className="text-sm opacity-90">• {user?.displayName}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {subscriptionError && (
              <div className="text-xs bg-red-500 px-4 py-2 rounded-full shadow-lg animate-pulse font-medium">
                {t('chat.connectionIssue')}
              </div>
            )}
            
            {/* Enhanced Theme Picker */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="group p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                title={t('chat.changeTheme')}
              >
                <Palette className="w-5 h-5 transform group-hover:rotate-12 transition-transform" />
              </button>
              
              {showThemePicker && (
                <div className="absolute top-16 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-20 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Choose Theme</div>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(themes).map(([themeKey, theme]) => (
                      <button
                        key={themeKey}
                        onClick={() => {
                          setSelectedTheme(themeKey as ChatTheme);
                          setShowThemePicker(false);
                        }}
                        className={`relative w-10 h-10 rounded-xl ${theme.primary} border-2 ${
                          selectedTheme === themeKey 
                            ? 'border-white ring-4 ring-white/30 scale-110' 
                            : 'border-transparent hover:scale-105'
                        } transition-all duration-200 shadow-lg hover:shadow-xl group`}
                        title={t(`chat.themes.${themeKey}`)}
                      >
                        {selectedTheme === themeKey && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container with enhanced styling */}
      <div className="relative flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
        {subscriptionError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-red-200 dark:border-red-800">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-3">{subscriptionError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                {t('chat.retryConnection')}
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-3xl mb-6 shadow-xl">
                <MessageCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('chat.noMessages')}</p>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{t('chat.noMessagesDescription')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  isOwnMessage(message) ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className={`relative max-w-xs lg:max-w-md rounded-3xl p-5 shadow-xl backdrop-blur-sm ${
                    isOwnMessage(message)
                      ? `${currentTheme.primary} text-white rounded-br-lg`
                      : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border-2 border-gray-200/50 dark:border-gray-700/50 rounded-bl-lg'
                  } ${message.flagged ? 'ring-2 ring-red-400 dark:ring-red-600' : ''} transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] group`}
                >
                  {/* Message glow effect */}
                  {isOwnMessage(message) && (
                    <div className={`absolute -inset-0.5 ${currentTheme.primary} rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity`}></div>
                  )}
                  
                  <div className="relative">
                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          isOwnMessage(message) ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {message.senderName}
                        </span>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(message.role)}
                          {message.flagged && (
                            <div className="p-1 bg-red-500/20 rounded-full">
                              <Flag className="w-3 h-3 text-red-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${
                        isOwnMessage(message) ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>

                    {/* Message Content - Text or Image */}
                    {editingMessageId === message.id ? (
                      <div className="mb-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          rows={3}
                          maxLength={500}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                          >
                            {t('chat.cancelEdit')}
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all"
                          >
                            {t('chat.saveEdit')}
                          </button>
                        </div>
                      </div>
                    ) : message.image ? (
                      // Image Message
                      <div className="mb-2">
                        <div className="relative group/image">
                          <img
                            src={message.image}
                            alt="Chat image"
                            className="max-w-full h-auto rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-2xl"
                            onClick={() => openImageModal(message.image!)}
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 flex gap-1">
                            <button
                              onClick={() => openImageModal(message.image!)}
                              className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-all hover:scale-110"
                              title="View full size"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-white" />
                            </button>
                            <button
                              onClick={() => downloadImage(message.image!, `chat-image-${message.id}.jpg`)}
                              className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-all hover:scale-110"
                              title="Download image"
                            >
                              <Download className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        </div>
                        {message.content && (
                          <p className="text-sm leading-relaxed break-words mt-3">
                            {message.content}
                          </p>
                        )}
                      </div>
                    ) : (
                      // Text Message
                      <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    )}

                    {/* Message Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                      {message.editedAt && (
                        <span className={`text-xs italic ${
                          isOwnMessage(message) ? 'text-white/50' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {t('chat.edited')}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1 ml-auto">
                        {isOwnMessage(message) && !editingMessageId && (
                          <>
                            <button
                              onClick={() => handleEditMessage(message)}
                              className={`p-2 rounded-xl transition-all ${
                                isOwnMessage(message) 
                                  ? 'hover:bg-white/20' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              } hover:scale-110`}
                              title={t('chat.editMessage')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingMessageId(message.id)}
                              className={`p-2 rounded-xl transition-all ${
                                isOwnMessage(message) 
                                  ? 'hover:bg-white/20' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              } hover:scale-110`}
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!isOwnMessage(message) && user?.role !== 'admin' && (
                          <button
                            onClick={() => handleFlagMessage(message.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-110"
                            title={t('chat.flagMessage')}
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Full size chat image"
              className="max-w-full max-h-full rounded-lg"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={() => downloadImage(selectedImage, 'chat-image.jpg')}
                className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all hover:scale-110"
                title="Download image"
              >
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {deletingMessageId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50 animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-5 shadow-lg">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {t('chat.deleteMessage.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {t('chat.deleteMessage.message')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingMessageId(null)}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold rounded-xl transition-all hover:scale-105"
              >
                {t('chat.deleteMessage.cancel')}
              </button>
              <button
                onClick={() => handleDeleteMessage(deletingMessageId)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                {t('chat.deleteMessage.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Message Input */}
      <div className="relative p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex gap-3">
            {/* Image Upload Button */}
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
              disabled={loading || !!subscriptionError || !!editingMessageId || uploadingImage}
              className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg group"
              title="Upload image"
            >
              {uploadingImage ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
              )}
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('chat.typeMessage')}
                disabled={loading || !!subscriptionError || !!editingMessageId || uploadingImage}
                className="w-full px-5 py-4 pr-12 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white disabled:opacity-50 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm hover:shadow-md"
                maxLength={500}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                {500 - newMessage.length}
              </div>
            </div>
            <button
              type="submit"
              disabled={(!newMessage.trim() && !uploadingImage) || loading || !!subscriptionError || !!editingMessageId || uploadingImage}
              className={`relative px-8 py-4 ${currentTheme.primary} text-white rounded-2xl transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-2xl ${currentTheme.glow} font-semibold group overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              {uploadingImage ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="relative z-10">Uploading...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 relative z-10 transform group-hover:translate-x-1 transition-transform" />
                  <span className="relative z-10">{loading ? t('chat.sending') : t('chat.send')}</span>
                </>
              )}
            </button>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className={`font-medium ${
              editingMessageId 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {editingMessageId ? t('chat.editingMessage') : t('chat.messagesVisible')}
            </span>
            <span className="text-gray-400 dark:text-gray-500">{t('chat.charactersLeft')}</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;