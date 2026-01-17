import { createContext, useContext, useState, useEffect } from 'react';
import { registerUser, loginUser, logoutUser } from '../services/authService';
import { getUserProfile } from '../services/uploadService';

const AuthContext = createContext();

/**
 * AuthContext Provider
 * Manages user authentication state and operations
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/ed889ba1-73d9-4a1d-bf22-c8e51587df89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H1',location:'frontend/src/context/AuthContext.jsx:loadUser',message:'loadUser:start',data:{hasStoredToken:!!storedToken,hasStoredUser:!!storedUser},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsLoggedIn(true);
          
          // Fetch fresh user data from backend
          const response = await getUserProfile();
          if (response.success) {
            const updatedUser = response.data;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Error loading user:', error);
          // If token is invalid, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          setIsLoggedIn(false);

          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/ed889ba1-73d9-4a1d-bf22-c8e51587df89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H1',location:'frontend/src/context/AuthContext.jsx:loadUser',message:'loadUser:clearedAuthDueToError',data:{errorName:error?.name||'Error'},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        }
      }
      setLoading(false);

      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/ed889ba1-73d9-4a1d-bf22-c8e51587df89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H1',location:'frontend/src/context/AuthContext.jsx:loadUser',message:'loadUser:end',data:{isLoggedInAfter:!!(storedToken&&storedUser),loadingSetFalse:true},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    };

    loadUser();
  }, []);

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   */
  const signup = async (userData) => {
    try {
      const response = await registerUser(userData);
      
      if (response.success) {
        const { user: newUser, accessToken, refreshToken } = response.data;
        
        // Save tokens and user data
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        setToken(accessToken);
        setUser(newUser);
        setIsLoggedIn(true);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   */
  const login = async (credentials) => {
    try {
      const response = await loginUser(credentials);
      
      if (response.success) {
        const { user: loggedInUser, accessToken, refreshToken } = response.data;
        
        // Save tokens and user data
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        
        setToken(accessToken);
        setUser(loggedInUser);
        setIsLoggedIn(true);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear everything regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  /**
   * Update user data in state and localStorage
   * @param {Object} updatedUser - Updated user data
   */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  /**
   * Refresh user profile from backend
   */
  const refreshProfile = async () => {
    try {
      const response = await getUserProfile();
      if (response.success) {
        const updatedUser = response.data;
        updateUser(updatedUser);
        return updatedUser;
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoggedIn,
    loading,
    token,
    signup,
    login,
    logout,
    updateUser,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use AuthContext
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
