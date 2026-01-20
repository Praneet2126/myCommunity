import { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import CreatePrivateChat from './CreatePrivateChat';
import AIRecommendationModal from './AIRecommendationModal';
import GroupProfileModal from './GroupProfileModal';
import MyLensModal from './MyLensModal';

/**
 * ChatWindow component
 * Main chat interface displaying messages and input
 */
function ChatWindow({ 
  messages, 
  onSendMessage,
  onSendImageMessage,
  isUploadingImage,
  chatName,
  privateChats = [],
  activeChatId = 'public',
  onSelectChat,
  onCreateChat,
  cityName,
  onMembersChanged
}) {
  const messagesEndRef = useRef(null);
  const [showPrivateChatsDropdown, setShowPrivateChatsDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showMyLensModal, setShowMyLensModal] = useState(false);
  const [showGroupProfile, setShowGroupProfile] = useState(false);

  // Get current private chat object
  const currentPrivateChat = privateChats.find(chat => chat.id === activeChatId);
  const isPrivateChat = activeChatId !== 'public';

  // Scroll to bottom when new messages arrive (only within the chat container)
  useEffect(() => {
    // Small delay to let page scroll complete first
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPrivateChatsDropdown && !event.target.closest('.private-chats-dropdown')) {
        setShowPrivateChatsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPrivateChatsDropdown]);

  const handleCreateChat = async (chatName, description, participants) => {
    if (onCreateChat) {
      const newChat = await onCreateChat(chatName, description, participants);
      if (newChat && newChat.id && onSelectChat) {
        onSelectChat(newChat.id);
      }
    }
    setShowCreateModal(false);
    setShowPrivateChatsDropdown(false);
  };

  // Handle adding hotel to recommendations
  const handleAddToRecommendations = async (hotel, chatId) => {
    try {
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      // Create recommendation object
      const recommendation = {
        hotel_id: hotel.hotel_id,
        name: hotel.name,
        price: hotel.price,
        stars: hotel.stars,
        description: hotel.description,
        image_url: hotel.image_url || hotel.best_match_image_path,
        similarity_score: hotel.similarity_score,
        added_at: new Date().toISOString()
      };

      // Add recommendation to chat
      const response = await fetch(`${BASE_URL}/api/chats/${chatId}/recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recommendation })
      });

      const data = await response.json();

      if (data.success) {
        // Show success message (optional - could add a toast notification)
        console.log('Recommendation added successfully');
        // The GroupProfileModal will refresh when opened or when activeTab changes
        return;
      } else {
        throw new Error(data.message || 'Failed to add recommendation');
      }
    } catch (error) {
      console.error('Error adding recommendation:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Group Avatar for Private Chats */}
              {isPrivateChat && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1976D2] to-[#1565C0] flex items-center justify-center text-white font-bold">
                  {chatName?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-800">{chatName}</h2>
                <p className="text-sm text-gray-500">
                  {isPrivateChat 
                    ? `Private Group · ${currentPrivateChat?.participantCount || 0} members`
                    : 'Chat with fellow travelers'
                  }
                </p>
              </div>
            </div>
            {/* Details Button for Private Chat Profile - Right Corner */}
            {isPrivateChat && (
              <button
                onClick={() => setShowGroupProfile(true)}
                className="px-4 py-2 bg-gradient-to-br from-[#1976D2] to-[#1565C0] hover:from-[#1565C0] hover:to-[#0D47A1] rounded-lg transition-all text-sm font-medium text-white flex items-center gap-1 shadow-sm hover:shadow-md"
                title="View group info"
              >
                Details
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Header with Controls */}
        <div className="lg:hidden space-y-3">
          {/* Main Chat Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Group Avatar for Private Chats */}
              {isPrivateChat && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1976D2] to-[#1565C0] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {chatName?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-800 truncate">{chatName}</h2>
                <p className="text-xs text-gray-500">
                  {isPrivateChat 
                    ? `Private · ${currentPrivateChat?.participantCount || 0} members`
                    : 'Chat with fellow travelers'
                  }
                </p>
              </div>
            </div>
            {/* Details Button for Private Chat Profile - Right Corner */}
            {isPrivateChat && (
              <button
                onClick={() => setShowGroupProfile(true)}
                className="px-3 py-1.5 bg-gradient-to-br from-[#1976D2] to-[#1565C0] hover:from-[#1565C0] hover:to-[#0D47A1] rounded-lg transition-all text-xs font-medium text-white flex items-center gap-1 flex-shrink-0 shadow-sm hover:shadow-md"
                title="View group info"
              >
                Details
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2">
            {/* Group Community Button */}
            <button
              onClick={() => onSelectChat && onSelectChat('public')}
              className={`flex-1 px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                activeChatId === 'public'
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <span className="text-base sm:text-lg">#</span>
                <span className="truncate hidden xs:inline">{cityName} Community</span>
                <span className="truncate xs:hidden">Community</span>
              </div>
            </button>

            {/* Private Chats Dropdown */}
            <div className="relative private-chats-dropdown">
              <button
                onClick={() => setShowPrivateChatsDropdown(!showPrivateChatsDropdown)}
                className={`px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center space-x-1 ${
                  activeChatId !== 'public'
                    ? 'bg-[#1976D2] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Private</span>
                {privateChats.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeChatId !== 'public' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-[#1976D2]/20 text-[#1976D2]'
                  }`}>
                    {privateChats.length}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 transition-transform flex-shrink-0 ${showPrivateChatsDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showPrivateChatsDropdown && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {/* Create Private Chat Button */}
                  <div className="p-3 border-b border-gray-200">
                    <button
                      onClick={() => {
                        setShowCreateModal(true);
                        setShowPrivateChatsDropdown(false);
                      }}
                      className="w-full bg-[#1976D2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#1565C0] transition-colors text-sm flex items-center justify-center space-x-2"
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

                  {/* Private Chats List */}
                  <div className="py-2">
                    {privateChats.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-500">
                          No private chats yet.
                          <br />
                          Create one to get started!
                        </p>
                      </div>
                    ) : (
                      privateChats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => {
                            onSelectChat && onSelectChat(chat.id);
                            setShowPrivateChatsDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            activeChatId === chat.id
                              ? 'bg-orange-50 border-l-4 border-l-[#FF6B35]'
                              : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-[#1976D2] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {chat.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate text-sm">
                                {chat.name}
                              </p>
                              {chat.description && (
                                <p className="text-xs text-gray-500 truncate">
                                  {chat.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage key={message._id || message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput 
        onSend={onSendMessage} 
        onAIClick={() => setShowAIModal(true)}
        onMyLensClick={() => setShowMyLensModal(true)}
        onImageUpload={onSendImageMessage}
        isUploadingImage={isUploadingImage}
      />

      {/* Create Private Chat Modal */}
      {showCreateModal && (
        <CreatePrivateChat
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateChat}
        />
      )}

      {/* AI Summary Modal */}
      <AIRecommendationModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        messages={messages}
      />

      {/* MyLens Modal */}
      <MyLensModal
        isOpen={showMyLensModal}
        onClose={() => setShowMyLensModal(false)}
        onAddToRecommendations={handleAddToRecommendations}
        chatId={isPrivateChat ? activeChatId : null}
      />

      {/* Group Profile Modal */}
      <GroupProfileModal
        isOpen={showGroupProfile}
        onClose={() => setShowGroupProfile(false)}
        chat={currentPrivateChat}
        cityName={cityName}
        onMembersChanged={() => {
          onMembersChanged && onMembersChanged();
          // Refresh chat data when recommendations are added
          if (onSelectChat && activeChatId !== 'public') {
            // Trigger a refresh by re-selecting the chat
            onSelectChat(activeChatId);
          }
        }}
      />
    </div>
  );
}

export default ChatWindow;
