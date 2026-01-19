import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCity } from '../context/CityContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import CityHero from '../components/city/CityHero';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import EventCalendar from '../components/calendar/EventCalendar';
import { getCityById, joinCity, checkMembership } from '../services/cityService';

function CityPage() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const { selectCity, selectedCity } = useCity();
  const { user, isLoggedIn } = useAuth();
  const {
    activeCityId,
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
  const [joinError, setJoinError] = useState(null);
  
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
        // Set the city for chat context
        setCity(city.id);
        
        // Auto-join city if user is logged in and not already a member
        if (isLoggedIn && user) {
          setJoining(true);
          setJoinError(null);
          
          try {
            // Check if user is already a member first
            const isMember = await checkMembership(city.id);
            
            if (!isMember) {
              // Only join if not already a member
              const result = await joinCity(city.id);
              console.log('Joined city:', result);
            } else {
              console.log('Already a member of city:', city.displayName);
            }
          } catch (error) {
            console.error('Failed to join city:', error);
            setJoinError(error.message);
          } finally {
            setJoining(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading city:', error);
    }
  }, [cityName, isLoggedIn, user, selectCity, setCity]);

  // Load city data and auto-join (only when cityName changes)
  useEffect(() => {
    loadCityAndJoin();
  }, [loadCityAndJoin]);

  if (!selectedCity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            City not found
          </h2>
          <Link to="/" className="text-[#FF6B35] font-semibold hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // Show joining status
  if (joining) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-gray-600">Joining {selectedCity.displayName}...</p>
        </div>
      </div>
    );
  }

  const currentChat = getCurrentChat();
  const chatDisplayName =
    currentChat?.name || `${selectedCity.displayName} Public Chat`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* City Hero */}
      <CityHero city={selectedCity} />

      {/* Join Error Message */}
      {joinError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Warning: {joinError}. You may not be able to participate in chat.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="
              bg-white rounded-xl shadow-lg overflow-hidden
              h-[calc(100vh-260px)]
              lg:h-[600px]
              flex
            ">
              {/* Chat List (hidden on mobile) */}
              <div className="hidden lg:block">
                <ChatList
                  privateChats={privateChats}
                  activeChatId={activeChatId}
                  activeCityId={activeCityId}
                  onSelectChat={setChat}
                  onCreateChat={createPrivateChat}
                  cityName={selectedCity.displayName}
                />
              </div>

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

          {/* Calendar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <EventCalendar cityId={selectedCity.id} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CityPage;
