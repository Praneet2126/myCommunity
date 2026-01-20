import { useState, useEffect, useCallback } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Toast from '../common/Toast';
import { getHotelFirstImageUrl } from '../../services/hotelService';

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
  const [activityRecommendations, setActivityRecommendations] = useState([]);
  const [activityCart, setActivityCart] = useState(null);
  const [loadingActivityCart, setLoadingActivityCart] = useState(false);
  const [addingActivityToCart, setAddingActivityToCart] = useState(null);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [generatedItineraries, setGeneratedItineraries] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const [removingActivityFromCart, setRemovingActivityFromCart] = useState(null);
  const [aiHotelRecommendations, setAiHotelRecommendations] = useState([]);
  const [loadingAiHotels, setLoadingAiHotels] = useState(false);
  const [extractedPreferences, setExtractedPreferences] = useState(null);
  const [votingActivity, setVotingActivity] = useState(null);
  const [votingAiHotel, setVotingAiHotel] = useState(null);
  const [recentlyAddedToCart, setRecentlyAddedToCart] = useState(null);

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

  // Clear state when chat changes (itinerary will be fetched from database)
  useEffect(() => {
    if (chat?.id) {
      setActivityRecommendations([]);
      setActivityCart(null);
      // Don't clear itinerary here - it will be fetched from database
    }
  }, [chat?.id]);

  // Fetch full chat details with participants when modal opens or when recommendations tab is active
  useEffect(() => {
    if (isOpen && chat?.id) {
      fetchChatDetails();
      setShowAddMember(false);
      setEmailInput('');
      setFoundUser(null);
      setSearchError('');
      setRecentlyAddedToCart(null);
      // Refresh activity recommendations to get updated votes when switching to recommendations tab
      if (activeTab === 'recommendations') {
        fetchActivityRecommendations();
      }
    }
  }, [isOpen, chat?.id, activeTab]);

  // Fetch activity cart when cart or recommendations tab is active
  useEffect(() => {
    if (isOpen && chat?.id && (activeTab === 'cart' || activeTab === 'recommendations')) {
      fetchActivityCart();
    }
  }, [isOpen, chat?.id, activeTab]);

  // Fetch itinerary when modal opens or itineraries tab is active
  useEffect(() => {
    if (isOpen && chat?.id) {
      fetchItinerary();
    }
  }, [isOpen, chat?.id]);

  // Fetch activity recommendations when recommendations tab is active or modal opens
  useEffect(() => {
    if (isOpen && chat?.id) {
      // Always fetch when modal opens or when switching to recommendations tab
      if (activeTab === 'recommendations' || !activityRecommendations.length) {
        fetchActivityRecommendations();
        fetchAiHotelRecommendations();
      }
    }
  }, [isOpen, chat?.id, activeTab]);

  // Listen for activity recommendations (for real-time updates)
  useEffect(() => {
    const handleActivityRecommendations = (event) => {
      if (event.detail.chatId === chat?.id) {
        setActivityRecommendations(event.detail.recommendations);
      }
    };
    window.addEventListener('activityRecommendations', handleActivityRecommendations);
    return () => window.removeEventListener('activityRecommendations', handleActivityRecommendations);
  }, [chat?.id]);

  // Listen for itinerary generation events
  useEffect(() => {
    if (!chat?.id) return;
    
    const currentChatId = String(chat.id);
    
    const handleItineraryGenerated = (event) => {
      const eventChatId = String(event.detail.chatId || '');
      // Only set itinerary if it matches the current chat exactly
      if (eventChatId === currentChatId) {
        console.log('Setting itinerary for chat:', currentChatId);
        // Add the new itinerary to the beginning of the array (most recent first)
        setGeneratedItineraries(prev => [event.detail.itinerary, ...prev]);
        // Also refresh the full itinerary list from database
        fetchItinerary();
      } else {
        console.log('Ignoring itinerary - event chatId:', eventChatId, 'current chatId:', currentChatId);
      }
    };
    window.addEventListener('itineraryGenerated', handleItineraryGenerated);
    return () => window.removeEventListener('itineraryGenerated', handleItineraryGenerated);
  }, [chat?.id]);

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
        // Fetch correct hotel images for recommendations
        if (data.data.recommendations && data.data.recommendations.length > 0) {
          const recommendationsWithImages = await Promise.all(
            data.data.recommendations.map(async (rec) => {
              // If the recommendation already has a proper image URL from backend, use it
              if (rec.image_url && rec.image_url.startsWith('http')) {
                return rec;
              }
              
              // Otherwise, try to fetch the correct image from hotels folder
              try {
                const imageUrl = await getHotelFirstImageUrl(rec.name);
                return {
                  ...rec,
                  image_url: imageUrl || rec.image_url
                };
              } catch (error) {
                console.warn(`Could not fetch image for ${rec.name}:`, error);
                return rec;
              }
            })
          );
          data.data.recommendations = recommendationsWithImages;
        }
        
        setChatDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching chat details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity recommendations from backend
  const fetchActivityRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/activities/recommendations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success && data.data.recommendations) {
        setActivityRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching activity recommendations:', error);
    }
  };

  // Vote for an activity recommendation
  const handleVoteActivity = async (activityIndex) => {
    if (!chat?.id) {
      console.error('No chat ID available');
      setToast({ message: 'Chat not available', type: 'error', isVisible: true });
      return;
    }
    
    try {
      console.log('Voting for activity at index:', activityIndex);
      setVotingActivity(activityIndex);
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({ message: 'Please login to vote', type: 'error', isVisible: true });
        setVotingActivity(null);
        return;
      }
      
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      console.log(`Calling: ${BASE_URL}/api/chats/${chat.id}/activities/recommendations/${activityIndex}/vote`);
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/activities/recommendations/${activityIndex}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Vote response:', data);

      if (data.success) {
        // Update activity recommendations with votes
        if (data.data && data.data.activity_recommendations) {
          console.log('Updating activity recommendations with votes:', data.data.activity_recommendations);
          setActivityRecommendations(data.data.activity_recommendations);
        } else {
          // Refresh from backend
          console.log('Refreshing activity recommendations from backend');
          await fetchActivityRecommendations();
        }
        // Also refresh chat details to get updated recommendations
        await fetchChatDetails();
        setToast({ message: 'Vote added!', type: 'success', isVisible: true });
      } else {
        console.error('Vote failed:', data.message);
        setToast({ message: data.message || 'Failed to vote', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error('Vote activity error:', error);
      setToast({ message: 'Failed to vote', type: 'error', isVisible: true });
    } finally {
      setVotingActivity(null);
    }
  };

  // Remove vote from an activity recommendation
  const handleUnvoteActivity = async (activityIndex) => {
    if (!chat?.id) {
      console.error('No chat ID available');
      setToast({ message: 'Chat not available', type: 'error', isVisible: true });
      return;
    }
    
    try {
      console.log('Unvoting for activity at index:', activityIndex);
      setVotingActivity(activityIndex);
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({ message: 'Please login to vote', type: 'error', isVisible: true });
        setVotingActivity(null);
        return;
      }
      
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      console.log(`Calling: ${BASE_URL}/api/chats/${chat.id}/activities/recommendations/${activityIndex}/vote`);
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/activities/recommendations/${activityIndex}/vote`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Unvote response:', data);

      if (data.success) {
        // Update activity recommendations with votes
        if (data.data && data.data.activity_recommendations) {
          console.log('Updating activity recommendations after unvote:', data.data.activity_recommendations);
          setActivityRecommendations(data.data.activity_recommendations);
        } else {
          // Refresh from backend
          console.log('Refreshing activity recommendations from backend');
          await fetchActivityRecommendations();
        }
        // Also refresh chat details to get updated recommendations
        await fetchChatDetails();
        setToast({ message: 'Vote removed!', type: 'success', isVisible: true });
      } else {
        console.error('Unvote failed:', data.message);
        setToast({ message: data.message || 'Failed to remove vote', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error('Unvote activity error:', error);
      setToast({ message: 'Failed to remove vote', type: 'error', isVisible: true });
    } finally {
      setVotingActivity(null);
    }
  };

  // Fetch AI hotel recommendations from backend
  const fetchAiHotelRecommendations = async () => {
    try {
      setLoadingAiHotels(true);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/hotels/recommendations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        setAiHotelRecommendations(data.data.recommendations || []);
        setExtractedPreferences(data.data.extracted_preferences || null);
      }
    } catch (error) {
      console.error('Error fetching AI hotel recommendations:', error);
      setAiHotelRecommendations([]);
    } finally {
      setLoadingAiHotels(false);
    }
  };

  // Fetch activity cart
  const fetchActivityCart = async () => {
    try {
      setLoadingActivityCart(true);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/activities/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setActivityCart(data.data);
      }
    } catch (error) {
      console.error('Error fetching activity cart:', error);
    } finally {
      setLoadingActivityCart(false);
    }
  };

  // Fetch all itineraries from backend
  const fetchItinerary = async () => {
    try {
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/activities/itinerary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('[GroupProfileModal] Itineraries fetch response:', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log('[GroupProfileModal] Setting itineraries count:', data.data.length);
        setGeneratedItineraries(data.data);
      } else {
        // No itineraries found, clear state
        console.log('[GroupProfileModal] No itineraries found in response');
        setGeneratedItineraries([]);
      }
    } catch (error) {
      console.error('[GroupProfileModal] Error fetching itineraries:', error);
    }
  };

  // Add activity to cart
  const handleAddActivityToCart = async (placeName) => {
    try {
      setAddingActivityToCart(placeName);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/activities/cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ place_name: placeName })
      });
      
      const data = await response.json();
      if (data.success) {
        // Remove from recommendations
        await fetchActivityRecommendations();
        await fetchActivityCart();
        setRecentlyAddedToCart({ name: placeName, type: 'activity' });
      } else {
        setToast({ message: data.message || 'Failed to add activity to cart', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error('Error adding activity to cart:', error);
      setToast({ message: 'Failed to add activity to cart', type: 'error', isVisible: true });
    } finally {
      setAddingActivityToCart(null);
    }
  };

  // Remove activity from cart
  const handleRemoveActivityFromCart = async (placeName) => {
    if (!placeName || !chat?.id) {
      console.error('Invalid place name or chat ID');
      setToast({ message: 'Invalid request', type: 'error', isVisible: true });
      return;
    }
    
    try {
      setRemovingActivityFromCart(placeName);
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({ message: 'Authentication required', type: 'error', isVisible: true });
        setRemovingActivityFromCart(null);
        return;
      }
      
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/activities/cart/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ place_name: placeName })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        await fetchActivityCart();
        setToast({ message: 'Activity removed from cart', type: 'success', isVisible: true });
      } else {
        setToast({ message: data.message || 'Failed to remove activity from cart', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error('Error removing activity from cart:', error);
      setToast({ message: 'Failed to remove activity from cart', type: 'error', isVisible: true });
    } finally {
      setRemovingActivityFromCart(null);
    }
  };

  // Update cart settings
  const handleUpdateCartSettings = async (numDays, numPeople) => {
    // Update local state immediately (no loading)
    setActivityCart(prev => ({
      ...prev,
      num_days: numDays,
      num_people: numPeople
    }));
    
    // Save to backend in background
    try {
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      await fetch(`${BASE_URL}/api/chats/${chat.id}/activities/cart/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ num_days: numDays, num_people: numPeople })
      });
    } catch (error) {
      console.error('Error updating cart settings:', error);
    }
  };

  // Generate itinerary
  const handleGenerateItinerary = async () => {
    try {
      setGeneratingItinerary(true);
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/activities/itinerary/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Itinerary generation response:', data);
      if (data.success && data.data) {
        console.log('Itinerary generated, fetching from database...');
        // Fetch the stored itinerary from database to ensure we have the latest
        await fetchItinerary();
        // Emit event for ItineraryDisplay to pick up
        window.dispatchEvent(new CustomEvent('itineraryGenerated', {
          detail: {
            chatId: chat.id,
            itinerary: data.data
          }
        }));
        setToast({ message: 'Itinerary generated successfully!', type: 'success', isVisible: true });
        // Switch to itineraries tab
        setActiveTab('itineraries');
        await fetchChatDetails(); // Refresh to get new itinerary
      } else {
        console.error('Itinerary generation failed:', data);
        setToast({ message: data.message || 'Failed to generate itinerary', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setToast({ message: 'Failed to generate itinerary', type: 'error', isVisible: true });
    } finally {
      setGeneratingItinerary(false);
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

  // Add AI hotel to recommendations (for voting)
  const handleAddHotelToRecommendations = async (hotel, rec) => {
    try {
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      // Create recommendation object in the format expected by the backend
      const recommendation = {
        hotel_id: hotel.hotel_code || hotel.name,
        name: hotel.name,
        description: hotel.description || rec.explanation || '',
        amenities: hotel.amenities || [],
        similarity_score: 0.9, // High score for AI recommendations
        added_at: new Date().toISOString()
      };

      const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recommendation })
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: 'Hotel added to recommendations!', type: 'success', isVisible: true });
        await fetchChatDetails();
        // Refresh AI hotels to update the UI
        await fetchAiHotelRecommendations();
      } else {
        setToast({ message: data.message || 'Failed to add hotel', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error('Error adding hotel to recommendations:', error);
      setToast({ message: 'Failed to add hotel', type: 'error', isVisible: true });
    }
  };

  // Add AI hotel directly to cart
  const handleAddAiHotelToCart = async (hotel, rec) => {
    try {
      const token = localStorage.getItem('token');
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
      
      // First add to recommendations if not already there
      const recommendations = chatDetails?.recommendations || chat?.recommendations || [];
      const existingRecIndex = recommendations.findIndex(
        r => (r.hotel_id === (hotel.hotel_code || hotel.name)) || (r.name === hotel.name)
      );
      
      let recIndex = existingRecIndex;
      
      if (recIndex < 0) {
        // Add to recommendations first
        await handleAddHotelToRecommendations(hotel, rec);
        // Wait a bit for the state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        // Fetch updated chat details
        await fetchChatDetails();
        // Find the new index
        const updatedChat = await fetch(`${BASE_URL}/api/chats/${chat.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(r => r.json());
        
        if (updatedChat.success && updatedChat.data) {
          const updatedRecs = updatedChat.data.recommendations || [];
          recIndex = updatedRecs.findIndex(
            r => (r.hotel_id === (hotel.hotel_code || hotel.name)) || (r.name === hotel.name)
          );
        }
      }
      
      if (recIndex >= 0) {
        // Now add to cart
        const response = await fetch(`${BASE_URL}/api/chats/${chat.id}/recommendations/${recIndex}/add-to-cart`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setRecentlyAddedToCart({ name: hotel.name, type: 'hotel' });
          await fetchChatDetails();
          await fetchAiHotelRecommendations();
        } else {
          setToast({ message: data.message || 'Failed to add hotel to cart', type: 'error', isVisible: true });
        }
      } else {
        setToast({ message: 'Failed to add hotel to cart', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error('Error adding AI hotel to cart:', error);
      setToast({ message: 'Failed to add hotel to cart', type: 'error', isVisible: true });
    }
  };

  // Vote for an AI hotel (after it's been added to recommendations)
  const handleVoteAiHotel = async (hotelIndex) => {
    try {
      setVotingAiHotel(hotelIndex);
      const rec = aiHotelRecommendations[hotelIndex];
      const hotel = rec.hotel || {};
      
      // First check if hotel is already in recommendations
      const recommendations = chatDetails?.recommendations || chat?.recommendations || [];
      const existingRecIndex = recommendations.findIndex(
        r => (r.hotel_id === (hotel.hotel_code || hotel.name)) || (r.name === hotel.name)
      );
      
      if (existingRecIndex >= 0) {
        // Hotel is already in recommendations, vote on it
        await handleVote(existingRecIndex);
        setToast({ message: 'Vote added!', type: 'success', isVisible: true });
      } else {
        // Add to recommendations first, then vote
        await handleAddHotelToRecommendations(hotel, rec);
        // After adding, the hotel will be in recommendations, so we can vote
        // The vote will be handled in the next render after fetchChatDetails
        setToast({ message: 'Hotel added! You can now vote on it.', type: 'success', isVisible: true });
      }
    } catch (error) {
      console.error('Vote AI hotel error:', error);
      setToast({ message: 'Failed to vote', type: 'error', isVisible: true });
    } finally {
      setVotingAiHotel(null);
    }
  };

  // Admin: Add recommendation to cart
  const handleAddToCart = async (recommendationIndex) => {
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
        // Get the hotel name before refreshing
        const recommendations = chatDetails?.recommendations || chat?.recommendations || [];
        const rec = recommendations[recommendationIndex];
        const hotelName = typeof rec === 'string' ? rec : rec?.name || rec?.title || 'Hotel';
        
        // Refresh chat details to get updated recommendations (with item removed)
        await fetchChatDetails();
        onMembersChanged && onMembersChanged();
        setRecentlyAddedToCart({ name: hotelName, type: 'hotel' });
      } else {
        setToast({ message: data.message || 'Failed to add to cart', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      setToast({ message: 'Failed to add to cart', type: 'error', isVisible: true });
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Group Avatar and Info */}
        <div className="bg-gradient-to-br from-[#1976D2] to-[#1565C0] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col gap-3">
            {/* Top Row: Profile (Left) + Location/Created (Right) */}
            <div className="flex items-center gap-8">
              {/* Left: Avatar + Name/Members */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {chat.name?.charAt(0).toUpperCase() || 'G'}
                </div>
                
                {/* Name + Members */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{chat.name || 'Private Group'}</h2>
                    {/* Lock Icon for Private */}
                    <svg className="w-4 h-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-blue-100 text-sm">
                    {loading ? '.' : members.length} {members.length === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </div>

              {/* Right: Location + Created */}
              <div className="flex flex-col gap-1">
                {/* Location */}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-white">{cityName || 'Not specified'}</span>
                </div>

                {/* Created At */}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-white">created on {formatDate(chat.createdAt || chat.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Description - Full Width Below */}
            {chat.description && (
              <div className="flex items-center gap-2 text-blue-100 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{chat.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id !== 'recommendations') {
                  setRecentlyAddedToCart(null);
                }
                setActiveTab(tab.id);
              }}
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
              {/* Activity Recommendations Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Activity Recommendations</h3>
                  <span className="text-xs text-gray-500">AI-powered suggestions</span>
                </div>
                {activityRecommendations.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Chat more to get activity recommendations</p>
                    <p className="text-xs text-gray-400 mt-1">Recommendations appear every 7 messages</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activityRecommendations
                      .filter(activity => {
                        // Filter out activities already in cart
                        const cartItems = activityCart?.items || [];
                        return !cartItems.some(item => item.place_name === activity.name);
                      })
                      .map((activity, idx) => {
                      // Voting data
                      const votes = activity.votes || [];
                      const voteCount = votes.length;
                      const hasUserVoted = votes.some(
                        vote => (vote.user_id?._id || vote.user_id)?.toString() === currentUserId?.toString()
                      );

                      return (
                        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            {/* Activity Icon */}
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0 p-2">
                              <img 
                                src="https://cdn-icons-png.flaticon.com/512/6556/6556349.png" 
                                alt="Activity" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-900">{activity.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {activity.category && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {activity.category}
                                  </span>
                                )}
                                {activity.region && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                    {activity.region}
                                  </span>
                                )}
                                {activity.duration && (
                                  <span className="text-xs text-gray-500">{activity.duration}</span>
                                )}
                              </div>
                              {activity.score && (
                                <div className="mt-1">
                                  <span className="text-xs text-indigo-600 font-medium">
                                    {((activity.score * 100)).toFixed(0)}% match
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Voting and Add to Cart Section */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            {/* Vote Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Vote button clicked for activity:', idx, 'hasUserVoted:', hasUserVoted, 'activity:', activity.name);
                                if (hasUserVoted) {
                                  handleUnvoteActivity(idx);
                                } else {
                                  handleVoteActivity(idx);
                                }
                              }}
                              disabled={votingActivity === idx || !chat?.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                hasUserVoted
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {votingActivity === idx ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className={`w-4 h-4 ${hasUserVoted ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                              )}
                              <span>{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                            </button>

                            {/* Add to Cart Button (Admin only) */}
                            {isAdmin && (
                              <button
                                onClick={() => handleAddActivityToCart(activity.name)}
                                disabled={addingActivityToCart === activity.name}
                                className="px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg text-xs font-medium hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {addingActivityToCart === activity.name ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  'Add to Cart'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hotel Recommendations Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Hotel Recommendations</h3>
                  <span className="text-xs text-gray-500">AI-powered suggestions</span>
                </div>
                
                {/* AI Hotel Recommendations */}
                {loadingAiHotels ? (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-gray-500 text-xs">Analyzing chat for hotel recommendations...</p>
                  </div>
                ) : aiHotelRecommendations.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {aiHotelRecommendations
                      .filter(rec => {
                        // Filter out hotels already in cart
                        const hotel = rec.hotel || {};
                        return !cartItems.some(
                          item => (item.hotel_id === (hotel.hotel_code || hotel.name)) || (item.name === hotel.name)
                        );
                      })
                      .map((rec, index) => {
                      const hotel = rec.hotel || {};
                      const explanation = rec.explanation || '';
                      const matchedPrefs = rec.matched_preferences || [];
                      
                      return (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          {/* Hotel Header */}
                          <div className="flex items-start gap-3 mb-2">
                            {/* Hotel Icon */}
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm mb-1">{hotel.name || 'Hotel'}</h4>
                              {hotel.hotel_code && (
                                <p className="text-xs text-gray-500">Code: {hotel.hotel_code}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* AI Explanation */}
                          {explanation && (
                            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-xs text-blue-800 leading-relaxed">{explanation}</p>
                            </div>
                          )}
                          
                          {/* Matched Preferences */}
                          {matchedPrefs.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-600 mb-1">Matched Preferences:</p>
                              <div className="flex flex-wrap gap-1">
                                {matchedPrefs.map((pref, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                    {pref}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Hotel Details */}
                          <div className="space-y-2">
                            {/* Description */}
                            {hotel.description && (
                              <p className="text-xs text-gray-600 line-clamp-2">{hotel.description}</p>
                            )}
                            
                            {/* Amenities */}
                            {hotel.amenities && hotel.amenities.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Amenities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {hotel.amenities.slice(0, 5).map((amenity, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                      {amenity}
                                    </span>
                                  ))}
                                  {hotel.amenities.length > 5 && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                      +{hotel.amenities.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Room Types */}
                            {hotel.room_types && hotel.room_types.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Room Types:</p>
                                <div className="flex flex-wrap gap-1">
                                  {hotel.room_types.map((room, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                      {room}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Voting and Action Buttons */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                            {/* Vote Button - Check if hotel is already in recommendations */}
                            {(() => {
                              const recommendations = chatDetails?.recommendations || chat?.recommendations || [];
                              const existingRecIndex = recommendations.findIndex(
                                r => (r.hotel_id === (hotel.hotel_code || hotel.name)) || (r.name === hotel.name)
                              );
                              const isInRecommendations = existingRecIndex >= 0;
                              
                              if (isInRecommendations) {
                                // Hotel is in recommendations, show vote button with count
                                const rec = recommendations[existingRecIndex];
                                const votes = rec.votes || [];
                                const voteCount = votes.length;
                                const hasUserVoted = votes.some(
                                  vote => (vote.user_id?._id || vote.user_id)?.toString() === currentUserId?.toString()
                                );
                                
                                return (
                                  <button
                                    onClick={() => hasUserVoted ? handleUnvote(existingRecIndex) : handleVote(existingRecIndex)}
                                    disabled={votingRecommendation === existingRecIndex}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                      hasUserVoted
                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {votingRecommendation === existingRecIndex ? (
                                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <svg className={`w-4 h-4 ${hasUserVoted ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                      </svg>
                                    )}
                                    <span>{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                                  </button>
                                );
                              } else {
                                // Hotel not in recommendations yet, show add & vote button
                                return (
                                  <button
                                    onClick={() => handleVoteAiHotel(index)}
                                    disabled={votingAiHotel === index}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {votingAiHotel === index ? (
                                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                      </svg>
                                    )}
                                    <span>Add & Vote</span>
                                  </button>
                                );
                              }
                            })()}

                            {/* Add to Cart Button (Admin only) */}
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  handleAddAiHotelToCart(hotel, rec);
                                }}
                                className="px-3 py-1.5 bg-[#FF6B35] hover:bg-[#E55A2B] text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Extracted Preferences Info */}
                    {extractedPreferences && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Extracted Preferences:</p>
                        <div className="space-y-1 text-xs text-gray-600">
                          {extractedPreferences.area && (
                            <p>📍 Location: <span className="font-medium">{extractedPreferences.area}</span></p>
                          )}
                          {extractedPreferences.max_price && (
                            <p>💰 Budget: <span className="font-medium">₹{extractedPreferences.max_price.toLocaleString('en-IN')}</span></p>
                          )}
                          {extractedPreferences.amenities && extractedPreferences.amenities.length > 0 && (
                            <p>✨ Amenities: <span className="font-medium">{extractedPreferences.amenities.join(', ')}</span></p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg mb-4">
                    <p className="text-gray-500 text-sm">No AI hotel recommendations yet</p>
                    <p className="text-gray-400 text-xs mt-1">Chat about hotels, amenities, or budget to get recommendations</p>
                  </div>
                )}
              </div>

              {/* myLens Hotel Recommendations Section */}
              {recommendations && recommendations.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Saved Hotel Recommendations</h3>
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">From <img src="/myLogo.png" alt="my" className="w-3 h-3 object-contain inline" />Lens</span>
                  </div>
                  <div className="space-y-2">
                    {recommendations
                      .map((rec, originalIndex) => {
                        // Filter out items already in cart
                        const hotelName = typeof rec === 'string' ? rec : rec.name || rec.title || 'Hotel';
                        const isInCart = cartItems.some(
                          item => (item.hotel_id === rec.hotel_id) || (item.name === hotelName)
                        );
                        
                        // Skip if already in cart
                        if (isInCart) return null;
                        
                        const hotelPrice = rec.price;
                        const hotelStars = rec.stars;
                        const hotelDescription = rec.description;
                        const hotelImage = rec.image_url || rec.imageUrl;
                        const similarityScore = rec.similarity_score;
                        const votes = rec.votes || [];
                        const voteCount = votes.length;
                        const hasUserVoted = votes.some(
                          vote => (vote.user_id?._id || vote.user_id)?.toString() === currentUserId?.toString()
                        );
                        
                        return (
                          <div key={originalIndex} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group relative">
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

                                {/* Voting and Add to Cart Section */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                  {/* Vote Button */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (hasUserVoted) {
                                        handleUnvote(originalIndex);
                                      } else {
                                        handleVote(originalIndex);
                                      }
                                    }}
                                    disabled={votingRecommendation === originalIndex}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                      hasUserVoted
                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {votingRecommendation === originalIndex ? (
                                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <svg className={`w-4 h-4 ${hasUserVoted ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                      </svg>
                                    )}
                                    <span>{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                                  </button>

                                  {/* Add to Cart Button (Admin only) */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleAddToCart(originalIndex)}
                                      disabled={addingToCart === originalIndex}
                                      className="px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg text-xs font-medium hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {addingToCart === originalIndex ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        'Add to Cart'
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Remove Recommendation Button (Admin only) */}
                              {isAdmin && (
                                <button
                                  onClick={() => handleOpenDeleteRecommendation(originalIndex, hotelName)}
                                  disabled={removingRecommendation === originalIndex}
                                  className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove recommendation"
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
                      .filter(item => item !== null)}
                  </div>
                </div>
              )}

              {/* Added to Cart Notice */}
              {recentlyAddedToCart && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-800">
                      <span className="font-medium">{recentlyAddedToCart.name}</span> added to cart
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setRecentlyAddedToCart(null);
                      setActiveTab('cart');
                    }}
                    className="text-sm font-medium text-green-700 hover:text-green-900 flex items-center gap-1"
                  >
                    View
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cart Tab */}
          {activeTab === 'cart' && (
            <div className="space-y-4">
              {/* Activity Cart Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Activity Cart</h3>
                  {activityCart && activityCart.items && activityCart.items.length > 0 && (
                    <button
                      onClick={handleGenerateItinerary}
                      disabled={generatingItinerary}
                      className="px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg text-xs font-medium hover:bg-[#E55A2B] disabled:opacity-50"
                    >
                      {generatingItinerary ? 'Generating...' : 'Generate Itinerary'}
                    </button>
                  )}
                </div>
                {loadingActivityCart ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : !activityCart || !activityCart.items || activityCart.items.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">No activities in cart</p>
                    <p className="text-xs text-gray-400 mt-1">Add activities from recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {activityCart.items.map((item, idx) => {
                      if (!item || !item.place_name) return null;
                      return (
                        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 group relative">
                          <div className="flex items-start gap-3">
                            {/* Activity Icon */}
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0 p-1.5">
                              <img 
                                src="https://cdn-icons-png.flaticon.com/512/6556/6556349.png" 
                                alt="Activity" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-900">{item.place_name || 'Unknown Activity'}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">Added by {item.added_by || 'Unknown'}</span>
                                {item.count > 1 && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    x{item.count}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (item.place_name) {
                                    handleRemoveActivityFromCart(item.place_name);
                                  }
                                }}
                                disabled={removingActivityFromCart === item.place_name}
                                className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
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
                    })}
                    {/* Cart Settings */}
                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Number of Days</label>
                          <input
                            type="number"
                            min="1"
                            max="7"
                            value={activityCart.num_days || 3}
                            onChange={(e) => handleUpdateCartSettings(parseInt(e.target.value), activityCart.num_people)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Number of People</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={activityCart.num_people || 2}
                            onChange={(e) => handleUpdateCartSettings(activityCart.num_days, parseInt(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hotel Cart Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Hotel Cart</h3>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">No hotels in cart</p>
                    <p className="text-xs text-gray-400 mt-1">Add hotels from recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {cartItems.map((item, index) => {
                      // Filter to show only hotel items (items with hotel_id or hotel properties)
                      if (!item.hotel_id && !item.name) return null;
                      
                      const hotelName = item.name || 'Hotel';
                      const hotelPrice = item.price;
                      const hotelStars = item.stars;
                      const hotelDescription = item.description;
                      const hotelImage = item.image_url || item.imageUrl;

                      return (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 group relative">
                          <div className="flex">
                            {/* Hotel Image or Icon */}
                            {hotelImage ? (
                              <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-100 rounded-lg">
                                <img
                                  src={hotelImage}
                                  alt={hotelName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                            )}

                            {/* Hotel Details */}
                            <div className="flex-1 ml-3">
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
                                <p className="text-xs text-gray-600 line-clamp-2">{hotelDescription}</p>
                              )}
                </div>

                            {/* Remove Button (Admin only) */}
                            {isAdmin && (
                              <button
                                onClick={() => handleOpenDeleteCart(index, hotelName)}
                                disabled={removingFromCart === index}
                                className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
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
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Itineraries Tab */}
          {activeTab === 'itineraries' && (
            <div className="space-y-3">
              {/* Latest Generated Itinerary - Show only the newest one */}
              {generatedItineraries.length > 0 && (() => {
                const latestItinerary = generatedItineraries[0]; // First one is the latest (sorted by newest first)
                return (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">
                          {chat.name ? `${chat.name} Trip Plan` : 'Generated Itinerary'}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {latestItinerary.days?.length || 0} days · {latestItinerary.num_people || 2} people
                          {latestItinerary.hotels && latestItinerary.hotels.length > 0 && ` · ${latestItinerary.hotels.length} hotel${latestItinerary.hotels.length > 1 ? 's' : ''}`}
                        </p>
                        {latestItinerary.generated_at && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Generated: {new Date(latestItinerary.generated_at).toLocaleDateString()} at {new Date(latestItinerary.generated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-medium rounded-full">
                          AI Generated
                        </span>
                        <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-medium rounded-full">
                          Latest
                        </span>
                      </div>
                    </div>

                    {/* Hotels Section */}
                    {latestItinerary.hotels && latestItinerary.hotels.length > 0 && (
                      <div className="mb-4 bg-white rounded-lg p-3 border border-orange-100">
                        <h4 className="font-semibold text-gray-800 text-xs mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Accommodation
                        </h4>
                        <div className="space-y-2">
                          {latestItinerary.hotels.map((hotel, hotelIndex) => (
                            <div key={hotelIndex} className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                              {hotel.image_url && (
                                <img 
                                  src={hotel.image_url} 
                                  alt={hotel.name} 
                                  className="w-20 h-20 object-cover rounded-lg shadow-sm"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-semibold text-gray-800 text-sm">{hotel.name}</p>
                                  {hotel.recommended_for_days && hotel.recommended_for_days.length > 0 && (
                                    <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap">
                                      Days {hotel.recommended_for_days[0]}-{hotel.recommended_for_days[hotel.recommended_for_days.length - 1]}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {hotel.stars && (
                                    <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                                      {"⭐".repeat(hotel.stars)}
                                    </span>
                                  )}
                                  {hotel.price && (
                                    <span className="text-xs font-medium text-gray-700">₹{hotel.price.toLocaleString()}/night</span>
                                  )}
                                </div>
                                {hotel.reason && (
                                  <div className="mt-2 flex items-start gap-1">
                                    <svg className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-blue-700 font-medium">{hotel.reason}</p>
                                  </div>
                                )}
                                {hotel.description && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{hotel.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {latestItinerary.days && latestItinerary.days.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {[...latestItinerary.days].sort((a, b) => (a.day || 0) - (b.day || 0)).map((day, dayIndex) => (
                          <div key={`day-${day.day || dayIndex}`} className="bg-white rounded-lg p-3 border border-orange-100">
                            <h4 className="font-semibold text-gray-800 text-xs mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                                {day.day || dayIndex + 1}
                              </span>
                              Day {day.day || dayIndex + 1}
                              {day.total_duration_mins && (
                                <span className="text-gray-500 font-normal ml-auto">
                                  {Math.floor(day.total_duration_mins / 60)}h {day.total_duration_mins % 60}m
                                </span>
                              )}
                            </h4>
                            
                            {day.activities && day.activities.length > 0 ? (
                              <div className="space-y-2 mt-2">
                                {day.activities.map((activity, actIndex) => (
                                  <div key={actIndex} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                                    <div className="flex-shrink-0 w-16 text-xs text-gray-600 font-medium pt-0.5">
                                      {activity.start_time || 'TBD'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-800 text-xs">{activity.name || activity.place_name || 'Activity'}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {activity.region && (
                                          <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {activity.region}
                                          </span>
                                        )}
                                        {activity.duration && (
                                          <span className="text-xs text-gray-500">· {activity.duration}</span>
                                        )}
                                      </div>
                                      {activity.end_time && (
                                        <p className="text-xs text-gray-400 mt-1">Until {activity.end_time}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No activities scheduled</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No itinerary data available</p>
                    )}
                    
                    {/* Show count of total saved itineraries */}
                    {generatedItineraries.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <p className="text-xs text-gray-500 text-center">
                          You have {generatedItineraries.length} itineraries saved. View all in the Itinerary section below the calendar.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {/* Saved Itineraries */}
              {savedItineraries.length > 0 && (
            <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Saved Itineraries</h3>
                  {savedItineraries.map((itinerary, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-800">{itinerary.name || `Itinerary ${index + 1}`}</p>
                      <p className="text-xs text-gray-500 mt-1">{itinerary.dates || 'No dates specified'}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Empty State */}
              {generatedItineraries.length === 0 && savedItineraries.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No itineraries yet</p>
                  <p className="text-gray-400 text-xs mt-1">Generate an itinerary from your cart to see it here</p>
                </div>
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

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}

export default GroupProfileModal;
