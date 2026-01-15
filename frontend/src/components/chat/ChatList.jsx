import { useState } from 'react';
import CreatePrivateChat from './CreatePrivateChat';

/**
 * ChatList component
 * Sidebar showing list of available chats (public + private)
 * @param {Object} props - Component props
 * @param {Array} props.privateChats - Array of private chat objects
 * @param {string} props.activeChatId - Currently active chat ID
 * @param {Function} props.onSelectChat - Callback when chat is selected
 * @param {Function} props.onCreateChat - Callback to create new private chat
 * @param {string} props.cityName - Name of the city
 */
function ChatList({
  privateChats,
  activeChatId,
  onSelectChat,
  onCreateChat,
  cityName
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateChat = (chatName, description) => {
    onCreateChat(chatName, description);
    setShowCreateModal(false);
  };

  return (
    <div className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Chats</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-[#4169e1] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#1565C0] transition-colors text-sm flex items-center justify-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>New Private Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {/* Public Chat */}
        <button
          onClick={() => onSelectChat('public')}
          className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
            activeChatId === 'public'
              ? 'bg-orange-50 border-l-4 border-l-[#FF6B35]'
              : ''
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center text-white font-bold">
              #
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {cityName} Public Chat
              </p>
              <p className="text-xs text-gray-500">Everyone can join</p>
            </div>
          </div>
        </button>

        {/* Private Chats */}
        {privateChats.length > 0 && (
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Private Chats
            </p>
          </div>
        )}

        {privateChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              activeChatId === chat.id
                ? 'bg-orange-50 border-l-4 border-l-[#FF6B35]'
                : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#1976D2] flex items-center justify-center text-white font-bold">
                {chat.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{chat.name}</p>
                {chat.description && (
                  <p className="text-xs text-gray-500 truncate">{chat.description}</p>
                )}
              </div>
            </div>
          </button>
        ))}

        {privateChats.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500">
              No private chats yet.
              <br />
              Create one to get started!
            </p>
          </div>
        )}
      </div>

      {/* Create Private Chat Modal */}
      {showCreateModal && (
        <CreatePrivateChat
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateChat}
        />
      )}
    </div>
  );
}

export default ChatList;
