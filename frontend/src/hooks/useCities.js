import { useCity } from '../context/CityContext';

/**
 * Custom hook for cities
 * Provides convenient access to city data and operations
 * @returns {Object} Cities data and operations
 */
export const useCities = () => {
  const { cities, selectedCity, loading, selectCity, clearSelectedCity } = useCity();

  /**
   * Get city by ID
   * @param {string} cityId - City ID
   * @returns {Object|null} City object or null
   */
  const getCity = (cityId) => {
    return cities.find(city => city.id === cityId || city.name.toLowerCase() === cityId.toLowerCase()) || null;
  };

  /**
   * Check if a city is selected
   * @param {string} cityId - City ID to check
   * @returns {boolean} True if city is selected
   */
  const isCitySelected = (cityId) => {
    return selectedCity?.id === cityId;
  };

  return {
    cities,
    selectedCity,
    loading,
    selectCity,
    clearSelectedCity,
    getCity,
    isCitySelected
  };
};

export default useCities;
