/**
 * ChatMessage component
 * Displays individual chat message
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object with text, sender, timestamp, type
 */
function ChatMessage({ message }) {
  const isSystem = message.type === 'system';
  const isUser = message.sender === 'You';

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
          {message.text}
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
            {message.sender}
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-[#FF6B35] text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
        <div
          className={`text-xs text-gray-400 mt-1 ${
            isUser ? 'text-right mr-1' : 'text-left ml-1'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
