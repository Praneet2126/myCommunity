import { CITIES } from '../utils/constants';

/**
 * Get all cities
 * @returns {Array} Array of city objects
 */
export const getAllCities = () => {
  return CITIES;
};

/**
 * Get city by ID or name
 * @param {string} cityId - City ID or name
 * @returns {Object|null} City object or null if not found
 */
export const getCityById = (cityId) => {
  const normalizedId = cityId.toLowerCase();
  return CITIES.find(
    city => city.id === normalizedId || city.name.toLowerCase() === normalizedId
  ) || null;
};

/**
 * Get city by name (case-insensitive)
 * @param {string} cityName - City name
 * @returns {Object|null} City object or null if not found
 */
export const getCityByName = (cityName) => {
  return getCityById(cityName);
};
