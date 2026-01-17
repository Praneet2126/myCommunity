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
  // Track active chat ID in a ref for socket handlers
  const activeChatIdRef = useRef('public');

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

      // Only process city messages when viewing public chat
      if (activeChatIdRef.current !== 'public') {
        console.log('Ignoring city message - currently viewing private chat');
        return;
      }
      
      const incomingMessage = {
        _id: data._id,
        content: data.content,
        sender_id: data.sender_id,
        message_type: data.message_type,
        media_url: data.media_url,
        createdAt: data.createdAt || data.created_at,
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

    // ==================== PRIVATE CHAT HANDLERS ====================
    
    // Handle new private chat messages
    const handleNewPrivateMessage = (data) => {
      console.log('Received new private message:', data);

      // Only process if we're viewing this specific private chat
      if (activeChatIdRef.current !== data.chatId) {
        console.log('Ignoring private message - not viewing this chat');
        return;
      }
      
      const incomingMessage = {
        _id: data._id,
        content: data.content,
        sender_id: data.sender_id,
        message_type: data.message_type,
        media_url: data.media_url,
        createdAt: data.createdAt || data.created_at,
        is_edited: data.is_edited,
        is_deleted: data.is_deleted
      };

      // Check if this is a confirmation of our own optimistic message
      const senderId = typeof data.sender_id === 'object' ? data.sender_id._id : data.sender_id;
      const isOwnMessage = user && senderId === user._id;
      
      if (isOwnMessage) {
        const pendingKey = `${senderId}-${data.content}`;
        const pendingTempId = pendingMessagesRef.current.get(pendingKey);
        
        if (pendingTempId) {
          setMessages(prev => prev.map(msg => 
            msg._id === pendingTempId ? incomingMessage : msg
          ));
          pendingMessagesRef.current.delete(pendingKey);
        } else {
          setMessages(prev => {
            const exists = prev.some(msg => msg._id === data._id);
            if (exists) return prev;
            return [...prev, incomingMessage];
          });
        }
      } else {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === data._id);
          if (exists) return prev;
          return [...prev, incomingMessage];
        });
      }
    };

    // Handle joined private chat confirmation
    const handleJoinedPrivateChat = (data) => {
      console.log('Joined private chat:', data.chatName);
    };

    // Handle user joined private chat notification
    const handleUserJoinedPrivateChat = (data) => {
      console.log('User joined private chat:', data.username);
    };

    // Handle user left private chat notification
    const handleUserLeftPrivateChat = (data) => {
      console.log('User left private chat:', data.username);
    };

    // Register event listeners - CITY CHAT
    socketService.on('new-city-message', handleNewCityMessage);
    socketService.on('joined-city-chat', handleJoinedCityChat);
    socketService.on('user-joined-city-chat', handleUserJoinedCityChat);
    socketService.on('user-left-city-chat', handleUserLeftCityChat);
    socketService.on('error', handleError);

    // Register event listeners - PRIVATE CHAT
    socketService.on('new-private-message', handleNewPrivateMessage);
    socketService.on('joined-private-chat', handleJoinedPrivateChat);
    socketService.on('user-joined-private-chat', handleUserJoinedPrivateChat);
    socketService.on('user-left-private-chat', handleUserLeftPrivateChat);

    // Cleanup listeners on unmount
    return () => {
      // City chat listeners
      socketService.off('new-city-message', handleNewCityMessage);
      socketService.off('joined-city-chat', handleJoinedCityChat);
      socketService.off('user-joined-city-chat', handleUserJoinedCityChat);
      socketService.off('user-left-city-chat', handleUserLeftCityChat);
      socketService.off('error', handleError);
      // Private chat listeners
      socketService.off('new-private-message', handleNewPrivateMessage);
      socketService.off('joined-private-chat', handleJoinedPrivateChat);
      socketService.off('user-joined-private-chat', handleUserJoinedPrivateChat);
      socketService.off('user-left-private-chat', handleUserLeftPrivateChat);
      listenersRegistered.current = false;
    };
  }, [socketConnected, user]);

  /**
   * Load messages from API
   */
  const loadMessages = useCallback(async (cityId) => {
    const targetCityId = cityId || activeCityId;
    if (!targetCityId || !token) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/ed889ba1-73d9-4a1d-bf22-c8e51587df89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H1',location:'frontend/src/context/ChatContext.jsx:loadMessages',message:'loadMessages:skipped',data:{hasCityId:!!targetCityId,hasToken:!!token},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return;
    }
    
    try {
      setLoading(true);
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      // VITE_API_URL may already include `/api` (e.g. http://localhost:3000/api).
      // Normalize so we always produce exactly one `/api` in the final URL.
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      const url = `${BASE_URL}/api/cities/${targetCityId}/chat/messages`;

      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/ed889ba1-73d9-4a1d-bf22-c8e51587df89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H2',location:'frontend/src/context/ChatContext.jsx:loadMessages',message:'loadMessages:request',data:{apiUrlEnv:import.meta.env.VITE_API_URL?true:false,computedUrl:url,cityId:targetCityId},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/ed889ba1-73d9-4a1d-bf22-c8e51587df89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H2',location:'frontend/src/context/ChatContext.jsx:loadMessages',message:'loadMessages:responseJsonParseFailed',data:{status:response.status,ok:response.ok},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        throw e;
      }

      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/ed889ba1-73d9-4a1d-bf22-c8e51587df89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H3',location:'frontend/src/context/ChatContext.jsx:loadMessages',message:'loadMessages:response',data:{status:response.status,ok:response.ok,success:!!data?.success,count:Array.isArray(data?.data)?data.data.length:null,message:data?.message||null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/ed889ba1-73d9-4a1d-bf22-c8e51587df89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'D2',location:'frontend/src/context/ChatContext.jsx:loadMessages',message:'rest:history:firstMessageTimestampFields',data:{firstHasCreatedAt:data?.data?.[0]?.createdAt!=null,firstHasCreated_at:data?.data?.[0]?.created_at!=null,firstKeys:data?.data?.[0]?Object.keys(data.data[0]).slice(0,20):[],count:Array.isArray(data?.data)?data.data.length:null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      if (data.success) {
        const normalized = (data.data || []).map((m) => ({
          ...m,
          createdAt: m.createdAt || m.created_at
        }));
        setMessages(normalized);
        // Clear any pending messages when loading fresh data
        pendingMessagesRef.current.clear();
      } else {
        console.error('loadMessages: API error', data.message);
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
    
    // Load messages for the new city (only if on public chat)
    if (activeChatId === 'public') {
      loadMessages(activeCityId);
    }

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/ed889ba1-73d9-4a1d-bf22-c8e51587df89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H4',location:'frontend/src/context/ChatContext.jsx:joinEffect',message:'joinEffect:joinedAndRequestedLoad',data:{activeCityId, socketConnected:true, hasToken:!!token},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    
  }, [activeCityId, socketConnected, loadMessages, activeChatId]);

  /**
   * Load messages when token becomes available (handles page reload case)
   */
  useEffect(() => {
    // If we have a city set and token just became available, load messages
    // Only load public chat messages if we're on public chat
    if (activeCityId && token && messages.length === 0 && !loading && activeChatId === 'public') {
      console.log('Token available, loading messages for city:', activeCityId);
      loadMessages(activeCityId);
    }
  }, [token, activeCityId, messages.length, loading, loadMessages, activeChatId]);

  /**
   * Send a message via WebSocket (both public and private chats)
   * @param {string} text - Message text
   */
  const sendMessage = (text) => {
    const trimmedText = text.trim();
    
    if (!trimmedText || !user) {
      console.error('Cannot send message: missing text or user not logged in');
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

    if (activeChatId === 'public') {
      // Send to public city chat via WebSocket
      if (!activeCityId || !socketConnected) {
        console.error('Cannot send public message: missing cityId or socket not connected');
        return;
      }
      socketService.sendCityMessage(activeCityId, trimmedText);
    } else {
      // Send to private chat via WebSocket
      if (!socketConnected) {
        console.error('Cannot send private message: socket not connected');
        // Remove optimistic message
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        pendingMessagesRef.current.delete(pendingKey);
        return;
      }
      socketService.sendPrivateMessage(activeChatId, trimmedText);
    }
  };

  /**
   * Create a new private chat
   * @param {string} chatName - Chat name
   * @param {string} description - Chat description
   * @param {Array} participants - Array of participant user objects with _id
   * @returns {Object} Created chat object
   */
  const createPrivateChat = async (chatName, description = '', participants = []) => {
    if (!activeCityId || !token) {
      console.error('Cannot create private chat: no active city or not authenticated');
      return null;
    }

    try {
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const participant_ids = participants.map(p => p._id);
      
      const response = await fetch(`${BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: chatName,
          description,
          city_id: activeCityId,
          participant_ids
        })
      });

      const data = await response.json();

      if (data.success) {
        // Transform to frontend format and add to state
        const newChat = {
          id: data.data._id,
          name: data.data.name,
          description: data.data.description,
          cityId: data.data.city_id?._id || data.data.city_id,
          cityName: data.data.city_id?.displayName || data.data.city_id?.name,
          createdBy: data.data.created_by,
          createdAt: data.data.created_at
        };
        
        setPrivateChats(prev => [...prev, newChat]);
        return newChat;
      } else {
        console.error('Failed to create private chat:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error creating private chat:', error);
      return null;
    }
  };

  /**
   * Set active city and reset chat to public
   * @param {string} cityId - City ID
   */
  const setCity = (cityId) => {
    // Only update if city actually changed
    if (activeCityId === cityId) {
      // Even if same city, try to load messages if we don't have any
      if (messages.length === 0 && token && !loading) {
        loadMessages(cityId);
      }
      return;
    }

    // Leave current private chat room if in one
    if (activeChatId !== 'public' && socketConnected) {
      socketService.leavePrivateChat(activeChatId);
    }
    
    setActiveCityId(cityId);
    setActiveChatId('public');
    setMessages([]);
    pendingMessagesRef.current.clear();
    
    // Reset the current city ref so the effect will join the new city
    currentCityRef.current = null;
  };

  // Keep activeChatIdRef in sync with activeChatId state
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  /**
   * Load messages for a private chat
   * @param {string} chatId - Private chat ID
   */
  const loadPrivateChatMessages = useCallback(async (chatId) => {
    if (!chatId || !token) return;

    try {
      setLoading(true);
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      const url = `${BASE_URL}/api/chats/${chatId}/messages`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const normalized = (data.data || []).map((m) => ({
          ...m,
          createdAt: m.createdAt || m.created_at
        }));
        setMessages(normalized);
        pendingMessagesRef.current.clear();
      } else {
        console.error('loadPrivateChatMessages: API error', data.message);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading private chat messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Set active chat and load appropriate messages
   * @param {string} chatId - Chat ID ('public' or private chat ID)
   */
  const setChat = (chatId) => {
    if (activeChatId === chatId) return;
    
    // Leave previous private chat room if switching from private chat
    if (activeChatId !== 'public' && socketConnected) {
      socketService.leavePrivateChat(activeChatId);
    }
    
    setActiveChatId(chatId);
    setMessages([]); // Clear messages when switching chats
    pendingMessagesRef.current.clear();

    // Load appropriate messages and join rooms
    if (chatId === 'public') {
      // Load city public chat messages
      if (activeCityId) {
        loadMessages(activeCityId);
      }
    } else {
      // Join private chat WebSocket room
      if (socketConnected) {
        socketService.joinPrivateChat(chatId);
      }
      // Load private chat messages
      loadPrivateChatMessages(chatId);
    }
  };

  /**
   * Get current chat info
   * @returns {Object|null} Chat object or null
   */
  const getCurrentChat = () => {
    if (!activeChatId) return null;
    
    if (activeChatId === 'public') {
      return {
        id: 'public',
        name: 'Public Chat',
        description: 'Public group chat for everyone',
        type: 'public'
      };
    }
    
    // Find the private chat
    const privateChat = privateChats.find(chat => chat.id === activeChatId);
    if (privateChat) {
      return {
        ...privateChat,
        type: 'private'
      };
    }
    
    return null;
  };

  /**
   * Load user's private chats from API
   */
  const loadPrivateChats = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Transform to frontend format
        const chats = (data.data || []).map(chat => ({
          id: chat._id,
          name: chat.name,
          description: chat.description,
          cityId: chat.city_id?._id || chat.city_id,
          cityName: chat.city_id?.displayName || chat.city_id?.name,
          createdBy: chat.created_by,
          createdAt: chat.created_at,
          lastMessageAt: chat.last_message_at
        }));
        
        setPrivateChats(chats);
      }
    } catch (error) {
      console.error('Error loading private chats:', error);
    }
  }, [token]);

  /**
   * Load private chats when user authenticates
   */
  useEffect(() => {
    if (token) {
      loadPrivateChats();
    }
  }, [token, loadPrivateChats]);

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
    loadPrivateChats,
    loadPrivateChatMessages
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
