import React from "react";
import { motion } from "framer-motion";
import { Edit3 } from "lucide-react";

export default function ProfileCard({ icon, label, value, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={`flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="text-green-400 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <div className="flex-1">
        <p className="text-white/70 text-sm">{label}</p>
        <p className="text-white font-semibold">{value || "-"}</p>
      </div>
      {onClick && (
        <div className="text-white/40 group-hover:text-white/80 transition-colors duration-300">
          <Edit3 size={16} />
        </div>
      )}
    </motion.div>
  );
}
