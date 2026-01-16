import { createContext, useContext, useState, useEffect } from 'react';
import { getAllCities, getCityById } from '../services/cityService';

const CityContext = createContext();

/**
 * CityContext Provider
 * Manages city data and selected city state
 */
export const CityProvider = ({ children }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all cities on mount
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        setError(null);
        const allCities = await getAllCities();
        setCities(allCities);
      } catch (err) {
        console.error('Error loading cities:', err);
        setError(err.message || 'Failed to load cities');
        setCities([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    loadCities();
  }, []);

  /**
   * Select a city by ID
   * @param {string} cityId - City ID
   */
  const selectCity = async (cityId) => {
    try {
      // First try to find in already loaded cities
      const cityFromList = cities.find(
        city => 
          city.id === cityId || 
          city._id === cityId ||
          city.name?.toLowerCase() === cityId.toLowerCase()
      );
      
      if (cityFromList) {
        setSelectedCity(cityFromList);
        return;
      }
      
      // If not found, fetch from API
      const city = await getCityById(cityId);
      setSelectedCity(city);
    } catch (err) {
      console.error('Error selecting city:', err);
      setSelectedCity(null);
    }
  };

  /**
   * Clear selected city
   */
  const clearSelectedCity = () => {
    setSelectedCity(null);
  };

  const value = {
    cities,
    selectedCity,
    loading,
    error,
    selectCity,
    clearSelectedCity
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
};

/**
 * Hook to use CityContext
 * @returns {Object} City context value
 */
export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
