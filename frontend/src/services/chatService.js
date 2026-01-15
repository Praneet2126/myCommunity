// Mock chat data storage (in-memory, will be replaced with backend/WebSocket)
let chatMessages = {};
let privateChats = {};

/**
 * Initialize default public chat for a city
 * @param {string} cityId - City ID
 */
const initializePublicChat = (cityId) => {
  if (!chatMessages[cityId]) {
    chatMessages[cityId] = {
      public: [
        {
          id: '1',
          text: `Welcome to ${cityId} public chat! Start connecting with fellow travelers.`,
          sender: 'System',
          timestamp: new Date().toISOString(),
          type: 'system'
        }
      ]
    };
  }
};

/**
 * Get messages for a chat
 * @param {string} cityId - City ID
 * @param {string} chatId - Chat ID ('public' or private chat ID)
 * @returns {Array} Array of message objects
 */
export const getChatMessages = (cityId, chatId) => {
  initializePublicChat(cityId);
  
  if (!chatMessages[cityId]) {
    chatMessages[cityId] = {};
  }
  
  if (chatId === 'public') {
    return chatMessages[cityId].public || [];
  }
  
  return chatMessages[cityId][chatId] || [];
};

/**
 * Send a message to a chat
 * @param {string} cityId - City ID
 * @param {string} chatId - Chat ID
 * @param {string} text - Message text
 * @param {string} sender - Sender name (default: 'You')
 * @returns {Object} Created message object
 */
export const sendMessage = (cityId, chatId, text, sender = 'You') => {
  initializePublicChat(cityId);
  
  if (!chatMessages[cityId]) {
    chatMessages[cityId] = {};
  }
  
  if (!chatMessages[cityId][chatId]) {
    chatMessages[cityId][chatId] = [];
  }
  
  const message = {
    id: Date.now().toString(),
    text,
    sender,
    timestamp: new Date().toISOString(),
    type: 'user'
  };
  
  chatMessages[cityId][chatId].push(message);
  return message;
};

/**
 * Get all private chats for a city
 * @param {string} cityId - City ID
 * @returns {Array} Array of private chat objects
 */
export const getPrivateChats = (cityId) => {
  if (!privateChats[cityId]) {
    privateChats[cityId] = [];
  }
  return privateChats[cityId];
};

/**
 * Create a new private chat
 * @param {string} cityId - City ID
 * @param {string} chatName - Name of the private chat
 * @param {string} description - Description of the chat
 * @returns {Object} Created chat object
 */
export const createPrivateChat = (cityId, chatName, description = '') => {
  if (!privateChats[cityId]) {
    privateChats[cityId] = [];
  }
  
  const chatId = `private_${Date.now()}`;
  const chat = {
    id: chatId,
    name: chatName,
    description,
    cityId,
    createdAt: new Date().toISOString(),
    memberCount: 1
  };
  
  privateChats[cityId].push(chat);
  
  // Initialize empty message array for this chat
  if (!chatMessages[cityId]) {
    chatMessages[cityId] = {};
  }
  chatMessages[cityId][chatId] = [
    {
      id: '1',
      text: `Welcome to ${chatName}!`,
      sender: 'System',
      timestamp: new Date().toISOString(),
      type: 'system'
    }
  ];
  
  return chat;
};

/**
 * Get chat by ID
 * @param {string} cityId - City ID
 * @param {string} chatId - Chat ID
 * @returns {Object|null} Chat object or null
 */
export const getChatById = (cityId, chatId) => {
  if (chatId === 'public') {
    return {
      id: 'public',
      name: `${cityId.charAt(0).toUpperCase() + cityId.slice(1)} Public Chat`,
      description: 'Public group chat for everyone',
      type: 'public'
    };
  }
  
  const privateChatsList = getPrivateChats(cityId);
  return privateChatsList.find(chat => chat.id === chatId) || null;
};
