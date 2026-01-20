import { useState, useRef, useEffect } from 'react';

/**
 * ChatInput component
 * Input field for sending messages with + menu for AI features and image upload
 * @param {Object} props - Component props
 * @param {Function} props.onSend - Callback function when message is sent
 * @param {Function} props.onAIClick - Callback function when AI Summary is clicked
 * @param {Function} props.onMyLensClick - Callback function when myLens is clicked
 * @param {Function} props.onImageUpload - Callback function when image is uploaded
 * @param {boolean} props.isUploadingImage - Whether an image is currently being uploaded
 */
function ChatInput({ onSend, onAIClick, onMyLensClick, onImageUpload, isUploadingImage }) {
  const [message, setMessage] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(true);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleAISummary = () => {
    setShowPlusMenu(false);
    if (onAIClick) {
      onAIClick();
    }
  };

  const handleMyLens = () => {
    setShowPlusMenu(false);
    if (onMyLensClick) {
      onMyLensClick();
    }
  };

  const handleImageClick = () => {
    setShowPlusMenu(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div className="flex items-center gap-2">
        {/* Plus Button with Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            disabled={isUploadingImage}
            className={`p-2.5 rounded-full transition-all ${
              showPlusMenu 
                ? 'bg-[#FF6B35] text-white rotate-45' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="More options"
          >
            {isUploadingImage ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>

          {/* Plus Menu Dropdown */}
          {showPlusMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              {/* Upload Image Option */}
              <button
                type="button"
                onClick={handleImageClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-colors border-b border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Upload Image</p>
                  <p className="text-xs text-gray-500">Share a photo</p>
                </div>
              </button>
              <button
                type="button"
                onClick={handleMyLens}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-colors border-b border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">myLens</p>
                  <p className="text-xs text-gray-500">Find similar hotels</p>
                </div>
              </button>
              <button
                type="button"
                onClick={handleAISummary}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">AI Summary</p>
                  <p className="text-xs text-gray-500">Get key points</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-sm"
        />

        {/* Send Button - Forward Arrow */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="bg-[#FF6B35] text-white p-2.5 rounded-full hover:bg-[#E55A2B] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          aria-label="Send message"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}

export default ChatInput;
