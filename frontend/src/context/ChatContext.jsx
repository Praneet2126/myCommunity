import { createContext, useContext, useState, useEffect } from 'react';
import {
  getChatMessages,
  sendMessage as sendChatMessage,
  getPrivateChats,
  createPrivateChat as createChat,
  getChatById
} from '../services/chatService';

const ChatContext = createContext();

/**
 * ChatContext Provider
 * Manages chat messages and active chat selection
 * Placeholder for future WebSocket integration
 */
export const ChatProvider = ({ children }) => {
  const [activeCityId, setActiveCityId] = useState(null);
  const [activeChatId, setActiveChatId] = useState('public');
  const [messages, setMessages] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Load messages for current city and chat
   */
  useEffect(() => {
    if (activeCityId && activeChatId) {
      loadMessages();
    }
  }, [activeCityId, activeChatId]);

  /**
   * Load private chats for current city
   */
  useEffect(() => {
    if (activeCityId) {
      loadPrivateChats();
    }
  }, [activeCityId]);

  /**
   * Load messages from service
   */
  const loadMessages = () => {
    if (!activeCityId || !activeChatId) return;
    
    setLoading(true);
    const chatMessages = getChatMessages(activeCityId, activeChatId);
    setMessages(chatMessages);
    setLoading(false);
  };

  /**
   * Load private chats from service
   */
  const loadPrivateChats = () => {
    if (!activeCityId) return;
    
    const chats = getPrivateChats(activeCityId);
    setPrivateChats(chats);
  };

  /**
   * Send a message
   * @param {string} text - Message text
   * @param {string} sender - Sender name
   */
  const sendMessage = (text, sender = 'You') => {
    if (!activeCityId || !activeChatId || !text.trim()) return;
    
    const newMessage = sendChatMessage(activeCityId, activeChatId, text, sender);
    setMessages(prev => [...prev, newMessage]);
  };

  /**
   * Create a new private chat
   * @param {string} chatName - Chat name
   * @param {string} description - Chat description
   * @returns {Object} Created chat object
   */
  const createPrivateChat = (chatName, description = '') => {
    if (!activeCityId || !chatName.trim()) return null;
    
    const newChat = createChat(activeCityId, chatName, description);
    loadPrivateChats();
    return newChat;
  };

  /**
   * Set active city and reset chat to public
   * @param {string} cityId - City ID
   */
  const setCity = (cityId) => {
    setActiveCityId(cityId);
    setActiveChatId('public');
  };

  /**
   * Set active chat
   * @param {string} chatId - Chat ID
   */
  const setChat = (chatId) => {
    setActiveChatId(chatId);
  };

  /**
   * Get current chat info
   * @returns {Object|null} Chat object or null
   */
  const getCurrentChat = () => {
    if (!activeCityId || !activeChatId) return null;
    return getChatById(activeCityId, activeChatId);
  };

  const value = {
    activeCityId,
    activeChatId,
    messages,
    privateChats,
    loading,
    sendMessage,
    createPrivateChat,
    setCity,
    setChat,
    getCurrentChat,
    loadMessages,
    loadPrivateChats
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Hook to use ChatContext
 * @returns {Object} Chat context value
 */
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
