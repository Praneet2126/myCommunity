import { useState, useRef } from 'react';
import { searchSimilarHotels } from '../../services/imageSearchService';

/**
 * MyLensModal Component
 * Modal for uploading images and finding similar hotels
 * Allows users to add hotels to recommendations
 */
function MyLensModal({ isOpen, onClose, onAddToRecommendations, chatId }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingHotel, setAddingHotel] = useState(null);
  const [addedHotels, setAddedHotels] = useState(new Set());
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // Check if there's unsaved data
  const hasUnsavedData = () => {
    return imagePreview || hotels.length > 0;
  };

  // Handle X button click
  const handleCloseClick = () => {
    if (hasUnsavedData()) {
      setShowCloseConfirm(true);
    } else {
      handleClose();
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setHotels([]);
    setError(null);
    setAddingHotel(null);
    setAddedHotels(new Set());
    setShowCloseConfirm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
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
        setHotels(response.similar_hotels);
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

  // Handle adding hotel to recommendations
  const handleAddToRecommendations = async (hotel) => {
    if (!chatId || !onAddToRecommendations) {
      setError('Cannot add to recommendations: Chat ID missing');
      return;
    }

    setAddingHotel(hotel.hotel_id);
    try {
      await onAddToRecommendations(hotel, chatId);
      // Success - mark hotel as added
      setAddedHotels(prev => new Set([...prev, hotel.hotel_id]));
    } catch (err) {
      console.error('Error adding hotel to recommendations:', err);
      setError(err.message || 'Failed to add hotel to recommendations');
    } finally {
      setAddingHotel(null);
    }
  };

  // Format similarity score as percentage
  const formatScore = (score) => {
    return ((score * 100) / 1.2).toFixed(1);
  };

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Close Confirmation Popup */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
                <p className="text-sm text-gray-600">You may lose your search results and data.</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-5">
              Are you sure you want to close? Your uploaded image and hotel search results will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Yes, Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">myLens</h2>
              <p className="text-indigo-100 text-sm mt-1">AI-powered hotel image search</p>
            </div>
            <button
              onClick={handleCloseClick}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Image Upload Section */}
          {!imagePreview ? (
            <div className="text-center py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="mylens-image-upload"
              />
              <label
                htmlFor="mylens-image-upload"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="cursor-pointer flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200"
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
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setHotels([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
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
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {hotels.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Found {hotels.length} Similar {hotels.length === 1 ? 'Hotel' : 'Hotels'}
              </h3>
              <div className="space-y-4">
                {hotels.map((hotel, index) => (
                  <div
                    key={hotel.hotel_id || index}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Hotel Image */}
                      <div className="md:w-1/3 relative h-48 md:h-auto md:min-h-[180px] overflow-hidden bg-gray-100">
                        {hotel.best_match_image_path ? (
                          <img
                            src={`${import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001'}/${hotel.best_match_image_path}`}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
                            }}
                          />
                        ) : hotel.image_url ? (
                          <img
                            src={hotel.image_url}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
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
                        
                        {/* Similarity Score Badge */}
                        <div className="absolute top-3 left-3">
                          <div className="bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-lg shadow-md border border-gray-200/50">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="font-semibold text-xs text-gray-900">{formatScore(hotel.similarity_score)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hotel Details */}
                      <div className="md:w-2/3 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 flex-1">
                              {hotel.name}
                            </h3>
                            {hotel.price && (
                              <div className="text-right flex-shrink-0">
                                <div className="text-lg font-bold text-indigo-600">{formatPrice(hotel.price)}</div>
                                <div className="text-xs text-gray-500">per night</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Stars */}
                          {hotel.stars > 0 && (
                            <div className="flex items-center gap-1 mb-2">
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

                        {/* Add to Recommendations Button */}
                        {chatId ? (
                          addedHotels.has(hotel.hotel_id) ? (
                            <div className="w-full bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Added to Recommendations</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToRecommendations(hotel)}
                              disabled={addingHotel === hotel.hotel_id}
                              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {addingHotel === hotel.hotel_id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  <span>Adding...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Add to Recommendations</span>
                                </>
                              )}
                            </button>
                          )
                        ) : (
                          <div className="w-full bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm text-center">
                            Join a private chat to add recommendations
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyLensModal;
