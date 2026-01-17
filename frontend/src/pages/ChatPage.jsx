import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCity } from '../context/CityContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { getCityById, joinCity } from '../services/cityService';

/**
 * ChatPage component
 * Full-page chat interface with chat list sidebar and main chat window
 */

function ChatPage() {
  const { cityName, chatId } = useParams();
  const navigate = useNavigate();
  const { selectCity, selectedCity } = useCity();
  const { user, isLoggedIn } = useAuth();
  const {
    activeChatId,
    messages,
    privateChats,
    sendMessage,
    setCity,
    setChat,
    createPrivateChat,
    getCurrentChat
  } = useChat();

  const [joining, setJoining] = useState(false);
  
  // Track if we've already initialized for this city
  const initializedCityRef = useRef(null);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Memoize the load function to prevent recreation
  const loadCityAndJoin = useCallback(async () => {
    if (!cityName || initializedCityRef.current === cityName) return;
    
    try {
      const city = await getCityById(cityName);
      if (city) {
        // Mark this city as initialized
        initializedCityRef.current = cityName;
        
        selectCity(city.id);
        
        // Auto-join city if user is logged in
        if (isLoggedIn && user) {
          setJoining(true);
          
          try {
            await joinCity(city.id);
            console.log('Joined city for chat');
          } catch (error) {
            console.error('Failed to join city:', error);
          } finally {
            setJoining(false);
          }
        }
        
        // Set city for chat context
        setCity(city.id);
      }
    } catch (error) {
      console.error('Error loading city:', error);
    }
  }, [cityName, isLoggedIn, user, selectCity, setCity]);

  // Load city data and auto-join (only when cityName changes)
  useEffect(() => {
    loadCityAndJoin();
  }, [loadCityAndJoin]);

  // Set active chat from URL (only when chatId changes)
  const previousChatIdRef = useRef(null);
  useEffect(() => {
    if (chatId && chatId !== previousChatIdRef.current) {
      previousChatIdRef.current = chatId;
      setChat(chatId);
    }
  }, [chatId, setChat]);

  if (!selectedCity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">City not found</h2>
          <Link
            to="/"
            className="text-[#FF6B35] hover:underline font-semibold"
          >
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const currentChat = getCurrentChat();
  const chatDisplayName = currentChat?.name || `${selectedCity.displayName} Public Chat`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {selectedCity.displayName} - Chat
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Connect with travelers and locals
              </p>
            </div>
            <Link
              to={`/city/${selectedCity.id}`}
              className="text-[#FF6B35] hover:text-[#E55A2B] font-semibold flex items-center space-x-1"
            >
              <span>Back to City</span>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[calc(100vh-200px)] flex">
          {/* Chat List Sidebar */}
          <ChatList
            privateChats={privateChats}
            activeChatId={activeChatId}
            onSelectChat={setChat}
            onCreateChat={createPrivateChat}
            cityName={selectedCity.displayName}
          />

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            <ChatWindow
              messages={messages}
              onSendMessage={sendMessage}
              chatName={chatDisplayName}
              privateChats={privateChats}
              activeChatId={activeChatId}
              onSelectChat={setChat}
              onCreateChat={createPrivateChat}
              cityName={selectedCity.displayName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
