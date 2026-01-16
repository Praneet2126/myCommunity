const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>}
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to register');
  }

  return data;
};

/**
 * Login user
 * @param {Object} credentials - Login credentials (email, password)
 * @returns {Promise<Object>}
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to login');
  }

  return data;
};

/**
 * Logout user
 * @returns {Promise<Object>}
 */
export const logoutUser = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { success: true };
  }

  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to logout');
  }

  return data;
};
