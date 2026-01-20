import { useState, useEffect, useRef } from 'react';
import ItineraryDetailModal from './ItineraryDetailModal';

/**
 * ItineraryDisplay component
 * Displays itineraries based on chat type (community or private)
 * @param {Object} props - Component props
 * @param {string} props.chatType - 'community' or 'private'
 * @param {string} props.cityName - Name of the city
 * @param {string} props.chatName - Name of the current chat (for private chats)
 */
function ItineraryDisplay({ chatType = 'community', cityName = 'City', chatName = '', activeChatId = null }) {
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [viewingItinerary, setViewingItinerary] = useState(null);
  const [allItineraries, setAllItineraries] = useState([]); // Store ALL itineraries for private chats
  const [communityItinerariesData, setCommunityItinerariesData] = useState([]); // Store recent itineraries for community chat
  const [loadingItinerary, setLoadingItinerary] = useState(false);

  // Reset selected itinerary when chat type changes
  useEffect(() => {
    setSelectedItinerary(null);
    setViewingItinerary(null);
    // Clear private itineraries when switching to community
    if (chatType === 'community') {
      setAllItineraries([]);
    }
  }, [chatType]);

  // Fetch recent itineraries for community/public chat
  useEffect(() => {
    if (chatType === 'community') {
      fetchRecentItineraries();
    }
  }, [chatType]);

  // Store itineraries in a way that persists across re-renders
  const itineraryRef = useRef(null);

  // Fetch recent itineraries from all private chats (for community chat display)
  const fetchRecentItineraries = async () => {
    try {
      setLoadingItinerary(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/itineraries/recent?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('[ItineraryDisplay] Fetched recent community itineraries:', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        setCommunityItinerariesData(data.data);
      } else {
        setCommunityItinerariesData([]);
      }
    } catch (error) {
      console.error('Error fetching recent itineraries:', error);
      setCommunityItinerariesData([]);
    } finally {
      setLoadingItinerary(false);
    }
  };
  
  // Fetch ALL itineraries from database for private chats
  const fetchItinerary = async (chatId) => {
    if (!chatId || chatId === 'public') return;
    
    try {
      setLoadingItinerary(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chatId}/activities/itinerary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('[ItineraryDisplay] Fetched itineraries response:', data);
      
      // Backend returns array of all itineraries (sorted by newest first)
      if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log('[ItineraryDisplay] Setting', data.data.length, 'itineraries');
        
        // Store in ref for persistence
        itineraryRef.current = {
          chatId: chatId,
          itineraries: data.data
        };
        setAllItineraries(data.data);
      } else {
        // No itineraries found, clear state
        console.log('[ItineraryDisplay] No itineraries found');
        itineraryRef.current = null;
        setAllItineraries([]);
      }
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      setAllItineraries([]);
    } finally {
      setLoadingItinerary(false);
    }
  };
  
  // Fetch all itineraries for private chats
  useEffect(() => {
    if (chatType === 'private' && activeChatId && activeChatId !== 'public') {
      // Fetch all itineraries from database when chat changes
      const currentChatId = String(activeChatId);
      fetchItinerary(currentChatId);
      
      // Listen for itinerary generation events (for real-time updates)
      const handleItineraryGenerated = (event) => {
        console.log('Itinerary event received:', event.detail);
        console.log('Active chat ID:', activeChatId);
        console.log('Event chat ID:', event.detail.chatId);
        
        // Match chatId (convert both to strings for comparison)
        const eventChatId = String(event.detail.chatId || '');
        const currentChatId = String(activeChatId || '');
        
        // More flexible matching - try exact match first, then partial
        const matches = eventChatId === currentChatId || 
                       eventChatId.includes(currentChatId) || 
                       currentChatId.includes(eventChatId) ||
                       eventChatId.replace(/[^a-zA-Z0-9]/g, '') === currentChatId.replace(/[^a-zA-Z0-9]/g, '');
        
        if (matches && event.detail.itinerary) {
          console.log('New itinerary generated! Adding to list:', event.detail.itinerary);
          // Add new itinerary to the beginning of the array (newest first)
          setAllItineraries(prev => [event.detail.itinerary, ...prev]);
          // Update ref
          itineraryRef.current = {
            chatId: activeChatId,
            itineraries: [event.detail.itinerary, ...(itineraryRef.current?.itineraries || [])]
          };
        } else {
          console.log('Chat ID mismatch or missing itinerary');
        }
      };
      
      window.addEventListener('itineraryGenerated', handleItineraryGenerated);
      
      return () => {
        window.removeEventListener('itineraryGenerated', handleItineraryGenerated);
      };
    } else {
      // Clear itineraries when switching away from private chat
      itineraryRef.current = null;
      setAllItineraries([]);
    }
  }, [chatType, activeChatId]);

  // Mock data for community itineraries (most popular)
  const communityItineraries = [
    {
      id: 1,
      title: 'Weekend Explorer',
      popularity: 95,
      days: 2,
      activities: [
        { day: 1, time: '9:00 AM', activity: 'Visit Central Park', location: 'Central Park', duration: '2 hours' },
        { day: 1, time: '12:00 PM', activity: 'Lunch at Local Bistro', location: 'Downtown', duration: '1 hour' },
        { day: 1, time: '2:00 PM', activity: 'Museum Tour', location: 'Art Museum', duration: '3 hours' },
        { day: 1, time: '6:00 PM', activity: 'Dinner & Nightlife', location: 'City Center', duration: '4 hours' },
        { day: 2, time: '10:00 AM', activity: 'Historic District Walk', location: 'Old Town', duration: '2 hours' },
        { day: 2, time: '1:00 PM', activity: 'Local Market Visit', location: 'Market Square', duration: '1.5 hours' },
        { day: 2, time: '4:00 PM', activity: 'Sunset Viewpoint', location: 'Hilltop', duration: '1 hour' },
      ],
      estimatedCost: '$150-200',
      tags: ['Popular', 'Budget-Friendly', 'Family-Friendly']
    },
    {
      id: 2,
      title: 'Cultural Immersion',
      popularity: 88,
      days: 3,
      activities: [
        { day: 1, time: '10:00 AM', activity: 'Cultural Center Tour', location: 'Cultural District', duration: '3 hours' },
        { day: 1, time: '2:00 PM', activity: 'Traditional Cuisine Class', location: 'Cooking School', duration: '2 hours' },
        { day: 2, time: '9:00 AM', activity: 'Temple Visit', location: 'Historic Temple', duration: '2 hours' },
        { day: 2, time: '1:00 PM', activity: 'Local Art Gallery', location: 'Arts Quarter', duration: '2 hours' },
        { day: 3, time: '11:00 AM', activity: 'Traditional Market', location: 'Market Street', duration: '2 hours' },
      ],
      estimatedCost: '$250-300',
      tags: ['Cultural', 'Educational', 'Authentic']
    },
    {
      id: 3,
      title: 'Adventure Seeker',
      popularity: 82,
      days: 2,
      activities: [
        { day: 1, time: '8:00 AM', activity: 'Hiking Trail', location: 'Mountain Base', duration: '4 hours' },
        { day: 1, time: '2:00 PM', activity: 'Rock Climbing', location: 'Adventure Park', duration: '3 hours' },
        { day: 2, time: '9:00 AM', activity: 'Water Sports', location: 'Beach', duration: '3 hours' },
        { day: 2, time: '2:00 PM', activity: 'Zip Lining', location: 'Adventure Center', duration: '2 hours' },
      ],
      estimatedCost: '$200-250',
      tags: ['Adventure', 'Outdoor', 'Active']
    }
  ];

  // Convert real itinerary format to display format
  const convertItineraryFormat = (itinerary) => {
    console.log('Converting itinerary:', itinerary);
    if (!itinerary || !itinerary.days) {
      console.log('Invalid itinerary - missing days');
      return null;
    }
    
    const activities = [];
    itinerary.days.forEach((day, dayIndex) => {
      console.log(`Processing day ${dayIndex + 1}:`, day);
      if (!day.activities || !Array.isArray(day.activities)) {
        console.log(`Day ${dayIndex + 1} has no activities array:`, day);
        return;
      }
      console.log(`Day ${dayIndex + 1} has ${day.activities.length} activities`);
      day.activities.forEach((activity, actIndex) => {
        console.log(`  Activity ${actIndex + 1}:`, activity);
        // Activity can have 'name' field from ActivityPlace
        const activityName = activity.name || activity.place_name || 'Activity';
        activities.push({
          day: day.day,
          time: activity.start_time || 'TBD',
          activity: activityName,
          location: activity.region || activity.location || 'Goa',
          duration: activity.duration || '2 hours'
        });
      });
    });

    console.log(`Total activities extracted: ${activities.length}`);
    const converted = {
      id: itinerary.chat_id || 'generated-1',
      title: `${chatName || 'Your'} Trip Plan`,
      days: itinerary.days.length,
      activities: activities,
      estimatedCost: 'Custom',
      tags: ['AI Generated', 'Personalized']
    };
    
    console.log('Converted itinerary:', converted);
    return converted;
  };

  // Mock data for private chat itinerary (fallback)
  const defaultPrivateItinerary = {
    id: 'private-1',
    title: `${chatName || 'Your'} Trip Plan`,
    days: 3,
    activities: [
      { day: 1, time: '10:00 AM', activity: 'Airport Arrival & Hotel Check-in', location: 'Downtown Hotel', duration: '1 hour' },
      { day: 1, time: '12:00 PM', activity: 'Welcome Lunch', location: 'Restaurant District', duration: '1.5 hours' },
      { day: 1, time: '3:00 PM', activity: 'City Orientation Walk', location: 'City Center', duration: '2 hours' },
      { day: 1, time: '7:00 PM', activity: 'Dinner Reservation', location: 'Fine Dining', duration: '2 hours' },
      { day: 2, time: '9:00 AM', activity: 'Morning Coffee & Planning', location: 'Local Café', duration: '1 hour' },
      { day: 2, time: '11:00 AM', activity: 'Main Attraction Visit', location: 'Famous Landmark', duration: '3 hours' },
      { day: 2, time: '3:00 PM', activity: 'Shopping & Souvenirs', location: 'Shopping District', duration: '2 hours' },
      { day: 2, time: '6:00 PM', activity: 'Evening Entertainment', location: 'Entertainment District', duration: '3 hours' },
      { day: 3, time: '10:00 AM', activity: 'Brunch & Relaxation', location: 'Riverside Café', duration: '1.5 hours' },
      { day: 3, time: '12:00 PM', activity: 'Final Exploration', location: 'Hidden Gems', duration: '2 hours' },
      { day: 3, time: '4:00 PM', activity: 'Departure Preparation', location: 'Hotel', duration: '1 hour' },
    ],
    estimatedCost: '$300-400',
    tags: ['Personalized', 'Flexible', 'Custom']
  };

  // Convert all itineraries to display format for private chats
  const convertedPrivateItineraries = allItineraries.map((itinerary, index) => {
    const converted = convertItineraryFormat(itinerary);
    if (converted) {
      // Add unique id and index for display
      converted.id = itinerary._id || itinerary.chat_id || `itinerary-${index}`;
      converted.title = `${chatName || 'Your'} Trip Plan #${allItineraries.length - index}`;
      converted.generated_at = itinerary.generated_at;
      converted.isLatest = index === 0;
    }
    return converted;
  }).filter(Boolean); // Remove any null values

  // Convert community itineraries (recent from all private chats)
  const convertedCommunityItineraries = communityItinerariesData.map((itinerary, index) => {
    const converted = convertItineraryFormat(itinerary);
    if (converted) {
      converted.id = itinerary._id || `community-itinerary-${index}`;
      converted.title = itinerary.chat_name || `Trip Plan #${index + 1}`;
      converted.generated_at = itinerary.generated_at;
      converted.isLatest = index === 0;
      converted.fromChatName = itinerary.chat_name;
    }
    return converted;
  }).filter(Boolean);
  
  console.log('All private itineraries state:', allItineraries);
  console.log('Converted private itineraries:', convertedPrivateItineraries);
  console.log('Community itineraries data:', communityItinerariesData);
  console.log('Converted community itineraries:', convertedCommunityItineraries);
  console.log('Active chat ID:', activeChatId);
  
  // Use converted itineraries if available, otherwise show default/mock
  const privateItineraries = convertedPrivateItineraries.length > 0 ? convertedPrivateItineraries : [defaultPrivateItinerary];
  // For community, use fetched recent itineraries if available, otherwise fall back to mock
  const displayCommunityItineraries = convertedCommunityItineraries.length > 0 ? convertedCommunityItineraries : communityItineraries;
  const itineraries = chatType === 'community' ? displayCommunityItineraries : privateItineraries;
  console.log('Displaying itineraries:', itineraries);
  console.log('Chat type:', chatType, 'Active chat ID:', activeChatId);
  console.log('Number of itineraries to render:', itineraries.length);

  return (
    <div className="w-full h-full max-w-md p-3 rounded-3xl shadow-lg bg-gradient-to-t bg-white text-black transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-800">
            {chatType === 'community' ? 'Recent Itineraries' : 'Your Itineraries'}
          </h2>
          {chatType === 'community' && communityItinerariesData.length > 0 && (
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-medium">
              {communityItinerariesData.length} from chats
            </span>
          )}
          {chatType === 'community' && communityItinerariesData.length === 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Sample plans
            </span>
          )}
          {chatType === 'private' && allItineraries.length > 0 && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
              {allItineraries.length} saved
            </span>
          )}
        </div>
        {chatType === 'community' && (
          <p className="text-xs text-gray-600">
            {communityItinerariesData.length > 0 
              ? 'Recently created itineraries from trip chats'
              : 'Sample travel plans for inspiration'}
          </p>
        )}
        {chatType === 'private' && (
          <p className="text-xs text-gray-600">
            {allItineraries.length > 0 
              ? 'All your generated trip plans for this chat' 
              : 'Generate an itinerary from your cart'}
          </p>
        )}
      </div>

      {/* Itinerary List with Scrollbar */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {itineraries.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No itineraries available
          </div>
        ) : (
          itineraries.map((itinerary, index) => {
            console.log(`Rendering itinerary ${index + 1}/${itineraries.length}:`, itinerary.id, itinerary.title, 'Activities:', itinerary.activities?.length, 'Days:', itinerary.days);
            if (!itinerary || !itinerary.id) {
              console.error('Invalid itinerary object:', itinerary);
              return null;
            }
            return (
              <div
                key={itinerary.id}
                onClick={() => setViewingItinerary(itinerary)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
                  selectedItinerary?.id === itinerary.id || (!selectedItinerary && itinerary.id === itineraries[0].id)
                    ? 'border-[#FF6B35] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-gray-800">{itinerary.title}</h3>
                  {itinerary.isLatest && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Latest
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">{itinerary.days} days</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600">{itinerary.estimatedCost}</span>
                </div>
                {itinerary.generated_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(itinerary.generated_at).toLocaleDateString()} at {new Date(itinerary.generated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                )}
              </div>
              {itinerary.popularity && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a1 1 0 001.581.814l3.854-2.925a1 1 0 00.392-1.242l-1.829-4.243a1 1 0 00-1.15-.666L6 10.333zM16 3.5a1.5 1.5 0 00-3 0v7a1.5 1.5 0 003 0v-7zM12.5 2.5a1.5 1.5 0 00-1.5 1.5v8a1.5 1.5 0 003 0V4a1.5 1.5 0 00-1.5-1.5z" />
                  </svg>
                  <span className="text-xs font-semibold text-orange-600">{itinerary.popularity}%</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {itinerary.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {/* Show chat name for community itineraries */}
              {chatType === 'community' && itinerary.fromChatName && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                  from: {itinerary.fromChatName}
                </span>
              )}
            </div>
          </div>
            );
          })
        )}
      </div>

      {/* Itinerary Detail Modal */}
      {viewingItinerary && (
        <ItineraryDetailModal
          itinerary={viewingItinerary}
          onClose={() => setViewingItinerary(null)}
          activeChatId={activeChatId}
        />
      )}
    </div>
  );
}

export default ItineraryDisplay;
