import { useChat as useChatContext } from '../context/ChatContext';

/**
 * Custom hook for chat operations
 * Provides convenient access to chat functionality
 * @returns {Object} Chat data and operations
 */
export const useChat = () => {
  const {
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
  } = useChatContext();

  /**
   * Send a message to the current chat
   * @param {string} text - Message text
   * @param {string} sender - Sender name (optional)
   */
  const sendChatMessage = (text, sender = 'You') => {
    sendMessage(text, sender);
  };

  /**
   * Create a new private chat group
   * @param {string} chatName - Chat name
   * @param {string} description - Chat description (optional)
   * @returns {Object|null} Created chat object or null
   */
  const createChat = (chatName, description = '') => {
    return createPrivateChat(chatName, description);
  };

  /**
   * Switch to a different chat
   * @param {string} chatId - Chat ID to switch to
   */
  const switchChat = (chatId) => {
    setChat(chatId);
  };

  /**
   * Get current chat information
   * @returns {Object|null} Current chat object or null
   */
  const currentChat = getCurrentChat();

  return {
    activeCityId,
    activeChatId,
    messages,
    privateChats,
    loading,
    currentChat,
    sendChatMessage,
    createChat,
    switchChat,
    setCity,
    loadMessages,
    loadPrivateChats
  };
};

export default useChat;
