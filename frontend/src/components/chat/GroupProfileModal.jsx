import { useState, useEffect, useCallback } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

/**
 * GroupProfileModal component
 * WhatsApp-style group profile dialog for private chats
 */
function GroupProfileModal({ isOpen, onClose, chat, cityName, onMembersChanged }) {
  const [activeTab, setActiveTab] = useState('members');
  const [chatDetails, setChatDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [removingRecommendation, setRemovingRecommendation] = useState(null);
  const [votingRecommendation, setVotingRecommendation] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const [removingFromCart, setRemovingFromCart] = useState(null);
  const [showDeleteRecommendationModal, setShowDeleteRecommendationModal] = useState(false);
  const [showDeleteCartModal, setShowDeleteCartModal] = useState(false);
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);
  const [deleteTargetType, setDeleteTargetType] = useState(null); // 'recommendation' or 'cart'
  const [deleteTargetMember, setDeleteTargetMember] = useState(null);

  // Get current user from localStorage
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user._id || user.id;
      }
    } catch (e) {
      console.error('Error parsing user:', e);
    }
    return null;
  };

  const currentUserId = getCurrentUserId();

  // Fetch full chat details with participants when modal opens or when recommendations tab is active
  useEffect(() => {
    if (isOpen && chat?.id) {
      fetchChatDetails();
      setShowAddMember(false);
      setEmailInput('');
      setFoundUser(null);
      setSearchError('');
    }
  }, [isOpen, chat?.id, activeTab]);

  const fetchChatDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setChatDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching chat details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search user by email
  const searchUserByEmail = useCallback(async () => {
    if (!emailInput.trim() || emailInput.length < 3) {
      setSearchError('Enter at least 3 characters');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setFoundUser(null);

    try {
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/users/search-by-email?email=${encodeURIComponent(emailInput)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.data) {
        // Check if user is already a member
        const participants = chatDetails?.participants || [];
        const isAlreadyMember = participants.some(p => p.user_id?._id === data.data._id);
        
        if (isAlreadyMember) {
          setSearchError('This user is already a member');
        } else {
          setFoundUser(data.data);
        }
      } else {
        setSearchError('User not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search');
    } finally {
      setSearchLoading(false);
    }
  }, [emailInput, chatDetails]);

  // Add member to group
  const handleAddMember = async () => {
    if (!foundUser) return;

    try {
      setActionLoading('add');
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_ids: [foundUser._id] })
      });

      const data = await response.json();

      if (data.success) {
        setFoundUser(null);
        setEmailInput('');
        setShowAddMember(false);
        await fetchChatDetails();
        onMembersChanged && onMembersChanged();
      } else {
        setSearchError(data.message || 'Failed to add member');
      }
    } catch (error) {
      console.error('Add member error:', error);
      setSearchError('Failed to add member');
    } finally {
      setActionLoading(null);
    }
  };

  // Open delete member modal
  const handleOpenDeleteMember = (memberId, memberName) => {
    setDeleteTargetMember({ id: memberId, name: memberName });
    setShowDeleteMemberModal(true);
  };

  // Remove member from group
  const handleRemoveMember = async () => {
    if (!deleteTargetMember) return;

    try {
      setActionLoading(deleteTargetMember.id);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/members/${deleteTargetMember.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await fetchChatDetails();
        onMembersChanged && onMembersChanged();
        setShowDeleteMemberModal(false);
        setDeleteTargetMember(null);
      } else {
        alert(data.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Remove member error:', error);
      alert('Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  // Open delete recommendation modal
  const handleOpenDeleteRecommendation = (index, hotelName) => {
    setDeleteTargetIndex(index);
    setDeleteTargetType('recommendation');
    setShowDeleteRecommendationModal(true);
  };

  // Remove recommendation from chat
  const handleRemoveRecommendation = async () => {
    if (deleteTargetIndex === null) return;

    try {
      setRemovingRecommendation(deleteTargetIndex);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/recommendations/${deleteTargetIndex}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await fetchChatDetails();
        onMembersChanged && onMembersChanged();
        setShowDeleteRecommendationModal(false);
        setDeleteTargetIndex(null);
        setDeleteTargetType(null);
      } else {
        alert(data.message || 'Failed to remove recommendation');
      }
    } catch (error) {
      console.error('Remove recommendation error:', error);
      alert('Failed to remove recommendation');
    } finally {
      setRemovingRecommendation(null);
    }
  };

  // Vote for a recommendation
  const handleVote = async (recommendationIndex) => {
    try {
      setVotingRecommendation(recommendationIndex);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/recommendations/${recommendationIndex}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await fetchChatDetails();
        onMembersChanged && onMembersChanged();
      } else {
        alert(data.message || 'Failed to vote');
      }
    } catch (error) {
      console.error('Vote error:', error);
      alert('Failed to vote');
    } finally {
      setVotingRecommendation(null);
    }
  };

  // Remove vote from a recommendation
  const handleUnvote = async (recommendationIndex) => {
    try {
      setVotingRecommendation(recommendationIndex);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/recommendations/${recommendationIndex}/vote`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await fetchChatDetails();
        onMembersChanged && onMembersChanged();
      } else {
        alert(data.message || 'Failed to remove vote');
      }
    } catch (error) {
      console.error('Unvote error:', error);
      alert('Failed to remove vote');
    } finally {
      setVotingRecommendation(null);
    }
  };

  // Admin: Add recommendation to cart
  const handleAddToCart = async (recommendationIndex) => {
    if (!confirm('Add this recommendation to the cart?')) return;

    try {
      setAddingToCart(recommendationIndex);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/recommendations/${recommendationIndex}/add-to-cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await fetchChatDetails();
        onMembersChanged && onMembersChanged();
        alert('Recommendation added to cart successfully!');
      } else {
        alert(data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  // Open delete cart item modal
  const handleOpenDeleteCart = (index, itemName) => {
    setDeleteTargetIndex(index);
    setDeleteTargetType('cart');
    setShowDeleteCartModal(true);
  };

  // Admin: Remove item from cart
  const handleRemoveFromCart = async () => {
    if (deleteTargetIndex === null) return;

    try {
      setRemovingFromCart(deleteTargetIndex);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/cart/${deleteTargetIndex}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await fetchChatDetails();
        onMembersChanged && onMembersChanged();
        setShowDeleteCartModal(false);
        setDeleteTargetIndex(null);
        setDeleteTargetType(null);
      } else {
        alert(data.message || 'Failed to remove from cart');
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      alert('Failed to remove from cart');
    } finally {
      setRemovingFromCart(null);
    }
  };

  if (!isOpen || !chat) return null;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get members from fetched chat details - participants have user_id populated
  const participants = chatDetails?.participants || [];
  const members = participants.map(p => ({
    id: p.user_id?._id || p._id,
    name: p.user_id?.full_name || p.user_id?.username || 'Unknown',
    username: p.user_id?.username,
    profile_photo_url: p.user_id?.profile_photo_url,
    role: p.role,
    joined_at: p.joined_at
  }));

  // Check if current user is admin
  const currentUserParticipant = participants.find(p => p.user_id?._id === currentUserId);
  const isAdmin = currentUserParticipant?.role === 'admin';
  const creatorId = chatDetails?.created_by?._id || chatDetails?.created_by;
  
  // Get recommendations from chat details if available, otherwise from chat prop
  const recommendations = chatDetails?.recommendations || chat?.recommendations || [];
  const cartItems = chatDetails?.cart || chat?.cart || [];
  const savedItineraries = chatDetails?.itineraries || chat?.itineraries || [];

  const tabs = [
    { id: 'members', label: 'Members', count: members.length },
    { id: 'recommendations', label: 'Recommendations', count: recommendations.length },
    { id: 'cart', label: 'Cart', count: cartItems.length },
    { id: 'itineraries', label: 'Itineraries', count: savedItineraries.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Group Avatar */}
        <div className="bg-gradient-to-br from-[#1976D2] to-[#1565C0] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col items-center">
            {/* Group Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mb-3">
              {chat.name?.charAt(0).toUpperCase() || 'G'}
            </div>
            
            {/* Group Name */}
            <h2 className="text-xl font-bold text-center">{chat.name || 'Private Group'}</h2>
            
            {/* Group Type */}
            <p className="text-blue-100 text-sm mt-1">
              Private Group · {loading ? '...' : members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {/* Group Info */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          {/* Location */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm font-medium text-gray-800">{cityName || 'Not specified'}</p>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(chat.createdAt || chat.created_at)}</p>
            </div>
          </div>

          {/* Description */}
          {chat.description && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm text-gray-800">{chat.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#1976D2]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1976D2]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              {/* Add Member Button (Admin only) */}
              {isAdmin && !showAddMember && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium text-sm">Add Member</span>
                </button>
              )}

              {/* Add Member Form */}
              {isAdmin && showAddMember && (
                <div className="p-3 bg-blue-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800 text-sm">Add New Member</p>
                    <button
                      onClick={() => {
                        setShowAddMember(false);
                        setEmailInput('');
                        setFoundUser(null);
                        setSearchError('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setSearchError('');
                        setFoundUser(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && searchUserByEmail()}
                      placeholder="Enter email address"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={searchUserByEmail}
                      disabled={searchLoading || !emailInput.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {searchLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>

                  {searchError && (
                    <p className="text-red-500 text-xs">{searchError}</p>
                  )}

                  {/* Found User */}
                  {foundUser && (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-green-200">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                        {foundUser.profile_photo_url && foundUser.profile_photo_url !== 'https://via.placeholder.com/150' ? (
                          <img src={foundUser.profile_photo_url} alt={foundUser.full_name} className="w-full h-full object-cover" />
                        ) : (
                          (foundUser.full_name || foundUser.username || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{foundUser.full_name || foundUser.username}</p>
                        <p className="text-xs text-gray-500">{foundUser.email}</p>
                      </div>
                      <button
                        onClick={handleAddMember}
                        disabled={actionLoading === 'add'}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === 'add' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          'Add'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Members List */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : members.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No members found</p>
              ) : (
                members.map((member, index) => {
                  const isSelf = member.id === currentUserId;
                  const isCreator = member.id === creatorId;
                  const canRemove = isAdmin && !isCreator && !isSelf;
                  
                  return (
                    <div key={member.id || index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                        {member.profile_photo_url && member.profile_photo_url !== 'https://via.placeholder.com/150' ? (
                          <img src={member.profile_photo_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          (member.name || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">
                          {member.name}
                          {isSelf && <span className="text-gray-400 ml-1">(You)</span>}
                        </p>
                        <div className="flex items-center gap-2">
                          {member.role === 'admin' && (
                            <span className="text-xs text-green-600 font-medium">Admin</span>
                          )}
                          {member.username && (
                            <span className="text-xs text-gray-400">@{member.username}</span>
                          )}
                        </div>
                      </div>
                      {/* Remove Button */}
                      {canRemove && (
                        <button
                          onClick={() => handleOpenDeleteMember(member.id, member.name)}
                          disabled={actionLoading === member.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No recommendations yet</p>
                  <p className="text-gray-400 text-xs mt-1">Use myLens or AI Summary to get recommendations</p>
                </div>
              ) : (
                recommendations.map((rec, index) => {
                  // Handle both old format (string) and new format (object)
                  const hotelName = typeof rec === 'string' ? rec : rec.name || rec.title || 'Hotel';
                  const hotelPrice = rec.price;
                  const hotelStars = rec.stars;
                  const hotelDescription = rec.description;
                  const hotelImage = rec.image_url || rec.imageUrl;
                  const similarityScore = rec.similarity_score;
                  
                  // Voting data
                  const votes = rec.votes || [];
                  const voteCount = votes.length;
                  const hasUserVoted = votes.some(
                    vote => (vote.user_id?._id || vote.user_id)?.toString() === currentUserId?.toString()
                  );

                  return (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                      <div className="flex">
                        {/* Hotel Image */}
                        {hotelImage && (
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-100">
                            <img
                              src={hotelImage}
                              alt={hotelName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Hotel Details */}
                        <div className="flex-1 p-3 pr-10">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm flex-1">{hotelName}</h4>
                            {hotelPrice && (
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-bold text-blue-600">
                                  ₹{hotelPrice.toLocaleString('en-IN')}
                                </div>
                                <div className="text-xs text-gray-500">per night</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Stars */}
                          {hotelStars > 0 && (
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${i < hotelStars ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="text-xs text-gray-500 ml-1">{hotelStars} Star{hotelStars !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          
                          {/* Description */}
                          {hotelDescription && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-1">{hotelDescription}</p>
                          )}
                          
                          {/* Similarity Score (if from myLens) */}
                          {similarityScore && (
                            <div className="flex items-center gap-1 mt-1">
                              <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-xs text-indigo-600 font-medium">
                                {((similarityScore * 100) / 1.2).toFixed(1)}% match
                              </span>
                            </div>
                          )}

                          {/* Voting Section */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            {/* Vote Button */}
                            <button
                              onClick={() => hasUserVoted ? handleUnvote(index) : handleVote(index)}
                              disabled={votingRecommendation === index}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                hasUserVoted
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {votingRecommendation === index ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className={`w-4 h-4 ${hasUserVoted ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                              )}
                              <span>{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                            </button>

                            {/* Admin: Add to Cart Button */}
                            {isAdmin && (
                              <button
                                onClick={() => handleAddToCart(index)}
                                disabled={addingToCart === index}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {addingToCart === index ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Adding...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>Add to Cart</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleOpenDeleteRecommendation(index, hotelName)}
                          disabled={removingRecommendation === index}
                          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove recommendation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Cart Tab */}
          {activeTab === 'cart' && (
            <div className="space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Cart is empty</p>
                  <p className="text-gray-400 text-xs mt-1">Admins can add recommendations to cart</p>
                </div>
              ) : (
                cartItems.map((item, index) => {
                  const itemName = item.name || 'Hotel';
                  const itemPrice = item.price;
                  const itemImage = item.image_url || item.imageUrl;
                  const itemStars = item.stars;

                  return (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden group relative">
                      <div className="flex">
                        {/* Item Image */}
                        {itemImage && (
                          <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-100">
                            <img
                              src={itemImage}
                              alt={itemName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Item Details */}
                        <div className="flex-1 p-3 pr-10">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm flex-1">{itemName}</h4>
                            {itemPrice && (
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-bold text-green-600">
                                  ₹{itemPrice.toLocaleString('en-IN')}
                                </div>
                                <div className="text-xs text-gray-500">per night</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Stars */}
                          {itemStars > 0 && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${i < itemStars ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="text-xs text-gray-500 ml-1">{itemStars} Star{itemStars !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>

                        {/* Admin: Remove from Cart Button */}
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenDeleteCart(index, itemName)}
                            disabled={removingFromCart === index}
                            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove from cart"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Itineraries Tab */}
          {activeTab === 'itineraries' && (
            <div className="space-y-2">
              {savedItineraries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No saved itineraries</p>
                  <p className="text-gray-400 text-xs mt-1">Create and save group itineraries here</p>
                </div>
              ) : (
                savedItineraries.map((itinerary, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800">{itinerary.name}</p>
                    <p className="text-xs text-gray-500">{itinerary.dates}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Recommendation Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteRecommendationModal}
        onClose={() => {
          setShowDeleteRecommendationModal(false);
          setDeleteTargetIndex(null);
          setDeleteTargetType(null);
        }}
        onConfirm={handleRemoveRecommendation}
        title="Delete Recommendation"
        message="Are you sure you want to remove this recommendation? This action cannot be undone."
        itemName={deleteTargetIndex !== null && recommendations[deleteTargetIndex] ? recommendations[deleteTargetIndex].name : null}
        isLoading={removingRecommendation !== null}
      />

      {/* Delete Cart Item Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteCartModal}
        onClose={() => {
          setShowDeleteCartModal(false);
          setDeleteTargetIndex(null);
          setDeleteTargetType(null);
        }}
        onConfirm={handleRemoveFromCart}
        title="Remove from Cart"
        message="Are you sure you want to remove this item from the cart? This action cannot be undone."
        itemName={deleteTargetIndex !== null && cartItems[deleteTargetIndex] ? cartItems[deleteTargetIndex].name : null}
        isLoading={removingFromCart !== null}
      />

      {/* Delete Member Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteMemberModal}
        onClose={() => {
          setShowDeleteMemberModal(false);
          setDeleteTargetMember(null);
        }}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message="Are you sure you want to remove this member from the group? This action cannot be undone."
        itemName={deleteTargetMember?.name || null}
        isLoading={deleteTargetMember && actionLoading === deleteTargetMember.id}
      />
    </div>
  );
}

export default GroupProfileModal;
