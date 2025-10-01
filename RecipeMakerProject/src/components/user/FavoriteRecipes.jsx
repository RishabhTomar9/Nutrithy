import React from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { MdFavorite } from "react-icons/md";
import { Share2, Clock, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FavoriteRecipes({ favorites = [], setFavorites, setRecentSearches, setShowShareModal, setSelectedRecipe, setShareUrl, profile }) {
  const navigate = useNavigate();
  
  // Ensure favorites is always an array
  const safeFavorites = Array.isArray(favorites) ? favorites : [];
  
  return (
    <motion.div>
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
        <Heart size={24} className="text-red-500" /> Favorite Recipes
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeFavorites.length > 0 ? (
          safeFavorites.map((recipe) => (
            <motion.div
              key={recipe._id}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-white/20 group hover:shadow-2xl hover:border-white/30 transition-all duration-300"
            >
              <div className="relative">
                <img
                  src={recipe.image || recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1760&q=80"}
                  alt={recipe.recipeTitle || recipe.title || "Recipe Image"}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1760&q=80";
                  }}
                />
                <div className="absolute top-0 right-0 p-2 flex gap-2">
                  {/* Share and Favorite buttons can be added here */}
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-white font-bold text-lg mb-2 line-clamp-1 group-hover:text-green-400 transition-colors">
                  {recipe.recipeTitle || recipe.title || recipe.query}
                </h4>
                {recipe.description && (
                  <p className="text-white/70 text-sm mb-3 line-clamp-2 group-hover:text-white/90 transition-colors">
                    {recipe.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  {recipe.tags && recipe.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80">
                      {tag}
                    </span>
                  ))}
                  {(!recipe.tags || recipe.tags.length === 0) && (
                    <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80">
                      {recipe.category || 'Recipe'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-white/60 text-xs">
                      <Clock size={14} className="text-green-400" />
                      <span>{recipe.cookTime || recipe.time || 'Unknown'}</span>
                    </div>
                    {recipe.difficulty && (
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        <Flame size={14} className="text-orange-400" />
                        <span>{recipe.difficulty}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/recipe/${recipe._id}`)}
                    className="px-3 py-1 bg-green-500/80 hover:bg-green-500 text-white text-sm font-medium rounded-full transition-colors flex items-center gap-1 group-hover:shadow-lg"
                  >
                    View <span className="hidden sm:inline">Recipe</span> →
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20">
            <div className="flex flex-col items-center gap-4">
              <Heart size={48} className="text-white/30" />
              <p className="text-white/60 text-lg">No favorite recipes yet.</p>
              <p className="text-white/40 text-sm max-w-md mx-auto">Start exploring recipes and mark your favorites to see them here!</p>
              <button
                onClick={() => navigate('/recipes')}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full font-medium hover:from-green-500 hover:to-green-600 transition-all shadow-lg"
              >
                Discover Recipes
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
