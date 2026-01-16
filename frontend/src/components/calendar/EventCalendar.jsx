import { useState, useEffect } from 'react';
import { getAllEvents, getEventsByMonth } from '../../services/eventService';
import AddEventModal from './AddEventModal';
import EventDetailModal from './EventDetailModal';

/**
 * EventCalendar Component
 * Beautiful calendar with events list and color palette
 */
function EventCalendar({ cityId = null }) {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Color palette for events
  const colorPalette = [
    '#F8BBD0', // Pastel Pink
    '#FFCDD2', // Pastel Red
    '#BBDEFB', // Pastel Blue
    '#B3E5FC', // Pastel Sky Blue
    '#C8E6C9', // Pastel Green
    '#FFE0B2', // Pastel Orange
    '#E1BEE7', // Pastel Purple
    '#B2EBF2', // Pastel Cyan
    '#D1C4E9', // Pastel Lavender
    '#CFD8DC', // Pastel Teal
    '#E0F7FA', // Light Aqua
  ];

  // Fetch events for current month
  useEffect(() => {
    const monthEvents = getEventsByMonth(year, month, cityId);
    // Add unique IDs if missing
    const eventsWithIds = monthEvents.map((event, index) => ({
      ...event,
      _id: event._id || `event-${Date.now()}-${index}`,
      image: event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
      description: event.description || `Join us for ${event.name}. A wonderful event you don't want to miss!`,
      location: event.location || 'City Center',
      time: event.time || '6:00 PM - 9:00 PM',
      attendees: event.attendees || '100+',
    }));
    eventsWithIds.sort((a, b) => new Date(a.date) - new Date(b.date));
    setEvents(eventsWithIds);
  }, [year, month, cityId]);

  // Assign colors to events by date
  const assignColors = (events) => {
    const colorMap = new Map();
    let colorIndex = 0;

    events.forEach((event) => {
      const dateKey = new Date(event.date).toDateString();
      if (!colorMap.has(dateKey)) {
        colorMap.set(dateKey, colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
      }
    });

    return colorMap;
  };

  const colorMap = assignColors(events);

  const handleAddEvent = (newEvent) => {
    const eventWithId = {
      ...newEvent,
      _id: `event-${Date.now()}`,
    };
    const updatedEvents = [...events, eventWithId];
    updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    setEvents(updatedEvents);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (eventId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this event?');
    if (confirmDelete) {
      setEvents(events.filter((event) => event._id !== eventId));
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleUserJoined = (updatedEvent) => {
    setSelectedEvent(updatedEvent);
    // Update the event in the list
    setEvents(events.map(e => e._id === updatedEvent._id ? updatedEvent : e));
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="w-full max-w-md p-3 rounded-3xl shadow-lg bg-gradient-to-t bg-white text-black transition-all duration-300">
      {/* Month and Year Header */}
      <div className="flex items-center justify-between mb-3">
        {/* Previous Month Button */}
        <button
          onClick={() => changeMonth(-1)}
          className="w-6 h-6 rounded-full text-black flex items-center justify-center hover:bg-teal-800 hover:text-white transition-colors"
        >
          {'<'}
        </button>

        {/* Current Month and Year */}
        <div className="flex items-center">
          <h1 className="text-md font-semibold mx-2 text-teal-600">
            {currentMonth} {currentYear}
          </h1>
        </div>

        {/* Next Month Button */}
        <button
          onClick={() => changeMonth(1)}
          className="w-6 h-6 rounded-full text-black flex items-center justify-center hover:bg-teal-800 hover:text-white transition-colors"
        >
          {'>'}
        </button>

        {/* Add Event Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-8 h-8 bg-pink-500 text-white flex items-center justify-center rounded-xl hover:bg-pink-600 ml-4 transition-colors shadow-md"
        >
          +
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-2 overflow-y-auto h-[30vh] custom-scrollbar">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event._id}
              className="relative flex items-start gap-2 rounded-md transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              onClick={() => handleEventClick(event)}
            >
              {/* Date in a Circle */}
              <div
                className="w-7 h-7 mt-3 flex items-center justify-center text-black font-bold rounded-full text-xs flex-shrink-0"
                style={{ backgroundColor: colorMap.get(new Date(event.date).toDateString()) }}
              >
                {new Date(event.date).getDate()}
              </div>

              {/* Event Details */}
              <div
                className="flex flex-col w-5/6 p-2 rounded-lg shadow-sm"
                style={{ backgroundColor: colorMap.get(new Date(event.date).toDateString()) }}
              >
                <div className="flex justify-between items-center w-full">
                  {/* Event Name */}
                  <p
                    className="text-xs font-bold text-black overflow-hidden text-ellipsis whitespace-nowrap max-w-[calc(100%-36px)]"
                    title={event.name}
                  >
                    {event.name}
                  </p>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event._id);
                    }}
                    className="text-md hover:bg-red-800 hover:text-white rounded-full p-1 transition-colors flex-shrink-0"
                    title="Delete event"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Event Description */}
                <p
                  className="text-xs text-black mt-1 font-mono overflow-hidden text-ellipsis whitespace-nowrap max-w-[calc(100%-48px)]"
                  title={event.description}
                >
                  {event.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center text-xs py-4">No events scheduled for this month</p>
        )}
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <AddEventModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddEvent}
        />
      )}

      {/* Event Detail Modal */}
      {isEventDetailOpen && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setIsEventDetailOpen(false)}
          onUserJoined={handleUserJoined}
        />
      )}
    </div>
  );
}

export default EventCalendar;
