import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCity } from '../context/CityContext';
import { useChat } from '../context/ChatContext';
import CityHero from '../components/city/CityHero';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import EventCalendar from '../components/calendar/EventCalendar';
import { getCityById } from '../services/cityService';

/**
 * CityPage component
 * City details with chat section (left) and calendar widget (right)
 */

function CityPage() {
  const { cityName } = useParams();
  const { selectCity, selectedCity } = useCity();
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

  // Load city data
  useEffect(() => {
    if (cityName) {
      const city = getCityById(cityName);
      if (city) {
        selectCity(city.id);
        setCity(city.id);
      }
    }
  }, [cityName, selectCity, setCity]);

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
      {/* City Hero */}
      <CityHero city={selectedCity} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chat Section */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[600px] flex">
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
                />
              </div>
            </div>
          </div>

          {/* Right: Calendar Widget */}
          <div className="lg:col-span-1">
            <EventCalendar cityId={selectedCity.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CityPage;
