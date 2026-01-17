const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Transform API event data to frontend format
 * @param {Object} apiEvent - Event object from API
 * @returns {Object} Transformed event object
 */
const transformEvent = (apiEvent) => {
  // Format date to YYYY-MM-DD
  let formattedDate = '';
  if (apiEvent.date) {
    const date = new Date(apiEvent.date);
    formattedDate = date.toISOString().split('T')[0];
  }
  
  return {
    _id: apiEvent._id,
    id: apiEvent._id,
    city_id: apiEvent.city_id?._id || apiEvent.city_id,
    cityName: apiEvent.city_id?.name || apiEvent.city_id?.displayName || '',
    name: apiEvent.name,
    description: apiEvent.description || '',
    date: formattedDate,
    type: apiEvent.type || 'Cultural',
    image: apiEvent.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    location: apiEvent.location || 'City Center',
    time: apiEvent.time || '6:00 PM - 9:00 PM',
    attendees: apiEvent.attendees || '100+',
    created_by: apiEvent.created_by?._id || apiEvent.created_by || null,
    created_by_user: apiEvent.created_by,
    is_active: apiEvent.is_active ?? true
  };
};

/**
 * Get all events from API
 * @param {string|null} cityId - City ID (optional, null for all cities)
 * @param {number} year - Year (optional)
 * @param {number} month - Month 0-11 (optional)
 * @returns {Promise<Array>} Array of event objects
 */
export const getAllEvents = async (cityId = null, year = null, month = null) => {
  try {
    let url = `${API_URL}/events`;
    const params = new URLSearchParams();
    
    if (cityId) {
      params.append('cityId', cityId);
    }
    if (year !== null && month !== null) {
      params.append('year', year);
      params.append('month', month);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    const data = await response.json();
    const events = data.data || [];
    return events.map(transformEvent);
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

/**
 * Get events for a specific city
 * @param {string} cityId - City ID
 * @returns {Promise<Array>} Array of event objects
 */
export const getEventsByCity = async (cityId) => {
  return getAllEvents(cityId);
};

/**
 * Get events for a specific month (from all cities or a specific city)
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @param {string|null} cityId - City ID (optional, null for all cities)
 * @returns {Promise<Array>} Array of event objects
 */
export const getEventsByMonth = async (year, month, cityId = null) => {
  return getAllEvents(cityId, year, month);
};

/**
 * Get events by date
 * @param {string|null} cityId - City ID (null for all cities)
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of events on that date
 */
export const getEventsByDate = async (cityId = null, date) => {
  try {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    let url = `${API_URL}/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    if (cityId) {
      url += `&cityId=${cityId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    const data = await response.json();
    const events = data.data || [];
    return events.map(transformEvent);
  } catch (error) {
    console.error('Error fetching events by date:', error);
    return [];
  }
};

/**
 * Get upcoming events
 * @param {string} cityId - City ID
 * @returns {Promise<Array>} Array of upcoming event objects
 */
export const getUpcomingEvents = async (cityId) => {
  try {
    const today = new Date();
    const twoMonthsLater = new Date(today);
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    
    let url = `${API_URL}/events?startDate=${today.toISOString()}&endDate=${twoMonthsLater.toISOString()}`;
    if (cityId) {
      url += `&cityId=${cityId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    const data = await response.json();
    const events = data.data || [];
    return events.map(transformEvent).sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
};

/**
 * Create a new event
 * @param {Object} eventData - Event data including cityId, name, date, etc.
 * @param {File|null} imageFile - Image file to upload (optional)
 * @returns {Promise<Object>} Created event object
 */
export const createEvent = async (eventData, imageFile = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const formData = new FormData();
    formData.append('cityId', eventData.cityId);
    formData.append('name', eventData.name);
    formData.append('date', eventData.date);
    formData.append('type', eventData.type || 'Cultural');
    formData.append('description', eventData.description || '');
    formData.append('location', eventData.location || 'City Center');
    formData.append('time', eventData.time || '6:00 PM - 9:00 PM');
    formData.append('attendees', eventData.attendees || '100+');
    
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (eventData.imageUrl) {
      formData.append('imageUrl', eventData.imageUrl);
    }
    
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create event');
    }
    
    const data = await response.json();
    return transformEvent(data.data);
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Update an event
 * @param {string} eventId - Event ID
 * @param {Object} eventData - Updated event data
 * @param {File|null} imageFile - New image file (optional)
 * @returns {Promise<Object>} Updated event object
 */
export const updateEvent = async (eventId, eventData, imageFile = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const formData = new FormData();
    if (eventData.name) formData.append('name', eventData.name);
    if (eventData.date) formData.append('date', eventData.date);
    if (eventData.type) formData.append('type', eventData.type);
    if (eventData.description !== undefined) formData.append('description', eventData.description);
    if (eventData.location) formData.append('location', eventData.location);
    if (eventData.time) formData.append('time', eventData.time);
    if (eventData.attendees) formData.append('attendees', eventData.attendees);
    
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (eventData.imageUrl) {
      formData.append('imageUrl', eventData.imageUrl);
    }
    
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update event');
    }
    
    const data = await response.json();
    return transformEvent(data.data);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 * @param {string} eventId - Event ID
 * @returns {Promise<void>}
 */
export const deleteEvent = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete event');
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object|null>} Event object or null
 */
export const getEventById = async (eventId) => {
  try {
    const response = await fetch(`${API_URL}/events/${eventId}`);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return transformEvent(data.data);
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
};
