import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sendMessage, getMessages, markMessagesAsRead } from '../../lib/chat';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Message = Database['public']['Tables']['chats']['Row'] & {
  profiles: {
    name: string;
    avatar_url: string | null;
  };
};

interface ChatWindowProps {
  bookingId: string;
  recipientId: string;
  recipientName: string;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  bookingId, 
  recipientId, 
  recipientName,
  onClose 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { messages: chatMessages, error } = await getMessages(bookingId);
        if (error) throw error;
        setMessages(chatMessages || []);
        setLocalMessages(chatMessages || []);
        scrollToBottom();

        // Mark messages from the other person as read
        if (chatMessages?.some(msg => msg.sender_id === recipientId && !msg.read)) {
          await markMessagesAsRead(bookingId, recipientId);
        }
      } catch (err) {
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chats',
        filter: `booking_id=eq.${bookingId}`
      }, async (payload) => {
        const { messages: updated } = await getMessages(bookingId);
        setMessages(updated || []);
        setLocalMessages(updated || []);
        scrollToBottom();

        // Mark messages as read if they're from the other person
        if (payload.new.sender_id === recipientId) {
          await markMessagesAsRead(bookingId, recipientId);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user?.id });
        }
      });

    // Set up reconnection logic
    const handleDisconnect = () => {
      setIsConnected(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        channel.subscribe();
      }, 5000);
    };

    window.addEventListener('offline', handleDisconnect);
    window.addEventListener('online', () => {
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    return () => {
      window.removeEventListener('offline', handleDisconnect);
      window.removeEventListener('online', () => {});
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      channel.unsubscribe();
    };
  }, [bookingId, recipientId, user?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    try {
      setSending(true);
      const { error } = await sendMessage(bookingId, user.id, newMessage.trim());
      if (error) throw error;

      // Optimistically add message to local state
      const optimisticMessage: Message = {
        id: Date.now().toString(),
        booking_id: bookingId,
        sender_id: user.id,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false,
        profiles: {
          name: user.email?.split('@')[0] || 'You',
          avatar_url: null
        }
      };
      setLocalMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-lg items-center justify-center">
        <Loader className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-2 text-gray-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between bg-blue-50">
        <div className="flex items-center space-x-3">
          <img
            src={`https://ui-avatars.com/api/?name=${recipientName}&background=random`}
            alt={recipientName}
            className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{recipientName}</h3>
            <div className="flex items-center space-x-2">
              {isTyping && (
                <span className="text-sm text-blue-600 animate-pulse">typing...</span>
              )}
              {!isConnected && (
                <span className="text-sm text-red-600">Reconnecting...</span>
              )}
            </div>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-blue-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {localMessages.map((message, index) => {
          const isOwnMessage = message.sender_id === user?.id;
          const showAvatar = index === 0 || 
            localMessages[index - 1].sender_id !== message.sender_id;

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`flex items-end space-x-2 max-w-[70%] ${
                  isOwnMessage ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                {showAvatar && (
                  <img
                    src={message.profiles.avatar_url || 
                      `https://ui-avatars.com/api/?name=${message.profiles.name}&background=random`}
                    alt={message.profiles.name}
                    className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                  />
                )}
                <div
                  className={`rounded-lg p-3 ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                  <div className="flex items-center justify-end mt-1 text-xs opacity-75 space-x-1">
                    <span>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isOwnMessage && message.read && (
                      <span className="text-blue-200">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="p-2 text-sm text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending || !isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};