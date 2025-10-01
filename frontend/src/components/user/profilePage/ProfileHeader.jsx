// src/components/user/profilePage/ProfileHeader.jsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Save, X, User, MoreVertical } from "lucide-react";
import gsap from "gsap";

export default function ProfileHeader({
  editMode,
  saving,
  profile,
  userId,
  profileImagePreview,
  handleImageChange,
  editForm,
  handleInputChange,
  setEditMode,
  initializeEditForm,
  saveProfileChanges,
}) {
  const containerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="relative flex flex-col sm:flex-row items-center gap-6 
                 bg-white/5 p-6 rounded-2xl backdrop-blur-xl 
                 border border-white/10 shadow-2xl"
    >
      {/* More menu (3 dots) */}
      {!userId && !editMode && (
        <div className="absolute top-4 right-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 rounded-full bg-[#FF742C]/20 text-[#FF742C] 
                       hover:bg-[#FF742C]/30 transition"
          >
            <MoreVertical size={20} />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 
                           bg-black/80 backdrop-blur-xl border border-white/10 
                           rounded-xl shadow-xl overflow-hidden z-50"
              >
                <div className="px-4 py-2 text-xs uppercase tracking-wide text-gray-400 bg-black/60 border-b border-white/10">
                  Profile Actions
                </div>

                <button
                  onClick={() => {
                    setEditMode(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-200 
                             hover:bg-[#FF742C]/20 hover:text-white transition"
                >
                  <Edit size={16} className="text-[#FF742C]" />
                  Edit Profile
                </button>

                <button
                  onClick={() => {
                    alert('Logout clicked'); // replace later
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-200 
                             hover:bg-red-500/20 hover:text-red-400 transition"
                >
                  <X size={16} className="text-red-400" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Profile image */}
      <div className="relative group">
        <motion.img
          whileHover={{ scale: 1.05 }}
          src={
            profileImagePreview ||
            profile?.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              profile?.displayName || "User"
            )}&background=FF742C&color=fff`
          }
          alt="Profile"
          className="w-28 h-28 rounded-full border-4 border-[#FF742C] object-cover shadow-lg"
        />

        {editMode && (
          <label
            htmlFor="profile-image-upload"
            className="absolute inset-0 flex items-center justify-center 
                       bg-black/50 rounded-full opacity-0 group-hover:opacity-100 
                       transition-opacity cursor-pointer"
          >
            <Edit size={24} className="text-white" />
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        )}
        <div className="absolute -bottom-2 -right-2 bg-[#FF742C] text-white p-1.5 rounded-full shadow-md">
          <User size={18} />
        </div>
      </div>

      {/* User Info */}
      <div className="flex-1 text-center sm:text-left">
        {editMode ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleInputChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white 
                           focus:outline-none focus:ring-1 focus:ring-[#FF742C]"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Bio</label>
              <textarea
                name="bio"
                value={editForm.bio}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white 
                           resize-none focus:outline-none focus:ring-1 focus:ring-[#FF742C]"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {profile?.displayName || "User"}
            </h1>
            <p className="text-gray-300 text-sm sm:text-base">
              {profile?.email}
            </p>
            {(profile?.bio) && (
              <p className="mt-3 text-gray-300 italic bg-black/20 p-3 rounded-lg border-l-2 border-[#FF742C]">
                "{profile.bio}"
              </p>
            )}
          </>
        )}

        {/* Action Buttons (Save / Cancel) */}
        {editMode && (
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveProfileChanges}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full 
                         bg-gradient-to-r from-[#FF742C] to-orange-500 text-white font-semibold 
                         shadow-lg hover:shadow-orange-500/30 transition-all 
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditMode(false);
                initializeEditForm(profile);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full 
                         bg-gray-700/60 text-white font-medium 
                         hover:bg-gray-600 transition-all"
            >
              <X size={18} />
              Cancel
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
