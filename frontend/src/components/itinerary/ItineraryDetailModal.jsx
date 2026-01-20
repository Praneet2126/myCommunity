import { useState } from 'react';
import Toast from '../common/Toast';

/**
 * ItineraryDetailModal Component
 * Shows detailed day-wise and time-wise schedule for an itinerary
 */
function ItineraryDetailModal({ itinerary, onClose, activeChatId = null }) {
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });

  if (!itinerary) return null;

  const handleSaveItinerary = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({ message: 'Please login to save itineraries', type: 'error', isVisible: true });
        return;
      }

      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');

      const response = await fetch(`${BASE_URL}/api/users/save-itinerary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: itinerary.title,
          days: itinerary.days,
          activities: itinerary.activities,
          estimatedCost: itinerary.estimatedCost,
          tags: itinerary.tags || [],
          saved_from_chat_id: activeChatId || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setToast({ message: 'Itinerary saved to your profile!', type: 'success', isVisible: true });
      } else {
        setToast({ message: data.message || 'Failed to save itinerary', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error('Error saving itinerary:', error);
      setToast({ message: 'Failed to save itinerary', type: 'error', isVisible: true });
    } finally {
      setSaving(false);
    }
  };

  const getActivitiesByDay = (activities, day) => {
    return activities.filter(act => act.day === day);
  };

  const uniqueDays = [...new Set(itinerary.activities?.map(act => act.day) || [])].sort();

  const getActivityIcon = (activityName) => {
    const name = activityName?.toLowerCase() || '';
    if (name.includes('beach') || name.includes('water') || name.includes('swim')) return '🏖️';
    if (name.includes('hik') || name.includes('trek') || name.includes('mountain')) return '🥾';
    if (name.includes('museum') || name.includes('temple') || name.includes('church') || name.includes('cultur')) return '🏛️';
    if (name.includes('food') || name.includes('lunch') || name.includes('dinner') || name.includes('breakfast') || name.includes('restaurant')) return '🍽️';
    if (name.includes('coffee') || name.includes('cafe')) return '☕';
    if (name.includes('shop')) return '🛍️';
    if (name.includes('hotel') || name.includes('check')) return '🏨';
    if (name.includes('airport') || name.includes('flight')) return '✈️';
    if (name.includes('walk') || name.includes('tour')) return '🚶';
    if (name.includes('night') || name.includes('party') || name.includes('club')) return '🎉';
    if (name.includes('sunset') || name.includes('view')) return '🌅';
    if (name.includes('adventure') || name.includes('sport')) return '🎯';
    if (name.includes('market')) return '🏪';
    return '📍';
  };

  const totalActivities = itinerary.activities?.length || 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Clean White with Orange Accent */}
        <div className="flex-shrink-0 border-b border-gray-100">
          {/* Orange accent bar */}
          <div className="h-1 bg-[#FF6B35]"></div>
          
          <div className="p-5">
            {/* Top row with close button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{itinerary.title}</h2>
                  <p className="text-sm text-gray-500">Trip Itinerary</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <svg className="w-4 h-4 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{itinerary.days} Days</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <svg className="w-4 h-4 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{totalActivities} Activities</span>
              </div>
              {itinerary.estimatedCost && itinerary.estimatedCost !== 'Custom' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <svg className="w-4 h-4 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{itinerary.estimatedCost}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {itinerary.tags && itinerary.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {itinerary.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Day tabs */}
            {uniqueDays.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveDay(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeDay === null
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Days
                </button>
                {uniqueDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeDay === day
                        ? 'bg-[#FF6B35] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Itinerary Details */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
          <div className="p-5 space-y-6">
            {uniqueDays
              .filter(day => activeDay === null || activeDay === day)
              .map((day) => {
                const dayActivities = getActivitiesByDay(itinerary.activities, day);
                if (dayActivities.length === 0) return null;

                return (
                  <div key={day}>
                    {/* Day header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center text-white font-bold text-sm">
                        {day}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Day {day}</h3>
                        <p className="text-xs text-gray-500">
                          {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                        </p>
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="space-y-3 ml-5 pl-5 border-l-2 border-[#FF6B35]/20">
                      {dayActivities.map((activity, idx) => (
                        <div 
                          key={idx} 
                          className="relative bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#FF6B35]/30 transition-all"
                        >
                          {/* Timeline dot */}
                          <div className="absolute -left-[27px] top-5 w-3 h-3 rounded-full bg-white border-2 border-[#FF6B35]"></div>

                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl">
                              {getActivityIcon(activity.activity)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Time and duration */}
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-semibold rounded">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {activity.time}
                                </span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                  {activity.duration}
                                </span>
                              </div>

                              {/* Activity name */}
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {activity.activity}
                              </h4>

                              {/* Location */}
                              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{activity.location}</span>
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
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-gray-100">
          <div className="flex gap-3">
            <button 
              onClick={handleSaveItinerary}
              disabled={saving}
              className="flex-1 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-5 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>Save Itinerary</span>
                </>
              )}
            </button>
            <button className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}

export default ItineraryDetailModal;
