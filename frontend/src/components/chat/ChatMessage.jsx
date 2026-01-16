import { useAuth } from '../../context/AuthContext';

/**
 * ChatMessage component
 * Displays individual chat message with support for optimistic updates
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object with content, sender_id, createdAt
 */
function ChatMessage({ message }) {
  const { user } = useAuth();
  
  // Handle both old mock format and new backend format
  const messageContent = message.content || message.text || '';
  const messageTime = message.createdAt || message.timestamp;
  const isPending = message._isPending || false;
  
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
          className={`rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-[#FF6B35] text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          } ${isPending ? 'opacity-70' : ''}`}
        >
          <p className="text-sm">{messageContent}</p>
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
  );
}

export default ChatMessage;
