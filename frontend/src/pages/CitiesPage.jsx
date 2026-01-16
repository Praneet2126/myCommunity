import React from 'react'
import { useCity } from '../context/CityContext';
import CityCard from '../components/city/CityCard';

function CitiesPage() {
    const { cities, loading } = useCity();
    
  return (
    <div>
        <div id="cities" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
    <div className="text-center mb-14">
      <span className="text-red-500 font-bold uppercase text-sm">Popular Cities</span>
      <h2 className="text-4xl font-extrabold text-gray-900 mt-2">
        Explore India's Top Destinations
      </h2>
    </div>

    {loading ? (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading cities...</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cities.map(city => (
          <CityCard key={city.id} city={city} />
        ))}
      </div>
    )}
  </div>
  </div>
  )
}

export default CitiesPage