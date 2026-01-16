import { io } from 'socket.io-client';

// Socket.io needs base URL without /api path
// Remove /api suffix if VITE_API_URL contains it
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return apiUrl.replace(/\/api\/?$/, '');
};
const SOCKET_URL = getSocketUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Connect to the WebSocket server
   * @param {string} token - JWT authentication token
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Join a city chat room
   * @param {string} cityId - City ID
   */
  joinCityChat(cityId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('join-city-chat', { cityId });
  }

  /**
   * Leave a city chat room
   * @param {string} cityId - City ID
   */
  leaveCityChat(cityId) {
    if (!this.socket) return;
    this.socket.emit('leave-city-chat', { cityId });
  }

  /**
   * Send a message to a city chat
   * @param {string} cityId - City ID
   * @param {string} content - Message content
   * @param {string} message_type - Message type (default: 'text')
   * @param {string} media_url - Media URL (optional)
   */
  sendCityMessage(cityId, content, message_type = 'text', media_url = null) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('send-city-message', {
      cityId,
      content,
      message_type,
      media_url
    });
  }

  /**
   * Send typing indicator for city chat
   * @param {string} cityId - City ID
   */
  sendCityTyping(cityId) {
    if (!this.socket) return;
    this.socket.emit('city-typing', { cityId });
  }

  /**
   * Send stop typing indicator for city chat
   * @param {string} cityId - City ID
   */
  sendCityStopTyping(cityId) {
    if (!this.socket) return;
    this.socket.emit('city-stop-typing', { cityId });
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    // Store the callback for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    this.socket.on(event, callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function (optional)
   */
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Remove from listeners map
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (!this.socket) return;
    this.socket.removeAllListeners(event);
    this.listeners.delete(event);
  }
}

// Export singleton instance
export default new SocketService();
