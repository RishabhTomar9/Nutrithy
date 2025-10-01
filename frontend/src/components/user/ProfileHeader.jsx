import React from "react";
import { motion } from "framer-motion";
import UserProfilePage from "../../pages/UserProfilePage";

export default function ProfileHeader({ user, profile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6"
    >
      {/* User info section with avatar and details */}
      <div className="flex flex-col sm:flex-row items-center gap-6 w-full p-6 bg-black/50 rounded-xl shadow-2xl relative overflow-hidden">
        {/* Decorative floating blur shapes */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="w-full mt-6 sm:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <UserProfilePage user={user} profile={profile} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
