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

  // Load all cities on mount
  useEffect(() => {
    const loadCities = () => {
      const allCities = getAllCities();
      setCities(allCities);
      setLoading(false);
    };
    loadCities();
  }, []);

  /**
   * Select a city by ID
   * @param {string} cityId - City ID
   */
  const selectCity = (cityId) => {
    const city = getCityById(cityId);
    setSelectedCity(city);
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
