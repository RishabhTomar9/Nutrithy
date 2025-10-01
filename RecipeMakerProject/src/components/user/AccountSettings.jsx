import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Edit3 } from "lucide-react";

export default function AccountSettings({
  showAccountManagement,
  setShowAccountManagement,
  editMode,
  setEditMode,
  editForm,
  setEditForm,
  handleSaveProfile,
  saving,
  showConfirmLogout,
  handleLogout,
  showConfirmDelete,
  setShowConfirmLogout,
  setShowConfirmDelete,
}) {
  return (
    <div className="mt-auto">
      <motion.div
        className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-md"
      >
        <div className="flex items-center gap-2 text-white">
          <Settings size={20} /> <span className="font-medium">Account Settings</span>
        </div>
        <button
          onClick={() => setShowAccountManagement(!showAccountManagement)}
          className="text-green-400 font-semibold cursor-pointer"
        >
          {showAccountManagement ? "Close" : "Manage"}
        </button>
      </motion.div>
      <AnimatePresence>
        {showAccountManagement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden mt-4 p-6 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl flex flex-col gap-6"
          >
            <h2 className="text-xl font-semibold text-white/90 tracking-wide">Account Management</h2>
            <p className="text-white/70 text-sm">Manage your account settings and preferences below:</p>
            <button
              onClick={() => setEditMode((v) => !v)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-400 to-green-500 text-black font-semibold hover:from-green-500 hover:to-green-600 transition-all shadow-md text-base"
            >
              {editMode ? "Close Edit" : "Edit Profile"}
            </button>
            {editMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* Example editable fields, add more as needed */}
                <div>
                  <label className="block text-white text-sm font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                  />
                </div>
                {/* Add more fields as needed */}
                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setEditMode(false)}
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition shadow"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-400 to-green-500 text-black font-semibold hover:from-green-500 hover:to-green-600 disabled:opacity-50 transition shadow"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
            {/* Notifications Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg"
              transition={{ type: "spring", stiffness: 200 }}
            >
              <span className="text-base font-medium">Notifications</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={!!editForm.notificationsEnabled}
                  onChange={e => setEditForm(f => ({ ...f, notificationsEnabled: e.target.checked }))}
                />
                <span className="w-12 h-6 bg-gray-400 rounded-full shadow-inner relative transition-all">
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${editForm.notificationsEnabled ? "translate-x-6 bg-green-400" : ""}`}
                  ></span>
                </span>
              </label>
            </motion.div>
            {/* Privacy Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg"
              transition={{ type: "spring", stiffness: 200 }}
            >
              <span className="text-base font-medium">Privacy</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={editForm.privacy === "private"}
                  onChange={e => setEditForm(f => ({ ...f, privacy: e.target.checked ? "private" : "public" }))}
                />
                <span className="mr-3 text-sm font-medium text-gray-300">{editForm.privacy === "private" ? "Private" : "Public"}</span>
                <span className="w-12 h-6 bg-gray-400 rounded-full shadow-inner relative transition-all">
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${editForm.privacy === "private" ? "translate-x-6 bg-blue-400" : ""}`}
                  ></span>
                </span>
              </label>
            </motion.div>
            {/* Logout and Delete Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <motion.button
                onClick={() => setShowConfirmLogout(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold shadow-md hover:from-red-500 hover:to-red-600 hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
              <motion.button
                onClick={() => setShowConfirmDelete(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-md hover:from-red-600 hover:to-red-700 hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.95 }}
              >
                Delete Account
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
