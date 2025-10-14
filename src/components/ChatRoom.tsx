import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../types';
import { databaseService } from '../services/database';
import { Send, Flag, AlertTriangle } from 'lucide-react';

interface ChatRoomProps {
  eventId: string;
  eventStatus: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ eventId, eventStatus }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isChatActive = eventStatus === 'published';

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
    } finally {
      setLoading(false);
    }
  };

  const handleFlagMessage = (messageId: string) => {
    alert('Message flagged for moderator review');
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
        <h3 className="font-semibold">Event Chat</h3>
        <p className="text-sm opacity-90">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>No messages yet. Be the first to say hello!</p>
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
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium opacity-90">
                    {message.senderName}
                  </span>
                  <span className="text-xs opacity-75 ml-2">
                    {message.role}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-75">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.senderUid !== user?.uid && (
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
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Messages are visible to all event participants
        </p>
      </form>
    </div>
  );
};

export default ChatRoom;