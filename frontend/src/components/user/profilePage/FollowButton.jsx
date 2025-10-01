// src/components/user/profilePage/FollowButton.jsx
import { motion } from "framer-motion";
import { User } from "lucide-react";

export default function FollowButton({ userId, currentUserId }) {
  if (userId && userId !== currentUserId) {
    return (
      <div className="mt-8 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-xl bg-[#FF742C] text-white font-semibold hover:bg-[#e35e12] shadow-md flex items-center gap-2"
        >
          <User size={18} />
          Follow
        </motion.button>
      </div>
    );
  }
  return null;
}
