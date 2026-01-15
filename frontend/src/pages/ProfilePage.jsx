import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Profile Page Component
 * User profile with travel background and tabs
 */
function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has profile photo
  const hasProfilePhoto = !!profilePhoto;
  
  // Cloudinary configuration - Replace with your actual credentials
  const CLOUDINARY_CLOUD_NAME = 'your_cloud_name'; // Replace with your Cloudinary cloud name
  const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset'; // Replace with your upload preset
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleViewPhoto = () => {
    if (profilePhoto) {
      // Open photo in new tab
      window.open(profilePhoto, '_blank');
    }
    setIsPhotoMenuOpen(false);
  };

  const handleEditPhoto = () => {
    // Trigger file input click
    fileInputRef.current?.click();
    setIsPhotoMenuOpen(false);
  };

  const handleSetPhoto = () => {
    // Trigger file input click
    fileInputRef.current?.click();
    setIsPhotoMenuOpen(false);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
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
      const imageUrl = await uploadToCloudinary(file);
      setProfilePhoto(imageUrl);
      
      // TODO: Save imageUrl to user profile in your backend/database
      console.log('Photo uploaded successfully:', imageUrl);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      setUploadError('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Mock user data - extend with API data later
  const userProfile = {
    name: user?.name || 'Traveler',
    email: user?.email || 'user@email.com',
    mobile: '+91 98765 43210',
    location: 'Mumbai, India',
    bio: 'Travel enthusiast exploring India one city at a time ✈️',
    memberSince: 'January 2026',
    communities: [
      { id: 1, name: 'Mumbai Explorers', members: 2500, image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400' },
      { id: 2, name: 'Delhi Food Tours', members: 1800, image: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=400' },
    ],
    groups: [
      { id: 1, name: 'Weekend Travelers', members: 12 },
    ],
  };

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
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
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
                <div className="absolute top-full left-0 mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
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
              <h1 className="text-4xl font-bold text-white mb-2">{userProfile.name}</h1>
              <p className="text-white/90 text-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                {userProfile.email}
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
              onClick={() => setActiveTab('communities')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'communities'
                  ? 'border-[#4169e1] text-[#4169e1]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Communities
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'groups'
                  ? 'border-[#4169e1] text-[#4169e1]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Groups
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
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-[#4169e1] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Personal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Name</label>
                  <p className="text-gray-900 mt-1">{userProfile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="text-gray-900 mt-1">{userProfile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Mobile</label>
                  <p className="text-gray-900 mt-1">{userProfile.mobile}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Location</label>
                  <p className="text-gray-900 mt-1">{userProfile.location}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-[#4169e1] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                About
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Bio</label>
                  <p className="text-gray-900 mt-1">{userProfile.bio}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Member Since</label>
                  <p className="text-gray-900 mt-1">{userProfile.memberSince}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProfile.communities.map((community) => (
              <div key={community.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <img src={community.image} alt={community.name} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{community.name}</h3>
                  <p className="text-sm text-gray-600">{community.members.toLocaleString()} members</p>
                  <button className="mt-4 w-full bg-[#4169e1] text-white py-2 rounded-lg font-semibold hover:bg-[#4169e1]/90 transition-colors">
                    Visit Community
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProfile.groups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-600">{group.members} members</p>
                  </div>
                </div>
                <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                  Manage Group
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Account Settings</h3>
                
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-red-50 transition-colors border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Delete Account</p>
                        <p className="text-sm text-gray-500">Permanently delete your account</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

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
    </div>
  );
}

export default ProfilePage;
