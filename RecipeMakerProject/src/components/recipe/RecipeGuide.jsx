import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import CookModeView from './CookModeView'
import TagAnimator from '../common/TagAnimator'
import ThreadBackground from '../common/ThreadBackground'
import ShareRecipeModal from '../modals/ShareRecipeModal'
import axiosInstance from '../../utils/axiosInstance'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { MdFavorite, MdFavoriteBorder, MdAccessTime, MdShare } from 'react-icons/md'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export default function RecipeGuide({ scrollRef }) {
  const [query, setQuery] = useState('')
  const [steps, setSteps] = useState(null)
  const [customName, setCustomName] = useState('')
  const [customSteps, setCustomSteps] = useState([''])
  const [alert, setAlert] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recipeDetails, setRecipeDetails] = useState({
    description: '',
    ingredients: [],
    cookTime: '',
    image: ''
  })
  const [recipeImage, setRecipeImage] = useState('')
  const [loadingImage, setLoadingImage] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [loadingRecentSearches, setLoadingRecentSearches] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState(null)

  useEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [scrollRef])

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Fetch recipes on component mount
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await axiosInstance.get('/api/recipes')
        // Do something with response.data
        console.log(response.data)
      } catch (error) {
        console.error('Error fetching recipes:', error)
      }
    }
    
    fetchRecipes()
  }, [])
  
  // Fetch recent searches when component mounts
  useEffect(() => {
    const initializeRecentSearches = async () => {
      try {
        await fetchRecentSearches()
      } catch (error) {
        console.error('Error initializing recent searches:', error)
      }
    }
    
    initializeRecentSearches()
  }, [])
  
  // Function to fetch recent searches - returns a promise for better async handling
  const fetchRecentSearches = async () => {
    try {
      setLoadingRecentSearches(true)
      const response = await axiosInstance.get('/api/users/searches/recent')
      const searches = response.data?.searches || []
      
      // Sort searches by date (newest first) for better UX
      searches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      setRecentSearches(searches)
      return searches
    } catch (error) {
      console.error('Failed to fetch recent searches', error)
      // Non-fatal if user not logged in
      return []
    } finally {
      setLoadingRecentSearches(false)
    }
  }
  const DEFAULT_RECIPE_IMAGE = '/vite.svg'  // Path relative to public folder

  // Function to fetch recipe image from Unsplash
  const fetchRecipeImage = async (searchTerm) => {
  setLoadingImage(true)
  try {
    const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_KEY
    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: { query: `${searchTerm} food`, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${unsplashAccessKey}` }
    })

    const imageUrl = response.data.results?.[0]?.urls?.regular || DEFAULT_RECIPE_IMAGE
    setRecipeImage(imageUrl)
    setRecipeDetails(prev => ({ ...prev, image: imageUrl }))
  } catch (error) {
    console.error('Error fetching recipe image:', error)
    setRecipeImage(DEFAULT_RECIPE_IMAGE)
    setRecipeDetails(prev => ({ ...prev, image: DEFAULT_RECIPE_IMAGE }))
  } finally {
    setLoadingImage(false)
  }
}


  const handleSearch = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setSteps(null)
    setAlert('')
    setRecipeDetails({ description: '', ingredients: [], cookTime: '' })
    
    // Scroll to loading indicator for better UX
    if (scrollRef?.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    const cleanText = (str) => str.replace(/[^\w\s.,:/()-]/g, '').trim()

    try {
      // ✅ Log query (ties to current user via token interceptor)
      try {
        await axiosInstance.post('/api/users/searches', { query })
        // Refresh recent searches after adding a new one
        await fetchRecentSearches()
      } catch (e) {
        console.error('Error logging search query:', e)
        // Non-fatal if user not logged in - continue with recipe generation
      }

      // ✅ Validate API key presence
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key is missing')
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

      const prompt = `You are a helpful recipe assistant. Provide detailed cooking instructions for the recipe: "${query}".
1. Begin with a detailed description of the dish max of 50 words.
2. List all required ingredients, with quantities.
3. Mention preparation time and total cook time.
4. Provide step-by-step instructions, clearly and concisely, numbered.
5. Mention any tips, substitutions, or variations if relevant.
6. Use clear, simple language for beginners.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      if (!text || text.length < 10) throw new Error('Empty or invalid response from Gemini.')

      // ✅ Parse description
      const descMatch = text.match(/^\s*([^\n]+)\n/i)
      const description = descMatch ? cleanText(descMatch[1]) : ''

      // ✅ Parse ingredients
      let ingredients = []
      const ingredientsMatch = text.match(/ingredients\s*:?\s*\n([\s\S]*?)(?:\n\s*\d+\.)/i)
      if (ingredientsMatch) {
        ingredients = ingredientsMatch[1]
          .split('\n')
          .map((line) => cleanText(line.replace(/^[-*•]/, '')))
          .filter((line) => line.length > 0)
      } else {
        // Fallback: try to find the "Ingredients" section by splitting
        const lines = text.split('\n')
        const startIdx = lines.findIndex((line) => /ingredients/i.test(line))
        if (startIdx !== -1) {
          let endIdx = lines.length
          for (let i = startIdx + 1; i < lines.length; i++) {
            if (/^\d+\.\s+/.test(lines[i])) { endIdx = i; break; }
          }
          ingredients = lines.slice(startIdx + 1, endIdx)
            .map((line) => cleanText(line.replace(/^[-*•]/, '')))
            .filter((line) => line.length > 0)
        }
      }

      if (ingredients.length > 0) {
        ingredients.pop()
      }

      // ✅ Parse cook time
      const timeMatch = text.match(/(?:prep|preparation|total|cook)\s*time\s*:?\s*([^\n]+)/i)
      const cookTime = timeMatch ? cleanText(timeMatch[1]) : ''

      // ✅ Parse steps
      const geminiSteps = text
        .split('\n')
        .filter((line) => /^\d+\.\s+/.test(line))
        .map((line) => ({
          text: cleanText(line.replace(/^\d+\.\s*/, '')),
          tags: [],
        }))

      setRecipeDetails({ description, ingredients, cookTime })

      if (geminiSteps.length > 0) {
        setSteps(geminiSteps)
        
        // Fetch a relevant image for the recipe
        await fetchRecipeImage(query)

        // ✅ Save to backend
        const stepsText = geminiSteps.map((s) => s.text)
        try {
          await axiosInstance.post('/api/recipes/ai', {
            title: query,
            description,
            ingredients,
            cookTime,
            steps: stepsText,
            image: recipeImage,
            createdAt: new Date().toISOString(),
          })
        } catch (e) {
          console.error('Error saving AI recipe:', e)
          // Non-fatal error, continue with the recipe display
        }

        // ✅ Enrich user search with detailed data (if logged in)
        try {
          await axiosInstance.post('/api/users/searches', {
            query,
            recipeTitle: query,
            description,
            ingredients,
            cookTime,
            steps: stepsText,
          })
        } catch (e) {
        console.log(e)
        }
      } else {
        setAlert('No detailed instructions found from Gemini.')
      }
    } catch (error) {
      console.error('❌ Error fetching recipe from Gemini:', error)
      
      // Provide more specific error messages based on error type
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        setAlert('API key is missing. Please check your configuration.')
      } else if (error.message?.includes('network')) {
        setAlert('Network error. Please check your internet connection and try again.')
      } else if (error.message?.includes('quota')) {
        setAlert('API quota exceeded. Please try again later.')
      } else {
        setAlert('Failed to fetch recipe. Please try again with different keywords.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // FIX: Function to handle removing a custom step
  const handleRemoveCustomStep = (index) => {
    // Prevent removing the last step
    if (customSteps.length === 1) return
    const newSteps = customSteps.filter((_, i) => i !== index)
    setCustomSteps(newSteps)
  }
  
  // Handle favorite toggle with real-time updates
  const toggleFavorite = async (searchId, isFavorite) => {
    try {
      if (isFavorite) {
        await axiosInstance.delete(`/api/users/searches/${searchId}/favorite`)
      } else {
        await axiosInstance.post(`/api/users/searches/${searchId}/favorite`)
      }
      
      // Update the local state immediately for responsive UI
      setRecentSearches(prev => 
        prev.map(search => 
          search._id === searchId ? { ...search, isFavorite: !isFavorite } : search
        )
      )
      
      // Refresh recent searches to ensure consistency with server
      fetchRecentSearches()
    } catch (error) {
      console.error('Failed to toggle favorite', error)
      setAlert('Failed to update favorite status. Please try again.')
    }
  }

  // FIX: Function to update a specific custom step
  const handleCustomStepChange = (e, index) => {
    const newSteps = [...customSteps]
    newSteps[index] = e.target.value
    setCustomSteps(newSteps)
  }

  const saveCustom = () => {
    const valid = customSteps.filter((s) => s.trim())
    if (!customName.trim() || valid.length === 0) {
      setAlert('Please enter a name and at least one step.')
      return
    }

    const saved = JSON.parse(localStorage.getItem('custom-recipes') || '{}')
    saved[customName] = valid.map((text) => ({ text, tags: [] }))
    localStorage.setItem('custom-recipes', JSON.stringify(saved))
    setAlert('Custom recipe saved!')
    setSteps(saved[customName])
  }

  return (
    <>
      <motion.div ref={scrollRef} className="w-full px-5">
        <motion.div className="lex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-green-400">
            AI Recipe Guide
          </h1>
          <p className="text-gray-300 mt-2">
            Your personal AI-powered cooking companion.
          </p>
          <motion.div className="mt-3">
            <TagAnimator tags={['🥦 vegan', '⏳ quick', '🌶️ spicy', '🔥 grilled', '🍰 dessert']} />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="relative flex-1 group"
            whileHover={{ boxShadow: '0 0 15px rgba(74, 222, 128, 0.2)' }}
            transition={{ duration: 0.3 }}
          >
            <motion.div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></motion.div>
            <motion.div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.div>
            <motion.input
              type="text"
              placeholder="Search any recipe with AI..."
              className="flex-1 w-full p-4 pl-10 rounded-lg border border-gray-600 bg-gray-800/90 text-white shadow-inner focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-300 backdrop-blur-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              whileFocus={{ boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.3)' }}
            />
            {query && (
              <motion.button 
                onClick={() => setQuery('')} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </motion.div>
          <motion.button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="px-5 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-green-500/20 transition-all duration-300 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isLoading ? (
              <>
                <motion.div 
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                ></motion.div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>Get Recipe with AI</span>
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  initial={{ x: -3 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </motion.svg>
              </>
            )}
          </motion.button>
        </motion.div>
        
        {/* Recent Searches Section */}
      {recentSearches.length > 0 && !steps && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 mt-4"
        >
          <motion.div className="mb-3 flex items-center">
            <h2 className="text-3xl text-white font-semibold flex items-center">
              <MdAccessTime  className="mr-2 text-3xl" />
              Recent Searches
            </h2>
          </motion.div>
          
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentSearches.map((search) => (
              <motion.div
                key={search._id}
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="h-full"
              >
                <motion.div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 h-full flex flex-col relative border border-gray-200 dark:border-gray-700">
                  {/* Image */}
                  <motion.div 
                    className="h-36 bg-cover bg-center relative"
                    style={{
                      backgroundImage: `url(${search.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'})`
                    }}
                  >
                    {/* Favorite Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-full w-9 h-9 flex items-center justify-center cursor-pointer shadow-md"
                      onClick={() => toggleFavorite(search._id, search.isFavorite)}
                    >
                      {search.isFavorite ? (
                        <MdFavorite size={22} className="text-red-500" />
                      ) : (
                        <MdFavoriteBorder size={22} className="text-gray-600 dark:text-gray-400" />
                      )}
                    </motion.button>
                  </motion.div>
                  
                  {/* Content */}
                  <motion.div className="p-4 flex-grow flex flex-col">
                    <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                      {search.query}
                    </h3>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {new Date(search.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="mt-auto self-start px-3 py-1.5 border border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                      onClick={() => {
                        setQuery(search.query);
                        handleSearch();
                      }}
                    >
                      Search Again
                    </motion.button>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
      
      {/* Loading indicator for recent searches */}
      {loadingRecentSearches && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center py-4"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-gray-200 border-t-green-500 rounded-full"
          />
        </motion.div>
      )}
      
      {/* Empty State for Recent Searches */}
      {!loadingRecentSearches && recentSearches.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center p-8 bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl mt-6"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-gray-400"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-gray-100 mb-2"
          >
            No Recent Searches
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-center"
          >
            Your recent searches will appear here.
          </motion.p>
        </motion.div>
      )}
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col justify-center items-center gap-4 py-10 bg-gradient-to-br from-[#161825]/50 via-[#1d1f31]/50 to-[#161825]/50 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-lg"
          >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full"
              ></motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                  <motion.p 
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-green-400 font-semibold"
                  >
                      Nutrithy is preparing your recipe
                  </motion.p>
                  <motion.p 
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-gray-400 mt-1"
                  >
                      This may take a few moments...
                  </motion.p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-2 flex gap-2"
              >
                  {['Analyzing ingredients', 'Calculating nutrition', 'Preparing steps'].map((text, i) => (
                      <motion.span 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + (i * 0.2), duration: 0.3 }}
                        className="px-3 py-1 bg-gray-800/70 text-gray-300 text-xs rounded-full"
                      >
                          {text}
                      </motion.span>
                  ))}
              </motion.div>
          </motion.div>
      )}

        {/* --- IMPROVED CUSTOM RECIPE FORM UI --- */}
        {!steps && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-[#161825] via-[#1d1f31] to-[#161825] border border-gray-700 p-6 rounded-xl space-y-6 shadow-xl backdrop-blur-sm relative overflow-hidden"
          >
            
            <motion.div className="relative">
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white text-center mb-1"
              >
                Add Your Own Recipe
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-center text-sm mb-4"
              >
                Create and save your personal recipes
              </motion.p>
              
              {/* Recipe Name Input with icon */}
              <motion.div className="relative mb-6">
                <motion.div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </motion.div>
                <input
                  type="text"
                  placeholder="Recipe Name"
                  className="w-full p-4 pl-10 rounded-lg bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition shadow-inner"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                />
              </motion.div>
              
              {/* Steps Section with numbered indicators */}
              <motion.div className="space-y-4">
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg font-semibold text-white flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Recipe Steps
                </motion.h3>
                
                {customSteps.map((step, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-3 group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                  >
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm"
                    >
                      {i + 1}
                    </motion.div>
                    <motion.div className="relative flex-grow">
                      <textarea
                        placeholder={`Describe step ${i + 1}`}
                        className="w-full p-3 rounded-lg bg-gray-800/80 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-10 resize-none"
                        value={step}
                        onChange={(e) => handleCustomStepChange(e, i)}
                        rows={Math.max(1, Math.min(3, step.split('\n').length))}
                      />
                      {customSteps.length > 1 && (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveCustomStep(i)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Step"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      )}
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Action Buttons with Framer Motion */}
              <motion.div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCustomSteps([...customSteps, ''])}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-md hover:shadow-blue-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Step
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveCustom}
                  disabled={!customName.trim() || !customSteps.some(step => step.trim())}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-green-500/20 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed"
                >
                  Save Recipe
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {steps && (
          <motion.div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-xl bg-black/20 backdrop-blur-md p-6 border border-slate-700/50 shadow-xl"
            > 
              {recipeImage && (
           <motion.div className="relative w-full h-48 sm:h-64 mb-6 overflow-hidden rounded-lg">
                {loadingImage ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
                    <div className="w-8 h-8 border-3 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <img 
                    src={recipeImage || DEFAULT_RECIPE_IMAGE} 
                    alt={query} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                )}
              </motion.div>
              )}
                      <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">{query}</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCurrentRecipe({
                      id: `recipe-${Date.now()}`,
                      title: query,
                      description: recipeDetails.description,
                      image: recipeImage,
                      cookTime: recipeDetails.cookTime,
                      ingredients: recipeDetails.ingredients,
                      steps: steps.map(step => step.text),
                      sourceUrl: window.location.href
                    });
                    setShowShareModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-green-500/20 transition-all"
                >
                  <MdShare /> Share to Community
                </motion.button>
              </div>
              <CookModeView
                steps={steps}
                description={recipeDetails.description}
                ingredients={recipeDetails.ingredients}
                cookTime={recipeDetails.cookTime}
              />
            </motion.div>
              <motion.button
                onClick={() => setSteps(null)}
                className="flex items-center gap-3 px-5 py-2 rounded-full font-semibold text-green-400 text-sm md:text-base shadow-lg backdrop-blur-sm bg-green-900/20 border border-green-400/30 transition-all duration-300 focus:outline-none"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: 'rgba(16,185,129,0.2)',
                  color: '#10B981',
                  boxShadow: '0 8px 20px rgba(16,185,129,0.4)',
                }}
                whileTap={{ scale: 0.97, boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <span className="text-lg md:text-xl animate-pulse">←</span>
                Back to search
              </motion.button>
          </motion.div>
        )}

        {/* Share Recipe Modal */}
        <AnimatePresence>
          {showShareModal && currentRecipe && (
            <ShareRecipeModal
              recipe={currentRecipe}
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              onShare={(newPost) => {
                // Here we would typically add the post to the community feed
                // For now, just show a success message
                setShowShareModal(false);
                setAlert('Recipe shared to community successfully!');
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!!alert && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full"
            >
              <motion.div 
                className={`px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border flex items-center justify-between
                  ${alert?.includes('Failed') || alert?.includes('error') || alert?.includes('missing')
                    ? 'bg-red-500/15 border-red-500/30 text-red-50'
                    : alert?.includes('saved')
                      ? 'bg-green-500/15 border-green-500/30 text-green-50'
                      : 'bg-gray-800/80 border-gray-700/60 text-gray-100'}
                `}
                role="alert"
              >
                <span className="font-semibold text-center flex-grow">{alert}</span>
                <button 
                  onClick={() => setAlert('')}
                  className="ml-3 flex-shrink-0 text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        

      </motion.div>
    </>
  )
}