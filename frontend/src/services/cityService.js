const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Get all cities from backend
 * @returns {Promise<Array>} Array of city objects
 */
export const getAllCities = async () => {
  try {
    const response = await fetch(`${API_URL}/cities`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch cities');
    }
    
    // Transform backend data to frontend format
    const cities = data.data.map(city => ({
      id: city._id,
      name: city.name,
      displayName: city.displayName,
      description: city.description,
      image: city.image,
      tagline: city.tagline,
      memberCount: city.member_count || 0
    }));
    
    return cities;
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

/**
 * Get city by ID or name from backend
 * @param {string} cityId - City ID or name
 * @returns {Promise<Object|null>} City object or null if not found
 */
export const getCityById = async (cityId) => {
  try {
    // First try to fetch by MongoDB ID
    let response = await fetch(`${API_URL}/cities/${cityId}`);
    
    // If not found by ID, try to find by name from all cities
    if (!response.ok) {
      const allCities = await getAllCities();
      const normalizedId = cityId.toLowerCase();
      return allCities.find(
        city => city.id === normalizedId || city.name.toLowerCase() === normalizedId
      ) || null;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      return null;
    }
    
    // Transform backend data to frontend format
    const city = data.data;
    return {
      id: city._id,
      name: city.name,
      displayName: city.displayName,
      description: city.description,
      image: city.image,
      tagline: city.tagline,
      memberCount: city.member_count || 0
    };
  } catch (error) {
    console.error('Error fetching city:', error);
    return null;
  }
};

/**
 * Get city by name (case-insensitive)
 * @param {string} cityName - City name
 * @returns {Promise<Object|null>} City object or null if not found
 */
export const getCityByName = async (cityName) => {
  return getCityById(cityName);
};

/**
 * Join a city
 * @param {string} cityId - City ID
 * @returns {Promise<Object>} Result object
 */
export const joinCity = async (cityId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in to join a city');
    }

    const response = await fetch(`${API_URL}/cities/${cityId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // If already a member, that's okay
      if (data.message && data.message.includes('already a member')) {
        return { success: true, alreadyMember: true };
      }
      throw new Error(data.message || 'Failed to join city');
    }

    return data;
  } catch (error) {
    console.error('Error joining city:', error);
    throw error;
  }
};

/**
 * Leave a city
 * @param {string} cityId - City ID
 * @returns {Promise<Object>} Result object
 */
export const leaveCity = async (cityId) => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('You must be logged in to leave a city');
    }

    const response = await fetch(`${API_URL}/cities/${cityId}/leave`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to leave city');
    }

    return data;
  } catch (error) {
    console.error('Error leaving city:', error);
    throw error;
  }
};

/**
 * Check if user is a member of a city
 * @param {string} cityId - City ID
 * @returns {Promise<boolean>} True if user is a member
 */
export const checkMembership = async (cityId) => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      return false;
    }

    const response = await fetch(`${API_URL}/cities/${cityId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    // Check if current user is in the members list
    const userId = JSON.parse(localStorage.getItem('user'))?._id;
    return data.data.some(membership => membership.user_id._id === userId);
  } catch (error) {
    console.error('Error checking membership:', error);
    return false;
  }
};

/**
 * Search cities by query string
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching city objects
 */
export const searchCities = async (query) => {
  try {
    if (!query || query.trim() === '') {
      return getAllCities();
    }
    
    const allCities = await getAllCities();
    const searchTerm = query.toLowerCase().trim();
    
    // Filter cities that match the search query in name or description
    const filteredCities = allCities.filter(city => 
      city.name.toLowerCase().includes(searchTerm) ||
      city.displayName.toLowerCase().includes(searchTerm) ||
      city.description.toLowerCase().includes(searchTerm) ||
      city.tagline?.toLowerCase().includes(searchTerm)
    );
    
    return filteredCities;
  } catch (error) {
    console.error('Error searching cities:', error);
    throw error;
  }
};
