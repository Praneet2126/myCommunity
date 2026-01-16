import { useState, useEffect, useCallback } from 'react';

/**
 * CreatePrivateChat component
 * Modal/form to create a new private chat group
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onCreate - Callback to create chat with (name, description, participants)
 */
function CreatePrivateChat({ onClose, onCreate }) {
  const [chatName, setChatName] = useState('');
  const [description, setDescription] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search function
  const searchUsers = useCallback(async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.length < 3) {
      setUserSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/users/search-by-email?email=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.data) {
        // Filter out already added participants
        const isAlreadyAdded = participants.find(p => p._id === data.data._id);
        if (!isAlreadyAdded) {
          setUserSuggestions([data.data]);
          setShowSuggestions(true);
        } else {
          setUserSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setUserSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Search user error:', error);
      setUserSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  }, [participants]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(emailInput);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [emailInput, searchUsers]);

  const handleAddParticipant = (user) => {
    // Check if user is already added
    if (participants.find(p => p._id === user._id)) {
      setSearchError('User already added to the group');
      return;
    }

    setParticipants([...participants, user]);
    setEmailInput('');
    setSearchError('');
    setUserSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRemoveParticipant = (userId) => {
    setParticipants(participants.filter(p => p._id !== userId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatName.trim()) {
      onCreate(chatName.trim(), description.trim(), participants);
      setChatName('');
      setDescription('');
      setParticipants([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create Private Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="chatName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Chat Name *
            </label>
            <input
              type="text"
              id="chatName"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="e.g., Mumbai Foodies"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this chat about?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none"
            />
          </div>

          {/* Add Participants */}
          <div className="relative">
            <label
              htmlFor="emailInput"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Add Participants
            </label>
            <div className="relative">
              <input
                type="email"
                id="emailInput"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setSearchError('');
                }}
                placeholder="Enter user's email address (min 3 characters)"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            {searchError && (
              <p className="text-red-500 text-sm mt-1">{searchError}</p>
            )}

            {/* User Suggestions Dropdown */}
            {showSuggestions && userSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {userSuggestions.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleAddParticipant(user)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user.full_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-gray-600 text-xs truncate">
                        {user.email}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Participants List */}
          {participants.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Added Participants ({participants.length})
              </p>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant._id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {participant.full_name?.charAt(0).toUpperCase() || participant.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {participant.full_name || participant.username}
                        </p>
                        <p className="text-gray-600 text-xs truncate">
                          {participant.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(participant._id)}
                      className="ml-2 text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                      aria-label="Remove participant"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!chatName.trim()}
              className="flex-1 px-4 py-2 bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#E55A2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePrivateChat;
