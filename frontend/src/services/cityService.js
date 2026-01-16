const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Debug function - can be called from browser console
if (typeof window !== 'undefined') {
  window.testCitiesAPI = async () => {
    console.log('🧪 Testing cities API...');
    console.log('🧪 API_BASE_URL:', API_BASE_URL);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cities`);
      console.log('🧪 Response:', response);
      console.log('🧪 Status:', response.status);
      const data = await response.json();
      console.log('🧪 Data:', data);
      return data;
    } catch (error) {
      console.error('🧪 Error:', error);
      return error;
    }
  };
}

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
    const url = `${API_BASE_URL}/api/cities`;
    console.log('🔵 Fetching cities from:', url);
    console.log('🔵 API_BASE_URL:', API_BASE_URL);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit', // Don't send credentials for this public endpoint
    });
    
    console.log('🔵 Response status:', response.status, response.statusText);
    console.log('🔵 Response ok:', response.ok);
    console.log('🔵 Response type:', response.type);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
      } catch (e) {
        console.error('❌ Could not read error response:', e);
      }
      
      // More specific error messages
      if (response.status === 404) {
        throw new Error(`API endpoint not found (404). Check if backend server is running on ${API_BASE_URL}`);
      } else if (response.status === 0 || response.type === 'opaque') {
        throw new Error(`CORS or network error. Cannot connect to ${url}. Check CORS configuration.`);
      } else {
        throw new Error(`Failed to fetch cities: ${response.status} ${response.statusText}. ${errorText}`);
      }
    }
    
    const data = await response.json();
    console.log('✅ API Response data:', data);
    console.log('✅ Response keys:', Object.keys(data));
    
    // Handle both array and object with data property
    // API returns: { success: true, data: [...] }
    let cities = [];
    if (Array.isArray(data)) {
      cities = data;
      console.log('✅ Data is array, cities count:', cities.length);
    } else if (data.data && Array.isArray(data.data)) {
      cities = data.data;
      console.log('✅ Data has data property, cities count:', cities.length);
    } else if (data.cities && Array.isArray(data.cities)) {
      cities = data.cities;
      console.log('✅ Data has cities property, cities count:', cities.length);
    } else {
      console.warn('⚠️ Unexpected response format:', data);
      console.warn('⚠️ Data type:', typeof data);
      cities = [];
    }
    
    if (cities.length === 0) {
      console.warn('⚠️ No cities found in response');
    } else {
      console.log('✅ Found cities:', cities.length);
    }
    
    const transformedCities = cities.map(transformCity);
    console.log('✅ Transformed cities:', transformedCities.length, transformedCities);
    
    return transformedCities;
  } catch (error) {
    console.error('❌ Error fetching cities:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Provide more helpful error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Network error: Cannot connect to ${API_BASE_URL}. Make sure the backend server is running.`);
    } else if (error.message.includes('CORS')) {
      throw new Error(`CORS error: The backend server is blocking requests from the frontend. Check CORS configuration.`);
    } else {
      // Re-throw error so context can handle it and show error message
      throw error;
    }
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
