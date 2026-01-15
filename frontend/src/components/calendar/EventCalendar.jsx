import { useState } from 'react';
import { getUpcomingEvents, getEventsByDate } from '../../services/eventService';

/**
 * EventCalendar component
 * Calendar widget showing city-specific events
 * @param {Object} props - Component props
 * @param {string} props.cityId - City ID
 */
function EventCalendar({ cityId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const events = getUpcomingEvents(cityId);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  // Get events for a specific date
  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getEventsByDate(cityId, dateStr);
  };

  // Check if date has events
  const hasEvents = (day) => {
    return getEventsForDate(day).length > 0;
  };

  // Format date for display
  const formatDate = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render calendar days
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateEvents = getEventsForDate(day);
      const hasEvent = dateEvents.length > 0;
      const isSelected = selectedDate === day;
      const isToday = 
        new Date().getDate() === day &&
        new Date().getMonth() === month &&
        new Date().getFullYear() === year;

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(isSelected ? null : day)}
          className={`h-12 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
            isSelected ? 'bg-orange-100 border-[#FF6B35]' : ''
          } ${isToday ? 'ring-2 ring-[#1976D2]' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-medium ${
                isToday ? 'text-[#1976D2]' : 'text-gray-700'
              }`}
            >
              {day}
            </span>
            {hasEvent && (
              <div className="w-2 h-2 bg-[#FF6B35] rounded-full" />
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-800">
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
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
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {renderCalendarDays()}
      </div>

      {/* Selected Date Events */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-800 mb-3">
            Events on {monthNames[month]} {selectedDate}
          </h4>
          <div className="space-y-2">
            {selectedDateEvents.map((event, index) => (
              <div
                key={index}
                className="bg-orange-50 border-l-4 border-[#FF6B35] p-3 rounded-r-lg"
              >
                <p className="font-semibold text-gray-800">{event.name}</p>
                <p className="text-sm text-gray-600">{event.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events List */}
      {events.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-800 mb-3">Upcoming Events</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.slice(0, 5).map((event, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-[#FF6B35] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {new Date(event.date).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{event.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-[#1976D2] rounded">
                    {event.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="border-t border-gray-200 pt-4 text-center text-gray-500 text-sm">
          No upcoming events
        </div>
      )}
    </div>
  );
}

export default EventCalendar;
