// src/components/user/profilePage/Recipes.jsx

import { Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Recipes({ profile, currentUser, userId }) {
  return (
    <div className="mt-12 p-6 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
        <Award className="text-[#FF742C]" size={24} /> Shared Recipes
      </h2>
      {((!userId && currentUser?.recipes?.length > 0) ||
        (userId && profile?.recipes?.length > 0)) ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(userId
            ? profile?.recipes || []
            : currentUser?.recipes || []
          ).map((recipe) => (
            <motion.li
              key={recipe._id}
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-5 rounded-xl bg-white/10 border border-white/10 shadow-md hover:shadow-xl transition overflow-hidden group"
            >
              {recipe.image && (
                <div className="h-40 -mx-5 -mt-5 mb-4 overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <h3 className="font-bold text-lg text-[#FF742C]">
                {recipe.title}
              </h3>
              {recipe.description && (
                <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                  {recipe.description}
                </p>
              )}
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {new Date(recipe.createdAt).toLocaleDateString()}
                </span>
                <button className="text-xs bg-[#FF742C]/20 text-[#FF742C] px-3 py-1 rounded-full hover:bg-[#FF742C]/30 transition-colors">
                  View Recipe
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10">
          <Award size={48} className="text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No recipes shared yet.</p>
        </div>
      )}
    </div>
  );
}
