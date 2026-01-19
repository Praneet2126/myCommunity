import { useState } from 'react';

/**
 * ChatInput component
 * Input field for sending messages
 * @param {Object} props - Component props
 * @param {Function} props.onSend - Callback function when message is sent
 * @param {Function} props.onAIClick - Callback function when AI Summary button is clicked
 */
function ChatInput({ onSend, onAIClick }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleAISummary = () => {
    if (onAIClick) {
      onAIClick();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
      <div className="flex items-center space-x-3">
        {/* Input Field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
        />

        {/* Send Button - Horizontal Arrow */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="bg-[#FF6B35] text-white p-3 rounded-full hover:bg-[#E55A2B] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          aria-label="Send message"
        >
          <svg
            className="w-5 h-5 transform rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>

        {/* AI Summary Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={handleAISummary}
            className="bg-[#4169e1] text-white p-3 rounded-full hover:bg-[#4169e1]/90 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            aria-label="AI Summary"
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </button>
          
          {/* Enhanced Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:-translate-y-1 pointer-events-none">
            <div className="bg-gradient-to-r from-[#4169e1] to-[#5179f1] text-white px-4 py-2.5 rounded-xl shadow-xl">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-semibold whitespace-nowrap">AI Summary</span>
              </div>
              {/* Arrow */}
              <div className="absolute top-full right-4 -mt-1">
                <div className="border-8 border-transparent border-t-[#4169e1]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default ChatInput;
