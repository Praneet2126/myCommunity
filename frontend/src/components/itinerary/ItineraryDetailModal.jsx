import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveItinerary } from '../../services/itineraryService';

/**
 * ItineraryDetailModal Component
 * Shows detailed day-wise and time-wise schedule for an itinerary
 */
function ItineraryDetailModal({ itinerary, onClose, cityId = '' }) {
  const { token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  if (!itinerary) return null;

  const getActivitiesByDay = (activities, day) => {
    return activities.filter(act => act.day === day);
  };

  const getDayLabel = (day) => {
    if (day === 1) return 'Day 1';
    if (day === 2) return 'Day 2';
    if (day === 3) return 'Day 3';
    return `Day ${day}`;
  };

  // Get all unique days from activities
  const uniqueDays = [...new Set(itinerary.activities.map(act => act.day))].sort();

  const handleSaveItinerary = async () => {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Token present:', !!token);
    console.log('Itinerary:', itinerary);
    console.log('City ID:', cityId);
    
    if (!token) {
      setSaveMessage('Please login to save itineraries');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Transform itinerary data to match backend schema
      const daysMap = {};
      
      itinerary.activities.forEach(activity => {
        const day = activity.day;
        if (!daysMap[day]) {
          daysMap[day] = {
            day: day,
            activities: [],
            total_duration_mins: 0
          };
        }
        
        // Parse time - handle formats like "9:00 AM", "9:00 AM - 11:00 AM", etc.
        let startTime = activity.time;
        let endTime = activity.time;
        
        if (activity.time.includes(' - ')) {
          const [start, end] = activity.time.split(' - ');
          startTime = start.trim();
          endTime = end.trim();
        } else {
          // If no end time, estimate based on duration
          startTime = activity.time;
          endTime = activity.time; // Keep same for now
        }
        
        daysMap[day].activities.push({
          name: activity.activity,
          start_time: startTime,
          end_time: endTime,
          location: activity.location || '',
          duration: activity.duration || '',
          travel_time_from_prev: '0 mins'
        });
      });

      const daysArray = Object.values(daysMap).sort((a, b) => a.day - b.day);

      // Validate we have activities
      if (daysArray.length === 0) {
        setSaveMessage('Error: No activities found in itinerary');
        setIsSaving(false);
        return;
      }

      const itineraryData = {
        title: itinerary.title || 'Untitled Itinerary',
        city_id: cityId || 'unknown',
        days: daysArray,
        num_people: 2, // Default, can be made dynamic
        estimated_cost: itinerary.estimatedCost || '',
        tags: itinerary.tags || []
      };

      console.log('Saving itinerary:', JSON.stringify(itineraryData, null, 2));
      console.log('Days array length:', daysArray.length);
      console.log('First day activities:', daysArray[0]?.activities?.length);
      
      const response = await saveItinerary(itineraryData, token);
      console.log('Save itinerary response:', response);
      
      if (response.success) {
        setSaveMessage('Itinerary saved successfully!');
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSaveMessage(response.message || 'Failed to save itinerary');
      }
    } catch (error) {
      console.error('Error saving itinerary:', error);
      const errorMessage = error.message || 'Failed to save itinerary';
      setSaveMessage(errorMessage);
      // Keep error message visible longer
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{itinerary.title}</h2>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">{itinerary.days} Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">{itinerary.estimatedCost}</span>
                </div>
                {itinerary.popularity && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a1 1 0 001.581.814l3.854-2.925a1 1 0 00.392-1.242l-1.829-4.243a1 1 0 00-1.15-.666L6 10.333zM16 3.5a1.5 1.5 0 00-3 0v7a1.5 1.5 0 003 0v-7zM12.5 2.5a1.5 1.5 0 00-1.5 1.5v8a1.5 1.5 0 003 0V4a1.5 1.5 0 00-1.5-1.5z" />
                    </svg>
                    <span className="font-semibold">{itinerary.popularity}% Popular</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ml-4"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {itinerary.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium border border-white/30"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Itinerary Details */}
        <div className="p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* Day-wise Schedule */}
          <div className="space-y-6">
            {uniqueDays.map((day) => {
              const dayActivities = getActivitiesByDay(itinerary.activities, day);
              if (dayActivities.length === 0) return null;

              return (
                <div key={day} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  {/* Day Header */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#FF6B35]">
                    <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {day}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{getDayLabel(day)}</h3>
                      <p className="text-sm text-gray-600">
                        {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                      </p>
                    </div>
                  </div>

                  {/* Activities Timeline */}
                  <div className="space-y-4">
                    {dayActivities.map((activity, idx) => (
                      <div key={idx} className="relative pl-8">
                        {/* Timeline Line */}
                        {idx < dayActivities.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gradient-to-b from-[#FF6B35] to-gray-300"></div>
                        )}
                        
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-2 w-6 h-6 bg-[#FF6B35] rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>

                        {/* Activity Card */}
                        <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Time and Duration */}
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-1.5 bg-[#FF6B35]/10 px-2.5 py-1 rounded-full">
                                  <svg className="w-4 h-4 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-bold text-[#FF6B35]">{activity.time}</span>
                                </div>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {activity.duration}
                                </span>
                              </div>

                              {/* Activity Name */}
                              <h4 className="text-lg font-bold text-gray-800 mb-2">{activity.activity}</h4>

                              {/* Location */}
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm font-medium">{activity.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button 
              onClick={handleSaveItinerary}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-[#E55A2B] hover:to-[#D1491F] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSaving ? 'Saving...' : 'Save Itinerary'}
            </button>
            <button className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all">
              Share
            </button>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className={`mt-4 p-3 rounded-lg ${
              saveMessage.includes('success') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItineraryDetailModal;
