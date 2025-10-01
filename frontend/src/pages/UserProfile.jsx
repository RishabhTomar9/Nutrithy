import React, { useCallback, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, User, RefreshCw } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import LoadingFallback from '../components/common/LoadingFallback';
import toast from 'react-hot-toast';

// Import enhanced modern components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import FavoriteRecipes from '../components/user/FavoriteRecipes';
import NutritionTracking from '../components/user/NutritionTracking';
import PersonalInfo from '../components/user/PersonalInfo';
import AccountSettings from '../components/user/AccountSettings';
import PreferencesPanel from '../components/user/PreferencesPanel';
import HealthDataDisplay from '../components/health/HealthDataDisplay';
import DevicePairingModal from '../components/health/DevicePairingModal';

// Modern UserProfile Component (unified with UserProfilePage)
export default function UserProfile({
  userData,
  loading: userDataLoading,
  error: userDataError,
}) {
  const {
    userId,
    profile,
    loading,
    error,
    editMode,
    saving,
    editForm,
    profileImagePreview,
    handleInputChange,
    handleImageChange,
    saveProfileChanges,
    setEditMode,
  } = useUserProfile(userData, userDataLoading, userDataError);

  // Initialize missing properties with default values or state
  const [favorites] = React.useState([]);
  const [userStats] = React.useState({
    totalRecipes: 0,
    favoriteCount: 0,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0
  });
  const [showAccountManagement, setShowAccountManagement] = React.useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = React.useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const [showDevicePairing, setShowDevicePairing] = useState(false);
  
  // Basic logout handler
  const handleLogout = React.useCallback(() => {
    // Add logout logic here if needed
    localStorage.removeItem('token');
    window.location.href = '/login';
  }, []);

  // Enhanced save function with toast notifications
  const handleSaveProfile = useCallback(async () => {
    try {
      await saveProfileChanges();
      toast.success('Profile updated successfully! ✨');
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    }
  }, [saveProfileChanges]);

  // Loading state with modern loader
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 relative">
        {/* Background Pattern */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-400/5 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-blue-400/5 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-purple-400/5 blur-3xl animate-pulse" />
        </div>
        
        <LoadingFallback 
          message="Loading your nutrition profile..." 
        />
      </div>
    );
  }

  // Error state with modern design
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="max-w-md w-full bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 text-center border border-gray-700/50 shadow-2xl"
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Profile Loading Error
          </h2>
          
          <p className="text-gray-300 mb-6 leading-relaxed">
            {error || 'Unable to load the profile. Please check your connection and try again.'}
          </p>
          
          <div className="space-y-3">
            <motion.button
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </motion.button>
            
            <motion.button
              onClick={() => window.history.back()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-200"
            >
              Go Back
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Profile not found state
  if (!profile) {
    return (
     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 flex items-center justify-center p-6">
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.7, ease: "easeOut" }}
    className="text-center max-w-md w-full"
  >
    {/* Icon */}
    <div className="w-28 h-28 bg-gray-800/70 backdrop-blur-2xl rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-700/50 shadow-2xl shadow-purple-500/20 animate-pulse">
      <User className="w-14 h-14 text-gray-300" />
    </div>

    {/* Heading */}
    <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
      Profile Not Found
    </h2>
    <p className="text-gray-400 text-lg mb-10 leading-relaxed px-2">
      The requested profile could not be found. It may have been removed or the user might have deactivated their account.
    </p>

    {/* Animated Illustration */}
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="w-40 h-40 mx-auto mb-10 bg-gray-800/40 border border-gray-700/40 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden"
    >
      <span className="text-gray-500 text-2xl animate-bounce">👤❌</span>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/10 to-transparent animate-spin-slow rounded-full" />
    </motion.div>

    {/* Button Row */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <motion.button
        onClick={() => window.history.back()}
        whileHover={{ scale: 1.07, backgroundColor: "rgba(75,85,99,0.6)" }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-3 bg-gray-800/70 backdrop-blur-xl hover:bg-gray-700/70 text-white rounded-2xl font-semibold transition-all duration-200 border border-gray-700/50 shadow-md"
      >
        Go Back
      </motion.button>

      <motion.a
        href="/"
        whileHover={{ scale: 1.07, backgroundColor: "rgba(139,92,246,0.2)" }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-3 bg-purple-600/80 hover:bg-purple-700 text-white rounded-2xl font-semibold transition-all duration-200 shadow-md"
      >
        Go Home
      </motion.a>
    </div>
  </motion.div>
</div>

    );
  }

  const isOwnProfile = !userId || profile?.uid === profile?.currentUserId;

  return (
    <div className="min-h-screen">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-400/5 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-blue-400/5 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-purple-400/5 blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="px-10 pt-8 w-full mx-auto flex flex-col gap-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="px-10 pt-8 w-full mx-auto flex flex-col gap-8 max-w-7xl"
        >
          {/* Modern Profile Header */}
          <Suspense fallback={<LoadingFallback message="Loading profile header..." minimal />}>
            <ProfileHeader
              profile={profile}
              editMode={editMode}
              setEditMode={setEditMode}
              editForm={editForm}
              handleInputChange={handleInputChange}
              profileImagePreview={profileImagePreview}
              handleImageChange={handleImageChange}
              saving={saving}
              saveProfileChanges={handleSaveProfile}
              isOwnProfile={isOwnProfile}
            />
          </Suspense>

          {/* Enhanced Profile Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Suspense fallback={<LoadingFallback message="Loading statistics..." minimal />}>
              <ProfileStats profile={profile} userStats={userStats} />
            </Suspense>
          </motion.div>

          {/* Health Metrics Section (Only for own profile) */}
          {isOwnProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 lg:mt-12"
            >
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-700/50">
                <HealthDataDisplay 
                  showConnectionButtons={true} 
                  onConnect={() => setShowDevicePairing(true)} 
                />
              </div>
            </motion.div>
          )}

          {/* Enhanced Components Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mt-8 lg:mt-12">
            <div className="space-y-6 lg:space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <FavoriteRecipes
                  favorites={favorites}
                  profile={profile}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <NutritionTracking profile={profile} />
              </motion.div>
            </div>
            
            <div className="space-y-6 lg:space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <PersonalInfo profile={profile} setEditMode={setEditMode} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <PreferencesPanel profile={profile} />
              </motion.div>
            </div>
          </div>

          {/* Account Settings */}
          {isOwnProfile && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="mt-8 lg:mt-12"
            >
              <AccountSettings
                showAccountManagement={showAccountManagement}
                setShowAccountManagement={setShowAccountManagement}
                editMode={editMode}
                setEditMode={setEditMode}
                editForm={editForm}
                handleSaveProfile={handleSaveProfile}
                saving={saving}
                showConfirmLogout={showConfirmLogout}
                setShowConfirmLogout={setShowConfirmLogout}
                handleLogout={handleLogout}
                showConfirmDelete={showConfirmDelete}
                setShowConfirmDelete={setShowConfirmDelete}
              />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Device Pairing Modal (Only for own profile) */}
      {isOwnProfile && (
        <DevicePairingModal 
          isVisible={showDevicePairing}
          onClose={() => setShowDevicePairing(false)}
          onSuccess={(deviceType) => {
            toast.success(`${deviceType === 'googlefit' ? 'Google Fit' : 'Smartwatch'} connected successfully! 🎉`);
            setShowDevicePairing(false);
          }}
        />
      )}
    </div>
  );
}
