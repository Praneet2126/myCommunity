import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadProfilePhoto, updateProfile, changePassword } from '../services/uploadService';

/**
 * Profile Page Component
 * User profile with travel background and tabs
 */
function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    phone: ''
  });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPhotoViewOpen, setIsPhotoViewOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);
  const { user, logout, updateUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Initialize profile form data when user changes
  useEffect(() => {
    if (user) {
      setProfileFormData({
        full_name: user.full_name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);
  
  // Check if user has profile photo
  const hasProfilePhoto = user?.profile_photo_url && user.profile_photo_url !== 'https://via.placeholder.com/150';
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleViewPhoto = () => {
    if (hasProfilePhoto) {
      setIsPhotoViewOpen(true);
    }
    setIsPhotoMenuOpen(false);
  };

  const handleEditPhoto = () => {
    fileInputRef.current?.click();
    setIsPhotoMenuOpen(false);
  };

  const handleSetPhoto = () => {
    fileInputRef.current?.click();
    setIsPhotoMenuOpen(false);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const response = await uploadProfilePhoto(file);
      
      if (response.success) {
        // Refresh user profile to get updated photo
        await refreshProfile();
      }
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      setUploadError(error.message || 'Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const response = await updateProfile(profileFormData);
      
      if (response.success) {
        setUpdateSuccess('Profile updated successfully!');
        setIsEditingProfile(false);
        // Refresh user profile
        await refreshProfile();
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateSuccess(''), 3000);
      }
    } catch (error) {
      setUpdateError(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileFormData({
      full_name: user?.full_name || '',
      phone: user?.phone || ''
    });
    setUpdateError('');
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords
    if (!passwordFormData.current_password || !passwordFormData.new_password || !passwordFormData.confirm_password) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordFormData.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await changePassword({
        current_password: passwordFormData.current_password,
        new_password: passwordFormData.new_password
      });

      if (response.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordFormData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setPasswordSuccess('');
        }, 2000);
      }
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangePasswordOpen(false);
    setPasswordFormData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  // State for private chats/groups
  const [privateChats, setPrivateChats] = useState([]);

  // Redirect if not logged in
  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Travel Background */}
      <div className="relative h-80">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=95&auto=format&fit=crop)',
            imageRendering: 'crisp-edges',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#4169e1]/70 via-[#4169e1]/50 to-transparent"></div>
        </div>

        {/* Profile Info */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8">
          <div className="flex items-center space-x-6">
            {/* Profile Photo */}
            <div className="relative">
              <div 
                className="relative group cursor-pointer"
                onClick={() => setIsPhotoMenuOpen(!isPhotoMenuOpen)}
              >
                <div className="w-40 h-40 bg-[#4169E1] rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                  {hasProfilePhoto ? (
                    <img 
                      src={user.profile_photo_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
          </div>
                
                {/* Edit Overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                      <span className="text-white text-sm font-semibold">Uploading...</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-white mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span className="text-white text-sm font-semibold">Edit Photo</span>
          </div>
        )}
                </div>
                
                {/* Online Status */}
                <div className="absolute bottom-3 right-3 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload Error */}
              {uploadError && (
                <div className="absolute top-full left-0 mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm z-50">
                  {uploadError}
                </div>
              )}

              {/* Photo Options Menu */}
              {isPhotoMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsPhotoMenuOpen(false)}
                  ></div>
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                    {hasProfilePhoto ? (
                      <>
                        <button
                          onClick={handleViewPhoto}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#4169e1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">View Photo</p>
                            <p className="text-xs text-gray-500">See full size</p>
                          </div>
                        </button>
                        <button
                          onClick={handleEditPhoto}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Edit Photo</p>
                            <p className="text-xs text-gray-500">Change picture</p>
                          </div>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleSetPhoto}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Set Profile Photo</p>
                          <p className="text-xs text-gray-500">Upload a picture</p>
                        </div>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Name and Email */}
            <div className="pb-4">
              <h1 className="text-4xl font-bold text-white mb-2">{user.full_name}</h1>
              <p className="text-white/90 text-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-[#4169e1] text-[#4169e1]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'groups'
                  ? 'border-[#4169e1] text-[#4169e1]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Groups
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-[#4169e1] text-[#4169e1]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-[#4169e1] rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Personal Information
                </h3>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-[#4169e1] hover:text-[#4169e1]/80 font-semibold text-sm"
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Success Message */}
              {updateSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{updateSuccess}</p>
                </div>
              )}

              {/* Error Message */}
              {updateError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{updateError}</p>
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                    <label className="text-sm font-semibold text-gray-600">Full Name</label>
                  <input
                    type="text"
                      name="full_name"
                      value={profileFormData.full_name}
                      onChange={handleProfileFormChange}
                      className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169e1]/30 focus:border-[#4169e1]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileFormData.phone}
                      onChange={handleProfileFormChange}
                      className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169e1]/30 focus:border-[#4169e1]"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#4169e1] text-white py-2 rounded-lg font-semibold hover:bg-[#4169e1]/90 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Name</label>
                    <p className="text-gray-900 mt-1">{user.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Username</label>
                    <p className="text-gray-900 mt-1">{user.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Email</label>
                    <p className="text-gray-900 mt-1">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Phone</label>
                    <p className="text-gray-900 mt-1">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
              )}
                </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-[#4169e1] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Account Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Member Since</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(user.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Account Status</label>
                  <p className="text-gray-900 mt-1 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Active
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Role</label>
                  <p className="text-gray-900 mt-1 capitalize">{user.role || 'User'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div>
            {privateChats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {privateChats.map((group) => (
                  <div key={group.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                    {/* City Badge */}
                    {group.cityName && (
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-white text-sm font-semibold">{group.cityName}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{group.name}</h3>
                          <p className="text-sm text-gray-600">{group.members || 0} members</p>
                        </div>
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                      )}
                      <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Open Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Private Groups Yet</h3>
                <p className="text-gray-500">Create a private chat group from any city page to connect with other travelers</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Account Settings</h3>
                
                <div className="space-y-2">
                  {/* Change Password Button */}
                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-blue-50 transition-colors border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Change Password</p>
                        <p className="text-sm text-gray-500">Update your password</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-red-50 transition-colors border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Logout</p>
                        <p className="text-sm text-gray-500">Sign out of your account</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-[#4169e1] px-8 py-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Change Password</h2>
                <button
                  onClick={handleCancelPasswordChange}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 text-sm mt-2">Update your account password</p>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePassword} className="p-8">
              {/* Error Message */}
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-800 text-sm">{passwordError}</p>
                </div>
              )}

              {/* Success Message */}
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-800 text-sm">{passwordSuccess}</p>
                </div>
              )}

              {/* Current Password */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="current_password"
                    value={passwordFormData.current_password}
                    onChange={handlePasswordFormChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="new_password"
                    value={passwordFormData.new_password}
                    onChange={handlePasswordFormChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              {/* Confirm New Password */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm_password"
                    value={passwordFormData.confirm_password}
                    onChange={handlePasswordFormChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-6 py-3 bg-[#4169e1] text-white rounded-lg font-semibold hover:bg-[#4169e1]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo View Modal - Circular Display */}
      {isPhotoViewOpen && hasProfilePhoto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          {/* Photo Display in Circular Form */}
          <div className="relative">
            <div className="w-96 h-96 rounded-full overflow-hidden shadow-2xl border-8 border-white">
              <img
                src={user.profile_photo_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Close Button - Royal Blue X on Top Right */}
            <button
              onClick={() => setIsPhotoViewOpen(false)}
              className="absolute -top-4 -right-4 w-12 h-12 bg-[#4169E1] hover:bg-[#4169E1]/90 rounded-full flex items-center justify-center transition-all shadow-lg group"
              aria-label="Close photo view"
            >
              <svg 
                className="w-6 h-6 text-white group-hover:scale-110 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Transparent Click Area to Close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setIsPhotoViewOpen(false)}
          />
      </div>
      )}
    </div>
  );
}

export default ProfilePage;
