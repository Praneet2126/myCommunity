import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents } from '../services/eventService';
import { useCity } from '../context/CityContext';
import EventDetailModal from '../components/calendar/EventDetailModal';

/**
 * EventsPage Component
 * Displays the latest 10 events across all cities with search functionality
 */
function EventsPage() {
  const navigate = useNavigate();
  const { cities } = useCity();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchRef = useRef(null);

  // Fetch latest events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const allEvents = await getAllEvents();
        
        // Sort by date (upcoming first) and take latest 10
        const sortedEvents = allEvents
          .filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= new Date();
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 10);
        
        setEvents(sortedEvents);
        setFilteredEvents(sortedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events based on search query, city, and type
  useEffect(() => {
    let filtered = [...events];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.cityName.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query)
      );
    }

    // Filter by city
    if (selectedCity !== 'all') {
      filtered = filtered.filter(event => event.city_id === selectedCity);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    setFilteredEvents(filtered);
  }, [searchQuery, selectedCity, selectedType, events]);

  // Get unique event types
  const eventTypes = ['all', ...new Set(events.map(e => e.type))];

  // Format date for display in card (e.g., "16th Jan 2026")
  const formatDateForCard = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    
    // Add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  // Handle event card click - open modal
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Handle user joined event
  const handleUserJoined = (event) => {
    console.log('User joined event:', event);
    // You can add logic here to handle event joining
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden border-b border-gray-200">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          {/* Heading */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100/80 backdrop-blur px-4 py-2 rounded-full mb-6 border border-blue-200/50">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-blue-900">Latest Events</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Discover Upcoming Events
            </h1>
            <p className="text-lg md:text-xl text-gray-700 font-medium"> 
              Explore the latest events happening across all cities
            </p>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-4 flex flex-col md:flex-row items-center gap-3 backdrop-blur-sm">
              <div className="flex items-center gap-3 w-full px-4 py-2">
                <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events by name, location, city, or type..."
                  className="w-full py-2 text-gray-700 focus:outline-none text-base placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-xl font-bold text-base w-full md:w-auto transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="mt-5 flex flex-wrap gap-3 justify-center">
              {/* City Filter */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-5 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl text-gray-700 font-semibold shadow-md hover:bg-white hover:shadow-lg transition-all border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Cities</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.displayName}</option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-5 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl text-gray-700 font-semibold shadow-md hover:bg-white hover:shadow-lg transition-all border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Results Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {filteredEvents.length === 0 && !loading
                ? 'No events found'
                : `${filteredEvents.length} ${filteredEvents.length === 1 ? 'Event' : 'Events'} Found`
              }
            </h2>
            {searchQuery && (
              <p className="text-gray-600 mt-1 text-base">
                Showing results for <span className="font-semibold text-gray-900">"{searchQuery}"</span>
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedType('all');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Events List - One event per row */
          <div className="space-y-5">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200/60 overflow-hidden hover:border-blue-300/50"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left Side - Date Section (1/4th) */}
                  <div className="md:w-1/4 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 text-gray-900 p-8 flex flex-col items-center justify-center min-h-[160px] md:min-h-[200px] relative overflow-hidden border-r border-gray-200/50">
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200/30 to-transparent rounded-bl-full"></div>
                    
                    <div className="text-center relative z-10">
                      <div className="text-5xl md:text-6xl font-extrabold mb-2 bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {new Date(event.date).getDate()}
                      </div>
                      <div className="text-xl md:text-2xl font-bold uppercase tracking-wider text-gray-800 mb-1">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-base md:text-lg font-semibold text-gray-600">
                        {new Date(event.date).getFullYear()}
                      </div>
                    </div>
                    
                    {/* Event Type Badge */}
                    <div className="mt-6 relative z-10">
                      <span className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-gray-800 shadow-sm border border-gray-200/50">
                        {event.type || 'Event'}
                      </span>
                    </div>
                  </div>

                  {/* Right Side - Event Details (3/4th) */}
                  <div className="md:w-3/4 p-8 flex flex-col justify-between bg-gradient-to-br from-white to-gray-50/50">
                    {/* Top Section - Event Name */}
                    <div className="mb-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                        {event.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 text-base leading-relaxed line-clamp-2 mb-1">
                        {event.description || 'Join us for an amazing event!'}
                      </p>
                    </div>

                    {/* Bottom Section - Event Info */}
                    <div className="flex flex-wrap items-center gap-5 text-sm">
                      {/* Location */}
                      <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                        <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{event.location || 'City Center'}</span>
                      </div>
                      
                      {/* Time */}
                      <div className="flex items-center bg-purple-50 px-4 py-2 rounded-lg border border-purple-100">
                        <svg className="w-5 h-5 mr-2 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{event.time || '6:00 PM - 9:00 PM'}</span>
                      </div>

                      {/* City */}
                      {event.cityName && (
                        <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                          <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-semibold text-gray-700">{event.cityName}</span>
                        </div>
                      )}

                      {/* Attendees */}
                      {event.attendees && (
                        <div className="flex items-center bg-orange-50 px-4 py-2 rounded-lg border border-orange-100">
                          <svg className="w-5 h-5 mr-2 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-semibold text-gray-700">{event.attendees} attendees</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Event Detail Modal */}
        {isModalOpen && selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={handleCloseModal}
            onUserJoined={handleUserJoined}
          />
        )}
      </div>
    </div>
  );
}

export default EventsPage;
