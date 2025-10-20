import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../types';
import { databaseService } from '../services/database';
import { Send, Flag, AlertTriangle, MessageCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ChatRoomProps {
  eventId: string;
  eventStatus: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ eventId, eventStatus }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isChatActive = eventStatus === 'published';

  useEffect(() => {
    if (!eventId || !isChatActive) {
      console.log('Chat not active - eventId:', eventId, 'status:', eventStatus);
      return;
    }

    console.log('Setting up chat subscription for event:', eventId);
    setSubscriptionError('');

    try {
      const unsubscribe = databaseService.subscribeToChatMessages(eventId, (chatMessages) => {
        console.log('Chat messages updated:', chatMessages);
        setMessages(chatMessages);
        setSubscriptionError('');
      });

      return () => {
        console.log('Cleaning up chat subscription');
        unsubscribe();
      };
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
      console.log('Sending message:', newMessage);
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
      // Mark message as flagged in the database
      const messageRef = doc(db, 'chatMessages', messageId);
      await updateDoc(messageRef, { flagged: true });
      alert('Message flagged for moderator review');
    } catch (error) {
      console.error('Error flagging message:', error);
      alert('Failed to flag message');
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

  if (!isChatActive) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Chat is not available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          The chatroom is only active for published events.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-[500px] flex flex-col">
      <div className="bg-primary-500 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Event Chat</h3>
            <p className="text-sm opacity-90">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
          {subscriptionError && (
            <div className="text-xs bg-red-500 px-2 py-1 rounded">
              Connection Issue
            </div>
          )}
        </div>
      </div>

      {/* Debug info - remove in production */}
      <div className="bg-yellow-50 dark:bg-yellow-900 px-4 py-2 text-xs text-yellow-800 dark:text-yellow-200">
        Debug: Event ID: {eventId} | User: {user?.uid} | Messages: {messages.length}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {subscriptionError ? (
          <div className="text-center text-red-500 dark:text-red-400 py-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>{subscriptionError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm underline mt-2"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet. Be the first to say hello!</p>
            <p className="text-sm mt-2">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderUid === user?.uid ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                  message.senderUid === user?.uid
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                } ${message.flagged ? 'border-2 border-red-300 dark:border-red-600' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium opacity-90">
                    {message.senderName}
                    {message.flagged && ' ⚐'}
                  </span>
                  <span className="text-xs opacity-75 ml-2 capitalize">
                    {message.role}
                  </span>
                </div>
                <p className="text-sm break-words">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-75">
                    {formatMessageTime(message.timestamp)}
                  </span>
                  {message.senderUid !== user?.uid && user?.role !== 'admin' && (
                    <button
                      onClick={() => handleFlagMessage(message.id)}
                      className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                      title="Flag inappropriate message"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-600">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading || !!subscriptionError}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading || !!subscriptionError}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Messages are visible to all event participants • {500 - newMessage.length} characters left
        </p>
      </form>
    </div>
  );
};

export default ChatRoom;