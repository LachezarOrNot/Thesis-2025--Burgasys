// src/components/ChatRoom.tsx - VideoCall now uses Agora
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
  Download,
  ZoomIn,
  Smile,
  Video
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTranslation } from 'react-i18next';
import VideoCall from './VideoCall'; // Now uses Jitsi - NO CONFIG NEEDED!

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
  const [showVideoCall, setShowVideoCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isChatActive = eventStatus === 'published';

  // Enhanced theme configurations with modern glassmorphism and vibrant gradients
  const themes = {
    blue: {
      primary: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600',
      secondary: 'bg-blue-600',
      light: 'bg-blue-50/80',
      text: 'text-blue-600',
      border: 'border-blue-300/30',
      gradient: 'from-blue-500 via-cyan-500 to-indigo-600',
      hover: 'hover:from-blue-600 hover:via-cyan-600 hover:to-indigo-700',
      glow: 'shadow-blue-500/30',
      accent: 'bg-blue-500',
      glass: 'bg-blue-500/10 backdrop-blur-xl border-blue-400/20',
      ring: 'ring-blue-400/50'
    },
    purple: {
      primary: 'bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-600',
      secondary: 'bg-purple-600',
      light: 'bg-purple-50/80',
      text: 'text-purple-600',
      border: 'border-purple-300/30',
      gradient: 'from-purple-500 via-fuchsia-500 to-pink-600',
      hover: 'hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-700',
      glow: 'shadow-purple-500/30',
      accent: 'bg-purple-500',
      glass: 'bg-purple-500/10 backdrop-blur-xl border-purple-400/20',
      ring: 'ring-purple-400/50'
    },
    green: {
      primary: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600',
      secondary: 'bg-green-600',
      light: 'bg-green-50/80',
      text: 'text-green-600',
      border: 'border-green-300/30',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      hover: 'hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700',
      glow: 'shadow-green-500/30',
      accent: 'bg-emerald-500',
      glass: 'bg-emerald-500/10 backdrop-blur-xl border-emerald-400/20',
      ring: 'ring-emerald-400/50'
    },
    orange: {
      primary: 'bg-gradient-to-br from-orange-500 via-amber-500 to-red-600',
      secondary: 'bg-orange-600',
      light: 'bg-orange-50/80',
      text: 'text-orange-600',
      border: 'border-orange-300/30',
      gradient: 'from-orange-500 via-amber-500 to-red-600',
      hover: 'hover:from-orange-600 hover:via-amber-600 hover:to-red-700',
      glow: 'shadow-orange-500/30',
      accent: 'bg-orange-500',
      glass: 'bg-orange-500/10 backdrop-blur-xl border-orange-400/20',
      ring: 'ring-orange-400/50'
    },
    pink: {
      primary: 'bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600',
      secondary: 'bg-pink-600',
      light: 'bg-pink-50/80',
      text: 'text-pink-600',
      border: 'border-pink-300/30',
      gradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
      hover: 'hover:from-pink-600 hover:via-rose-600 hover:to-fuchsia-700',
      glow: 'shadow-pink-500/30',
      accent: 'bg-pink-500',
      glass: 'bg-pink-500/10 backdrop-blur-xl border-pink-400/20',
      ring: 'ring-pink-400/50'
    },
    dark: {
      primary: 'bg-gradient-to-br from-slate-800 via-gray-900 to-zinc-950',
      secondary: 'bg-gray-800',
      light: 'bg-gray-700/80',
      text: 'text-gray-300',
      border: 'border-gray-600/30',
      gradient: 'from-slate-800 via-gray-900 to-zinc-950',
      hover: 'hover:from-slate-700 hover:via-gray-800 hover:to-zinc-900',
      glow: 'shadow-gray-900/50',
      accent: 'bg-gray-700',
      glass: 'bg-gray-900/40 backdrop-blur-xl border-gray-700/20',
      ring: 'ring-gray-600/50'
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

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
        const maxWidth = 800;
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
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
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const optimizedBlob = await optimizeImage(file);
      const optimizedFile = new File([optimizedBlob], file.name, { type: 'image/jpeg' });
      const base64String = await fileToBase64(optimizedFile);
      
      await handleSendImage(base64String);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
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
        content: '',
        image: base64String,
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

  // Handle Video Call button click - Jitsi needs NO configuration!
  const handleStartVideoCall = () => {
    console.log('Starting Jitsi video call for event:', eventId);
    setShowVideoCall(true);
  };

  if (!isChatActive) {
    return (
      <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 rounded-[2rem] p-16 text-center shadow-2xl border border-orange-200/30 dark:border-gray-700/30 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-[1.5rem] mb-8 shadow-2xl shadow-orange-500/30 animate-pulse">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            {t('chat.chatNotAvailable')}
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            {t('chat.chatNotAvailableDescription')}
          </p>
        </div>
      </div>
    );
  }

  // Show video call if active
  if (showVideoCall) {
    return (
      <VideoCall 
        eventId={eventId}
        onClose={() => setShowVideoCall(false)}
        userName={user?.displayName || 'Guest'}
      />
    );
  }

  return (
    <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-gray-200/50 dark:border-gray-700/50 h-[650px] flex flex-col overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br ${currentTheme.gradient} opacity-5 blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr ${currentTheme.gradient} opacity-5 blur-3xl animate-pulse`} style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Ultra-modern Chat Header with Video Call Button */}
      <div className={`relative ${currentTheme.primary} text-white p-6 shadow-2xl overflow-hidden`}>
        {/* Animated shine effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
          style={{ animation: 'shimmer 3s infinite' }}
        ></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/30 rounded-[1.25rem] blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[1.25rem] flex items-center justify-center shadow-2xl border border-white/30 transform hover:scale-110 hover:rotate-3 transition-all duration-300">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-3 border-white shadow-lg">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-2xl tracking-tight mb-1">{t('chat.title')}</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xl px-3 py-1.5 rounded-full text-xs font-semibold border border-white/30 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>{messages.length}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium opacity-90">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>{user?.displayName}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {subscriptionError && (
              <div className="text-xs bg-gradient-to-r from-red-500 to-orange-500 px-5 py-2.5 rounded-full shadow-2xl font-bold animate-bounce border border-white/30">
                {t('chat.connectionIssue')}
              </div>
            )}

            {/* Video Call Button */}
            <button
              onClick={handleStartVideoCall}
              className="group relative p-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-[0.875rem] transition-all duration-300 shadow-xl border border-white/30 hover:scale-110"
              title="Start Video Call"
            >
              <Video className="w-5 h-5" />
              <div className="absolute inset-0 bg-white/20 rounded-[0.875rem] opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </button>
            
            {/* Ultra-modern Theme Picker */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="group relative p-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-[0.875rem] transition-all duration-300 shadow-xl border border-white/30 hover:scale-110 hover:rotate-12"
                title={t('chat.changeTheme')}
              >
                <Palette className="w-5 h-5" />
                <div className="absolute inset-0 bg-white/20 rounded-[0.875rem] opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
              </button>
              
              {showThemePicker && (
                <div className="absolute top-[4.5rem] right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 z-20 min-w-[240px]">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Choose Your Vibe
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(themes).map(([themeKey, theme]) => (
                      <button
                        key={themeKey}
                        onClick={() => {
                          setSelectedTheme(themeKey as ChatTheme);
                          setShowThemePicker(false);
                        }}
                        className={`relative group`}
                        title={t(`chat.themes.${themeKey}`)}
                      >
                        <div className={`w-12 h-12 rounded-[0.875rem] ${theme.primary} border-2 ${
                          selectedTheme === themeKey 
                            ? 'border-white ring-4 ring-gray-200 dark:ring-gray-700 scale-110' 
                            : 'border-gray-200/50 dark:border-gray-700/50 hover:scale-105'
                        } transition-all duration-200 shadow-lg hover:shadow-2xl relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                          {selectedTheme === themeKey && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                              <Check className="w-6 h-6 text-white drop-shadow-2xl" />
                            </div>
                          )}
                        </div>
                        <div className="text-[0.65rem] font-medium text-gray-600 dark:text-gray-400 mt-1.5 capitalize">{themeKey}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                      Video Call Info
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p className="flex items-center gap-2">
                        <Video className="w-3.5 h-3.5" />
                        Powered by Jitsi Meet
                      </p>
                      <p className="text-green-500 font-medium mt-1">
                        ✓ No configuration needed!
                      </p>
                      <p className="text-green-500 font-medium">
                        ✓ 100% Free forever
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container with enhanced styling */}
      <div className="relative flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50/50 via-white/30 to-gray-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50">
        {subscriptionError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[2rem] p-10 max-w-sm shadow-2xl border border-red-200/50 dark:border-red-800/50">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-[1.5rem] mb-6 shadow-2xl shadow-red-500/30 animate-pulse">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-4">{subscriptionError}</p>
              <button 
                onClick={() => window.location.reload()}
                className={`text-sm bg-gradient-to-r ${currentTheme.gradient} text-white px-8 py-3.5 rounded-xl ${currentTheme.hover} transition-all duration-300 font-bold shadow-xl hover:shadow-2xl hover:scale-105`}
              >
                {t('chat.retryConnection')}
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-[1.75rem] blur-2xl opacity-50"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-[1.75rem] flex items-center justify-center shadow-2xl border border-gray-300/50 dark:border-gray-600/50">
                  <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('chat.noMessages')}</p>
              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">{t('chat.noMessagesDescription')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  isOwnMessage(message) ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-4 duration-500`}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div
                  className={`relative max-w-xs lg:max-w-md group ${
                    isOwnMessage(message)
                      ? 'rounded-[1.75rem] rounded-br-md'
                      : 'rounded-[1.75rem] rounded-bl-md'
                  } ${message.flagged ? 'ring-2 ring-red-400 dark:ring-red-600' : ''} transition-all duration-300 hover:scale-[1.02]`}
                >
                  {/* Glow effect */}
                  <div className={`absolute -inset-1 ${
                    isOwnMessage(message) 
                      ? `${currentTheme.primary} opacity-0 group-hover:opacity-30` 
                      : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 opacity-0 group-hover:opacity-20'
                  } rounded-[1.75rem] blur-xl transition-all duration-300`}></div>
                  
                  <div className={`relative p-5 ${
                    isOwnMessage(message)
                      ? `${currentTheme.primary} text-white shadow-2xl ${currentTheme.glow} border border-white/20`
                      : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white shadow-xl border-2 border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl'
                  }`}>
                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-sm font-bold ${
                          isOwnMessage(message) ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {message.senderName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className={`p-1 rounded-lg ${isOwnMessage(message) ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            {getRoleIcon(message.role)}
                          </div>
                          {message.flagged && (
                            <div className="p-1 bg-red-500/20 rounded-lg backdrop-blur-sm">
                              <Flag className="w-3.5 h-3.5 text-red-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${
                        isOwnMessage(message) ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
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
                          className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                          rows={3}
                          maxLength={500}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2.5 mt-3">
                          <button
                            onClick={handleCancelEdit}
                            className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            {t('chat.cancelEdit')}
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 text-sm font-bold shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-105"
                          >
                            {t('chat.saveEdit')}
                          </button>
                        </div>
                      </div>
                    ) : message.image ? (
                      <div className="mb-2">
                        <div className="relative group/image overflow-hidden rounded-2xl">
                          <img
                            src={message.image}
                            alt="Chat image"
                            className="max-w-full h-auto rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105"
                            onClick={() => openImageModal(message.image!)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-all duration-300"></div>
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover/image:opacity-100 transition-all duration-300 flex gap-2">
                            <button
                              onClick={() => openImageModal(message.image!)}
                              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-xl transition-all hover:scale-110 border border-white/30 shadow-xl"
                              title="View full size"
                            >
                              <ZoomIn className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={() => downloadImage(message.image!, `chat-image-${message.id}.jpg`)}
                              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-xl transition-all hover:scale-110 border border-white/30 shadow-xl"
                              title="Download image"
                            >
                              <Download className="w-4 h-4 text-white" />
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
                      <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    )}

                    {/* Message Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 dark:border-gray-700/50">
                      {message.editedAt && (
                        <span className={`text-xs italic font-medium ${
                          isOwnMessage(message) ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {t('chat.edited')}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1.5 ml-auto">
                        {isOwnMessage(message) && !editingMessageId && (
                          <>
                            <button
                              onClick={() => handleEditMessage(message)}
                              className={`p-2.5 rounded-xl transition-all duration-200 ${
                                isOwnMessage(message) 
                                  ? 'hover:bg-white/20' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              } hover:scale-110 group/btn`}
                              title={t('chat.editMessage')}
                            >
                              <Edit className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                            </button>
                            <button
                              onClick={() => setDeletingMessageId(message.id)}
                              className={`p-2.5 rounded-xl transition-all duration-200 ${
                                isOwnMessage(message) 
                                  ? 'hover:bg-white/20' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              } hover:scale-110 group/btn`}
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                            </button>
                          </>
                        )}
                        {!isOwnMessage(message) && user?.role !== 'admin' && (
                          <button
                            onClick={() => handleFlagMessage(message.id)}
                            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110 group/btn"
                            title={t('chat.flagMessage')}
                          >
                            <Flag className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
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

      {/* Enhanced Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="relative max-w-5xl max-h-full w-full">
            <button
              onClick={closeImageModal}
              className="absolute -top-16 right-0 p-3 text-white hover:text-gray-300 transition-all hover:scale-110 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xl border border-white/20"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={selectedImage}
                alt="Full size chat image"
                className="max-w-full max-h-[85vh] w-auto h-auto mx-auto rounded-2xl"
              />
              <div className="absolute bottom-6 right-6 flex gap-3">
                <button
                  onClick={() => downloadImage(selectedImage, 'chat-image.jpg')}
                  className="p-4 bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-xl transition-all hover:scale-110 border border-white/30 shadow-2xl group"
                  title="Download image"
                >
                  <Download className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-modern Delete Confirmation Modal */}
      {deletingMessageId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-[2rem] p-10 max-w-md w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50 animate-in zoom-in-95 duration-300">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-[1.5rem] blur-2xl opacity-50"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-red-400/50">
                <Trash2 className="w-9 h-9 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t('chat.deleteMessage.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-base">
              {t('chat.deleteMessage.message')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingMessageId(null)}
                className="flex-1 px-6 py-4 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold rounded-xl transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {t('chat.deleteMessage.cancel')}
              </button>
              <button
                onClick={() => handleDeleteMessage(deletingMessageId)}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:via-orange-600 hover:to-red-700 font-bold shadow-2xl hover:shadow-red-500/50 transition-all hover:scale-105"
              >
                {t('chat.deleteMessage.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-modern Message Input */}
      <div className="relative p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl">
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="flex gap-3">
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
              className="relative group p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-[1.125rem] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-xl shadow-lg border border-gray-300/50 dark:border-gray-600/50"
              title="Upload image"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-[1.125rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {uploadingImage ? (
                <div className="w-6 h-6 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 relative z-10 group-hover:rotate-12 transition-transform" />
              )}
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('chat.typeMessage')}
                disabled={loading || !!subscriptionError || !!editingMessageId || uploadingImage}
                className="w-full px-6 py-4 pr-16 border-2 border-gray-200 dark:border-gray-700 rounded-[1.125rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white disabled:opacity-50 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-lg hover:shadow-xl font-medium backdrop-blur-xl"
                maxLength={500}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">
                  {500 - newMessage.length}
                </span>
                <Smile className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={(!newMessage.trim() && !uploadingImage) || loading || !!subscriptionError || !!editingMessageId || uploadingImage}
              className={`relative px-8 py-4 ${currentTheme.primary} text-white rounded-[1.125rem] transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-2xl ${currentTheme.glow} font-bold group overflow-hidden border border-white/20`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {uploadingImage ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="relative z-10">Uploading...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 relative z-10 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  <span className="relative z-10">{loading ? t('chat.sending') : t('chat.send')}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className={`font-bold flex items-center gap-2 ${
              editingMessageId 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {editingMessageId && <Edit className="w-3.5 h-3.5" />}
              {editingMessageId ? t('chat.editingMessage') : t('chat.messagesVisible')}
            </span>
            <span className="text-gray-400 dark:text-gray-500 font-medium">{t('chat.charactersLeft')}</span>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ChatRoom;