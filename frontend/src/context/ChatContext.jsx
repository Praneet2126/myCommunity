import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

/**
 * ChatContext Provider
 * Manages chat messages and active chat selection with WebSocket integration
 */
export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [activeCityId, setActiveCityId] = useState(null);
  const [activeChatId, setActiveChatId] = useState('public');
  const [messages, setMessages] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Use refs to prevent re-render loops
  const socketInitialized = useRef(false);
  const currentCityRef = useRef(null);
  const listenersRegistered = useRef(false);
  // Track pending optimistic messages for deduplication
  const pendingMessagesRef = useRef(new Map());

  /**
   * Initialize socket connection when user is authenticated
   */
  useEffect(() => {
    if (user && token && !socketInitialized.current) {
      socketInitialized.current = true;
      socketService.connect(token);

      // Set up connection status listeners (only once)
      socketService.on('connect', () => {
        console.log('Socket connected in ChatContext');
        setSocketConnected(true);
      });

      socketService.on('disconnect', () => {
        console.log('Socket disconnected in ChatContext');
        setSocketConnected(false);
      });

      // Initial connection status
      setSocketConnected(socketService.isConnected());
    }

    return () => {
      // Only disconnect if user logs out
      if (!user && socketInitialized.current) {
        socketService.disconnect();
        socketInitialized.current = false;
        listenersRegistered.current = false;
        setSocketConnected(false);
      }
    };
  }, [user, token]);

  /**
   * Set up socket event listeners for city chat (only once)
   */
  useEffect(() => {
    if (!socketConnected || listenersRegistered.current) return;
    
    listenersRegistered.current = true;

    // Handle new city messages (including broadcast of own messages)
    const handleNewCityMessage = (data) => {
      console.log('Received new city message:', data);
      
      const incomingMessage = {
        _id: data._id,
        content: data.content,
        sender_id: data.sender_id,
        message_type: data.message_type,
        media_url: data.media_url,
        createdAt: data.createdAt,
        is_edited: data.is_edited,
        is_deleted: data.is_deleted
      };

      // Check if this is a confirmation of our own optimistic message
      const senderId = typeof data.sender_id === 'object' ? data.sender_id._id : data.sender_id;
      const isOwnMessage = user && senderId === user._id;
      
      if (isOwnMessage) {
        // Find and replace optimistic message with confirmed server message
        const pendingKey = `${senderId}-${data.content}`;
        const pendingTempId = pendingMessagesRef.current.get(pendingKey);
        
        if (pendingTempId) {
          // Replace optimistic message with server-confirmed message
          setMessages(prev => prev.map(msg => 
            msg._id === pendingTempId ? incomingMessage : msg
          ));
          pendingMessagesRef.current.delete(pendingKey);
        } else {
          // Message wasn't in pending (maybe loaded from history), check for duplicates
          setMessages(prev => {
            const exists = prev.some(msg => msg._id === data._id);
            if (exists) return prev;
            return [...prev, incomingMessage];
          });
        }
      } else {
        // Message from another user - just add it
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === data._id);
          if (exists) return prev;
          return [...prev, incomingMessage];
        });
      }
    };

    // Handle joined city chat confirmation
    const handleJoinedCityChat = (data) => {
      console.log('Joined city chat:', data.cityName);
    };

    // Handle user joined notification
    const handleUserJoinedCityChat = (data) => {
      console.log('User joined city chat:', data.username);
    };

    // Handle user left notification
    const handleUserLeftCityChat = (data) => {
      console.log('User left city chat:', data.username);
    };

    // Handle socket errors
    const handleError = (error) => {
      console.error('Socket error:', error);
    };

    // Register event listeners
    socketService.on('new-city-message', handleNewCityMessage);
    socketService.on('joined-city-chat', handleJoinedCityChat);
    socketService.on('user-joined-city-chat', handleUserJoinedCityChat);
    socketService.on('user-left-city-chat', handleUserLeftCityChat);
    socketService.on('error', handleError);

    // Cleanup listeners on unmount
    return () => {
      socketService.off('new-city-message', handleNewCityMessage);
      socketService.off('joined-city-chat', handleJoinedCityChat);
      socketService.off('user-joined-city-chat', handleUserJoinedCityChat);
      socketService.off('user-left-city-chat', handleUserLeftCityChat);
      socketService.off('error', handleError);
      listenersRegistered.current = false;
    };
  }, [socketConnected, user]);

  /**
   * Load messages from API
   */
  const loadMessages = useCallback(async (cityId) => {
    const targetCityId = cityId || activeCityId;
    if (!targetCityId || !token) return;
    
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${API_URL}/api/cities/${targetCityId}/chat/messages`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data || []);
        // Clear any pending messages when loading fresh data
        pendingMessagesRef.current.clear();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [token, activeCityId]);

  /**
   * Join city chat room when city changes
   */
  useEffect(() => {
    if (!activeCityId || !socketConnected) return;
    
    // Avoid re-joining the same city
    if (currentCityRef.current === activeCityId) return;
    
    // Leave previous city if different
    if (currentCityRef.current && currentCityRef.current !== activeCityId) {
      socketService.leaveCityChat(currentCityRef.current);
    }
    
    // Join new city
    currentCityRef.current = activeCityId;
    socketService.joinCityChat(activeCityId);
    
    // Load messages for the new city
    loadMessages(activeCityId);
    
  }, [activeCityId, socketConnected, loadMessages]);

  /**
   * Send a message via WebSocket with optimistic UI update
   * @param {string} text - Message text
   */
  const sendMessage = (text) => {
    const trimmedText = text.trim();
    
    if (!activeCityId || !trimmedText || !socketConnected || !user) {
      console.error('Cannot send message: missing cityId, text, socket not connected, or user not logged in');
      return;
    }
    
    // Create optimistic message with temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      _id: tempId,
      content: trimmedText,
      sender_id: {
        _id: user._id,
        username: user.username,
        full_name: user.full_name,
        profile_photo_url: user.profile_photo_url
      },
      message_type: 'text',
      media_url: null,
      createdAt: new Date().toISOString(),
      is_edited: false,
      is_deleted: false,
      _isPending: true // Mark as pending for potential UI indication
    };

    // Track this optimistic message for deduplication when server confirms
    const pendingKey = `${user._id}-${trimmedText}`;
    pendingMessagesRef.current.set(pendingKey, tempId);

    // Immediately add to UI (optimistic update)
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Send via socket
    socketService.sendCityMessage(activeCityId, trimmedText);
  };

  /**
   * Create a new private chat (placeholder for future implementation)
   * @param {string} chatName - Chat name
   * @param {string} description - Chat description
   * @returns {Object} Created chat object
   */
  const createPrivateChat = (chatName, description = '') => {
    console.log('Private chat creation not yet implemented');
    return null;
  };

  /**
   * Set active city and reset chat to public
   * @param {string} cityId - City ID
   */
  const setCity = (cityId) => {
    // Only update if city actually changed
    if (activeCityId === cityId) return;
    
    setActiveCityId(cityId);
    setActiveChatId('public');
    setMessages([]);
    pendingMessagesRef.current.clear();
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
    
    if (activeChatId === 'public') {
      return {
        id: 'public',
        name: 'Public Chat',
        description: 'Public group chat for everyone',
        type: 'public'
      };
    }
    
    return null;
  };

  /**
   * Load private chats (placeholder for future implementation)
   */
  const loadPrivateChats = () => {
    console.log('Private chats loading not yet implemented');
  };

  const value = {
    activeCityId,
    activeChatId,
    messages,
    privateChats,
    loading,
    socketConnected,
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
