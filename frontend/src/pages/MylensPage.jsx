import { useState, useRef } from 'react';
import { searchSimilarHotels } from '../services/imageSearchService';
import { getHotelFirstImageUrl } from '../services/hotelService';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/auth/LoginModal';
import SignupModal from '../components/auth/SignupModal';

/**
 * MylensPage Component
 * AI-powered image search for finding similar hotels
 * Requires authentication to access
 */
function MylensPage() {
  const { isLoggedIn } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
    setIsSignupModalOpen(false);
  };

  const handleOpenSignup = () => {
    setIsSignupModalOpen(true);
    setIsLoginModalOpen(false);
  };

  const handleCloseModals = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
      setHotels([]);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
      setHotels([]);
    } else {
      setError('Please drop a valid image file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle image search
  const handleSearch = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setHotels([]);

    try {
      const response = await searchSimilarHotels(selectedImage);
      
      if (response.similar_hotels && Array.isArray(response.similar_hotels)) {
        // Use best matching image from AI search results
        const hotelsWithImages = response.similar_hotels.map((hotel) => {
          // Priority: best_match_image_path (the actual matching image) > image_url
          const API_BASE_URL = import.meta.env.VITE_API_URL 
            ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
            : 'http://localhost:3000';
          
          let imageUrl = hotel.image_url;
          
          // If best_match_image_path is available, use it (this is the best matching image)
          if (hotel.best_match_image_path) {
            imageUrl = `${API_BASE_URL}${hotel.best_match_image_path}`;
          }
          
          return {
            ...hotel,
            image_url: imageUrl
          };
        });
        setHotels(hotelsWithImages);
      } else {
        setError('No similar hotels found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search for similar hotels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setHotels([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50/50 relative">
        {/* Blurred Background Preview */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="relative bg-gradient-to-br from-slate-200 via-blue-200 to-indigo-200 min-h-screen filter blur-sm opacity-60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full mb-6 border border-indigo-100">
                  <span className="text-sm font-semibold text-indigo-700">AI-Powered Visual Search</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">myLens</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Login Prompt Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            {/* Lock Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <img src="/myLogo.png" alt="my" className="w-8 h-8 object-contain" />
              <span>Lens</span>
            </h2>
            <p className="text-gray-600 mb-6">
              Sign in to access AI-powered visual hotel search and discover your perfect stay.
            </p>

            {/* Features Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-3">What you'll get:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Upload any hotel image
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI finds visually similar hotels
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save to your trip recommendations
                </li>
              </ul>
            </div>

            {/* Login Button */}
            <button
              onClick={handleOpenLogin}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mb-3"
            >
              Sign In to Continue
            </button>

            {/* Signup Link */}
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                onClick={handleOpenSignup}
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Sign up for free
              </button>
            </p>
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={handleCloseModals}
          onSwitchToSignup={handleOpenSignup}
        />

        {/* Signup Modal */}
        <SignupModal
          isOpen={isSignupModalOpen}
          onClose={handleCloseModals}
          onSwitchToLogin={handleOpenLogin}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-200 via-blue-200 to-indigo-200 overflow-hidden border-b border-gray-200">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'10\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full mb-6 border border-indigo-100">
              <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-indigo-700">AI-Powered Visual Search</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <img src="/myLogo.png" alt="my" className="w-12 h-12 md:w-14 md:h-14 object-contain" />
              <span>Lens</span>
            </h1>
            <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
              Discover similar hotels using advanced AI image recognition. Upload a hotel image to find matching accommodations.
            </p>
          </div>

          {/* Image Upload Section */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm">
              {!imagePreview ? (
                <div className="text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="cursor-pointer flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 relative z-10"
                  >
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-900 text-lg font-semibold mb-1">Upload Hotel Image</p>
                    <p className="text-gray-500 text-sm">Click to browse or drag and drop</p>
                    <p className="text-gray-400 text-xs mt-2">Supports: JPG, PNG, WebP</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-full shadow-md transition-colors border border-gray-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span>Find Similar Hotels</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors border border-gray-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Results Header */}
        {hotels.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Found {hotels.length} Similar {hotels.length === 1 ? 'Hotel' : 'Hotels'}
            </h2>
            <p className="text-gray-600">Similar hotels found based on your image</p>
          </div>
        )}

        {/* Hotels List */}
        {hotels.length > 0 ? (
          <div className="space-y-4">
            {hotels.map((hotel, index) => (
              <div
                key={hotel.hotel_id || index}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200/60 group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left Side - Hotel Image (1/3) */}
                  <div className="md:w-1/3 relative h-48 md:h-auto md:min-h-[220px] overflow-hidden bg-gray-100">
                    {hotel.image_url ? (
                      <img
                        src={hotel.image_url}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Hotel Details (2/3) */}
                  <div className="md:w-2/3 p-5 md:p-6 flex flex-col justify-between bg-white">
                    {/* Top Section */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors flex-1">
                          {hotel.name}
                        </h3>
                        {hotel.price && (
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg md:text-xl font-bold text-indigo-600">{formatPrice(hotel.price)}</div>
                            <div className="text-xs text-gray-500">per night</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Stars */}
                      {hotel.stars > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < hotel.stars ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="text-gray-500 text-sm ml-1">{hotel.stars} Star{hotel.stars !== 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
                        {hotel.description || 'No description available'}
                      </p>
                    </div>

                    {/* Bottom Section - Score Breakdown */}
                    {hotel.score_breakdown && (
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                          <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <div>
                            <div className="text-xs text-indigo-600 font-medium">AI Score</div>
                            <div className="text-sm font-bold text-indigo-700">
                              {(hotel.score_breakdown.ai_semantic_score * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error && imagePreview ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Search</h3>
            <p className="text-gray-600">Click "Find Similar Hotels" to discover matching accommodations</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default MylensPage;
