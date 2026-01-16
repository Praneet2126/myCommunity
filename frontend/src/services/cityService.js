const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Transform API city data to frontend format
 * @param {Object} apiCity - City object from API
 * @returns {Object} Transformed city object
 */
const transformCity = (apiCity) => {
  return {
    id: apiCity._id || apiCity.name?.toLowerCase(), // Use _id as id, fallback to name
    _id: apiCity._id,
    name: apiCity.name,
    displayName: apiCity.displayName || apiCity.name,
    description: apiCity.description || '',
    image: apiCity.image || '',
    tagline: apiCity.tagline || '',
    is_active: apiCity.is_active ?? true,
    member_count: apiCity.member_count || 0,
    created_at: apiCity.created_at,
    updated_at: apiCity.updated_at
  };
};

/**
 * Get all cities from API
 * @returns {Promise<Array>} Array of city objects
 */
export const getAllCities = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cities`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Handle both array and object with data property
    const cities = Array.isArray(data) ? data : (data.data || data.cities || []);
    return cities.map(transformCity);
  } catch (error) {
    console.error('Error fetching cities:', error);
    // Return empty array on error to prevent crashes
    return [];
  }
};

/**
 * Get city by ID or name
 * @param {string} cityId - City ID or name
 * @returns {Promise<Object|null>} City object or null if not found
 */
export const getCityById = async (cityId) => {
  try {
    // First try to get all cities and find the matching one
    const cities = await getAllCities();
    const normalizedId = cityId.toLowerCase();
    
    const city = cities.find(
      city => 
        city.id?.toLowerCase() === normalizedId || 
        city._id === cityId ||
        city.name?.toLowerCase() === normalizedId
    );
    
    return city || null;
  } catch (error) {
    console.error('Error fetching city by ID:', error);
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
