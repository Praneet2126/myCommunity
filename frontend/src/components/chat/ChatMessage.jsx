import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * ChatMessage component
 * Displays individual chat message with support for optimistic updates and images
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object with content, sender_id, createdAt
 */
function ChatMessage({ message }) {
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  // Handle both old mock format and new backend format
  const messageContent = message.content || message.text || '';
  const messageTime = message.createdAt || message.created_at || message.timestamp;
  const isPending = message._isPending || false;
  const messageType = message.message_type || 'text';
  const mediaUrl = message.media_url;
  
  // Check if message is from current user
  let isUser = false;
  let senderName = 'Unknown';
  
  if (message.sender_id) {
    // Backend format (can be object with populated user data or just ID string)
    if (typeof message.sender_id === 'object') {
      isUser = user && message.sender_id._id === user._id;
      senderName = message.sender_id.full_name || message.sender_id.username || 'User';
    } else {
      isUser = user && message.sender_id === user._id;
      senderName = 'User';
    }
  } else if (message.sender) {
    // Mock format fallback
    isUser = message.sender === 'You';
    senderName = message.sender;
  }
  
  const isSystem = message.type === 'system';
  const isImageMessage = messageType === 'image' && mediaUrl;

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
          {messageContent}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-xs md:max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
          {!isUser && (
            <div className="text-xs text-gray-500 mb-1 ml-1">
              {senderName}
            </div>
          )}
          <div
            className={`rounded-2xl ${isImageMessage ? 'p-1' : 'px-4 py-2'} ${
              isUser
                ? 'bg-[#FF6B35] text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            } ${isPending ? 'opacity-70' : ''}`}
          >
            {/* Image Message */}
            {isImageMessage ? (
              <div className="relative">
                {!imageLoaded && !imageError && (
                  <div className="w-48 h-48 flex items-center justify-center bg-gray-200 rounded-xl">
                    <svg className="w-8 h-8 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {imageError ? (
                  <div className="w-48 h-32 flex items-center justify-center bg-gray-200 rounded-xl">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs text-gray-500">Failed to load</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Shared image"
                    className={`max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity ${imageLoaded ? 'block' : 'hidden'}`}
                    style={{ maxHeight: '300px' }}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    onClick={() => setShowFullImage(true)}
                  />
                )}
                {messageContent && messageContent !== '[Image]' && (
                  <p className={`text-sm mt-2 px-2 pb-1 ${isUser ? 'text-white' : 'text-gray-800'}`}>
                    {messageContent}
                  </p>
                )}
              </div>
            ) : (
              /* Text Message */
              <p className="text-sm">{messageContent}</p>
            )}
            {message.is_edited && (
              <span className="text-xs opacity-70 ml-2">(edited)</span>
            )}
            {isPending && (
              <span className="text-xs opacity-70 ml-2">sending...</span>
            )}
          </div>
          <div
            className={`text-xs text-gray-400 mt-1 ${
              isUser ? 'text-right mr-1' : 'text-left ml-1'
            }`}
          >
            {formatTime(messageTime)}
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && isImageMessage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setShowFullImage(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setShowFullImage(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={mediaUrl}
            alt="Full size image"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default ChatMessage;
