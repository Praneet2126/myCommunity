import { useState, useEffect } from 'react';

/**
 * EventDetailModal Component
 * Shows detailed information about an event
 */
function EventDetailModal({ event, onClose }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');

  // Fetch event join status and attendees count from backend
  useEffect(() => {
    if (event) {
      // Set initial count from event data
      setAttendeesCount(event.attendees_count || 0);
      
      // Fetch current join status if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        fetchJoinStatus();
      }
    }
  }, [event]);

  const fetchJoinStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const eventId = event._id || event.id;
      
      const response = await fetch(`${API_URL}/api/events/${eventId}/join-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHasJoined(data.data.has_joined);
          setAttendeesCount(data.data.attendees_count);
        }
      }
    } catch (error) {
      console.error('Error fetching join status:', error);
    }
  };

  const handleJoinEvent = async () => {
    if (hasJoined || isLoading) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to join events');
      return;
    }
    
    setIsLoading(true);
    try {
      const eventId = event._id || event.id;
      const response = await fetch(`${API_URL}/api/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHasJoined(true);
        setAttendeesCount(data.data.attendees_count);
      } else {
        console.error('Failed to join event:', data.message);
      }
    } catch (error) {
      console.error('Error joining event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!hasJoined || isLoading) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setIsLoading(true);
    try {
      const eventId = event._id || event.id;
      const response = await fetch(`${API_URL}/api/events/${eventId}/join`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHasJoined(false);
        setAttendeesCount(data.data.attendees_count);
      } else {
        console.error('Failed to leave event:', data.message);
      }
    } catch (error) {
      console.error('Error leaving event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Event Image Header */}
        <div className="relative h-64 overflow-hidden rounded-t-2xl">
          <img
            src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Event Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="inline-block bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-3 shadow-lg">
              {event.type || 'Event'}
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {event.name}
            </h3>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-6">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Date</p>
                  <p className="font-bold text-gray-800">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Time</p>
                  <p className="font-bold text-gray-800">{event.time || '6:00 PM - 9:00 PM'}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Attendees</p>
                  <p className="font-bold text-gray-800">{attendeesCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Location</p>
                <p className="font-bold text-gray-800 text-lg">{event.location || 'City Center'}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
              <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
              About This Event
            </h4>
            <p className="text-gray-600 leading-relaxed text-base">
              {event.description || `Join us for ${event.name}. A wonderful event you don't want to miss! Experience the best of what our community has to offer.`}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex gap-3">
            {hasJoined ? (
              <>
                <div className="flex-1 bg-green-500 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Joined
                </div>
                <button
                  onClick={handleLeaveEvent}
                  disabled={isLoading}
                  className="px-6 py-4 border-2 border-red-300 text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-400 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  )}
                  Leave
                </button>
              </>
            ) : (
              <button
                onClick={handleJoinEvent}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Join Event'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailModal;
