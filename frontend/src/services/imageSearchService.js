/**
 * Image Search Service
 * Handles API calls to the AI service for hotel image search
 */

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Search for similar hotels based on an image
 * @param {File} imageFile - The image file to search with
 * @returns {Promise<Object>} Response with similar_hotels array
 */
export const searchSimilarHotels = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${AI_SERVICE_URL}/api/v1/hotels/similar`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.detail ||
        errorData.message ||
        `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching similar hotels:', error);
    throw error;
  }
};

/**
 * Get health status of AI service
 * @returns {Promise<Object>} Health status
 */
export const checkAIServiceHealth = async () => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`);
    if (!response.ok) {
      throw new Error('AI service is not available');
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking AI service health:', error);
    throw error;
  }
};
