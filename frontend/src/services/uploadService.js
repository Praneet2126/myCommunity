const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Upload profile photo to Cloudinary
 * @param {File} file - The image file to upload
 * @returns {Promise<{success: boolean, data: {profile_photo_url: string}}>}
 */
export const uploadProfilePhoto = async (file) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  // Create FormData to send file
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch(`${API_URL}/users/upload-photo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload photo');
  }

  return data;
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>}
 */
export const updateProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }

  return data;
};

/**
 * Get user profile
 * @returns {Promise<Object>}
 */
export const getUserProfile = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch profile');
  }

  return data;
};

/**
 * Change user password
 * @param {Object} passwordData - Object containing current_password and new_password
 * @returns {Promise<Object>}
 */
export const changePassword = async (passwordData) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/users/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(passwordData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to change password');
  }

  return data;
};

/**
 * Upload image to city chat
 * @param {string} cityId - City ID
 * @param {File} file - Image file to upload
 * @returns {Promise<{success: boolean, data: {url: string}}>}
 */
export const uploadCityChatImage = async (cityId, file) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/cities/${cityId}/chat/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload image');
  }

  return data;
};

/**
 * Upload image to private chat
 * @param {string} chatId - Private chat ID
 * @param {File} file - Image file to upload
 * @returns {Promise<{success: boolean, data: {url: string}}>}
 */
export const uploadPrivateChatImage = async (chatId, file) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/chats/${chatId}/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload image');
  }

  return data;
};
