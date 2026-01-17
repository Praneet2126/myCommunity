import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import CityCard from '../components/city/CityCard';
import LoginModal from '../components/auth/LoginModal';
import SignupModal from '../components/auth/SignupModal';
import { searchCities } from '../services/cityService';

function CitiesPage() {
  const { cities, loading } = useCity();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [pendingCityId, setPendingCityId] = useState(null);
  const searchRef = useRef(null);

  // Handle search input change
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    setIsSearching(true);
    setShowDropdown(true);
    
    try {
      const results = await searchCities(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle city card click
  const handleCityClick = (city) => {
    if (isLoggedIn) {
      navigate(`/city/${city.id}`);
    } else {
      setPendingCityId(city.id);
      setIsLoginOpen(true);
    }
  };

  // Handle city selection from dropdown
  const handleCitySelect = (city) => {
    setSearchQuery('');
    setShowDropdown(false);
    if (isLoggedIn) {
      navigate(`/city/${city.id}`);
    } else {
      setPendingCityId(city.id);
      setIsLoginOpen(true);
    }
  };

  // Handle modal close
  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    setPendingCityId(null);
  };

  const handleCloseSignup = () => {
    setIsSignupOpen(false);
    setPendingCityId(null);
  };

  const handleSwitchToSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigate to pending city after successful login
  useEffect(() => {
    if (isLoggedIn && pendingCityId) {
      setIsLoginOpen(false);
      setIsSignupOpen(false);
      navigate(`/city/${pendingCityId}`);
      setPendingCityId(null);
    }
  }, [isLoggedIn, pendingCityId, navigate]);
    
  return (
      <div className="min-h-screen bg-gray-50">
      {/* Header Section with Search */}
      <div className="relative text-white py-16">
        {/* Background Image - Mountain Sunset */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1504598318550-17eba1008a68?w=1920&h=1080&fit=crop&auto=format)',
            filter: 'brightness(0.65) contrast(1.15) saturate(1.2)'
          }}
        />
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/60" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ zIndex: 1 }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
              Explore Cities
            </h1>
            <p className="text-xl text-white/95 max-w-2xl mx-auto drop-shadow-md">
              Discover amazing destinations across India and connect with local communities
            </p>
          </div>

          {/* SEARCH BAR WITH DROPDOWN */}
          <div ref={searchRef} className="relative max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-3 flex items-center gap-3">
              <div className="flex items-center gap-3 w-full px-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  placeholder="Search for cities..."
                  className="w-full py-4 text-gray-700 focus:outline-none text-lg"
                />
                {isSearching && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                )}
              </div>
            </div>

            {/* DROPDOWN RESULTS */}
            {showDropdown && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto" style={{ zIndex: 9999 }}>
                {isSearching ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Searching cities...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Found {searchResults.length} {searchResults.length === 1 ? 'city' : 'cities'}
                    </div>
                    {searchResults.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleCitySelect(city)}
                        className="w-full px-4 py-3 hover:bg-blue-50 flex items-center gap-4 text-left transition-colors"
                      >
                        <img
                          src={city.image}
                          alt={city.displayName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{city.displayName}</h4>
                          <p className="text-sm text-gray-600 truncate">{city.tagline || city.description}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600 font-medium">No cities found</p>
                    <p className="text-gray-400 text-sm mt-1">Try searching with different keywords</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          {/* <span className="text-red-500 font-bold uppercase text-sm">Popular Cities</span> */}
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
            India's Top Destinations
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
              <CityCard key={city.id} city={city} onClick={handleCityClick} />
            ))}
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={handleCloseLogin}
        onSwitchToSignup={handleSwitchToSignup}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupOpen}
        onClose={handleCloseSignup}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
}

export default CitiesPage;