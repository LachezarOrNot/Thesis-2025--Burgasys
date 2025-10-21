import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../types';
import { databaseService } from '../services/database';
import { Send, Flag, AlertTriangle, MessageCircle, Edit, Trash2, X, Check } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
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

  const confirmDelete = (messageId: string) => {
    setDeletingMessageId(messageId);
  };

  const cancelDelete = () => {
    setDeletingMessageId(null);
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

  const formatEditTime = (timestamp: Date) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid time';
    }
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.senderUid === user?.uid;
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

                {/* Message Content or Edit Input */}
                {editingMessageId === message.id ? (
                  <div className="mb-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white dark:bg-gray-800 resize-none"
                      rows={3}
                      maxLength={500}
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Cancel edit"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(message.id)}
                        className="p-1 text-green-500 hover:text-green-700"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm break-words">{message.content}</p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs opacity-75">
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {message.editedAt && (
                      <span className="text-xs opacity-50" title={`Edited at ${formatEditTime(message.editedAt!)}`}>
                        (edited)
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {isOwnMessage(message) && !editingMessageId && (
                      <>
                        <button
                          onClick={() => handleEditMessage(message)}
                          className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                          title="Edit message"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => confirmDelete(message.id)}
                          className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {!isOwnMessage(message) && user?.role !== 'admin' && (
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
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMessageId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Delete Message
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(deletingMessageId)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-600">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading || !!subscriptionError || !!editingMessageId}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading || !!subscriptionError || !!editingMessageId}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Messages are visible to all event participants • {500 - newMessage.length} characters left
          {editingMessageId && ' • Currently editing a message'}
        </p>
      </form>
    </div>
  );
};

export default ChatRoom;