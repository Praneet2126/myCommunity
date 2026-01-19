import { useState, useEffect } from 'react';
import ItineraryDetailModal from './ItineraryDetailModal';

/**
 * ItineraryDisplay component
 * Displays itineraries based on chat type (community or private)
 * @param {Object} props - Component props
 * @param {string} props.chatType - 'community' or 'private'
 * @param {string} props.cityName - Name of the city
 * @param {string} props.chatName - Name of the current chat (for private chats)
 * @param {string} props.cityId - ID of the city
 */
function ItineraryDisplay({ chatType = 'community', cityName = 'City', chatName = '', cityId = '' }) {
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [viewingItinerary, setViewingItinerary] = useState(null);

  // Reset selected itinerary when chat type changes
  useEffect(() => {
    setSelectedItinerary(null);
    setViewingItinerary(null);
  }, [chatType]);

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

  // Mock data for private chat itinerary (personalized)
  const privateItinerary = {
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

  const itineraries = chatType === 'community' ? communityItineraries : [privateItinerary];

  return (
    <div className="w-full h-full max-w-md p-3 rounded-3xl shadow-lg bg-gradient-to-t bg-white text-black transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-800">
            {chatType === 'community' ? 'Popular Itineraries' : 'Your Itinerary'}
          </h2>
          {chatType === 'community' && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Based on {cityName} chats
            </span>
          )}
        </div>
        {chatType === 'community' && (
          <p className="text-xs text-gray-600">
            Most discussed travel plans in the community
          </p>
        )}
        {chatType === 'private' && (
          <p className="text-xs text-gray-600">
            Your personalized trip plan
          </p>
        )}
      </div>

      {/* Itinerary List with Scrollbar */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {itineraries.map((itinerary) => (
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
                <h3 className="font-semibold text-sm text-gray-800">{itinerary.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">{itinerary.days} days</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600">{itinerary.estimatedCost}</span>
                </div>
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
            </div>
          </div>
        ))}
      </div>

      {/* Itinerary Detail Modal */}
      {viewingItinerary && (
        <ItineraryDetailModal
          itinerary={viewingItinerary}
          onClose={() => setViewingItinerary(null)}
          cityId={cityId}
        />
      )}
    </div>
  );
}

export default ItineraryDisplay;
