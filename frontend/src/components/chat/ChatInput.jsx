import { useState, useRef, useEffect } from 'react';

/**
 * ChatInput component
 * Input field for sending messages with + menu for AI features
 * @param {Object} props - Component props
 * @param {Function} props.onSend - Callback function when message is sent
 * @param {Function} props.onAIClick - Callback function when AI Summary is clicked
 */
function ChatInput({ onSend, onAIClick }) {
  const [message, setMessage] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const menuRef = useRef(null);

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

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
      <div className="flex items-center gap-2">
        {/* Plus Button with Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className={`p-2.5 rounded-full transition-all ${
              showPlusMenu 
                ? 'bg-[#FF6B35] text-white rotate-45' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="More options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Plus Menu Dropdown */}
          {showPlusMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
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
