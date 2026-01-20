/**
 * Hotel Service
 * Handles API calls for hotel information and images
 */

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:3000';

/**
 * Get hotel information including first image URL
 * @param {string} hotelName - The name of the hotel
 * @returns {Promise<Object>} Hotel information with image URL
 */
export const getHotelInfo = async (hotelName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/hotels/${encodeURIComponent(hotelName)}/info`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch hotel info: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching hotel info:', error);
    throw error;
  }
};

/**
 * Get the URL for the first image of a hotel
 * @param {string} hotelName - The name of the hotel
 * @returns {Promise<string>} Image URL
 */
export const getHotelFirstImageUrl = async (hotelName) => {
  try {
    const url = `${API_BASE_URL}/api/hotels/${encodeURIComponent(hotelName)}/first-image`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch hotel image: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data.image_url) {
      // Return full URL
      return `${API_BASE_URL}${data.data.image_url}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching hotel image URL:', error);
    return null;
  }
};

/**
 * Get image URL for a specific hotel and image name
 * @param {string} hotelName - The name of the hotel
 * @param {string} imageName - The name of the image file
 * @returns {string} Full image URL
 */
export const getHotelImageUrl = (hotelName, imageName) => {
  return `${API_BASE_URL}/api/hotels/${encodeURIComponent(hotelName)}/image/${encodeURIComponent(imageName)}`;
};
