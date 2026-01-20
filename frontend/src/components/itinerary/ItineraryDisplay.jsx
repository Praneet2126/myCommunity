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
  const [allItineraries, setAllItineraries] = useState([]);
  const [communityItinerariesData, setCommunityItinerariesData] = useState([]);
  const [loadingItinerary, setLoadingItinerary] = useState(false);

  useEffect(() => {
    setSelectedItinerary(null);
    setViewingItinerary(null);
    if (chatType === 'community') {
      setAllItineraries([]);
    }
  }, [chatType]);

  useEffect(() => {
    if (chatType === 'community') {
      fetchRecentItineraries();
    }
  }, [chatType]);

  const itineraryRef = useRef(null);

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
      if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
        itineraryRef.current = { chatId, itineraries: data.data };
        setAllItineraries(data.data);
      } else {
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
  
  useEffect(() => {
    if (chatType === 'private' && activeChatId && activeChatId !== 'public') {
      const currentChatId = String(activeChatId);
      fetchItinerary(currentChatId);
      
      const handleItineraryGenerated = (event) => {
        const eventChatId = String(event.detail.chatId || '');
        const currentId = String(activeChatId || '');
        const matches = eventChatId === currentId || 
                       eventChatId.includes(currentId) || 
                       currentId.includes(eventChatId);
        
        if (matches && event.detail.itinerary) {
          setAllItineraries(prev => [event.detail.itinerary, ...prev]);
          itineraryRef.current = {
            chatId: activeChatId,
            itineraries: [event.detail.itinerary, ...(itineraryRef.current?.itineraries || [])]
          };
        }
      };
      
      window.addEventListener('itineraryGenerated', handleItineraryGenerated);
      return () => window.removeEventListener('itineraryGenerated', handleItineraryGenerated);
    } else {
      itineraryRef.current = null;
      setAllItineraries([]);
    }
  }, [chatType, activeChatId]);

  // Mock data for community itineraries (fallback)
  const communityItineraries = [
    {
      id: 1, title: 'Weekend Explorer', popularity: 95, days: 2,
      activities: [
        { day: 1, time: '9:00 AM', activity: 'Visit Central Park', location: 'Central Park', duration: '2 hours' },
        { day: 1, time: '12:00 PM', activity: 'Lunch at Local Bistro', location: 'Downtown', duration: '1 hour' },
        { day: 2, time: '10:00 AM', activity: 'Historic District Walk', location: 'Old Town', duration: '2 hours' },
      ],
      estimatedCost: '$150-200', tags: ['Popular', 'Budget-Friendly']
    },
    {
      id: 2, title: 'Cultural Immersion', popularity: 88, days: 3,
      activities: [
        { day: 1, time: '10:00 AM', activity: 'Cultural Center Tour', location: 'Cultural District', duration: '3 hours' },
        { day: 2, time: '9:00 AM', activity: 'Temple Visit', location: 'Historic Temple', duration: '2 hours' },
      ],
      estimatedCost: '$250-300', tags: ['Cultural', 'Educational']
    },
    {
      id: 3, title: 'Adventure Seeker', popularity: 82, days: 2,
      activities: [
        { day: 1, time: '8:00 AM', activity: 'Hiking Trail', location: 'Mountain Base', duration: '4 hours' },
        { day: 2, time: '9:00 AM', activity: 'Water Sports', location: 'Beach', duration: '3 hours' },
      ],
      estimatedCost: '$200-250', tags: ['Adventure', 'Outdoor']
    }
  ];

  const convertItineraryFormat = (itinerary) => {
    if (!itinerary || !itinerary.days) return null;
    
    const activities = [];
    itinerary.days.forEach((day) => {
      if (!day.activities || !Array.isArray(day.activities)) return;
      day.activities.forEach((activity) => {
        activities.push({
          day: day.day,
          time: activity.start_time || 'TBD',
          activity: activity.name || activity.place_name || 'Activity',
          location: activity.region || activity.location || 'Location',
          duration: activity.duration || '2 hours'
        });
      });
    });

    return {
      id: itinerary.chat_id || 'generated-1',
      title: `${chatName || 'Your'} Trip Plan`,
      days: itinerary.days.length,
      activities,
      estimatedCost: 'Custom',
      tags: ['AI Generated', 'Personalized']
    };
  };

  const defaultPrivateItinerary = {
    id: 'private-1',
    title: `${chatName || 'Your'} Trip Plan`,
    days: 3,
    activities: [
      { day: 1, time: '10:00 AM', activity: 'Explore the City', location: 'City Center', duration: '3 hours' },
      { day: 2, time: '9:00 AM', activity: 'Beach Day', location: 'Coastal Area', duration: '5 hours' },
      { day: 3, time: '11:00 AM', activity: 'Cultural Tour', location: 'Historic District', duration: '4 hours' },
    ],
    estimatedCost: '$300-400',
    tags: ['Personalized', 'Custom']
  };

  const convertedPrivateItineraries = allItineraries.map((itinerary, index) => {
    const converted = convertItineraryFormat(itinerary);
    if (converted) {
      converted.id = itinerary._id || itinerary.chat_id || `itinerary-${index}`;
      converted.title = `Trip Plan #${allItineraries.length - index}`;
      converted.generated_at = itinerary.generated_at;
      converted.isLatest = index === 0;
    }
    return converted;
  }).filter(Boolean);

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
  
  const privateItineraries = convertedPrivateItineraries.length > 0 ? convertedPrivateItineraries : [defaultPrivateItinerary];
  const displayCommunityItineraries = convertedCommunityItineraries.length > 0 ? convertedCommunityItineraries : communityItineraries;
  const itineraries = chatType === 'community' ? displayCommunityItineraries : privateItineraries;

  // Get icon based on activity type
  const getActivityIcon = (activities) => {
    if (!activities || activities.length === 0) return '🗺️';
    const firstActivity = activities[0].activity?.toLowerCase() || '';
    if (firstActivity.includes('beach') || firstActivity.includes('water')) return '🏖️';
    if (firstActivity.includes('hik') || firstActivity.includes('mountain')) return '🥾';
    if (firstActivity.includes('cultur') || firstActivity.includes('museum') || firstActivity.includes('temple')) return '🏛️';
    if (firstActivity.includes('food') || firstActivity.includes('lunch') || firstActivity.includes('dinner')) return '🍽️';
    if (firstActivity.includes('shop')) return '🛍️';
    if (firstActivity.includes('adventure') || firstActivity.includes('sport')) return '🎯';
    return '✨';
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full h-full max-w-md rounded-2xl overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 via-white to-orange-50/30 shadow-xl border border-white/60">
      {/* Header with gradient accent */}
      <div className="relative px-5 pt-5 pb-4 flex-shrink-0">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-rose-400 to-purple-500"></div>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-200/50">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {chatType === 'community' ? 'Trip Plans' : 'Your Itineraries'}
              </h2>
            </div>
            <p className="text-xs text-gray-500 ml-10">
              {chatType === 'community' 
                ? (communityItinerariesData.length > 0 ? 'Recent plans from the community' : 'Explore popular travel ideas')
                : (allItineraries.length > 0 ? `${allItineraries.length} saved plan${allItineraries.length > 1 ? 's' : ''}` : 'Create your perfect trip')}
            </p>
          </div>
          
          {/* Stats badge */}
          <div className="flex flex-col items-end gap-1">
            {chatType === 'community' && communityItinerariesData.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-700 text-xs font-semibold rounded-full border border-purple-200/50">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                {communityItinerariesData.length} new
              </span>
            )}
            {chatType === 'private' && allItineraries.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200/50">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {allItineraries.length} saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loadingItinerary && (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-orange-200"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-500 animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500">Loading itineraries...</p>
          </div>
        </div>
      )}

      {/* Itinerary List */}
      {!loadingItinerary && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          {itineraries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-4 shadow-inner">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-1">No itineraries yet</p>
              <p className="text-xs text-gray-400 max-w-[200px]">
                {chatType === 'private' 
                  ? 'Generate one from your cart to get started' 
                  : 'Check back soon for community plans'}
              </p>
            </div>
          ) : (
            itineraries.map((itinerary, index) => {
              if (!itinerary || !itinerary.id) return null;
              const isFirst = index === 0;
              const icon = getActivityIcon(itinerary.activities);
              
              return (
                <div
                  key={itinerary.id}
                  onClick={() => setViewingItinerary(itinerary)}
                  className={`group relative rounded-xl transition-all duration-300 cursor-pointer overflow-hidden
                    ${isFirst 
                      ? 'bg-gradient-to-br from-orange-50 via-white to-rose-50 border-2 border-orange-200/60 shadow-lg shadow-orange-100/50 hover:shadow-xl hover:shadow-orange-200/50 hover:border-orange-300' 
                      : 'bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 hover:bg-gray-50/50'
                    }`}
                >
                  {/* Latest indicator line */}
                  {itinerary.isLatest && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 via-rose-400 to-orange-400"></div>
                  )}
                  
                  <div className="p-4 pl-5">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-sm
                        ${isFirst 
                          ? 'bg-gradient-to-br from-orange-400 to-rose-500 shadow-orange-200/50' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-50'}`}>
                        <span className={isFirst ? 'grayscale-0' : 'opacity-70'}>{icon}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-sm truncate ${isFirst ? 'text-gray-900' : 'text-gray-800'}`}>
                            {itinerary.title}
                          </h3>
                          {itinerary.isLatest && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded shadow-sm">
                              New
                            </span>
                          )}
                        </div>
                        
                        {/* Stats row */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {itinerary.days} day{itinerary.days > 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {itinerary.activities?.length || 0} stops
                          </span>
                          {itinerary.estimatedCost && itinerary.estimatedCost !== 'Custom' && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {itinerary.estimatedCost}
                            </span>
                          )}
                        </div>
                        
                        {/* Tags and time */}
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {itinerary.tags?.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                                  ${isFirst 
                                    ? 'bg-orange-100/80 text-orange-700' 
                                    : 'bg-gray-100 text-gray-600'}`}
                              >
                                {tag}
                              </span>
                            ))}
                            {chatType === 'community' && itinerary.fromChatName && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                                {itinerary.fromChatName}
                              </span>
                            )}
                          </div>
                          
                          {itinerary.generated_at && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatRelativeTime(itinerary.generated_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow indicator */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-0.5
                        ${isFirst 
                          ? 'bg-orange-100/80 text-orange-600 group-hover:bg-orange-200/80' 
                          : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Popularity bar for mock community itineraries */}
                  {itinerary.popularity && (
                    <div className="px-4 pb-3 pt-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-400 to-rose-400 rounded-full transition-all duration-500"
                            style={{ width: `${itinerary.popularity}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-semibold text-orange-600">{itinerary.popularity}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

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
