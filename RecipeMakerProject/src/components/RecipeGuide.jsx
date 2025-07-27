import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import CookModeView from './CookModeView'
import { Snackbar, Alert } from '@mui/material'
import TagAnimator from './TagAnimator'
import ThreadBackground from './ThreadBackground'

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
  })

  useEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [scrollRef])

  // Example fetch in RecipeGuide.jsx
  useEffect(() => {
    fetch('/api/recipes')
      .then((res) => res.json())
      .then((data) => {
        // Do something with data
        console.log(data)
      })
  }, [])

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setSteps(null)
    setAlert('')
    setRecipeDetails({ description: '', ingredients: [], cookTime: '' })

    const cleanText = (str) => str.replace(/[^\w\s.,:/()-]/g, '').trim()

    try {
      // ✅ Log query
      await fetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, timestamp: new Date().toISOString() }),
      })

      // ✅ Validate API key presence
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key is missing')
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

      const prompt = `You are a helpful recipe assistant. Provide detailed cooking instructions for the recipe: "${query}".
1. Begin with a short description of the dish.
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

        // ✅ Save to backend
        await fetch('/api/recipes/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: query,
            description,
            ingredients,
            cookTime,
            steps: geminiSteps.map((s) => s.text),
            createdAt: new Date().toISOString(),
          }),
        })
      } else {
        setAlert('No detailed instructions found from Gemini.')
      }
    } catch (error) {
      console.error('❌ Error fetching recipe from Gemini:', error)
      setAlert('Failed to fetch recipe. Please try again.')
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
      <ThreadBackground />
      <div ref={scrollRef} className="w-full lg:px-20 lg:py-10 px-5 py-5 space-y-6">
        <div className="mt-12 sm:mt-24 flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-green-400">
            AI Recipe Guide
          </h1>
          <p className="text-gray-300 mt-2">
            Your personal AI-powered cooking companion.
          </p>
          <div className="mt-3">
            <TagAnimator tags={['🥦 vegan', '⏳ quick', '🌶️ spicy', '🔥 grilled', '🍰 dessert']} />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search any recipe with AI..."
            className="flex-1 p-3 rounded border border-gray-600 bg-gray-800 text-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching Recipe...' : 'Get Recipe with AI'}
          </button>
        </div>
        
        {isLoading && (
            <div className="flex justify-center items-center gap-4 py-10">
                <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xl text-green-400 font-semibold">
                    Nutrithy - loading your recipe...
                </p>
            </div>
        )}

        {/* --- IMPROVED CUSTOM RECIPE FORM UI --- */}
        {!steps && !isLoading && (
          <div className="bg-gradient-to-br from-[#161825] via-[#1d1f31] to-[#161825] border border-gray-700 p-6 rounded-xl space-y-4">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Add Your Own Recipe</h2>
            
            {/* Recipe Name Input */}
            <input
              type="text"
              placeholder="Recipe Name"
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
            />
            
            {/* Steps Section */}
            <div className="space-y-3">
              {customSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Step ${i + 1}`}
                    className="flex-grow p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    value={step}
                    onChange={(e) => handleCustomStepChange(e, i)}
                  />
                  {customSteps.length > 1 && (
                    <button 
                      onClick={() => handleRemoveCustomStep(i)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-700 transition-colors"
                      title="Remove Step"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
              <button
                onClick={() => setCustomSteps([...customSteps, ''])}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Step
              </button>
              <button
                onClick={saveCustom}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition"
              >
                Save Recipe
              </button>
            </div>
          </div>
        )}

        {steps && (
          <div className="space-y-4">
            <CookModeView
              steps={steps}
              description={recipeDetails.description}
              ingredients={recipeDetails.ingredients}
              cookTime={recipeDetails.cookTime}
            />
            <button
              onClick={() => setSteps(null)}
              className="text-green-400 hover:text-red-400 text-sm mt-2"
            >
              ← Back to search
            </button>
          </div>
        )}

        <Snackbar
          open={!!alert}
          autoHideDuration={3000}
          onClose={() => setAlert('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          TransitionProps={{ onEnter: (node) => node.classList.add('fade-in') }}
        >
          <Alert
            onClose={() => setAlert('')}
            severity="info"
            icon={false}
            sx={{
              width: '100%',
              fontWeight: '600',
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              color: '#f1f5f9',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              borderRadius: '12px',
              textAlign: 'center',
              px: 3,
              py: 1.5,
            }}
          >
            {alert}
          </Alert>
        </Snackbar>
      </div>
    </>
  )
}