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
